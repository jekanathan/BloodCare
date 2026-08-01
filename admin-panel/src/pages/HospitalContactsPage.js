import React, { useState, useEffect } from 'react';
import { UserRound, Search, Phone, Mail, MapPin } from 'lucide-react';
import api from '../utils/api';

export default function HospitalContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/hospital-assets/contacts')
      .then(res => setContacts(res.data?.contacts || []))
      .catch(() => setError('Could not load contact data.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = contacts.filter(c =>
    !search ||
    c.hospitalName?.toLowerCase().includes(search.toLowerCase()) ||
    c.contactPerson?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Hospital Contact Persons</h1>
          <p>Primary contacts submitted at registration for each approved hospital</p>
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
            <input className="search-input" placeholder="Search by hospital or contact name..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {loading && <div className="card"><div className="empty-state" style={{ padding: '30px' }}><p>Loading...</p></div></div>}
        {!loading && filtered.map(c => (
          <div key={c._id} className="card" style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: 11, color: 'var(--slate-400)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
              <MapPin size={11} /> {c.hospitalName} — {c.district}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--blue-100)', color: 'var(--blue-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                {c.contactPerson?.charAt(0) || '?'}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--slate-900)' }}>{c.contactPerson || '—'}</div>
                <div style={{ fontSize: 12, color: 'var(--slate-500)' }}>{c.designation || '—'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 12, color: 'var(--slate-600)', display: 'flex', alignItems: 'center', gap: 6 }}><Phone size={12} /> {c.phone || '—'}</div>
              <div style={{ fontSize: 12, color: 'var(--slate-600)', display: 'flex', alignItems: 'center', gap: 6 }}><Mail size={12} /> {c.email || '—'}</div>
            </div>
          </div>
        ))}
        {!loading && filtered.length === 0 && (
          <div className="card" style={{ gridColumn: 'span 3' }}>
            <div className="empty-state"><UserRound size={36} style={{ margin: '0 auto 12px', opacity: .3 }} /><h3>No contact persons found</h3></div>
          </div>
        )}
      </div>
    </div>
  );
}