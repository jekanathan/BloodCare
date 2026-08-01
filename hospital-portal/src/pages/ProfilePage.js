import React,{useState,useEffect,useRef} from 'react';
import {Edit2,Save,X,CheckCircle,Building2,AlertCircle,Camera} from 'lucide-react';
import {useAuth} from '../context/AuthContext';
import api from '../utils/api';

// All 25 administrative districts of Sri Lanka
const DISTRICTS=[
  'Colombo','Gampaha','Kalutara','Kandy','Matale','Nuwara Eliya',
  'Galle','Matara','Hambantota','Jaffna','Kilinochchi','Mannar',
  'Vavuniya','Mullaitivu','Batticaloa','Ampara','Trincomalee',
  'Kurunegala','Puttalam','Anuradhapura','Polonnaruwa','Badulla',
  'Monaragala','Ratnapura','Kegalle',
];

// Sri Lanka hospital classification types.
// Kept in sync with the `type` enum in server/models/Hospital.js —
// includes the original values (Government, Private, etc.) so hospitals
// already saved with those values still show correctly, plus more
// specific MOH classifications for new/updated profiles.
const TYPES=[
  'Government','Private','Teaching','Specialized','Military',
  'Provincial General Hospital','District General Hospital',
  'Base Hospital Type A','Base Hospital Type B','Divisional Hospital',
];

const EMPTY_PROFILE={
  hospitalName:'',registrationNumber:'',type:'',phone:'',email:'',
  address:'',district:'',contactPerson:'',status:'pending',
  totalRequests:0,joinedAt:null,profilePicture:'',
};

