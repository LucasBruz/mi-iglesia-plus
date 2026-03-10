// ==============================================
//  Cloud Functions para Mi Iglesia+
//  Incluye:
//    - Publicidad (Starter/Pro con límite)
//    - Admin Panel (Aprobación iglesias, ads, preonboarding, asignar planes)
//    - Mercado Pago (pago único + suscripciones mensuales + webhooks)
//  Admin autorizado: miiglesia.on@gmail.com
// ==============================================

const { onCall, HttpsError, onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// =============================
// 🔐 ADMINS DEL SISTEMA
// =============================
const ADMINS = ["miiglesia.on@gmail.com"];

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

const PLANS = ["starter", "pro"];
const ACTIVE_STATUSES = ["draft", "approved"];

// ─── MERCADO PAGO CONFIG ──────────────────────────────────────────────────────
// ⚠️ No hardcodees secretos. Usá Secrets de Firebase Functions.
//   firebase functions:secrets:set MP_ACCESS_TOKEN
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
if (!MP_ACCESS_TOKEN) {
  console.warn("MP_ACCESS_TOKEN no configurado. Definí el secreto con: firebase functions:secrets:set MP_ACCESS_TOKEN");
}

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
    throw new HttpsError("permission-denied", "Solo Starter/Pro ACTIVO pueden crear anuncios.");
  }

  if (plan === "starter") {
    const q = await db.collection("ads")
      .where("iglesiaUid", "==", uid)
      .where("status", "in", ACTIVE_STATUSES)
      .limit(1).get();
    if (!q.empty)
      throw new HttpsError("failed-precondition", "Tu plan STARTER solo permite 1 anuncio activo.");
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
//  Trigger automático para asegurar límite Starter
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
      await adRef.update({ status: "archived", quotaViolation: true, note: "iglesia inexistente", updatedAt: nowTs() });
      return;
    }

    const sub = igSnap.data().subscription || {};
    const plan = norm(sub.priceIdOrPlanId);
    const stat = norm(sub.status);

    if (!PLANS.includes(plan) || stat !== "active") {
      await adRef.update({ status: "archived", quotaViolation: true, note: "plan inactivo/no válido", updatedAt: nowTs() });
      return;
    }

    if (plan === "starter") {
      const qs = await db.collection("ads")
        .where("iglesiaUid", "==", uid)
        .where("status", "in", ACTIVE_STATUSES)
        .get();
      if (qs.size > 1) {
        await adRef.update({ status: "archived", quotaViolation: true, note: "starter-limit", updatedAt: nowTs() });
      }
    }
  } catch (e) {
    console.error("enforceAdQuota error:", e);
  }
});

// ========================================================
//                 PANEL ADMINISTRADOR
// ========================================================

exports.adminPing = onCall({ region: "us-central1" }, (req) => {
  assertAdmin(req);
  return { ok: true };
});

exports.adminApproveChurch = onCall({ region: "us-central1" }, async (req) => {
  assertAdmin(req);
  const { iglesiaUid, action, reason } = req.data;
  const act = norm(action);
  if (!iglesiaUid || !["activa", "rechazada"].includes(act))
    throw new HttpsError("invalid-argument", "Datos inválidos.");

  const patch = { estado: act, updatedAt: nowTs() };
  if (act === "rechazada") patch.rejectedReason = reason || null;
  else patch.approvedAt = nowTs();

  await db.doc(`iglesias/${iglesiaUid}`).set(patch, { merge: true });
  return { ok: true };
});

exports.adminSetPreonboardingPaid = onCall({ region: "us-central1" }, async (req) => {
  assertAdmin(req);
  const { iglesiaUid, paid, rejected } = req.data;
  if (!iglesiaUid || typeof paid !== "boolean")
    throw new HttpsError("invalid-argument", "Datos inválidos.");

  const patch = { paid, updatedAt: nowTs() };
  if (rejected) patch.rejected = true;
  await db.doc(`preonboarding/${iglesiaUid}`).set(patch, { merge: true });
  return { ok: true };
});

