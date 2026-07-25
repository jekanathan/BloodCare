import React, { useState, useEffect } from 'react';
import { Users, Droplet, FileText, CheckCircle, Siren, Truck, TrendingDown, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import api from '../utils/api';

function isToday(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function Card({ icon, label, value, color }) {
  return (
    <div className="card" style={{ padding: '18px 20px', borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: 11, color: 'var(--slate-400)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>{icon} {label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color, fontFamily: 'var(--font-display)' }}>{value}</div>
    </div>
  );
}

export default function TodaySummaryPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);

  const fetchSummary = () => {
    setLoading(true);
    setError('');
    Promise.all([
      api.get('/donors').catch(() => ({ data: { donors: [] } })),
      api.get('/hospitals').catch(() => ({ data: { hospitals: [] } })),
      api.get('/bloodbanks').catch(() => ({ data: { bloodBanks: [] } })),
      api.get('/blood-requests').catch(() => ({ data: { requests: [] } })),
      api.get('/inventory').catch(() => ({ data: { inventory: [] } })),
      api.get('/inventory/history').catch(() => ({ data: { history: [] } })),
    ]).then(([donorsRes, hospRes, bankRes, reqRes, invRes, histRes]) => {
      const donors = donorsRes.data?.donors || [];
      const hospitals = hospRes.data?.hospitals || [];
      const bloodBanks = bankRes.data?.bloodBanks || [];
      const requests = reqRes.data?.requests || [];
      const inventory = invRes.data?.inventory || [];
      const history = histRes.data?.history || [];

      const newDonorsToday = donors.filter(d => isToday(d.createdAt)).length;
      const requestsToday = requests.filter(r => isToday(r.createdAt)).length;
      const completedToday = requests.filter(r => r.status === 'delivered' && isToday(r.deliveredAt)).length;
      const emergencyToday = requests.filter(r => r.priority === 'Emergency' && isToday(r.createdAt)).length;

      const collectedToday = history.filter(h => h.type === 'IN' && isToday(h.date)).reduce((s, h) => s + (h.units || 0), 0);
      const dispatchedToday = history.filter(h => h.type === 'OUT' && isToday(h.date)).reduce((s, h) => s + (h.units || 0), 0);

      const stockByGroup = {};
      inventory.forEach(i => { stockByGroup[i.bloodGroup] = (stockByGroup[i.bloodGroup] || 0) + (i.units || 0); });
      const lowStockGroups = Object.entries(stockByGroup).filter(([, units]) => units < 50).map(([g]) => g);

      const expiringUnits = inventory.filter(i => {
        if (!i.expiryDate) return false;
        const days = Math.ceil((new Date(i.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        return days >= 0 && days <= 7;
      }).reduce((s, i) => s + (i.units || 0), 0);

      const pendingApprovals =
        donors.filter(d => d.status === 'pending').length +
        hospitals.filter(h => h.status === 'pending' || h.status === 'under_review').length +
        bloodBanks.filter(b => b.status === 'pending' || b.status === 'under_review').length;

      setSummary({
        newDonorsToday, requestsToday, completedToday, emergencyToday,
        collectedToday, dispatchedToday, lowStockGroups, expiringUnits, pendingApprovals,
      });
    }).catch(err => {
      console.error('Today summary error:', err);
      setError('Could not load today\'s summary from server.');
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchSummary(); }, []);

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Today's Summary</h1>
          <p>Real activity across BloodCare — {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>
        <button className="btn-add" style={{ background: 'var(--slate-100)', color: 'var(--slate-700)' }} onClick={fetchSummary}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(234,179,8,.1)', border: '1px solid rgba(234,179,8,.3)', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: '#92400E' }}>
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="card"><div className="empty-state" style={{ padding: '40px 0' }}><p>Loading today's summary...</p></div></div>
      ) : summary && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
            <Card icon={<Users size={14} />} label="New Donors Today" value={summary.newDonorsToday} color="var(--red-600)" />
            <Card icon={<FileText size={14} />} label="New Requests Today" value={summary.requestsToday} color="var(--blue-600)" />
            <Card icon={<CheckCircle size={14} />} label="Completed Today" value={summary.completedToday} color="var(--green-600)" />
            <Card icon={<Siren size={14} />} label="Emergency Today" value={summary.emergencyToday} color="#D97706" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
            <Card icon={<Droplet size={14} />} label="Units Collected Today" value={summary.collectedToday} color="var(--red-600)" />
            <Card icon={<Truck size={14} />} label="Units Dispatched Today" value={summary.dispatchedToday} color="#7C3AED" />
            <Card icon={<TrendingDown size={14} />} label="Low Stock Groups" value={summary.lowStockGroups.length} color="var(--red-700)" />
            <Card icon={<Clock size={14} />} label="Pending Approvals" value={summary.pendingApprovals} color="#D97706" />
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><AlertTriangle size={16} color="#D97706" /> Attention Needed</div></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {summary.lowStockGroups.length > 0 && (
                <div style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--red-600)' }}>
                  🩸 Low stock: {summary.lowStockGroups.join(', ')} (under 50 units combined)
                </div>
              )}
              {summary.expiringUnits > 0 && (
                <div style={{ background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.25)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#92400E' }}>
                  ⏰ {summary.expiringUnits} unit(s) expiring within the next 7 days
                </div>
              )}
              {summary.pendingApprovals > 0 && (
                <div style={{ background: 'rgba(37,99,235,.08)', border: '1px solid rgba(37,99,235,.25)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--blue-600)' }}>
                  📋 {summary.pendingApprovals} registration(s) awaiting approval
                </div>
              )}
              {summary.lowStockGroups.length === 0 && summary.expiringUnits === 0 && summary.pendingApprovals === 0 && (
                <div style={{ fontSize: 13, color: 'var(--green-600)' }}>✅ Nothing urgent — everything looks good today.</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}