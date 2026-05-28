let io = null;

const initIO = (server) => {
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: {
      origin: '*', // Allow all origins for dev/testing ease
      methods: ['GET', 'POST', 'PUT']
    }
  });

  io.on('connection', (socket) => {
    // Authenticate and link user to socket via handshake query
    const userId = socket.handshake.query.userId;
    if (userId && userId !== 'undefined') {
      socket.join(userId);
      console.log(`User connected to Socket.io: User ID ${userId} (Socket ID: ${socket.id})`);
    } else {
      console.log(`Guest socket connected (Socket ID: ${socket.id})`);
    }

    // Room subscription for room-based group channels
    socket.on('join_room', (roomId) => {
      if (roomId) {
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined Room Channel: ${roomId}`);
      }
    });

    socket.on('leave_room', (roomId) => {
      if (roomId) {
        socket.leave(roomId);
        console.log(`Socket ${socket.id} left Room Channel: ${roomId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  return io;
};

module.exports = {
  initIO,
  getIO
};
