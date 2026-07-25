import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Droplet } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]   = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-left">
        <div className="auth-left-grid" />
        <div className="auth-left-glow" />

        <div className="auth-brand anim-up">
          <div className="auth-brand-logo">
            <Droplet size={32} color="#fff" />
          </div>
          <div className="auth-brand-name">Blood<span>Care</span></div>
          <div className="auth-brand-tagline">Your blood can save someone's life</div>

          <ul className="auth-features">
            <li><span>🩸</span> Track your donation history</li>
            <li><span>🔔</span> Get emergency blood requests</li>
            <li><span>📅</span> Book donation appointments</li>
            <li><span>🏥</span> Connect with hospitals nearby</li>
            <li><span>🏅</span> Earn badges & certificates</li>
            <li><span>💉</span> Monitor your health records</li>
          </ul>
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-right">
        <div className="auth-form-wrap anim-up">
          <div className="auth-form-title">Welcome back 👋</div>
          <div className="auth-form-sub">Sign in to your donor account</div>

          {error && (
            <div className="form-error">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email" className="form-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password" className="form-input"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            <div style={{ textAlign: 'right', marginBottom: 20 }}>
              <a href="#" style={{ fontSize: 13, color: 'var(--red-600)', textDecoration: 'none', fontWeight: 600 }}>
                Forgot password?
              </a>
            </div>

            <button type="submit" className="btn-main" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-link">
            Don't have an account? <a href="/register" onClick={e => { e.preventDefault(); navigate('/register'); }}>Register here</a>
          </div>

          <div style={{ marginTop: 32, padding: '16px', background: 'var(--slate-50)', borderRadius: 'var(--r)', border: '1px solid var(--slate-200)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate-500)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px' }}>Demo Login</div>
            <div style={{ fontSize: 13, color: 'var(--slate-600)' }}>Email: <strong>donor@bloodcare.lk</strong></div>
            <div style={{ fontSize: 13, color: 'var(--slate-600)' }}>Password: <strong>Donor@123</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
}