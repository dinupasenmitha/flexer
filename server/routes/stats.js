// ============================================================
// FLEXER EYEWEAR — Verified Admin Analytics & Metrics
// ============================================================

const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAdmin } = require('../auth');

/**
 * GET /api/admin/stats
 * Real metrics strictly computed from database records
 */
router.get('/', requireAdmin, (req, res) => {
  try {
    // 1. Order counts by status
    const statusRows = db.prepare(`
      SELECT order_status, COUNT(*) as count, SUM(total_payable) as total_val
      FROM orders
      GROUP BY order_status
    `).all();

    const statusCounts = {
      new: 0,
      awaiting_confirmation: 0,
      confirmed: 0,
      processing: 0,
      dispatched: 0,
      delivered: 0,
      cancelled: 0
    };

    let totalOrdersCount = 0;
    let grossOrderValue = 0; // Total value of all non-cancelled orders

    statusRows.forEach(r => {
      const status = { pending: 'new', paid: 'confirmed', shipped: 'dispatched' }[r.order_status] || r.order_status;
      if (statusCounts[status] !== undefined) {
        statusCounts[status] += r.count;
      }
      totalOrdersCount += r.count;
      if (r.order_status !== 'cancelled') {
        grossOrderValue += (r.total_val || 0);
      }
    });

    // 2. Verified Revenue (Collected & verified funds only)
    // Strictly sums orders where payment_status = 'verified_paid'
    const verifiedRevenueRow = db.prepare(`
      SELECT SUM(total_payable) as collected_revenue
      FROM orders
      WHERE payment_status = 'verified_paid'
    `).get();
    const verifiedRevenue = verifiedRevenueRow?.collected_revenue || 0;

    // 3. Awaiting Payment Verification (Bank transfers or Koko needing admin check)
    const pendingPaymentRow = db.prepare(`
      SELECT COUNT(*) as count, SUM(total_payable) as pending_val
      FROM orders
      WHERE payment_status IN ('awaiting_transfer', 'awaiting_slip', 'under_review', 'koko_pending')
        AND order_status != 'cancelled'
    `).get();

    // 4. COD Orders (Payment due on delivery)
    const codDueRow = db.prepare(`
      SELECT COUNT(*) as count, SUM(total_payable) as due_val
      FROM orders
      WHERE payment_method = 'cod' AND payment_status = 'due_on_delivery' AND order_status != 'cancelled'
    `).get();

    // 5. Active Products count
    const prodRow = db.prepare('SELECT COUNT(*) as count FROM products WHERE active = 1').get();

    // 6. Subscribers & Unread Contact Messages
    const subRow = db.prepare('SELECT COUNT(*) as count FROM newsletter_subscribers').get();
    const msgRow = db.prepare('SELECT COUNT(*) as count FROM contact_messages WHERE read = 0').get();

    res.json({
      total_orders: totalOrdersCount,
      gross_order_value: grossOrderValue,
      verified_revenue: verifiedRevenue, // Real money in bank / verified
      awaiting_payment_verification_count: pendingPaymentRow?.count || 0,
      awaiting_payment_verification_value: pendingPaymentRow?.pending_val || 0,
      cod_due_count: codDueRow?.count || 0,
      cod_due_value: codDueRow?.due_val || 0,
      status_breakdown: statusCounts,
      active_products: prodRow?.count || 0,
      subscribers_count: subRow?.count || 0,
      unread_messages_count: msgRow?.count || 0
    });
  } catch (err) {
    console.error('Error computing stats:', err);
    res.status(500).json({ error: 'Failed to compute dashboard metrics' });
  }
});

module.exports = router;
