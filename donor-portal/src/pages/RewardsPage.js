import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const TIERS = [
  { min: 1,   icon: '🩸', name: 'First Drop',    desc: '1 donation' },
  { min: 5,   icon: '⭐', name: 'Star Donor',    desc: '5 donations' },
  { min: 10,  icon: '🥇', name: 'Gold Hero',     desc: '10 donations' },
  { min: 25,  icon: '💎', name: 'Diamond Hero',  desc: '25 donations' },
  { min: 50,  icon: '🏆', name: 'Life Saver',    desc: '50 donations' },
  { min: 100, icon: '🎖️', name: 'Legend',        desc: '100 donations' },
];

export default function RewardsPage() {
  const [donor, setDonor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/donor/dashboard')
      .then(res => setDonor(res.data?.donor || null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 60, color: 'var(--slate-500)' }}>Loading…</div>;
  }

  const total = donor?.totalDonations || 0;
  const nextTier = TIERS.find(t => total < t.min);

  return (
    <div className="anim-up">
      <div className="page-title">Rewards & Badges</div>
      <div className="page-sub">Earned through your real donation activity</div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--slate-500)', marginBottom: 4 }}>Your Points</div>
            <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--red-600)' }}>{donor?.points ?? 0}</div>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 12, color: 'var(--slate-500)', marginBottom: 6 }}>
              {nextTier ? `${nextTier.min - total} more donation${nextTier.min - total !== 1 ? 's' : ''} to reach ${nextTier.name}` : 'You\'ve reached the highest tier — Legend!'}
            </div>
            {nextTier && (
              <div style={{ height: 8, background: 'var(--slate-100)', borderRadius: 100, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, (total / nextTier.min) * 100)}%`, background: 'linear-gradient(90deg, var(--red-500), var(--red-600))', borderRadius: 100 }} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
        {TIERS.map(t => {
          const earned = total >= t.min;
          return (
            <div key={t.name} className="card" style={{ margin: 0, textAlign: 'center', opacity: earned ? 1 : .5 }}>
              <div className="card-body">
                <div style={{ fontSize: 34, marginBottom: 10, filter: earned ? 'none' : 'grayscale(1)' }}>{t.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{t.name}</div>
                <div style={{ fontSize: 12, color: 'var(--slate-500)', marginBottom: 10 }}>{t.desc}</div>
                <span className={`status-badge ${earned ? 'status-approved' : ''}`} style={!earned ? { background: 'var(--slate-100)', color: 'var(--slate-500)' } : {}}>
                  {earned ? 'Earned' : 'Locked'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}