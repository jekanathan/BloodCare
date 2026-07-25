const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Staff = require('../models/Staff');
const Role = require('../models/Role');
const User = require('../models/User');

const ALL_PERMISSIONS = [
  {group:'Donors',      items:['View Donors','Add Donor','Edit Donor','Delete Donor','Approve Donor','Blacklist Donor']},
  {group:'Blood Banks', items:['View Blood Banks','Add Blood Bank','Edit Blood Bank','Approve Blood Bank']},
  {group:'Hospitals',   items:['View Hospitals','Add Hospital','Edit Hospital','Approve Hospital']},
  {group:'Inventory',   items:['View Inventory','Add Stock','Transfer Stock','Delete Stock']},
  {group:'Requests',    items:['View Requests','Approve Request','Reject Request','Dispatch Blood']},
  {group:'Reports',     items:['View Reports','Export Reports','Generate Reports']},
  {group:'Emergency',   items:['Send Broadcast','View Emergency','Create Emergency']},
  {group:'Settings',    items:['View Settings','Edit Settings','Manage Users']},
];

async function ensureDefaultRoles() {
  const count = await Role.countDocuments();
  if (count > 0) return;

  await Role.insertMany([
    { name:'Super Admin',     color:'#C41E3A', bg:'#FEE2E8', permissions:['all'], isSystemRole:true,
      description:'Full system access' },
    { name:'Blood Bank Admin',color:'#7C3AED', bg:'#EDE9FE', permissions:['View Inventory','Add Stock','Transfer Stock','View Reports','View Donors'],
      description:'Manage blood bank operations' },
    { name:'Hospital Admin',  color:'#2563EB', bg:'#DBEAFE', permissions:['View Requests','Approve Request','Reject Request','View Reports'],
      description:'Manage hospital blood requests' },
    { name:'Volunteer',       color:'#D97706', bg:'#FEF3C7', permissions:['View Donors'],
      description:'Campaign volunteer access' },
    { name:'Lab Technician',  color:'#0891B2', bg:'#CFFAFE', permissions:['View Inventory','Add Stock'],
      description:'Blood testing & lab access' },
    { name:'Reception Staff', color:'#9333EA', bg:'#F3E8FF', permissions:['View Donors','Add Donor'],
      description:'Front desk & registration' },
  ]);
}

async function generateEmployeeId() {
  const count = await Staff.countDocuments();
  return `BC-EMP-${String(count + 1).padStart(6, '0')}`;
}

// ─── GET /api/staff/roles ─────────────────────────────────────────────────
router.get('/roles', auth, async (req, res) => {
  try {
    await ensureDefaultRoles();
    const roles = await Role.find().sort({ createdAt: 1 });
    const counts = await Staff.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);
    const countMap = {};
    counts.forEach(c => { countMap[c._id.toString()] = c.count; });

    const rolesWithCounts = roles.map(r => ({
      _id: r._id,
      name: r.name,
      description: r.description,
      color: r.color,
      bg: r.bg,
      permissions: r.permissions,
      isSystemRole: r.isSystemRole,
      users: countMap[r._id.toString()] || 0,
    }));

    res.json({ roles: rolesWithCounts, allPermissions: ALL_PERMISSIONS });
  } catch (err) {
    console.error('Get roles error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── POST /api/staff/roles ────────────────────────────────────────────────
router.post('/roles', auth, async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    if (!name) return res.status(400).json({ message: 'Role name is required' });

    const existing = await Role.findOne({ name });
    if (existing) return res.status(400).json({ message: 'A role with this name already exists' });

    const palette = ['#0EA5E9','#22C55E','#F97316','#EC4899','#6366F1','#14B8A6'];
    const role = new Role({
      name, description,
      permissions: permissions || [],
      color: palette[Math.floor(Math.random()*palette.length)],
      bg: '#F1F5F9',
    });
    await role.save();
    res.status(201).json({ message: 'Role created', role });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── PATCH /api/staff/roles/:id/permissions ───────────────────────────────
router.patch('/roles/:id/permissions', auth, async (req, res) => {
  try {
    const { permissions } = req.body;
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ message: 'Role not found' });
    if (role.isSystemRole) return res.status(403).json({ message: 'Cannot modify Super Admin permissions' });

    role.permissions = permissions || [];
    await role.save();
    res.json({ message: 'Permissions updated', role });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── GET /api/staff ─────────────────────────────────────────────────────────
// Supports ?staffType=Blood Bank Staff to filter
router.get('/', auth, async (req, res) => {
  try {
    await ensureDefaultRoles();
    const { staffType } = req.query;
    const query = {};
    if (staffType) query.staffType = staffType;

    const staff = await Staff.find(query).populate('role', 'name color bg').sort({ createdAt: -1 });
    res.json({
      staff: staff.map(s => ({
        _id: s._id,
        employeeId: s.employeeId,
        name: s.name,
        email: s.email,
        phone: s.phone,
        department: s.department,
        staffType: s.staffType,
        role: s.role?.name || 'Unassigned',
        roleId: s.role?._id,
        roleColor: s.role?.color,
        roleBg: s.role?.bg,
        status: s.status,
        lastLogin: s.lastLogin,
        avatar: s.name?.charAt(0).toUpperCase(),
      })),
    });
  } catch (err) {
    console.error('Get staff error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── POST /api/staff ────────────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { name, email, phone, password, roleId, department, staffType } = req.body;
    if (!name || !email || !password || !roleId) {
      return res.status(400).json({ message: 'Name, email, password, and role are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const user = new User({ name, email: email.toLowerCase(), password, role: 'staff', status: 'approved' });
    await user.save();

    try {
      const employeeId = await generateEmployeeId();
      const staff = new Staff({ user: user._id, employeeId, name, email: email.toLowerCase(), phone, department, staffType: staffType || 'Admin Staff', role: roleId, status: 'active' });
      await staff.save();
      res.status(201).json({ message: 'Staff member added', staff });
    } catch (staffErr) {
      await User.findByIdAndDelete(user._id);
      throw staffErr;
    }
  } catch (err) {
    console.error('Add staff error:', err);
    if (err.code === 11000) return res.status(400).json({ message: 'Email already registered' });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── PUT /api/staff/:id ─────────────────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, phone, department, roleId, staffType } = req.body;
    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      { name, phone, department, staffType, ...(roleId ? { role: roleId } : {}) },
      { new: true }
    ).populate('role', 'name color bg');
    if (!staff) return res.status(404).json({ message: 'Staff not found' });
    res.json({ message: 'Staff updated', staff });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── PATCH /api/staff/:id/toggle-status ──────────────────────────────────────
router.patch('/:id/toggle-status', auth, async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ message: 'Staff not found' });
    staff.status = staff.status === 'active' ? 'inactive' : 'active';
    await staff.save();
    res.json({ message: 'Status updated', staff });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── DELETE /api/staff/:id ────────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ message: 'Staff not found' });

    await User.findByIdAndDelete(staff.user);
    await Staff.findByIdAndDelete(req.params.id);

    res.json({ message: 'Staff member deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;