import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Plus, Search, Eye, Edit, Trash2, X, ChevronLeft, ChevronRight, MapPin, Users, Clock } from 'lucide-react';
import api from '../utils/api';

const DISTRICTS = ['Colombo','Gampaha','Kalutara','Kandy','Matale','Galle','Matara','Jaffna','Kurunegala','Ratnapura'];
const B = '/dashboard/campaigns';

const STATUS_CONFIG = {
  active:    {label:'Active',    color:'var(--green-600)', bg:'var(--green-100)'},
  upcoming:  {label:'Upcoming',  color:'var(--blue-600)',  bg:'var(--blue-100)'},
  completed: {label:'Completed', color:'var(--slate-600)', bg:'var(--slate-100)'},
  cancelled: {label:'Cancelled', color:'var(--red-600)',   bg:'var(--red-100)'},
};

const emptyForm = { title:'', type:'Regional', district:'', venue:'', organizer:'', startDate:'', endDate:'', time:'', targetRegistrations:'', description:'' };

export default function CampaignsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [campaigns, setCampaigns]   = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [apiError, setApiError]     = useState('');
  const [tab, setTab]               = useState('campaigns');
  const [statusScope, setStatusScope] = useState('all'); // all | upcoming | active | completed — from sidebar deep-link
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter]     = useState('all');
  const [modal, setModal]           = useState(null);
  const [selected, setSelected]     = useState(null);
  const [page, setPage]             = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState('');
  const [form, setForm] = useState(emptyForm);
  const [volunteerForm, setVolunteerForm] = useState({ name:'', email:'', phone:'', district:'', skills:'' });
  const PER_PAGE = 5;

  // ── URL-aware behavior ────────────────────────────────────────────────
  useEffect(() => {
    if (location.pathname === `${B}/volunteers`) { setTab('volunteers'); return; }
    if (location.pathname === `${B}/reports`)    { setTab('reports'); return; }
    setTab('campaigns');

    if (location.pathname === `${B}/upcoming`) { setStatusScope('upcoming'); setStatusFilter('upcoming'); }
    else if (location.pathname === `${B}/ongoing`) { setStatusScope('active'); setStatusFilter('active'); }
    else if (location.pathname === `${B}/completed`) { setStatusScope('completed'); setStatusFilter('completed'); }
    else if (location.pathname === B) { setStatusScope('all'); setStatusFilter('all'); }

    if (location.pathname === `${B}/create`) {
      setSelected(null); setFormError(''); setForm(emptyForm); setModal('add');
    }
  }, [location.pathname]);

  const closeModal = () => {
    setModal(null);
    if (location.pathname === `${B}/create`) navigate(B);
  };

  const fetchAll = () => {
    setLoading(true);
    setApiError('');
    Promise.all([
      api.get('/campaigns').catch(() => ({ data: { campaigns: [] } })),
      api.get('/campaigns/volunteers').catch(() => ({ data: { volunteers: [] } })),
    ]).then(([campRes, volRes]) => {
      setCampaigns(campRes.data?.campaigns || []);
      setVolunteers(volRes.data?.volunteers || []);
    }).catch(err => {
      console.error('Fetch campaigns error:', err);
      setApiError('Could not load campaigns from server.');
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = campaigns.filter(c => {
    if (statusFilter!=='all' && c.status!==statusFilter) return false;
    if (typeFilter!=='all'   && c.type!==typeFilter)     return false;
    if (search && !c.title?.toLowerCase().includes(search.toLowerCase()) &&
        !c.district?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const paginated  = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE) || 1;

  const counts = {
    total:     campaigns.length,
    active:    campaigns.filter(c=>c.status==='active').length,
    upcoming:  campaigns.filter(c=>c.status==='upcoming').length,
    completed: campaigns.filter(c=>c.status==='completed').length,
    totalDonated: campaigns.reduce((a,b)=>a+(b.donated||0),0),
  };

  const deleteC = async (id) => {
    if (!window.confirm('Delete this campaign?')) return;
    try {
      await api.delete(`/campaigns/${id}`);
      setCampaigns(prev => prev.filter(c=>c._id!==id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete campaign');
    }
  };

  const deleteVolunteer = async (id) => {
    if (!window.confirm('Remove this volunteer?')) return;
    try {
      await api.delete(`/campaigns/volunteers/${id}`);
      setVolunteers(prev => prev.filter(v=>v._id!==id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove volunteer');
    }
  };

  const submitCampaign = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      if (modal==='edit' && selected) {
        await api.put(`/campaigns/${selected._id}`, form);
      } else {
        await api.post('/campaigns', form);
      }
      closeModal();
      setForm(emptyForm);
      fetchAll();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save campaign');
    } finally {
      setSubmitting(false);
    }
  };

  const submitVolunteer = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await api.post('/campaigns/volunteers', volunteerForm);
      setModal(null);
      setVolunteerForm({ name:'', email:'', phone:'', district:'', skills:'' });
      fetchAll();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to add volunteer');
    } finally {
      setSubmitting(false);
    }
  };

  const switchStatusScope = (scope, statusVal, path) => {
    setStatusScope(scope); setStatusFilter(statusVal); setPage(1); navigate(path);
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
          {label:'Total Campaigns', value:counts.total,       color:'var(--slate-700)', icon:'📅'},
          {label:'Active',          value:counts.active,      color:'var(--green-600)', icon:'✅'},
          {label:'Upcoming',        value:counts.upcoming,    color:'var(--blue-600)',  icon:'🔜'},
          {label:'Completed',       value:counts.completed,   color:'var(--slate-500)', icon:'🏁'},
          {label:'Total Donations', value:counts.totalDonated,color:'var(--red-600)',   icon:'🩸'},
        ].map(({label,value,color,icon})=>(
          <div key={label} className="card" style={{padding:'18px 20px',borderTop:`3px solid ${color}`}}>
            <div style={{fontSize:11,color:'var(--slate-400)',marginBottom:6}}>{icon} {label}</div>
            <div style={{fontSize:26,fontWeight:800,color,fontFamily:'var(--font-display)'}}>{value}</div>
          </div>
        ))}
      </div>

      <div className="page-header">
        <div className="page-header-left">
          <h1>Blood Donation Campaigns</h1>
          <p>Create and manage blood donation campaigns island-wide</p>
        </div>
        {tab==='campaigns' && (
          <button className="btn-add" onClick={()=>{setSelected(null);setFormError('');setForm(emptyForm);setModal('add');}}>
            <Plus size={15}/> Create Campaign
          </button>
        )}
        {tab==='volunteers' && (
          <button className="btn-add" onClick={()=>{setFormError('');setModal('addVolunteer');}}>
            <Plus size={15}/> Add Volunteer
          </button>
        )}
      </div>

      <div style={{display:'flex',gap:4,marginBottom:20,background:'var(--slate-100)',padding:4,borderRadius:'var(--r-sm)',width:'fit-content',flexWrap:'wrap'}}>
        {[
          {key:'all',       label:`📅 All (${counts.total})`,       path:B},
          {key:'upcoming',  label:`🔜 Upcoming (${counts.upcoming})`,path:`${B}/upcoming`},
          {key:'active',    label:`🟢 Ongoing (${counts.active})`,  path:`${B}/ongoing`},
          {key:'completed', label:`✅ Completed (${counts.completed})`,path:`${B}/completed`},
        ].map(t=>(
          <button key={t.key} onClick={()=>{ if(tab!=='campaigns') navigate(B); switchStatusScope(t.key, t.key==='all'?'all':t.key, t.path);}} style={{
            padding:'7px 14px',borderRadius:'var(--r-sm)',border:'none',cursor:'pointer',
            fontSize:12.5,fontWeight:600,fontFamily:'var(--font-body)',
            background: (tab==='campaigns' && statusScope===t.key) ?'#fff':'transparent',
            color: (tab==='campaigns' && statusScope===t.key)?'var(--slate-900)':'var(--slate-500)',
            boxShadow: (tab==='campaigns' && statusScope===t.key)?'var(--sh-sm)':'none',
          }}>{t.label}</button>
        ))}
        <span style={{width:1,background:'var(--slate-300)',margin:'4px 4px'}}/>
        {[
          {key:'volunteers', label:`👥 Volunteers (${volunteers.length})`, path:`${B}/volunteers`},
          {key:'reports',    label:'📊 Reports', path:`${B}/reports`},
        ].map(t=>(
          <button key={t.key} onClick={()=>{setTab(t.key);setPage(1);navigate(t.path);}} style={{
            padding:'7px 16px',borderRadius:'var(--r-sm)',border:'none',cursor:'pointer',
            fontSize:13,fontWeight:600,fontFamily:'var(--font-body)',
            background:tab===t.key?'#fff':'transparent',
            color:tab===t.key?'var(--slate-900)':'var(--slate-500)',
            boxShadow:tab===t.key?'var(--sh-sm)':'none',
          }}>{t.label}</button>
        ))}
      </div>

      {tab==='campaigns' && (
        <>
          <div className="card" style={{marginBottom:20}}>
            <div className="card-body" style={{padding:'14px 20px'}}>
              <div className="filters-bar">
                <div className="search-input-wrap">
                  <Search size={14}/>
                  <input className="search-input" placeholder="Search campaign, district..."
                    value={search} onChange={e=>setSearch(e.target.value)}/>
                </div>
                <select className="filter-select" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}>
                  <option value="all">All Types</option>
                  <option value="National">National</option>
                  <option value="Regional">Regional</option>
                  <option value="Institution">Institution</option>
                  <option value="Corporate">Corporate</option>
                </select>
                {(search||typeFilter!=='all') && (
                  <button onClick={()=>{setSearch('');setTypeFilter('all');}}
                    style={{padding:'8px 12px',border:'1px solid var(--slate-200)',borderRadius:'var(--r-sm)',background:'#fff',cursor:'pointer',fontSize:13,color:'var(--red-600)',display:'flex',alignItems:'center',gap:4}}>
                    <X size={13}/> Clear
                  </button>
                )}
                <span style={{marginLeft:'auto',fontSize:13,color:'var(--slate-500)'}}>{filtered.length} campaigns</span>
              </div>
            </div>
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            {loading && <div className="card"><div className="empty-state"><p>Loading campaigns...</p></div></div>}
            {!loading && paginated.map(c=>{
              const sc = STATUS_CONFIG[c.status]||{};
              const pct = c.target>0 ? Math.round(c.registered/c.target*100) : 0;
              const donePct = c.registered>0 ? Math.round(c.donated/c.registered*100) : 0;
              return (
                <div key={c._id} className="card" style={{borderLeft:`4px solid ${c.color}`}}>
                  <div className="card-body" style={{padding:'18px 22px'}}>
                    <div style={{display:'flex',alignItems:'flex-start',gap:16,flexWrap:'wrap'}}>
                      <div style={{width:52,height:52,borderRadius:'var(--r-md)',background:`${c.color}15`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,flexShrink:0}}>{c.image}</div>
                      <div style={{flex:1,minWidth:280}}>
                        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6,flexWrap:'wrap'}}>
                          <div style={{fontSize:16,fontWeight:800,color:'var(--slate-900)'}}>{c.title}</div>
                          <span style={{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:100,background:`${c.color}20`,color:c.color}}>{c.type}</span>
                          <span style={{fontSize:11,fontWeight:600,padding:'3px 10px',borderRadius:100,background:sc.bg,color:sc.color}}>{sc.label}</span>
                        </div>
                        <div style={{display:'flex',gap:16,fontSize:12,color:'var(--slate-500)',marginBottom:12,flexWrap:'wrap'}}>
                          <span style={{display:'flex',alignItems:'center',gap:4}}><Calendar size={11}/>{c.date}</span>
                          <span style={{display:'flex',alignItems:'center',gap:4}}><Clock size={11}/>{c.time || '—'}</span>
                          <span style={{display:'flex',alignItems:'center',gap:4}}><MapPin size={11}/>{c.venue || '—'}, {c.district || '—'}</span>
                          <span style={{display:'flex',alignItems:'center',gap:4}}><Users size={11}/>{c.volunteers} volunteers</span>
                        </div>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12,maxWidth:500}}>
                          <div>
                            <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--slate-400)',marginBottom:3}}>
                              <span>Registrations</span>
                              <span style={{fontWeight:700,color:'var(--blue-600)'}}>{c.registered}/{c.target} ({pct}%)</span>
                            </div>
                            <div style={{height:5,background:'var(--slate-100)',borderRadius:3,overflow:'hidden'}}>
                              <div style={{height:'100%',width:`${Math.min(100,pct)}%`,background:'var(--blue-500)',borderRadius:3}}/>
                            </div>
                          </div>
                          {c.donated>0 && (
                            <div>
                              <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--slate-400)',marginBottom:3}}>
                                <span>Donations</span>
                                <span style={{fontWeight:700,color:'var(--red-600)'}}>{c.donated} units ({donePct}%)</span>
                              </div>
                              <div style={{height:5,background:'var(--slate-100)',borderRadius:3,overflow:'hidden'}}>
                                <div style={{height:'100%',width:`${Math.min(100,donePct)}%`,background:'var(--red-500)',borderRadius:3}}/>
                              </div>
                            </div>
                          )}
                        </div>
                        <div style={{fontSize:12,color:'var(--slate-500)'}}>{c.description}</div>
                      </div>
                      <div style={{display:'flex',flexDirection:'column',gap:6,flexShrink:0}}>
                        <button className="icon-btn" title="View" onClick={()=>{setSelected(c);setModal('view');}}>
                          <Eye size={13}/>
                        </button>
                        <button className="icon-btn" title="Edit" onClick={()=>{setSelected(c);setForm({title:c.title,type:c.type,district:c.district,venue:c.venue,organizer:c.organizer,startDate:c.date,endDate:c.endDate,time:c.time,targetRegistrations:c.target,description:c.description});setFormError('');setModal('edit');}}>
                          <Edit size={13}/>
                        </button>
                        <button className="icon-btn danger" title="Delete" onClick={()=>deleteC(c._id)}>
                          <Trash2 size={13}/>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {!loading && paginated.length===0 && (
              <div className="card">
                <div className="empty-state">
                  <Calendar size={36} style={{margin:'0 auto 12px',opacity:.3}}/>
                  <h3>No campaigns found</h3>
                  <p>{campaigns.length===0 ? 'Create your first campaign to get started.' : 'Try adjusting your filters'}</p>
                </div>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="pagination" style={{marginTop:16}}>
              <span className="pagination-info">Showing {Math.min((page-1)*PER_PAGE+1,filtered.length)}–{Math.min(page*PER_PAGE,filtered.length)} of {filtered.length}</span>
              <div className="pagination-btns">
                <button className="page-btn" disabled={page===1} onClick={()=>setPage(p=>p-1)}><ChevronLeft size={14}/></button>
                {[...Array(totalPages)].map((_,i)=>(
                  <button key={i} className={`page-btn ${page===i+1?'active':''}`} onClick={()=>setPage(i+1)}>{i+1}</button>
                ))}
                <button className="page-btn" disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}><ChevronRight size={14}/></button>
              </div>
            </div>
          )}
        </>
      )}

      {tab==='volunteers' && (
        <div className="card">
          <div className="table-container">
            <table>
              <thead><tr>
                <th>Volunteer</th><th>District</th><th>Skills</th>
                <th>Campaigns</th><th>Status</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {volunteers.length===0 && (
                  <tr><td colSpan={6}><div className="empty-state"><p>No volunteers yet</p></div></td></tr>
                )}
                {volunteers.map(v=>(
                  <tr key={v._id}>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <div style={{width:34,height:34,borderRadius:'50%',background:'var(--amber-100)',color:'var(--amber-600)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:13,flexShrink:0}}>
                          {v.name?.charAt(0)}
                        </div>
                        <div>
                          <div className="td-name">{v.name}</div>
                          <div className="td-sub">{v.email} · {v.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{fontSize:13,color:'var(--slate-600)'}}>{v.district}</td>
                    <td style={{fontSize:12,color:'var(--slate-600)',maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{v.skills}</td>
                    <td style={{fontWeight:700,color:'var(--amber-600)',fontSize:15,textAlign:'center'}}>{v.campaigns}</td>
                    <td>
                      <span style={{fontSize:11,fontWeight:600,padding:'3px 8px',borderRadius:100,
                        background:v.status==='active'?'var(--green-100)':'var(--slate-100)',
                        color:v.status==='active'?'var(--green-600)':'var(--slate-400)'}}>
                        {v.status==='active'?'● Active':'○ Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{display:'flex',gap:4}}>
                        <button className="icon-btn danger" onClick={()=>deleteVolunteer(v._id)}>
                          <Trash2 size={13}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab==='reports' && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
          <div className="card">
            <div className="card-header"><div className="card-title">Campaign Performance</div></div>
            <div className="card-body">
              {campaigns.filter(c=>c.status==='completed'||c.status==='active').length===0 && (
                <div style={{textAlign:'center',padding:24,color:'var(--slate-400)',fontSize:13}}>No active/completed campaigns yet</div>
              )}
              {campaigns.filter(c=>c.status==='completed'||c.status==='active').map(c=>(
                <div key={c._id} style={{marginBottom:16}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:13,fontWeight:600,marginBottom:4}}>
                    <span style={{color:'var(--slate-900)'}}>{c.title}</span>
                    <span style={{color:c.color}}>{c.donated} donated</span>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{flex:1,height:6,background:'var(--slate-100)',borderRadius:3,overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${Math.min(100,c.target>0?Math.round(c.donated/c.target*100):0)}%`,background:c.color,borderRadius:3}}/>
                    </div>
                    <span style={{fontSize:11,fontWeight:600,color:'var(--slate-500)',minWidth:40}}>
                      {c.target>0?Math.round(c.donated/c.target*100):0}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">Summary Statistics</div></div>
            <div className="card-body">
              {[
                {label:'Total Campaigns Run',    value:campaigns.length,                                     color:'var(--slate-700)'},
                {label:'Total Registrations',    value:campaigns.reduce((a,b)=>a+(b.registered||0),0).toLocaleString(), color:'var(--blue-600)'},
                {label:'Total Blood Donated',    value:`${campaigns.reduce((a,b)=>a+(b.donated||0),0)} units`,   color:'var(--red-600)'},
                {label:'Total Volunteers',        value:volunteers.length,                                   color:'var(--amber-600)'},
                {label:'Avg Donation per Campaign',value: campaigns.filter(c=>c.donated>0).length > 0 ? Math.round(campaigns.reduce((a,b)=>a+(b.donated||0),0)/campaigns.filter(c=>c.donated>0).length) : 0, color:'var(--green-600)'},
              ].map(({label,value,color})=>(
                <div key={label} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:'1px solid var(--slate-50)'}}>
                  <span style={{fontSize:13,color:'var(--slate-600)'}}>{label}</span>
                  <span style={{fontSize:16,fontWeight:800,color,fontFamily:'var(--font-display)'}}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {modal==='view' && selected && (
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal" style={{maxWidth:580}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:40,height:40,borderRadius:'var(--r-sm)',background:`${selected.color}15`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>{selected.image}</div>
                <div>
                  <div className="modal-title">{selected.title}</div>
                  <div style={{fontSize:12,color:'var(--slate-400)',marginTop:2}}>{selected.type} · {selected.district}</div>
                </div>
              </div>
              <button onClick={()=>setModal(null)} className="icon-btn"><X size={16}/></button>
            </div>
            <div className="modal-body">
              <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
                <span style={{fontSize:12,fontWeight:700,padding:'4px 12px',borderRadius:100,background:`${selected.color}20`,color:selected.color}}>{selected.type}</span>
                <span style={{fontSize:12,fontWeight:600,padding:'4px 12px',borderRadius:100,background:STATUS_CONFIG[selected.status]?.bg,color:STATUS_CONFIG[selected.status]?.color}}>{STATUS_CONFIG[selected.status]?.label}</span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
                {[
                  {label:'Date',       value:selected.date},
                  {label:'Time',       value:selected.time || '—'},
                  {label:'Venue',      value:selected.venue || '—'},
                  {label:'District',   value:selected.district || '—'},
                  {label:'Organizer',  value:selected.organizer || '—'},
                  {label:'Volunteers', value:selected.volunteers},
                ].map(({label,value})=>(
                  <div key={label} style={{background:'var(--slate-50)',borderRadius:'var(--r-sm)',padding:'10px 12px'}}>
                    <div style={{fontSize:10,color:'var(--slate-400)',marginBottom:3}}>{label}</div>
                    <div style={{fontSize:13,fontWeight:600,color:'var(--slate-900)'}}>{value}</div>
                  </div>
                ))}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:16}}>
                {[
                  {label:'Target',      value:selected.target,      color:'var(--slate-700)'},
                  {label:'Registered',  value:selected.registered,  color:'var(--blue-600)'},
                  {label:'Donated',     value:selected.donated,     color:'var(--red-600)'},
                ].map(({label,value,color})=>(
                  <div key={label} style={{background:'var(--slate-50)',borderRadius:'var(--r-sm)',padding:'14px',textAlign:'center'}}>
                    <div style={{fontSize:24,fontWeight:800,color,fontFamily:'var(--font-display)'}}>{value}</div>
                    <div style={{fontSize:11,color:'var(--slate-400)',marginTop:4}}>{label}</div>
                  </div>
                ))}
              </div>
              {selected.description && (
                <div style={{background:'var(--slate-50)',borderRadius:'var(--r-sm)',padding:'12px 14px'}}>
                  <div style={{fontSize:11,color:'var(--slate-400)',marginBottom:4}}>Description</div>
                  <div style={{fontSize:13,color:'var(--slate-700)',lineHeight:1.6}}>{selected.description}</div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="action-btn btn-view" onClick={()=>setModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {(modal==='add'||modal==='edit') && (
        <div className="modal-overlay" onClick={closeModal}>
          <form onSubmit={submitCampaign}>
            <div className="modal" style={{maxWidth:600}} onClick={e=>e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title">{modal==='add'?'Create New Campaign':'Edit Campaign'}</div>
                <button type="button" onClick={closeModal} className="icon-btn"><X size={16}/></button>
              </div>
              <div className="modal-body">
                {formError && <div style={{background:'#FFF5F5',border:'1px solid #FEE2E2',borderRadius:8,padding:'10px 14px',marginBottom:14,fontSize:13,color:'var(--red-700)'}}>{formError}</div>}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                  <div style={{gridColumn:'span 2'}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Campaign Title</label>
                    <input required type="text" placeholder="Enter campaign title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}
                      style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',boxSizing:'border-box'}}/>
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Start Date</label>
                    <input required type="date" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})}
                      style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',boxSizing:'border-box'}}/>
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>End Date</label>
                    <input required type="date" value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})}
                      style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',boxSizing:'border-box'}}/>
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Time</label>
                    <input type="text" placeholder="8:00 AM - 4:00 PM" value={form.time} onChange={e=>setForm({...form,time:e.target.value})}
                      style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',boxSizing:'border-box'}}/>
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Target Donors</label>
                    <input type="number" placeholder="Target number" value={form.targetRegistrations} onChange={e=>setForm({...form,targetRegistrations:e.target.value})}
                      style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',boxSizing:'border-box'}}/>
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Campaign Type</label>
                    <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}
                      style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',background:'#fff'}}>
                      {['National','Regional','Institution','Corporate'].map(t=><option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>District</label>
                    <select value={form.district} onChange={e=>setForm({...form,district:e.target.value})}
                      style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',background:'#fff'}}>
                      <option value="">Select District</option>
                      {DISTRICTS.map(d=><option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div style={{gridColumn:'span 2'}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Venue</label>
                    <input type="text" placeholder="Venue name & address" value={form.venue} onChange={e=>setForm({...form,venue:e.target.value})}
                      style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',boxSizing:'border-box'}}/>
                  </div>
                  <div style={{gridColumn:'span 2'}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Organizer</label>
                    <input type="text" placeholder="Organizer name" value={form.organizer} onChange={e=>setForm({...form,organizer:e.target.value})}
                      style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',boxSizing:'border-box'}}/>
                  </div>
                  <div style={{gridColumn:'span 2'}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Description</label>
                    <textarea rows={3} placeholder="Campaign description..." value={form.description} onChange={e=>setForm({...form,description:e.target.value})}
                      style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',resize:'vertical',boxSizing:'border-box'}}/>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="action-btn btn-view" onClick={closeModal}>Cancel</button>
                <button type="submit" disabled={submitting} className="action-btn btn-approve">
                  {submitting ? 'Saving...' : (modal==='add'?'Create Campaign':'Save Changes')}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {modal==='addVolunteer' && (
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <form onSubmit={submitVolunteer}>
            <div className="modal" style={{maxWidth:480}} onClick={e=>e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title">Add Volunteer</div>
                <button type="button" onClick={()=>setModal(null)} className="icon-btn"><X size={16}/></button>
              </div>
              <div className="modal-body">
                {formError && <div style={{background:'#FFF5F5',border:'1px solid #FEE2E2',borderRadius:8,padding:'10px 14px',marginBottom:14,fontSize:13,color:'var(--red-700)'}}>{formError}</div>}
                <div style={{display:'grid',gap:14}}>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Full Name</label>
                    <input required type="text" placeholder="Volunteer full name" value={volunteerForm.name} onChange={e=>setVolunteerForm({...volunteerForm,name:e.target.value})}
                      style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',boxSizing:'border-box'}}/>
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Email</label>
                    <input required type="email" placeholder="email@example.com" value={volunteerForm.email} onChange={e=>setVolunteerForm({...volunteerForm,email:e.target.value})}
                      style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',boxSizing:'border-box'}}/>
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Phone</label>
                    <input type="tel" placeholder="07X XXXXXXX" value={volunteerForm.phone} onChange={e=>setVolunteerForm({...volunteerForm,phone:e.target.value})}
                      style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',boxSizing:'border-box'}}/>
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Skills</label>
                    <input type="text" placeholder="e.g. First Aid, Coordination" value={volunteerForm.skills} onChange={e=>setVolunteerForm({...volunteerForm,skills:e.target.value})}
                      style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',boxSizing:'border-box'}}/>
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>District</label>
                    <select value={volunteerForm.district} onChange={e=>setVolunteerForm({...volunteerForm,district:e.target.value})}
                      style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',background:'#fff'}}>
                      <option value="">Select District</option>
                      {DISTRICTS.map(d=><option key={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="action-btn btn-view" onClick={()=>setModal(null)}>Cancel</button>
                <button type="submit" disabled={submitting} className="action-btn btn-approve">{submitting?'Adding...':'Add Volunteer'}</button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}