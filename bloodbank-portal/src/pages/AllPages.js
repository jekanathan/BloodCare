import React,{useState} from 'react';
import {Search,Plus,CheckCircle,X,FlaskConical,Megaphone,Users,Building2,Edit2,Save} from 'lucide-react';

/* ─── DONATIONS ─── */
const DONATIONS_DATA=[
  {_id:'1',donor:'Kamal Perera',blood:'O+',units:450,date:new Date(),bank:'Walk-in',status:'screened',testStatus:'pending'},
  {_id:'2',donor:'Nimal Silva', blood:'A+',units:450,date:new Date(Date.now()-3600000),bank:'Campaign',status:'tested',testStatus:'passed'},
  {_id:'3',donor:'Sandya F.',   blood:'B+',units:450,date:new Date(Date.now()-7200000),bank:'Walk-in',status:'completed',testStatus:'passed'},
  {_id:'4',donor:'Roshan J.',   blood:'AB-',units:450,date:new Date(Date.now()-86400000),bank:'Hospital referral',status:'completed',testStatus:'passed'},
];

export function DonationsPage(){
  const [donations,setDonations]=useState(DONATIONS_DATA);
  const [showNew,setShowNew]=useState(false);
  const [form,setForm]=useState({donor:'',blood:'O+',source:'Walk-in'});

  const submit=e=>{
    e.preventDefault();
    setDonations(p=>[{_id:Date.now().toString(),...form,units:450,date:new Date(),status:'screened',testStatus:'pending'},...p]);
    setShowNew(false);setForm({donor:'',blood:'O+',source:'Walk-in'});
  };

  return(
    <div className="anim-up">
      <div className="page-hdr"><div><h1>Donations</h1><p>{donations.length} donations recorded</p></div>
        <button className="btn-primary" onClick={()=>setShowNew(true)}><Plus size={15}/>Record Donation</button></div>

      <div className="card">
        <div className="tbl-wrap"><table>
          <thead><tr><th>Donor</th><th>Blood</th><th>Volume</th><th>Source</th><th>Date</th><th>Status</th><th>Test</th></tr></thead>
          <tbody>
            {donations.map(d=>(
              <tr key={d._id}>
                <td><div className="td-name">{d.donor}</div></td>
                <td><span className="blood-badge">{d.blood}</span></td>
                <td style={{fontWeight:700}}>{d.units} ml</td>
                <td style={{fontSize:13,color:'var(--slate-500)'}}>{d.bank||d.source}</td>
                <td style={{fontSize:12,color:'var(--slate-400)'}}>{new Date(d.date).toLocaleDateString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</td>
                <td><span className={`status-badge ${d.status==='completed'?'s-fulfilled':d.status==='tested'?'s-approved':'s-processing'}`}>{d.status}</span></td>
                <td><span className={`status-badge ${d.testStatus==='passed'?'s-fulfilled':d.testStatus==='failed'?'s-rejected':'s-pending'}`}>{d.testStatus}</span></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>

      {showNew&&(
        <div className="modal-overlay" onClick={()=>setShowNew(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-hdr"><div className="modal-title">Record New Donation</div><button className="action-btn" onClick={()=>setShowNew(false)}><X size={14}/></button></div>
            <form onSubmit={submit}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">Donor Name</label><input className="form-input" placeholder="Full name" value={form.donor} onChange={e=>setForm(p=>({...p,donor:e.target.value}))} required/></div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                  <div className="form-group" style={{margin:0}}><label className="form-label">Blood Group</label><select className="form-input" value={form.blood} onChange={e=>setForm(p=>({...p,blood:e.target.value}))}>{['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g=><option key={g}>{g}</option>)}</select></div>
                  <div className="form-group" style={{margin:0}}><label className="form-label">Source</label><select className="form-input" value={form.source} onChange={e=>setForm(p=>({...p,source:e.target.value}))}><option>Walk-in</option><option>Campaign</option><option>Hospital referral</option><option>Emergency request</option></select></div>
                </div>
              </div>
              <div className="modal-footer"><button type="button" className="btn-secondary" onClick={()=>setShowNew(false)}>Cancel</button><button type="submit" className="btn-primary"><Plus size={14}/>Record</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── DONOR MANAGEMENT ─── */
const DONORS_DATA=[
  {_id:'1',name:'Kamal Perera',blood:'O+',phone:'071-234-5678',district:'Colombo',donations:7,lastDonation:'2025-01-12',eligible:true,status:'approved'},
  {_id:'2',name:'Nimal Silva', blood:'A+',phone:'072-345-6789',district:'Kandy',  donations:3,lastDonation:'2024-11-05',eligible:true, status:'approved'},
  {_id:'3',name:'Sandya F.',   blood:'B+',phone:'073-456-7890',district:'Galle',  donations:5,lastDonation:'2024-12-20',eligible:true, status:'approved'},
  {_id:'4',name:'Roshan J.',   blood:'AB-',phone:'074-567-8901',district:'Colombo',donations:1,lastDonation:'2024-06-10',eligible:false,status:'approved'},
];

export function DonorManagementPage(){
  const [donors]=useState(DONORS_DATA);
  const [search,setSearch]=useState('');
  const [bloodF,setBloodF]=useState('');

  const filtered=donors.filter(d=>{
    const ms=!search||d.name.toLowerCase().includes(search.toLowerCase());
    const mb=!bloodF||d.blood===bloodF;
    return ms&&mb;
  });

  return(
    <div className="anim-up">
      <div className="page-hdr"><div><h1>Donor Management</h1><p>{donors.filter(d=>d.eligible).length} eligible donors</p></div>
        <button className="btn-primary"><Plus size={15}/>Notify All Eligible</button></div>
      <div className="card">
        <div className="card-header">
          <div className="filters-bar" style={{margin:0,width:'100%'}}>
            <div className="search-wrap"><Search size={14}/><input className="search-inp" placeholder="Search donors..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
            <select className="filter-sel" value={bloodF} onChange={e=>setBloodF(e.target.value)}>
              <option value="">All Blood Groups</option>{['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g=><option key={g}>{g}</option>)}
            </select>
          </div>
        </div>
        <div className="tbl-wrap"><table>
          <thead><tr><th>Donor</th><th>Blood</th><th>Phone</th><th>District</th><th>Donations</th><th>Last Donated</th><th>Eligible</th><th></th></tr></thead>
          <tbody>
            {filtered.map(d=>(
              <tr key={d._id}>
                <td><div style={{display:'flex',alignItems:'center',gap:10}}><div style={{width:34,height:34,borderRadius:'50%',background:'var(--p-100)',color:'var(--p)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800}}>{d.name.charAt(0)}</div><div className="td-name">{d.name}</div></div></td>
                <td><span className="blood-badge">{d.blood}</span></td>
                <td style={{fontSize:13,color:'var(--slate-600)'}}>{d.phone}</td>
                <td style={{color:'var(--slate-500)'}}>{d.district}</td>
                <td style={{fontWeight:700,textAlign:'center'}}>{d.donations}</td>
                <td style={{fontSize:12,color:'var(--slate-400)'}}>{d.lastDonation}</td>
                <td>{d.eligible?<span className="status-badge s-approved">Eligible</span>:<span className="status-badge s-pending">Not Yet</span>}</td>
                <td><button className="btn-secondary" style={{padding:'5px 10px',fontSize:12}}>🔔 Notify</button></td>
              </tr>
            ))}
          </tbody>
        </table></div>
        <div className="pagination"><div className="page-info">Showing {filtered.length} of {donors.length}</div></div>
      </div>
    </div>
  );
}

/* ─── CAMPAIGNS ─── */
const CAMPS_DATA=[
  {_id:'1',title:'Emergency O- Drive',   desc:'Critical shortage. Urgent donors needed.',groups:['O-'],start:'2025-02-01',end:'2025-02-07',target:50,collected:32,notified:145,status:'active'},
  {_id:'2',title:'Monthly Donation Camp', desc:'Regular monthly camp at our facility.',   groups:['All'],start:'2025-02-15',end:'2025-02-16',target:200,collected:0,notified:0,status:'upcoming'},
  {_id:'3',title:'Rare Blood Group Drive',desc:'Seeking AB- and B- donors.',              groups:['AB-','B-'],start:'2024-12-10',end:'2024-12-17',target:40,collected:38,notified:62,status:'completed'},
];

export function CampaignsPage(){
  const [camps,setCamps]=useState(CAMPS_DATA);
  const [showNew,setShowNew]=useState(false);
  const [form,setForm]=useState({title:'',desc:'',start:'',end:'',target:''});

  const submit=e=>{
    e.preventDefault();
    setCamps(p=>[{_id:Date.now().toString(),...form,target:parseInt(form.target),collected:0,notified:0,groups:['All'],status:'upcoming'},...p]);
    setShowNew(false);setForm({title:'',desc:'',start:'',end:'',target:''});
  };

  const del=id=>setCamps(p=>p.filter(c=>c._id!==id));

  return(
    <div className="anim-up">
      <div className="page-hdr"><div><h1>Campaigns</h1><p>{camps.filter(c=>c.status==='active').length} active campaigns</p></div>
        <button className="btn-primary" onClick={()=>setShowNew(true)}><Plus size={15}/>New Campaign</button></div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:18}}>
        {camps.map(c=>{
          const pct=c.target>0?Math.min(100,Math.round((c.collected/c.target)*100)):0;
          const sColor={active:'s-active',upcoming:'s-processing',completed:'s-completed'}[c.status]||'s-pending';
          return(
            <div key={c._id} className="campaign-card">
              <div className="campaign-header">
                <div>
                  <div style={{fontWeight:800,fontSize:14,color:'var(--slate-900)',fontFamily:'var(--font-disp)',marginBottom:6}}>{c.title}</div>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                    <span className={`status-badge ${sColor}`}>{c.status}</span>
                    {c.groups.map(g=><span key={g} style={{fontSize:11,fontWeight:700,background:'var(--red-100)',color:'var(--red-700)',padding:'2px 8px',borderRadius:100}}>{g}</span>)}
                  </div>
                </div>
                <button className="action-btn red" onClick={()=>del(c._id)}><X size={13}/></button>
              </div>
              <div className="campaign-body">
                <div style={{fontSize:13,color:'var(--slate-500)',marginBottom:12,lineHeight:1.5}}>{c.desc}</div>
                <div style={{display:'flex',gap:16,marginBottom:12}}>
                  <div><div style={{fontSize:10,fontWeight:700,color:'var(--slate-400)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:3}}>Start</div><div style={{fontSize:12,fontWeight:600}}>{c.start}</div></div>
                  <div><div style={{fontSize:10,fontWeight:700,color:'var(--slate-400)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:3}}>End</div><div style={{fontSize:12,fontWeight:600}}>{c.end}</div></div>
                  <div><div style={{fontSize:10,fontWeight:700,color:'var(--slate-400)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:3}}>Notified</div><div style={{fontSize:12,fontWeight:600}}>{c.notified}</div></div>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'var(--slate-500)',marginBottom:5}}>
                  <span>Progress</span><span style={{fontWeight:700,color:'var(--slate-900)'}}>{c.collected}/{c.target} units · {pct}%</span>
                </div>
                <div className="campaign-progress-track"><div className="campaign-progress-fill" style={{width:`${pct}%`}}/></div>
                {c.status==='active'&&<button className="btn-primary" style={{width:'100%',marginTop:12,justifyContent:'center',padding:'9px'}}>🔔 Send Notification</button>}
              </div>
            </div>
          );
        })}
      </div>

      {showNew&&(
        <div className="modal-overlay" onClick={()=>setShowNew(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-hdr"><div className="modal-title">Create Campaign</div><button className="action-btn" onClick={()=>setShowNew(false)}><X size={14}/></button></div>
            <form onSubmit={submit}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">Campaign Title</label><input className="form-input" placeholder="e.g. Emergency O- Blood Drive" value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} required/></div>
                <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" placeholder="Brief description..." style={{height:70,resize:'vertical'}} value={form.desc} onChange={e=>setForm(p=>({...p,desc:e.target.value}))}/></div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14}}>
                  <div className="form-group" style={{margin:0}}><label className="form-label">Start Date</label><input type="date" className="form-input" value={form.start} onChange={e=>setForm(p=>({...p,start:e.target.value}))} required/></div>
                  <div className="form-group" style={{margin:0}}><label className="form-label">End Date</label><input type="date" className="form-input" value={form.end} onChange={e=>setForm(p=>({...p,end:e.target.value}))} required/></div>
                  <div className="form-group" style={{margin:0}}><label className="form-label">Target Units</label><input type="number" className="form-input" placeholder="e.g. 100" value={form.target} onChange={e=>setForm(p=>({...p,target:e.target.value}))} required/></div>
                </div>
              </div>
              <div className="modal-footer"><button type="button" className="btn-secondary" onClick={()=>setShowNew(false)}>Cancel</button><button type="submit" className="btn-primary"><Megaphone size={14}/>Create Campaign</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── BLOOD TESTING ─── */
const TESTS_DATA=[
  {_id:'1',unit:'BU-001',donor:'Kamal Perera',blood:'O+',collected:new Date(),hiv:'Negative',hbv:'Negative',hcv:'Negative',syphilis:'Negative',malaria:'Negative',status:'passed'},
  {_id:'2',unit:'BU-002',donor:'Nimal Silva', blood:'A+',collected:new Date(Date.now()-3600000),hiv:'Negative',hbv:'Negative',hcv:'Negative',syphilis:'Negative',malaria:'Negative',status:'passed'},
  {_id:'3',unit:'BU-003',donor:'Sandya F.',   blood:'B+',collected:new Date(Date.now()-7200000),hiv:'Pending', hbv:'Pending', hcv:'Pending', syphilis:'Pending', malaria:'Pending', status:'pending'},
  {_id:'4',unit:'BU-004',donor:'Unknown',      blood:'O-',collected:new Date(Date.now()-86400000),hiv:'Negative',hbv:'Positive',hcv:'Negative',syphilis:'Negative',malaria:'Negative',status:'failed'},
];

export function BloodTestingPage(){
  const [tests]=useState(TESTS_DATA);
  const TESTS_LIST=['hiv','hbv','hcv','syphilis','malaria'];

  return(
    <div className="anim-up">
      <div className="page-hdr"><div><h1>Blood Testing</h1><p>{tests.filter(t=>t.status==='pending').length} pending · {tests.filter(t=>t.status==='failed').length} failed (quarantined)</p></div></div>

      {tests.filter(t=>t.status==='failed').length>0&&(
        <div style={{background:'var(--red-50)',border:'1.5px solid var(--red-200)',borderRadius:'var(--r-md)',padding:'14px 20px',marginBottom:22,display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontSize:20}}>⚠️</span>
          <div><div style={{fontWeight:700,fontSize:14,color:'var(--red-700)'}}>Failed Units Quarantined</div>
          <div style={{fontSize:13,color:'var(--red-600)'}}>{tests.filter(t=>t.status==='failed').map(t=>t.unit).join(', ')} — Do NOT add to inventory</div></div>
        </div>
      )}

      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Unit ID</th><th>Donor</th><th>Blood</th><th>Collected</th><th>HIV</th><th>HBV</th><th>HCV</th><th>Syphilis</th><th>Malaria</th><th>Result</th></tr></thead>
            <tbody>
              {tests.map(t=>(
                <tr key={t._id}>
                  <td style={{fontWeight:700,color:'var(--p)',fontSize:12}}>{t.unit}</td>
                  <td><div className="td-name">{t.donor}</div></td>
                  <td><span className="blood-badge">{t.blood}</span></td>
                  <td style={{fontSize:12,color:'var(--slate-400)'}}>{new Date(t.collected).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</td>
                  {TESTS_LIST.map(k=>(
                    <td key={k}>
                      <span style={{fontSize:11,fontWeight:700,padding:'3px 8px',borderRadius:100,
                        background:t[k]==='Negative'?'var(--green-100)':t[k]==='Positive'?'var(--red-100)':'var(--amber-100)',
                        color:t[k]==='Negative'?'#15803D':t[k]==='Positive'?'#991B1B':'#92400E'}}>
                        {t[k]==='Negative'?'−NEG':t[k]==='Positive'?'+POS':'...'}
                      </span>
                    </td>
                  ))}
                  <td>
                    <span className={`status-badge ${t.status==='passed'?'s-fulfilled':t.status==='failed'?'s-rejected':'s-pending'}`}>
                      {t.status==='passed'?'✓ Passed':t.status==='failed'?'✗ Failed':'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─── PROFILE ─── */
const PROFILE_DATA={bankName:'National Blood Bank',licenseNumber:'NBB/001/2024',phone:'0112345678',email:'info@nbb.lk',address:'Borella, Colombo 8',district:'Colombo',contactPerson:'Dr. Dilrukshi Perera',status:'approved',joinedAt:'2022-06-15',totalDonations:3842,totalIssued:2914};
const DISTRICTS=['Colombo','Gampaha','Kalutara','Kandy','Galle','Matara','Jaffna','Trincomalee','Kurunegala','Anuradhapura','Badulla','Ratnapura'];

export function ProfilePage(){
  const [profile,setProfile]=useState(PROFILE_DATA);
  const [editing,setEditing]=useState(false);
  const [draft,setDraft]=useState({...PROFILE_DATA});
  const [saved,setSaved]=useState(false);

  const save=()=>{setProfile({...draft});setEditing(false);setSaved(true);setTimeout(()=>setSaved(false),3000)};

  const F=({label,k,type='text',options})=>(
    <div className="detail-field">
      <div className="detail-label">{label}</div>
      {editing?(options?<select className="form-input" style={{padding:'9px 12px',fontSize:13}} value={draft[k]} onChange={e=>setDraft(p=>({...p,[k]:e.target.value}))}>{options.map(o=><option key={o}>{o}</option>)}</select>
        :<input type={type} className="form-input" style={{padding:'9px 12px',fontSize:13}} value={draft[k]} onChange={e=>setDraft(p=>({...p,[k]:e.target.value}))}/>)
      :<div className="detail-value">{profile[k]}</div>}
    </div>
  );

  return(
    <div className="anim-up">
      {saved&&<div style={{background:'var(--green-100)',border:'1px solid var(--green-500)',borderRadius:'var(--r)',padding:'12px 18px',marginBottom:18,display:'flex',alignItems:'center',gap:10,color:'var(--green-700)',fontWeight:600,fontSize:14}}><CheckCircle size={16}/>Profile updated!</div>}

      {/* Hero */}
      <div style={{background:'linear-gradient(135deg,#1E0B3B,#3B0E6E)',borderRadius:'var(--r-lg)',padding:'32px 36px',display:'flex',alignItems:'center',gap:24,marginBottom:24,position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 100% 0%,rgba(124,58,237,.2) 0%,transparent 50%)'}}/>
        <div style={{width:80,height:80,background:'var(--p)',borderRadius:'var(--r-md)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,position:'relative',zIndex:2,fontSize:32}}>🏦</div>
        <div style={{flex:1,position:'relative',zIndex:2}}>
          <div style={{fontFamily:'var(--font-disp)',fontSize:24,fontWeight:800,color:'#fff',marginBottom:8}}>{profile.bankName}</div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            {[{l:'Verified Bank',i:'✅'},{l:profile.district,i:'📍'},{l:`${profile.totalDonations.toLocaleString()} Donations`,i:'🩸'},{l:profile.licenseNumber,i:'🪪'}].map(({l,i})=>(
              <div key={l} style={{display:'flex',alignItems:'center',gap:6,background:'rgba(255,255,255,.1)',border:'1px solid rgba(255,255,255,.15)',borderRadius:100,padding:'5px 14px',fontSize:13,fontWeight:600,color:'#fff'}}><span>{i}</span>{l}</div>
            ))}
          </div>
        </div>
        <div style={{position:'relative',zIndex:2}}>
          {editing?<div style={{display:'flex',gap:10}}>
            <button className="btn-primary" onClick={save}><Save size={13}/>Save</button>
            <button style={{padding:'9px 14px',background:'rgba(255,255,255,.1)',border:'1px solid rgba(255,255,255,.2)',borderRadius:'var(--r-sm)',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',gap:5,fontSize:13}} onClick={()=>{setDraft({...profile});setEditing(false);}}><X size={13}/>Cancel</button>
          </div>:<button style={{display:'flex',alignItems:'center',gap:7,padding:'9px 16px',background:'rgba(255,255,255,.1)',border:'1px solid rgba(255,255,255,.2)',borderRadius:'var(--r-sm)',color:'#fff',cursor:'pointer',fontSize:13,fontWeight:600}} onClick={()=>setEditing(true)}><Edit2 size={13}/>Edit Profile</button>}
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:22}}>
        <div className="card">
          <div className="card-header"><div className="card-title">Blood Bank Information</div></div>
          <div className="card-body">
            <div className="detail-row"><F label="Bank Name" k="bankName"/><F label="License No." k="licenseNumber"/></div>
            <div className="detail-row"><F label="Phone" k="phone"/><F label="Email" k="email" type="email"/></div>
            <div className="detail-row"><F label="District" k="district" options={DISTRICTS}/><F label="Contact Person" k="contactPerson"/></div>
            <div style={{marginTop:4}}><div className="detail-label">Address</div>
              {editing?<input className="form-input" style={{padding:'9px 12px',fontSize:13,width:'100%'}} value={draft.address} onChange={e=>setDraft(p=>({...p,address:e.target.value}))}/>
              :<div className="detail-value">{profile.address}</div>}
            </div>
          </div>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:20}}>
          <div className="card">
            <div className="card-header"><div className="card-title">Statistics</div></div>
            <div className="card-body">
              {[{l:'Total Donations',v:profile.totalDonations.toLocaleString(),i:'🩸'},{l:'Units Issued',v:profile.totalIssued.toLocaleString(),i:'🏥'},{l:'Member Since',v:new Date(profile.joinedAt).toLocaleDateString('en-GB',{month:'long',year:'numeric'}),i:'📅'},{l:'Status',v:'Approved & Active',i:'✅'}].map(({l,v,i})=>(
                <div key={l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'11px 0',borderBottom:'1px solid var(--slate-50)'}}>
                  <div style={{display:'flex',alignItems:'center',gap:9}}><span style={{fontSize:15}}>{i}</span><span style={{fontSize:13,color:'var(--slate-600)'}}>{l}</span></div>
                  <span style={{fontSize:13,fontWeight:700,color:'var(--slate-900)'}}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card" style={{background:'linear-gradient(135deg,#1E0B3B,#3B0E6E)',border:'none'}}>
            <div className="card-body" style={{textAlign:'center'}}>
              <div style={{fontSize:36,marginBottom:10}}>🏅</div>
              <div style={{fontWeight:800,fontSize:15,color:'#fff',marginBottom:6,fontFamily:'var(--font-disp)'}}>Certified Blood Bank</div>
              <div style={{fontSize:12,color:'rgba(255,255,255,.5)',lineHeight:1.5}}>Fully licensed & integrated with BloodCare network</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
