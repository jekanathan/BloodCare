import React,{useState,useEffect} from 'react';
import {useLocation} from 'react-router-dom';
import {Activity,Users,Droplets,UserCheck,Stethoscope,FlaskConical,AlertTriangle,Heart,Handshake,ShieldCheck,Filter} from 'lucide-react';
import api from '../utils/api';

const MODULE_CFG={
  'patient':        {label:'Patient Management',    icon:Users,        color:'var(--primary)'},
  'blood-request':  {label:'Blood Requests',        icon:Droplets,     color:'var(--red-600)'},
  'staff':          {label:'Hospital Staff',        icon:UserCheck,    color:'var(--purple-500)'},
  'donor-testing':  {label:'Donor Testing',         icon:Stethoscope,  color:'#7C3AED'},
  'blood-testing':  {label:'Blood Testing',         icon:FlaskConical, color:'var(--amber-500)'},
  'emergency':      {label:'Emergency Management',  icon:AlertTriangle,color:'var(--red-600)'},
  'transfusion':    {label:'Blood Transfusion',      icon:Heart,        color:'var(--primary)'},
  'partnership':    {label:'Hospital Partnerships', icon:Handshake,    color:'var(--green-600)'},
  'verification':   {label:'Blood Verification',    icon:ShieldCheck,  color:'var(--slate-600)'},
};

export default function ActivityLogsPage(){
  const loc=useLocation();
  const params=new URLSearchParams(loc.search);
  const initialModule=params.get('module')||'';

  const [logs,setLogs]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [moduleFilter,setModuleFilter]=useState(initialModule);

  const fetchLogs=(mod)=>{
    setLoading(true);
    setError('');
    const query=mod?`?module=${mod}`:'';
    api.get(`/hospital-activity-logs${query}`)
      .then(r=>setLogs(r.data?.logs||[]))
      .catch(()=>setError('Could not load activity logs.'))
      .finally(()=>setLoading(false));
  };

  useEffect(()=>{fetchLogs(moduleFilter);},[moduleFilter]);

  const groupByDay=(items)=>{
    const groups={};
    items.forEach(l=>{
      const d=new Date(l.createdAt);
      const key=d.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
      if(!groups[key]) groups[key]=[];
      groups[key].push(l);
    });
    return groups;
  };
  const grouped=groupByDay(logs);

  return(
    <div className="anim-up">
      <div className="page-hdr">
        <div>
          <h1>Activity Logs</h1>
          <p>Real chronological record of actions taken across your hospital account</p>
        </div>
      </div>

      <div className="card" style={{marginBottom:20}}>
        <div className="card-body" style={{padding:'14px 20px',display:'flex',alignItems:'center',gap:12}}>
          <Filter size={14} color="var(--slate-400)"/>
          <select className="filter-sel" value={moduleFilter} onChange={e=>setModuleFilter(e.target.value)}>
            <option value="">All Modules</option>
            {Object.entries(MODULE_CFG).map(([key,cfg])=>(
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
        </div>
      </div>

      {error&&(
        <div style={{background:'rgba(234,179,8,.1)',border:'1px solid rgba(234,179,8,.3)',borderRadius:8,padding:'12px 18px',marginBottom:18,fontSize:13,color:'#92400E'}}>
          ⚠️ {error}
        </div>
      )}

      <div className="card">
        <div className="card-body" style={{padding:0}}>
          {loading&&(
            <div className="empty-state"><div className="spinner" style={{margin:'0 auto'}}/></div>
          )}

          {!loading&&logs.length===0&&(
            <div className="empty-state">
              <Activity size={36} style={{margin:'0 auto 12px',opacity:.3}}/>
              <h3>No activity yet</h3>
              <p>Actions like registering patients or submitting blood requests will show up here.</p>
            </div>
          )}

          {!loading&&Object.entries(grouped).map(([day,items])=>(
            <div key={day}>
              <div style={{padding:'12px 22px',background:'var(--slate-50)',fontSize:12,fontWeight:700,color:'var(--slate-500)',textTransform:'uppercase',letterSpacing:.5}}>
                {day}
              </div>
              {items.map(log=>{
                const cfg=MODULE_CFG[log.module]||{label:log.module,icon:Activity,color:'var(--slate-500)'};
                const Icon=cfg.icon;
                return(
                  <div key={log._id} style={{display:'flex',gap:14,alignItems:'flex-start',padding:'14px 22px',borderBottom:'1px solid var(--slate-50)'}}>
                    <div style={{width:34,height:34,borderRadius:'50%',background:'var(--slate-100)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <Icon size={15} color={cfg.color}/>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13.5,color:'var(--slate-800)'}}>{log.description}</div>
                      <div style={{fontSize:11,color:'var(--slate-400)',marginTop:3}}>
                        {cfg.label} · {new Date(log.createdAt).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}