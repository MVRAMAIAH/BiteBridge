const express = require('express');
const router = express.Router();
const {
  createFoodPost,
  getFoodPosts,
  getFoodPostById,
  updateFoodPost,
  getPublicFoodPosts,
  deleteFoodPost
} = require('../controllers/foodPostController');
const { protect } = require('../middleware/authMiddleware');
const { rateFoodPost, getMyRatingForFoodPost } = require('../controllers/ratingController');

router.get('/public', getPublicFoodPosts);

router.route('/')
  .post(protect, createFoodPost)
  .get(protect, getFoodPosts);

router.route('/:id')
  .get(protect, getFoodPostById)
  .put(protect, updateFoodPost)
  .delete(protect, deleteFoodPost);

router.route('/:foodPostId/rate')
  .post(protect, rateFoodPost);

router.route('/:foodPostId/my-rating')
  .get(protect, getMyRatingForFoodPost);

module.exports = router;
