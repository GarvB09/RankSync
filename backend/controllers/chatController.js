/**
 * Chat Controller
 * Real-time messaging between connected players
 */

const { Message, Conversation } = require('../models/Chat');
const User = require('../models/User');

// ─── @GET /api/chat/conversations ────────────────────────────────────────────
exports.getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id,
      isActive: true,
    })
      .populate('participants', 'username avatar isOnline lastSeen rank')
      .populate('lastMessage')
      .sort({ lastActivity: -1 });

    // Add unread count for each conversation
    const enriched = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          sender: { $ne: req.user.id },
          readBy: { $nin: [req.user.id] },
        });
        return { ...conv.toObject(), unreadCount };
      })
    );

    res.json({ success: true, conversations: enriched });
  } catch (error) {
    next(error);
  }
};

// ─── @GET /api/chat/:conversationId/messages ─────────────────────────────────
exports.getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify user is participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user.id,
    });
    if (!conversation) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const messages = await Message.find({
      conversation: conversationId,
      isDeleted: false,
    })
      .populate('sender', 'username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Mark messages as read
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: req.user.id },
        readBy: { $nin: [req.user.id] },
      },
      { $addToSet: { readBy: req.user.id } }
    );

    res.json({
      success: true,
      messages: messages.reverse(), // Chronological order
      conversationId,
    });
  } catch (error) {
    next(error);
  }
};

// ─── @POST /api/chat/start/:userId ───────────────────────────────────────────
exports.startConversation = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Ensure they're connected
    const currentUser = await User.findById(req.user.id);
    if (!currentUser.connections.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You must be connected to start a conversation',
      });
    }

    const conversation = await Conversation.findOrCreate(req.user.id, userId);
    await conversation.populate('participants', 'username avatar isOnline lastSeen rank');

    res.json({ success: true, conversation });
  } catch (error) {
    next(error);
  }
};

// ─── @POST /api/chat/:conversationId/send ────────────────────────────────────
exports.sendMessage = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ success: false, message: 'Message content required' });
    }

    // Verify participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user.id,
    });
    if (!conversation) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: req.user.id,
      content: content.trim(),
      readBy: [req.user.id],
    });

    await message.populate('sender', 'username avatar');

    // Update conversation last activity
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
      lastActivity: Date.now(),
    });

    // Emit via Socket.io
    const io = req.app.get('io');
    conversation.participants.forEach((participantId) => {
      if (participantId.toString() !== req.user.id.toString()) {
        io.to(`user:${participantId}`).emit('new_message', {
          message,
          conversationId,
        });
      }
    });

    res.json({ success: true, message });
  } catch (error) {
    next(error);
  }
};
