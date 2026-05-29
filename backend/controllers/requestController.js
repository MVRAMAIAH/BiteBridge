const Request = require('../models/Request');
const FoodPost = require('../models/FoodPost');
const Notification = require('../models/Notification');
const Room = require('../models/Room');
const { getIO } = require('../services/socketService');

// @desc    Request a food post
// @route   POST /api/requests
// @access  Private
const createRequest = async (req, res) => {
  const { foodPostId, message, quantityRequested } = req.body;

  try {
    const post = await FoodPost.findById(foodPostId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Food post not found' });
    }

    if (post.status !== 'available') {
      return res.status(400).json({ success: false, message: 'Food is no longer available' });
    }

    if (post.createdBy.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot request your own food post' });
    }

    // Check if already requested
    const existing = await Request.findOne({ foodPostId, requesterId: req.user.id });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already requested this post' });
    }

    const request = await Request.create({
      foodPostId,
      requesterId: req.user.id,
      quantityRequested: quantityRequested || 1,
      message: message || ''
    });

    // Notify the creator of the food post
    const notif = await Notification.create({
      recipientId: post.createdBy,
      senderId: req.user.id,
      type: 'request_received',
      referenceId: request._id,
      onModel: 'Request',
      message: `${req.user.name} requested your food post "${post.title}"`
    });

    const io = getIO();
    if (io) {
      io.to(post.createdBy.toString()).emit('notification', notif);
    }

    res.status(201).json({
      success: true,
      request
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update request status (Accept / Reject)
// @route   PUT /api/requests/:id
// @access  Private
const updateRequestStatus = async (req, res) => {
  const { status } = req.body; // 'accepted' or 'rejected'

  try {
    const request = await Request.findById(req.id || req.params.id).populate('foodPostId');
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const post = request.foodPostId;

    // Authorization check: User must be either the creator of the post, or if the post is associated with a room, the room's admin
    let authorized = false;
    if (post.createdBy.toString() === req.user.id) {
      authorized = true;
    } else if (post.roomId) {
      const room = await Room.findById(post.roomId);
      if (room && room.adminId.toString() === req.user.id) {
        authorized = true;
      }
    }

    if (!authorized) {
      return res.status(403).json({ success: false, message: 'Not authorized to manage this request' });
    }

    request.status = status;
    await request.save();

    // If accepted, reserve the food post
    if (status === 'accepted') {
      post.status = 'reserved';
      await post.save();
    }

    // Create notification for requester
    const notif = await Notification.create({
      recipientId: request.requesterId,
      senderId: req.user.id,
      type: 'request_status',
      referenceId: request._id,
      onModel: 'Request',
      message: `Your request for "${post.title}" has been ${status}!`
    });

    const io = getIO();
    if (io) {
      io.to(request.requesterId.toString()).emit('notification', notif);
    }

    res.json({
      success: true,
      request
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get requests made to user's posts or room posts OR requests made BY the user
// @route   GET /api/requests
// @access  Private
const getRequests = async (req, res) => {
  const type = req.query.type; // 'incoming' or 'outgoing'

  try {
    if (type === 'incoming') {
      // Find food posts created by user, or if they are room admin, posts created by room
      const myPosts = await FoodPost.find({ createdBy: req.user.id });
      const postIds = myPosts.map(p => p._id);

      const requests = await Request.find({ foodPostId: { $in: postIds } })
        .populate('foodPostId')
        .populate('requesterId', 'name email profileImage location')
        .sort({ createdAt: -1 });

      return res.json({ success: true, requests });
    } else {
      // Outgoing requests
      const requests = await Request.find({ requesterId: req.user.id })
        .populate({
          path: 'foodPostId',
          populate: {
            path: 'createdBy',
            select: 'name email profileImage'
          }
        })
        .sort({ createdAt: -1 });

      return res.json({ success: true, requests });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Confirm exchange handover (Delivered / Received)
// @route   PUT /api/requests/:id/confirm
// @access  Private
const confirmHandover = async (req, res) => {
  const { action } = req.body; // 'delivered' or 'received'

  try {
    const request = await Request.findById(req.params.id).populate('foodPostId');
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const post = request.foodPostId;

    if (action === 'delivered') {
      // Must be the cook (creator of the post)
      if (post.createdBy.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Not authorized to confirm delivery' });
      }
      request.isDeliveredByCook = true;
    } else if (action === 'received') {
      // Must be the buyer (requester)
      if (request.requesterId.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Not authorized to confirm receipt' });
      }
      request.isReceivedByBuyer = true;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid confirmation action' });
    }

    // If both are true, automatically mark request as completed/accepted and foodPost as completed
    if (request.isDeliveredByCook && request.isReceivedByBuyer) {
      post.status = 'completed';
      await post.save();

      // Create notification for cook
      const notifCook = await Notification.create({
        recipientId: post.createdBy,
        senderId: request.requesterId,
        type: 'exchange_completed',
        referenceId: request._id,
        onModel: 'Request',
        message: `Your curry sharing of "${post.title}" is complete! Both confirmed delivery.`
      });

      // Create notification for buyer
      const notifBuyer = await Notification.create({
        recipientId: request.requesterId,
        senderId: post.createdBy,
        type: 'exchange_completed',
        referenceId: request._id,
        onModel: 'Request',
        message: `Exchange of "${post.title}" is completed! Enjoy your curry.`
      });

      const io = getIO();
      if (io) {
        io.to(post.createdBy.toString()).emit('notification', notifCook);
        io.to(request.requesterId.toString()).emit('notification', notifBuyer);
      }
    }

    await request.save();

    res.json({ success: true, request });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  createRequest,
  updateRequestStatus,
  getRequests,
  confirmHandover
};
