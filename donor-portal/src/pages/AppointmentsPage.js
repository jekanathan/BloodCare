import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, CheckCircle, X, Plus, AlertTriangle } from 'lucide-react';
import api from '../utils/api';

const TIME_SLOTS = ['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM'];

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [bloodBanks, setBloodBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showBook, setShowBook] = useState(false);
  const [form, setForm] = useState({ bankId: '', date: '', time: '' });
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState('');
  const [booked, setBooked] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.get('/appointments/my'),
      api.get('/appointments/blood-banks'),
    ])
      .then(([apptRes, bankRes]) => {
        setAppointments(apptRes.data?.appointments || []);
        setBloodBanks(bankRes.data?.bloodBanks || []);
        setError(null);
      })
      .catch(err => setError(err.response?.data?.message || 'Could not load appointments'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const upcoming = appointments.filter(a => a.status === 'confirmed');

  const handleBook = async (e) => {
    e.preventDefault();
    setBooking(true);
    setBookError('');
    try {
      await api.post('/appointments', { bloodBankId: form.bankId, date: form.date, time: form.time });
      setShowBook(false);
      setBooked(true);
      setForm({ bankId: '', date: '', time: '' });
      loadData();
      setTimeout(() => setBooked(false), 4000);
    } catch (err) {
      setBookError(err.response?.data?.message || 'Failed to book appointment');
    } finally {
      setBooking(false);
    }
  };

  const cancel = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return;
    try {
      await api.patch(`/appointments/${id}/cancel`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel appointment');
    }
  };

  if (loading) {
    return (
      <div className="anim-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: 'var(--slate-500)' }}>
        <div style={{
          width: 34, height: 34, border: '3px solid var(--slate-200)', borderTopColor: 'var(--red-600)',
          borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 14,
        }} />
        Loading appointments…
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div className="anim-up">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div className="page-title">Appointments</div>
          <div className="page-sub" style={{ marginBottom: 0 }}>Manage your blood donation appointments</div>
        </div>
        <button className="btn-main" style={{ width: 'auto', padding: '11px 22px', display: 'flex', alignItems: 'center', gap: 8 }}
          onClick={() => { setBookError(''); setShowBook(true); }} disabled={bloodBanks.length === 0}>
          <Plus size={16} /> Book Appointment
        </button>
      </div>

      {error && (
        <div style={{ background: 'var(--red-50)', border: '1px solid var(--red-100)', borderRadius: 'var(--r)', padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--red-700)', fontWeight: 600, fontSize: 14 }}>
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      {booked && (
        <div style={{ background: 'var(--green-50)', border: '1px solid var(--green-100)', borderRadius: 'var(--r)', padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--green-700)', fontWeight: 600, fontSize: 14 }}>
          <CheckCircle size={18} /> Appointment booked successfully! We'll remind you 24 hours before.
        </div>
      )}

      {/* Upcoming */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div className="card-title">Upcoming Appointments</div>
          <span style={{ fontSize: 12, color: 'var(--slate-500)' }}>{upcoming.length} scheduled</span>
        </div>
        <div className="card-body">
          {upcoming.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <Calendar size={36} style={{ margin: '0 auto 12px', display: 'block', opacity: .4 }} />
              <h3>No appointments</h3>
              <p>Book a donation appointment above</p>
            </div>
          ) : (
            upcoming.map(a => {
              const d = new Date(a.date);
              return (
                <div key={a._id} className="appt-card" style={{ marginBottom: 12 }}>
                  <div className="appt-date-block">
                    <div className="appt-day">{d.getDate()}</div>
                    <div className="appt-month">{d.toLocaleString('en', { month: 'short' })}</div>
                  </div>
                  <div className="appt-info">
                    <div className="appt-title">{a.bank}</div>
                    <div className="appt-meta">
                      <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />{a.time}
                      {a.address && (
                        <>
                          &nbsp;·&nbsp;
                          <MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />{a.address}
                        </>
                      )}
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <span className="status-badge status-approved">Confirmed</span>
                    </div>
                  </div>
                  <button className="btn-appt-cancel" onClick={() => cancel(a._id)}>Cancel</button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Blood banks list */}
      <div className="card">
        <div className="card-header"><div className="card-title">Available Blood Banks</div></div>
        <div className="card-body">
          {bloodBanks.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 20px' }}>
              <MapPin size={30} style={{ margin: '0 auto 12px', display: 'block', opacity: .4 }} />
              <h3>No approved blood banks yet</h3>
              <p>Check back once blood banks are onboarded in your area.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
              {bloodBanks.map(b => (
                <div key={b._id} style={{ border: '1.5px solid var(--slate-200)', borderRadius: 'var(--r)', padding: '16px', transition: 'all .2s', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--red-300)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(196,30,58,.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--slate-200)'; e.currentTarget.style.boxShadow = 'none'; }}
                  onClick={() => { setForm(f => ({ ...f, bankId: b._id })); setBookError(''); setShowBook(true); }}
                >
                  <div style={{ fontSize: 22, marginBottom: 10 }}>🏦</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--slate-900)', marginBottom: 4 }}>{b.name}</div>
                  {b.address && <div style={{ fontSize: 12, color: 'var(--slate-500)', marginBottom: 2 }}>📍 {b.address}</div>}
                  {b.district && <div style={{ fontSize: 12, color: 'var(--slate-500)', marginBottom: 12 }}>🗺️ {b.district}</div>}
                  <button style={{ width: '100%', padding: '8px', background: 'var(--red-50)', border: '1px solid var(--red-100)', borderRadius: 'var(--r-sm)', fontSize: 13, fontWeight: 600, color: 'var(--red-600)', cursor: 'pointer' }}>
                    Book Here
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Book modal */}
      {showBook && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowBook(false)}>
          <div style={{ background: '#fff', borderRadius: 'var(--r-lg)', width: '100%', maxWidth: 480, boxShadow: 'var(--shadow-xl)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '22px 24px', borderBottom: '1px solid var(--slate-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 800, fontSize: 16, fontFamily: 'var(--font-display)' }}>Book Appointment</div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-400)' }} onClick={() => setShowBook(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleBook}>
              <div style={{ padding: 24 }}>
                {bookError && (
                  <div style={{ background: 'var(--red-50)', border: '1px solid var(--red-100)', borderRadius: 'var(--r-sm)', padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--red-700)' }}>
                    {bookError}
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Blood Bank</label>
                  <select className="form-input" value={form.bankId} onChange={e => setForm(f => ({ ...f, bankId: e.target.value }))} required>
                    <option value="">Select Blood Bank</option>
                    {bloodBanks.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Preferred Date</label>
                  <input type="date" className="form-input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} min={new Date().toISOString().split('T')[0]} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Preferred Time</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {TIME_SLOTS.map(t => (
                      <button key={t} type="button" onClick={() => setForm(f => ({ ...f, time: t }))}
                        style={{ padding: '7px 14px', borderRadius: 'var(--r-sm)', border: '1.5px solid', borderColor: form.time === t ? 'var(--red-500)' : 'var(--slate-200)', background: form.time === t ? 'var(--red-50)' : '#fff', color: form.time === t ? 'var(--red-600)' : 'var(--slate-600)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .15s' }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ background: 'var(--amber-100)', borderRadius: 'var(--r-sm)', padding: '12px 16px', fontSize: 13, color: '#92400E', marginTop: 4 }}>
                  ℹ️ Please arrive 10 minutes early. Drink plenty of water before donation.
                </div>
              </div>
              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--slate-100)', display: 'flex', gap: 10 }}>
                <button type="button" style={{ flex: 1, padding: 12, background: 'var(--slate-100)', border: 'none', borderRadius: 'var(--r-sm)', fontWeight: 600, cursor: 'pointer' }} onClick={() => setShowBook(false)}>Cancel</button>
                <button type="submit" className="btn-main" style={{ flex: 2 }} disabled={booking || !form.bankId || !form.date || !form.time}>
                  {booking ? 'Booking…' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}