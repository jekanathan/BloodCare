import React,{useState,useEffect} from 'react';
import {useLocation} from 'react-router-dom';
import {Search,Plus,Eye,X,CheckCircle,Droplets,Ban,Truck,FlaskConical,Package} from 'lucide-react';
import api from '../utils/api';

const BG=['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const PRIORITIES=['Emergency','Urgent','Normal'];
const EMPTY={patientId:'',patientName:'',patientAge:'',patientWard:'',bloodGroup:'',unitsRequired:'',priority:'Normal',requestedBy:'',notes:''};

const STATUS_CFG={
  pending:   {label:'Pending',    color:'#D97706',bg:'var(--amber-100)'},
  approved:  {label:'Approved',   color:'var(--green-600)',bg:'var(--green-100)'},
  processing:{label:'Allocated',  color:'var(--primary)',bg:'var(--primary-100)'},
  dispatched:{label:'Dispatched', color:'#7C3AED',bg:'var(--purple-100)'},
  delivered: {label:'Received',   color:'var(--green-600)',bg:'var(--green-100)'},
  rejected:  {label:'Rejected',   color:'var(--red-600)',bg:'var(--red-100)'},
  cancelled: {label:'Cancelled',  color:'var(--slate-500)',bg:'var(--slate-100)'},
};

const PRIORITY_CFG={
  Emergency:{color:'#B91C1C',bg:'#FEE2E2'},
  Urgent:   {color:'#92400E',bg:'var(--amber-100)'},
  Normal:   {color:'var(--slate-600)',bg:'var(--slate-100)'},
};

const TABS=[
  {key:'all',            label:'All'},
  {key:'pending',        label:'⏳ Pending'},
  {key:'under-review',   label:'🧪 Under Review'},
  {key:'approved',       label:'✅ Approved'},
  {key:'allocation',     label:'🩸 Allocated'},
  {key:'dispatch',       label:'🚚 Dispatch Tracking'},
  {key:'received',       label:'📦 Blood Received'},
  {key:'emergency',      label:'🚨 Emergency'},
  {key:'rejected',       label:'❌ Rejected'},
  {key:'cancelled',      label:'🚫 Cancelled'},
];

export default function BloodRequestsPage(){
  const loc=useLocation();
  const [requests,setRequests]=useState([]);
  const [patients,setPatients]=useState([]);
  const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState('all');
  const [search,setSearch]=useState('');
  const [bgFilter,setBgFilter]=useState('all');
  const [priFilter,setPriFilter]=useState('all');
  const [selected,setSelected]=useState(null);
  const [showNew,setShowNew]=useState(false);
  const [form,setForm]=useState(EMPTY);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  const [toast,setToast]=useState('');
  const [nearbyBanks,setNearbyBanks]=useState([]);
  const [nearbyLoading,setNearbyLoading]=useState(false);
  const [selectedBanks,setSelectedBanks]=useState([]);

  const showToast=msg=>{setToast(msg);setTimeout(()=>setToast(''),3000)};

  const fetchAll=()=>{
    setLoading(true);
    Promise.all([
      api.get('/blood-requests/my').catch(()=>({data:{requests:[]}})),
      api.get('/hospital-patients').catch(()=>({data:{patients:[]}})),
    ]).then(([r1,r2])=>{
      setRequests(r1.data?.requests||[]);
      setPatients(r2.data?.patients||[]);
    }).finally(()=>setLoading(false));
  };
  useEffect(()=>{fetchAll();},[]);

  useEffect(()=>{
    const h=loc.hash.replace('#','');
    if(h&&h!=='new-request=open') setTab(h);
    if(h==='new-request=open'){setForm(EMPTY);setError('');setShowNew(true);}
  },[loc.hash]);
  useEffect(()=>{
    const handler=()=>{setForm(EMPTY);setError('');setShowNew(true);};
    window.addEventListener('open-new-blood-request',handler);
    return ()=>window.removeEventListener('open-new-blood-request',handler);
  },[]);

  useEffect(()=>{
    if(!showNew) return;
    setSelectedBanks([]);
    setNearbyLoading(true);
    api.get('/blood-requests/nearby-blood-banks')
      .then(res=>setNearbyBanks(res.data?.bloodBanks||[]))
      .catch(()=>setNearbyBanks([]))
      .finally(()=>setNearbyLoading(false));
  },[showNew]);

  const toggleBank=(id)=>{
    setSelectedBanks(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);
  };

  const TAB_FILTERS={
    all:        r=>true,
    pending:    r=>r.status==='pending',
    'under-review': r=>r.status==='approved'&&r.crossMatch==='pending',
    approved:   r=>r.status==='approved',
    rejected:   r=>r.status==='rejected',
    emergency:  r=>r.priority==='Emergency',
    allocation: r=>r.status==='processing',
    dispatch:   r=>r.status==='dispatched',
    received:   r=>r.status==='delivered',
    cancelled:  r=>r.status==='cancelled',
  };

  const filtered=requests
    .filter(r=>(TAB_FILTERS[tab]||TAB_FILTERS.all)(r))
    .filter(r=>bgFilter==='all'||r.bloodGroup===bgFilter)
    .filter(r=>priFilter==='all'||r.priority===priFilter)
    .filter(r=>{
      if(!search) return true;
      const name=r.patient?.name||r.patientName||'';
      return name.toLowerCase().includes(search.toLowerCase())||r.bloodGroup?.includes(search.toUpperCase());
    });

  const counts={
    total:requests.length,
    pending:requests.filter(r=>r.status==='pending').length,
    approved:requests.filter(r=>r.status==='approved').length,
    emergency:requests.filter(r=>r.priority==='Emergency').length,
    dispatched:requests.filter(r=>r.status==='dispatched').length,
    delivered:requests.filter(r=>r.status==='delivered').length,
  };

  const set=(k,v)=>setForm(p=>({...p,[k]:v}));

  const handlePatientSelect=(id)=>{
    const p=patients.find(x=>x._id===id);
    setForm(f=>({...f,patientId:id,patientName:p?.fullName||f.patientName,patientAge:p?.age||f.patientAge,patientWard:p?.ward||f.patientWard}));
  };

  const handleSubmit=async(e)=>{
    e.preventDefault();
    setError('');setSaving(true);
    try{
      await api.post('/blood-requests',{...form,targetBloodBanks:selectedBanks});
      setShowNew(false);setForm(EMPTY);setSelectedBanks([]);
      showToast('Blood request submitted successfully!');
      fetchAll();
    }catch(err){setError(err.response?.data?.message||'Failed to submit request');}
    finally{setSaving(false);}
  };

  const cancelRequest=async(id)=>{
    const reason=window.prompt('Reason for cancelling this request?');
    if(reason===null) return;
    await api.patch(`/blood-requests/${id}/cancel`,{reason});
    showToast('Request cancelled');fetchAll();setSelected(null);
  };

  const confirmReceived=async(id)=>{
    const receivedBy=window.prompt('Who received the blood? (name)');
    if(!receivedBy) return;
    await api.patch(`/blood-requests/${id}/deliver`,{receivedBy});
    showToast('Marked as received');fetchAll();setSelected(null);
  };

  return(
    <div className="anim-up">
      {toast&&(
        <div className="toast">
          <div className="toast-icon"><CheckCircle size={18} color="var(--green-600)"/></div>
          <div style={{fontSize:14,fontWeight:600,color:'var(--slate-900)'}}>{toast}</div>
        </div>
      )}

      {/* Stat cards — admin-style colored top border */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:14,marginBottom:24}}>
        {[
          {label:'Total Requests', value:counts.total,     color:'var(--primary)'},
          {label:'Pending',        value:counts.pending,   color:'#D97706'},
          {label:'Approved',       value:counts.approved,  color:'var(--green-600)'},
          {label:'Emergency',      value:counts.emergency, color:'var(--red-600)'},
          {label:'Dispatched',     value:counts.dispatched,color:'#7C3AED'},
          {label:'Delivered',      value:counts.delivered, color:'var(--green-600)'},
        ].map(({label,value,color})=>(
          <div key={label} className="card" style={{padding:'16px 18px',borderTop:`3px solid ${color}`}}>
            <div style={{fontSize:26,fontWeight:800,fontFamily:'var(--font-disp)',color}}>{value}</div>
            <div style={{fontSize:12,color:'var(--slate-500)',marginTop:3}}>{label}</div>
          </div>
        ))}
      </div>

      <div className="page-hdr">
        <div><h1>Blood Requests</h1><p>Submit & track blood requests to blood banks</p></div>
        <button className="btn-primary" onClick={()=>{setForm(EMPTY);setError('');setShowNew(true);}}><Plus size={15}/>New Request</button>
      </div>

      {/* Pill-style tab navigation — admin style */}
      <div style={{display:'flex',gap:4,marginBottom:20,background:'var(--slate-100)',padding:4,borderRadius:'var(--r-sm)',width:'fit-content',flexWrap:'wrap'}}>
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)} style={{
            padding:'7px 14px',borderRadius:'var(--r-sm)',border:'none',cursor:'pointer',
            fontSize:12,fontWeight:600,
            background: tab===t.key ? '#fff' : 'transparent',
            color: tab===t.key ? 'var(--slate-900)' : 'var(--slate-500)',
            boxShadow: tab===t.key ? 'var(--sh-sm)' : 'none',
          }}>{t.label}</button>
        ))}
      </div>

      <div className="card" style={{marginBottom:20}}>
        <div className="card-body" style={{padding:'14px 20px'}}>
          <div className="filters-bar">
            <div className="search-wrap">
              <Search size={14}/>
              <input className="search-inp" placeholder="Search by patient, blood group..." value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            <select className="filter-sel" value={bgFilter} onChange={e=>setBgFilter(e.target.value)}>
              <option value="all">All Blood Groups</option>
              {BG.map(g=><option key={g}>{g}</option>)}
            </select>
            <select className="filter-sel" value={priFilter} onChange={e=>setPriFilter(e.target.value)}>
              <option value="all">All Priorities</option>
              {PRIORITIES.map(p=><option key={p}>{p}</option>)}
            </select>
            <span style={{marginLeft:'auto',fontSize:13,color:'var(--slate-500)'}}>{filtered.length} requests</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead><tr>
              <th>Patient</th><th>Blood</th><th>Units</th><th>Priority</th><th>Cross Match</th><th>Date</th><th>Status</th><th></th>
            </tr></thead>
            <tbody>
              {loading&&<tr><td colSpan={8}><div className="empty-state"><p>Loading...</p></div></td></tr>}
              {!loading&&filtered.map(r=>{
                const sc=STATUS_CFG[r.status]||{};
                const pc=PRIORITY_CFG[r.priority]||{};
                return(
                  <tr key={r._id} style={{background:r.priority==='Emergency'&&r.status==='pending'?'#FFF5F5':''}}>
                    <td><div className="td-name">{r.patient?.name||r.patientName||'—'}</div></td>
                    <td><span className="blood-badge">{r.bloodGroup}</span></td>
                    <td style={{fontWeight:800,fontSize:15,color:'var(--primary)'}}>{r.unitsRequired}</td>
                    <td><span style={{fontSize:11,fontWeight:700,padding:'3px 8px',borderRadius:4,background:pc.bg,color:pc.color}}>{r.priority==='Emergency'?'🚨 ':r.priority==='Urgent'?'⚡ ':''}{r.priority}</span></td>
                    <td style={{fontSize:12,color:r.crossMatch==='passed'?'var(--green-600)':r.crossMatch==='failed'?'var(--red-600)':'var(--slate-400)'}}>{r.crossMatch==='pending'?'—':r.crossMatch}</td>
                    <td style={{fontSize:12,color:'var(--slate-400)'}}>{new Date(r.createdAt).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</td>
                    <td><span style={{fontSize:11,fontWeight:600,padding:'3px 10px',borderRadius:100,background:sc.bg,color:sc.color}}>{sc.label}</span></td>
                    <td><button className="action-btn blue" onClick={()=>setSelected(r)}><Eye size={13}/></button></td>
                  </tr>
                );
              })}
              {!loading&&filtered.length===0&&(
                <tr><td colSpan={8}><div className="empty-state"><Droplets size={32} style={{opacity:.3,marginBottom:8}}/><p>No requests in this view</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="pagination"><div className="page-info">Showing {filtered.length} of {requests.length} requests</div></div>
      </div>

      {selected&&(
        <div className="modal-overlay" onClick={()=>setSelected(null)}>
          <div className="modal" style={{maxWidth:580}} onClick={e=>e.stopPropagation()}>
            <div className="modal-hdr">
              <div className="modal-title">Request Details — {selected.bloodGroup}</div>
              <button className="action-btn" onClick={()=>setSelected(null)}><X size={14}/></button>
            </div>
            <div className="modal-body">
              <div style={{display:'flex',gap:10,marginBottom:20,flexWrap:'wrap'}}>
                <span style={{fontSize:12,fontWeight:700,padding:'4px 12px',borderRadius:100,background:PRIORITY_CFG[selected.priority]?.bg,color:PRIORITY_CFG[selected.priority]?.color}}>{selected.priority}</span>
                <span style={{fontSize:12,fontWeight:600,padding:'4px 12px',borderRadius:100,background:STATUS_CFG[selected.status]?.bg,color:STATUS_CFG[selected.status]?.color}}>{STATUS_CFG[selected.status]?.label}</span>
                <span className="blood-badge">{selected.bloodGroup}</span>
                <span style={{fontSize:12,fontWeight:700,color:'var(--red-600)',background:'var(--red-100)',padding:'4px 12px',borderRadius:100}}>{selected.unitsRequired} Units</span>
              </div>

              <div className="detail-row">
                <div className="detail-field"><div className="detail-label">Patient</div><div className="detail-value">{selected.patient?.name||selected.patientName||'—'}</div></div>
                <div className="detail-field"><div className="detail-label">Requested By</div><div className="detail-value">{selected.requestedBy||'—'}</div></div>
              </div>

              {selected.crossMatch!=='pending'&&(
                <div style={{background:'var(--slate-50)',borderRadius:8,padding:12,marginBottom:12,fontSize:13,display:'flex',alignItems:'center',gap:8}}>
                  <FlaskConical size={14}/> <b>Cross Match:</b> {selected.crossMatch}
                </div>
              )}
              {selected.allocatedBags?.length>0&&(
                <div style={{background:'var(--primary-50)',borderRadius:8,padding:12,marginBottom:12,fontSize:13,display:'flex',alignItems:'center',gap:8}}>
                  <Package size={14}/> <b>Allocated Bags:</b> {selected.allocatedBags.map(b=>b.bagId).join(', ')}
                </div>
              )}
              {selected.dispatchDriver&&(
                <div style={{background:'var(--slate-50)',borderRadius:8,padding:12,marginBottom:12,fontSize:13,display:'flex',alignItems:'center',gap:8}}>
                  <Truck size={14}/> <b>Dispatch:</b> Driver {selected.dispatchDriver}, {selected.dispatchVehicle} {selected.dispatchETA&&`— ETA ${new Date(selected.dispatchETA).toLocaleString('en-GB')}`}
                </div>
              )}
              {selected.receivedBy&&(
                <div style={{background:'var(--green-50)',borderRadius:8,padding:12,marginBottom:12,fontSize:13}}>
                  <b>Received By:</b> {selected.receivedBy}
                </div>
              )}
              {selected.notes&&(
                <div style={{background:'var(--slate-50)',borderRadius:'var(--r-sm)',padding:'12px 14px',fontSize:13,color:'var(--slate-600)',marginTop:4}}>
                  <strong>Notes:</strong> {selected.notes}
                </div>
              )}
              {selected.targetBloodBanks?.length>0&&(
                <div style={{background:'var(--slate-50)',borderRadius:'var(--r-sm)',padding:'12px 14px',fontSize:13,color:'var(--slate-600)',marginTop:12}}>
                  <strong>Sent To:</strong> {selected.targetBloodBanks.map(b=>b.bankName).join(', ')}
                </div>
              )}
            </div>
            <div className="modal-footer">
              {selected.status==='dispatched'&&<button className="btn-primary" onClick={()=>confirmReceived(selected._id)}><CheckCircle size={14}/> Confirm Received</button>}
              {['pending','approved','processing'].includes(selected.status)&&<button className="btn-secondary" style={{color:'var(--red-600)'}} onClick={()=>cancelRequest(selected._id)}><Ban size={14}/> Cancel Request</button>}
              <button className="btn-secondary" onClick={()=>setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showNew&&(
        <div className="modal-overlay" onClick={()=>setShowNew(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-hdr">
              <div className="modal-title">Submit Blood Request</div>
              <button className="action-btn" onClick={()=>setShowNew(false)}><X size={14}/></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error&&<div style={{background:'#FFF1F3',border:'1px solid #FEE2E8',borderRadius:8,padding:'10px 14px',marginBottom:14,fontSize:13,color:'var(--primary-d)'}}>{error}</div>}
                <div className="form-group">
                  <label className="form-label">Select Registered Patient (optional)</label>
                  <select className="form-input" value={form.patientId} onChange={e=>handlePatientSelect(e.target.value)}>
                    <option value="">— Not linked to a patient record —</option>
                    {patients.map(p=><option key={p._id} value={p._id}>{p.fullName}{p.ward?` (${p.ward})`:''}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Patient Name</label><input className="form-input" placeholder="Patient full name" value={form.patientName} onChange={e=>set('patientName',e.target.value)} required/></div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:16}}>
                  <div className="form-group" style={{margin:0}}><label className="form-label">Blood Group</label><select className="form-input" value={form.bloodGroup} onChange={e=>set('bloodGroup',e.target.value)} required><option value="">Select</option>{BG.map(g=><option key={g}>{g}</option>)}</select></div>
                  <div className="form-group" style={{margin:0}}><label className="form-label">Units</label><input type="number" className="form-input" placeholder="e.g. 2" min="1" value={form.unitsRequired} onChange={e=>set('unitsRequired',e.target.value)} required/></div>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <div style={{display:'flex',gap:10}}>
                    {PRIORITIES.map(p=>(
                      <label
                        key={p}
                        style={{
                          display:'flex',alignItems:'center',gap:6,cursor:'pointer',flex:1,justifyContent:'center',
                          padding:'9px 14px',borderRadius:'var(--r-sm)',fontSize:13,fontWeight:600,
                          border:`1.5px solid ${form.priority===p?'var(--primary)':'var(--slate-200)'}`,
                          background:form.priority===p?'var(--primary-50)':'#fff',
                          color:form.priority===p?'var(--primary)':'var(--slate-600)',
                        }}
                      >
                        <input type="radio" name="priority" value={p} checked={form.priority===p} onChange={e=>set('priority',e.target.value)} style={{display:'none'}}/>
                        {p==='Emergency'?'🚨 ':p==='Urgent'?'⚡ ':''}{p}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="form-group"><label className="form-label">Requested By (doctor)</label><input className="form-input" value={form.requestedBy} onChange={e=>set('requestedBy',e.target.value)}/></div>
                <div className="form-group"><label className="form-label">Notes (optional)</label><input className="form-input" placeholder="Additional information..." value={form.notes} onChange={e=>set('notes',e.target.value)}/></div>

                <div className="form-group">
                  <label className="form-label">Send To Blood Banks (nearest first, optional)</label>
                  <div style={{fontSize:12,color:'var(--slate-500)',marginBottom:8}}>
                    {selectedBanks.length===0?'Leave unselected to keep this request open to all blood banks.':`${selectedBanks.length} bank${selectedBanks.length>1?'s':''} selected.`}
                  </div>
                  <div style={{maxHeight:180,overflowY:'auto',border:'1px solid var(--slate-200)',borderRadius:'var(--r-sm)'}}>
                    {nearbyLoading&&<div style={{padding:14,fontSize:13,color:'var(--slate-500)'}}>Finding nearby blood banks…</div>}
                    {!nearbyLoading&&nearbyBanks.length===0&&<div style={{padding:14,fontSize:13,color:'var(--slate-500)'}}>No approved blood banks found.</div>}
                    {!nearbyLoading&&nearbyBanks.map(b=>(
                      <label key={b._id} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',borderBottom:'1px solid var(--slate-100)',cursor:'pointer',fontSize:13}}>
                        <input type="checkbox" checked={selectedBanks.includes(b._id)} onChange={()=>toggleBank(b._id)}/>
                        <span style={{flex:1,fontWeight:600}}>{b.bankName}</span>
                        <span style={{color:'var(--slate-400)'}}>{b.district||'—'}</span>
                        <span style={{fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:100,background:b.sameDistrict?'var(--green-100)':'var(--slate-100)',color:b.sameDistrict?'var(--green-600)':'var(--slate-500)'}}>
                          {b.distanceKm===null?'—':b.distanceKm===0?'Same district':`${b.distanceKm} km`}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={()=>setShowNew(false)}>Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary"><Droplets size={14}/>{saving?'Submitting...':'Submit Request'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}