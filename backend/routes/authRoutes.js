const express = require('express');
const router = express.Router();
const { googleLogin, getUserProfile, updateUserProfile, getNearbyUsers } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/google', googleLogin);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.get('/nearby-users', protect, getNearbyUsers);

module.exports = router;
