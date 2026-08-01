import React, { useState, useEffect } from 'react';
import { CheckCircle, X, AlertTriangle, Inbox } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const priorityStyle = { Emergency: { bg: '#FEE2E2', color: '#991B1B' }, Urgent: { bg: '#FEF3C7', color: '#92400E' }, Normal: { bg: 'var(--slate-100)', color: 'var(--slate-600)' } };

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export default function RequestsPage() {
  const navigate = useNavigate();
  const [bloodGroup, setBloodGroup] = useState('');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [responding, setResponding] = useState({});

  const loadRequests = () => {
    setLoading(true);
    api.get('/donor/requests')
      .then(res => {
        setBloodGroup(res.data.bloodGroup);
        setRequests(res.data.requests || []);
        setError(null);
      })
      .catch(() => setError('Could not load blood requests. Please try again.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadRequests(); }, []);

  const respond = async (id, response) => {
    setResponding(p => ({ ...p, [id]: true }));
    try {
      await api.post(`/blood-requests/${id}/respond`, { response });
      setRequests(prev => prev.map(r => r._id === id ? { ...r, myResponse: response } : r));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save your response. Please try again.');
    } finally {
      setResponding(p => ({ ...p, [id]: false }));
    }
  };

  const acceptedCount = requests.filter(r => r.myResponse === 'accepted').length;
  const declinedCount = requests.filter(r => r.myResponse === 'declined').length;

  if (loading) {
    return (
      <div className="anim-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: 'var(--slate-500)' }}>
        <div className="spinner" style={{ marginBottom: 14 }} />
        Loading blood requests…
      </div>
    );
  }

  return (
    <div className="anim-up">
      <div className="page-title">Blood Requests</div>
      <div className="page-sub">Active requests matching your blood group ({bloodGroup || '—'})</div>

      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 'var(--r)', padding: '12px 20px', margin: '20px 0', display: 'flex', alignItems: 'center', gap: 10, color: '#B91C1C', fontWeight: 600, fontSize: 14 }}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Active Requests', value: requests.length, color: 'var(--red-600)' },
          { label: 'Accepted',        value: acceptedCount, color: 'var(--green-600)' },
          { label: 'Declined',        value: declinedCount, color: 'var(--slate-500)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="dstat-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color, marginBottom: 4 }}>{value}</div>
            <div style={{ fontSize: 13, color: 'var(--slate-500)' }}>{label}</div>
          </div>
        ))}
      </div>

      {requests.length === 0 ? (
        <div className="empty-state">
          <Inbox size={32} />
          <h3>No active requests right now</h3>
          <p>We'll notify you as soon as a hospital needs your blood group.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {requests.map(req => {
            const resp = req.myResponse;
            const ps   = priorityStyle[req.priority] || priorityStyle.Normal;
            const isBusy = !!responding[req._id];

            return (
              <div key={req._id} className="card" style={{ overflow: 'visible' }}>
                {/* Header */}
                <div style={{ background: `linear-gradient(90deg, ${req.priority === 'Emergency' ? 'var(--red-600), #E8374F' : req.priority === 'Urgent' ? '#D97706, #F59E0B' : 'var(--slate-500), var(--slate-400)'})`, padding: '14px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: 18 }}>{req.priority === 'Emergency' ? '🚨' : req.priority === 'Urgent' ? '⚠️' : '🩸'}</div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>{req.hospital.hospitalName}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)' }}>📍 {req.hospital.district || 'Unknown'}{req.distanceKm !== null && req.distanceKm !== undefined ? ` · ${req.distanceKm} km away` : ''}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: 'rgba(255,255,255,.2)', color: '#fff', textTransform: 'uppercase' }}>{req.priority}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,.7)' }}>Posted {timeAgo(req.createdAt)}</span>
                  </div>
                </div>

                <div style={{ padding: '20px 22px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
                    {[
                      { label: 'Blood Group', value: <span style={{ background: 'var(--red-100)', color: 'var(--red-700)', padding: '4px 12px', borderRadius: 8, fontWeight: 800, fontSize: 15, fontFamily: 'var(--font-display)' }}>{req.bloodGroup}</span> },
                      { label: 'Units Needed', value: `${req.unitsRequired} Unit${req.unitsRequired > 1 ? 's' : ''}` },
                      { label: 'Patient Age', value: req.patientAge ? `~${req.patientAge} yrs` : '—' },
                      { label: 'Condition', value: req.patientCondition || '—' },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--slate-400)', marginBottom: 6 }}>{label}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--slate-900)' }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Response */}
                  {resp === 'accepted' ? (
                    <div style={{ background: 'var(--green-50)', border: '1px solid var(--green-100)', borderRadius: 'var(--r)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <CheckCircle size={20} color="var(--green-600)" />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--green-700)' }}>Request Accepted!</div>
                        <div style={{ fontSize: 13, color: 'var(--green-600)' }}>Please book an appointment at the blood bank as soon as possible.</div>
                      </div>
                      <button className="btn-main" style={{ marginLeft: 'auto', width: 'auto', padding: '9px 18px', fontSize: 13 }} onClick={() => navigate('/appointments')}>
                        Book Appointment →
                      </button>
                    </div>
                  ) : resp === 'declined' ? (
                    <div style={{ background: 'var(--slate-50)', border: '1px solid var(--slate-200)', borderRadius: 'var(--r)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10, color: 'var(--slate-500)', fontSize: 14 }}>
                      <X size={16} /> You declined this request.
                    </div>
                  ) : (
                    <div className="request-actions">
                      <button className="btn-accept" disabled={isBusy} onClick={() => respond(req._id, 'accepted')}>
                        <CheckCircle size={16} /> {isBusy ? 'Saving…' : 'Accept & Donate'}
                      </button>
                      <button className="btn-decline" disabled={isBusy} onClick={() => respond(req._id, 'declined')}>Decline</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}