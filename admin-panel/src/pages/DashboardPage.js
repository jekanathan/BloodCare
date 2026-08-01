import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, LineChart, Line, Legend } from 'recharts';
import { Users, Building2, Droplets, Package, AlertTriangle, CheckCircle, ChevronRight, Star } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createIcon = (emoji, color) => L.divIcon({
  html:`<div style="background:${color};width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,.3);border:2px solid #fff;">
    <span style="transform:rotate(45deg);font-size:14px">${emoji}</span>
  </div>`,
  className:'', iconSize:[32,32], iconAnchor:[16,32], popupAnchor:[0,-32],
});

const MAP_ICONS = {
  bloodbank: createIcon('🏦','#C41E3A'),
  hospital:  createIcon('🏥','#2563EB'),
  donor:     createIcon('👤','#16A34A'),
  vehicle:   createIcon('🚑','#F59E0B'),
};

const EMPTY_STATE = {
  stats: {
    totalDonors:0, pendingDonors:0,
    totalHospitals:0, pendingHospitals:0,
    totalBloodBanks:0, pendingBloodBanks:0,
    totalRequests:0, pendingRequests:0, fulfilledRequests:0,
    activeCampaigns:0, totalUnits:0, pendingApprovalsTotal:0,
    donationsToday:0, donationsYesterday:0,
    requestsToday:0, requestsYesterday:0,
    donationsThisMonth:0, requestUnitsThisMonth:0,
  },
  inventory:[
    {_id:'A+',totalUnits:0},{_id:'A-',totalUnits:0},{_id:'B+',totalUnits:0},{_id:'B-',totalUnits:0},
    {_id:'AB+',totalUnits:0},{_id:'AB-',totalUnits:0},{_id:'O+',totalUnits:0},{_id:'O-',totalUnits:0},
  ],
  bloodGroupPie:[
    {name:'A+',value:0},{name:'A-',value:0},{name:'B+',value:0},{name:'B-',value:0},
    {name:'AB+',value:0},{name:'AB-',value:0},{name:'O+',value:0},{name:'O-',value:0},
  ],
  recentRequests:[],
  topDonors:[],
  chartData:[],
  provinceData:[],
  districtData:[],
};

const PIE_COLORS = { 'O+':'#C41E3A','A+':'#E85D75','B+':'#F59E0B','AB+':'#3B82F6','O-':'#8B5CF6','A-':'#94A3B8','B-':'#14B8A6','AB-':'#F97316' };

// Generates whole-number Y-axis ticks from 0 up to at least 5 (or higher,
// in steps, if the data actually exceeds 5) — avoids recharts' "nice number"
// auto-skip logic, which can silently drop values like 3 or 4.
const integerTicks = (maxValue) => {
  const max = Math.max(5, maxValue || 0);
  const step = max <= 10 ? 1 : Math.ceil(max / 8);
  const ticks = [];
  for (let v = 0; v <= max; v += step) ticks.push(v);
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step);
  return ticks;
};

// Converts an ISO timestamp into a relative "time ago" string (e.g. "5 mins ago").
const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const FOOTER_LINKS = [
  {title:'Quick Links', links:[
    {label:'Dashboard',    path:'/dashboard'},
    {label:'Donors',       path:'/dashboard/donors'},
    {label:'Hospitals',    path:'/dashboard/hospitals'},
    {label:'Blood Banks',  path:'/dashboard/blood-banks'},
    {label:'Campaigns',    path:'/dashboard/campaigns'},
  ]},
  {title:'Management', links:[
    {label:'Blood Requests',  path:'/dashboard/blood-requests'},
    {label:'Staff',           path:'/dashboard/staff'},
    {label:'Notifications',   path:'/dashboard/notifications'},
    {label:'System Settings', path:'/dashboard/settings'},
    {label:'Audit Logs',      path:'/dashboard/security'},
  ]},
  {title:'Support', links:[
    {label:'Help Center',        path:'/dashboard/feedback'},
    {label:'Contact Us',         path:'/dashboard/feedback'},
    {label:'Privacy Policy',     path:'/'},
    {label:'Terms & Conditions', path:'/'},
    {label:'FAQ',                path:'/dashboard/feedback'},
  ]},
];

