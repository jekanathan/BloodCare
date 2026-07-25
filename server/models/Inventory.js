const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  bloodBank: { type: mongoose.Schema.Types.ObjectId, ref: 'BloodBank', required: true },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: true
  },
  component: {
    type: String,
    enum: ['Whole Blood', 'Plasma', 'Platelets', 'RBC', 'Cryoprecipitate'],
    default: 'Whole Blood',
  },
  units: { type: Number, default: 0, min: 0 },
  reserved: { type: Number, default: 0, min: 0 },
  expired: { type: Number, default: 0, min: 0 },
  collectedDate: { type: Date },
  expiryDate: { type: Date },
  donorReference: { type: String },
  lastUpdated: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Inventory', inventorySchema);