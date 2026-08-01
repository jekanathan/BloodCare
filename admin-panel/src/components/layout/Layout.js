import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import {
  LayoutDashboard, Users, Droplets, Building2,
  FileText, Package, Bell, LogOut, Droplet,
  AlertTriangle, BarChart2, Shield, Settings,
  MapPin, UserCog, Siren, Calendar, FileBarChart,
  Star, Clock, User, KeyRound, BarChart, ChevronDown, Camera, Moon, Sun, Phone,
  HeartPulse, Activity
} from 'lucide-react';

const B = '/dashboard'; // base path

const TITLES = {
  [`${B}`]:                      'Dashboard',
  [`${B}/system-health`]:        'System Health',
  [`${B}/today-summary`]:        "Today's Summary",
  [`${B}/pending-approvals`]:    'Pending Approvals',
  [`${B}/donors`]:               'Donor Management',
  [`${B}/hospitals`]:            'Hospital Management',
  [`${B}/blood-banks`]:          'Blood Bank Management',
  [`${B}/blood-requests`]:       'Blood Requests',
  [`${B}/inventory`]:            'Blood Inventory',
  [`${B}/campaigns`]:            'Campaigns',
  [`${B}/emergency`]:            'Emergency Management',
  [`${B}/notifications`]:        'Notifications',
  [`${B}/analytics`]:            'Analytics',
  [`${B}/reports`]:              'Reports',
  [`${B}/feedback`]:             'Feedback',
  [`${B}/locations`]:            'Location Management',
  [`${B}/security`]:             'Security',
  [`${B}/settings`]:             'System Settings',
  [`${B}/staff`]:                'Staff Management',
};

const QUICK_CALLS = [
  {label:'🚨 Emergency Hotline',   number:'1919',       color:'#C41E3A', bg:'#FFF1F3'},
  {label:'🏥 National Hospital',   number:'0112691111', color:'#2563EB', bg:'#EFF6FF'},
  {label:'🏦 National Blood Bank', number:'0112693633', color:'#7C3AED', bg:'#F5F3FF'},
  {label:'🚑 Ambulance Service',   number:'110',        color:'#D97706', bg:'#FFFBEB'},
  {label:'👮 Police Emergency',    number:'119',        color:'#475569', bg:'#F8FAFC'},
  {label:'🔧 IT Support',          number:'0111234567', color:'#16A34A', bg:'#F0FDF4'},
];

