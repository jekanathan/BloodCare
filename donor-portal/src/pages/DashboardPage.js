import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Droplet, Heart, Calendar, Award, Bell,
  CheckCircle, Clock, ChevronRight, AlertTriangle, Activity
} from 'lucide-react';

// Mock donor data
const MOCK_DONOR = {
  fullName: 'Kamal Perera',
  bloodGroup: 'O+',
  district: 'Colombo',
  isEligible: true,
  totalDonations: 7,
  lastDonationDate: '2025-01-12',
  nextEligibleDate: '2025-04-12',
  status: 'approved',
};

const MOCK_REQUESTS = [
  {
    _id: '1',
    hospital: { hospitalName: 'National Hospital Colombo' },
    bloodGroup: 'O+',
    unitsRequired: 2,
    priority: 'Emergency',
    urgencyLevel: 'High',
    createdAt: new Date().toISOString(),
    expiresIn: '2 hours',
  },
  {
    _id: '2',
    hospital: { hospitalName: 'Colombo South Teaching Hospital' },
    bloodGroup: 'O+',
    unitsRequired: 1,
    priority: 'Urgent',
    urgencyLevel: 'Medium',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    expiresIn: '5 hours',
  },
];

const MOCK_HISTORY = [
  { date: new Date('2025-01-12'), location: 'National Blood Bank', units: 450, status: 'completed' },
  { date: new Date('2024-09-10'), location: 'City Blood Bank, Colombo', units: 450, status: 'completed' },
  { date: new Date('2024-05-05'), location: 'National Blood Bank', units: 450, status: 'completed' },
];

