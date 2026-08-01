import React,{useState,useEffect} from 'react';
import {useLocation} from 'react-router-dom';
import {BarChart3,Download,Users,Droplets,Stethoscope,AlertTriangle,Info} from 'lucide-react';
import {AreaChart,Area,XAxis,YAxis,Tooltip,ResponsiveContainer,BarChart,Bar} from 'recharts';
import api from '../utils/api';

const BLOOD_GROUPS=['A+','A-','B+','B-','AB+','AB-','O+','O-'];

function toCSV(rows,headers){
  const esc=v=>`"${String(v??'').replace(/"/g,'""')}"`;
  return [headers.join(','),...rows.map(r=>headers.map(h=>esc(r[h])).join(','))].join('\n');
}
function downloadCSV(filename,csv){
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download=filename;a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage(){
  const loc=useLocation();
  const [requests,setRequests]=useState([]);
  const [patients,setPatients]=useState([]);
  const [donors,setDonors]=useState([]);
  const [staff,setStaff]=useState([]);
  const [transfusions,setTransfusions]=useState([]);
  const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState('requests');

  useEffect(()=>{
    setLoading(true);
    Promise.all([
      api.get('/blood-requests/my').catch(()=>({data:{requests:[]}})),
      api.get('/hospital-patients').catch(()=>({data:{patients:[]}})),
      api.get('/hospital-donor-testing/appointments?scope=all').catch(()=>({data:{donors:[]}})),
      api.get('/hospital-staff').catch(()=>({data:{staff:[]}})),
      api.get('/hospital-transfusions').catch(()=>({data:{transfusions:[]}})),
    ]).then(([r1,r2,r3,r4,r5])=>{
      setRequests(r1.data?.requests||[]);
      setPatients(r2.data?.patients||[]);
      setDonors(r3.data?.donors||[]);
      setStaff(r4.data?.staff||[]);
      setTransfusions(r5.data?.transfusions||[]);
    }).finally(()=>setLoading(false));
  },[]);

  useEffect(()=>{
    const h=loc.hash.replace('#','');
    if(h) setTab(h);
  },[loc.hash]);

  const monthly=(()=>{
    const now=new Date();const months=[];
    for(let i=5;i>=0;i--){
      const d=new Date(now.getFullYear(),now.getMonth()-i,1);
      months.push({key:`${d.getFullYear()}-${d.getMonth()}`,m:d.toLocaleString('en',{month:'short'}),requests:0,units:0});
    }
    requests.forEach(r=>{
      const d=new Date(r.createdAt);const key=`${d.getFullYear()}-${d.getMonth()}`;
      const b=months.find(mo=>mo.key===key);
      if(b){b.requests+=1;if(r.status==='delivered')b.units+=r.units;}
    });
    return months;
  })();

  const usageByGroup=BLOOD_GROUPS.map(g=>({group:g,units:requests.filter(r=>r.bloodGroup===g&&r.status==='delivered').reduce((a,r)=>a+r.units,0)}));

  const emergencyRequests=requests.filter(r=>r.priority==='Emergency');
  const criticalPatients=patients.filter(p=>p.isCritical);
  const eligibleDonors=donors.filter(d=>d.testingStatus==='active');
  const deferredDonors=donors.filter(d=>d.testingStatus==='testing_rejected');
  const staffByType=['Doctor','Nurse','Lab Technician','Administrative','Support'].map(t=>({type:t,count:staff.filter(s=>s.staffType===t).length}));
  const adverseReactions=transfusions.filter(t=>t.adverseReaction?.occurred);

  const exportRequests=()=>downloadCSV('blood-requests-report.csv',toCSV(
    requests.map(r=>({Patient:r.patient?.name||'',BloodGroup:r.bloodGroup,Units:r.units,Priority:r.priority,Status:r.status,Date:new Date(r.createdAt).toLocaleDateString('en-GB')})),
    ['Patient','BloodGroup','Units','Priority','Status','Date']
  ));
  const exportPatients=()=>downloadCSV('patients-report.csv',toCSV(
    patients.map(p=>({Name:p.fullName,BloodGroup:p.bloodGroup||'',Ward:p.ward||'',Status:p.status,Critical:p.isCritical?'Yes':'No'})),
    ['Name','BloodGroup','Ward','Status','Critical']
  ));
  const exportStaff=()=>downloadCSV('staff-report.csv',toCSV(
    staff.map(s=>({Name:s.fullName,Designation:s.designation,Department:s.department||'',Type:s.staffType,Phone:s.phone||''})),
    ['Name','Designation','Department','Type','Phone']
  ));
  const exportTransfusions=()=>downloadCSV('transfusion-report.csv',toCSV(
    transfusions.map(t=>({Patient:t.patientName||'',BloodGroup:t.bloodGroup,Units:t.units,Status:t.status,ReactionOccurred:t.adverseReaction?.occurred?'Yes':'No'})),
    ['Patient','BloodGroup','Units','Status','ReactionOccurred']
  ));

  const TABS=[
    {k:'requests',l:'Blood Requests',icon:Droplets},
    {k:'usage',l:'Blood Usage',icon:BarChart3},
    {k:'transfusion',l:'Transfusion',icon:Droplets},
    {k:'patients',l:'Patients',icon:Users},
    {k:'donortest',l:'Donor Testing',icon:Stethoscope},
    {k:'staff',l:'Staff',icon:Users},
    {k:'emergency',l:'Emergency',icon:AlertTriangle},
    {k:'monthly',l:'Monthly Trend',icon:BarChart3},
  ];

  return(
    <div className="anim-up">
      <div className="page-hdr"><div><h1>Reports & Analytics</h1><p>Real reports across all hospital modules</p></div></div>

      <div style={{background:'var(--primary-50)',border:'1px solid var(--primary-100)',borderRadius:'var(--r)',padding:'12px 16px',marginBottom:20,fontSize:13,color:'var(--primary-d)',display:'flex',alignItems:'center',gap:8}}>
        <Info size={15}/> PDF export needs an extra library — CSV export (opens in Excel) is available now on relevant tabs.
      </div>

      <div style={{display:'flex',gap:4,marginBottom:20,background:'var(--slate-100)',padding:4,borderRadius:'var(--r-sm)',width:'fit-content',flexWrap:'wrap'}}>
        {TABS.map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)} style={{
            padding:'7px 14px',borderRadius:'var(--r-sm)',border:'none',cursor:'pointer',fontSize:12.5,fontWeight:600,
            background:tab===t.k?'#fff':'transparent',color:tab===t.k?'var(--slate-900)':'var(--slate-500)',
            boxShadow:tab===t.k?'var(--sh-sm)':'none',
          }}>{t.l}</button>
        ))}
      </div>

      {loading?(
        <div className="card"><div className="empty-state"><p>Loading report data...</p></div></div>
      ):(
        <>
          {tab==='requests'&&(
            <div className="card">
              <div className="card-header"><div className="card-title">Blood Request Report</div>
                <button className="btn-secondary" style={{padding:'7px 14px',fontSize:12}} onClick={exportRequests}><Download size={13}/> Export CSV</button>
              </div>
              <div className="card-body" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14}}>
                {['pending','approved','dispatched','delivered'].map(s=>(
                  <div key={s} style={{textAlign:'center',padding:16,background:'var(--slate-50)',borderRadius:10}}>
                    <div style={{fontSize:22,fontWeight:800,fontFamily:'var(--font-disp)',color:'var(--primary)'}}>{requests.filter(r=>r.status===s).length}</div>
                    <div style={{fontSize:11,color:'var(--slate-500)',textTransform:'capitalize'}}>{s}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab==='usage'&&(
            <div className="card">
              <div className="card-header"><div className="card-title">Blood Usage by Group (Delivered)</div></div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={usageByGroup}>
                    <XAxis dataKey="group" tick={{fontSize:12}}/>
                    <YAxis tick={{fontSize:12}} allowDecimals={false}/>
                    <Tooltip/>
                    <Bar dataKey="units" fill="var(--primary)" radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {tab==='transfusion'&&(
            <div className="card">
              <div className="card-header"><div className="card-title">Blood Transfusion Report</div>
                <button className="btn-secondary" style={{padding:'7px 14px',fontSize:12}} onClick={exportTransfusions}><Download size={13}/> Export CSV</button>
              </div>
              <div className="card-body" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14}}>
                <div style={{textAlign:'center',padding:16,background:'var(--slate-50)',borderRadius:10}}><div style={{fontSize:22,fontWeight:800,color:'var(--green-600)'}}>{transfusions.filter(t=>t.status==='Completed').length}</div><div style={{fontSize:11,color:'var(--slate-500)'}}>Completed</div></div>
                <div style={{textAlign:'center',padding:16,background:'var(--slate-50)',borderRadius:10}}><div style={{fontSize:22,fontWeight:800,color:'#D97706'}}>{transfusions.filter(t=>t.status==='Scheduled').length}</div><div style={{fontSize:11,color:'var(--slate-500)'}}>Scheduled</div></div>
                <div style={{textAlign:'center',padding:16,background:'var(--slate-50)',borderRadius:10}}><div style={{fontSize:22,fontWeight:800,color:'var(--red-600)'}}>{adverseReactions.length}</div><div style={{fontSize:11,color:'var(--slate-500)'}}>Adverse Reactions</div></div>
              </div>
            </div>
          )}

          {tab==='patients'&&(
            <div className="card">
              <div className="card-header"><div className="card-title">Patient Report</div>
                <button className="btn-secondary" style={{padding:'7px 14px',fontSize:12}} onClick={exportPatients}><Download size={13}/> Export CSV</button>
              </div>
              <div className="card-body" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14}}>
                <div style={{textAlign:'center',padding:16,background:'var(--slate-50)',borderRadius:10}}><div style={{fontSize:22,fontWeight:800,color:'var(--primary)'}}>{patients.length}</div><div style={{fontSize:11,color:'var(--slate-500)'}}>Total Patients</div></div>
                <div style={{textAlign:'center',padding:16,background:'var(--slate-50)',borderRadius:10}}><div style={{fontSize:22,fontWeight:800,color:'var(--green-600)'}}>{patients.filter(p=>p.status==='active').length}</div><div style={{fontSize:11,color:'var(--slate-500)'}}>Active</div></div>
                <div style={{textAlign:'center',padding:16,background:'var(--slate-50)',borderRadius:10}}><div style={{fontSize:22,fontWeight:800,color:'var(--red-600)'}}>{criticalPatients.length}</div><div style={{fontSize:11,color:'var(--slate-500)'}}>Critical</div></div>
              </div>
            </div>
          )}

          {tab==='donortest'&&(
            <div className="card">
              <div className="card-header"><div className="card-title">Donor Testing Report</div></div>
              <div className="card-body" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14}}>
                <div style={{textAlign:'center',padding:16,background:'var(--slate-50)',borderRadius:10}}><div style={{fontSize:22,fontWeight:800,color:'var(--primary)'}}>{donors.length}</div><div style={{fontSize:11,color:'var(--slate-500)'}}>Total Tested</div></div>
                <div style={{textAlign:'center',padding:16,background:'var(--slate-50)',borderRadius:10}}><div style={{fontSize:22,fontWeight:800,color:'var(--green-600)'}}>{eligibleDonors.length}</div><div style={{fontSize:11,color:'var(--slate-500)'}}>Eligible</div></div>
                <div style={{textAlign:'center',padding:16,background:'var(--slate-50)',borderRadius:10}}><div style={{fontSize:22,fontWeight:800,color:'var(--red-600)'}}>{deferredDonors.length}</div><div style={{fontSize:11,color:'var(--slate-500)'}}>Deferred</div></div>
              </div>
            </div>
          )}

          {tab==='staff'&&(
            <div className="card">
              <div className="card-header"><div className="card-title">Staff Report</div>
                <button className="btn-secondary" style={{padding:'7px 14px',fontSize:12}} onClick={exportStaff}><Download size={13}/> Export CSV</button>
              </div>
              <div className="card-body" style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:14}}>
                {staffByType.map(s=>(
                  <div key={s.type} style={{textAlign:'center',padding:16,background:'var(--slate-50)',borderRadius:10}}>
                    <div style={{fontSize:20,fontWeight:800,color:'var(--primary)'}}>{s.count}</div>
                    <div style={{fontSize:11,color:'var(--slate-500)'}}>{s.type}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab==='emergency'&&(
            <div className="card">
              <div className="card-header"><div className="card-title">Emergency Report</div></div>
              <div className="card-body" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14}}>
                <div style={{textAlign:'center',padding:16,background:'var(--slate-50)',borderRadius:10}}><div style={{fontSize:22,fontWeight:800,color:'var(--red-600)'}}>{emergencyRequests.length}</div><div style={{fontSize:11,color:'var(--slate-500)'}}>Emergency Requests</div></div>
                <div style={{textAlign:'center',padding:16,background:'var(--slate-50)',borderRadius:10}}><div style={{fontSize:22,fontWeight:800,color:'var(--green-600)'}}>{emergencyRequests.filter(r=>r.status==='delivered').length}</div><div style={{fontSize:11,color:'var(--slate-500)'}}>Fulfilled</div></div>
                <div style={{textAlign:'center',padding:16,background:'var(--slate-50)',borderRadius:10}}><div style={{fontSize:22,fontWeight:800,color:'#D97706'}}>{criticalPatients.length}</div><div style={{fontSize:11,color:'var(--slate-500)'}}>Critical Patients</div></div>
              </div>
            </div>
          )}

          {tab==='monthly'&&(
            <div className="card">
              <div className="card-header"><div className="card-title">Monthly Trend (Last 6 Months)</div></div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={monthly}>
                    <defs><linearGradient id="mReq" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--primary)" stopOpacity={.2}/><stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/></linearGradient></defs>
                    <XAxis dataKey="m" tick={{fontSize:12}}/><YAxis tick={{fontSize:12}} allowDecimals={false}/><Tooltip/>
                    <Area type="monotone" dataKey="requests" name="Requests" stroke="var(--primary)" fill="url(#mReq)" strokeWidth={2}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
