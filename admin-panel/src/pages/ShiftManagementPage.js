import React, { useState, useEffect } from 'react';
import { Clock3, Plus, X, Trash2 } from 'lucide-react';
import api from '../utils/api';

const todayStr = () => new Date().toISOString().slice(0,10);
const emptyForm = { staff:'', date: todayStr(), shiftType:'Morning', startTime:'', endTime:'', notes:'' };

export default function ShiftManagementPage() {
  const [shifts, setShifts] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [date, setDate] = useState(todayStr());
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      api.get(`/staff-hr/shifts?date=${date}`).catch(() => ({ data: { shifts: [] } })),
      api.get('/staff').catch(() => ({ data: { staff: [] } })),
    ]).then(([shiftRes, staffRes]) => {
      setShifts(shiftRes.data?.shifts || []);
      setStaffList((staffRes.data?.staff || []).filter(s => s.status === 'active'));
    }).finally(() => setLoading(false));
  };
  useEffect(() => { fetchAll(); }, [date]);

  const openAdd = () => { setForm({ ...emptyForm, date }); setError(''); setModal(true); };

  const save = async () => {
    if (!form.staff) { setError('Select a staff member.'); return; }
    setSaving(true);
    try {
      await api.post('/staff-hr/shifts', form);
      setModal(false); fetchAll();
    } catch (err) { setError(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!window.confirm('Remove this shift assignment?')) return;
    await api.delete(`/staff-hr/shifts/${id}`);
    fetchAll();
  };

  const shiftColor = { Morning:'var(--blue-600)', Evening:'#D97706', Night:'#7C3AED' };
  const shiftBg = { Morning:'var(--blue-100)', Evening:'var(--amber-100)', Night:'var(--purple-100)' };

  const grouped = { Morning: [], Evening: [], Night: [] };
  shifts.forEach(s => { if (grouped[s.shiftType]) grouped[s.shiftType].push(s); });

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Shift Management</h1>
          <p>Assign staff to Morning / Evening / Night shifts</p>
        </div>
        <button className="btn-add" onClick={openAdd}><Plus size={15}/> Assign Shift</button>
      </div>

      <div className="card" style={{marginBottom:20}}>
        <div className="card-body" style={{padding:'14px 20px'}}>
          <label style={{fontSize:12,fontWeight:600,marginRight:10}}>Date:</label>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{padding:'8px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13}}/>
        </div>
      </div>

      {loading ? (
        <div className="card"><div className="empty-state" style={{padding:'30px'}}><p>Loading...</p></div></div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
          {['Morning','Evening','Night'].map(type => (
            <div key={type} className="card">
              <div className="card-header">
                <div className="card-title" style={{color:shiftColor[type]}}>{type} Shift</div>
                <span style={{fontSize:11,fontWeight:600,padding:'3px 8px',borderRadius:100,background:shiftBg[type],color:shiftColor[type]}}>{grouped[type].length} staff</span>
              </div>
              <div className="card-body" style={{display:'flex',flexDirection:'column',gap:8}}>
                {grouped[type].length===0 && <div style={{fontSize:12,color:'var(--slate-400)'}}>No staff assigned</div>}
                {grouped[type].map(s => (
                  <div key={s._id} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',background:'var(--slate-50)',borderRadius:8}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:600}}>{s.staff?.name}</div>
                      <div style={{fontSize:11,color:'var(--slate-400)'}}>{s.staff?.department} {s.startTime && `· ${s.startTime}-${s.endTime}`}</div>
                    </div>
                    <button className="icon-btn danger" onClick={()=>remove(s._id)}><Trash2 size={12}/></button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={()=>setModal(false)}>
          <div className="modal" style={{maxWidth:440}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">Assign Shift</div><button className="icon-btn" onClick={()=>setModal(false)}><X size={16}/></button></div>
            <div className="modal-body">
              {error && <div style={{background:'#FFF5F5',border:'1px solid #FEE2E2',borderRadius:8,padding:'10px 14px',marginBottom:14,fontSize:13,color:'var(--red-700)'}}>{error}</div>}
              <div style={{display:'grid',gap:14}}>
                <div>
                  <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Staff *</label>
                  <select value={form.staff} onChange={e=>setForm({...form,staff:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13,background:'#fff'}}>
                    <option value="">Select</option>
                    {staffList.map(s=><option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Date</label>
                  <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13}}/>
                </div>
                <div>
                  <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Shift</label>
                  <select value={form.shiftType} onChange={e=>setForm({...form,shiftType:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13,background:'#fff'}}>
                    {['Morning','Evening','Night'].map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Start Time</label>
                    <input type="time" value={form.startTime} onChange={e=>setForm({...form,startTime:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13}}/>
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>End Time</label>
                    <input type="time" value={form.endTime} onChange={e=>setForm({...form,endTime:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13}}/>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="action-btn btn-view" onClick={()=>setModal(false)}>Cancel</button>
              <button className="action-btn btn-approve" disabled={saving} onClick={save}>{saving?'Saving...':'Assign'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}