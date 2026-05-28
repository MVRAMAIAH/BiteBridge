const Message = require('../models/Message');
const { getIO } = require('../services/socketService');

// @desc    Send a message (Room or Direct)
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
  const { roomId, receiverId, foodPostId, text } = req.body;

  if (!text || text.trim() === '') {
    return res.status(400).json({ success: false, message: 'Message text is required' });
  }

  try {
    const message = await Message.create({
      roomId: roomId || null,
      senderId: req.user.id,
      receiverId: receiverId || null,
      foodPostId: foodPostId || null,
      text
    });

    const populatedMsg = await Message.findById(message._id)
      .populate('senderId', 'name email profileImage');

    const io = getIO();
    if (io) {
      if (roomId) {
        // Broadcast to Room Channel
        io.to(roomId.toString()).emit('room_message', populatedMsg);
        console.log(`Socket broadcast room message to room ${roomId}`);
      } else if (receiverId) {
        // Direct messaging: send to receiver and sender sessions
        io.to(receiverId.toString()).emit('direct_message', populatedMsg);
        io.to(req.user.id.toString()).emit('direct_message', populatedMsg);
        console.log(`Socket broadcast DM from ${req.user.id} to ${receiverId}`);
      }
    }

    res.status(201).json({
      success: true,
      message: populatedMsg
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get room group chat logs
// @route   GET /api/messages/room/:roomId
// @access  Private
const getRoomMessages = async (req, res) => {
  const { roomId } = req.params;

  try {
    const messages = await Message.find({ roomId })
      .populate('senderId', 'name email profileImage')
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get direct logs with a cook/neighbor
// @route   GET /api/messages/direct/:peerId
// @access  Private
const getDirectMessages = async (req, res) => {
  const { peerId } = req.params;

  try {
    const messages = await Message.find({
      $or: [
        { senderId: req.user.id, receiverId: peerId },
        { senderId: peerId, receiverId: req.user.id }
      ]
    })
      .populate('senderId', 'name email profileImage')
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  sendMessage,
  getRoomMessages,
  getDirectMessages
};
