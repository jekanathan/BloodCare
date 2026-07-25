import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Search, Eye, FileText, Phone, Mail, MapPin, Building2, ChevronRight, X, MessageSquare } from 'lucide-react';
import api from '../utils/api';

const STATUS_STEPS   = ['Registration','Under Review','Verification','Decision','Notification'];
const STATUS_MEANING = [
  {icon:'⏰',label:'Pending',      color:'#D97706', bg:'#FEF3C7',desc:'Registration submitted, waiting for review'},
  {icon:'🔍',label:'Under Review', color:'#2563EB', bg:'#DBEAFE',desc:'Admin is verifying details'},
  {icon:'✅',label:'Approved',     color:'#16A34A', bg:'#DCFCE7',desc:'Account activated, login allowed'},
  {icon:'❌',label:'Rejected',     color:'#DC2626', bg:'#FEE2E2',desc:'Registration declined with reason'},
  {icon:'⏸️',label:'Suspended',   color:'#7C3AED', bg:'#EDE9FE',desc:'Previously approved account disabled temporarily'},
];

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

export default function PendingApprovalsPage() {
  const [apps, setApps]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [apiError, setApiError] = useState('');
  const [selected, setSelected] = useState(null);
  const [view, setView]         = useState('list');
  const [search, setSearch]     = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [notes, setNotes]       = useState('');
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [viewDoc, setViewDoc]   = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchApplications = () => {
    setLoading(true);
    setApiError('');
    api.get('/pending-approvals')
      .then(res => setApps(res.data?.applications || []))
      .catch(err => {
        console.error('Fetch pending approvals error:', err);
        setApiError('Could not load applications from server.');
        setApps([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchApplications(); }, []);

  // Keep the open detail view in sync with the freshest list data
  useEffect(() => {
    if (selected) {
      const fresh = apps.find(a => a._id === selected._id);
      if (fresh) setSelected(fresh);
    }
  }, [apps]);

  const typeSlug = (type) => type === 'Hospital' ? 'hospital' : 'bloodbank';

  const filtered = apps.filter(a => {
    if (typeFilter!=='all' && a.type!==typeFilter) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) &&
        !a.appId.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const approve = async (app) => {
    setActionLoading(true);
    try {
      await api.patch(`/pending-approvals/${typeSlug(app.type)}/${app._id}/approve`);
      await fetchApplications();
      setView('list');
    } catch (err) {
      console.error('Approve error:', err);
      alert(err.response?.data?.message || 'Failed to approve application');
    } finally {
      setActionLoading(false);
    }
  };

  const reject = async (app) => {
    setActionLoading(true);
    try {
      await api.patch(`/pending-approvals/${typeSlug(app.type)}/${app._id}/reject`, { reason: rejectReason });
      await fetchApplications();
      setRejectModal(false);
      setRejectReason('');
      setView('list');
    } catch (err) {
      console.error('Reject error:', err);
      alert(err.response?.data?.message || 'Failed to reject application');
    } finally {
      setActionLoading(false);
    }
  };

  const saveNotes = async (app, value) => {
    try {
      await api.patch(`/pending-approvals/${typeSlug(app.type)}/${app._id}/notes`, { notes: value });
    } catch (err) {
      console.error('Save notes error:', err);
    }
  };

  const getStepStatus = (app, stepIndex) => {
    const statusMap = {'pending':1,'under_review':2,'approved':4,'rejected':3};
    const current = statusMap[app.status] ?? 1;
    if (stepIndex < current) return 'done';
    if (stepIndex === current) return 'active';
    return 'pending';
  };

  const getVerificationItems = (app) => [
    {label:'Required Fields',            status:'Completed',                              done:true},
    {label:'Registration Number',         status: app.regNumber ? 'Valid' : 'Missing',     done:!!app.regNumber},
    {label:'License / Certificate',       status: app.documents.length>0 ? 'Uploaded':'Not uploaded', done:app.documents.length>0},
    {label:'Contact Information',         status: (app.email && app.phone) ? 'Complete':'Incomplete', done: !!(app.email && app.phone)},
  ];

  if (loading) {
    return (
      <div className="animate-fade">
        <div className="card"><div className="empty-state"><p>Loading applications...</p></div></div>
      </div>
    );
  }

  if (view==='detail' && selected) {
    const verItems = getVerificationItems(selected);
    const progress = Math.round(verItems.filter(v=>v.done).length/verItems.length*100);

    return (
      <div className="animate-fade">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:'var(--slate-500)'}}>
            <span style={{cursor:'pointer',color:'var(--red-600)'}} onClick={()=>setView('list')}>Dashboard</span>
            <ChevronRight size={14}/>
            <span style={{cursor:'pointer',color:'var(--red-600)'}} onClick={()=>setView('list')}>Pending Approvals</span>
            <ChevronRight size={14}/>
            <span style={{color:'var(--slate-700)',fontWeight:600}}>Registration Details</span>
          </div>
          <button onClick={()=>setView('list')} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 16px',background:'var(--slate-100)',border:'none',borderRadius:'var(--r-sm)',fontSize:13,fontWeight:600,cursor:'pointer',color:'var(--slate-700)'}}>
            ← Back to Pending Approvals
          </button>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:20}}>
          <div style={{display:'flex',flexDirection:'column',gap:16}}>

            <div className="card">
              <div className="card-body" style={{padding:'20px 24px'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  {STATUS_STEPS.map((step,i)=>{
                    const status = getStepStatus(selected,i);
                    return (
                      <React.Fragment key={step}>
                        <div style={{textAlign:'center',flex:1}}>
                          <div style={{width:44,height:44,borderRadius:'50%',margin:'0 auto 8px',display:'flex',alignItems:'center',justifyContent:'center',background:status==='done'?'var(--blue-600)':status==='active'?'var(--amber-500)':'var(--slate-200)',color:'#fff',fontSize:16,fontWeight:700}}>
                            {status==='done'?<CheckCircle size={20}/>:i+1}
                          </div>
                          <div style={{fontSize:12,fontWeight:700,color:status==='pending'?'var(--slate-400)':'var(--slate-900)'}}>{step}</div>
                          <div style={{fontSize:10,color:status==='active'?'var(--amber-600)':status==='done'?'var(--blue-600)':'var(--slate-400)',marginTop:2}}>
                            {status==='done'?'Completed':status==='active'?'In Progress':'Pending'}
                          </div>
                        </div>
                        {i<STATUS_STEPS.length-1 && <div style={{flex:1,height:2,background:status==='done'?'var(--blue-600)':'var(--slate-200)',margin:'0 4px',marginBottom:32}}/>}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <Building2 size={18} color="var(--blue-600)"/>
                  <div className="card-title">Applicant Information</div>
                </div>
                <span style={{fontSize:11,fontWeight:700,padding:'4px 12px',borderRadius:100,
                  background: selected.status==='approved'?'var(--green-100)':selected.status==='rejected'?'var(--red-100)':selected.status==='under_review'?'var(--blue-100)':'var(--amber-100)',
                  color: selected.status==='approved'?'var(--green-600)':selected.status==='rejected'?'var(--red-600)':selected.status==='under_review'?'var(--blue-600)':'#D97706'}}>
                  {selected.status==='approved'?'✅ Approved':selected.status==='rejected'?'❌ Rejected':selected.status==='under_review'?'🔍 Under Review':'⏰ Pending Verification'}
                </span>
              </div>
              <div className="card-body">
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                  <div style={{display:'flex',flexDirection:'column',gap:12}}>
                    {[
                      {label:'Type',              value:selected.type,           badge:true},
                      {label:'Name',              value:selected.name},
                      {label:'Registration Number',value:selected.regNumber || '—'},
                      {label:'Established Year',  value:selected.establishedYear || '—'},
                      {label:'Address',           value:selected.address || '—'},
                      {label:'District',          value:selected.district || '—'},
                      {label:'Province',          value:selected.province || '—'},
                    ].map(({label,value,badge})=>(
                      <div key={label} style={{display:'grid',gridTemplateColumns:'160px 1fr',gap:8}}>
                        <span style={{fontSize:12,color:'var(--slate-400)',fontWeight:500}}>{label}</span>
                        {badge ? <span style={{fontSize:12,fontWeight:700,padding:'2px 10px',borderRadius:100,background:'var(--blue-100)',color:'var(--blue-600)',width:'fit-content'}}>{value}</span>
                               : <span style={{fontSize:13,fontWeight:600,color:'var(--slate-900)'}}>{value}</span>}
                      </div>
                    ))}
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:12}}>
                    {[
                      {label:'Email',           value:selected.email || '—'},
                      {label:'Phone',           value:selected.phone || '—'},
                      {label:'License Number',  value:selected.licenseNumber || '—'},
                      {label:'License Expiry',  value:selected.licenseExpiry || '—'},
                      {label:'Contact Person',  value:selected.contactPerson || '—'},
                      {label:'Designation',     value:selected.designation || '—'},
                    ].map(({label,value})=>(
                      <div key={label} style={{display:'grid',gridTemplateColumns:'160px 1fr',gap:8,alignItems:'center'}}>
                        <span style={{fontSize:12,color:'var(--slate-400)',fontWeight:500}}>{label}</span>
                        <span style={{fontSize:13,fontWeight:600,color:'var(--slate-900)'}}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {selected.status==='rejected' && selected.rejectionReason && (
                  <div style={{marginTop:16,padding:'12px 14px',background:'#FFF5F5',border:'1px solid #FEE2E2',borderRadius:'var(--r-sm)',fontSize:13,color:'var(--red-700)'}}>
                    <strong>Rejection reason:</strong> {selected.rejectionReason}
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <FileText size={18} color="var(--red-600)"/>
                  <div className="card-title">Uploaded Documents ({selected.documents.length})</div>
                </div>
              </div>
              <div className="card-body">
                {selected.documents.length === 0 && (
                  <div style={{textAlign:'center',padding:24,color:'var(--slate-400)',fontSize:13}}>No documents uploaded for this application.</div>
                )}
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14}}>
                  {selected.documents.map((doc,i)=>(
                    <div key={i} style={{border:'1px solid var(--slate-200)',borderRadius:'var(--r-sm)',padding:'16px',textAlign:'center',background:'var(--slate-50)'}}>
                      <div style={{width:48,height:56,background:'#FEE2E2',borderRadius:'var(--r-sm)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 10px',fontSize:24,position:'relative'}}>
                        📄
                        <div style={{position:'absolute',bottom:-2,right:-2,background:'var(--red-600)',color:'#fff',fontSize:8,fontWeight:700,padding:'2px 4px',borderRadius:3}}>PDF</div>
                      </div>
                      <div style={{fontSize:12,fontWeight:700,color:'var(--slate-900)',marginBottom:4,wordBreak:'break-word'}}>{doc.name}</div>
                      <div style={{fontSize:10,color:'var(--slate-400)',marginBottom:12}}>Uploaded on<br/>{doc.date}</div>
                      <button
                        onClick={()=>setViewDoc(doc)}
                        style={{padding:'7px 16px',background:'var(--red-600)',color:'#fff',border:'none',borderRadius:'var(--r-sm)',fontSize:12,fontWeight:600,cursor:'pointer',width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                        👁️ View
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">Admin Notes</div>
                <span style={{fontSize:11,color:'var(--slate-400)'}}>{notes.length}/500 Characters</span>
              </div>
              <div className="card-body">
                <textarea value={notes || selected.adminNotes || ''} onChange={e=>setNotes(e.target.value.slice(0,500))}
                  onBlur={e=>saveNotes(selected, e.target.value)}
                  placeholder="Add notes about this verification..."
                  rows={4} style={{width:'100%',padding:'10px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,fontFamily:'var(--font-body)',outline:'none',resize:'vertical'}}/>
              </div>
            </div>

            {selected.status !== 'approved' && selected.status !== 'rejected' && (
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div style={{padding:'20px',background:'var(--green-50)',border:'1.5px solid var(--green-200)',borderRadius:'var(--r-md)',textAlign:'center'}}>
                  <CheckCircle size={28} color="var(--green-600)" style={{margin:'0 auto 8px'}}/>
                  <div style={{fontSize:14,fontWeight:700,color:'var(--green-800)',marginBottom:4}}>Approve Application</div>
                  <div style={{fontSize:11,color:'var(--green-600)',marginBottom:16}}>If all details are correct and verified, you can approve application.</div>
                  <button disabled={actionLoading} onClick={()=>approve(selected)} style={{width:'100%',padding:'11px',background:'var(--green-600)',color:'#fff',border:'none',borderRadius:'var(--r-sm)',fontSize:13,fontWeight:700,cursor:actionLoading?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6,fontFamily:'var(--font-body)'}}>
                    <CheckCircle size={15}/> {actionLoading ? 'Processing...' : 'Approve & Activate'}
                  </button>
                </div>
                <div style={{padding:'20px',background:'#FFF5F5',border:'1.5px solid #FEE2E2',borderRadius:'var(--r-md)',textAlign:'center'}}>
                  <XCircle size={28} color="var(--red-600)" style={{margin:'0 auto 8px'}}/>
                  <div style={{fontSize:14,fontWeight:700,color:'var(--red-800)',marginBottom:4}}>Reject Application</div>
                  <div style={{fontSize:11,color:'var(--red-600)',marginBottom:16}}>If there are issues with the application, you can reject it.</div>
                  <button onClick={()=>setRejectModal(true)} style={{width:'100%',padding:'11px',background:'var(--red-600)',color:'#fff',border:'none',borderRadius:'var(--r-sm)',fontSize:13,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6,fontFamily:'var(--font-body)'}}>
                    <XCircle size={15}/> Reject Application
                  </button>
                </div>
              </div>
            )}
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            <div className="card">
              <div className="card-header"><div className="card-title">Application Summary</div></div>
              <div className="card-body" style={{padding:'16px 20px'}}>
                {[
                  {label:'Application ID',value:selected.appId,    bold:true},
                  {label:'Applied On',    value:selected.appliedOn},
                  {label:'Current Status',value:selected.status},
                ].map(({label,value,bold})=>(
                  <div key={label} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid var(--slate-50)'}}>
                    <span style={{fontSize:12,color:'var(--slate-500)'}}>{label}</span>
                    <span style={{fontSize:12,fontWeight:bold?700:600,color:bold?'var(--slate-900)':'var(--slate-700)'}}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-header"><div className="card-title">Verification Checklist</div></div>
              <div className="card-body" style={{padding:'12px 20px'}}>
                {verItems.map(({label,status,done})=>(
                  <div key={label} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 0',borderBottom:'1px solid var(--slate-50)'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{width:18,height:18,borderRadius:'50%',background:done?'var(--green-500)':'var(--slate-200)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        {done && <CheckCircle size={12} color="#fff"/>}
                      </div>
                      <span style={{fontSize:12,color:'var(--slate-700)',fontWeight:500}}>{label}</span>
                    </div>
                    <span style={{fontSize:11,fontWeight:600,color:done?'var(--green-600)':'var(--slate-400)'}}>{status}</span>
                  </div>
                ))}
                <div style={{marginTop:12,paddingTop:12,borderTop:'1px solid var(--slate-100)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:6}}>
                    <span style={{fontWeight:600,color:'var(--slate-700)'}}>Overall Progress</span>
                    <span style={{fontWeight:700,color:'var(--green-600)'}}>{progress}%</span>
                  </div>
                  <div style={{height:8,background:'var(--slate-100)',borderRadius:4,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${progress}%`,background:progress>=80?'var(--green-500)':progress>=50?'var(--amber-500)':'var(--red-500)',borderRadius:4,transition:'width .8s'}}/>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {rejectModal && (
          <div className="modal-overlay" onClick={()=>setRejectModal(false)}>
            <div className="modal" style={{maxWidth:460}} onClick={e=>e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title" style={{color:'var(--red-600)'}}>❌ Reject Application</div>
                <button onClick={()=>setRejectModal(false)} className="icon-btn"><X size={16}/></button>
              </div>
              <div className="modal-body">
                <div style={{background:'#FFF5F5',border:'1px solid #FEE2E2',borderRadius:'var(--r-sm)',padding:'12px 14px',marginBottom:16,fontSize:13,color:'var(--red-700)'}}>
                  ⚠️ You are about to reject <strong>{selected.name}</strong>'s application.
                </div>
                <div style={{display:'grid',gap:8,marginBottom:12}}>
                  {['Invalid or expired license','Incomplete documentation','Unverifiable contact information','Duplicate registration','Does not meet requirements'].map(reason=>(
                    <label key={reason} style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13,padding:'8px 12px',border:`1.5px solid ${rejectReason===reason?'var(--red-400)':'var(--slate-200)'}`,borderRadius:'var(--r-sm)',background:rejectReason===reason?'var(--red-50)':'#fff'}}>
                      <input type="radio" name="reason" value={reason} checked={rejectReason===reason} onChange={e=>setRejectReason(e.target.value)}/>{reason}
                    </label>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button className="action-btn btn-view" onClick={()=>setRejectModal(false)}>Cancel</button>
                <button disabled={actionLoading} className="action-btn" style={{background:'var(--red-600)',color:'#fff',border:'none'}} onClick={()=>reject(selected)}>
                  <XCircle size={14}/> {actionLoading ? 'Processing...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        )}

        {viewDoc && (
          <div className="modal-overlay" onClick={()=>setViewDoc(null)} style={{zIndex:1100,alignItems:'flex-start',paddingTop:20}}>
            <div style={{background:'#fff',borderRadius:'var(--r-lg)',width:'92%',maxWidth:880,maxHeight:'92vh',display:'flex',flexDirection:'column',overflow:'hidden'}} onClick={e=>e.stopPropagation()}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 20px',borderBottom:'1px solid var(--slate-200)',background:'var(--slate-800)',flexShrink:0}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{width:32,height:32,background:'var(--red-600)',borderRadius:'var(--r-sm)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>📄</div>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:'#fff'}}>{viewDoc.name}</div>
                    <div style={{fontSize:11,color:'rgba(255,255,255,.5)'}}>Uploaded on {viewDoc.date}</div>
                  </div>
                </div>
                <div style={{display:'flex',gap:8}}>
                  <a href={`${API_BASE_URL}${viewDoc.url}`} download target="_blank" rel="noreferrer" style={{padding:'7px 16px',background:'var(--blue-600)',color:'#fff',border:'none',borderRadius:'var(--r-sm)',fontSize:12,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:6,textDecoration:'none'}}>
                    ⬇️ Download
                  </a>
                  <button onClick={()=>setViewDoc(null)} style={{padding:'7px 14px',background:'rgba(255,255,255,.1)',color:'#fff',border:'none',borderRadius:'var(--r-sm)',fontSize:12,fontWeight:600,cursor:'pointer'}}>
                    ✕ Close
                  </button>
                </div>
              </div>
              <div style={{flex:1,overflow:'hidden',background:'#525659'}}>
                <iframe
                  src={`${API_BASE_URL}${viewDoc.url}`}
                  title={viewDoc.name}
                  style={{width:'100%',height:'100%',border:'none'}}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="animate-fade">
      {apiError && (
        <div style={{background:'rgba(234,179,8,.1)',border:'1px solid rgba(234,179,8,.3)',borderRadius:8,padding:'10px 16px',marginBottom:16,fontSize:13,color:'#92400E'}}>
          ⚠️ {apiError}
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:16,marginBottom:24}}>
        {[
          {label:'Total Pending',   value:apps.filter(a=>a.status==='pending').length,      color:'#D97706',          icon:'⏳'},
          {label:'Under Review',    value:apps.filter(a=>a.status==='under_review').length, color:'var(--blue-600)',  icon:'🔍'},
          {label:'Approved',        value:apps.filter(a=>a.status==='approved').length,     color:'var(--green-600)', icon:'✅'},
          {label:'Rejected',        value:apps.filter(a=>a.status==='rejected').length,     color:'var(--red-600)',   icon:'❌'},
          {label:'Total Applications',value:apps.length,                                     color:'var(--slate-700)', icon:'📊'},
        ].map(({label,value,color,icon})=>(
          <div key={label} className="card" style={{padding:'18px 20px',borderTop:`3px solid ${color}`}}>
            <div style={{fontSize:11,color:'var(--slate-400)',marginBottom:6}}>{icon} {label}</div>
            <div style={{fontSize:26,fontWeight:800,color,fontFamily:'var(--font-display)'}}>{value}</div>
          </div>
        ))}
      </div>

      <div className="page-header">
        <div className="page-header-left">
          <h1>Pending Approvals</h1>
          <p>Review and verify hospital & blood bank registrations</p>
        </div>
      </div>

      <div className="card" style={{marginBottom:20}}>
        <div className="card-body" style={{padding:'14px 20px'}}>
          <div className="filters-bar">
            <div className="search-input-wrap">
              <Search size={14}/>
              <input className="search-input" placeholder="Search by name or application ID..."
                value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            <select className="filter-select" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}>
              <option value="all">All Types</option>
              <option value="Hospital">Hospital</option>
              <option value="Blood Bank">Blood Bank</option>
            </select>
            <span style={{marginLeft:'auto',fontSize:13,color:'var(--slate-500)'}}>{filtered.length} applications</span>
          </div>
        </div>
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:14,marginBottom:24}}>
        {filtered.map(app=>{
          const verItems = getVerificationItems(app);
          const prog = Math.round(verItems.filter(v=>v.done).length/verItems.length*100);
          return (
            <div key={app._id} className="card" style={{cursor:'pointer',transition:'all .2s',borderLeft:`4px solid ${app.status==='pending'?'#F59E0B':app.status==='under_review'?'var(--blue-500)':app.status==='approved'?'var(--green-500)':'var(--red-500)'}`}}
              onClick={()=>{setSelected(app);setNotes('');setView('detail');}}>
              <div className="card-body" style={{padding:'18px 22px'}}>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:16,flexWrap:'wrap'}}>
                  <div style={{display:'flex',gap:14,flex:1,minWidth:280}}>
                    <div style={{width:48,height:48,borderRadius:'var(--r-md)',background:app.type==='Hospital'?'var(--blue-100)':'var(--purple-100)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,flexShrink:0}}>
                      {app.type==='Hospital'?'🏥':'🏦'}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4,flexWrap:'wrap'}}>
                        <div style={{fontSize:16,fontWeight:800,color:'var(--slate-900)'}}>{app.name}</div>
                        <span style={{fontSize:11,fontWeight:700,padding:'3px 8px',borderRadius:100,background:app.type==='Hospital'?'var(--blue-100)':'var(--purple-100)',color:app.type==='Hospital'?'var(--blue-600)':'#7C3AED'}}>{app.type}</span>
                        <span style={{fontSize:11,fontWeight:600,fontFamily:'var(--font-mono)',color:'var(--slate-400)'}}>{app.appId}</span>
                      </div>
                      <div style={{display:'flex',gap:16,fontSize:12,color:'var(--slate-500)',flexWrap:'wrap',marginBottom:10}}>
                        <span style={{display:'flex',alignItems:'center',gap:4}}><Mail size={11}/>{app.email || '—'}</span>
                        <span style={{display:'flex',alignItems:'center',gap:4}}><Phone size={11}/>{app.phone || '—'}</span>
                        <span style={{display:'flex',alignItems:'center',gap:4}}><MapPin size={11}/>{app.district || '—'}{app.province ? `, ${app.province}` : ''}</span>
                        <span style={{display:'flex',alignItems:'center',gap:4}}><Clock size={11}/>Applied: {app.appliedOn}</span>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:12}}>
                        <div style={{flex:1,maxWidth:200}}>
                          <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--slate-400)',marginBottom:3}}>
                            <span>Verification Progress</span>
                            <span style={{fontWeight:700,color:prog>=80?'var(--green-600)':prog>=50?'var(--amber-600)':'var(--red-600)'}}>{prog}%</span>
                          </div>
                          <div style={{height:5,background:'var(--slate-100)',borderRadius:3,overflow:'hidden'}}>
                            <div style={{height:'100%',width:`${prog}%`,background:prog>=80?'var(--green-500)':prog>=50?'var(--amber-500)':'var(--red-500)',borderRadius:3}}/>
                          </div>
                        </div>
                        <span style={{padding:'2px 8px',background:'var(--blue-100)',color:'var(--blue-600)',borderRadius:100,fontWeight:600,fontSize:11}}>📄 {app.documents.length} docs</span>
                      </div>
                    </div>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:8,flexShrink:0,alignItems:'flex-end'}}>
                    <span style={{fontSize:11,fontWeight:700,padding:'4px 12px',borderRadius:100,
                      background:app.status==='pending'?'var(--amber-100)':app.status==='under_review'?'var(--blue-100)':app.status==='approved'?'var(--green-100)':'var(--red-100)',
                      color:app.status==='pending'?'#D97706':app.status==='under_review'?'var(--blue-600)':app.status==='approved'?'var(--green-600)':'var(--red-600)'}}>
                      {app.status==='pending'?'⏰ Pending':app.status==='under_review'?'🔍 Under Review':app.status==='approved'?'✅ Approved':'❌ Rejected'}
                    </span>
                    <button onClick={e=>{e.stopPropagation();setSelected(app);setNotes('');setView('detail');}}
                      style={{padding:'8px 16px',background:'var(--red-600)',color:'#fff',border:'none',borderRadius:'var(--r-sm)',fontSize:12,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
                      <Eye size={13}/> Review
                    </button>
                    {(app.status==='pending' || app.status==='under_review') && (
                      <div style={{display:'flex',gap:6}}>
                        <button onClick={e=>{e.stopPropagation();approve(app);}} style={{padding:'6px 12px',background:'var(--green-100)',color:'var(--green-600)',border:'none',borderRadius:'var(--r-sm)',fontSize:12,fontWeight:600,cursor:'pointer'}}>✓ Approve</button>
                        <button onClick={e=>{e.stopPropagation();setSelected(app);setRejectModal(true);}} style={{padding:'6px 12px',background:'var(--red-100)',color:'var(--red-600)',border:'none',borderRadius:'var(--r-sm)',fontSize:12,fontWeight:600,cursor:'pointer'}}>✗ Reject</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {!loading && filtered.length===0 && (
          <div className="card">
            <div className="empty-state">
              <CheckCircle size={36} style={{margin:'0 auto 12px',opacity:.3,color:'var(--green-500)'}}/>
              <h3>No applications found</h3>
              <p>{apps.length === 0 ? 'No hospital or blood bank registrations yet.' : 'Try adjusting your filters'}</p>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">Status Meaning</div></div>
        <div className="card-body">
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))',gap:14}}>
            {STATUS_MEANING.map(({icon,label,color,bg,desc})=>(
              <div key={label} style={{padding:'14px',background:bg,borderRadius:'var(--r-sm)',border:`1px solid ${color}30`}}>
                <div style={{fontSize:20,marginBottom:6}}>{icon}</div>
                <div style={{fontSize:13,fontWeight:700,color,marginBottom:4}}>{label}</div>
                <div style={{fontSize:11,color,opacity:.8,lineHeight:1.5}}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {rejectModal && selected && (
        <div className="modal-overlay" onClick={()=>setRejectModal(false)}>
          <div className="modal" style={{maxWidth:460}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title" style={{color:'var(--red-600)'}}>❌ Reject Application</div>
              <button onClick={()=>setRejectModal(false)} className="icon-btn"><X size={16}/></button>
            </div>
            <div className="modal-body">
              <div style={{background:'#FFF5F5',border:'1px solid #FEE2E2',borderRadius:'var(--r-sm)',padding:'12px 14px',marginBottom:16,fontSize:13,color:'var(--red-700)'}}>
                ⚠️ Rejecting <strong>{selected.name}</strong>'s application.
              </div>
              <div style={{display:'grid',gap:8}}>
                {['Invalid or expired license','Incomplete documentation','Unverifiable contact information','Duplicate registration','Does not meet requirements'].map(reason=>(
                  <label key={reason} style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13,padding:'8px 12px',border:`1.5px solid ${rejectReason===reason?'var(--red-400)':'var(--slate-200)'}`,borderRadius:'var(--r-sm)',background:rejectReason===reason?'var(--red-50)':'#fff'}}>
                    <input type="radio" name="reason2" value={reason} checked={rejectReason===reason} onChange={e=>setRejectReason(e.target.value)}/>{reason}
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="action-btn btn-view" onClick={()=>setRejectModal(false)}>Cancel</button>
              <button disabled={actionLoading} className="action-btn" style={{background:'var(--red-600)',color:'#fff',border:'none'}} onClick={()=>reject(selected)}>
                <XCircle size={14}/> {actionLoading ? 'Processing...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}