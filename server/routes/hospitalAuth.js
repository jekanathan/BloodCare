const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const auth = require('../middleware/auth');

// ── Multer setup: store uploaded PDFs under /uploads/hospitals ────────────
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  },
});

const uploadFields = upload.fields([
  { name: 'hospitalLicense', maxCount: 1 },
  { name: 'registrationCertificate', maxCount: 1 },
  { name: 'taxRegistration', maxCount: 1 },
]);

// ─── POST /api/hospital-auth/register ─────────────────────────────────────
router.post('/register', uploadFields, async (req, res) => {
  try {
    const {
      contactPerson, designation, email, phone,
      hospitalName, registrationNumber, type, establishedYear,
      licenseNumber, licenseExpiry, address, district, province,
      password,
    } = req.body;

    if (!hospitalName || !registrationNumber || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const existingReg = await Hospital.findOne({ registrationNumber });
    if (existingReg) {
      return res.status(400).json({ message: 'Registration number already exists' });
    }

    // 1. Create User (auth)
    const user = new User({
      name: contactPerson || hospitalName,
      email: email.toLowerCase(),
      password,
      role: 'hospital',
      status: 'pending',
    });
    await user.save();

    try {
      // 2. Build documents object from uploaded files
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

      // 3. Create Hospital profile
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
        status: 'pending',
      });
      await hospital.save();

      // Notify admin in real-time
      const io = req.app.get('io');
      if (io) {
        io.to('admin_room').emit('new_hospital_registration', {
          hospitalId: hospital._id,
          hospitalName,
          message: `🏥 New hospital registration: ${hospitalName}`,
        });
      }

      res.status(201).json({
        message: 'Registration submitted successfully. Awaiting admin approval.',
        userId: user._id,
        hospitalId: hospital._id,
      });
    } catch (hospitalErr) {
      await User.findByIdAndDelete(user._id);
      throw hospitalErr;
    }

  } catch (err) {
    console.error('Hospital register error:', err);
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'field';
      return res.status(400).json({ message: `This ${field} is already registered.` });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── POST /api/hospital-auth/login ─────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase(), role: 'hospital' });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    if (user.status === 'pending') {
      return res.status(403).json({ message: 'Your hospital registration is pending admin approval.' });
    }
    if (user.status === 'rejected') {
      return res.status(403).json({ message: 'Your hospital registration has been rejected.' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'Your hospital account has been suspended.' });
    }

    const hospital = await Hospital.findOne({ user: user._id });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'bloodcare_secret',
      { expiresIn: '24h' }
    );

    user.lastLogin = new Date();
    await user.save();

    res.json({ token, hospital });
  } catch (err) {
    console.error('Hospital login error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── GET /api/hospital-auth/me ──────────────────────────────────────────────
router.get('/me', auth, async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ user: req.user.id });
    res.json(hospital);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── PUT /api/hospital-auth/profile ─────────────────────────────────────────
// Updates the logged-in hospital's own editable profile fields.
// Fields like status, approvedBy, totalRequests are intentionally excluded
// so a hospital user can never self-approve or fake its request count.
router.put('/profile', auth, async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ user: req.user.id });
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital profile not found' });
    }

    const allowedFields = [
      'hospitalName', 'registrationNumber', 'type', 'phone', 'email',
      'address', 'district', 'province', 'contactPerson', 'profilePicture',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        hospital[field] = req.body[field];
      }
    });

    await hospital.save();
    res.json({ hospital });
  } catch (err) {
    console.error('Hospital profile update error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'This registration number is already in use by another hospital.' });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;