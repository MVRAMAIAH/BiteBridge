const express = require('express');
const router = express.Router();
const {
  createRoom,
  joinRoomByCode,
  manageJoinRequest,
  getRoomDetails,
  getRooms,
  leaveRoom
} = require('../controllers/roomController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, createRoom)
  .get(protect, getRooms);

router.post('/join', protect, joinRoomByCode);
router.post('/leave', protect, leaveRoom);
router.put('/requests/:memberId', protect, manageJoinRequest);
router.get('/:roomId', protect, getRoomDetails);

module.exports = router;
