import React,{useState,useEffect} from 'react';
import {useLocation} from 'react-router-dom';
import {Calendar,Stethoscope,Phone,AlertCircle} from 'lucide-react';
import api from '../utils/api';

export default function AppointmentsPage(){
  const loc=useLocation();
  const [donors,setDonors]=useState([]);
  const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState('upcoming');

  const fetchAll=()=>{
    setLoading(true);
    api.get('/hospital-donor-testing/appointments?scope=all')
      .then(r=>setDonors(r.data?.donors||[]))
      .catch(()=>setDonors([]))
      .finally(()=>setLoading(false));
  };
  useEffect(()=>{fetchAll();},[]);

  useEffect(()=>{
    const h=loc.hash.replace('#','');
    if(h) setTab(h);
  },[loc.hash]);

  const upcoming=donors.filter(d=>d.testingStatus==='testing_booked');
  const completed=donors.filter(d=>d.testingStatus==='active');
  const cancelled=donors.filter(d=>d.testingStatus==='testing_rejected');

  const list=tab==='upcoming'?upcoming:tab==='completed'?completed:tab==='cancelled'?cancelled:donors;

  const counts={upcoming:upcoming.length,completed:completed.length,cancelled:cancelled.length,total:donors.length};

  return(
    <div className="anim-up">
      <div className="page-hdr">
        <div><h1>Appointments</h1><p>Unified view of all donor testing appointments at your hospital</p></div>
      </div>

      <div style={{background:'var(--primary-50)',border:'1px solid var(--primary-100)',borderRadius:'var(--r)',padding:'12px 16px',marginBottom:20,fontSize:13,color:'var(--primary-d)',display:'flex',alignItems:'center',gap:8}}>
        <AlertCircle size={15}/> Currently only <b>Donor Testing Appointments</b> are tracked with real scheduling. Patient Appointments and Blood Transfusion Appointments would need a separate booking feature — let me know if you'd like that built.
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:22}}>
        {[
          {label:'Total',value:counts.total,color:'var(--primary)'},
          {label:'Upcoming',value:counts.upcoming,color:'#D97706'},
          {label:'Completed',value:counts.completed,color:'var(--green-600)'},
          {label:'Cancelled',value:counts.cancelled,color:'var(--red-600)'},
        ].map(({label,value,color})=>(
          <div key={label} className="card" style={{padding:'16px 20px'}}>
            <div style={{fontSize:26,fontWeight:800,fontFamily:'var(--font-disp)',color,marginBottom:3}}>{value}</div>
            <div style={{fontSize:13,color:'var(--slate-500)'}}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{display:'flex',gap:4,marginBottom:20,background:'var(--slate-100)',padding:4,borderRadius:'var(--r-sm)',width:'fit-content',flexWrap:'wrap'}}>
        {[{k:'upcoming',l:'Upcoming'},{k:'completed',l:'Completed'},{k:'cancelled',l:'Cancelled'},{k:'all',l:'All'}].map(t=>(
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
            <thead><tr><th>Donor</th><th>Type</th><th>Blood Group</th><th>Appointment Date</th><th>Contact</th><th>Status</th></tr></thead>
            <tbody>
              {loading&&<tr><td colSpan={6}><div className="empty-state"><p>Loading...</p></div></td></tr>}
              {!loading&&list.map(d=>(
                <tr key={d._id}>
                  <td><div className="td-name">{d.fullName}</div></td>
                  <td style={{fontSize:12,display:'flex',alignItems:'center',gap:6}}><Stethoscope size={12}/>Donor Testing</td>
                  <td><span className="blood-badge">{d.bloodGroup}</span></td>
                  <td style={{fontSize:13,display:'flex',alignItems:'center',gap:6}}><Calendar size={12}/>{d.testingBooking?.appointmentDate?new Date(d.testingBooking.appointmentDate).toLocaleString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}):'—'}</td>
                  <td style={{fontSize:13,display:'flex',alignItems:'center',gap:6}}><Phone size={12}/>{d.phone||'—'}</td>
                  <td>
                    <span className={`status-badge ${d.testingStatus==='active'?'s-fulfilled':d.testingStatus==='testing_rejected'?'s-rejected':'s-pending'}`}>
                      {d.testingStatus==='testing_booked'?'Upcoming':d.testingStatus==='active'?'Completed':d.testingStatus==='testing_rejected'?'Cancelled':d.testingStatus}
                    </span>
                  </td>
                </tr>
              ))}
              {!loading&&list.length===0&&(
                <tr><td colSpan={6}><div className="empty-state"><Calendar size={32} style={{opacity:.3,marginBottom:8}}/><p>No appointments in this view</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}