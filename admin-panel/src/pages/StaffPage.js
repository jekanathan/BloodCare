import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Users, Plus, Search, Eye, Edit, Trash2, CheckCircle, XCircle, X, ChevronLeft, ChevronRight, Shield, Phone, Mail, Clock } from 'lucide-react';
import api from '../utils/api';

const B = '/dashboard/staff';

export default function StaffPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [staff, setStaff]         = useState([]);
  const [roles, setRoles]         = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [apiError, setApiError]   = useState('');
  const [tab, setTab]             = useState('staff');
  const [search, setSearch]       = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modal, setModal]         = useState(null);
  const [selected, setSelected]   = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [page, setPage]           = useState(1);
  const [actionLoading, setActionLoading] = useState({});
  const [form, setForm] = useState({ name:'', email:'', phone:'', password:'', roleId:'', department:'' });
  const [newRoleForm, setNewRoleForm] = useState({ name:'', description:'', permissions:[] });
  const PER_PAGE = 7;

  // ── URL-aware tab ─────────────────────────────────────────────────────
  // /staff            -> Staff tab
  // /staff/roles      -> Roles & Permissions tab
  // /staff/permissions -> also Roles & Permissions tab (permissions are managed per-role there)
  useEffect(() => {
    if (location.pathname === `${B}/roles` || location.pathname === `${B}/permissions`) {
      setTab('roles');
    } else if (location.pathname === B) {
      setTab('staff');
    }
  }, [location.pathname]);

  const switchTab = (key) => {
    setTab(key);
    setPage(1);
    navigate(key === 'roles' ? `${B}/roles` : B);
  };

  const fetchAll = () => {
    setLoading(true);
    setApiError('');
    Promise.all([
      api.get('/staff').catch(() => ({ data: { staff: [] } })),
      api.get('/staff/roles').catch(() => ({ data: { roles: [], allPermissions: [] } })),
    ]).then(([staffRes, rolesRes]) => {
      setStaff(staffRes.data?.staff || []);
      setRoles(rolesRes.data?.roles || []);
      setAllPermissions(rolesRes.data?.allPermissions || []);
    }).catch(err => {
      console.error('Fetch staff/roles error:', err);
      setApiError('Could not load staff data from server.');
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = staff.filter(s => {
    if (roleFilter!=='all'   && s.role!==roleFilter)     return false;
    if (statusFilter!=='all' && s.status!==statusFilter) return false;
    if (search && !s.name?.toLowerCase().includes(search.toLowerCase()) &&
        !s.email?.toLowerCase().includes(search.toLowerCase()) &&
        !s.department?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const paginated  = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE) || 1;

  const counts = {
    total:    staff.length,
    active:   staff.filter(s=>s.status==='active').length,
    inactive: staff.filter(s=>s.status==='inactive').length,
  };

  const setLoadingFor = (id, val) => setActionLoading(prev => ({ ...prev, [id]: val }));

  const toggleStatus = async (id) => {
    setLoadingFor(id, true);
    try {
      await api.patch(`/staff/${id}/toggle-status`);
      setStaff(prev => prev.map(s => s._id===id ? {...s, status: s.status==='active'?'inactive':'active'} : s));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setLoadingFor(id, false);
    }
  };

  const deleteStaff = async (id) => {
    if (!window.confirm('Delete this staff member? This will also remove their login account.')) return;
    setLoadingFor(id, true);
    try {
      await api.delete(`/staff/${id}`);
      setStaff(prev => prev.filter(s => s._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete staff member');
    } finally {
      setLoadingFor(id, false);
    }
  };

  const submitAddStaff = async (e) => {
    e.preventDefault();
    try {
      await api.post('/staff', form);
      setModal(null);
      setForm({ name:'', email:'', phone:'', password:'', roleId:'', department:'' });
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add staff member');
    }
  };

  const submitEditStaff = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/staff/${selected._id}`, form);
      setModal(null);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update staff member');
    }
  };

  const togglePermission = (perm) => {
    if (!selectedRole) return;
    const has = selectedRole.permissions.includes(perm);
    const updated = has
      ? selectedRole.permissions.filter(p => p !== perm)
      : [...selectedRole.permissions, perm];
    setSelectedRole({ ...selectedRole, permissions: updated });
  };

  const savePermissions = async () => {
    try {
      await api.patch(`/staff/roles/${selectedRole._id}/permissions`, { permissions: selectedRole.permissions });
      fetchAll();
      alert('Permissions saved');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save permissions');
    }
  };

  const submitAddRole = async (e) => {
    e.preventDefault();
    try {
      await api.post('/staff/roles', newRoleForm);
      setModal(null);
      setNewRoleForm({ name:'', description:'', permissions:[] });
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create role');
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
          {label:'Total Staff',  value:counts.total,   color:'var(--slate-700)', icon:'👥'},
          {label:'Active',       value:counts.active,  color:'var(--green-600)', icon:'✅'},
          {label:'Inactive',     value:counts.inactive,color:'var(--slate-400)', icon:'⏸️'},
          {label:'Total Roles',  value:roles.length,   color:'var(--purple-500)',icon:'🛡️'},
          {label:'Permissions',  value:allPermissions.reduce((a,b)=>a+b.items.length,0), color:'var(--blue-600)',icon:'🔑'},
        ].map(({label,value,color,icon})=>(
          <div key={label} className="card" style={{padding:'18px 20px',borderTop:`3px solid ${color}`}}>
            <div style={{fontSize:11,color:'var(--slate-400)',marginBottom:6}}>{icon} {label}</div>
            <div style={{fontSize:26,fontWeight:800,color,fontFamily:'var(--font-display)'}}>{value}</div>
          </div>
        ))}
      </div>

      <div className="page-header">
        <div className="page-header-left">
          <h1>Staff & User Management</h1>
          <p>Manage staff accounts, roles and permissions</p>
        </div>
        <div style={{display:'flex',gap:10}}>
          {tab==='roles' && (
            <button className="btn-add" style={{background:'var(--purple-500)'}} onClick={()=>setModal('addRole')}>
              <Shield size={15}/> Add Role
            </button>
          )}
          {tab==='staff' && (
            <button className="btn-add" onClick={()=>{setSelected(null);setForm({ name:'', email:'', phone:'', password:'', roleId:'', department:'' });setModal('add');}}>
              <Plus size={15}/> Add Staff
            </button>
          )}
        </div>
      </div>

      <div style={{display:'flex',gap:4,marginBottom:20,background:'var(--slate-100)',padding:4,borderRadius:'var(--r-sm)',width:'fit-content'}}>
        {[
          {key:'staff', label:`👥 Staff (${counts.total})`},
          {key:'roles', label:`🛡️ Roles & Permissions`},
        ].map(t=>(
          <button key={t.key} onClick={()=>switchTab(t.key)} style={{
            padding:'7px 16px',borderRadius:'var(--r-sm)',border:'none',cursor:'pointer',
            fontSize:13,fontWeight:600,fontFamily:'var(--font-body)',
            background:tab===t.key?'#fff':'transparent',
            color:tab===t.key?'var(--slate-900)':'var(--slate-500)',
            boxShadow:tab===t.key?'var(--sh-sm)':'none',
          }}>{t.label}</button>
        ))}
      </div>

      {tab==='staff' && (
        <>
          <div className="card" style={{marginBottom:20}}>
            <div className="card-body" style={{padding:'14px 20px'}}>
              <div className="filters-bar">
                <div className="search-input-wrap">
                  <Search size={14}/>
                  <input className="search-input" placeholder="Search by name, email, department..."
                    value={search} onChange={e=>setSearch(e.target.value)}/>
                </div>
                <select className="filter-select" value={roleFilter} onChange={e=>setRoleFilter(e.target.value)}>
                  <option value="all">All Roles</option>
                  {roles.map(r=><option key={r._id}>{r.name}</option>)}
                </select>
                <select className="filter-select" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                {(search||roleFilter!=='all'||statusFilter!=='all') && (
                  <button onClick={()=>{setSearch('');setRoleFilter('all');setStatusFilter('all');}}
                    style={{padding:'8px 12px',border:'1px solid var(--slate-200)',borderRadius:'var(--r-sm)',background:'#fff',cursor:'pointer',fontSize:13,color:'var(--red-600)',display:'flex',alignItems:'center',gap:4}}>
                    <X size={13}/> Clear
                  </button>
                )}
                <span style={{marginLeft:'auto',fontSize:13,color:'var(--slate-500)'}}>{filtered.length} staff</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="table-container">
              <table>
                <thead><tr>
                  <th>Staff Member</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Contact</th>
                  <th>Last Login</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr></thead>
                <tbody>
                  {loading && (
                    <tr><td colSpan={7}><div className="empty-state"><p>Loading staff...</p></div></td></tr>
                  )}
                  {!loading && paginated.map(s=>{
                    const isBusy = actionLoading[s._id];
                    return (
                      <tr key={s._id}>
                        <td>
                          <div style={{display:'flex',alignItems:'center',gap:10}}>
                            <div style={{width:36,height:36,borderRadius:'50%',background:s.roleBg||'var(--slate-100)',color:s.roleColor||'var(--slate-600)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:14,flexShrink:0}}>
                              {s.avatar}
                            </div>
                            <div>
                              <div className="td-name">{s.name}</div>
                              <div className="td-sub">{s.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:100,background:s.roleBg||'var(--slate-100)',color:s.roleColor||'var(--slate-600)'}}>
                            {s.role}
                          </span>
                        </td>
                        <td style={{fontSize:13,color:'var(--slate-600)'}}>{s.department || '—'}</td>
                        <td><div style={{fontSize:12,color:'var(--slate-600)'}}>{s.phone || '—'}</div></td>
                        <td style={{fontSize:12,color:'var(--slate-400)'}}>{s.lastLogin ? new Date(s.lastLogin).toLocaleDateString('en-GB') : 'Never'}</td>
                        <td>
                          <span style={{fontSize:11,fontWeight:600,padding:'3px 8px',borderRadius:100,
                            background:s.status==='active'?'var(--green-100)':'var(--slate-100)',
                            color:s.status==='active'?'var(--green-600)':'var(--slate-400)'}}>
                            {s.status==='active'?'● Active':'○ Inactive'}
                          </span>
                        </td>
                        <td>
                          <div style={{display:'flex',gap:4}}>
                            <button className="icon-btn" title="View" onClick={()=>{setSelected(s);setModal('view');}}>
                              <Eye size={13}/>
                            </button>
                            <button className="icon-btn" title="Edit" onClick={()=>{setSelected(s);setForm({name:s.name,email:s.email,phone:s.phone||'',password:'',roleId:s.roleId||'',department:s.department||''});setModal('edit');}}>
                              <Edit size={13}/>
                            </button>
                            <button className="icon-btn" title={s.status==='active'?'Deactivate':'Activate'}
                              disabled={isBusy}
                              onClick={()=>toggleStatus(s._id)}
                              style={{color:s.status==='active'?'var(--amber-600)':'var(--green-600)'}}>
                              {s.status==='active'?<XCircle size={13}/>:<CheckCircle size={13}/>}
                            </button>
                            <button className="icon-btn danger" title="Delete" disabled={isBusy} onClick={()=>deleteStaff(s._id)}>
                              <Trash2 size={13}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!loading && paginated.length===0 && (
                    <tr><td colSpan={7}>
                      <div className="empty-state">
                        <Users size={36} style={{margin:'0 auto 12px',opacity:.3}}/>
                        <h3>No staff found</h3>
                        <p>{staff.length===0 ? 'Add your first staff member to get started.' : 'Try adjusting your filters'}</p>
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

      {tab==='roles' && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {roles.map(r=>(
              <div key={r._id} className="card" style={{cursor:'pointer',borderLeft:`4px solid ${r.color}`,transition:'all .2s'}}
                onClick={()=>setSelectedRole(r)}>
                <div className="card-body" style={{padding:'16px 20px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <div style={{width:36,height:36,borderRadius:'var(--r-sm)',background:r.bg,display:'flex',alignItems:'center',justifyContent:'center'}}>
                        <Shield size={18} color={r.color}/>
                      </div>
                      <div>
                        <div style={{fontSize:14,fontWeight:700,color:'var(--slate-900)'}}>{r.name}</div>
                        <div style={{fontSize:11,color:'var(--slate-400)'}}>{r.description}</div>
                      </div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:20,fontWeight:800,color:r.color,fontFamily:'var(--font-display)'}}>{r.users.toLocaleString()}</div>
                      <div style={{fontSize:10,color:'var(--slate-400)'}}>users</div>
                    </div>
                  </div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                    {r.permissions.slice(0,4).map(p=>(
                      <span key={p} style={{fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:100,background:r.bg,color:r.color}}>{p}</span>
                    ))}
                    {r.permissions.length>4 && <span style={{fontSize:10,color:'var(--slate-400)'}}>+{r.permissions.length-4} more</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{height:'fit-content'}}>
            <div className="card-header">
              <div className="card-title">
                {selectedRole ? `${selectedRole.name} — Permissions` : 'Select a role to manage permissions'}
              </div>
              {selectedRole && !selectedRole.isSystemRole && (
                <button className="btn-add" style={{fontSize:12,padding:'6px 14px',background:selectedRole.color}} onClick={savePermissions}>
                  Save
                </button>
              )}
            </div>
            <div className="card-body">
              {selectedRole ? (
                selectedRole.isSystemRole ? (
                  <div style={{textAlign:'center',padding:'30px 20px',color:'var(--slate-400)'}}>
                    <Shield size={36} style={{margin:'0 auto 12px',opacity:.3}}/>
                    <div style={{fontSize:13}}>Super Admin has full access — permissions cannot be modified.</div>
                  </div>
                ) : (
                  allPermissions.map(({group,items})=>(
                    <div key={group} style={{marginBottom:16}}>
                      <div style={{fontSize:12,fontWeight:700,color:'var(--slate-700)',marginBottom:8,paddingBottom:4,borderBottom:'1px solid var(--slate-100)'}}>{group}</div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                        {items.map(perm=>{
                          const hasPerm = selectedRole.permissions.includes(perm);
                          return (
                            <label key={perm} style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',padding:'6px 8px',borderRadius:'var(--r-sm)',background:hasPerm?`${selectedRole.color}10`:'var(--slate-50)',border:`1px solid ${hasPerm?`${selectedRole.color}30`:'var(--slate-200)'}`}}>
                              <input type="checkbox" checked={hasPerm} onChange={()=>togglePermission(perm)} style={{accentColor:selectedRole.color}}/>
                              <span style={{fontSize:12,fontWeight:hasPerm?600:400,color:hasPerm?selectedRole.color:'var(--slate-500)'}}>{perm}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )
              ) : (
                <div style={{textAlign:'center',padding:'40px 20px',color:'var(--slate-400)'}}>
                  <Shield size={36} style={{margin:'0 auto 12px',opacity:.3}}/>
                  <div style={{fontSize:13}}>Click a role to manage its permissions</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {modal==='view' && selected && (
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal" style={{maxWidth:500}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:44,height:44,borderRadius:'50%',background:selected.roleBg,color:selected.roleColor,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:18,flexShrink:0}}>
                  {selected.avatar}
                </div>
                <div>
                  <div className="modal-title">{selected.name}</div>
                  <div style={{fontSize:12,color:'var(--slate-400)',marginTop:2}}>{selected.role}</div>
                </div>
              </div>
              <button onClick={()=>setModal(null)} className="icon-btn"><X size={16}/></button>
            </div>
            <div className="modal-body">
              <div style={{display:'flex',gap:10,marginBottom:16}}>
                <span style={{fontSize:12,fontWeight:700,padding:'4px 12px',borderRadius:100,background:selected.roleBg,color:selected.roleColor}}>
                  {selected.role}
                </span>
                <span style={{fontSize:12,fontWeight:600,padding:'4px 12px',borderRadius:100,background:selected.status==='active'?'var(--green-100)':'var(--slate-100)',color:selected.status==='active'?'var(--green-600)':'var(--slate-400)'}}>
                  {selected.status==='active'?'● Active':'○ Inactive'}
                </span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                {[
                  {icon:<Mail size={13}/>,  label:'Email',      value:selected.email},
                  {icon:<Phone size={13}/>, label:'Phone',      value:selected.phone || '—'},
                  {icon:<Users size={13}/>, label:'Department', value:selected.department || '—'},
                  {icon:<Clock size={13}/>, label:'Last Login', value: selected.lastLogin ? new Date(selected.lastLogin).toLocaleDateString('en-GB') : 'Never'},
                ].map(({icon,label,value})=>(
                  <div key={label} style={{background:'var(--slate-50)',borderRadius:'var(--r-sm)',padding:'12px 14px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,color:'var(--slate-400)',fontSize:11,marginBottom:4}}>{icon}{label}</div>
                    <div style={{fontSize:13,fontWeight:600,color:'var(--slate-900)'}}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="action-btn btn-view" onClick={()=>setModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {(modal==='add'||modal==='edit') && (
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <form onSubmit={modal==='add'?submitAddStaff:submitEditStaff}>
            <div className="modal" style={{maxWidth:560}} onClick={e=>e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title">{modal==='add'?'Add Staff Member':'Edit Staff Member'}</div>
                <button type="button" onClick={()=>setModal(null)} className="icon-btn"><X size={16}/></button>
              </div>
              <div className="modal-body">
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                  <div style={{gridColumn:'span 2'}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Full Name</label>
                    <input required type="text" placeholder="Enter full name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}
                      style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',boxSizing:'border-box'}}/>
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Email</label>
                    <input required type="email" placeholder="staff@bloodcare.lk" value={form.email} disabled={modal==='edit'} onChange={e=>setForm({...form,email:e.target.value})}
                      style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',boxSizing:'border-box',background:modal==='edit'?'var(--slate-50)':'#fff'}}/>
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Phone</label>
                    <input type="tel" placeholder="07X XXXXXXX" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}
                      style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',boxSizing:'border-box'}}/>
                  </div>
                  {modal==='add' && (
                    <div>
                      <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Password</label>
                      <input required type="password" placeholder="Min 8 characters" minLength={8} value={form.password} onChange={e=>setForm({...form,password:e.target.value})}
                        style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',boxSizing:'border-box'}}/>
                    </div>
                  )}
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Role</label>
                    <select required value={form.roleId} onChange={e=>setForm({...form,roleId:e.target.value})}
                      style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',background:'#fff'}}>
                      <option value="">Select Role</option>
                      {roles.map(r=><option key={r._id} value={r._id}>{r.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Department</label>
                    <input type="text" placeholder="Department name" value={form.department} onChange={e=>setForm({...form,department:e.target.value})}
                      style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',boxSizing:'border-box'}}/>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="action-btn btn-view" onClick={()=>setModal(null)}>Cancel</button>
                <button type="submit" className="action-btn btn-approve">
                  {modal==='add'?'Add Staff':'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {modal==='addRole' && (
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <form onSubmit={submitAddRole}>
            <div className="modal" style={{maxWidth:500}} onClick={e=>e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title">Create New Role</div>
                <button type="button" onClick={()=>setModal(null)} className="icon-btn"><X size={16}/></button>
              </div>
              <div className="modal-body">
                <div style={{display:'grid',gap:14}}>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Role Name</label>
                    <input required type="text" placeholder="e.g. Branch Manager" value={newRoleForm.name} onChange={e=>setNewRoleForm({...newRoleForm,name:e.target.value})}
                      style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',boxSizing:'border-box'}}/>
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Description</label>
                    <input type="text" placeholder="Role description" value={newRoleForm.description} onChange={e=>setNewRoleForm({...newRoleForm,description:e.target.value})}
                      style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',boxSizing:'border-box'}}/>
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:8}}>Select Permissions</label>
                    <div style={{maxHeight:200,overflowY:'auto',border:'1px solid var(--slate-200)',borderRadius:'var(--r-sm)',padding:'12px'}}>
                      {allPermissions.map(({group,items})=>(
                        <div key={group} style={{marginBottom:12}}>
                          <div style={{fontSize:11,fontWeight:700,color:'var(--slate-500)',marginBottom:6,textTransform:'uppercase'}}>{group}</div>
                          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4}}>
                            {items.map(p=>(
                              <label key={p} style={{display:'flex',alignItems:'center',gap:6,fontSize:12,cursor:'pointer',padding:'4px'}}>
                                <input type="checkbox" checked={newRoleForm.permissions.includes(p)}
                                  onChange={()=>setNewRoleForm(prev=>({
                                    ...prev,
                                    permissions: prev.permissions.includes(p) ? prev.permissions.filter(x=>x!==p) : [...prev.permissions,p],
                                  }))}/> {p}
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="action-btn btn-view" onClick={()=>setModal(null)}>Cancel</button>
                <button type="submit" className="action-btn btn-approve">
                  <Shield size={14}/> Create Role
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}