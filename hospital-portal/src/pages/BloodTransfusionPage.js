import React,{useState,useEffect} from 'react';
import {useLocation} from 'react-router-dom';
import {Droplets,Plus,X,Play,CheckCircle,AlertTriangle,Ban,Activity} from 'lucide-react';
import api from '../utils/api';

const EMPTY_NEW={requestId:'',scheduledDate:''};
const EMPTY_START={vitalsBefore:{bp:'',pulse:'',temp:''},administeredBy:''};
const EMPTY_COMPLETE={vitalsAfter:{bp:'',pulse:'',temp:''},notes:''};
const EMPTY_REACTION={type:'',severity:'Mild',actionTaken:''};
const EMPTY_FOLLOWUP={required:true,notes:'',followUpDate:'',completed:false};

export default function BloodTransfusionPage(){
  const loc=useLocation();
  const [list,setList]=useState([]);
  const [eligible,setEligible]=useState([]);
  const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState('scheduled');
  const [modal,setModal]=useState(null);
  const [selected,setSelected]=useState(null);
  const [newForm,setNewForm]=useState(EMPTY_NEW);
  const [startForm,setStartForm]=useState(EMPTY_START);
  const [completeForm,setCompleteForm]=useState(EMPTY_COMPLETE);
  const [reactionForm,setReactionForm]=useState(EMPTY_REACTION);
  const [followUpForm,setFollowUpForm]=useState(EMPTY_FOLLOWUP);
  const [error,setError]=useState('');

  const fetchAll=()=>{
    setLoading(true);
    Promise.all([
      api.get('/hospital-transfusions').catch(()=>({data:{transfusions:[]}})),
      api.get('/hospital-transfusions/eligible-requests').catch(()=>({data:{requests:[]}})),
    ]).then(([r1,r2])=>{
      setList(r1.data?.transfusions||[]);
      setEligible(r2.data?.requests||[]);
    }).finally(()=>setLoading(false));
  };
  useEffect(()=>{fetchAll();},[]);

  useEffect(()=>{
    const h=loc.hash.replace('#','');
    if(h) setTab(h);
  },[loc.hash]);

  const filtered={
    scheduled:list.filter(t=>t.status==='Scheduled'),
    ongoing:list.filter(t=>t.status==='Ongoing'),
    completed:list.filter(t=>t.status==='Completed'),
    reactions:list.filter(t=>t.adverseReaction?.occurred),
    followup:list.filter(t=>t.followUp?.required&&!t.followUp?.completed),
  }[tab]||list;

  const counts={
    scheduled:list.filter(t=>t.status==='Scheduled').length,
    ongoing:list.filter(t=>t.status==='Ongoing').length,
    completed:list.filter(t=>t.status==='Completed').length,
    reactions:list.filter(t=>t.adverseReaction?.occurred).length,
  };

  const openSchedule=()=>{setNewForm(EMPTY_NEW);setError('');setModal('new');};
  const submitSchedule=async()=>{
    if(!newForm.requestId||!newForm.scheduledDate){setError('Select a request and date.');return;}
    const req=eligible.find(r=>r._id===newForm.requestId);
    try{
      await api.post('/hospital-transfusions',{
        bloodRequestId:req._id,patientId:req.patient,patientName:req.patientName,
        bloodGroup:req.bloodGroup,units:req.unitsRequired,scheduledDate:newForm.scheduledDate,
      });
      setModal(null);fetchAll();
    }catch(err){setError(err.response?.data?.message||'Failed to schedule');}
  };

  const openStart=(t)=>{setSelected(t);setStartForm(EMPTY_START);setModal('start');};
  const submitStart=async()=>{await api.patch(`/hospital-transfusions/${selected._id}/start`,startForm);setModal(null);fetchAll();};

  const openComplete=(t)=>{setSelected(t);setCompleteForm(EMPTY_COMPLETE);setModal('complete');};
  const submitComplete=async()=>{await api.patch(`/hospital-transfusions/${selected._id}/complete`,completeForm);setModal(null);fetchAll();};

  const openReaction=(t)=>{setSelected(t);setReactionForm(EMPTY_REACTION);setModal('reaction');};
  const submitReaction=async()=>{await api.patch(`/hospital-transfusions/${selected._id}/adverse-reaction`,reactionForm);setModal(null);fetchAll();};

  const openFollowUp=(t)=>{setSelected(t);setFollowUpForm(t.followUp?.required?t.followUp:EMPTY_FOLLOWUP);setModal('followup');};
  const submitFollowUp=async()=>{await api.patch(`/hospital-transfusions/${selected._id}/follow-up`,followUpForm);setModal(null);fetchAll();};

  const cancel=async(id)=>{if(window.confirm('Cancel this transfusion?')){await api.patch(`/hospital-transfusions/${id}/cancel`);fetchAll();}};

  return(
    <div className="anim-up">
      <div className="page-hdr">
        <div><h1>Blood Transfusion</h1><p>Schedule and track blood transfusion administration to patients</p></div>
        <button className="btn-primary" onClick={openSchedule}><Plus size={15}/>Schedule Transfusion</button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:22}}>
        {[
          {label:'Scheduled',value:counts.scheduled,color:'#D97706'},
          {label:'Ongoing',value:counts.ongoing,color:'var(--primary)'},
          {label:'Completed',value:counts.completed,color:'var(--green-600)'},
          {label:'Adverse Reactions',value:counts.reactions,color:'var(--red-600)'},
        ].map(({label,value,color})=>(
          <div key={label} className="card" style={{padding:'16px 20px'}}>
            <div style={{fontSize:26,fontWeight:800,fontFamily:'var(--font-disp)',color,marginBottom:3}}>{value}</div>
            <div style={{fontSize:13,color:'var(--slate-500)'}}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{display:'flex',gap:4,marginBottom:20,background:'var(--slate-100)',padding:4,borderRadius:'var(--r-sm)',width:'fit-content',flexWrap:'wrap'}}>
        {[{k:'scheduled',l:'Scheduled'},{k:'ongoing',l:'Ongoing'},{k:'completed',l:'Completed'},{k:'reactions',l:'Adverse Reactions'},{k:'followup',l:'Follow-up'}].map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)} style={{
            padding:'7px 14px',borderRadius:'var(--r-sm)',border:'none',cursor:'pointer',fontSize:12.5,fontWeight:600,
            background:tab===t.k?'#fff':'transparent',color:tab===t.k?'var(--slate-900)':'var(--slate-500)',
            boxShadow:tab===t.k?'var(--sh-sm)':'none',
          }}>{t.l}</button>
        ))}
      </div>

      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Patient</th><th>Blood Group</th><th>Units</th><th>Scheduled</th><th>Status</th><th>Reaction</th><th></th></tr></thead>
            <tbody>
              {loading&&<tr><td colSpan={7}><div className="empty-state"><p>Loading...</p></div></td></tr>}
              {!loading&&filtered.map(t=>(
                <tr key={t._id}>
                  <td><div className="td-name">{t.patientName||'—'}</div></td>
                  <td><span className="blood-badge">{t.bloodGroup}</span></td>
                  <td style={{fontWeight:700}}>{t.units}</td>
                  <td style={{fontSize:12}}>{new Date(t.scheduledDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}</td>
                  <td><span className={`status-badge ${t.status==='Completed'?'s-fulfilled':t.status==='Cancelled'?'s-rejected':t.status==='Ongoing'?'s-processing':'s-pending'}`}>{t.status}</span></td>
                  <td>{t.adverseReaction?.occurred?<span style={{fontSize:11,color:'var(--red-600)',fontWeight:700}}>⚠️ {t.adverseReaction.severity}</span>:'—'}</td>
                  <td>
                    <div style={{display:'flex',gap:4}}>
                      {t.status==='Scheduled'&&<>
                        <button className="action-btn green" title="Start" onClick={()=>openStart(t)}><Play size={12}/></button>
                        <button className="action-btn red" title="Cancel" onClick={()=>cancel(t._id)}><Ban size={12}/></button>
                      </>}
                      {t.status==='Ongoing'&&<>
                        <button className="action-btn green" title="Complete" onClick={()=>openComplete(t)}><CheckCircle size={12}/></button>
                        <button className="action-btn" title="Report Reaction" onClick={()=>openReaction(t)}><AlertTriangle size={12}/></button>
                      </>}
                      {t.status==='Completed'&&(
                        <button className="action-btn blue" title="Follow-up" onClick={()=>openFollowUp(t)}><Activity size={12}/></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading&&filtered.length===0&&(
                <tr><td colSpan={7}><div className="empty-state"><Droplets size={32} style={{opacity:.3,marginBottom:8}}/><p>No transfusions in this view</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal==='new'&&(
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-hdr"><div className="modal-title">Schedule Transfusion</div><button className="action-btn" onClick={()=>setModal(null)}><X size={14}/></button></div>
            <div className="modal-body">
              {error&&<div style={{background:'#FFF1F3',border:'1px solid #FEE2E8',borderRadius:8,padding:'10px 14px',marginBottom:14,fontSize:13,color:'var(--primary-d)'}}>{error}</div>}
              <div className="form-group">
                <label className="form-label">Delivered Blood Request</label>
                <select className="form-input" value={newForm.requestId} onChange={e=>setNewForm({...newForm,requestId:e.target.value})}>
                  <option value="">Select</option>
                  {eligible.map(r=><option key={r._id} value={r._id}>{r.patientName||'Unnamed'} — {r.bloodGroup} ({r.unitsRequired} units)</option>)}
                </select>
                {eligible.length===0&&<p style={{fontSize:12,color:'var(--slate-400)',marginTop:6}}>No delivered blood requests available to schedule yet.</p>}
              </div>
              <div className="form-group"><label className="form-label">Scheduled Date & Time</label><input type="datetime-local" className="form-input" value={newForm.scheduledDate} onChange={e=>setNewForm({...newForm,scheduledDate:e.target.value})}/></div>
            </div>
            <div className="modal-footer"><button className="btn-secondary" onClick={()=>setModal(null)}>Cancel</button><button className="btn-primary" onClick={submitSchedule}>Schedule</button></div>
          </div>
        </div>
      )}

      {modal==='start'&&selected&&(
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-hdr"><div className="modal-title">Start Transfusion — {selected.patientName}</div><button className="action-btn" onClick={()=>setModal(null)}><X size={14}/></button></div>
            <div className="modal-body">
              <div style={{fontSize:12,fontWeight:700,color:'var(--slate-500)',marginBottom:8}}>Vitals Before</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:14}}>
                <div className="form-group" style={{margin:0}}><label className="form-label">BP</label><input className="form-input" placeholder="120/80" value={startForm.vitalsBefore.bp} onChange={e=>setStartForm({...startForm,vitalsBefore:{...startForm.vitalsBefore,bp:e.target.value}})}/></div>
                <div className="form-group" style={{margin:0}}><label className="form-label">Pulse</label><input className="form-input" value={startForm.vitalsBefore.pulse} onChange={e=>setStartForm({...startForm,vitalsBefore:{...startForm.vitalsBefore,pulse:e.target.value}})}/></div>
                <div className="form-group" style={{margin:0}}><label className="form-label">Temp</label><input className="form-input" value={startForm.vitalsBefore.temp} onChange={e=>setStartForm({...startForm,vitalsBefore:{...startForm.vitalsBefore,temp:e.target.value}})}/></div>
              </div>
              <div className="form-group"><label className="form-label">Administered By</label><input className="form-input" value={startForm.administeredBy} onChange={e=>setStartForm({...startForm,administeredBy:e.target.value})}/></div>
            </div>
            <div className="modal-footer"><button className="btn-secondary" onClick={()=>setModal(null)}>Cancel</button><button className="btn-primary" onClick={submitStart}><Play size={13}/> Start</button></div>
          </div>
        </div>
      )}

      {modal==='complete'&&selected&&(
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-hdr"><div className="modal-title">Complete Transfusion — {selected.patientName}</div><button className="action-btn" onClick={()=>setModal(null)}><X size={14}/></button></div>
            <div className="modal-body">
              <div style={{fontSize:12,fontWeight:700,color:'var(--slate-500)',marginBottom:8}}>Vitals After</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:14}}>
                <div className="form-group" style={{margin:0}}><label className="form-label">BP</label><input className="form-input" value={completeForm.vitalsAfter.bp} onChange={e=>setCompleteForm({...completeForm,vitalsAfter:{...completeForm.vitalsAfter,bp:e.target.value}})}/></div>
                <div className="form-group" style={{margin:0}}><label className="form-label">Pulse</label><input className="form-input" value={completeForm.vitalsAfter.pulse} onChange={e=>setCompleteForm({...completeForm,vitalsAfter:{...completeForm.vitalsAfter,pulse:e.target.value}})}/></div>
                <div className="form-group" style={{margin:0}}><label className="form-label">Temp</label><input className="form-input" value={completeForm.vitalsAfter.temp} onChange={e=>setCompleteForm({...completeForm,vitalsAfter:{...completeForm.vitalsAfter,temp:e.target.value}})}/></div>
              </div>
              <div className="form-group"><label className="form-label">Notes</label><textarea className="form-input" rows={2} value={completeForm.notes} onChange={e=>setCompleteForm({...completeForm,notes:e.target.value})}/></div>
            </div>
            <div className="modal-footer"><button className="btn-secondary" onClick={()=>setModal(null)}>Cancel</button><button className="btn-primary" onClick={submitComplete}><CheckCircle size={13}/> Complete</button></div>
          </div>
        </div>
      )}

      {modal==='reaction'&&selected&&(
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-hdr"><div className="modal-title">Report Adverse Reaction — {selected.patientName}</div><button className="action-btn" onClick={()=>setModal(null)}><X size={14}/></button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Reaction Type</label><input className="form-input" placeholder="e.g. Fever, Allergic reaction" value={reactionForm.type} onChange={e=>setReactionForm({...reactionForm,type:e.target.value})}/></div>
              <div className="form-group"><label className="form-label">Severity</label><select className="form-input" value={reactionForm.severity} onChange={e=>setReactionForm({...reactionForm,severity:e.target.value})}><option>Mild</option><option>Moderate</option><option>Severe</option></select></div>
              <div className="form-group"><label className="form-label">Action Taken</label><textarea className="form-input" rows={2} value={reactionForm.actionTaken} onChange={e=>setReactionForm({...reactionForm,actionTaken:e.target.value})}/></div>
            </div>
            <div className="modal-footer"><button className="btn-secondary" onClick={()=>setModal(null)}>Cancel</button><button className="btn-primary" style={{background:'var(--red-600)'}} onClick={submitReaction}><AlertTriangle size={13}/> Report</button></div>
          </div>
        </div>
      )}

      {modal==='followup'&&selected&&(
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-hdr"><div className="modal-title">Follow-up — {selected.patientName}</div><button className="action-btn" onClick={()=>setModal(null)}><X size={14}/></button></div>
            <div className="modal-body">
              <label style={{display:'flex',alignItems:'center',gap:8,fontSize:13,marginBottom:12}}>
                <input type="checkbox" checked={followUpForm.required} onChange={e=>setFollowUpForm({...followUpForm,required:e.target.checked})}/>
                Follow-up required
              </label>
              <div className="form-group"><label className="form-label">Follow-up Date</label><input type="date" className="form-input" value={followUpForm.followUpDate} onChange={e=>setFollowUpForm({...followUpForm,followUpDate:e.target.value})}/></div>
              <div className="form-group"><label className="form-label">Notes</label><textarea className="form-input" rows={2} value={followUpForm.notes} onChange={e=>setFollowUpForm({...followUpForm,notes:e.target.value})}/></div>
              <label style={{display:'flex',alignItems:'center',gap:8,fontSize:13}}>
                <input type="checkbox" checked={followUpForm.completed} onChange={e=>setFollowUpForm({...followUpForm,completed:e.target.checked})}/>
                Follow-up completed
              </label>
            </div>
            <div className="modal-footer"><button className="btn-secondary" onClick={()=>setModal(null)}>Cancel</button><button className="btn-primary" onClick={submitFollowUp}>Save</button></div>
          </div>
        </div>
      )}
    </div>
  );
}