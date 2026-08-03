import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createIcon = (emoji, color, size=36) => L.divIcon({
  html:`<div style="background:${color};width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,.3);border:2px solid #fff;">
    <span style="transform:rotate(45deg);font-size:${size*0.45}px">${emoji}</span>
  </div>`,
  className:'', iconSize:[size,size], iconAnchor:[size/2,size], popupAnchor:[0,-size],
});

const HOSPITAL_ICON = createIcon('🏥','#2563EB',36);
const createDonorIcon = (color) => createIcon('👤', color, 32);

// Same district centroids as the backend (server/routes/emergencyRequests.js)
// — used to move the map pin the instant a hospital is picked, before the
// donor/blood-bank search round-trip even completes.
const DISTRICT_COORDS = {
  Colombo:[6.9271,79.8612], Gampaha:[7.0917,79.9999], Kalutara:[6.5854,79.9607],
  Kandy:[7.2906,80.6337], Matale:[7.4675,80.6234], 'Nuwara Eliya':[6.9497,80.7891],
  Galle:[6.0535,80.2210], Matara:[5.9485,80.5353], Hambantota:[6.1241,81.1185],
  Jaffna:[9.6615,80.0255], Kilinochchi:[9.3961,80.3982], Mannar:[8.9810,79.9044],
  Vavuniya:[8.7514,80.4971], Mullaitivu:[9.2671,80.8142],
  Batticaloa:[7.7170,81.6924], Ampara:[7.2975,81.6747], Trincomalee:[8.5874,81.2152],
  Kurunegala:[7.4818,80.3609], Puttalam:[8.0362,79.8283],
  Anuradhapura:[8.3114,80.4037], Polonnaruwa:[7.9403,81.0188],
  Badulla:[6.9934,81.0550], Monaragala:[6.8714,81.3507],
  Ratnapura:[6.6828,80.3992], Kegalle:[7.2513,80.3464],
};

// react-leaflet's MapContainer only honors `center` on first mount — this
// keeps the view synced whenever the resolved hospital location changes.
function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => { map.setView(center, map.getZoom()); }, [center, map]);
  return null;
}

// ─── Mock donors (used until real DB donors are available) ────────────────
const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const API_BASE = 'http://localhost:5000/api';

