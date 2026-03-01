// functions/index.js (mínimo)
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

const MP_ACCESS_TOKEN = defineSecret('MP_ACCESS_TOKEN');
const MP_API = 'https://api.mercadopago.com';

// Planes (ajustá montos si cambian)
const PLANS = {
  free:    { amount: 0,     reason: 'FREE',               freq: 0, freqType: null },
  starter: { amount: 10000, reason: 'Membresía Starter',  freq: 1, freqType: 'months' },
  pro:     { amount: 30000, reason: 'Membresía Pro',      freq: 1, freqType: 'months' },
};

// Crear/activar suscripción o FREE
exports.mpCreatePreapproval = onRequest({ region: 'us-central1', secrets: [MP_ACCESS_TOKEN] }, async (req, res) => {
  try {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    const { planId, iglesiaUid } = req.body || {};
    if (!iglesiaUid || !PLANS[planId]) return res.status(400).json({ error: 'Datos inválidos' });

    if (planId === 'free') {
      await db.doc(`iglesias/${iglesiaUid}`).set({
        subscription: {
          provider: 'none',
          status: 'active',
          priceIdOrPlanId: 'free',
          customerRef: null,
          currentPeriodEnd: null,
          updatedAt: admin.firestore.Timestamp.now(),
        },
      }, { merge: true });
      return res.json({ ok: true });
    }

    // Starter / Pro (preapproval)
    const plan = PLANS[planId];
    const r = await fetch(`${MP_API}/preapproval`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN.value()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reason: plan.reason,
        external_reference: `${iglesiaUid}|${planId}`,
        auto_recurring: { frequency: plan.freq, frequency_type: plan.freqType, transaction_amount: plan.amount, currency_id: 'ARS' },
        back_url: 'https://miiglesia.online/dashboard.html', // Ajustá si tu URL es otra
      })
    });
    const data = await r.json();
    if (!r.ok) return res.status(400).json({ error: data?.message || 'Error al crear preapproval', details: data });
    return res.json({ init_point: data.init_point, sandbox_init_point: data.sandbox_init_point, id: data.id });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Error interno' });
  }
});

// Webhook mínimo para sincronizar estado de suscripciones
exports.mpWebhookSubscriptions = onRequest({ region: 'us-central1', secrets: [MP_ACCESS_TOKEN] }, async (req, res) => {
  try {
    const preapprovalId = req.body?.data?.id || req.body?.id || null;
    await db.collection('mp_webhook_logs').add({ scope: 'subscriptions', body: req.body, createdAt: admin.firestore.Timestamp.now() });

    if (preapprovalId) {
      const r = await fetch(`${MP_API}/preapproval/${preapprovalId}`, { headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN.value()}` } });
      const pre = await r.json();
      const ref = pre?.external_reference || '';
      const [iglesiaUid, planId] = ref.split('|');

      if (iglesiaUid) {
        const status = pre.status === 'authorized' ? 'active'
          : (pre.status === 'paused' || pre.status === 'pending') ? 'past_due'
          : (pre.status === 'cancelled') ? 'canceled'
          : 'incomplete';

        await db.doc(`iglesias/${iglesiaUid}`).set({
          subscription: {
            provider: 'mercado_pago',
            status,
            priceIdOrPlanId: planId || null,
            customerRef: pre.id || null,
            updatedAt: admin.firestore.Timestamp.now(),
          },
        }, { merge: true });
      }
    }
    return res.sendStatus(200);
  } catch (e) {
    console.error(e);
    return res.sendStatus(500);
  }
});
