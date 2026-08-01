import React, { useState, useEffect } from 'react';
import { Edit2, Save, X, CheckCircle, AlertTriangle, Shield, Droplet, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const DISTRICTS = ['Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Galle', 'Matara', 'Jaffna', 'Trincomalee', 'Kurunegala', 'Anuradhapura', 'Badulla', 'Ratnapura', 'Kegalle'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Same tiers as server/routes/donor.js — keep in sync with backend badge logic.
const BADGE_TIERS = [
  { min: 1,   icon: '🩸', name: 'First Drop',    desc: '1st donation' },
  { min: 5,   icon: '⭐', name: 'Star Donor',    desc: '5 donations' },
  { min: 10,  icon: '🥇', name: 'Gold Hero',     desc: '10 donations' },
  { min: 25,  icon: '💎', name: 'Diamond Hero',  desc: '25 donations' },
  { min: 50,  icon: '🏆', name: 'Life Saver',    desc: '50 donations' },
  { min: 100, icon: '🎖️', name: 'Legend',        desc: '100 donations' },
];

const EDITABLE_FIELDS = ['fullName', 'nic', 'dateOfBirth', 'gender', 'bloodGroup', 'phone', 'email', 'address', 'district', 'medicalInfo'];

export default function ProfilePage() {
  const { donor: authDonor, refreshDonor } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saved, setSaved] = useState(false);

  const [certificate, setCertificate] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([
      api.get('/donor/me'),
      api.get('/donor-certificates/my'),
    ])
      .then(([meRes, certRes]) => {
        if (!mounted) return;
        setProfile(meRes.data);
        setDraft(meRes.data);
        const certs = certRes.data?.certificates || [];
        setCertificate(certs[0] || null);
      })
      .catch(() => {
        if (mounted) setError('Could not load your profile. Please try again.');
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const payload = {};
      EDITABLE_FIELDS.forEach((f) => { payload[f] = draft[f]; });
      const res = await api.put('/donor/profile', payload);
      setProfile(res.data);
      setDraft(res.data);
      setEditing(false);
      setSaved(true);
      refreshDonor?.();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadCertificate = async () => {
    if (!certificate) return;
    setDownloading(true);
    try {
      const res = await api.get(`/donor-certificates/${certificate._id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Certificate-${certificate.certificateNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setSaveError('Could not download certificate. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="anim-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: 'var(--slate-500)' }}>
        <div className="spinner" style={{ marginBottom: 14 }} />
        Loading your profile…
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="empty-state">
        <AlertTriangle size={32} color="var(--red-600)" />
        <h3>{error || 'Profile not found'}</h3>
      </div>
    );
  }

  const totalDonations = profile.totalDonations || 0;
  const earnedTier = [...BADGE_TIERS].reverse().find(t => totalDonations >= t.min);

  const Field = ({ label, fieldKey, type = 'text', options }) => (
    <div className="profile-field">
      <div className="profile-field-label">{label}</div>
      {editing ? (
        options ? (
          <select className="profile-field-input" value={draft[fieldKey] || ''} onChange={e => setDraft(p => ({ ...p, [fieldKey]: e.target.value }))}>
            {options.map(o => <option key={o}>{o}</option>)}
          </select>
        ) : (
          <input
            type={type}
            className="profile-field-input"
            value={type === 'date' ? (draft[fieldKey] ? draft[fieldKey].slice(0, 10) : '') : (draft[fieldKey] || '')}
            onChange={e => setDraft(p => ({ ...p, [fieldKey]: e.target.value }))}
          />
        )
      ) : (
        <div className="profile-field-value">
          {type === 'date' && profile[fieldKey]
            ? new Date(profile[fieldKey]).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
            : (profile[fieldKey] || '—')}
        </div>
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
      {saveError && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 'var(--r)', padding: '12px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, color: '#B91C1C', fontWeight: 600, fontSize: 14 }}>
          <AlertTriangle size={16} /> {saveError}
        </div>
      )}

      {/* Profile Hero */}
      <div className="profile-hero">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar">{profile.fullName?.charAt(0) || '?'}</div>
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
              🩸 {totalDonations} Donations
            </div>
            <div className="profile-pill">
              📍 {profile.district || '—'}
            </div>
          </div>
        </div>
        <div style={{ marginLeft: 'auto', zIndex: 2 }}>
          {editing ? (
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-main" style={{ width: 'auto', padding: '10px 20px' }} onClick={handleSave} disabled={saving}>
                <Save size={14} style={{ display: 'inline', marginRight: 6 }} /> {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                style={{ padding: '10px 16px', background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 'var(--r-sm)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}
                onClick={() => { setDraft(profile); setEditing(false); setSaveError(null); }}
                disabled={saving}
              >
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
                  <input className="profile-field-input" value={draft.address || ''} onChange={e => setDraft(p => ({ ...p, address: e.target.value }))} style={{ width: '100%' }} />
                ) : (
                  <div className="profile-field-value">{profile.address || '—'}</div>
                )}
              </div>
              <div className="profile-field" style={{ marginTop: 16 }}>
                <div className="profile-field-label">Medical Information</div>
                {editing ? (
                  <input className="profile-field-input" value={draft.medicalInfo || ''} onChange={e => setDraft(p => ({ ...p, medicalInfo: e.target.value }))} style={{ width: '100%' }} />
                ) : (
                  <div className="profile-field-value">{profile.medicalInfo || '—'}</div>
                )}
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="profile-section">
            <div className="profile-section-header">
              <div className="profile-section-title">Badges & Achievements</div>
              <span style={{ fontSize: 12, color: 'var(--slate-500)' }}>
                {BADGE_TIERS.filter(b => totalDonations >= b.min).length}/{BADGE_TIERS.length} earned
              </span>
            </div>
            <div className="profile-section-body">
              <div className="badges-grid">
                {BADGE_TIERS.map((b) => {
                  const earned = totalDonations >= b.min;
                  return (
                    <div key={b.name} className={`badge-item ${earned ? 'earned' : 'locked'}`}>
                      <div className="badge-icon">{earned ? b.icon : '🔒'}</div>
                      <div className="badge-name">{b.name}</div>
                      <div className="badge-desc">{b.desc}</div>
                    </div>
                  );
                })}
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
                { label: 'Total Donations', value: totalDonations, icon: '🩸' },
                { label: 'Lives Impacted', value: totalDonations * 3, icon: '❤️' },
                { label: 'Last Donation', value: profile.lastDonationDate ? new Date(profile.lastDonationDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'None yet', icon: '📅' },
                { label: 'Member Since', value: profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : '—', icon: '🏅' },
                { label: 'Eligibility', value: profile.isEligible ? 'Eligible Now' : 'Not Eligible', icon: '✅' },
                { label: 'Account Status', value: profile.status ? profile.status.charAt(0).toUpperCase() + profile.status.slice(1) : '—', icon: '🛡️' },
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
              {certificate ? (
                <>
                  <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-display)', color: '#fff', marginBottom: 6 }}>
                    {earnedTier ? earnedTier.name : 'Donor'} Certificate
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,.55)', marginBottom: 20, lineHeight: 1.5 }}>
                    You have completed {certificate.totalDonationsAtIssue} donations and hold certificate {certificate.certificateNumber}
                  </div>
                  <button className="btn-main" style={{ width: 'auto', padding: '10px 24px', background: 'var(--red-600)' }} onClick={handleDownloadCertificate} disabled={downloading}>
                    <Download size={14} style={{ display: 'inline', marginRight: 6 }} />
                    {downloading ? 'Downloading…' : 'Download Certificate'}
                  </button>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-display)', color: '#fff', marginBottom: 6 }}>
                    No Certificate Yet
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,.55)', lineHeight: 1.5 }}>
                    Certificates are issued once your donation is confirmed. Check back after your next donation.
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}