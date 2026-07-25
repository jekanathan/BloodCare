/**
 * ╔══════════════════════════════════════════════════════╗
 * ║   BloodCare — Full MongoDB Database Seed Script     ║
 * ║   Run: node seed.js                                 ║
 * ╚══════════════════════════════════════════════════════╝
 *
 * Creates all collections with realistic Sri Lankan data:
 * → 1 Admin
 * → 3 Blood Banks
 * → 5 Hospitals
 * → 20 Donors
 * → 10 Patients
 * → 15 Blood Requests
 * → 12 Donations
 * → Blood Tests, Inventory, Campaigns, Appointments, Notifications
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.mongodb.net/bloodcare?retryWrites=true&w=majority';

// ─── Helpers ────────────────────────────────────────────
const hash  = async (pw) => bcrypt.hash(pw, 12);
const daysAgo  = (n) => new Date(Date.now() - n * 86400000);
const daysAhead = (n) => new Date(Date.now() + n * 86400000);
const pick  = (arr) => arr[Math.floor(Math.random() * arr.length)];

const BG   = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const DIST = ['Colombo','Gampaha','Kalutara','Kandy','Matale','Galle','Matara','Jaffna','Trincomalee','Kurunegala','Anuradhapura','Badulla','Ratnapura','Kegalle'];

// ─── Schemas (lightweight, just for seeding) ────────────
const userSchema = new mongoose.Schema({
  name:String, email:String, password:String,
  role:{type:String,enum:['admin','donor','hospital','blood_bank']},
  status:{type:String,default:'approved'},
},{timestamps:true});

const donorSchema = new mongoose.Schema({
  user:mongoose.Schema.Types.ObjectId,
  fullName:String, nic:String, dateOfBirth:Date, gender:String,
  bloodGroup:String, phone:String, email:String, address:String,
  district:String, lastDonationDate:Date, totalDonations:Number,
  isEligible:Boolean, medicalInfo:String, status:String,
  approvedBy:mongoose.Schema.Types.ObjectId, approvedAt:Date,
},{timestamps:true});

const hospitalSchema = new mongoose.Schema({
  user:mongoose.Schema.Types.ObjectId,
  hospitalName:String, registrationNumber:String, type:String,
  phone:String, email:String, address:String, district:String,
  contactPerson:String, status:String, totalRequests:Number,
  approvedBy:mongoose.Schema.Types.ObjectId, approvedAt:Date,
},{timestamps:true});

const bloodBankSchema = new mongoose.Schema({
  user:mongoose.Schema.Types.ObjectId,
  bankName:String, licenseNumber:String,
  phone:String, email:String, address:String, district:String,
  contactPerson:String, status:String,
  approvedBy:mongoose.Schema.Types.ObjectId, approvedAt:Date,
},{timestamps:true});

const patientSchema = new mongoose.Schema({
  hospital:mongoose.Schema.Types.ObjectId,
  name:String, age:Number, gender:String,
  diagnosis:String, bloodGroup:String, unitsNeeded:Number,
  ward:String, status:String, transfusionStatus:String,
},{timestamps:true});

const inventorySchema = new mongoose.Schema({
  bloodBank:mongoose.Schema.Types.ObjectId,
  bloodGroup:String, units:Number, lastUpdated:Date,
},{timestamps:true});

const bloodRequestSchema = new mongoose.Schema({
  hospital:mongoose.Schema.Types.ObjectId,
  bloodBank:mongoose.Schema.Types.ObjectId,
  patientName:String, bloodGroup:String,
  unitsRequired:Number, unitsProvided:Number,
  priority:String, status:String,
  notes:String, requestedAt:Date, fulfilledAt:Date,
},{timestamps:true});

const donationSchema = new mongoose.Schema({
  donor:mongoose.Schema.Types.ObjectId,
  bloodBank:mongoose.Schema.Types.ObjectId,
  bloodGroup:String, units:Number,
  donationType:String, source:String, status:String,
  donatedAt:Date,
},{timestamps:true});

const bloodTestSchema = new mongoose.Schema({
  donation:mongoose.Schema.Types.ObjectId,
  bloodUnit:String,
  donor:mongoose.Schema.Types.ObjectId,
  bloodGroup:String,
  hiv:String, hbv:String, hcv:String, syphilis:String, malaria:String,
  result:String, testedAt:Date,
},{timestamps:true});

const appointmentSchema = new mongoose.Schema({
  donor:mongoose.Schema.Types.ObjectId,
  bloodBank:mongoose.Schema.Types.ObjectId,
  date:Date, time:String, status:String, notes:String,
},{timestamps:true});

const campaignSchema = new mongoose.Schema({
  title:String, description:String,
  bloodBank:mongoose.Schema.Types.ObjectId,
  targetBloodGroups:[String],
  startDate:Date, endDate:Date,
  targetUnits:Number, collectedUnits:Number,
  status:String, notificationsSent:Number, donorsResponded:Number,
  createdBy:mongoose.Schema.Types.ObjectId,
},{timestamps:true});

const notificationSchema = new mongoose.Schema({
  recipient:mongoose.Schema.Types.ObjectId,
  recipientRole:String,
  type:String, title:String, message:String,
  read:Boolean, data:Object,
},{timestamps:true});

const screeningSchema = new mongoose.Schema({
  donor:mongoose.Schema.Types.ObjectId,
  donation:mongoose.Schema.Types.ObjectId,
  hemoglobin:Number, bloodPressure:String, weight:Number,
  pulse:Number, temperature:Number, passed:Boolean, notes:String,
},{timestamps:true});

// ─── Models ─────────────────────────────────────────────
const User         = mongoose.model('User',         userSchema);
const Donor        = mongoose.model('Donor',        donorSchema);
const Hospital     = mongoose.model('Hospital',     hospitalSchema);
const BloodBank    = mongoose.model('BloodBank',    bloodBankSchema);
const Patient      = mongoose.model('Patient',      patientSchema);
const Inventory    = mongoose.model('Inventory',    inventorySchema);
const BloodRequest = mongoose.model('BloodRequest', bloodRequestSchema);
const Donation     = mongoose.model('Donation',     donationSchema);
const BloodTest    = mongoose.model('BloodTest',    bloodTestSchema);
const Appointment  = mongoose.model('Appointment',  appointmentSchema);
const Campaign     = mongoose.model('Campaign',     campaignSchema);
const Notification = mongoose.model('Notification', notificationSchema);
const Screening    = mongoose.model('Screening',    screeningSchema);

// ═══════════════════════════════════════════════════════
//  SEED DATA
// ═══════════════════════════════════════════════════════
async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB Atlas\n');

  // ── Drop existing data ──────────────────────────────
  console.log('🗑️  Clearing existing data...');
  await Promise.all([
    User.deleteMany({}), Donor.deleteMany({}), Hospital.deleteMany({}),
    BloodBank.deleteMany({}), Patient.deleteMany({}), Inventory.deleteMany({}),
    BloodRequest.deleteMany({}), Donation.deleteMany({}), BloodTest.deleteMany({}),
    Appointment.deleteMany({}), Campaign.deleteMany({}),
    Notification.deleteMany({}), Screening.deleteMany({}),
  ]);
  console.log('✅ Cleared\n');

  // ── 1. ADMIN ─────────────────────────────────────────
  console.log('👤 Creating Admin...');
  const adminUser = await User.create({
    name: 'BloodCare Admin',
    email: 'admin@bloodcare.lk',
    password: await hash('Admin@123'),
    role: 'admin', status: 'approved',
  });
  console.log('   ✅ admin@bloodcare.lk / Admin@123');

  // ── 2. BLOOD BANKS ───────────────────────────────────
  console.log('\n🏦 Creating Blood Banks...');
  const bloodBankData = [
    { name:'National Blood Bank',           license:'NBB/001/2024', district:'Colombo',    address:'Borella, Colombo 8',           phone:'0112345678', email:'info@nbb.lk',         contact:'Dr. Dilrukshi Perera' },
    { name:'City Blood Bank',               license:'CBB/002/2024', district:'Colombo',    address:'Maradana, Colombo 10',         phone:'0113456789', email:'info@cityblood.lk',   contact:'Mr. Manoj Fernando' },
    { name:'Kandy Regional Blood Bank',     license:'KBB/003/2024', district:'Kandy',      address:'Kandy Town, Kandy',            phone:'0812345678', email:'info@kandyblood.lk',  contact:'Dr. Nirosha Silva' },
  ];

  const bbUsers = [];
  const bloodBanks = [];
  for (const b of bloodBankData) {
    const u = await User.create({ name:b.name, email:b.email, password:await hash('Bank@123'), role:'blood_bank', status:'approved' });
    const bb = await BloodBank.create({ user:u._id, bankName:b.name, licenseNumber:b.license, phone:b.phone, email:b.email, address:b.address, district:b.district, contactPerson:b.contact, status:'approved', approvedBy:adminUser._id, approvedAt:daysAgo(30) });
    bbUsers.push(u); bloodBanks.push(bb);
    console.log(`   ✅ ${b.name} — ${b.email} / Bank@123`);
  }

  // ── 3. HOSPITALS ─────────────────────────────────────
  console.log('\n🏥 Creating Hospitals...');
  const hospitalData = [
    { name:'National Hospital Colombo',      reg:'NH/001/2024',  type:'Government', district:'Colombo', address:'Regent Street, Colombo 8',     phone:'0112345600', email:'info@nationalhospital.lk',  contact:'Dr. Priya Kumara' },
    { name:'Asiri Medical Hospital',         reg:'AMH/002/2024', type:'Private',    district:'Colombo', address:'Kirula Road, Colombo 5',        phone:'0112520000', email:'info@asiri.lk',             contact:'Dr. Asela Fernando' },
    { name:'Kandy Teaching Hospital',        reg:'KTH/003/2024', type:'Teaching',   district:'Kandy',   address:'Kandy Town, Kandy',             phone:'0812222261', email:'info@kandyhospital.lk',     contact:'Dr. Ruwan Perera' },
    { name:'Galle Base Hospital',            reg:'GBH/004/2024', type:'Government', district:'Galle',   address:'Galle Town, Galle',             phone:'0912222261', email:'info@gallehospital.lk',     contact:'Dr. Chamara Silva' },
    { name:'Colombo South Teaching Hospital',reg:'CSTH/005/2024',type:'Teaching',   district:'Colombo', address:'Kalubowila, Dehiwala',          phone:'0112751111', email:'info@csth.lk',              contact:'Dr. Samantha Jayawardena' },
  ];

  const hospitals = [];
  for (const h of hospitalData) {
    const u = await User.create({ name:h.name, email:h.email, password:await hash('Hospital@123'), role:'hospital', status:'approved' });
    const hosp = await Hospital.create({ user:u._id, hospitalName:h.name, registrationNumber:h.reg, type:h.type, phone:h.phone, email:h.email, address:h.address, district:h.district, contactPerson:h.contact, status:'approved', totalRequests:0, approvedBy:adminUser._id, approvedAt:daysAgo(25) });
    hospitals.push(hosp);
    console.log(`   ✅ ${h.name} — ${h.email} / Hospital@123`);
  }

  // ── 4. DONORS ─────────────────────────────────────────
  console.log('\n👥 Creating Donors (20)...');
  const donorRawData = [
    { name:'Kamal Perera',      nic:'199012345678', dob:'1990-06-15', gender:'Male',   blood:'O+',  phone:'0712345678', email:'kamal@email.com',    dist:'Colombo',    donations:7, lastDon:daysAgo(90),  eligible:true  },
    { name:'Nimal Silva',       nic:'198523456789', dob:'1985-03-22', gender:'Male',   blood:'A+',  phone:'0723456789', email:'nimal@email.com',    dist:'Kandy',      donations:3, lastDon:daysAgo(45),  eligible:true  },
    { name:'Sandya Fernando',   nic:'200134567890', dob:'2001-11-08', gender:'Female', blood:'B+',  phone:'0734567890', email:'sandya@email.com',   dist:'Galle',      donations:2, lastDon:daysAgo(120), eligible:true  },
    { name:'Roshan Jayawardena',nic:'199245678901', dob:'1992-08-30', gender:'Male',   blood:'AB-', phone:'0745678901', email:'roshan@email.com',   dist:'Colombo',    donations:5, lastDon:daysAgo(60),  eligible:true  },
    { name:'Chamari Dissanayake',nic:'199756789012',dob:'1997-04-12', gender:'Female', blood:'O-',  phone:'0756789012', email:'chamari@email.com',  dist:'Matara',     donations:1, lastDon:daysAgo(200), eligible:true  },
    { name:'Ruwan Bandara',     nic:'198867890123', dob:'1988-12-05', gender:'Male',   blood:'A-',  phone:'0767890123', email:'ruwan@email.com',    dist:'Colombo',    donations:4, lastDon:daysAgo(30),  eligible:false },
    { name:'Dilani Rathnayake', nic:'199578901234', dob:'1995-07-18', gender:'Female', blood:'B-',  phone:'0778901234', email:'dilani@email.com',   dist:'Gampaha',    donations:6, lastDon:daysAgo(100), eligible:true  },
    { name:'Pradeep Gunawardena',nic:'199289012345',dob:'1992-02-25', gender:'Male',   blood:'AB+', phone:'0789012345', email:'pradeep@email.com',  dist:'Colombo',    donations:2, lastDon:daysAgo(80),  eligible:true  },
    { name:'Thilini Wijesekara',nic:'199990123456', dob:'1999-09-14', gender:'Female', blood:'O+',  phone:'0790123456', email:'thilini@email.com',  dist:'Kandy',      donations:0, lastDon:null,         eligible:true  },
    { name:'Asitha Madushanka', nic:'198701234567', dob:'1987-01-03', gender:'Male',   blood:'O+',  phone:'0701234567', email:'asitha@email.com',   dist:'Colombo',    donations:10,lastDon:daysAgo(95),  eligible:true  },
    { name:'Nadeesha Kumari',   nic:'199612345670', dob:'1996-05-20', gender:'Female', blood:'A+',  phone:'0711234567', email:'nadeesha@email.com', dist:'Galle',      donations:3, lastDon:daysAgo(55),  eligible:true  },
    { name:'Chathura Senanayake',nic:'199323456781',dob:'1993-10-11', gender:'Male',   blood:'B+',  phone:'0722345678', email:'chathura@email.com', dist:'Colombo',    donations:8, lastDon:daysAgo(110), eligible:true  },
    { name:'Malsha Priyadarshani',nic:'200034567892',dob:'2000-03-07',gender:'Female', blood:'AB+', phone:'0733456789', email:'malsha@email.com',   dist:'Kurunegala', donations:1, lastDon:daysAgo(180), eligible:true  },
    { name:'Janith Peiris',     nic:'199145678903', dob:'1991-08-16', gender:'Male',   blood:'O-',  phone:'0744567890', email:'janith@email.com',   dist:'Colombo',    donations:5, lastDon:daysAgo(70),  eligible:true  },
    { name:'Samanthi Rajapaksa',nic:'199856789014', dob:'1998-12-29', gender:'Female', blood:'O+',  phone:'0755678901', email:'samanthi@email.com', dist:'Matara',     donations:2, lastDon:daysAgo(160), eligible:true  },
    { name:'Kasun Wickramasinghe',nic:'199067890125',dob:'1990-06-04',gender:'Male',   blood:'A-',  phone:'0766789012', email:'kasun@email.com',    dist:'Colombo',    donations:6, lastDon:daysAgo(40),  eligible:false },
    { name:'Imesha Dissanayake',nic:'200178901236', dob:'2001-09-21', gender:'Female', blood:'B-',  phone:'0777890123', email:'imesha@email.com',   dist:'Badulla',    donations:0, lastDon:null,         eligible:true  },
    { name:'Dhanuka Liyanage',  nic:'199589012347', dob:'1995-02-14', gender:'Male',   blood:'AB-', phone:'0788901234', email:'dhanuka@email.com',  dist:'Colombo',    donations:4, lastDon:daysAgo(85),  eligible:true  },
    { name:'Sachini Herath',    nic:'199290123458', dob:'1992-07-07', gender:'Female', blood:'O+',  phone:'0799012345', email:'sachini@email.com',  dist:'Kandy',      donations:3, lastDon:daysAgo(50),  eligible:true  },
    { name:'Pasan Tharaka',     nic:'199801234569', dob:'1998-11-30', gender:'Male',   blood:'A+',  phone:'0700123456', email:'pasan@email.com',    dist:'Gampaha',    donations:1, lastDon:daysAgo(220), eligible:true  },
  ];

  const donors = [];
  for (const d of donorRawData) {
    const status = d.name === 'Roshan Jayawardena' || d.name === 'Thilini Wijesekara' ? 'pending' : 'approved';
    const u = await User.create({ name:d.name, email:d.email, password:await hash('Donor@123'), role:'donor', status });
    const donor = await Donor.create({
      user:u._id, fullName:d.name, nic:d.nic, dateOfBirth:new Date(d.dob),
      gender:d.gender, bloodGroup:d.blood, phone:d.phone, email:d.email,
      address:`No. ${Math.floor(Math.random()*200)+1}, Main Street, ${d.dist}`,
      district:d.dist, lastDonationDate:d.lastDon,
      totalDonations:d.donations, isEligible:d.eligible,
      medicalInfo:'No known allergies',
      status, approvedBy:status==='approved'?adminUser._id:undefined,
      approvedAt:status==='approved'?daysAgo(20):undefined,
    });
    donors.push(donor);
  }
  console.log(`   ✅ 20 donors created (18 approved, 2 pending) — all: Donor@123`);

  // ── 5. INVENTORY ─────────────────────────────────────
  console.log('\n📦 Creating Blood Inventory...');
  const invData = [
    // National Blood Bank
    {bb:0,'A+':125,'A-':32,'B+':98,'B-':15,'AB+':45,'AB-':6,'O+':167,'O-':42},
    // City Blood Bank
    {bb:1,'A+':80, 'A-':18,'B+':62,'B-':8, 'AB+':28,'AB-':4, 'O+':110,'O-':25},
    // Kandy Blood Bank
    {bb:2,'A+':95, 'A-':22,'B+':71,'B-':11,'AB+':35,'AB-':7, 'O+':130,'O-':38},
  ];

  for (const inv of invData) {
    for (const bg of BG) {
      await Inventory.create({
        bloodBank: bloodBanks[inv.bb]._id,
        bloodGroup: bg, units: inv[bg] || 0,
        lastUpdated: new Date(),
      });
    }
  }

  // Total summary
  const totals = {};
  for (const bg of BG) {
    totals[bg] = invData.reduce((s, i) => s + (i[bg] || 0), 0);
  }
  console.log('   ✅ Inventory created:');
  BG.forEach(g => console.log(`      ${g.padEnd(4)} → ${totals[g]} units total`));

  // ── 6. PATIENTS ──────────────────────────────────────
  console.log('\n🛏️  Creating Patients...');
  const patientData = [
    { hosp:0, name:'Kamal Jayasinghe',  age:45, gender:'Male',   diag:'Cardiac Surgery',       blood:'O+',  units:2, ward:'ICU',       tStatus:'pending'   },
    { hosp:0, name:'Priya Kumara',      age:32, gender:'Female',  diag:'Road Accident',         blood:'A+',  units:1, ward:'Emergency', tStatus:'completed' },
    { hosp:1, name:'Sunil Rathnayake',  age:60, gender:'Male',   diag:'Heart Surgery',          blood:'AB-', units:3, ward:'Surgery',   tStatus:'pending'   },
    { hosp:1, name:'Malini Perera',     age:28, gender:'Female',  diag:'Maternity',             blood:'B+',  units:1, ward:'Maternity', tStatus:'completed' },
    { hosp:2, name:'Amal De Silva',     age:38, gender:'Male',   diag:'Anaemia',                blood:'O-',  units:2, ward:'General',   tStatus:'pending'   },
    { hosp:2, name:'Kumari Fernando',   age:55, gender:'Female',  diag:'Kidney Disease',        blood:'A-',  units:2, ward:'ICU',       tStatus:'pending'   },
    { hosp:3, name:'Rohan Bandara',     age:42, gender:'Male',   diag:'Gastrointestinal Bleed', blood:'O+',  units:2, ward:'Surgery',   tStatus:'completed' },
    { hosp:3, name:'Nisha Wickrama',    age:25, gender:'Female',  diag:'Thalassemia',           blood:'B-',  units:1, ward:'Paediatric',tStatus:'pending'   },
    { hosp:4, name:'Gamini Jayawardena',age:70, gender:'Male',   diag:'Liver Disease',          blood:'AB+', units:2, ward:'General',   tStatus:'pending'   },
    { hosp:4, name:'Dilrukshi Perera',  age:35, gender:'Female',  diag:'Post Surgery Recovery', blood:'O+',  units:1, ward:'Surgery',   tStatus:'completed' },
  ];

  const patients = [];
  for (const p of patientData) {
    const pat = await Patient.create({
      hospital: hospitals[p.hosp]._id,
      name:p.name, age:p.age, gender:p.gender,
      diagnosis:p.diag, bloodGroup:p.blood, unitsNeeded:p.units,
      ward:p.ward, status:'active', transfusionStatus:p.tStatus,
    });
    patients.push(pat);
  }
  console.log('   ✅ 10 patients created');

  // ── 7. BLOOD REQUESTS ────────────────────────────────
  console.log('\n🩸 Creating Blood Requests...');
  const requestData = [
    { hosp:0, bb:0, pat:'Kamal Jayasinghe',  blood:'O+',  units:2, pri:'Emergency', status:'pending',    notes:'Urgent cardiac surgery', daysBack:0  },
    { hosp:0, bb:1, pat:'Priya Kumara',      blood:'A+',  units:1, pri:'Urgent',    status:'fulfilled',  notes:'Road accident',          daysBack:1  },
    { hosp:1, bb:0, pat:'Sunil Rathnayake',  blood:'AB-', units:3, pri:'Emergency', status:'processing', notes:'Heart surgery tomorrow',  daysBack:0  },
    { hosp:1, bb:0, pat:'Malini Perera',     blood:'B+',  units:1, pri:'Normal',    status:'fulfilled',  notes:'Maternity case',         daysBack:2  },
    { hosp:2, bb:2, pat:'Amal De Silva',     blood:'O-',  units:2, pri:'Urgent',    status:'pending',    notes:'Chronic anaemia',        daysBack:0  },
    { hosp:2, bb:2, pat:'Kumari Fernando',   blood:'A-',  units:2, pri:'Emergency', status:'pending',    notes:'Kidney failure',         daysBack:0  },
    { hosp:3, bb:1, pat:'Rohan Bandara',     blood:'O+',  units:2, pri:'Urgent',    status:'fulfilled',  notes:'GI bleed',               daysBack:3  },
    { hosp:3, bb:0, pat:'Nisha Wickrama',    blood:'B-',  units:1, pri:'Normal',    status:'processing', notes:'Thalassemia treatment',  daysBack:1  },
    { hosp:4, bb:0, pat:'Gamini Jayawardena',blood:'AB+', units:2, pri:'Normal',    status:'fulfilled',  notes:'Liver disease',          daysBack:5  },
    { hosp:4, bb:1, pat:'Dilrukshi Perera',  blood:'O+',  units:1, pri:'Normal',    status:'fulfilled',  notes:'Post surgery',           daysBack:4  },
    { hosp:0, bb:0, pat:'Emergency Patient', blood:'O+',  units:4, pri:'Emergency', status:'rejected',   notes:'Stock not available at time', daysBack:7 },
    { hosp:1, bb:2, pat:'Scheduled Surgery', blood:'A+',  units:2, pri:'Normal',    status:'fulfilled',  notes:'Planned surgery',        daysBack:10 },
    { hosp:2, bb:0, pat:'Accident Victim',   blood:'O-',  units:3, pri:'Emergency', status:'fulfilled',  notes:'Multiple trauma',        daysBack:8  },
    { hosp:3, bb:1, pat:'Cancer Patient',    blood:'B+',  units:2, pri:'Urgent',    status:'fulfilled',  notes:'Chemotherapy support',   daysBack:12 },
    { hosp:4, bb:2, pat:'Child Patient',     blood:'AB-', units:1, pri:'Urgent',    status:'fulfilled',  notes:'Paediatric surgery',     daysBack:6  },
  ];

  const bloodRequests = [];
  for (const r of requestData) {
    const req = await BloodRequest.create({
      hospital: hospitals[r.hosp]._id,
      bloodBank: bloodBanks[r.bb]._id,
      patientName: r.pat, bloodGroup: r.blood,
      unitsRequired: r.units, unitsProvided: r.status==='fulfilled'?r.units:0,
      priority: r.pri, status: r.status, notes: r.notes,
      requestedAt: daysAgo(r.daysBack),
      fulfilledAt: r.status==='fulfilled' ? daysAgo(r.daysBack) : undefined,
    });
    bloodRequests.push(req);
  }
  console.log('   ✅ 15 blood requests created');

  // ── 8. DONATIONS ─────────────────────────────────────
  console.log('\n💉 Creating Donations...');
  const donationList = [
    { donor:0,  bb:0, blood:'O+',  source:'Walk-in',             daysBack:0  },
    { donor:1,  bb:2, blood:'A+',  source:'Campaign',            daysBack:1  },
    { donor:2,  bb:0, blood:'B+',  source:'Walk-in',             daysBack:1  },
    { donor:3,  bb:1, blood:'AB-', source:'Emergency request',   daysBack:0  },
    { donor:4,  bb:0, blood:'O-',  source:'Walk-in',             daysBack:2  },
    { donor:6,  bb:1, blood:'B-',  source:'Campaign',            daysBack:3  },
    { donor:7,  bb:0, blood:'AB+', source:'Walk-in',             daysBack:4  },
    { donor:9,  bb:0, blood:'O+',  source:'Hospital referral',   daysBack:2  },
    { donor:10, bb:2, blood:'A+',  source:'Walk-in',             daysBack:5  },
    { donor:11, bb:1, blood:'B+',  source:'Campaign',            daysBack:3  },
    { donor:13, bb:0, blood:'O-',  source:'Emergency request',   daysBack:1  },
    { donor:17, bb:2, blood:'AB-', source:'Walk-in',             daysBack:6  },
  ];

  const donations = [];
  for (let i = 0; i < donationList.length; i++) {
    const d = donationList[i];
    const don = await Donation.create({
      donor:    donors[d.donor]._id,
      bloodBank:bloodBanks[d.bb]._id,
      bloodGroup: d.blood, units: 450,
      donationType: 'Whole Blood', source: d.source,
      status: 'completed', donatedAt: daysAgo(d.daysBack),
    });
    donations.push(don);
  }
  console.log('   ✅ 12 donations recorded');

  // ── 9. SCREENINGS ────────────────────────────────────
  console.log('\n🩺 Creating Screenings...');
  for (const don of donations) {
    await Screening.create({
      donor: don.donor, donation: don._id,
      hemoglobin: parseFloat((13 + Math.random() * 2).toFixed(1)),
      bloodPressure: `${110 + Math.floor(Math.random()*20)}/${70 + Math.floor(Math.random()*15)}`,
      weight: 60 + Math.floor(Math.random() * 30),
      pulse: 65 + Math.floor(Math.random() * 20),
      temperature: parseFloat((36.5 + Math.random() * 0.8).toFixed(1)),
      passed: true, notes: 'All vitals normal',
    });
  }
  console.log('   ✅ 12 screening records created');

  // ── 10. BLOOD TESTS ──────────────────────────────────
  console.log('\n🧪 Creating Blood Tests...');
  for (let i = 0; i < donations.length; i++) {
    const don = donations[i];
    const failed = i === 3; // One failed test for realism
    await BloodTest.create({
      donation:  don._id,
      bloodUnit: `BU-${String(i+1).padStart(3,'0')}`,
      donor:     don.donor,
      bloodGroup:don.bloodGroup,
      hiv:      'Negative',
      hbv:      failed ? 'Positive' : 'Negative',
      hcv:      'Negative',
      syphilis: 'Negative',
      malaria:  'Negative',
      result:   failed ? 'failed' : 'passed',
      testedAt: daysAgo(0),
    });
  }
  console.log('   ✅ 12 blood tests (11 passed, 1 failed/quarantined)');

  // ── 11. APPOINTMENTS ─────────────────────────────────
  console.log('\n📅 Creating Appointments...');
  const apptData = [
    { donor:0,  bb:0, daysAhead:15, time:'10:00 AM', status:'confirmed' },
    { donor:1,  bb:2, daysAhead:7,  time:'09:00 AM', status:'confirmed' },
    { donor:2,  bb:0, daysAhead:3,  time:'11:00 AM', status:'confirmed' },
    { donor:4,  bb:1, daysAhead:20, time:'02:00 PM', status:'confirmed' },
    { donor:6,  bb:0, daysAhead:10, time:'10:00 AM', status:'confirmed' },
  ];

  for (const a of apptData) {
    await Appointment.create({
      donor:    donors[a.donor]._id,
      bloodBank:bloodBanks[a.bb]._id,
      date:     daysAhead(a.daysAhead),
      time:     a.time, status: a.status,
    });
  }
  console.log('   ✅ 5 upcoming appointments');

  // ── 12. CAMPAIGNS ────────────────────────────────────
  console.log('\n📢 Creating Campaigns...');
  const campData = [
    { bb:0, title:'Emergency O- Blood Drive',    desc:'Critical shortage of O- blood. Urgent donors needed island-wide.',         groups:['O-'],          start:daysAgo(2),   end:daysAhead(5),  target:100, collected:45, notified:145, responded:23, status:'active' },
    { bb:1, title:'Monthly Donation Camp — Feb', desc:'Regular monthly blood donation camp at City Blood Bank.',                   groups:['All'],         start:daysAhead(15),end:daysAhead(16), target:200, collected:0,  notified:0,   responded:0,  status:'upcoming' },
    { bb:2, title:'Rare Blood Group Drive',       desc:'Seeking AB- and B- donors. These rare groups are critically needed.',      groups:['AB-','B-'],     start:daysAgo(14),  end:daysAgo(7),    target:50,  collected:48, notified:62,  responded:31, status:'completed' },
    { bb:0, title:'World Blood Donor Day',        desc:'Celebrating World Blood Donor Day with a special island-wide campaign.',   groups:['All'],         start:daysAhead(30),end:daysAhead(31), target:500, collected:0,  notified:0,   responded:0,  status:'upcoming' },
    { bb:1, title:'Emergency AB- Campaign',       desc:'Kandy hospital urgently needs AB- blood for multiple patients.',           groups:['AB-'],         start:daysAgo(1),   end:daysAhead(3),  target:30,  collected:12, notified:35,  responded:8,  status:'active' },
  ];

  const campaigns = [];
  for (const c of campData) {
    const camp = await Campaign.create({
      title:c.title, description:c.desc,
      bloodBank:bloodBanks[c.bb]._id,
      targetBloodGroups:c.groups,
      startDate:c.start, endDate:c.end,
      targetUnits:c.target, collectedUnits:c.collected,
      status:c.status, notificationsSent:c.notified, donorsResponded:c.responded,
      createdBy:adminUser._id,
    });
    campaigns.push(camp);
  }
  console.log('   ✅ 5 campaigns (2 active, 2 upcoming, 1 completed)');

  // ── 13. NOTIFICATIONS ────────────────────────────────
  console.log('\n🔔 Creating Notifications...');
  const notifData = [
    { recipient:donors[0]._id, role:'donor', type:'emergency', title:'Emergency Blood Request', msg:'National Hospital needs O+ blood urgently. 2 units required.' },
    { recipient:donors[1]._id, role:'donor', type:'hospital',  title:'Hospital Blood Request',  msg:'City Blood Bank requests O+ donors. Please respond if available.' },
    { recipient:donors[0]._id, role:'donor', type:'campaign',  title:'New Campaign Started',    msg:'Emergency O- Blood Drive is now active. Your donation is needed!' },
    { recipient:donors[2]._id, role:'donor', type:'system',    title:'Donation Confirmed',      msg:'Your blood donation has been successfully processed. Thank you!' },
    { recipient:donors[0]._id, role:'donor', type:'appointment',title:'Appointment Reminder',   msg:'You have a donation appointment on Feb 15 at 10:00 AM.' },
    { recipient:hospitals[0]._id, role:'hospital', type:'request', title:'Blood Request Update', msg:'Your blood request REQ-001 is being processed by National Blood Bank.' },
    { recipient:hospitals[1]._id, role:'hospital', type:'request', title:'Request Fulfilled',    msg:'Your blood request for AB- (3 units) has been fulfilled.' },
  ];

  for (const n of notifData) {
    await Notification.create({
      recipient:n.recipient, recipientRole:n.role,
      type:n.type, title:n.title, message:n.msg,
      read:false,
    });
  }
  console.log('   ✅ 7 notifications created');

  // ═══════════════════════════════════════════════════
  //  SUMMARY
  // ═══════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(60));
  console.log('🎉  BloodCare Database Seeded Successfully!');
  console.log('═'.repeat(60));
  console.log('\n📋 LOGIN CREDENTIALS:\n');
  console.log('  🔴 ADMIN PANEL (admin.bloodcare.lk)');
  console.log('     Email:    admin@bloodcare.lk');
  console.log('     Password: Admin@123\n');
  console.log('  🩸 DONOR PORTAL (donor.bloodcare.lk)');
  console.log('     Email:    kamal@email.com       (O+, 7 donations)');
  console.log('     Email:    nimal@email.com       (A+, 3 donations)');
  console.log('     Email:    asitha@email.com      (O+, 10 donations - Gold)');
  console.log('     Password: Donor@123 (all donors)\n');
  console.log('  🏥 HOSPITAL PORTAL (hospital.bloodcare.lk)');
  console.log('     Email:    info@nationalhospital.lk');
  console.log('     Email:    info@asiri.lk');
  console.log('     Password: Hospital@123 (all hospitals)\n');
  console.log('  🏦 BLOOD BANK PORTAL (bloodbank.bloodcare.lk)');
  console.log('     Email:    info@nbb.lk');
  console.log('     Email:    info@cityblood.lk');
  console.log('     Email:    info@kandyblood.lk');
  console.log('     Password: Bank@123 (all banks)\n');
  console.log('📊 DATA SUMMARY:');
  console.log(`  Users:          ${1 + 3 + 5 + 20} total`);
  console.log(`  Blood Banks:    3`);
  console.log(`  Hospitals:      5`);
  console.log(`  Donors:         20 (18 approved, 2 pending)`);
  console.log(`  Patients:       10`);
  console.log(`  Blood Requests: 15`);
  console.log(`  Donations:      12`);
  console.log(`  Screenings:     12`);
  console.log(`  Blood Tests:    12 (11 passed, 1 failed)`);
  console.log(`  Appointments:   5`);
  console.log(`  Campaigns:      5 (2 active, 2 upcoming, 1 completed)`);
  console.log(`  Notifications:  7`);
  console.log('\n  🩸 Total Blood Stock:');
  BG.forEach(g => console.log(`     ${g.padEnd(4)} → ${totals[g]} units`));
  console.log(`     Total → ${Object.values(totals).reduce((a,b)=>a+b,0)} units`);
  console.log('\n' + '═'.repeat(60) + '\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('\n❌ Seed Error:', err.message);
  process.exit(1);
});
