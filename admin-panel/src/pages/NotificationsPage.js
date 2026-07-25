import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Plus, Search, Eye, Trash2, X, Mail, MessageSquare, Megaphone, AlertCircle, FileText, Edit } from 'lucide-react';
import api from '../utils/api';

const B = '/dashboard/notifications';

const RECIPIENT_GROUPS = [
  'All Donors', 'Eligible Donors',
  'A+ Donors','A- Donors','B+ Donors','B- Donors','AB+ Donors','AB- Donors','O+ Donors','O- Donors',
];
const PUSH_RECIPIENT_GROUPS = [...RECIPIENT_GROUPS, 'All Hospitals', 'All Blood Banks'];

const TYPE_CONFIG = {
  SMS:          { icon: MessageSquare, color: '#16A34A', bg: 'var(--green-100)' },
  Email:        { icon: Mail,          color: '#2563EB', bg: 'var(--blue-100)' },
  Push:         { icon: Bell,          color: '#7C3AED', bg: 'var(--purple-100)' },
  Announcement: { icon: Megaphone,     color: '#DC2626', bg: 'var(--red-100)' },
};

const PATH_TO_TAB = {
  [`${B}`]: 'all',
  [`${B}/sms`]: 'sms',
  [`${B}/email`]: 'email',
  [`${B}/push`]: 'push',
  [`${B}/announcements`]: 'announcement',
  [`${B}/templates`]: 'templates',
};

