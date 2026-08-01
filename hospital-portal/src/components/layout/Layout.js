import React,{useState} from 'react';
import {Outlet,useLocation,useNavigate} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';
import {LayoutDashboard,Users,Droplets,UserPlus,Clock,Building2,Bell,LogOut,Stethoscope,ChevronDown,
  Sun,AlertTriangle,Truck,FlaskConical,UserCheck,BarChart3,UserPlus2,List,FileText,Activity,Plus,
  X as X2,Package as Package2,CheckCircle as CheckCircle2,Ban,ClipboardCheck,Calendar as Calendar2,
  Building2 as Building2b,MapPin as MapPin2,Phone as Phone2,Play as Play2,
  QrCode as QrCode2,History as History2,Bell as Bell2,MessageSquare as MessageSquare2,
  Megaphone as Megaphone2,Mail as Mail2,Download as Download2,Handshake as Handshake2,
  Moon,Phone} from 'lucide-react';

const DASHBOARD_SUB=[
  {hash:'today-summary',   icon:Sun,          label:"Today's Summary"},
  {hash:'emergency-alerts',icon:AlertTriangle,label:'Emergency Alerts'},
  {hash:'blood-availability',icon:Droplets,   label:'Blood Availability'},
  {hash:'blood-in-transit',icon:Truck,        label:'Blood In Transit'},
  {hash:'pending-requests',icon:Clock,        label:'Pending Blood Requests'},
  {hash:'pending-tests',   icon:FlaskConical, label:'Pending Blood Tests'},
  {hash:'staff-on-duty',   icon:UserCheck,    label:'Staff On Duty'},
  {hash:'recent-activities',icon:Bell,        label:'Recent Activities'},
  {hash:'dashboard-analytics',icon:BarChart3, label:'Dashboard Analytics'},
];

const PATIENT_SUB=[
  {hash:'patients-dashboard', icon:LayoutDashboard, label:'Dashboard'},
  {hash:'all-patients',       icon:List,             label:'All Patients'},
  {hash:'register-patient',   icon:Plus,             label:'Register Patient', action:'register'},
  {hash:'all-patients',       icon:UserPlus2,        label:'Patient Profile',           note:true},
  {hash:'all-patients',       icon:FileText,         label:'Medical Records',           note:true},
  {hash:'all-patients',       icon:Droplets,         label:'Blood Transfusion History', note:true},
  {hash:'all-patients',       icon:FileText,         label:'Patient Documents',         note:true},
  {hash:null,                 icon:BarChart3,        label:'Reports',      action:'viewReports'},
  {hash:null,                 icon:Activity,         label:'Activity Logs',action:'viewLogs',module:'patient'},
];

const BLOODREQ_SUB=[
  {hash:null,           icon:Plus,          label:'New Blood Request', action:'newRequest'},
  {hash:'all',          icon:List,          label:'All Requests'},
  {hash:'pending',      icon:Clock,         label:'Pending'},
  {hash:'under-review', icon:FlaskConical,  label:'Under Review'},
  {hash:'approved',     icon:UserCheck,     label:'Approved'},
  {hash:'rejected',     icon:X2,            label:'Rejected'},
  {hash:'emergency',    icon:AlertTriangle, label:'Emergency Requests'},
  {hash:'allocation',   icon:Package2,      label:'Blood Allocation Status'},
  {hash:'dispatch',     icon:Truck,         label:'Dispatch Tracking'},
  {hash:'received',     icon:CheckCircle2,  label:'Blood Received'},
  {hash:'completed',    icon:CheckCircle2,  label:'Completed'},
  {hash:'cancelled',    icon:Ban,           label:'Cancelled'},
  {hash:'history',      icon:Clock,         label:'Request History'},
  {hash:null,           icon:BarChart3,     label:'Reports',       action:'viewReports'},
  {hash:null,           icon:Activity,      label:'Activity Logs', action:'viewLogs',module:'blood-request'},
];

const HOSPSTAFF_SUB=[
  {hash:'all',         icon:LayoutDashboard, label:'Dashboard'},
  {hash:'all',         icon:List,            label:'All Staff'},
  {hash:'all',         icon:Plus,            label:'Add Staff', action:'addStaff'},
  {hash:'departments', icon:Building2b,      label:'Departments'},
  {hash:'all',         icon:UserCheck,       label:'Designations', note:true},
  {hash:'shifts',      icon:Calendar2,       label:'Duty Schedule'},
  {hash:'shifts',      icon:Clock,           label:'Shift Management'},
  {hash:'attendance',  icon:CheckCircle2,    label:'Attendance'},
  {hash:'leave',       icon:FileText,        label:'Leave Management'},
  {hash:'emergency',   icon:AlertTriangle,   label:'Emergency Duty'},
  {hash:null,          icon:BarChart3,       label:'Performance',    soon:true},
  {hash:null,          icon:BarChart3,       label:'Reports',        soon:true},
  {hash:null,          icon:Activity,        label:'Activity Logs',  soon:true},
];

const HP_SUB=[
  {hash:'dashboard', icon:LayoutDashboard, label:'Dashboard'},
  {hash:'dashboard', icon:Handshake2,      label:'Partner Hospitals'},
  {hash:null,        icon:Plus,            label:'Add Partnership', action:'add'},
  {hash:'requests',  icon:Users,           label:'Partnership Requests'},
  {hash:'dashboard', icon:FileText,        label:'Agreements (MOU)', note:true},
  {hash:'dashboard', icon:CheckCircle2,    label:'Active Partnerships'},
  {hash:'expired',   icon:Ban,             label:'Expired Partnerships'},
  {hash:'dashboard', icon:Phone2,          label:'Contact Persons', note:true},
  {hash:'shared',    icon:Droplets,        label:'Shared Blood Requests'},
  {hash:null,        icon:BarChart3,       label:'Partnership Reports', soon:true},
  {hash:null,        icon:Activity,        label:'Activity Logs', action:'viewLogs',module:'partnership'},
];

