import React,{useState} from 'react';
import {Search,CheckCircle,X,Eye,Truck} from 'lucide-react';

const MOCK=[
  {_id:'1',reqNo:'REQ-001',hospital:'National Hospital Colombo',district:'Colombo',blood:'O+',units:2,priority:'Emergency',status:'pending',   notes:'Cardiac surgery patient',time:'5 min ago',createdAt:new Date()},
  {_id:'2',reqNo:'REQ-002',hospital:'Asiri Medical Hospital',   district:'Colombo',blood:'A+',units:1,priority:'Urgent',   status:'processing',notes:'Road accident victim',  time:'1 hr ago', createdAt:new Date(Date.now()-3600000)},
  {_id:'3',reqNo:'REQ-003',hospital:'Colombo South Teaching',   district:'Colombo',blood:'B-',units:3,priority:'Normal',   status:'pending',   notes:'Scheduled surgery',    time:'2 hr ago', createdAt:new Date(Date.now()-7200000)},
  {_id:'4',reqNo:'REQ-004',hospital:'Kandy Teaching Hospital',  district:'Kandy',  blood:'AB-',units:2,priority:'Emergency',status:'fulfilled',notes:'',time:'4 hr ago',createdAt:new Date(Date.now()-14400000)},
  {_id:'5',reqNo:'REQ-005',hospital:'Galle Base Hospital',      district:'Galle',  blood:'O-',units:1,priority:'Urgent',   status:'rejected',  notes:'Stock not available',  time:'6 hr ago', createdAt:new Date(Date.now()-21600000)},
];