export default function EmergencyPage() {
  const [step, setStep]                   = useState(1);
  const [bloodGroup, setBloodGroup]       = useState('O+');
  const [hospitals, setHospitals]         = useState([]);
  const [hospital, setHospital]           = useState('');
  const [units, setUnits]                 = useState(2);
  const [radius, setRadius]               = useState(10);
  const [urgency, setUrgency]             = useState('Emergency');
  const [searching, setSearching]         = useState(false);
  const [donors, setDonors]               = useState([]);
  const [sentRequests, setSentRequests]   = useState({});
  const [confirmed, setConfirmed]         = useState(null);
  const [mapCenter, setMapCenter]         = useState([6.9271, 79.8612]); // Colombo, until a hospital resolves
  const [hospitalCoords, setHospitalCoords] = useState([6.9271, 79.8612]);
  const [isDark, setIsDark]               = useState(document.body.classList.contains('dark-mode'));
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedDonor, setSelectedDonor]       = useState(null);
  const [notification, setNotification]         = useState(null);
  const [currentRequestId, setCurrentRequestId] = useState(null); // DB request ID
  const [sendingIndividual, setSendingIndividual] = useState({}); // loading per donor
  const [apiError, setApiError]           = useState(null);
  const [donorsLoading, setDonorsLoading] = useState(false);
  const [searchMode, setSearchMode]       = useState('donors'); // 'donors' | 'bloodbanks'
  const [bloodBanks, setBloodBanks]       = useState([]);

  useEffect(() => {
    const observer = new MutationObserver(() =>
      setIsDark(document.body.classList.contains('dark-mode'))
    );
    observer.observe(document.body, { attributes:true, attributeFilter:['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/emergency-requests/hospitals`)
      .then(res => res.json())
      .then(data => {
        const list = data.hospitals || [];
        setHospitals(list);
        if (list.length > 0) setHospital(list[0].name);
      })
      .catch(err => console.error('Fetch hospitals error:', err));
  }, []);

  useEffect(() => {
    const selected = hospitals.find(h => h.name === hospital);
    const coords = (selected?.district && DISTRICT_COORDS[selected.district]) || DISTRICT_COORDS['Colombo'];
    setHospitalCoords(coords);
    setMapCenter(coords);
  }, [hospital, hospitals]);

  const showNotif = (msg, type='success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const t = {
    bg:    isDark?'#0F172A':'#F8FAFC',
    card:  isDark?'#1E293B':'#fff',
    border:isDark?'#334155':'#E2E8F0',
    text:  isDark?'#F1F5F9':'#0F172A',
    text2: isDark?'#94A3B8':'#64748B',
    input: isDark?'#0F172A':'#F8FAFC',
  };

  // ── Step 2: Search + Send bulk requests to all nearby donors ─────────────
  const handleSearch = async () => {
    setSearching(true);
    setStep(2);
    setApiError(null);
    setDonors([]);
    setBloodBanks([]);

    const hospitalId = hospitals.find(h => h.name === hospital)?._id || '';

    if (searchMode === 'bloodbanks') {
      // ── Search approved blood banks with matching stock ───────────────────
      let banks = [];
      try {
        const searchRes = await fetch(`${API_BASE}/emergency-requests/search-bloodbanks?bloodGroup=${encodeURIComponent(bloodGroup)}&radius=${radius}&hospitalId=${hospitalId}`);
        const searchData = await searchRes.json();
        banks = searchData.bloodBanks || [];
        if (searchData.hospitalCoords) {
          const c = [searchData.hospitalCoords.lat, searchData.hospitalCoords.lng];
          setHospitalCoords(c);
          setMapCenter(c);
        }
      } catch (err) {
        console.error('Blood bank search error:', err);
        setApiError('Could not search blood banks. Please check your connection.');
        setStep(3);
        setSearching(false);
        return;
      }

      setBloodBanks(banks);

      if (banks.length === 0) {
        setStep(3);
        setSearching(false);
        showNotif(`No blood banks with ${bloodGroup} stock found within ${radius} km`, 'error');
        return;
      }

      const sent = {};
      banks.forEach(b => { sent[b.id] = 'sent'; });
      setSentRequests(sent);
      setStep(3);
      setSearching(false);
      showNotif(`✅ ${banks.length} blood banks found with ${bloodGroup} stock!`, 'success');
      return;
    }

    // ── Step 1: Search real approved donors matching blood group + radius ──
    let filtered = [];
    try {
      const searchRes = await fetch(`${API_BASE}/emergency-requests/search-donors?bloodGroup=${encodeURIComponent(bloodGroup)}&radius=${radius}&hospitalId=${hospitalId}`);
      const searchData = await searchRes.json();
      filtered = searchData.donors || [];
      if (searchData.hospitalCoords) {
        const c = [searchData.hospitalCoords.lat, searchData.hospitalCoords.lng];
        setHospitalCoords(c);
        setMapCenter(c);
      }
    } catch (err) {
      console.error('Donor search error:', err);
      setApiError('Could not search donors. Please check your connection.');
      setStep(3);
      setSearching(false);
      return;
    }

    setDonors(filtered);

    if (filtered.length === 0) {
      setStep(3);
      setSearching(false);
      showNotif(`No ${bloodGroup} donors found within ${radius} km`, 'error');
      return;
    }

    // ── Step 2: Create the emergency request + notify donors ───────────────
    try {
      const res = await fetch(`${API_BASE}/emergency-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bloodGroup,
          hospital,
          units,
          urgency,
          radius,
          donors: filtered,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setCurrentRequestId(data.requestId);
        const sent = {};
        filtered.forEach(d => { sent[d.id] = 'sent'; });
        setSentRequests(sent);
        setStep(3);
        showNotif(
          `✅ ${filtered.length} donors found! Requests sent to all.`,
          'success'
        );
      } else {
        throw new Error(data.message || 'API error');
      }
    } catch (err) {
      console.error('Emergency request API error:', err);
      setApiError(err.message);
      const sent = {};
      filtered.forEach(d => { sent[d.id] = 'sent'; });
      setSentRequests(sent);
      setStep(3);
      showNotif(
        `${filtered.length} donors found (offline mode — DB not saved)`,
        'error'
      );
    } finally {
      setSearching(false);
    }
  };

  // ── Send request to individual donor ─────────────────────────────────────
  const sendRequest = async (donor) => {
    setSendingIndividual(prev => ({ ...prev, [donor.id]: true }));

    if (currentRequestId) {
      try {
        const res = await fetch(
          `${API_BASE}/emergency-requests/${currentRequestId}/send-to-donor`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ donor }),
          }
        );
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
      } catch (err) {
        console.error('Send to donor error:', err);
        // Still update UI even if API fails
      }
    }

    setSentRequests(prev => ({ ...prev, [donor.id]: 'sent' }));
    setSendingIndividual(prev => ({ ...prev, [donor.id]: false }));
    showNotif(`📤 Request sent to ${donor.name}!`, 'success');
  };

  // ── Confirm donor ─────────────────────────────────────────────────────────
  const handleConfirm = (donor) => {
    setSelectedDonor(donor);
    setShowConfirmModal(true);
  };

  const confirmDonor = async () => {
    setShowConfirmModal(false);

    if (currentRequestId) {
      try {
        const res = await fetch(
          `${API_BASE}/emergency-requests/${currentRequestId}/confirm`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ donor: selectedDonor }),
          }
        );
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
      } catch (err) {
        console.error('Confirm donor API error:', err);
        // Still proceed with UI update
      }
    }

    setConfirmed(selectedDonor);
    setSentRequests(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(id => {
        if (parseInt(id) !== selectedDonor.id) updated[id] = 'cancelled';
      });
      updated[selectedDonor.id] = 'confirmed';
      return updated;
    });
    setStep(4);
    showNotif(`✅ ${selectedDonor.name} confirmed as donor!`, 'success');
  };

  const reset = () => {
    setStep(1); setDonors([]); setSentRequests({});
    setConfirmed(null); setSelectedDonor(null);
    setCurrentRequestId(null); setApiError(null);
  };

  const getStatusColor = (status) => {
    if (status==='confirmed') return { bg:'#DCFCE7', color:'#16A34A', text:'Confirmed' };
    if (status==='cancelled') return { bg:'#F1F5F9', color:'#64748B', text:'Cancelled' };
    if (status==='sent')      return { bg:'#FEF3C7', color:'#D97706', text:'Request Sent' };
    return { bg:'#EFF6FF', color:'#2563EB', text:'Available' };
  };

  return (
    <div style={{background:t.bg, minHeight:'100vh', fontFamily:"'Inter',sans-serif", position:'relative'}}>

      {/* NOTIFICATION */}
      {notification && (
        <div style={{
          position:'fixed', top:20, right:20, zIndex:9999,
          background:notification.type==='success'?'#16A34A':'#C41E3A',
          color:'#fff', padding:'12px 20px', borderRadius:10,
          boxShadow:'0 8px 24px rgba(0,0,0,.2)',
          animation:'slideInRight .3s ease',
          display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:600,
        }}>
          {notification.type==='success'?'✅':'⚠️'} {notification.msg}
        </div>
      )}

      {/* API ERROR BANNER */}
      {apiError && step===3 && (
        <div style={{
          background:'rgba(234,179,8,.1)', border:'1px solid rgba(234,179,8,.3)',
          borderRadius:10, padding:'10px 16px', marginBottom:16,
          display:'flex', alignItems:'center', gap:8, fontSize:12, color:'#92400E',
        }}>
          ⚠️ <strong>Offline mode:</strong> Could not connect to server ({apiError}). UI works but data not saved to DB.
        </div>
      )}

      {/* CONFIRM MODAL */}
      {showConfirmModal && selectedDonor && (
        <div style={{position:'fixed',inset:0,zIndex:9998,background:'rgba(0,0,0,.5)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:t.card,borderRadius:20,padding:32,maxWidth:440,width:'90%',boxShadow:'0 24px 64px rgba(0,0,0,.3)'}}>
            <div style={{textAlign:'center',marginBottom:20}}>
              <div style={{fontSize:48,marginBottom:8}}>👤</div>
              <h3 style={{fontSize:20,fontWeight:800,color:t.text,marginBottom:4}}>Confirm Donor?</h3>
              <p style={{fontSize:13,color:t.text2}}>This will cancel all other pending requests</p>
            </div>
            <div style={{background:isDark?'#0F172A':'#F8FAFC',borderRadius:12,padding:16,marginBottom:20}}>
              {[
                {label:'Name',          value:selectedDonor.name},
                {label:'Blood Group',   value:selectedDonor.blood},
                {label:'Phone',         value:selectedDonor.phone},
                {label:'Distance',      value:`${selectedDonor.distance} km`},
                {label:'Last Donation', value:selectedDonor.lastDonation},
              ].map(({label,value})=>(
                <div key={label} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:`1px solid ${t.border}`,fontSize:13}}>
                  <span style={{color:t.text2}}>{label}</span>
                  <span style={{color:t.text,fontWeight:600}}>{value}</span>
                </div>
              ))}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <button onClick={()=>setShowConfirmModal(false)} style={{padding:'12px',background:isDark?'#334155':'#F1F5F9',color:t.text,border:'none',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer'}}>
                Cancel
              </button>
              <button onClick={confirmDonor} style={{padding:'12px',background:'#16A34A',color:'#fff',border:'none',borderRadius:10,fontSize:14,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 12px rgba(22,163,74,.3)'}}>
                ✅ Confirm Donor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div style={{background:'linear-gradient(135deg,#7F0F1E,#C41E3A)',padding:'24px',marginBottom:24,borderRadius:16,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
            <div style={{width:40,height:40,background:'rgba(255,255,255,.2)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>🚨</div>
            <h1 style={{fontSize:22,fontWeight:800,color:'#fff',margin:0}}>Emergency Blood Request</h1>
          </div>
          <p style={{color:'rgba(255,255,255,.7)',fontSize:13,margin:0}}>Find nearest donors, send requests, and confirm blood donation</p>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          {currentRequestId && (
            <div style={{fontSize:11,color:'rgba(255,255,255,.7)',background:'rgba(255,255,255,.15)',padding:'4px 10px',borderRadius:100}}>
              🗄️ ID: {currentRequestId.slice(-6).toUpperCase()}
            </div>
          )}
          {step>1 && (
            <button onClick={reset} style={{padding:'10px 20px',background:'rgba(255,255,255,.2)',color:'#fff',border:'1px solid rgba(255,255,255,.3)',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}}>
              🔄 New Request
            </button>
          )}
        </div>
      </div>

      {/* PROGRESS STEPS */}
      <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:12,padding:'16px 24px',marginBottom:24,display:'flex',alignItems:'center',justifyContent:'center',gap:0}}>
        {[
          {num:1,label:'Create Request', icon:'📝'},
          {num:2,label:'Search Donors',  icon:'🔍'},
          {num:3,label:'Send Requests',  icon:'📤'},
          {num:4,label:'Confirm Donor',  icon:'✅'},
        ].map(({num,label,icon},i)=>(
          <React.Fragment key={num}>
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
              <div style={{
                width:40,height:40,borderRadius:'50%',
                background:step>=num?'#C41E3A':isDark?'#334155':'#F1F5F9',
                color:step>=num?'#fff':t.text2,
                display:'flex',alignItems:'center',justifyContent:'center',
                fontSize:16,fontWeight:800,
                boxShadow:step===num?'0 0 0 4px rgba(196,30,58,.2)':'none',
                transition:'all .3s',
              }}>{step>num?'✓':icon}</div>
              <div style={{fontSize:11,fontWeight:step===num?700:400,color:step>=num?'#C41E3A':t.text2,whiteSpace:'nowrap'}}>{label}</div>
            </div>
            {i<3&&<div style={{width:60,height:2,background:step>i+1?'#C41E3A':isDark?'#334155':'#E2E8F0',margin:'0 4px',marginBottom:20,transition:'all .3s'}}/>}
          </React.Fragment>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'420px 1fr',gap:20}}>

        {/* LEFT */}
        <div style={{display:'flex',flexDirection:'column',gap:16}}>

          {/* STEP 1 — FORM */}
          {step===1&&(
            <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:16,padding:24}}>
              <h3 style={{fontSize:16,fontWeight:700,color:t.text,marginBottom:20,display:'flex',alignItems:'center',gap:6}}>
                📝 Emergency Request Details
              </h3>
              <div style={{marginBottom:14}}>
                <label style={{fontSize:12,fontWeight:600,color:t.text2,display:'block',marginBottom:6}}>🩸 Blood Group Required</label>
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6}}>
                  {BLOOD_GROUPS.map(bg=>(
                    <button key={bg} onClick={()=>setBloodGroup(bg)} style={{
                      padding:'8px',borderRadius:8,border:`2px solid ${bloodGroup===bg?'#C41E3A':t.border}`,
                      background:bloodGroup===bg?'#C41E3A':t.input,
                      color:bloodGroup===bg?'#fff':t.text,
                      fontSize:12,fontWeight:700,cursor:'pointer',transition:'all .15s',
                    }}>{bg}</button>
                  ))}
                </div>
              </div>

              <div style={{marginBottom:14}}>
                <label style={{fontSize:12,fontWeight:600,color:t.text2,display:'block',marginBottom:6}}>🏥 Hospital</label>
                {hospitals.length === 0 ? (
                  <div style={{padding:'10px 12px',borderRadius:8,border:`1px solid ${t.border}`,background:t.input,color:t.text2,fontSize:13}}>
                    No approved hospitals yet
                  </div>
                ) : (
                  <select value={hospital} onChange={e=>setHospital(e.target.value)} style={{width:'100%',padding:'10px 12px',borderRadius:8,border:`1px solid ${t.border}`,background:t.input,color:t.text,fontSize:13,outline:'none'}}>
                    {hospitals.map(h=>(
                      <option key={h._id} value={h.name}>{h.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
                <div>
                  <label style={{fontSize:12,fontWeight:600,color:t.text2,display:'block',marginBottom:6}}>📦 Units Required</label>
                  <input type="number" value={units} onChange={e=>setUnits(e.target.value)} min={1} max={10}
                    style={{width:'100%',padding:'10px 12px',borderRadius:8,border:`1px solid ${t.border}`,background:t.input,color:t.text,fontSize:13,outline:'none',boxSizing:'border-box'}}/>
                </div>
                <div>
                  <label style={{fontSize:12,fontWeight:600,color:t.text2,display:'block',marginBottom:6}}>⚡ Urgency Level</label>
                  <select value={urgency} onChange={e=>setUrgency(e.target.value)} style={{width:'100%',padding:'10px 12px',borderRadius:8,border:`1px solid ${t.border}`,background:t.input,color:t.text,fontSize:13,outline:'none'}}>
                    {['Emergency','Urgent','Normal'].map(u=><option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div style={{marginBottom:20}}>
                <label style={{fontSize:12,fontWeight:600,color:t.text2,display:'block',marginBottom:6}}>
                  📍 Search Radius — <span style={{color:'#C41E3A',fontWeight:800}}>{radius} km</span>
                </label>
                <input type="range" min={1} max={50} value={radius} onChange={e=>setRadius(parseInt(e.target.value))}
                  style={{width:'100%',accentColor:'#C41E3A'}}/>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:t.text2}}>
                  <span>1 km</span><span>25 km</span><span>50 km</span>
                </div>
              </div>

              <div style={{marginBottom:14}}>
                <label style={{fontSize:12,fontWeight:600,color:t.text2,display:'block',marginBottom:6}}>🎯 Search Target</label>
                <div style={{display:'flex',gap:6,background:isDark?'#0F172A':'#F1F5F9',padding:4,borderRadius:10}}>
                  {[
                    {key:'donors',     label:'👤 Donors'},
                    {key:'bloodbanks', label:'🏦 Blood Banks'},
                  ].map(m=>(
                    <button key={m.key} onClick={()=>setSearchMode(m.key)} style={{
                      flex:1,padding:'9px',borderRadius:8,border:'none',cursor:'pointer',
                      fontSize:12,fontWeight:700,
                      background:searchMode===m.key?'#C41E3A':'transparent',
                      color:searchMode===m.key?'#fff':t.text2,
                      transition:'all .15s',
                    }}>{m.label}</button>
                  ))}
                </div>
              </div>

              <button onClick={handleSearch} style={{
                width:'100%',padding:'14px',
                background:'linear-gradient(135deg,#C41E3A,#9B1427)',
                color:'#fff',border:'none',borderRadius:10,
                fontSize:14,fontWeight:700,cursor:'pointer',
                boxShadow:'0 6px 20px rgba(196,30,58,.4)',
                display:'flex',alignItems:'center',justifyContent:'center',gap:8,
              }}>
                🔍 {searchMode==='donors' ? `Search Nearby ${bloodGroup} Donors` : `Search Blood Banks with ${bloodGroup} Stock`}
              </button>
            </div>
          )}

          {/* STEP 2 — SEARCHING */}
          {step===2&&(
            <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:16,padding:48,textAlign:'center'}}>
              <div style={{fontSize:48,marginBottom:16,animation:'spin 1s linear infinite'}}>🔍</div>
              <h3 style={{fontSize:18,fontWeight:700,color:t.text,marginBottom:8}}>Searching & Sending Requests...</h3>
              <p style={{fontSize:13,color:t.text2}}>Finding {bloodGroup} donors within {radius} km</p>
              <p style={{fontSize:12,color:'#C41E3A',marginTop:4}}>Sending notifications to all nearby donors...</p>
              <div style={{display:'flex',justifyContent:'center',gap:6,marginTop:20}}>
                {[0,1,2].map(i=>(
                  <div key={i} style={{width:10,height:10,borderRadius:'50%',background:'#C41E3A',animation:`bounce 1.2s ease infinite`,animationDelay:`${i*0.2}s`}}/>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3 & 4 — RESULTS */}
          {(step===3||step===4)&&(
            <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:16,padding:20}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                <h3 style={{fontSize:15,fontWeight:700,color:t.text,display:'flex',alignItems:'center',gap:6}}>
                  {searchMode==='donors' ? `👥 ${donors.length} Donors Found` : `🏦 ${bloodBanks.length} Blood Banks Found`}
                  <span style={{fontSize:11,padding:'2px 8px',borderRadius:100,background:'rgba(196,30,58,.1)',color:'#C41E3A',fontWeight:600}}>
                    {bloodGroup} • {radius}km
                  </span>
                </h3>
                {confirmed&&(
                  <span style={{fontSize:11,padding:'4px 10px',borderRadius:100,background:'#DCFCE7',color:'#16A34A',fontWeight:700}}>
                    ✅ Confirmed
                  </span>
                )}
              </div>

              {searchMode==='bloodbanks' ? (
                <div style={{display:'flex',flexDirection:'column',gap:10,maxHeight:480,overflowY:'auto'}}>
                  {bloodBanks.map((bank,i)=>{
                    const status = sentRequests[bank.id]||'sent';
                    const isConfirmed = status==='confirmed';
                    return (
                      <div key={bank.id} style={{
                        padding:'14px',borderRadius:12,
                        border:`2px solid ${isConfirmed?'#16A34A':'rgba(196,30,58,.2)'}`,
                        background:isConfirmed?'rgba(22,163,74,.06)':isDark?'rgba(196,30,58,.05)':'rgba(196,30,58,.02)',
                      }}>
                        <div style={{display:'flex',alignItems:'center',gap:12}}>
                          <div style={{
                            width:32,height:32,borderRadius:'50%',flexShrink:0,
                            background:i===0?'linear-gradient(135deg,#F59E0B,#D97706)':'linear-gradient(135deg,#3B82F6,#2563EB)',
                            color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,
                          }}>🏦</div>
                          <div style={{flex:1}}>
                            <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                              <span style={{fontSize:13,fontWeight:700,color:t.text}}>{bank.name}</span>
                              <span style={{fontSize:11,fontWeight:700,padding:'1px 6px',borderRadius:100,background:'rgba(34,197,94,.15)',color:'#16A34A'}}>{bank.unitsAvailable} units</span>
                            </div>
                            <div style={{display:'flex',gap:10,fontSize:11,color:t.text2}}>
                              <span>📍 {bank.distance} km away · {bank.district}</span>
                              <span>📞 {bank.phone}</span>
                            </div>
                          </div>
                          <div style={{display:'flex',flexDirection:'column',gap:6,alignItems:'flex-end'}}>
                            {!isConfirmed && (
                              <div style={{display:'flex',gap:4}}>
                                <a href={`tel:${bank.phone}`} style={{padding:'4px 8px',background:'#2563EB',color:'#fff',borderRadius:6,fontSize:10,fontWeight:700,textDecoration:'none'}}>📞 Call</a>
                                <button onClick={async ()=>{
                                  if (currentRequestId) {
                                    try {
                                      await fetch(`${API_BASE}/emergency-requests/${currentRequestId}/confirm-bloodbank`, {
                                        method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ bloodBank: bank }),
                                      });
                                    } catch(e){ console.error(e); }
                                  }
                                  setConfirmed(bank);
                                  setSentRequests(prev=>({...prev, [bank.id]:'confirmed'}));
                                  setStep(4);
                                  showNotif(`✅ ${bank.name} confirmed for blood supply!`, 'success');
                                }} style={{padding:'4px 8px',background:'#16A34A',color:'#fff',border:'none',borderRadius:6,fontSize:10,fontWeight:700,cursor:'pointer'}}>✅ Confirm</button>
                              </div>
                            )}
                            {isConfirmed && <span style={{fontSize:10,fontWeight:700,color:'#16A34A'}}>✅ Confirmed</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {bloodBanks.length===0&&(
                    <div style={{textAlign:'center',padding:32,color:t.text2}}>
                      <div style={{fontSize:48,marginBottom:8}}>😔</div>
                      <div style={{fontSize:14,fontWeight:600}}>No blood banks with {bloodGroup} stock within {radius} km</div>
                    </div>
                  )}
                </div>
              ) : (
              <div style={{display:'flex',flexDirection:'column',gap:10,maxHeight:480,overflowY:'auto'}}>
                {donors.map((donor,i)=>{
                  const status    = sentRequests[donor.id]||'available';
                  const ss        = getStatusColor(status);
                  const isConfirmed = status==='confirmed';
                  const isCancelled = status==='cancelled';
                  const isSending   = sendingIndividual[donor.id];
                  return (
                    <div key={donor.id} style={{
                      padding:'14px',borderRadius:12,
                      border:`2px solid ${isConfirmed?'#16A34A':isCancelled?t.border:'rgba(196,30,58,.2)'}`,
                      background:isConfirmed?'rgba(22,163,74,.06)':isCancelled?isDark?'rgba(255,255,255,.02)':'rgba(0,0,0,.02)':isDark?'rgba(196,30,58,.05)':'rgba(196,30,58,.02)',
                      opacity:isCancelled?.6:1,
                      transition:'all .2s',
                    }}>
                      <div style={{display:'flex',alignItems:'center',gap:12}}>
                        {/* Rank badge */}
                        <div style={{
                          width:32,height:32,borderRadius:'50%',flexShrink:0,
                          background:i===0?'linear-gradient(135deg,#F59E0B,#D97706)':i===1?'linear-gradient(135deg,#94A3B8,#64748B)':i===2?'linear-gradient(135deg,#C41E3A,#9B1427)':'linear-gradient(135deg,#3B82F6,#2563EB)',
                          color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',
                          fontSize:12,fontWeight:800,
                        }}>
                          {i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}
                        </div>

                        <div style={{flex:1}}>
                          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                            <span style={{fontSize:13,fontWeight:700,color:t.text}}>{donor.name}</span>
                            <span style={{fontSize:11,fontWeight:700,padding:'1px 6px',borderRadius:100,background:'rgba(196,30,58,.1)',color:'#C41E3A'}}>{donor.blood}</span>
                            {donor.verified
                              ? <span style={{fontSize:10,fontWeight:700,padding:'1px 6px',borderRadius:100,background:'rgba(34,197,94,.12)',color:'#16A34A'}}>✓ Verified</span>
                              : <span style={{fontSize:10,fontWeight:700,padding:'1px 6px',borderRadius:100,background:'rgba(245,158,11,.12)',color:'#D97706'}}>Unverified</span>}
                          </div>
                          <div style={{display:'flex',gap:10,fontSize:11,color:t.text2}}>
                            <span>📍 {donor.distance} km away</span>
                            <span>📞 {donor.phone}</span>
                          </div>
                          <div style={{fontSize:10,color:t.text2,marginTop:2}}>Last donation: {donor.lastDonation}</div>
                        </div>

                        <div style={{display:'flex',flexDirection:'column',gap:6,alignItems:'flex-end'}}>
                          <span style={{fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:100,background:ss.bg,color:ss.color,whiteSpace:'nowrap'}}>
                            {ss.text}
                          </span>

                          {!isCancelled&&!isConfirmed&&step===3&&(
                            <div style={{display:'flex',gap:4}}>
                              {/* Re-send request button */}
                              <button
                                onClick={()=>sendRequest(donor)}
                                disabled={isSending}
                                style={{
                                  padding:'4px 8px',
                                  background:isSending?'#94A3B8':'#F59E0B',
                                  color:'#fff',border:'none',borderRadius:6,
                                  fontSize:10,fontWeight:700,cursor:isSending?'not-allowed':'pointer',
                                  display:'flex',alignItems:'center',gap:3,
                                }}>
                                {isSending?'⏳':'📤'} {isSending?'Sending...':'Resend'}
                              </button>
                              <a href={`tel:${donor.phone}`} style={{padding:'4px 8px',background:'#2563EB',color:'#fff',borderRadius:6,fontSize:10,fontWeight:700,textDecoration:'none'}}>
                                📞 Call
                              </a>
                              <button onClick={()=>handleConfirm(donor)} style={{padding:'4px 8px',background:'#16A34A',color:'#fff',border:'none',borderRadius:6,fontSize:10,fontWeight:700,cursor:'pointer'}}>
                                ✅ Confirm
                              </button>
                            </div>
                          )}
                          {isConfirmed&&(
                            <a href={`tel:${donor.phone}`} style={{padding:'4px 10px',background:'#16A34A',color:'#fff',borderRadius:6,fontSize:11,fontWeight:700,textDecoration:'none',display:'flex',alignItems:'center',gap:4}}>
                              📞 Call Now
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {donors.length===0&&(
                  <div style={{textAlign:'center',padding:32,color:t.text2}}>
                    <div style={{fontSize:48,marginBottom:8}}>😔</div>
                    <div style={{fontSize:14,fontWeight:600}}>No {bloodGroup} donors found within {radius} km</div>
                    <button onClick={()=>{setRadius(r=>Math.min(r+10,50));}} style={{marginTop:12,padding:'8px 16px',background:'#C41E3A',color:'#fff',border:'none',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer'}}>
                      Expand to {Math.min(radius+10,50)} km & Search Again
                    </button>
                  </div>
                )}
              </div>
              )}
            </div>
          )}

          {/* STEP 4 — CONFIRMED */}
          {step===4&&confirmed&&(
            <div style={{background:'rgba(22,163,74,.08)',border:'2px solid #16A34A',borderRadius:16,padding:20,textAlign:'center'}}>
              <div style={{fontSize:48,marginBottom:8}}>🎉</div>
              <h3 style={{fontSize:16,fontWeight:800,color:'#16A34A',marginBottom:4}}>Donor Confirmed!</h3>
              <p style={{fontSize:13,color:t.text2,marginBottom:4}}>{confirmed.name} will donate {bloodGroup} blood</p>
              {currentRequestId&&(
                <p style={{fontSize:11,color:t.text2,marginBottom:12}}>
                  Request saved: <strong>#{currentRequestId.slice(-6).toUpperCase()}</strong>
                </p>
              )}
              <div style={{display:'flex',gap:8,justifyContent:'center'}}>
                <a href={`tel:${confirmed.phone}`} style={{padding:'10px 20px',background:'#16A34A',color:'#fff',borderRadius:8,fontSize:13,fontWeight:700,textDecoration:'none'}}>
                  📞 Call {confirmed.name}
                </a>
                <button onClick={reset} style={{padding:'10px 20px',background:isDark?'#334155':'#F1F5F9',color:t.text,border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}}>
                  🔄 New Request
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — MAP */}
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:16,overflow:'hidden'}}>
            <div style={{padding:'12px 16px',borderBottom:`1px solid ${t.border}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{fontSize:14,fontWeight:700,color:t.text,display:'flex',alignItems:'center',gap:6}}>
                🗺️ Donor Map
                {step>=3&&<span style={{fontSize:11,padding:'2px 8px',borderRadius:100,background:'rgba(196,30,58,.1)',color:'#C41E3A'}}>{donors.length} donors in {radius}km</span>}
              </div>
              <div style={{display:'flex',alignItems:'center',gap:4}}>
                <div style={{width:6,height:6,borderRadius:'50%',background:'#4ADE80',animation:'pulse 2s infinite'}}/>
                <span style={{fontSize:10,color:'#4ADE80',fontWeight:700}}>LIVE</span>
              </div>
            </div>

            <div style={{height:520,position:'relative'}}>
              <MapContainer center={mapCenter} zoom={12} style={{height:'100%',width:'100%'}}>
                <TileLayer
                  url={isDark
                    ?'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png'
                    :'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
                  attribution='&copy; OpenStreetMap'
                />
                <RecenterMap center={mapCenter} />
                <Marker position={hospitalCoords} icon={HOSPITAL_ICON}>
                  <Popup>
                    <div style={{fontFamily:"'Inter',sans-serif"}}>
                      <div style={{fontWeight:700,color:'#0F172A'}}>{hospital}</div>
                      <div style={{fontSize:11,color:'#64748B'}}>🩸 Needs {units} units of {bloodGroup}</div>
                      <span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:100,background:'#FEE2E8',color:'#C41E3A'}}>{urgency}</span>
                    </div>
                  </Popup>
                </Marker>

                {step>=2&&(
                  <Circle center={hospitalCoords} radius={radius*1000}
                    pathOptions={{color:'#C41E3A',fillColor:'#C41E3A',fillOpacity:0.06,weight:2,dashArray:'8,6'}}/>
                )}

                {(step===3||step===4)&&donors.map(donor=>{
                  const status = sentRequests[donor.id]||'available';
                  const color  = status==='confirmed'?'#16A34A':status==='cancelled'?'#94A3B8':'#C41E3A';
                  return (
                    <Marker key={donor.id} position={[donor.lat,donor.lng]}
                      icon={createDonorIcon(color)}>
                      <Popup>
                        <div style={{fontFamily:"'Inter',sans-serif",minWidth:160}}>
                          <div style={{fontWeight:700,fontSize:13,marginBottom:4}}>{donor.name}</div>
                          <div style={{fontSize:11,color:'#64748B',marginBottom:2}}>🩸 {donor.blood}</div>
                          <div style={{fontSize:11,color:'#64748B',marginBottom:2}}>📍 {donor.distance} km away</div>
                          <div style={{fontSize:11,color:'#64748B',marginBottom:6}}>📞 {donor.phone}</div>
                          <div style={{display:'flex',gap:4}}>
                            {status!=='confirmed'&&status!=='cancelled'&&(
                              <>
                                <button onClick={()=>sendRequest(donor)} style={{padding:'4px 8px',background:'#F59E0B',color:'#fff',border:'none',borderRadius:6,fontSize:10,fontWeight:700,cursor:'pointer'}}>
                                  📤 Resend
                                </button>
                                <button onClick={()=>handleConfirm(donor)} style={{padding:'4px 10px',background:'#16A34A',color:'#fff',border:'none',borderRadius:6,fontSize:10,fontWeight:700,cursor:'pointer'}}>
                                  ✅ Confirm
                                </button>
                              </>
                            )}
                            {status==='confirmed'&&<span style={{fontSize:10,fontWeight:700,color:'#16A34A'}}>✅ Confirmed!</span>}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>

              {/* Legend */}
              <div style={{position:'absolute',bottom:12,left:12,zIndex:1000,background:isDark?'rgba(15,23,42,.92)':'rgba(255,255,255,.96)',borderRadius:8,padding:'8px 12px',boxShadow:'0 4px 12px rgba(0,0,0,.1)'}}>
                <div style={{fontSize:9,fontWeight:700,color:t.text2,marginBottom:4,textTransform:'uppercase',letterSpacing:1}}>Legend</div>
                {[
                  {icon:'🏥',color:'#2563EB',label:'Hospital'},
                  {icon:'👤',color:'#C41E3A',label:'Request Sent'},
                  {icon:'👤',color:'#16A34A',label:'Confirmed Donor'},
                  {icon:'👤',color:'#94A3B8',label:'Cancelled'},
                ].map(({icon,color,label})=>(
                  <div key={label} style={{display:'flex',alignItems:'center',gap:5,marginBottom:2}}>
                    <span style={{fontSize:10}}>{icon}</span>
                    <div style={{width:6,height:6,borderRadius:'50%',background:color}}/>
                    <span style={{fontSize:10,color:t.text,fontWeight:500}}>{label}</span>
                  </div>
                ))}
                <div style={{display:'flex',alignItems:'center',gap:5,marginTop:4,paddingTop:4,borderTop:`1px solid ${t.border}`}}>
                  <div style={{width:16,height:2,background:'#C41E3A',borderRadius:1}}/>
                  <span style={{fontSize:10,color:t.text2}}>{radius} km radius</span>
                </div>
              </div>
            </div>
          </div>

          {/* STATS */}
          {step>=3&&(
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
              {[
                {label:'Total Found',   value:donors.length,                                                          icon:'👥',color:'#2563EB'},
                {label:'Requests Sent', value:Object.values(sentRequests).filter(s=>s==='sent').length,               icon:'📤',color:'#F59E0B'},
                {label:'Nearest Donor', value:donors[0]?`${donors[0].distance} km`:'—',                              icon:'📍',color:'#C41E3A'},
                {label:'Saved to DB',   value:currentRequestId?'✅ Yes':'⚠️ No',                                      icon:'🗄️',color:currentRequestId?'#16A34A':'#94A3B8'},
              ].map(({label,value,icon,color})=>(
                <div key={label} style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:12,padding:'14px',textAlign:'center'}}>
                  <div style={{fontSize:22,marginBottom:4}}>{icon}</div>
                  <div style={{fontSize:18,fontWeight:800,color,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{value}</div>
                  <div style={{fontSize:11,color:t.text2}}>{label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse{0%,100%{opacity:1;}50%{opacity:.4;}}
        @keyframes bounce{0%,80%,100%{transform:translateY(0);}40%{transform:translateY(-8px);}}
        @keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
        @keyframes slideInRight{from{opacity:0;transform:translateX(20px);}to{opacity:1;transform:translateX(0);}}
        .leaflet-container{font-family:'Inter',sans-serif!important;}
        .leaflet-popup-content-wrapper{border-radius:12px!important;}
      `}</style>
    </div>
  );
}