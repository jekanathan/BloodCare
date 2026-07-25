const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const Hospital = require('../models/Hospital');
const User = require('../models/User');

// ── Multer setup — same pattern as hospitalAuth.js ──────────────────────────
const uploadDir = path.join(__dirname, '..', 'uploads', 'hospitals');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') return cb(new Error('Only PDF files are allowed'));
    cb(null, true);
  },
});

const uploadFields = upload.fields([
  { name: 'hospitalLicense', maxCount: 1 },
  { name: 'registrationCertificate', maxCount: 1 },
  { name: 'taxRegistration', maxCount: 1 },
]);

// ─── POST /api/hospitals/register ───────────────────────────────────────────
// Admin manually registers a hospital — auto-approved immediately since the
// admin is directly vouching for it (no separate approval step needed).
router.post('/register', auth, (req, res) => {
  uploadFields(req, res, async (uploadErr) => {
    if (uploadErr) {
      return res.status(400).json({ message: uploadErr.message || 'File upload failed' });
    }

    try {
      const {
        contactPerson, designation, email, phone,
        hospitalName, registrationNumber, type, establishedYear,
        licenseNumber, licenseExpiry, address, district, province,
        password,
      } = req.body;

      if (!hospitalName || !registrationNumber || !email || !phone || !address || !district || !province || !password) {
        return res.status(400).json({ message: 'Please fill in all required fields.' });
      }
      if (password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters.' });
      }

      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) return res.status(400).json({ message: 'Email already registered' });

      const existingReg = await Hospital.findOne({ registrationNumber });
      if (existingReg) return res.status(400).json({ message: 'Registration number already exists' });

      const user = new User({
        name: contactPerson || hospitalName,
        email: email.toLowerCase(),
        password,
        role: 'hospital',
        status: 'approved', // admin-created → active immediately
      });
      await user.save();

      try {
        const documents = {};
        if (req.files?.hospitalLicense?.[0]) {
          const f = req.files.hospitalLicense[0];
          documents.hospitalLicense = { fileName: f.originalname, fileUrl: `/uploads/hospitals/${f.filename}`, uploadedAt: new Date() };
        }
        if (req.files?.registrationCertificate?.[0]) {
          const f = req.files.registrationCertificate[0];
          documents.registrationCertificate = { fileName: f.originalname, fileUrl: `/uploads/hospitals/${f.filename}`, uploadedAt: new Date() };
        }
        if (req.files?.taxRegistration?.[0]) {
          const f = req.files.taxRegistration[0];
          documents.taxRegistration = { fileName: f.originalname, fileUrl: `/uploads/hospitals/${f.filename}`, uploadedAt: new Date() };
        }

        const hospital = new Hospital({
          user: user._id,
          hospitalName,
          registrationNumber,
          type,
          establishedYear: establishedYear ? parseInt(establishedYear) : undefined,
          licenseNumber,
          licenseExpiry: licenseExpiry || undefined,
          address,
          district,
          province,
          phone,
          email: email.toLowerCase(),
          contactPerson,
          designation,
          documents,
          status: 'approved',
          approvedBy: req.user.id,
          approvedAt: new Date(),
        });
        await hospital.save();

        res.status(201).json({ message: 'Hospital registered and approved successfully.', hospital });
      } catch (hospitalErr) {
        await User.findByIdAndDelete(user._id);
        throw hospitalErr;
      }
    } catch (err) {
      console.error('Admin hospital register error:', err);
      if (err.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0] || 'field';
        return res.status(400).json({ message: `This ${field} is already registered.` });
      }
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });
});

// ─── GET /api/hospitals ─────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { hospitalName: { $regex: search, $options: 'i' } },
        { district: { $regex: search, $options: 'i' } }
      ];
    }
    const total = await Hospital.countDocuments(query);
    const hospitals = await Hospital.find(query)
      .populate('user', 'email createdAt')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ hospitals, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id).populate('user', 'email').populate('approvedBy', 'name');
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });
    res.json(hospital);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });
    hospital.status = status;
    if (status === 'approved') { hospital.approvedBy = req.user.id; hospital.approvedAt = new Date(); }
    await hospital.save();
    await User.findByIdAndUpdate(hospital.user, { status });
    res.json({ message: `Hospital ${status} successfully`, hospital });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const hospital = await Hospital.findByIdAndDelete(req.params.id);
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });
    await User.findByIdAndDelete(hospital.user);
    res.json({ message: 'Hospital deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;