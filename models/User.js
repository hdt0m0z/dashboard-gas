const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    // Password is not required if the user signed up with Google OAuth
    required: function() {
      return !this.googleId;
    }
  },
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    default: ""
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },

  googleId: {
    type: String,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
