const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'power-monitor-secret-change-in-production';

/**
 * Optional auth: if Authorization Bearer token is present, verify and set req.user (id, role, buildings).
 * If no token or invalid, req.user is null (manager routes may treat as "all data" for backward compat).
 */
async function optionalManagerAuth(req, res, next) {
  req.user = null;
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('username email role buildings').populate('buildings', 'name').lean();
    if (user) req.user = user;
  } catch {
    // invalid or expired token – leave req.user null
  }
  next();
}

/**
 * Returns building filter for the current user:
 * - null = no filter (show all buildings) – admin or no auth
 * - [] = no buildings (manager with none assigned)
 * - [id1, id2, ...] = only these building IDs (manager with assigned homes)
 */
function getAllowedBuildingIds(req) {
  if (!req.user) return null; // no auth → all (backward compat)
  if (req.user.role === 'admin') return null;
  if (req.user.role !== 'manager') return null;
  const ids = req.user.buildings || [];
  if (!Array.isArray(ids)) return null;
  const objectIds = ids.map((b) => (b && (b._id || b))).filter(Boolean);
  return objectIds;
}

module.exports = { optionalManagerAuth, getAllowedBuildingIds };
