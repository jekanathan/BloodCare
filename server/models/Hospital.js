const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // ── Hospital Details ────────────────────────────────────────────────────
  hospitalName: { type: String, required: true },
  registrationNumber: { type: String, unique: true, required: true },
  // Expanded to cover Sri Lanka's hospital classifications while staying
  // backward-compatible with the original 5 values already saved in the DB.
  type: {
    type: String,
    enum: [
      'Government', 'Private', 'Teaching', 'Specialized', 'Military',
      'Provincial General Hospital', 'District General Hospital',
      'Base Hospital Type A', 'Base Hospital Type B', 'Divisional Hospital',
    ],
  },
  establishedYear: { type: Number },
  licenseNumber: { type: String },
  licenseExpiry: { type: Date },

  // ── Profile photo (base64 data URL or hosted URL) ───────────────────────
  profilePicture: { type: String },

  // ── Location ─────────────────────────────────────────────────────────────
  address: { type: String },
  district: { type: String },
  province: { type: String },

  // ── Contact ──────────────────────────────────────────────────────────────
  phone: { type: String },
  email: { type: String },
  contactPerson: { type: String },
  designation: { type: String }, // e.g. "Medical Superintendent"

  // ── Uploaded documents (PDF) ────────────────────────────────────────────
  documents: {
    hospitalLicense: {
      fileName: String,
      fileUrl: String,    // path under /uploads
      uploadedAt: Date,
    },
    registrationCertificate: {
      fileName: String,
      fileUrl: String,
      uploadedAt: Date,
    },
    taxRegistration: {
      fileName: String,
      fileUrl: String,
      uploadedAt: Date,
    },
  },

  // ── Approval workflow ────────────────────────────────────────────────────
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected', 'suspended'],
    default: 'pending',
  },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  rejectionReason: { type: String },
  adminNotes: { type: String },

  totalRequests: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Hospital', hospitalSchema);