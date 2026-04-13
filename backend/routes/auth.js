/**
 * Auth Routes
 */

const express = require('express');
const { body } = require('express-validator');
const passport = require('passport');
const router = express.Router();

const { register, login, getMe, logout, googleCallback } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Passport Google Strategy setup (inline for simplicity)
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || 'mock_client_id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock_secret',
      callbackURL: process.env.NODE_ENV === 'production'
        ? process.env.GOOGLE_CALLBACK_URL
        : 'http://localhost:5000/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // Check if email already registered
          user = await User.findOne({ email: profile.emails[0].value });
          if (user) {
            user.googleId = profile.id;
            user.authProvider = 'google';
            await user.save();
          } else {
            // Create new user from Google profile
            const baseUsername = profile.displayName.replace(/\s+/g, '_').toLowerCase().slice(0, 15);
            let username = baseUsername;
            let counter = 1;
            while (await User.findOne({ username })) {
              username = `${baseUsername}${counter++}`;
            }

            user = await User.create({
              username,
              email: profile.emails[0].value,
              googleId: profile.id,
              authProvider: 'google',
              avatar: profile.photos[0]?.value || null,
            });
          }
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

// ─── Validation Rules ─────────────────────────────────────────────────────────
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be 3-20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

// ─── Routes ───────────────────────────────────────────────────────────────────
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  googleCallback
);

module.exports = router;
