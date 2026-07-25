import React, { useState } from 'react';
import { CheckCircle, Droplet, Award } from 'lucide-react';

const MOCK_HISTORY = [
  { _id: '1', date: new Date('2025-01-12'), location: 'National Blood Bank, Colombo', bloodGroup: 'O+', units: 450, type: 'Whole Blood', status: 'completed', hemoglobin: 14.5, bp: '120/80', weight: 72, testResults: { hiv: 'Negative', hbv: 'Negative', hcv: 'Negative', syphilis: 'Negative', malaria: 'Negative' }, hospital: 'National Hospital Colombo' },
  { _id: '2', date: new Date('2024-09-10'), location: 'City Blood Bank, Colombo', bloodGroup: 'O+', units: 450, type: 'Whole Blood', status: 'completed', hemoglobin: 14.2, bp: '118/78', weight: 71, testResults: { hiv: 'Negative', hbv: 'Negative', hcv: 'Negative', syphilis: 'Negative', malaria: 'Negative' }, hospital: 'Asiri Medical Hospital' },
  { _id: '3', date: new Date('2024-05-05'), location: 'National Blood Bank, Colombo', bloodGroup: 'O+', units: 450, type: 'Whole Blood', status: 'completed', hemoglobin: 13.8, bp: '122/82', weight: 70, testResults: { hiv: 'Negative', hbv: 'Negative', hcv: 'Negative', syphilis: 'Negative', malaria: 'Negative' }, hospital: 'National Hospital Colombo' },
  { _id: '4', date: new Date('2023-12-20'), location: 'Kandy Regional Blood Bank', bloodGroup: 'O+', units: 450, type: 'Whole Blood', status: 'completed', hemoglobin: 14.0, bp: '119/79', weight: 71, testResults: { hiv: 'Negative', hbv: 'Negative', hcv: 'Negative', syphilis: 'Negative', malaria: 'Negative' }, hospital: 'Kandy Teaching Hospital' },
  { _id: '5', date: new Date('2023-08-14'), location: 'National Blood Bank, Colombo', bloodGroup: 'O+', units: 450, type: 'Whole Blood', status: 'completed', hemoglobin: 13.5, bp: '121/80', weight: 69, testResults: { hiv: 'Negative', hbv: 'Negative', hcv: 'Negative', syphilis: 'Negative', malaria: 'Negative' }, hospital: 'Colombo South Hospital' },
];

export default function DonationHistoryPage() {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter]     = useState('all');

  const filtered = filter === 'all' ? MOCK_HISTORY : MOCK_HISTORY.filter(h => h.status === filter);

  const totalMl = MOCK_HISTORY.reduce((s, h) => s + h.units, 0);

  return (
    <div className="anim-up">
      <div className="page-title">Donation History</div>
      <div className="page-sub">Complete record of all your blood donations</div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { icon: '🩸', value: MOCK_HISTORY.length, label: 'Total Donations' },
          { icon: '💧', value: `${(totalMl / 1000).toFixed(1)}L`, label: 'Total Blood' },
          { icon: '❤️', value: MOCK_HISTORY.length * 3, label: 'Lives Saved' },
          { icon: '🏅', value: 'Gold', label: 'Current Badge' },
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

        {filtered.map((h) => (
          <div key={h._id}>
            <div className="donation-item" style={{ cursor: 'pointer' }} onClick={() => setSelected(selected?._id === h._id ? null : h)}>
              <div className="donation-date-block">
                <div className="donation-date-day">{h.date.getDate()}</div>
                <div className="donation-date-month">{h.date.toLocaleString('en', { month: 'short' })}</div>
              </div>
              <div className="donation-info">
                <div className="donation-location">{h.location}</div>
                <div className="donation-meta">
                  {h.date.getFullYear()} · {h.type} · For {h.hospital}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="donation-units">{h.units} ml</div>
                <div className="donation-units-label">donated</div>
              </div>
              <div className="donation-status-done">
                <CheckCircle size={12} /> Complete
              </div>
            </div>

            {/* Expanded details */}
            {selected?._id === h._id && (
              <div style={{ background: 'var(--slate-50)', borderTop: '1px solid var(--slate-100)', padding: '20px 24px' }} className="anim-in">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--slate-400)', marginBottom: 4 }}>Health Check</div>
                    <div style={{ fontSize: 13, color: 'var(--slate-700)' }}>Hemoglobin: <strong>{h.hemoglobin} g/dL</strong></div>
                    <div style={{ fontSize: 13, color: 'var(--slate-700)' }}>Blood Pressure: <strong>{h.bp}</strong></div>
                    <div style={{ fontSize: 13, color: 'var(--slate-700)' }}>Weight: <strong>{h.weight} kg</strong></div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--slate-400)', marginBottom: 4 }}>Blood Tests</div>
                    {Object.entries(h.testResults).map(([key, val]) => (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--slate-700)', marginBottom: 2 }}>
                        <CheckCircle size={12} color="var(--green-500)" />
                        {key.toUpperCase()}: <strong style={{ color: 'var(--green-600)' }}>{val}</strong>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--slate-400)', marginBottom: 4 }}>Donation Info</div>
                    <div style={{ fontSize: 13, color: 'var(--slate-700)' }}>Blood Group: <strong>{h.bloodGroup}</strong></div>
                    <div style={{ fontSize: 13, color: 'var(--slate-700)' }}>Volume: <strong>{h.units} ml</strong></div>
                    <div style={{ fontSize: 13, color: 'var(--slate-700)' }}>Type: <strong>{h.type}</strong></div>
                    <div style={{ fontSize: 13, color: 'var(--slate-700)' }}>Hospital: <strong>{h.hospital}</strong></div>
                  </div>
                </div>
                <button style={{
                  padding: '8px 18px', background: 'var(--white)', border: '1.5px solid var(--slate-200)',
                  borderRadius: 'var(--r-sm)', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--slate-700)'
                }}>
                  📄 Download Certificate
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
