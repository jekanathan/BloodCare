import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Mail, Search, Eye, CheckCircle, X, ChevronLeft, ChevronRight, ThumbsUp } from 'lucide-react';
import api from '../utils/api';

const TYPE_CONFIG = {
  feedback:   {label:'Feedback',   icon:'⭐', color:'var(--amber-600)', bg:'var(--amber-100)'},
  complaint:  {label:'Complaint',  icon:'⚠️', color:'var(--red-600)',   bg:'var(--red-100)'},
  suggestion: {label:'Suggestion', icon:'💡', color:'var(--blue-600)',  bg:'var(--blue-100)'},
  contact:    {label:'Contact',    icon:'📧', color:'#7C3AED',          bg:'var(--purple-100)'},
};

const STATUS_CONFIG = {
  pending:  {label:'Pending',  color:'#D97706',          bg:'var(--amber-100)'},
  read:     {label:'Read',     color:'var(--blue-600)',  bg:'var(--blue-100)'},
  resolved: {label:'Resolved', color:'var(--green-600)', bg:'var(--green-100)'},
};

const timeAgo = (date) => {
  if (!date) return '';
  const diff = Math.floor((new Date() - new Date(date)) / 60000);
  if (diff < 1) return 'Just now';
  if (diff < 60)   return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff/60)}h ago`;
  return `${Math.floor(diff/1440)}d ago`;
};

const StarRating = ({rating, size=14}) => (
  <div style={{display:'flex',gap:2}}>
    {[1,2,3,4,5].map(i=>(
      <Star key={i} size={size} fill={i<=rating?'#F59E0B':'none'} color={i<=rating?'#F59E0B':'#CBD5E1'}/>
    ))}
  </div>
);

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [apiError, setApiError] = useState('');
  const [tab, setTab]           = useState('all');
  const [search, setSearch]     = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [modal, setModal]       = useState(false);
  const [replyText, setReplyText] = useState('');
  const [page, setPage]         = useState(1);
  const PER_PAGE = 7;

  const fetchFeedback = () => {
    setLoading(true);
    setApiError('');
    api.get('/feedback')
      .then(res => setFeedback(res.data?.feedback || []))
      .catch(err => {
        console.error('Fetch feedback error:', err);
        setApiError('Could not load feedback from server.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchFeedback(); }, []);

  const filtered = feedback.filter(f => {
    if (tab==='complaints')  return f.type==='complaint';
    if (tab==='suggestions') return f.type==='suggestion';
    if (tab==='contacts')    return f.type==='contact';
    if (typeFilter!=='all'   && f.type!==typeFilter)     return false;
    if (statusFilter!=='all' && f.status!==statusFilter) return false;
    if (search && !f.name?.toLowerCase().includes(search.toLowerCase()) &&
        !f.subject?.toLowerCase().includes(search.toLowerCase()) &&
        !f.message?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const paginated  = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE) || 1;

  const counts = {
    all:         feedback.length,
    feedback:    feedback.filter(f=>f.type==='feedback').length,
    complaints:  feedback.filter(f=>f.type==='complaint').length,
    suggestions: feedback.filter(f=>f.type==='suggestion').length,
    contacts:    feedback.filter(f=>f.type==='contact').length,
    pending:     feedback.filter(f=>f.status==='pending').length,
  };

  const ratedFeedback = feedback.filter(f=>f.rating>0);
  const avgRating = ratedFeedback.length > 0
    ? (ratedFeedback.reduce((a,b)=>a+b.rating,0) / ratedFeedback.length).toFixed(1)
    : '0.0';

  const markRead = async (id) => {
    try {
      await api.patch(`/feedback/${id}/read`);
      setFeedback(prev => prev.map(f=>f._id===id ? {...f, status: f.status==='pending'?'read':f.status} : f));
    } catch (err) { console.error(err); }
  };

  const markResolved = async (id, reply) => {
    try {
      await api.patch(`/feedback/${id}/resolve`, { reply });
      setFeedback(prev => prev.map(f=>f._id===id ? {...f, status:'resolved', adminReply: reply || f.adminReply} : f));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark as resolved');
    }
  };

  return (
    <div className="animate-fade">

      {apiError && (
        <div style={{background:'rgba(234,179,8,.1)',border:'1px solid rgba(234,179,8,.3)',borderRadius:8,padding:'10px 16px',marginBottom:16,fontSize:13,color:'#92400E'}}>
          ⚠️ {apiError}
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:14,marginBottom:24}}>
        {[
          {label:'Total Feedback', value:counts.all,        color:'var(--slate-700)', icon:'📊'},
          {label:'Avg Rating',     value:avgRating,          color:'#F59E0B',          icon:'⭐'},
          {label:'Feedback',       value:counts.feedback,    color:'var(--amber-600)', icon:'⭐'},
          {label:'Complaints',     value:counts.complaints,  color:'var(--red-600)',   icon:'⚠️'},
          {label:'Suggestions',    value:counts.suggestions, color:'var(--blue-600)',  icon:'💡'},
          {label:'Pending',        value:counts.pending,     color:'#D97706',          icon:'⏳'},
        ].map(({label,value,color,icon})=>(
          <div key={label} className="card" style={{padding:'16px 18px',borderTop:`3px solid ${color}`}}>
            <div style={{fontSize:11,color:'var(--slate-400)',marginBottom:4}}>{icon} {label}</div>
            <div style={{fontSize:24,fontWeight:800,color,fontFamily:'var(--font-display)'}}>{value}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{marginBottom:20}}>
        <div className="card-body" style={{padding:'20px 24px'}}>
          <div style={{display:'grid',gridTemplateColumns:'auto 1fr',gap:32,alignItems:'center'}}>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:56,fontWeight:800,color:'#F59E0B',fontFamily:'var(--font-display)',lineHeight:1}}>{avgRating}</div>
              <StarRating rating={Math.round(parseFloat(avgRating))} size={18}/>
              <div style={{fontSize:12,color:'var(--slate-400)',marginTop:6}}>{ratedFeedback.length} reviews</div>
            </div>
            <div>
              {[5,4,3,2,1].map(star=>{
                const count = feedback.filter(f=>f.rating===star).length;
                const pct   = ratedFeedback.length > 0 ? Math.round(count/ratedFeedback.length*100) : 0;
                return (
                  <div key={star} style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
                    <div style={{display:'flex',alignItems:'center',gap:4,width:60,flexShrink:0}}>
                      <span style={{fontSize:12,color:'var(--slate-600)'}}>{star}</span>
                      <Star size={12} fill="#F59E0B" color="#F59E0B"/>
                    </div>
                    <div style={{flex:1,height:8,background:'var(--slate-100)',borderRadius:4,overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${pct}%`,background:'#F59E0B',borderRadius:4,transition:'width .8s'}}/>
                    </div>
                    <span style={{fontSize:12,color:'var(--slate-500)',width:40,textAlign:'right'}}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="page-header">
        <div className="page-header-left">
          <h1>Feedback Management</h1>
          <p>Manage user feedback, complaints and suggestions</p>
        </div>
      </div>

      <div style={{display:'flex',gap:4,marginBottom:20,background:'var(--slate-100)',padding:4,borderRadius:'var(--r-sm)',width:'fit-content'}}>
        {[
          {key:'all',         label:`All (${counts.all})`},
          {key:'complaints',  label:`⚠️ Complaints (${counts.complaints})`},
          {key:'suggestions', label:`💡 Suggestions (${counts.suggestions})`},
          {key:'contacts',    label:`📧 Contact (${counts.contacts})`},
        ].map(t=>(
          <button key={t.key} onClick={()=>{setTab(t.key);setPage(1);}} style={{
            padding:'7px 14px',borderRadius:'var(--r-sm)',border:'none',cursor:'pointer',
            fontSize:12.5,fontWeight:600,fontFamily:'var(--font-body)',
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
              <input className="search-input" placeholder="Search by name, subject, message..."
                value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            <select className="filter-select" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}>
              <option value="all">All Types</option>
              <option value="feedback">Feedback</option>
              <option value="complaint">Complaint</option>
              <option value="suggestion">Suggestion</option>
              <option value="contact">Contact</option>
            </select>
            <select className="filter-select" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="read">Read</option>
              <option value="resolved">Resolved</option>
            </select>
            {(search||typeFilter!=='all'||statusFilter!=='all') && (
              <button onClick={()=>{setSearch('');setTypeFilter('all');setStatusFilter('all');}}
                style={{padding:'8px 12px',border:'1px solid var(--slate-200)',borderRadius:'var(--r-sm)',background:'#fff',cursor:'pointer',fontSize:13,color:'var(--red-600)',display:'flex',alignItems:'center',gap:4}}>
                <X size={13}/> Clear
              </button>
            )}
            <span style={{marginLeft:'auto',fontSize:13,color:'var(--slate-500)'}}>{filtered.length} items</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr>
              <th>Type</th>
              <th>From</th>
              <th>Subject</th>
              <th>Rating</th>
              <th>Role</th>
              <th>Helpful</th>
              <th>Status</th>
              <th>Time</th>
              <th>Actions</th>
            </tr></thead>
            <tbody>
              {loading && (
                <tr><td colSpan={9}><div className="empty-state"><p>Loading feedback...</p></div></td></tr>
              )}
              {!loading && paginated.map(f=>{
                const tc = TYPE_CONFIG[f.type]||{};
                const sc = STATUS_CONFIG[f.status]||{};
                return (
                  <tr key={f._id} style={{background:f.status==='pending'?'#FFFBF0':''}}>
                    <td>
                      <span style={{fontSize:12,fontWeight:700,padding:'3px 10px',borderRadius:4,background:tc.bg,color:tc.color}}>
                        {tc.icon} {tc.label}
                      </span>
                    </td>
                    <td>
                      <div className="td-name">{f.name}</div>
                      <div className="td-sub">{f.email}</div>
                    </td>
                    <td>
                      <div style={{fontSize:13,fontWeight:600,color:'var(--slate-900)',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.subject}</div>
                      <div style={{fontSize:11,color:'var(--slate-400)',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.message}</div>
                    </td>
                    <td>
                      {f.rating > 0 ? <StarRating rating={f.rating}/> : <span style={{color:'var(--slate-300)',fontSize:12}}>—</span>}
                    </td>
                    <td>
                      <span style={{fontSize:11,fontWeight:600,padding:'3px 8px',borderRadius:100,
                        background:f.role==='Donor'?'var(--red-100)':f.role==='Hospital'?'var(--blue-100)':f.role==='Blood Bank'?'var(--purple-100)':'var(--slate-100)',
                        color:f.role==='Donor'?'var(--red-600)':f.role==='Hospital'?'var(--blue-600)':f.role==='Blood Bank'?'#7C3AED':'var(--slate-600)'}}>
                        {f.role}
                      </span>
                    </td>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:4,fontSize:12,color:'var(--slate-600)'}}>
                        <ThumbsUp size={12} color="var(--green-500)"/>
                        <span style={{fontWeight:600}}>{f.helpful}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{fontSize:11,fontWeight:600,padding:'3px 8px',borderRadius:100,background:sc.bg,color:sc.color}}>
                        {sc.label}
                      </span>
                    </td>
                    <td style={{fontSize:12,color:'var(--slate-400)'}}>{timeAgo(f.createdAt)}</td>
                    <td>
                      <div style={{display:'flex',gap:4}}>
                        <button className="icon-btn" title="View & Reply" onClick={()=>{setSelected(f);setReplyText(f.adminReply||'');setModal(true);markRead(f._id);}}>
                          <Eye size={13}/>
                        </button>
                        {f.status!=='resolved' && (
                          <button className="icon-btn" title="Mark Resolved" onClick={()=>markResolved(f._id)} style={{color:'var(--green-600)'}}>
                            <CheckCircle size={13}/>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && paginated.length===0 && (
                <tr><td colSpan={9}>
                  <div className="empty-state">
                    <MessageSquare size={36} style={{margin:'0 auto 12px',opacity:.3}}/>
                    <h3>No feedback found</h3>
                    <p>{feedback.length===0 ? 'No feedback submitted yet.' : 'Try adjusting your filters'}</p>
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

      {/* VIEW & REPLY MODAL */}
      {modal && selected && (
        <div className="modal-overlay" onClick={()=>setModal(false)}>
          <div className="modal" style={{maxWidth:580}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:40,height:40,borderRadius:'50%',background:'var(--red-100)',color:'var(--red-700)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:16,flexShrink:0}}>
                  {selected.name?.charAt(0)}
                </div>
                <div>
                  <div className="modal-title">{selected.subject}</div>
                  <div style={{fontSize:12,color:'var(--slate-400)',marginTop:2}}>{selected.name} · {selected.role} · {timeAgo(selected.createdAt)}</div>
                </div>
              </div>
              <button onClick={()=>setModal(false)} className="icon-btn"><X size={16}/></button>
            </div>
            <div className="modal-body">

              <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
                <span style={{fontSize:12,fontWeight:700,padding:'4px 12px',borderRadius:100,background:TYPE_CONFIG[selected.type]?.bg,color:TYPE_CONFIG[selected.type]?.color}}>
                  {TYPE_CONFIG[selected.type]?.icon} {TYPE_CONFIG[selected.type]?.label}
                </span>
                <span style={{fontSize:12,fontWeight:600,padding:'4px 12px',borderRadius:100,background:STATUS_CONFIG[selected.status]?.bg,color:STATUS_CONFIG[selected.status]?.color}}>
                  {STATUS_CONFIG[selected.status]?.label}
                </span>
                {selected.rating > 0 && <StarRating rating={selected.rating} size={16}/>}
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
                {[
                  {label:'Name',  value:selected.name},
                  {label:'Email', value:selected.email},
                  {label:'Role',  value:selected.role},
                  {label:'Helpful', value:`${selected.helpful} people found this helpful`},
                ].map(({label,value})=>(
                  <div key={label} style={{background:'var(--slate-50)',borderRadius:'var(--r-sm)',padding:'10px 12px'}}>
                    <div style={{fontSize:10,color:'var(--slate-400)',marginBottom:3}}>{label}</div>
                    <div style={{fontSize:13,fontWeight:600,color:'var(--slate-900)'}}>{value}</div>
                  </div>
                ))}
              </div>

              <div style={{background:selected.type==='complaint'?'var(--red-50)':selected.type==='suggestion'?'var(--blue-50)':'var(--amber-100)',border:`1px solid ${selected.type==='complaint'?'var(--red-100)':selected.type==='suggestion'?'var(--blue-100)':'#FDE68A'}`,borderRadius:'var(--r-sm)',padding:'14px 16px',marginBottom:16}}>
                <div style={{fontSize:12,fontWeight:700,color:selected.type==='complaint'?'var(--red-700)':selected.type==='suggestion'?'var(--blue-700)':'#92400E',marginBottom:8}}>
                  {TYPE_CONFIG[selected.type]?.icon} Message
                </div>
                <div style={{fontSize:14,color:'var(--slate-700)',lineHeight:1.7}}>{selected.message}</div>
              </div>

              {selected.adminReply && (
                <div style={{background:'var(--green-50)',border:'1px solid var(--green-100)',borderRadius:'var(--r-sm)',padding:'14px 16px',marginBottom:16}}>
                  <div style={{fontSize:12,fontWeight:700,color:'var(--green-700)',marginBottom:8}}>✅ Admin Reply (saved)</div>
                  <div style={{fontSize:14,color:'var(--slate-700)',lineHeight:1.7}}>{selected.adminReply}</div>
                </div>
              )}

              <div>
                <label style={{display:'block',fontSize:12,fontWeight:700,color:'var(--slate-700)',marginBottom:8}}>
                  📝 Internal Reply Note (saved to record, not emailed)
                </label>
                <textarea rows={4} value={replyText} onChange={e=>setReplyText(e.target.value)}
                  placeholder={`Write a reply note for ${selected.name}...`}
                  style={{width:'100%',padding:'10px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,fontFamily:'var(--font-body)',outline:'none',resize:'vertical',marginBottom:8}}/>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  {[
                    'Thank you for your feedback! We appreciate your input.',
                    'We have received your complaint and will investigate immediately.',
                    'Great suggestion! We will consider this for future updates.',
                  ].map(t=>(
                    <button key={t.slice(0,20)} type="button" onClick={()=>setReplyText(t)}
                      style={{fontSize:11,padding:'5px 10px',background:'var(--slate-100)',border:'none',borderRadius:'var(--r-sm)',cursor:'pointer',color:'var(--slate-600)',textAlign:'left'}}>
                      {t.slice(0,25)}...
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="action-btn btn-view" onClick={()=>setModal(false)}>Cancel</button>
              <button className="action-btn btn-approve" onClick={()=>{markResolved(selected._id, replyText);setModal(false);}}>
                <CheckCircle size={14}/> Save Reply & Resolve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}