export default function DashboardPage() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [data, setData]       = useState(EMPTY_STATE);
  const [mapLocations, setMapLocations] = useState([]);
  const [forecastData, setForecastData] = useState({ forecast: [], bloodGroupSummary: [], dataQuality: 'estimated' });
  const [activityLog, setActivityLog] = useState([]);
  const [mapFilter, setMapFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const [isDark, setIsDark] = useState(document.body.classList.contains('dark-mode'));
  useEffect(() => {
    const observer = new MutationObserver(() =>
      setIsDark(document.body.classList.contains('dark-mode'))
    );
    observer.observe(document.body, {attributes:true, attributeFilter:['class','style']});
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/dashboard/stats').catch(() => ({ data: EMPTY_STATE })),
      api.get('/dashboard/map-locations').catch(() => ({ data: { locations: [] } })),
      api.get('/dashboard/blood-forecast').catch(() => ({ data: { forecast: [], bloodGroupSummary: [], dataQuality: 'estimated' } })),
      api.get('/dashboard/activity-log').catch(() => ({ data: { activities: [] } })),
    ]).then(([statsRes, mapRes, forecastRes, activityRes]) => {
      setData({ ...EMPTY_STATE, ...statsRes.data });
      setMapLocations(mapRes.data?.locations || []);
      setForecastData(forecastRes.data || { forecast: [], bloodGroupSummary: [], dataQuality: 'estimated' });
      setActivityLog(activityRes.data?.activities || []);
    }).finally(() => setLoading(false));
  }, []);

  const { stats, inventory, recentRequests, topDonors, chartData, provinceData, districtData, bloodGroupPie } = data;
  const maxInv      = Math.max(1, ...(inventory?.map(i=>i.totalUnits)||[1]));
  const totalUnits  = stats.totalUnits || 0;
  const gaugePercent = Math.min(100,Math.round((totalUnits/50000)*100));
  const hour        = new Date().getHours();
  const greeting    = hour<12?'Good Morning':hour<17?'Good Afternoon':'Good Evening';

  const footerBg = isDark?'#020617':'#0F172A';

  const filteredMap = mapFilter==='all'
    ? mapLocations
    : mapLocations.filter(l=>l.type===mapFilter);

  const getStatusStyle = (status) => {
    if (status==='Urgent'||status==='Critical') return {bg:'#FEE2E8',color:'#C41E3A'};
    if (status==='Moving'||status==='Traveling'||status==='Active') return {bg:'#DCFCE7',color:'#16A34A'};
    return {bg:'#F1F5F9',color:'#64748B'};
  };

  const pct = (curr, prev) => {
    if (!prev) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };
  const donationsTrend = pct(stats.donationsToday, stats.donationsYesterday);
  const requestsTrend  = pct(stats.requestsToday, stats.requestsYesterday);

  const bloodGroupPieColored = (bloodGroupPie || []).map(b => ({ ...b, fill: PIE_COLORS[b.name] || '#94A3B8' }));

  return (
    <div className="animate-fade">

      {/* WELCOME BANNER */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:20,marginBottom:24}}>
        <div className="welcome-banner" style={{marginBottom:0}}>
          <div className="welcome-text">
            <div className="welcome-greeting">{greeting}, 👋</div>
            <div className="welcome-name">{user?.name||'Administrator'}</div>
            <div className="welcome-sub">Manage Sri Lanka's National Blood Donation Ecosystem</div>
            <div className="welcome-actions">
              <button className="btn-white" onClick={()=>navigate('/dashboard/blood-requests')}>Go to Dashboard</button>
              <button className="btn-outline-white" onClick={()=>navigate('/dashboard/reports')}>View Reports</button>
            </div>
          </div>
          <div className="welcome-icon">🏥</div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">System Overview</div>
            <span style={{fontSize:11,color:'var(--slate-500)'}}>Today's Summary</span>
          </div>
          <div className="card-body" style={{padding:'16px 22px'}}>
            {[
              {label:'Total Donations Today',value:stats.donationsToday, trend:donationsTrend},
              {label:'Total Requests Today', value:stats.requestsToday,  trend:requestsTrend},
            ].map(({label,value,trend})=>{
              const up = trend >= 0;
              return (
              <div key={label} style={{marginBottom:20,paddingBottom:20,borderBottom:'1px solid var(--slate-100)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <div>
                    <div style={{fontSize:12,color:'var(--slate-500)',marginBottom:4}}>{label}</div>
                    <div style={{fontSize:26,fontWeight:800,fontFamily:'var(--font-display)',color:'var(--slate-900)',lineHeight:1}}>{value.toLocaleString()}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:12,fontWeight:700,color:up?'var(--green-600)':'var(--red-600)',marginBottom:4}}>{up?'▲':'▼'} {Math.abs(trend)}%</div>
                    <div style={{fontSize:10,color:'var(--slate-400)',marginBottom:4}}>vs yesterday</div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="stats-grid">
        <StatCard icon={<Users size={20}/>}         cls="red"    value={stats.totalDonors}     label="Total Donors"       trend={`${stats.pendingDonors} pending`} badgeCls="badge-success" badge={null} onClick={()=>navigate('/dashboard/donors')}/>
        <StatCard icon={<Package size={20}/>}       cls="blue"   value={totalUnits}             label="Blood Units"        trend="across all blood banks" onClick={()=>navigate('/dashboard/inventory')}/>
        <StatCard icon={<Building2 size={20}/>}     cls="green"  value={stats.totalHospitals}  label="Hospitals"          trend={`${stats.pendingHospitals} pending`} onClick={()=>navigate('/dashboard/hospitals')}/>
        <StatCard icon={<Droplets size={20}/>}      cls="purple" value={stats.totalBloodBanks} label="Blood Banks"        trend={`${stats.pendingBloodBanks} pending`} onClick={()=>navigate('/dashboard/blood-banks')}/>
        <StatCard icon={<AlertTriangle size={20}/>} cls="amber"  value={stats.pendingRequests} label="Pending Requests"   trend={`${stats.totalRequests} total`} onClick={()=>navigate('/dashboard/blood-requests')}/>
        <StatCard icon={<CheckCircle size={20}/>}   cls="teal"   value={stats.pendingApprovalsTotal} label="Pending Approvals" trend="awaiting review" onClick={()=>navigate('/dashboard/pending-approvals')}/>
      </div>

      {/* ANALYTICS */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:20,marginBottom:20}}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Donor Registrations (12 months)</div>
          </div>
          <div className="card-body" style={{paddingBottom:12}}>
            <div style={{fontSize:24,fontWeight:800,fontFamily:'var(--font-display)',marginBottom:4}}>
              {stats.donationsThisMonth} <span style={{fontSize:12,color:'var(--slate-500)'}}>this month</span>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={chartData} margin={{top:5,right:15,left:0,bottom:0}}>
                <defs><linearGradient id="dG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C41E3A" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#C41E3A" stopOpacity={0}/>
                </linearGradient></defs>
                <XAxis dataKey="month" tick={{fontSize:10,fill:'#94A3B8'}} axisLine={false} tickLine={false} interval={0} padding={{left:10,right:10}}/>
                <Tooltip contentStyle={{background:'#0F172A',border:'none',borderRadius:8,color:'#fff',fontSize:11}}/>
                <Area type="monotone" dataKey="donors" stroke="#C41E3A" strokeWidth={2} fill="url(#dG)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Blood Requests (12 months)</div>
          </div>
          <div className="card-body" style={{paddingBottom:12}}>
            <div style={{fontSize:24,fontWeight:800,fontFamily:'var(--font-display)',marginBottom:4}}>
              {stats.requestUnitsThisMonth} <span style={{fontSize:12,color:'var(--slate-500)'}}>units this month</span>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={chartData} margin={{top:5,right:15,left:0,bottom:0}}>
                <defs><linearGradient id="rG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                </linearGradient></defs>
                <XAxis dataKey="month" tick={{fontSize:10,fill:'#94A3B8'}} axisLine={false} tickLine={false} interval={0} padding={{left:10,right:10}}/>
                <Tooltip contentStyle={{background:'#0F172A',border:'none',borderRadius:8,color:'#fff',fontSize:11}}/>
                <Area type="monotone" dataKey="requests" stroke="#F59E0B" strokeWidth={2} fill="url(#rG)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title">Blood Group Distribution</div></div>
          <div className="card-body" style={{padding:'12px 16px'}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <ResponsiveContainer width={110} height={110}>
                <PieChart>
                  <Pie data={bloodGroupPieColored} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" stroke="none">
                    {bloodGroupPieColored.map((entry,i)=><Cell key={i} fill={entry.fill}/>)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{flex:1}}>
                {bloodGroupPieColored.map(({name,value,fill})=>(
                  <div key={name} style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <div style={{width:8,height:8,borderRadius:'50%',background:fill,flexShrink:0}}/>
                      <span style={{fontSize:12,color:'var(--slate-700)'}}>{name}</span>
                    </div>
                    <span style={{fontSize:12,fontWeight:700,color:'var(--slate-900)'}}>{value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PROVINCE + DISTRICT */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:20,marginBottom:20}}>
        <div className="card">
          <div className="card-header"><div className="card-title">Province Wise Donor Distribution</div></div>
          <div className="card-body" style={{paddingBottom:12}}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={provinceData} margin={{top:5,right:5,left:-20,bottom:40}}>
                <XAxis dataKey="province" tick={{fontSize:8,fill:'#94A3B8'}} axisLine={false} tickLine={false} angle={-35} textAnchor="end" interval={0}/>
                <YAxis tick={{fontSize:9,fill:'#94A3B8'}} axisLine={false} tickLine={false} allowDecimals={false} domain={[0,'dataMax']} ticks={integerTicks(Math.max(...provinceData.map(d=>d.donations),...districtData.map(d=>d.donations),1))}/>
                <Tooltip contentStyle={{background:'#0F172A',border:'none',borderRadius:8,color:'#fff',fontSize:11}}/>
                <Bar dataKey="donations" radius={[4,4,0,0]}>{(provinceData||[]).map((e,i)=><Cell key={i} fill={e.fill}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">District Wise Donor Distribution (25 Districts)</div></div>
          <div className="card-body" style={{paddingBottom:12}}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={districtData} margin={{top:5,right:5,left:-20,bottom:50}}>
                <XAxis dataKey="district" tick={{fontSize:7,fill:'#94A3B8'}} axisLine={false} tickLine={false} angle={-45} textAnchor="end" interval={0}/>
                <YAxis tick={{fontSize:9,fill:'#94A3B8'}} axisLine={false} tickLine={false} allowDecimals={false} domain={[0,'dataMax']} ticks={integerTicks(Math.max(...provinceData.map(d=>d.donations),...districtData.map(d=>d.donations),1))}/>
                <Tooltip contentStyle={{background:'#0F172A',border:'none',borderRadius:8,color:'#fff',fontSize:11}}/>
                <Bar dataKey="donations" radius={[3,3,0,0]}>{(districtData||[]).map((e,i)=><Cell key={i} fill={e.fill}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* GAUGE + HOSPITAL */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
        <div className="card">
          <div className="card-header"><div className="card-title">Blood Stock Status</div></div>
          <div className="card-body" style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'16px'}}>
            <div style={{position:'relative',width:180,height:110,marginBottom:12}}>
              <svg viewBox="0 0 180 110" width="180" height="110">
                <defs><linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22C55E"/>
                  <stop offset="50%" stopColor="#F59E0B"/>
                  <stop offset="100%" stopColor="#C41E3A"/>
                </linearGradient></defs>
                <path d="M 20 100 A 80 80 0 0 1 160 100" fill="none" stroke="#E2E8F0" strokeWidth="16" strokeLinecap="round"/>
                <path d="M 20 100 A 80 80 0 0 1 160 100" fill="none" stroke="url(#gaugeGrad)" strokeWidth="16" strokeLinecap="round" strokeDasharray={`${gaugePercent*2.51} 251`}/>
              </svg>
              <div style={{position:'absolute',bottom:0,left:'50%',transform:'translateX(-50%)',textAlign:'center'}}>
                <div style={{fontSize:26,fontWeight:800,fontFamily:'var(--font-display)',color:'var(--slate-900)'}}>{totalUnits.toLocaleString()}</div>
                <div style={{fontSize:11,color:'var(--slate-500)'}}>Total Units</div>
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',width:'100%',fontSize:11,color:'var(--slate-500)',padding:'0 10px'}}>
              <span>0</span><span>25K</span><span>50K</span>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Hospital Activity</div>
          </div>
          <div className="card-body" style={{paddingBottom:12}}>
            <div style={{fontSize:24,fontWeight:800,fontFamily:'var(--font-display)',marginBottom:4}}>
              {stats.totalHospitals} <span style={{fontSize:12,color:'var(--slate-500)'}}>active hospitals</span>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={chartData} margin={{top:5,right:15,left:0,bottom:0}}>
                <defs><linearGradient id="hG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22C55E" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                </linearGradient></defs>
                <XAxis dataKey="month" tick={{fontSize:10,fill:'#94A3B8'}} axisLine={false} tickLine={false} interval={0} padding={{left:10,right:10}}/>
                <Tooltip contentStyle={{background:'#0F172A',border:'none',borderRadius:8,color:'#fff',fontSize:11}}/>
                <Area type="monotone" dataKey="requests" stroke="#22C55E" strokeWidth={2} fill="url(#hG)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* BLOOD DEMAND VS SUPPLY FORECAST (2026-2035) */}
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:20,marginBottom:20}}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">🔮 Blood Demand vs Supply Forecast (2026–2035)</div>
            <span style={{fontSize:11,color:'var(--slate-400)'}}>
              {forecastData.dataQuality === 'historical' ? 'Based on historical trend' : 'Estimated — limited history available'}
            </span>
          </div>
          <div className="card-body" style={{paddingBottom:12}}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={forecastData.forecast} margin={{top:5,right:15,left:0,bottom:0}}>
                <XAxis dataKey="year" tick={{fontSize:10,fill:'#94A3B8'}} axisLine={false} tickLine={false} interval={0}/>
                <YAxis tick={{fontSize:9,fill:'#94A3B8'}} axisLine={false} tickLine={false} allowDecimals={false}/>
                <Tooltip contentStyle={{background:'#0F172A',border:'none',borderRadius:8,color:'#fff',fontSize:11}}/>
                <Legend wrapperStyle={{fontSize:11}}/>
                <Line type="monotone" dataKey="demand" name="Blood Needed (Demand)" stroke="#C41E3A" strokeWidth={2.5} dot={{r:3}}/>
                <Line type="monotone" dataKey="supply" name="Blood Available (Supply)" stroke="#22C55E" strokeWidth={2.5} dot={{r:3}}/>
              </LineChart>
            </ResponsiveContainer>
            <div style={{fontSize:11,color:'var(--slate-400)',marginTop:8,lineHeight:1.5}}>
              Projection uses an annual growth rate of {forecastData.growthRatePercent ?? 5}% derived from request history.
              As more real data accumulates, this forecast becomes more accurate.
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">🩸 Blood Group: Demand vs Supply</div>
          </div>
          <div className="card-body" style={{padding:'14px 18px'}}>
            {(forecastData.bloodGroupSummary || []).map(({group, demand, supply, gap}) => {
              const isShortage = gap > 0;
              const total = demand + supply;
              const demandPct = total > 0 ? Math.round((demand / total) * 100) : 50;
              return (
                <div key={group} style={{marginBottom:14}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                    <span style={{fontSize:13,fontWeight:700,color:'var(--slate-900)'}}>{group}</span>
                    <span style={{fontSize:11,fontWeight:600,color:isShortage?'var(--red-600)':'var(--green-600)'}}>
                      {isShortage ? `Short by ${gap}` : gap < 0 ? `Surplus ${Math.abs(gap)}` : 'Balanced'}
                    </span>
                  </div>
                  <div style={{display:'flex',height:8,borderRadius:4,overflow:'hidden',background:'var(--slate-100)'}}>
                    <div style={{width:`${demandPct}%`,background:'#C41E3A'}}/>
                    <div style={{width:`${100-demandPct}%`,background:'#22C55E'}}/>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'var(--slate-400)',marginTop:2}}>
                    <span>Demand: {demand}</span>
                    <span>Supply: {supply}</span>
                  </div>
                </div>
              );
            })}
            {(!forecastData.bloodGroupSummary || forecastData.bloodGroupSummary.length === 0) && (
              <div className="empty-state"><p>No request/inventory data yet</p></div>
            )}
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="card" style={{marginBottom:20}}>
        <div className="card-header"><div className="card-title">Quick Actions</div></div>
        <div className="card-body" style={{padding:'16px 22px'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(100px, 1fr))',gap:8}}>
            {[
              {label:'Add Donor',        icon:'👤', bg:'#FEE2E8', path:'/dashboard/donors'},
              {label:'Add Hospital',     icon:'🏥', bg:'#DBEAFE', path:'/dashboard/hospitals'},
              {label:'Add Blood Bank',   icon:'🏦', bg:'#EDE9FE', path:'/dashboard/blood-banks'},
              {label:'Manage Inventory', icon:'📦', bg:'#DCFCE7', path:'/dashboard/inventory'},
              {label:'Blood Requests',   icon:'🩸', bg:'#FEF3C7', path:'/dashboard/blood-requests'},
              {label:'Generate Reports', icon:'📊', bg:'#CCFBF1', path:'/dashboard/reports'},
              {label:'Send Notification',icon:'🔔', bg:'#FEE2E8', path:'/dashboard/notifications'},
              {label:'Manage Users',     icon:'⚙️', bg:'#F1F5F9', path:'/dashboard/staff'},
            ].map(({label,icon,bg,path})=>(
              <div key={label} className="quick-action-card" onClick={()=>navigate(path)}>
                <div className="quick-action-icon" style={{background:bg}}>{icon}</div>
                <div className="quick-action-label">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="dashboard-grid" style={{alignItems:'start'}}>
        <div className="dashboard-col">
          <div className="card">
            <div className="card-header">
              <div className="card-title">Recent Blood Requests</div>
              <button onClick={()=>navigate('/dashboard/blood-requests')} className="section-link">View All <ChevronRight size={14}/></button>
            </div>
            <div className="table-container">
              <table>
                <thead><tr>
                  <th>Hospital</th><th>Blood</th><th>Units</th><th>Priority</th><th>Status</th>
                </tr></thead>
                <tbody>
                  {recentRequests?.length === 0 && (
                    <tr><td colSpan={5}><div className="empty-state"><p>No recent requests</p></div></td></tr>
                  )}
                  {recentRequests?.map(req=>(
                    <tr key={req._id} style={{cursor:'pointer'}} onClick={()=>navigate('/dashboard/blood-requests')}>
                      <td><div className="td-name">{req.hospital?.hospitalName || 'Unknown'}</div></td>
                      <td><span className="blood-badge">{req.bloodGroup}</span></td>
                      <td style={{fontWeight:700}}>{req.unitsRequired}</td>
                      <td><span className={`priority-badge priority-${req.priority?.toLowerCase()}`}>{req.priority}</span></td>
                      <td><span className={`status-badge status-${req.status}`}>{req.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Top Blood Donors</div>
              <button onClick={()=>navigate('/dashboard/donors')} className="section-link">View All <ChevronRight size={14}/></button>
            </div>
            <div className="card-body" style={{paddingTop:8,paddingBottom:8}}>
              {(!topDonors || topDonors.length === 0) && (
                <div className="empty-state"><p>No donors yet</p></div>
              )}
              {topDonors?.map((d,i)=>(
                <div key={i} className="donor-rank-item">
                  <div className={`donor-rank-num ${i===0?'rank-1':i===1?'rank-2':i===2?'rank-3':'rank-other'}`}>{i+1}</div>
                  <div className="donor-rank-avatar">{d.name.charAt(0)}</div>
                  <div className="donor-rank-info">
                    <div className="donor-rank-name">{d.name}</div>
                    <div className="donor-rank-meta">{d.blood} · {d.date}</div>
                  </div>
                  <div className="donor-rank-count">{d.donations} donations</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">🕒 Recent Activities</div>
              <button className="section-link" onClick={()=>navigate('/dashboard/notifications')}>View All</button>
            </div>
            <div className="card-body" style={{padding:'8px 22px',maxHeight:240,minHeight:'auto',overflowY:'auto'}}>
              {activityLog.length === 0 && (
                <div style={{textAlign:'center',padding:'24px 0',color:'var(--slate-400)',fontSize:13}}>No activity yet</div>
              )}
              {activityLog.map((a, i) => (
                <div key={i} className="activity-item" style={{cursor:'pointer'}} onClick={()=>navigate(a.path)}>
                  <div className="activity-icon" style={{background:a.bg}}>{a.icon}</div>
                  <div className="activity-text">{a.text}</div>
                  <div className="activity-time">{timeAgo(a.time)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dashboard-col">
          <div className="card">
            <div className="card-header">
              <div className="card-title">⚠️ Low Stock Alerts</div>
              <button className="section-link" onClick={()=>navigate('/dashboard/inventory')}>View All</button>
            </div>
            <div className="card-body" style={{padding:'12px 16px',maxHeight:340,overflowY:'auto'}}>
              {(() => {
                // Industry-standard thresholds: <10 units = Critical, 10-49 = Low, 50+ = Adequate
                const alertGroups = (inventory || [])
                  .map(item => ({
                    ...item,
                    level: item.totalUnits < 10 ? 'critical' : item.totalUnits < 50 ? 'low' : 'ok',
                  }))
                  .filter(item => item.level !== 'ok')
                  .sort((a, b) => a.totalUnits - b.totalUnits);

                if (alertGroups.length === 0) {
                  return (
                    <div style={{display:'flex',alignItems:'center',gap:10,padding:'14px',background:'#F0FDF4',border:'1px solid #DCFCE7',borderRadius:'var(--r-sm)'}}>
                      <span style={{fontSize:18}}>✅</span>
                      <span style={{fontSize:13,color:'#15803D',fontWeight:600}}>All blood groups at adequate stock levels.</span>
                    </div>
                  );
                }

                return alertGroups.map(({_id, totalUnits, level}) => (
                  <div key={_id} style={{
                    display:'flex',alignItems:'center',gap:12,padding:'12px',
                    borderRadius:'var(--r-sm)',marginBottom:10,
                    background: level==='critical' ? '#FFF1F3' : '#FFFBEB',
                    border:`1px solid ${level==='critical' ? '#FEE2E8' : '#FEF3C7'}`,
                    cursor:'pointer',
                  }} onClick={()=>navigate('/dashboard/inventory')}>
                    <div style={{
                      width:36,height:36,borderRadius:'50%',flexShrink:0,
                      background: level==='critical' ? '#FEE2E8' : '#FEF3C7',
                      display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,
                    }}>{level==='critical' ? '🩸' : '⚠️'}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:700,color: level==='critical' ? 'var(--red-700)' : '#92400E',marginBottom:2}}>
                        {_id} {level==='critical' ? 'Critical Shortage' : 'Low Stock'}
                      </div>
                      <div style={{fontSize:12,color:'var(--slate-500)'}}>{totalUnits} units remaining</div>
                    </div>
                    <span style={{fontSize:12,fontWeight:600,color: level==='critical' ? 'var(--red-600)' : '#D97706'}}>View →</span>
                  </div>
                ));
              })()}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Blood Stock by Group</div>
              <button className="section-link" onClick={()=>navigate('/dashboard/inventory')}>View All</button>
            </div>
            <div className="card-body">
              {inventory?.map(item=>{
                const pctW=Math.min(100,Math.round((item.totalUnits/maxInv)*100));
                const level=item.totalUnits<50?'low':item.totalUnits<150?'medium':'high';
                return (
                  <div className="inventory-bar-wrap" key={item._id} style={{cursor:'pointer'}} onClick={()=>navigate('/dashboard/inventory')}>
                    <div className="inventory-bar-header">
                      <span className="inventory-bar-label">{item._id}</span>
                      <span className="inventory-bar-value" style={{color:item.totalUnits<50?'var(--red-600)':'var(--slate-900)'}}>{item.totalUnits}{item.totalUnits<50?' ⚠️':''}</span>
                    </div>
                    <div className="inventory-bar-track">
                      <div className={`inventory-bar-fill ${level}`} style={{width:`${pctW}%`}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>


      {/* ===== FULL WIDTH LEAFLET MAP ===== */}
      <div className="card" style={{marginBottom:20,marginTop:20}}>
        <div className="card-header">
          <div className="card-title">📍 Hospitals & Blood Banks — Sri Lanka</div>
          <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
            {[
              {key:'all',       label:'All'},
              {key:'hospital',  label:'🏥 Hospitals'},
              {key:'bloodbank', label:'🏦 Blood Banks'},
            ].map(f=>(
              <button key={f.key} onClick={()=>setMapFilter(f.key)} style={{
                padding:'5px 14px',borderRadius:20,border:'none',cursor:'pointer',fontSize:12,fontWeight:600,
                background:mapFilter===f.key?'var(--red-600)':'var(--slate-100)',
                color:mapFilter===f.key?'#fff':'var(--slate-600)',
                fontFamily:'var(--font-body)',transition:'all .15s',
              }}>{f.label}</button>
            ))}
            <div style={{display:'flex',alignItems:'center',gap:4,marginLeft:4}}>
              <div style={{width:6,height:6,borderRadius:'50%',background:'#4ADE80',animation:'pulse 2s infinite'}}/>
              <span style={{fontSize:10,color:'#4ADE80',fontWeight:700}}>LIVE</span>
            </div>
            <button onClick={()=>navigate('/dashboard/locations')} className="section-link">Full Map</button>
          </div>
        </div>

        <div style={{position:'relative',height:500,borderRadius:'0 0 var(--r-md) var(--r-md)',overflow:'hidden'}}>
          <MapContainer center={[7.8731,80.7718]} zoom={8} style={{height:'100%',width:'100%'}} zoomControl={true}>
            <TileLayer
              url={isDark
                ? 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png'
                : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
              attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
            />
            {filteredMap.map(loc=>(
              <Marker key={loc.id} position={[loc.lat,loc.lng]}
                icon={MAP_ICONS[loc.type]||MAP_ICONS.hospital}>
                <Popup>
                  <div style={{fontFamily:"'Inter',sans-serif",minWidth:190,padding:4}}>
                    <div style={{fontWeight:700,fontSize:13,marginBottom:6,color:'#0F172A'}}>{loc.name}</div>
                    <div style={{fontSize:11,color:'#64748B',marginBottom:6}}>📞 {loc.phone || '—'}</div>
                    <div style={{display:'flex',gap:6,alignItems:'center'}}>
                      <span style={{
                        padding:'2px 8px',borderRadius:100,fontSize:10,fontWeight:700,
                        background:getStatusStyle(loc.status).bg,
                        color:getStatusStyle(loc.status).color,
                      }}>{loc.status}</span>
                      {loc.phone && (
                        <a href={`tel:${loc.phone}`} style={{padding:'2px 10px',background:'#C41E3A',color:'#fff',borderRadius:100,fontSize:10,fontWeight:700,textDecoration:'none'}}>
                          📞 Call
                        </a>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          <div style={{
            position:'absolute',bottom:16,left:16,zIndex:1000,
            background:isDark?'rgba(15,23,42,.92)':'rgba(255,255,255,.96)',
            borderRadius:10,padding:'10px 14px',
            boxShadow:'0 4px 16px rgba(0,0,0,.1)',
            backdropFilter:'blur(8px)',
          }}>
            <div style={{fontSize:10,fontWeight:700,color:isDark?'#94A3B8':'#64748B',marginBottom:6,textTransform:'uppercase',letterSpacing:1}}>Legend</div>
            {[
              {icon:'🏦',label:'Blood Banks',color:'#C41E3A'},
              {icon:'🏥',label:'Hospitals',  color:'#2563EB'},
            ].map(({icon,label,color})=>(
              <div key={label} style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
                <span style={{fontSize:12}}>{icon}</span>
                <span style={{fontSize:11,color:isDark?'#E2E8F0':'#0F172A',fontWeight:500,flex:1}}>{label}</span>
                <div style={{width:8,height:8,borderRadius:'50%',background:color}}/>
              </div>
            ))}
          </div>

          <div style={{
            position:'absolute',top:16,right:16,zIndex:1000,
            background:isDark?'rgba(15,23,42,.92)':'rgba(255,255,255,.96)',
            borderRadius:10,padding:'12px 16px',
            boxShadow:'0 4px 16px rgba(0,0,0,.1)',
            backdropFilter:'blur(8px)',minWidth:165,
          }}>
            <div style={{fontSize:10,fontWeight:700,color:isDark?'#94A3B8':'#64748B',marginBottom:8,textTransform:'uppercase',letterSpacing:1}}>Sri Lanka Coverage</div>
            {[
              {label:'🏦 Blood Banks', value:stats.totalBloodBanks,  color:'var(--red-600)'},
              {label:'🏥 Hospitals',   value:stats.totalHospitals, color:'var(--blue-600)'},
              {label:'👤 Donors',      value:stats.totalDonors,  color:'var(--green-600)'},
            ].map(({label,value,color})=>(
              <div key={label} style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                <span style={{fontSize:11,color:isDark?'#94A3B8':'var(--slate-600)'}}>{label}</span>
                <span style={{fontSize:14,fontWeight:800,color,fontFamily:'var(--font-display)'}}>{value}</span>
              </div>
            ))}
          </div>

          <div style={{position:'absolute',bottom:16,right:16,zIndex:1000}}>
            <button onClick={()=>navigate('/dashboard/locations')} style={{
              padding:'10px 22px',background:'var(--red-600)',color:'#fff',
              border:'none',borderRadius:'var(--r-sm)',fontSize:13,fontWeight:700,
              cursor:'pointer',display:'flex',alignItems:'center',gap:8,
              boxShadow:'0 4px 16px rgba(196,30,58,.4)',
            }}>
              🗺️ Open Full Map
            </button>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{
        marginTop:24, background:footerBg,
        borderRadius:'var(--r-lg)', padding:'32px',
        color:'rgba(255,255,255,.7)', transition:'background .25s',
      }}>
        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr',gap:32,marginBottom:24}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
              <div style={{width:32,height:32,background:'var(--red-600)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>🩸</div>
              <span style={{fontFamily:'var(--font-display)',fontWeight:800,color:'#fff',fontSize:16}}>BloodCare</span>
            </div>
            <div style={{fontSize:12,lineHeight:1.6,marginBottom:12}}>Sri Lanka's most trusted blood donation and management platform. Connecting donors, hospitals, and saving lives.</div>
            <div style={{display:'flex',gap:8}}>
              {['f','t','in','yt'].map(s=>(
                <div key={s} style={{width:28,height:28,background:'rgba(255,255,255,.1)',borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,cursor:'pointer'}}>{s}</div>
              ))}
            </div>
          </div>
          {FOOTER_LINKS.map(({title,links})=>(
            <div key={title}>
              <div style={{fontWeight:700,color:'#fff',marginBottom:12,fontSize:13}}>{title}</div>
              {links.map(({label,path})=>(
                <div key={label} onClick={()=>navigate(path)}
                  style={{fontSize:12,marginBottom:6,cursor:'pointer',color:'rgba(255,255,255,.7)',transition:'color .15s'}}
                  onMouseEnter={e=>e.currentTarget.style.color='#fff'}
                  onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,.7)'}>
                  {label}
                </div>
              ))}
            </div>
          ))}
          <div>
            <div style={{fontWeight:700,color:'#fff',marginBottom:12,fontSize:13}}>Contact Us</div>
            <div style={{fontSize:12,marginBottom:6}}>📍 123, Health Care Road, Colombo, Sri Lanka</div>
            <div style={{fontSize:12,marginBottom:6}}>📞 +94 11 123 4567</div>
            <div style={{fontSize:12,marginBottom:12}}>✉️ support@bloodcare.lk</div>
            <div style={{background:'var(--red-600)',borderRadius:'var(--r-sm)',padding:'8px 12px',fontSize:12,fontWeight:700,color:'#fff',textAlign:'center'}}>
              🚨 Emergency Hotline<br/><span style={{fontSize:18}}>1919</span>
            </div>
          </div>
        </div>
        <div style={{borderTop:'1px solid rgba(255,255,255,.1)',paddingTop:16,display:'flex',justifyContent:'space-between',fontSize:11,flexWrap:'wrap',gap:8}}>
          <span>© 2026 BloodCare.lk. All Rights Reserved.</span>
          <span>❤️ Powered by BloodCare Team</span>
        </div>
      </div>

      <style>{`
        @keyframes pulse{0%,100%{opacity:1;}50%{opacity:.4;}}
        .leaflet-container{font-family:'Inter',sans-serif!important;z-index:1!important;}
        .leaflet-popup-content-wrapper{border-radius:12px!important;box-shadow:0 8px 24px rgba(0,0,0,.15)!important;}
        @media (max-width: 1024px) {
          .stats-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}

const StatCard = ({icon,cls,value,label,badge,badgeCls,trend,onClick}) => (
  <div className="stat-card animate-fade" onClick={onClick} style={{cursor:onClick?'pointer':'default'}}>
    <div className="stat-card-top">
      <div className={`stat-card-icon ${cls}`}>{icon}</div>
      {badge&&<span className={`stat-card-badge ${badgeCls}`}>{badge}</span>}
    </div>
    <div className="stat-card-value">{typeof value==='number'?value.toLocaleString():value}</div>
    <div className="stat-card-label">{label}</div>
    {trend&&<div className="stat-card-trend" style={{color:'var(--slate-500)',fontWeight:500}}>{trend}</div>}
  </div>
);