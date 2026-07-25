# 🩸 BloodCare — Full System
### Blood Bank & Donor Management System

---

## 📁 Folder Structure

```
BloodCare-Full-System/
│
├── 📂 server/              → Node.js + Express Backend (Port 5000)
│   ├── models/             → MongoDB Models
│   ├── routes/             → REST API Routes
│   ├── middleware/         → JWT Auth
│   └── index.js            → Main server entry
│
├── 📂 admin-panel/         → React Admin Portal (Port 3000) 🔴
│   └── src/pages/          → Dashboard, Donors, Hospitals, BloodBanks, etc.
│
├── 📂 donor-portal/        → React Donor Portal (Port 3001) 🩸
│   └── src/pages/          → Dashboard, Profile, History, Notifications, etc.
│
├── 📂 hospital-portal/     → React Hospital Portal (Port 3002) 🏥
│   └── src/pages/          → Dashboard, Patients, BloodRequests, DonorRequests, etc.
│
├── 📂 bloodbank-portal/    → React Blood Bank Portal (Port 3003) 🏦
│   └── src/pages/          → Dashboard, Inventory, Requests, Donations, Testing, etc.
│
├── 📂 database-seed/       → MongoDB Atlas Seed Script
│   ├── seed.js             → Creates all sample data
│   └── SETUP_GUIDE.md      → Atlas setup instructions
│
├── package.json            → Root scripts (run all at once)
└── .env.example            → Environment variables template
```

---

## ⚙️ Setup (3 Simple Steps)

### Step 1 — MongoDB Atlas Setup

1. Go to → **https://cloud.mongodb.com** → Sign up FREE
2. Create cluster (FREE tier, Singapore region)
3. Create user: `bloodcare_admin` / `BloodCare@2024`
4. Network Access → Allow All IPs (`0.0.0.0/0`)
5. Get connection string → Copy it

> Full guide: see `database-seed/SETUP_GUIDE.md`

---

### Step 2 — Configure .env Files

Create `server/.env`:
```env
MONGODB_URI=mongodb+srv://bloodcare_admin:BloodCare@2024@cluster0.xxxxx.mongodb.net/bloodcare
JWT_SECRET=bloodcare_super_secret_jwt_key_2024
PORT=5000
CLIENT_URL=http://localhost:3000
```

Create `database-seed/.env` (same MONGODB_URI):
```env
MONGODB_URI=mongodb+srv://bloodcare_admin:BloodCare@2024@cluster0.xxxxx.mongodb.net/bloodcare
```

---

### Step 3 — Install & Run

```bash
# Install all dependencies at once
npm run install:all

# Seed the database (run once)
npm run seed

# Start all 5 apps at the same time
npm run dev
```

That's it! 🎉

---

## 🌐 Portal URLs

| Portal | URL | Theme | Login |
|--------|-----|-------|-------|
| 🔴 **Admin Panel** | http://localhost:3000 | Dark Red | admin@bloodcare.lk |
| 🩸 **Donor Portal** | http://localhost:3001 | Red | kamal@email.com |
| 🏥 **Hospital Portal** | http://localhost:3002 | Blue | info@nationalhospital.lk |
| 🏦 **Blood Bank Portal** | http://localhost:3003 | Purple | info@nbb.lk |
| ⚙️ **Backend API** | http://localhost:5000 | — | — |

---

## 🔑 Login Credentials (after seed)

### Admin Panel
| Email | Password |
|-------|---------|
| admin@bloodcare.lk | Admin@123 |

### Donor Portal
| Email | Password | Blood | Donations |
|-------|---------|-------|-----------|
| kamal@email.com | Donor@123 | O+ | 7 |
| asitha@email.com | Donor@123 | O+ | 10 (Gold) |
| nimal@email.com | Donor@123 | A+ | 3 |
| sandya@email.com | Donor@123 | B+ | 2 |

### Hospital Portal
| Email | Password | Hospital |
|-------|---------|---------|
| info@nationalhospital.lk | Hospital@123 | National Hospital Colombo |
| info@asiri.lk | Hospital@123 | Asiri Medical Hospital |
| info@kandyhospital.lk | Hospital@123 | Kandy Teaching Hospital |

### Blood Bank Portal
| Email | Password | Bank |
|-------|---------|------|
| info@nbb.lk | Bank@123 | National Blood Bank |
| info@cityblood.lk | Bank@123 | City Blood Bank |
| info@kandyblood.lk | Bank@123 | Kandy Regional Blood Bank |

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Recharts |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (Mongoose ODM) |
| Auth | JWT + bcrypt |
| Notifications | Firebase FCM (ready to integrate) |
| Hosting | Vercel (frontend) + Render/Railway (backend) |

---

## 📊 Database Collections

| Collection | Description |
|------------|-------------|
| `users` | All accounts (admin/donor/hospital/blood_bank) |
| `donors` | Donor profiles |
| `hospitals` | Hospital details |
| `blood_banks` | Blood bank profiles |
| `patients` | Patient records |
| `inventories` | Blood stock per bank |
| `blood_requests` | Hospital blood requests |
| `donations` | Donation records |
| `blood_tests` | Test results (HIV, HBV, etc.) |
| `screenings` | Donor health screenings |
| `appointments` | Donation appointments |
| `campaigns` | Blood donation campaigns |
| `notifications` | System notifications |

---

## 🌐 Production Domains

| Portal | Domain |
|--------|--------|
| Admin | admin.bloodcare.lk |
| Donor | donor.bloodcare.lk |
| Hospital | hospital.bloodcare.lk |
| Blood Bank | bloodbank.bloodcare.lk |

---

*BloodCare — Connecting Donors, Hospitals & Blood Banks* 🩸  
*Save Blood, Save Lives*
