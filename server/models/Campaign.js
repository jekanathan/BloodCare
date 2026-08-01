const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ['National', 'Regional', 'Institution', 'Corporate'], default: 'Regional' },
  bloodBank: { type: mongoose.Schema.Types.ObjectId, ref: 'BloodBank' },
  district: { type: String },
  venue: { type: String },
  organizer: { type: String },
  targetBloodGroups: [{
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'All']
  }],
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  time: { type: String }, // free text, e.g. "8:00 AM - 4:00 PM"
  targetRegistrations: { type: Number, default: 0 }, // donor sign-up goal
  registeredCount: { type: Number, default: 0 },
  targetUnits: { type: Number, default: 0 },
  collectedUnits: { type: Number, default: 0 },
  volunteerCount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  notificationsSent: { type: Number, default: 0 },
  donorsResponded: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Campaign', campaignSchema);