const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const BloodBank = require('../models/BloodBank');
const Donor = require('../models/Donor');

// Maps a Hospital or BloodBank record into the common "application" shape
// the frontend PendingApprovalsPage expects (works for both types).
function toApplication(record, type) {
  const isHospital = type === 'Hospital';
  const isDonor = type === 'Donor';
  return {
    _id: record._id,
    appId: `APP-${record._id.toString().slice(-6).toUpperCase()}`,
    type,
    name: isHospital ? record.hospitalName : isDonor ? record.fullName : record.bankName,
    regNumber: isDonor ? (record.nic || '') : record.registrationNumber,
    email: record.email,
    phone: record.phone,
    district: record.district,
    province: record.province || '',
    address: record.address,
    contactPerson: record.contactPerson,
    designation: record.designation || '',
    licenseNumber: record.licenseNumber || '',
    licenseExpiry: record.licenseExpiry ? new Date(record.licenseExpiry).toISOString().split('T')[0] : '',
    establishedYear: record.establishedYear || '',
    bloodGroup: isDonor ? record.bloodGroup : '',
    status: record.status,
    appliedOn: record.createdAt ? new Date(record.createdAt).toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '',
    rejectionReason: record.rejectionReason || '',
    adminNotes: record.adminNotes || '',
    // Documents: hospitals have a documents object with uploaded PDF metadata.
    // Blood banks currently don't collect documents at registration (no
    // multi-step form with uploads yet), so this defaults to an empty list.
    documents: isHospital && record.documents
      ? Object.entries(record.documents)
          .filter(([, doc]) => doc && doc.fileUrl)
          .map(([key, doc]) => ({
            key,
            name: doc.fileName || `${key}.pdf`,
            url: doc.fileUrl,
            date: doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '',
          }))
      : [],
  };
}

// ─── GET /api/pending-approvals ─────────────────────────────────────────────
// Returns combined Hospital + BloodBank applications across all statuses,
// shaped for the admin Pending Approvals page.
router.get('/', auth, async (req, res) => {
  try {
    const [hospitals, bloodBanks, donors] = await Promise.all([
      Hospital.find().sort({ createdAt: -1 }),
      BloodBank.find().sort({ createdAt: -1 }),
      Donor.find().sort({ createdAt: -1 }),
    ]);

    const applications = [
      ...hospitals.map(h => toApplication(h, 'Hospital')),
      ...bloodBanks.map(b => toApplication(b, 'Blood Bank')),
      ...donors.map(d => toApplication(d, 'Donor')),
    ].sort((a, b) => new Date(b.appliedOn) - new Date(a.appliedOn));

    res.json({ applications });
  } catch (err) {
    console.error('Pending approvals fetch error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── PATCH /api/pending-approvals/:type/:id/approve ─────────────────────────
router.patch('/:type/:id/approve', auth, async (req, res) => {
  try {
    const { type, id } = req.params;
    const Model = type === 'hospital' ? Hospital : type === 'bloodbank' ? BloodBank : type === 'donor' ? Donor : null;
    if (!Model) return res.status(400).json({ message: 'Invalid application type' });

    const record = await Model.findById(id);
    if (!record) return res.status(404).json({ message: 'Application not found' });

    record.status = 'approved';
    record.approvedBy = req.user.id;
    record.approvedAt = new Date();
    if (type === 'donor') record.testingStatus = 'testing_pending';
    await record.save();

    await User.findByIdAndUpdate(record.user, { status: 'approved' });

    const io = req.app.get('io');
    if (io) {
      io.to('admin_room').emit('application_approved', { type, id, name: record.hospitalName || record.bankName || record.fullName });
      if (type === 'donor') {
        io.to(`donor:${record.user}`).emit('account_approved', {
          message: '🎉 Your account is approved! Please book a blood testing appointment.',
        });
      }
    }

    res.json({ message: 'Application approved successfully', record });
  } catch (err) {
    console.error('Approve application error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── PATCH /api/pending-approvals/:type/:id/reject ──────────────────────────
router.patch('/:type/:id/reject', auth, async (req, res) => {
  try {
    const { type, id } = req.params;
    const { reason } = req.body;
    const Model = type === 'hospital' ? Hospital : type === 'bloodbank' ? BloodBank : type === 'donor' ? Donor : null;
    if (!Model) return res.status(400).json({ message: 'Invalid application type' });

    const record = await Model.findById(id);
    if (!record) return res.status(404).json({ message: 'Application not found' });

    record.status = 'rejected';
    record.rejectionReason = reason || '';
    await record.save();

    await User.findByIdAndUpdate(record.user, { status: 'rejected' });

    res.json({ message: 'Application rejected', record });
  } catch (err) {
    console.error('Reject application error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── PATCH /api/pending-approvals/:type/:id/under-review ────────────────────
router.patch('/:type/:id/under-review', auth, async (req, res) => {
  try {
    const { type, id } = req.params;
    const Model = type === 'hospital' ? Hospital : type === 'bloodbank' ? BloodBank : type === 'donor' ? Donor : null;
    if (!Model) return res.status(400).json({ message: 'Invalid application type' });

    const record = await Model.findByIdAndUpdate(id, { status: 'under_review' }, { new: true });
    if (!record) return res.status(404).json({ message: 'Application not found' });

    res.json({ message: 'Marked as under review', record });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── PATCH /api/pending-approvals/:type/:id/notes ────────────────────────────
router.patch('/:type/:id/notes', auth, async (req, res) => {
  try {
    const { type, id } = req.params;
    const { notes } = req.body;
    const Model = type === 'hospital' ? Hospital : type === 'bloodbank' ? BloodBank : type === 'donor' ? Donor : null;
    if (!Model) return res.status(400).json({ message: 'Invalid application type' });

    const record = await Model.findByIdAndUpdate(id, { adminNotes: notes }, { new: true });
    if (!record) return res.status(404).json({ message: 'Application not found' });

    res.json({ message: 'Notes saved', record });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;