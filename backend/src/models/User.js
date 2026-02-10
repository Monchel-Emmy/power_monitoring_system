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
        required: true
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
    buildings: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Building'
        }
    ]
});

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

module.exports = mongoose.model('User', userSchema);