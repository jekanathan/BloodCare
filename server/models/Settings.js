const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // Using a fixed key ensures there's always exactly one settings document
  key: { type: String, default: 'main', unique: true },

  siteName: { type: String, default: 'BloodCare' },
  siteUrl: { type: String, default: 'https://bloodcare.lk' },
  adminEmail: { type: String, default: 'admin@bloodcare.lk' },
  emergencyHotline: { type: String, default: '1919' },
  address: { type: String, default: '123, Health Care Road, Colombo, Sri Lanka' },

  maintenanceMode: { type: Boolean, default: false },
  registrationOpen: { type: Boolean, default: true },
  autoApprove: { type: Boolean, default: false },

  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);