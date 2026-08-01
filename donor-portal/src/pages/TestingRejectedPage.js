import React from 'react';
import { useAuth } from '../context/AuthContext';
import { XCircle, Droplet, LogOut } from 'lucide-react';

export default function TestingRejectedPage() {
  const { donor, logout } = useAuth();
  const result = donor?.testingResult;

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Inter',sans-serif" }}>
      <div style={{ background: 'linear-gradient(135deg,#7F0F1E,#C41E3A)', padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,.2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Droplet size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>BloodCare</div>
          </div>
        </div>
        <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.3)', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <LogOut size={14} /> Logout
        </button>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ width: 88, height: 88, borderRadius: '50%', background: '#FEE2E8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <XCircle size={40} color="#C41E3A" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
          Not Eligible to Donate
        </h2>
        <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20, lineHeight: 1.6 }}>
          Based on your blood test results, you're currently not eligible to donate blood.
        </p>
        {result?.reason && (
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 18px', fontSize: 13, color: '#0F172A', textAlign: 'left' }}>
            <strong>Reason:</strong> {result.reason}
          </div>
        )}
        <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 20 }}>
          If you believe this is incorrect, please contact the testing facility directly.
        </p>
      </div>
    </div>
  );
}