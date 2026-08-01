import React,{useState,useEffect} from 'react';
import {useLocation} from 'react-router-dom';
import {Bell,AlertTriangle,Info} from 'lucide-react';
import api from '../utils/api';

export default function NotificationsPage(){
  const loc=useLocation();
  const [requests,setRequests]=useState([]);
  const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState('all');

  useEffect(()=>{
    setLoading(true);
    api.get('/blood-requests/my').then(r=>setRequests(r.data?.requests||[])).catch(()=>setRequests([])).finally(()=>setLoading(false));
  },[]);

  useEffect(()=>{
    const h=loc.hash.replace('#','');
    if(h) setTab(h);
  },[loc.hash]);

  const feed=(()=>{
    const items=[];
    requests.forEach(r=>{
      items.push({icon:'📋',emergency:r.priority==='Emergency',text:`New blood request submitted — ${r.bloodGroup}, ${r.units} unit(s)`,date:r.createdAt});
      if(r.approvedAt) items.push({icon:'✅',emergency:r.priority==='Emergency',text:`Request approved — ${r.bloodGroup}`,date:r.approvedAt});
      if(r.crossMatchedAt) items.push({icon:'🧪',emergency:r.priority==='Emergency',text:`Cross match ${r.crossMatch} — ${r.bloodGroup}`,date:r.crossMatchedAt});
      if(r.allocatedAt) items.push({icon:'📦',emergency:r.priority==='Emergency',text:`Blood bags allocated — ${r.bloodGroup}`,date:r.allocatedAt});
      if(r.dispatchedAt) items.push({icon:'🚚',emergency:r.priority==='Emergency',text:`Blood dispatched — ${r.bloodGroup}`,date:r.dispatchedAt});
      if(r.deliveredAt) items.push({icon:'🎉',emergency:r.priority==='Emergency',text:`Blood received — ${r.bloodGroup}`,date:r.deliveredAt});
      if(r.status==='rejected') items.push({icon:'❌',emergency:r.priority==='Emergency',text:`Request rejected — ${r.bloodGroup}`,date:r.updatedAt||r.createdAt});
      if(r.status==='cancelled') items.push({icon:'🚫',emergency:false,text:`Request cancelled — ${r.bloodGroup}`,date:r.updatedAt||r.createdAt});
    });
    return items.sort((a,b)=>new Date(b.date)-new Date(a.date));
  })();

  const filtered=tab==='emergency'?feed.filter(f=>f.emergency):feed;

  return(
    <div className="anim-up">
      <div className="page-hdr">
        <div><h1>Notifications</h1><p>Real-time updates on your hospital's blood requests</p></div>
      </div>

      <div style={{background:'var(--primary-50)',border:'1px solid var(--primary-100)',borderRadius:'var(--r)',padding:'12px 16px',marginBottom:20,fontSize:13,color:'var(--primary-d)',display:'flex',alignItems:'center',gap:8}}>
        <Info size={15}/> Messages, Announcements, Email, SMS and Templates aren't connected to a hospital-targeted messaging system yet — only real blood request status updates are shown below.
      </div>

      <div style={{display:'flex',gap:4,marginBottom:20,background:'var(--slate-100)',padding:4,borderRadius:'var(--r-sm)',width:'fit-content'}}>
        {[{k:'all',l:'All Notifications'},{k:'updates',l:'Blood Request Updates'},{k:'emergency',l:'Emergency Alerts'}].map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)} style={{
            padding:'7px 16px',borderRadius:'var(--r-sm)',border:'none',cursor:'pointer',fontSize:13,fontWeight:600,
            background:tab===t.k?'#fff':'transparent',color:tab===t.k?'var(--slate-900)':'var(--slate-500)',
            boxShadow:tab===t.k?'var(--sh-sm)':'none',
          }}>{t.l}</button>
        ))}
      </div>

      <div className="card">
        <div className="card-body" style={{padding:'8px 0'}}>
          {loading&&<div style={{padding:'30px',textAlign:'center',fontSize:13,color:'var(--slate-400)'}}>Loading...</div>}
          {!loading&&filtered.length===0&&(
            <div className="empty-state" style={{padding:'30px 0'}}><Bell size={32} style={{opacity:.3,marginBottom:8}}/><p>No notifications yet</p></div>
          )}
          {!loading&&filtered.map((f,i)=>(
            <div key={i} style={{display:'flex',gap:12,alignItems:'center',padding:'12px 20px',borderBottom:i<filtered.length-1?'1px solid var(--slate-50)':'none'}}>
              <div style={{fontSize:18}}>{f.icon}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,color:'var(--slate-800)',fontWeight:500}}>{f.text}</div>
                {f.emergency&&<span style={{fontSize:10,fontWeight:700,color:'var(--red-600)',display:'flex',alignItems:'center',gap:3,marginTop:2}}><AlertTriangle size={10}/> Emergency</span>}
              </div>
              <div style={{fontSize:11,color:'var(--slate-400)'}}>{new Date(f.date).toLocaleString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}