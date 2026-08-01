import React,{useState,useEffect} from 'react';
import {useLocation} from 'react-router-dom';
import {Users,Plus,X,Search,Edit,Trash2,Calendar,CheckCircle,XCircle,AlertTriangle} from 'lucide-react';
import api from '../utils/api';

const STAFF_TYPES=['Doctor','Nurse','Lab Technician','Administrative','Support'];
const EMPTY={fullName:'',designation:'',department:'',staffType:'Nurse',phone:'',email:'',emergencyDuty:false};

export default function HospitalStaffPage(){
  const loc=useLocation();
  const [staff,setStaff]=useState([]);
  const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState('all');
  const [search,setSearch]=useState('');
  const [modal,setModal]=useState(null);
  const [selected,setSelected]=useState(null);
  const [form,setForm]=useState(EMPTY);
  const [dutyForm,setDutyForm]=useState({date:'',shift:'Morning'});
  const [attForm,setAttForm]=useState({date:new Date().toISOString().slice(0,10),status:'Present',checkIn:'',checkOut:''});
  const [leaveForm,setLeaveForm]=useState({leaveType:'Annual',startDate:'',endDate:'',reason:''});
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');

  const fetchAll=()=>{
    setLoading(true);
    api.get('/hospital-staff').then(r=>setStaff(r.data?.staff||[])).catch(()=>setStaff([])).finally(()=>setLoading(false));
  };
  useEffect(()=>{fetchAll();},[]);

  useEffect(()=>{
    const h=loc.hash.replace('#','');
    if(h&&h!=='add-staff=open') setTab(h);
    if(h==='add-staff=open') openAdd();
  },[loc.hash]);
  useEffect(()=>{
    const handler=()=>openAdd();
    window.addEventListener('open-add-staff',handler);
    return ()=>window.removeEventListener('open-add-staff',handler);
  },[]);

  const filtered=staff.filter(s=>!search||s.fullName.toLowerCase().includes(search.toLowerCase()));

  const departments=(()=>{
    const g={};
    staff.forEach(s=>{const d=s.department||'Unassigned';if(!g[d])g[d]=[];g[d].push(s);});
    return Object.entries(g).map(([name,members])=>({name,members}));
  })();

  const counts={
    total:staff.length,
    active:staff.filter(s=>s.status==='active').length,
    emergency:staff.filter(s=>s.emergencyDuty).length,
  };

  const openAdd=()=>{setSelected(null);setForm(EMPTY);setError('');setModal('form');};
  const openEdit=(s)=>{setSelected(s);setForm({fullName:s.fullName,designation:s.designation,department:s.department||'',staffType:s.staffType,phone:s.phone||'',email:s.email||'',emergencyDuty:s.emergencyDuty});setError('');setModal('form');};

  const save=async()=>{
    if(!form.fullName||!form.designation){setError('Name and designation are required.');return;}
    setSaving(true);
    try{
      if(selected) await api.put(`/hospital-staff/${selected._id}`,form);
      else await api.post('/hospital-staff',form);
      setModal(null);fetchAll();
    }catch(err){setError(err.response?.data?.message||'Failed to save');}
    finally{setSaving(false);}
  };

  const remove=async(id)=>{
    if(!window.confirm('Delete this staff member?'))return;
    await api.delete(`/hospital-staff/${id}`);fetchAll();
  };

  const openDuty=(s)=>{setSelected(s);setDutyForm({date:'',shift:'Morning'});setModal('duty');};
  const submitDuty=async()=>{
    await api.post(`/hospital-staff/${selected._id}/duty`,dutyForm);
    setModal(null);fetchAll();
  };

  const openAttendance=(s)=>{setSelected(s);setAttForm({date:new Date().toISOString().slice(0,10),status:'Present',checkIn:'',checkOut:''});setModal('attendance');};
  const submitAttendance=async()=>{
    await api.post(`/hospital-staff/${selected._id}/attendance`,attForm);
    setModal(null);fetchAll();
  };

  const openLeave=(s)=>{setSelected(s);setLeaveForm({leaveType:'Annual',startDate:'',endDate:'',reason:''});setModal('leave');};
  const submitLeave=async()=>{
    await api.post(`/hospital-staff/${selected._id}/leave`,leaveForm);
    setModal(null);fetchAll();
  };

  const decideLeave=async(staffId,leaveId,status)=>{
    await api.patch(`/hospital-staff/${staffId}/leave/${leaveId}`,{status});
    fetchAll();
  };

  return(
    <div className="anim-up">
      <div className="page-hdr">
        <div><h1>Hospital Staff</h1><p>Roster, duty schedule, attendance & leave management</p></div>
        <button className="btn-primary" onClick={openAdd}><Plus size={15}/>Add Staff</button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:22}}>
        {[
          {label:'Total Staff',value:counts.total,color:'var(--primary)'},
          {label:'Active',value:counts.active,color:'var(--green-600)'},
          {label:'Emergency Duty',value:counts.emergency,color:'#7C3AED'},
        ].map(({label,value,color})=>(
          <div key={label} className="card" style={{padding:'16px 20px'}}>
            <div style={{fontSize:26,fontWeight:800,fontFamily:'var(--font-disp)',color,marginBottom:3}}>{value}</div>
            <div style={{fontSize:13,color:'var(--slate-500)'}}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{display:'flex',gap:4,marginBottom:20,background:'var(--slate-100)',padding:4,borderRadius:'var(--r-sm)',width:'fit-content',flexWrap:'wrap'}}>
        {[{k:'all',l:'All Staff'},{k:'departments',l:'Departments'},{k:'leave',l:'Leave Requests'}].map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)} style={{
            padding:'7px 16px',borderRadius:'var(--r-sm)',border:'none',cursor:'pointer',fontSize:13,fontWeight:600,
            background:tab===t.k?'#fff':'transparent',color:tab===t.k?'var(--slate-900)':'var(--slate-500)',
            boxShadow:tab===t.k?'var(--sh-sm)':'none',
          }}>{t.l}</button>
        ))}
      </div>

      {tab==='all'&&(
        <>
          <div className="card" style={{marginBottom:20}}>
            <div className="card-body" style={{padding:'14px 20px'}}>
              <div className="search-wrap"><Search size={14}/><input className="search-inp" placeholder="Search staff..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
            </div>
          </div>
          <div className="card">
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>Name</th><th>Designation</th><th>Department</th><th>Type</th><th>Phone</th><th>Emergency</th><th>Actions</th></tr></thead>
                <tbody>
                  {loading&&<tr><td colSpan={7}><div className="empty-state"><p>Loading...</p></div></td></tr>}
                  {!loading&&filtered.map(s=>(
                    <tr key={s._id}>
                      <td><div className="td-name">{s.fullName}</div></td>
                      <td style={{fontSize:13}}>{s.designation}</td>
                      <td style={{fontSize:13}}>{s.department||'—'}</td>
                      <td style={{fontSize:13}}>{s.staffType}</td>
                      <td style={{fontSize:13}}>{s.phone||'—'}</td>
                      <td>{s.emergencyDuty?<AlertTriangle size={14} color="#7C3AED"/>:'—'}</td>
                      <td>
                        <div style={{display:'flex',gap:4}}>
                          <button className="action-btn" title="Assign Duty" onClick={()=>openDuty(s)}><Calendar size={12}/></button>
                          <button className="action-btn" title="Mark Attendance" onClick={()=>openAttendance(s)}><CheckCircle size={12}/></button>
                          <button className="action-btn" title="Request Leave" onClick={()=>openLeave(s)}><XCircle size={12}/></button>
                          <button className="action-btn blue" onClick={()=>openEdit(s)}><Edit size={12}/></button>
                          <button className="action-btn red" onClick={()=>remove(s._id)}><Trash2 size={12}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!loading&&filtered.length===0&&(
                    <tr><td colSpan={7}><div className="empty-state"><Users size={32} style={{opacity:.3,marginBottom:8}}/><p>No staff added yet</p></div></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab==='departments'&&(
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
          {departments.map(d=>(
            <div key={d.name} className="card" style={{padding:'18px 20px'}}>
              <div style={{fontSize:14,fontWeight:700,marginBottom:10}}>{d.name} <span style={{fontSize:12,color:'var(--slate-400)',fontWeight:400}}>({d.members.length})</span></div>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {d.members.map(m=>(
                  <span key={m._id} style={{fontSize:11,padding:'3px 8px',borderRadius:100,background:'var(--slate-100)',color:'var(--slate-600)'}}>{m.fullName}</span>
                ))}
              </div>
            </div>
          ))}
          {departments.length===0&&<div className="card" style={{gridColumn:'span 3'}}><div className="empty-state"><p>No staff added yet</p></div></div>}
        </div>
      )}

      {tab==='leave'&&(
        <div className="card">
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Staff</th><th>Type</th><th>From</th><th>To</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {staff.flatMap(s=>s.leaveRequests.map(l=>({...l,staffName:s.fullName,staffId:s._id}))).length===0&&(
                  <tr><td colSpan={7}><div className="empty-state"><p>No leave requests yet</p></div></td></tr>
                )}
                {staff.flatMap(s=>s.leaveRequests.map(l=>({...l,staffName:s.fullName,staffId:s._id}))).map(l=>(
                  <tr key={l._id}>
                    <td><div className="td-name">{l.staffName}</div></td>
                    <td style={{fontSize:13}}>{l.leaveType}</td>
                    <td style={{fontSize:13}}>{new Date(l.startDate).toLocaleDateString('en-GB')}</td>
                    <td style={{fontSize:13}}>{new Date(l.endDate).toLocaleDateString('en-GB')}</td>
                    <td style={{fontSize:12,color:'var(--slate-500)'}}>{l.reason||'—'}</td>
                    <td><span className={`status-badge ${l.status==='Approved'?'s-fulfilled':l.status==='Rejected'?'s-rejected':'s-pending'}`}>{l.status}</span></td>
                    <td>
                      {l.status==='Pending'&&(
                        <div style={{display:'flex',gap:4}}>
                          <button className="action-btn green" onClick={()=>decideLeave(l.staffId,l._id,'Approved')}><CheckCircle size={12}/></button>
                          <button className="action-btn red" onClick={()=>decideLeave(l.staffId,l._id,'Rejected')}><XCircle size={12}/></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal==='form'&&(
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-hdr"><div className="modal-title">{selected?'Edit':'Add'} Staff</div><button className="action-btn" onClick={()=>setModal(null)}><X size={14}/></button></div>
            <div className="modal-body">
              {error&&<div style={{background:'#FFF1F3',border:'1px solid #FEE2E8',borderRadius:8,padding:'10px 14px',marginBottom:14,fontSize:13,color:'var(--primary-d)'}}>{error}</div>}
              <div className="form-group"><label className="form-label">Full Name *</label><input className="form-input" value={form.fullName} onChange={e=>setForm({...form,fullName:e.target.value})}/></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div className="form-group"><label className="form-label">Designation *</label><input className="form-input" value={form.designation} onChange={e=>setForm({...form,designation:e.target.value})}/></div>
                <div className="form-group"><label className="form-label">Department</label><input className="form-input" value={form.department} onChange={e=>setForm({...form,department:e.target.value})}/></div>
                <div className="form-group"><label className="form-label">Staff Type</label><select className="form-input" value={form.staffType} onChange={e=>setForm({...form,staffType:e.target.value})}>{STAFF_TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></div>
                <div className="form-group" style={{gridColumn:'span 2'}}><label className="form-label">Email</label><input className="form-input" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div>
              </div>
              <label style={{display:'flex',alignItems:'center',gap:8,fontSize:13,marginTop:6}}>
                <input type="checkbox" checked={form.emergencyDuty} onChange={e=>setForm({...form,emergencyDuty:e.target.checked})}/>
                Available for Emergency Duty
              </label>
            </div>
            <div className="modal-footer"><button className="btn-secondary" onClick={()=>setModal(null)}>Cancel</button><button className="btn-primary" disabled={saving} onClick={save}>{saving?'Saving...':'Save'}</button></div>
          </div>
        </div>
      )}

      {modal==='duty'&&selected&&(
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-hdr"><div className="modal-title">Assign Duty — {selected.fullName}</div><button className="action-btn" onClick={()=>setModal(null)}><X size={14}/></button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Date</label><input type="date" className="form-input" value={dutyForm.date} onChange={e=>setDutyForm({...dutyForm,date:e.target.value})}/></div>
              <div className="form-group"><label className="form-label">Shift</label><select className="form-input" value={dutyForm.shift} onChange={e=>setDutyForm({...dutyForm,shift:e.target.value})}><option>Morning</option><option>Evening</option><option>Night</option></select></div>
            </div>
            <div className="modal-footer"><button className="btn-secondary" onClick={()=>setModal(null)}>Cancel</button><button className="btn-primary" onClick={submitDuty}>Assign</button></div>
          </div>
        </div>
      )}

      {modal==='attendance'&&selected&&(
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-hdr"><div className="modal-title">Mark Attendance — {selected.fullName}</div><button className="action-btn" onClick={()=>setModal(null)}><X size={14}/></button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Date</label><input type="date" className="form-input" value={attForm.date} onChange={e=>setAttForm({...attForm,date:e.target.value})}/></div>
              <div className="form-group"><label className="form-label">Status</label><select className="form-input" value={attForm.status} onChange={e=>setAttForm({...attForm,status:e.target.value})}><option>Present</option><option>Absent</option><option>Late</option><option>Half Day</option></select></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div className="form-group"><label className="form-label">Check In</label><input type="time" className="form-input" value={attForm.checkIn} onChange={e=>setAttForm({...attForm,checkIn:e.target.value})}/></div>
                <div className="form-group"><label className="form-label">Check Out</label><input type="time" className="form-input" value={attForm.checkOut} onChange={e=>setAttForm({...attForm,checkOut:e.target.value})}/></div>
              </div>
            </div>
            <div className="modal-footer"><button className="btn-secondary" onClick={()=>setModal(null)}>Cancel</button><button className="btn-primary" onClick={submitAttendance}>Save</button></div>
          </div>
        </div>
      )}

      {modal==='leave'&&selected&&(
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-hdr"><div className="modal-title">Request Leave — {selected.fullName}</div><button className="action-btn" onClick={()=>setModal(null)}><X size={14}/></button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Leave Type</label><select className="form-input" value={leaveForm.leaveType} onChange={e=>setLeaveForm({...leaveForm,leaveType:e.target.value})}><option>Sick</option><option>Annual</option><option>Casual</option><option>Other</option></select></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div className="form-group"><label className="form-label">Start Date</label><input type="date" className="form-input" value={leaveForm.startDate} onChange={e=>setLeaveForm({...leaveForm,startDate:e.target.value})}/></div>
                <div className="form-group"><label className="form-label">End Date</label><input type="date" className="form-input" value={leaveForm.endDate} onChange={e=>setLeaveForm({...leaveForm,endDate:e.target.value})}/></div>
              </div>
              <div className="form-group"><label className="form-label">Reason</label><textarea className="form-input" rows={2} value={leaveForm.reason} onChange={e=>setLeaveForm({...leaveForm,reason:e.target.value})}/></div>
            </div>
            <div className="modal-footer"><button className="btn-secondary" onClick={()=>setModal(null)}>Cancel</button><button className="btn-primary" onClick={submitLeave}>Submit</button></div>
          </div>
        </div>
      )}
    </div>
  );
}