const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  period: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  size: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    default: null,
  },
  endDate: {
    type: Date,
    default: null,
  },
  generatedAt: {
    type: Date,
    default: Date.now,
  },
  // Store which manager generated this report
  generatedBy: {
    type: String,
    required: true,
  },
});

// Index for efficient queries
reportSchema.index({ generatedBy: 1, generatedAt: -1 });
reportSchema.index({ category: 1, generatedAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
