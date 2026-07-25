const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000','http://localhost:3001','http://localhost:3002','http://localhost:3003'],
    methods: ['GET','POST'],
    credentials: true,
  }
});

app.use(cors({
  origin: ['http://localhost:3000','http://localhost:3001','http://localhost:3002','http://localhost:3003'],
  credentials: true
}));
// Limit raised from the default 100kb so base64-encoded profile photos
// (e.g. hospital/blood bank profile pictures) can be saved via JSON body.
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

app.set('io', io);

app.use('/api/auth',          require('./routes/auth'));
app.use('/api/donors',        require('./routes/donors'));
app.use('/api/donor',         require('./routes/donor'));
app.use('/api/hospital-auth', require('./routes/hospitalAuth'));
app.use('/api/hospitals',     require('./routes/hospitals'));
app.use('/api/bloodbanks',    require('./routes/bloodbanks'));
app.use('/api/blood-requests',require('./routes/bloodRequests'));
app.use('/api/inventory',     require('./routes/inventory'));
app.use('/api/campaigns',     require('./routes/campaigns'));
app.use('/api/dashboard',     require('./routes/dashboard'));
app.use('/api/ai',            require('./routes/ai'));
app.use('/api/tracking',      require('./routes/tracking'));
app.use('/api/emergency-requests', require('./routes/emergencyRequests'));
app.use('/api/reports',            require('./routes/reports'));
app.use('/api/pending-approvals',  require('./routes/pendingApprovals'));
app.use('/api/staff',              require('./routes/staff'));
app.use('/api/notifications',      require('./routes/notifications'));
app.use('/api/feedback',           require('./routes/feedback'));
app.use('/api/analytics',          require('./routes/analytics'));
app.use('/api/locations',          require('./routes/locations'));
app.use('/api/security',           require('./routes/security'));
app.use('/api/settings',           require('./routes/settings'));
app.use('/api/system-health',      require('./routes/systemHealth'));
app.use('/api/donor-certificates', require('./routes/donorCertificates'));
app.use('/api/blood-bank-assets', require('./routes/bloodBankAssets'));
app.use('/api/hospital-assets', require('./routes/hospitalAssets'));
app.use('/api/staff-hr', require('./routes/staffHR'));
app.use('/api/blood-bags', require('./routes/bloodBags'));
app.use('/api/emergency-extras', require('./routes/emergencyExtras'));
app.use('/api/push', require('./routes/push'));
app.use('/api/sms', require('./routes/sms'));
app.use('/api/hospital-donor-testing', require('./routes/hospitalDonorTesting'));
app.use('/api/hospital-patients', require('./routes/hospitalPatients'));
app.use('/api/hospital-staff', require('./routes/hospitalStaff'));
app.use('/api/hospital-transfusions', require('./routes/hospitalTransfusions'));
app.use('/api/hospital-verification', require('./routes/hospitalVerification'));
app.use('/api/hospital-partnerships', require('./routes/hospitalPartnerships'));
app.use('/api/hospital-partnerships', require('./routes/hospitalPartnerships'));
app.use('/api/hospital-activity-logs', require('./routes/hospitalActivityLogs'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'BloodCare API running', timestamp: new Date() });
});

// Socket.IO events
io.on('connection', (socket) => {
  console.log(`🔌 Connected: ${socket.id}`);

  socket.on('join_admin', () => {
    socket.join('admin_room');
    console.log(`👮 Admin joined`);
  });

  socket.on('join_tracking', (data) => {
    socket.join(`tracking_${data.requestId}`);
    console.log(`📍 Joined room: ${data.requestId}`);
  });

  socket.on('update_location', (data) => {
    io.to('admin_room').emit('location_updated', data);
    io.to(`tracking_${data.requestId}`).emit('location_updated', data);
    console.log(`📍 Location: ${data.lat}, ${data.lng}`);
  });

  socket.on('journey_status', (data) => {
    io.to('admin_room').emit('journey_status_updated', data);
    io.to(`tracking_${data.requestId}`).emit('journey_status_updated', data);
  });

  // Donor joins their own personal room to receive emergency requests
  socket.on('join_donor', (data) => {
    socket.join(`donor:${data.donorId}`);
    console.log(`🩸 Donor joined: donor:${data.donorId}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Disconnected: ${socket.id}`);
  });
});

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bloodcare');
    console.log('✅ MongoDB Connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

connectDB();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🩸 BloodCare Server running on port ${PORT}`);
});

module.exports = app;