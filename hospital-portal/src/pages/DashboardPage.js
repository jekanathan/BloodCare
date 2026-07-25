import React,{useState,useEffect} from 'react';
import {useNavigate,useLocation} from 'react-router-dom';
import {AreaChart,Area,XAxis,YAxis,Tooltip,ResponsiveContainer} from 'recharts';
import {Droplets,Users,AlertTriangle,ChevronRight,Plus,Truck,Stethoscope,Activity,Sun} from 'lucide-react';
import api from '../utils/api';

const BLOOD_GROUPS=['A+','A-','B+','B-','AB+','AB-','O+','O-'];

export default function DashboardPage(){
  const nav=useNavigate();
  const loc=useLocation();
  const [requests,setRequests]=useState([]);
  const [inventory,setInventory]=useState([]);
  const [pendingTests,setPendingTests]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');

  useEffect(()=>{
    setLoading(true);
    setError('');
    Promise.all([
      api.get('/blood-requests/my').catch(()=>({data:{requests:[]}})),
      api.get('/blood-bags?status=Safe').catch(()=>({data:{bags:[]}})),
      api.get('/hospital-donor-testing/appointments?scope=pending').catch(()=>({data:{donors:[]}})),
    ]).then(([reqRes,bagRes,testRes])=>{
      setRequests(reqRes.data?.requests||[]);
      const bags=bagRes.data?.bags||[];
      setInventory(BLOOD_GROUPS.map(g=>({group:g,units:bags.filter(b=>b.bloodGroup===g).length})));
      setPendingTests(testRes.data?.donors||[]);
    }).catch(()=>setError('Could not load dashboard data.'))
      .finally(()=>setLoading(false));
  },[]);

  // Scroll to the section named in the URL hash (set by sidebar submenu clicks)
  useEffect(()=>{
    if(loading) return;
    if(loc.hash){
      const id=loc.hash.replace('#','');
      const el=document.getElementById(id);
      if(el) setTimeout(()=>el.scrollIntoView({behavior:'smooth',block:'start'}),50);
    }
  },[loc.hash,loading]);

  const isToday=(d)=>{
    const dt=new Date(d), now=new Date();
    return dt.getDate()===now.getDate()&&dt.getMonth()===now.getMonth()&&dt.getFullYear()===now.getFullYear();
  };

  const totalRequests=requests.length;
  const pendingRequests=requests.filter(r=>r.status==='pending').length;
  const fulfilledRequests=requests.filter(r=>r.status==='delivered').length;
  const emergencyRequests=requests.filter(r=>r.priority==='Emergency'&&!['delivered','rejected','cancelled'].includes(r.status)).length;
  const inTransit=requests.filter(r=>r.status==='dispatched');
  const fulfilmentRate=totalRequests>0?Math.round((fulfilledRequests/totalRequests)*100):0;

  const todaysRequests=requests.filter(r=>isToday(r.createdAt)).length;
  const todaysDelivered=requests.filter(r=>r.deliveredAt&&isToday(r.deliveredAt)).length;
  const todaysTestsBooked=pendingTests.filter(d=>d.testingBooking?.appointmentDate&&isToday(d.testingBooking.appointmentDate)).length;

  const monthly=(()=>{
    const now=new Date();
    const months=[];
    for(let i=5;i>=0;i--){
      const d=new Date(now.getFullYear(),now.getMonth()-i,1);
      months.push({key:`${d.getFullYear()}-${d.getMonth()}`,m:d.toLocaleString('en',{month:'short'}),requests:0,fulfilled:0});
    }
    requests.forEach(r=>{
      const d=new Date(r.createdAt);
      const key=`${d.getFullYear()}-${d.getMonth()}`;
      const bucket=months.find(mo=>mo.key===key);
      if(bucket){ bucket.requests+=1; if(r.status==='delivered') bucket.fulfilled+=1; }
    });
    return months;
  })();

  const activities=(()=>{
    const items=[];
    requests.forEach(r=>{
      items.push({icon:'📋',text:`Blood request submitted (${r.bloodGroup}, ${r.units} units)`,date:r.createdAt});
      if(r.approvedAt) items.push({icon:'✅',text:`Request approved (${r.bloodGroup})`,date:r.approvedAt});
      if(r.dispatchedAt) items.push({icon:'🚚',text:`Request dispatched (${r.bloodGroup})`,date:r.dispatchedAt});
      if(r.deliveredAt) items.push({icon:'📦',text:`Blood received (${r.bloodGroup})`,date:r.deliveredAt});
    });
    return items.sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,8);
  })();

  const recentRequests=requests.slice(0,5);
  const maxInv=Math.max(1,...inventory.map(i=>i.units));

  if(loading) return <div className="loading-c"><div className="spinner"/></div>;

  return(
    <div className="anim-up">
      {error&&(
        <div style={{background:'rgba(234,179,8,.1)',border:'1px solid rgba(234,179,8,.3)',borderRadius:8,padding:'10px 16px',marginBottom:16,fontSize:13,color:'#92400E'}}>⚠️ {error}</div>
      )}

      <div id="today-summary" className="card" style={{marginBottom:20,scrollMarginTop:20}}>
        <div className="card-header">
          <div className="card-title" style={{display:'flex',alignItems:'center',gap:6}}><Sun size={15}/> Today's Summary</div>
          <span style={{fontSize:11,color:'var(--slate-500)'}}>{new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})}</span>
        </div>
        <div className="card-body" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
          <div style={{textAlign:'center'}}><div style={{fontSize:26,fontWeight:800,color:'var(--primary)',fontFamily:'var(--font-disp)'}}>{todaysRequests}</div><div style={{fontSize:12,color:'var(--slate-500)'}}>Requests Today</div></div>
          <div style={{textAlign:'center'}}><div style={{fontSize:26,fontWeight:800,color:'var(--green-600)',fontFamily:'var(--font-disp)'}}>{todaysDelivered}</div><div style={{fontSize:12,color:'var(--slate-500)'}}>Delivered Today</div></div>
          <div style={{textAlign:'center'}}><div style={{fontSize:26,fontWeight:800,color:'#7C3AED',fontFamily:'var(--font-disp)'}}>{todaysTestsBooked}</div><div style={{fontSize:12,color:'var(--slate-500)'}}>Donor Tests Today</div></div>
        </div>
      </div>

      <div id="emergency-alerts" style={{scrollMarginTop:20}}>
        {emergencyRequests>0?(
          <div style={{background:'linear-gradient(90deg,#7F0F1E,var(--red-600))',borderRadius:'var(--r-md)',padding:'14px 20px',marginBottom:20,display:'flex',alignItems:'center',gap:14,cursor:'pointer'}} onClick={()=>nav('/blood-requests')}>
            <div style={{width:36,height:36,background:'rgba(255,255,255,.15)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,animation:'pulse 2s ease infinite'}}>
              <AlertTriangle size={18} color="#fff"/>
            </div>
            <div style={{flex:1}}>
              <div style={{fontWeight:800,color:'#fff',fontSize:14}}>⚠️ {emergencyRequests} Emergency Request{emergencyRequests>1?'s':''} Awaiting Fulfilment</div>
              <div style={{fontSize:12,color:'rgba(255,255,255,.7)',marginTop:2}}>Click to view and manage emergency blood requests</div>
            </div>
            <ChevronRight size={18} color="rgba(255,255,255,.7)"/>
          </div>
        ):(
          <div className="card" style={{marginBottom:20,padding:'14px 20px',display:'flex',alignItems:'center',gap:10}}>
            <AlertTriangle size={16} color="var(--green-600)"/>
            <span style={{fontSize:13,color:'var(--slate-600)'}}>No emergency requests right now — all clear.</span>
          </div>
        )}
      </div>

      <div className="stats-grid">
        <div id="pending-requests" style={{scrollMarginTop:20}}>
          <StatCard icon={<Droplets size={20}/>} color="blue"   value={totalRequests}   label="Total Requests"   badge={`${pendingRequests} pending`} badgeClass="badge-pending"/>
        </div>
        <div id="blood-in-transit" style={{scrollMarginTop:20}}>
          <StatCard icon={<Truck size={20}/>} color="purple" value={inTransit.length} label="Blood In Transit" badge="Dispatched, en route" badgeClass="badge-pending"/>
        </div>
        <div id="pending-tests" style={{scrollMarginTop:20}}>
          <StatCard icon={<Stethoscope size={20}/>} color="amber" value={pendingTests.length} label="Pending Blood Tests" badge="Donor screenings" badgeClass="badge-pending" onClick={()=>nav('/donor-testing')}/>
        </div>
        <StatCard icon={<AlertTriangle size={20}/>} color="red" value={emergencyRequests} label="Emergency Now" badge={emergencyRequests>0?'Needs attention':'All clear'} badgeClass={emergencyRequests>0?'badge-alert':'badge-ok'}/>
      </div>

      <div className="dash-grid">
        <div className="dash-col">
          <div id="dashboard-analytics" className="card" style={{scrollMarginTop:20}}>
            <div className="card-header">
              <div className="card-title">Blood Requests Trend (Analytics)</div>
              <span className="status-badge s-approved">Last 6 months</span>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={monthly} margin={{top:5,right:10,left:-20,bottom:0}}>
                  <defs>
                    <linearGradient id="reqG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={.2}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="fulG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--green-500)" stopOpacity={.2}/>
                      <stop offset="95%" stopColor="var(--green-500)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="m" tick={{fontSize:12,fill:'#94A3B8'}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:12,fill:'#94A3B8'}} axisLine={false} tickLine={false} allowDecimals={false}/>
                  <Tooltip contentStyle={{background:'#0F172A',border:'none',borderRadius:8,color:'#fff',fontSize:13}} cursor={{strokeDasharray:'4 4'}}/>
                  <Area type="monotone" dataKey="requests"  name="Requests"  stroke="var(--primary)"    strokeWidth={2} fill="url(#reqG)"/>
                  <Area type="monotone" dataKey="fulfilled" name="Fulfilled" stroke="var(--green-500)"  strokeWidth={2} fill="url(#fulG)"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Recent Blood Requests</div>
              <button className="btn-primary" style={{padding:'7px 14px',fontSize:12}} onClick={()=>nav('/blood-requests')}>
                <Plus size={13}/> New Request
              </button>
            </div>
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>Patient</th><th>Blood</th><th>Units</th><th>Priority</th><th>Status</th></tr></thead>
                <tbody>
                  {recentRequests.length===0&&(
                    <tr><td colSpan={5}><div className="empty-state"><p>No requests yet — submit your first blood request.</p></div></td></tr>
                  )}
                  {recentRequests.map(r=>(
                    <tr key={r._id} style={{cursor:'pointer'}} onClick={()=>nav('/blood-requests')}>
                      <td><div className="td-name">{r.patient?.name||'—'}</div></td>
                      <td><span className="blood-badge">{r.bloodGroup}</span></td>
                      <td style={{fontWeight:700}}>{r.units}</td>
                      <td><span className={`priority-badge ${r.priority==='Emergency'?'p-emergency':r.priority==='Urgent'?'p-urgent':'p-normal'}`}>{r.priority}</span></td>
                      <td><span className={`status-badge s-${r.status}`}>{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalRequests>0&&(
              <div className="pagination">
                <div className="page-info">Showing {recentRequests.length} of {totalRequests}</div>
                <button className="btn-secondary" style={{padding:'7px 14px',fontSize:12}} onClick={()=>nav('/history')}>View All →</button>
              </div>
            )}
          </div>

          <div id="recent-activities" className="card" style={{scrollMarginTop:20}}>
            <div className="card-header"><div className="card-title" style={{display:'flex',alignItems:'center',gap:6}}><Activity size={15}/> Recent Activities</div></div>
            <div className="card-body" style={{padding:'8px 0'}}>
              {activities.length===0&&<div style={{padding:'20px',textAlign:'center',fontSize:13,color:'var(--slate-400)'}}>No activity yet</div>}
              {activities.map((a,i)=>(
                <div key={i} style={{display:'flex',gap:10,alignItems:'center',padding:'10px 22px',borderBottom:i<activities.length-1?'1px solid var(--slate-50)':'none'}}>
                  <span style={{fontSize:16}}>{a.icon}</span>
                  <span style={{flex:1,fontSize:13,color:'var(--slate-700)'}}>{a.text}</span>
                  <span style={{fontSize:11,color:'var(--slate-400)'}}>{new Date(a.date).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dash-col">
          <div id="blood-availability" className="card" style={{scrollMarginTop:20}}>
            <div className="card-header">
              <div className="card-title">Blood Availability</div>
              <span style={{fontSize:11,color:'var(--slate-500)'}}>All banks (Safe stock)</span>
            </div>
            <div className="card-body">
              {inventory.map(i=>{
                const pct=Math.min(100,Math.round((i.units/maxInv)*100));
                const cls=i.units<5?'inv-fill-low':i.units<15?'inv-fill-mid':'inv-fill-ok';
                return(
                  <div className="inv-bar-wrap" key={i.group}>
                    <div className="inv-bar-hdr">
                      <span className="inv-bar-label">{i.group}</span>
                      <span className="inv-bar-val" style={{color:i.units<5?'var(--red-600)':'var(--slate-900)'}}>{i.units} bags{i.units<5?' ⚠️':''}</span>
                    </div>
                    <div className="inv-bar-track">
                      <div className={`inv-bar-fill ${cls}`} style={{width:`${pct}%`}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {inTransit.length>0&&(
            <div className="card">
              <div className="card-header"><div className="card-title" style={{display:'flex',alignItems:'center',gap:6}}><Truck size={15}/> Blood In Transit — Details</div></div>
              <div className="card-body" style={{display:'flex',flexDirection:'column',gap:10}}>
                {inTransit.map(r=>(
                  <div key={r._id} style={{padding:'10px 12px',background:'var(--slate-50)',borderRadius:8,fontSize:12}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                      <span className="blood-badge" style={{fontSize:10}}>{r.bloodGroup}</span>
                      <span style={{color:'var(--slate-500)'}}>{r.units} units</span>
                    </div>
                    {r.dispatchDriver&&<div style={{color:'var(--slate-500)'}}>Driver: {r.dispatchDriver} {r.dispatchVehicle&&`· ${r.dispatchVehicle}`}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header"><div className="card-title">Quick Actions</div></div>
            <div className="card-body" style={{padding:16}}>
              {[
                {label:'New Blood Request',   sub:'Request blood from blood bank', icon:'🩸', action:()=>nav('/blood-requests'), color:'var(--primary)'},
                {label:'Register Patient',     sub:'Add new patient record',        icon:'👤', action:()=>nav('/patients'),       color:'var(--purple-500)'},
                {label:'Donor Testing',        sub:'Review pending appointments',   icon:'🧪', action:()=>nav('/donor-testing'),  color:'#7C3AED'},
                {label:'View History',         sub:'All past blood requests',       icon:'📋', action:()=>nav('/history'),        color:'var(--green-600)'},
              ].map(({label,sub,icon,action,color})=>(
                <div key={label} onClick={action} style={{display:'flex',alignItems:'center',gap:12,padding:'12px',borderRadius:'var(--r)',border:'1.5px solid var(--slate-200)',marginBottom:10,cursor:'pointer',transition:'all .15s'}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=color;e.currentTarget.style.background='var(--slate-50)'}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--slate-200)';e.currentTarget.style.background='#fff'}}>
                  <div style={{width:38,height:38,background:'var(--slate-100)',borderRadius:'var(--r-sm)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{icon}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:'var(--slate-900)'}}>{label}</div>
                    <div style={{fontSize:12,color:'var(--slate-500)'}}>{sub}</div>
                  </div>
                  <ChevronRight size={14} color="var(--slate-400)"/>
                </div>
              ))}
            </div>
          </div>

          <div id="staff-on-duty" className="card" style={{scrollMarginTop:20}}>
            <div className="card-header"><div className="card-title">Staff On Duty</div></div>
            <div className="card-body" style={{textAlign:'center',padding:'24px 16px'}}>
              <Users size={28} style={{opacity:.3,marginBottom:8}}/>
              <div style={{fontSize:13,color:'var(--slate-400)'}}>Coming soon — hospital staff scheduling not yet built</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">Fulfilment Rate</div></div>
            <div className="card-body" style={{textAlign:'center'}}>
              <div style={{position:'relative',width:120,height:120,margin:'0 auto 16px'}}>
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="var(--slate-100)" strokeWidth="12"/>
                  <circle cx="60" cy="60" r="50" fill="none" stroke="var(--primary)" strokeWidth="12"
                    strokeDasharray={`${2*Math.PI*50*(fulfilmentRate/100)} ${2*Math.PI*50}`}
                    strokeLinecap="round" transform="rotate(-90 60 60)"/>
                </svg>
                <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
                  <div style={{fontSize:24,fontWeight:800,fontFamily:'var(--font-disp)',color:'var(--primary)'}}>{fulfilmentRate}%</div>
                </div>
              </div>
              <div style={{fontSize:13,color:'var(--slate-500)'}}>
                {fulfilledRequests} of {totalRequests} requests fulfilled successfully
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const StatCard=({icon,color,value,label,badge,badgeClass,onClick})=>(
  <div className="stat-card anim-up" style={onClick?{cursor:'pointer'}:{}} onClick={onClick}>
    <div className={`stat-icon ${color}`}>{icon}</div>
    <div className="stat-value">{typeof value==='number'?value.toLocaleString():value}</div>
    <div className="stat-label">{label}</div>
    {badge&&<div className={`stat-badge ${badgeClass}`}>{badge}</div>}
  </div>
);