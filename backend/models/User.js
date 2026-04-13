/**
 * User Model
 * Core schema for all registered players
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ─── Constants ────────────────────────────────────────────────────────────────
const RANKS = [
  'Iron 1', 'Iron 2', 'Iron 3',
  'Bronze 1', 'Bronze 2', 'Bronze 3',
  'Silver 1', 'Silver 2', 'Silver 3',
  'Gold 1', 'Gold 2', 'Gold 3',
  'Platinum 1', 'Platinum 2', 'Platinum 3',
  'Diamond 1', 'Diamond 2', 'Diamond 3',
  'Ascendant 1', 'Ascendant 2', 'Ascendant 3',
  'Immortal 1', 'Immortal 2', 'Immortal 3',
  'Radiant',
];

const REGIONS = ['NA', 'EU', 'AP', 'KR', 'BR', 'LATAM'];
const ROLES = ['Duelist', 'Controller', 'Initiator', 'Sentinel', 'Flex'];
const PLAYSTYLES = ['Competitive', 'Casual', 'Aggressive', 'Chill', 'Tactical', 'IGL'];

// ─── Schema ───────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    // Basic Auth Info
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [20, 'Username cannot exceed 20 characters'],
      match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Never return password in queries
    },
    avatar: {
      type: String,
      default: null,
    },

    // OAuth
    googleId: {
      type: String,
      default: null,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },

    // Riot Account
    riotId: {
      gameName: { type: String, default: null },   // e.g. "PlayerName"
      tagLine: { type: String, default: null },    // e.g. "NA1"
    },
    riotPuuid: { type: String, default: null },
    riotVerified: { type: Boolean, default: false },
    rank: {
      type: String,
      enum: RANKS,
      default: 'Silver 1',
    },
    rankTier: {
      type: Number,
      default: 0, // 0-2 within rank
    },
    region: {
      type: String,
      enum: REGIONS,
      default: 'NA',
    },
    peakRank: {
      type: String,
      enum: RANKS,
      default: null,
    },

    // Matchmaking Preferences
    preferredRankMin: {
      type: String,
      enum: RANKS,
      default: 'Silver 1',
    },
    preferredRankMax: {
      type: String,
      enum: RANKS,
      default: 'Gold 3',
    },
    roles: [{
      type: String,
      enum: ROLES,
    }],
    playstyleTags: [{
      type: String,
      enum: PLAYSTYLES,
    }],
    voiceChatPreference: {
      type: String,
      enum: ['required', 'preferred', 'optional', 'never'],
      default: 'preferred',
    },

    // Availability (time slots as bitmask per day)
    availability: {
      monday: { type: [Number], default: [] },    // hours 0-23
      tuesday: { type: [Number], default: [] },
      wednesday: { type: [Number], default: [] },
      thursday: { type: [Number], default: [] },
      friday: { type: [Number], default: [] },
      saturday: { type: [Number], default: [] },
      sunday: { type: [Number], default: [] },
    },

    // Bio / Profile
    age: {
      type: Number,
      min: 18,
      max: 60,
      default: null,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      default: null,
    },
    bio: {
      type: String,
      maxlength: [300, 'Bio cannot exceed 300 characters'],
      default: '',
    },
    favoriteAgents: [{
      type: String,
      maxlength: 30,
    }],

    // Social / Status
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    isProfileComplete: { type: Boolean, default: false },

    // Connections
    sentRequests: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    receivedRequests: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    connections: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],

    // Stats
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    duoRating: { type: Number, default: 1000 }, // internal ELO-like score
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtuals ─────────────────────────────────────────────────────────────────
userSchema.virtual('riotIdFull').get(function () {
  if (this.riotId?.gameName && this.riotId?.tagLine) {
    return `${this.riotId.gameName}#${this.riotId.tagLine}`;
  }
  return null;
});

userSchema.virtual('winRate').get(function () {
  const total = this.wins + this.losses;
  return total > 0 ? Math.round((this.wins / total) * 100) : 0;
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
userSchema.index({ rank: 1, region: 1 });
userSchema.index({ isOnline: 1 });
userSchema.index({ username: 'text' });

// ─── Middleware ───────────────────────────────────────────────────────────────
// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Methods ──────────────────────────────────────────────────────────────────
// Compare entered password with hashed password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token
userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    { id: this._id, username: this.username },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Return safe public profile (no sensitive fields)
userSchema.methods.toPublicProfile = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.googleId;
  delete obj.riotPuuid;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
module.exports.RANKS = RANKS;
module.exports.REGIONS = REGIONS;
module.exports.ROLES = ROLES;
module.exports.PLAYSTYLES = PLAYSTYLES;
