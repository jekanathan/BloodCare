import React,{useState,useEffect} from 'react';
import {useLocation} from 'react-router-dom';
import {Building2,Phone,Mail,MapPin,Droplets,X,Award,Package} from 'lucide-react';
import {useAuth} from '../context/AuthContext';
import api from '../utils/api';

const BLOOD_GROUPS=['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const COMPONENTS=['Whole Blood','PRBC','Plasma','Platelets','Cryoprecipitate'];

export default function BloodBanksPage(){
  const loc=useLocation();
  const {hospital}=useAuth();
  const [banks,setBanks]=useState([]);
  const [bags,setBags]=useState([]);
  const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState('all');
  const [selected,setSelected]=useState(null);

  const fetchAll=()=>{
    setLoading(true);
    Promise.all([
      api.get('/bloodbanks').catch(()=>({data:{bloodBanks:[]}})),
      api.get('/blood-bags?status=Safe').catch(()=>({data:{bags:[]}})),
    ]).then(([r1,r2])=>{
      setBanks((r1.data?.bloodBanks||[]).filter(b=>b.status==='approved'));
      setBags(r2.data?.bags||[]);
    }).finally(()=>setLoading(false));
  };
  useEffect(()=>{fetchAll();},[]);

  useEffect(()=>{
    const h=loc.hash.replace('#','');
    if(h) setTab(h);
  },[loc.hash]);

  const stockByBank=(bankId)=>bags.filter(b=>b.bloodBank?._id===bankId||b.bloodBank===bankId);

  const nearby=banks.filter(b=>b.district&&hospital?.district&&b.district===hospital.district);

  const availByGroup=BLOOD_GROUPS.map(g=>({group:g,count:bags.filter(b=>b.bloodGroup===g).length}));
  const availByComponent=COMPONENTS.map(c=>({component:c,count:bags.filter(b=>b.component===c).length}));

  const counts={total:banks.length,totalBags:bags.length,nearby:nearby.length};

  return(
    <div className="anim-up">
      <div className="page-hdr">
        <div><h1>Blood Banks</h1><p>Directory of approved blood banks (view only)</p></div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:22}}>
        {[
          {label:'Blood Banks',value:counts.total,color:'var(--primary)'},
          {label:'Safe Blood Bags (All)',value:counts.totalBags,color:'var(--green-600)'},
          {label:'Near Your Hospital',value:counts.nearby,color:'#7C3AED'},
        ].map(({label,value,color})=>(
          <div key={label} className="card" style={{padding:'16px 20px'}}>
            <div style={{fontSize:26,fontWeight:800,fontFamily:'var(--font-disp)',color,marginBottom:3}}>{value}</div>
            <div style={{fontSize:13,color:'var(--slate-500)'}}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{display:'flex',gap:4,marginBottom:20,background:'var(--slate-100)',padding:4,borderRadius:'var(--r-sm)',width:'fit-content',flexWrap:'wrap'}}>
        {[
          {k:'all',       l:'All Blood Banks'},
          {k:'availability',l:'Blood Availability'},
          {k:'components',l:'Blood Components'},
          {k:'nearby',    l:'Nearby Blood Banks'},
          {k:'contacts',  l:'Contact Directory'},
        ].map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)} style={{
            padding:'7px 14px',borderRadius:'var(--r-sm)',border:'none',cursor:'pointer',fontSize:12.5,fontWeight:600,
            background:tab===t.k?'#fff':'transparent',color:tab===t.k?'var(--slate-900)':'var(--slate-500)',
            boxShadow:tab===t.k?'var(--sh-sm)':'none',
          }}>{t.l}</button>
        ))}
      </div>

      {(tab==='all'||tab==='nearby')&&(
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
          {loading&&<div className="card"><div className="empty-state"><p>Loading...</p></div></div>}
          {!loading&&(tab==='nearby'?nearby:banks).map(b=>(
            <div key={b._id} className="card" style={{padding:'18px 20px',cursor:'pointer'}} onClick={()=>setSelected(b)}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                <div style={{width:40,height:40,borderRadius:10,background:'var(--primary-100)',color:'var(--primary)',display:'flex',alignItems:'center',justifyContent:'center'}}><Building2 size={18}/></div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:700,color:'var(--slate-900)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.bankName}</div>
                  <div style={{fontSize:11,color:'var(--slate-400)',display:'flex',alignItems:'center',gap:4}}><MapPin size={11}/>{b.district}</div>
                </div>
              </div>
              <div style={{fontSize:12,color:'var(--slate-500)',display:'flex',alignItems:'center',gap:6}}><Droplets size={12}/>{stockByBank(b._id).length} safe bags available</div>
            </div>
          ))}
          {!loading&&(tab==='nearby'?nearby:banks).length===0&&(
            <div className="card" style={{gridColumn:'span 3'}}><div className="empty-state"><Building2 size={32} style={{opacity:.3,marginBottom:8}}/><p>No blood banks found</p></div></div>
          )}
        </div>
      )}

      {tab==='availability'&&(
        <div className="card">
          <div className="card-header"><div className="card-title">Blood Availability — All Banks (Safe Stock)</div></div>
          <div className="card-body" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14}}>
            {availByGroup.map(a=>(
              <div key={a.group} style={{textAlign:'center',padding:'16px',background:'var(--slate-50)',borderRadius:10}}>
                <div className="blood-badge" style={{marginBottom:8,fontSize:14}}>{a.group}</div>
                <div style={{fontSize:22,fontWeight:800,fontFamily:'var(--font-disp)',color:a.count<5?'var(--red-600)':'var(--slate-900)'}}>{a.count}</div>
                <div style={{fontSize:11,color:'var(--slate-500)'}}>bags</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==='components'&&(
        <div className="card">
          <div className="card-header"><div className="card-title" style={{display:'flex',alignItems:'center',gap:6}}><Package size={15}/> Blood Components — All Banks</div></div>
          <div className="card-body" style={{display:'flex',flexDirection:'column',gap:10}}>
            {availByComponent.map(c=>(
              <div key={c.component} style={{display:'flex',justifyContent:'space-between',padding:'10px 14px',background:'var(--slate-50)',borderRadius:8,fontSize:13}}>
                <span style={{fontWeight:600}}>{c.component}</span>
                <span style={{fontWeight:700,color:'var(--primary)'}}>{c.count} bags</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==='contacts'&&(
        <div className="card">
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Blood Bank</th><th>District</th><th>Phone</th><th>Email</th></tr></thead>
              <tbody>
                {loading&&<tr><td colSpan={4}><div className="empty-state"><p>Loading...</p></div></td></tr>}
                {!loading&&banks.map(b=>(
                  <tr key={b._id}>
                    <td><div className="td-name">{b.bankName}</div></td>
                    <td style={{fontSize:13}}>{b.district||'—'}</td>
                    <td style={{fontSize:13,display:'flex',alignItems:'center',gap:6}}><Phone size={12}/>{b.phone||'—'}</td>
                    <td style={{fontSize:13,display:'flex',alignItems:'center',gap:6}}><Mail size={12}/>{b.email||'—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected&&(
        <div className="modal-overlay" onClick={()=>setSelected(null)}>
          <div className="modal" style={{maxWidth:480}} onClick={e=>e.stopPropagation()}>
            <div className="modal-hdr">
              <div className="modal-title">{selected.bankName}</div>
              <button className="action-btn" onClick={()=>setSelected(null)}><X size={14}/></button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <div className="detail-field"><div className="detail-label">District</div><div className="detail-value">{selected.district||'—'}</div></div>
                <div className="detail-field"><div className="detail-label">Registration No.</div><div className="detail-value">{selected.registrationNumber||'—'}</div></div>
              </div>
              <div className="detail-row">
                <div className="detail-field"><div className="detail-label">Phone</div><div className="detail-value">{selected.phone||'—'}</div></div>
                <div className="detail-field"><div className="detail-label">Email</div><div className="detail-value">{selected.email||'—'}</div></div>
              </div>
              {selected.licenseNumber&&(
                <div style={{background:'var(--slate-50)',borderRadius:8,padding:12,marginTop:8,fontSize:13,display:'flex',alignItems:'center',gap:8}}>
                  <Award size={14}/> <b>License:</b> {selected.licenseNumber} {selected.licenseExpiry&&`(expires ${new Date(selected.licenseExpiry).toLocaleDateString('en-GB')})`}
                </div>
              )}
              <div style={{background:'var(--primary-50)',borderRadius:8,padding:12,marginTop:12,fontSize:13,display:'flex',alignItems:'center',gap:8}}>
                <Droplets size={14}/> <b>{stockByBank(selected._id).length}</b> Safe blood bags currently available
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={()=>setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}