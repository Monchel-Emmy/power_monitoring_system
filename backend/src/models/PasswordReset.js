const mongoose = require('mongoose');

const passwordResetSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  token: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
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
passwordResetSchema.index({ email: 1, isUsed: 1 });
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired documents

// Method to check if token is valid
passwordResetSchema.methods.isValid = function() {
  return !this.isUsed && this.expiresAt > new Date();
};

module.exports = mongoose.model('PasswordReset', passwordResetSchema);
