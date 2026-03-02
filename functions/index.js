// functions/index.js
// Node 18 (asegurate en functions/package.json: { "engines": { "node": "18" } })

/* Firebase Functions v2 */
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');

/* Admin SDK */
const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

/* ============================================================
   CONFIG GENERAL
   ============================================================ */

/** ⚠️ WHITELIST de emails admin (cambiá por el tuyo) */
const ADMINS = [
  'miiglesia.on@gmail.com', // <-- REEMPLAZAR por tu email admin
];

/** Normaliza string */
function norm(v) { return String(v || '').toLowerCase(); }

/** Timestamp actual */
function nowTs() { return admin.firestore.Timestamp.now(); }

/** Planes válidos para anuncios */
const PLANS = ['starter', 'pro'];

/** Estados de anuncio que cuentan como "activos" (para cupo de Starter) */
const ALLOWED_STATUSES_FOR_COUNT = ['draft', 'approved'];

/** Verifica que la invocación sea de un usuario administrador */
function assertAdmin(req) {
  // onCall v2 → req.auth?.token?.email y claims
  const email = (req.auth?.token?.email || '').toLowerCase();
  const isClaim = req.auth?.token?.admin === true;
  const isWL = email && ADMINS.includes(email);
  if (!req.auth || (!isClaim && !isWL)) {
    throw new HttpsError('permission-denied', 'No sos administrador');
  }
}

/* ============================================================
   PUBLICIDAD (CREATE + ENFORCE QUOTA)
   ============================================================ */

/**
 * Callable: createAd
 * - Requiere auth
 * - Verifica suscripción activa (starter/pro)
 * - Starter: 1 anuncio "activo" (draft/approved)
 * - Crea anuncio en estado 'draft'
 */
exports.createAd = onCall({ region: 'us-central1' }, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Iniciá sesión para crear publicidades.');

  const { title, href, imageUrl } = req.data || {};
  if (!title || typeof title !== 'string' || !title.trim()) {
    throw new HttpsError('invalid-argument', 'Falta el título del anuncio.');
  }

  // 1) Traer iglesia + suscripción
  const igSnap = await db.doc(`iglesias/${uid}`).get();
  if (!igSnap.exists) {
    throw new HttpsError('failed-precondition', 'No se encontró tu iglesia. Registrate primero.');
  }
  const data = igSnap.data() || {};
  const sub  = data.subscription || {};
  const plan = norm(sub.priceIdOrPlanId);
  const stat = norm(sub.status);

  const okPlan   = PLANS.includes(plan);
  const okActive = (stat === 'active');

  if (!okActive || !okPlan) {
    throw new HttpsError('permission-denied',
      'Tu plan no habilita publicidades activas (se requiere Starter o Pro con suscripción activa).');
  }

  // 2) Límite para Starter (máximo 1 entre 'draft' y 'approved')
  if (plan === 'starter') {
    const q = db.collection('ads')
      .where('iglesiaUid', '==', uid)
      .where('status', 'in', ALLOWED_STATUSES_FOR_COUNT)
      .limit(1);
    const exists = await q.get();
    if (!exists.empty) {
      throw new HttpsError('failed-precondition',
        'Tu plan Starter permite 1 publicidad activa. Archivá la anterior o pasate a Pro.');
    }
  }

  // 3) Crear anuncio (status: draft)
  const payload = {
    iglesiaUid: uid,
    title: String(title).trim().slice(0, 120),
    href: href ? String(href).trim() : null,
    imageUrl: imageUrl ? String(imageUrl).trim() : null,
    status: 'draft', // draft | approved | archived
    createdAt: nowTs(),
    updatedAt: nowTs()
  };

  const ref = await db.collection('ads').add(payload);
  return { id: ref.id, ok: true };
});

/**
 * Trigger Firestore: enforceAdQuota
 * - Se ejecuta al crear ads/{adId}
 * - Si plan inválido/inactivo → archiva
 * - Si Starter excede 1 activo → archiva el recién creado
 */
