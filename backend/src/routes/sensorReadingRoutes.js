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
  next();
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

// Get a single sensor reading
router.get('/:id', getSensorReading, (req, res) => {
  res.json(res.sensorReading);
});

// Create a new sensor reading
router.post('/', async (req, res) => {
  const { deviceId, timestamp, powerConsumption, voltage, current } = req.body;
  // Verify device exists
  const deviceExists = await Device.findById(deviceId);
  if (!deviceExists) {
    return res.status(404).json({ message: 'Device not found' });
  }
  const sensorReading = new SensorReading({
    device: deviceId,
    timestamp: timestamp || new Date(),
    powerConsumption,
    voltage,
    current
  });
  try {
    const newSensorReading = await sensorReading.save();
    res.status(201).json(newSensorReading);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
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