const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Placeholder for future match history / stats features
router.get('/', protect, (req, res) => {
  res.json({ success: true, matches: [], message: 'Match history coming soon' });
});

module.exports = router;
