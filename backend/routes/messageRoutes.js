const express = require('express');
const router = express.Router();
const { sendMessage, getRoomMessages, getDirectMessages } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, sendMessage);
router.get('/room/:roomId', protect, getRoomMessages);
router.get('/direct/:peerId', protect, getDirectMessages);

module.exports = router;
