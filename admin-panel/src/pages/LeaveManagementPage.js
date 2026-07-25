import React, { useState, useEffect } from 'react';
import { CalendarOff, Plus, X, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import api from '../utils/api';

const emptyForm = { staff:'', leaveType:'Annual', startDate:'', endDate:'', reason:'' };

export default function LeaveManagementPage() {
  const [records, setRecords] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      api.get('/staff-hr/leave').catch(() => ({ data: { records: [] } })),
      api.get('/staff').catch(() => ({ data: { staff: [] } })),
    ]).then(([leaveRes, staffRes]) => {
      setRecords(leaveRes.data?.records || []);
      setStaffList((staffRes.data?.staff || []).filter(s => s.status === 'active'));
    }).finally(() => setLoading(false));
  };
  useEffect(() => { fetchAll(); }, []);

  const filtered = statusFilter === 'all' ? records : records.filter(r => r.status === statusFilter);

  const openAdd = () => { setForm(emptyForm); setError(''); setModal(true); };

  const save = async () => {
    if (!form.staff || !form.startDate || !form.endDate) { setError('Staff, start date and end date are required.'); return; }
    setSaving(true);
    try {
      await api.post('/staff-hr/leave', form);
      setModal(false); fetchAll();
    } catch (err) { setError(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const decide = async (id, decision) => {
    try { await api.patch(`/staff-hr/leave/${id}/decision`, { decision }); fetchAll(); }
    catch { alert('Failed to update leave request'); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this leave request?')) return;
    await api.delete(`/staff-hr/leave/${id}`);
    fetchAll();
  };

  const statusColor = { Pending:'#D97706', Approved:'var(--green-600)', Rejected:'var(--red-600)' };
  const statusBg = { Pending:'var(--amber-100)', Approved:'var(--green-100)', Rejected:'var(--red-100)' };

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Leave Management</h1>
          <p>Staff leave requests and approvals</p>
        </div>
        <button className="btn-add" onClick={openAdd}><Plus size={15}/> New Leave Request</button>
      </div>

      <div style={{display:'flex',gap:4,marginBottom:20,background:'var(--slate-100)',padding:4,borderRadius:'var(--r-sm)',width:'fit-content'}}>
        {['all','Pending','Approved','Rejected'].map(s => (
          <button key={s} onClick={()=>setStatusFilter(s)} style={{
            padding:'7px 16px',borderRadius:'var(--r-sm)',border:'none',cursor:'pointer',
            fontSize:13,fontWeight:600,
            background: statusFilter===s ? '#fff' : 'transparent',
            color: statusFilter===s ? 'var(--slate-900)' : 'var(--slate-500)',
            boxShadow: statusFilter===s ? 'var(--sh-sm)' : 'none',
          }}>{s === 'all' ? 'All' : s} ({s==='all' ? records.length : records.filter(r=>r.status===s).length})</button>
        ))}
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr><th>Employee</th><th>Type</th><th>From</th><th>To</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan={7}><div className="empty-state"><p>Loading...</p></div></td></tr>}
              {!loading && filtered.map(r => (
                <tr key={r._id}>
                  <td><div className="td-name">{r.staff?.name}</div><div className="td-sub">{r.staff?.department}</div></td>
                  <td style={{fontSize:13}}>{r.leaveType}</td>
                  <td style={{fontSize:13}}>{new Date(r.startDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}</td>
                  <td style={{fontSize:13}}>{new Date(r.endDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}</td>
                  <td style={{fontSize:12,color:'var(--slate-500)',maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.reason || '—'}</td>
                  <td><span style={{fontSize:11,fontWeight:600,padding:'3px 8px',borderRadius:100,background:statusBg[r.status],color:statusColor[r.status]}}>{r.status}</span></td>
                  <td>
                    <div style={{display:'flex',gap:4}}>
                      {r.status==='Pending' && <>
                        <button className="icon-btn" title="Approve" onClick={()=>decide(r._id,'Approved')} style={{color:'var(--green-600)'}}><CheckCircle size={13}/></button>
                        <button className="icon-btn" title="Reject" onClick={()=>decide(r._id,'Rejected')} style={{color:'var(--red-600)'}}><XCircle size={13}/></button>
                      </>}
                      <button className="icon-btn danger" title="Delete" onClick={()=>remove(r._id)}><Trash2 size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length===0 && (
                <tr><td colSpan={7}><div className="empty-state"><CalendarOff size={36} style={{margin:'0 auto 12px',opacity:.3}}/><h3>No leave requests found</h3></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={()=>setModal(false)}>
          <div className="modal" style={{maxWidth:460}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">New Leave Request</div><button className="icon-btn" onClick={()=>setModal(false)}><X size={16}/></button></div>
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
                  <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Leave Type</label>
                  <select value={form.leaveType} onChange={e=>setForm({...form,leaveType:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13,background:'#fff'}}>
                    {['Sick','Annual','Casual','Other'].map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Start Date *</label>
                    <input type="date" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13}}/>
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>End Date *</label>
                    <input type="date" value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13}}/>
                  </div>
                </div>
                <div>
                  <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Reason</label>
                  <textarea rows={2} value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13,resize:'vertical'}}/>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="action-btn btn-view" onClick={()=>setModal(false)}>Cancel</button>
              <button className="action-btn btn-approve" disabled={saving} onClick={save}>{saving?'Saving...':'Submit'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}