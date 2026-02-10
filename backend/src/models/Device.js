const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['Smart Meter', 'IoT Sensor'],
    default: 'Smart Meter',
  },
  location: {
    type: String,
    trim: true,
    default: '',
  },
  lastSync: {
    type: String,
    trim: true,
    default: '—',
  },
  dataRate: {
    type: String,
    trim: true,
    default: '—',
  },
  battery: {
    type: String,
    trim: true,
    default: '100%',
  },
  status: {
    type: String,
    enum: ['Online', 'Offline', 'Warning'],
    default: 'Online',
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

DeviceSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Device', DeviceSchema);
