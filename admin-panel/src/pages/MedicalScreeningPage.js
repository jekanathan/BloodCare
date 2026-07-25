import React, { useState, useEffect } from 'react';
import { HeartPulse, Search, Clock, CheckCircle, XCircle, Calendar, MapPin } from 'lucide-react';
import api from '../utils/api';

const STATUS_CONFIG = {
  pending:          { label: 'Not Started',        color: 'var(--slate-500)', bg: 'var(--slate-100)' },
  testing_pending:  { label: 'Awaiting Booking',    color: '#D97706',          bg: 'var(--amber-100)' },
  testing_booked:   { label: 'Appointment Booked',  color: 'var(--blue-600)',  bg: 'var(--blue-100)' },
  active:           { label: 'Passed — Active',     color: 'var(--green-600)',bg: 'var(--green-100)' },
  testing_rejected: { label: 'Deferred / Failed',   color: 'var(--red-600)',  bg: 'var(--red-100)' },
};

export default function MedicalScreeningPage() {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchDonors = () => {
    setLoading(true);
    setApiError('');
    api.get('/donors')
      .then(res => setDonors(res.data?.donors || []))
      .catch(err => {
        console.error('Fetch donors error:', err);
        setApiError('Could not load donor screening data.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDonors(); }, []);

  // Only show donors that are at least at the "approved & needs testing" stage —
  // donors still pending admin approval haven't reached screening yet.
  const screenable = donors.filter(d => d.status === 'approved');

  const filtered = screenable.filter(d => {
    if (statusFilter !== 'all' && d.testingStatus !== statusFilter) return false;
    if (search && !d.name?.toLowerCase().includes(search.toLowerCase()) && !d.nic?.includes(search)) return false;
    return true;
  });

  const counts = {
    total: screenable.length,
    awaiting: screenable.filter(d => d.testingStatus === 'testing_pending').length,
    booked: screenable.filter(d => d.testingStatus === 'testing_booked').length,
    passed: screenable.filter(d => d.testingStatus === 'active').length,
    deferred: screenable.filter(d => d.testingStatus === 'testing_rejected').length,
  };

  return (
    <div className="animate-fade">
      <div style={{ background: 'var(--blue-50)', border: '1px solid var(--blue-100)', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: 'var(--blue-700)' }}>
        ℹ️ Showing real testing/screening status and results (decision, reason, appointment). Vitals like blood pressure or hemoglobin are not currently captured by the registration form.
      </div>

      {apiError && (
        <div style={{ background: 'rgba(234,179,8,.1)', border: '1px solid rgba(234,179,8,.3)', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: '#92400E' }}>
          ⚠️ {apiError}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Approved Donors', value: counts.total, color: 'var(--slate-700)' },
          { label: 'Awaiting Booking', value: counts.awaiting, color: '#D97706' },
          { label: 'Appointment Booked', value: counts.booked, color: 'var(--blue-600)' },
          { label: 'Passed / Active', value: counts.passed, color: 'var(--green-600)' },
          { label: 'Deferred / Failed', value: counts.deferred, color: 'var(--red-600)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card" style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color, fontFamily: 'var(--font-display)' }}>{value}</div>
            <div style={{ fontSize: 12, color: 'var(--slate-500)', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      <div className="page-header">
        <div className="page-header-left">
          <h1>Medical Screening</h1>
          <p>Blood testing status and results for approved donors</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: '14px 20px' }}>
          <div className="filters-bar">
            <div className="search-input-wrap">
              <Search size={14} />
              <input className="search-input" placeholder="Search by name or NIC..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="testing_pending">Awaiting Booking</option>
              <option value="testing_booked">Appointment Booked</option>
              <option value="active">Passed / Active</option>
              <option value="testing_rejected">Deferred / Failed</option>
            </select>
            <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--slate-500)' }}>{filtered.length} donors</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr>
              <th>Donor</th><th>Blood Group</th><th>Status</th><th>Appointment</th><th>Result</th>
            </tr></thead>
            <tbody>
              {loading && (<tr><td colSpan={5}><div className="empty-state"><p>Loading...</p></div></td></tr>)}
              {!loading && filtered.map(d => {
                const sc = STATUS_CONFIG[d.testingStatus] || STATUS_CONFIG.pending;
                return (
                  <tr key={d._id}>
                    <td>
                      <div className="td-name">{d.name}</div>
                      <div className="td-sub">{d.nic}</div>
                    </td>
                    <td><span className="blood-badge">{d.bloodGroup}</span></td>
                    <td>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 100, background: sc.bg, color: sc.color, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {d.testingStatus === 'active' ? <CheckCircle size={11} /> : d.testingStatus === 'testing_rejected' ? <XCircle size={11} /> : <Clock size={11} />}
                        {sc.label}
                      </span>
                    </td>
                    <td>
                      {d.testingBooking?.appointmentDate ? (
                        <div>
                          <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={11} />{new Date(d.testingBooking.appointmentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                          <div style={{ fontSize: 11, color: 'var(--slate-400)', display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={10} />{d.testingBooking.facilityName || d.testingBooking.facilityType}</div>
                        </div>
                      ) : <span style={{ fontSize: 12, color: 'var(--slate-400)' }}>—</span>}
                    </td>
                    <td>
                      {d.testingResult?.decision ? (
                        <div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: d.testingResult.decision === 'accepted' ? 'var(--green-600)' : 'var(--red-600)' }}>
                            {d.testingResult.decision === 'accepted' ? '✓ Accepted' : '✗ Rejected'}
                          </span>
                          {d.testingResult.reason && <div style={{ fontSize: 11, color: 'var(--slate-400)' }}>{d.testingResult.reason}</div>}
                        </div>
                      ) : <span style={{ fontSize: 12, color: 'var(--slate-400)' }}>Pending</span>}
                    </td>
                  </tr>
                );
              })}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={5}>
                  <div className="empty-state">
                    <HeartPulse size={36} style={{ margin: '0 auto 12px', opacity: .3 }} />
                    <h3>No screening records found</h3>
                    <p>Approved donors will appear here once they book a testing appointment.</p>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}