export default function NotificationsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [apiError, setApiError] = useState('');
  const [tab, setTab]           = useState('all');
  const [search, setSearch]     = useState('');
  const [modal, setModal]       = useState(null);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState('');
  const [form, setForm] = useState({ title:'', message:'', recipientGroup:'All Donors' });
  const [templateForm, setTemplateForm] = useState({ name:'', type:'Email', subject:'', body:'' });

  useEffect(() => {
    const mapped = PATH_TO_TAB[location.pathname];
    if (mapped) setTab(mapped);
  }, [location.pathname]);

  const switchTab = (key, path) => { setTab(key); navigate(path); };

  const fetchAll = () => {
    setLoading(true);
    setApiError('');
    Promise.all([
      api.get('/notifications').catch(() => ({ data: { notifications: [] } })),
      api.get('/notifications/templates').catch(() => ({ data: { templates: [] } })),
    ]).then(([notifRes, tmplRes]) => {
      setNotifications(notifRes.data?.notifications || []);
      setTemplates(tmplRes.data?.templates || []);
    }).catch(() => setApiError('Could not load notifications from server.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = notifications.filter(n => {
    if (tab !== 'all' && tab !== 'templates' && n.type.toLowerCase() !== tab) return false;
    if (search && !n.title?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    all:  notifications.length,
    sms:  notifications.filter(n=>n.type==='SMS').length,
    email:notifications.filter(n=>n.type==='Email').length,
    push: notifications.filter(n=>n.type==='Push').length,
    announcement: notifications.filter(n=>n.type==='Announcement').length,
  };

  const totalSent  = notifications.filter(n=>n.status==='sent').length;
  const smsSent    = notifications.filter(n=>n.type==='SMS' && n.status==='sent').length;
  const emailSent  = notifications.filter(n=>n.type==='Email' && n.status==='sent').length;
  const pushSent   = notifications.filter(n=>n.type==='Push' && n.status==='sent').length;
  const avgOpenRate = (() => {
    const withRecipients = notifications.filter(n=>n.recipientCount>0);
    if (withRecipients.length===0) return 0;
    const total = withRecipients.reduce((a,n)=>a+(n.openedCount/n.recipientCount*100),0);
    return Math.round(total/withRecipients.length);
  })();

  const deleteNotif = async (id) => {
    if (!window.confirm('Delete this notification record?')) return;
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n=>n._id!==id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete notification');
    }
  };

  const submitSend = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await api.post('/notifications/send-email', form);
      setModal(null);
      setForm({ title:'', message:'', recipientGroup:'All Donors' });
      fetchAll();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to send email');
    } finally {
      setSubmitting(false);
    }
  };

  const submitAnnouncement = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await api.post('/notifications/send-announcement', form);
      setModal(null);
      setForm({ title:'', message:'', recipientGroup:'All Donors' });
      fetchAll();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to publish announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const submitPush = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await api.post('/push/send', form);
      setModal(null);
      setForm({ title:'', message:'', recipientGroup:'All Donors' });
      fetchAll();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to send push notification');
    } finally {
      setSubmitting(false);
    }
  };

  const openAddTemplate = () => { setSelected(null); setTemplateForm({ name:'', type:'Email', subject:'', body:'' }); setFormError(''); setModal('template'); };
  const openEditTemplate = (t) => { setSelected(t); setTemplateForm({ name:t.name, type:t.type, subject:t.subject||'', body:t.body }); setFormError(''); setModal('template'); };
  const submitTemplate = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      if (selected) await api.put(`/notifications/templates/${selected._id}`, templateForm);
      else await api.post('/notifications/templates', templateForm);
      setModal(null); fetchAll();
    } catch (err) { setFormError(err.response?.data?.message || 'Failed to save template'); }
    finally { setSubmitting(false); }
  };
  const deleteTemplate = async (t) => {
    if (t.isDefault) { alert('Default templates cannot be deleted — you can edit the content instead.'); return; }
    if (!window.confirm('Delete this template?')) return;
    await api.delete(`/notifications/templates/${t._id}`);
    fetchAll();
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
          {label:'Total Sent',  value:totalSent,   color:'var(--slate-700)', icon:'📊'},
          {label:'SMS Sent',    value:smsSent,     color:'var(--green-600)', icon:'📱'},
          {label:'Emails Sent', value:emailSent,   color:'var(--blue-600)',  icon:'📧'},
          {label:'Push Sent',   value:pushSent,    color:'#7C3AED',          icon:'🔔'},
          {label:'Avg Open Rate',value:`${avgOpenRate}%`, color:'#D97706',   icon:'📈'},
        ].map(({label,value,color,icon})=>(
          <div key={label} className="card" style={{padding:'18px 20px',borderTop:`3px solid ${color}`}}>
            <div style={{fontSize:11,color:'var(--slate-400)',marginBottom:6}}>{icon} {label}</div>
            <div style={{fontSize:26,fontWeight:800,color,fontFamily:'var(--font-display)'}}>{value}</div>
          </div>
        ))}
      </div>

      <div className="page-header">
        <div className="page-header-left">
          <h1>Notification Center</h1>
          <p>Manage email, announcements and message templates</p>
        </div>
        {tab==='templates' ? (
          <button className="btn-add" onClick={openAddTemplate}><Plus size={15}/> Add Template</button>
        ) : tab==='announcement' ? (
          <button className="btn-add" onClick={()=>{setFormError('');setForm({title:'',message:'',recipientGroup:'All Donors'});setModal('announce');}}><Plus size={15}/> Create Announcement</button>
        ) : tab==='push' ? (
          <button className="btn-add" onClick={()=>{setFormError('');setForm({title:'',message:'',recipientGroup:'All Donors'});setModal('push');}}><Plus size={15}/> Send Push</button>
        ) : (
          <button className="btn-add" onClick={()=>{setFormError('');setModal('send');}}><Plus size={15}/> Send Notification</button>
        )}
      </div>

      <div style={{display:'flex',gap:4,marginBottom:20,background:'var(--slate-100)',padding:4,borderRadius:'var(--r-sm)',width:'fit-content',flexWrap:'wrap'}}>
        {[
          {key:'all',          label:`All (${counts.all})`, path:B},
          {key:'sms',          label:`📱 SMS (${counts.sms})`, path:`${B}/sms`},
          {key:'email',        label:`📧 Email (${counts.email})`, path:`${B}/email`},
          {key:'push',         label:`🔔 Push (${counts.push})`, path:`${B}/push`},
          {key:'announcement', label:`📢 Announcements (${counts.announcement})`, path:`${B}/announcements`},
          {key:'templates',    label:`📝 Templates (${templates.length})`, path:`${B}/templates`},
        ].map(t => (
          <button key={t.key} onClick={()=>switchTab(t.key,t.path)} style={{
            padding:'7px 16px',borderRadius:'var(--r-sm)',border:'none',cursor:'pointer',
            fontSize:13,fontWeight:600,fontFamily:'var(--font-body)',
            background: tab===t.key ? '#fff' : 'transparent',
            color: tab===t.key ? 'var(--slate-900)' : 'var(--slate-500)',
            boxShadow: tab===t.key ? 'var(--sh-sm)' : 'none',
          }}>{t.label}</button>
        ))}
      </div>

      {tab==='sms' && (
        <div style={{background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.25)',borderRadius:10,padding:'10px 16px',marginBottom:20,fontSize:13,color:'var(--red-600)',display:'flex',alignItems:'center',gap:8}}>
          <AlertCircle size={15}/> SMS sending is not connected to a real gateway yet — see System Health for configuration status.
        </div>
      )}
      {tab==='push' && (
        <div style={{background:'rgba(59,130,246,.08)',border:'1px solid rgba(59,130,246,.25)',borderRadius:10,padding:'10px 16px',marginBottom:20,fontSize:13,color:'#1D4ED8',display:'flex',alignItems:'center',gap:8}}>
          <AlertCircle size={15}/> Push notifications are sent via Firebase to users who have granted permission in the donor/hospital/blood bank portals.
        </div>
      )}
      {tab==='announcement' && (
        <div style={{background:'rgba(59,130,246,.08)',border:'1px solid rgba(59,130,246,.25)',borderRadius:10,padding:'10px 16px',marginBottom:20,fontSize:13,color:'#1D4ED8',display:'flex',alignItems:'center',gap:8}}>
          <AlertCircle size={15}/> Announcements are published in-app immediately (no external SMS/push service needed).
        </div>
      )}

      {tab==='templates' ? (
        <div className="card">
          <div className="table-container">
            <table>
              <thead><tr><th>Name</th><th>Type</th><th>Subject</th><th>Body Preview</th><th>Actions</th></tr></thead>
              <tbody>
                {loading && <tr><td colSpan={5}><div className="empty-state"><p>Loading...</p></div></td></tr>}
                {!loading && templates.map(t => (
                  <tr key={t._id}>
                    <td className="td-name">{t.name} {t.isDefault && <span style={{fontSize:10,color:'var(--slate-400)'}}>(default)</span>}</td>
                    <td><span style={{fontSize:11,fontWeight:700,padding:'3px 8px',borderRadius:4,background:TYPE_CONFIG[t.type]?.bg,color:TYPE_CONFIG[t.type]?.color}}>{t.type}</span></td>
                    <td style={{fontSize:12}}>{t.subject || '—'}</td>
                    <td style={{fontSize:12,color:'var(--slate-500)',maxWidth:280,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.body}</td>
                    <td>
                      <div style={{display:'flex',gap:4}}>
                        <button className="icon-btn" onClick={()=>openEditTemplate(t)}><Edit size={13}/></button>
                        {!t.isDefault && <button className="icon-btn danger" onClick={()=>deleteTemplate(t)}><Trash2 size={13}/></button>}
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && templates.length===0 && (
                  <tr><td colSpan={5}><div className="empty-state"><FileText size={36} style={{margin:'0 auto 12px',opacity:.3}}/><h3>No templates yet</h3></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          <div className="card" style={{marginBottom:20}}>
            <div className="card-body" style={{padding:'14px 20px'}}>
              <div className="filters-bar">
                <div className="search-input-wrap">
                  <Search size={14}/>
                  <input className="search-input" placeholder="Search notifications..." value={search} onChange={e=>setSearch(e.target.value)}/>
                </div>
                <span style={{marginLeft:'auto',fontSize:13,color:'var(--slate-500)'}}>{filtered.length} notifications</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="table-container">
              <table>
                <thead><tr>
                  <th>Type</th><th>Title</th><th>Recipient</th><th>Message</th>
                  <th>Recipients</th><th>Opened</th><th>Open Rate</th><th>Status</th><th>Sent</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {loading && (<tr><td colSpan={10}><div className="empty-state"><p>Loading notifications...</p></div></td></tr>)}
                  {!loading && filtered.map(n => {
                    const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.Email;
                    const Icon = cfg.icon;
                    const openRate = n.recipientCount>0 ? Math.round(n.openedCount/n.recipientCount*100) : 0;
                    return (
                      <tr key={n._id}>
                        <td><span style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:11,fontWeight:700,padding:'3px 8px',borderRadius:4,background:cfg.bg,color:cfg.color}}><Icon size={11}/> {n.type}</span></td>
                        <td className="td-name">{n.title}</td>
                        <td style={{fontSize:12,color:'var(--slate-500)'}}>{n.recipientGroup}</td>
                        <td style={{fontSize:12,color:'var(--slate-500)',maxWidth:220,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{n.message}</td>
                        <td style={{fontWeight:700}}>{n.recipientCount}</td>
                        <td style={{color:'var(--blue-600)',fontWeight:600}}>{n.openedCount}</td>
                        <td><span style={{fontSize:12,fontWeight:700,color:openRate>=60?'var(--green-600)':openRate>=30?'#D97706':'var(--red-600)'}}>{openRate}%</span></td>
                        <td>
                          <span style={{fontSize:11,fontWeight:600,padding:'3px 8px',borderRadius:100,
                            background:n.status==='sent'?'var(--green-100)':n.status==='failed'?'var(--red-100)':'var(--amber-100)',
                            color:n.status==='sent'?'var(--green-600)':n.status==='failed'?'var(--red-600)':'#D97706'}}>
                            {n.status==='sent'?'✓ Sent':n.status==='failed'?'✗ Failed':'⏳ Pending'}
                          </span>
                        </td>
                        <td style={{fontSize:12,color:'var(--slate-400)'}}>{n.sentAt ? new Date(n.sentAt).toLocaleDateString('en-GB') : '—'}</td>
                        <td>
                          <div style={{display:'flex',gap:4}}>
                            <button className="icon-btn" title="View" onClick={()=>{setSelected(n);setModal('view');}}><Eye size={13}/></button>
                            <button className="icon-btn danger" title="Delete" onClick={()=>deleteNotif(n._id)}><Trash2 size={13}/></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!loading && filtered.length===0 && (
                    <tr><td colSpan={10}>
                      <div className="empty-state">
                        <Bell size={36} style={{margin:'0 auto 12px',opacity:.3}}/>
                        <h3>No notifications found</h3>
                        <p>{notifications.length===0 ? 'Send your first notification to get started.' : 'Try adjusting your filters'}</p>
                      </div>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {modal==='view' && selected && (
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal" style={{maxWidth:500}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">{selected.title}</div><button onClick={()=>setModal(null)} className="icon-btn"><X size={16}/></button></div>
            <div className="modal-body">
              <div style={{display:'flex',gap:8,marginBottom:16}}>
                <span style={{fontSize:12,fontWeight:700,padding:'4px 10px',borderRadius:100,background:TYPE_CONFIG[selected.type]?.bg,color:TYPE_CONFIG[selected.type]?.color}}>{selected.type}</span>
                <span style={{fontSize:12,fontWeight:600,padding:'4px 10px',borderRadius:100,background:selected.status==='sent'?'var(--green-100)':'var(--red-100)',color:selected.status==='sent'?'var(--green-600)':'var(--red-600)'}}>{selected.status}</span>
              </div>
              <div style={{background:'var(--slate-50)',borderRadius:8,padding:14,marginBottom:14,fontSize:13,color:'var(--slate-700)',whiteSpace:'pre-line'}}>{selected.message}</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,fontSize:12}}>
                <div><span style={{color:'var(--slate-400)'}}>Recipient Group:</span> <strong>{selected.recipientGroup}</strong></div>
                <div><span style={{color:'var(--slate-400)'}}>Recipients:</span> <strong>{selected.recipientCount}</strong></div>
                {selected.errorMessage && (<div style={{gridColumn:'span 2',color:'var(--red-600)'}}>Error: {selected.errorMessage}</div>)}
              </div>
            </div>
            <div className="modal-footer"><button className="action-btn btn-view" onClick={()=>setModal(null)}>Close</button></div>
          </div>
        </div>
      )}

      {modal==='send' && (
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <form onSubmit={submitSend}>
            <div className="modal" style={{maxWidth:540}} onClick={e=>e.stopPropagation()}>
              <div className="modal-header"><div className="modal-title">Send Email Notification</div><button type="button" onClick={()=>setModal(null)} className="icon-btn"><X size={16}/></button></div>
              <div className="modal-body">
                {formError && <div style={{background:'#FFF5F5',border:'1px solid #FEE2E2',borderRadius:8,padding:'10px 14px',marginBottom:14,fontSize:13,color:'var(--red-700)'}}>{formError}</div>}
                <div style={{display:'grid',gap:16}}>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Recipient Group</label>
                    <select value={form.recipientGroup} onChange={e=>setForm({...form,recipientGroup:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',background:'#fff'}}>
                      {RECIPIENT_GROUPS.map(g=><option key={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Subject</label>
                    <input required type="text" placeholder="Email subject" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',boxSizing:'border-box'}}/>
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Message</label>
                    <textarea required rows={5} placeholder="Write your message..." value={form.message} onChange={e=>setForm({...form,message:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',resize:'vertical',boxSizing:'border-box'}}/>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="action-btn btn-view" onClick={()=>setModal(null)}>Cancel</button>
                <button type="submit" disabled={submitting} className="action-btn btn-approve"><Mail size={14}/> {submitting ? 'Sending...' : 'Send Email'}</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {modal==='announce' && (
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <form onSubmit={submitAnnouncement}>
            <div className="modal" style={{maxWidth:540}} onClick={e=>e.stopPropagation()}>
              <div className="modal-header"><div className="modal-title">Create Announcement</div><button type="button" onClick={()=>setModal(null)} className="icon-btn"><X size={16}/></button></div>
              <div className="modal-body">
                {formError && <div style={{background:'#FFF5F5',border:'1px solid #FEE2E2',borderRadius:8,padding:'10px 14px',marginBottom:14,fontSize:13,color:'var(--red-700)'}}>{formError}</div>}
                <div style={{display:'grid',gap:16}}>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Audience</label>
                    <select value={form.recipientGroup} onChange={e=>setForm({...form,recipientGroup:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',background:'#fff'}}>
                      {RECIPIENT_GROUPS.map(g=><option key={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Title</label>
                    <input required type="text" placeholder="Announcement title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',boxSizing:'border-box'}}/>
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Message</label>
                    <textarea required rows={5} placeholder="Write your announcement..." value={form.message} onChange={e=>setForm({...form,message:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',resize:'vertical',boxSizing:'border-box'}}/>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="action-btn btn-view" onClick={()=>setModal(null)}>Cancel</button>
                <button type="submit" disabled={submitting} className="action-btn btn-approve"><Megaphone size={14}/> {submitting ? 'Publishing...' : 'Publish Announcement'}</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {modal==='template' && (
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <form onSubmit={submitTemplate}>
            <div className="modal" style={{maxWidth:520}} onClick={e=>e.stopPropagation()}>
              <div className="modal-header"><div className="modal-title">{selected?'Edit':'Add'} Template</div><button type="button" onClick={()=>setModal(null)} className="icon-btn"><X size={16}/></button></div>
              <div className="modal-body">
                {formError && <div style={{background:'#FFF5F5',border:'1px solid #FEE2E2',borderRadius:8,padding:'10px 14px',marginBottom:14,fontSize:13,color:'var(--red-700)'}}>{formError}</div>}
                <div style={{display:'grid',gap:14}}>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Template Name</label>
                    <input required value={templateForm.name} onChange={e=>setTemplateForm({...templateForm,name:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13}}/>
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Type</label>
                    <select value={templateForm.type} onChange={e=>setTemplateForm({...templateForm,type:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13,background:'#fff'}}>
                      {['SMS','Email','Push','Announcement'].map(t=><option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Subject (Email only)</label>
                    <input value={templateForm.subject} onChange={e=>setTemplateForm({...templateForm,subject:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13}}/>
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6}}>Body — use {'{{variable}}'} for placeholders</label>
                    <textarea required rows={5} value={templateForm.body} onChange={e=>setTemplateForm({...templateForm,body:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:8,fontSize:13,resize:'vertical'}}/>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="action-btn btn-view" onClick={()=>setModal(null)}>Cancel</button>
                <button type="submit" disabled={submitting} className="action-btn btn-approve">{submitting?'Saving...':'Save Template'}</button>
              </div>
            </div>
          </form>
        </div>
      )}
      {modal==='push' && (
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <form onSubmit={submitPush}>
            <div className="modal" style={{maxWidth:540}} onClick={e=>e.stopPropagation()}>
              <div className="modal-header"><div className="modal-title">Send Push Notification</div><button type="button" onClick={()=>setModal(null)} className="icon-btn"><X size={16}/></button></div>
              <div className="modal-body">
                {formError && <div style={{background:'#FFF5F5',border:'1px solid #FEE2E2',borderRadius:8,padding:'10px 14px',marginBottom:14,fontSize:13,color:'var(--red-700)'}}>{formError}</div>}
                <div style={{display:'grid',gap:16}}>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Recipient Group</label>
                    <select value={form.recipientGroup} onChange={e=>setForm({...form,recipientGroup:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',background:'#fff'}}>
                      {PUSH_RECIPIENT_GROUPS.map(g=><option key={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Title</label>
                    <input required type="text" placeholder="Push notification title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',boxSizing:'border-box'}}/>
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Message</label>
                    <textarea required rows={4} placeholder="Keep it short — this appears as a phone/browser notification" value={form.message} onChange={e=>setForm({...form,message:e.target.value})} style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,outline:'none',resize:'vertical',boxSizing:'border-box'}}/>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="action-btn btn-view" onClick={()=>setModal(null)}>Cancel</button>
                <button type="submit" disabled={submitting} className="action-btn" style={{background:'#7C3AED',color:'#fff',border:'none'}}><Bell size={14}/> {submitting ? 'Sending...' : 'Send Push'}</button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}