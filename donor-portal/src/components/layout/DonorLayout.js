import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, User, Clock, Bell, FileText,
  Calendar, LogOut, Droplet, Menu, X
} from 'lucide-react';

const TITLES = {
  '/':              'Dashboard',
  '/requests':      'Blood Requests',
  '/history':       'Donation History',
  '/appointments':  'Appointments',
  '/notifications': 'Notifications',
  '/profile':       'My Profile',
};

const NAV = [
  {
    section: 'Overview',
    items: [
      { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    section: 'Donation',
    items: [
      { path: '/requests',      icon: FileText, label: 'Blood Requests' },
      { path: '/history',       icon: Clock,    label: 'Donation History' },
      { path: '/appointments',  icon: Calendar, label: 'Appointments' },
    ],
  },
  {
    section: 'Account',
    items: [
      { path: '/notifications', icon: Bell, label: 'Notifications' },
      { path: '/profile',       icon: User, label: 'My Profile' },
    ],
  },
];

export default function DonorLayout() {
  const { donor, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  // Real unread count would come from the notifications API; kept at 0 here
  // since /api/notifications currently returns broadcast announcements, not
  // per-donor read/unread state.
  const unreadCount = 0;

  const pageTitle = Object.entries(TITLES).find(([k]) =>
    k === '/' ? location.pathname === '/' : location.pathname.startsWith(k)
  )?.[1] || 'BloodCare';

  return (
    <div className="app-layout">
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo" onClick={() => { navigate('/'); setMobileOpen(false); }}>
          <div className="sidebar-logo-icon"><Droplet size={18} color="#fff" /></div>
          <div>
            <div className="sidebar-logo-text">Blood<span>Care</span></div>
            <div className="sidebar-logo-sub">Donor Portal</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(({ section, items }) => (
            <div className="sidebar-section" key={section}>
              <div className="sidebar-section-title">{section}</div>
              {items.map(({ path, icon: Icon, label }) => (
                <button
                  key={path}
                  className={`sidebar-link ${isActive(path) ? 'active' : ''}`}
                  onClick={() => { navigate(path); setMobileOpen(false); }}
                >
                  <Icon size={15} />
                  <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
                  {path === '/notifications' && unreadCount > 0 && (
                    <span className="sidebar-link-badge">{unreadCount}</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={() => navigate('/profile')}>
            <div className="sidebar-avatar">{donor?.fullName?.charAt(0) || 'D'}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="sidebar-user-name">{donor?.fullName || 'Donor'}</div>
              <div className="sidebar-user-role">{donor?.bloodGroup ? `${donor.bloodGroup} Donor` : 'Donor'}</div>
            </div>
            <LogOut size={14} color="rgba(255,255,255,0.5)"
              style={{ cursor: 'pointer', flexShrink: 0 }}
              onClick={(e) => { e.stopPropagation(); logout(); }} />
          </div>
        </div>
      </aside>

      <div className="main-content">
        <header className="header">
          <div className="header-left">
            <button
              className="header-btn mobile-menu-btn"
              onClick={() => setMobileOpen(o => !o)}
            >
              {mobileOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
            <div>
              <div className="header-title">{pageTitle}</div>
              <div className="header-subtitle">BloodCare Donor Portal</div>
            </div>
          </div>

          <div className="header-right">
            <button className="header-btn" onClick={() => navigate('/notifications')}>
              <Bell size={16} />
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: -5, right: -5, background: 'var(--red-600)', color: '#fff', fontSize: 9, fontWeight: 700, width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unreadCount}</span>
              )}
            </button>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'var(--slate-50)', borderRadius: 'var(--r-sm)', border: '1px solid var(--slate-200)', cursor: 'pointer' }}
              onClick={() => navigate('/profile')}
            >
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#C41E3A,#7F0F1E)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, flexShrink: 0 }}>
                {donor?.fullName?.charAt(0) || 'D'}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--slate-900)' }}>{donor?.fullName || 'Donor'}</div>
                <div style={{ fontSize: 10, color: 'var(--slate-500)' }}>{donor?.bloodGroup ? `${donor.bloodGroup} Donor` : 'Donor'}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>

        <footer style={{
          textAlign: 'center', padding: '18px',
          borderTop: '1px solid var(--slate-200)',
          background: 'var(--white)',
          fontSize: 12, color: 'var(--slate-400)',
        }}>
          🩸 BloodCare — Connecting Donors, Hospitals &amp; Blood Banks &nbsp;|&nbsp; donor.bloodcare.lk
        </footer>
      </div>
    </div>
  );
}