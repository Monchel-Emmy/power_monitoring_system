const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Building = require('../models/Building');
const Device = require('../models/Device');
const AuditLog = require('../models/AuditLog');

// GET admin overview - aggregated stats and recent data
router.get('/overview', async (req, res) => {
  try {
    const [userCount, buildingCount, deviceCount, auditCount, users, buildings, devices, auditLogs] = await Promise.all([
      User.countDocuments(),
      Building.countDocuments(),
      Device.countDocuments(),
      AuditLog.countDocuments(),
      User.find().limit(5).select('username email role status').lean(),
      Building.find().limit(5).lean(),
      Device.find().sort({ createdAt: -1 }).limit(5).lean(),
      AuditLog.find().sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    const [onlineDevices, offlineDevices, warningDevices] = await Promise.all([
      Device.countDocuments({ status: 'Online' }),
      Device.countDocuments({ status: 'Offline' }),
      Device.countDocuments({ status: 'Warning' }),
    ]);
    const activeUsers = await User.countDocuments({ $or: [{ status: 'Active' }, { status: 'active' }] });
    const adminCount = await User.countDocuments({ role: 'admin' });
    const managerCount = await User.countDocuments({ role: 'manager' });

    const buildingTotals = await Building.aggregate([
      { $group: { _id: null, zones: { $sum: '$totalZones' }, devices: { $sum: '$totalDevices' }, floors: { $sum: '$totalFloors' } } },
    ]);
    const agg = buildingTotals[0] || { zones: 0, devices: 0, floors: 0 };

    res.json({
      overview: {
        systemHealth: 'Excellent',
        systemHealthPercent: 99.8,
        totalUsers: userCount,
        totalBuildings: buildingCount,
        totalDevices: deviceCount,
        auditEntries: auditCount,
        activeUsers,
        adminCount,
        managerCount,
        onlineDevices,
        offlineDevices,
        warningDevices,
        totalZones: agg.zones,
        totalFloors: agg.floors,
        totalDevicesInBuildings: agg.devices,
      },
      recentUsers: users,
      buildings,
      devices,
      recentAudit: auditLogs,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
