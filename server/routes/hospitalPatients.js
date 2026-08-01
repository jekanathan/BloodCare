const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const Patient = require('../models/Patient');
const BloodRequest = require('../models/BloodRequest');
const logActivity = require('../utils/logActivity');

// ── Multer setup: store uploaded patient documents under /uploads/patients ──
const uploadDir = path.join(__dirname, '..', 'uploads', 'patients');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `doc-${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only PDF, JPG, PNG, or WEBP files are allowed'));
    }
    cb(null, true);
  },
});

router.get('/', auth, async (req, res) => {
  try {
    const patients = await Patient.find({ hospital: req.user.id }).sort({ createdAt: -1 });
    res.json({ patients });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { fullName, nic, age, gender, bloodGroup, phone, address, ward, medicalRecords } = req.body;
    if (!fullName) return res.status(400).json({ message: 'Patient name is required.' });

    const patient = new Patient({
      hospital: req.user.id, fullName, nic, age, gender, bloodGroup, phone, address, ward,
      medicalRecords, registeredBy: req.user.id,
    });
    await patient.save();
    logActivity(req.user.id, 'patient', 'created', `Registered patient ${patient.fullName}`, patient._id);
    res.status(201).json({ message: 'Patient registered', patient });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const patient = await Patient.findOne({ _id: req.params.id, hospital: req.user.id });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const transfusions = await BloodRequest.find({
      hospital: req.user.id,
      $or: [{ patient: patient._id }, { patientName: patient.fullName }],
    }).sort({ createdAt: -1 });

    res.json({
      patient,
      transfusionHistory: transfusions.map(t => ({
        _id: t._id, bloodGroup: t.bloodGroup, units: t.unitsRequired, status: t.status,
        priority: t.priority, createdAt: t.createdAt, deliveredAt: t.deliveredAt,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const patient = await Patient.findOneAndUpdate(
      { _id: req.params.id, hospital: req.user.id },
      req.body,
      { new: true }
    );
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    logActivity(req.user.id, 'patient', 'updated', `Updated patient record for ${patient.fullName}`, patient._id);
    res.json({ message: 'Updated', patient });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.patch('/:id/discharge', auth, async (req, res) => {
  try {
    const patient = await Patient.findOneAndUpdate(
      { _id: req.params.id, hospital: req.user.id },
      { status: 'discharged' },
      { new: true }
    );
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    logActivity(req.user.id, 'patient', 'discharged', `Discharged patient ${patient.fullName}`, patient._id);
    res.json({ message: 'Patient discharged', patient });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── POST /:id/documents ─────────────────────────────────────────────────
// Accepts a real uploaded file (multipart/form-data, field name "file")
// plus an optional display "name" text field. Falls back to the original
// filename if no display name is given.
router.post('/:id/documents', auth, (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'File upload failed' });
    }
    try {
      const patient = await Patient.findOne({ _id: req.params.id, hospital: req.user.id });
      if (!patient) return res.status(404).json({ message: 'Patient not found' });

      if (!req.file) {
        return res.status(400).json({ message: 'No file was uploaded.' });
      }

      const displayName = (req.body.name && req.body.name.trim()) || req.file.originalname;

      patient.documents.push({
        name: displayName,
        fileUrl: `/uploads/patients/${req.file.filename}`,
        fileType: req.file.mimetype,
        uploadedAt: new Date(),
      });
      await patient.save();
      logActivity(req.user.id, 'patient', 'document_uploaded', `Uploaded document "${displayName}" for ${patient.fullName}`, patient._id);
      res.status(201).json({ message: 'Document uploaded', patient });
    } catch (saveErr) {
      res.status(500).json({ message: 'Server error', error: saveErr.message });
    }
  });
});

// ─── DELETE /:id/documents/:docId ────────────────────────────────────────
router.delete('/:id/documents/:docId', auth, async (req, res) => {
  try {
    const patient = await Patient.findOne({ _id: req.params.id, hospital: req.user.id });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const doc = patient.documents.id(req.params.docId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    // Remove the physical file from disk too, if it exists
    if (doc.fileUrl) {
      const filePath = path.join(__dirname, '..', doc.fileUrl.replace(/^\//, ''));
      fs.unlink(filePath, () => {}); // best-effort, ignore errors
    }

    doc.deleteOne();
    await patient.save();
    logActivity(req.user.id, 'patient', 'document_removed', `Removed document "${doc.name}" from ${patient.fullName}`, patient._id);
    res.json({ message: 'Document removed', patient });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const patient = await Patient.findOneAndDelete({ _id: req.params.id, hospital: req.user.id });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    logActivity(req.user.id, 'patient', 'deleted', `Deleted patient record for ${patient.fullName}`, patient._id);
    res.json({ message: 'Patient deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;