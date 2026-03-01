// functions/index.js
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

const MP_ACCESS_TOKEN = defineSecret('MP_ACCESS_TOKEN');
const MP_API = "https://api.mercadopago.com";

const PLANS = {
  free:    { amount: 0,     reason: "FREE",              freq: 0, freqType: null },
  starter: { amount: 10000, reason: "Membresía Starter", freq: 1, freqType: "months" },
  pro:     { amount: 30000, reason: "Membresía Pro",     freq: 1, freqType: "months" }
};

exports.mpCreatePreapproval = onRequest(
  { region: "us-central1", secrets: [MP_ACCESS_TOKEN] },
  async (req, res) => {
    try {
      if (req.method !== "POST") return res.status(405).send("POST required");

      const { planId, iglesiaUid } = req.body || {};
      if (!planId || !iglesiaUid) return res.status(400).json({ error: "Missing data" });

      const plan = PLANS[planId];
      if (!plan) return res.status(400).json({ error: "Invalid planId" });

      // FREE → activar directo
      if (planId === "free") {
        await db.doc(`iglesias/${iglesiaUid}`).set({
          subscription: {
            provider: "none",
            status: "active",
            priceIdOrPlanId: "free",
            updatedAt: admin.firestore.Timestamp.now()
          }
        }, { merge: true });

        return res.json({ ok: true });
      }

      // Mercado Pago - Suscripción
      const r = await fetch(`${MP_API}/preapproval`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${MP_ACCESS_TOKEN.value()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          reason: plan.reason,
          external_reference: `${iglesiaUid}|${planId}`,
          auto_recurring: {
            frequency: plan.freq,
            frequency_type: plan.freqType,
            transaction_amount: plan.amount,
            currency_id: "ARS"
          },
          back_url: "https://miiglesia.online/dashboard.html"
        })
      });

      const data = await r.json();
      if (!r.ok) return res.status(400).json({ error: data });

      return res.json(data);

    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Internal error" });
    }
  }
);
