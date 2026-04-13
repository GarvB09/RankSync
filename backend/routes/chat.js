// chat.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getConversations, getMessages, startConversation, sendMessage } = require('../controllers/chatController');

router.get('/conversations', protect, getConversations);
router.get('/:conversationId/messages', protect, getMessages);
router.post('/start/:userId', protect, startConversation);
router.post('/:conversationId/send', protect, sendMessage);

module.exports = router;
