import React,{useState} from 'react';
import {UserPlus,Send,CheckCircle,Clock,X} from 'lucide-react';

const BG=['A+','A-','B+','B-','AB+','AB-','O+','O-'];

const MOCK_SENT=[
  {_id:'1',bloodGroup:'O+',units:2,message:'Emergency surgery patient — urgent need',sentAt:new Date().toISOString(),notified:23,responded:7,status:'active'},
  {_id:'2',bloodGroup:'AB-',units:1,message:'Rare blood group needed for transplant',sentAt:new Date(Date.now()-3600000).toISOString(),notified:5,responded:2,status:'active'},
  {_id:'3',bloodGroup:'A+',units:3,message:'Multiple trauma patients admitted',sentAt:new Date(Date.now()-86400000).toISOString(),notified:45,responded:18,status:'completed'},
];

const DONORS_RESPONDED=[
  {_id:'d1',name:'Kamal Perera',bloodGroup:'O+',phone:'071-234-5678',status:'accepted',district:'Colombo'},
  {_id:'d2',name:'Nimal Silva',  bloodGroup:'O+',phone:'072-345-6789',status:'accepted',district:'Colombo'},
  {_id:'d3',name:'Sandya F.',    bloodGroup:'O+',phone:'073-456-7890',status:'pending', district:'Gampaha'},
  {_id:'d4',name:'Roshan J.',    bloodGroup:'O+',phone:'074-567-8901',status:'declined',district:'Colombo'},
];

