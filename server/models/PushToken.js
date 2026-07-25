const mongoose = require('mongoose');

const pushTokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  portal: { type: String, enum: ['donor', 'hospital', 'bloodbank', 'admin'], required: true },
  ownerEmail: { type: String, required: true }, // links back to Donor/Hospital/BloodBank/User by email
  ownerName: { type: String },
  bloodGroup: { type: String }, // only relevant for donor portal — enables blood-group targeted pushes
  lastActiveAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('PushToken', pushTokenSchema);