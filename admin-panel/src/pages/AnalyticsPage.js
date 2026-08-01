import React, { useState, useEffect } from 'react';
import { TrendingUp, Droplet, MapPin, Users } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell,
} from 'recharts';
import api from '../utils/api';

const BLOOD_GROUP_COLORS = {
  'A+': '#C41E3A', 'A-': '#E11D48', 'B+': '#2563EB', 'B-': '#3B82F6',
  'AB+': '#7C3AED', 'AB-': '#A855F7', 'O+': '#059669', 'O-': '#10B981',
};

const PROVINCE_COLORS = ['#C41E3A', '#2563EB', '#059669', '#D97706', '#7C3AED', '#0891B2', '#DC2626', '#4F46E5', '#65A30D'];

function ChartCard({ title, icon, subtitle, children, loading, empty }) {
  return (
    <div className="card" style={{ padding: '20px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        {icon}
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--slate-900)', margin: 0 }}>{title}</h3>
      </div>
      {subtitle && <p style={{ fontSize: 12, color: 'var(--slate-400)', margin: '0 0 16px' }}>{subtitle}</p>}
      {loading ? (
        <div className="empty-state" style={{ padding: '40px 0' }}><p>Loading...</p></div>
      ) : empty ? (
        <div className="empty-state" style={{ padding: '40px 0' }}><p>No data yet.</p></div>
      ) : (
        <div style={{ width: '100%', height: 260, marginTop: subtitle ? 0 : 16 }}>{children}</div>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const [months, setMonths] = useState(6);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  const [donationTrends, setDonationTrends] = useState([]);
  const [bloodUsage, setBloodUsage] = useState([]);
  const [provinceStats, setProvinceStats] = useState([]);
  const [monthlyGrowth, setMonthlyGrowth] = useState([]);

  const fetchAll = () => {
    setLoading(true);
    setApiError('');
    Promise.all([
      api.get(`/analytics/donation-trends?months=${months}`),
      api.get('/analytics/blood-usage'),
      api.get('/analytics/province-stats'),
      api.get(`/analytics/monthly-growth?months=${months}`),
    ])
      .then(([dt, bu, ps, mg]) => {
        setDonationTrends(dt.data?.data || []);
        setBloodUsage(bu.data?.data || []);
        setProvinceStats(ps.data?.data || []);
        setMonthlyGrowth(mg.data?.data || []);
      })
      .catch(err => {
        console.error('Analytics fetch error:', err);
        setApiError('Could not load analytics from server.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); /* eslint-disable-next-line */ }, [months]);

  const totalUnitsCollected = donationTrends.reduce((s, d) => s + d.units, 0);
  const totalUnitsUsed = bloodUsage.reduce((s, d) => s + d.units, 0);
  const totalDonorsInRange = monthlyGrowth.reduce((s, d) => s + d.newDonors, 0);
  const topProvince = provinceStats[0]?.province || '—';

  return (
    <div className="animate-fade">

      {apiError && (
        <div style={{ background: 'rgba(234,179,8,.1)', border: '1px solid rgba(234,179,8,.3)', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: '#92400E' }}>
          ⚠️ {apiError}
        </div>
      )}

      <div className="page-header">
        <div className="page-header-left">
          <h1>Analytics</h1>
          <p>Donation trends, blood usage, province stats and growth — real-time from database</p>
        </div>
        <div className="page-header-right">
          <select
            className="filter-select"
            value={months}
            onChange={e => setMonths(parseInt(e.target.value))}
          >
            <option value={3}>Last 3 months</option>
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Units Collected', value: totalUnitsCollected, color: 'var(--red-600)', icon: '🩸' },
          { label: 'Units Issued', value: totalUnitsUsed, color: 'var(--blue-600)', icon: '💉' },
          { label: 'New Donors', value: totalDonorsInRange, color: 'var(--green-600)', icon: '🧑‍🤝‍🧑' },
          { label: 'Top Province', value: topProvince, color: '#7C3AED', icon: '📍' },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="card" style={{ padding: '16px 18px', borderTop: `3px solid ${color}` }}>
            <div style={{ fontSize: 11, color: 'var(--slate-400)', marginBottom: 4 }}>{icon} {label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: 'var(--font-display)' }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        <ChartCard
          title="Donation Trends"
          icon={<TrendingUp size={16} color="var(--red-600)" />}
          subtitle="Blood units collected per month"
          loading={loading}
          empty={!loading && donationTrends.every(d => d.units === 0)}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={donationTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--slate-100)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="units" stroke="#C41E3A" fill="#C41E3A" fillOpacity={0.15} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Blood Usage"
          icon={<Droplet size={16} color="var(--blue-600)" />}
          subtitle="Units issued by blood group"
          loading={loading}
          empty={!loading && bloodUsage.every(d => d.units === 0)}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bloodUsage}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--slate-100)" />
              <XAxis dataKey="bloodGroup" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="units" radius={[4, 4, 0, 0]}>
                {bloodUsage.map((entry, i) => (
                  <Cell key={i} fill={BLOOD_GROUP_COLORS[entry.bloodGroup] || '#94A3B8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Province Stats"
          icon={<MapPin size={16} color="#7C3AED" />}
          subtitle="Approved donors by province"
          loading={loading}
          empty={!loading && provinceStats.length === 0}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={provinceStats} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--slate-100)" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="province" tick={{ fontSize: 11 }} width={90} />
              <Tooltip />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {provinceStats.map((entry, i) => (
                  <Cell key={i} fill={PROVINCE_COLORS[i % PROVINCE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Monthly Growth"
          icon={<Users size={16} color="var(--green-600)" />}
          subtitle="New donor registrations & cumulative total"
          loading={loading}
          empty={!loading && monthlyGrowth.every(d => d.newDonors === 0)}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--slate-100)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="newDonors" name="New Donors" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="cumulative" name="Total Donors" stroke="#2563EB" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

      </div>
    </div>
  );
}