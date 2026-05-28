const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'currycirclejwtsecret12345', {
    expiresIn: '30d'
  });
};

// @desc    Auth user / create user from Google profile
// @route   POST /api/auth/google
// @access  Public
const googleLogin = async (req, res) => {
  const { name, email, profileImage, location } = req.body;

  try {
    let user = await User.findOne({ email });

    if (user) {
      // Update existing user details if changed
      if (name) user.name = name;
      if (profileImage) user.profileImage = profileImage;
      if (location) {
        user.location = {
          type: 'Point',
          coordinates: location.coordinates || user.location.coordinates,
          cityName: location.cityName || user.location.cityName
        };
      }
      await user.save();
    } else {
      // Create new user
      user = await User.create({
        name,
        email,
        profileImage: profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
        location: {
          type: 'Point',
          coordinates: location?.coordinates || [0, 0],
          cityName: location?.cityName || 'Not Set'
        },
        languagePreference: 'en'
      });
    }

    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        location: user.location,
        languagePreference: user.languagePreference,
        mobileNumber: user.mobileNumber,
        address: user.address,
        averageRating: user.averageRating,
        totalRatings: user.totalRatings,
        isProfileComplete: user.isProfileComplete,
        roomId: user.roomId
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error during authentication' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('roomId');
    if (user) {
      res.json({
        success: true,
        user
      });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update user profile / location / language
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user) {
      user.name = req.body.name || user.name;
      user.languagePreference = req.body.languagePreference || user.languagePreference;
      user.mobileNumber = req.body.mobileNumber !== undefined ? req.body.mobileNumber : user.mobileNumber;
      user.address = req.body.address !== undefined ? req.body.address : user.address;

      if (req.body.location) {
        user.location = {
          type: 'Point',
          coordinates: req.body.location.coordinates || user.location.coordinates,
          cityName: req.body.location.cityName || user.location.cityName
        };
      }

      // Automatically evaluate profile completion
      if (user.name && user.mobileNumber && user.address) {
        user.isProfileComplete = true;
      }

      const updatedUser = await user.save();
      res.json({
        success: true,
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          profileImage: updatedUser.profileImage,
          location: updatedUser.location,
          languagePreference: updatedUser.languagePreference,
          mobileNumber: updatedUser.mobileNumber,
          address: updatedUser.address,
          averageRating: updatedUser.averageRating,
          totalRatings: updatedUser.totalRatings,
          isProfileComplete: updatedUser.isProfileComplete,
          roomId: updatedUser.roomId
        }
      });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get nearby active users
// @route   GET /api/auth/nearby-users
// @access  Private
const getNearbyUsers = async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const maxDistance = parseInt(req.query.maxDistance) || 1000; // default 1km

  if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
    return res.status(400).json({ success: false, message: 'Please provide valid latitude and longitude coordinates' });
  }

  try {
    const nearby = await User.find({
      _id: { $ne: req.user.id },
      'location.coordinates': { $ne: [0, 0] },
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: maxDistance
        }
      }
    }).select('name email profileImage location averageRating');

    res.json({
      success: true,
      count: nearby.length,
      users: nearby
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  googleLogin,
  getUserProfile,
  updateUserProfile,
  getNearbyUsers
};
