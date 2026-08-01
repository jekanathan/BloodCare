import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function FindBloodBanksPage() {
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/appointments/blood-banks')
      .then(res => setBanks(res.data?.bloodBanks || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = banks.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    (b.district || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="anim-up">
      <div className="page-title">Find Blood Banks</div>
      <div className="page-sub">Approved blood banks across Sri Lanka</div>

      <input
        className="form-input"
        placeholder="Search by name or district…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ maxWidth: 360, marginBottom: 22 }}
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--slate-500)' }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="card"><div className="card-body empty-state" style={{ padding: 50 }}>
          <MapPin size={32} style={{ opacity: .4, marginBottom: 10 }} />
          <h3>No blood banks found</h3>
          <p>Try a different search term.</p>
        </div></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {filtered.map(b => (
            <div key={b._id} className="card" style={{ margin: 0 }}>
              <div className="card-body">
                <div style={{ fontSize: 24, marginBottom: 10 }}>🏦</div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{b.name}</div>
                {b.address && (
                  <div style={{ fontSize: 12.5, color: 'var(--slate-500)', marginBottom: 4, display: 'flex', gap: 6 }}>
                    <MapPin size={13} style={{ flexShrink: 0, marginTop: 1 }} /> {b.address}
                  </div>
                )}
                {b.phone && (
                  <div style={{ fontSize: 12.5, color: 'var(--slate-500)', marginBottom: 14, display: 'flex', gap: 6 }}>
                    <Phone size={13} style={{ flexShrink: 0, marginTop: 1 }} /> {b.phone}
                  </div>
                )}
                <button className="btn-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onClick={() => navigate('/appointments')}>
                  <Calendar size={14} /> Book Appointment
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}