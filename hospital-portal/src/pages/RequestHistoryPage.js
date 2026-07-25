import React,{useState} from 'react';
import {Search,Download} from 'lucide-react';

const ALL=[
  {_id:'1',requestNo:'REQ-001',patient:'Kamal Perera',bloodGroup:'O+',units:2,priority:'Emergency',bank:'National Blood Bank',status:'fulfilled',createdAt:new Date('2025-01-12'),fulfilledAt:new Date('2025-01-12')},
  {_id:'2',requestNo:'REQ-002',patient:'Nimal Silva', bloodGroup:'A+',units:1,priority:'Urgent',   bank:'City Blood Bank',     status:'fulfilled',createdAt:new Date('2025-01-10'),fulfilledAt:new Date('2025-01-10')},
  {_id:'3',requestNo:'REQ-003',patient:'Sandya F.',  bloodGroup:'B+',units:3,priority:'Normal',   bank:'National Blood Bank', status:'fulfilled',createdAt:new Date('2025-01-08'),fulfilledAt:new Date('2025-01-09')},
  {_id:'4',requestNo:'REQ-004',patient:'Roshan J.',  bloodGroup:'AB-',units:2,priority:'Emergency',bank:'Kandy Blood Bank',   status:'rejected', createdAt:new Date('2025-01-05'),fulfilledAt:null},
  {_id:'5',requestNo:'REQ-005',patient:'Priya K.',   bloodGroup:'O-',units:2,priority:'Urgent',   bank:'National Blood Bank', status:'fulfilled',createdAt:new Date('2024-12-28'),fulfilledAt:new Date('2024-12-29')},
  {_id:'6',requestNo:'REQ-006',patient:'Amali P.',   bloodGroup:'B-',units:1,priority:'Normal',   bank:'City Blood Bank',     status:'fulfilled',createdAt:new Date('2024-12-20'),fulfilledAt:new Date('2024-12-20')},
];

export default function RequestHistoryPage(){
  const [search,setSearch]=useState('');
  const [filter,setFilter]=useState('');

  const filtered=ALL.filter(r=>{
    const ms=!search||r.patient.toLowerCase().includes(search.toLowerCase())||r.requestNo.includes(search)||r.bloodGroup.includes(search);
    const mf=!filter||r.status===filter;
    return ms&&mf;
  });

  const totalUnits=ALL.filter(r=>r.status==='fulfilled').reduce((s,r)=>s+r.units,0);

  return(
    <div className="anim-up">
      <div className="page-hdr">
        <div><h1>Request History</h1><p>{ALL.length} total requests · {ALL.filter(r=>r.status==='fulfilled').length} fulfilled</p></div>
        <button className="btn-secondary"><Download size={14}/>Export CSV</button>
      </div>

      {/* Summary */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:22}}>
        {[
          {label:'Total Requests',value:ALL.length},
          {label:'Fulfilled',value:ALL.filter(r=>r.status==='fulfilled').length},
          {label:'Rejected',value:ALL.filter(r=>r.status==='rejected').length},
          {label:'Total Units Received',value:`${totalUnits} units`},
        ].map(({label,value})=>(
          <div key={label} className="card" style={{padding:'16px 20px'}}>
            <div style={{fontSize:24,fontWeight:800,fontFamily:'var(--font-disp)',color:'var(--slate-900)',marginBottom:3}}>{value}</div>
            <div style={{fontSize:12,color:'var(--slate-500)'}}>{label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <div className="filters-bar" style={{margin:0,width:'100%'}}>
            <div className="search-wrap">
              <Search size={14}/>
              <input className="search-inp" placeholder="Search requests..." value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            <select className="filter-sel" value={filter} onChange={e=>setFilter(e.target.value)}>
              <option value="">All</option>
              <option value="fulfilled">Fulfilled</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead><tr>
              <th>Req No.</th><th>Patient</th><th>Blood</th><th>Units</th><th>Priority</th><th>Blood Bank</th><th>Requested</th><th>Fulfilled</th><th>Status</th>
            </tr></thead>
            <tbody>
              {filtered.map(r=>(
                <tr key={r._id}>
                  <td style={{fontWeight:700,color:'var(--primary)',fontSize:12}}>{r.requestNo}</td>
                  <td><div className="td-name">{r.patient}</div></td>
                  <td><span className="blood-badge">{r.bloodGroup}</span></td>
                  <td style={{fontWeight:700}}>{r.units}</td>
                  <td><span className={`priority-badge ${r.priority==='Emergency'?'p-emergency':r.priority==='Urgent'?'p-urgent':'p-normal'}`}>{r.priority}</span></td>
                  <td style={{fontSize:12,color:'var(--slate-500)'}}>{r.bank}</td>
                  <td style={{fontSize:12,color:'var(--slate-400)'}}>{r.createdAt.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'2-digit'})}</td>
                  <td style={{fontSize:12,color:'var(--slate-400)'}}>{r.fulfilledAt?r.fulfilledAt.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'2-digit'}):'—'}</td>
                  <td><span className={`status-badge s-${r.status}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <div className="page-info">Showing {filtered.length} of {ALL.length}</div>
        </div>
      </div>
    </div>
  );
}
