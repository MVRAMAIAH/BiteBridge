const FoodPost = require('../models/FoodPost');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Request = require('../models/Request');
const { getIO } = require('../services/socketService');

// @desc    Create a new Food Post
// @route   POST /api/food
// @access  Private
const createFoodPost = async (req, res) => {
  const { title, description, quantity, price, availabilityTime, location, images } = req.body;

  try {
    // Check if user belongs to an approved room
    const user = await User.findById(req.user.id);
    const roomId = user.roomId || null;

    const foodPost = await FoodPost.create({
      title,
      description,
      quantity,
      price: price || 0,
      availabilityTime: availabilityTime || new Date(Date.now() + 4 * 60 * 60 * 1000), // Default 4 hours
      location: {
        type: 'Point',
        coordinates: location?.coordinates || user.location.coordinates || [0, 0],
        cityName: location?.cityName || user.location.cityName || 'Not Set'
      },
      images: images || [],
      createdBy: req.user.id,
      roomId
    });

    // Populate creator and room info for real-time notification broadcast
    const populatedPost = await FoodPost.findById(foodPost._id)
      .populate('createdBy', 'name email profileImage')
      .populate('roomId', 'name');

    // Real-time broadcast: Find nearby users (within 1km) and room members
    const coordinates = foodPost.location.coordinates;
    const io = getIO();

    if (io && coordinates && coordinates[0] !== 0) {
      // 1. Find nearby users (within 1km)
      const nearbyUsers = await User.find({
        _id: { $ne: req.user.id },
        'location.coordinates': { $ne: [0, 0] },
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: coordinates
            },
            $maxDistance: 1000 // 1 km
          }
        }
      });

      // 2. Find approved roommates in the same room group
      let roommates = [];
      if (roomId) {
        const RoomMember = require('../models/RoomMember');
        const approvedMembers = await RoomMember.find({ roomId, status: 'approved' });
        const memberIds = approvedMembers
          .map(m => m.userId.toString())
          .filter(id => id !== req.user.id);
        roommates = await User.find({ _id: { $in: memberIds } });
      }

      // Merge and deduplicate recipients list
      const recipientsMap = {};
      nearbyUsers.forEach(u => { recipientsMap[u._id.toString()] = u; });
      roommates.forEach(u => { recipientsMap[u._id.toString()] = u; });
      const recipients = Object.values(recipientsMap);

      // Send notifications to all qualified recipients
      for (const u of recipients) {
        const notif = await Notification.create({
          recipientId: u._id,
          senderId: req.user.id,
          type: 'new_food_post_nearby',
          referenceId: foodPost._id,
          onModel: 'FoodPost',
          message: `New Curry/Food posted in your room group or nearby: "${foodPost.title}"`
        });
        
        io.to(u._id.toString()).emit('notification', notif);
      }
    }

    res.status(201).json({
      success: true,
      foodPost: populatedPost
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all Food Posts (with geolocation sorting and pagination)
// @route   GET /api/food
// @access  Private
const getFoodPosts = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const maxDistance = parseInt(req.query.maxDistance) || 10000; // default 10km

  try {
    let query = { status: 'available' };

    // If geographic search criteria is provided, sort by distance
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat] // MongoDB requires [longitude, latitude]
          },
          $maxDistance: maxDistance
        }
      };

      const posts = await FoodPost.find(query)
        .populate('createdBy', 'name email profileImage')
        .populate('roomId', 'name')
        .skip(skip)
        .limit(limit);

      const total = await FoodPost.countDocuments({ status: 'available' }); // total count for pagination info

      // Fetch requester status
      const postIds = posts.map(p => p._id);
      const userRequests = await Request.find({
        foodPostId: { $in: postIds },
        requesterId: req.user.id
      });
      const requestedPostIds = new Set(userRequests.map(r => r.foodPostId.toString()));

      const postsWithRequestedField = posts.map(p => {
        const pObj = p.toObject();
        pObj.hasRequested = requestedPostIds.has(p._id.toString());
        return pObj;
      });

      return res.json({
        success: true,
        count: posts.length,
        total,
        page,
        pages: Math.ceil(total / limit),
        foodPosts: postsWithRequestedField
      });
    }

    // Default: Sort by creation date
    const posts = await FoodPost.find({ status: 'available' })
      .populate('createdBy', 'name email profileImage')
      .populate('roomId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await FoodPost.countDocuments({ status: 'available' });

    // Fetch requester status
    const postIds = posts.map(p => p._id);
    const userRequests = await Request.find({
      foodPostId: { $in: postIds },
      requesterId: req.user.id
    });
    const requestedPostIds = new Set(userRequests.map(r => r.foodPostId.toString()));

    const postsWithRequestedField = posts.map(p => {
      const pObj = p.toObject();
      pObj.hasRequested = requestedPostIds.has(p._id.toString());
      return pObj;
    });

    res.json({
      success: true,
      count: posts.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      foodPosts: postsWithRequestedField
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get individual food post by ID
// @route   GET /api/food/:id
// @access  Private
const getFoodPostById = async (req, res) => {
  try {
    const post = await FoodPost.findById(req.params.id)
      .populate('createdBy', 'name email profileImage')
      .populate('roomId', 'name');

    if (!post) {
      return res.status(404).json({ success: false, message: 'Food post not found' });
    }

    // Check if user has already requested this post
    const existingRequest = await Request.findOne({
      foodPostId: post._id,
      requesterId: req.user.id
    });

    const postObj = post.toObject();
    postObj.hasRequested = !!existingRequest;

    res.json({ success: true, foodPost: postObj });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update Food Post / Mark Reserved or Completed
// @route   PUT /api/food/:id
// @access  Private
const updateFoodPost = async (req, res) => {
  const { status } = req.body;

  try {
    const post = await FoodPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Food post not found' });
    }

    // Auth validation
    if (post.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    post.status = status || post.status;
    await post.save();

    res.json({ success: true, foodPost: post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get public food posts count and recent listings
// @route   GET /api/food/public
// @access  Public
const getPublicFoodPosts = async (req, res) => {
  try {
    const totalFoodCount = await FoodPost.countDocuments({});
    const availablePosts = await FoodPost.find({ status: 'available' })
      .populate('createdBy', 'name email profileImage')
      .populate('roomId', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      totalFoodCount,
      foodPosts: availablePosts
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  createFoodPost,
  getFoodPosts,
  getFoodPostById,
  updateFoodPost,
  getPublicFoodPosts
};
