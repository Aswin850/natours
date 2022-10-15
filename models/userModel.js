const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'User must have a name'],
    maxlength: [40, 'The name should not be greater than 40 character'],
    minlenght: [1, 'The name must be greater than 1 character']
  },
  email: {
    type: String,
    required: [true, 'User must have a email'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'Please fill a valid email address']
  },
  photo: {
    type: String,
    default: 'default.jpg'
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'User must have a password'],
    minlenght: 8,
    select: false
  },
  passwordConfim: {
    type: String,
    required: [true, 'User must have a password'],
    validate: {
      validator: function(passwordConfimValue) {
        return passwordConfimValue === this.password;
      },
      message: 'The password and confirm  password does not match'
    }
  },
  passwordChangedAt: {
    type: Date
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

// Middleware
userSchema.pre('save', async function(next) {
  // Only if password is modified
  if (!this.isModified('password')) return next();
  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  // Delete Password confirm field
  this.passwordConfim = undefined;
  next();
});

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function(next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    // ChangedTimeStamp-At what time the password have changed
    // JWTTimestamp-Token issued time
    return JWTTimestamp < changedTimeStamp;
  }
  // The password have not changed
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
