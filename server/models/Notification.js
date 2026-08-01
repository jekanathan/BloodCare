const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: { type: String, enum: ['SMS', 'Email', 'Push', 'Announcement'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  recipientGroup: { type: String, required: true }, // e.g. "All Donors", "O- Donors", custom label
  recipientCount: { type: Number, default: 0 },
  openedCount: { type: Number, default: 0 },
  status: { type: String, enum: ['sent', 'failed', 'pending'], default: 'pending' },
  errorMessage: { type: String },
  sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sentAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);