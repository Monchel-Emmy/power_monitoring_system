const mongoose = require('mongoose');

const emailVerificationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  code: {
    type: String,
    required: true,
    length: 6,
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient queries and automatic cleanup
emailVerificationSchema.index({ email: 1, isUsed: 1 });
emailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired documents

// Method to check if code is valid
emailVerificationSchema.methods.isValid = function() {
  return !this.isUsed && this.expiresAt > new Date();
};

module.exports = mongoose.model('EmailVerification', emailVerificationSchema);
