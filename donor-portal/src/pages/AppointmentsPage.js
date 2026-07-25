import React, { useState } from 'react';
import { Calendar, Clock, MapPin, CheckCircle, X, Plus } from 'lucide-react';

const BLOOD_BANKS = [
  { _id: '1', name: 'National Blood Bank', address: 'Borella, Colombo 8', hours: 'Mon-Sat: 8AM - 4PM', district: 'Colombo' },
  { _id: '2', name: 'City Blood Bank',     address: 'Maradana, Colombo 10', hours: 'Mon-Fri: 7AM - 5PM', district: 'Colombo' },
  { _id: '3', name: 'Kandy Regional Blood Bank', address: 'Kandy', hours: 'Mon-Sat: 8AM - 3PM', district: 'Kandy' },
];

const TIME_SLOTS = ['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM'];

const UPCOMING = [
  { _id: '1', bank: 'National Blood Bank', date: new Date('2025-02-15'), time: '10:00 AM', address: 'Borella, Colombo 8', status: 'confirmed' },
];

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState(UPCOMING);
  const [showBook, setShowBook] = useState(false);
  const [form, setForm] = useState({ bankId: '', date: '', time: '' });
  const [booked, setBooked] = useState(false);

  const handleBook = (e) => {
    e.preventDefault();
    const bank = BLOOD_BANKS.find(b => b._id === form.bankId);
    const newAppt = {
      _id: Date.now().toString(),
      bank: bank?.name,
      date: new Date(form.date),
      time: form.time,
      address: bank?.address,
      status: 'confirmed',
    };
    setAppointments(prev => [...prev, newAppt]);
    setShowBook(false);
    setBooked(true);
    setForm({ bankId: '', date: '', time: '' });
    setTimeout(() => setBooked(false), 4000);
  };

  const cancel = (id) => {
    if (!window.confirm('Cancel this appointment?')) return;
    setAppointments(prev => prev.filter(a => a._id !== id));
  };

  return (
    <div className="anim-up">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div className="page-title">Appointments</div>
          <div className="page-sub" style={{ marginBottom: 0 }}>Manage your blood donation appointments</div>
        </div>
        <button className="btn-main" style={{ width: 'auto', padding: '11px 22px', display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => setShowBook(true)}>
          <Plus size={16} /> Book Appointment
        </button>
      </div>

      {booked && (
        <div style={{ background: 'var(--green-50)', border: '1px solid var(--green-100)', borderRadius: 'var(--r)', padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--green-700)', fontWeight: 600, fontSize: 14 }}>
          <CheckCircle size={18} /> Appointment booked successfully! We'll remind you 24 hours before.
        </div>
      )}

      {/* Upcoming */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div className="card-title">Upcoming Appointments</div>
          <span style={{ fontSize: 12, color: 'var(--slate-500)' }}>{appointments.length} scheduled</span>
        </div>
        <div className="card-body">
          {appointments.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <Calendar size={36} style={{ margin: '0 auto 12px', display: 'block', opacity: .4 }} />
              <h3>No appointments</h3>
              <p>Book a donation appointment above</p>
            </div>
          ) : (
            appointments.map(a => (
              <div key={a._id} className="appt-card" style={{ marginBottom: 12 }}>
                <div className="appt-date-block">
                  <div className="appt-day">{a.date.getDate()}</div>
                  <div className="appt-month">{a.date.toLocaleString('en', { month: 'short' })}</div>
                </div>
                <div className="appt-info">
                  <div className="appt-title">{a.bank}</div>
                  <div className="appt-meta">
                    <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />{a.time}
                    &nbsp;·&nbsp;
                    <MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />{a.address}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <span className="status-badge status-approved">Confirmed</span>
                  </div>
                </div>
                <button className="btn-appt-cancel" onClick={() => cancel(a._id)}>Cancel</button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Blood banks list */}
      <div className="card">
        <div className="card-header"><div className="card-title">Available Blood Banks</div></div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {BLOOD_BANKS.map(b => (
              <div key={b._id} style={{ border: '1.5px solid var(--slate-200)', borderRadius: 'var(--r)', padding: '16px', transition: 'all .2s', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--red-300)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(196,30,58,.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--slate-200)'; e.currentTarget.style.boxShadow = 'none'; }}
                onClick={() => { setForm(f => ({ ...f, bankId: b._id })); setShowBook(true); }}
              >
                <div style={{ fontSize: 22, marginBottom: 10 }}>🏥</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--slate-900)', marginBottom: 4 }}>{b.name}</div>
                <div style={{ fontSize: 12, color: 'var(--slate-500)', marginBottom: 2 }}>📍 {b.address}</div>
                <div style={{ fontSize: 12, color: 'var(--slate-500)', marginBottom: 12 }}>🕒 {b.hours}</div>
                <button style={{ width: '100%', padding: '8px', background: 'var(--red-50)', border: '1px solid var(--red-100)', borderRadius: 'var(--r-sm)', fontSize: 13, fontWeight: 600, color: 'var(--red-600)', cursor: 'pointer' }}>
                  Book Here
                </button>
              </div>
            ))}
          </div>
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
                <div className="form-group">
                  <label className="form-label">Blood Bank</label>
                  <select className="form-input" value={form.bankId} onChange={e => setForm(f => ({ ...f, bankId: e.target.value }))} required>
                    <option value="">Select Blood Bank</option>
                    {BLOOD_BANKS.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
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
                <button type="submit" className="btn-main" style={{ flex: 2 }}>Confirm Booking</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