export default function DonorRequestsPage(){
  const [requests,setRequests]=useState(MOCK_SENT);
  const [selected,setSelected]=useState(null);
  const [showNew,setShowNew]=useState(false);
  const [form,setForm]=useState({bloodGroup:'',units:'',message:''});
  const [toast,setToast]=useState('');

  const showToast=msg=>{setToast(msg);setTimeout(()=>setToast(''),3000)};

  const handleSend=e=>{
    e.preventDefault();
    const r={_id:Date.now().toString(),...form,units:parseInt(form.units),sentAt:new Date().toISOString(),notified:0,responded:0,status:'active'};
    setRequests(p=>[r,...p]);setShowNew(false);setForm({bloodGroup:'',units:'',message:''});
    showToast('Emergency notification sent to matching donors!');
  };

  return(
    <div className="anim-up">
      <div className="page-hdr">
        <div><h1>Donor Requests</h1><p>Send emergency notifications to matching blood donors</p></div>
        <button className="btn-primary" onClick={()=>setShowNew(true)}><Send size={15}/>Send Donor Request</button>
      </div>

      {toast&&(
        <div className="toast">
          <div className="toast-icon"><CheckCircle size={18} color="var(--green-600)"/></div>
          <div style={{fontSize:14,fontWeight:600,color:'var(--slate-900)'}}>{toast}</div>
        </div>
      )}

      {/* How it works */}
      <div className="card" style={{marginBottom:22}}>
        <div className="card-body" style={{padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:'var(--slate-500)',marginBottom:14,textTransform:'uppercase',letterSpacing:'.5px'}}>How Donor Requests Work</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>
            {[
              {n:1,icon:'🏥',text:'Hospital sends emergency request with blood group needed'},
              {n:2,icon:'🔔',text:'System notifies all matching donors via Firebase notifications'},
              {n:3,icon:'✅',text:'Donors accept or decline the request'},
              {n:4,icon:'🩸',text:'Donors visit blood bank & donate blood'},
            ].map(({n,icon,text})=>(
              <div key={n} style={{textAlign:'center',padding:'16px 12px',borderRadius:'var(--r)',border:'1.5px solid var(--slate-200)'}}>
                <div style={{width:36,height:36,borderRadius:'50%',background:'var(--primary-100)',color:'var(--primary)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:15,margin:'0 auto 10px',fontFamily:'var(--font-disp)'}}>{n}</div>
                <div style={{fontSize:24,marginBottom:8}}>{icon}</div>
                <div style={{fontSize:12,color:'var(--slate-600)',lineHeight:1.5}}>{text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sent requests */}
      <div className="card">
        <div className="card-header"><div className="card-title">Sent Donor Requests</div></div>
        <div style={{padding:'0 0 8px'}}>
          {requests.map(r=>(
            <div key={r._id} style={{padding:'18px 22px',borderBottom:'1px solid var(--slate-50)',cursor:'pointer',transition:'background .15s'}}
              onMouseEnter={e=>e.currentTarget.style.background='var(--slate-50)'}
              onMouseLeave={e=>e.currentTarget.style.background='#fff'}
              onClick={()=>setSelected(r)}>
              <div style={{display:'flex',alignItems:'flex-start',gap:16}}>
                <div style={{width:44,height:44,background:'var(--red-100)',color:'var(--red-700)',borderRadius:'var(--r)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:14,fontFamily:'var(--font-disp)',flexShrink:0}}>
                  {r.bloodGroup}
                </div>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
                    <div style={{fontWeight:700,fontSize:14,color:'var(--slate-900)'}}>{r.bloodGroup} Blood Needed — {r.units} units</div>
                    <span className={`status-badge ${r.status==='active'?'s-processing':'s-fulfilled'}`}>{r.status}</span>
                  </div>
                  <div style={{fontSize:13,color:'var(--slate-500)',marginBottom:8}}>{r.message}</div>
                  <div style={{display:'flex',gap:20}}>
                    <div style={{fontSize:12,color:'var(--slate-400)'}}>
                      <Clock size={11} style={{display:'inline',marginRight:4}}/>{new Date(r.sentAt).toLocaleDateString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}
                    </div>
                    <div style={{fontSize:12,fontWeight:600,color:'var(--primary)'}}>
                      🔔 {r.notified} notified
                    </div>
                    <div style={{fontSize:12,fontWeight:600,color:'var(--green-600)'}}>
                      ✅ {r.responded} responded
                    </div>
                  </div>
                </div>
                <div style={{fontSize:12,color:'var(--slate-400)'}}>View →</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Responses modal */}
      {selected&&(
        <div className="modal-overlay" onClick={()=>setSelected(null)}>
          <div className="modal" style={{maxWidth:580}} onClick={e=>e.stopPropagation()}>
            <div className="modal-hdr">
              <div className="modal-title">Donor Responses — {selected.bloodGroup}</div>
              <button className="action-btn" onClick={()=>setSelected(null)}><X size={14}/></button>
            </div>
            <div className="modal-body">
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
                {[
                  {label:'Notified',value:selected.notified,color:'var(--primary)'},
                  {label:'Responded',value:selected.responded,color:'var(--green-600)'},
                  {label:'Response Rate',value:`${selected.notified>0?Math.round((selected.responded/selected.notified)*100):0}%`,color:'var(--amber-500)'},
                ].map(({label,value,color})=>(
                  <div key={label} style={{textAlign:'center',padding:'14px',background:'var(--slate-50)',borderRadius:'var(--r)'}}>
                    <div style={{fontSize:22,fontWeight:800,fontFamily:'var(--font-disp)',color}}>{value}</div>
                    <div style={{fontSize:12,color:'var(--slate-500)'}}>{label}</div>
                  </div>
                ))}
              </div>

              <div style={{fontSize:13,fontWeight:700,color:'var(--slate-700)',marginBottom:12}}>Donor Responses</div>
              {DONORS_RESPONDED.map(d=>(
                <div key={d._id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px',borderRadius:'var(--r)',border:'1.5px solid var(--slate-200)',marginBottom:8}}>
                  <div style={{width:36,height:36,borderRadius:'50%',background:'var(--primary-100)',color:'var(--primary)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:13}}>{d.name.charAt(0)}</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:14,color:'var(--slate-900)'}}>{d.name}</div>
                    <div style={{fontSize:12,color:'var(--slate-500)'}}>{d.phone} · {d.district}</div>
                  </div>
                  <span className="blood-badge" style={{fontSize:11}}>{d.bloodGroup}</span>
                  <span className={`status-badge ${d.status==='accepted'?'s-fulfilled':d.status==='pending'?'s-pending':'s-rejected'}`}>{d.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* New request modal */}
      {showNew&&(
        <div className="modal-overlay" onClick={()=>setShowNew(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-hdr">
              <div className="modal-title">Send Emergency Donor Request 🚨</div>
              <button className="action-btn" onClick={()=>setShowNew(false)}><X size={14}/></button>
            </div>
            <form onSubmit={handleSend}>
              <div className="modal-body">
                <div style={{background:'var(--red-50)',border:'1px solid var(--red-100)',borderRadius:'var(--r)',padding:'12px 16px',marginBottom:20,fontSize:13,color:'var(--red-700)'}}>
                  🔔 This will immediately notify all matching eligible donors in your district and nearby areas via push notification.
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:16}}>
                  <div className="form-group" style={{margin:0}}><label className="form-label">Blood Group Needed</label><select className="form-input" value={form.bloodGroup} onChange={e=>setForm(p=>({...p,bloodGroup:e.target.value}))} required><option value="">Select</option>{BG.map(g=><option key={g}>{g}</option>)}</select></div>
                  <div className="form-group" style={{margin:0}}><label className="form-label">Units Required</label><input type="number" className="form-input" placeholder="e.g. 2" min="1" value={form.units} onChange={e=>setForm(p=>({...p,units:e.target.value}))} required/></div>
                </div>
                <div className="form-group"><label className="form-label">Message to Donors</label><input className="form-input" placeholder="Brief description of the urgency..." value={form.message} onChange={e=>setForm(p=>({...p,message:e.target.value}))} required/></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={()=>setShowNew(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{background:'var(--red-600)'}}><Send size={14}/>Send Emergency Notification</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
