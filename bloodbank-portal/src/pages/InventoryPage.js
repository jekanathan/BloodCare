import React,{useState} from 'react';
import {Plus,Minus,Save,AlertTriangle,CheckCircle} from 'lucide-react';

const BG=['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const INIT={
  'A+':125,'A-':32,'B+':98,'B-':15,'AB+':45,'AB-':6,'O+':167,'O-':74
};

export default function InventoryPage(){
  const [stock,setStock]=useState(INIT);
  const [editing,setEditing]=useState({});
  const [draft,setDraft]=useState({});
  const [toast,setToast]=useState('');
  const [showAdd,setShowAdd]=useState(false);
  const [addForm,setAddForm]=useState({bloodGroup:'A+',units:'',reason:'Donation received'});

  const showToast=msg=>{setToast(msg);setTimeout(()=>setToast(''),3000)};

  const startEdit=g=>{setEditing(p=>({...p,[g]:true}));setDraft(p=>({...p,[g]:stock[g]}));};
  const cancelEdit=g=>{setEditing(p=>({...p,[g]:false}));};
  const saveEdit=g=>{
    setStock(p=>({...p,[g]:parseInt(draft[g])||0}));
    setEditing(p=>({...p,[g]:false}));
    showToast(`${g} inventory updated to ${draft[g]} units`);
  };
  const adjust=(g,delta)=>setStock(p=>({...p,[g]:Math.max(0,(p[g]||0)+delta)}));

  const handleAdd=e=>{
    e.preventDefault();
    const u=parseInt(addForm.units)||0;
    setStock(p=>({...p,[addForm.bloodGroup]:(p[addForm.bloodGroup]||0)+u}));
    setShowAdd(false);setAddForm({bloodGroup:'A+',units:'',reason:'Donation received'});
    showToast(`+${u} units of ${addForm.bloodGroup} added to inventory`);
  };

  const totalUnits=Object.values(stock).reduce((a,b)=>a+b,0);
  const criticals=BG.filter(g=>stock[g]<20);
  const lows=BG.filter(g=>stock[g]>=20&&stock[g]<50);

  return(
    <div className="anim-up">
      <div className="page-hdr">
        <div><h1>Blood Inventory</h1><p>Total: <strong>{totalUnits}</strong> units · {criticals.length} critical · {lows.length} low</p></div>
        <div style={{display:'flex',gap:10}}>
          <button className="btn-secondary">📥 Export Report</button>
          <button className="btn-primary" onClick={()=>setShowAdd(true)}><Plus size={15}/>Add Stock</button>
        </div>
      </div>

      {toast&&(
        <div className="toast">
          <div className="toast-icon"><CheckCircle size={18} color="var(--green-600)"/></div>
          <div style={{fontSize:14,fontWeight:600,color:'var(--slate-900)'}}>{toast}</div>
        </div>
      )}

      {/* Critical alert */}
      {criticals.length>0&&(
        <div style={{background:'var(--red-50)',border:'1.5px solid var(--red-200)',borderRadius:'var(--r-md)',padding:'14px 20px',marginBottom:22,display:'flex',alignItems:'center',gap:12}}>
          <AlertTriangle size={20} color="var(--red-600)"/>
          <div>
            <div style={{fontWeight:700,fontSize:14,color:'var(--red-700)'}}>Critical Stock Alert</div>
            <div style={{fontSize:13,color:'var(--red-600)'}}>
              {criticals.map(g=>`${g} (${stock[g]} units)`).join(', ')} — Launch campaign immediately
            </div>
          </div>
          <button className="btn-danger" style={{marginLeft:'auto',padding:'7px 14px',fontSize:12}}>🔔 Notify Donors</button>
        </div>
      )}

      {/* Inventory cards grid */}
      <div className="inv-grid">
        {BG.map(g=>{
          const u=stock[g]||0;
          const critical=u<20;const low=u<50&&u>=20;
          const pct=Math.min(100,Math.round((u/200)*100));
          const fillColor=critical?'linear-gradient(90deg,#DC2626,#F87171)':low?'linear-gradient(90deg,#D97706,#FCD34D)':'linear-gradient(90deg,var(--p),#A78BFA)';
          return(
            <div key={g} className={`inv-card ${critical?'critical':low?'low':'ok'}`}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                <div className="inv-blood">{g}</div>
                {critical&&<span style={{fontSize:10,fontWeight:800,color:'var(--red-600)',background:'var(--red-100)',padding:'3px 8px',borderRadius:100}}>CRITICAL</span>}
                {low&&!critical&&<span style={{fontSize:10,fontWeight:800,color:'#92400E',background:'var(--amber-100)',padding:'3px 8px',borderRadius:100}}>LOW</span>}
              </div>

              {editing[g]?(
                <div>
                  <input type="number" value={draft[g]} onChange={e=>setDraft(p=>({...p,[g]:e.target.value}))}
                    style={{width:'100%',padding:'8px 12px',border:'1.5px solid var(--p)',borderRadius:'var(--r-sm)',fontSize:22,fontWeight:800,fontFamily:'var(--font-disp)',color:'var(--p)',marginBottom:10,outline:'none'}}/>
                  <div style={{display:'flex',gap:6}}>
                    <button className="btn-primary" style={{flex:1,padding:'7px',fontSize:12,justifyContent:'center'}} onClick={()=>saveEdit(g)}><Save size={12}/>Save</button>
                    <button className="btn-secondary" style={{padding:'7px 10px',fontSize:12}} onClick={()=>cancelEdit(g)}>✕</button>
                  </div>
                </div>
              ):(
                <>
                  <div className="inv-units" style={{color:critical?'var(--red-600)':low?'var(--amber-500)':'var(--slate-900)'}}>{u}</div>
                  <div className="inv-label">units available</div>
                  <div className="inv-bar" style={{marginTop:10,marginBottom:12}}>
                    <div className="inv-bar-fill" style={{width:`${pct}%`,background:fillColor}}/>
                  </div>
                  <div style={{display:'flex',gap:5}}>
                    <button onClick={()=>adjust(g,-1)} style={{flex:1,padding:'6px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',background:'#fff',cursor:'pointer',fontSize:16,transition:'all .15s'}}
                      onMouseEnter={e=>e.currentTarget.style.borderColor='var(--red-400)'}
                      onMouseLeave={e=>e.currentTarget.style.borderColor='var(--slate-200)'}>−</button>
                    <button onClick={()=>startEdit(g)} style={{flex:2,padding:'6px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',background:'#fff',cursor:'pointer',fontSize:12,fontWeight:600,color:'var(--slate-700)',transition:'all .15s'}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--p)';e.currentTarget.style.color='var(--p)'}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--slate-200)';e.currentTarget.style.color='var(--slate-700)'}}>Edit</button>
                    <button onClick={()=>adjust(g,1)} style={{flex:1,padding:'6px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',background:'#fff',cursor:'pointer',fontSize:16,transition:'all .15s'}}
                      onMouseEnter={e=>e.currentTarget.style.borderColor='var(--green-500)'}
                      onMouseLeave={e=>e.currentTarget.style.borderColor='var(--slate-200)'}>+</button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary table */}
      <div className="card">
        <div className="card-header"><div className="card-title">Stock Summary Table</div></div>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Blood Group</th><th>Units Available</th><th>Status</th><th>Min. Required</th><th>Shortage</th><th>Last Updated</th></tr></thead>
            <tbody>
              {BG.map(g=>{
                const u=stock[g]||0;const min=50;const shortage=Math.max(0,min-u);
                const critical=u<20;const low=u<50;
                return(
                  <tr key={g}>
                    <td><span className="blood-badge">{g}</span></td>
                    <td><span style={{fontSize:16,fontWeight:800,color:critical?'var(--red-600)':low?'var(--amber-500)':'var(--green-600)',fontFamily:'var(--font-disp)'}}>{u}</span></td>
                    <td>
                      {critical?<span className="status-badge s-rejected">Critical</span>:
                       low?<span className="status-badge s-pending">Low</span>:
                       <span className="status-badge s-approved">Adequate</span>}
                    </td>
                    <td style={{color:'var(--slate-500)'}}>{min} units</td>
                    <td style={{fontWeight:700,color:shortage>0?'var(--red-600)':'var(--green-600)'}}>{shortage>0?`-${shortage}`:'+OK'}</td>
                    <td style={{fontSize:12,color:'var(--slate-400)'}}>Today</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add stock modal */}
      {showAdd&&(
        <div className="modal-overlay" onClick={()=>setShowAdd(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-hdr"><div className="modal-title">Add Blood Stock</div><button className="action-btn" onClick={()=>setShowAdd(false)}>✕</button></div>
            <form onSubmit={handleAdd}>
              <div className="modal-body">
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:16}}>
                  <div className="form-group" style={{margin:0}}><label className="form-label">Blood Group</label><select className="form-input" value={addForm.bloodGroup} onChange={e=>setAddForm(p=>({...p,bloodGroup:e.target.value}))}>{BG.map(g=><option key={g}>{g}</option>)}</select></div>
                  <div className="form-group" style={{margin:0}}><label className="form-label">Units to Add</label><input type="number" className="form-input" placeholder="e.g. 5" min="1" value={addForm.units} onChange={e=>setAddForm(p=>({...p,units:e.target.value}))} required/></div>
                </div>
                <div className="form-group"><label className="form-label">Reason</label>
                  <select className="form-input" value={addForm.reason} onChange={e=>setAddForm(p=>({...p,reason:e.target.value}))}>
                    <option>Donation received</option><option>Transfer from another bank</option><option>Campaign collection</option><option>Correction / Recount</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={()=>setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn-primary"><Plus size={14}/>Add to Inventory</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
