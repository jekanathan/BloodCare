import React, { useState, useEffect } from 'react';
import { Tag, Plus, X, Search, QrCode, Trash2, Ban } from 'lucide-react';
import api from '../utils/api';

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const COMPONENTS = ['Whole Blood','PRBC','Plasma','Platelets','Cryoprecipitate'];
const STATUS_COLOR = { Collected:'var(--slate-500)', 'Under Testing':'#D97706', Safe:'var(--green-600)', Unsafe:'var(--red-600)', Quarantined:'#7C3AED', Reserved:'var(--blue-600)', Issued:'#0891B2', Expired:'var(--red-700)', Disposed:'var(--slate-400)' };
const STATUS_BG = { Collected:'var(--slate-100)', 'Under Testing':'var(--amber-100)', Safe:'var(--green-100)', Unsafe:'var(--red-100)', Quarantined:'var(--purple-100)', Reserved:'var(--blue-100)', Issued:'#CFFAFE', Expired:'var(--red-100)', Disposed:'var(--slate-100)' };

const emptyForm = { bloodBank:'', donorName:'', bloodGroup:'', component:'Whole Blood', quantityMl:450, collectionDate:'', expiryDate:'', storageLocation:'' };

export default function BloodBagsPage() {
  const [bags, setBags] = useState([]);
  const [bloodBanks, setBloodBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [qr, setQr] = useState(null);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      api.get('/blood-bags').catch(() => ({ data: { bags: [] } })),
      api.get('/bloodbanks').catch(() => ({ data: { bloodBanks: [] } })),
    ]).then(([bagsRes, banksRes]) => {
      setBags(bagsRes.data?.bags || []);
      setBloodBanks((banksRes.data?.bloodBanks || []).filter(b => b.status === 'approved'));
    }).finally(() => setLoading(false));
  };
  useEffect(() => { fetchAll(); }, []);

  const filtered = bags.filter(b => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    if (search && !b.bagId?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {};
  ['Collected','Under Testing','Safe','Unsafe','Reserved','Issued','Disposed'].forEach(s => { counts[s] = bags.filter(b => b.status === s).length; });

  const openAdd = () => { setForm(emptyForm); setError(''); setModal('form'); };

  const save = async () => {
    if (!form.bloodBank || !form.bloodGroup || !form.collectionDate || !form.expiryDate) { setError('Blood bank, blood group, collection & expiry dates are required.'); return; }
    setSaving(true);
    try {
      await api.post('/blood-bags', form);
      setModal(null); fetchAll();
    } catch (err) { setError(err.response?.data?.message || 'Failed to register bag'); }
    finally { setSaving(false); }
  };

  const showQr = async (bag) => {
    try {
      const res = await api.get(`/blood-bags/${bag._id}/qr`);
      setQr(res.data);
    } catch { alert('Failed to generate QR code'); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this blood bag record?')) return;
    await api.delete(`/blood-bags/${id}`);
    fetchAll();
  };

  return (
    <div className="animate-fade">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 12, marginBottom: 24 }}>
        {Object.entries(counts).map(([label, value]) => (
          <div key={label} className="card" style={{ padding: '14px 16px', borderTop: `3px solid ${STATUS_COLOR[label]}` }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: STATUS_COLOR[label], fontFamily: 'var(--font-display)' }}>{value}</div>
            <div style={{ fontSize: 11, color: 'var(--slate-500)', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      <div className="page-header">
        <div className="page-header-left">
          <h1>Blood Bags</h1>
          <p>Individual bag tracking with unique IDs and QR codes</p>
        </div>
        <button className="btn-add" onClick={openAdd}><Plus size={15}/> Register Bag</button>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: '14px 20px' }}>
          <div className="filters-bar">
            <div className="search-input-wrap"><Search size={14}/><input className="search-input" placeholder="Search by Bag ID..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
            <select className="filter-select" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              {Object.keys(STATUS_COLOR).map(s=><option key={s}>{s}</option>)}
            </select>
            <span style={{marginLeft:'auto',fontSize:13,color:'var(--slate-500)'}}>{filtered.length} bags</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr><th>Bag ID</th><th>Blood Group</th><th>Component</th><th>Blood Bank</th><th>Collected</th><th>Expiry</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan={8}><div className="empty-state"><p>Loading...</p></div></td></tr>}
              {!loading && filtered.map(b => (
                <tr key={b._id}>
                  <td style={{fontSize:12,fontFamily:'monospace',fontWeight:700}}>{b.bagId}</td>
                  <td><span className="blood-badge">{b.bloodGroup}</span></td>
                  <td style={{fontSize:12}}>{b.component}</td>
                  <td style={{fontSize:13,color:'var(--slate-600)'}}>{b.bloodBank?.bankName || '—'}</td>
                  <td style={{fontSize:12}}>{new Date(b.collectionDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}</td>
                  <td style={{fontSize:12}}>{new Date(b.expiryDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</td>
                  <td><span style={{fontSize:11,fontWeight:600,padding:'3px 8px',borderRadius:100,background:STATUS_BG[b.status],color:STATUS_COLOR[b.status]}}>{b.status}</span></td>
                  <td>
                    <div style={{display:'flex',gap:4}}>
                      <button className="icon-btn" title="QR Code" onClick={()=>showQr(b)}><QrCode size={13}/></button>
                      {b.status !== 'Disposed' && (
                        <button className="icon-btn danger" title="Dispose" onClick={()=>{setSelected(b);setModal('dispose');}}><Ban size={13}/></button>
                      )}
                      <button className="icon-btn danger" title="Delete" onClick={()=>remove(b._id)}><Trash2 size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length===0 && (
                <tr><td colSpan={8}><div className="empty-state"><Tag size={36} style={{margin:'0 auto 12px',opacity:.3}}/><h3>No blood bags registered yet</h3></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal==='form' && (
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal" style={{maxWidth:520}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">Register Blood Bag</div><button className="icon-btn" onClick={()=>setModal(null)}><X size={16}/></button></div>
            <div className="modal-body">
              {error && <div style={{background:'#FFF5F5',border:'1px solid #FEE2E2',borderRadius:8,padding:'10px 14px',marginBottom:14,fontSize:13,color:'var(--red-700)'}}>{error}</div>}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div style={{gridColumn:'span 2'}}>
                  <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Blood Bank *</label>
                  <select value={form.bloodBank} onChange={e=>setForm({...form,bloodBank:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13,background:'#fff'}}>
                    <option value="">Select</option>
                    {bloodBanks.map(b=><option key={b._id} value={b._id}>{b.bankName}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Blood Group *</label>
                  <select value={form.bloodGroup} onChange={e=>setForm({...form,bloodGroup:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13,background:'#fff'}}>
                    <option value="">Select</option>
                    {BLOOD_GROUPS.map(g=><option key={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Component</label>
                  <select value={form.component} onChange={e=>setForm({...form,component:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13,background:'#fff'}}>
                    {COMPONENTS.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Quantity (ml)</label>
                  <select value={form.quantityMl} onChange={e=>setForm({...form,quantityMl:Number(e.target.value)})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13,background:'#fff'}}>
                    <option value={350}>350 ml</option>
                    <option value={450}>450 ml</option>
                  </select>
                </div>
                <div>
                  <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Donor Name (optional)</label>
                  <input value={form.donorName} onChange={e=>setForm({...form,donorName:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13}}/>
                </div>
                <div>
                  <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Collection Date *</label>
                  <input type="date" value={form.collectionDate} onChange={e=>setForm({...form,collectionDate:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13}}/>
                </div>
                <div>
                  <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Expiry Date *</label>
                  <input type="date" value={form.expiryDate} onChange={e=>setForm({...form,expiryDate:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13}}/>
                </div>
                <div style={{gridColumn:'span 2'}}>
                  <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Storage Location</label>
                  <input value={form.storageLocation} onChange={e=>setForm({...form,storageLocation:e.target.value})} placeholder="e.g. FR-01, Rack-A" style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13}}/>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="action-btn btn-view" onClick={()=>setModal(null)}>Cancel</button>
              <button className="action-btn btn-approve" disabled={saving} onClick={save}>{saving?'Registering...':'Register Bag'}</button>
            </div>
          </div>
        </div>
      )}

      {modal==='dispose' && selected && (
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal" style={{maxWidth:400}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">Dispose {selected.bagId}</div><button className="icon-btn" onClick={()=>setModal(null)}><X size={16}/></button></div>
            <div className="modal-body">
              <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:8}}>Disposal Reason</label>
              <select id="disposeReason" defaultValue="Expired" style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13,background:'#fff'}}>
                {['Expired','Contaminated','Failed Test','Damaged Bag'].map(r=><option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="modal-footer">
              <button className="action-btn btn-view" onClick={()=>setModal(null)}>Cancel</button>
              <button className="action-btn btn-reject" onClick={async ()=>{
                const reason = document.getElementById('disposeReason').value;
                await api.patch(`/blood-bags/${selected._id}/dispose`, { reason });
                setModal(null); fetchAll();
              }}><Ban size={14}/> Dispose</button>
            </div>
          </div>
        </div>
      )}

      {qr && (
        <div className="modal-overlay" onClick={()=>setQr(null)}>
          <div className="modal" style={{maxWidth:340,textAlign:'center'}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">{qr.bagId}</div><button className="icon-btn" onClick={()=>setQr(null)}><X size={16}/></button></div>
            <div className="modal-body">
              <img src={qr.qrDataUrl} alt="QR Code" style={{width:200,height:200,margin:'0 auto'}}/>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}