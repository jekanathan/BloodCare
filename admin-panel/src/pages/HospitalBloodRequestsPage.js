import React, { useState, useEffect } from 'react';
import { FileText, Search, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../utils/api';

export default function HospitalBloodRequestsPage() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get('/hospital-assets/blood-requests')
      .then(res => setHospitals(res.data?.hospitals || []))
      .catch(() => setError('Could not load hospital blood request data.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = hospitals.filter(h => !search || h.hospitalName?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Hospital Blood Requests</h1>
          <p>Per-hospital breakdown of blood requests — see Blood Requests for the full cross-hospital view</p>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(234,179,8,.1)', border: '1px solid rgba(234,179,8,.3)', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: '#92400E' }}>
          ⚠️ {error}
        </div>
      )}

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: '14px 20px' }}>
          <div className="search-input-wrap">
            <Search size={14} />
            <input className="search-input" placeholder="Search hospital..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr><th>Hospital</th><th>District</th><th>Total</th><th>Pending</th><th>Approved</th><th>Completed</th><th>Emergency</th><th></th></tr></thead>
            <tbody>
              {loading && (<tr><td colSpan={8}><div className="empty-state"><p>Loading...</p></div></td></tr>)}
              {!loading && filtered.map(h => (
                <React.Fragment key={h.hospitalId}>
                  <tr style={{ cursor: 'pointer' }} onClick={() => setExpanded(expanded === h.hospitalId ? null : h.hospitalId)}>
                    <td className="td-name">{h.hospitalName}</td>
                    <td style={{ fontSize: 13, color: 'var(--slate-600)' }}>{h.district}</td>
                    <td style={{ fontWeight: 700 }}>{h.totalRequests}</td>
                    <td style={{ color: '#D97706', fontWeight: 600 }}>{h.pending}</td>
                    <td style={{ color: 'var(--green-600)', fontWeight: 600 }}>{h.approved}</td>
                    <td style={{ color: 'var(--blue-600)', fontWeight: 600 }}>{h.completed}</td>
                    <td style={{ color: 'var(--red-600)', fontWeight: 600 }}>{h.emergency}</td>
                    <td>{expanded === h.hospitalId ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</td>
                  </tr>
                  {expanded === h.hospitalId && (
                    <tr>
                      <td colSpan={8} style={{ background: 'var(--slate-50)', padding: '12px 20px' }}>
                        {h.recentRequests.length === 0 ? (
                          <div style={{ fontSize: 12, color: 'var(--slate-400)' }}>No requests yet from this hospital.</div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate-500)', marginBottom: 4 }}>RECENT REQUESTS</div>
                            {h.recentRequests.map(r => (
                              <div key={r._id} style={{ display: 'flex', gap: 12, fontSize: 12, alignItems: 'center' }}>
                                <span className="blood-badge" style={{ fontSize: 10, padding: '2px 8px' }}>{r.bloodGroup}</span>
                                <span>{r.units} units</span>
                                <span style={{ color: 'var(--slate-500)' }}>{r.priority}</span>
                                <span style={{ marginLeft: 'auto', color: 'var(--slate-400)' }}>{new Date(r.createdAt).toLocaleDateString('en-GB')}</span>
                                <span style={{ fontWeight: 600 }}>{r.status}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={8}><div className="empty-state"><FileText size={36} style={{ margin: '0 auto 12px', opacity: .3 }} /><h3>No hospitals found</h3></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}