import React, { useState } from 'react';
import { Lock, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../utils/api';

export default function SettingsPage() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null); // { type: 'success' | 'error', text }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (form.newPassword !== form.confirmPassword) {
      setMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    setSaving(true);
    try {
      await api.patch('/donor/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setMsg({ type: 'success', text: 'Password updated successfully' });
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update password' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="anim-up">
      <div className="page-title">Settings</div>
      <div className="page-sub">Manage your account security</div>

      <div className="card" style={{ maxWidth: 480 }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Lock size={16} color="var(--red-600)" />
            <div className="card-title">Change Password</div>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="card-body">
            {msg && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 'var(--r-sm)',
                marginBottom: 16, fontSize: 13, fontWeight: 600,
                background: msg.type === 'success' ? 'var(--green-50)' : 'var(--red-50)',
                color: msg.type === 'success' ? 'var(--green-700)' : 'var(--red-700)',
              }}>
                {msg.type === 'success' ? <CheckCircle size={15} /> : <AlertTriangle size={15} />} {msg.text}
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input type="password" className="form-input" required
                value={form.currentPassword}
                onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input type="password" className="form-input" required minLength={6}
                value={form.newPassword}
                onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input type="password" className="form-input" required minLength={6}
                value={form.confirmPassword}
                onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} />
            </div>
          </div>
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--slate-100)' }}>
            <button type="submit" className="btn-main" disabled={saving}>
              {saving ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}