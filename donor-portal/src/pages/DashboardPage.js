import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
  Droplet, Heart, Award, Bell, Calendar, MapPin,
  CheckCircle, Clock, ChevronRight, AlertTriangle,
  Inbox, PackageSearch, User, BadgeCheck, Phone, FileText
} from 'lucide-react';

const EMPTY_STATE = {
  donor: {
    fullName: '', bloodGroup: '—', district: '—', isEligible: false,
    totalDonations: 0, lastDonationDate: null, daysUntilEligible: 0, nextEligibleDate: null,
    badge: 'New Donor', livesImpacted: 0, monthsSinceLast: null, points: 0,
  },
  chartData: [],
  history: [],
  activeRequests: [],
  notifications: [],
  nextAppointment: null,
  topEmergencyRequest: null,
};

const NOTIF_ICON = { SMS: '💬', Email: '✉️', Push: '🔔', Announcement: '📣' };

const QUICK_ACTIONS = [
  { label: 'Donate Blood',    icon: Droplet,    cls: 'red',    path: '/appointments' },
  { label: 'Book Appointment',icon: Calendar,   cls: 'blue',   path: '/appointments' },
  { label: 'Find Blood Banks',icon: MapPin,     cls: 'green',  path: '/blood-banks' },
  { label: 'My Certificates', icon: BadgeCheck, cls: 'purple', path: '/certificates' },
  { label: 'Edit Profile',    icon: User,       cls: 'amber',  path: '/profile' },
  { label: 'Contact Us',      icon: Phone,      cls: 'teal',   path: '/help' },
];

