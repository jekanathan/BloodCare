import React, { useState, useEffect } from 'react';
import { FileBadge, FileText, AlertTriangle } from 'lucide-react';
import api from '../utils/api';

export default function BloodBankLicensesPage() {
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/blood-bank-assets/licenses')
      .then(res => setLicenses(res.data?.licenses || []))
      .catch(() => setError('Could not load license data.'))
      .finally(() => setLoading(false));
  }, []);

  const statusColor = { Valid: 'var(--green-600)', 'Expiring Soon': '#D97706', Expired: 'var(--red-600)', 'No Expiry Set': 'var(--slate-500)' };
  const statusBg = { Valid: 'var(--green-100)', 'Expiring Soon': 'var(--amber-100)', Expired: 'var(--red-100)', 'No Expiry Set': 'var(--slate-100)' };

  const counts = {
    valid: licenses.filter(l => l.status === 'Valid').length,
    expiring: licenses.filter(l => l.status === 'Expiring Soon').length,
    expired: licenses.filter(l => l.status === 'Expired').length,
  };

  return (
    <div className="animate-fade">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: '16px 18px', borderTop: '3px solid var(--green-600)' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--green-600)', fontFamily: 'var(--font-display)' }}>{counts.valid}</div>
          <div style={{ fontSize: 12, color: 'var(--slate-500)', marginTop: 4 }}>Valid Licenses</div>
        </div>
        <div className="card" style={{ padding: '16px 18px', borderTop: '3px solid #D97706' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#D97706', fontFamily: 'var(--font-display)' }}>{counts.expiring}</div>
          <div style={{ fontSize: 12, color: 'var(--slate-500)', marginTop: 4 }}>Expiring Within 30 Days</div>
        </div>
        <div className="card" style={{ padding: '16px 18px', borderTop: '3px solid var(--red-600)' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--red-600)', fontFamily: 'var(--font-display)' }}>{counts.expired}</div>
          <div style={{ fontSize: 12, color: 'var(--slate-500)', marginTop: 4 }}>Expired Licenses</div>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(234,179,8,.1)', border: '1px solid rgba(234,179,8,.3)', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: '#92400E' }}>
          ⚠️ {error}
        </div>
      )}

      <div className="page-header">
        <div className="page-header-left">
          <h1>Blood Bank Licenses</h1>
          <p>License numbers, expiry tracking and documents for approved blood banks</p>
        </div>
      </div>

      {(counts.expired > 0 || counts.expiring > 0) && (
        <div style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: 'var(--red-600)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={18} />
          {counts.expired > 0 && `${counts.expired} license(s) have expired. `}
          {counts.expiring > 0 && `${counts.expiring} license(s) expiring within 30 days.`}
        </div>
      )}

      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr><th>Blood Bank</th><th>District</th><th>License No.</th><th>Registration No.</th><th>Expiry Date</th><th>Status</th><th>Document</th></tr></thead>
            <tbody>
              {loading && (<tr><td colSpan={7}><div className="empty-state"><p>Loading...</p></div></td></tr>)}
              {!loading && licenses.map(l => (
                <tr key={l._id}>
                  <td className="td-name">{l.bankName}</td>
                  <td style={{ fontSize: 13, color: 'var(--slate-600)' }}>{l.district}</td>
                  <td style={{ fontSize: 12, fontFamily: 'monospace' }}>{l.licenseNumber}</td>
                  <td style={{ fontSize: 12, fontFamily: 'monospace' }}>{l.registrationNumber}</td>
                  <td style={{ fontSize: 13 }}>{l.licenseExpiry ? new Date(l.licenseExpiry).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                  <td><span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 100, background: statusBg[l.status], color: statusColor[l.status] }}>{l.status}</span></td>
                  <td>
                    {l.licenseDocUrl ? (
                      <a href={`http://localhost:5000${l.licenseDocUrl}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--blue-600)', textDecoration: 'none' }}>
                        <FileText size={13} /> View
                      </a>
                    ) : <span style={{ fontSize: 12, color: 'var(--slate-400)' }}>—</span>}
                  </td>
                </tr>
              ))}
              {!loading && licenses.length === 0 && (
                <tr><td colSpan={7}><div className="empty-state"><FileBadge size={36} style={{ margin: '0 auto 12px', opacity: .3 }} /><h3>No approved blood banks yet</h3></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}