export default function HospitalRequestsPage(){
  const [requests,setRequests]=useState(MOCK);
  const [search,setSearch]=useState('');
  const [statusF,setStatusF]=useState('');
  const [priorityF,setPriorityF]=useState('');
  const [selected,setSelected]=useState(null);
  const [toast,setToast]=useState('');

  const showToast=msg=>{setToast(msg);setTimeout(()=>setToast(''),3000)};

  const updateStatus=(id,status)=>{
    setRequests(p=>p.map(r=>r._id===id?{...r,status}:r));
    setSelected(null);
    showToast(status==='fulfilled'?'Blood issued to hospital successfully!':`Request ${status}`);
  };

  const filtered=requests.filter(r=>{
    const ms=!search||r.hospital.toLowerCase().includes(search.toLowerCase())||r.blood.includes(search)||r.reqNo.includes(search);
    const mst=!statusF||r.status===statusF;
    const mp=!priorityF||r.priority===priorityF;
    return ms&&mst&&mp;
  });

  const counts={pending:requests.filter(r=>r.status==='pending').length,processing:requests.filter(r=>r.status==='processing').length,fulfilled:requests.filter(r=>r.status==='fulfilled').length,rejected:requests.filter(r=>r.status==='rejected').length};

  return(
    <div className="anim-up">
      <div className="page-hdr"><div><h1>Hospital Requests</h1><p>{counts.pending} pending · {counts.processing} processing</p></div></div>

      {toast&&(<div className="toast"><div className="toast-icon"><CheckCircle size={18} color="var(--green-600)"/></div><div style={{fontSize:14,fontWeight:600,color:'var(--slate-900)'}}>{toast}</div></div>)}

      {/* Counts */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:22}}>
        {[{l:'Pending',v:counts.pending,c:'var(--amber-500)'},{l:'Processing',v:counts.processing,c:'var(--p)'},{l:'Fulfilled',v:counts.fulfilled,c:'var(--green-600)'},{l:'Rejected',v:counts.rejected,c:'var(--red-600)'}].map(({l,v,c})=>(
          <div key={l} className="card" style={{padding:'16px 20px'}}>
            <div style={{fontSize:26,fontWeight:800,fontFamily:'var(--font-disp)',color:c,marginBottom:3}}>{v}</div>
            <div style={{fontSize:12,color:'var(--slate-500)'}}>{l}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <div className="filters-bar" style={{margin:0,width:'100%'}}>
            <div className="search-wrap"><Search size={14}/><input className="search-inp" placeholder="Search requests..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
            <select className="filter-sel" value={statusF} onChange={e=>setStatusF(e.target.value)}>
              <option value="">All Status</option><option value="pending">Pending</option><option value="processing">Processing</option><option value="fulfilled">Fulfilled</option><option value="rejected">Rejected</option>
            </select>
            <select className="filter-sel" value={priorityF} onChange={e=>setPriorityF(e.target.value)}>
              <option value="">All Priority</option><option value="Emergency">Emergency</option><option value="Urgent">Urgent</option><option value="Normal">Normal</option>
            </select>
          </div>
        </div>

        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Req No.</th><th>Hospital</th><th>Blood</th><th>Units</th><th>Priority</th><th>Time</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(r=>(
                <tr key={r._id}>
                  <td style={{fontWeight:700,color:'var(--p)',fontSize:12}}>{r.reqNo}</td>
                  <td><div className="td-name">{r.hospital}</div><div className="td-sub">{r.district}</div></td>
                  <td><span className="blood-badge">{r.blood}</span></td>
                  <td style={{fontWeight:700}}>{r.units}</td>
                  <td><span className={`priority-badge ${r.priority==='Emergency'?'p-emergency':r.priority==='Urgent'?'p-urgent':'p-normal'}`}>{r.priority}</span></td>
                  <td style={{fontSize:12,color:'var(--slate-400)'}}>{r.time}</td>
                  <td><span className={`status-badge s-${r.status}`}>{r.status}</span></td>
                  <td>
                    <div style={{display:'flex',gap:5}}>
                      <button className="action-btn purple" onClick={()=>setSelected(r)}><Eye size={13}/></button>
                      {r.status==='pending'&&<>
                        <button className="action-btn green" title="Accept" onClick={()=>updateStatus(r._id,'processing')}><CheckCircle size={13}/></button>
                        <button className="action-btn red" title="Reject" onClick={()=>updateStatus(r._id,'rejected')}><X size={13}/></button>
                      </>}
                      {r.status==='processing'&&<button className="action-btn green" title="Issue Blood" onClick={()=>updateStatus(r._id,'fulfilled')}><Truck size={13}/></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pagination"><div className="page-info">Showing {filtered.length} of {requests.length}</div></div>
      </div>

      {selected&&(
        <div className="modal-overlay" onClick={()=>setSelected(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-hdr"><div className="modal-title">Request — {selected.reqNo}</div><button className="action-btn" onClick={()=>setSelected(null)}><X size={14}/></button></div>
            <div className="modal-body">
              {/* Flow */}
              {selected.status!=='rejected'&&(
                <div style={{display:'flex',alignItems:'center',marginBottom:24}}>
                  {['Received','Processing','Issued'].map((step,i)=>{
                    const s={pending:1,processing:2,fulfilled:3}[selected.status]||0;
                    const done=s>i+1;const active=s===i+1;
                    return(<React.Fragment key={step}>
                      <div style={{display:'flex',flexDirection:'column',alignItems:'center',flex:1}}>
                        <div className={`flow-step ${done?'flow-done':active?'flow-active':'flow-pending'}`}>{done?'✓':i+1}</div>
                        <div style={{fontSize:11,fontWeight:600,marginTop:5,color:done?'var(--green-600)':active?'var(--p)':'var(--slate-400)'}}>{step}</div>
                      </div>
                      {i<2&&<div style={{flex:1,height:2,background:done?'var(--green-500)':'var(--slate-200)',margin:'0 4px',marginBottom:18}}/>}
                    </React.Fragment>);
                  })}
                </div>
              )}
              <div className="detail-row">
                <div className="detail-field"><div className="detail-label">Hospital</div><div className="detail-value">{selected.hospital}</div></div>
                <div className="detail-field"><div className="detail-label">District</div><div className="detail-value">{selected.district}</div></div>
              </div>
              <div className="detail-row">
                <div className="detail-field"><div className="detail-label">Blood Group</div><div className="detail-value"><span className="blood-badge">{selected.blood}</span></div></div>
                <div className="detail-field"><div className="detail-label">Units</div><div className="detail-value">{selected.units} units</div></div>
              </div>
              <div className="detail-row">
                <div className="detail-field"><div className="detail-label">Priority</div><div className="detail-value"><span className={`priority-badge ${selected.priority==='Emergency'?'p-emergency':selected.priority==='Urgent'?'p-urgent':'p-normal'}`}>{selected.priority}</span></div></div>
                <div className="detail-field"><div className="detail-label">Status</div><div className="detail-value"><span className={`status-badge s-${selected.status}`}>{selected.status}</span></div></div>
              </div>
              {selected.notes&&<div style={{background:'var(--slate-50)',borderRadius:'var(--r-sm)',padding:'12px 14px',fontSize:13,color:'var(--slate-600)'}}><strong>Notes:</strong> {selected.notes}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={()=>setSelected(null)}>Close</button>
              {selected.status==='pending'&&<>
                <button className="btn-danger" onClick={()=>updateStatus(selected._id,'rejected')}><X size={13}/>Reject</button>
                <button className="btn-success" onClick={()=>updateStatus(selected._id,'processing')}><CheckCircle size={13}/>Accept Request</button>
              </>}
              {selected.status==='processing'&&<button className="btn-success" onClick={()=>updateStatus(selected._id,'fulfilled')}><Truck size={13}/>Issue Blood</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
