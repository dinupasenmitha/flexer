// ============================================================
// FLEXER EYEWEAR — Business Settings API
// ============================================================

const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAdmin } = require('../auth');

const PUBLIC_SETTING_KEYS = new Set([
  'store_name', 'store_tagline', 'domain', 'currency', 'whatsapp_number',
  'whatsapp_community_url', 'delivery_fee_islandwide', 'delivery_fee_policy',
  'announcement_text', 'koko_enabled'
]);

const EDITABLE_SETTING_KEYS = new Set([
  'bank_name', 'bank_branch', 'bank_account_holder', 'bank_account_number',
  'bank_payment_instructions', 'whatsapp_number', 'whatsapp_community_url',
  'delivery_fee_islandwide', 'announcement_text', 'koko_enabled',
  'koko_merchant_id', 'koko_api_key', 'koko_webhook_secret', 'koko_mode'
]);

/**
 * GET /api/settings/admin
 * Full configuration for the authenticated administration interface.
 */
router.get('/admin', requireAdmin, (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    res.json(Object.fromEntries(rows.map(row => [row.key, row.value])));
  } catch (err) {
    console.error('Error fetching admin settings:', err);
    res.status(500).json({ error: 'Failed to retrieve settings' });
  }
});

/**
 * GET /api/settings
 * Publicly safe business configuration
 */
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value, description FROM settings').all();
    const settings = {};
    rows.forEach(r => {
      if (PUBLIC_SETTING_KEYS.has(r.key)) {
        settings[r.key] = r.value;
      }
    });

    // A legacy enabled flag alone must never expose Koko in the storefront.
    // The payment option becomes available only after both activation and the
    // merchant values required for a real provider connection are configured.
    // Credentials alone cannot activate an unverified provider adapter.
    settings.koko_enabled = '0';

    res.json(settings);
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).json({ error: 'Failed to retrieve settings' });
  }
});

/**
 * PUT /api/settings (Admin Only)
 */
router.put('/', requireAdmin, (req, res) => {
  try {
    const updates = req.body;
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'Invalid settings payload' });
    }
    for (const [key, val] of Object.entries(updates)) {
      if (!EDITABLE_SETTING_KEYS.has(key)) {
        return res.status(400).json({ error: `Setting '${key}' cannot be updated through this endpoint` });
      }
      if (typeof val !== 'string' && typeof val !== 'number') {
        return res.status(400).json({ error: `Invalid value for '${key}'` });
      }
      if (key === 'delivery_fee_islandwide' && (!Number.isFinite(Number(val)) || Number(val) < 0)) {
        return res.status(400).json({ error: 'Delivery fee must be a non-negative number' });
      }
      if (key === 'koko_enabled' && !['0', '1', 0, 1].includes(val)) {
        return res.status(400).json({ error: 'Koko enabled must be 0 or 1' });
      }
      if (key === 'koko_enabled' && String(val) === '1') {
        return res.status(400).json({
          error: 'Koko cannot be enabled until the official provider integration is approved and deployed'
        });
      }
    }

    const now = new Date().toISOString();
    const updateStmt = db.prepare(`
      INSERT INTO settings (key, value, description, updated_at)
      VALUES (?, ?, '', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `);

    db.exec('BEGIN TRANSACTION;');
    try {
      for (const [key, val] of Object.entries(updates)) {
        updateStmt.run(key, String(val), now);
      }
      db.exec('COMMIT;');
    } catch (txErr) {
      db.exec('ROLLBACK;');
      throw txErr;
    }

    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (err) {
    console.error('Error updating settings:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;
