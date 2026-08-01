import React,{useState,useEffect} from 'react';
import {useLocation} from 'react-router-dom';
import {Users,Plus,X,Search,Eye,Edit,Trash2,FileText,Droplets,Activity,Upload,Image as ImageIcon,File as FileIcon} from 'lucide-react';
import api from '../utils/api';

// Derive the plain server origin (e.g. http://localhost:5000) from the
// axios baseURL (e.g. http://localhost:5000/api) so uploaded file links
// (served from /uploads/...) resolve correctly regardless of environment.
const SERVER_ORIGIN=(api.defaults.baseURL||'http://localhost:5000/api').replace(/\/api\/?$/,'');

const BLOOD_GROUPS=['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const emptyForm={fullName:'',nic:'',age:'',gender:'',bloodGroup:'',phone:'',address:'',ward:'',isCritical:false,medicalRecords:{allergies:'',chronicConditions:'',currentMedications:'',notes:''}};

export default function PatientsPage(){
  const loc=useLocation();
  const [patients,setPatients]=useState([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState('');
  const [modal,setModal]=useState(null);
  const [selected,setSelected]=useState(null);
  const [profile,setProfile]=useState(null);
  const [form,setForm]=useState(emptyForm);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  const [docFile,setDocFile]=useState(null);
  const [docLabel,setDocLabel]=useState('');
  const [medEditing,setMedEditing]=useState(false);
  const [medDraft,setMedDraft]=useState({allergies:'',chronicConditions:'',currentMedications:'',notes:''});
  const [medSaving,setMedSaving]=useState(false);

  const fetchAll=()=>{
    setLoading(true);
    api.get('/hospital-patients').then(r=>setPatients(r.data?.patients||[])).catch(()=>setPatients([])).finally(()=>setLoading(false));
  };
  useEffect(()=>{fetchAll();},[]);

  // Sidebar submenu: scroll to section via hash
  useEffect(()=>{
    if(loading) return;
    if(loc.hash&&loc.hash!=='#register-patient=open'){
      const id=loc.hash.replace('#','');
      const el=document.getElementById(id);
      if(el) setTimeout(()=>el.scrollIntoView({behavior:'smooth',block:'start'}),50);
    }
  },[loc.hash,loading]);

  // Sidebar submenu: "Register Patient" opens the modal directly
  useEffect(()=>{
    if(loc.hash==='#register-patient=open') openAdd();
  },[loc.hash]);
  useEffect(()=>{
    const handler=()=>openAdd();
    window.addEventListener('open-register-patient',handler);
    return ()=>window.removeEventListener('open-register-patient',handler);
  },[]);

  const filtered=patients.filter(p=>!search||p.fullName?.toLowerCase().includes(search.toLowerCase())||p.nic?.includes(search));

  const counts={
    total:patients.length,
    active:patients.filter(p=>p.status==='active').length,
    discharged:patients.filter(p=>p.status==='discharged').length,
  };

  const openAdd=()=>{setSelected(null);setForm(emptyForm);setError('');setModal('form');};
  const openEdit=(p)=>{
    setSelected(p);
    setForm({fullName:p.fullName,nic:p.nic||'',age:p.age||'',gender:p.gender||'',bloodGroup:p.bloodGroup||'',phone:p.phone||'',address:p.address||'',ward:p.ward||'',isCritical:p.isCritical||false,
      medicalRecords:{allergies:p.medicalRecords?.allergies||'',chronicConditions:p.medicalRecords?.chronicConditions||'',currentMedications:p.medicalRecords?.currentMedications||'',notes:p.medicalRecords?.notes||''}});
    setError('');setModal('form');
  };

  const save=async()=>{
    if(!form.fullName){setError('Patient name is required.');return;}
    setSaving(true);
    try{
      if(selected) await api.put(`/hospital-patients/${selected._id}`,form);
      else await api.post('/hospital-patients',form);
      setModal(null);fetchAll();
    }catch(err){setError(err.response?.data?.message||'Failed to save');}
    finally{setSaving(false);}
  };

  const openProfile=async(p)=>{
    setSelected(p);setModal('profile');setProfile(null);setMedEditing(false);setDocFile(null);setDocLabel('');
    try{const r=await api.get(`/hospital-patients/${p._id}`);setProfile(r.data);}
    catch{setProfile(null);}
  };

  const startMedEdit=()=>{
    setMedDraft({
      allergies:profile.patient.medicalRecords?.allergies||'',
      chronicConditions:profile.patient.medicalRecords?.chronicConditions||'',
      currentMedications:profile.patient.medicalRecords?.currentMedications||'',
      notes:profile.patient.medicalRecords?.notes||'',
    });
    setMedEditing(true);
  };

  const saveMedRecords=async()=>{
    setMedSaving(true);
    try{
      const p=profile.patient;
      await api.put(`/hospital-patients/${p._id}`,{
        fullName:p.fullName,nic:p.nic||'',age:p.age||'',gender:p.gender||'',
        bloodGroup:p.bloodGroup||'',phone:p.phone||'',address:p.address||'',ward:p.ward||'',
        isCritical:p.isCritical||false,
        medicalRecords:medDraft,
      });
      const r=await api.get(`/hospital-patients/${p._id}`);
      setProfile(r.data);
      setMedEditing(false);
      fetchAll();
    }catch(err){
      alert(err.response?.data?.message||'Could not save medical records.');
    }finally{
      setMedSaving(false);
    }
  };

  const remove=async(id)=>{
    if(!window.confirm('Delete this patient record?'))return;
    await api.delete(`/hospital-patients/${id}`);fetchAll();
  };

  const discharge=async(id)=>{
    await api.patch(`/hospital-patients/${id}/discharge`);fetchAll();
    if(selected?._id===id) openProfile(selected);
  };

  const [docSaving,setDocSaving]=useState(false);
  const addDocument=async()=>{
    if(!docFile){alert('Please choose a photo or PDF file first.');return;}
    setDocSaving(true);
    try{
      const fd=new FormData();
      fd.append('file',docFile);
      if(docLabel.trim()) fd.append('name',docLabel.trim());
      await api.post(`/hospital-patients/${selected._id}/documents`,fd);
      setDocFile(null);setDocLabel('');
      const r=await api.get(`/hospital-patients/${selected._id}`);
      setProfile(r.data);
      fetchAll();
    }catch(err){
      alert(err.response?.data?.message||'Could not upload document — check that this endpoint exists on the backend.');
      console.error('Add document error:',err);
    }finally{
      setDocSaving(false);
    }
  };

  const removeDocument=async(docId)=>{
    if(!window.confirm('Remove this document?'))return;
    try{
      await api.delete(`/hospital-patients/${selected._id}/documents/${docId}`);
      const r=await api.get(`/hospital-patients/${selected._id}`);
      setProfile(r.data);
    }catch(err){
      alert(err.response?.data?.message||'Could not remove document.');
    }
  };

  return(
    <div className="anim-up">
      <div id="patients-dashboard" className="stats-grid" style={{scrollMarginTop:20}}>
        <div className="stat-card"><div className="stat-icon blue"><Users size={20}/></div><div className="stat-value">{counts.total}</div><div className="stat-label">Total Patients</div></div>
        <div className="stat-card"><div className="stat-icon green"><Activity size={20}/></div><div className="stat-value">{counts.active}</div><div className="stat-label">Active</div></div>
        <div className="stat-card"><div className="stat-icon purple"><FileText size={20}/></div><div className="stat-value">{counts.discharged}</div><div className="stat-label">Discharged</div></div>
      </div>

      <div className="page-header" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:16,marginBottom:20}}>
        <div className="page-header-left"><h1>Patient Management</h1><p>Register and manage hospital patient records</p></div>
        <button className="btn-primary" onClick={openAdd}><Plus size={15}/> Register Patient</button>
      </div>

      <div className="card" style={{marginBottom:20}}>
        <div className="card-body" style={{padding:'14px 20px'}}>
          <div className="search-input-wrap">
            <Search size={14}/>
            <input className="search-input" placeholder="Search by name or NIC..." value={search} onChange={e=>setSearch(e.target.value)}/>
            {search&&(
              <button className="search-clear-btn" onClick={()=>setSearch('')} title="Clear search">
                <X size={13}/>
              </button>
            )}
          </div>
        </div>
      </div>

      <div id="all-patients" className="card" style={{scrollMarginTop:20}}>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Patient</th><th>Age/Gender</th><th>Blood Group</th><th>Ward</th><th>Phone</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {loading&&<tr><td colSpan={7}><div className="empty-state"><p>Loading...</p></div></td></tr>}
              {!loading&&filtered.map(p=>(
                <tr key={p._id}>
                  <td><div className="td-name">{p.fullName} {p.isCritical&&<span style={{fontSize:10,fontWeight:700,padding:'2px 6px',borderRadius:100,background:'var(--red-100)',color:'var(--red-600)',marginLeft:6}}>CRITICAL</span>}</div><div className="td-sub">{p.nic||'—'}</div></td>
                  <td style={{fontSize:13}}>{p.age||'—'} {p.gender&&`· ${p.gender}`}</td>
                  <td>{p.bloodGroup?<span className="blood-badge">{p.bloodGroup}</span>:'—'}</td>
                  <td style={{fontSize:13}}>{p.ward||'—'}</td>
                  <td style={{fontSize:13}}>{p.phone||'—'}</td>
                  <td><span className={`status-badge ${p.status==='active'?'s-approved':'s-cancelled'}`}>{p.status}</span></td>
                  <td>
                    <div style={{display:'flex',gap:4}}>
                      <button className="icon-btn" onClick={()=>openProfile(p)}><Eye size={13}/></button>
                      <button className="icon-btn" onClick={()=>openEdit(p)}><Edit size={13}/></button>
                      <button className="icon-btn danger" onClick={()=>remove(p._id)}><Trash2 size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading&&filtered.length===0&&(
                <tr><td colSpan={7}><div className="empty-state"><Users size={36} style={{margin:'0 auto 12px',opacity:.3}}/><h3>No patients registered yet</h3></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal==='form'&&(
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal" style={{maxWidth:560}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">{selected?'Edit':'Register'} Patient</div><button className="icon-btn" onClick={()=>setModal(null)}><X size={16}/></button></div>
            <div className="modal-body">
              {error&&<div style={{background:'#FFF1F3',border:'1px solid #FEE2E8',borderRadius:8,padding:'10px 14px',marginBottom:14,fontSize:13,color:'var(--primary-d)'}}>{error}</div>}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div style={{gridColumn:'span 2'}}><label className="form-label">Full Name *</label><input className="form-input" value={form.fullName} onChange={e=>setForm({...form,fullName:e.target.value})}/></div>
                <div><label className="form-label">NIC</label><input className="form-input" value={form.nic} onChange={e=>setForm({...form,nic:e.target.value})}/></div>
                <div><label className="form-label">Age</label><input className="form-input" type="number" value={form.age} onChange={e=>setForm({...form,age:e.target.value})}/></div>
                <div>
                  <label className="form-label">Gender</label>
                  <select className="form-input" value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})}>
                    <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Blood Group</label>
                  <select className="form-input" value={form.bloodGroup} onChange={e=>setForm({...form,bloodGroup:e.target.value})}>
                    <option value="">Select</option>{BLOOD_GROUPS.map(g=><option key={g}>{g}</option>)}
                  </select>
                </div>
                <div><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></div>
                <div><label className="form-label">Ward</label><input className="form-input" value={form.ward} onChange={e=>setForm({...form,ward:e.target.value})}/></div>
                <div style={{gridColumn:'span 2'}}><label className="form-label">Address</label><input className="form-input" value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></div>
                <label style={{gridColumn:'span 2',display:'flex',alignItems:'center',gap:8,fontSize:13,padding:'8px 0'}}>
                  <input type="checkbox" checked={form.isCritical} onChange={e=>setForm({...form,isCritical:e.target.checked})}/>
                  Mark as Critical Patient
                </label>

                <div style={{gridColumn:'span 2',fontSize:12,fontWeight:700,color:'var(--slate-500)',textTransform:'uppercase',letterSpacing:.5,marginTop:6}}>Medical Records</div>
                <div style={{gridColumn:'span 2'}}><label className="form-label">Allergies</label><input className="form-input" value={form.medicalRecords.allergies} onChange={e=>setForm({...form,medicalRecords:{...form.medicalRecords,allergies:e.target.value}})}/></div>
                <div style={{gridColumn:'span 2'}}><label className="form-label">Chronic Conditions</label><input className="form-input" value={form.medicalRecords.chronicConditions} onChange={e=>setForm({...form,medicalRecords:{...form.medicalRecords,chronicConditions:e.target.value}})}/></div>
                <div style={{gridColumn:'span 2'}}><label className="form-label">Current Medications</label><input className="form-input" value={form.medicalRecords.currentMedications} onChange={e=>setForm({...form,medicalRecords:{...form.medicalRecords,currentMedications:e.target.value}})}/></div>
                <div style={{gridColumn:'span 2'}}><label className="form-label">Notes</label><textarea className="form-input" rows={2} value={form.medicalRecords.notes} onChange={e=>setForm({...form,medicalRecords:{...form.medicalRecords,notes:e.target.value}})}/></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={()=>setModal(null)}>Cancel</button>
              <button className="btn-primary" disabled={saving} onClick={save}>{saving?'Saving...':'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {modal==='profile'&&selected&&(
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal" style={{maxWidth:600}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{selected.fullName}</div>
              <button className="icon-btn" onClick={()=>setModal(null)}><X size={16}/></button>
            </div>
            <div className="modal-body">
              {!profile&&<p style={{fontSize:13,color:'var(--slate-500)'}}>Loading...</p>}
              {profile&&(
                <>
                  <div className="detail-row">
                    <div className="detail-field"><div className="detail-label">Blood Group</div><div className="detail-value">{profile.patient.bloodGroup||'—'}</div></div>
                    <div className="detail-field"><div className="detail-label">Age/Gender</div><div className="detail-value">{profile.patient.age||'—'} {profile.patient.gender}</div></div>
                    <div className="detail-field"><div className="detail-label">Status</div><div className="detail-value">{profile.patient.status}</div></div>
                  </div>

                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',margin:'16px 0 8px'}}>
                    <div style={{fontSize:12,fontWeight:700,color:'var(--slate-500)',textTransform:'uppercase',letterSpacing:.5}}>Medical Records</div>
                    {!medEditing?(
                      <button className="btn-secondary" style={{padding:'5px 12px',fontSize:12}} onClick={startMedEdit}>
                        <Edit size={12}/> Edit
                      </button>
                    ):(
                      <div style={{display:'flex',gap:6}}>
                        <button className="btn-secondary" style={{padding:'5px 12px',fontSize:12}} onClick={()=>setMedEditing(false)} disabled={medSaving}>Cancel</button>
                        <button className="btn-primary" style={{padding:'5px 12px',fontSize:12}} onClick={saveMedRecords} disabled={medSaving}>{medSaving?'Saving...':'Save'}</button>
                      </div>
                    )}
                  </div>
                  {!medEditing?(
                    <div style={{background:'var(--slate-50)',borderRadius:8,padding:12,fontSize:13,display:'grid',gap:6}}>
                      <div><b>Allergies:</b> {profile.patient.medicalRecords?.allergies||'—'}</div>
                      <div><b>Chronic Conditions:</b> {profile.patient.medicalRecords?.chronicConditions||'—'}</div>
                      <div><b>Current Medications:</b> {profile.patient.medicalRecords?.currentMedications||'—'}</div>
                      {profile.patient.medicalRecords?.notes&&<div><b>Notes:</b> {profile.patient.medicalRecords.notes}</div>}
                    </div>
                  ):(
                    <div style={{background:'var(--slate-50)',borderRadius:8,padding:12,display:'grid',gap:10}}>
                      <div>
                        <label className="form-label">Allergies</label>
                        <input className="form-input" value={medDraft.allergies} onChange={e=>setMedDraft(d=>({...d,allergies:e.target.value}))}/>
                      </div>
                      <div>
                        <label className="form-label">Chronic Conditions</label>
                        <input className="form-input" value={medDraft.chronicConditions} onChange={e=>setMedDraft(d=>({...d,chronicConditions:e.target.value}))}/>
                      </div>
                      <div>
                        <label className="form-label">Current Medications</label>
                        <input className="form-input" value={medDraft.currentMedications} onChange={e=>setMedDraft(d=>({...d,currentMedications:e.target.value}))}/>
                      </div>
                      <div>
                        <label className="form-label">Notes</label>
                        <textarea className="form-input" rows={2} value={medDraft.notes} onChange={e=>setMedDraft(d=>({...d,notes:e.target.value}))}/>
                      </div>
                    </div>
                  )}

                  <div style={{fontSize:12,fontWeight:700,color:'var(--slate-500)',textTransform:'uppercase',letterSpacing:.5,margin:'16px 0 8px',display:'flex',alignItems:'center',gap:6}}><Droplets size={13}/> Blood Transfusion History</div>
                  {profile.transfusionHistory.length===0?(
                    <p style={{fontSize:13,color:'var(--slate-400)'}}>No blood requests linked to this patient yet.</p>
                  ):(
                    <div style={{display:'flex',flexDirection:'column',gap:6}}>
                      {profile.transfusionHistory.map(t=>(
                        <div key={t._id} style={{display:'flex',gap:10,alignItems:'center',padding:'8px 12px',background:'var(--slate-50)',borderRadius:8,fontSize:12}}>
                          <span className="blood-badge" style={{fontSize:10}}>{t.bloodGroup}</span>
                          <span>{t.units} units</span>
                          <span style={{color:'var(--slate-500)'}}>{t.priority}</span>
                          <span style={{marginLeft:'auto',color:'var(--slate-400)'}}>{new Date(t.createdAt).toLocaleDateString('en-GB')}</span>
                          <span className={`status-badge s-${t.status}`}>{t.status}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{fontSize:12,fontWeight:700,color:'var(--slate-500)',textTransform:'uppercase',letterSpacing:.5,margin:'16px 0 8px'}}>Patient Documents</div>
                  <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:12,padding:12,background:'var(--slate-50)',borderRadius:8}}>
                    <div style={{display:'flex',gap:8}}>
                      <label
                        style={{display:'flex',alignItems:'center',gap:7,padding:'9px 14px',border:'1.5px dashed var(--slate-300)',borderRadius:'var(--r-sm)',fontSize:12.5,color:'var(--slate-600)',cursor:'pointer',background:'#fff',flex:1}}
                      >
                        <Upload size={14}/>
                        {docFile?docFile.name:'Choose a photo or PDF...'}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,application/pdf"
                          style={{display:'none'}}
                          onChange={e=>{
                            const f=e.target.files?.[0];
                            if(!f) return;
                            if(f.size>8*1024*1024){alert('File must be smaller than 8MB.');return;}
                            setDocFile(f);
                          }}
                        />
                      </label>
                    </div>
                    <input className="form-input" placeholder="Optional label (e.g. Discharge Summary)" value={docLabel} onChange={e=>setDocLabel(e.target.value)}/>
                    <button className="btn-primary" style={{alignSelf:'flex-start'}} onClick={addDocument} disabled={docSaving}>
                      {docSaving?'Uploading...':'Upload Document'}
                    </button>
                  </div>
                  {profile.patient.documents?.length>0?(
                    <div style={{display:'flex',flexDirection:'column',gap:6}}>
                      {profile.patient.documents.map((d)=>{
                        const isImage=/\.(png|jpe?g|webp)$/i.test(d.fileUrl||'');
                        return(
                          <div key={d._id||d.name} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',background:'var(--slate-50)',borderRadius:8,fontSize:12}}>
                            {isImage?<ImageIcon size={13}/>:<FileIcon size={13}/>}
                            <a href={`${SERVER_ORIGIN}${d.fileUrl}`} target="_blank" rel="noopener noreferrer" style={{color:'var(--primary)',fontWeight:600,textDecoration:'none',flex:1}}>
                              {d.name}
                            </a>
                            <span style={{color:'var(--slate-400)',fontSize:11}}>{d.uploadedAt?new Date(d.uploadedAt).toLocaleDateString('en-GB'):''}</span>
                            <button className="icon-btn danger" style={{width:24,height:24}} onClick={()=>removeDocument(d._id)}>
                              <Trash2 size={12}/>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ):<p style={{fontSize:13,color:'var(--slate-400)'}}>No documents added yet.</p>}
                </>
              )}
            </div>
            <div className="modal-footer">
              {profile?.patient.status==='active'&&<button className="btn-secondary" onClick={()=>discharge(selected._id)}>Discharge Patient</button>}
              <button className="btn-primary" onClick={()=>setModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}