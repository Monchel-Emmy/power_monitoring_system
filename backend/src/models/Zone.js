const mongoose = require('mongoose');

const ZoneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  building: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Building',
    required: true,
  },
  floor: {
    type: Number,
    required: true,
    min: 0,
  },
  area: {
    type: Number, // in square meters or feet
    required: true,
    min: 0,
  },
  deviceCount: {
    type: Number,
    default: 0,
  },
  description: {
    type: String,
    trim: true,
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

// Add a compound unique index to ensure zone names are unique within a building
ZoneSchema.index({ name: 1, building: 1 }, { unique: true });

// Update `updatedAt` field on save
ZoneSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Zone', ZoneSchema);