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

    const isProvider = foodPost.createdBy.toString() === req.user.id;

    // Find the accepted request for this food post
    const transactionRequest = await Request.findOne({
      foodPostId,
      status: 'accepted'
    });

    if (!transactionRequest) {
      return res.status(400).json({
        success: false,
        message: 'No accepted request found for this food post. Cannot submit rating.'
      });
    }

    let authorized = false;
    let targetUserId = null;

    if (isProvider) {
      authorized = true;
      targetUserId = transactionRequest.requesterId;
    } else if (transactionRequest.requesterId.toString() === req.user.id) {
      authorized = true;
      targetUserId = foodPost.createdBy;
    }

    if (!authorized) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to submit a rating for this exchange'
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
      targetUserId,
      rating,
      comment: comment || ''
    });

    // Recalculate average ratings for the target user who was rated
    const ratedRatings = await Rating.find({
      $or: [
        { targetUserId },
        { providerId: targetUserId, targetUserId: { $exists: false } }
      ]
    });
    const totalRatings = ratedRatings.length;
    const sumRatings = ratedRatings.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRatings > 0 ? parseFloat((sumRatings / totalRatings).toFixed(1)) : 0;

    const ratedUser = await User.findByIdAndUpdate(targetUserId, {
      averageRating,
      totalRatings
    }, { new: true });

    // Update Room Rating if the rated user is in a room group
    if (ratedUser && ratedUser.roomId) {
      const RoomMember = require('../models/RoomMember');
      const Room = require('../models/Room');
      
      const approvedMembers = await RoomMember.find({ roomId: ratedUser.roomId, status: 'approved' });
      if (approvedMembers.length > 0) {
        const memberIds = approvedMembers.map(m => m.userId);
        const users = await User.find({ _id: { $in: memberIds }, averageRating: { $gt: 0 } });
        
        let average = 0;
        if (users.length > 0) {
          const sum = users.reduce((acc, u) => acc + u.averageRating, 0);
          average = parseFloat((sum / users.length).toFixed(1));
        }
        await Room.findByIdAndUpdate(ratedUser.roomId, { rating: average });
      }
    }

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
