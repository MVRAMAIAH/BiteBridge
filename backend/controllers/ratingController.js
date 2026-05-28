const Rating = require('../models/Rating');
const User = require('../models/User');
const Request = require('../models/Request');
const FoodPost = require('../models/FoodPost');

// @desc    Rate a food post / provider
// @route   POST /api/food/:foodPostId/rate
// @access  Private
const rateFoodPost = async (req, res) => {
  const { foodPostId } = req.params;
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: 'Please provide a valid rating between 1 and 5' });
  }

  try {
    const foodPost = await FoodPost.findById(foodPostId);
    if (!foodPost) {
      return res.status(404).json({ success: false, message: 'Food post not found' });
    }

    // Verify user was the requester of an accepted or completed transaction
    const transactionRequest = await Request.findOne({
      foodPostId,
      requesterId: req.user.id,
      status: 'accepted'
    });

    if (!transactionRequest && foodPost.status !== 'completed' && foodPost.status !== 'reserved') {
      return res.status(403).json({
        success: false,
        message: 'You can only rate food posts that you have successfully requested'
      });
    }

    // Check if user has already reviewed this food post
    const existingRating = await Rating.findOne({ foodPostId, raterId: req.user.id });
    if (existingRating) {
      return res.status(400).json({ success: false, message: 'You have already rated this food post' });
    }

    // Create the rating
    const newRating = await Rating.create({
      foodPostId,
      raterId: req.user.id,
      providerId: foodPost.createdBy,
      rating,
      comment: comment || ''
    });

    // Recalculate provider user profile average ratings
    const providerId = foodPost.createdBy;
    const providerRatings = await Rating.find({ providerId });
    const totalRatings = providerRatings.length;
    const sumRatings = providerRatings.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRatings > 0 ? parseFloat((sumRatings / totalRatings).toFixed(1)) : 0;

    await User.findByIdAndUpdate(providerId, {
      averageRating,
      totalRatings
    });

    res.status(201).json({
      success: true,
      message: 'Rating submitted successfully',
      rating: newRating
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error occurred' });
  }
};

const getMyRatingForFoodPost = async (req, res) => {
  const { foodPostId } = req.params;

  try {
    const rating = await Rating.findOne({ foodPostId, raterId: req.user.id });
    res.json({
      success: true,
      rated: !!rating,
      rating
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  rateFoodPost,
  getMyRatingForFoodPost
};
