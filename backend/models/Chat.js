/**
 * Chat & Message Models
 * Handles DM conversations between connected players
 */

const mongoose = require('mongoose');

// ─── Message Schema ───────────────────────────────────────────────────────────
const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
      trim: true,
    },
    messageType: {
      type: String,
      enum: ['text', 'system'],
      default: 'text',
    },
    readBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ─── Conversation Schema ──────────────────────────────────────────────────────
const conversationSchema = new mongoose.Schema(
  {
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Ensure unique conversations between two users
conversationSchema.index({ participants: 1 });

conversationSchema.statics.findOrCreate = async function (userA, userB) {
  const existing = await this.findOne({
    participants: { $all: [userA, userB], $size: 2 },
  });
  if (existing) return existing;

  return this.create({ participants: [userA, userB] });
};

// ─── Notification Schema ──────────────────────────────────────────────────────
const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    type: {
      type: String,
      enum: ['duo_request', 'request_accepted', 'request_declined', 'new_message', 'system'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    data: { type: mongoose.Schema.Types.Mixed, default: {} }, // extra payload
  },
  { timestamps: true }
);

const Message = mongoose.model('Message', messageSchema);
const Conversation = mongoose.model('Conversation', conversationSchema);
const Notification = mongoose.model('Notification', notificationSchema);

module.exports = { Message, Conversation, Notification };