const RPT_SUB=[
  {hash:'requests',   icon:Droplets,   label:'Blood Request Reports'},
  {hash:'usage',      icon:BarChart3,  label:'Blood Usage Reports'},
  {hash:'transfusion',icon:Droplets,   label:'Blood Transfusion Reports'},
  {hash:'patients',   icon:Users,      label:'Patient Reports'},
  {hash:'donortest',  icon:Stethoscope,label:'Donor Testing Reports'},
  {hash:'staff',      icon:Users,      label:'Staff Reports'},
  {hash:'emergency',  icon:AlertTriangle,label:'Emergency Reports'},
  {hash:'monthly',    icon:BarChart3,  label:'Monthly Reports'},
  {hash:'requests',   icon:LayoutDashboard,label:'Analytics Dashboard'},
  {hash:null,         icon:Download2,  label:'Export PDF / Excel', note:true},
];

const NOTIF_SUB=[
  {hash:'all',       icon:LayoutDashboard, label:'Dashboard'},
  {hash:'all',       icon:Bell2,           label:'All Notifications'},
  {hash:'updates',   icon:Droplets,        label:'Blood Request Updates'},
  {hash:'emergency', icon:AlertTriangle,   label:'Emergency Alerts'},
  {hash:null,        icon:MessageSquare2,  label:'Messages',      soon:true},
  {hash:null,        icon:Megaphone2,      label:'Announcements', soon:true},
  {hash:null,        icon:Mail2,           label:'Email',         soon:true},
  {hash:null,        icon:MessageSquare2,  label:'SMS',           soon:true},
  {hash:'all',       icon:History2,        label:'Notification History'},
  {hash:null,        icon:FileText,        label:'Templates',     soon:true},
];

const BV_SUB=[
  {hash:'scan',    icon:QrCode2,  label:'Scan Blood Bag'},
  {hash:'scan',    icon:QrCode2,  label:'QR Verification',      note:true},
  {hash:'scan',    icon:QrCode2,  label:'Barcode Verification', note:true},
  {hash:'history', icon:History2, label:'Verification History'},
  {hash:null,      icon:BarChart3,label:'Reports', soon:true},
];

const BT_SUB=[
  {hash:'scheduled', icon:LayoutDashboard, label:'Dashboard'},
  {hash:'scheduled', icon:Clock,           label:'Scheduled'},
  {hash:'ongoing',   icon:Play2,           label:'Ongoing'},
  {hash:'completed', icon:CheckCircle2,    label:'Completed'},
  {hash:'reactions', icon:AlertTriangle,   label:'Adverse Reactions'},
  {hash:'followup',  icon:Activity,        label:'Follow-up'},
  {hash:null,        icon:BarChart3,       label:'Reports', soon:true},
  {hash:null,        icon:Activity,        label:'Activity Logs', action:'viewLogs',module:'transfusion'},
];

const EM_SUB=[
  {hash:'dashboard', icon:LayoutDashboard, label:'Dashboard'},
  {hash:'requests',  icon:Droplets,        label:'Emergency Blood Requests'},
  {hash:'patients',  icon:Users,           label:'Critical Patients'},
  {hash:'contacts',  icon:Phone2,          label:'Emergency Contacts'},
  {hash:null,        icon:Building2b,      label:'Nearby Blood Banks', action:'nearby'},
  {hash:null,        icon:AlertTriangle,   label:'Emergency Broadcast', note:true},
  {hash:null,        icon:BarChart3,       label:'Reports', soon:true},
  {hash:null,        icon:Activity,        label:'Activity Logs', action:'viewLogs',module:'emergency'},
];

const APPT_SUB=[
  {hash:'all',       icon:LayoutDashboard, label:'Dashboard'},
  {hash:null,        icon:Users,           label:'Patient Appointments', soon:true},
  {hash:'all',       icon:Stethoscope,     label:'Donor Testing Appointments'},
  {hash:null,        icon:Droplets,        label:'Blood Transfusion Appointments', soon:true},
  {hash:'upcoming',  icon:Clock,           label:'Upcoming Appointments'},
  {hash:'completed', icon:CheckCircle2,    label:'Completed'},
  {hash:'cancelled', icon:Ban,             label:'Cancelled'},
  {hash:null,        icon:Calendar2,       label:'Calendar', soon:true},
  {hash:null,        icon:BarChart3,       label:'Reports',  soon:true},
];

const HSTAFF_SUB=[
  {hash:'all',        icon:LayoutDashboard, label:'Dashboard'},
  {hash:'all',        icon:Users,          label:'All Staff'},
  {hash:null,         icon:Plus,           label:'Add Staff', action:'add'},
  {hash:'departments',icon:Building2b,     label:'Departments'},
  {hash:'all',        icon:UserCheck,      label:'Designations', note:true},
  {hash:'all',        icon:Calendar2,      label:'Duty Schedule', note:true},
  {hash:'all',        icon:Calendar2,      label:'Shift Management', note:true},
  {hash:'all',        icon:CheckCircle2,   label:'Attendance', note:true},
  {hash:'leave',      icon:List,           label:'Leave Management'},
  {hash:'all',        icon:AlertTriangle,  label:'Emergency Duty', note:true},
  {hash:null,         icon:BarChart3,      label:'Performance', soon:true},
  {hash:null,         icon:BarChart3,      label:'Reports',     soon:true},
  {hash:null,         icon:Activity,       label:'Activity Logs', action:'viewLogs',module:'staff'},
];