export default function DashboardPage() {
  const { donor } = useAuth();
  const navigate = useNavigate();
  const d = MOCK_DONOR;
  const [acceptedRequests, setAcceptedRequests] = useState([]);

  const handleAccept = (id) => setAcceptedRequests(prev => [...prev, id]);

  const daysUntilEligible = () => {
    const next = new Date(d.nextEligibleDate);
    const diff = Math.ceil((next - Date.now()) / 86400000);
    return diff > 0 ? diff : 0;
  };

  const monthsSinceLastDonation = () => {
    const last = new Date(d.lastDonationDate);
    return Math.floor((Date.now() - last) / (30 * 86400000));
  };

  return (
    <div className="anim-up">
      {/* Hero banner */}
      <div className="dash-hero">
        <div className="dash-hero-left">
          <div className="dash-hero-greeting">
            {new Date().getHours() < 12 ? '🌅 Good morning' : new Date().getHours() < 18 ? '☀️ Good afternoon' : '🌙 Good evening'}
          </div>
          <div className="dash-hero-name">{donor?.fullName || d.fullName}</div>
          <div className="dash-hero-meta">
            <div className="hero-blood-badge">{d.bloodGroup}</div>
            <div className="hero-meta-pill">
              <Droplet size={13} color="#E85D75" />
              {d.totalDonations} Donations
            </div>
            <div className="hero-meta-pill">
              <Activity size={13} />
              {d.district}
            </div>
          </div>
        </div>

        <div className="dash-hero-right">
          <div className="hero-eligible-card">
            <div className="hero-eligible-icon">{d.isEligible ? '✅' : '⏳'}</div>
            <div className="hero-eligible-label">Donation Status</div>
            <div className={`hero-eligible-value ${d.isEligible ? 'eligible-yes' : 'eligible-no'}`}>
              {d.isEligible ? 'Eligible Now' : `${daysUntilEligible()} days left`}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="donor-stats">
        <div className="dstat-card anim-up" style={{ animationDelay: '.05s' }}>
          <div className="dstat-icon red"><Droplet size={20} /></div>
          <div className="dstat-value">{d.totalDonations}</div>
          <div className="dstat-label">Total Donations</div>
        </div>
        <div className="dstat-card anim-up" style={{ animationDelay: '.10s' }}>
          <div className="dstat-icon green"><Heart size={20} /></div>
          <div className="dstat-value">{d.totalDonations * 3}</div>
          <div className="dstat-label">Lives Impacted</div>
        </div>
        <div className="dstat-card anim-up" style={{ animationDelay: '.15s' }}>
          <div className="dstat-icon blue"><Clock size={20} /></div>
          <div className="dstat-value">{monthsSinceLastDonation()}</div>
          <div className="dstat-label">Months Since Last</div>
        </div>
        <div className="dstat-card anim-up" style={{ animationDelay: '.20s' }}>
          <div className="dstat-icon purple"><Award size={20} /></div>
          <div className="dstat-value">Gold</div>
          <div className="dstat-label">Donor Badge</div>
        </div>
      </div>

      <div className="section-grid">
        {/* Left column */}
        <div className="section-col">
          {/* Active blood requests */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                🚨 Emergency Blood Requests
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, background: 'var(--red-100)', color: 'var(--red-700)', padding: '3px 10px', borderRadius: 100 }}>
                {MOCK_REQUESTS.length} Active
              </span>
            </div>
            <div className="card-body" style={{ padding: '20px 24px' }}>
              {MOCK_REQUESTS.map(req => (
                <div key={req._id} className="request-card">
                  <div className="request-card-header">
                    <div className="request-card-title">
                      🏥 {req.hospital.hospitalName}
                    </div>
                    <span className={`request-priority ${req.priority.toLowerCase()}`}>
                      {req.priority}
                    </span>
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
                        <div className="request-detail-label">Urgency</div>
                        <div className="request-detail-value" style={{ color: req.priority === 'Emergency' ? 'var(--red-600)' : 'var(--amber-500)' }}>
                          {req.urgencyLevel}
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
            {MOCK_HISTORY.map((h, i) => (
              <div className="donation-item" key={i}>
                <div className="donation-date-block">
                  <div className="donation-date-day">{h.date.getDate()}</div>
                  <div className="donation-date-month">{h.date.toLocaleString('en', { month: 'short' })}</div>
                </div>
                <div className="donation-info">
                  <div className="donation-location">{h.location}</div>
                  <div className="donation-meta">{h.date.getFullYear()} &nbsp;·&nbsp; Whole Blood</div>
                </div>
                <div>
                  <div className="donation-units">{h.units}</div>
                  <div className="donation-units-label">ml</div>
                </div>
                <div className="donation-status-done">
                  <CheckCircle size={12} /> Done
                </div>
              </div>
            ))}
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
              <div className="appt-card">
                <div className="appt-date-block">
                  <div className="appt-day">15</div>
                  <div className="appt-month">Feb</div>
                </div>
                <div className="appt-info">
                  <div className="appt-title">Blood Donation Appointment</div>
                  <div className="appt-meta">National Blood Bank · 10:00 AM</div>
                </div>
                <button className="btn-appt-cancel">Cancel</button>
              </div>
            </div>
          </div>

          {/* Eligibility check */}
          <div className="card">
            <div className="card-header"><div className="card-title">Donation Eligibility</div></div>
            <div className="card-body">
              {d.isEligible ? (
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <div style={{ width: 64, height: 64, background: 'var(--green-100)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>
                    ✅
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 18, fontFamily: 'var(--font-display)', color: 'var(--green-600)', marginBottom: 6 }}>
                    You are Eligible!
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--slate-500)', marginBottom: 20, lineHeight: 1.5 }}>
                    It's been {monthsSinceLastDonation()} months since your last donation. You can donate blood now.
                  </div>
                  <button className="btn-main" onClick={() => navigate('/appointments')}>
                    Book Appointment
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 13, color: 'var(--slate-500)' }}>
                    <AlertTriangle size={28} color="var(--amber-500)" style={{ margin: '0 auto 12px', display: 'block' }} />
                    Next eligible in <strong>{daysUntilEligible()} days</strong>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick notifications */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Recent Notifications</div>
              <button onClick={() => navigate('/notifications')} style={{ fontSize: 13, color: 'var(--red-600)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                See all
              </button>
            </div>
            {[
              { icon: '🚨', type: 'emergency', title: 'Emergency Request', desc: 'National Hospital needs O+ blood urgently', time: '5 min ago', unread: true },
              { icon: '✅', type: 'system', title: 'Donation Confirmed', desc: 'Your Jan 12 donation has been confirmed', time: '2 days ago', unread: false },
              { icon: '📅', type: 'appointment', title: 'Appointment Reminder', desc: 'Your appointment is on Feb 15 at 10:00 AM', time: '3 days ago', unread: false },
            ].map((n, i) => (
              <div key={i} className={`notif-item ${n.unread ? 'unread' : ''}`} onClick={() => navigate('/notifications')}>
                <div className={`notif-icon-wrap ${n.type}`}>{n.icon}</div>
                <div className="notif-content">
                  <div className="notif-title">{n.title}</div>
                  <div className="notif-desc">{n.desc}</div>
                  <div className="notif-time">{n.time}</div>
                </div>
                {n.unread && <div className="notif-badge">NEW</div>}
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
