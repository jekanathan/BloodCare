const mongoose = require('mongoose');

const donorSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fullName: { type: String, required: true },
  nic: { type: String, unique: true },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  bloodGroup: { 
    type: String, 
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: true 
  },
  phone: { type: String },
  email: { type: String },
  address: { type: String },
  district: { type: String },
  lastDonationDate: { type: Date },
  totalDonations: { type: Number, default: 0 },
  isEligible: { type: Boolean, default: true },
  medicalInfo: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'suspended'], 
    default: 'pending' 
  },

  // ── Testing flow stage (controls what donor sees after login) ──────────
  // pending          → admin hasn't approved registration yet
  // testing_pending  → admin approved, donor must book a blood test appointment
  // testing_booked   → appointment booked, waiting for hospital/bloodbank to test & decide
  // active           → blood test accepted, donor has full dashboard access
  // testing_rejected → blood test failed / rejected by hospital/bloodbank
  testingStatus: {
    type: String,
    enum: ['pending', 'testing_pending', 'testing_booked', 'active', 'testing_rejected'],
    default: 'pending',
  },

  // Booking details (set when donor books a testing appointment)
  testingBooking: {
    facilityType: { type: String, enum: ['hospital', 'bloodbank'] },
    facilityId:   { type: mongoose.Schema.Types.ObjectId },
    facilityName: { type: String },
    appointmentDate: { type: Date },
    notes:        { type: String },
    bookedAt:     { type: Date },
  },

  // Test result/decision (set when hospital/bloodbank reviews)
  testingResult: {
    decision:   { type: String, enum: ['accepted', 'rejected'] },
    reason:     { type: String }, // e.g. "HIV positive", "Low hemoglobin"
    reviewedBy: { type: mongoose.Schema.Types.ObjectId },
    reviewedAt: { type: Date },

    // Detailed lab screening panel (filled in by hospital/bloodbank staff)
    hemoglobin:      { type: Number },  // g/dL
    bloodPressure:   { type: String },  // e.g. "120/80"
    weight:          { type: Number },  // kg
    temperature:     { type: Number },  // °C
    pulseRate:       { type: Number },  // bpm
    confirmedBloodGroup: { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-'] },
    hiv:             { type: String, enum: ['Pending','Negative','Positive'], default: 'Pending' },
    hepatitisB:      { type: String, enum: ['Pending','Negative','Positive'], default: 'Pending' },
    hepatitisC:      { type: String, enum: ['Pending','Negative','Positive'], default: 'Pending' },
    syphilis:        { type: String, enum: ['Pending','Negative','Positive'], default: 'Pending' },
    malaria:         { type: String, enum: ['Pending','Negative','Positive'], default: 'Pending' },
    doctorRemarks:   { type: String },
    finalStatus:     { type: String, enum: ['Eligible','Temporarily Deferred','Permanently Deferred'] },
  },

  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  rejectionReason: { type: String },
  adminNotes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Donor', donorSchema);