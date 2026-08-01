const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  fullName: { type: String, required: true },
  nic: { type: String },
  age: { type: Number },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  bloodGroup: { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-'] },
  phone: { type: String },
  address: { type: String },
  ward: { type: String },

  medicalRecords: {
    allergies: { type: String },
    chronicConditions: { type: String },
    currentMedications: { type: String },
    notes: { type: String },
  },

  documents: [{
    name: { type: String },
    fileUrl: { type: String },
    fileType: { type: String }, // MIME type, e.g. "application/pdf", "image/jpeg"
    uploadedAt: { type: Date, default: Date.now },
  }],

  status: { type: String, enum: ['active', 'discharged'], default: 'active' },
  isCritical: { type: Boolean, default: false },
  registeredBy: { type: mongoose.Schema.Types.ObjectId },
}, { timestamps: true });

module.exports = mongoose.models.Patient || mongoose.model('Patient', patientSchema);