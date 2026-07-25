import React, { useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';

const ALL_NOTIFICATIONS = [
  { _id: '1', type: 'emergency', icon: '🚨', title: 'Emergency Blood Request', desc: 'National Hospital Colombo needs O+ blood urgently. 2 units required for a critical patient.', time: '5 minutes ago', unread: true, category: 'requests' },
  { _id: '2', type: 'hospital',  icon: '🏥', title: 'Hospital Blood Request', desc: 'City Blood Bank requests O+ blood donors. Please respond if available.', time: '2 hours ago',   unread: true, category: 'requests' },
  { _id: '3', type: 'campaign',  icon: '📢', title: 'New Donation Campaign', desc: 'Monthly Blood Donation Camp at National Blood Bank — Feb 15 & 16. Register now!', time: '1 day ago', unread: true, category: 'campaigns' },
  { _id: '4', type: 'system',    icon: '✅', title: 'Donation Confirmed', desc: 'Your blood donation on Jan 12 has been successfully processed. Thank you for saving lives!', time: '2 days ago', unread: false, category: 'system' },
  { _id: '5', type: 'appointment',icon: '📅', title: 'Appointment Reminder', desc: 'Reminder: You have a blood donation appointment on Feb 15 at 10:00 AM at National Blood Bank.', time: '3 days ago', unread: false, category: 'appointments' },
  { _id: '6', type: 'system',    icon: '🏅', title: 'New Badge Earned!', desc: 'Congratulations! You have earned the "Star Donor" badge for completing 5 donations.', time: '5 days ago', unread: false, category: 'system' },
  { _id: '7', type: 'emergency', icon: '🚨', title: 'Critical: AB- Blood Needed', desc: 'Kandy Teaching Hospital urgently needs AB- blood. Only 3 units available island-wide.', time: '1 week ago', unread: false, category: 'requests' },
  { _id: '8', type: 'system',    icon: '✅', title: 'Profile Approved', desc: 'Your donor profile has been approved by the admin. You are now an active BloodCare donor!', time: '2 weeks ago', unread: false, category: 'system' },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(ALL_NOTIFICATIONS);
  const [tab, setTab] = useState('all');

  const tabs = [
    { key: 'all',          label: 'All' },
    { key: 'requests',     label: 'Requests' },
    { key: 'campaigns',    label: 'Campaigns' },
    { key: 'appointments', label: 'Appointments' },
    { key: 'system',       label: 'System' },
  ];

  const displayed = tab === 'all' ? notifications : notifications.filter(n => n.category === tab);
  const unreadCount = notifications.filter(n => n.unread).length;

  const markAll = () => setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  const markOne = (id) => setNotifications(prev => prev.map(n => n._id === id ? { ...n, unread: false } : n));

  return (
    <div className="anim-up">
      <div className="notif-page-header">
        <div>
          <div className="page-title" style={{ marginBottom: 4 }}>Notifications</div>
          <div style={{ fontSize: 14, color: 'var(--slate-500)' }}>
            {unreadCount > 0 ? <><strong style={{ color: 'var(--red-600)' }}>{unreadCount} unread</strong> notifications</> : 'All caught up!'}
          </div>
        </div>
        {unreadCount > 0 && (
          <button className="mark-all-btn" onClick={markAll}>
            <CheckCheck size={14} style={{ display: 'inline', marginRight: 5 }} />
            Mark all as read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="notif-tabs" style={{ marginBottom: 20 }}>
        {tabs.map(({ key, label }) => {
          const cnt = key === 'all' ? notifications.filter(n => n.unread).length : notifications.filter(n => n.category === key && n.unread).length;
          return (
            <button key={key} className={`notif-tab ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>
              {label}
              {cnt > 0 && (
                <span style={{ marginLeft: 5, background: 'var(--red-600)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 100 }}>{cnt}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="card">
        {displayed.length === 0 ? (
          <div className="empty-state">
            <Bell size={40} />
            <h3>No notifications</h3>
            <p>You're all caught up in this category</p>
          </div>
        ) : (
          displayed.map(n => (
            <div key={n._id} className={`notif-item ${n.unread ? 'unread' : ''}`} onClick={() => markOne(n._id)}>
              <div className={`notif-icon-wrap ${n.type}`}>{n.icon}</div>
              <div className="notif-content">
                <div className="notif-title">{n.title}</div>
                <div className="notif-desc">{n.desc}</div>
                <div className="notif-time">{n.time}</div>
              </div>
              {n.unread && <div className="notif-badge">NEW</div>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
