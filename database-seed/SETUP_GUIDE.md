# 🗄️ BloodCare — MongoDB Atlas Setup Guide
# ══════════════════════════════════════════

## STEP 1: Create MongoDB Atlas Account
─────────────────────────────────────────
1. Go to → https://cloud.mongodb.com
2. Click "Try Free" → Sign up (email or Google)
3. Choose FREE tier (M0 — forever free, 512MB)
4. Select region: Singapore (ap-southeast-1) — closest to Sri Lanka
5. Cluster name: "bloodcare" → Click "Create"
   (Takes 2–3 minutes to provision)


## STEP 2: Create Database User
─────────────────────────────────────────
1. Left sidebar → Security → Database Access
2. Click "Add New Database User"
3. Username: bloodcare_admin
4. Password: BloodCare@2024  (save this!)
5. Built-in Role: "Atlas admin"
6. Click "Add User"


## STEP 3: Whitelist Your IP
─────────────────────────────────────────
1. Left sidebar → Security → Network Access
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" → 0.0.0.0/0
   (For development — restrict in production)
4. Click "Confirm"


## STEP 4: Get Connection String
─────────────────────────────────────────
1. Left sidebar → Deployment → Database
2. Click "Connect" on your cluster
3. Choose "Drivers"
4. Driver: Node.js, Version: 5.5 or later
5. Copy the connection string, looks like:
   mongodb+srv://bloodcare_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
6. Replace <password> with: BloodCare@2024
7. Add database name — change to:
   mongodb+srv://bloodcare_admin:BloodCare@2024@cluster0.xxxxx.mongodb.net/bloodcare?retryWrites=true&w=majority


## STEP 5: Update .env File
─────────────────────────────────────────
Open bloodcare-db/.env and update:

  MONGODB_URI=mongodb+srv://bloodcare_admin:BloodCare@2024@cluster0.xxxxx.mongodb.net/bloodcare?retryWrites=true&w=majority

Also update bloodcare/server/.env:

  MONGODB_URI=mongodb+srv://bloodcare_admin:BloodCare@2024@cluster0.xxxxx.mongodb.net/bloodcare?retryWrites=true&w=majority
  JWT_SECRET=bloodcare_super_secret_jwt_key_2024
  PORT=5000
  CLIENT_URL=http://localhost:3000


## STEP 6: Run Seed Script
─────────────────────────────────────────
Open terminal in bloodcare-db/ folder:

  npm install
  npm run seed

Expected output:
  ✅ Connected to MongoDB Atlas
  🗑️  Clearing existing data...
  👤 Creating Admin...
  🏦 Creating Blood Banks...
  🏥 Creating Hospitals...
  👥 Creating Donors (20)...
  📦 Creating Blood Inventory...
  ... (continues)
  🎉 BloodCare Database Seeded Successfully!


## STEP 7: Verify in Atlas
─────────────────────────────────────────
1. Go to MongoDB Atlas → Browse Collections
2. You should see "bloodcare" database with collections:
   • users         (29 documents)
   • donors        (20 documents)
   • hospitals     (5 documents)
   • bloodbanks    (3 documents)
   • patients      (10 documents)
   • inventories   (24 documents — 8 groups × 3 banks)
   • bloodrequests (15 documents)
   • donations     (12 documents)
   • bloodtests    (12 documents)
   • screenings    (12 documents)
   • appointments  (5 documents)
   • campaigns     (5 documents)
   • notifications (7 documents)


## STEP 8: Start the System
─────────────────────────────────────────
Terminal 1 — Backend:
  cd bloodcare/server
  npm install
  npm run dev       ← runs on port 5000

Terminal 2 — Admin Panel:
  cd bloodcare/client
  npm install
  npm start         ← runs on port 3000

Terminal 3 — Donor Portal:
  cd bloodcare-donor
  npm install
  npm start         ← runs on port 3001

Terminal 4 — Hospital Portal:
  cd bloodcare-hospital
  npm install
  npm start         ← runs on port 3002

Terminal 5 — Blood Bank Portal:
  cd bloodcare-bloodbank
  npm install
  npm start         ← runs on port 3003


## LOGIN CREDENTIALS
─────────────────────────────────────────

🔴 Admin Panel (localhost:3000)
   admin@bloodcare.lk / Admin@123

🩸 Donor Portal (localhost:3001)
   kamal@email.com / Donor@123     ← O+, 7 donations
   asitha@email.com / Donor@123    ← O+, 10 donations (Gold badge)
   nimal@email.com / Donor@123     ← A+, 3 donations

🏥 Hospital Portal (localhost:3002)
   info@nationalhospital.lk / Hospital@123
   info@asiri.lk / Hospital@123

🏦 Blood Bank Portal (localhost:3003)
   info@nbb.lk / Bank@123
   info@cityblood.lk / Bank@123
   info@kandyblood.lk / Bank@123


## ATLAS FREE TIER LIMITS
─────────────────────────────────────────
✅ Storage:      512 MB (enough for thousands of records)
✅ Connections:  500 concurrent
✅ Bandwidth:    10 GB/month
✅ Cost:         Forever FREE
✅ Backups:      Daily snapshots


## PRODUCTION NOTES
─────────────────────────────────────────
For production deployment:
1. Change "Allow All IPs" to specific server IP
2. Use stronger password
3. Enable MongoDB Atlas monitoring & alerts
4. Consider M2/M5 paid tier for better performance
5. Add Atlas Search for full-text search
