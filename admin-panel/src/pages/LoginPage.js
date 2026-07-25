import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Droplet, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-grid-bg" />
      
      <div className="login-card animate-fade">
        <div className="login-logo">
          <div className="login-logo-icon">
            <Droplet size={22} color="#fff" />
          </div>
          <div className="login-logo-text">Blood<span>Care</span></div>
        </div>

        <div className="login-title">
          <h1>Admin Portal</h1>
          <p>Sign in to manage the BloodCare system</p>
        </div>

        {error && (
          <div className="login-error">
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="admin@bloodcare.lk"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In to Admin Panel'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
            BloodCare — Connecting Donors, Hospitals & Blood Banks
          </p>
        </div>
      </div>
    </div>
  );
}
