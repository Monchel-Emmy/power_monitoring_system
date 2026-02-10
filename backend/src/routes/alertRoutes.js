const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const Device = require('../models/Device');

// Test route to verify alerts endpoint is working
router.get('/test', (req, res) => {
  res.json({ message: 'Alerts route is working!', timestamp: new Date() });
});

// GET all alerts with filters
router.get('/', async (req, res) => {
  try {
    const { severity, status, building, limit = 100 } = req.query;
    const filter = {};
    if (severity && severity !== 'All') filter.severity = severity;
    if (status && status !== 'All') filter.status = status;
    if (building) filter.building = building;

    const alerts = await Alert.find(filter)
      .populate('device', 'id name location status')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit, 10));

    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET alert stats/summary
router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [openCount, activeThisWeek, totalAlerts, bySeverity, byStatus] = await Promise.all([
      Alert.countDocuments({ status: 'Open' }),
      Alert.countDocuments({ timestamp: { $gte: weekAgo }, status: { $in: ['Open', 'Investigating'] } }),
      Alert.countDocuments({ timestamp: { $gte: weekAgo } }),
      Alert.aggregate([
        { $match: { timestamp: { $gte: weekAgo } } },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
      ]),
      Alert.aggregate([
        { $match: { timestamp: { $gte: weekAgo } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const emailDelivery = 98;
    const smsPushDelivery = 92;

    res.json({
      openCount,
      activeThisWeek,
      totalAlerts,
      emailDelivery,
      smsPushDelivery,
      bySeverity: Object.fromEntries(bySeverity.map((s) => [s._id, s.count])),
      byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create new alert
router.post('/', async (req, res) => {
  try {
    const { building, device, type, severity, message, value, threshold } = req.body;
    const alert = new Alert({
      building,
      device,
      type,
      severity,
      message,
      value,
      threshold,
      timestamp: new Date(),
    });
    const newAlert = await alert.save();
    await newAlert.populate('device', 'id name location status');
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