exports.enforceAdQuota = onDocumentCreated('ads/{adId}', async (event) => {
  const snap = event.data;
  if (!snap) return;
  const ad = snap.data();
  const adRef = snap.ref;

  try {
    const uid = ad?.iglesiaUid;
    if (!uid) return;

    const igSnap = await db.doc(`iglesias/${uid}`).get();
    if (!igSnap.exists) {
      await adRef.update({ status: 'archived', quotaViolation: true, note: 'iglesia inexistente', updatedAt: nowTs() });
      return;
    }

    const sub  = igSnap.data()?.subscription || {};
    const plan = norm(sub.priceIdOrPlanId);
    const stat = norm(sub.status);

    if (!PLANS.includes(plan) || stat !== 'active') {
      await adRef.update({ status: 'archived', quotaViolation: true, note: 'plan inactivo/no válido', updatedAt: nowTs() });
      return;
    }

    if (plan === 'starter') {
      const qs = await db.collection('ads')
        .where('iglesiaUid', '==', uid)
        .where('status', 'in', ALLOWED_STATUSES_FOR_COUNT)
        .get();

      if (qs.size > 1) {
        await adRef.update({ status: 'archived', quotaViolation: true, note: 'starter-limit', updatedAt: nowTs() });
      }
    }
  } catch (e) {
    console.error('enforceAdQuota error:', e);
  }
});

/* ============================================================
   ADMIN (CALLABLES para Panel Admin)
   - Requieren admin por custom claim o whitelist de emails
   ============================================================ */

/** Ping para verificar permisos admin */
exports.adminPing = onCall({ region: 'us-central1' }, async (req) => {
  assertAdmin(req);
  return { ok: true };
});

/**
 * Aprobar/Rechazar iglesia
 * - action: 'activa' | 'rechazada'
 * - reason (opcional si rechazás)
 */
exports.adminApproveChurch = onCall({ region: 'us-central1' }, async (req) => {
  assertAdmin(req);
  const { iglesiaUid, action, reason } = req.data || {};
  const act = String(action || '').toLowerCase();

  if (!iglesiaUid || !['activa', 'rechazada'].includes(act)) {
    throw new HttpsError('invalid-argument', 'Datos inválidos');
  }

  const ref = db.doc(`iglesias/${iglesiaUid}`);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'Iglesia no encontrada');

  const patch = {
    estado: act,
    updatedAt: nowTs(),
  };

  if (act === 'rechazada') {
    patch.rejectedReason = reason || null;
  } else {
    patch.approvedAt = nowTs();
  }

  await ref.set(patch, { merge: true });
  return { ok: true };
});

/**
 * Marcar preonboarding como pagado/rechazado
 * - { iglesiaUid, paid: boolean, rejected?: boolean }
 */
exports.adminSetPreonboardingPaid = onCall({ region: 'us-central1' }, async (req) => {
  assertAdmin(req);
  const { iglesiaUid, paid, rejected } = req.data || {};
  if (!iglesiaUid || typeof paid !== 'boolean') {
    throw new HttpsError('invalid-argument', 'Datos inválidos');
  }

  const ref = db.doc(`preonboarding/${iglesiaUid}`);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'Preonboarding no encontrado');

  const patch = {
    paid: !!paid,
    updatedAt: nowTs(),
  };
  if (rejected) patch.rejected = true;

  await ref.set(patch, { merge: true });
  return { ok: true };
});

/**
 * Cambiar estado de un anuncio
 * - status: 'approved' | 'archived' | 'draft'
 */
exports.adminSetAdStatus = onCall({ region: 'us-central1' }, async (req) => {
  assertAdmin(req);
  const { adId, status } = req.data || {};
  const st = String(status || '').toLowerCase();
  const allowed = ['approved', 'archived', 'draft'];
  if (!adId || !allowed.includes(st)) throw new HttpsError('invalid-argument', 'Datos inválidos');

  const ref = db.doc(`ads/${adId}`);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'Anuncio no encontrado');

  await ref.update({ status: st, updatedAt: nowTs() });
  return { ok: true };
});

/**
 * Asignar plan manualmente a una iglesia
 * - planId: 'free' | 'starter' | 'pro'
 * - status: 'active' | 'past_due' | 'canceled' | 'incomplete'
 */
exports.adminSetSubscription = onCall({ region: 'us-central1' }, async (req) => {
  assertAdmin(req);
  const { iglesiaUid, planId, status } = req.data || {};
  const p = String(planId || '').toLowerCase();
  const s = String(status || '').toLowerCase();

  const okPlan   = ['free', 'starter', 'pro'].includes(p);
  const okStatus = ['active', 'past_due', 'canceled', 'incomplete'].includes(s);
  if (!iglesiaUid || !okPlan || !okStatus) throw new HttpsError('invalid-argument', 'Datos inválidos');

  const ref = db.doc(`iglesias/${iglesiaUid}`);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'Iglesia no encontrada');

  const patch = {
    subscription: {
      provider: p === 'free' ? 'none' : 'mercado_pago',
      priceIdOrPlanId: p,
      status: s,
      updatedAt: nowTs()
    }
  };

  await ref.set(patch, { merge: true });
  return { ok: true };
});
