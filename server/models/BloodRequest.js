const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema({
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' }, // optional link to registered patient record
  bloodBank: { type: mongoose.Schema.Types.ObjectId, ref: 'BloodBank' },

  // Blood banks the hospital chose to send this request to, picked from a
  // distance-sorted list (nearest first) when the request was created. Empty
  // means the hospital didn't target specific banks — open to all.
  targetBloodBanks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BloodBank' }],

  patientName: { type: String },
  patientAge: { type: Number },
  patientWard: { type: String },
  patientCondition: { type: String }, // e.g. "Surgery", "Accident" — optional, set by hospital
  bloodGroup: { 
    type: String, 
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: true 
  },
  unitsRequired: { type: Number, required: true, min: 1 },
  unitsProvided: { type: Number, default: 0 },
  priority: { 
    type: String, 
    enum: ['Normal', 'Urgent', 'Emergency'], 
    default: 'Normal' 
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'processing', 'dispatched', 'delivered', 'rejected', 'cancelled'], 
    default: 'pending' 
  },

  // ── Cross Match ─────────────────────────────────────────────────────────
  crossMatch: { type: String, enum: ['pending', 'passed', 'failed'], default: 'pending' },
  crossMatchLabOfficer: { type: String },
  crossMatchNotes: { type: String },
  crossMatchedAt: { type: Date },

  // ── Patient Pre-Transfusion Testing (hospital-side) ──────────────────────
  patientTesting: {
    bloodGroupConfirmed: { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-'] },
    antibodyScreening: { type: String, enum: ['Pending','Negative','Positive'], default: 'Pending' },
    compatibilityResult: { type: String, enum: ['Pending','Compatible','Incompatible'], default: 'Pending' },
    // Pre-transfusion safety checklist
    patientIdVerified: { type: Boolean, default: false },
    bloodBagVerified:  { type: Boolean, default: false },
    vitalsChecked:     { type: Boolean, default: false },
    consentObtained:   { type: Boolean, default: false },
    performedBy: { type: String },
    testedAt: { type: Date },
    notes: { type: String },
  },

  // ── Blood Allocation — specific bags reserved for this request ─────────
  allocatedBags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BloodBag' }],
  allocatedAt: { type: Date },

  // ── Dispatch Tracking ────────────────────────────────────────────────────
  dispatchDriver: { type: String },
  dispatchVehicle: { type: String },
  dispatchETA: { type: Date },

  // ── Delivery Confirmation ────────────────────────────────────────────────
  receivedBy: { type: String },
  receivedAt: { type: Date },

  // ── Cancellation ──────────────────────────────────────────────────────────
  cancelledAt: { type: Date },
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cancellationReason: { type: String },

  // ── Donor Responses ──────────────────────────────────────────────────────
  // Tracks which donors (matching this request's blood group) accepted or
  // declined to donate for it, so the donor portal can show real state.
  donorResponses: [{
    donor: { type: mongoose.Schema.Types.ObjectId, ref: 'Donor', required: true },
    response: { type: String, enum: ['accepted', 'declined'], required: true },
    respondedAt: { type: Date, default: Date.now },
  }],

  requestedBy: { type: String }, // doctor name, free text
  notes: { type: String },
  requestedAt: { type: Date, default: Date.now },
  approvedAt: { type: Date },
  dispatchedAt: { type: Date },
  deliveredAt: { type: Date },
  fulfilledAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);