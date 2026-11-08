// ============================================================
// FLEXER EYEWEAR — Authentication & Security Middleware
// Zero external crypto dependencies - native Node crypto JWT
// ============================================================

const crypto = require('node:crypto');
const { db, verifyPassword } = require('./db');

// An explicit environment secret keeps production sessions stable. A fresh
// process-local fallback is safer than shipping a universally known signing key.
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

/**
 * Generate standard HMAC-SHA256 JWT
 */
function generateToken(payload, expiresInSeconds = 86400 * 7) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const fullPayload = { ...payload, exp };

  const b64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const b64Payload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${b64Header}.${b64Payload}`)
    .digest('base64url');

  return `${b64Header}.${b64Payload}.${signature}`;
}

/**
 * Verify and decode HMAC-SHA256 JWT
 */
function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [b64Header, b64Payload, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${b64Header}.${b64Payload}`)
    .digest('base64url');

  if (signature.length !== expectedSig.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) return null;

  try {
    const payload = JSON.parse(Buffer.from(b64Payload, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Express Middleware to require Admin Authorization
 */
function requireAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized: Missing authorization header' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  const decoded = verifyToken(token);

  if (!decoded || !decoded.username) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }

  req.adminUser = decoded;
  next();
}

/**
 * Authenticate Admin User Credentials
 */
function authenticateAdmin(username, password) {
  const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);
  if (!user) return null;

  const isValid = verifyPassword(password, user.password_hash, user.salt);
  if (!isValid) return null;

  const token = generateToken({ id: user.id, username: user.username, role: user.role });
  return { token, username: user.username, role: user.role };
}

module.exports = {
  generateToken,
  verifyToken,
  requireAdmin,
  authenticateAdmin
};