export default function ProfilePage(){
  const {hospital,setHospital,refreshHospital}=useAuth();

  const [profile,setProfile]=useState(EMPTY_PROFILE);
  const [editing,setEditing]=useState(false);
  const [draft,setDraft]=useState(EMPTY_PROFILE);
  const [saved,setSaved]=useState(false);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [saving,setSaving]=useState(false);
  const fileInputRef=useRef(null);

  // Build the profile from the real hospital record in AuthContext,
  // plus a real request count pulled from the blood-requests API.
  useEffect(()=>{
    setLoading(true);
    setError('');
    api.get('/blood-requests/my').catch(()=>({data:{requests:[]}})).then(res=>{
      const totalRequests=(res.data?.requests||[]).length;
      const merged={
        hospitalName:hospital?.hospitalName||'',
        registrationNumber:hospital?.registrationNumber||'',
        type:hospital?.type||'',
        phone:hospital?.phone||'',
        email:hospital?.email||'',
        address:hospital?.address||'',
        district:hospital?.district||'',
        contactPerson:hospital?.contactPerson||'',
        status:hospital?.status||'pending',
        totalRequests,
        joinedAt:hospital?.createdAt||null,
        profilePicture:hospital?.profilePicture||'',
      };
      setProfile(merged);
      setDraft(merged);
    }).catch(()=>setError('Could not load full profile data.'))
      .finally(()=>setLoading(false));
  },[hospital]);

  const handlePictureChange=(e)=>{
    const file=e.target.files?.[0];
    if(!file) return;
    if(!file.type.startsWith('image/')){ alert('Please choose an image file.'); return; }
    if(file.size>3*1024*1024){ alert('Image must be smaller than 3MB.'); return; }
    const reader=new FileReader();
    reader.onload=()=>setDraft(p=>({...p,profilePicture:reader.result}));
    reader.readAsDataURL(file);
  };

  const save=async()=>{
    setSaving(true);
    setError('');
    try{
      // NOTE: assumes a PUT /hospital-auth/profile endpoint exists on the backend.
      // If your real update route has a different path, change the line below.
      const r=await api.put('/hospital-auth/profile',draft);
      if(setHospital) setHospital(r.data?.hospital||r.data);
      else if(refreshHospital) await refreshHospital();
      setProfile({...draft});
      setEditing(false);
      setSaved(true);
      setTimeout(()=>setSaved(false),3000);
    }catch(err){
      setError(err.response?.data?.message||'Could not save changes — check that the profile update endpoint exists on the backend.');
    }finally{
      setSaving(false);
    }
  };

  const F=({label,k,type='text',options})=>(
    <div className="detail-field">
      <div className="detail-label">{label}</div>
      {editing?(
        options?
          <select className="form-input" style={{padding:'9px 12px',fontSize:13}} value={draft[k]} onChange={e=>setDraft(p=>({...p,[k]:e.target.value}))}>
            <option value="">Select...</option>
            {options.map(o=><option key={o} value={o}>{o}</option>)}
          </select>
        :<input type={type} className="form-input" style={{padding:'9px 12px',fontSize:13}} value={draft[k]} onChange={e=>setDraft(p=>({...p,[k]:e.target.value}))}/>
      ):<div className="detail-value">{profile[k]||'—'}</div>}
    </div>
  );

  if(loading) return <div className="loading-c"><div className="spinner"/></div>;

  return(
    <div className="anim-up">
      {saved&&(
        <div style={{background:'var(--green-100)',border:'1px solid var(--green-500)',borderRadius:'var(--r)',padding:'12px 18px',marginBottom:18,display:'flex',alignItems:'center',gap:10,color:'var(--green-700)',fontWeight:600,fontSize:14}}>
          <CheckCircle size={16}/>Profile updated successfully!
        </div>
      )}
      {error&&(
        <div style={{background:'rgba(234,179,8,.1)',border:'1px solid rgba(234,179,8,.3)',borderRadius:'var(--r)',padding:'12px 18px',marginBottom:18,display:'flex',alignItems:'center',gap:10,color:'#92400E',fontWeight:600,fontSize:13}}>
          <AlertCircle size={16}/>{error}
        </div>
      )}

      {/* Hero — brand red theme, matches sidebar gradient */}
      <div style={{background:'linear-gradient(135deg,var(--red-900) 0%,var(--red-800) 50%,var(--navy-900) 100%)',borderRadius:'var(--r-lg)',padding:'32px 36px',display:'flex',alignItems:'center',gap:24,marginBottom:24,position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 100% 0%,rgba(196,30,58,.3) 0%,transparent 50%)'}}/>
        <div
          style={{width:80,height:80,background:'rgba(255,255,255,.15)',border:'1px solid rgba(255,255,255,.2)',borderRadius:'var(--r-md)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,position:'relative',zIndex:2,overflow:'hidden',cursor:editing?'pointer':'default'}}
          onClick={()=>{ if(editing) fileInputRef.current?.click(); }}
          title={editing?'Click to change photo':''}
        >
          {(editing?draft.profilePicture:profile.profilePicture)?(
            <img src={editing?draft.profilePicture:profile.profilePicture} alt="Hospital" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
          ):(
            <Building2 size={36} color="#fff"/>
          )}
          {editing&&(
            <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.45)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <Camera size={20} color="#fff"/>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{display:'none'}}
            onChange={handlePictureChange}
          />
        </div>
        <div style={{flex:1,position:'relative',zIndex:2}}>
          <div style={{fontFamily:'var(--font-disp)',fontSize:24,fontWeight:800,color:'#fff',marginBottom:8}}>{profile.hospitalName||'Hospital Name Not Set'}</div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            {[
              {label:profile.type||'Type not set',icon:'🏥'},
              {label:profile.district||'District not set',icon:'📍'},
              {label:`${profile.totalRequests} Requests`,icon:'📋'},
              {label:profile.status==='approved'?'Verified':profile.status==='rejected'?'Rejected':'Pending Approval',icon:profile.status==='approved'?'✅':'⏳'},
            ].map(({label,icon})=>(
              <div key={label} style={{display:'flex',alignItems:'center',gap:6,background:'rgba(255,255,255,.1)',border:'1px solid rgba(255,255,255,.15)',borderRadius:100,padding:'5px 14px',fontSize:13,fontWeight:600,color:'#fff'}}>
                <span>{icon}</span>{label}
              </div>
            ))}
          </div>
        </div>
        <div style={{position:'relative',zIndex:2}}>
          {editing?(
            <div style={{display:'flex',gap:10}}>
              <button className="btn-primary" style={{padding:'9px 18px'}} onClick={save} disabled={saving}>
                <Save size={13}/>{saving?'Saving...':'Save'}
              </button>
              <button style={{padding:'9px 14px',background:'rgba(255,255,255,.1)',border:'1px solid rgba(255,255,255,.2)',borderRadius:'var(--r-sm)',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',gap:5,fontSize:13}} onClick={()=>{setDraft({...profile});setEditing(false);setError('');}}>
                <X size={13}/>Cancel
              </button>
            </div>
          ):(
            <button style={{display:'flex',alignItems:'center',gap:7,padding:'9px 16px',background:'rgba(255,255,255,.1)',border:'1px solid rgba(255,255,255,.2)',borderRadius:'var(--r-sm)',color:'#fff',cursor:'pointer',fontSize:13,fontWeight:600}} onClick={()=>{setDraft({...profile});setEditing(true);}}>
              <Edit2 size={13}/>Edit Profile
            </button>
          )}
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:22}}>
        <div style={{display:'flex',flexDirection:'column',gap:20}}>
          {/* Hospital info */}
          <div className="card">
            <div className="card-header"><div className="card-title">Hospital Information</div></div>
            <div className="card-body">
              <div className="detail-row"><F label="Hospital Name" k="hospitalName"/><F label="Registration No." k="registrationNumber"/></div>
              <div className="detail-row"><F label="Type" k="type" options={TYPES}/><F label="District" k="district" options={DISTRICTS}/></div>
              <div className="detail-row"><F label="Phone" k="phone"/><F label="Email" k="email" type="email"/></div>
              <div className="detail-row"><F label="Contact Person" k="contactPerson"/></div>
              <div style={{marginTop:4}}>
                <div className="detail-label">Address</div>
                {editing?<input className="form-input" style={{padding:'9px 12px',fontSize:13,width:'100%'}} value={draft.address} onChange={e=>setDraft(p=>({...p,address:e.target.value}))}/>
                :<div className="detail-value">{profile.address||'—'}</div>}
              </div>
            </div>
          </div>
        </div>

        {/* Right */}
        <div style={{display:'flex',flexDirection:'column',gap:20}}>
          <div className="card">
            <div className="card-header"><div className="card-title">Stats</div></div>
            <div className="card-body">
              {[
                {label:'Total Requests',value:profile.totalRequests,icon:'📋'},
                {label:'Account Status',value:profile.status?profile.status.charAt(0).toUpperCase()+profile.status.slice(1):'—',icon:'🛡️'},
                {label:'Member Since',value:profile.joinedAt?new Date(profile.joinedAt).toLocaleDateString('en-GB',{month:'long',year:'numeric'}):'—',icon:'📅'},
                {label:'Domain',value:'hospital.bloodcare.lk',icon:'🌐'},
              ].map(({label,value,icon})=>(
                <div key={label} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'11px 0',borderBottom:'1px solid var(--slate-50)'}}>
                  <div style={{display:'flex',alignItems:'center',gap:9}}>
                    <span style={{fontSize:16}}>{icon}</span>
                    <span style={{fontSize:13,color:'var(--slate-600)'}}>{label}</span>
                  </div>
                  <span style={{fontSize:13,fontWeight:700,color:'var(--slate-900)'}}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{background:'linear-gradient(135deg,var(--red-900) 0%,var(--red-800) 50%,var(--navy-900) 100%)',border:'none'}}>
            <div className="card-body">
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:32,marginBottom:12}}>{profile.status==='approved'?'🏥':'⏳'}</div>
                <div style={{fontWeight:800,fontSize:15,color:'#fff',marginBottom:6,fontFamily:'var(--font-disp)'}}>
                  {profile.status==='approved'?'Verified Hospital':'Awaiting Verification'}
                </div>
                <div style={{fontSize:12,color:'rgba(255,255,255,.7)',lineHeight:1.5}}>
                  {profile.status==='approved'
                    ?'Your hospital is verified and can submit blood requests to all connected blood banks island-wide.'
                    :'Your hospital account is pending admin approval. Some features may be limited until verified.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}