import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Users, Plus, Search, Eye, Edit, Trash2, CheckCircle, XCircle, Download, ChevronLeft, ChevronRight, X, Calendar, Droplet, Phone, Mail, MapPin, Clock, Award, AlertCircle, History, FileBarChart } from 'lucide-react';
import api from '../utils/api';

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const DISTRICTS = ['Colombo','Gampaha','Kalutara','Kandy','Matale','Nuwara Eliya','Galle','Matara','Hambantota','Jaffna','Kilinochchi','Mannar','Vavuniya','Batticaloa','Ampara','Trincomalee','Kurunegala','Puttalam','Anuradhapura','Polonnaruwa','Badulla','Monaragala','Ratnapura','Kegalle','Mullaitivu'];

const B = '/dashboard/donors';

const getNextEligible = (lastDonation) => {
  if (!lastDonation) return 'Eligible Now';
  const next = new Date(lastDonation);
  next.setDate(next.getDate() + 90);
  const today = new Date();
  if (next <= today) return 'Eligible Now';
  return next.toLocaleDateString('en-GB', {day:'2-digit',month:'short',year:'numeric'});
};

const getDaysSince = (date) => {
  if (!date) return null;
  return Math.floor((new Date() - new Date(date)) / (1000*60*60*24));
};

const emptyForm = { name:'', nic:'', phone:'', email:'', dob:'', weight:'', bloodGroup:'', gender:'', district:'', address:'', password:'' };

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

