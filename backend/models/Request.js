const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
  foodPostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoodPost',
    required: true
  },
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quantityRequested: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  message: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Request', RequestSchema);
