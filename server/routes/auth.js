// ============================================================
// FLEXER EYEWEAR — Authentication API
// ============================================================

const express = require('express');
const router = express.Router();
const { authenticateAdmin, requireAdmin } = require('../auth');

/**
 * POST /api/auth/login
 */
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    let auth = authenticateAdmin(username.trim(), password);
    if (!auth && typeof password === 'string' && password !== password.trim()) {
      auth = authenticateAdmin(username.trim(), password.trim());
    }
    if (!auth) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    res.json({
      success: true,
      token: auth.token,
      username: auth.username,
      role: auth.role
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Authentication service error' });
  }
});

/**
 * GET /api/auth/me
 */
router.get('/me', requireAdmin, (req, res) => {
  res.json({
    authenticated: true,
    user: req.adminUser
  });
});

module.exports = router;
