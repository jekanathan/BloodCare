import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, User, Clock, Bell, FileText,
  Calendar, LogOut, Droplet, Menu, X
} from 'lucide-react';

const navLinks = [
  { path: '/',              icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/requests',      icon: FileText,        label: 'Blood Requests' },
  { path: '/history',       icon: Clock,           label: 'Donation History' },
  { path: '/appointments',  icon: Calendar,        label: 'Appointments' },
  { path: '/notifications', icon: Bell,            label: 'Notifications' },
  { path: '/profile',       icon: User,            label: 'My Profile' },
];

export default function DonorLayout() {
  const { donor, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  // Unread count mock
  const unreadCount = 3;

  return (
    <div className="donor-layout">
      {/* Top Nav */}
      <nav className="donor-nav">
        <a className="donor-nav-logo" href="/">
          <div className="donor-nav-logo-icon">
            <Droplet size={18} color="#fff" />
          </div>
          <span className="donor-nav-logo-text">Blood<span>Care</span></span>
        </a>

        <div className="donor-nav-links">
          {navLinks.map(({ path, icon: Icon, label }) => (
            <button
              key={path}
              className={`donor-nav-link ${isActive(path) ? 'active' : ''}`}
              onClick={() => navigate(path)}
            >
              <Icon size={15} />
              {label}
              {path === '/notifications' && unreadCount > 0 && (
                <span style={{
                  background: 'var(--red-600)', color: '#fff',
                  fontSize: 10, fontWeight: 700,
                  padding: '1px 6px', borderRadius: 100, marginLeft: 2
                }}>{unreadCount}</span>
              )}
            </button>
          ))}
        </div>

        <div className="donor-nav-right">
          <button className="notif-btn" onClick={() => navigate('/notifications')}>
            <Bell size={16} />
            {unreadCount > 0 && <span className="notif-dot" />}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="nav-avatar" onClick={() => navigate('/profile')}>
              {donor?.fullName?.charAt(0) || 'D'}
            </div>
            <div style={{ display: 'none' }} className="nav-user-info">
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--slate-900)' }}>
                {donor?.fullName}
              </div>
            </div>
          </div>

          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-500)', padding: 6, borderRadius: 6, display: 'flex' }}
            onClick={logout}
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="donor-main">
        <Outlet />
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center', padding: '20px',
        borderTop: '1px solid var(--slate-200)',
        background: 'var(--white)',
        fontSize: 12, color: 'var(--slate-400)'
      }}>
        🩸 BloodCare — Connecting Donors, Hospitals &amp; Blood Banks &nbsp;|&nbsp; donor.bloodcare.lk
      </footer>
    </div>
  );
}
