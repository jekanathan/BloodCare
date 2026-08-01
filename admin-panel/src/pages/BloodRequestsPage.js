import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileText, Plus, Search, Eye, CheckCircle, XCircle, Truck, X, ChevronLeft, ChevronRight, MapPin, Phone, Building2, Package, FlaskConical, Ban, Send } from 'lucide-react';
import api from '../utils/api';

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const PRIORITIES   = ['Emergency','Urgent','Normal'];
const B = '/dashboard/blood-requests';

const STATUS_CONFIG = {
  pending:    {color:'#D97706',          bg:'var(--amber-100)', label:'Pending'},
  approved:   {color:'var(--green-600)', bg:'var(--green-100)', label:'Approved'},
  processing: {color:'var(--blue-600)',  bg:'var(--blue-100)',  label:'Processing'},
  dispatched: {color:'#7C3AED',          bg:'var(--purple-100)',label:'Dispatched'},
  delivered:  {color:'var(--green-600)', bg:'var(--green-100)', label:'Delivered'},
  rejected:   {color:'var(--red-600)',   bg:'var(--red-100)',   label:'Rejected'},
  cancelled:  {color:'var(--slate-500)', bg:'var(--slate-100)', label:'Cancelled'},
};

const PRIORITY_CONFIG = {
  Emergency: {color:'var(--red-700)',   bg:'#FEE2E2'},
  Urgent:    {color:'#92400E',          bg:'var(--amber-100)'},
  Normal:    {color:'var(--slate-600)', bg:'var(--slate-100)'},
};

