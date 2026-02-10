const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
  },
  building: {
    type: String,
    required: true,
    trim: true,
  },
  device: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
  },
  type: {
    type: String,
    enum: ['High Consumption', 'Device Offline', 'Voltage Anomaly', 'Threshold Breach', 'Battery Low', 'Connection Lost'],
    required: true,
  },
  severity: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    required: true,
  },
  status: {
    type: String,
    enum: ['Open', 'Investigating', 'Acknowledged', 'Resolved'],
    default: 'Open',
  },
  message: {
    type: String,
    trim: true,
    default: '',
  },
  value: {
    type: Number,
  },
  threshold: {
    type: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

AlertSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

AlertSchema.index({ timestamp: -1 });
AlertSchema.index({ status: 1 });
AlertSchema.index({ severity: 1 });

module.exports = mongoose.model('Alert', AlertSchema);
