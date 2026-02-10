const express = require('express');
const router = express.Router();
const Device = require('../models/Device');

// Get all devices
router.get('/', async (req, res) => {
  try {
    const devices = await Device.find().sort({ id: 1 });
    res.json(devices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single device by id (e.g. D001)
router.get('/:id', async (req, res) => {
  try {
    const device = await Device.findOne({ id: req.params.id });
    if (device) {
      res.json(device);
    } else {
      res.status(404).json({ message: 'Device not found' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Generate next device id (D001, D002, ...)
async function getNextDeviceId() {
  const last = await Device.findOne().sort({ id: -1 }).select('id').lean();
  if (!last || !last.id) return 'D001';
  const match = last.id.match(/^D(\d+)$/i);
  const num = match ? parseInt(match[1], 10) + 1 : 1;
  return `D${num.toString().padStart(3, '0')}`;
}

// Add a new device
router.post('/', async (req, res) => {
  try {
    const { name, type, location, lastSync, dataRate, battery, status } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Device name is required' });
    }
    const id = await getNextDeviceId();
    const newDevice = new Device({
      id,
      name: name.trim(),
      type: type || 'Smart Meter',
      location: (location || '').trim(),
      lastSync: (lastSync || '—').trim(),
      dataRate: (dataRate || '—').trim(),
      battery: (battery || '100%').trim(),
      status: status || 'Online',
    });
    const saved = await newDevice.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a device by id
router.put('/:id', async (req, res) => {
  try {
    const { name, type, location, lastSync, dataRate, battery, status } = req.body;
    const update = {};
    if (name !== undefined) update.name = name.trim();
    if (type !== undefined) update.type = type;
    if (location !== undefined) update.location = location.trim();
    if (lastSync !== undefined) update.lastSync = lastSync.trim();
    if (dataRate !== undefined) update.dataRate = dataRate.trim();
    if (battery !== undefined) update.battery = battery.trim();
    if (status !== undefined) update.status = status;

    const device = await Device.findOneAndUpdate(
      { id: req.params.id },
      { $set: update },
      { new: true }
    );
    if (device) {
      res.json(device);
    } else {
      res.status(404).json({ message: 'Device not found' });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a device by id
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Device.findOneAndDelete({ id: req.params.id });
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: 'Device not found' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
