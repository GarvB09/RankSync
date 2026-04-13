/**
 * Auth Controller
 * Handles registration, login, OAuth, and session management
 */

const User = require('../models/User');
const { validationResult } = require('express-validator');

// ─── Helper: Send token response ─────────────────────────────────────────────
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      token,
      user: user.toPublicProfile(),
    });
};

// ─── @POST /api/auth/register ─────────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { username, email, password } = req.body;

    // Check for existing user
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'username';
      return res.status(400).json({
        success: false,
        message: `An account with this ${field} already exists`,
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      authProvider: 'local',
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// ─── @POST /api/auth/login ────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check OAuth-only accounts
    if (user.authProvider === 'google' && !user.password) {
      return res.status(401).json({
        success: false,
        message: 'Please sign in with Google for this account',
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Update online status (use findByIdAndUpdate to avoid triggering pre-save password rehash)
    await User.findByIdAndUpdate(user._id, { isOnline: true, lastSeen: Date.now() });

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// ─── @GET /api/auth/me ────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.id)
    .populate('connections', 'username avatar rank region isOnline')
    .populate('sentRequests', 'username avatar rank region')
    .populate('receivedRequests', 'username avatar rank region');

  res.json({ success: true, user: user.toPublicProfile() });
};

// ─── @POST /api/auth/logout ───────────────────────────────────────────────────
exports.logout = async (req, res, next) => {
  try {
    // Set offline
    await User.findByIdAndUpdate(req.user.id, {
      isOnline: false,
      lastSeen: Date.now(),
    });

    res
      .cookie('token', 'none', { expires: new Date(Date.now() + 10 * 1000), httpOnly: true })
      .json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// ─── @GET /api/auth/google/callback ──────────────────────────────────────────
exports.googleCallback = async (req, res) => {
  // Passport attaches user after OAuth success
  try {
    const token = req.user.getSignedJwtToken();
    const clientURL = process.env.CLIENT_URL || 'http://localhost:3000';

    // Redirect to frontend with token
    res.redirect(`${clientURL}/auth/oauth-success?token=${token}`);
  } catch (error) {
    const clientURL = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(`${clientURL}/login?error=oauth_failed`);
  }
};
