const mongoose = require('mongoose');

const storageFacilitySchema = new mongoose.Schema({
  bloodBank: { type: mongoose.Schema.Types.ObjectId, ref: 'BloodBank', required: true },
  name: { type: String, required: true }, // e.g. "FR-01"
  type: { type: String, enum: ['Refrigerator', 'Freezer', 'Rack'], default: 'Refrigerator' },
  location: { type: String }, // e.g. "Rack-A, Shelf-02"
  capacityUnits: { type: Number, default: 0 },
  currentUnits: { type: Number, default: 0 },
  temperatureC: { type: Number },
  status: { type: String, enum: ['Active', 'Maintenance', 'Offline'], default: 'Active' },
  lastMaintenanceDate: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('StorageFacility', storageFacilitySchema);