const DELIVERY_SUB=[
  {hash:'dispatch',  icon:Truck,        label:'Blood In Transit'},
  {hash:'dispatch',  icon:MapPin2,      label:'Delivery Tracking',     note:true},
  {hash:'received',  icon:CheckCircle2, label:'Blood Received'},
  {hash:'dispatch',  icon:ClipboardCheck,label:'Delivery Confirmation',note:true},
  {hash:'received',  icon:List,         label:'Delivery History'},
  {hash:null,        icon:BarChart3,    label:'Reports', soon:true},
];

const BLOODBANK_SUB=[
  {hash:'all',          icon:LayoutDashboard, label:'Dashboard'},
  {hash:'all',          icon:Building2b,      label:'All Blood Banks'},
  {hash:'availability', icon:Droplets,        label:'Blood Availability'},
  {hash:'components',   icon:Package2,        label:'Blood Components'},
  {hash:'nearby',       icon:MapPin2,         label:'Nearby Blood Banks'},
  {hash:'contacts',     icon:Phone2,          label:'Contact Directory'},
  {hash:null,           icon:Truck,           label:'Blood Transfer Status', soon:true},
  {hash:'all',          icon:Building2b,      label:'Blood Bank Profile',    note:true},
  {hash:null,           icon:MapPin2,         label:'Map View',   soon:true},
  {hash:null,           icon:BarChart3,       label:'Reports',    soon:true},
];

const DONORTEST_SUB=[
  {hash:'all',       icon:LayoutDashboard, label:'Dashboard'},
  {hash:'all',       icon:List,            label:'Testing Appointments'},
  {hash:'today',     icon:Calendar2,       label:"Today's Appointments"},
  {hash:'pending',   icon:Clock,           label:'Pending Donor Tests'},
  {hash:'pending',   icon:Stethoscope,     label:'Medical Screening', note:true},
  {hash:'pending',   icon:FlaskConical,    label:'Laboratory Tests',  note:true},
  {hash:'eligible',  icon:CheckCircle2,    label:'Eligible Donors'},
  {hash:'deferred',  icon:Ban,             label:'Deferred Donors'},
  {hash:'all',       icon:FileText,        label:'Test Reports'},
  {hash:null,        icon:Calendar2,       label:'Appointment Calendar', soon:true},
  {hash:null,        icon:Activity,        label:'Activity Logs',       action:'viewLogs',module:'donor-testing'},
];

const BLOODTEST_SUB=[
  {hash:'all',        icon:LayoutDashboard, label:'Dashboard'},
  {hash:'pending',    icon:FlaskConical,    label:'Blood Group Testing', note:true},
  {hash:'pending',    icon:FlaskConical,    label:'Cross Match',         note:true},
  {hash:'pending',    icon:FlaskConical,    label:'Compatibility Testing', note:true},
  {hash:'pending',    icon:FlaskConical,    label:'Antibody Screening',  note:true},
  {hash:'pending',    icon:ClipboardCheck,  label:'Pre-Transfusion Tests'},
  {hash:'all',        icon:List,            label:'Test Results'},
  {hash:'pending',    icon:Clock,           label:'Pending Tests'},
  {hash:'completed',  icon:CheckCircle2,    label:'Completed Tests'},
  {hash:null,         icon:BarChart3,       label:'Reports',       soon:true},
  {hash:null,         icon:Activity,        label:'Activity Logs', action:'viewLogs',module:'blood-testing'},
];

const NAV=[
  {section:'Patients & Requests',items:[
    {path:'/donor-requests', icon:UserPlus,   label:'Donor Requests'},
    {path:'/history',        icon:Clock,      label:'Request History'},
  ]},
  {section:'Hospital',items:[
    {path:'/profile',icon:Building2,label:'Hospital Profile'},
  ]},
];

