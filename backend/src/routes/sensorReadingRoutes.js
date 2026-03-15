const express = require('express');
const router = express.Router();
const SensorReading = require('../models/SensorReading');
const Device = require('../models/Device');

// Middleware to get a single sensor reading by ID
const getSensorReading = async (req, res, next) => {
  let sensorReading;
  try {
    sensorReading = await SensorReading.findById(req.params.id).populate('device');
    if (!sensorReading) {
      return res.status(404).json({ message: 'Sensor reading not found' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
  res.sensorReading = sensorReading;
  if (typeof next === 'function') next();
  else res.json(res.sensorReading);
};

// Get all sensor readings (supports device ID filter)
router.get('/', async (req, res) => {
  try {
    const filter = req.query.deviceId ? { device: req.query.deviceId } : {};
    const sensorReadings = await SensorReading.find(filter).populate('device');
    res.json(sensorReadings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get sensor readings by device and time range (time-series query)
router.get('/time-range', async (req, res) => {
  const { deviceId, startTimestamp, endTimestamp } = req.query;
  if (!deviceId || !startTimestamp || !endTimestamp) {
    return res.status(400).json({ message: 'deviceId, startTimestamp, endTimestamp are required' });
  }
  try {
    const sensorReadings = await SensorReading.find({
      device: deviceId,
      timestamp: { $gte: new Date(startTimestamp), $lte: new Date(endTimestamp) }
    }).populate('device').sort('timestamp');
    res.json(sensorReadings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new sensor reading
router.post('/', async (req, res) => {
  const { deviceId, timestamp, powerConsumption, voltage, current } = req.body;
  const deviceExists = await Device.findById(deviceId);
  if (!deviceExists) {
    return res.status(404).json({ message: 'Device not found' });
  }
  const sensorReading = new SensorReading({
    device: deviceId,
    timestamp: timestamp ? new Date(timestamp) : new Date(),
    powerConsumption: Number(powerConsumption) || 0,
    voltage: voltage != null ? Number(voltage) : 220,
    current: current != null ? Number(current) : 0,
  });
  try {
    const newSensorReading = await sensorReading.save();
    res.status(201).json(newSensorReading);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Load demo data: readings for all devices, last 7 days hourly (optionally clear first)
router.post('/demo', async (req, res) => {
  try {
    const clearFirst = req.query.clear === '1' || req.query.clear === 'true';
    if (clearFirst) {
      await SensorReading.deleteMany({});
    }
    const devices = await Device.find().lean();
    if (devices.length === 0) {
      return res.status(400).json({ message: 'No devices in database. Add devices first.' });
    }
    const now = new Date();
    const hoursBack = 24 * 7; // 7 days hourly
    const toInsert = [];
    for (const d of devices) {
      const deviceId = String(d._id);
      for (let i = hoursBack - 1; i >= 0; i--) {
        const ts = new Date(now.getTime() - i * 60 * 60 * 1000);
        const baseKw = 15 + Math.random() * 85;
        const v = 218 + Math.random() * 10;
        const c = (baseKw * 1000) / v;
        toInsert.push({
          device: deviceId,
          timestamp: ts,
          powerConsumption: Math.round(baseKw * 10) / 10,
          voltage: Math.round(v * 10) / 10,
          current: Math.round(c * 10) / 10,
        });
      }
    }
    if (toInsert.length === 0) {
      return res.status(400).json({ message: 'No demo readings to insert' });
    }
    const chunkSize = 500;
    let insertedTotal = 0;
    for (let i = 0; i < toInsert.length; i += chunkSize) {
      const chunk = toInsert.slice(i, i + chunkSize);
      const inserted = await SensorReading.insertMany(chunk);
      insertedTotal += inserted.length;
    }
    return res.status(201).json({
      message: `Demo data loaded: ${insertedTotal} readings for ${devices.length} device(s). Last 7 days, hourly.`,
      count: insertedTotal,
      devicesUsed: devices.length,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to load demo data' });
  }
});

// Bulk create sensor readings (for simulator / testing) – must be before POST /:id
router.post('/bulk', async (req, res) => {
  try {
    const { readings } = req.body || {};
    if (!Array.isArray(readings) || readings.length === 0) {
      return res.status(400).json({ message: 'readings array is required and must not be empty' });
    }
    if (readings.length > 500) {
      return res.status(400).json({ message: 'Maximum 500 readings per request' });
    }
    const devices = await Device.find().lean();
    const deviceIds = new Set(devices.map((d) => String(d._id)));
    const toInsert = readings
      .filter((r) => r.deviceId != null && deviceIds.has(String(r.deviceId).trim()))
      .map((r) => ({
        device: String(r.deviceId).trim(),
        timestamp: r.timestamp ? new Date(r.timestamp) : new Date(),
        powerConsumption: Number(r.powerConsumption) >= 0 ? Number(r.powerConsumption) : 0,
        voltage: r.voltage != null && !Number.isNaN(Number(r.voltage)) ? Number(r.voltage) : 220,
        current: r.current != null && !Number.isNaN(Number(r.current)) ? Number(r.current) : 0,
      }));
    if (toInsert.length === 0) {
      return res.status(400).json({
        message: 'No valid readings. Check that device is selected and deviceId is a valid device _id.',
      });
    }
    const inserted = await SensorReading.insertMany(toInsert);
    return res.status(201).json({ message: `${inserted.length} readings added`, count: inserted.length });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Bulk add failed' });
  }
});

// Delete all sensor readings (for resetting / testing). Path must not be a valid ObjectId or :id would match it.
router.delete('/delete-all', async (req, res) => {
  try {
    const result = await SensorReading.deleteMany({});
    return res.json({ message: `All sensor readings deleted (${result.deletedCount} removed).`, deletedCount: result.deletedCount });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to delete readings' });
  }
});

// Get a single sensor reading
router.get('/:id', getSensorReading, (req, res) => {
  res.json(res.sensorReading);
});

// Delete a sensor reading
router.delete('/:id', getSensorReading, async (req, res) => {
  try {
    await res.sensorReading.remove();
    res.json({ message: 'Sensor reading deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;