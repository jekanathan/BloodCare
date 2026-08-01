import React from 'react';
import {useNavigate} from 'react-router-dom';
import {AreaChart,Area,XAxis,YAxis,Tooltip,ResponsiveContainer,BarChart,Bar,Cell} from 'recharts';
import {Package,FileText,Droplet,Users,ChevronRight,AlertTriangle,CheckCircle,FlaskConical} from 'lucide-react';

const STATS={totalUnits:562,criticalGroups:2,pendingRequests:5,todayDonations:12,totalDonors:1248,activeCampaigns:3,testsToday:8,fulfilledToday:4};
const INVENTORY=[
  {g:'A+',u:125},{g:'A-',u:32},{g:'B+',u:98},{g:'B-',u:15},
  {g:'AB+',u:45},{g:'AB-',u:6},{g:'O+',u:167},{g:'O-',u:74},
];
const MONTHLY=[
  {m:'Aug',donations:68,requests:42},{m:'Sep',donations:82,requests:55},
  {m:'Oct',donations:74,requests:48},{m:'Nov',donations:91,requests:62},
  {m:'Dec',donations:103,requests:71},{m:'Jan',donations:112,requests:78},
];
const RECENT_REQ=[
  {_id:'1',hospital:'National Hospital',blood:'O+',units:2,priority:'Emergency',status:'pending',   time:'5 min ago'},
  {_id:'2',hospital:'Asiri Medical',    blood:'A+',units:1,priority:'Urgent',   status:'processing',time:'1 hr ago'},
  {_id:'3',hospital:'Colombo South',    blood:'B-',units:3,priority:'Normal',   status:'pending',   time:'2 hr ago'},
  {_id:'4',hospital:'Kandy Teaching',   blood:'AB-',units:2,priority:'Emergency',status:'fulfilled',time:'4 hr ago'},
];
const maxU=Math.max(...INVENTORY.map(i=>i.u));

