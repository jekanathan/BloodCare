import React, { useState } from 'react';
import { Edit2, Save, X, CheckCircle, Shield, Droplet } from 'lucide-react';

const DISTRICTS = ['Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Galle', 'Matara', 'Jaffna', 'Trincomalee', 'Kurunegala', 'Anuradhapura', 'Badulla', 'Ratnapura', 'Kegalle'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const MOCK_PROFILE = {
  fullName: 'Kamal Perera', nic: '199012345678',
  dateOfBirth: '1990-06-15', gender: 'Male',
  bloodGroup: 'O+', phone: '0712345678',
  email: 'kamal@email.com', address: 'No. 45, Galle Road, Colombo 3',
  district: 'Colombo', medicalInfo: 'No known allergies',
  totalDonations: 7, lastDonationDate: '2025-01-12',
  status: 'approved', isEligible: true,
  memberSince: '2022-03-15',
};

const BADGES = [
  { id: 1, icon: '🩸', name: 'First Drop',     desc: '1st donation',      earned: true },
  { id: 2, icon: '⭐', name: 'Star Donor',    desc: '5 donations',       earned: true },
  { id: 3, icon: '🥇', name: 'Gold Hero',     desc: '10 donations',      earned: false },
  { id: 4, icon: '💎', name: 'Diamond Hero',  desc: '25 donations',      earned: false },
  { id: 5, icon: '🏆', name: 'Life Saver',    desc: '50 donations',      earned: false },
  { id: 6, icon: '🎖️', name: 'Legend',        desc: '100 donations',     earned: false },
];

export default function ProfilePage() {
  const [profile, setProfile] = useState(MOCK_PROFILE);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]   = useState({ ...MOCK_PROFILE });
  const [saved, setSaved]   = useState(false);

  const handleSave = async () => {
    setProfile({ ...draft });
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const Field = ({ label, fieldKey, type = 'text', options }) => (
    <div className="profile-field">
      <div className="profile-field-label">{label}</div>
      {editing ? (
        options ? (
          <select className="profile-field-input" value={draft[fieldKey]} onChange={e => setDraft(p => ({ ...p, [fieldKey]: e.target.value }))}>
            {options.map(o => <option key={o}>{o}</option>)}
          </select>
        ) : (
          <input type={type} className="profile-field-input" value={draft[fieldKey]} onChange={e => setDraft(p => ({ ...p, [fieldKey]: e.target.value }))} />
        )
      ) : (
        <div className="profile-field-value">{profile[fieldKey] || '—'}</div>
      )}
    </div>
  );

  return (
    <div className="anim-up">
      {saved && (
        <div style={{ background: 'var(--green-100)', border: '1px solid var(--green-500)', borderRadius: 'var(--r)', padding: '12px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--green-600)', fontWeight: 600, fontSize: 14 }}>
          <CheckCircle size={16} /> Profile updated successfully!
        </div>
      )}

      {/* Profile Hero */}
      <div className="profile-hero">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar">{profile.fullName.charAt(0)}</div>
          <div className="profile-avatar-edit"><Edit2 size={12} /></div>
        </div>
        <div className="profile-info">
          <div className="profile-name">{profile.fullName}</div>
          <div className="profile-pills">
            <div className="profile-pill">
              <Droplet size={13} color="#E85D75" /> {profile.bloodGroup}
            </div>
            <div className="profile-pill">
              <Shield size={13} /> {profile.status === 'approved' ? 'Verified Donor' : 'Pending Approval'}
            </div>
            <div className="profile-pill">
              🩸 {profile.totalDonations} Donations
            </div>
            <div className="profile-pill">
              📍 {profile.district}
            </div>
          </div>
        </div>
        <div style={{ marginLeft: 'auto', zIndex: 2 }}>
          {editing ? (
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-main" style={{ width: 'auto', padding: '10px 20px' }} onClick={handleSave}>
                <Save size={14} style={{ display: 'inline', marginRight: 6 }} /> Save Changes
              </button>
              <button style={{ padding: '10px 16px', background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 'var(--r-sm)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }} onClick={() => { setDraft({ ...profile }); setEditing(false); }}>
                <X size={14} /> Cancel
              </button>
            </div>
          ) : (
            <button className="btn-edit-profile" style={{ background: 'rgba(255,255,255,.1)', color: '#fff', border: '1px solid rgba(255,255,255,.2)' }} onClick={() => setEditing(true)}>
              <Edit2 size={14} /> Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="profile-grid">
        {/* Left */}
        <div className="profile-col">
          {/* Personal info */}
          <div className="profile-section">
            <div className="profile-section-header">
              <div className="profile-section-title">Personal Information</div>
            </div>
            <div className="profile-section-body">
              <div className="profile-field-grid">
                <Field label="Full Name"    fieldKey="fullName" />
                <Field label="NIC Number"   fieldKey="nic" />
                <Field label="Date of Birth" fieldKey="dateOfBirth" type="date" />
                <Field label="Gender"       fieldKey="gender" options={['Male','Female','Other']} />
                <Field label="Blood Group"  fieldKey="bloodGroup" options={BLOOD_GROUPS} />
                <Field label="Phone Number" fieldKey="phone" />
              </div>
            </div>
          </div>

          {/* Contact info */}
          <div className="profile-section">
            <div className="profile-section-header">
              <div className="profile-section-title">Contact & Location</div>
            </div>
            <div className="profile-section-body">
              <div className="profile-field-grid">
                <Field label="Email Address" fieldKey="email" type="email" />
                <Field label="District"      fieldKey="district" options={DISTRICTS} />
              </div>
              <div className="profile-field" style={{ marginTop: 16 }}>
                <div className="profile-field-label">Address</div>
                {editing ? (
                  <input className="profile-field-input" value={draft.address} onChange={e => setDraft(p => ({ ...p, address: e.target.value }))} style={{ width: '100%' }} />
                ) : (
                  <div className="profile-field-value">{profile.address}</div>
                )}
              </div>
              <div className="profile-field" style={{ marginTop: 16 }}>
                <div className="profile-field-label">Medical Information</div>
                {editing ? (
                  <input className="profile-field-input" value={draft.medicalInfo} onChange={e => setDraft(p => ({ ...p, medicalInfo: e.target.value }))} style={{ width: '100%' }} />
                ) : (
                  <div className="profile-field-value">{profile.medicalInfo}</div>
                )}
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="profile-section">
            <div className="profile-section-header">
              <div className="profile-section-title">Badges & Achievements</div>
              <span style={{ fontSize: 12, color: 'var(--slate-500)' }}>{BADGES.filter(b => b.earned).length}/{BADGES.length} earned</span>
            </div>
            <div className="profile-section-body">
              <div className="badges-grid">
                {BADGES.map(b => (
                  <div key={b.id} className={`badge-item ${b.earned ? 'earned' : 'locked'}`}>
                    <div className="badge-icon">{b.earned ? b.icon : '🔒'}</div>
                    <div className="badge-name">{b.name}</div>
                    <div className="badge-desc">{b.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="profile-col">
          {/* Summary */}
          <div className="profile-section">
            <div className="profile-section-header"><div className="profile-section-title">Donation Summary</div></div>
            <div className="profile-section-body">
              {[
                { label: 'Total Donations', value: profile.totalDonations, icon: '🩸' },
                { label: 'Lives Impacted', value: profile.totalDonations * 3, icon: '❤️' },
                { label: 'Last Donation', value: profile.lastDonationDate ? new Date(profile.lastDonationDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'None', icon: '📅' },
                { label: 'Member Since', value: new Date(profile.memberSince).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }), icon: '🏅' },
                { label: 'Eligibility', value: profile.isEligible ? 'Eligible Now' : 'Not Eligible', icon: '✅' },
                { label: 'Account Status', value: profile.status.charAt(0).toUpperCase() + profile.status.slice(1), icon: '🛡️' },
              ].map(({ label, value, icon }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--slate-50)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16 }}>{icon}</span>
                    <span style={{ fontSize: 13, color: 'var(--slate-600)' }}>{label}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--slate-900)' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Certificate */}
          <div className="profile-section" style={{ background: 'linear-gradient(135deg, #0F172A, #3D0B14)', border: 'none' }}>
            <div className="profile-section-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🏅</div>
              <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-display)', color: '#fff', marginBottom: 6 }}>
                Gold Donor Certificate
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.55)', marginBottom: 20, lineHeight: 1.5 }}>
                You have completed {profile.totalDonations} donations and are a certified BloodCare Gold Donor
              </div>
              <button className="btn-main" style={{ width: 'auto', padding: '10px 24px', background: 'var(--red-600)' }}>
                Download Certificate
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
