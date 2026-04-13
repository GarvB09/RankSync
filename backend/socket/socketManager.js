/**
 * Socket.io Manager
 * Handles real-time events: presence, messaging, notifications
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Track connected users: userId -> Set of socketIds
const onlineUsers = new Map();

/**
 * Authenticate socket connection via JWT
 */
const authenticateSocket = async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) return next(new Error('Authentication required'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = await User.findById(decoded.id).select('username avatar rank isOnline');

    if (!user) return next(new Error('User not found'));

    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
};

/**
 * Initialize all socket event handlers
 */
const initializeSocket = (io) => {
  // Apply auth middleware to all connections
  io.use(authenticateSocket);

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    console.log(`🔌 Socket connected: ${socket.user.username} (${socket.id})`);

    // ── Join personal room for targeted events ────────────────────────────
    socket.join(`user:${userId}`);

    // ── Track online presence ─────────────────────────────────────────────
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Mark user online in DB
    await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: Date.now() });

    // Broadcast online status to all connected users
    socket.broadcast.emit('user_online', { userId, username: socket.user.username });

    // ── Join conversation rooms ───────────────────────────────────────────
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // ── Typing indicators ─────────────────────────────────────────────────
    socket.on('typing_start', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing', {
        userId,
        username: socket.user.username,
        conversationId,
      });
    });

    socket.on('typing_stop', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('stop_typing', {
        userId,
        conversationId,
      });
    });

    // ── Real-time message relay (for instant delivery before REST confirms) ──
    socket.on('send_message', ({ conversationId, content, tempId }) => {
      // Echo to other participants in the conversation room
      socket.to(`conversation:${conversationId}`).emit('message_received', {
        conversationId,
        content,
        sender: { _id: userId, username: socket.user.username, avatar: socket.user.avatar },
        tempId,
        createdAt: new Date().toISOString(),
      });
    });

    // ── Ping / heartbeat ──────────────────────────────────────────────────
    socket.on('ping', () => socket.emit('pong'));

    // ── Disconnection ─────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`🔌 Socket disconnected: ${socket.user.username} (${socket.id})`);

      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          // No more active connections — user is truly offline
          onlineUsers.delete(userId);
          await User.findByIdAndUpdate(userId, {
            isOnline: false,
            lastSeen: Date.now(),
          });
          socket.broadcast.emit('user_offline', { userId });
        }
      }
    });
  });

  // Utility: get list of online user IDs
  io.getOnlineUsers = () => Array.from(onlineUsers.keys());
};

module.exports = { initializeSocket, onlineUsers };
