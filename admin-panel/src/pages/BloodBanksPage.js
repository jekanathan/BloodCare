import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Droplets, Plus, Search, Eye, Edit, Trash2, CheckCircle, XCircle, X, ChevronLeft, ChevronRight, Phone, Mail, MapPin, Users, Package, Clock, Star, Building2, Upload, FileText, AlertCircle, UserCog } from 'lucide-react';
import api from '../utils/api';

const DISTRICTS = ['Colombo','Gampaha','Kalutara','Kandy','Matale','Nuwara Eliya','Galle','Matara','Hambantota','Jaffna','Kilinochchi','Mannar','Vavuniya','Mullaitivu','Batticaloa','Ampara','Trincomalee','Kurunegala','Puttalam','Anuradhapura','Polonnaruwa','Badulla','Monaragala','Ratnapura','Kegalle'];
const PROVINCES = ['Western','Central','Southern','Northern','Eastern','North Western','North Central','Uva','Sabaragamuwa'];
const TYPES = ['Government','Private','NGO','Military'];

const B = '/dashboard/blood-banks';

// ══════════════════════════════════════════════════════════════════════════
// ALL BLOOD BANKS — existing list/table view
// ══════════════════════════════════════════════════════════════════════════
function AllBloodBanksTab() {
  const [banks, setBanks]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [apiError, setApiError]   = useState('');
  const [tab, setTab]             = useState('all');
  const [search, setSearch]       = useState('');
  const [distFilter, setDistFilter] = useState('all');
  const [modal, setModal]         = useState(null);
  const [selected, setSelected]   = useState(null);
  const [page, setPage]           = useState(1);
  const [actionLoading, setActionLoading] = useState({});
  const PER_PAGE = 6;

  const fetchBanks = () => {
    setLoading(true);
    setApiError('');
    api.get('/bloodbanks')
      .then(res => {
        const list = res.data?.bloodBanks || res.data || [];
        setBanks(list.map(b => ({
          _id: b._id,
          bankName: b.bankName,
          email: b.email,
          phone: b.phone,
          district: b.district,
          status: b.status,
          contactPerson: b.contactPerson,
          registeredAt: b.createdAt,
          capacity: b.capacity || 0,
          currentStock: b.currentStock || 0,
          branches: b.branches?.length || 0,
          staff: b.staff?.length || 0,
          collections: b.collections || 0,
          rating: b.rating || 0,
          operatingHours: b.operatingHours || '',
          documents: b.documents || {},
        })));
      })
      .catch(err => {
        console.error('Fetch blood banks error:', err);
        setApiError('Could not load blood banks from server.');
        setBanks([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBanks(); }, []);

  const filtered = banks.filter(b => {
    if (tab==='pending')  return b.status==='pending' || b.status==='under_review';
    if (tab==='approved') return b.status==='approved';
    if (distFilter!=='all' && b.district!==distFilter) return false;
    if (search && !b.bankName?.toLowerCase().includes(search.toLowerCase()) &&
        !b.district?.toLowerCase().includes(search.toLowerCase()) &&
        !b.email?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const paginated  = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE) || 1;

  const counts = {
    all:      banks.length,
    approved: banks.filter(b=>b.status==='approved').length,
    pending:  banks.filter(b=>b.status==='pending' || b.status==='under_review').length,
  };

  const totalStock      = banks.filter(b=>b.status==='approved').reduce((a,b)=>a+b.currentStock,0);
  const totalCapacity   = banks.filter(b=>b.status==='approved').reduce((a,b)=>a+b.capacity,0);
  const totalCollections= banks.filter(b=>b.status==='approved').reduce((a,b)=>a+b.collections,0);

  const setLoadingFor = (id, val) => setActionLoading(prev => ({ ...prev, [id]: val }));

  const approve = async (id) => {
    setLoadingFor(id, true);
    try {
      await api.patch(`/pending-approvals/bloodbank/${id}/approve`);
      setBanks(prev => prev.map(b => b._id===id ? {...b, status:'approved'} : b));
    } catch (err) {
      console.error('Approve error:', err);
      alert(err.response?.data?.message || 'Failed to approve blood bank');
    } finally {
      setLoadingFor(id, false);
    }
  };

  const reject = async (id) => {
    setLoadingFor(id, true);
    try {
      await api.patch(`/pending-approvals/bloodbank/${id}/reject`, { reason: 'Rejected from Blood Bank Management' });
      setBanks(prev => prev.map(b => b._id===id ? {...b, status:'rejected'} : b));
    } catch (err) {
      console.error('Reject error:', err);
      alert(err.response?.data?.message || 'Failed to reject blood bank');
    } finally {
      setLoadingFor(id, false);
    }
  };

  const deleteB = async (id) => {
    if (!window.confirm('Delete this blood bank? This will also remove its login account.')) return;
    setLoadingFor(id, true);
    try {
      await api.delete(`/bloodbanks/${id}`);
      setBanks(prev => prev.filter(b => b._id !== id));
    } catch (err) {
      console.error('Delete error:', err);
      alert(err.response?.data?.message || 'Failed to delete blood bank');
    } finally {
      setLoadingFor(id, false);
    }
  };

  return (
    <div>
      {apiError && (
        <div style={{background:'rgba(234,179,8,.1)',border:'1px solid rgba(234,179,8,.3)',borderRadius:8,padding:'10px 16px',marginBottom:16,fontSize:13,color:'#92400E'}}>
          ⚠️ {apiError}
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:16,marginBottom:24}}>
        {[
          {label:'Total Blood Banks', value:counts.all,                     color:'var(--purple-500)', icon:'🏦'},
          {label:'Approved',          value:counts.approved,                color:'var(--green-600)',  icon:'✅'},
          {label:'Pending',           value:counts.pending,                 color:'#D97706',           icon:'⏳'},
          {label:'Total Stock',       value:totalStock.toLocaleString(),    color:'var(--red-600)',    icon:'🩸'},
          {label:'Total Collections', value:totalCollections.toLocaleString(),color:'var(--blue-600)',icon:'💉'},
        ].map(({label,value,color,icon})=>(
          <div key={label} className="card" style={{padding:'18px 20px',borderTop:`3px solid ${color}`}}>
            <div style={{fontSize:11,color:'var(--slate-400)',marginBottom:6}}>{icon} {label}</div>
            <div style={{fontSize:26,fontWeight:800,color,fontFamily:'var(--font-display)'}}>{value}</div>
          </div>
        ))}
      </div>

      {totalCapacity > 0 && (
        <div className="card" style={{marginBottom:20}}>
          <div className="card-body" style={{padding:'16px 22px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
              <div style={{fontSize:14,fontWeight:700,color:'var(--slate-900)'}}>Overall Storage Capacity</div>
              <div style={{fontSize:13,color:'var(--slate-500)'}}>{totalStock.toLocaleString()} / {totalCapacity.toLocaleString()} units</div>
            </div>
            <div style={{height:12,background:'var(--slate-100)',borderRadius:6,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${Math.round(totalStock/totalCapacity*100)}%`,background:'linear-gradient(90deg,var(--red-600),var(--red-400))',borderRadius:6,transition:'width .8s'}}/>
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <div className="page-header-left">
          <h1>Blood Bank Management</h1>
          <p>Register, approve and manage blood banks island-wide</p>
        </div>
        <button className="btn-add" onClick={fetchBanks}>
          <Plus size={15}/> Refresh
        </button>
      </div>

      <div style={{display:'flex',gap:4,marginBottom:20,background:'var(--slate-100)',padding:4,borderRadius:'var(--r-sm)',width:'fit-content'}}>
        {[
          {key:'all',      label:`All (${counts.all})`},
          {key:'approved', label:`✅ Approved (${counts.approved})`},
          {key:'pending',  label:`⏳ Pending (${counts.pending})`},
        ].map(t=>(
          <button key={t.key} onClick={()=>{setTab(t.key);setPage(1);}} style={{
            padding:'7px 16px',borderRadius:'var(--r-sm)',border:'none',cursor:'pointer',
            fontSize:13,fontWeight:600,fontFamily:'var(--font-body)',
            background:tab===t.key?'#fff':'transparent',
            color:tab===t.key?'var(--slate-900)':'var(--slate-500)',
            boxShadow:tab===t.key?'var(--sh-sm)':'none',
          }}>{t.label}</button>
        ))}
      </div>

      <div className="card" style={{marginBottom:20}}>
        <div className="card-body" style={{padding:'14px 20px'}}>
          <div className="filters-bar">
            <div className="search-input-wrap">
              <Search size={14}/>
              <input className="search-input" placeholder="Search blood bank, district, email..."
                value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            <select className="filter-select" value={distFilter} onChange={e=>setDistFilter(e.target.value)}>
              <option value="all">All Districts</option>
              {DISTRICTS.map(d=><option key={d}>{d}</option>)}
            </select>
            {(search||distFilter!=='all') && (
              <button onClick={()=>{setSearch('');setDistFilter('all');}}
                style={{padding:'8px 12px',border:'1px solid var(--slate-200)',borderRadius:'var(--r-sm)',background:'#fff',cursor:'pointer',fontSize:13,color:'var(--red-600)',display:'flex',alignItems:'center',gap:4}}>
                <X size={13}/> Clear
              </button>
            )}
            <span style={{marginLeft:'auto',fontSize:13,color:'var(--slate-500)'}}>{filtered.length} blood banks</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr>
              <th>Blood Bank</th>
              <th>Contact</th>
              <th>District</th>
              <th>Stock / Capacity</th>
              <th>Status</th>
              <th>Actions</th>
            </tr></thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6}><div className="empty-state"><p>Loading blood banks...</p></div></td></tr>
              )}
              {!loading && paginated.map(b=>{
                const stockPct = b.capacity>0 ? Math.round(b.currentStock/b.capacity*100) : 0;
                const stockColor = stockPct<30?'var(--red-500)':stockPct<60?'#F59E0B':'var(--green-500)';
                const isBusy = actionLoading[b._id];
                return (
                  <tr key={b._id}>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <div style={{width:36,height:36,borderRadius:'var(--r-sm)',background:'var(--purple-100)',color:'var(--purple-500)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>🏦</div>
                        <div>
                          <div className="td-name">{b.bankName}</div>
                          <div className="td-sub">{b.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{fontSize:13,fontWeight:600}}>{b.phone}</div>
                      <div style={{fontSize:11,color:'var(--slate-400)'}}>{b.contactPerson}</div>
                    </td>
                    <td style={{fontSize:13,color:'var(--slate-600)'}}>{b.district}</td>
                    <td>
                      {b.status==='approved' && b.capacity>0 ? (
                        <div>
                          <div style={{display:'flex',justifyContent:'space-between',marginBottom:4,fontSize:12}}>
                            <span style={{fontWeight:700,color:stockColor}}>{b.currentStock.toLocaleString()}</span>
                            <span style={{color:'var(--slate-400)'}}>/{b.capacity.toLocaleString()}</span>
                          </div>
                          <div style={{height:5,background:'var(--slate-100)',borderRadius:3,overflow:'hidden'}}>
                            <div style={{height:'100%',width:`${stockPct}%`,background:stockColor,borderRadius:3}}/>
                          </div>
                        </div>
                      ) : <span style={{fontSize:12,color:'var(--slate-400)'}}>—</span>}
                    </td>
                    <td><span className={`status-badge status-${b.status}`}>{b.status}</span></td>
                    <td>
                      <div style={{display:'flex',gap:4}}>
                        <button className="icon-btn" title="View" onClick={()=>{setSelected(b);setModal('view');}}>
                          <Eye size={13}/>
                        </button>
                        {(b.status==='pending' || b.status==='under_review') && <>
                          <button className="icon-btn" title="Approve" disabled={isBusy} onClick={()=>approve(b._id)} style={{color:'var(--green-600)'}}>
                            <CheckCircle size={13}/>
                          </button>
                          <button className="icon-btn danger" title="Reject" disabled={isBusy} onClick={()=>reject(b._id)}>
                            <XCircle size={13}/>
                          </button>
                        </>}
                        <button className="icon-btn danger" title="Delete" disabled={isBusy} onClick={()=>deleteB(b._id)}>
                          <Trash2 size={13}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && paginated.length===0 && (
                <tr><td colSpan={6}>
                  <div className="empty-state">
                    <Droplets size={36} style={{margin:'0 auto 12px',opacity:.3}}/>
                    <h3>No blood banks found</h3>
                    <p>{banks.length===0 ? 'No blood bank registrations yet.' : 'Try adjusting your filters'}</p>
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

      {modal==='view' && selected && (
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal" style={{maxWidth:640}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:44,height:44,borderRadius:'var(--r-sm)',background:'var(--purple-100)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>🏦</div>
                <div>
                  <div className="modal-title">{selected.bankName}</div>
                  <div style={{fontSize:12,color:'var(--slate-500)',marginTop:2}}>{selected.district}</div>
                </div>
              </div>
              <button onClick={()=>setModal(null)} className="icon-btn"><X size={16}/></button>
            </div>
            <div className="modal-body">
              <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
                <span className={`status-badge status-${selected.status}`}>{selected.status}</span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                {[
                  {icon:<Phone size={13}/>,    label:'Phone',          value:selected.phone || '—'},
                  {icon:<Mail size={13}/>,     label:'Email',          value:selected.email || '—'},
                  {icon:<MapPin size={13}/>,   label:'District',       value:selected.district || '—'},
                  {icon:<Users size={13}/>,    label:'Contact Person', value:selected.contactPerson || '—'},
                  {icon:<Clock size={13}/>,    label:'Registered',     value: selected.registeredAt ? new Date(selected.registeredAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—'},
                ].map(({icon,label,value})=>(
                  <div key={label} style={{background:'var(--slate-50)',borderRadius:'var(--r-sm)',padding:'12px 14px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,color:'var(--slate-400)',fontSize:11,marginBottom:4}}>{icon}{label}</div>
                    <div style={{fontSize:14,fontWeight:600,color:'var(--slate-900)'}}>{value}</div>
                  </div>
                ))}
              </div>

              {(selected.documents?.bloodBankLicense || selected.documents?.registrationCertificate || selected.documents?.taxRegistration) && (
                <div style={{marginTop:16}}>
                  <div style={{fontSize:12,fontWeight:700,color:'var(--slate-600)',marginBottom:8}}>📄 Documents</div>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    {selected.documents.bloodBankLicense && (
                      <a href={`http://localhost:5000${selected.documents.bloodBankLicense}`} target="_blank" rel="noreferrer"
                        style={{display:'flex',alignItems:'center',gap:6,padding:'8px 12px',background:'var(--slate-50)',border:'1px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:12,color:'var(--slate-700)',textDecoration:'none'}}>
                        <FileText size={13}/> License
                      </a>
                    )}
                    {selected.documents.registrationCertificate && (
                      <a href={`http://localhost:5000${selected.documents.registrationCertificate}`} target="_blank" rel="noreferrer"
                        style={{display:'flex',alignItems:'center',gap:6,padding:'8px 12px',background:'var(--slate-50)',border:'1px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:12,color:'var(--slate-700)',textDecoration:'none'}}>
                        <FileText size={13}/> Registration Cert.
                      </a>
                    )}
                    {selected.documents.taxRegistration && (
                      <a href={`http://localhost:5000${selected.documents.taxRegistration}`} target="_blank" rel="noreferrer"
                        style={{display:'flex',alignItems:'center',gap:6,padding:'8px 12px',background:'var(--slate-50)',border:'1px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:12,color:'var(--slate-700)',textDecoration:'none'}}>
                        <FileText size={13}/> Tax Reg.
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div style={{marginTop:16,padding:'12px 14px',background:'var(--blue-50)',border:'1px solid var(--blue-100)',borderRadius:'var(--r-sm)',fontSize:12,color:'var(--blue-700)'}}>
                ℹ️ Branch and staff management for this blood bank will be available in a future update.
              </div>
            </div>
            <div className="modal-footer">
              {(selected.status==='pending' || selected.status==='under_review') && <>
                <button className="action-btn btn-approve" onClick={()=>{approve(selected._id);setModal(null);}}>
                  <CheckCircle size={14}/> Approve
                </button>
                <button className="action-btn btn-reject" onClick={()=>{reject(selected._id);setModal(null);}}>
                  <XCircle size={14}/> Reject
                </button>
              </>}
              <button className="action-btn btn-view" onClick={()=>setModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// REGISTER BLOOD BANK — admin-side form, auto-approved on submit
// ══════════════════════════════════════════════════════════════════════════
function RegisterBloodBankTab() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    contactPerson: '', designation: '', email: '', phone: '',
    bankName: '', registrationNumber: '', type: '', establishedYear: '',
    licenseNumber: '', licenseExpiry: '', address: '', district: '', province: '',
    password: '',
  });
  const [docs, setDocs] = useState({ bloodBankLicense: null, registrationCertificate: null, taxRegistration: null });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleFile = (key, file) => {
    if (file && file.type !== 'application/pdf') { setError('Please upload PDF files only.'); return; }
    if (file && file.size > 5 * 1024 * 1024) { setError('File must be under 5MB.'); return; }
    setError('');
    setDocs(prev => ({ ...prev, [key]: file }));
  };
  const removeFile = (key) => setDocs(prev => ({ ...prev, [key]: null }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!form.contactPerson || !form.email || !form.phone || !form.bankName || !form.registrationNumber || !form.type || !form.address || !form.district || !form.province || !form.password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      if (docs.bloodBankLicense) formData.append('bloodBankLicense', docs.bloodBankLicense);
      if (docs.registrationCertificate) formData.append('registrationCertificate', docs.registrationCertificate);
      if (docs.taxRegistration) formData.append('taxRegistration', docs.taxRegistration);

      await api.post('/bloodbanks/register', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

      setSuccess('Blood bank registered and approved successfully!');
      setForm({ contactPerson: '', designation: '', email: '', phone: '', bankName: '', registrationNumber: '', type: '', establishedYear: '', licenseNumber: '', licenseExpiry: '', address: '', district: '', province: '', password: '' });
      setDocs({ bloodBankLicense: null, registrationCertificate: null, taxRegistration: null });
      setTimeout(() => navigate(`${B}`), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Register Blood Bank</h1>
          <p>Admin-created blood banks are approved automatically</p>
        </div>
      </div>

      {error && (
        <div style={{background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.25)',borderRadius:8,padding:'10px 16px',marginBottom:16,fontSize:13,color:'var(--red-600)',display:'flex',alignItems:'center',gap:8}}>
          <AlertCircle size={15}/> {error}
        </div>
      )}
      {success && (
        <div style={{background:'rgba(22,163,74,.08)',border:'1px solid rgba(22,163,74,.25)',borderRadius:8,padding:'10px 16px',marginBottom:16,fontSize:13,color:'var(--green-600)',display:'flex',alignItems:'center',gap:8}}>
          <CheckCircle size={15}/> {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card" style={{marginBottom:16}}>
          <div className="card-header"><div className="card-title">Contact Person</div></div>
          <div className="card-body">
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <div>
                <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Contact Person Name *</label>
                <input placeholder="Mr. Kamal Silva" value={form.contactPerson} onChange={e=>set('contactPerson',e.target.value)}
                  style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none'}}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Designation *</label>
                <input placeholder="Blood Bank Manager" value={form.designation} onChange={e=>set('designation',e.target.value)}
                  style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none'}}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Email *</label>
                <input type="email" placeholder="info@bloodbank.lk" value={form.email} onChange={e=>set('email',e.target.value)}
                  style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none'}}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Phone *</label>
                <input placeholder="0112345678" value={form.phone} onChange={e=>set('phone',e.target.value)}
                  style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none'}}/>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{marginBottom:16}}>
          <div className="card-header"><div className="card-title">Blood Bank Details</div></div>
          <div className="card-body">
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <div style={{gridColumn:'span 2'}}>
                <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Blood Bank Name *</label>
                <input placeholder="National Blood Bank" value={form.bankName} onChange={e=>set('bankName',e.target.value)}
                  style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none'}}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Registration No. *</label>
                <input placeholder="BB-2026-00125" value={form.registrationNumber} onChange={e=>set('registrationNumber',e.target.value)}
                  style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none'}}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Type *</label>
                <select value={form.type} onChange={e=>set('type',e.target.value)}
                  style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',background:'#fff'}}>
                  <option value="">Select</option>
                  {TYPES.map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>License Number</label>
                <input placeholder="BBL/2024/5567" value={form.licenseNumber} onChange={e=>set('licenseNumber',e.target.value)}
                  style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none'}}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>License Expiry</label>
                <input type="date" value={form.licenseExpiry} onChange={e=>set('licenseExpiry',e.target.value)}
                  style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none'}}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Established Year</label>
                <input type="number" min={1900} max={2026} placeholder="2018" value={form.establishedYear} onChange={e=>set('establishedYear',e.target.value)}
                  style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none'}}/>
              </div>
              <div style={{gridColumn:'span 2'}}>
                <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Address *</label>
                <input placeholder="123, Galle Road, Colombo 04" value={form.address} onChange={e=>set('address',e.target.value)}
                  style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none'}}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>District *</label>
                <select value={form.district} onChange={e=>set('district',e.target.value)}
                  style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',background:'#fff'}}>
                  <option value="">Select</option>
                  {DISTRICTS.map(d=><option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Province *</label>
                <select value={form.province} onChange={e=>set('province',e.target.value)}
                  style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',background:'#fff'}}>
                  <option value="">Select</option>
                  {PROVINCES.map(p=><option key={p}>{p} Province</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{marginBottom:16}}>
          <div className="card-header"><div className="card-title">Documents (PDF, max 5MB each)</div></div>
          <div className="card-body">
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14}}>
              {[
                {key:'bloodBankLicense', label:'Blood Bank License'},
                {key:'registrationCertificate', label:'Registration Certificate'},
                {key:'taxRegistration', label:'Tax Registration (optional)'},
              ].map(({key,label})=>(
                <div key={key}>
                  <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>{label}</label>
                  {!docs[key] ? (
                    <label style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:6,border:'2px dashed var(--slate-300)',borderRadius:10,padding:'20px 10px',cursor:'pointer',color:'var(--slate-500)',fontSize:12,textAlign:'center'}}>
                      <Upload size={16}/> Click to upload PDF
                      <input type="file" accept="application/pdf" style={{display:'none'}} onChange={e=>handleFile(key,e.target.files[0])}/>
                    </label>
                  ) : (
                    <div style={{display:'flex',alignItems:'center',gap:8,border:'1px solid var(--green-200)',background:'var(--green-50)',borderRadius:10,padding:'10px 12px'}}>
                      <FileText size={16} color="var(--green-600)"/>
                      <span style={{flex:1,fontSize:12,color:'var(--slate-700)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{docs[key].name}</span>
                      <button type="button" onClick={()=>removeFile(key)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--slate-400)'}}><X size={14}/></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card" style={{marginBottom:16}}>
          <div className="card-header"><div className="card-title">Login Password</div></div>
          <div className="card-body">
            <div style={{maxWidth:320}}>
              <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Set Password (min 8 chars) *</label>
              <input type="password" placeholder="Temporary password" value={form.password} onChange={e=>set('password',e.target.value)}
                style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none'}}/>
              <div style={{fontSize:11,color:'var(--slate-400)',marginTop:6}}>Share this with the blood bank so they can log in to their portal.</div>
            </div>
          </div>
        </div>

        <div style={{display:'flex',justifyContent:'flex-end',gap:10}}>
          <button type="button" className="action-btn btn-view" onClick={()=>navigate(B)}>Cancel</button>
          <button type="submit" className="btn-add" disabled={loading}>
            <CheckCircle size={15}/> {loading ? 'Registering...' : 'Register & Approve'}
          </button>
        </div>
      </form>
    </div>
  );
}

function ComingSoon({ title, desc, icon: Icon }) {
  return (
    <div className="card">
      <div className="empty-state" style={{padding:'60px 20px'}}>
        <Icon size={40} style={{margin:'0 auto 14px',opacity:.3}}/>
        <h3>{title}</h3>
        <p>{desc}</p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN — route-aware tab switcher
// ══════════════════════════════════════════════════════════════════════════
export default function BloodBanksPage() {
  const location = useLocation();

  if (location.pathname === `${B}/add`) return <div className="animate-fade"><RegisterBloodBankTab/></div>;
  if (location.pathname === `${B}/branches`) return <div className="animate-fade"><ComingSoon icon={Building2} title="Branch Management — Coming Soon" desc="Manage blood bank branches and sub-locations here in a future update."/></div>;
  if (location.pathname === `${B}/staff`) return <div className="animate-fade"><ComingSoon icon={UserCog} title="Staff Management — Coming Soon" desc="Manage blood bank staff accounts and roles here in a future update."/></div>;

  return <div className="animate-fade"><AllBloodBanksTab/></div>;
}