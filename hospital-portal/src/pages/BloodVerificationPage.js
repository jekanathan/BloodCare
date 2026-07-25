import React,{useState,useEffect} from 'react';
import {useLocation} from 'react-router-dom';
import {QrCode,CheckCircle,XCircle,AlertTriangle,History,Info} from 'lucide-react';
import api from '../utils/api';

export default function BloodVerificationPage(){
  const loc=useLocation();
  const [tab,setTab]=useState('scan');
  const [bagId,setBagId]=useState('');
  const [verifiedBy,setVerifiedBy]=useState('');
  const [result,setResult]=useState(null);
  const [checking,setChecking]=useState(false);
  const [history,setHistory]=useState([]);
  const [loadingHistory,setLoadingHistory]=useState(false);

  useEffect(()=>{
    const h=loc.hash.replace('#','');
    if(h) setTab(h);
  },[loc.hash]);

  useEffect(()=>{
    if(tab==='history'){
      setLoadingHistory(true);
      api.get('/hospital-verification/history').then(r=>setHistory(r.data?.history||[])).finally(()=>setLoadingHistory(false));
    }
  },[tab]);

  const verify=async(e)=>{
    e.preventDefault();
    if(!bagId.trim())return;
    setChecking(true);setResult(null);
    try{
      const r=await api.post('/hospital-verification/verify',{bagId,verifiedBy});
      setResult({ok:true,...r.data});
    }catch(err){
      setResult({ok:false,...err.response?.data});
    }finally{setChecking(false);}
  };

  const RESULT_UI={
    Valid:  {icon:CheckCircle,color:'var(--green-600)',bg:'var(--green-50)',border:'var(--green-100)',label:'✓ Valid & Safe to Use'},
    Unsafe: {icon:AlertTriangle,color:'var(--red-600)',bg:'var(--red-50)',border:'var(--red-100)',label:'⚠️ Bag Found but NOT Safe'},
    Invalid:{icon:XCircle,color:'var(--red-700)',bg:'var(--red-50)',border:'var(--red-100)',label:'✗ Bag ID Not Found — Possibly Counterfeit'},
  };

  return(
    <div className="anim-up">
      <div className="page-hdr">
        <div><h1>Blood Verification</h1><p>Verify blood bag authenticity before transfusion</p></div>
      </div>

      <div style={{background:'var(--primary-50)',border:'1px solid var(--primary-100)',borderRadius:'var(--r)',padding:'12px 16px',marginBottom:20,fontSize:13,color:'var(--primary-d)',display:'flex',alignItems:'center',gap:8}}>
        <Info size={15}/> Camera QR/Barcode scanning needs an extra library — for now, type the Bag ID printed on the label (or found under the QR code). Ask me to add camera scanning if you'd like it.
      </div>

      <div style={{display:'flex',gap:4,marginBottom:20,background:'var(--slate-100)',padding:4,borderRadius:'var(--r-sm)',width:'fit-content'}}>
        {[{k:'scan',l:'Verify Bag'},{k:'history',l:'Verification History'}].map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)} style={{
            padding:'7px 16px',borderRadius:'var(--r-sm)',border:'none',cursor:'pointer',fontSize:13,fontWeight:600,
            background:tab===t.k?'#fff':'transparent',color:tab===t.k?'var(--slate-900)':'var(--slate-500)',
            boxShadow:tab===t.k?'var(--sh-sm)':'none',
          }}>{t.l}</button>
        ))}
      </div>

      {tab==='scan'&&(
        <div style={{maxWidth:520}}>
          <div className="card" style={{padding:'24px'}}>
            <form onSubmit={verify}>
              <div className="form-group">
                <label className="form-label">Bag ID</label>
                <input className="form-input" placeholder="e.g. BB-2026-000123" value={bagId} onChange={e=>setBagId(e.target.value)} style={{fontFamily:'monospace',fontSize:15}}/>
              </div>
              <div className="form-group">
                <label className="form-label">Verified By</label>
                <input className="form-input" placeholder="Your name" value={verifiedBy} onChange={e=>setVerifiedBy(e.target.value)}/>
              </div>
              <button type="submit" disabled={checking} className="btn-primary" style={{width:'100%',justifyContent:'center'}}>
                <QrCode size={15}/> {checking?'Checking...':'Verify Bag'}
              </button>
            </form>
          </div>

          {result&&(()=>{
            const ui=RESULT_UI[result.result]||RESULT_UI.Invalid;
            const Icon=ui.icon;
            return(
              <div className="card" style={{marginTop:16,padding:'20px',background:ui.bg,border:`1px solid ${ui.border}`}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
                  <Icon size={22} color={ui.color}/>
                  <div style={{fontSize:15,fontWeight:800,color:ui.color}}>{ui.label}</div>
                </div>
                {result.bag&&(
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,fontSize:13}}>
                    <div><span style={{color:'var(--slate-500)'}}>Blood Group:</span> <b>{result.bag.bloodGroup}</b></div>
                    <div><span style={{color:'var(--slate-500)'}}>Component:</span> <b>{result.bag.component}</b></div>
                    <div><span style={{color:'var(--slate-500)'}}>Status:</span> <b>{result.bag.status}</b></div>
                    <div><span style={{color:'var(--slate-500)'}}>Blood Bank:</span> <b>{result.bag.bloodBank?.bankName||'—'}</b></div>
                    <div><span style={{color:'var(--slate-500)'}}>Collected:</span> <b>{new Date(result.bag.collectionDate).toLocaleDateString('en-GB')}</b></div>
                    <div><span style={{color:'var(--slate-500)'}}>Expires:</span> <b>{new Date(result.bag.expiryDate).toLocaleDateString('en-GB')}</b></div>
                  </div>
                )}
                {!result.bag&&<div style={{fontSize:13,color:'var(--slate-600)'}}>{result.message}</div>}
              </div>
            );
          })()}
        </div>
      )}

      {tab==='history'&&(
        <div className="card">
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Bag ID</th><th>Result</th><th>Bag Status</th><th>Verified By</th><th>Date</th></tr></thead>
              <tbody>
                {loadingHistory&&<tr><td colSpan={5}><div className="empty-state"><p>Loading...</p></div></td></tr>}
                {!loadingHistory&&history.map(h=>(
                  <tr key={h._id}>
                    <td style={{fontFamily:'monospace',fontWeight:700,fontSize:12}}>{h.bagId}</td>
                    <td><span className={`status-badge ${h.result==='Valid'?'s-fulfilled':'s-rejected'}`}>{h.result}</span></td>
                    <td style={{fontSize:13}}>{h.bagStatusAtVerification}</td>
                    <td style={{fontSize:13}}>{h.verifiedBy||'—'}</td>
                    <td style={{fontSize:12,color:'var(--slate-400)'}}>{new Date(h.createdAt).toLocaleString('en-GB')}</td>
                  </tr>
                ))}
                {!loadingHistory&&history.length===0&&(
                  <tr><td colSpan={5}><div className="empty-state"><History size={32} style={{opacity:.3,marginBottom:8}}/><p>No verification history yet</p></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}