import React,{useState,useEffect} from 'react';
import {useLocation} from 'react-router-dom';
import {Handshake,Plus,X,Users,CheckCircle,XCircle,Droplets,Ban} from 'lucide-react';
import api from '../utils/api';

const BG=['A+','A-','B+','B-','AB+','AB-','O+','O-'];

export default function HospitalPartnershipsPage(){
  const loc=useLocation();
  const [partnerships,setPartnerships]=useState([]);
  const [available,setAvailable]=useState([]);
  const [sharedRequests,setSharedRequests]=useState([]);
  const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState('dashboard');
  const [modal,setModal]=useState(null);
  const [newForm,setNewForm]=useState({partnerHospitalId:'',agreementStartDate:'',agreementEndDate:'',contactPerson:{name:'',designation:'',email:'',phone:''}});
  const [reqForm,setReqForm]=useState({toHospitalId:'',bloodGroup:'',units:'',priority:'Normal',reason:''});
  const [error,setError]=useState('');

  const fetchAll=()=>{
    setLoading(true);
    Promise.all([
      api.get('/hospital-partnerships').catch(()=>({data:{partnerships:[]}})),
      api.get('/hospital-partnerships/available-hospitals').catch(()=>({data:{hospitals:[]}})),
      api.get('/hospital-partnerships/shared-requests').catch(()=>({data:{requests:[]}})),
    ]).then(([r1,r2,r3])=>{
      setPartnerships(r1.data?.partnerships||[]);
      setAvailable(r2.data?.hospitals||[]);
      setSharedRequests(r3.data?.requests||[]);
    }).finally(()=>setLoading(false));
  };
  useEffect(()=>{fetchAll();},[]);

  useEffect(()=>{
    const h=loc.hash.replace('#','');
    if(h&&h!=='add-partnership=open') setTab(h);
    if(h==='add-partnership=open') openAdd();
  },[loc.hash]);
  useEffect(()=>{
    const handler=()=>openAdd();
    window.addEventListener('open-add-partnership',handler);
    return ()=>window.removeEventListener('open-add-partnership',handler);
  },[]);

  const active=partnerships.filter(p=>p.status==='active');
  const pendingIncoming=partnerships.filter(p=>p.status==='pending'&&!p.isRequester);
  const pendingOutgoing=partnerships.filter(p=>p.status==='pending'&&p.isRequester);
  const expired=partnerships.filter(p=>['expired','terminated','rejected'].includes(p.status));

  const counts={total:partnerships.length,active:active.length,pending:pendingIncoming.length+pendingOutgoing.length,shared:sharedRequests.length};

  const otherHospital=(p)=>p.isRequester?p.partnerHospital:p.requestingHospital;

  const openAdd=()=>{setNewForm({partnerHospitalId:'',agreementStartDate:'',agreementEndDate:'',contactPerson:{name:'',designation:'',email:'',phone:''}});setError('');setModal('new');};
  const submitAdd=async()=>{
    if(!newForm.partnerHospitalId){setError('Select a hospital.');return;}
    try{await api.post('/hospital-partnerships',newForm);setModal(null);fetchAll();}
    catch(err){setError(err.response?.data?.message||'Failed to send request');}
  };

  const respond=async(id,decision)=>{await api.patch(`/hospital-partnerships/${id}/respond`,{decision});fetchAll();};
  const terminate=async(id)=>{if(window.confirm('Terminate this partnership?')){await api.patch(`/hospital-partnerships/${id}/terminate`);fetchAll();}};

  const submitShare=async()=>{
    if(!reqForm.toHospitalId||!reqForm.bloodGroup||!reqForm.units){setError('Fill all required fields.');return;}
    try{await api.post('/hospital-partnerships/shared-requests',reqForm);setModal(null);fetchAll();}
    catch(err){setError(err.response?.data?.message||'Failed to send request');}
  };
  const respondShare=async(id,decision)=>{await api.patch(`/hospital-partnerships/shared-requests/${id}/respond`,{decision});fetchAll();};
  const completeShare=async(id)=>{await api.patch(`/hospital-partnerships/shared-requests/${id}/complete`);fetchAll();};

  return(
    <div className="anim-up">
      <div className="page-hdr">
        <div><h1>Hospital Partnerships</h1><p>Blood-sharing network between partner hospitals</p></div>
        <button className="btn-primary" onClick={openAdd}><Plus size={15}/>Add Partnership</button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:22}}>
        {[
          {label:'Total Partnerships',value:counts.total,color:'var(--primary)'},
          {label:'Active',value:counts.active,color:'var(--green-600)'},
          {label:'Pending',value:counts.pending,color:'#D97706'},
          {label:'Shared Blood Requests',value:counts.shared,color:'#7C3AED'},
        ].map(({label,value,color})=>(
          <div key={label} className="card" style={{padding:'16px 20px'}}>
            <div style={{fontSize:26,fontWeight:800,fontFamily:'var(--font-disp)',color,marginBottom:3}}>{value}</div>
            <div style={{fontSize:13,color:'var(--slate-500)'}}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{display:'flex',gap:4,marginBottom:20,background:'var(--slate-100)',padding:4,borderRadius:'var(--r-sm)',width:'fit-content',flexWrap:'wrap'}}>
        {[{k:'dashboard',l:'Partner Hospitals'},{k:'requests',l:'Partnership Requests'},{k:'shared',l:'Shared Blood Requests'},{k:'expired',l:'Expired/Rejected'}].map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)} style={{
            padding:'7px 14px',borderRadius:'var(--r-sm)',border:'none',cursor:'pointer',fontSize:12.5,fontWeight:600,
            background:tab===t.k?'#fff':'transparent',color:tab===t.k?'var(--slate-900)':'var(--slate-500)',
            boxShadow:tab===t.k?'var(--sh-sm)':'none',
          }}>{t.l}</button>
        ))}
      </div>

      {tab==='dashboard'&&(
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
          {loading&&<div className="card"><div className="empty-state"><p>Loading...</p></div></div>}
          {!loading&&active.map(p=>{
            const h=otherHospital(p);
            return(
              <div key={p._id} className="card" style={{padding:'18px 20px'}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                  <div style={{width:40,height:40,borderRadius:10,background:'var(--green-100)',color:'var(--green-600)',display:'flex',alignItems:'center',justifyContent:'center'}}><Handshake size={18}/></div>
                  <div>
                    <div style={{fontSize:14,fontWeight:700}}>{h?.hospitalName}</div>
                    <div style={{fontSize:11,color:'var(--slate-400)'}}>{h?.district}</div>
                  </div>
                </div>
                <span className="status-badge s-fulfilled">Active</span>
                <div style={{marginTop:10,display:'flex',gap:6}}>
                  <button className="btn-secondary" style={{fontSize:12,padding:'6px 12px'}} onClick={()=>{setReqForm({toHospitalId:h._id,bloodGroup:'',units:'',priority:'Normal',reason:''});setError('');setModal('share');}}><Droplets size={12}/> Request Blood</button>
                  <button className="action-btn red" onClick={()=>terminate(p._id)}><Ban size={12}/></button>
                </div>
              </div>
            );
          })}
          {!loading&&active.length===0&&(
            <div className="card" style={{gridColumn:'span 3'}}><div className="empty-state"><Handshake size={32} style={{opacity:.3,marginBottom:8}}/><p>No active partnerships yet</p></div></div>
          )}
        </div>
      )}

      {tab==='requests'&&(
        <div className="card">
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Hospital</th><th>Direction</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {[...pendingIncoming,...pendingOutgoing].map(p=>{
                  const h=otherHospital(p);
                  return(
                    <tr key={p._id}>
                      <td><div className="td-name">{h?.hospitalName}</div></td>
                      <td style={{fontSize:12}}>{p.isRequester?'You sent':'Received'}</td>
                      <td><span className="status-badge s-pending">Pending</span></td>
                      <td>
                        {!p.isRequester&&(
                          <div style={{display:'flex',gap:4}}>
                            <button className="action-btn green" onClick={()=>respond(p._id,'active')}><CheckCircle size={12}/></button>
                            <button className="action-btn red" onClick={()=>respond(p._id,'rejected')}><XCircle size={12}/></button>
                          </div>
                        )}
                        {p.isRequester&&<span style={{fontSize:11,color:'var(--slate-400)'}}>Awaiting response</span>}
                      </td>
                    </tr>
                  );
                })}
                {pendingIncoming.length+pendingOutgoing.length===0&&(
                  <tr><td colSpan={4}><div className="empty-state"><Users size={32} style={{opacity:.3,marginBottom:8}}/><p>No pending partnership requests</p></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab==='shared'&&(
        <div className="card">
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Direction</th><th>Hospital</th><th>Blood Group</th><th>Units</th><th>Priority</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {sharedRequests.map(r=>(
                  <tr key={r._id}>
                    <td style={{fontSize:12}}>{r.isSender?'Sent to':'Received from'}</td>
                    <td><div className="td-name">{r.isSender?r.toHospital?.hospitalName:r.fromHospital?.hospitalName}</div></td>
                    <td><span className="blood-badge">{r.bloodGroup}</span></td>
                    <td style={{fontWeight:700}}>{r.units}</td>
                    <td><span className={`priority-badge ${r.priority==='Emergency'?'p-emergency':r.priority==='Urgent'?'p-urgent':'p-normal'}`}>{r.priority}</span></td>
                    <td><span className={`status-badge ${r.status==='completed'?'s-fulfilled':r.status==='rejected'?'s-rejected':r.status==='accepted'?'s-processing':'s-pending'}`}>{r.status}</span></td>
                    <td>
                      {!r.isSender&&r.status==='pending'&&(
                        <div style={{display:'flex',gap:4}}>
                          <button className="action-btn green" onClick={()=>respondShare(r._id,'accepted')}><CheckCircle size={12}/></button>
                          <button className="action-btn red" onClick={()=>respondShare(r._id,'rejected')}><XCircle size={12}/></button>
                        </div>
                      )}
                      {r.status==='accepted'&&(
                        <button className="action-btn green" onClick={()=>completeShare(r._id)}><CheckCircle size={12}/></button>
                      )}
                    </td>
                  </tr>
                ))}
                {sharedRequests.length===0&&(
                  <tr><td colSpan={7}><div className="empty-state"><Droplets size={32} style={{opacity:.3,marginBottom:8}}/><p>No shared blood requests yet</p></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab==='expired'&&(
        <div className="card">
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Hospital</th><th>Status</th></tr></thead>
              <tbody>
                {expired.map(p=>(
                  <tr key={p._id}>
                    <td><div className="td-name">{otherHospital(p)?.hospitalName}</div></td>
                    <td><span className="status-badge s-rejected">{p.status}</span></td>
                  </tr>
                ))}
                {expired.length===0&&<tr><td colSpan={2}><div className="empty-state"><p>None yet</p></div></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal==='new'&&(
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-hdr"><div className="modal-title">Add Partnership</div><button className="action-btn" onClick={()=>setModal(null)}><X size={14}/></button></div>
            <div className="modal-body">
              {error&&<div style={{background:'#FFF1F3',border:'1px solid #FEE2E8',borderRadius:8,padding:'10px 14px',marginBottom:14,fontSize:13,color:'var(--primary-d)'}}>{error}</div>}
              <div className="form-group">
                <label className="form-label">Partner Hospital</label>
                <select className="form-input" value={newForm.partnerHospitalId} onChange={e=>setNewForm({...newForm,partnerHospitalId:e.target.value})}>
                  <option value="">Select</option>
                  {available.map(h=><option key={h._id} value={h._id}>{h.hospitalName} ({h.district})</option>)}
                </select>
                {available.length===0&&<p style={{fontSize:12,color:'var(--slate-400)',marginTop:6}}>No other hospitals available to partner with.</p>}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div className="form-group"><label className="form-label">Agreement Start</label><input type="date" className="form-input" value={newForm.agreementStartDate} onChange={e=>setNewForm({...newForm,agreementStartDate:e.target.value})}/></div>
                <div className="form-group"><label className="form-label">Agreement End</label><input type="date" className="form-input" value={newForm.agreementEndDate} onChange={e=>setNewForm({...newForm,agreementEndDate:e.target.value})}/></div>
              </div>
              <div className="form-group"><label className="form-label">Contact Person Name</label><input className="form-input" value={newForm.contactPerson.name} onChange={e=>setNewForm({...newForm,contactPerson:{...newForm.contactPerson,name:e.target.value}})}/></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div className="form-group"><label className="form-label">Email</label><input className="form-input" value={newForm.contactPerson.email} onChange={e=>setNewForm({...newForm,contactPerson:{...newForm.contactPerson,email:e.target.value}})}/></div>
                <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={newForm.contactPerson.phone} onChange={e=>setNewForm({...newForm,contactPerson:{...newForm.contactPerson,phone:e.target.value}})}/></div>
              </div>
            </div>
            <div className="modal-footer"><button className="btn-secondary" onClick={()=>setModal(null)}>Cancel</button><button className="btn-primary" onClick={submitAdd}>Send Request</button></div>
          </div>
        </div>
      )}

      {modal==='share'&&(
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-hdr"><div className="modal-title">Request Blood from Partner</div><button className="action-btn" onClick={()=>setModal(null)}><X size={14}/></button></div>
            <div className="modal-body">
              {error&&<div style={{background:'#FFF1F3',border:'1px solid #FEE2E8',borderRadius:8,padding:'10px 14px',marginBottom:14,fontSize:13,color:'var(--primary-d)'}}>{error}</div>}
              <div className="form-group">
                <label className="form-label">Partner Hospital</label>
                <select className="form-input" value={reqForm.toHospitalId} onChange={e=>setReqForm({...reqForm,toHospitalId:e.target.value})}>
                  <option value="">Select</option>
                  {active.map(p=>{const h=otherHospital(p);return <option key={h._id} value={h._id}>{h.hospitalName}</option>;})}
                </select>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div className="form-group"><label className="form-label">Blood Group</label><select className="form-input" value={reqForm.bloodGroup} onChange={e=>setReqForm({...reqForm,bloodGroup:e.target.value})}><option value="">Select</option>{BG.map(g=><option key={g}>{g}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Units</label><input type="number" className="form-input" value={reqForm.units} onChange={e=>setReqForm({...reqForm,units:e.target.value})}/></div>
              </div>
              <div className="form-group"><label className="form-label">Priority</label><select className="form-input" value={reqForm.priority} onChange={e=>setReqForm({...reqForm,priority:e.target.value})}><option>Normal</option><option>Urgent</option><option>Emergency</option></select></div>
              <div className="form-group"><label className="form-label">Reason</label><textarea className="form-input" rows={2} value={reqForm.reason} onChange={e=>setReqForm({...reqForm,reason:e.target.value})}/></div>
            </div>
            <div className="modal-footer"><button className="btn-secondary" onClick={()=>setModal(null)}>Cancel</button><button className="btn-primary" onClick={submitShare}><Droplets size={13}/> Send Request</button></div>
          </div>
        </div>
      )}
    </div>
  );
}