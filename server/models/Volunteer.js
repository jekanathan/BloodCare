const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  district: { type: String },
  skills: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  campaigns: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' }], // campaigns they've participated in
}, { timestamps: true });

module.exports = mongoose.model('Volunteer', volunteerSchema);