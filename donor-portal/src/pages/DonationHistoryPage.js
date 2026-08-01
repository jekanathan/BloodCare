import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, XCircle, Droplet, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const STATUS_LABEL = {
  Collected: 'Collected', 'Under Testing': 'Under Testing', Safe: 'Completed',
  Unsafe: 'Unsafe', Quarantined: 'Quarantined', Reserved: 'Reserved',
  Issued: 'Issued', Expired: 'Expired', Disposed: 'Disposed',
};

const TEST_ICON = { Negative: <CheckCircle size={12} color="var(--green-500)" />, Positive: <XCircle size={12} color="var(--red-500)" />, Pending: <Clock size={12} color="var(--amber-500)" /> };

export default function DonationHistoryPage() {
  const [donations, setDonations] = useState([]);
  const [summary, setSummary] = useState({ totalDonations: 0, totalMl: 0, livesImpacted: 0, badge: 'New Donor' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/donor/donations')
      .then(res => {
        setDonations(res.data?.donations || []);
        setSummary(res.data?.summary || {});
        setError(null);
      })
      .catch(err => setError(err.response?.data?.message || 'Could not load donation history'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? donations : donations.filter(d => d.status === 'Safe');

  if (loading) {
    return (
      <div className="anim-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: 'var(--slate-500)' }}>
        <div style={{ width: 34, height: 34, border: '3px solid var(--slate-200)', borderTopColor: 'var(--red-600)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 14 }} />
        Loading donation history…
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="anim-up card" style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Couldn't load your donation history</div>
        <div style={{ fontSize: 13, color: 'var(--slate-500)' }}>{error}</div>
      </div>
    );
  }

  return (
    <div className="anim-up">
      <div className="page-title">Donation History</div>
      <div className="page-sub">Complete record of all your blood donations</div>

      {/* Summary stats — all real, computed from your BloodBag records */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { icon: '🩸', value: summary.totalDonations, label: 'Total Donations' },
          { icon: '💧', value: `${((summary.totalMl || 0) / 1000).toFixed(1)}L`, label: 'Total Blood' },
          { icon: '❤️', value: summary.livesImpacted, label: 'Lives Saved' },
          { icon: '🏅', value: summary.badge, label: 'Current Badge' },
        ].map(({ icon, value, label }) => (
          <div key={label} className="dstat-card">
            <div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>
            <div className="dstat-value">{value}</div>
            <div className="dstat-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">All Donations</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['all', 'completed'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '6px 14px', borderRadius: 'var(--r-sm)', border: 'none',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: filter === f ? 'var(--red-600)' : 'var(--slate-100)',
                color: filter === f ? '#fff' : 'var(--slate-600)',
              }}>
                {f === 'all' ? 'All' : 'Completed'}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="card-body empty-state" style={{ padding: '48px 20px' }}>
            <Droplet size={32} style={{ opacity: .4, marginBottom: 10 }} />
            <h3>No donations yet</h3>
            <p>Your donation records will show up here once recorded by a blood bank.</p>
          </div>
        ) : filtered.map((h) => {
          const d = new Date(h.date);
          const isDone = h.status === 'Safe' || h.status === 'Issued';
          return (
            <div key={h._id}>
              <div className="donation-item" style={{ cursor: 'pointer' }} onClick={() => setSelected(selected?._id === h._id ? null : h)}>
                <div className="donation-date-block">
                  <div className="donation-date-day">{d.getDate()}</div>
                  <div className="donation-date-month">{d.toLocaleString('en', { month: 'short' })}</div>
                </div>
                <div className="donation-info">
                  <div className="donation-location">{h.location}</div>
                  <div className="donation-meta">
                    {d.getFullYear()} · {h.component} · Bag {h.bagId}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="donation-units">{h.units} ml</div>
                  <div className="donation-units-label">donated</div>
                </div>
                <div className={isDone ? 'donation-status-done' : ''} style={!isDone ? { display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: 'var(--amber-500)' } : {}}>
                  {isDone ? <><CheckCircle size={12} /> {STATUS_LABEL[h.status]}</> : <><Clock size={12} /> {STATUS_LABEL[h.status] || h.status}</>}
                </div>
              </div>

              {/* Expanded details — real bag & lab-test fields only */}
              {selected?._id === h._id && (
                <div style={{ background: 'var(--slate-50)', borderTop: '1px solid var(--slate-100)', padding: '20px 24px' }} className="anim-in">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 20 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--slate-400)', marginBottom: 4 }}>Bag Details</div>
                      <div style={{ fontSize: 13, color: 'var(--slate-700)' }}>Bag ID: <strong>{h.bagId}</strong></div>
                      <div style={{ fontSize: 13, color: 'var(--slate-700)' }}>Component: <strong>{h.component}</strong></div>
                      <div style={{ fontSize: 13, color: 'var(--slate-700)' }}>Volume: <strong>{h.units} ml</strong></div>
                      {h.expiryDate && <div style={{ fontSize: 13, color: 'var(--slate-700)' }}>Expiry: <strong>{new Date(h.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></div>}
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--slate-400)', marginBottom: 4 }}>Lab Tests</div>
                      {h.testResults ? Object.entries(h.testResults).map(([key, val]) => (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--slate-700)', marginBottom: 2 }}>
                          {TEST_ICON[val]}
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}:{' '}
                          <strong style={{ color: val === 'Negative' ? 'var(--green-600)' : val === 'Positive' ? 'var(--red-600)' : 'var(--amber-500)' }}>{val}</strong>
                        </div>
                      )) : <div style={{ fontSize: 13, color: 'var(--slate-400)' }}>Not tested yet</div>}
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--slate-400)', marginBottom: 4 }}>Donation Info</div>
                      <div style={{ fontSize: 13, color: 'var(--slate-700)' }}>Blood Group: <strong>{h.bloodGroup}</strong></div>
                      <div style={{ fontSize: 13, color: 'var(--slate-700)' }}>Blood Bank: <strong>{h.location}</strong></div>
                      {h.address && <div style={{ fontSize: 13, color: 'var(--slate-700)' }}>Address: <strong>{h.address}</strong></div>}
                      <div style={{ fontSize: 13, color: 'var(--slate-700)' }}>Status: <strong>{STATUS_LABEL[h.status] || h.status}</strong></div>
                    </div>
                  </div>
                  <button
                    style={{ padding: '8px 18px', background: 'var(--white)', border: '1.5px solid var(--slate-200)', borderRadius: 'var(--r-sm)', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--slate-700)', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    onClick={() => navigate('/certificates')}
                  >
                    <FileText size={14} /> View My Certificates
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}