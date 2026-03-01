// functions/index.js
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

/* ------------------ Utilidades ------------------ */
function norm(v) { return String(v || '').toLowerCase(); }
function nowTs() { return admin.firestore.Timestamp.now(); }

const ALLOWED_STATUSES_FOR_COUNT = ['draft','approved']; // cuenta para cupo
const PLANS = ['starter','pro'];

/* -----------------------------------------------------------
   CALLABLE: createAd
   - Requiere auth
   - Verifica plan activo (starter/pro)
   - Aplica tope de 1 para starter
   - Crea el anuncio como 'draft'
----------------------------------------------------------- */
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
  const okPlan = PLANS.includes(plan);
  const okActive = (stat === 'active');

  if (!okActive || !okPlan) {
    throw new HttpsError('permission-denied',
      'Tu plan no habilita publicidades activas (se requiere plan Starter o Pro con suscripción activa).');
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
        'Tu plan Starter permite 1 publicidad. Eliminá/archivá la anterior o pasate a Pro.');
    }
  }

  // 3) Crear anuncio (status: draft)
  const payload = {
    iglesiaUid: uid,
    title: String(title).trim().slice(0, 120),
    href: href ? String(href).trim() : null,
    imageUrl: imageUrl ? String(imageUrl).trim() : null,
    status: 'draft',                     // draft | approved | archived
    createdAt: nowTs(),
    updatedAt: nowTs()
  };

  const ref = await db.collection('ads').add(payload);
  return { id: ref.id, ok: true };
});

/* -----------------------------------------------------------
   TRIGGER: enforceAdQuota (seguridad extra post-create)
   - Si plan inválido o inactivo → archiva el anuncio
   - Si starter excede 1 → archiva el anuncio recién creado
----------------------------------------------------------- */
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

    const sub = igSnap.data()?.subscription || {};
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