const timeAgo = (date) => {
  if (!date) return '';
  const diff = Math.floor((new Date() - new Date(date)) / 60000);
  if (diff < 1) return 'Just now';
  if (diff < 60)   return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff/60)}h ago`;
  return `${Math.floor(diff/1440)}d ago`;
};

const PATH_TO_TAB = {
  [`${B}`]: 'all',
  [`${B}/pending`]: 'pending',
  [`${B}/approved`]: 'approved',
  [`${B}/inventory-check`]: 'inventory-check',
  [`${B}/cross-match`]: 'cross-match',
  [`${B}/allocation`]: 'allocation',
  [`${B}/ready-for-dispatch`]: 'ready-for-dispatch',
  [`${B}/dispatch`]: 'dispatch',
  [`${B}/delivered`]: 'delivered',
  [`${B}/emergency`]: 'emergency',
  [`${B}/cancelled`]: 'cancelled',
};
const TAB_TO_PATH = {
  all: B, pending: `${B}/pending`, approved: `${B}/approved`,
  'inventory-check': `${B}/inventory-check`, 'cross-match': `${B}/cross-match`,
  allocation: `${B}/allocation`, 'ready-for-dispatch': `${B}/ready-for-dispatch`,
  dispatch: `${B}/dispatch`, delivered: `${B}/delivered`,
  emergency: `${B}/emergency`, rejected: B, cancelled: `${B}/cancelled`,
};

export default function BloodRequestsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [apiError, setApiError] = useState('');
  const [tab, setTab]           = useState('all');
  const [search, setSearch]     = useState('');
  const [bgFilter, setBgFilter] = useState('all');
  const [priFilter, setPriFilter]= useState('all');
  const [selected, setSelected] = useState(null);
  const [modal, setModal]       = useState(null);
  const [page, setPage]         = useState(1);
  const [actionLoading, setActionLoading] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ hospitalId:'', patientName:'', patientAge:'', patientWard:'', requestedBy:'', bloodGroup:'', unitsRequired:'', priority:'Normal', notes:'' });

  const [invCheck, setInvCheck] = useState(null);
  const [invLoading, setInvLoading] = useState(false);
  const [crossForm, setCrossForm] = useState({ result:'passed', labOfficer:'', notes:'' });
  const [availableBags, setAvailableBags] = useState([]);
  const [selectedBags, setSelectedBags] = useState([]);
  const [dispatchForm, setDispatchForm] = useState({ driver:'', vehicle:'', eta:'' });
  const [deliverForm, setDeliverForm] = useState({ receivedBy:'' });
  const [cancelReason, setCancelReason] = useState('');

  const PER_PAGE = 6;

  useEffect(() => {
    const mapped = PATH_TO_TAB[location.pathname];
    if (mapped) setTab(mapped);
  }, [location.pathname]);

  const switchTab = (key) => { setTab(key); setPage(1); navigate(TAB_TO_PATH[key] || B); };

  const fetchAll = () => {
    setLoading(true);
    setApiError('');
    Promise.all([
      api.get('/blood-requests').catch(() => ({ data: { requests: [] } })),
      api.get('/blood-requests/hospitals').catch(() => ({ data: { hospitals: [] } })),
    ]).then(([reqRes, hospRes]) => {
      setRequests(reqRes.data?.requests || []);
      setHospitals(hospRes.data?.hospitals || []);
    }).catch(() => setApiError('Could not load blood requests from server.')).finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (selected) {
      const fresh = requests.find(r => r._id === selected._id);
      if (fresh) setSelected(fresh);
    }
  }, [requests]);

  const filtered = requests.filter(r => {
    if (tab === 'pending')   return r.status === 'pending';
    if (tab === 'approved')  return ['approved','processing'].includes(r.status);
    if (tab === 'inventory-check') return r.status === 'approved' && r.crossMatch === 'pending';
    if (tab === 'cross-match') return r.status === 'approved' && r.crossMatch !== 'pending' && (!r.allocatedBags || r.allocatedBags.length === 0);
    if (tab === 'allocation') return r.status === 'processing' && (!r.allocatedBags || r.allocatedBags.length === 0);
    if (tab === 'ready-for-dispatch') return r.status === 'processing' && r.allocatedBags?.length > 0;
    if (tab === 'emergency') return r.priority === 'Emergency';
    if (tab === 'dispatch')  return r.status === 'dispatched';
    if (tab === 'delivered') return r.status === 'delivered';
    if (tab === 'rejected')  return r.status === 'rejected';
    if (tab === 'cancelled') return r.status === 'cancelled';
    return true;
  }).filter(r => {
    if (bgFilter !== 'all'  && r.bloodGroup !== bgFilter) return false;
    if (priFilter !== 'all' && r.priority   !== priFilter) return false;
    if (search && !r.hospital?.hospitalName?.toLowerCase().includes(search.toLowerCase()) &&
        !r.patient?.name?.toLowerCase().includes(search.toLowerCase()) &&
        !r.bloodGroup?.includes(search)) return false;
    return true;
  });

  const paginated  = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE) || 1;

  const counts = {
    all: requests.length,
    pending: requests.filter(r=>r.status==='pending').length,
    approved: requests.filter(r=>['approved','processing'].includes(r.status)).length,
    invCheck: requests.filter(r=>r.status==='approved' && r.crossMatch==='pending').length,
    crossMatch: requests.filter(r=>r.status==='approved' && r.crossMatch!=='pending' && (!r.allocatedBags || r.allocatedBags.length===0)).length,
    allocation: requests.filter(r=>r.status==='processing' && (!r.allocatedBags || r.allocatedBags.length===0)).length,
    readyDispatch: requests.filter(r=>r.status==='processing' && r.allocatedBags?.length>0).length,
    emergency: requests.filter(r=>r.priority==='Emergency').length,
    dispatch: requests.filter(r=>r.status==='dispatched').length,
    delivered: requests.filter(r=>r.status==='delivered').length,
    rejected: requests.filter(r=>r.status==='rejected').length,
    cancelled: requests.filter(r=>r.status==='cancelled').length,
  };

  const setLoadingFor = (id, val) => setActionLoading(prev => ({ ...prev, [id]: val }));

  const doAction = async (id, action, body) => {
    setLoadingFor(id, true);
    try { await api.patch(`/blood-requests/${id}/${action}`, body); fetchAll(); }
    catch (err) { alert(err.response?.data?.message || `Failed to ${action}`); }
    finally { setLoadingFor(id, false); }
  };

  const approve = id => doAction(id, 'approve');
  const reject  = id => doAction(id, 'reject');
  const deliver = () => doAction(selected._id, 'deliver', deliverForm).then(() => setModal('view'));

  const submitNewRequest = async (e) => {
    e.preventDefault();
    setFormError(''); setSubmitting(true);
    try {
      await api.post('/blood-requests', form);
      setModal(null);
      setForm({ hospitalId:'', patientName:'', patientAge:'', patientWard:'', requestedBy:'', bloodGroup:'', unitsRequired:'', priority:'Normal', notes:'' });
      fetchAll();
    } catch (err) { setFormError(err.response?.data?.message || 'Failed to create request'); }
    finally { setSubmitting(false); }
  };

  const openInventoryCheck = async (req) => {
    setSelected(req); setModal('inventory-check'); setInvLoading(true); setInvCheck(null);
    try { const res = await api.get(`/blood-requests/${req._id}/inventory-check`); setInvCheck(res.data); }
    catch { alert('Failed to check inventory'); }
    finally { setInvLoading(false); }
  };

  const openCrossMatch = (req) => { setSelected(req); setCrossForm({ result:'passed', labOfficer:'', notes:'' }); setModal('cross-match'); };
  const submitCrossMatch = async () => {
    await api.patch(`/blood-requests/${selected._id}/cross-match`, crossForm);
    setModal('view'); fetchAll();
  };

  const openAllocation = async (req) => {
    setSelected(req); setSelectedBags([]); setModal('allocation');
    try { const res = await api.get(`/blood-requests/${req._id}/available-bags`); setAvailableBags(res.data?.bags || []); }
    catch { setAvailableBags([]); }
  };
  const toggleBag = (id) => setSelectedBags(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]);
  const submitAllocation = async () => {
    if (selectedBags.length === 0) { alert('Select at least one bag.'); return; }
    try { await api.post(`/blood-requests/${selected._id}/allocate`, { bagIds: selectedBags }); setModal('view'); fetchAll(); }
    catch (err) { alert(err.response?.data?.message || 'Allocation failed'); }
  };

  const openDispatch = (req) => { setSelected(req); setDispatchForm({ driver:'', vehicle:'', eta:'' }); setModal('dispatch'); };
  const submitDispatch = async () => {
    await api.patch(`/blood-requests/${selected._id}/dispatch`, dispatchForm);
    setModal('view'); fetchAll();
  };

  const openDeliver = (req) => { setSelected(req); setDeliverForm({ receivedBy:'' }); setModal('deliver'); };

  const openCancel = (req) => { setSelected(req); setCancelReason(''); setModal('cancel'); };
  const submitCancel = async () => {
    await api.patch(`/blood-requests/${selected._id}/cancel`, { reason: cancelReason });
    setModal(null); fetchAll();
  };

  return (
    <div className="animate-fade">

      {apiError && (
        <div style={{background:'rgba(234,179,8,.1)',border:'1px solid rgba(234,179,8,.3)',borderRadius:8,padding:'10px 16px',marginBottom:16,fontSize:13,color:'#92400E'}}>⚠️ {apiError}</div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:14,marginBottom:24}}>
        {[
          {label:'Total Requests', value:counts.all,       color:'var(--slate-700)'},
          {label:'Pending',        value:counts.pending,   color:'#D97706'},
          {label:'Approved',       value:counts.approved,  color:'var(--green-600)'},
          {label:'Emergency',      value:counts.emergency, color:'var(--red-600)'},
          {label:'Dispatched',     value:counts.dispatch,  color:'#7C3AED'},
          {label:'Rejected',       value:counts.rejected,  color:'var(--slate-500)'},
        ].map(({label,value,color}) => (
          <div key={label} className="card" style={{padding:'16px 18px',borderTop:`3px solid ${color}`}}>
            <div style={{fontSize:26,fontWeight:800,color,fontFamily:'var(--font-display)'}}>{value}</div>
            <div style={{fontSize:12,color:'var(--slate-500)',marginTop:3}}>{label}</div>
          </div>
        ))}
      </div>

      <div className="page-header">
        <div className="page-header-left">
          <h1>Blood Requests</h1>
          <p>Track and manage all blood requests from hospitals</p>
        </div>
        <button className="btn-add" onClick={()=>{setFormError('');setModal('add');}}><Plus size={15}/> New Request</button>
      </div>

      <div style={{display:'flex',gap:4,marginBottom:20,background:'var(--slate-100)',padding:4,borderRadius:'var(--r-sm)',width:'fit-content',flexWrap:'wrap'}}>
        {[
          {key:'all',       label:`All (${counts.all})`},
          {key:'pending',   label:`⏳ Pending (${counts.pending})`},
          {key:'inventory-check', label:`📦 Inventory Check (${counts.invCheck})`},
          {key:'cross-match', label:`🧪 Cross Match (${counts.crossMatch})`},
          {key:'allocation', label:`🩸 Allocation (${counts.allocation})`},
          {key:'ready-for-dispatch', label:`📤 Ready for Dispatch (${counts.readyDispatch})`},
          {key:'dispatch',  label:`🚚 Dispatch Tracking (${counts.dispatch})`},
          {key:'delivered', label:`✅ Delivered (${counts.delivered})`},
          {key:'emergency', label:`🚨 Emergency (${counts.emergency})`},
          {key:'rejected',  label:`❌ Rejected (${counts.rejected})`},
          {key:'cancelled', label:`🚫 Cancelled (${counts.cancelled})`},
        ].map(t => (
          <button key={t.key} onClick={()=>switchTab(t.key)} style={{
            padding:'7px 14px',borderRadius:'var(--r-sm)',border:'none',cursor:'pointer',
            fontSize:12,fontWeight:600,
            background: tab===t.key ? '#fff' : 'transparent',
            color: tab===t.key ? 'var(--slate-900)' : 'var(--slate-500)',
            boxShadow: tab===t.key ? 'var(--sh-sm)' : 'none',
          }}>{t.label}</button>
        ))}
      </div>

      <div className="card" style={{marginBottom:20}}>
        <div className="card-body" style={{padding:'14px 20px'}}>
          <div className="filters-bar">
            <div className="search-input-wrap"><Search size={14}/><input className="search-input" placeholder="Search hospital, patient, blood group..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
            <select className="filter-select" value={bgFilter} onChange={e=>setBgFilter(e.target.value)}>
              <option value="all">All Blood Groups</option>
              {BLOOD_GROUPS.map(g=><option key={g}>{g}</option>)}
            </select>
            <select className="filter-select" value={priFilter} onChange={e=>setPriFilter(e.target.value)}>
              <option value="all">All Priorities</option>
              {PRIORITIES.map(p=><option key={p}>{p}</option>)}
            </select>
            <span style={{marginLeft:'auto',fontSize:13,color:'var(--slate-500)'}}>{filtered.length} requests</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr>
              <th>Hospital</th><th>Patient</th><th>Blood</th><th>Units</th><th>Priority</th><th>Cross Match</th><th>Status</th><th>Requested</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {loading && <tr><td colSpan={9}><div className="empty-state"><p>Loading requests...</p></div></td></tr>}
              {!loading && paginated.map(req => {
                const sc = STATUS_CONFIG[req.status] || {};
                const pc = PRIORITY_CONFIG[req.priority] || {};
                const isBusy = actionLoading[req._id];
                return (
                  <tr key={req._id} style={{background:req.priority==='Emergency'&&req.status==='pending'?'#FFF5F5':''}}>
                    <td>
                      <div className="td-name">{req.hospital?.hospitalName}</div>
                      <div className="td-sub" style={{display:'flex',alignItems:'center',gap:4}}><MapPin size={10}/>{req.hospital?.district}</div>
                    </td>
                    <td>
                      <div className="td-name">{req.patient?.name || '—'}</div>
                      <div className="td-sub">{req.patient?.age ? `${req.patient.age}y` : ''}{req.patient?.ward ? ` · ${req.patient.ward}` : ''}</div>
                    </td>
                    <td><span className="blood-badge">{req.bloodGroup}</span></td>
                    <td style={{fontWeight:800,fontSize:16,color:'var(--red-600)'}}>{req.units}</td>
                    <td><span style={{fontSize:11,fontWeight:700,padding:'3px 8px',borderRadius:4,background:pc.bg,color:pc.color}}>{req.priority==='Emergency'?'🚨 ':req.priority==='Urgent'?'⚡ ':''}{req.priority}</span></td>
                    <td>
                      <span style={{fontSize:11,fontWeight:600,padding:'3px 8px',borderRadius:100,
                        background:req.crossMatch==='passed'?'var(--green-100)':req.crossMatch==='failed'?'var(--red-100)':'var(--slate-100)',
                        color:req.crossMatch==='passed'?'var(--green-600)':req.crossMatch==='failed'?'var(--red-600)':'var(--slate-500)'}}>
                        {req.crossMatch==='passed'?'✓ Passed':req.crossMatch==='failed'?'✗ Failed':'Pending'}
                      </span>
                    </td>
                    <td><span style={{fontSize:11,fontWeight:600,padding:'3px 10px',borderRadius:100,background:sc.bg,color:sc.color}}>{sc.label}</span></td>
                    <td style={{fontSize:12,color:'var(--slate-500)'}}>{timeAgo(req.createdAt)}</td>
                    <td>
                      <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                        <button className="icon-btn" title="View" onClick={()=>{setSelected(req);setModal('view');}}><Eye size={13}/></button>
                        {req.status==='pending' && <>
                          <button className="icon-btn" title="Approve" disabled={isBusy} onClick={()=>approve(req._id)} style={{color:'var(--green-600)'}}><CheckCircle size={13}/></button>
                          <button className="icon-btn danger" title="Reject" disabled={isBusy} onClick={()=>reject(req._id)}><XCircle size={13}/></button>
                        </>}
                        {req.status==='approved' && req.crossMatch==='pending' && (
                          <button className="icon-btn" title="Inventory Check" onClick={()=>openInventoryCheck(req)} style={{color:'var(--blue-600)'}}><Package size={13}/></button>
                        )}
                        {req.status==='approved' && req.crossMatch!=='pending' && (!req.allocatedBags||req.allocatedBags.length===0) && (
                          <button className="icon-btn" title="Allocate Bags" onClick={()=>openAllocation(req)} style={{color:'#7C3AED'}}><Send size={13}/></button>
                        )}
                        {req.status==='processing' && (
                          <button className="icon-btn" title="Dispatch" onClick={()=>openDispatch(req)} style={{color:'#7C3AED'}}><Truck size={13}/></button>
                        )}
                        {req.status==='dispatched' && (
                          <button className="icon-btn" title="Mark Delivered" onClick={()=>openDeliver(req)} style={{color:'var(--green-600)'}}><CheckCircle size={13}/></button>
                        )}
                        {['pending','approved','processing'].includes(req.status) && (
                          <button className="icon-btn danger" title="Cancel" onClick={()=>openCancel(req)}><Ban size={13}/></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && paginated.length === 0 && (
                <tr><td colSpan={9}><div className="empty-state"><FileText size={36} style={{margin:'0 auto 12px',opacity:.3}}/><h3>No requests found</h3></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <span className="pagination-info">Showing {Math.min((page-1)*PER_PAGE+1,filtered.length)}–{Math.min(page*PER_PAGE,filtered.length)} of {filtered.length}</span>
          <div className="pagination-btns">
            <button className="page-btn" disabled={page===1} onClick={()=>setPage(p=>p-1)}><ChevronLeft size={14}/></button>
            {[...Array(totalPages)].map((_,i)=>(<button key={i} className={`page-btn ${page===i+1?'active':''}`} onClick={()=>setPage(i+1)}>{i+1}</button>))}
            <button className="page-btn" disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}><ChevronRight size={14}/></button>
          </div>
        </div>
      </div>

      {modal==='view' && selected && (
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal" style={{maxWidth:580}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <div><div className="modal-title">Blood Request Details</div><div style={{fontSize:12,color:'var(--slate-500)',marginTop:2}}>{timeAgo(selected.createdAt)}</div></div>
              <button onClick={()=>setModal(null)} className="icon-btn"><X size={16}/></button>
            </div>
            <div className="modal-body">
              <div style={{display:'flex',gap:10,marginBottom:20,flexWrap:'wrap'}}>
                <span style={{fontSize:12,fontWeight:700,padding:'4px 12px',borderRadius:100,background:PRIORITY_CONFIG[selected.priority]?.bg,color:PRIORITY_CONFIG[selected.priority]?.color}}>{selected.priority}</span>
                <span style={{fontSize:12,fontWeight:600,padding:'4px 12px',borderRadius:100,background:STATUS_CONFIG[selected.status]?.bg,color:STATUS_CONFIG[selected.status]?.color}}>{STATUS_CONFIG[selected.status]?.label}</span>
                <span className="blood-badge">{selected.bloodGroup}</span>
                <span style={{fontSize:12,fontWeight:700,color:'var(--red-600)',background:'var(--red-100)',padding:'4px 12px',borderRadius:100}}>{selected.units} Units</span>
              </div>

              <div style={{background:'var(--blue-50)',border:'1px solid var(--blue-100)',borderRadius:'var(--r-sm)',padding:'14px 16px',marginBottom:16}}>
                <div style={{fontSize:12,fontWeight:700,color:'var(--blue-600)',marginBottom:8,display:'flex',alignItems:'center',gap:6}}><Building2 size={13}/> Hospital</div>
                <div style={{fontSize:14,fontWeight:700}}>{selected.hospital?.hospitalName}</div>
                <div style={{fontSize:12,color:'var(--slate-500)',display:'flex',gap:16,marginTop:4}}>
                  <span style={{display:'flex',alignItems:'center',gap:4}}><MapPin size={11}/>{selected.hospital?.district}</span>
                  <span style={{display:'flex',alignItems:'center',gap:4}}><Phone size={11}/>{selected.hospital?.phone}</span>
                </div>
              </div>

              {selected.crossMatchedAt && (
                <div style={{background:'var(--slate-50)',borderRadius:8,padding:'12px 14px',marginBottom:12,fontSize:12}}>
                  <b>Cross Match:</b> {selected.crossMatch} — by {selected.crossMatchLabOfficer || '—'} {selected.crossMatchNotes && `(${selected.crossMatchNotes})`}
                </div>
              )}
              {selected.allocatedBags?.length > 0 && (
                <div style={{background:'var(--purple-100)',borderRadius:8,padding:'12px 14px',marginBottom:12,fontSize:12}}>
                  <b>Allocated Bags:</b> {selected.allocatedBags.map(b=>b.bagId).join(', ')}
                </div>
              )}
              {selected.dispatchDriver && (
                <div style={{background:'var(--slate-50)',borderRadius:8,padding:'12px 14px',marginBottom:12,fontSize:12}}>
                  <b>Dispatch:</b> Driver {selected.dispatchDriver}, Vehicle {selected.dispatchVehicle} {selected.dispatchETA && `— ETA ${new Date(selected.dispatchETA).toLocaleString('en-GB')}`}
                </div>
              )}
              {selected.receivedBy && (
                <div style={{background:'var(--green-50)',borderRadius:8,padding:'12px 14px',marginBottom:12,fontSize:12}}>
                  <b>Received By:</b> {selected.receivedBy} at {new Date(selected.receivedAt).toLocaleString('en-GB')}
                </div>
              )}
              {selected.cancellationReason && (
                <div style={{background:'var(--red-100)',borderRadius:8,padding:'12px 14px',marginBottom:12,fontSize:12}}>
                  <b>Cancelled:</b> {selected.cancellationReason}
                </div>
              )}
            </div>
            <div className="modal-footer" style={{flexWrap:'wrap'}}>
              {selected.status==='pending' && <>
                <button className="action-btn btn-approve" onClick={()=>{approve(selected._id);setModal(null);}}><CheckCircle size={14}/> Approve</button>
                <button className="action-btn btn-reject" onClick={()=>{reject(selected._id);setModal(null);}}><XCircle size={14}/> Reject</button>
              </>}
              {selected.status==='approved' && selected.crossMatch==='pending' && (
                <button className="action-btn" style={{background:'var(--blue-100)',color:'var(--blue-600)',border:'none'}} onClick={()=>openInventoryCheck(selected)}><Package size={14}/> Check Inventory</button>
              )}
              {selected.status==='approved' && selected.crossMatch!=='pending' && (!selected.allocatedBags||selected.allocatedBags.length===0) && (
                <button className="action-btn" style={{background:'var(--purple-100)',color:'#6D28D9',border:'none'}} onClick={()=>openAllocation(selected)}><Send size={14}/> Allocate Bags</button>
              )}
              {selected.status==='processing' && (
                <button className="action-btn" style={{background:'var(--purple-100)',color:'#6D28D9',border:'none'}} onClick={()=>openDispatch(selected)}><Truck size={14}/> Dispatch</button>
              )}
              {selected.status==='dispatched' && (
                <button className="action-btn btn-approve" onClick={()=>openDeliver(selected)}><CheckCircle size={14}/> Mark Delivered</button>
              )}
              <button className="action-btn btn-view" onClick={()=>setModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {modal==='inventory-check' && (
        <div className="modal-overlay" onClick={()=>setModal('view')}>
          <div className="modal" style={{maxWidth:480}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">Inventory Check — {selected.bloodGroup}</div><button className="icon-btn" onClick={()=>setModal('view')}><X size={16}/></button></div>
            <div className="modal-body">
              {invLoading && <p style={{fontSize:13,color:'var(--slate-500)'}}>Checking...</p>}
              {invCheck && (
                <>
                  <div style={{background:invCheck.sufficient?'var(--green-50)':'var(--red-50)',border:`1px solid ${invCheck.sufficient?'var(--green-100)':'var(--red-100)'}`,borderRadius:8,padding:'12px 14px',marginBottom:14}}>
                    <div style={{fontSize:14,fontWeight:700,color:invCheck.sufficient?'var(--green-700)':'var(--red-700)'}}>
                      {invCheck.sufficient ? '✓ Sufficient stock available' : '⚠️ Low stock — may not be enough'}
                    </div>
                    <div style={{fontSize:12,color:'var(--slate-600)',marginTop:4}}>Requested: {invCheck.unitsRequired} units · Available (Safe): {invCheck.totalAvailable} bags</div>
                  </div>
                  {invCheck.byBloodBank.length === 0 ? (
                    <p style={{fontSize:13,color:'var(--slate-400)'}}>No Safe bags of this blood group in stock.</p>
                  ) : (
                    <div style={{display:'flex',flexDirection:'column',gap:8}}>
                      {invCheck.byBloodBank.map(bb => (
                        <div key={bb.bloodBankId} style={{display:'flex',justifyContent:'space-between',padding:'8px 12px',background:'var(--slate-50)',borderRadius:8,fontSize:13}}>
                          <span>{bb.bloodBankName} ({bb.district})</span>
                          <b>{bb.count} bags</b>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="action-btn btn-view" onClick={()=>setModal('view')}>Close</button>
              <button className="action-btn btn-approve" onClick={()=>openCrossMatch(selected)}><FlaskConical size={14}/> Proceed to Cross Match</button>
            </div>
          </div>
        </div>
      )}

      {modal==='cross-match' && (
        <div className="modal-overlay" onClick={()=>setModal('view')}>
          <div className="modal" style={{maxWidth:440}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">Cross Match</div><button className="icon-btn" onClick={()=>setModal('view')}><X size={16}/></button></div>
            <div className="modal-body">
              <div style={{display:'grid',gap:14}}>
                <div>
                  <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Result</label>
                  <div style={{display:'flex',gap:10}}>
                    {['passed','failed'].map(r => (
                      <button key={r} onClick={()=>setCrossForm({...crossForm,result:r})} style={{flex:1,padding:'8px',borderRadius:8,border:`1.5px solid ${crossForm.result===r?(r==='passed'?'var(--green-500)':'var(--red-500)'):'var(--slate-200)'}`,background:crossForm.result===r?(r==='passed'?'var(--green-50)':'var(--red-50)'):'#fff',cursor:'pointer',fontSize:13,fontWeight:600,color:crossForm.result===r?(r==='passed'?'var(--green-600)':'var(--red-600)'):'var(--slate-500)'}}>
                        {r==='passed'?'✓ Passed':'✗ Failed'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Lab Officer</label>
                  <input value={crossForm.labOfficer} onChange={e=>setCrossForm({...crossForm,labOfficer:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13}}/>
                </div>
                <div>
                  <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Notes</label>
                  <textarea rows={2} value={crossForm.notes} onChange={e=>setCrossForm({...crossForm,notes:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13,resize:'vertical'}}/>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="action-btn btn-view" onClick={()=>setModal('view')}>Cancel</button>
              <button className="action-btn btn-approve" onClick={submitCrossMatch}>Save Result</button>
            </div>
          </div>
        </div>
      )}

      {modal==='allocation' && (
        <div className="modal-overlay" onClick={()=>setModal('view')}>
          <div className="modal" style={{maxWidth:500}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">Allocate Blood Bags — {selected.bloodGroup}</div><button className="icon-btn" onClick={()=>setModal('view')}><X size={16}/></button></div>
            <div className="modal-body">
              <p style={{fontSize:12,color:'var(--slate-500)',marginBottom:10}}>Sorted by expiry (FEFO). Select {selected.units} bag(s).</p>
              <div style={{maxHeight:280,overflowY:'auto',display:'flex',flexDirection:'column',gap:6}}>
                {availableBags.length===0 && <p style={{fontSize:13,color:'var(--slate-400)'}}>No Safe bags available for this blood group.</p>}
                {availableBags.map(bag => (
                  <label key={bag._id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:selectedBags.includes(bag._id)?'var(--purple-100)':'var(--slate-50)',borderRadius:8,cursor:'pointer'}}>
                    <input type="checkbox" checked={selectedBags.includes(bag._id)} onChange={()=>toggleBag(bag._id)}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,fontFamily:'monospace',fontWeight:700}}>{bag.bagId}</div>
                      <div style={{fontSize:11,color:'var(--slate-400)'}}>{bag.bloodBank?.bankName} · Expires {new Date(bag.expiryDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="action-btn btn-view" onClick={()=>setModal('view')}>Cancel</button>
              <button className="action-btn btn-approve" onClick={submitAllocation}>Allocate {selectedBags.length} Bag(s)</button>
            </div>
          </div>
        </div>
      )}

      {modal==='dispatch' && (
        <div className="modal-overlay" onClick={()=>setModal('view')}>
          <div className="modal" style={{maxWidth:420}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">Dispatch Details</div><button className="icon-btn" onClick={()=>setModal('view')}><X size={16}/></button></div>
            <div className="modal-body">
              <div style={{display:'grid',gap:14}}>
                <div><label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Driver Name</label><input value={dispatchForm.driver} onChange={e=>setDispatchForm({...dispatchForm,driver:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13}}/></div>
                <div><label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Vehicle Number</label><input value={dispatchForm.vehicle} onChange={e=>setDispatchForm({...dispatchForm,vehicle:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13}}/></div>
                <div><label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Estimated Arrival</label><input type="datetime-local" value={dispatchForm.eta} onChange={e=>setDispatchForm({...dispatchForm,eta:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13}}/></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="action-btn btn-view" onClick={()=>setModal('view')}>Cancel</button>
              <button className="action-btn" style={{background:'#7C3AED',color:'#fff',border:'none'}} onClick={submitDispatch}><Truck size={14}/> Dispatch</button>
            </div>
          </div>
        </div>
      )}

      {modal==='deliver' && (
        <div className="modal-overlay" onClick={()=>setModal('view')}>
          <div className="modal" style={{maxWidth:400}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">Delivery Confirmation</div><button className="icon-btn" onClick={()=>setModal('view')}><X size={16}/></button></div>
            <div className="modal-body">
              <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Received By</label>
              <input value={deliverForm.receivedBy} onChange={e=>setDeliverForm({receivedBy:e.target.value})} placeholder="Nurse / Ward staff name" style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13}}/>
            </div>
            <div className="modal-footer">
              <button className="action-btn btn-view" onClick={()=>setModal('view')}>Cancel</button>
              <button className="action-btn btn-approve" onClick={deliver}><CheckCircle size={14}/> Confirm Delivered</button>
            </div>
          </div>
        </div>
      )}

      {modal==='cancel' && (
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal" style={{maxWidth:400}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">Cancel Request</div><button className="icon-btn" onClick={()=>setModal(null)}><X size={16}/></button></div>
            <div className="modal-body">
              <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Reason</label>
              <textarea rows={3} value={cancelReason} onChange={e=>setCancelReason(e.target.value)} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13,resize:'vertical'}}/>
            </div>
            <div className="modal-footer">
              <button className="action-btn btn-view" onClick={()=>setModal(null)}>Back</button>
              <button className="action-btn btn-reject" onClick={submitCancel}><Ban size={14}/> Cancel Request</button>
            </div>
          </div>
        </div>
      )}

      {modal==='add' && (
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <form onSubmit={submitNewRequest}>
            <div className="modal" style={{maxWidth:560}} onClick={e=>e.stopPropagation()}>
              <div className="modal-header"><div className="modal-title">New Blood Request</div><button type="button" onClick={()=>setModal(null)} className="icon-btn"><X size={16}/></button></div>
              <div className="modal-body">
                {formError && <div style={{background:'#FFF5F5',border:'1px solid #FEE2E2',borderRadius:8,padding:'10px 14px',marginBottom:14,fontSize:13,color:'var(--red-700)'}}>{formError}</div>}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                  <div style={{gridColumn:'span 2'}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Hospital</label>
                    <select required value={form.hospitalId} onChange={e=>setForm({...form,hospitalId:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13,background:'#fff'}}>
                      <option value="">Select Hospital</option>
                      {hospitals.map(h=><option key={h._id} value={h._id}>{h.name}</option>)}
                    </select>
                  </div>
                  <div><label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Patient Name</label><input value={form.patientName} onChange={e=>setForm({...form,patientName:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13}}/></div>
                  <div><label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Patient Age</label><input type="number" value={form.patientAge} onChange={e=>setForm({...form,patientAge:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13}}/></div>
                  <div><label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Ward</label><input value={form.patientWard} onChange={e=>setForm({...form,patientWard:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13}}/></div>
                  <div><label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Requested By</label><input value={form.requestedBy} onChange={e=>setForm({...form,requestedBy:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13}}/></div>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Blood Group</label>
                    <select required value={form.bloodGroup} onChange={e=>setForm({...form,bloodGroup:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13,background:'#fff'}}>
                      <option value="">Select</option>
                      {BLOOD_GROUPS.map(g=><option key={g}>{g}</option>)}
                    </select>
                  </div>
                  <div><label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Units Required</label><input required type="number" min={1} value={form.unitsRequired} onChange={e=>setForm({...form,unitsRequired:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13}}/></div>
                  <div style={{gridColumn:'span 2'}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Priority</label>
                    <div style={{display:'flex',gap:10}}>
                      {PRIORITIES.map(p=>(
                        <label key={p} style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',padding:'8px 16px',border:`1.5px solid ${form.priority===p?'var(--red-400)':'var(--slate-200)'}`,borderRadius:8,fontSize:13,flex:1,justifyContent:'center',background:form.priority===p?'var(--red-50)':'#fff'}}>
                          <input type="radio" name="priority" value={p} checked={form.priority===p} onChange={e=>setForm({...form,priority:e.target.value})}/> {p}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div style={{gridColumn:'span 2'}}><label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Notes</label><textarea rows={3} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13,resize:'vertical'}}/></div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="action-btn btn-view" onClick={()=>setModal(null)}>Cancel</button>
                <button type="submit" disabled={submitting} className="action-btn btn-approve">{submitting?'Submitting...':'Submit Request'}</button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}