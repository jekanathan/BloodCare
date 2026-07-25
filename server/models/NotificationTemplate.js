const mongoose = require('mongoose');

const notificationTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. "Blood Request Approved"
  type: { type: String, enum: ['SMS', 'Email', 'Push', 'Announcement'], default: 'Email' },
  subject: { type: String },
  body: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('NotificationTemplate', notificationTemplateSchema);