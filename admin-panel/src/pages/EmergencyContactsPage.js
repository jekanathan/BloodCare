import React, { useState, useEffect } from 'react';
import { Phone, Plus, X, Edit, Trash2 } from 'lucide-react';
import api from '../utils/api';

const CATEGORIES = ['Hospital', 'Blood Bank', 'Ambulance', 'Medical Officer', 'Police', 'Other'];
const CAT_ICON = { Hospital: '🏥', 'Blood Bank': '🏦', Ambulance: '🚑', 'Medical Officer': '👨‍⚕️', Police: '👮', Other: '📞' };
const CAT_COLOR = { Hospital: 'var(--blue-600)', 'Blood Bank': '#7C3AED', Ambulance: '#D97706', 'Medical Officer': 'var(--green-600)', Police: 'var(--slate-600)', Other: 'var(--red-600)' };

const emptyForm = { label:'', category:'Other', number:'', notes:'' };

export default function EmergencyContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchAll = () => {
    setLoading(true);
    api.get('/emergency-extras/contacts')
      .then(res => setContacts(res.data?.contacts || []))
      .finally(() => setLoading(false));
  };
  useEffect(() => { fetchAll(); }, []);

  const openAdd = () => { setSelected(null); setForm(emptyForm); setError(''); setModal('form'); };
  const openEdit = (c) => { setSelected(c); setForm({ label:c.label, category:c.category, number:c.number, notes:c.notes||'' }); setError(''); setModal('form'); };

  const save = async () => {
    if (!form.label || !form.number) { setError('Label and number are required.'); return; }
    setSaving(true);
    try {
      if (selected) await api.put(`/emergency-extras/contacts/${selected._id}`, form);
      else await api.post('/emergency-extras/contacts', form);
      setModal(null); fetchAll();
    } catch (err) { setError(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const remove = async (c) => {
    if (c.isDefault) { alert('Default contacts cannot be deleted — you can edit the number instead.'); return; }
    if (!window.confirm('Delete this contact?')) return;
    await api.delete(`/emergency-extras/contacts/${c._id}`);
    fetchAll();
  };

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Emergency Contacts</h1>
          <p>Quick-dial contacts for hospitals, blood banks, ambulance and more</p>
        </div>
        <button className="btn-add" onClick={openAdd}><Plus size={15}/> Add Contact</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {loading && <div className="card"><div className="empty-state" style={{ padding: '30px' }}><p>Loading...</p></div></div>}
        {!loading && contacts.map(c => (
          <div key={c._id} className="card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${CAT_COLOR[c.category]}1A`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{CAT_ICON[c.category]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--slate-900)' }}>{c.label}</div>
                <div style={{ fontSize: 11, color: 'var(--slate-400)' }}>{c.category}</div>
              </div>
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: CAT_COLOR[c.category], marginBottom: 10 }}>{c.number}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <a href={`tel:${c.number}`} style={{ flex: 1, textAlign: 'center', padding: '7px', background: CAT_COLOR[c.category], color: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <Phone size={12} /> Call
              </a>
              <button className="icon-btn" onClick={() => openEdit(c)}><Edit size={13} /></button>
              {!c.isDefault && <button className="icon-btn danger" onClick={() => remove(c)}><Trash2 size={13} /></button>}
            </div>
          </div>
        ))}
        {!loading && contacts.length === 0 && (
          <div className="card" style={{ gridColumn: 'span 3' }}><div className="empty-state"><Phone size={36} style={{ margin: '0 auto 12px', opacity: .3 }} /><h3>No contacts yet</h3></div></div>
        )}
      </div>

      {modal === 'form' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">{selected ? 'Edit' : 'Add'} Contact</div><button className="icon-btn" onClick={() => setModal(null)}><X size={16} /></button></div>
            <div className="modal-body">
              {error && <div style={{ background: '#FFF5F5', border: '1px solid #FEE2E2', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: 'var(--red-700)' }}>{error}</div>}
              <div style={{ display: 'grid', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Label *</label>
                  <input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="e.g. Kandy Blood Bank" style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--slate-200)', borderRadius: 8, fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--slate-200)', borderRadius: 8, fontSize: 13, background: '#fff' }}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Phone Number *</label>
                  <input value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--slate-200)', borderRadius: 8, fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Notes</label>
                  <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--slate-200)', borderRadius: 8, fontSize: 13, resize: 'vertical' }} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="action-btn btn-view" onClick={() => setModal(null)}>Cancel</button>
              <button className="action-btn btn-approve" disabled={saving} onClick={save}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}