export default function Layout(){
  const {hospital,logout}=useAuth();
  const loc=useLocation();
  const nav=useNavigate();
  const [dashOpen,setDashOpen]=useState(loc.pathname==='/');
  const [patOpen,setPatOpen]=useState(loc.pathname==='/patients');
  const [bloodOpen,setBloodOpen]=useState(loc.pathname==='/blood-requests');
  const [btOpen,setBtOpen]=useState(loc.pathname==='/blood-testing');
  const [dtOpen,setDtOpen]=useState(loc.pathname==='/donor-testing');
  const [bbOpen,setBbOpen]=useState(loc.pathname==='/blood-banks');
  const [dvOpen,setDvOpen]=useState(false);
  const [hsOpen,setHsOpen]=useState(loc.pathname==='/hospital-staff');
  const [apOpen,setApOpen]=useState(loc.pathname==='/appointments');
  const [emOpen,setEmOpen]=useState(loc.pathname==='/emergency-management');
  const [btrOpen,setBtrOpen]=useState(loc.pathname==='/blood-transfusion');
  const [bvOpen,setBvOpen]=useState(loc.pathname==='/blood-verification');
  const [nfOpen,setNfOpen]=useState(loc.pathname==='/notifications');
  const [rpOpen,setRpOpen]=useState(loc.pathname==='/reports');
  const [hpOpen,setHpOpen]=useState(loc.pathname==='/hospital-partnerships');
  const [userMenuOpen,setUserMenuOpen]=useState(false);

  const isActive=p=>p==='/'?loc.pathname==='/':loc.pathname.startsWith(p);

  const goToSection=(path,hash)=>{
    if(loc.pathname!==path){
      nav(`${path}#${hash}`);
    } else {
      const el=document.getElementById(hash);
      if(el) el.scrollIntoView({behavior:'smooth',block:'start'});
      window.history.replaceState(null,'',`${path}#${hash}`);
    }
  };

  const handlePatientSub=(item)=>{
    if(item.soon){ alert(`${item.label} is coming soon — not built yet.`); return; }
    if(item.action==='viewLogs'){ nav(`/activity-logs?module=${item.module}`); return; }
    if(item.action==='viewReports'){ nav('/reports#patients'); return; }
    if(item.action==='register'){
      if(loc.pathname!=='/patients') nav('/patients#register-patient=open');
      else window.dispatchEvent(new CustomEvent('open-register-patient'));
      return;
    }
    if(item.note){ alert(`${item.label} is viewed per-patient — click the 👁 icon on a patient row in the All Patients table below.`); }
    goToSection('/patients',item.hash);
  };

  const handleBloodReqSub=(item)=>{
    if(item.soon){ alert(`${item.label} is coming soon — not built yet.`); return; }
    if(item.action==='viewLogs'){ nav(`/activity-logs?module=${item.module}`); return; }
    if(item.action==='newRequest'){
      if(loc.pathname!=='/blood-requests') nav('/blood-requests#new-request=open');
      else window.dispatchEvent(new CustomEvent('open-new-blood-request'));
      return;
    }
    if(item.action==='viewReports'){ nav('/reports#requests'); return; }
    nav(`/blood-requests#${item.hash}`);
  };

  const handleBtSub=(item)=>{
    if(item.soon){ alert(`${item.label} is coming soon — not built yet.`); return; }
    if(item.action==='viewLogs'){ nav(`/activity-logs?module=${item.module}`); return; }
    if(item.note){ alert(`${item.label} is filled in per-patient — open a pending test to fill this in.`); }
    nav(`/blood-testing#${item.hash}`);
  };

  const handleDtSub=(item)=>{
    if(item.soon){ alert(`${item.label} is coming soon — not built yet.`); return; }
    if(item.action==='viewLogs'){ nav(`/activity-logs?module=${item.module}`); return; }
    if(item.note){ alert(`${item.label} is filled in per-donor — open a pending test to fill this in.`); }
    nav(`/donor-testing#${item.hash}`);
  };

  const handleBbSub=(item)=>{
    if(item.soon){ alert(`${item.label} is coming soon — not built yet.`); return; }
    if(item.note){ alert(`Click a blood bank card to view its profile.`); }
    nav(`/blood-banks#${item.hash}`);
  };

  const handleDvSub=(item)=>{
    if(item.soon){ alert(`${item.label} is coming soon — not built yet.`); return; }
    if(item.note){ alert(`Open a request in this view and click its row to see full tracking / confirm delivery.`); }
    nav(`/blood-requests#${item.hash}`);
  };

  const handleHsSub=(item)=>{
    if(item.soon){ alert(`${item.label} is coming soon — not built yet.`); return; }
    if(item.action==='viewLogs'){ nav(`/activity-logs?module=${item.module}`); return; }
    if(item.action==='add'){
      if(loc.pathname!=='/hospital-staff') nav('/hospital-staff#add-staff=open');
      else window.dispatchEvent(new CustomEvent('open-add-staff'));
      return;
    }
    if(item.note){ alert(`${item.label} is managed per-staff-member — use the action icons on each staff row.`); }
    nav(`/hospital-staff#${item.hash}`);
  };

  const handleApSub=(item)=>{
    if(item.soon){ alert(`${item.label} is coming soon — not built yet.`); return; }
    nav(`/appointments#${item.hash}`);
  };

  const handleEmSub=(item)=>{
    if(item.soon){ alert(`${item.label} is coming soon — not built yet.`); return; }
    if(item.action==='viewLogs'){ nav(`/activity-logs?module=${item.module}`); return; }
    if(item.action==='nearby'){ nav('/blood-banks#nearby'); return; }
    if(item.note){ nav('/donor-requests'); return; }
    nav(`/emergency-management#${item.hash}`);
  };

  const handleBtrSub=(item)=>{
    if(item.soon){ alert(`${item.label} is coming soon — not built yet.`); return; }
    if(item.action==='viewLogs'){ nav(`/activity-logs?module=${item.module}`); return; }
    nav(`/blood-transfusion#${item.hash}`);
  };

  const handleBvSub=(item)=>{
    if(item.soon){ alert(`${item.label} is coming soon — not built yet.`); return; }
    if(item.note){ alert('Camera-based QR/Barcode scanning needs an extra library — for now use manual Bag ID entry.'); }
    nav(`/blood-verification#${item.hash}`);
  };

  const handleNfSub=(item)=>{
    if(item.soon){ alert(`${item.label} is coming soon — no hospital-targeted messaging system built yet.`); return; }
    nav(`/notifications#${item.hash}`);
  };

  const handleRpSub=(item)=>{
    if(item.note){ alert('Use the "Export CSV" button on each report tab — PDF export needs an extra library.'); return; }
    nav(`/reports#${item.hash}`);
  };

  const handleHpSub=(item)=>{
    if(item.soon){ alert(`${item.label} is coming soon — not built yet.`); return; }
    if(item.action==='viewLogs'){ nav(`/activity-logs?module=${item.module}`); return; }
    if(item.action==='add'){
      if(loc.pathname!=='/hospital-partnerships') nav('/hospital-partnerships#add-partnership=open');
      else window.dispatchEvent(new CustomEvent('open-add-partnership'));
      return;
    }
    if(item.note){ alert(`${item.label} is managed per-partnership — open a partner card to view/manage this.`); }
    nav(`/hospital-partnerships#${item.hash}`);
  };

  const titles={
    '/':'Dashboard','/patients':'Patient Management',
    '/blood-requests':'Blood Requests','/donor-requests':'Donor Requests',
    '/donor-testing':'Donor Testing','/blood-testing':'Blood Testing (Patients)',
    '/blood-banks':'Blood Banks',
    '/hospital-staff':'Hospital Staff',
    '/appointments':'Appointments',
    '/emergency-management':'Emergency Management',
    '/blood-transfusion':'Blood Transfusion',
    '/blood-verification':'Blood Verification',
    '/notifications':'Notifications',
    '/reports':'Reports & Analytics',
    '/hospital-partnerships':'Hospital Partnerships',
    '/history':'Request History','/profile':'Hospital Profile',
    '/activity-logs':'Activity Logs',
  };
  const subs={
    '/':'Overview of hospital blood operations',
    '/patients':'Manage patient records & transfusions',
    '/blood-requests':'Submit & track blood requests to blood banks',
    '/donor-requests':'Request donors directly for emergency needs',
    '/donor-testing':'Review donor testing appointments & lab screening',
    '/blood-testing':'Pre-transfusion compatibility testing & safety checklist',
    '/blood-banks':'Directory of approved blood banks (view only)',
    '/hospital-staff':'Roster, duty schedule, attendance & leave management',
    '/appointments':'Unified view of all donor testing appointments',
    '/emergency-management':'Critical requests, critical patients & emergency response tools',
    '/blood-transfusion':'Schedule and track blood transfusion administration',
    '/blood-verification':'Verify blood bag authenticity before transfusion',
    '/notifications':"Real-time updates on your hospital's blood requests",
    '/reports':'Real reports across all hospital modules',
    '/hospital-partnerships':'Blood sharing network between partner hospitals',
    '/history':'Complete history of all blood requests',
    '/profile':'Manage hospital information',
    '/activity-logs':'Real chronological record of actions across your hospital account',
  };

  return(
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon"><Stethoscope size={18} color="#fff"/></div>
          <div>
            <span className="sidebar-logo-text">Blood<span>Care</span></span>
            <span className="sidebar-logo-badge">Hospital</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section">
            <div className="sidebar-sec-title">Main</div>
            <button
              className={`sidebar-link ${isActive('/')?'active':''}`}
              onClick={()=>{ if(loc.pathname!=='/') nav('/'); setDashOpen(o=>!o); }}
              style={{justifyContent:'space-between'}}
            >
              <span style={{display:'flex',alignItems:'center',gap:9}}><LayoutDashboard size={15}/>Dashboard</span>
              <ChevronDown size={13} style={{transform:dashOpen?'rotate(180deg)':'none',transition:'transform .15s'}}/>
            </button>
            {dashOpen&&(
              <div style={{marginLeft:10,paddingLeft:12,borderLeft:'1px solid rgba(255,255,255,.15)'}}>
                {DASHBOARD_SUB.map(({hash,icon:Icon,label})=>(
                  <button key={hash} className="sidebar-link" style={{fontSize:12.5,padding:'7px 10px'}} onClick={()=>goToSection('/',hash)}>
                    <Icon size={13}/>{label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="sidebar-section">
            <button
              className={`sidebar-link ${isActive('/patients')?'active':''}`}
              onClick={()=>{ if(loc.pathname!=='/patients') nav('/patients'); setPatOpen(o=>!o); }}
              style={{justifyContent:'space-between'}}
            >
              <span style={{display:'flex',alignItems:'center',gap:9}}><Users size={15}/>Patient Management</span>
              <ChevronDown size={13} style={{transform:patOpen?'rotate(180deg)':'none',transition:'transform .15s'}}/>
            </button>
            {patOpen&&(
              <div style={{marginLeft:10,paddingLeft:12,borderLeft:'1px solid rgba(255,255,255,.15)'}}>
                {PATIENT_SUB.map((item,i)=>(
                  <button key={i} className="sidebar-link" style={{fontSize:12.5,padding:'7px 10px',opacity:item.soon?.6:1}} onClick={()=>handlePatientSub(item)}>
                    <item.icon size={13}/>{item.label}
                    {item.soon&&<span className="sidebar-badge" style={{marginLeft:'auto',background:'rgba(255,255,255,.2)'}}>Soon</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Blood Requests — expandable */}
          <div className="sidebar-section">
            <button
              className={`sidebar-link ${isActive('/blood-requests')?'active':''}`}
              onClick={()=>{ if(loc.pathname!=='/blood-requests') nav('/blood-requests'); setBloodOpen(o=>!o); }}
              style={{justifyContent:'space-between'}}
            >
              <span style={{display:'flex',alignItems:'center',gap:9}}><Droplets size={15}/>Blood Requests</span>
              <ChevronDown size={13} style={{transform:bloodOpen?'rotate(180deg)':'none',transition:'transform .15s'}}/>
            </button>
            {bloodOpen&&(
              <div style={{marginLeft:10,paddingLeft:12,borderLeft:'1px solid rgba(255,255,255,.15)'}}>
                {BLOODREQ_SUB.map((item,i)=>(
                  <button key={i} className="sidebar-link" style={{fontSize:12.5,padding:'7px 10px',opacity:item.soon?.6:1}} onClick={()=>handleBloodReqSub(item)}>
                    <item.icon size={13}/>{item.label}
                    {item.soon&&<span className="sidebar-badge" style={{marginLeft:'auto',background:'rgba(255,255,255,.2)'}}>Soon</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Blood Testing (Patients) — expandable */}
          <div className="sidebar-section">
            <button
              className={`sidebar-link ${isActive('/blood-testing')?'active':''}`}
              onClick={()=>{ if(loc.pathname!=='/blood-testing') nav('/blood-testing'); setBtOpen(o=>!o); }}
              style={{justifyContent:'space-between'}}
            >
              <span style={{display:'flex',alignItems:'center',gap:9}}><FlaskConical size={15}/>Blood Testing</span>
              <ChevronDown size={13} style={{transform:btOpen?'rotate(180deg)':'none',transition:'transform .15s'}}/>
            </button>
            {btOpen&&(
              <div style={{marginLeft:10,paddingLeft:12,borderLeft:'1px solid rgba(255,255,255,.15)'}}>
                {BLOODTEST_SUB.map((item,i)=>(
                  <button key={i} className="sidebar-link" style={{fontSize:12.5,padding:'7px 10px',opacity:item.soon?.6:1}} onClick={()=>handleBtSub(item)}>
                    <item.icon size={13}/>{item.label}
                    {item.soon&&<span className="sidebar-badge" style={{marginLeft:'auto',background:'rgba(255,255,255,.2)'}}>Soon</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Donor Testing — expandable */}
          <div className="sidebar-section">
            <button
              className={`sidebar-link ${isActive('/donor-testing')?'active':''}`}
              onClick={()=>{ if(loc.pathname!=='/donor-testing') nav('/donor-testing'); setDtOpen(o=>!o); }}
              style={{justifyContent:'space-between'}}
            >
              <span style={{display:'flex',alignItems:'center',gap:9}}><Stethoscope size={15}/>Donor Testing</span>
              <ChevronDown size={13} style={{transform:dtOpen?'rotate(180deg)':'none',transition:'transform .15s'}}/>
            </button>
            {dtOpen&&(
              <div style={{marginLeft:10,paddingLeft:12,borderLeft:'1px solid rgba(255,255,255,.15)'}}>
                {DONORTEST_SUB.map((item,i)=>(
                  <button key={i} className="sidebar-link" style={{fontSize:12.5,padding:'7px 10px',opacity:item.soon?.6:1}} onClick={()=>handleDtSub(item)}>
                    <item.icon size={13}/>{item.label}
                    {item.soon&&<span className="sidebar-badge" style={{marginLeft:'auto',background:'rgba(255,255,255,.2)'}}>Soon</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Blood Banks (View Only) — expandable */}
          <div className="sidebar-section">
            <button
              className={`sidebar-link ${isActive('/blood-banks')?'active':''}`}
              onClick={()=>{ if(loc.pathname!=='/blood-banks') nav('/blood-banks'); setBbOpen(o=>!o); }}
              style={{justifyContent:'space-between'}}
            >
              <span style={{display:'flex',alignItems:'center',gap:9}}><Building2 size={15}/>Blood Banks</span>
              <ChevronDown size={13} style={{transform:bbOpen?'rotate(180deg)':'none',transition:'transform .15s'}}/>
            </button>
            {bbOpen&&(
              <div style={{marginLeft:10,paddingLeft:12,borderLeft:'1px solid rgba(255,255,255,.15)'}}>
                {BLOODBANK_SUB.map((item,i)=>(
                  <button key={i} className="sidebar-link" style={{fontSize:12.5,padding:'7px 10px',opacity:item.soon?.6:1}} onClick={()=>handleBbSub(item)}>
                    <item.icon size={13}/>{item.label}
                    {item.soon&&<span className="sidebar-badge" style={{marginLeft:'auto',background:'rgba(255,255,255,.2)'}}>Soon</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Blood Delivery — expandable, reuses Blood Requests dispatch/received data */}
          <div className="sidebar-section">
            <button
              className="sidebar-link"
              onClick={()=>setDvOpen(o=>!o)}
              style={{justifyContent:'space-between'}}
            >
              <span style={{display:'flex',alignItems:'center',gap:9}}><Truck size={15}/>Blood Delivery</span>
              <ChevronDown size={13} style={{transform:dvOpen?'rotate(180deg)':'none',transition:'transform .15s'}}/>
            </button>
            {dvOpen&&(
              <div style={{marginLeft:10,paddingLeft:12,borderLeft:'1px solid rgba(255,255,255,.15)'}}>
                {DELIVERY_SUB.map((item,i)=>(
                  <button key={i} className="sidebar-link" style={{fontSize:12.5,padding:'7px 10px',opacity:item.soon?.6:1}} onClick={()=>handleDvSub(item)}>
                    <item.icon size={13}/>{item.label}
                    {item.soon&&<span className="sidebar-badge" style={{marginLeft:'auto',background:'rgba(255,255,255,.2)'}}>Soon</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Hospital Staff — expandable */}
          <div className="sidebar-section">
            <button
              className={`sidebar-link ${isActive('/hospital-staff')?'active':''}`}
              onClick={()=>{ if(loc.pathname!=='/hospital-staff') nav('/hospital-staff'); setHsOpen(o=>!o); }}
              style={{justifyContent:'space-between'}}
            >
              <span style={{display:'flex',alignItems:'center',gap:9}}><Users size={15}/>Hospital Staff</span>
              <ChevronDown size={13} style={{transform:hsOpen?'rotate(180deg)':'none',transition:'transform .15s'}}/>
            </button>
            {hsOpen&&(
              <div style={{marginLeft:10,paddingLeft:12,borderLeft:'1px solid rgba(255,255,255,.15)'}}>
                {HSTAFF_SUB.map((item,i)=>(
                  <button key={i} className="sidebar-link" style={{fontSize:12.5,padding:'7px 10px',opacity:item.soon?.6:1}} onClick={()=>handleHsSub(item)}>
                    <item.icon size={13}/>{item.label}
                    {item.soon&&<span className="sidebar-badge" style={{marginLeft:'auto',background:'rgba(255,255,255,.2)'}}>Soon</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Appointments — expandable */}
          <div className="sidebar-section">
            <button
              className={`sidebar-link ${isActive('/appointments')?'active':''}`}
              onClick={()=>{ if(loc.pathname!=='/appointments') nav('/appointments'); setApOpen(o=>!o); }}
              style={{justifyContent:'space-between'}}
            >
              <span style={{display:'flex',alignItems:'center',gap:9}}><Calendar2 size={15}/>Appointments</span>
              <ChevronDown size={13} style={{transform:apOpen?'rotate(180deg)':'none',transition:'transform .15s'}}/>
            </button>
            {apOpen&&(
              <div style={{marginLeft:10,paddingLeft:12,borderLeft:'1px solid rgba(255,255,255,.15)'}}>
                {APPT_SUB.map((item,i)=>(
                  <button key={i} className="sidebar-link" style={{fontSize:12.5,padding:'7px 10px',opacity:item.soon?.6:1}} onClick={()=>handleApSub(item)}>
                    <item.icon size={13}/>{item.label}
                    {item.soon&&<span className="sidebar-badge" style={{marginLeft:'auto',background:'rgba(255,255,255,.2)'}}>Soon</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Emergency Management — expandable */}
          <div className="sidebar-section">
            <button
              className={`sidebar-link ${isActive('/emergency-management')?'active':''}`}
              onClick={()=>{ if(loc.pathname!=='/emergency-management') nav('/emergency-management'); setEmOpen(o=>!o); }}
              style={{justifyContent:'space-between'}}
            >
              <span style={{display:'flex',alignItems:'center',gap:9}}><AlertTriangle size={15}/>Emergency Management</span>
              <ChevronDown size={13} style={{transform:emOpen?'rotate(180deg)':'none',transition:'transform .15s'}}/>
            </button>
            {emOpen&&(
              <div style={{marginLeft:10,paddingLeft:12,borderLeft:'1px solid rgba(255,255,255,.15)'}}>
                {EM_SUB.map((item,i)=>(
                  <button key={i} className="sidebar-link" style={{fontSize:12.5,padding:'7px 10px',opacity:item.soon?.6:1}} onClick={()=>handleEmSub(item)}>
                    <item.icon size={13}/>{item.label}
                    {item.soon&&<span className="sidebar-badge" style={{marginLeft:'auto',background:'rgba(255,255,255,.2)'}}>Soon</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Blood Transfusion — expandable */}
          <div className="sidebar-section">
            <button
              className={`sidebar-link ${isActive('/blood-transfusion')?'active':''}`}
              onClick={()=>{ if(loc.pathname!=='/blood-transfusion') nav('/blood-transfusion'); setBtrOpen(o=>!o); }}
              style={{justifyContent:'space-between'}}
            >
              <span style={{display:'flex',alignItems:'center',gap:9}}><Droplets size={15}/>Blood Transfusion</span>
              <ChevronDown size={13} style={{transform:btrOpen?'rotate(180deg)':'none',transition:'transform .15s'}}/>
            </button>
            {btrOpen&&(
              <div style={{marginLeft:10,paddingLeft:12,borderLeft:'1px solid rgba(255,255,255,.15)'}}>
                {BT_SUB.map((item,i)=>(
                  <button key={i} className="sidebar-link" style={{fontSize:12.5,padding:'7px 10px',opacity:item.soon?.6:1}} onClick={()=>handleBtrSub(item)}>
                    <item.icon size={13}/>{item.label}
                    {item.soon&&<span className="sidebar-badge" style={{marginLeft:'auto',background:'rgba(255,255,255,.2)'}}>Soon</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Blood Verification — expandable */}
          <div className="sidebar-section">
            <button
              className={`sidebar-link ${isActive('/blood-verification')?'active':''}`}
              onClick={()=>{ if(loc.pathname!=='/blood-verification') nav('/blood-verification'); setBvOpen(o=>!o); }}
              style={{justifyContent:'space-between'}}
            >
              <span style={{display:'flex',alignItems:'center',gap:9}}><QrCode2 size={15}/>Blood Verification</span>
              <ChevronDown size={13} style={{transform:bvOpen?'rotate(180deg)':'none',transition:'transform .15s'}}/>
            </button>
            {bvOpen&&(
              <div style={{marginLeft:10,paddingLeft:12,borderLeft:'1px solid rgba(255,255,255,.15)'}}>
                {BV_SUB.map((item,i)=>(
                  <button key={i} className="sidebar-link" style={{fontSize:12.5,padding:'7px 10px',opacity:item.soon?.6:1}} onClick={()=>handleBvSub(item)}>
                    <item.icon size={13}/>{item.label}
                    {item.soon&&<span className="sidebar-badge" style={{marginLeft:'auto',background:'rgba(255,255,255,.2)'}}>Soon</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications — expandable */}
          <div className="sidebar-section">
            <button
              className={`sidebar-link ${isActive('/notifications')?'active':''}`}
              onClick={()=>{ if(loc.pathname!=='/notifications') nav('/notifications'); setNfOpen(o=>!o); }}
              style={{justifyContent:'space-between'}}
            >
              <span style={{display:'flex',alignItems:'center',gap:9}}><Bell2 size={15}/>Notifications</span>
              <ChevronDown size={13} style={{transform:nfOpen?'rotate(180deg)':'none',transition:'transform .15s'}}/>
            </button>
            {nfOpen&&(
              <div style={{marginLeft:10,paddingLeft:12,borderLeft:'1px solid rgba(255,255,255,.15)'}}>
                {NOTIF_SUB.map((item,i)=>(
                  <button key={i} className="sidebar-link" style={{fontSize:12.5,padding:'7px 10px',opacity:item.soon?.6:1}} onClick={()=>handleNfSub(item)}>
                    <item.icon size={13}/>{item.label}
                    {item.soon&&<span className="sidebar-badge" style={{marginLeft:'auto',background:'rgba(255,255,255,.2)'}}>Soon</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reports & Analytics — expandable */}
          <div className="sidebar-section">
            <button
              className={`sidebar-link ${isActive('/reports')?'active':''}`}
              onClick={()=>{ if(loc.pathname!=='/reports') nav('/reports'); setRpOpen(o=>!o); }}
              style={{justifyContent:'space-between'}}
            >
              <span style={{display:'flex',alignItems:'center',gap:9}}><BarChart3 size={15}/>Reports & Analytics</span>
              <ChevronDown size={13} style={{transform:rpOpen?'rotate(180deg)':'none',transition:'transform .15s'}}/>
            </button>
            {rpOpen&&(
              <div style={{marginLeft:10,paddingLeft:12,borderLeft:'1px solid rgba(255,255,255,.15)'}}>
                {RPT_SUB.map((item,i)=>(
                  <button key={i} className="sidebar-link" style={{fontSize:12.5,padding:'7px 10px'}} onClick={()=>handleRpSub(item)}>
                    <item.icon size={13}/>{item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Hospital Partnerships — expandable */}
          <div className="sidebar-section">
            <button
              className={`sidebar-link ${isActive('/hospital-partnerships')?'active':''}`}
              onClick={()=>{ if(loc.pathname!=='/hospital-partnerships') nav('/hospital-partnerships'); setHpOpen(o=>!o); }}
              style={{justifyContent:'space-between'}}
            >
              <span style={{display:'flex',alignItems:'center',gap:9}}><Handshake2 size={15}/>Hospital Partnerships</span>
              <ChevronDown size={13} style={{transform:hpOpen?'rotate(180deg)':'none',transition:'transform .15s'}}/>
            </button>
            {hpOpen&&(
              <div style={{marginLeft:10,paddingLeft:12,borderLeft:'1px solid rgba(255,255,255,.15)'}}>
                {HP_SUB.map((item,i)=>(
                  <button key={i} className="sidebar-link" style={{fontSize:12.5,padding:'7px 10px',opacity:item.soon?.6:1}} onClick={()=>handleHpSub(item)}>
                    <item.icon size={13}/>{item.label}
                    {item.soon&&<span className="sidebar-badge" style={{marginLeft:'auto',background:'rgba(255,255,255,.2)'}}>Soon</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {NAV.map(({section,items})=>(
            <div className="sidebar-section" key={section}>
              <div className="sidebar-sec-title">{section}</div>
              {items.map(({path,icon:Icon,label,badge})=>(
                <button key={path} className={`sidebar-link ${isActive(path)?'active':''}`} onClick={()=>nav(path)}>
                  <Icon size={15}/>{label}
                  {badge==='blood'&&<span className="sidebar-badge">New</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={logout} title="Logout">
            <div className="sidebar-avatar" style={{overflow:'hidden'}}>
              {hospital?.profilePicture?
                <img src={hospital.profilePicture} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                :(hospital?.hospitalName?.charAt(0)||'H')}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div className="sidebar-user-name">{hospital?.hospitalName||'Hospital'}</div>
              <div className="sidebar-user-role">Hospital Portal</div>
            </div>
            <LogOut size={14} color="#475569"/>
          </div>
        </div>
      </aside>

      <div className="main-wrap">
        <header className="topbar">
          <div>
            <div className="topbar-title">{titles[loc.pathname]||'Hospital Portal'}</div>
            <div className="topbar-sub">{subs[loc.pathname]||''}</div>
          </div>
          <div className="topbar-right">
            <button className="icon-btn" onClick={()=>nav('/notifications')} title="Notifications">
              <Bell size={16}/>
              <span className="dot"/>
            </button>
            <button className="icon-btn" onClick={()=>alert('Dark mode is coming soon.')} title="Dark mode">
              <Moon size={16}/>
            </button>
            <button className="icon-btn icon-btn-call" onClick={()=>nav('/emergency-management')} title="Emergency">
              <Phone size={16}/>
            </button>
            <button
              className="icon-btn icon-btn-warn"
              onClick={()=>{
                if(loc.pathname!=='/') nav('/#emergency-alerts');
                else {
                  const el=document.getElementById('emergency-alerts');
                  if(el) el.scrollIntoView({behavior:'smooth',block:'start'});
                }
              }}
              title="Emergency Alerts"
            >
              <AlertTriangle size={16}/>
            </button>

            <div style={{position:'relative'}}>
              <div
                style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',padding:'6px 10px 6px 6px',borderRadius:'var(--r-sm)',border:'1.5px solid var(--slate-200)'}}
                onClick={()=>setUserMenuOpen(o=>!o)}
              >
                <div className="sidebar-avatar" style={{background:'var(--primary-100)',border:'2px solid var(--primary-100)',color:'var(--primary)',overflow:'hidden'}}>
                  {hospital?.profilePicture?
                    <img src={hospital.profilePicture} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                    :(hospital?.hospitalName?.charAt(0)||'H')}
                </div>
                <div style={{lineHeight:1.2}}>
                  <div style={{fontSize:13,fontWeight:700,color:'var(--slate-900)'}}>{hospital?.hospitalName||'Hospital'}</div>
                  <div style={{fontSize:11,color:'var(--slate-500)'}}>Hospital Portal</div>
                </div>
                <ChevronDown size={14} color="var(--slate-400)" style={{transform:userMenuOpen?'rotate(180deg)':'none',transition:'transform .15s'}}/>
              </div>

              {userMenuOpen&&(
                <div style={{position:'absolute',right:0,top:'calc(100% + 8px)',background:'#fff',border:'1px solid var(--slate-200)',borderRadius:'var(--r-md)',boxShadow:'var(--sh-lg)',minWidth:180,overflow:'hidden',zIndex:60}}>
                  <button
                    style={{display:'flex',alignItems:'center',gap:9,width:'100%',padding:'11px 14px',background:'none',border:'none',fontSize:13,color:'var(--slate-700)',cursor:'pointer',textAlign:'left'}}
                    onClick={()=>{setUserMenuOpen(false);nav('/profile');}}
                  >
                    <Building2 size={14}/> Hospital Profile
                  </button>
                  <button
                    style={{display:'flex',alignItems:'center',gap:9,width:'100%',padding:'11px 14px',background:'none',border:'none',fontSize:13,color:'var(--red-600)',cursor:'pointer',textAlign:'left',borderTop:'1px solid var(--slate-100)'}}
                    onClick={()=>{setUserMenuOpen(false);logout();}}
                  >
                    <LogOut size={14}/> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="page-wrap"><Outlet/></main>
      </div>
    </div>
  );
}