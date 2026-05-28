const express = require('express');
const router = express.Router();
const {
  createFoodPost,
  getFoodPosts,
  getFoodPostById,
  updateFoodPost
} = require('../controllers/foodPostController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, createFoodPost)
  .get(protect, getFoodPosts);

router.route('/:id')
  .get(protect, getFoodPostById)
  .put(protect, updateFoodPost);

module.exports = router;
