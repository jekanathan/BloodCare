import React, { useState, useEffect } from 'react';
import { Tent, Plus, X, Trash2, Edit, Calendar, MapPin } from 'lucide-react';
import api from '../utils/api';

const emptyForm = { bloodBank:'', name:'', type:'Mobile Camp', address:'', district:'', scheduledDate:'', status:'Upcoming', targetUnits:'', collectedUnits:'', organizer:'', contactPhone:'' };
const DISTRICTS = ['Colombo','Gampaha','Kalutara','Kandy','Matale','Nuwara Eliya','Galle','Matara','Hambantota','Jaffna','Kilinochchi','Mannar','Vavuniya','Batticaloa','Ampara','Trincomalee','Kurunegala','Puttalam','Anuradhapura','Polonnaruwa','Badulla','Monaragala','Ratnapura','Kegalle','Mullaitivu'];

export default function CollectionCentersPage() {
  const [items, setItems] = useState([]);
  const [bloodBanks, setBloodBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      api.get('/blood-bank-assets/collection-centers').catch(() => ({ data: { items: [] } })),
      api.get('/bloodbanks').catch(() => ({ data: { bloodBanks: [] } })),
    ]).then(([itemsRes, banksRes]) => {
      setItems(itemsRes.data?.items || []);
      setBloodBanks((banksRes.data?.bloodBanks || []).filter(b => b.status === 'approved'));
    }).finally(() => setLoading(false));
  };
  useEffect(() => { fetchAll(); }, []);

  const openAdd = () => { setSelected(null); setForm(emptyForm); setError(''); setModal('form'); };
  const openEdit = (item) => {
    setSelected(item);
    setForm({ bloodBank: item.bloodBank?._id || '', name: item.name, type: item.type, address: item.address || '', district: item.district || '', scheduledDate: item.scheduledDate ? item.scheduledDate.slice(0,10) : '', status: item.status, targetUnits: item.targetUnits, collectedUnits: item.collectedUnits, organizer: item.organizer || '', contactPhone: item.contactPhone || '' });
    setError(''); setModal('form');
  };

  const save = async () => {
    if (!form.bloodBank || !form.name) { setError('Blood bank and name are required.'); return; }
    setSaving(true);
    try {
      if (selected) await api.put(`/blood-bank-assets/collection-centers/${selected._id}`, form);
      else await api.post('/blood-bank-assets/collection-centers', form);
      setModal(null); fetchAll();
    } catch (err) { setError(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this collection center/camp?')) return;
    await api.delete(`/blood-bank-assets/collection-centers/${id}`);
    fetchAll();
  };

  const statusColor = { Upcoming:'var(--blue-600)', Ongoing:'#D97706', Completed:'var(--green-600)', Cancelled:'var(--red-600)' };
  const statusBg = { Upcoming:'var(--blue-100)', Ongoing:'var(--amber-100)', Completed:'var(--green-100)', Cancelled:'var(--red-100)' };

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Blood Collection Centers</h1>
          <p>Mobile camps and permanent donation centers</p>
        </div>
        <button className="btn-add" onClick={openAdd}><Plus size={15}/> Add Center / Camp</button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr><th>Name</th><th>Blood Bank</th><th>Type</th><th>Location</th><th>Scheduled</th><th>Progress</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan={8}><div className="empty-state"><p>Loading...</p></div></td></tr>}
              {!loading && items.map(i => (
                <tr key={i._id}>
                  <td className="td-name">{i.name}</td>
                  <td style={{fontSize:13}}>{i.bloodBank?.bankName || '—'}</td>
                  <td style={{fontSize:13}}>{i.type}</td>
                  <td style={{fontSize:13,color:'var(--slate-500)',display:'flex',alignItems:'center',gap:4}}><MapPin size={11}/>{i.district || '—'}</td>
                  <td style={{fontSize:12,display:'flex',alignItems:'center',gap:4}}><Calendar size={11}/>{i.scheduledDate ? new Date(i.scheduledDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—'}</td>
                  <td style={{fontSize:13}}>{i.collectedUnits}/{i.targetUnits} units</td>
                  <td><span style={{fontSize:11,fontWeight:600,padding:'3px 8px',borderRadius:100,background:statusBg[i.status],color:statusColor[i.status]}}>{i.status}</span></td>
                  <td>
                    <div style={{display:'flex',gap:4}}>
                      <button className="icon-btn" onClick={()=>openEdit(i)}><Edit size={13}/></button>
                      <button className="icon-btn danger" onClick={()=>remove(i._id)}><Trash2 size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && items.length===0 && (
                <tr><td colSpan={8}><div className="empty-state"><Tent size={36} style={{margin:'0 auto 12px',opacity:.3}}/><h3>No collection centers or camps added yet</h3></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal==='form' && (
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal" style={{maxWidth:520}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">{selected?'Edit':'Add'} Collection Center / Camp</div><button className="icon-btn" onClick={()=>setModal(null)}><X size={16}/></button></div>
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
                <div style={{gridColumn:'span 2'}}>
                  <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Name *</label>
                  <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. University Blood Drive" style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13}}/>
                </div>
                <div>
                  <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Type</label>
                  <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13,background:'#fff'}}>
                    {['Mobile Camp','Permanent Center'].map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>District</label>
                  <select value={form.district} onChange={e=>setForm({...form,district:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13,background:'#fff'}}>
                    <option value="">Select</option>
                    {DISTRICTS.map(d=><option key={d}>{d}</option>)}
                  </select>
                </div>
                <div style={{gridColumn:'span 2'}}>
                  <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Address</label>
                  <input value={form.address} onChange={e=>setForm({...form,address:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13}}/>
                </div>
                <div>
                  <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Scheduled Date</label>
                  <input type="date" value={form.scheduledDate} onChange={e=>setForm({...form,scheduledDate:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13}}/>
                </div>
                <div>
                  <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Status</label>
                  <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13,background:'#fff'}}>
                    {['Upcoming','Ongoing','Completed','Cancelled'].map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Target Units</label>
                  <input type="number" value={form.targetUnits} onChange={e=>setForm({...form,targetUnits:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13}}/>
                </div>
                <div>
                  <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Collected Units</label>
                  <input type="number" value={form.collectedUnits} onChange={e=>setForm({...form,collectedUnits:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13}}/>
                </div>
                <div>
                  <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Organizer</label>
                  <input value={form.organizer} onChange={e=>setForm({...form,organizer:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13}}/>
                </div>
                <div>
                  <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Contact Phone</label>
                  <input value={form.contactPhone} onChange={e=>setForm({...form,contactPhone:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13}}/>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="action-btn btn-view" onClick={()=>setModal(null)}>Cancel</button>
              <button className="action-btn btn-approve" disabled={saving} onClick={save}>{saving?'Saving...':'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}