const mongoose = require('mongoose');

const FoodPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  quantity: {
    type: String,
    required: true // e.g. "2 bowls", "3 servings"
  },
  price: {
    type: Number,
    default: 0 // low cost sharing / free
  },
  availabilityTime: {
    type: Date,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    },
    cityName: {
      type: String,
      default: ''
    }
  },
  images: {
    type: [String],
    default: []
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    default: null
  },
  status: {
    type: String,
    enum: ['available', 'reserved', 'completed', 'expired'],
    default: 'available'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

FoodPostSchema.index({ 'location': '2dsphere' });

module.exports = mongoose.model('FoodPost', FoodPostSchema);
