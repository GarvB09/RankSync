const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getProfile, updateProfile, findDuo,
  sendDuoRequest, acceptDuoRequest, declineDuoRequest, getConnections,
  uploadAvatar,
} = require('../controllers/userController');

// Multer config — store to disk, max 5MB, images only
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads/avatars'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${req.user.id}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

router.get('/find-duo', protect, findDuo);
router.get('/connections', protect, getConnections);
router.get('/profile/:username', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);
router.post('/request/:userId', protect, sendDuoRequest);
router.post('/request/:userId/accept', protect, acceptDuoRequest);
router.post('/request/:userId/decline', protect, declineDuoRequest);

module.exports = router;
