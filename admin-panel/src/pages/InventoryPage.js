import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Package, Plus, ChevronLeft, ChevronRight, ArrowRightLeft, X } from 'lucide-react';
import api from '../utils/api';

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const COMPONENTS = ['Whole Blood','Plasma','Platelets','RBC','Cryoprecipitate'];
const B = '/dashboard/inventory';

const getDaysToExpiry = (expiryDate) => {
  if (!expiryDate) return null;
  return Math.ceil((new Date(expiryDate) - new Date()) / (1000*60*60*24));
};

const getStockLevel = (units) => {
  if (units < 20)  return {level:'critical', color:'var(--red-600)',   bg:'var(--red-100)',   label:'Critical'};
  if (units < 50)  return {level:'low',      color:'#D97706',          bg:'var(--amber-100)', label:'Low'};
  if (units < 100) return {level:'medium',   color:'var(--blue-600)',  bg:'var(--blue-100)',  label:'Medium'};
  return             {level:'high',     color:'var(--green-600)', bg:'var(--green-100)', label:'Good'};
};

export default function InventoryPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [inventory, setInventory] = useState([]);
  const [history, setHistory]     = useState([]);
  const [bloodBanks, setBloodBanks] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [apiError, setApiError]   = useState('');
  const [tab, setTab] = useState('stock');
  const [bgFilter, setBgFilter] = useState('all');
  const [compFilter, setCompFilter] = useState('all');
  const [bankFilter, setBankFilter] = useState('all');
  const [modal, setModal] = useState(null);
  const [page, setPage] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [addForm, setAddForm] = useState({ bloodGroup:'', component:'Whole Blood', bloodBankId:'', units:'', collectedDate:'', expiryDate:'', donorReference:'' });
  const [transferForm, setTransferForm] = useState({ bloodGroup:'', component:'Whole Blood', fromBloodBankId:'', toBloodBankId:'', units:'', reason:'' });
  const [formError, setFormError] = useState('');
  const PER_PAGE = 8;

  // ── URL-aware behavior ────────────────────────────────────────────────
  // /inventory            -> All Stock
  // /inventory/components -> All Stock (component filter already available)
  // /inventory/history    -> History tab
  // /inventory/expired    -> Expired Units tab (new)
  // /inventory/transfer   -> auto-opens the Stock Transfer modal
  useEffect(() => {
    if (location.pathname === `${B}/history`) setTab('history');
    else if (location.pathname === `${B}/expired`) setTab('expired');
    else if (location.pathname === `${B}` || location.pathname === `${B}/components`) setTab('stock');

    if (location.pathname === `${B}/transfer`) {
      setFormError('');
      setModal('transfer');
    }
  }, [location.pathname]);

  const switchTab = (key, path) => {
    setTab(key);
    setPage(1);
    navigate(path);
  };

  const closeModal = () => {
    setModal(null);
    if (location.pathname === `${B}/transfer`) navigate(B);
  };

  const fetchAll = () => {
    setLoading(true);
    setApiError('');
    Promise.all([
      api.get('/inventory').catch(() => ({ data: { inventory: [] } })),
      api.get('/inventory/history').catch(() => ({ data: { history: [] } })),
      api.get('/inventory/blood-banks').catch(() => ({ data: { bloodBanks: [] } })),
    ]).then(([invRes, histRes, bankRes]) => {
      setInventory(invRes.data?.inventory || []);
      setHistory(histRes.data?.history || []);
      setBloodBanks(bankRes.data?.bloodBanks || []);
    }).catch(err => {
      console.error('Fetch inventory error:', err);
      setApiError('Could not load inventory from server.');
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = inventory.filter(i => {
    if (bgFilter !== 'all' && i.bloodGroup !== bgFilter) return false;
    if (compFilter !== 'all' && i.component !== compFilter) return false;
    if (bankFilter !== 'all' && i.bloodBank !== bankFilter) return false;
    if (tab === 'expiring') return getDaysToExpiry(i.expiryDate) !== null && getDaysToExpiry(i.expiryDate) >= 0 && getDaysToExpiry(i.expiryDate) <= 7;
    if (tab === 'critical') return i.units < 50;
    if (tab === 'expired')  return getDaysToExpiry(i.expiryDate) !== null && getDaysToExpiry(i.expiryDate) < 0;
    return true;
  });

  const paginated = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE) || 1;

  const totalUnits    = inventory.reduce((a,b) => a + b.units, 0);
  const totalReserved = inventory.reduce((a,b) => a + b.reserved, 0);
  const totalExpired  = inventory.reduce((a,b) => a + b.expired, 0);
  const expiringCount = inventory.filter(i => {const d=getDaysToExpiry(i.expiryDate); return d!==null && d>=0 && d<=7;}).length;
  const criticalCount = inventory.filter(i => i.units < 50).length;
  const expiredCount  = inventory.filter(i => {const d=getDaysToExpiry(i.expiryDate); return d!==null && d<0;}).length;

  const bankNames = [...new Set(inventory.map(i => i.bloodBank))];

  const bloodGroupSummary = BLOOD_GROUPS.map(bg => {
    const items = inventory.filter(i => i.bloodGroup === bg);
    const total = items.reduce((a,b) => a+b.units, 0);
    return {bg, total};
  });

  const submitAddStock = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await api.post('/inventory', addForm);
      setModal(null);
      setAddForm({ bloodGroup:'', component:'Whole Blood', bloodBankId:'', units:'', collectedDate:'', expiryDate:'', donorReference:'' });
      fetchAll();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to add stock');
    } finally {
      setSubmitting(false);
    }
  };

  const submitTransfer = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await api.post('/inventory/transfer', transferForm);
      closeModal();
      setTransferForm({ bloodGroup:'', component:'Whole Blood', fromBloodBankId:'', toBloodBankId:'', units:'', reason:'' });
      fetchAll();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to transfer stock');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade">

      {apiError && (
        <div style={{background:'rgba(234,179,8,.1)',border:'1px solid rgba(234,179,8,.3)',borderRadius:8,padding:'10px 16px',marginBottom:16,fontSize:13,color:'#92400E'}}>
          ⚠️ {apiError}
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:16,marginBottom:24}}>
        {[
          {label:'Total Units',     value:totalUnits.toLocaleString(),   color:'var(--red-600)',   icon:'🩸'},
          {label:'Available',       value:(totalUnits-totalReserved).toLocaleString(), color:'var(--green-600)', icon:'✅'},
          {label:'Reserved',        value:totalReserved,                 color:'var(--blue-600)',  icon:'🔒'},
          {label:'Expiring Soon',   value:expiringCount,                 color:'#D97706',          icon:'⏰'},
          {label:'Critical Stock',  value:criticalCount,                 color:'var(--red-700)',   icon:'🚨'},
        ].map(({label,value,color,icon}) => (
          <div key={label} className="card" style={{padding:'18px 20px'}}>
            <div style={{fontSize:11,color:'var(--slate-400)',marginBottom:8}}>{icon} {label}</div>
            <div style={{fontSize:28,fontWeight:800,color,fontFamily:'var(--font-display)'}}>{value}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{marginBottom:20}}>
        <div className="card-header">
          <div className="card-title">Blood Stock Overview</div>
          <span style={{fontSize:12,color:'var(--slate-500)'}}>All blood banks combined</span>
        </div>
        <div className="card-body">
          <div style={{display:'grid',gridTemplateColumns:'repeat(8,1fr)',gap:16}}>
            {bloodGroupSummary.map(({bg,total}) => {
              const {color,bg:bgColor,label} = getStockLevel(total);
              const pct = Math.min(100, Math.round(total/500*100));
              return (
                <div key={bg} style={{textAlign:'center'}}>
                  <div style={{fontSize:22,fontWeight:800,color,fontFamily:'var(--font-display)',marginBottom:4}}>{bg}</div>
                  <div style={{height:80,background:'var(--slate-100)',borderRadius:6,position:'relative',overflow:'hidden',marginBottom:6}}>
                    <div style={{position:'absolute',bottom:0,left:0,right:0,height:`${pct}%`,background:color,borderRadius:6,transition:'height .8s ease'}}/>
                  </div>
                  <div style={{fontSize:14,fontWeight:700,color:'var(--slate-900)'}}>{total}</div>
                  <div style={{fontSize:10,fontWeight:600,color,background:bgColor,padding:'2px 6px',borderRadius:100,display:'inline-block',marginTop:2}}>{label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="page-header">
        <div className="page-header-left">
          <h1>Blood Inventory</h1>
          <p>Manage blood stock, components and expiry tracking</p>
        </div>
        <div style={{display:'flex',gap:10}}>
          <button className="btn-add" style={{background:'var(--amber-100)',color:'#92400E',border:'none'}} onClick={() => switchTab(tab, `${B}/transfer`)}>
            <ArrowRightLeft size={15}/> Stock Transfer
          </button>
          <button className="btn-add" onClick={() => {setFormError('');setModal('add');}}>
            <Plus size={15}/> Add Stock
          </button>
        </div>
      </div>

      <div style={{display:'flex',gap:4,marginBottom:20,background:'var(--slate-100)',padding:4,borderRadius:'var(--r-sm)',width:'fit-content',flexWrap:'wrap'}}>
        {[
          {key:'stock',    label:'All Stock', path:B},
          {key:'expiring', label:`⏰ Expiring Soon (${expiringCount})`, path:B},
          {key:'critical', label:`🚨 Critical (${criticalCount})`, path:B},
          {key:'expired',  label:`⛔ Expired (${expiredCount})`, path:`${B}/expired`},
          {key:'history',  label:'📋 History', path:`${B}/history`},
        ].map(t => (
          <button key={t.key} onClick={() => switchTab(t.key, t.path)} style={{
            padding:'7px 16px',borderRadius:'var(--r-sm)',border:'none',cursor:'pointer',
            fontSize:13,fontWeight:600,fontFamily:'var(--font-body)',
            background: tab===t.key ? '#fff' : 'transparent',
            color: tab===t.key ? 'var(--slate-900)' : 'var(--slate-500)',
            boxShadow: tab===t.key ? 'var(--sh-sm)' : 'none',
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'history' ? (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Stock History</div>
          </div>
          <div className="table-container">
            <table>
              <thead><tr>
                <th>Type</th><th>Blood Group</th><th>Component</th><th>Units</th><th>Blood Bank</th><th>Date</th><th>By</th>
              </tr></thead>
              <tbody>
                {history.length === 0 && (
                  <tr><td colSpan={7}><div className="empty-state"><p>No stock movements yet</p></div></td></tr>
                )}
                {history.map(h => (
                  <tr key={h._id}>
                    <td>
                      <span style={{
                        padding:'3px 10px',borderRadius:4,fontSize:11,fontWeight:700,
                        background:h.type==='IN'?'var(--green-100)':h.type==='OUT'?'var(--red-100)':h.type==='EXPIRED'?'var(--slate-100)':'var(--blue-100)',
                        color:h.type==='IN'?'var(--green-600)':h.type==='OUT'?'var(--red-600)':h.type==='EXPIRED'?'var(--slate-600)':'var(--blue-600)',
                      }}>{h.type}</span>
                    </td>
                    <td><span className="blood-badge">{h.bloodGroup}</span></td>
                    <td style={{fontSize:13}}>{h.component}</td>
                    <td style={{fontWeight:700,color:h.type==='IN'?'var(--green-600)':'var(--red-600)'}}>
                      {h.type==='IN'?'+':'-'}{h.units}
                    </td>
                    <td style={{fontSize:13,color:'var(--slate-600)'}}>{h.bloodBankName}{h.toBloodBankName ? ` → ${h.toBloodBankName}` : ''}</td>
                    <td style={{fontSize:13}}>{new Date(h.date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</td>
                    <td style={{fontSize:13,color:'var(--slate-600)'}}>{h.by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          <div className="card" style={{marginBottom:20}}>
            <div className="card-body" style={{padding:'14px 20px'}}>
              <div className="filters-bar">
                <select className="filter-select" value={bgFilter} onChange={e=>setBgFilter(e.target.value)}>
                  <option value="all">All Blood Groups</option>
                  {BLOOD_GROUPS.map(g=><option key={g}>{g}</option>)}
                </select>
                <select className="filter-select" value={compFilter} onChange={e=>setCompFilter(e.target.value)}>
                  <option value="all">All Components</option>
                  {COMPONENTS.map(c=><option key={c}>{c}</option>)}
                </select>
                <select className="filter-select" value={bankFilter} onChange={e=>setBankFilter(e.target.value)}>
                  <option value="all">All Blood Banks</option>
                  {bankNames.map(b=><option key={b}>{b}</option>)}
                </select>
                <span style={{marginLeft:'auto',fontSize:13,color:'var(--slate-500)'}}>{filtered.length} records</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="table-container">
              <table>
                <thead><tr>
                  <th>Blood Group</th>
                  <th>Component</th>
                  <th>Blood Bank</th>
                  <th>Available</th>
                  <th>Reserved</th>
                  <th>Expired</th>
                  <th>Collected</th>
                  <th>Expiry</th>
                  <th>Days Left</th>
                  <th>Status</th>
                </tr></thead>
                <tbody>
                  {loading && (
                    <tr><td colSpan={10}><div className="empty-state"><p>Loading inventory...</p></div></td></tr>
                  )}
                  {!loading && paginated.map(item => {
                    const daysLeft = getDaysToExpiry(item.expiryDate);
                    const {color,bg,label} = getStockLevel(item.units);
                    const expiryColor = daysLeft===null ? 'var(--slate-400)' : daysLeft < 0 ? 'var(--red-600)' : daysLeft <= 3 ? 'var(--red-600)' : daysLeft <= 7 ? '#D97706' : 'var(--green-600)';
                    return (
                      <tr key={item._id}>
                        <td><span className="blood-badge">{item.bloodGroup}</span></td>
                        <td>
                          <span style={{fontSize:12,fontWeight:600,padding:'3px 8px',background:'var(--blue-100)',color:'var(--blue-600)',borderRadius:4}}>{item.component}</span>
                        </td>
                        <td style={{fontSize:13,color:'var(--slate-600)'}}>{item.bloodBank}</td>
                        <td>
                          <div style={{display:'flex',alignItems:'center',gap:8}}>
                            <span style={{fontWeight:800,fontSize:16,color}}>{item.units}</span>
                            <div style={{flex:1,height:4,background:'var(--slate-100)',borderRadius:2,minWidth:40}}>
                              <div style={{height:'100%',width:`${Math.min(100,item.units/500*100)}%`,background:color,borderRadius:2}}/>
                            </div>
                          </div>
                        </td>
                        <td style={{fontWeight:600,color:'var(--blue-600)'}}>{item.reserved}</td>
                        <td style={{fontWeight:600,color:item.expired>0?'var(--red-600)':'var(--slate-400)'}}>{item.expired}</td>
                        <td style={{fontSize:12}}>{item.collectedDate ? new Date(item.collectedDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short'}) : '—'}</td>
                        <td style={{fontSize:12}}>{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—'}</td>
                        <td>
                          <span style={{fontSize:12,fontWeight:700,color:expiryColor,background:daysLeft!==null&&daysLeft<=7?`${expiryColor}15`:'transparent',padding:'2px 6px',borderRadius:4}}>
                            {daysLeft===null ? '—' : daysLeft < 0 ? 'Expired' : `${daysLeft}d`}
                          </span>
                        </td>
                        <td>
                          <span style={{fontSize:11,fontWeight:600,padding:'3px 8px',borderRadius:100,background:bg,color}}>{label}</span>
                        </td>
                      </tr>
                    );
                  })}
                  {!loading && paginated.length === 0 && (
                    <tr><td colSpan={10}>
                      <div className="empty-state">
                        <Package size={36} style={{margin:'0 auto 12px',opacity:.3}}/>
                        <h3>No inventory records</h3>
                        <p>{inventory.length===0 ? 'Add your first blood stock entry to get started.' : (tab==='expired' ? 'No expired stock right now.' : 'Try adjusting your filters')}</p>
                      </div>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <span className="pagination-info">Showing {Math.min((page-1)*PER_PAGE+1,filtered.length)}–{Math.min(page*PER_PAGE,filtered.length)} of {filtered.length}</span>
              <div className="pagination-btns">
                <button className="page-btn" disabled={page===1} onClick={()=>setPage(p=>p-1)}><ChevronLeft size={14}/></button>
                {[...Array(totalPages)].map((_,i)=>(
                  <button key={i} className={`page-btn ${page===i+1?'active':''}`} onClick={()=>setPage(i+1)}>{i+1}</button>
                ))}
                <button className="page-btn" disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}><ChevronRight size={14}/></button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ADD STOCK MODAL */}
      {modal==='add' && (
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <form onSubmit={submitAddStock}>
            <div className="modal" style={{maxWidth:540}} onClick={e=>e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title">Add Blood Stock</div>
                <button type="button" onClick={()=>setModal(null)} className="icon-btn"><X size={16}/></button>
              </div>
              <div className="modal-body">
                {formError && <div style={{background:'#FFF5F5',border:'1px solid #FEE2E2',borderRadius:8,padding:'10px 14px',marginBottom:14,fontSize:13,color:'var(--red-700)'}}>{formError}</div>}
                {bloodBanks.length === 0 && (
                  <div style={{background:'var(--amber-100)',border:'1px solid #FDE68A',borderRadius:8,padding:'10px 14px',marginBottom:14,fontSize:13,color:'#92400E'}}>
                    ⚠️ No approved blood banks yet. Approve a blood bank first before adding stock.
                  </div>
                )}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Blood Group</label>
                    <select required value={addForm.bloodGroup} onChange={e=>setAddForm({...addForm,bloodGroup:e.target.value})}
                      style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',background:'#fff'}}>
                      <option value="">Select Blood Group</option>
                      {BLOOD_GROUPS.map(o=><option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Component</label>
                    <select value={addForm.component} onChange={e=>setAddForm({...addForm,component:e.target.value})}
                      style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',background:'#fff'}}>
                      {COMPONENTS.map(o=><option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div style={{gridColumn:'span 2'}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Blood Bank</label>
                    <select required value={addForm.bloodBankId} onChange={e=>setAddForm({...addForm,bloodBankId:e.target.value})}
                      style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',background:'#fff'}}>
                      <option value="">Select Blood Bank</option>
                      {bloodBanks.map(b=><option key={b._id} value={b._id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Units</label>
                    <input required type="number" min={1} placeholder="Number of units" value={addForm.units} onChange={e=>setAddForm({...addForm,units:e.target.value})}
                      style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',boxSizing:'border-box'}}/>
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Collected Date</label>
                    <input type="date" value={addForm.collectedDate} onChange={e=>setAddForm({...addForm,collectedDate:e.target.value})}
                      style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',boxSizing:'border-box'}}/>
                  </div>
                  <div style={{gridColumn:'span 2'}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Expiry Date</label>
                    <input type="date" value={addForm.expiryDate} onChange={e=>setAddForm({...addForm,expiryDate:e.target.value})}
                      style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',boxSizing:'border-box'}}/>
                  </div>
                  <div style={{gridColumn:'span 2'}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Donor Reference</label>
                    <input type="text" placeholder="Donor ID / Name" value={addForm.donorReference} onChange={e=>setAddForm({...addForm,donorReference:e.target.value})}
                      style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',boxSizing:'border-box'}}/>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="action-btn btn-view" onClick={()=>setModal(null)}>Cancel</button>
                <button type="submit" disabled={submitting} className="action-btn btn-approve">{submitting?'Adding...':'Add Stock'}</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* TRANSFER MODAL */}
      {modal==='transfer' && (
        <div className="modal-overlay" onClick={closeModal}>
          <form onSubmit={submitTransfer}>
            <div className="modal" style={{maxWidth:480}} onClick={e=>e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title">Stock Transfer</div>
                <button type="button" onClick={closeModal} className="icon-btn"><X size={16}/></button>
              </div>
              <div className="modal-body">
                {formError && <div style={{background:'#FFF5F5',border:'1px solid #FEE2E2',borderRadius:8,padding:'10px 14px',marginBottom:14,fontSize:13,color:'var(--red-700)'}}>{formError}</div>}
                <div style={{display:'grid',gap:16}}>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Blood Group</label>
                    <select required value={transferForm.bloodGroup} onChange={e=>setTransferForm({...transferForm,bloodGroup:e.target.value})}
                      style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',background:'#fff'}}>
                      <option value="">Select Blood Group</option>
                      {BLOOD_GROUPS.map(o=><option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Component</label>
                    <select value={transferForm.component} onChange={e=>setTransferForm({...transferForm,component:e.target.value})}
                      style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',background:'#fff'}}>
                      {COMPONENTS.map(o=><option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>From Blood Bank</label>
                    <select required value={transferForm.fromBloodBankId} onChange={e=>setTransferForm({...transferForm,fromBloodBankId:e.target.value})}
                      style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',background:'#fff'}}>
                      <option value="">Select Blood Bank</option>
                      {bloodBanks.map(b=><option key={b._id} value={b._id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>To Blood Bank</label>
                    <select required value={transferForm.toBloodBankId} onChange={e=>setTransferForm({...transferForm,toBloodBankId:e.target.value})}
                      style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',background:'#fff'}}>
                      <option value="">Select Blood Bank</option>
                      {bloodBanks.map(b=><option key={b._id} value={b._id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Units to Transfer</label>
                    <input required type="number" min={1} placeholder="Enter units" value={transferForm.units} onChange={e=>setTransferForm({...transferForm,units:e.target.value})}
                      style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',boxSizing:'border-box'}}/>
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Reason</label>
                    <input type="text" placeholder="Reason for transfer" value={transferForm.reason} onChange={e=>setTransferForm({...transferForm,reason:e.target.value})}
                      style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',boxSizing:'border-box'}}/>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="action-btn btn-view" onClick={closeModal}>Cancel</button>
                <button type="submit" disabled={submitting} className="action-btn" style={{background:'var(--amber-100)',color:'#92400E',border:'none'}}>
                  <ArrowRightLeft size={14}/> {submitting?'Transferring...':'Transfer'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}