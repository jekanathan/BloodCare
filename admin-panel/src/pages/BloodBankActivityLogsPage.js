import React, { useState, useEffect } from 'react';
import { Activity, Clock } from 'lucide-react';
import api from '../utils/api';

function timeAgo(date) {
  if (!date) return '';
  const diff = Math.floor((new Date() - new Date(date)) / 60000);
  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

export default function BloodBankActivityLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/blood-bank-assets/activity-logs?limit=100')
      .then(res => setLogs(res.data?.logs || []))
      .catch(() => setError('Could not load activity logs.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Blood Bank Activity Logs</h1>
          <p>Real stock movements (add, transfer, expire) across all blood banks</p>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(234,179,8,.1)', border: '1px solid rgba(234,179,8,.3)', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: '#92400E' }}>
          ⚠️ {error}
        </div>
      )}

      <div className="card">
        <div className="card-body" style={{ padding: '10px 0' }}>
          {loading && <div className="empty-state" style={{ padding: '30px 0' }}><p>Loading...</p></div>}
          {!loading && logs.length === 0 && (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <Activity size={36} style={{ margin: '0 auto 12px', opacity: .3 }} />
              <h3>No activity yet</h3>
              <p>Stock movements will appear here as they happen.</p>
            </div>
          )}
          {!loading && logs.map(log => (
            <div key={log.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 20px', borderBottom: '1px solid var(--slate-100)' }}>
              <div style={{ fontSize: 18, flexShrink: 0 }}>{log.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: 'var(--slate-800)', fontWeight: 500 }}>{log.text}</div>
                <div style={{ fontSize: 11, color: 'var(--slate-400)', marginTop: 2 }}>by {log.by}</div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--slate-400)', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <Clock size={11} /> {timeAgo(log.date)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}