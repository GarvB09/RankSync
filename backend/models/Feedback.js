const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  message: { type: String, required: true, maxlength: 1000 },
  type:    { type: String, enum: ['bug', 'feature', 'general'], default: 'general' },
  user: {
    id:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: String,
    email:    String,
  },
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
