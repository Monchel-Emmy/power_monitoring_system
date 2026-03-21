const AuditLog = require('../models/AuditLog');

/**
 * Log an audit event
 * @param {string} user - Username or user identifier
 * @param {string} category - Event category
 * @param {string} action - Action performed
 * @param {string} details - Additional details
 * @param {string} ip - IP address
 * @param {string} status - Event status (success, warning, error)
 */
const logAuditEvent = async (user, category, action, details = '', ip = '', status = 'success') => {
  try {
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const entry = new AuditLog({
      timestamp,
      user: user.trim(),
      category,
      action: action.trim(),
      details: details.trim(),
      ip: ip.trim(),
      status,
    });
    await entry.save();
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
};

/**
 * Get client IP address from request
 */
const getClientIP = (req) => {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         'unknown';
};

module.exports = { logAuditEvent, getClientIP };
