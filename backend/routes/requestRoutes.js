const express = require('express');
const router = express.Router();
const {
  createRequest,
  updateRequestStatus,
  getRequests,
  confirmHandover
} = require('../controllers/requestController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, createRequest)
  .get(protect, getRequests);

router.route('/:id')
  .put(protect, updateRequestStatus);

router.route('/:id/confirm')
  .put(protect, confirmHandover);

module.exports = router;