export default function DashboardPage(){
  const nav=useNavigate();
  return(
    <div className="anim-up">
      {/* Critical stock alert */}
      {STATS.criticalGroups>0&&(
        <div style={{background:'linear-gradient(90deg,#4C1D95,var(--p))',borderRadius:'var(--r-md)',padding:'14px 20px',marginBottom:20,display:'flex',alignItems:'center',gap:14,cursor:'pointer'}} onClick={()=>nav('/inventory')}>
          <div style={{width:36,height:36,background:'rgba(255,255,255,.15)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <AlertTriangle size={18} color="#fff"/>
          </div>
          <div style={{flex:1}}>
            <div style={{fontWeight:800,color:'#fff',fontSize:14}}>⚠️ {STATS.criticalGroups} Blood Groups Critically Low — AB- (6 units) & B- (15 units)</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,.65)',marginTop:2}}>Consider launching an emergency donor campaign immediately</div>
          </div>
          <ChevronRight size={18} color="rgba(255,255,255,.7)"/>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        <StatCard icon={<Package size={20}/>}      cls="si-purple" value={STATS.totalUnits}      label="Total Units in Stock"  tag={`${STATS.criticalGroups} critical`}  tagCls="tag-alert"/>
        <StatCard icon={<FileText size={20}/>}     cls="si-amber"  value={STATS.pendingRequests} label="Pending Requests"      tag="Needs action"              tagCls="tag-warn"/>
        <StatCard icon={<Droplet size={20}/>}      cls="si-red"    value={STATS.todayDonations}  label="Donations Today"       tag="+12 units" tagCls="tag-ok"/>
        <StatCard icon={<FlaskConical size={20}/>} cls="si-teal"   value={STATS.testsToday}      label="Tests Processed"       tag="Today"     tagCls="tag-purple"/>
        <StatCard icon={<Users size={20}/>}        cls="si-purple" value={STATS.totalDonors}     label="Registered Donors"     tag="Active"    tagCls="tag-ok"/>
        <StatCard icon={<CheckCircle size={20}/>}  cls="si-green"  value={STATS.fulfilledToday}  label="Requests Fulfilled"    tag="Today"     tagCls="tag-ok"/>
      </div>

      <div className="dash-grid">
        {/* Left */}
        <div className="dash-col">
          {/* Donations vs requests chart */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Donations vs Hospital Requests</div>
              <span className="status-badge s-approved">Last 6 months</span>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={MONTHLY} margin={{top:5,right:10,left:-20,bottom:0}}>
                  <defs>
                    <linearGradient id="dG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--p)" stopOpacity={.25}/><stop offset="95%" stopColor="var(--p)" stopOpacity={0}/></linearGradient>
                    <linearGradient id="rG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--red-600)" stopOpacity={.2}/><stop offset="95%" stopColor="var(--red-600)" stopOpacity={0}/></linearGradient>
                  </defs>
                  <XAxis dataKey="m" tick={{fontSize:12,fill:'#94A3B8'}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:12,fill:'#94A3B8'}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={{background:'#0F172A',border:'none',borderRadius:8,color:'#fff',fontSize:13}} cursor={{strokeDasharray:'4 4'}}/>
                  <Area type="monotone" dataKey="donations" name="Donations" stroke="var(--p)"       strokeWidth={2.5} fill="url(#dG)"/>
                  <Area type="monotone" dataKey="requests"  name="Requests"  stroke="var(--red-600)" strokeWidth={2}   fill="url(#rG)"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pending hospital requests */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Pending Hospital Requests</div>
              <button className="btn-primary" style={{padding:'7px 14px',fontSize:12}} onClick={()=>nav('/hospital-requests')}>View All →</button>
            </div>
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>Hospital</th><th>Blood</th><th>Units</th><th>Priority</th><th>Time</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {RECENT_REQ.map(r=>(
                    <tr key={r._id}>
                      <td><div className="td-name">{r.hospital}</div></td>
                      <td><span className="blood-badge">{r.blood}</span></td>
                      <td style={{fontWeight:700}}>{r.units}</td>
                      <td><span className={`priority-badge ${r.priority==='Emergency'?'p-emergency':r.priority==='Urgent'?'p-urgent':'p-normal'}`}>{r.priority}</span></td>
                      <td style={{fontSize:12,color:'var(--slate-400)'}}>{r.time}</td>
                      <td><span className={`status-badge s-${r.status}`}>{r.status}</span></td>
                      <td>
                        {r.status==='pending'&&(
                          <button className="btn-success" style={{padding:'5px 10px',fontSize:12}}>Accept</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="dash-col">
          {/* Inventory snapshot */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Inventory Snapshot</div>
              <button className="btn-secondary" style={{padding:'6px 12px',fontSize:12}} onClick={()=>nav('/inventory')}>Manage →</button>
            </div>
            <div className="card-body" style={{padding:'16px 22px'}}>
              {INVENTORY.map(i=>{
                const pct=Math.min(100,Math.round((i.u/maxU)*100));
                const critical=i.u<20;const low=i.u<50;
                return(
                  <div key={i.g} style={{marginBottom:12}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                      <span style={{fontSize:13,fontWeight:700,color:'var(--slate-700)'}}>{i.g}</span>
                      <span style={{fontSize:13,fontWeight:800,color:critical?'var(--red-600)':low?'var(--amber-500)':'var(--slate-900)'}}>{i.u} units{critical?' 🔴':low?' 🟡':''}</span>
                    </div>
                    <div style={{height:7,background:'var(--slate-100)',borderRadius:4,overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${pct}%`,borderRadius:4,background:critical?'linear-gradient(90deg,#DC2626,#F87171)':low?'linear-gradient(90deg,#D97706,#FCD34D)':'linear-gradient(90deg,var(--p),#A78BFA)',transition:'width .8s ease'}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick actions */}
          <div className="card">
            <div className="card-header"><div className="card-title">Quick Actions</div></div>
            <div className="card-body" style={{padding:14}}>
              {[
                {label:'Update Inventory',   icon:'📦', path:'/inventory',         color:'var(--p)'},
                {label:'Process Donation',   icon:'🩸', path:'/donations',          color:'var(--red-600)'},
                {label:'Run Blood Tests',    icon:'🧪', path:'/blood-testing',      color:'var(--teal-500)'},
                {label:'New Campaign',       icon:'📢', path:'/campaigns',          color:'var(--amber-500)'},
                {label:'Notify Donors',      icon:'🔔', path:'/donors',             color:'var(--green-600)'},
              ].map(({label,icon,path,color})=>(
                <div key={label} onClick={()=>nav(path)} style={{display:'flex',alignItems:'center',gap:12,padding:'11px',borderRadius:'var(--r)',border:'1.5px solid var(--slate-200)',marginBottom:8,cursor:'pointer',transition:'all .15s'}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=color;e.currentTarget.style.background='var(--slate-50)'}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--slate-200)';e.currentTarget.style.background='#fff'}}>
                  <div style={{width:36,height:36,background:'var(--slate-100)',borderRadius:'var(--r-sm)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,flexShrink:0}}>{icon}</div>
                  <span style={{fontSize:13,fontWeight:700,color:'var(--slate-900)'}}>{label}</span>
                  <ChevronRight size={14} color="var(--slate-400)" style={{marginLeft:'auto'}}/>
                </div>
              ))}
            </div>
          </div>

          {/* Today summary */}
          <div className="card" style={{background:'linear-gradient(135deg,#1E0B3B,#3B0E6E)',border:'none'}}>
            <div className="card-body">
              <div style={{fontSize:13,fontWeight:700,color:'rgba(255,255,255,.45)',marginBottom:14,textTransform:'uppercase',letterSpacing:'.5px'}}>Today's Summary</div>
              {[
                {icon:'🩸',label:'Donations received',value:STATS.todayDonations},
                {icon:'🏥',label:'Requests fulfilled', value:STATS.fulfilledToday},
                {icon:'🧪',label:'Tests completed',    value:STATS.testsToday},
                {icon:'🔔',label:'Donors notified',    value:23},
              ].map(({icon,label,value})=>(
                <div key={label} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,.07)'}}>
                  <div style={{display:'flex',alignItems:'center',gap:10}}><span style={{fontSize:16}}>{icon}</span><span style={{fontSize:13,color:'rgba(255,255,255,.65)'}}>{label}</span></div>
                  <span style={{fontSize:16,fontWeight:800,color:'#C4B5FD',fontFamily:'var(--font-disp)'}}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const StatCard=({icon,cls,value,label,tag,tagCls})=>(
  <div className="stat-card anim-up">
    <div className={`stat-icon ${cls}`}>{icon}</div>
    <div className="stat-value">{typeof value==='number'?value.toLocaleString():value}</div>
    <div className="stat-label">{label}</div>
    {tag&&<div className={`stat-tag ${tagCls}`}>{tag}</div>}
  </div>
);
