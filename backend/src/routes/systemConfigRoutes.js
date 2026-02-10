const express = require('express');
const router = express.Router();
const SystemConfig = require('../models/SystemConfig');

const DEFAULT_CONFIG = {
  dataManagement: { retentionDays: 90, backupFrequency: 'Daily' },
  alerts: { defaultThresholdPercent: 80, emailEnabled: true, smsEnabled: false, pushEnabled: true },
  security: { twoFactorRequired: true, sessionTimeoutMinutes: 30 },
};

// GET system config (return default if none saved)
router.get('/config', async (req, res) => {
  try {
    let doc = await SystemConfig.findOne({ id: 'default' }).lean();
    if (!doc) {
      await SystemConfig.create({ id: 'default', ...DEFAULT_CONFIG });
      doc = await SystemConfig.findOne({ id: 'default' }).lean();
    }
    res.json({
      dataManagement: doc?.dataManagement ?? DEFAULT_CONFIG.dataManagement,
      alerts: doc?.alerts ?? DEFAULT_CONFIG.alerts,
      security: doc?.security ?? DEFAULT_CONFIG.security,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT system config (upsert)
router.put('/config', async (req, res) => {
  try {
    const body = req.body || {};
    const dataManagement = {
      retentionDays: body.dataManagement?.retentionDays ?? DEFAULT_CONFIG.dataManagement.retentionDays,
      backupFrequency: body.dataManagement?.backupFrequency ?? DEFAULT_CONFIG.dataManagement.backupFrequency,
    };
    const alerts = {
      defaultThresholdPercent: body.alerts?.defaultThresholdPercent ?? DEFAULT_CONFIG.alerts.defaultThresholdPercent,
      emailEnabled: body.alerts?.emailEnabled ?? DEFAULT_CONFIG.alerts.emailEnabled,
      smsEnabled: body.alerts?.smsEnabled ?? DEFAULT_CONFIG.alerts.smsEnabled,
      pushEnabled: body.alerts?.pushEnabled ?? DEFAULT_CONFIG.alerts.pushEnabled,
    };
    const security = {
      twoFactorRequired: body.security?.twoFactorRequired ?? DEFAULT_CONFIG.security.twoFactorRequired,
      sessionTimeoutMinutes: body.security?.sessionTimeoutMinutes ?? DEFAULT_CONFIG.security.sessionTimeoutMinutes,
    };

    const doc = await SystemConfig.findOneAndUpdate(
      { id: 'default' },
      { dataManagement, alerts, security },
      { new: true, upsert: true }
    ).lean();

    res.json({
      dataManagement: doc.dataManagement,
      alerts: doc.alerts,
      security: doc.security,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
