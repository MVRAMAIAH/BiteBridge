const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  profileImage: {
    type: String,
    default: ''
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0] // [longitude, latitude]
    },
    cityName: {
      type: String,
      default: ''
    }
  },
  languagePreference: {
    type: String,
    enum: ['en', 'te', 'hi', 'ta'],
    default: 'en'
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// index for geo-spatial queries
UserSchema.index({ 'location': '2dsphere' });

module.exports = mongoose.model('User', UserSchema);
