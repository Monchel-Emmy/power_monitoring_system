const mongoose = require('mongoose');

const BuildingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  address: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active',
  },
  totalFloors: {
    type: Number,
    required: true,
    min: 1,
  },
  totalZones: {
    type: Number,
    default: 0,
  },
  totalDevices: {
    type: Number,
    default: 0,
  },
  totalArea: {
    type: Number, // in square meters or feet
    required: true,
    min: 0,
  },
  zoneDistribution: [
    {
      zoneName: { type: String, trim: true },
      devicesCount: { type: Number, default: 0 },
      area: { type: Number, default: 0 },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update `updatedAt` field on save
BuildingSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  if (typeof next === 'function') next();
});

module.exports = mongoose.model('Building', BuildingSchema);