const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  timestamp: { type: String, required: true },
  user: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ['User Actions', 'Device Changes', 'System Events', 'Security Events'],
    required: true,
  },
  action: { type: String, required: true, trim: true },
  details: { type: String, trim: true, default: '' },
  ip: { type: String, trim: true, default: '' },
  status: { type: String, enum: ['success', 'warning', 'error'], default: 'success' },
  createdAt: { type: Date, default: Date.now },
}, { collection: 'auditlogs' });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
