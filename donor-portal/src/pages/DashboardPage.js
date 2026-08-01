import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
  Droplet, Heart, Award, Bell,
  CheckCircle, Clock, ChevronRight, AlertTriangle,
  Inbox, CalendarPlus, PackageSearch
} from 'lucide-react';

const EMPTY_STATE = {
  donor: {
    fullName: '', bloodGroup: '—', district: '—', isEligible: false,
    totalDonations: 0, lastDonationDate: null, daysUntilEligible: 0,
    badge: 'New Donor', livesImpacted: 0, monthsSinceLast: null,
  },
  history: [],
  activeRequests: [],
  notifications: [],
  nextAppointment: null,
};

const NOTIF_ICON = { SMS: '💬', Email: '✉️', Push: '🔔', Announcement: '📣' };

export default function DashboardPage() {
  const { donor: authDonor } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(EMPTY_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acceptedRequests, setAcceptedRequests] = useState([]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.get('/donor/dashboard')
      .then(res => { if (mounted) { setData({ ...EMPTY_STATE, ...res.data }); setError(null); } })
      .catch(err => { if (mounted) setError(err.response?.data?.message || 'Could not load dashboard'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const handleAccept = (id) => setAcceptedRequests(prev => [...prev, id]);

  const { donor, history, activeRequests, notifications, nextAppointment } = data;
  const greeting = new Date().getHours() < 12 ? '🌅 Good morning' : new Date().getHours() < 18 ? '☀️ Good afternoon' : '🌙 Good evening';

  if (loading) {
    return (
      <div className="anim-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: 'var(--slate-500)' }}>
        <div className="spinner" style={{
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

  return (
    <div className="anim-up">
      {/* WELCOME BANNER — matches admin dashboard style */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, marginBottom: 24 }}>
        <div className="welcome-banner">
          <div className="welcome-text">
            <div className="welcome-greeting">{greeting}</div>
            <div className="welcome-name">{authDonor?.fullName || donor.fullName || 'Donor'}</div>
            <div className="welcome-sub">
              {donor.bloodGroup} Donor &nbsp;·&nbsp; {donor.district || 'District not set'} &nbsp;·&nbsp; {donor.totalDonations} lifetime donations
            </div>
            <div className="welcome-actions">
              <button className="btn-white" onClick={() => navigate('/appointments')}>Book Appointment</button>
              <button className="btn-outline-white" onClick={() => navigate('/history')}>View History</button>
            </div>
          </div>
          <div className="welcome-icon">🩸</div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Donation Snapshot</div>
            <span style={{ fontSize: 11, color: 'var(--slate-500)' }}>Your Summary</span>
          </div>
          <div className="card-body" style={{ padding: '16px 22px' }}>
            <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--slate-100)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--slate-500)', marginBottom: 4 }}>Total Donations</div>
                  <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--slate-900)', lineHeight: 1 }}>{donor.totalDonations}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: donor.isEligible ? 'var(--green-600)' : 'var(--amber-500)', marginBottom: 4 }}>
                    {donor.isEligible ? '✅ Eligible' : '⏳ Not yet'}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--slate-400)' }}>
                    {donor.isEligible ? 'to donate now' : `${donor.daysUntilEligible}d left`}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--slate-500)', marginBottom: 4 }}>Lives Impacted</div>
                  <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--slate-900)', lineHeight: 1 }}>{donor.livesImpacted}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue-500)', marginBottom: 4 }}>{donor.bloodGroup}</div>
                  <div style={{ fontSize: 10, color: 'var(--slate-400)' }}>~3 lives / donation</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STATS — matches admin stat-card component style */}
      <div className="stats-grid">
        <StatCard icon={<Droplet size={20} />} cls="red" value={donor.totalDonations} label="Total Donations" trend="lifetime" />
        <StatCard icon={<Heart size={20} />} cls="green" value={donor.livesImpacted} label="Lives Impacted" trend="estimated" />
        <StatCard icon={<Clock size={20} />} cls="blue" value={donor.monthsSinceLast ?? '—'} label="Months Since Last" trend={donor.lastDonationDate ? 'from last donation' : 'no donations yet'} />
        <StatCard icon={<Award size={20} />} cls="purple" value={donor.badge} label="Donor Badge" trend="based on total donations" />
      </div>

      <div className="section-grid">
        {/* Left column */}
        <div className="section-col">
          {/* Active blood requests */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">🚨 Emergency Blood Requests</div>
              <span style={{ fontSize: 12, fontWeight: 700, background: 'var(--red-100)', color: 'var(--red-700)', padding: '3px 10px', borderRadius: 100 }}>
                {activeRequests.length} Active
              </span>
            </div>
            <div className="card-body" style={{ padding: activeRequests.length ? '20px 24px' : '32px 24px' }}>
              {activeRequests.length === 0 ? (
                <EmptyState icon={<PackageSearch size={26} />} text={`No active requests for ${donor.bloodGroup} right now. We'll notify you the moment one comes in.`} />
              ) : activeRequests.map(req => (
                <div key={req._id} className="request-card">
                  <div className="request-card-header">
                    <div className="request-card-title">🏥 {req.hospitalName}</div>
                    <span className={`request-priority ${req.priority.toLowerCase()}`}>{req.priority}</span>
                  </div>
                  <div className="request-card-body">
                    <div className="request-detail-grid">
                      <div className="request-detail-field">
                        <div className="request-detail-label">Blood Group</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                          <div className="request-blood-badge">{req.bloodGroup}</div>
                        </div>
                      </div>
                      <div className="request-detail-field">
                        <div className="request-detail-label">Units Needed</div>
                        <div className="request-detail-value">{req.unitsRequired} Units</div>
                      </div>
                      <div className="request-detail-field">
                        <div className="request-detail-label">Priority</div>
                        <div className="request-detail-value" style={{ color: req.priority === 'Emergency' ? 'var(--red-600)' : 'var(--amber-500)' }}>
                          {req.priority}
                        </div>
                      </div>
                    </div>

                    {acceptedRequests.includes(req._id) ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px', background: 'var(--green-50)', borderRadius: 'var(--r-sm)', border: '1px solid var(--green-100)' }}>
                        <CheckCircle size={16} color="var(--green-600)" />
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--green-600)' }}>
                          Request Accepted! Book your appointment.
                        </span>
                        <button style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: 'var(--blue-500)', background: 'none', border: 'none', cursor: 'pointer' }}
                          onClick={() => navigate('/appointments')}>
                          Book Now →
                        </button>
                      </div>
                    ) : (
                      <div className="request-actions">
                        <button className="btn-accept" onClick={() => handleAccept(req._id)}>
                          <CheckCircle size={15} /> Accept Request
                        </button>
                        <button className="btn-decline">Decline</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent donations */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Recent Donations</div>
              <button
                onClick={() => navigate('/history')}
                style={{ fontSize: 13, color: 'var(--red-600)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                View all <ChevronRight size={14} />
              </button>
            </div>
            {history.length === 0 ? (
              <div className="card-body" style={{ padding: '32px 24px' }}>
                <EmptyState icon={<Droplet size={26} />} text="No donations recorded yet. Your first donation will show up here." />
              </div>
            ) : history.map((h) => {
              const d = new Date(h.date);
              return (
                <div className="donation-item" key={h._id}>
                  <div className="donation-date-block">
                    <div className="donation-date-day">{d.getDate()}</div>
                    <div className="donation-date-month">{d.toLocaleString('en', { month: 'short' })}</div>
                  </div>
                  <div className="donation-info">
                    <div className="donation-location">{h.location}</div>
                    <div className="donation-meta">{d.getFullYear()} &nbsp;·&nbsp; Whole Blood</div>
                  </div>
                  <div>
                    <div className="donation-units">{h.units}</div>
                    <div className="donation-units-label">ml</div>
                  </div>
                  <div className="donation-status-done">
                    <CheckCircle size={12} /> {h.status}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column */}
        <div className="section-col">
          {/* Upcoming appointment */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Upcoming Appointment</div>
              <button onClick={() => navigate('/appointments')} style={{ fontSize: 13, color: 'var(--red-600)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                View all
              </button>
            </div>
            <div className="card-body">
              {nextAppointment ? (
                <div className="appt-card">
                  <div className="appt-date-block">
                    <div className="appt-day">{new Date(nextAppointment.date).getDate()}</div>
                    <div className="appt-month">{new Date(nextAppointment.date).toLocaleString('en', { month: 'short' })}</div>
                  </div>
                  <div className="appt-info">
                    <div className="appt-title">{nextAppointment.bank}</div>
                    <div className="appt-meta">{nextAppointment.address} · {nextAppointment.time}</div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 8px' }}>
                  <CalendarPlus size={28} color="var(--slate-400)" style={{ marginBottom: 10 }} />
                  <div style={{ fontSize: 13, color: 'var(--slate-500)', marginBottom: 16 }}>
                    No upcoming appointment booked.
                  </div>
                  <button className="btn-main" onClick={() => navigate('/appointments')}>
                    Book Appointment
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Eligibility check */}
          <div className="card">
            <div className="card-header"><div className="card-title">Donation Eligibility</div></div>
            <div className="card-body">
              {donor.isEligible ? (
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <div style={{ width: 64, height: 64, background: 'var(--green-100)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>
                    ✅
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 18, fontFamily: 'var(--font-display)', color: 'var(--green-600)', marginBottom: 6 }}>
                    You are Eligible!
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--slate-500)', marginBottom: 20, lineHeight: 1.5 }}>
                    {donor.monthsSinceLast != null
                      ? `It's been ${donor.monthsSinceLast} months since your last donation. You can donate blood now.`
                      : 'You can donate blood now.'}
                  </div>
                  <button className="btn-main" onClick={() => navigate('/appointments')}>
                    Book Appointment
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 13, color: 'var(--slate-500)' }}>
                    <AlertTriangle size={28} color="var(--amber-500)" style={{ margin: '0 auto 12px', display: 'block' }} />
                    {donor.daysUntilEligible > 0
                      ? <>Next eligible in <strong>{donor.daysUntilEligible} days</strong></>
                      : 'Awaiting eligibility review'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent notifications */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Recent Notifications</div>
              <button onClick={() => navigate('/notifications')} style={{ fontSize: 13, color: 'var(--red-600)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                See all
              </button>
            </div>
            {notifications.length === 0 ? (
              <div className="card-body" style={{ padding: '28px 24px' }}>
                <EmptyState icon={<Bell size={24} />} text="No notifications yet." small />
              </div>
            ) : notifications.map((n) => (
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

          {/* Benefits card */}
          <div className="card" style={{ background: 'linear-gradient(135deg, var(--slate-900), #2D0A14)', border: 'none' }}>
            <div className="card-body">
              <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,.5)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.5px' }}>Donor Benefits</div>
              {[
                { icon: '❤️', text: 'Save up to 3 lives per donation' },
                { icon: '🩺', text: 'Free health check every donation' },
                { icon: '🏅', text: 'Earn badges & certificates' },
                { icon: '🔔', text: 'Priority emergency notifications' },
              ].map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <span style={{ fontSize: 18 }}>{b.icon}</span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,.75)' }}>{b.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, cls, value, label, badge, badgeCls, trend, onClick }) {
  return (
    <div className="stat-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="stat-card-top">
        <div className={`stat-card-icon ${cls}`}>{icon}</div>
        {badge && <span className={`stat-card-badge ${badgeCls}`}>{badge}</span>}
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