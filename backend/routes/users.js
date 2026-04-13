const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getProfile, updateProfile, findDuo,
  sendDuoRequest, acceptDuoRequest, declineDuoRequest, getConnections,
} = require('../controllers/userController');

router.get('/find-duo', protect, findDuo);
router.get('/connections', protect, getConnections);
router.get('/profile/:username', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/request/:userId', protect, sendDuoRequest);
router.post('/request/:userId/accept', protect, acceptDuoRequest);
router.post('/request/:userId/decline', protect, declineDuoRequest);

module.exports = router;