exports.adminSetAdStatus = onCall({ region: "us-central1" }, async (req) => {
  assertAdmin(req);
  const { adId, status } = req.data;
  const st = norm(status);
  if (!adId || !["approved", "archived", "draft"].includes(st))
    throw new HttpsError("invalid-argument", "Estado inválido.");
  await db.doc(`ads/${adId}`).update({ status: st, updatedAt: nowTs() });
  return { ok: true };
});

exports.adminSetSubscription = onCall({ region: "us-central1" }, async (req) => {
  assertAdmin(req);
  const { iglesiaUid, planId, status } = req.data;
  const p = norm(planId);
  const s = norm(status);

  if (!iglesiaUid || !["free", "starter", "pro"].includes(p) ||
      !["active", "past_due", "canceled", "incomplete"].includes(s)) {
    throw new HttpsError("invalid-argument", "Datos inválidos.");
  }

  await db.doc(`iglesias/${iglesiaUid}`).set({
    subscription: {
      provider: p === "free" ? "none" : "mercado_pago",
      priceIdOrPlanId: p,
      status: s,
      updatedAt: nowTs(),
    }
  }, { merge: true });

  return { ok: true };
});

// ========================================================
//  MERCADO PAGO - Pago único $50.000
// ========================================================

exports.createMpPreference = onRequest(
  { region: "us-central1", cors: ["https://www.miiglesia.online", "https://miiglesia.online"] },
  async (req, res) => {
    if (req.method === "OPTIONS") { res.status(204).send(""); return; }
    if (req.method !== "POST") { res.status(405).send("Method Not Allowed"); return; }

    const { uid, email } = req.body;
    if (!uid || !email) { res.status(400).json({ error: "uid y email requeridos" }); return; }

    try {
      const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${MP_ACCESS_TOKEN}`
        },
        body: JSON.stringify({
          items: [{
            id: "activacion-miiglesia",
            title: "Activación Mi Iglesia+",
            quantity: 1,
            unit_price: 50000,
            currency_id: "ARS"
          }],
          payer: { email },
          external_reference: uid,
          back_urls: {
            success: "https://www.miiglesia.online/pago-ok.html",
            failure: "https://www.miiglesia.online/pago-error.html",
            pending: "https://www.miiglesia.online/pago-pendiente.html"
          },
          auto_return: "approved",
          notification_url: "https://us-central1-miiglesia-plus.cloudfunctions.net/mpWebhook"
        })
      });

      const data = await response.json();
      if (!data.id) throw new Error(JSON.stringify(data));
      res.json({ preferenceId: data.id });
    } catch (e) {
      console.error("createMpPreference error:", e);
      res.status(500).json({ error: e.message });
    }
  }
);

// ========================================================
//  MERCADO PAGO - Webhook pago único
// ========================================================

exports.mpWebhook = onRequest(
  { region: "us-central1", cors: true },
  async (req, res) => {
    // --- Compatibilidad IPN (GET) -------------------------------------------
    // IPN envía GET con ?topic=payment&id=123...; Webhooks usan POST con JSON.
    // Si llega un GET válido, lo "traducimos" a tu payload POST actual.
    if (req.method === "GET") {
      const topic = (req.query?.topic || req.query?.type || "").toString();
      const id = (req.query?.id || req.query?.["data.id"] || "").toString();
      if (topic === "payment" && id) {
        req.body = { type: "payment", data: { id } };
        req.method = "POST";
      } else {
        res.status(200).send("ok");
        return;
      }
    }

    // --- Flujo original (Webhooks POST) -------------------------------------
    if (req.method !== "POST") { res.status(200).send("ok"); return; }

    const { type, data } = req.body;

    try {
      await db.collection("mp_webhook_logs").add({
        scope: type || "unknown",
        body: req.body,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      if (type === "payment") {
        const paymentId = data?.id;
        if (!paymentId) { res.status(200).send("ok"); return; }

        const payResp = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: { "Authorization": `Bearer ${MP_ACCESS_TOKEN}` }
        });
        const payment = await payResp.json();

        const status = payment.status;
        const uid    = payment.external_reference;

        if (uid) {
          await db.doc(`preonboarding/${uid}`).set({
            paid: status === "approved",
            method: "mercadopago",
            mpPaymentId: String(paymentId),
            mpStatus: status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });

          if (status === "approved") {
            await db.doc(`iglesias/${uid}`).set({
              estado: "activa",
              activadoEn: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
          }
        }
      }
      res.status(200).send("ok");
    } catch (e) {
      console.error("mpWebhook error:", e);
      res.status(200).send("ok");
    }
  }
);

// ========================================================
//  MERCADO PAGO - Crear suscripción mensual (preapproval)
// ========================================================

exports.createMpSubscription = onRequest(
  { region: "us-central1", cors: ["https://www.miiglesia.online", "https://miiglesia.online"] },
  async (req, res) => {
    if (req.method === "OPTIONS") { res.status(204).send(""); return; }
    if (req.method !== "POST") { res.status(405).send("Method Not Allowed"); return; }

    const { uid, email, plan } = req.body;
    if (!uid || !email || !plan) { res.status(400).json({ error: "uid, email y plan requeridos" }); return; }

    const precios = { starter: 10000, pro: 30000 };
    const precio  = precios[plan.toLowerCase()];
    if (!precio) { res.status(400).json({ error: "plan inválido" }); return; }

    try {
      const response = await fetch("https://api.mercadopago.com/preapproval", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${MP_ACCESS_TOKEN}`
        },
        body: JSON.stringify({
          reason: `Mi Iglesia+ Plan ${plan.charAt(0).toUpperCase() + plan.slice(1)}`,
          auto_recurring: {
            frequency: 1,
            frequency_type: "months",
            transaction_amount: precio,
            currency_id: "ARS"
          },
          payer_email: email,
          external_reference: `${uid}|${plan}`,
          back_url: "https://www.miiglesia.online/pago-ok.html",
          notification_url: "https://us-central1-miiglesia-plus.cloudfunctions.net/mpSubscriptionWebhook"
        })
      });

      const data = await response.json();
      if (data.init_point) {
        res.json({ initPoint: data.init_point, subscriptionId: data.id });
      } else {
        throw new Error(JSON.stringify(data));
      }
    } catch (e) {
      console.error("createMpSubscription error:", e);
      res.status(500).json({ error: e.message });
    }
  }
);

