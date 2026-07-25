const mongoose = require('mongoose');

const sharedBloodRequestSchema = new mongoose.Schema({
  fromHospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  toHospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  partnership: { type: mongoose.Schema.Types.ObjectId, ref: 'Partnership' },

  bloodGroup: { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-'], required: true },
  units: { type: Number, required: true },
  priority: { type: String, enum: ['Normal', 'Urgent', 'Emergency'], default: 'Normal' },
  reason: { type: String },

  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'completed'], default: 'pending' },
  respondedAt: { type: Date },
  completedAt: { type: Date },
  notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('SharedBloodRequest', sharedBloodRequestSchema);