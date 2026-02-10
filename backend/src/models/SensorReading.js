const mongoose = require('mongoose');

const SensorReadingSchema = new mongoose.Schema({
  device: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
  },
  powerConsumption: {
    type: Number,
    required: true,
    min: 0,
  },
  voltage: {
    type: Number,
    required: function() { return this.type === 'voltage-sensor' || this.type === 'power-meter'; },
  },
  current: {
    type: Number,
    required: function() { return this.type === 'current-sensor' || this.type === 'power-meter'; },
  },
});

// Add index for fast time-series queries
SensorReadingSchema.index({ device: 1, timestamp: -1 });

module.exports = mongoose.model('SensorReading', SensorReadingSchema);