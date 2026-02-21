const mongoose = require('mongoose');

const SystemConfigSchema = new mongoose.Schema({
  id: {
    type: String,
    default: 'default',
    unique: true,
  },
  dataManagement: {
    retentionDays: { type: Number, default: 90 },
    backupFrequency: { type: String, default: 'Daily' },
  },
  alerts: {
    defaultThresholdPercent: { type: Number, default: 80 },
    emailEnabled: { type: Boolean, default: true },
    smsEnabled: { type: Boolean, default: false },
    pushEnabled: { type: Boolean, default: true },
  },
  security: {
    twoFactorRequired: { type: Boolean, default: true },
    sessionTimeoutMinutes: { type: Number, default: 30 },
  },
  updatedAt: { type: Date, default: Date.now },
}, { collection: 'systemconfigs' });

SystemConfigSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  if (typeof next === 'function') next();
});

module.exports = mongoose.model('SystemConfig', SystemConfigSchema);
