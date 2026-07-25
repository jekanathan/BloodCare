import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, Search, X, Monitor, MapPin, Clock } from 'lucide-react';
import api from '../utils/api';

const B = '/dashboard/security';

const TABS = [
  { path: `${B}/logs`,   label: 'Login Logs' },
  { path: `${B}/audit`,  label: 'Audit Logs' },
  { path: `${B}/backup`, label: 'Backup & Restore' },
  { path: `${B}/2fa`,    label: 'Two-Factor Auth' },
];

const timeAgo = (date) => {
  if (!date) return '';
  const diff = Math.floor((new Date() - new Date(date)) / 60000);
  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
};

function parseDevice(ua) {
  if (!ua || ua === '-') return 'Unknown device';
  if (/mobile/i.test(ua)) return 'Mobile browser';
  if (/chrome/i.test(ua)) return 'Chrome / Desktop';
  if (/firefox/i.test(ua)) return 'Firefox / Desktop';
  if (/safari/i.test(ua)) return 'Safari / Desktop';
  if (/edg/i.test(ua)) return 'Edge / Desktop';
  return 'Desktop browser';
}

function LoginLogsTab() {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState({ successCount: 0, failedCount: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = () => {
    setLoading(true);
    setApiError('');
    api.get('/security/login-logs', { params: { page, limit: 15, status: statusFilter, search } })
      .then(res => {
        setLogs(res.data?.logs || []);
        setSummary(res.data?.summary || { successCount: 0, failedCount: 0, total: 0 });
        setTotalPages(res.data?.totalPages || 1);
      })
      .catch(err => {
        console.error('Login logs fetch error:', err);
        setApiError('Could not load login logs from server.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLogs(); /* eslint-disable-next-line */ }, [page, statusFilter]);

  const runSearch = () => { setPage(1); fetchLogs(); };

  return (
    <div>
      {apiError && (
        <div style={{ background: 'rgba(234,179,8,.1)', border: '1px solid rgba(234,179,8,.3)', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: '#92400E' }}>
          ⚠️ {apiError}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Attempts', value: summary.total, color: 'var(--slate-700)', icon: '📊' },
          { label: 'Successful', value: summary.successCount, color: 'var(--green-600)', icon: '✅' },
          { label: 'Failed', value: summary.failedCount, color: 'var(--red-600)', icon: '⚠️' },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="card" style={{ padding: '16px 18px', borderTop: `3px solid ${color}` }}>
            <div style={{ fontSize: 11, color: 'var(--slate-400)', marginBottom: 4 }}>{icon} {label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color, fontFamily: 'var(--font-display)' }}>{value}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: '14px 20px' }}>
          <div className="filters-bar">
            <div className="search-input-wrap">
              <Search size={14} />
              <input className="search-input" placeholder="Search by name, email, or IP..."
                value={search} onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && runSearch()} />
            </div>
            <select className="filter-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
            {search && (
              <button onClick={() => { setSearch(''); setPage(1); }}
                style={{ padding: '8px 12px', border: '1px solid var(--slate-200)', borderRadius: 'var(--r-sm)', background: '#fff', cursor: 'pointer', fontSize: 13, color: 'var(--red-600)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <X size={13} /> Clear
              </button>
            )}
            <button onClick={runSearch} style={{ padding: '8px 16px', border: 'none', borderRadius: 'var(--r-sm)', background: 'var(--red-600)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              Search
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr>
              <th>Status</th>
              <th>User</th>
              <th>Role</th>
              <th>Device</th>
              <th>IP Address</th>
              <th>Time</th>
            </tr></thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6}><div className="empty-state"><p>Loading login logs...</p></div></td></tr>
              )}
              {!loading && logs.map(l => (
                <tr key={l._id}>
                  <td>
                    {l.status === 'success' ? (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 4, background: 'var(--green-100)', color: 'var(--green-600)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <ShieldCheck size={12} /> Success
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 4, background: 'var(--red-100)', color: 'var(--red-600)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <ShieldAlert size={12} /> Failed
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="td-name">{l.name || '-'}</div>
                    <div className="td-sub">{l.email}</div>
                    {l.status === 'failed' && <div style={{ fontSize: 11, color: 'var(--red-500)', marginTop: 2 }}>{l.reason}</div>}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--slate-600)', textTransform: 'capitalize' }}>{l.role || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--slate-600)' }}>
                      <Monitor size={12} /> {parseDevice(l.userAgent)}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--slate-600)' }}>
                      <MapPin size={12} /> {l.ip || '-'}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--slate-400)' }}>
                      <Clock size={12} /> {timeAgo(l.createdAt)}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && logs.length === 0 && (
                <tr><td colSpan={6}>
                  <div className="empty-state">
                    <ShieldCheck size={36} style={{ margin: '0 auto 12px', opacity: .3 }} />
                    <h3>No login logs found</h3>
                    <p>Login attempts will appear here once someone signs in.</p>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="pagination">
            <div className="pagination-btns">
              <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
              <span style={{ fontSize: 12, color: 'var(--slate-500)', padding: '0 10px' }}>Page {page} of {totalPages}</span>
              <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ComingSoon({ title, desc }) {
  return (
    <div className="card">
      <div className="empty-state" style={{ padding: '60px 20px' }}>
        <ShieldAlert size={40} style={{ margin: '0 auto 14px', opacity: .3 }} />
        <h3>{title}</h3>
        <p>{desc}</p>
      </div>
    </div>
  );
}

export default function SecurityPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = TABS.find(t => location.pathname === t.path)?.path || TABS[0].path;

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Security</h1>
          <p>Login activity, audit trail, backups and two-factor authentication</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--slate-100)', padding: 4, borderRadius: 'var(--r-sm)', width: 'fit-content' }}>
        {TABS.map(t => (
          <button key={t.path} onClick={() => navigate(t.path)} style={{
            padding: '7px 14px', borderRadius: 'var(--r-sm)', border: 'none', cursor: 'pointer',
            fontSize: 12.5, fontWeight: 600, fontFamily: 'var(--font-body)',
            background: activeTab === t.path ? '#fff' : 'transparent',
            color: activeTab === t.path ? 'var(--slate-900)' : 'var(--slate-500)',
            boxShadow: activeTab === t.path ? 'var(--sh-sm)' : 'none',
          }}>{t.label}</button>
        ))}
      </div>

      {activeTab === `${B}/logs` && <LoginLogsTab />}
      {activeTab === `${B}/audit` && <ComingSoon title="Audit Logs — Coming Soon" desc="Tracking of admin actions (approvals, edits, deletes) will appear here in the next update." />}
      {activeTab === `${B}/backup` && <ComingSoon title="Backup & Restore — Coming Soon" desc="Database backup and restore tools will be added here." />}
      {activeTab === `${B}/2fa` && <ComingSoon title="Two-Factor Auth — Coming Soon" desc="2FA setup for admin accounts will be added here." />}
    </div>
  );
}