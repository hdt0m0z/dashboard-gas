const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // For development, allow all origins
    }
  });

  // JWT Middleware for Socket Authentication
  io.use((socket, next) => {
    // Client should send token like `io('url', { auth: { token: 'JWT_TOKEN_HERE' } })`
    const token = socket.handshake.auth.token || socket.handshake.headers['token'];
    
    if (!token) {
      return next(new Error('Authentication Error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // Store socket owner's information
      next();
    } catch (err) {
      return next(new Error('Authentication Error: Invalid token'));
    }
  });

  // Connection Handler
  io.on('connection', (socket) => {
    console.log(`[Socket.io] Connected: ${socket.id} (User ID: ${socket.user.id})`);

    // Listen for room joining requests
    socket.on('join_device', (deviceId) => {
      // Join a standard socket room matching the deviceId
      socket.join(deviceId);
      console.log(`[Socket.io] Socket ${socket.id} joined room: ${deviceId}`);
    });

    // Listen for room departing requests
    socket.on('leave_device', (deviceId) => {
      socket.leave(deviceId);
      console.log(`[Socket.io] Socket ${socket.id} left room: ${deviceId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Disconnected: ${socket.id}`);
    });
  });
};

// Expose a broadcasting mechanism
const broadcastToRoom = (roomId, eventName, data) => {
  if (io) {
    io.to(roomId).emit(eventName, data);
  } else {
    console.warn('Socket.io instances are not initialized yet.');
  }
};

const broadcastToAll = (eventName, data) => {
  if (io) {
    io.emit(eventName, data);
  }
};

module.exports = {
  initSocket,
  broadcastToRoom,
  broadcastToAll
};
