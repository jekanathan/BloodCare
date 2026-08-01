const express = require('express');
const router  = express.Router();

// Mock tracking data — later connect to MongoDB
const trackingData = new Map();

// Update location
router.post('/location', (req, res) => {
  try {
    const { requestId, lat, lng, type, name, status, speed } = req.body;
    
    const location = {
      requestId, lat, lng, type, name, status, speed,
      timestamp: new Date(),
    };
    
    trackingData.set(requestId, location);
    
    // Emit to all via Socket.IO
    const io = req.app.get('io');
    io.to('admin_room').emit('location_updated', location);
    
    res.json({ success: true, location });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all active tracking
router.get('/active', (req, res) => {
  try {
    const active = Array.from(trackingData.values());
    res.json({ success: true, data: active });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get tracking by requestId
router.get('/:requestId', (req, res) => {
  try {
    const data = trackingData.get(req.params.requestId);
    if (!data) return res.status(404).json({ error: 'Tracking not found' });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;