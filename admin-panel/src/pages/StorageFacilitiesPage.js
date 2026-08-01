import React, { useState, useEffect } from 'react';
import { Warehouse, Plus, X, Trash2, Edit, Thermometer } from 'lucide-react';
import api from '../utils/api';

const emptyForm = { bloodBank:'', name:'', type:'Refrigerator', location:'', capacityUnits:'', currentUnits:'', temperatureC:'', status:'Active' };

export default function StorageFacilitiesPage() {
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
      api.get('/blood-bank-assets/storage').catch(() => ({ data: { items: [] } })),
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
    setForm({ bloodBank: item.bloodBank?._id || '', name: item.name, type: item.type, location: item.location || '', capacityUnits: item.capacityUnits, currentUnits: item.currentUnits, temperatureC: item.temperatureC || '', status: item.status });
    setError(''); setModal('form');
  };

  const save = async () => {
    if (!form.bloodBank || !form.name) { setError('Blood bank and name are required.'); return; }
    setSaving(true);
    try {
      if (selected) await api.put(`/blood-bank-assets/storage/${selected._id}`, form);
      else await api.post('/blood-bank-assets/storage', form);
      setModal(null); fetchAll();
    } catch (err) { setError(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this storage facility?')) return;
    await api.delete(`/blood-bank-assets/storage/${id}`);
    fetchAll();
  };

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Storage Facilities</h1>
          <p>Refrigerators, freezers and rack storage per blood bank</p>
        </div>
        <button className="btn-add" onClick={openAdd}><Plus size={15}/> Add Facility</button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr><th>Name</th><th>Blood Bank</th><th>Type</th><th>Location</th><th>Capacity</th><th>Temp</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan={8}><div className="empty-state"><p>Loading...</p></div></td></tr>}
              {!loading && items.map(i => (
                <tr key={i._id}>
                  <td className="td-name">{i.name}</td>
                  <td style={{fontSize:13}}>{i.bloodBank?.bankName || '—'}</td>
                  <td style={{fontSize:13}}>{i.type}</td>
                  <td style={{fontSize:13,color:'var(--slate-500)'}}>{i.location || '—'}</td>
                  <td style={{fontSize:13}}>{i.currentUnits}/{i.capacityUnits}</td>
                  <td style={{fontSize:13,display:'flex',alignItems:'center',gap:4}}><Thermometer size={12}/>{i.temperatureC ?? '—'}°C</td>
                  <td><span style={{fontSize:11,fontWeight:600,padding:'3px 8px',borderRadius:100,background:i.status==='Active'?'var(--green-100)':i.status==='Maintenance'?'var(--amber-100)':'var(--slate-100)',color:i.status==='Active'?'var(--green-600)':i.status==='Maintenance'?'#92400E':'var(--slate-500)'}}>{i.status}</span></td>
                  <td>
                    <div style={{display:'flex',gap:4}}>
                      <button className="icon-btn" onClick={()=>openEdit(i)}><Edit size={13}/></button>
                      <button className="icon-btn danger" onClick={()=>remove(i._id)}><Trash2 size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && items.length===0 && (
                <tr><td colSpan={8}><div className="empty-state"><Warehouse size={36} style={{margin:'0 auto 12px',opacity:.3}}/><h3>No storage facilities added yet</h3></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal==='form' && (
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal" style={{maxWidth:480}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">{selected?'Edit':'Add'} Storage Facility</div><button className="icon-btn" onClick={()=>setModal(null)}><X size={16}/></button></div>
            <div className="modal-body">
              {error && <div style={{background:'#FFF5F5',border:'1px solid #FEE2E2',borderRadius:8,padding:'10px 14px',marginBottom:14,fontSize:13,color:'var(--red-700)'}}>{error}</div>}
              <div style={{display:'grid',gap:14}}>
                <div>
                  <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Blood Bank *</label>
                  <select value={form.bloodBank} onChange={e=>setForm({...form,bloodBank:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13,background:'#fff'}}>
                    <option value="">Select</option>
                    {bloodBanks.map(b=><option key={b._id} value={b._id}>{b.bankName}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Facility Name *</label>
                  <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="FR-01" style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13}}/>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Type</label>
                    <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13,background:'#fff'}}>
                      {['Refrigerator','Freezer','Rack'].map(t=><option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Status</label>
                    <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13,background:'#fff'}}>
                      {['Active','Maintenance','Offline'].map(t=><option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Location</label>
                  <input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} placeholder="Rack-A, Shelf-02" style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13}}/>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14}}>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Capacity</label>
                    <input type="number" value={form.capacityUnits} onChange={e=>setForm({...form,capacityUnits:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13}}/>
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Current Units</label>
                    <input type="number" value={form.currentUnits} onChange={e=>setForm({...form,currentUnits:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13}}/>
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Temp (°C)</label>
                    <input type="number" value={form.temperatureC} onChange={e=>setForm({...form,temperatureC:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13}}/>
                  </div>
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