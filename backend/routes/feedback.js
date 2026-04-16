const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const { protect, optionalAuth } = require('../middleware/auth');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'garv.b2005@gmail.com';

// POST /api/feedback — any logged-in user submits feedback
router.post('/', protect, async (req, res) => {
  try {
    const { message, type } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }
    const fb = await Feedback.create({
      message: message.trim(),
      type: type || 'general',
      user: {
        id:       req.user._id,
        username: req.user.username,
        email:    req.user.email,
      },
    });
    res.status(201).json({ success: true, feedback: fb });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to save feedback' });
  }
});

// GET /api/feedback — admin only
router.get('/', protect, async (req, res) => {
  if (req.user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.json({ success: true, feedbacks });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch feedback' });
  }
});

// DELETE /api/feedback/:id — admin only
router.delete('/:id', protect, async (req, res) => {
  if (req.user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  try {
    await Feedback.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete feedback' });
  }
});

module.exports = router;