// ========================================================
//  MERCADO PAGO - Webhook suscripciones
// ========================================================

exports.mpSubscriptionWebhook = onRequest(
  { region: "us-central1", cors: true },
  async (req, res) => {
    if (req.method !== "POST") { res.status(200).send("ok"); return; }

    try {
      const { type, data } = req.body;

      await db.collection("mp_webhook_logs").add({
        scope: `subscription_${type || "unknown"}`,
        body: req.body,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      if (type === "subscription_preapproval") {
        const subId = data?.id;
        if (!subId) { res.status(200).send("ok"); return; }

        const subResp = await fetch(`https://api.mercadopago.com/preapproval/${subId}`, {
          headers: { "Authorization": `Bearer ${MP_ACCESS_TOKEN}` }
        });
        const sub = await subResp.json();

        const [uid, plan] = (sub.external_reference || "|").split("|");
        if (!uid) { res.status(200).send("ok"); return; }

        const status = sub.status;

        await db.doc(`iglesias/${uid}`).set({
          subscription: {
            priceIdOrPlanId: plan || "starter",
            status: status === "authorized" ? "active" : status,
            subscriptionId: subId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          }
        }, { merge: true });
      }
      res.status(200).send("ok");
    } catch (e) {
      console.error("mpSubscriptionWebhook error:", e);
      res.status(200).send("ok");
    }
  }
);
