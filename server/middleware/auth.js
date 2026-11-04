const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../db');

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Access denied. No authorization token provided.' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = db.users.find(u => u.id === decoded.id && u.active);
    if (!user) {
      return res.status(401).json({ error: 'Invalid session token: User not found or account deactivated.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Authentication failed: Invalid or expired token.' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access forbidden: Administrator privileges required.' });
  }
  next();
}

function requireAgentOrAdmin(req, res, next) {
  if (!req.user || (req.user.role !== 'agent' && req.user.role !== 'admin')) {
    return res.status(403).json({ error: 'Access forbidden: Authorized personnel only.' });
  }
  next();
}

module.exports = {
  verifyToken,
  requireAdmin,
  requireAgentOrAdmin
};

