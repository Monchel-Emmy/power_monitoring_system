const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: function() {
            // Password is required unless user has Google ID
            return !this.googleId;
        }
    },
    role: {
        type: String,
        enum: ['admin', 'manager', 'user'],
        default: 'user'
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    status:{
        type:String,
        required:true,
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    googleId: {
        type: String,
        sparse: true, // Only index if present
    },
    avatar: {
        type: String,
        default: null,
    },
    buildings: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Building'
        }
    ]
});

userSchema.pre('save', async function () {
  // Only hash password if it exists and has been modified
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, 10);
});

module.exports = mongoose.model('User', userSchema);