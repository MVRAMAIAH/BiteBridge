const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema({
  foodPostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoodPost',
    required: true
  },
  raterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true // The owner of the food post (cook/provider)
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Enforce unique review per user per food post
RatingSchema.index({ foodPostId: 1, raterId: 1 }, { unique: true });

module.exports = mongoose.model('Rating', RatingSchema);
