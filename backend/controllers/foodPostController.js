const FoodPost = require('../models/FoodPost');
const User = require('../models/User');
const Notification = require('../models/Notification');
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

    // Real-time broadcast: Find nearby users (within 10km) and notify them
    const coordinates = foodPost.location.coordinates;
    const io = getIO();

    if (io && coordinates && coordinates[0] !== 0) {
      // Find nearby users
      const nearbyUsers = await User.find({
        _id: { $ne: req.user.id },
        'location.coordinates': { $ne: [0, 0] },
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: coordinates
            },
            $maxDistance: 10000 // 10 km
          }
        }
      });

      // Send notifications to all nearby users
      for (const u of nearbyUsers) {
        const notif = await Notification.create({
          recipientId: u._id,
          senderId: req.user.id,
          type: 'new_food_post_nearby',
          referenceId: foodPost._id,
          onModel: 'FoodPost',
          message: `New Curry/Food posted nearby: "${foodPost.title}"`
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

      return res.json({
        success: true,
        count: posts.length,
        total,
        page,
        pages: Math.ceil(total / limit),
        foodPosts: posts
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

    res.json({
      success: true,
      count: posts.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      foodPosts: posts
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

    res.json({ success: true, foodPost: post });
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

module.exports = {
  createFoodPost,
  getFoodPosts,
  getFoodPostById,
  updateFoodPost
};
