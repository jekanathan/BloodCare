const mongoose = require('mongoose');

const bloodBagSchema = new mongoose.Schema({
  bagId: { type: String, required: true, unique: true }, // e.g. BB-2026-000123
  bloodBank: { type: mongoose.Schema.Types.ObjectId, ref: 'BloodBank', required: true },
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'Donor' }, // optional — may not always be known
  donorName: { type: String }, // denormalized snapshot in case donor is later removed

  bloodGroup: { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-'], required: true },
  component: { type: String, enum: ['Whole Blood','PRBC','Plasma','Platelets','Cryoprecipitate'], default: 'Whole Blood' },
  quantityMl: { type: Number, enum: [350, 450], default: 450 },

  collectionDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true },
  storageLocation: { type: String }, // e.g. "FR-01, Rack-A"

  // Lab testing — each defaults Pending until entered
  testResults: {
    hiv:          { type: String, enum: ['Pending', 'Negative', 'Positive'], default: 'Pending' },
    hepatitisB:   { type: String, enum: ['Pending', 'Negative', 'Positive'], default: 'Pending' },
    hepatitisC:   { type: String, enum: ['Pending', 'Negative', 'Positive'], default: 'Pending' },
    syphilis:     { type: String, enum: ['Pending', 'Negative', 'Positive'], default: 'Pending' },
    malaria:      { type: String, enum: ['Pending', 'Negative', 'Positive'], default: 'Pending' },
  },
  testedBy: { type: String },
  testedAt: { type: Date },

  // Overall lifecycle status
  status: {
    type: String,
    enum: ['Collected', 'Under Testing', 'Safe', 'Unsafe', 'Quarantined', 'Reserved', 'Issued', 'Expired', 'Disposed'],
    default: 'Collected',
  },

  disposalReason: { type: String }, // 'Expired' | 'Contaminated' | 'Failed Test' | 'Damaged Bag'
  disposalDate: { type: Date },
  disposedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('BloodBag', bloodBagSchema);