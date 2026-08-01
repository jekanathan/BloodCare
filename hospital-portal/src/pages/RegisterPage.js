import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Stethoscope, Upload, FileText, X, AlertCircle } from 'lucide-react';
import api from '../utils/api';

const DISTRICTS = ['Colombo','Gampaha','Kalutara','Kandy','Matale','Nuwara Eliya','Galle','Matara','Hambantota','Jaffna','Kilinochchi','Mannar','Vavuniya','Mullaitivu','Batticaloa','Ampara','Trincomalee','Kurunegala','Puttalam','Anuradhapura','Polonnaruwa','Badulla','Monaragala','Ratnapura','Kegalle'];
const PROVINCES = ['Western','Central','Southern','Northern','Eastern','North Western','North Central','Uva','Sabaragamuwa'];
const TYPES = ['Government','Private','Teaching','Specialized','Military'];

const STEPS = [
  { n: 1, label: 'Contact Person' },
  { n: 2, label: 'Hospital Details' },
  { n: 3, label: 'Documents' },
  { n: 4, label: 'Account' },
];

export default function RegisterPage() {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    contactPerson: '', designation: '', email: '', phone: '',
    hospitalName: '', registrationNumber: '', type: '', establishedYear: '',
    licenseNumber: '', licenseExpiry: '', address: '', district: '', province: '',
    password: '', confirmPassword: '',
  });

  const [docs, setDocs] = useState({
    hospitalLicense: null,
    registrationCertificate: null,
    taxRegistration: null,
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleFile = (key, file) => {
    if (file && file.type !== 'application/pdf') {
      setError('Please upload PDF files only.');
      return;
    }
    if (file && file.size > 5 * 1024 * 1024) {
      setError('File must be under 5MB.');
      return;
    }
    setError('');
    setDocs(prev => ({ ...prev, [key]: file }));
  };

  const removeFile = (key) => setDocs(prev => ({ ...prev, [key]: null }));

  const validateStep = () => {
    setError('');
    if (step === 1) {
      if (!form.contactPerson || !form.designation || !form.email || !form.phone) {
        setError('Please fill in all contact person fields.');
        return false;
      }
    }
    if (step === 2) {
      if (!form.hospitalName || !form.registrationNumber || !form.type || !form.address || !form.district || !form.province) {
        setError('Please fill in all hospital detail fields.');
        return false;
      }
    }
    if (step === 3) {
      if (!docs.hospitalLicense || !docs.registrationCertificate) {
        setError('Hospital License and Registration Certificate are required.');
        return false;
      }
    }
    if (step === 4) {
      if (!form.password || form.password.length < 8) {
        setError('Password must be at least 8 characters.');
        return false;
      }
      if (form.password !== form.confirmPassword) {
        setError('Passwords do not match.');
        return false;
      }
    }
    return true;
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (!validateStep()) return;
    setStep(s => s + 1);
  };

  const handleBack = () => { setError(''); setStep(s => s - 1); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      if (docs.hospitalLicense)          formData.append('hospitalLicense', docs.hospitalLicense);
      if (docs.registrationCertificate)  formData.append('registrationCertificate', docs.registrationCertificate);
      if (docs.taxRegistration)          formData.append('taxRegistration', docs.taxRegistration);

      await api.post('/hospital-auth/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand anim-up">
          <div className="auth-logo-box"><Stethoscope size={30} color="#fff" /></div>
          <div className="auth-brand-name">Blood<span>Care</span></div>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-form-wrap" style={{ textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, background: 'var(--green-100)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px' }}>
            <CheckCircle size={36} color="var(--green-600)" />
          </div>
          <div className="auth-form-title">Registration Submitted!</div>
          <div className="auth-form-sub" style={{ marginBottom: 28 }}>
            Your hospital registration and documents have been submitted for review. Admin will verify your details and approve within 24–48 hours.
          </div>
          <button className="btn-main" onClick={() => nav('/login')}>Back to Login</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand anim-up">
          <div className="auth-logo-box"><Stethoscope size={30} color="#fff" /></div>
          <div className="auth-brand-name">Blood<span>Care</span></div>
          <div className="auth-brand-sub">Register your hospital</div>

          <div style={{ marginTop: 40 }}>
            {STEPS.map(({ n, label }) => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: step >= n ? 'var(--red-600)' : 'rgba(255,255,255,.1)',
                  border: `2px solid ${step >= n ? 'var(--red-500)' : 'rgba(255,255,255,.2)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0,
                }}>{step > n ? '✓' : n}</div>
                <span style={{ fontSize: 13, color: step >= n ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.4)', fontWeight: step >= n ? 600 : 400 }}>{label}</span>
              </div>
            ))}
          </div>

          <ul className="auth-features" style={{ marginTop: 32 }}>
            <li><span>✓</span>Admin reviews & approves registration</li>
            <li><span>✓</span>Access full blood request management</li>
            <li><span>✓</span>Connect to all blood banks island-wide</li>
            <li><span>✓</span>Real-time inventory visibility</li>
          </ul>
        </div>
      </div>

      <div className="auth-right" style={{ padding: '40px 48px' }}>
        <div className="auth-form-wrap anim-up" style={{ maxWidth: 480 }}>

          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {STEPS.map(s => (
              <div key={s.n} style={{ flex: 1, height: 4, borderRadius: 2, background: step >= s.n ? 'var(--red-600)' : 'var(--slate-200)', transition: 'background .3s' }} />
            ))}
          </div>

          {error && (
            <div className="form-error" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleNext} className="anim-up">
              <div className="auth-form-title">Contact Person 👤</div>
              <div className="auth-form-sub">Who is the primary contact for this hospital?</div>

              <div className="form-group">
                <label className="form-label">Contact Person Name</label>
                <input className="form-input" placeholder="Dr. Nimal Perera" value={form.contactPerson} onChange={e => set('contactPerson', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Designation</label>
                <input className="form-input" placeholder="Medical Superintendent" value={form.designation} onChange={e => set('designation', e.target.value)} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Official Email</label>
                  <input type="email" className="form-input" placeholder="info@hospital.lk" value={form.email} onChange={e => set('email', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Official Phone</label>
                  <input className="form-input" placeholder="0112345678" value={form.phone} onChange={e => set('phone', e.target.value)} required />
                </div>
              </div>

              <button type="submit" className="btn-main">Continue →</button>
              <div className="auth-link">Already registered? <a href="/login" onClick={e => { e.preventDefault(); nav('/login'); }}>Sign in</a></div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleNext} className="anim-up">
              <div className="auth-form-title">Hospital Details 🏥</div>
              <div className="auth-form-sub">Official registration and license information</div>

              <div className="form-group">
                <label className="form-label">Hospital Name</label>
                <input className="form-input" placeholder="National Hospital Colombo" value={form.hospitalName} onChange={e => set('hospitalName', e.target.value)} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Registration No.</label>
                  <input className="form-input" placeholder="HSP-2026-00125" value={form.registrationNumber} onChange={e => set('registrationNumber', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Hospital Type</label>
                  <select className="form-input" value={form.type} onChange={e => set('type', e.target.value)} required>
                    <option value="">Select</option>
                    {TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">License Number</label>
                  <input className="form-input" placeholder="HSPL/2024/5567" value={form.licenseNumber} onChange={e => set('licenseNumber', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">License Expiry</label>
                  <input type="date" className="form-input" value={form.licenseExpiry} onChange={e => set('licenseExpiry', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Established Year</label>
                <input type="number" className="form-input" placeholder="2018" min={1900} max={2026} value={form.establishedYear} onChange={e => set('establishedYear', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input className="form-input" placeholder="123, Galle Road, Colombo 04" value={form.address} onChange={e => set('address', e.target.value)} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">District</label>
                  <select className="form-input" value={form.district} onChange={e => set('district', e.target.value)} required>
                    <option value="">Select</option>
                    {DISTRICTS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Province</label>
                  <select className="form-input" value={form.province} onChange={e => set('province', e.target.value)} required>
                    <option value="">Select</option>
                    {PROVINCES.map(p => <option key={p}>{p} Province</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn-main" style={{ background: 'var(--slate-200)', color: 'var(--slate-700)' }} onClick={handleBack}>← Back</button>
                <button type="submit" className="btn-main">Continue →</button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleNext} className="anim-up">
              <div className="auth-form-title">Required Documents 📄</div>
              <div className="auth-form-sub">Upload PDF documents for verification (max 5MB each)</div>

              {[
                { key: 'hospitalLicense', label: 'Hospital License', required: true },
                { key: 'registrationCertificate', label: 'Registration Certificate', required: true },
                { key: 'taxRegistration', label: 'Tax Registration (optional)', required: false },
              ].map(({ key, label, required }) => (
                <div key={key} style={{ marginBottom: 16 }}>
                  <label className="form-label">{label}{required && <span style={{ color: 'var(--red-600)' }}> *</span>}</label>
                  {!docs[key] ? (
                    <label style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      border: '2px dashed var(--slate-300)', borderRadius: 10, padding: '20px',
                      cursor: 'pointer', color: 'var(--slate-500)', fontSize: 13,
                    }}>
                      <Upload size={16} /> Click to upload PDF
                      <input type="file" accept="application/pdf" style={{ display: 'none' }}
                        onChange={e => handleFile(key, e.target.files[0])} />
                    </label>
                  ) : (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--green-200)',
                      background: 'var(--green-50)', borderRadius: 10, padding: '12px 14px',
                    }}>
                      <FileText size={18} color="var(--green-600)" />
                      <span style={{ flex: 1, fontSize: 13, color: 'var(--slate-700)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {docs[key].name}
                      </span>
                      <button type="button" onClick={() => removeFile(key)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-400)' }}>
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn-main" style={{ background: 'var(--slate-200)', color: 'var(--slate-700)' }} onClick={handleBack}>← Back</button>
                <button type="submit" className="btn-main">Continue →</button>
              </div>
            </form>
          )}

          {step === 4 && (
            <form onSubmit={handleSubmit} className="anim-up">
              <div className="auth-form-title">Create Account 🔐</div>
              <div className="auth-form-sub">Set a password to access your hospital dashboard once approved</div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input type="password" className="form-input" placeholder="Min 8 chars" value={form.password} onChange={e => set('password', e.target.value)} minLength={8} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input type="password" className="form-input" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} required />
                </div>
              </div>

              <div style={{ background: 'var(--red-50)', border: '1px solid var(--red-100)', borderRadius: 'var(--r)', padding: '12px 16px', marginBottom: 20, fontSize: 13, color: 'var(--red-700)', lineHeight: 1.5 }}>
                ✓ By registering, you confirm all submitted information and documents are accurate. Your application will be reviewed by BloodCare admin before activation.
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn-main" style={{ background: 'var(--slate-200)', color: 'var(--slate-700)' }} onClick={handleBack}>← Back</button>
                <button type="submit" className="btn-main" disabled={loading}>{loading ? 'Submitting...' : 'Submit Registration'}</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}