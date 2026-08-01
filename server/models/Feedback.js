const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  type: { type: String, enum: ['feedback', 'complaint', 'suggestion', 'contact'], default: 'feedback' },
  name: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, enum: ['Donor', 'Hospital', 'Blood Bank', 'Public'], default: 'Public' },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  helpful: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'read', 'resolved'], default: 'pending' },
  adminReply: { type: String },
  repliedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);