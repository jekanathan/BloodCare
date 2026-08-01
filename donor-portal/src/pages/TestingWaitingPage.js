import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, Droplet, LogOut, MapPin, Calendar } from 'lucide-react';

export default function TestingWaitingPage() {
  const { donor, logout } = useAuth();
  const booking = donor?.testingBooking;

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Inter',sans-serif" }}>
      <div style={{ background: 'linear-gradient(135deg,#7F0F1E,#C41E3A)', padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,.2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Droplet size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>BloodCare</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)' }}>Donor Onboarding</div>
          </div>
        </div>
        <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.3)', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <LogOut size={14} /> Logout
        </button>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ width: 88, height: 88, borderRadius: '50%', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <Clock size={40} color="#D97706" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
          Appointment Booked!
        </h2>
        <p style={{ fontSize: 13, color: '#64748B', marginBottom: 28, lineHeight: 1.6 }}>
          Your blood testing appointment is scheduled. Once the facility completes your screening (HIV, hemoglobin, etc.) and confirms you're eligible, your full donor dashboard will unlock.
        </p>

        {booking && (
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: 20, textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 13, color: '#0F172A', fontWeight: 700 }}>
              <MapPin size={14} color="#C41E3A" /> {booking.facilityName}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748B' }}>
              <Calendar size={14} /> {booking.appointmentDate ? new Date(booking.appointmentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
            </div>
          </div>
        )}

        <div style={{ marginTop: 24, fontSize: 12, color: '#94A3B8' }}>
          We'll notify you the moment there's an update.
        </div>
      </div>
    </div>
  );
}