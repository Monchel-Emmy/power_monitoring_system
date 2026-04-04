const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const User = require('../models/User');
const Building = require('../models/Building');
const SystemConfig = require('../models/SystemConfig');
const { sendAlertEmail } = require('../utils/emailService');

// Helper: get building names allowed for the requesting user
async function getAllowedBuildingNames(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null; // no auth = all
  const jwt = require('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'power-monitor-secret-change-in-production';
  try {
    const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET);
    const user = await User.findById(decoded.id).select('role buildings').populate('buildings', 'name').lean();
    if (!user) return null;
    if (user.role === 'admin') return null; // admin sees all
    if (user.role !== 'manager') return null;
    const names = (user.buildings || []).map((b) => b.name || b).filter(Boolean);
    return names; // [] means manager with no buildings assigned
  } catch {
    return null;
  }
}

// GET power threshold
router.get('/threshold', async (req, res) => {
  try {
    const config = await SystemConfig.findOne({ id: 'default' }).lean();
    res.json({ powerThreshold: config?.alerts?.powerThreshold ?? 1000, emailEnabled: config?.alerts?.emailEnabled ?? true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT power threshold
router.put('/threshold', async (req, res) => {
  try {
    const { powerThreshold, emailEnabled } = req.body;
    const doc = await SystemConfig.findOneAndUpdate(
      { id: 'default' },
      { $set: { 'alerts.powerThreshold': Number(powerThreshold), 'alerts.emailEnabled': emailEnabled } },
      { new: true, upsert: true }
    ).lean();
    res.json({ powerThreshold: doc.alerts.powerThreshold, emailEnabled: doc.alerts.emailEnabled });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET all alerts with filters — scoped to manager's assigned buildings
router.get('/', async (req, res) => {
  try {
    const { severity, status, building, limit = 100 } = req.query;
    const filter = {};
    if (severity && severity !== 'All') filter.severity = severity;
    if (status && status !== 'All') filter.status = status;
    if (building) filter.building = building;

    // Scope to manager's assigned buildings
    const allowedNames = await getAllowedBuildingNames(req);
    if (allowedNames !== null) {
      if (allowedNames.length === 0) return res.json([]); // no buildings assigned
      filter.building = { $in: allowedNames };
    }

    const alerts = await Alert.find(filter)
      .populate('device', 'id name location status')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit, 10));

    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET alert stats/summary — scoped to manager's assigned buildings
router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const allowedNames = await getAllowedBuildingNames(req);
    const buildingFilter = allowedNames !== null
      ? (allowedNames.length === 0 ? { building: { $in: [] } } : { building: { $in: allowedNames } })
      : {};

    const [openCount, activeThisWeek, totalAlerts, bySeverity, byStatus] = await Promise.all([
      Alert.countDocuments({ ...buildingFilter, status: 'Open' }),
      Alert.countDocuments({ ...buildingFilter, timestamp: { $gte: weekAgo }, status: { $in: ['Open', 'Investigating'] } }),
      Alert.countDocuments({ ...buildingFilter, timestamp: { $gte: weekAgo } }),
      Alert.aggregate([
        { $match: { ...buildingFilter, timestamp: { $gte: weekAgo } } },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
      ]),
      Alert.aggregate([
        { $match: { ...buildingFilter, timestamp: { $gte: weekAgo } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const config = await SystemConfig.findOne({ id: 'default' }).lean();
    const emailEnabled = config?.alerts?.emailEnabled !== false;

    res.json({
      openCount,
      activeThisWeek,
      totalAlerts,
      emailDelivery: emailEnabled ? 98 : 0,
      bySeverity: Object.fromEntries(bySeverity.map((s) => [s._id, s.count])),
      byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET notification settings
router.get('/notification-settings', async (req, res) => {
  try {
    const config = await SystemConfig.findOne({ id: 'default' }).lean();
    res.json({
      emailEnabled: config?.alerts?.emailEnabled ?? true,
      notifyOnHigh: config?.alerts?.notifyOnHigh ?? true,
      notifyOnMedium: config?.alerts?.notifyOnMedium ?? true,
      notifyOnLow: config?.alerts?.notifyOnLow ?? false,
      notifyOnTypes: config?.alerts?.notifyOnTypes ?? [],
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT notification settings
router.put('/notification-settings', async (req, res) => {
  try {
    const { emailEnabled, notifyOnHigh, notifyOnMedium, notifyOnLow, notifyOnTypes } = req.body;
    const doc = await SystemConfig.findOneAndUpdate(
      { id: 'default' },
      {
        $set: {
          'alerts.emailEnabled': emailEnabled,
          'alerts.notifyOnHigh': notifyOnHigh,
          'alerts.notifyOnMedium': notifyOnMedium,
          'alerts.notifyOnLow': notifyOnLow,
          'alerts.notifyOnTypes': notifyOnTypes,
        },
      },
      { new: true, upsert: true }
    ).lean();
    res.json({
      emailEnabled: doc.alerts.emailEnabled,
      notifyOnHigh: doc.alerts.notifyOnHigh,
      notifyOnMedium: doc.alerts.notifyOnMedium,
      notifyOnLow: doc.alerts.notifyOnLow,
      notifyOnTypes: doc.alerts.notifyOnTypes,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST create new alert — triggers email if conditions match
router.post('/', async (req, res) => {
  try {
    const { building, device, type, severity, message, value, threshold } = req.body;
    const alert = new Alert({ building, device, type, severity, message, value, threshold, timestamp: new Date() });
    const newAlert = await alert.save();
    await newAlert.populate('device', 'id name location status');

    const config = await SystemConfig.findOne({ id: 'default' }).lean();
    const alertCfg = config?.alerts || {};
    const shouldNotify =
      alertCfg.emailEnabled !== false &&
      (
        (severity === 'High' && alertCfg.notifyOnHigh !== false) ||
        (severity === 'Medium' && alertCfg.notifyOnMedium !== false) ||
        (severity === 'Low' && alertCfg.notifyOnLow === true)
      );

    if (shouldNotify) {
      const managers = await User.find({ role: { $in: ['admin', 'manager'] }, status: 'active' }).select('email').lean();
      for (const mgr of managers) {
        if (mgr.email) {
          sendAlertEmail(mgr.email, newAlert.toObject()).catch((e) =>
            console.error('Alert email failed for', mgr.email, e)
          );
        }
      }
    }

    res.status(201).json(newAlert);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update alert status
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    ).populate('device', 'id name location status');
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    res.json(alert);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE alert
router.delete('/:id', async (req, res) => {
  try {
    const alert = await Alert.findByIdAndDelete(req.params.id);
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    res.json({ message: 'Alert deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