export default function DonorsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [donors, setDonors] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [bloodFilter, setBloodFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('all');
  const [actionLoading, setActionLoading] = useState({});
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const PER_PAGE = 6;

  useEffect(() => {
    if (location.pathname === `${B}/blacklist`) setTab('blacklisted');
    else if (location.pathname === `${B}/eligible`) setTab('eligible');
    else if (location.pathname === `${B}/deferred`) setTab('deferred');
    else if (location.pathname === B) setTab('all');

    if (location.pathname === `${B}/add`) {
      setSelected(null);
      setForm(emptyForm);
      setFormError('');
      setModal('add');
    }
  }, [location.pathname]);

  const fetchDonors = () => {
    setLoading(true);
    api.get('/donors')
      .then(res => {
        const list = res.data?.donors || [];
        setDonors(list);
        setFiltered(list);
        setApiError(null);
      })
      .catch(err => {
        console.error('Fetch donors error:', err);
        setApiError('Could not load donors from server.');
        setDonors([]);
        setFiltered([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDonors(); }, []);

  useEffect(() => {
    let f = [...donors];
    if (tab === 'pending')     f = f.filter(d => d.status === 'pending');
    if (tab === 'blacklisted') f = f.filter(d => d.status === 'suspended' || d.status === 'blacklisted');
    if (tab === 'eligible')    f = f.filter(d => d.status === 'approved' && getNextEligible(d.lastDonation) === 'Eligible Now');
    if (tab === 'deferred')    f = f.filter(d => d.testingStatus === 'testing_rejected');
    if (statusFilter !== 'all') f = f.filter(d => d.status === statusFilter);
    if (bloodFilter !== 'all')  f = f.filter(d => d.bloodGroup === bloodFilter);
    if (search) f = f.filter(d =>
      d.name?.toLowerCase().includes(search.toLowerCase()) ||
      d.nic?.includes(search) ||
      d.email?.toLowerCase().includes(search.toLowerCase()) ||
      d.phone?.includes(search)
    );
    setFiltered(f);
    setPage(1);
  }, [search, statusFilter, bloodFilter, tab, donors]);

  const paginated = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE) || 1;

  const setLoadingFor = (id, val) => setActionLoading(prev => ({ ...prev, [id]: val }));

  const approve = async (id) => {
    setLoadingFor(id, true);
    try {
      await api.patch(`/donors/${id}/approve`);
      setDonors(prev => prev.map(d => d._id===id ? {...d, status:'approved'} : d));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve donor');
    } finally { setLoadingFor(id, false); }
  };

  const reject = async (id) => {
    setLoadingFor(id, true);
    try {
      await api.patch(`/donors/${id}/reject`);
      setDonors(prev => prev.map(d => d._id===id ? {...d, status:'rejected'} : d));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject donor');
    } finally { setLoadingFor(id, false); }
  };

  const deleteDonor = async (id) => {
    if (!window.confirm('Delete this donor? This will also remove their login account.')) return;
    setLoadingFor(id, true);
    try {
      await api.delete(`/donors/${id}`);
      setDonors(prev => prev.filter(d => d._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete donor');
    } finally { setLoadingFor(id, false); }
  };

  const openAdd = () => { setSelected(null); setForm(emptyForm); setFormError(''); setModal('add'); };
  const openEdit = (donor) => {
    setSelected(donor);
    setForm({
      name: donor.name || '', nic: donor.nic || '', phone: donor.phone || '', email: donor.email || '',
      dob: donor.dob ? donor.dob.slice(0,10) : '', weight: donor.weight || '', bloodGroup: donor.bloodGroup || '',
      gender: donor.gender || '', district: donor.district || '', address: donor.address || '', password: '',
    });
    setFormError('');
    setModal('edit');
  };
  const closeModal = () => {
    setModal(null);
    if (location.pathname === `${B}/add`) navigate(B);
  };

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSaveDonor = async () => {
    setFormError('');
    if (modal === 'add') {
      if (!form.name || !form.email || !form.bloodGroup || !form.password) {
        setFormError('Name, email, blood group and password are required.');
        return;
      }
      if (form.password.length < 8) {
        setFormError('Password must be at least 8 characters.');
        return;
      }
    }
    setSaving(true);
    try {
      if (modal === 'add') {
        await api.post('/donors', form);
      } else {
        await api.put(`/donors/${selected._id}`, form);
      }
      closeModal();
      fetchDonors();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save donor');
    } finally {
      setSaving(false);
    }
  };

  const stats = {
    total: donors.length,
    approved: donors.filter(d=>d.status==='approved').length,
    pending:  donors.filter(d=>d.status==='pending').length,
    blacklisted: donors.filter(d=>d.status==='suspended' || d.status==='blacklisted').length,
    eligible: donors.filter(d=>d.status==='approved' && getNextEligible(d.lastDonation)==='Eligible Now').length,
    deferred: donors.filter(d=>d.testingStatus==='testing_rejected').length,
  };

  if (location.pathname === `${B}/donation-history`) {
    return (
      <div className="animate-fade">
        <div className="page-header">
          <div className="page-header-left">
            <h1>Donation History</h1>
            <p>Per-donor donation event history</p>
          </div>
        </div>
        <ComingSoon icon={History} title="Donation History — Coming Soon" desc="This needs a new donation-events model (date, blood bank, bag ID per donation) that doesn't exist yet. Currently only a running total-donations count is tracked, not individual dated events." />
      </div>
    );
  }

  if (location.pathname === `${B}/reports`) {
    return (
      <div className="animate-fade">
        <div className="page-header">
          <div className="page-header-left">
            <h1>Donor Reports</h1>
            <p>Exportable donor reports</p>
          </div>
        </div>
        <ComingSoon icon={FileBarChart} title="Donor Reports — Coming Soon" desc="PDF/Excel export reports for donors will be built here in a future update." />
      </div>
    );
  }

  return (
    <div className="animate-fade">

      {apiError && (
        <div style={{background:'rgba(234,179,8,.1)',border:'1px solid rgba(234,179,8,.3)',borderRadius:8,padding:'10px 16px',marginBottom:16,fontSize:13,color:'#92400E'}}>
          ⚠️ {apiError}
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:14,marginBottom:24}}>
        {[
          {label:'Total Donors',   value:stats.total,      color:'var(--red-600)'},
          {label:'Approved',       value:stats.approved,   color:'var(--green-600)'},
          {label:'Pending',        value:stats.pending,    color:'#D97706'},
          {label:'Eligible Now',   value:stats.eligible,   color:'var(--blue-600)'},
          {label:'Deferred',       value:stats.deferred,   color:'#7C3AED'},
          {label:'Blacklisted',    value:stats.blacklisted,color:'var(--slate-600)'},
        ].map(({label,value,color}) => (
          <div key={label} className="card" style={{padding:'16px 18px'}}>
            <div style={{fontSize:24,fontWeight:800,color,fontFamily:'var(--font-display)'}}>{value}</div>
            <div style={{fontSize:12,color:'var(--slate-500)',marginTop:4}}>{label}</div>
          </div>
        ))}
      </div>

      <div className="page-header">
        <div className="page-header-left">
          <h1>Donor Management</h1>
          <p>Manage donor registrations, approvals and medical history</p>
        </div>
        <div style={{display:'flex',gap:10}}>
          <button className="btn-add" style={{background:'var(--slate-100)',color:'var(--slate-700)'}} onClick={fetchDonors}>
            <Download size={15}/> Refresh
          </button>
          <button className="btn-add" onClick={openAdd}>
            <Plus size={15}/> Add Donor
          </button>
        </div>
      </div>

      <div style={{display:'flex',gap:4,marginBottom:20,background:'var(--slate-100)',padding:4,borderRadius:'var(--r-sm)',width:'fit-content',flexWrap:'wrap'}}>
        {[
          {key:'all',        label:`All Donors (${donors.length})`, path:B},
          {key:'pending',    label:`Pending (${stats.pending})`, path:B},
          {key:'eligible',   label:`Eligible (${stats.eligible})`, path:`${B}/eligible`},
          {key:'deferred',   label:`Deferred (${stats.deferred})`, path:`${B}/deferred`},
          {key:'blacklisted',label:`Blacklisted (${stats.blacklisted})`, path:`${B}/blacklist`},
        ].map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); navigate(t.path); }} style={{
            padding:'7px 14px',borderRadius:'var(--r-sm)',border:'none',cursor:'pointer',
            fontSize:12.5,fontWeight:600,fontFamily:'var(--font-body)',
            background: tab===t.key ? '#fff' : 'transparent',
            color: tab===t.key ? 'var(--slate-900)' : 'var(--slate-500)',
            boxShadow: tab===t.key ? 'var(--sh-sm)' : 'none',
          }}>{t.label}</button>
        ))}
      </div>

      <div className="card" style={{marginBottom:20}}>
        <div className="card-body" style={{padding:'16px 20px'}}>
          <div className="filters-bar">
            <div className="search-input-wrap">
              <Search size={14}/>
              <input className="search-input" placeholder="Search by name, NIC, email, phone..."
                value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            <select className="filter-select" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="suspended">Blacklisted</option>
            </select>
            <select className="filter-select" value={bloodFilter} onChange={e=>setBloodFilter(e.target.value)}>
              <option value="all">All Blood Groups</option>
              {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
            </select>
            {(search||statusFilter!=='all'||bloodFilter!=='all') && (
              <button onClick={() => {setSearch('');setStatusFilter('all');setBloodFilter('all');}}
                style={{padding:'8px 14px',border:'1px solid var(--slate-200)',borderRadius:'var(--r-sm)',background:'#fff',cursor:'pointer',fontSize:13,color:'var(--red-600)',display:'flex',alignItems:'center',gap:4}}>
                <X size={13}/> Clear
              </button>
            )}
            <span style={{marginLeft:'auto',fontSize:13,color:'var(--slate-500)'}}>{filtered.length} donors found</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Donor</th><th>Blood Group</th><th>Contact</th><th>District</th>
                <th>Donations</th><th>Last Donation</th><th>Next Eligible</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={9}><div className="empty-state"><p>Loading donors...</p></div></td></tr>
              )}
              {!loading && paginated.map(donor => {
                const daysSince = getDaysSince(donor.lastDonation);
                const nextEligible = getNextEligible(donor.lastDonation);
                const isEligible = nextEligible === 'Eligible Now';
                const isBusy = actionLoading[donor._id];
                return (
                  <tr key={donor._id}>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <div style={{width:36,height:36,borderRadius:'50%',background:'var(--red-100)',color:'var(--red-700)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:14,flexShrink:0}}>
                          {donor.name?.charAt(0)}
                        </div>
                        <div>
                          <div className="td-name">{donor.name}</div>
                          <div className="td-sub">{donor.nic}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="blood-badge">{donor.bloodGroup}</span></td>
                    <td>
                      <div className="td-name">{donor.phone}</div>
                      <div className="td-sub">{donor.email}</div>
                    </td>
                    <td style={{color:'var(--slate-600)',fontSize:13}}>{donor.district}</td>
                    <td><span style={{fontWeight:700,color:'var(--red-600)',fontSize:15}}>{donor.donations}</span></td>
                    <td>
                      {donor.lastDonation ? (
                        <div>
                          <div style={{fontSize:13,fontWeight:600}}>{new Date(donor.lastDonation).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</div>
                          <div style={{fontSize:11,color:'var(--slate-400)'}}>{daysSince} days ago</div>
                        </div>
                      ) : <span style={{fontSize:12,color:'var(--slate-400)'}}>Never</span>}
                    </td>
                    <td>
                      <span style={{fontSize:12,fontWeight:600,color:isEligible?'var(--green-600)':'var(--amber-600)',background:isEligible?'var(--green-100)':'var(--amber-100)',padding:'3px 8px',borderRadius:100}}>
                        {isEligible ? '✓ Now' : nextEligible}
                      </span>
                    </td>
                    <td><span className={`status-badge status-${donor.status}`}>{donor.status}</span></td>
                    <td>
                      <div style={{display:'flex',gap:4}}>
                        <button className="icon-btn" title="View" onClick={() => {setSelected(donor);setModal('view');}}><Eye size={13}/></button>
                        <button className="icon-btn" title="Edit" onClick={() => openEdit(donor)}><Edit size={13}/></button>
                        {donor.status==='pending' && <>
                          <button className="icon-btn" title="Approve" disabled={isBusy} onClick={() => approve(donor._id)} style={{color:'var(--green-600)'}}><CheckCircle size={13}/></button>
                          <button className="icon-btn" title="Reject" disabled={isBusy} onClick={() => reject(donor._id)} style={{color:'var(--red-600)'}}><XCircle size={13}/></button>
                        </>}
                        <button className="icon-btn danger" title="Delete" disabled={isBusy} onClick={() => deleteDonor(donor._id)}><Trash2 size={13}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && paginated.length === 0 && (
                <tr><td colSpan={9}>
                  <div className="empty-state">
                    <Users size={40} style={{margin:'0 auto 12px',opacity:.3}}/>
                    <h3>No donors found</h3>
                    <p>Try adjusting your filters</p>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <span className="pagination-info">
            Showing {Math.min((page-1)*PER_PAGE+1, filtered.length)}–{Math.min(page*PER_PAGE, filtered.length)} of {filtered.length}
          </span>
          <div className="pagination-btns">
            <button className="page-btn" disabled={page===1} onClick={() => setPage(p=>p-1)}><ChevronLeft size={14}/></button>
            {[...Array(totalPages)].map((_,i) => (
              <button key={i} className={`page-btn ${page===i+1?'active':''}`} onClick={() => setPage(i+1)}>{i+1}</button>
            ))}
            <button className="page-btn" disabled={page===totalPages} onClick={() => setPage(p=>p+1)}><ChevronRight size={14}/></button>
          </div>
        </div>
      </div>

      {modal==='view' && selected && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:44,height:44,borderRadius:'50%',background:'var(--red-100)',color:'var(--red-700)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:18}}>
                  {selected.name?.charAt(0)}
                </div>
                <div>
                  <div className="modal-title">{selected.name}</div>
                  <div style={{fontSize:12,color:'var(--slate-500)'}}>{selected.nic}</div>
                </div>
              </div>
              <button onClick={() => setModal(null)} className="icon-btn"><X size={16}/></button>
            </div>
            <div className="modal-body">
              <div style={{display:'flex',gap:10,marginBottom:20}}>
                <span className="blood-badge" style={{fontSize:16,width:48,height:48}}>{selected.bloodGroup}</span>
                <span className={`status-badge status-${selected.status}`} style={{alignSelf:'center'}}>{selected.status}</span>
                <span style={{alignSelf:'center',fontSize:12,fontWeight:600,color:getNextEligible(selected.lastDonation)==='Eligible Now'?'var(--green-600)':'var(--amber-600)',background:getNextEligible(selected.lastDonation)==='Eligible Now'?'var(--green-100)':'var(--amber-100)',padding:'4px 10px',borderRadius:100}}>
                  {getNextEligible(selected.lastDonation)==='Eligible Now' ? '✓ Eligible Now' : 'Not Eligible'}
                </span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
                {[
                  {icon:<Phone size={14}/>, label:'Phone',    value:selected.phone},
                  {icon:<Mail size={14}/>,  label:'Email',    value:selected.email},
                  {icon:<MapPin size={14}/>,label:'District', value:selected.district},
                  {icon:<Users size={14}/>, label:'Gender',   value:selected.gender},
                  {icon:<Calendar size={14}/>,label:'Date of Birth',value:selected.dob ? new Date(selected.dob).toLocaleDateString('en-GB') : '—'},
                  {icon:<Droplet size={14}/>,label:'Weight',  value:selected.weight ? `${selected.weight} kg` : '—'},
                  {icon:<Clock size={14}/>, label:'Last Donation',value:selected.lastDonation ? new Date(selected.lastDonation).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : 'Never'},
                  {icon:<Calendar size={14}/>,label:'Next Eligible',value:getNextEligible(selected.lastDonation)},
                ].map(({icon,label,value}) => (
                  <div key={label} style={{background:'var(--slate-50)',borderRadius:'var(--r-sm)',padding:'12px 14px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,color:'var(--slate-400)',fontSize:11,marginBottom:4}}>{icon}{label}</div>
                    <div style={{fontSize:14,fontWeight:600,color:'var(--slate-900)'}}>{value}</div>
                  </div>
                ))}
              </div>
              <div style={{background:'linear-gradient(135deg,var(--red-900),var(--red-700))',borderRadius:'var(--r-md)',padding:'16px 20px',color:'#fff',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{fontSize:12,opacity:.7,marginBottom:4}}>Total Donations</div>
                  <div style={{fontSize:32,fontWeight:800,fontFamily:'var(--font-display)'}}>{selected.donations}</div>
                </div>
                <Droplet size={40} style={{opacity:.3}}/>
              </div>
            </div>
            <div className="modal-footer">
              {selected.status==='pending' && <>
                <button className="action-btn btn-approve" onClick={() => {approve(selected._id);setModal(null);}}><CheckCircle size={14}/> Approve</button>
                <button className="action-btn btn-reject" onClick={() => {reject(selected._id);setModal(null);}}><XCircle size={14}/> Reject</button>
              </>}
              <button className="action-btn btn-view" onClick={() => setModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {(modal==='add' || modal==='edit') && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{maxWidth:600}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{modal==='add' ? 'Add New Donor' : 'Edit Donor'}</div>
              <button onClick={closeModal} className="icon-btn"><X size={16}/></button>
            </div>
            <div className="modal-body">
              {formError && (
                <div style={{background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.25)',borderRadius:8,padding:'10px 14px',marginBottom:16,fontSize:13,color:'var(--red-600)',display:'flex',alignItems:'center',gap:8}}>
                  <AlertCircle size={14}/> {formError}
                </div>
              )}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                <div>
                  <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Full Name *</label>
                  <input value={form.name} onChange={e=>setF('name',e.target.value)} placeholder="Enter full name"
                    style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none'}}/>
                </div>
                <div>
                  <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>NIC Number</label>
                  <input value={form.nic} onChange={e=>setF('nic',e.target.value)} placeholder="Enter NIC"
                    style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none'}}/>
                </div>
                <div>
                  <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Phone</label>
                  <input value={form.phone} onChange={e=>setF('phone',e.target.value)} placeholder="07X XXXXXXX"
                    style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none'}}/>
                </div>
                <div>
                  <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Email *</label>
                  <input type="email" value={form.email} onChange={e=>setF('email',e.target.value)} placeholder="email@example.com"
                    disabled={modal==='edit'}
                    style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',background:modal==='edit'?'var(--slate-50)':'#fff'}}/>
                </div>
                <div>
                  <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Date of Birth</label>
                  <input type="date" value={form.dob} onChange={e=>setF('dob',e.target.value)}
                    style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none'}}/>
                </div>
                <div>
                  <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Weight (kg)</label>
                  <input type="number" value={form.weight} onChange={e=>setF('weight',e.target.value)} placeholder="Weight in kg"
                    style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none'}}/>
                </div>
                <div>
                  <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Blood Group *</label>
                  <select value={form.bloodGroup} onChange={e=>setF('bloodGroup',e.target.value)}
                    style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',background:'#fff'}}>
                    <option value="">Select Blood Group</option>
                    {BLOOD_GROUPS.map(g=><option key={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Gender</label>
                  <select value={form.gender} onChange={e=>setF('gender',e.target.value)}
                    style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',background:'#fff'}}>
                    <option value="">Select Gender</option>
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </div>
                <div style={{gridColumn:'span 2'}}>
                  <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>District</label>
                  <select value={form.district} onChange={e=>setF('district',e.target.value)}
                    style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',background:'#fff'}}>
                    <option value="">Select District</option>
                    {DISTRICTS.map(d=><option key={d}>{d}</option>)}
                  </select>
                </div>
                <div style={{gridColumn:'span 2'}}>
                  <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Address</label>
                  <input value={form.address} onChange={e=>setF('address',e.target.value)} placeholder="Address"
                    style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none'}}/>
                </div>
                {modal==='add' && (
                  <div style={{gridColumn:'span 2'}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Login Password (min 8 chars) *</label>
                    <input type="password" value={form.password} onChange={e=>setF('password',e.target.value)} placeholder="Set a login password"
                      style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none'}}/>
                  </div>
                )}
              </div>

              <div style={{marginTop:20,background:'var(--blue-50)',border:'1px solid var(--blue-100)',borderRadius:'var(--r-sm)',padding:'14px 16px',fontSize:12,color:'var(--blue-700)'}}>
                ℹ️ {modal==='add'
                  ? 'This donor will be added as approved and directed to book a blood testing appointment (not straight to the dashboard).'
                  : 'Editing basic profile details. Status changes are handled via Approve/Reject/Blacklist actions.'}
              </div>
            </div>
            <div className="modal-footer">
              <button className="action-btn btn-view" onClick={closeModal}>Cancel</button>
              <button className="action-btn btn-approve" disabled={saving} onClick={handleSaveDonor}>
                {saving ? 'Saving...' : (modal==='add' ? 'Add Donor' : 'Save Changes')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}