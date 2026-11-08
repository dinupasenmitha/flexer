// ============================================================
// FLEXER EYEWEAR — Koko Payment Integration & Boundary
// ============================================================

const express = require('express');
const router = express.Router();
const crypto = require('node:crypto');
const { db } = require('../db');
const { requireAdmin } = require('../auth');

// The previous provider payload/signature code is unverified. Fail closed until
// the merchant-supplied specification and sandbox transactions are implemented.
// In particular, never accept payment callbacks through the legacy handler.
router.use((_req, res) => res.status(503).json({
  error: 'Koko is awaiting approved merchant integration. Choose Bank Transfer or Cash on Delivery.'
}));

/**
 * Helper to check if production Koko credentials are configured
 */
function getKokoConfig() {
  const getVal = k => db.prepare('SELECT value FROM settings WHERE key = ?').get(k)?.value || '';
  return {
    enabled: getVal('koko_enabled') === '1',
    mode: getVal('koko_mode') || 'manual_request', // 'manual_request' | 'direct_api'
    merchantId: getVal('koko_merchant_id'),
    apiKey: getVal('koko_api_key'),
    webhookSecret: getVal('koko_webhook_secret')
  };
}

/**
 * POST /api/koko/initiate
 * Initiates Koko payment workflow for an existing saved order
 */
router.post('/initiate', (req, res) => {
  try {
    const { order_ref } = req.body;
    if (!order_ref) return res.status(400).json({ error: 'Order reference is required' });

    const order = db.prepare('SELECT * FROM orders WHERE order_ref = ?').get(order_ref);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const config = getKokoConfig();

    // If direct API is not configured (real merchant credentials pending)
    if (config.mode === 'manual_request' || !config.apiKey || config.merchantId === 'PENDING_MERCHANT_CREDENTIALS') {
      return res.json({
        status: 'manual_pending',
        is_direct: false,
        order_ref: order.order_ref,
        amount: order.total_payable,
        message: 'Your order is recorded! FLEXER customer support will review your order and send your official Koko 3-installment payment link via WhatsApp / SMS.',
        instructions: [
          'Order is securely saved in FLEXER database.',
          'FLEXER administrator initiates the Koko request in the merchant portal.',
          'Customer receives the official Koko payment link directly on their mobile number.',
          'Order will be dispatched as soon as the first installment is verified.'
        ],
        required_setup: {
          merchant_id_status: config.merchantId === 'PENDING_MERCHANT_CREDENTIALS' ? 'Awaiting FLEXER Merchant Onboarding' : 'Configured',
          provider_documentation: 'https://kokopay.lk/merchant-guide'
        }
      });
    }

    // Direct API flow (when credentials are active)
    // Build real provider payload
    const callbackUrl = `${req.protocol}://${req.get('host')}/api/koko/webhook`;
    const payload = {
      merchant_id: config.merchantId,
      order_id: order.order_ref,
      amount: order.total_payable,
      currency: 'LKR',
      customer_name: order.customer_name,
      customer_mobile: order.phone,
      callback_url: callbackUrl
    };

    // Calculate signature if webhook secret configured
    let signature = '';
    if (config.webhookSecret) {
      signature = crypto.createHmac('sha256', config.webhookSecret).update(JSON.stringify(payload)).digest('hex');
    }

    res.json({
      status: 'initiated',
      is_direct: true,
      order_ref: order.order_ref,
      payment_url: `https://gateway.kokopay.lk/checkout?order=${order.order_ref}&signature=${signature}`
    });
  } catch (err) {
    console.error('Koko initiation error:', err);
    res.status(500).json({ error: 'Failed to initiate Koko payment' });
  }
});

/**
 * POST /api/koko/webhook
 * Authoritative callback handler from Koko provider
 */
router.post('/webhook', (req, res) => {
  try {
    const config = getKokoConfig();
    const signature = req.headers['x-koko-signature'];

    // Verify signature if secret configured
    if (config.webhookSecret && signature) {
      const calculated = crypto.createHmac('sha256', config.webhookSecret).update(JSON.stringify(req.body)).digest('hex');
      if (signature !== calculated) {
        return res.status(401).json({ error: 'Invalid provider signature' });
      }
    }

    const { order_id, status, transaction_ref, paid_amount } = req.body;
    if (!order_id) return res.status(400).json({ error: 'Missing order_id in callback' });

    const order = db.prepare('SELECT * FROM orders WHERE order_ref = ?').get(order_id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Prevent duplicate processing
    if (order.payment_status === 'verified_paid') {
      return res.json({ status: 'already_processed' });
    }

    const now = new Date().toISOString();
    if (status === 'SUCCESS' || status === 'PAID') {
      db.prepare('UPDATE orders SET payment_status = ?, updated_at = ? WHERE id = ?').run(
        'verified_paid', now, order.id
      );

      db.prepare(`
        INSERT INTO payments (
          order_id, payment_method, amount, status, transaction_ref,
          verified_by, verified_at, verification_notes, created_at
        ) VALUES (?, 'koko', ?, 'verified_paid', ?, 'koko_webhook', ?, 'Verified via official Koko webhook', ?)
      `).run(order.id, paid_amount || order.total_payable, transaction_ref || null, now, now);

      db.prepare(`
        INSERT INTO order_audit_logs (order_id, action, performed_by, details, created_at)
        VALUES (?, 'koko_verified', 'koko_webhook', ?, ?)
      `).run(order.id, JSON.stringify({ transaction_ref, paid_amount }), now);
    }

    res.json({ success: true, processed_order: order_id });
  } catch (err) {
    console.error('Koko webhook error:', err);
    res.status(500).json({ error: 'Webhook processing error' });
  }
});

/**
 * GET /api/koko/status/:orderRef
 */
router.get('/status/:orderRef', (req, res) => {
  try {
    const { orderRef } = req.params;
    const order = db.prepare('SELECT order_ref, payment_method, payment_status, total_payable FROM orders WHERE order_ref = ?').get(orderRef);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    res.json({
      order_ref: order.order_ref,
      payment_method: order.payment_method,
      payment_status: order.payment_status,
      is_paid: order.payment_status === 'verified_paid',
      total_payable: order.total_payable
    });
  } catch (err) {
    res.status(500).json({ error: 'Status check error' });
  }
});

module.exports = router;
