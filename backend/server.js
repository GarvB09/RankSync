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
const slowDown = require('express-slow-down');
const mongoSanitize = require('express-mongo-sanitize');
const passport = require('passport');
const path = require('path');
require('dotenv').config();

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set. Refusing to start.');
  process.exit(1);
}

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
  'http://localhost:5173',
].filter(Boolean);

const corsOrigin = (origin, cb) => {
  if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
  cb(new Error(`CORS: ${origin} not allowed`));
};

// ─── Socket.io Setup ─────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: corsOrigin, methods: ['GET', 'POST'], credentials: true },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
  // Limit socket payload size
  maxHttpBufferSize: 1e6, // 1MB
});

initializeSocket(io);
app.set('io', io);

// ─── Database Connection ──────────────────────────────────────────────────────
connectDB();

// ─── Rate Limiters ────────────────────────────────────────────────────────────

// General API — generous baseline for browsing
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down.' },
  skip: (req) => req.path === '/health', // never limit health checks
});

// Auth — tight to block brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
});

// Find Duo — browsing is expensive (DB query + population)
const findDuoLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Browsing too fast. Please wait a moment.' },
});

// Duo requests — prevent spam connecting
const requestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many duo requests sent. Try again in an hour.' },
});

// Chat start — prevent spamming conversations
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many chat actions. Please slow down.' },
});

// Feedback submit — 5 per hour is plenty
const feedbackLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many feedback submissions.' },
});

// ─── Slow-down (gradual, not hard block) ─────────────────────────────────────
// After 50 requests in 15 min, add +100ms delay per extra request (up to 2s)
const apiSlowDown = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 50,
  delayMs: (used) => (used - 50) * 100,
  maxDelayMs: 2000,
  skip: (req) => req.path === '/health',
});

// ─── Request Timeout ──────────────────────────────────────────────────────────
app.use((_req, res, next) => {
  res.setTimeout(30000, () => {
    if (!res.headersSent) {
      res.status(503).json({ success: false, message: 'Request timed out. Please try again.' });
    }
  });
  next();
});

// ─── Core Middleware ──────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false, // Managed by Vercel for the frontend
}));
app.use(compression());
app.use(cors({ origin: corsOrigin, credentials: true }));

// Strip MongoDB operators ($, .) from all incoming data to block NoSQL injection
app.use(mongoSanitize({
  replaceWith: '_',
  allowDots: false,
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '2mb' })); // was 10mb — no endpoint needs more than 2mb
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());
app.use(passport.initialize());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { maxAge: '7d' }));

// Apply general rate limit + slow-down to all /api routes
app.use('/api/', generalLimiter);
app.use('/api/', apiSlowDown);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/chat', chatLimiter, chatRoutes);
app.use('/api/riot', riotRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/feedback', feedbackRoutes);

// Per-action rate limits applied directly on the routes that need them
// (find-duo browsing and duo request sending)
app.use('/api/users/find-duo', findDuoLimiter);
app.use('/api/users/request', requestLimiter);
app.use('/api/feedback', feedbackLimiter);

// ─── Health check & root ──────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({ status: 'ok', app: 'PlayPair API', version: '1.0.0' });
});

app.get('/api/health', (_req, res) => {
  const dbState = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const memMB = Math.round(process.memoryUsage().rss / 1024 / 1024);
  res.json({
    status: 'ok',
    db: dbState[mongoose.connection.readyState] || 'unknown',
    memory: `${memMB}MB`,
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// 404 for unknown API routes
app.use('/api/*', (_req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found.' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 PlayPair server running on port ${PORT}`);
  console.log(`📡 Socket.io ready`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🛡️  Rate limiting, slow-down, and NoSQL sanitization active\n`);
});

// ─── Graceful Shutdown (Render SIGTERM) ───────────────────────────────────────
const shutdown = (signal) => {
  console.log(`\n🛑 ${signal} received — shutting down gracefully`);
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed. Exiting.');
      process.exit(0);
    });
  });
  setTimeout(() => process.exit(1), 10000);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// Log uncaught exceptions instead of silently crashing
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err.message, err.stack);
  shutdown('uncaughtException');
});
process.on('unhandledRejection', (reason) => {
  console.error('💥 Unhandled Rejection:', reason);
});

module.exports = { app, server, io };
