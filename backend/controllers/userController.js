/**
 * User Controller
 * Profile management, matchmaking queries, duo requests
 */

const User = require('../models/User');
const { Notification } = require('../models/Chat');
const { RANKS, LOL_RANKS } = require('../models/User');
const { stripHtml, isAllowedUrl } = require('../utils/sanitize');

// ─── @GET /api/users/profile/:username ───────────────────────────────────────
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .populate('connections', 'username avatar rank region isOnline lastSeen')
      .select('-password -googleId -riotPuuid -sentRequests -receivedRequests');

    if (!user) {
      return res.status(404).json({ success: false, message: 'Player not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// ─── @PUT /api/users/profile ──────────────────────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      'bio', 'age', 'gender', 'region', 'roles', 'playstyleTags', 'voiceChatPreference',
      'preferredRankMin', 'preferredRankMax', 'availability',
      'favoriteAgents', 'avatar', 'trackerUrl',
      'game', 'lolRank', 'lolRegion', 'lolLanes', 'favoriteChampions',
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Sanitize free-text fields
    if (updates.bio !== undefined) updates.bio = stripHtml(updates.bio).slice(0, 300);

    // Block dangerous tracker URLs
    if (updates.trackerUrl !== undefined && !isAllowedUrl(updates.trackerUrl)) {
      return res.status(400).json({ success: false, message: 'Invalid tracker URL' });
    }

    // Check if profile is complete (either game)
    const user = await User.findById(req.user.id);
    const merged = { ...user.toObject(), ...updates };
    const isComplete = merged.game === 'lol'
      ? !!(merged.lolRank && merged.lolRegion && merged.lolLanes?.length > 0)
      : !!(merged.riotId?.gameName && merged.rank && merged.region && merged.roles?.length > 0);
    updates.isProfileComplete = isComplete;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -googleId');

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    next(error);
  }
};

// ─── @GET /api/users/find-duo ─────────────────────────────────────────────────
exports.findDuo = async (req, res, next) => {
  try {
    const {
      game = 'valorant',
      region,
      rankMin,
      rankMax,
      role,
      lane,
      lolRegion,
      playstyle,
      voiceChat,
      gender,
      page = 1,
      limit = 12,
    } = req.query;

    const filter = {
      _id: { $ne: req.user.id },
      isProfileComplete: true,
      isHidden: { $ne: true },
      connections: { $nin: [req.user.id] },
      // null matches existing users who predate the game field
      game: game === 'valorant' ? { $in: ['valorant', null] } : game,
    };

    if (game === 'lol') {
      if (lolRegion) filter.lolRegion = lolRegion;
      if (lane) filter.lolLanes = { $in: [lane] };
      if (rankMin || rankMax) {
        const minIdx = rankMin ? LOL_RANKS.indexOf(rankMin) : 0;
        const maxIdx = rankMax ? LOL_RANKS.indexOf(rankMax) : LOL_RANKS.length - 1;
        filter.lolRank = { $in: LOL_RANKS.slice(Math.max(0, minIdx), Math.min(LOL_RANKS.length, maxIdx + 1)) };
      }
    } else {
      if (region) filter.region = region;
      if (role) filter.roles = { $in: [role] };
      if (rankMin || rankMax) {
        const minIndex = rankMin ? RANKS.indexOf(rankMin) : 0;
        const maxIndex = rankMax ? RANKS.indexOf(rankMax) : RANKS.length - 1;
        filter.rank = { $in: RANKS.slice(Math.max(0, minIndex), Math.min(RANKS.length, maxIndex + 1)) };
      }
    }

    if (playstyle) filter.playstyleTags = { $in: [playstyle] };
    if (voiceChat) filter.voiceChatPreference = voiceChat;
    if (gender) filter.gender = gender;

    const safePage = Math.max(1, Math.min(1000, parseInt(page) || 1));
    const safeLimit = Math.max(1, Math.min(50, parseInt(limit) || 12));
    const skip = (safePage - 1) * safeLimit;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('username avatar age gender rank region roles playstyleTags voiceChatPreference bio isOnline lastSeen duoRating favoriteAgents riotId riotVerified trackerUrl game lolRank lolRegion lolLanes favoriteChampions')
        .sort({ isOnline: -1, duoRating: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      User.countDocuments(filter),
    ]);

    // Annotate connection status for current user
    const currentUser = await User.findById(req.user.id)
      .select('sentRequests receivedRequests connections')
      .lean();
    const connSet = new Set(currentUser.connections.map(String));
    const sentSet = new Set(currentUser.sentRequests.map(String));
    const recvSet = new Set(currentUser.receivedRequests.map(String));
    const enriched = users.map((u) => ({
      ...u,
      connectionStatus: connSet.has(String(u._id))
        ? 'connected'
        : sentSet.has(String(u._id))
        ? 'pending_sent'
        : recvSet.has(String(u._id))
        ? 'pending_received'
        : 'none',
    }));

    res.json({
      success: true,
      users: enriched,
      pagination: {
        total,
        page: safePage,
        pages: Math.ceil(total / safeLimit),
        limit: safeLimit,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── @POST /api/users/request/:userId ────────────────────────────────────────
exports.sendDuoRequest = async (req, res, next) => {
  try {
    const targetId = req.params.userId;
    const senderId = req.user.id;

    if (targetId === senderId) {
      return res.status(400).json({ success: false, message: 'Cannot send request to yourself' });
    }

    const [sender, target] = await Promise.all([
      User.findById(senderId),
      User.findById(targetId),
    ]);

    if (!target) {
      return res.status(404).json({ success: false, message: 'Player not found' });
    }

    // Check if already connected or request exists
    if (sender.connections.includes(targetId)) {
      return res.status(400).json({ success: false, message: 'Already connected' });
    }
    if (sender.sentRequests.includes(targetId)) {
      return res.status(400).json({ success: false, message: 'Request already sent' });
    }

    // Update both users
    await Promise.all([
      User.findByIdAndUpdate(senderId, { $addToSet: { sentRequests: targetId } }),
      User.findByIdAndUpdate(targetId, { $addToSet: { receivedRequests: senderId } }),
    ]);

    const isFistbump = req.body.fistbump === true;

    // Create notification
    const notification = await Notification.create({
      recipient: targetId,
      sender: senderId,
      type: 'duo_request',
      title: isFistbump ? '🤜 Fistbump Request!' : 'New Duo Request!',
      message: isFistbump
        ? `${sender.username} fistbumped you — they REALLY want to duo!`
        : `${sender.username} wants to duo with you!`,
      data: { senderId: senderId, senderUsername: sender.username, fistbump: isFistbump },
    });

    // Emit real-time notification via socket
    const io = req.app.get('io');
    io.to(`user:${targetId}`).emit('notification', notification);

    res.json({ success: true, message: 'Duo request sent!' });
  } catch (error) {
    next(error);
  }
};

// ─── @POST /api/users/request/:userId/accept ─────────────────────────────────
exports.acceptDuoRequest = async (req, res, next) => {
  try {
    const requesterId = req.params.userId;
    const acceptorId = req.user.id;

    const acceptor = await User.findById(acceptorId);
    if (!acceptor.receivedRequests.includes(requesterId)) {
      return res.status(400).json({ success: false, message: 'No pending request found' });
    }

    // Move from requests to connections for both
    await Promise.all([
      User.findByIdAndUpdate(acceptorId, {
        $pull: { receivedRequests: requesterId },
        $addToSet: { connections: requesterId },
      }),
      User.findByIdAndUpdate(requesterId, {
        $pull: { sentRequests: acceptorId },
        $addToSet: { connections: acceptorId },
      }),
    ]);

    const acceptorUser = await User.findById(acceptorId).select('username');

    // Notify requester
    const notification = await Notification.create({
      recipient: requesterId,
      sender: acceptorId,
      type: 'request_accepted',
      title: 'Duo Request Accepted!',
      message: `${acceptorUser.username} accepted your duo request. Start chatting!`,
      data: { acceptorId, acceptorUsername: acceptorUser.username },
    });

    const io = req.app.get('io');
    io.to(`user:${requesterId}`).emit('notification', notification);
    io.to(`user:${requesterId}`).emit('request_accepted', { with: acceptorId });

    res.json({ success: true, message: 'Duo request accepted!' });
  } catch (error) {
    next(error);
  }
};

// ─── @POST /api/users/request/:userId/decline ────────────────────────────────
exports.declineDuoRequest = async (req, res, next) => {
  try {
    const requesterId = req.params.userId;
    const declinerId = req.user.id;

    await Promise.all([
      User.findByIdAndUpdate(declinerId, { $pull: { receivedRequests: requesterId } }),
      User.findByIdAndUpdate(requesterId, { $pull: { sentRequests: declinerId } }),
    ]);

    res.json({ success: true, message: 'Request declined' });
  } catch (error) {
    next(error);
  }
};

// ─── @POST /api/users/avatar ──────────────────────────────────────────────────
exports.uploadAvatar = async (req, res, next) => {
  try {
    const { avatar } = req.body;
    if (!avatar || !avatar.startsWith('data:image/')) {
      return res.status(400).json({ success: false, message: 'Invalid image data' });
    }
    // Reject avatars over ~1MB (base64 data portion)
    const base64Data = avatar.split(',')[1] || '';
    if (base64Data.length > 1_400_000) {
      return res.status(400).json({ success: false, message: 'Image too large. Maximum size is 1MB.' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { avatar } },
      { new: true }
    ).select('-password -googleId');

    res.json({ success: true, avatar, user: updatedUser });
  } catch (error) {
    next(error);
  }
};

// ─── @PUT /api/users/username ─────────────────────────────────────────────────
exports.changeUsername = async (req, res, next) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ success: false, message: 'Username is required' });
    }

    const trimmed = username.trim();
    if (trimmed.length < 3 || trimmed.length > 20) {
      return res.status(400).json({ success: false, message: 'Username must be 3–20 characters' });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      return res.status(400).json({ success: false, message: 'Username can only contain letters, numbers, and underscores' });
    }

    const existing = await User.findOne({ username: trimmed });
    if (existing && existing._id.toString() !== req.user.id) {
      return res.status(400).json({ success: false, message: 'Username already taken' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { username: trimmed, needsUsername: false } },
      { new: true, runValidators: true }
    ).select('-password -googleId');

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    next(error);
  }
};

// ─── @GET /api/users/connections ─────────────────────────────────────────────
exports.getConnections = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('connections', 'username avatar rank region isOnline lastSeen roles playstyleTags')
      .populate('receivedRequests', 'username avatar rank region roles')
      .populate('sentRequests', 'username avatar rank region roles');

    res.json({
      success: true,
      connections: user.connections,
      receivedRequests: user.receivedRequests,
      sentRequests: user.sentRequests,
    });
  } catch (error) {
    next(error);
  }
};
