import React, { useState, useEffect } from 'react';
import { Cog, Plus, X, Trash2, Edit, Wrench } from 'lucide-react';
import api from '../utils/api';

const emptyForm = { bloodBank:'', name:'', type:'Refrigerator', serialNumber:'', purchaseDate:'', lastMaintenanceDate:'', nextMaintenanceDate:'', status:'Working', notes:'' };

export default function EquipmentPage() {
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
      api.get('/blood-bank-assets/equipment').catch(() => ({ data: { items: [] } })),
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
    setForm({
      bloodBank: item.bloodBank?._id || '', name: item.name, type: item.type, serialNumber: item.serialNumber || '',
      purchaseDate: item.purchaseDate ? item.purchaseDate.slice(0,10) : '',
      lastMaintenanceDate: item.lastMaintenanceDate ? item.lastMaintenanceDate.slice(0,10) : '',
      nextMaintenanceDate: item.nextMaintenanceDate ? item.nextMaintenanceDate.slice(0,10) : '',
      status: item.status, notes: item.notes || '',
    });
    setError(''); setModal('form');
  };

  const save = async () => {
    if (!form.bloodBank || !form.name) { setError('Blood bank and name are required.'); return; }
    setSaving(true);
    try {
      if (selected) await api.put(`/blood-bank-assets/equipment/${selected._id}`, form);
      else await api.post('/blood-bank-assets/equipment', form);
      setModal(null); fetchAll();
    } catch (err) { setError(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this equipment record?')) return;
    await api.delete(`/blood-bank-assets/equipment/${id}`);
    fetchAll();
  };

  const statusColor = { Working:'var(--green-600)', Maintenance:'#92400E', 'Out of Service':'var(--red-600)' };
  const statusBg = { Working:'var(--green-100)', Maintenance:'var(--amber-100)', 'Out of Service':'var(--red-100)' };

  const today = new Date();
  const isOverdue = (d) => d && new Date(d) < today;

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Equipment Management</h1>
          <p>Refrigerators, mixers, centrifuges and other machinery</p>
        </div>
        <button className="btn-add" onClick={openAdd}><Plus size={15}/> Add Equipment</button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr><th>Name</th><th>Blood Bank</th><th>Type</th><th>Serial No.</th><th>Next Maintenance</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan={7}><div className="empty-state"><p>Loading...</p></div></td></tr>}
              {!loading && items.map(i => (
                <tr key={i._id}>
                  <td className="td-name">{i.name}</td>
                  <td style={{fontSize:13}}>{i.bloodBank?.bankName || '—'}</td>
                  <td style={{fontSize:13}}>{i.type}</td>
                  <td style={{fontSize:12,fontFamily:'monospace'}}>{i.serialNumber || '—'}</td>
                  <td>
                    {i.nextMaintenanceDate ? (
                      <span style={{fontSize:12,display:'flex',alignItems:'center',gap:4,color:isOverdue(i.nextMaintenanceDate)?'var(--red-600)':'var(--slate-600)',fontWeight:isOverdue(i.nextMaintenanceDate)?700:400}}>
                        <Wrench size={11}/>{new Date(i.nextMaintenanceDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}
                        {isOverdue(i.nextMaintenanceDate) && ' (Overdue)'}
                      </span>
                    ) : <span style={{fontSize:12,color:'var(--slate-400)'}}>—</span>}
                  </td>
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
                <tr><td colSpan={7}><div className="empty-state"><Cog size={36} style={{margin:'0 auto 12px',opacity:.3}}/><h3>No equipment added yet</h3></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal==='form' && (
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal" style={{maxWidth:520}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">{selected?'Edit':'Add'} Equipment</div><button className="icon-btn" onClick={()=>setModal(null)}><X size={16}/></button></div>
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
                  <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Equipment Name *</label>
                  <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Blood Bank Fridge #2" style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13}}/>
                </div>
                <div>
                  <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Type</label>
                  <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13,background:'#fff'}}>
                    {['Refrigerator','Blood Mixer','Centrifuge','Incubator','Other'].map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Serial Number</label>
                  <input value={form.serialNumber} onChange={e=>setForm({...form,serialNumber:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13}}/>
                </div>
                <div>
                  <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Purchase Date</label>
                  <input type="date" value={form.purchaseDate} onChange={e=>setForm({...form,purchaseDate:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13}}/>
                </div>
                <div>
                  <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Status</label>
                  <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13,background:'#fff'}}>
                    {['Working','Maintenance','Out of Service'].map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Last Maintenance</label>
                  <input type="date" value={form.lastMaintenanceDate} onChange={e=>setForm({...form,lastMaintenanceDate:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13}}/>
                </div>
                <div>
                  <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Next Maintenance</label>
                  <input type="date" value={form.nextMaintenanceDate} onChange={e=>setForm({...form,nextMaintenanceDate:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13}}/>
                </div>
                <div style={{gridColumn:'span 2'}}>
                  <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Notes</label>
                  <textarea rows={2} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13,resize:'vertical'}}/>
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