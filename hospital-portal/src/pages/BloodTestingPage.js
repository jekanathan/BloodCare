import React,{useState,useEffect} from 'react';
import {useLocation} from 'react-router-dom';
import {FlaskConical,X,CheckCircle,Droplets,ClipboardCheck} from 'lucide-react';
import api from '../utils/api';

const BG=['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const EMPTY={bloodGroupConfirmed:'',antibodyScreening:'Pending',compatibilityResult:'Pending',
  patientIdVerified:false,bloodBagVerified:false,vitalsChecked:false,consentObtained:false,performedBy:'',notes:''};

export default function BloodTestingPage(){
  const loc=useLocation();
  const [requests,setRequests]=useState([]);
  const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState('pending');
  const [selected,setSelected]=useState(null);
  const [form,setForm]=useState(EMPTY);
  const [saving,setSaving]=useState(false);

  const fetchAll=()=>{
    setLoading(true);
    api.get('/blood-requests/my').then(r=>setRequests(r.data?.requests||[])).catch(()=>setRequests([])).finally(()=>setLoading(false));
  };
  useEffect(()=>{fetchAll();},[]);

  useEffect(()=>{
    const h=loc.hash.replace('#','');
    if(h) setTab(h);
  },[loc.hash]);

  const testable=requests.filter(r=>['processing','dispatched','delivered'].includes(r.status));
  const pending=testable.filter(r=>!r.patientTesting?.testedAt);
  const completed=testable.filter(r=>r.patientTesting?.testedAt);

  const list=tab==='pending'?pending:tab==='completed'?completed:testable;

  const counts={pending:pending.length,completed:completed.length,total:testable.length};

  const openTest=(r)=>{
    setSelected(r);
    setForm(r.patientTesting?.testedAt?{
      bloodGroupConfirmed:r.patientTesting.bloodGroupConfirmed||'',
      antibodyScreening:r.patientTesting.antibodyScreening||'Pending',
      compatibilityResult:r.patientTesting.compatibilityResult||'Pending',
      patientIdVerified:r.patientTesting.patientIdVerified||false,
      bloodBagVerified:r.patientTesting.bloodBagVerified||false,
      vitalsChecked:r.patientTesting.vitalsChecked||false,
      consentObtained:r.patientTesting.consentObtained||false,
      performedBy:r.patientTesting.performedBy||'',
      notes:r.patientTesting.notes||'',
    }:{...EMPTY,bloodGroupConfirmed:r.bloodGroup});
  };

  const submit=async()=>{
    setSaving(true);
    try{
      await api.patch(`/blood-requests/${selected._id}/pre-transfusion-test`,form);
      setSelected(null);fetchAll();
    }catch{alert('Failed to save test results');}
    finally{setSaving(false);}
  };

  const allChecked=form.patientIdVerified&&form.bloodBagVerified&&form.vitalsChecked&&form.consentObtained;

  return(
    <div className="anim-up">
      <div className="page-hdr">
        <div><h1>Blood Testing (Patients)</h1><p>Pre-transfusion compatibility testing & safety checklist</p></div>
      </div>

      <div style={{background:'var(--primary-50)',border:'1px solid var(--primary-100)',borderRadius:'var(--r)',padding:'12px 16px',marginBottom:20,fontSize:13,color:'var(--primary-d)'}}>
        ℹ️ This covers patient-side pre-transfusion checks (blood group confirmation, antibody screening, compatibility, safety checklist) — separate from blood bag lab screening done by the blood bank.
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:22}}>
        {[
          {label:'Pending Tests',value:counts.pending,color:'#D97706'},
          {label:'Completed Tests',value:counts.completed,color:'var(--green-600)'},
          {label:'Total',value:counts.total,color:'var(--primary)'},
        ].map(({label,value,color})=>(
          <div key={label} className="card" style={{padding:'16px 20px'}}>
            <div style={{fontSize:26,fontWeight:800,fontFamily:'var(--font-disp)',color,marginBottom:3}}>{value}</div>
            <div style={{fontSize:13,color:'var(--slate-500)'}}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{display:'flex',gap:4,marginBottom:20,background:'var(--slate-100)',padding:4,borderRadius:'var(--r-sm)',width:'fit-content'}}>
        {[{k:'pending',l:`Pending (${counts.pending})`},{k:'completed',l:`Completed (${counts.completed})`},{k:'all',l:'All'}].map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)} style={{
            padding:'7px 16px',borderRadius:'var(--r-sm)',border:'none',cursor:'pointer',fontSize:13,fontWeight:600,
            background:tab===t.k?'#fff':'transparent',color:tab===t.k?'var(--slate-900)':'var(--slate-500)',
            boxShadow:tab===t.k?'var(--sh-sm)':'none',
          }}>{t.l}</button>
        ))}
      </div>

      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Patient</th><th>Blood Group</th><th>Units</th><th>Antibody Screen</th><th>Compatibility</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {loading&&<tr><td colSpan={7}><div className="empty-state"><p>Loading...</p></div></td></tr>}
              {!loading&&list.map(r=>(
                <tr key={r._id}>
                  <td><div className="td-name">{r.patient?.name||'—'}</div></td>
                  <td><span className="blood-badge">{r.bloodGroup}</span></td>
                  <td style={{fontWeight:700}}>{r.units}</td>
                  <td style={{fontSize:12,color:r.patientTesting?.antibodyScreening==='Positive'?'var(--red-600)':r.patientTesting?.antibodyScreening==='Negative'?'var(--green-600)':'var(--slate-400)'}}>{r.patientTesting?.antibodyScreening||'Pending'}</td>
                  <td style={{fontSize:12,color:r.patientTesting?.compatibilityResult==='Incompatible'?'var(--red-600)':r.patientTesting?.compatibilityResult==='Compatible'?'var(--green-600)':'var(--slate-400)'}}>{r.patientTesting?.compatibilityResult||'Pending'}</td>
                  <td>{r.patientTesting?.testedAt?<span className="status-badge s-fulfilled">Tested</span>:<span className="status-badge s-pending">Pending</span>}</td>
                  <td><button className="btn-secondary" style={{padding:'6px 12px',fontSize:12}} onClick={()=>openTest(r)}><FlaskConical size={12}/> {r.patientTesting?.testedAt?'View/Edit':'Enter Results'}</button></td>
                </tr>
              ))}
              {!loading&&list.length===0&&(
                <tr><td colSpan={7}><div className="empty-state"><Droplets size={32} style={{opacity:.3,marginBottom:8}}/><p>No requests to show in this view</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected&&(
        <div className="modal-overlay" onClick={()=>setSelected(null)}>
          <div className="modal" style={{maxWidth:560}} onClick={e=>e.stopPropagation()}>
            <div className="modal-hdr">
              <div className="modal-title">Pre-Transfusion Testing — {selected.patient?.name}</div>
              <button className="action-btn" onClick={()=>setSelected(null)}><X size={14}/></button>
            </div>
            <div className="modal-body">
              <div style={{fontSize:12,fontWeight:700,color:'var(--slate-500)',textTransform:'uppercase',letterSpacing:.5,marginBottom:8}}>Blood Group Testing</div>
              <div className="form-group">
                <label className="form-label">Confirmed Blood Group</label>
                <select className="form-input" value={form.bloodGroupConfirmed} onChange={e=>setForm({...form,bloodGroupConfirmed:e.target.value})}>
                  <option value="">Select</option>{BG.map(g=><option key={g}>{g}</option>)}
                </select>
              </div>

              <div style={{fontSize:12,fontWeight:700,color:'var(--slate-500)',textTransform:'uppercase',letterSpacing:.5,margin:'16px 0 8px'}}>Antibody Screening</div>
              <div style={{display:'flex',gap:8,marginBottom:16}}>
                {['Pending','Negative','Positive'].map(v=>(
                  <button key={v} type="button" onClick={()=>setForm({...form,antibodyScreening:v})} style={{
                    flex:1,padding:'8px',borderRadius:8,border:'none',cursor:'pointer',fontSize:12,fontWeight:600,
                    background:form.antibodyScreening===v?(v==='Positive'?'var(--red-600)':v==='Negative'?'var(--green-600)':'var(--slate-400)'):'var(--slate-100)',
                    color:form.antibodyScreening===v?'#fff':'var(--slate-500)',
                  }}>{v}</button>
                ))}
              </div>

              <div style={{fontSize:12,fontWeight:700,color:'var(--slate-500)',textTransform:'uppercase',letterSpacing:.5,marginBottom:8}}>Compatibility Test</div>
              <div style={{display:'flex',gap:8,marginBottom:16}}>
                {['Pending','Compatible','Incompatible'].map(v=>(
                  <button key={v} type="button" onClick={()=>setForm({...form,compatibilityResult:v})} style={{
                    flex:1,padding:'8px',borderRadius:8,border:'none',cursor:'pointer',fontSize:12,fontWeight:600,
                    background:form.compatibilityResult===v?(v==='Incompatible'?'var(--red-600)':v==='Compatible'?'var(--green-600)':'var(--slate-400)'):'var(--slate-100)',
                    color:form.compatibilityResult===v?'#fff':'var(--slate-500)',
                  }}>{v}</button>
                ))}
              </div>

              <div style={{fontSize:12,fontWeight:700,color:'var(--slate-500)',textTransform:'uppercase',letterSpacing:.5,marginBottom:8,display:'flex',alignItems:'center',gap:6}}><ClipboardCheck size={13}/> Pre-Transfusion Safety Checklist</div>
              <div style={{display:'grid',gap:8,marginBottom:16}}>
                {[['patientIdVerified','Patient identity verified'],['bloodBagVerified','Blood bag ID matches request'],['vitalsChecked','Patient vitals checked'],['consentObtained','Consent obtained']].map(([key,label])=>(
                  <label key={key} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:'var(--slate-50)',borderRadius:8,cursor:'pointer',fontSize:13}}>
                    <input type="checkbox" checked={form[key]} onChange={e=>setForm({...form,[key]:e.target.checked})}/>
                    {label}
                  </label>
                ))}
              </div>

              <div className="form-group"><label className="form-label">Performed By</label><input className="form-input" value={form.performedBy} onChange={e=>setForm({...form,performedBy:e.target.value})}/></div>
              <div className="form-group"><label className="form-label">Notes</label><textarea className="form-input" rows={2} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></div>

              {!allChecked&&<div style={{fontSize:12,color:'#D97706',background:'var(--amber-100)',padding:'8px 12px',borderRadius:8}}>⚠️ Complete all 4 safety checklist items before transfusion.</div>}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={()=>setSelected(null)}>Cancel</button>
              <button className="btn-primary" disabled={saving} onClick={submit}><CheckCircle size={14}/>{saving?'Saving...':'Save Results'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}