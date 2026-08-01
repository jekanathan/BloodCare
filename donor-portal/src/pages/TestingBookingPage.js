import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Droplet, Building2, Hospital, MapPin, Calendar, Clock, CheckCircle, AlertCircle, LogOut } from 'lucide-react';

export default function TestingBookingPage() {
  const { donor, logout, refreshDonor } = useAuth();

  const [facilities, setFacilities] = useState({ hospitals: [], bloodbanks: [] });
  const [loadingFacilities, setLoadingFacilities] = useState(true);
  const [facilityType, setFacilityType] = useState('hospital'); // 'hospital' | 'bloodbank'
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoadingFacilities(true);
    Promise.all([
      api.get('/hospitals?status=approved').catch(() => ({ data: { hospitals: [] } })),
      api.get('/bloodbanks?status=approved').catch(() => ({ data: { bloodBanks: [] } })),
    ]).then(([hRes, bRes]) => {
      const hospitalsList  = hRes.data?.hospitals  || [];
      const bloodbanksList = bRes.data?.bloodBanks || [];
      setFacilities({
        hospitals:  hospitalsList.map(h => ({ _id: h._id, name: h.hospitalName, address: h.address || h.district })),
        bloodbanks: bloodbanksList.map(b => ({ _id: b._id, name: b.bankName, address: b.address || b.district })),
      });
    }).finally(() => setLoadingFacilities(false));
  }, []);

  const list = facilityType === 'hospital' ? facilities.hospitals : facilities.bloodbanks;

  const handleBook = async () => {
    if (!selectedFacility) { setError('Please select a hospital or blood bank'); return; }
    if (!appointmentDate) { setError('Please choose an appointment date'); return; }
    setError('');
    setSubmitting(true);
    try {
      await api.post('/donor/book-testing', {
        facilityType,
        facilityId: selectedFacility._id,
        facilityName: selectedFacility.name,
        appointmentDate,
        notes,
      });
      await refreshDonor();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Inter',sans-serif" }}>

      {/* Header */}
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

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>

        {/* Status banner */}
        <div style={{ background: '#fff', border: '2px solid #16A34A', borderRadius: 16, padding: '20px 24px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CheckCircle size={24} color="#16A34A" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
              Welcome, {donor?.fullName?.split(' ')[0] || 'Donor'}! Your registration is approved.
            </div>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
              One last step — book a blood testing appointment to activate your account.
            </div>
          </div>
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>
          📋 Book Your Blood Testing Appointment
        </h2>
        <p style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>
          Choose a hospital or blood bank near you for a quick blood test (HIV, hemoglobin, and other screenings) before you can start donating.
        </p>

        {error && (
          <div style={{ background: 'rgba(220,38,38,.08)', border: '1px solid rgba(220,38,38,.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#B91C1C' }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {/* Facility type tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#F1F5F9', padding: 4, borderRadius: 10, width: 'fit-content' }}>
          {[
            { key: 'hospital', label: 'Hospitals', icon: Hospital },
            { key: 'bloodbank', label: 'Blood Banks', icon: Building2 },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => { setFacilityType(key); setSelectedFacility(null); }} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600,
              background: facilityType === key ? '#fff' : 'transparent',
              color: facilityType === key ? '#0F172A' : '#64748B',
              boxShadow: facilityType === key ? '0 2px 6px rgba(0,0,0,.08)' : 'none',
            }}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* Facility list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {loadingFacilities && (
            <div style={{ textAlign: 'center', padding: 32, color: '#94A3B8', fontSize: 13 }}>Loading {facilityType === 'hospital' ? 'hospitals' : 'blood banks'}...</div>
          )}
          {!loadingFacilities && list.length === 0 && (
            <div style={{ textAlign: 'center', padding: 32, color: '#94A3B8', fontSize: 13 }}>
              No {facilityType === 'hospital' ? 'hospitals' : 'blood banks'} available right now.
            </div>
          )}
          {!loadingFacilities && list.map(f => (
            <div key={f._id} onClick={() => setSelectedFacility(f)} style={{
              padding: '14px 18px', borderRadius: 12, cursor: 'pointer',
              border: `2px solid ${selectedFacility?._id === f._id ? '#C41E3A' : '#E2E8F0'}`,
              background: selectedFacility?._id === f._id ? 'rgba(196,30,58,.04)' : '#fff',
              display: 'flex', alignItems: 'center', gap: 12, transition: 'all .15s',
            }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: facilityType === 'hospital' ? '#EFF6FF' : '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {facilityType === 'hospital'
                  ? <Hospital size={18} color="#2563EB" />
                  : <Building2 size={18} color="#D97706" />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{f.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  <MapPin size={11} /> {f.address || f.district || 'Location not specified'}
                </div>
              </div>
              {selectedFacility?._id === f._id && <CheckCircle size={20} color="#C41E3A" />}
            </div>
          ))}
        </div>

        {/* Appointment date + notes */}
        {selectedFacility && (
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: 20, marginBottom: 24 }}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Calendar size={13} /> Preferred Appointment Date
              </label>
              <input type="date" value={appointmentDate} min={new Date().toISOString().split('T')[0]}
                onChange={e => setAppointmentDate(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>
                Additional Notes (optional)
              </label>
              <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any health conditions, allergies, or preferences..."
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>
        )}

        <button onClick={handleBook} disabled={submitting || !selectedFacility} style={{
          width: '100%', padding: '14px', borderRadius: 10, border: 'none',
          background: (!selectedFacility || submitting) ? '#94A3B8' : 'linear-gradient(135deg,#C41E3A,#9B1427)',
          color: '#fff', fontSize: 14, fontWeight: 700,
          cursor: (!selectedFacility || submitting) ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <Clock size={16} /> {submitting ? 'Booking...' : 'Book Testing Appointment'}
        </button>
      </div>
    </div>
  );
}