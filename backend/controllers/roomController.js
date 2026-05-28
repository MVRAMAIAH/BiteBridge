const Room = require('../models/Room');
const RoomMember = require('../models/RoomMember');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { getIO } = require('../services/socketService');

// Helper to generate unique room joining code
const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// @desc    Create a new Room
// @route   POST /api/rooms
// @access  Private
const createRoom = async (req, res) => {
  const { name, description, location } = req.body;

  try {
    const roomExists = await Room.findOne({ name });
    if (roomExists) {
      return res.status(400).json({ success: false, message: 'Room name already exists' });
    }

    const room = await Room.create({
      name,
      description,
      code: generateRoomCode(),
      adminId: req.user.id,
      location: {
        type: 'Point',
        coordinates: location?.coordinates || req.user.location.coordinates || [0, 0],
        cityName: location?.cityName || req.user.location.cityName || 'Not Set'
      }
    });

    // Automatically add admin as approved member
    await RoomMember.create({
      roomId: room._id,
      userId: req.user.id,
      status: 'approved'
    });

    // Update creator User to point to roomId
    await User.findByIdAndUpdate(req.user.id, { roomId: room._id });

    res.status(201).json({
      success: true,
      room
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Request to join a room by entering Room Code
// @route   POST /api/rooms/join
// @access  Private
const joinRoomByCode = async (req, res) => {
  const { code } = req.body;

  try {
    const room = await Room.findOne({ code });
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found with this code' });
    }

    // Check if already a member or pending request
    const existing = await RoomMember.findOne({ roomId: room._id, userId: req.user.id });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: existing.status === 'approved' ? 'Already in this room' : 'Join request already pending'
      });
    }

    // Create a pending member request
    const roomMember = await RoomMember.create({
      roomId: room._id,
      userId: req.user.id,
      status: 'pending'
    });

    // Notify the admin of the room
    const notif = await Notification.create({
      recipientId: room.adminId,
      senderId: req.user.id,
      type: 'room_join_request',
      referenceId: room._id,
      onModel: 'Room',
      message: `${req.user.name} requested to join room "${room.name}"`
    });

    // Trigger Socket.io real-time message to admin
    const io = getIO();
    if (io) {
      io.to(room.adminId.toString()).emit('notification', notif);
    }

    res.json({
      success: true,
      message: 'Join request sent successfully',
      roomMember
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Approve or Reject room join request
// @route   PUT /api/rooms/requests/:memberId
// @access  Private (Admin Only)
const manageJoinRequest = async (req, res) => {
  const { memberId } = req.params;
  const { status } = req.body; // 'approved' or 'rejected'

  try {
    const roomMember = await RoomMember.findById(memberId).populate('roomId');
    if (!roomMember) {
      return res.status(404).json({ success: false, message: 'Membership request not found' });
    }

    // Authenticate admin
    if (roomMember.roomId.adminId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized as room admin' });
    }

    if (status === 'approved') {
      roomMember.status = 'approved';
      await roomMember.save();

      // Update User object to associate roomId
      await User.findByIdAndUpdate(roomMember.userId, { roomId: roomMember.roomId._id });

      // Recalculate room rating
      const updateRoomRating = async (roomId) => {
        const approvedMembers = await RoomMember.find({ roomId, status: 'approved' });
        if (approvedMembers.length > 0) {
          const memberIds = approvedMembers.map(m => m.userId);
          const users = await User.find({ _id: { $in: memberIds }, averageRating: { $gt: 0 } });
          
          let average = 0;
          if (users.length > 0) {
            const sum = users.reduce((acc, u) => acc + u.averageRating, 0);
            average = parseFloat((sum / users.length).toFixed(1));
          }
          await Room.findByIdAndUpdate(roomId, { rating: average });
        }
      };
      await updateRoomRating(roomMember.roomId._id);

      // Notify the requester
      const notif = await Notification.create({
        recipientId: roomMember.userId,
        senderId: req.user.id,
        type: 'room_approval',
        referenceId: roomMember.roomId._id,
        onModel: 'Room',
        message: `Your request to join Room "${roomMember.roomId.name}" has been approved!`
      });

      const io = getIO();
      if (io) {
        io.to(roomMember.userId.toString()).emit('notification', notif);
      }
    } else {
      // Reject / delete member entry
      await RoomMember.findByIdAndDelete(memberId);
    }

    res.json({
      success: true,
      message: `Request successfully ${status === 'approved' ? 'approved' : 'rejected'}`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get details of a specific room (members, requests, active posts)
// @route   GET /api/rooms/:roomId
// @access  Private
const getRoomDetails = async (req, res) => {
  const { roomId } = req.params;

  try {
    const room = await Room.findById(roomId).populate('adminId', 'name email profileImage');
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    const members = await RoomMember.find({ roomId, status: 'approved' }).populate('userId', 'name email profileImage');
    const requests = await RoomMember.find({ roomId, status: 'pending' }).populate('userId', 'name email profileImage');

    res.json({
      success: true,
      room,
      members,
      requests
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all rooms (nearby first / search filter)
// @route   GET /api/rooms
// @access  Private
const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({}).populate('adminId', 'name email profileImage');
    res.json({ success: true, rooms });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Leave a Room
// @route   POST /api/rooms/leave
// @access  Private
const leaveRoom = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.roomId) {
      return res.status(400).json({ success: false, message: 'You are not in any room' });
    }

    const room = await Room.findById(user.roomId);
    if (room && room.adminId.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: 'Admin cannot leave the room' });
    }

    const activeRoomId = user.roomId;
    await RoomMember.findOneAndDelete({ roomId: user.roomId, userId: req.user.id });
    user.roomId = null;
    await user.save();

    // Recalculate room rating
    const updateRoomRating = async (roomId) => {
      const approvedMembers = await RoomMember.find({ roomId, status: 'approved' });
      if (approvedMembers.length > 0) {
        const memberIds = approvedMembers.map(m => m.userId);
        const users = await User.find({ _id: { $in: memberIds }, averageRating: { $gt: 0 } });
        
        let average = 0;
        if (users.length > 0) {
          const sum = users.reduce((acc, u) => acc + u.averageRating, 0);
          average = parseFloat((sum / users.length).toFixed(1));
        }
        await Room.findByIdAndUpdate(roomId, { rating: average });
      } else {
        await Room.findByIdAndUpdate(roomId, { rating: 0 });
      }
    };
    await updateRoomRating(activeRoomId);

    res.json({ success: true, message: 'Left room successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  createRoom,
  joinRoomByCode,
  manageJoinRequest,
  getRoomDetails,
  getRooms,
  leaveRoom
};
