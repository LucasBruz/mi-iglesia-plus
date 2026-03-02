// ==============================================
//  Cloud Functions para Mi Iglesia+
//  Incluye:
//    - Publicidad (Starter/Pro con límite)
//    - Admin Panel (Aprobación iglesias, ads, preonboarding, asignar planes)
//  Admin autorizado: miiglesia.on@gmail.com
// ==============================================

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// =============================
// 🔐 ADMINES DEL SISTEMA
// =============================
const ADMINS = [
  "miiglesia.on@gmail.com"   // <--- TU CORREO ADMIN PRINCIPAL
];

// Helpers
function norm(v) { return String(v || "").toLowerCase(); }
function nowTs() { return admin.firestore.Timestamp.now(); }
function assertAdmin(req) {
  const email = (req.auth?.token?.email || "").toLowerCase();
  const isClaim = req.auth?.token?.admin === true;
  const isWhiteList = ADMINS.includes(email);
  if (!req.auth || (!isClaim && !isWhiteList)) {
    throw new HttpsError("permission-denied", "No sos administrador");
  }
}

// Planes válidos para publicidad
const PLANS = ["starter", "pro"];
const ACTIVE_STATUSES = ["draft", "approved"];

// ========================================================
//  PUBLICIDAD - Creación con límite Starter (1 anuncio)
// ========================================================

exports.createAd = onCall({ region: "us-central1" }, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Necesitás iniciar sesión.");

  const { title, href, imageUrl } = req.data || {};
  if (!title) throw new HttpsError("invalid-argument", "Falta el título.");

  const igSnap = await db.doc(`iglesias/${uid}`).get();
  if (!igSnap.exists)
    throw new HttpsError("failed-precondition", "Tu iglesia no existe.");

  const sub = igSnap.data().subscription || {};
  const plan = norm(sub.priceIdOrPlanId);
  const stat = norm(sub.status);

  if (!PLANS.includes(plan) || stat !== "active") {
    throw new HttpsError(
      "permission-denied",
      "Solo Starter/Pro ACTIVO pueden crear anuncios."
    );
  }

  // LÍMITE STARTER (1 activo)
  if (plan === "starter") {
    const q = await db
      .collection("ads")
      .where("iglesiaUid", "==", uid)
      .where("status", "in", ACTIVE_STATUSES)
      .limit(1)
      .get();

    if (!q.empty) {
      throw new HttpsError(
        "failed-precondition",
        "Tu plan STARTER solo permite 1 anuncio activo."
      );
    }
  }

  const payload = {
    iglesiaUid: uid,
    title: title.trim(),
    href: href || null,
    imageUrl: imageUrl || null,
    status: "draft",
    createdAt: nowTs(),
    updatedAt: nowTs(),
  };

  const ref = await db.collection("ads").add(payload);
  return { ok: true, id: ref.id };
});

// ====================================================================
//  Trigger automático para asegurar límite Starter (seguridad extra)
// ====================================================================

exports.enforceAdQuota = onDocumentCreated("ads/{adId}", async (event) => {
  const snap = event.data;
  if (!snap) return;

  const ad = snap.data();
  const adRef = snap.ref;

  try {
    const uid = ad.iglesiaUid;
    if (!uid) return;

    const igSnap = await db.doc(`iglesias/${uid}`).get();
    if (!igSnap.exists) {
      await adRef.update({
        status: "archived",
        quotaViolation: true,
        note: "iglesia inexistente",
        updatedAt: nowTs(),
      });
      return;
    }

    const sub = igSnap.data().subscription || {};
    const plan = norm(sub.priceIdOrPlanId);
    const stat = norm(sub.status);

    if (!PLANS.includes(plan) || stat !== "active") {
      await adRef.update({
        status: "archived",
        quotaViolation: true,
        note: "plan inactivo/no válido",
        updatedAt: nowTs(),
      });
      return;
    }

    // Starter → aseguramos máximo 1
    if (plan === "starter") {
      const qs = await db
        .collection("ads")
        .where("iglesiaUid", "==", uid)
        .where("status", "in", ACTIVE_STATUSES)
        .get();

      if (qs.size > 1) {
        await adRef.update({
          status: "archived",
          quotaViolation: true,
          note: "starter-limit",
          updatedAt: nowTs(),
        });
      }
    }
  } catch (e) {
    console.error("enforceAdQuota error:", e);
  }
});

// ========================================================
//                 PANEL ADMINISTRADOR
// ========================================================

// Ping para saber si el usuario es admin
exports.adminPing = onCall({ region: "us-central1" }, (req) => {
  assertAdmin(req);
  return { ok: true };
});

// Aprobar o rechazar iglesia
exports.adminApproveChurch = onCall({ region: "us-central1" }, async (req) => {
  assertAdmin(req);

  const { iglesiaUid, action, reason } = req.data;
  const act = norm(action);

  if (!iglesiaUid || !["activa", "rechazada"].includes(act)) {
    throw new HttpsError("invalid-argument", "Datos inválidos.");
  }

  const ref = db.doc(`iglesias/${iglesiaUid}`);
  const patch = {
    estado: act,
    updatedAt: nowTs(),
  };

  if (act === "rechazada") {
    patch.rejectedReason = reason || null;
  } else {
    patch.approvedAt = nowTs();
  }

  await ref.set(patch, { merge: true });
  return { ok: true };
});

// Marcar preonboarding pagado/rechazado
exports.adminSetPreonboardingPaid = onCall(
  { region: "us-central1" },
  async (req) => {
    assertAdmin(req);

    const { iglesiaUid, paid, rejected } = req.data;
    if (!iglesiaUid || typeof paid !== "boolean")
      throw new HttpsError("invalid-argument", "Datos inválidos.");

    const ref = db.doc(`preonboarding/${iglesiaUid}`);
    const patch = {
      paid,
      updatedAt: nowTs(),
    };

    if (rejected) patch.rejected = true;

    await ref.set(patch, { merge: true });
    return { ok: true };
  }
);

// Cambiar estado de publicidad
exports.adminSetAdStatus = onCall({ region: "us-central1" }, async (req) => {
  assertAdmin(req);

  const { adId, status } = req.data;
  const st = norm(status);

  if (!adId || !["approved", "archived", "draft"].includes(st))
    throw new HttpsError("invalid-argument", "Estado inválido.");

  const ref = db.doc(`ads/${adId}`);
  await ref.update({ status: st, updatedAt: nowTs() });

  return { ok: true };
});

// Asignar plan manualmente
exports.adminSetSubscription = onCall(
  { region: "us-central1" },
  async (req) => {
    assertAdmin(req);

    const { iglesiaUid, planId, status } = req.data;
    const p = norm(planId);
    const s = norm(status);

    if (
      !iglesiaUid ||
      !["free", "starter", "pro"].includes(p) ||
      !["active", "past_due", "canceled", "incomplete"].includes(s)
    ) {
      throw new HttpsError("invalid-argument", "Datos inválidos.");
    }

    const ref = db.doc(`iglesias/${iglesiaUid}`);

    await ref.set(
      {
        subscription: {
          provider: p === "free" ? "none" : "mercado_pago",
          priceIdOrPlanId: p,
          status: s,
          updatedAt: nowTs(),
        },
      },
      { merge: true }
    );

    return { ok: true };
  }
);
