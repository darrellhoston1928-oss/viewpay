const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'viewpay-jwt-secret-token-key-2026';

function requireAuth(req, res, next) {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare(`
      SELECT id, email, role, admin_role, display_name, username, bio, avatar_url, cover_url, 
             category, is_age_verified, is_email_verified, is_banned, ban_reason, 
             deposit_lock_until, wallet_balance, creator_status, subscription_price, allow_subscriptions, created_at
      FROM users 
      WHERE id = ?
    `).get(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'User no longer exists.' });
    }

    if (user.is_banned) {
      return res.status(403).json({ error: `Your account has been suspended: ${user.ban_reason || 'Violation of terms.'}` });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }
}

function optionalAuth(req, res, next) {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = db.prepare(`
        SELECT id, email, role, admin_role, display_name, username, bio, avatar_url, cover_url, 
               category, is_age_verified, is_email_verified, is_banned, ban_reason, 
               deposit_lock_until, wallet_balance, creator_status, subscription_price, allow_subscriptions, created_at
        FROM users 
        WHERE id = ?
      `).get(decoded.id);
      if (user && !user.is_banned) {
        req.user = user;
      }
    } catch (e) {
      // ignore
    }
  }
  next();
}

function requireRole(roles) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
}

function requireAdminRole(subRole) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Administrator access required.' });
    }
    if (subRole && req.user.admin_role !== subRole && req.user.admin_role !== 'owner') {
      return res.status(403).json({ error: `Owner access required for this action.` });
    }
    next();
  };
}

module.exports = {
  JWT_SECRET,
  requireAuth,
  optionalAuth,
  requireRole,
  requireAdminRole
};
