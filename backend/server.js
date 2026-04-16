/**
 * Find Your Duo - Main Server Entry Point
 * Initializes Express, Socket.io, and all middleware
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const passport = require('passport');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const matchRoutes = require('./routes/matches');
const chatRoutes = require('./routes/chat');
const riotRoutes = require('./routes/riot');
const notificationRoutes = require('./routes/notifications');
const feedbackRoutes = require('./routes/feedback');
const { initializeSocket } = require('./socket/socketManager');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

// Trust the first proxy (required for Render — fixes IP-based rate limiting)
app.set('trust proxy', 1);

// ─── Allowed Origins ─────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  process.env.CLIENT_URL,
  'https://www.playpair.in',
  'https://playpair.in',
  'https://rank-sync.vercel.app',
  'http://localhost:3000',
].filter(Boolean);

const corsOrigin = (origin, cb) => {
  // Allow requests with no origin (mobile apps, curl, Render health checks)
  if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
  cb(new Error(`CORS: ${origin} not allowed`));
};

// ─── Socket.io Setup ────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
});

// Initialize socket handlers
initializeSocket(io);

// Make io accessible in routes
app.set('io', io);

// ─── Database Connection ─────────────────────────────────────────────────────
connectDB();

// ─── Rate Limiters ───────────────────────────────────────────────────────────
// General API: generous for 1000 users browsing normally
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down.' },
});

// Auth endpoints: stricter to block brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
});

// ─── Request Timeout ─────────────────────────────────────────────────────────
// Kill requests that hang for more than 30s to free up the connection pool
app.use((_req, res, next) => {
  res.setTimeout(30000, () => {
    res.status(503).json({ success: false, message: 'Request timed out.' });
  });
  next();
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(compression());
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { maxAge: '7d' }));
app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/riot', riotRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/feedback', feedbackRoutes);

// Root + Health check
app.get('/', (_req, res) => {
  res.json({ status: 'ok', app: 'PlayPair API', version: '1.0.0' });
});
app.get('/api/health', (_req, res) => {
  const dbState = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({
    status: 'ok',
    db: dbState[mongoose.connection.readyState] || 'unknown',
    timestamp: new Date().toISOString(),
  });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 PlayPair server running on port ${PORT}`);
  console.log(`📡 Socket.io ready for real-time events`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

// ─── Graceful Shutdown (Render SIGTERM) ───────────────────────────────────────
const shutdown = () => {
  console.log('\n🛑 SIGTERM received — shutting down gracefully');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed. Exiting.');
      process.exit(0);
    });
  });
  // Force exit after 10s if graceful close stalls
  setTimeout(() => process.exit(1), 10000);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = { app, server, io };
