const mongoose = require('mongoose');

const collectionCenterSchema = new mongoose.Schema({
  bloodBank: { type: mongoose.Schema.Types.ObjectId, ref: 'BloodBank', required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['Mobile Camp', 'Permanent Center'], default: 'Mobile Camp' },
  address: { type: String },
  district: { type: String },
  scheduledDate: { type: Date },
  status: { type: String, enum: ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'], default: 'Upcoming' },
  targetUnits: { type: Number, default: 0 },
  collectedUnits: { type: Number, default: 0 },
  organizer: { type: String },
  contactPhone: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('CollectionCenter', collectionCenterSchema);