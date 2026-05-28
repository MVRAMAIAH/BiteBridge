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

      if (req.body.location) {
        user.location = {
          type: 'Point',
          coordinates: req.body.location.coordinates || user.location.coordinates,
          cityName: req.body.location.cityName || user.location.cityName
        };
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

module.exports = {
  googleLogin,
  getUserProfile,
  updateUserProfile
};
