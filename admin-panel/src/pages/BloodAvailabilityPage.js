import React, { useState, useEffect } from 'react';
import { Droplet, RefreshCw, AlertTriangle } from 'lucide-react';
import api from '../utils/api';

const LEVEL_COLOR = { Critical: 'var(--red-600)', Low: '#D97706', Normal: 'var(--green-600)' };
const LEVEL_BG = { Critical: 'var(--red-100)', Low: 'var(--amber-100)', Normal: 'var(--green-100)' };

export default function BloodAvailabilityPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = () => {
    setLoading(true);
    setError('');
    api.get('/emergency-extras/blood-availability')
      .then(res => setData(res.data))
      .catch(() => setError('Could not load blood availability data.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const criticalGroups = data?.availability.filter(a => a.level === 'Critical') || [];

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Blood Availability</h1>
          <p>Real-time Safe (tested & cleared) blood stock, by blood group</p>
        </div>
        <button className="btn-add" style={{ background: 'var(--slate-100)', color: 'var(--slate-700)' }} onClick={fetchData}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(234,179,8,.1)', border: '1px solid rgba(234,179,8,.3)', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: '#92400E' }}>
          ⚠️ {error}
        </div>
      )}

      {criticalGroups.length > 0 && (
        <div style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: 'var(--red-600)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={18} />
          Critical shortage: {criticalGroups.map(g => g.bloodGroup).join(', ')} — under 5 units available.
        </div>
      )}

      {loading && !data ? (
        <div className="card"><div className="empty-state" style={{ padding: '40px 0' }}><p>Checking stock...</p></div></div>
      ) : data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          {data.availability.map(a => (
            <div key={a.bloodGroup} className="card" style={{ padding: '18px 20px', borderTop: `3px solid ${LEVEL_COLOR[a.level]}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: LEVEL_COLOR[a.level], fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Droplet size={16} /> {a.bloodGroup}
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 100, background: LEVEL_BG[a.level], color: LEVEL_COLOR[a.level] }}>{a.level}</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--slate-900)', marginBottom: 8 }}>{a.count} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--slate-400)' }}>bags</span></div>
              {a.byBloodBank.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {a.byBloodBank.map(b => (
                    <div key={b.bankName} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--slate-500)' }}>
                      <span>{b.bankName}</span><b>{b.count}</b>
                    </div>
                  ))}
                </div>
              ) : <div style={{ fontSize: 11, color: 'var(--slate-400)' }}>No stock available</div>}
            </div>
          ))}
        </div>
      )}

      <div style={{ fontSize: 11, color: 'var(--slate-400)', marginTop: 16, textAlign: 'center' }}>
        Auto-refreshes every 30 seconds · Only counts bags marked "Safe" after lab testing
      </div>
    </div>
  );
}