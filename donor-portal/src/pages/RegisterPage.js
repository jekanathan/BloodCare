import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, CheckCircle, Droplet } from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const DISTRICTS = ['Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya', 'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee', 'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla', 'Monaragala', 'Ratnapura', 'Kegalle'];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    fullName: '', nic: '', dateOfBirth: '', gender: '',
    bloodGroup: '', phone: '', email: '', password: '', confirmPassword: '',
    address: '', district: '', medicalInfo: ''
  });

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleNext = (e) => {
    e.preventDefault();
    if (step === 2 && form.password !== form.confirmPassword) {
      setError('Passwords do not match'); return;
    }
    setError('');
    setStep(prev => prev + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await register(form);
      setSuccess(true);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Registration failed. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-grid" /><div className="auth-left-glow" />
        <div className="auth-brand anim-up">
          <div className="auth-brand-logo"><Droplet size={32} color="#fff" /></div>
          <div className="auth-brand-name">Blood<span>Care</span></div>
          <div className="auth-brand-tagline">Thank you for joining us!</div>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-form-wrap" style={{ textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, background: 'var(--green-100)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <CheckCircle size={36} color="var(--green-600)" />
          </div>
          <div className="auth-form-title">Registration Submitted!</div>
          <div className="auth-form-sub" style={{ marginBottom: 32 }}>
            Your account is under review. Admin will approve within 24 hours. You'll receive a notification once approved.
          </div>
          <button className="btn-main" onClick={() => navigate('/login')}>Back to Login</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-grid" /><div className="auth-left-glow" />
        <div className="auth-brand anim-up">
          <div className="auth-brand-logo"><Droplet size={32} color="#fff" /></div>
          <div className="auth-brand-name">Blood<span>Care</span></div>
          <div className="auth-brand-tagline">Register as a blood donor</div>

          <div style={{ marginTop: 48 }}>
            {[
              { n: 1, label: 'Personal Info' },
              { n: 2, label: 'Account Details' },
              { n: 3, label: 'Location & Medical' },
            ].map(({ n, label }) => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: step >= n ? 'var(--red-600)' : 'rgba(255,255,255,.1)',
                  border: `2px solid ${step >= n ? 'var(--red-500)' : 'rgba(255,255,255,.2)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0
                }}>{step > n ? '✓' : n}</div>
                <span style={{ fontSize: 14, color: step >= n ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.4)', fontWeight: step >= n ? 600 : 400 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-wrap anim-up">
          <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
            {[1,2,3].map(n => (
              <div key={n} style={{
                flex: 1, height: 4, borderRadius: 2,
                background: step >= n ? 'var(--red-600)' : 'var(--slate-200)',
                transition: 'background .3s'
              }} />
            ))}
          </div>

          {error && <div className="form-error"><AlertCircle size={14} />{error}</div>}

          {step === 1 && (
            <form onSubmit={handleNext} className="anim-up">
              <div className="auth-form-title">Personal Information</div>
              <div className="auth-form-sub">Let us know about you</div>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" placeholder="As per NIC" value={form.fullName} onChange={e => set('fullName', e.target.value)} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">NIC Number</label>
                  <input className="form-input" placeholder="199012345678" value={form.nic} onChange={e => set('nic', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input type="date" className="form-input" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-input" value={form.gender} onChange={e => set('gender', e.target.value)} required>
                    <option value="">Select</option>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Blood Group</label>
                  <select className="form-input" value={form.bloodGroup} onChange={e => set('bloodGroup', e.target.value)} required>
                    <option value="">Select</option>
                    {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="btn-main">Continue →</button>
              <div className="auth-link">Already registered? <a href="/login" onClick={e => { e.preventDefault(); navigate('/login'); }}>Sign in</a></div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleNext} className="anim-up">
              <div className="auth-form-title">Account Details</div>
              <div className="auth-form-sub">Create your login credentials</div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input className="form-input" placeholder="07XXXXXXXX" value={form.phone} onChange={e => set('phone', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input type="password" className="form-input" placeholder="Min 8 chars" value={form.password} onChange={e => set('password', e.target.value)} minLength={8} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input type="password" className="form-input" placeholder="Repeat" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} required />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn-main" style={{ background: 'var(--slate-200)', color: 'var(--slate-700)' }} onClick={() => setStep(1)}>← Back</button>
                <button type="submit" className="btn-main">Continue →</button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleSubmit} className="anim-up">
              <div className="auth-form-title">Location & Medical</div>
              <div className="auth-form-sub">Help us connect you better</div>

              <div className="form-group">
                <label className="form-label">District</label>
                <select className="form-input" value={form.district} onChange={e => set('district', e.target.value)} required>
                  <option value="">Select District</option>
                  {DISTRICTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input className="form-input" placeholder="No. 12, Main St, Colombo 3" value={form.address} onChange={e => set('address', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Medical Information <span style={{ color: 'var(--slate-400)', fontWeight: 400 }}>(optional)</span></label>
                <input className="form-input" placeholder="Allergies, conditions, medications..." value={form.medicalInfo} onChange={e => set('medicalInfo', e.target.value)} />
              </div>

              <div style={{ background: 'var(--red-50)', border: '1px solid var(--red-100)', borderRadius: 'var(--r)', padding: '12px 16px', marginBottom: 20, fontSize: 13, color: 'var(--red-700)', lineHeight: 1.5 }}>
                ✓ By registering, you agree to donate blood voluntarily and your profile will be reviewed by our admin team.
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn-main" style={{ background: 'var(--slate-200)', color: 'var(--slate-700)' }} onClick={() => setStep(2)}>← Back</button>
                <button type="submit" className="btn-main" disabled={loading}>{loading ? 'Submitting...' : 'Register Now 🩸'}</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}