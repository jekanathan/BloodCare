import React,{useState,useEffect} from 'react';
import {useLocation} from 'react-router-dom';
import {Stethoscope,CheckCircle,XCircle,FlaskConical,X,Phone,Calendar} from 'lucide-react';
import api from '../utils/api';

const BLOOD_GROUPS=['A+','A-','B+','B-','AB+','AB-','O+','O-'];

const emptyTest={
  hemoglobin:'',bloodPressure:'',weight:'',temperature:'',pulseRate:'',confirmedBloodGroup:'',
  hiv:'Pending',hepatitisB:'Pending',hepatitisC:'Pending',syphilis:'Pending',malaria:'Pending',
  doctorRemarks:'',finalStatus:'Eligible',
};

export default function DonorTestingPage(){
  const loc=useLocation();
  const [donors,setDonors]=useState([]);
  const [loading,setLoading]=useState(true);
  const [scope,setScope]=useState('pending');
  const [modal,setModal]=useState(null);
  const [selected,setSelected]=useState(null);
  const [testForm,setTestForm]=useState(emptyTest);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');

  const fetchAll=()=>{
    setLoading(true);
    const apiScope=['eligible','deferred'].includes(scope)?'all':scope;
    api.get(`/hospital-donor-testing/appointments?scope=${apiScope}`)
      .then(r=>setDonors(r.data?.donors||[]))
      .catch(()=>setDonors([]))
      .finally(()=>setLoading(false));
  };
  useEffect(()=>{fetchAll();},[scope]);

  useEffect(()=>{
    const h=loc.hash.replace('#','');
    if(h) setScope(h);
  },[loc.hash]);

  // Client-side filters for stages the backend "scope" param doesn't cover directly
  const displayDonors=
    scope==='eligible' ? donors.filter(d=>d.testingStatus==='active') :
    scope==='deferred' ? donors.filter(d=>d.testingStatus==='testing_rejected') :
    donors;

  const counts={
    pending:donors.filter(d=>d.testingStatus==='testing_booked').length,
  };

  const openTest=(d)=>{
    setSelected(d);
    setTestForm({...emptyTest,confirmedBloodGroup:d.bloodGroup});
    setError('');
    setModal('test');
  };

  const submitTest=async()=>{
    setSaving(true);setError('');
    try{
      await api.patch(`/hospital-donor-testing/${selected._id}/complete-test`,testForm);
      setModal(null);fetchAll();
    }catch(err){setError(err.response?.data?.message||'Failed to save test results');}
    finally{setSaving(false);}
  };

  const STATUS_LABEL={
    testing_booked:{label:'Awaiting Test',color:'#D97706',bg:'var(--amber-100)'},
    active:{label:'Eligible',color:'var(--green-600)',bg:'var(--green-100)'},
    testing_rejected:{label:'Deferred',color:'var(--red-600)',bg:'var(--red-100)'},
  };

  return(
    <div className="anim-up">
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:24}}>
        <div className="card" style={{padding:'18px 20px',borderTop:'3px solid #D97706'}}>
          <div style={{fontSize:26,fontWeight:800,color:'#D97706',fontFamily:'var(--font-disp)'}}>{counts.pending}</div>
          <div style={{fontSize:12,color:'var(--slate-500)',marginTop:4}}>Awaiting Test</div>
        </div>
      </div>

      <div style={{display:'flex',gap:4,marginBottom:20,background:'var(--slate-100)',padding:4,borderRadius:'var(--r-sm)',width:'fit-content',flexWrap:'wrap'}}>
        {[{k:'pending',l:'Pending Tests'},{k:'today',l:"Today's Appointments"},{k:'eligible',l:'Eligible Donors'},{k:'deferred',l:'Deferred Donors'},{k:'all',l:'All'}].map(t=>(
          <button key={t.k} onClick={()=>setScope(t.k)} style={{
            padding:'7px 16px',borderRadius:'var(--r-sm)',border:'none',cursor:'pointer',fontSize:13,fontWeight:600,
            background:scope===t.k?'#fff':'transparent',color:scope===t.k?'var(--slate-900)':'var(--slate-500)',
            boxShadow:scope===t.k?'var(--sh-sm)':'none',
          }}>{t.l}</button>
        ))}
      </div>

      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Donor</th><th>Blood Group</th><th>Appointment</th><th>Contact</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {loading&&<tr><td colSpan={6}><div className="empty-state"><p>Loading...</p></div></td></tr>}
              {!loading&&displayDonors.map(d=>{
                const sc=STATUS_LABEL[d.testingStatus]||{label:d.testingStatus,color:'var(--slate-500)',bg:'var(--slate-100)'};
                return(
                  <tr key={d._id}>
                    <td><div className="td-name">{d.fullName}</div><div className="td-sub">{d.nic}</div></td>
                    <td><span className="blood-badge">{d.bloodGroup}</span></td>
                    <td style={{fontSize:12,display:'flex',alignItems:'center',gap:4}}><Calendar size={11}/>{d.testingBooking?.appointmentDate?new Date(d.testingBooking.appointmentDate).toLocaleString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}):'—'}</td>
                    <td style={{fontSize:12,display:'flex',alignItems:'center',gap:4}}><Phone size={11}/>{d.phone||'—'}</td>
                    <td><span style={{fontSize:11,fontWeight:600,padding:'3px 10px',borderRadius:100,background:sc.bg,color:sc.color}}>{sc.label}</span></td>
                    <td>
                      {d.testingStatus==='testing_booked'?(
                        <button className="btn-primary" style={{padding:'6px 12px',fontSize:12}} onClick={()=>openTest(d)}><FlaskConical size={12}/> Enter Test Results</button>
                      ):(
                        <span style={{fontSize:12,color:'var(--slate-400)'}}>Completed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!loading&&displayDonors.length===0&&(
                <tr><td colSpan={6}><div className="empty-state"><Stethoscope size={36} style={{margin:'0 auto 12px',opacity:.3}}/><h3>No donors found</h3><p>No testing appointments in this view yet.</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal==='test'&&selected&&(
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal" style={{maxWidth:560}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Lab Screening — {selected.fullName}</div>
              <button className="icon-btn" onClick={()=>setModal(null)}><X size={16}/></button>
            </div>
            <div className="modal-body">
              {error&&<div style={{background:'#FFF1F3',border:'1px solid #FEE2E8',borderRadius:8,padding:'10px 14px',marginBottom:14,fontSize:13,color:'var(--primary-d)'}}>{error}</div>}

              <div style={{fontSize:12,fontWeight:700,color:'var(--slate-500)',marginBottom:8,textTransform:'uppercase',letterSpacing:.5}}>Vitals</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:16}}>
                <div><label className="form-label">Hemoglobin (g/dL)</label><input className="form-input" type="number" step="0.1" value={testForm.hemoglobin} onChange={e=>setTestForm({...testForm,hemoglobin:e.target.value})}/></div>
                <div><label className="form-label">Blood Pressure</label><input className="form-input" placeholder="120/80" value={testForm.bloodPressure} onChange={e=>setTestForm({...testForm,bloodPressure:e.target.value})}/></div>
                <div><label className="form-label">Weight (kg)</label><input className="form-input" type="number" value={testForm.weight} onChange={e=>setTestForm({...testForm,weight:e.target.value})}/></div>
                <div><label className="form-label">Temperature (°C)</label><input className="form-input" type="number" step="0.1" value={testForm.temperature} onChange={e=>setTestForm({...testForm,temperature:e.target.value})}/></div>
                <div><label className="form-label">Pulse Rate (bpm)</label><input className="form-input" type="number" value={testForm.pulseRate} onChange={e=>setTestForm({...testForm,pulseRate:e.target.value})}/></div>
                <div>
                  <label className="form-label">Confirmed Blood Group</label>
                  <select className="form-input" value={testForm.confirmedBloodGroup} onChange={e=>setTestForm({...testForm,confirmedBloodGroup:e.target.value})}>
                    <option value="">Select</option>
                    {BLOOD_GROUPS.map(g=><option key={g}>{g}</option>)}
                  </select>
                </div>
              </div>

              <div style={{fontSize:12,fontWeight:700,color:'var(--slate-500)',marginBottom:8,textTransform:'uppercase',letterSpacing:.5}}>Screening Panel</div>
              <div style={{display:'grid',gap:8,marginBottom:16}}>
                {[['hiv','HIV'],['hepatitisB','Hepatitis B'],['hepatitisC','Hepatitis C'],['syphilis','Syphilis'],['malaria','Malaria']].map(([key,label])=>(
                  <div key={key} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 12px',background:'var(--slate-50)',borderRadius:8}}>
                    <span style={{fontSize:13,fontWeight:600}}>{label}</span>
                    <div style={{display:'flex',gap:6}}>
                      {['Pending','Negative','Positive'].map(v=>(
                        <button key={v} type="button" onClick={()=>setTestForm({...testForm,[key]:v})} style={{
                          padding:'5px 12px',borderRadius:6,border:'none',cursor:'pointer',fontSize:11,fontWeight:600,
                          background:testForm[key]===v?(v==='Positive'?'var(--red-600)':v==='Negative'?'var(--green-600)':'var(--slate-400)'):'var(--slate-100)',
                          color:testForm[key]===v?'#fff':'var(--slate-500)',
                        }}>{v}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="form-group">
                <label className="form-label">Doctor Remarks</label>
                <textarea className="form-input" rows={2} value={testForm.doctorRemarks} onChange={e=>setTestForm({...testForm,doctorRemarks:e.target.value})}/>
              </div>

              <div className="form-group">
                <label className="form-label">Final Status</label>
                <div style={{display:'flex',gap:10}}>
                  {['Eligible','Temporarily Deferred','Permanently Deferred'].map(s=>(
                    <label key={s} style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'10px',border:`1.5px solid ${testForm.finalStatus===s?'var(--primary)':'var(--slate-200)'}`,borderRadius:8,cursor:'pointer',fontSize:12,fontWeight:600,background:testForm.finalStatus===s?'var(--primary-50)':'#fff'}}>
                      <input type="radio" name="finalStatus" checked={testForm.finalStatus===s} onChange={()=>setTestForm({...testForm,finalStatus:s})} style={{display:'none'}}/>
                      {s==='Eligible'?<CheckCircle size={13} color="var(--green-600)"/>:<XCircle size={13} color="var(--red-600)"/>} {s}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={()=>setModal(null)}>Cancel</button>
              <button className="btn-primary" disabled={saving} onClick={submitTest}>{saving?'Saving...':'Submit & Finalize'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}