export default function DashboardPage() {
  const { donor: authDonor } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(EMPTY_STATE);
  const [nearbyBanks, setNearbyBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acceptedRequests, setAcceptedRequests] = useState([]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([
      api.get('/donor/dashboard'),
      api.get('/appointments/blood-banks'),
    ])
      .then(([dashRes, bankRes]) => {
        if (!mounted) return;
        setData({ ...EMPTY_STATE, ...dashRes.data });
        const banks = bankRes.data?.bloodBanks || [];
        const district = dashRes.data?.donor?.district;
        // Real ordering — same-district banks first, no fabricated distance.
        const sorted = [...banks].sort((a, b) => (b.district === district) - (a.district === district));
        setNearbyBanks(sorted.slice(0, 3));
        setError(null);
      })
      .catch(err => { if (mounted) setError(err.response?.data?.message || 'Could not load dashboard'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const handleAccept = (id) => setAcceptedRequests(prev => [...prev, id]);

  const { donor, chartData, history, activeRequests, notifications, nextAppointment, topEmergencyRequest } = data;

  if (loading) {
    return (
      <div className="anim-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: 'var(--slate-500)' }}>
        <div style={{
          width: 36, height: 36, border: '3px solid var(--slate-200)', borderTopColor: 'var(--red-600)',
          borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 14,
        }} />
        Loading your dashboard…
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="anim-up card" style={{ padding: 32, textAlign: 'center' }}>
        <AlertTriangle size={28} color="var(--amber-500)" style={{ marginBottom: 10 }} />
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Couldn't load your dashboard</div>
        <div style={{ fontSize: 13, color: 'var(--slate-500)' }}>{error}</div>
      </div>
    );
  }

  const isPositive = (donor.bloodGroup || '').includes('+');

  return (
    <div className="anim-up">
      {/* STATS */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <StatCard
          icon={<Droplet size={20} />} cls="red" value={donor.bloodGroup} label="Blood Group"
          badge={isPositive ? 'Positive' : 'Negative'} badgeCls="badge-red"
          trend={<span onClick={() => navigate('/profile')} style={{ color: 'var(--blue-500)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>View Details <ChevronRight size={12} /></span>}
        />
        <StatCard
          icon={<Heart size={20} />} cls="red" value={donor.totalDonations} label="Total Donations"
          trend={<span onClick={() => navigate('/history')} style={{ color: 'var(--blue-500)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>View History <ChevronRight size={12} /></span>}
        />
        <StatCard
          icon={<Calendar size={20} />} cls="purple"
          value={donor.isEligible ? 'Eligible Now' : (donor.nextEligibleDate ? new Date(donor.nextEligibleDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')}
          label="Next Eligible Date"
          trend={donor.isEligible ? 'You can donate today' : `${donor.daysUntilEligible} days left`}
        />
        <StatCard
          icon={<Award size={20} />} cls="amber" value={donor.points} label="Donor Points"
          trend="Keep it up!"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 20, marginBottom: 20, alignItems: 'stretch' }}>
        {/* Donation history chart */}
        <div className="card" style={{ margin: 0 }}>
          <div className="card-header">
            <div className="card-title">Donation History (Last 12 Months)</div>
          </div>
          <div className="card-body" style={{ paddingTop: 10 }}>
            {chartData.every(c => c.count === 0) ? (
              <EmptyState icon={<Droplet size={26} />} text="No donations in the last 12 months yet." />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="donationFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--red-500)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--red-500)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--slate-100)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--slate-400)' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--slate-400)' }} axisLine={false} tickLine={false} width={24} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--slate-200)' }} />
                  <Area type="monotone" dataKey="count" name="Donations" stroke="var(--red-500)" strokeWidth={2.5} fill="url(#donationFill)" dot={{ r: 3, fill: 'var(--red-500)' }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Upcoming appointment */}
        <div className="card" style={{ margin: 0 }}>
          <div className="card-header"><div className="card-title">Upcoming Appointment</div></div>
          <div className="card-body">
            {nextAppointment ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 'var(--r-sm)', background: 'var(--red-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Calendar size={20} color="var(--red-600)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{new Date(nextAppointment.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--slate-500)' }}>{nextAppointment.bank}</div>
                  </div>
                </div>
                <span className="status-badge status-approved" style={{ marginBottom: 10, display: 'inline-block' }}>Confirmed</span>
                <div style={{ fontSize: 12.5, color: 'var(--slate-500)', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 16 }}>
                  <Clock size={12} /> {nextAppointment.time}
                </div>
                <button className="btn-main" style={{ background: 'transparent', color: 'var(--red-600)', border: '1.5px solid var(--red-200)' }}
                  onClick={() => navigate('/appointments')}>View Appointment</button>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <Calendar size={26} color="var(--slate-300)" style={{ marginBottom: 10 }} />
                <div style={{ fontSize: 13, color: 'var(--slate-500)', marginBottom: 16 }}>No upcoming appointment.</div>
                <button className="btn-main" onClick={() => navigate('/appointments')}>Book Appointment</button>
              </div>
            )}
          </div>
        </div>

        {/* Emergency request near you */}
        <div className="card" style={{ margin: 0 }}>
          <div className="card-header">
            <div className="card-title">Emergency Request</div>
            <Droplet size={16} color="var(--red-600)" />
          </div>
          <div className="card-body">
            {topEmergencyRequest ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontWeight: 800, fontSize: 17, color: 'var(--red-600)' }}>{topEmergencyRequest.bloodGroup} Required</span>
                  <span className="status-badge status-rejected">{topEmergencyRequest.priority}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--slate-800)', marginBottom: 4 }}>{topEmergencyRequest.hospitalName}</div>
                <div style={{ fontSize: 12.5, color: 'var(--slate-500)', marginBottom: 2 }}>Needed: {topEmergencyRequest.unitsRequired} Units</div>
                <div style={{ fontSize: 12, color: 'var(--slate-400)', marginBottom: 16 }}>Posted {timeAgo(topEmergencyRequest.createdAt)}</div>
                {acceptedRequests.includes(topEmergencyRequest._id) ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--green-600)', fontWeight: 600, fontSize: 13 }}>
                    <CheckCircle size={15} /> Accepted
                  </div>
                ) : (
                  <button className="btn-main" onClick={() => handleAccept(topEmergencyRequest._id)}>I Can Help</button>
                )}
              </>
            ) : (
              <EmptyState icon={<PackageSearch size={24} />} text={`No active requests for ${donor.bloodGroup} right now.`} small />
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 20, alignItems: 'stretch' }}>
        {/* Recent notifications */}
        <div className="card" style={{ margin: 0 }}>
          <div className="card-header">
            <div className="card-title">Recent Notifications</div>
            <button onClick={() => navigate('/notifications')} style={{ fontSize: 13, color: 'var(--red-600)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>View All</button>
          </div>
          {notifications.length === 0 ? (
            <div className="card-body"><EmptyState icon={<Bell size={22} />} text="No notifications yet." small /></div>
          ) : notifications.slice(0, 4).map(n => (
            <div key={n._id} className="notif-item" onClick={() => navigate('/notifications')}>
              <div className="notif-icon-wrap system">{NOTIF_ICON[n.type] || '🔔'}</div>
              <div className="notif-content">
                <div className="notif-title">{n.title}</div>
                <div className="notif-desc">{n.message}</div>
                <div className="notif-time">{timeAgo(n.sentAt)}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Nearby blood banks */}
        <div className="card" style={{ margin: 0 }}>
          <div className="card-header">
            <div className="card-title">Nearby Blood Banks</div>
            <button onClick={() => navigate('/blood-banks')} style={{ fontSize: 13, color: 'var(--red-600)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>View All</button>
          </div>
          <div className="card-body">
            {nearbyBanks.length === 0 ? (
              <EmptyState icon={<MapPin size={22} />} text="No approved blood banks yet." small />
            ) : nearbyBanks.map(b => (
              <div key={b._id} className="bank-list-row">
                <div className="bank-pin"><MapPin size={15} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-900)' }}>{b.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--slate-500)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.address || b.district}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="card" style={{ margin: 0 }}>
          <div className="card-header"><div className="card-title">Quick Actions</div></div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {QUICK_ACTIONS.map(({ label, icon: Icon, cls, path }) => (
                <div key={label} className="quick-action-tile" onClick={() => navigate(path)}>
                  <div className={`quick-action-icon stat-card-icon ${cls}`}><Icon size={18} /></div>
                  <div className="quick-action-label">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Donation history table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Donation History</div>
          <button onClick={() => navigate('/history')} style={{ fontSize: 13, color: 'var(--red-600)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>View All</button>
        </div>
        <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
          {history.length === 0 ? (
            <div style={{ padding: '32px 24px' }}>
              <EmptyState icon={<FileText size={24} />} text="No donations recorded yet." small />
            </div>
          ) : (
            <table className="simple-table">
              <thead>
                <tr>
                  <th>Date</th><th>Blood Bank</th><th>Units</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 5).map(h => (
                  <tr key={h._id}>
                    <td>{new Date(h.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td>{h.location}</td>
                    <td>{h.units} ml</td>
                    <td><span className="status-badge status-approved">{h.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, cls, value, label, badge, badgeCls, trend }) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <div className={`stat-card-icon ${cls}`}>{icon}</div>
        {badge && <span className={`pts-badge ${badgeCls || ''}`} style={{ background: 'var(--red-100)', color: 'var(--red-600)' }}>{badge}</span>}
      </div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
      {trend && <div className="stat-card-trend">{trend}</div>}
    </div>
  );
}

function EmptyState({ icon, text, small }) {
  return (
    <div style={{ textAlign: 'center', padding: small ? '4px 8px' : '8px 16px' }}>
      <div style={{ color: 'var(--slate-300)', marginBottom: 10, display: 'flex', justifyContent: 'center' }}>
        {icon || <Inbox size={26} />}
      </div>
      <div style={{ fontSize: 13, color: 'var(--slate-500)', lineHeight: 1.5 }}>{text}</div>
    </div>
  );
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}