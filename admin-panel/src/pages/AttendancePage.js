import React, { useState, useEffect } from 'react';
import { CalendarCheck, Plus, X } from 'lucide-react';
import api from '../utils/api';

const todayStr = () => new Date().toISOString().slice(0,10);
const emptyForm = { staff:'', date: todayStr(), checkIn:'', checkOut:'', status:'Present', notes:'' };

export default function AttendancePage() {
  const [records, setRecords] = useState([]);
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
      api.get(`/staff-hr/attendance?date=${date}`).catch(() => ({ data: { records: [] } })),
      api.get('/staff').catch(() => ({ data: { staff: [] } })),
    ]).then(([attRes, staffRes]) => {
      setRecords(attRes.data?.records || []);
      setStaffList((staffRes.data?.staff || []).filter(s => s.status === 'active'));
    }).finally(() => setLoading(false));
  };
  useEffect(() => { fetchAll(); }, [date]);

  const openAdd = () => { setForm({ ...emptyForm, date }); setError(''); setModal(true); };

  const save = async () => {
    if (!form.staff) { setError('Select a staff member.'); return; }
    setSaving(true);
    try {
      await api.post('/staff-hr/attendance', form);
      setModal(false); fetchAll();
    } catch (err) { setError(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const statusColor = { Present:'var(--green-600)', Late:'#D97706', Absent:'var(--red-600)', 'Half Day':'var(--blue-600)' };
  const statusBg = { Present:'var(--green-100)', Late:'var(--amber-100)', Absent:'var(--red-100)', 'Half Day':'var(--blue-100)' };

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Attendance</h1>
          <p>Daily check-in / check-out records (recorded by admin)</p>
        </div>
        <button className="btn-add" onClick={openAdd}><Plus size={15}/> Record Attendance</button>
      </div>

      <div className="card" style={{marginBottom:20}}>
        <div className="card-body" style={{padding:'14px 20px'}}>
          <label style={{fontSize:12,fontWeight:600,marginRight:10}}>Date:</label>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{padding:'8px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13}}/>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr><th>Employee</th><th>Department</th><th>Check In</th><th>Check Out</th><th>Status</th><th>Notes</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan={6}><div className="empty-state"><p>Loading...</p></div></td></tr>}
              {!loading && records.map(r => (
                <tr key={r._id}>
                  <td><div className="td-name">{r.staff?.name}</div><div className="td-sub">{r.staff?.employeeId}</div></td>
                  <td style={{fontSize:13}}>{r.staff?.department || '—'}</td>
                  <td style={{fontSize:13}}>{r.checkIn || '—'}</td>
                  <td style={{fontSize:13}}>{r.checkOut || '—'}</td>
                  <td><span style={{fontSize:11,fontWeight:600,padding:'3px 8px',borderRadius:100,background:statusBg[r.status],color:statusColor[r.status]}}>{r.status}</span></td>
                  <td style={{fontSize:12,color:'var(--slate-500)'}}>{r.notes || '—'}</td>
                </tr>
              ))}
              {!loading && records.length===0 && (
                <tr><td colSpan={6}><div className="empty-state"><CalendarCheck size={36} style={{margin:'0 auto 12px',opacity:.3}}/><h3>No attendance records for this date</h3></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={()=>setModal(false)}>
          <div className="modal" style={{maxWidth:440}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">Record Attendance</div><button className="icon-btn" onClick={()=>setModal(false)}><X size={16}/></button></div>
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
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Check In</label>
                    <input type="time" value={form.checkIn} onChange={e=>setForm({...form,checkIn:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13}}/>
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Check Out</label>
                    <input type="time" value={form.checkOut} onChange={e=>setForm({...form,checkOut:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13}}/>
                  </div>
                </div>
                <div>
                  <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Status</label>
                  <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13,background:'#fff'}}>
                    {['Present','Late','Absent','Half Day'].map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="action-btn btn-view" onClick={()=>setModal(false)}>Cancel</button>
              <button className="action-btn btn-approve" disabled={saving} onClick={save}>{saving?'Saving...':'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}