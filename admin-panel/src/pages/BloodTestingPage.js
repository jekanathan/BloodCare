import React, { useState, useEffect } from 'react';
import { FlaskConical, X } from 'lucide-react';
import api from '../utils/api';

const TESTS = [
  { key: 'hiv', label: 'HIV' },
  { key: 'hepatitisB', label: 'Hepatitis B' },
  { key: 'hepatitisC', label: 'Hepatitis C' },
  { key: 'syphilis', label: 'Syphilis' },
  { key: 'malaria', label: 'Malaria' },
];

const STATUS_COLOR = { Collected:'var(--slate-500)', 'Under Testing':'#D97706', Safe:'var(--green-600)', Unsafe:'var(--red-600)' };
const STATUS_BG = { Collected:'var(--slate-100)', 'Under Testing':'var(--amber-100)', Safe:'var(--green-100)', Unsafe:'var(--red-100)' };

export default function BloodTestingPage() {
  const [bags, setBags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [modal, setModal] = useState(null);
  const [testForm, setTestForm] = useState({});
  const [testedBy, setTestedBy] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchAll = () => {
    setLoading(true);
    api.get('/blood-bags').then(res => setBags(res.data?.bags || [])).finally(() => setLoading(false));
  };
  useEffect(() => { fetchAll(); }, []);

  const filtered = bags.filter(b => {
    if (filter === 'pending') return ['Collected', 'Under Testing'].includes(b.status);
    if (filter === 'safe') return b.status === 'Safe';
    if (filter === 'unsafe') return b.status === 'Unsafe';
    return true;
  });

  const counts = {
    pending: bags.filter(b => ['Collected', 'Under Testing'].includes(b.status)).length,
    safe: bags.filter(b => b.status === 'Safe').length,
    unsafe: bags.filter(b => b.status === 'Unsafe').length,
  };

  const openTest = (bag) => {
    setModal(bag);
    setTestForm({ ...bag.testResults });
    setTestedBy('');
  };

  const submitTest = async () => {
    setSaving(true);
    try {
      await api.patch(`/blood-bags/${modal._id}/testing`, { ...testForm, testedBy });
      setModal(null); fetchAll();
    } catch (err) { alert(err.response?.data?.message || 'Failed to save test results'); }
    finally { setSaving(false); }
  };

  return (
    <div className="animate-fade">
      <div style={{ background: 'var(--blue-50)', border: '1px solid var(--blue-100)', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: 'var(--blue-700)' }}>
        ℹ️ If any test comes back <b>Positive</b>, the bag is automatically marked <b>Unsafe</b> and cannot be issued. All 5 tests must be <b>Negative</b> to mark it <b>Safe</b>.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: '16px 18px', borderTop: '3px solid #D97706' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#D97706', fontFamily: 'var(--font-display)' }}>{counts.pending}</div>
          <div style={{ fontSize: 12, color: 'var(--slate-500)', marginTop: 4 }}>Pending Testing</div>
        </div>
        <div className="card" style={{ padding: '16px 18px', borderTop: '3px solid var(--green-600)' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--green-600)', fontFamily: 'var(--font-display)' }}>{counts.safe}</div>
          <div style={{ fontSize: 12, color: 'var(--slate-500)', marginTop: 4 }}>Safe</div>
        </div>
        <div className="card" style={{ padding: '16px 18px', borderTop: '3px solid var(--red-600)' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--red-600)', fontFamily: 'var(--font-display)' }}>{counts.unsafe}</div>
          <div style={{ fontSize: 12, color: 'var(--slate-500)', marginTop: 4 }}>Unsafe</div>
        </div>
      </div>

      <div className="page-header">
        <div className="page-header-left">
          <h1>Blood Testing</h1>
          <p>Lab screening per blood bag — HIV, Hepatitis B/C, Syphilis, Malaria</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--slate-100)', padding: 4, borderRadius: 'var(--r-sm)', width: 'fit-content' }}>
        {[{ key: 'pending', label: `Pending (${counts.pending})` }, { key: 'safe', label: `Safe (${counts.safe})` }, { key: 'unsafe', label: `Unsafe (${counts.unsafe})` }].map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)} style={{
            padding: '7px 16px', borderRadius: 'var(--r-sm)', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: filter === t.key ? '#fff' : 'transparent', color: filter === t.key ? 'var(--slate-900)' : 'var(--slate-500)',
            boxShadow: filter === t.key ? 'var(--sh-sm)' : 'none',
          }}>{t.label}</button>
        ))}
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr><th>Bag ID</th><th>Blood Group</th><th>Collected</th><th>HIV</th><th>Hep B</th><th>Hep C</th><th>Syphilis</th><th>Malaria</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan={10}><div className="empty-state"><p>Loading...</p></div></td></tr>}
              {!loading && filtered.map(b => (
                <tr key={b._id}>
                  <td style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 700 }}>{b.bagId}</td>
                  <td><span className="blood-badge">{b.bloodGroup}</span></td>
                  <td style={{ fontSize: 12 }}>{new Date(b.collectionDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</td>
                  {TESTS.map(t => (
                    <td key={t.key}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: b.testResults[t.key] === 'Positive' ? 'var(--red-600)' : b.testResults[t.key] === 'Negative' ? 'var(--green-600)' : 'var(--slate-400)' }}>
                        {b.testResults[t.key] === 'Pending' ? '—' : b.testResults[t.key]}
                      </span>
                    </td>
                  ))}
                  <td><span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 100, background: STATUS_BG[b.status], color: STATUS_COLOR[b.status] }}>{b.status}</span></td>
                  <td><button className="action-btn btn-view" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => openTest(b)}><FlaskConical size={12} /> Enter Results</button></td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={10}><div className="empty-state"><FlaskConical size={36} style={{ margin: '0 auto 12px', opacity: .3 }} /><h3>No bags to show</h3></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">Lab Results — {modal.bagId}</div><button className="icon-btn" onClick={() => setModal(null)}><X size={16} /></button></div>
            <div className="modal-body">
              <div style={{ display: 'grid', gap: 12 }}>
                {TESTS.map(t => (
                  <div key={t.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--slate-50)', borderRadius: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{t.label}</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {['Pending', 'Negative', 'Positive'].map(v => (
                        <button key={v} onClick={() => setTestForm({ ...testForm, [t.key]: v })} style={{
                          padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                          background: testForm[t.key] === v ? (v === 'Positive' ? 'var(--red-600)' : v === 'Negative' ? 'var(--green-600)' : 'var(--slate-400)') : 'var(--slate-100)',
                          color: testForm[t.key] === v ? '#fff' : 'var(--slate-500)',
                        }}>{v}</button>
                      ))}
                    </div>
                  </div>
                ))}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Tested By (Lab Officer)</label>
                  <input value={testedBy} onChange={e => setTestedBy(e.target.value)} placeholder="Lab officer name" style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--slate-200)', borderRadius: 8, fontSize: 13 }} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="action-btn btn-view" onClick={() => setModal(null)}>Cancel</button>
              <button className="action-btn btn-approve" disabled={saving} onClick={submitTest}>{saving ? 'Saving...' : 'Save Results'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}