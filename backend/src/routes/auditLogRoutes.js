const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');

// GET all audit log entries (optional query: category, search)
router.get('/', async (req, res) => {
  try {
    const { category, q } = req.query;
    const filter = {};
    if (category && category !== 'All Categories') {
      filter.category = category;
    }
    if (q && q.trim()) {
      const term = q.trim().toLowerCase();
      filter.$or = [
        { user: new RegExp(term, 'i') },
        { action: new RegExp(term, 'i') },
        { details: new RegExp(term, 'i') },
        { ip: new RegExp(term, 'i') },
      ];
    }
    const events = await AuditLog.find(filter).sort({ createdAt: -1 }).lean();
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create audit log entry (for manual logging or from other services)
router.post('/', async (req, res) => {
  try {
    const { timestamp, user, category, action, details, ip, status } = req.body;
    if (!user || !category || !action) {
      return res.status(400).json({ message: 'user, category and action are required' });
    }
    const ts = timestamp || new Date().toISOString().slice(0, 19).replace('T', ' ');
    const entry = new AuditLog({
      timestamp: ts,
      user: user.trim(),
      category,
      action: action.trim(),
      details: (details || '').trim(),
      ip: (ip || '').trim(),
      status: status || 'success',
    });
    const saved = await entry.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
