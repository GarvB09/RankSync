const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { linkRiotAccount, getRank, refreshRank } = require('../controllers/riotController');

router.post('/link', protect, linkRiotAccount);
router.get('/rank/:gameName/:tagLine', protect, getRank);
router.post('/refresh', protect, refreshRank);

module.exports = router;
