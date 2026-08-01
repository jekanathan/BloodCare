import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, AlertTriangle } from 'lucide-react';
import api from '../utils/api';

const TABS = [
  { key: 'all',          label: 'All' },
  { key: 'requests',     label: 'Requests' },
  { key: 'campaigns',    label: 'Campaigns' },
  { key: 'appointments', label: 'Appointments' },
  { key: 'system',       label: 'System' },
];

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  const diffWk = Math.floor(diffDay / 7);
  if (diffWk < 5) return `${diffWk} week${diffWk > 1 ? 's' : ''} ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('all');

  const load = () => {
    setLoading(true);
    api.get('/donor/notifications-feed')
      .then(res => { setItems(res.data?.items || []); setError(null); })
      .catch(err => setError(err.response?.data?.message || 'Could not load notifications'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const displayed = tab === 'all' ? items : items.filter(n => n.category === tab);
  const unreadCount = items.filter(n => n.unread).length;

  const markOne = async (n) => {
    if (!n.unread || n.source !== 'notification') return;
    setItems(prev => prev.map(x => x._id === n._id ? { ...x, unread: false } : x));
    try {
      await api.patch(`/donor/notifications-feed/${n._id}/read`);
    } catch {
      // revert on failure
      setItems(prev => prev.map(x => x._id === n._id ? { ...x, unread: true } : x));
    }
  };

  const markAll = async () => {
    setItems(prev => prev.map(n => ({ ...n, unread: false })));
    try {
      await api.patch('/donor/notifications-feed/mark-all-read');
    } catch {
      load(); // reload real state on failure
    }
  };

  if (loading) {
    return (
      <div className="anim-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: 'var(--slate-500)' }}>
        <div style={{ width: 34, height: 34, border: '3px solid var(--slate-200)', borderTopColor: 'var(--red-600)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 14 }} />
        Loading notifications…
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="anim-up card" style={{ padding: 32, textAlign: 'center' }}>
        <AlertTriangle size={28} color="var(--amber-500)" style={{ marginBottom: 10 }} />
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Couldn't load notifications</div>
        <div style={{ fontSize: 13, color: 'var(--slate-500)' }}>{error}</div>
      </div>
    );
  }

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
        {TABS.map(({ key, label }) => {
          const cnt = key === 'all' ? items.filter(n => n.unread).length : items.filter(n => n.category === key && n.unread).length;
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
            <div key={n._id} className={`notif-item ${n.unread ? 'unread' : ''}`} onClick={() => markOne(n)}>
              <div className={`notif-icon-wrap ${n.type}`}>{n.icon}</div>
              <div className="notif-content">
                <div className="notif-title">{n.title}</div>
                <div className="notif-desc">{n.desc}</div>
                <div className="notif-time">{timeAgo(n.time)}</div>
              </div>
              {n.unread && <div className="notif-badge">NEW</div>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}