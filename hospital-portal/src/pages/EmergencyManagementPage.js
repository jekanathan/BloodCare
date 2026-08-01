import React,{useState,useEffect} from 'react';
import {useLocation,useNavigate} from 'react-router-dom';
import {AlertTriangle,Phone,Droplets,Users,Building2,ChevronRight,AlertCircle} from 'lucide-react';
import {useAuth} from '../context/AuthContext';
import api from '../utils/api';

export default function EmergencyManagementPage(){
  const loc=useLocation();
  const nav=useNavigate();
  const {hospital}=useAuth();
  const [requests,setRequests]=useState([]);
  const [patients,setPatients]=useState([]);
  const [contacts,setContacts]=useState([]);
  const [banks,setBanks]=useState([]);
  const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState('dashboard');

  const fetchAll=()=>{
    setLoading(true);
    Promise.all([
      api.get('/blood-requests/my').catch(()=>({data:{requests:[]}})),
      api.get('/hospital-patients').catch(()=>({data:{patients:[]}})),
      api.get('/emergency-extras/contacts').catch(()=>({data:{contacts:[]}})),
      api.get('/bloodbanks').catch(()=>({data:{bloodBanks:[]}})),
    ]).then(([r1,r2,r3,r4])=>{
      setRequests(r1.data?.requests||[]);
      setPatients(r2.data?.patients||[]);
      setContacts(r3.data?.contacts||[]);
      setBanks((r4.data?.bloodBanks||[]).filter(b=>b.status==='approved'));
    }).finally(()=>setLoading(false));
  };
  useEffect(()=>{fetchAll();},[]);

  useEffect(()=>{
    const h=loc.hash.replace('#','');
    if(h) setTab(h);
  },[loc.hash]);

  const emergencyRequests=requests.filter(r=>r.priority==='Emergency'&&!['delivered','rejected','cancelled'].includes(r.status));
  const criticalPatients=patients.filter(p=>p.isCritical&&p.status==='active');
  const nearbyBanks=banks.filter(b=>b.district&&hospital?.district&&b.district===hospital.district);

  const counts={emergency:emergencyRequests.length,critical:criticalPatients.length,nearby:nearbyBanks.length,contacts:contacts.length};

  return(
    <div className="anim-up">
      <div className="page-hdr">
        <div><h1>Emergency Management</h1><p>Critical requests, critical patients & emergency response tools</p></div>
      </div>

      <div style={{background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.25)',borderRadius:'var(--r)',padding:'12px 16px',marginBottom:20,fontSize:13,color:'var(--red-600)',display:'flex',alignItems:'center',gap:8}}>
        <AlertCircle size={15}/> "Emergency Broadcast" (requesting donors directly) is on the <b>Donor Requests</b> page — that page still needs to be rebuilt with real data, let me know if you'd like that done.
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:22}}>
        {[
          {label:'Emergency Requests',value:counts.emergency,color:'var(--red-600)'},
          {label:'Critical Patients',value:counts.critical,color:'#D97706'},
          {label:'Nearby Blood Banks',value:counts.nearby,color:'var(--primary)'},
          {label:'Emergency Contacts',value:counts.contacts,color:'#7C3AED'},
        ].map(({label,value,color})=>(
          <div key={label} className="card" style={{padding:'16px 20px'}}>
            <div style={{fontSize:26,fontWeight:800,fontFamily:'var(--font-disp)',color,marginBottom:3}}>{value}</div>
            <div style={{fontSize:13,color:'var(--slate-500)'}}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{display:'flex',gap:4,marginBottom:20,background:'var(--slate-100)',padding:4,borderRadius:'var(--r-sm)',width:'fit-content',flexWrap:'wrap'}}>
        {[{k:'dashboard',l:'Dashboard'},{k:'requests',l:'Emergency Requests'},{k:'patients',l:'Critical Patients'},{k:'contacts',l:'Emergency Contacts'}].map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)} style={{
            padding:'7px 16px',borderRadius:'var(--r-sm)',border:'none',cursor:'pointer',fontSize:13,fontWeight:600,
            background:tab===t.k?'#fff':'transparent',color:tab===t.k?'var(--slate-900)':'var(--slate-500)',
            boxShadow:tab===t.k?'var(--sh-sm)':'none',
          }}>{t.l}</button>
        ))}
      </div>

      {tab==='dashboard'&&(
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <div className="card" style={{cursor:'pointer'}} onClick={()=>nav('/blood-requests#emergency')}>
            <div className="card-header"><div className="card-title" style={{display:'flex',alignItems:'center',gap:6}}><Droplets size={15}/> Emergency Blood Requests</div><ChevronRight size={15}/></div>
            <div className="card-body">{counts.emergency} active emergency request(s) — click to view</div>
          </div>
          <div className="card" style={{cursor:'pointer'}} onClick={()=>setTab('patients')}>
            <div className="card-header"><div className="card-title" style={{display:'flex',alignItems:'center',gap:6}}><Users size={15}/> Critical Patients</div><ChevronRight size={15}/></div>
            <div className="card-body">{counts.critical} patient(s) marked critical</div>
          </div>
          <div className="card" style={{cursor:'pointer'}} onClick={()=>nav('/blood-banks#nearby')}>
            <div className="card-header"><div className="card-title" style={{display:'flex',alignItems:'center',gap:6}}><Building2 size={15}/> Nearby Blood Banks</div><ChevronRight size={15}/></div>
            <div className="card-body">{counts.nearby} blood bank(s) in your district</div>
          </div>
          <div className="card" style={{cursor:'pointer'}} onClick={()=>setTab('contacts')}>
            <div className="card-header"><div className="card-title" style={{display:'flex',alignItems:'center',gap:6}}><Phone size={15}/> Emergency Contacts</div><ChevronRight size={15}/></div>
            <div className="card-body">{counts.contacts} contact(s) available</div>
          </div>
        </div>
      )}

      {tab==='requests'&&(
        <div className="card">
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Patient</th><th>Blood Group</th><th>Units</th><th>Status</th></tr></thead>
              <tbody>
                {loading&&<tr><td colSpan={4}><div className="empty-state"><p>Loading...</p></div></td></tr>}
                {!loading&&emergencyRequests.map(r=>(
                  <tr key={r._id}>
                    <td><div className="td-name">{r.patient?.name||'—'}</div></td>
                    <td><span className="blood-badge">{r.bloodGroup}</span></td>
                    <td style={{fontWeight:700}}>{r.units}</td>
                    <td><span className={`status-badge s-${r.status}`}>{r.status}</span></td>
                  </tr>
                ))}
                {!loading&&emergencyRequests.length===0&&(
                  <tr><td colSpan={4}><div className="empty-state"><AlertTriangle size={32} style={{opacity:.3,marginBottom:8}}/><p>No active emergency requests</p></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab==='patients'&&(
        <div className="card">
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Patient</th><th>Blood Group</th><th>Ward</th><th>Phone</th></tr></thead>
              <tbody>
                {loading&&<tr><td colSpan={4}><div className="empty-state"><p>Loading...</p></div></td></tr>}
                {!loading&&criticalPatients.map(p=>(
                  <tr key={p._id}>
                    <td><div className="td-name">{p.fullName}</div></td>
                    <td>{p.bloodGroup?<span className="blood-badge">{p.bloodGroup}</span>:'—'}</td>
                    <td style={{fontSize:13}}>{p.ward||'—'}</td>
                    <td style={{fontSize:13}}>{p.phone||'—'}</td>
                  </tr>
                ))}
                {!loading&&criticalPatients.length===0&&(
                  <tr><td colSpan={4}><div className="empty-state"><Users size={32} style={{opacity:.3,marginBottom:8}}/><p>No critical patients marked. Mark a patient critical from Patient Management → Edit.</p></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab==='contacts'&&(
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
          {loading&&<div className="card"><div className="empty-state"><p>Loading...</p></div></div>}
          {!loading&&contacts.map(c=>(
            <div key={c._id} className="card" style={{padding:'16px 18px'}}>
              <div style={{fontSize:13,fontWeight:700,marginBottom:4}}>{c.label}</div>
              <div style={{fontSize:11,color:'var(--slate-400)',marginBottom:10}}>{c.category}</div>
              <a href={`tel:${c.number}`} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'8px',background:'var(--primary)',color:'#fff',borderRadius:8,fontSize:13,fontWeight:700,textDecoration:'none'}}>
                <Phone size={13}/> {c.number}
              </a>
            </div>
          ))}
          {!loading&&contacts.length===0&&(
            <div className="card" style={{gridColumn:'span 3'}}><div className="empty-state"><Phone size={32} style={{opacity:.3,marginBottom:8}}/><p>No emergency contacts found</p></div></div>
          )}
        </div>
      )}
    </div>
  );
}