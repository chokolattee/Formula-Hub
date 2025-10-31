const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        default: 'user'
    },
    status: {
        type: String,
        required: true,
        default: 'active'
    },
    first_name: {
        type: String,
        required: false,
        default: ''
    },
    last_name: {
        type: String,
        required: false,
        default: ''
    },
    birthday: {
        type: String,
        required: false,
        default: ''
    },
    gender: {
        type: String,
        required: false,
        default: ''
    },
    avatar: [
        {
            public_id: {
                type: String,
                required: true
            },
            url: {
                type: String,
                required: true
            }
        }
    ],
    resetPasswordToken: String,
    resetPasswordExpire: Date
}, {
    timestamps: true,
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next()
    }
    this.password = await bcrypt.hash(this.password, 10)
});

userSchema.methods.getJwtToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_TIME
    });
}

userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password)
}

userSchema.methods.getResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(20).toString('hex');
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    this.resetPasswordExpire = Date.now() + 30 * 60 * 1000
    return resetToken
}

module.exports = mongoose.model('User', userSchema);