function Avatar({ photo, name, size=32, fontSize=13, border='' }) {
  if (photo) return (
    <img src={photo} alt="Profile"
      style={{width:size,height:size,borderRadius:'50%',objectFit:'cover',flexShrink:0,
        border:border||'2px solid rgba(255,255,255,.3)'}}/>
  );
  return (
    <div style={{
      width:size,height:size,borderRadius:'50%',flexShrink:0,
      background:'linear-gradient(135deg,#C41E3A,#7F0F1E)',
      color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',
      fontSize,fontWeight:800,border:border||'none',
    }}>
      {name?.charAt(0).toUpperCase()||'A'}
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();

  const [expanded,     setExpanded]     = useState({[`${B}/donors`]:true});
  const [profileOpen,  setProfileOpen]  = useState(false);
  const [notifOpen,    setNotifOpen]    = useState(false);
  const [callOpen,     setCallOpen]     = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(localStorage.getItem('adminPhoto')||null);
  const [photoSaved,   setPhotoSaved]   = useState(false);

  const [liveStats, setLiveStats] = useState({
    pendingApprovalsTotal: 0,
    totalDonors: 0,
    pendingRequests: 0,
    totalHospitals: 0,
    totalBloodBanks: 0,
  });
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchLiveCounts = () => {
      api.get('/dashboard/stats')
        .then(res => setLiveStats(prev => ({ ...prev, ...res.data?.stats })))
        .catch(() => {});
      api.get('/dashboard/activity-log?limit=5')
        .then(res => setNotifications(res.data?.activities || []))
        .catch(() => {});
    };
    fetchLiveCounts();
    const interval = setInterval(fetchLiveCounts, 60000);
    return () => clearInterval(interval);
  }, []);

  const NAV = [
    {
      section: 'Overview',
      items: [
        { path:`${B}`,                    icon:LayoutDashboard, label:'Dashboard' },
        { path:`${B}/pending-approvals`,  icon:Clock,           label:'Pending Approvals', badge: liveStats.pendingApprovalsTotal > 0 ? String(liveStats.pendingApprovalsTotal) : null },
        { path:`${B}/system-health`,      icon:Activity,        label:'System Health' },
        { path:`${B}/today-summary`,      icon:HeartPulse,      label:"Today's Summary" },
      ]
    },
    {
      section: 'Management',
      items: [
        { path:`${B}/donors`, icon:Users, label:'Donor Management', badge: liveStats.totalDonors > 0 ? String(liveStats.totalDonors) : null,
          sub:[
            {path:`${B}/donors`,               label:'All Donors'},
            {path:`${B}/donors/add`,           label:'Register Donor'},
            {path:`${B}/donors/eligible`,      label:'Eligible Donors'},
            {path:`${B}/donors/deferred`,      label:'Deferred Donors'},
            {path:`${B}/donors/blacklist`,     label:'Blacklisted Donors'},
            {path:`${B}/donors/donation-history`, label:'Donation History'},
            {path:`${B}/donors/medical-screening`,label:'Medical Screening'},
            {path:`${B}/donors/certificates`,  label:'Donor Certificates'},
            {path:`${B}/donors/reports`,       label:'Reports'},
          ]
        },
        { path:`${B}/blood-banks`, icon:Droplets, label:'Blood Bank Management',
          sub:[
            {path:`${B}/blood-banks`,          label:'All Blood Banks'},
            {path:`${B}/blood-banks/add`,      label:'Register Blood Bank'},
            {path:`${B}/blood-banks/branches`, label:'Branch Management'},
            {path:`${B}/blood-banks/staff`,    label:'Blood Bank Staff'},
            {path:`${B}/blood-banks/storage`,  label:'Storage Facilities'},
            {path:`${B}/blood-banks/collection-centers`, label:'Collection Centers'},
            {path:`${B}/blood-banks/equipment`, label:'Equipment Management'},
            {path:`${B}/blood-banks/licenses`, label:'Blood Bank Licenses'},
            {path:`${B}/blood-banks/activity-logs`, label:'Activity Logs'},
          ]
        },
        { path:`${B}/hospitals`, icon:Building2, label:'Hospital Management',
          sub:[
            {path:`${B}/hospitals`,            label:'All Hospitals'},
            {path:`${B}/hospitals/add`,        label:'Register Hospital'},
            {path:`${B}/hospitals/staff`,      label:'Hospital Staff'},
            {path:`${B}/hospitals/departments`,label:'Departments'},
            {path:`${B}/hospitals/blood-requests`, label:'Hospital Blood Requests'},
            {path:`${B}/hospitals/licenses`,   label:'Hospital Licenses'},
            {path:`${B}/hospitals/contacts`,   label:'Contact Persons'},
            {path:`${B}/hospitals/activity-logs`, label:'Activity Logs'},
          ]
        },
        { path:`${B}/staff`, icon:UserCog, label:'Staff Management',
          sub:[
            {path:`${B}/staff`,            label:'All Staff'},
            {path:`${B}/staff/departments`,label:'Departments'},
            {path:`${B}/staff/roles`,      label:'User Roles'},
            {path:`${B}/staff/permissions`,label:'Permissions'},
            {path:`${B}/staff/shifts`,     label:'Shift Management'},
            {path:`${B}/staff/attendance`, label:'Attendance'},
            {path:`${B}/staff/leave`,      label:'Leave Management'},
            {path:`${B}/security/logs`,    label:'Login History'},
          ]
        },
      ]
    },
    {
      section: 'Blood Operations',
      items: [
        { path:`${B}/inventory`, icon:Package, label:'Blood Inventory',
          sub:[
            {path:`${B}/inventory`,            label:'Blood Stock'},
            {path:`${B}/inventory/components`, label:'Blood Components'},
            {path:`${B}/inventory/bags`,       label:'Blood Bags'},
            {path:`${B}/inventory/testing`,    label:'Blood Testing'},
            {path:`${B}/inventory/transfer`,   label:'Stock Transfer'},
            {path:`${B}/inventory/history`,    label:'Stock History'},
            {path:`${B}/inventory/expired`,    label:'Expired Units'},
          ]
        },
        { path:`${B}/blood-requests`, icon:FileText, label:'Blood Requests', badge: liveStats.pendingRequests > 0 ? String(liveStats.pendingRequests) : null,
          sub:[
            {path:`${B}/blood-requests`,               label:'All Requests'},
            {path:`${B}/blood-requests/pending`,       label:'Pending'},
            {path:`${B}/blood-requests/inventory-check`,label:'Inventory Check'},
            {path:`${B}/blood-requests/cross-match`,   label:'Cross Match'},
            {path:`${B}/blood-requests/allocation`,    label:'Blood Allocation'},
            {path:`${B}/blood-requests/ready-for-dispatch`, label:'Ready for Dispatch'},
            {path:`${B}/blood-requests/dispatch`,      label:'Dispatch Tracking'},
            {path:`${B}/blood-requests/delivered`,     label:'Delivered'},
            {path:`${B}/blood-requests/delivered`,     label:'Completed'},
            {path:`${B}/blood-requests/emergency`,     label:'Emergency'},
            {path:`${B}/blood-requests/cancelled`,     label:'Cancelled'},
          ]
        },
        { path:`${B}/emergency`, icon:Siren, label:'Emergency Management',
          sub:[
            {path:`${B}/emergency`,         label:'Emergency Broadcast'},
            {path:`${B}/emergency/search`,  label:'Nearby Donor Search'},
            {path:`${B}/emergency/availability`, label:'Blood Availability'},
            {path:`${B}/emergency/alerts`,  label:'SMS & Email Alerts'},
            {path:`${B}/emergency/contacts`,label:'Emergency Contacts'},
            {path:`${B}/emergency/priority`,label:'Priority Requests'},
          ]
        },
      ]
    },
    {
      section: 'Programs',
      items: [
        { path:`${B}/campaigns`, icon:Calendar, label:'Campaigns',
          sub:[
            {path:`${B}/campaigns`,           label:'All Campaigns'},
            {path:`${B}/campaigns/create`,    label:'Create Campaign'},
            {path:`${B}/campaigns/upcoming`,  label:'Upcoming Campaigns'},
            {path:`${B}/campaigns/ongoing`,   label:'Ongoing Campaigns'},
            {path:`${B}/campaigns/completed`, label:'Completed Campaigns'},
            {path:`${B}/campaigns/volunteers`,label:'Volunteers'},
            {path:`${B}/campaigns/reports`,   label:'Campaign Reports'},
          ]
        },
      ]
    },
    {
      section: 'Communications',
      items: [
        { path:`${B}/notifications`, icon:Bell, label:'Notifications', badge: notifications.length > 0 ? String(notifications.length) : null,
          sub:[
            {path:`${B}/notifications`,               label:'All Notifications'},
            {path:`${B}/notifications/sms`,           label:'SMS'},
            {path:`${B}/notifications/email`,         label:'Email'},
            {path:`${B}/notifications/push`,          label:'Push Notifications'},
            {path:`${B}/notifications/announcements`, label:'Announcements'},
            {path:`${B}/notifications/templates`,     label:'Notification Templates'},
          ]
        },
        { path:`${B}/feedback`, icon:Star, label:'Feedback',
          sub:[
            {path:`${B}/feedback`,            label:'User Feedback'},
            {path:`${B}/feedback/ratings`,    label:'Ratings'},
            {path:`${B}/feedback/complaints`, label:'Complaints'},
            {path:`${B}/feedback/suggestions`,label:'Suggestions'},
          ]
        },
      ]
    },
    {
      section: 'Analytics & Reports',
      items: [
        { path:`${B}/analytics`, icon:BarChart2, label:'Analytics',
          sub:[
            {path:`${B}/analytics`,            label:'Donation Trends'},
            {path:`${B}/analytics/blood-usage`,label:'Blood Usage'},
            {path:`${B}/analytics/province`,   label:'Province-wise Stats'},
            {path:`${B}/analytics/growth`,     label:'Monthly Growth'},
          ]
        },
        { path:`${B}/reports`, icon:FileBarChart, label:'Reports',
          sub:[
            {path:`${B}/reports/donor`,   label:'Donor Report'},
            {path:`${B}/reports/stock`,   label:'Blood Stock Report'},
            {path:`${B}/reports/hospital`,label:'Hospital Report'},
            {path:`${B}/reports/monthly`, label:'Monthly Report'},
            {path:`${B}/reports/export`,  label:'PDF / Excel Export'},
          ]
        },
      ]
    },
    {
      section: 'System',
      items: [
        { path:`${B}/locations`, icon:MapPin, label:'Location Management',
          sub:[
            {path:`${B}/locations/provinces`,label:'Provinces'},
            {path:`${B}/locations/districts`,label:'Districts'},
            {path:`${B}/locations/cities`,   label:'Cities'},
            {path:`${B}/locations/maps`,     label:'Google Maps'},
          ]
        },
        { path:`${B}/security`, icon:Shield, label:'Security',
          sub:[
            {path:`${B}/security/logs`,  label:'Login Logs'},
            {path:`${B}/security/audit`, label:'Audit Logs'},
            {path:`${B}/security/backup`,label:'Backup & Restore'},
            {path:`${B}/security/2fa`,   label:'Two-Factor Auth'},
          ]
        },
        { path:`${B}/settings`, icon:Settings, label:'System Settings',
          sub:[
            {path:`${B}/settings/general`,label:'General Settings'},
            {path:`${B}/settings/email`,  label:'Email Settings'},
            {path:`${B}/settings/sms`,    label:'SMS Gateway'},
            {path:`${B}/settings/theme`,  label:'Theme'},
          ]
        },
      ]
    },
  ];

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme') === 'dark';
    if (saved) {
      document.body.classList.add('dark-mode');
      document.body.style.background = '#0F172A';
      document.body.style.color = '#E2E8F0';
    } else {
      document.body.classList.remove('dark-mode');
      document.body.style.background = '#F0F2F8';
      document.body.style.color = '#0F172A';
    }
    return saved;
  });

  const profileRef = useRef(null);
  const notifRef   = useRef(null);
  const callRef    = useRef(null);
  const photoInput = useRef(null);

  const isActive = p => {
    if (p === B) return location.pathname === B || location.pathname === `${B}/`;
    return location.pathname.startsWith(p);
  };
  const toggleExpand = path => setExpanded(prev=>({...prev,[path]:!prev[path]}));

  const pageTitle = Object.entries(TITLES).find(([k]) =>
    k === B
      ? location.pathname === B || location.pathname === `${B}/`
      : location.pathname.startsWith(k)
  )?.[1] || 'BloodCare';

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
      document.body.style.background = '#0F172A';
      document.body.style.color = '#E2E8F0';
    } else {
      document.body.classList.remove('dark-mode');
      document.body.style.background = '#F0F2F8';
      document.body.style.color = '#0F172A';
    }
    localStorage.setItem('theme', darkMode?'dark':'light');
  }, [darkMode]);

  useEffect(() => {
    const handleClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current   && !notifRef.current.contains(e.target))   setNotifOpen(false);
      if (callRef.current    && !callRef.current.contains(e.target))    setCallOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setProfilePhoto(dataUrl);
      localStorage.setItem('adminPhoto', dataUrl);
      setPhotoSaved(true);
      setTimeout(()=>setPhotoSaved(false), 2500);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setProfilePhoto(null);
    localStorage.removeItem('adminPhoto');
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${Math.floor(diffHr / 24)}d ago`;
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo" style={{cursor:'pointer'}} onClick={()=>navigate('/')}>
          <div className="sidebar-logo-icon"><Droplet size={18} color="#fff"/></div>
          <div>
            <div className="sidebar-logo-text">Blood<span>Care</span></div>
            <div className="sidebar-logo-sub">Admin Portal</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(({section,items})=>(
            <div className="sidebar-section" key={section}>
              <div className="sidebar-section-title">{section}</div>
              {items.map(({path,icon:Icon,label,badge,sub})=>(
                <div key={path}>
                  <button className={`sidebar-link ${isActive(path)?'active':''}`}
                    onClick={()=>{if(sub)toggleExpand(path);else navigate(path);}}>
                    <Icon size={15}/>
                    <span style={{flex:1,textAlign:'left'}}>{label}</span>
                    {badge && <span className="sidebar-link-badge">{badge}</span>}
                    {sub && <span style={{marginLeft:'auto',color:'rgba(255,255,255,.4)',fontSize:12}}>{expanded[path]?'▾':'›'}</span>}
                  </button>
                  {sub && expanded[path] && (
                    <div style={{marginLeft:16,marginBottom:4}}>
                      {sub.map(s=>(
                        <button key={`${s.path}-${s.label}`} onClick={()=>navigate(s.path)} style={{
                          display:'block',width:'100%',textAlign:'left',
                          padding:'7px 12px',border:'none',
                          fontSize:12.5,cursor:'pointer',borderRadius:'var(--r-sm)',
                          color:location.pathname===s.path?'#fff':'rgba(255,255,255,.5)',
                          background:location.pathname===s.path?'rgba(255,255,255,.1)':'none',
                          borderLeft:location.pathname===s.path?'2px solid rgba(255,255,255,.5)':'2px solid transparent',
                          marginBottom:1,
                        }}>{s.label}</button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user" style={{cursor:'default'}}>
            <Avatar photo={profilePhoto} name={user?.name} size={32} fontSize={13}
              border="2px solid rgba(255,255,255,.3)"/>
            <div style={{flex:1,minWidth:0}}>
              <div className="sidebar-user-name">{user?.name||'Admin'}</div>
              <div className="sidebar-user-role">Super Admin</div>
            </div>
            <LogOut size={14} color="rgba(255,255,255,0.5)"
              style={{cursor:'pointer',flexShrink:0}} onClick={logout}/>
          </div>
        </div>
      </aside>

      <div className="main-content">
        <header className="header">
          <div className="header-left">
            <div>
              <div className="header-title">{pageTitle}</div>
              <div className="header-subtitle">BloodCare Admin Portal</div>
            </div>
          </div>

          <div className="header-right">

            <div ref={notifRef} style={{position:'relative'}}>
              <button className="header-btn" style={{position:'relative'}}
                onClick={()=>{setNotifOpen(p=>!p);setProfileOpen(false);setCallOpen(false);}}>
                <Bell size={16}/>
                {notifications.length > 0 && (
                  <span style={{position:'absolute',top:-5,right:-5,background:'var(--red-600)',color:'#fff',fontSize:9,fontWeight:700,width:16,height:16,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center'}}>{notifications.length}</span>
                )}
              </button>
              {notifOpen && (
                <div style={{position:'absolute',top:'calc(100% + 10px)',right:0,background:darkMode?'#1E293B':'#fff',borderRadius:'var(--r-md)',boxShadow:'0 8px 32px rgba(0,0,0,.2)',border:`1px solid ${darkMode?'#334155':'var(--slate-200)'}`,width:340,zIndex:1000,overflow:'hidden'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 16px',borderBottom:`1px solid ${darkMode?'#334155':'var(--slate-100)'}`}}>
                    <div style={{fontSize:14,fontWeight:700,color:darkMode?'#F1F5F9':'var(--slate-900)'}}>Notifications</div>
                    <span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:100,background:'var(--red-100)',color:'var(--red-600)'}}>{notifications.length} recent</span>
                  </div>
                  {notifications.length === 0 && (
                    <div style={{padding:'24px 16px',textAlign:'center',fontSize:13,color:'var(--slate-400)'}}>No recent activity</div>
                  )}
                  {notifications.map((n,i)=>(
                    <div key={i} onClick={()=>{navigate(n.path);setNotifOpen(false);}}
                      style={{display:'flex',gap:10,padding:'12px 16px',cursor:'pointer',
                        background:darkMode?'#1E293B':'#fff',
                        borderBottom:`1px solid ${darkMode?'#334155':'var(--slate-50)'}`,transition:'background .15s'}}
                      onMouseEnter={e=>e.currentTarget.style.background=darkMode?'#334155':'var(--slate-50)'}
                      onMouseLeave={e=>e.currentTarget.style.background=darkMode?'#1E293B':'#fff'}>
                      <div style={{width:32,height:32,borderRadius:'50%',background:n.bg||(darkMode?'#334155':'var(--slate-100)'),display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0}}>{n.icon}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:12,fontWeight:600,color:darkMode?'#E2E8F0':'var(--slate-800)',lineHeight:1.4}}>{n.text}</div>
                        <div style={{fontSize:10,color:'var(--slate-400)',marginTop:2}}>{timeAgo(n.time)}</div>
                      </div>
                    </div>
                  ))}
                  <button onClick={()=>{navigate(`${B}/notifications`);setNotifOpen(false);}}
                    style={{width:'100%',padding:'12px',background:darkMode?'#0F172A':'var(--slate-50)',border:'none',borderTop:`1px solid ${darkMode?'#334155':'var(--slate-100)'}`,cursor:'pointer',fontSize:13,fontWeight:600,color:'var(--red-600)',fontFamily:'var(--font-body)'}}>
                    View All Notifications →
                  </button>
                </div>
              )}
            </div>

            <button onClick={()=>setDarkMode(d=>!d)}
              title={darkMode?'Switch to Light Mode':'Switch to Dark Mode'}
              style={{width:36,height:36,borderRadius:'var(--r-sm)',background:darkMode?'#334155':'var(--slate-100)',border:darkMode?'1px solid #475569':'1px solid var(--slate-200)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all .2s',flexShrink:0}}>
              {darkMode ? <Sun size={16} color="#FCD34D"/> : <Moon size={16} color="#64748B"/>}
            </button>

            <div ref={callRef} style={{position:'relative'}}>
              <button onClick={()=>{setCallOpen(p=>!p);setNotifOpen(false);setProfileOpen(false);}}
                title="Quick Contacts"
                style={{width:36,height:36,borderRadius:'var(--r-sm)',background:'#16A34A',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',position:'relative',flexShrink:0,boxShadow:'0 2px 8px rgba(22,163,74,.35)'}}>
                <Phone size={15} color="#fff"/>
              </button>
              {callOpen && (
                <div style={{position:'absolute',top:'calc(100% + 10px)',right:0,background:darkMode?'#1E293B':'#fff',borderRadius:'var(--r-md)',boxShadow:'0 8px 32px rgba(0,0,0,.2)',border:`1px solid ${darkMode?'#334155':'var(--slate-200)'}`,width:290,zIndex:1000,overflow:'hidden'}}>
                  <div style={{padding:'12px 16px',background:'linear-gradient(135deg,#15803D,#16A34A)',color:'#fff'}}>
                    <div style={{fontSize:13,fontWeight:700,display:'flex',alignItems:'center',gap:6}}><Phone size={14}/> Quick Emergency Contacts</div>
                    <div style={{fontSize:10,opacity:.8,marginTop:2}}>Sri Lanka Emergency & Support Lines</div>
                  </div>
                  {QUICK_CALLS.map(({label,number,color,bg})=>(
                    <div key={label} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',borderBottom:`1px solid ${darkMode?'#334155':'var(--slate-50)'}`,background:darkMode?'#1E293B':bg}}>
                      <div>
                        <div style={{fontSize:12,fontWeight:600,color:darkMode?'#CBD5E1':'var(--slate-700)'}}>{label}</div>
                        <div style={{fontSize:14,fontWeight:800,color,marginTop:1}}>{number}</div>
                      </div>
                      <a href={`tel:${number}`} style={{padding:'6px 14px',background:color,color:'#fff',borderRadius:'var(--r-sm)',fontSize:12,fontWeight:700,textDecoration:'none',display:'flex',alignItems:'center',gap:5,whiteSpace:'nowrap'}}>
                        <Phone size={11}/> Call
                      </a>
                    </div>
                  ))}
                  <div style={{padding:'10px 14px',background:darkMode?'#0F172A':'var(--slate-50)',borderTop:`1px solid ${darkMode?'#334155':'var(--slate-100)'}`,fontSize:11,color:'var(--slate-400)',textAlign:'center'}}>
                    📞 Click Call to dial directly
                  </div>
                </div>
              )}
            </div>

            <button className="header-btn" style={{position:'relative',flexShrink:0}}
              onClick={()=>navigate(`${B}/emergency`)}>
              <AlertTriangle size={16} color="#F59E0B"/>
              {liveStats.pendingRequests > 0 && (
                <span style={{position:'absolute',top:-5,right:-5,background:'#F59E0B',color:'#fff',fontSize:9,fontWeight:700,width:16,height:16,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center'}}>{liveStats.pendingRequests}</span>
              )}
            </button>

            <div ref={profileRef} style={{position:'relative'}}>
              <div onClick={()=>{setProfileOpen(p=>!p);setNotifOpen(false);setCallOpen(false);}}
                style={{display:'flex',alignItems:'center',gap:8,padding:'6px 12px',background:darkMode?'#1E293B':'var(--slate-50)',borderRadius:'var(--r-sm)',border:darkMode?'1px solid #334155':'1px solid var(--slate-200)',cursor:'pointer',transition:'all .15s'}}>
                <Avatar photo={profilePhoto} name={user?.name} size={32} fontSize={13} border="none"/>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:darkMode?'#F1F5F9':'var(--slate-900)'}}>{user?.name||'Admin'}</div>
                  <div style={{fontSize:10,color:'var(--slate-500)'}}>Super Admin</div>
                </div>
                <ChevronDown size={13} color="var(--slate-400)" style={{transform:profileOpen?'rotate(180deg)':'rotate(0)',transition:'transform .2s'}}/>
              </div>

              {profileOpen && (
                <div style={{position:'absolute',top:'calc(100% + 8px)',right:0,background:darkMode?'#1E293B':'#fff',borderRadius:'var(--r-md)',boxShadow:'0 8px 32px rgba(0,0,0,.2)',border:`1px solid ${darkMode?'#334155':'var(--slate-200)'}`,width:260,zIndex:1000,overflow:'hidden'}}>
                  <div style={{padding:'20px 16px',background:'linear-gradient(135deg,#7F0F1E,#C41E3A)',color:'#fff'}}>
                    {photoSaved && (
                      <div style={{background:'rgba(255,255,255,.2)',borderRadius:6,padding:'6px 10px',marginBottom:10,fontSize:11,fontWeight:600,textAlign:'center'}}>✅ Photo saved successfully!</div>
                    )}
                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                      <div style={{position:'relative',flexShrink:0}}>
                        <Avatar photo={profilePhoto} name={user?.name} size={52} fontSize={22} border="3px solid rgba(255,255,255,.5)"/>
                        <label style={{position:'absolute',bottom:-2,right:-2,width:20,height:20,borderRadius:'50%',background:'#fff',border:'1.5px solid var(--slate-200)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',boxShadow:'0 2px 6px rgba(0,0,0,.2)'}}>
                          <Camera size={11} color="#475569"/>
                          <input ref={photoInput} type="file" accept="image/*" onChange={handlePhotoChange} style={{display:'none'}}/>
                        </label>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:14,fontWeight:700}}>{user?.name||'BloodCare Admin'}</div>
                        <div style={{fontSize:11,opacity:.8,marginTop:1}}>Super Admin</div>
                        <div style={{fontSize:10,opacity:.6,marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.email||'admin@bloodcare.lk'}</div>
                        <div style={{display:'flex',gap:6,marginTop:6}}>
                          <label style={{fontSize:10,fontWeight:600,padding:'3px 8px',background:'rgba(255,255,255,.2)',borderRadius:100,cursor:'pointer',whiteSpace:'nowrap'}}>
                            📷 Change Photo
                            <input type="file" accept="image/*" onChange={handlePhotoChange} style={{display:'none'}}/>
                          </label>
                          {profilePhoto && (
                            <button onClick={handleRemovePhoto} style={{fontSize:10,fontWeight:600,padding:'3px 8px',background:'rgba(255,0,0,.3)',border:'none',borderRadius:100,cursor:'pointer',color:'#fff',fontFamily:'var(--font-body)'}}>✕ Remove</button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div style={{marginTop:12,display:'flex',gap:6}}>
                      {[
                        {v:String(liveStats.totalDonors||0),     l:'Donors'},
                        {v:String(liveStats.totalHospitals||0),  l:'Hospitals'},
                        {v:String(liveStats.totalBloodBanks||0), l:'Blood Banks'},
                      ].map(({v,l})=>(
                        <div key={l} style={{flex:1,background:'rgba(255,255,255,.15)',borderRadius:6,padding:'6px 8px',textAlign:'center'}}>
                          <div style={{fontSize:13,fontWeight:800}}>{v}</div>
                          <div style={{fontSize:9,opacity:.7}}>{l}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{padding:'6px 0',background:darkMode?'#1E293B':'#fff'}}>
                    {[
                      {icon:<User size={15}/>,     label:'My Profile',       path:`${B}/staff`},
                      {icon:<Settings size={15}/>, label:'Account Settings', path:`${B}/settings`},
                      {icon:<Shield size={15}/>,   label:'Security & 2FA',   path:`${B}/security`},
                      {icon:<Activity size={15}/>, label:'System Health',    path:`${B}/system-health`},
                      {icon:<Bell size={15}/>,     label:'Notifications',    path:`${B}/notifications`},
                      {icon:<BarChart size={15}/>, label:'My Reports',       path:`${B}/reports`},
                      {icon:<KeyRound size={15}/>, label:'Change Password',  path:`${B}/settings`},
                    ].map(({icon,label,path})=>(
                      <button key={label} onClick={()=>{navigate(path);setProfileOpen(false);}}
                        style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'10px 16px',background:'none',border:'none',cursor:'pointer',fontSize:13,color:darkMode?'#CBD5E1':'var(--slate-700)',fontFamily:'var(--font-body)',transition:'background .15s',textAlign:'left'}}
                        onMouseEnter={e=>e.currentTarget.style.background=darkMode?'#334155':'var(--slate-50)'}
                        onMouseLeave={e=>e.currentTarget.style.background='none'}>
                        <span style={{color:'var(--slate-400)'}}>{icon}</span>{label}
                      </button>
                    ))}
                  </div>

                  <div style={{borderTop:`1px solid ${darkMode?'#334155':'var(--slate-100)'}`,padding:'6px 0',background:darkMode?'#1E293B':'#fff'}}>
                    <button onClick={()=>{logout();setProfileOpen(false);}}
                      style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'10px 16px',background:'none',border:'none',cursor:'pointer',fontSize:13,fontWeight:700,color:'var(--red-600)',fontFamily:'var(--font-body)',transition:'background .15s'}}
                      onMouseEnter={e=>e.currentTarget.style.background=darkMode?'#334155':'var(--red-50)'}
                      onMouseLeave={e=>e.currentTarget.style.background='none'}>
                      <LogOut size={15}/> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="page-content">
          <Outlet/>
        </main>
      </div>
    </div>
  );
}