import React, { useState, useEffect } from 'react';
import { Server, Database, Zap, ShieldCheck, Mail, MapPin, Bot, AlertTriangle, RefreshCw } from 'lucide-react';
import api from '../utils/api';

function StatusDot({ ok }) {
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: ok ? 'var(--green-500)' : 'var(--red-500)', marginRight: 6 }} />;
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--slate-100)', fontSize: 13 }}>
      <span style={{ color: 'var(--slate-500)' }}>{label}</span>
      <span style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{value}</span>
    </div>
  );
}

export default function SystemHealthPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHealth = () => {
    setLoading(true);
    setError('');
    api.get('/system-health/overview')
      .then(res => setData(res.data))
      .catch(err => {
        console.error('System health error:', err);
        setError(err.response?.data?.message || 'Could not load system health data.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div className="page-header-left">
          <h1>System Health</h1>
          <p>Real server, database and service status — Super Admin only</p>
        </div>
        <button className="btn-add" style={{ background: 'var(--slate-100)', color: 'var(--slate-700)' }} onClick={fetchHealth}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(234,179,8,.1)', border: '1px solid rgba(234,179,8,.3)', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: '#92400E' }}>
          ⚠️ {error}
        </div>
      )}

      {loading && !data ? (
        <div className="card"><div className="empty-state" style={{ padding: '40px 0' }}><p>Checking system health...</p></div></div>
      ) : data && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          <div className="card">
            <div className="card-header"><div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Server size={16} /> Server</div></div>
            <div className="card-body">
              <div style={{ marginBottom: 10 }}><StatusDot ok={data.server.status === 'online'} /><b>Online</b> — uptime {data.server.uptimeFormatted}</div>
              <Row label="Platform" value={data.server.platform} />
              <Row label="Node Version" value={data.server.nodeVersion} />
              <Row label="CPU Cores" value={data.server.cpuCores} />
              <Row label="CPU Load (1m avg)" value={data.server.cpuLoadAvg1m} />
              <Row label="Memory Used" value={`${data.server.usedMemPercent}% (${data.server.freeMemMB}MB free of ${data.server.totalMemMB}MB)`} />
              {data.server.note && <div style={{ fontSize: 11, color: 'var(--slate-400)', marginTop: 8 }}>ℹ️ {data.server.note}</div>}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Database size={16} /> Database</div></div>
            <div className="card-body">
              <div style={{ marginBottom: 10 }}><StatusDot ok={data.database.status === 'Connected'} /><b>{data.database.status}</b></div>
              {data.database.name && <Row label="Database Name" value={data.database.name} />}
              {data.database.host && <Row label="Host" value={data.database.host} />}
              {data.database.collections !== undefined && <Row label="Collections" value={data.database.collections} />}
              {data.database.dataSizeMB && <Row label="Data Size" value={`${data.database.dataSizeMB} MB`} />}
              {data.database.storageSizeMB && <Row label="Storage Size" value={`${data.database.storageSizeMB} MB`} />}
              {data.database.statsError && <div style={{ fontSize: 11, color: 'var(--slate-400)', marginTop: 8 }}>ℹ️ {data.database.statsError}</div>}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Zap size={16} /> API</div></div>
            <div className="card-body">
              <div style={{ marginBottom: 10 }}><StatusDot ok={data.api.status === 'online'} /><b>Online</b></div>
              <Row label="Response Time (this check)" value={`${data.api.responseTimeMs} ms`} />
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><ShieldCheck size={16} /> Authentication</div></div>
            <div className="card-body">
              <div style={{ marginBottom: 10 }}><StatusDot ok={data.auth.status === 'online'} /><b>Online</b></div>
              <Row label="Successful Logins (last 1h)" value={data.auth.recentLogins1h} />
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">External Services</div></div>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--slate-100)' }}>
                <Mail size={14} color="var(--slate-400)" /><StatusDot ok={data.externalServices.email.configured} /><span style={{ fontSize: 13 }}>Email — {data.externalServices.email.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--slate-100)' }}>
                <Zap size={14} color="var(--slate-400)" /><StatusDot ok={data.externalServices.sms.configured} /><span style={{ fontSize: 13 }}>SMS — {data.externalServices.sms.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--slate-100)' }}>
                <MapPin size={14} color="var(--slate-400)" /><StatusDot ok={data.externalServices.maps.configured} /><span style={{ fontSize: 13 }}>Maps — {data.externalServices.maps.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
                <Bot size={14} color="var(--slate-400)" /><StatusDot ok={data.externalServices.ai.configured} /><span style={{ fontSize: 13 }}>AI Service — {data.externalServices.ai.label}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><AlertTriangle size={16} color="#D97706" /> Alerts</div></div>
            <div className="card-body">
              {data.alerts.failedLogins24h > 0 ? (
                <div style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--red-600)' }}>
                  ⚠️ {data.alerts.failedLogins24h} failed login attempt(s) in the last 24 hours. See Security → Login Logs for details.
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--green-600)' }}>✅ No failed login attempts in the last 24 hours.</div>
              )}
            </div>
          </div>

        </div>
      )}

      <div style={{ fontSize: 11, color: 'var(--slate-400)', marginTop: 16, textAlign: 'center' }}>
        Auto-refreshes every 30 seconds · Last checked: {data ? new Date(data.checkedAt).toLocaleTimeString() : '—'}
      </div>
    </div>
  );
}