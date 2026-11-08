// ============================================================
// FLEXER EYEWEAR — Newsletter & Contact Leads API
// ============================================================

const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAdmin } = require('../auth');

/**
 * POST /api/newsletter
 */
router.post('/newsletter', (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO newsletter_subscribers (email, source, created_at)
      VALUES (?, 'storefront', ?)
      ON CONFLICT(email) DO NOTHING
    `).run(email.trim().toLowerCase(), now);

    res.json({ success: true, message: 'Thank you for subscribing to FLEXER Drop announcements.' });
  } catch (err) {
    console.error('Newsletter error:', err);
    res.status(500).json({ error: 'Subscription error' });
  }
});

/**
 * GET /api/newsletter (Admin Only)
 */
router.get('/newsletter', requireAdmin, (req, res) => {
  try {
    const subs = db.prepare('SELECT * FROM newsletter_subscribers ORDER BY id DESC').all();
    res.json(subs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve subscribers' });
  }
});

/**
 * POST /api/contacts
 */
router.post('/contacts', (req, res) => {
  try {
    const { name, phone, message } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
    if (!phone || !phone.trim()) return res.status(400).json({ error: 'Phone / WhatsApp is required' });
    if (!message || !message.trim()) return res.status(400).json({ error: 'Message is required' });

    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO contact_messages (name, phone, message, read, created_at)
      VALUES (?, ?, ?, 0, ?)
    `).run(name.trim(), phone.trim(), message.trim(), now);

    res.json({ success: true, message: 'Message sent successfully. Our support team will get in touch.' });
  } catch (err) {
    console.error('Contact error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

/**
 * GET /api/contacts (Admin Only)
 */
router.get('/contacts', requireAdmin, (req, res) => {
  try {
    const messages = db.prepare('SELECT * FROM contact_messages ORDER BY id DESC').all();
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve messages' });
  }
});

/**
 * PATCH /api/contacts/:id/read (Admin Only)
 */
router.patch('/contacts/:id/read', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('UPDATE contact_messages SET read = 1 WHERE id = ?').run(Number(id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Update error' });
  }
});

module.exports = router;
