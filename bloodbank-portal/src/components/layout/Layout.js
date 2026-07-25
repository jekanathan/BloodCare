import React from 'react';
import {Outlet,useLocation,useNavigate} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';
import {LayoutDashboard,Package,FileText,Droplet,Users,Megaphone,FlaskConical,Building2,Bell,LogOut} from 'lucide-react';

const NAV=[
  {sec:'Overview',items:[{path:'/',icon:LayoutDashboard,label:'Dashboard'}]},
  {sec:'Operations',items:[
    {path:'/inventory',         icon:Package,       label:'Blood Inventory',   badge:'stock'},
    {path:'/hospital-requests', icon:FileText,      label:'Hospital Requests', badge:'req'},
    {path:'/donations',         icon:Droplet,       label:'Donations'},
    {path:'/blood-testing',     icon:FlaskConical,  label:'Blood Testing'},
  ]},
  {sec:'Donors & Campaigns',items:[
    {path:'/donors',    icon:Users,     label:'Donor Management'},
    {path:'/campaigns', icon:Megaphone, label:'Campaigns'},
  ]},
  {sec:'Settings',items:[
    {path:'/profile',icon:Building2,label:'Bank Profile'},
  ]},
];

const TITLES={
  '/':'Dashboard','/inventory':'Blood Inventory','/hospital-requests':'Hospital Requests',
  '/donations':'Donations','/donors':'Donor Management','/campaigns':'Campaigns',
  '/blood-testing':'Blood Testing','/profile':'Bank Profile',
};
const SUBS={
  '/':'Blood bank operations overview',
  '/inventory':'Manage blood stock levels',
  '/hospital-requests':'Review & fulfil hospital blood requests',
  '/donations':'Track incoming blood donations',
  '/donors':'Manage registered donors',
  '/campaigns':'Blood donation campaign management',
  '/blood-testing':'Blood unit testing & screening results',
  '/profile':'Manage blood bank information',
};

export default function Layout(){
  const {bank,logout}=useAuth();
  const loc=useLocation();
  const nav=useNavigate();
  const isA=p=>p==='/'?loc.pathname==='/':loc.pathname.startsWith(p);

  return(
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sb-logo">
          <div className="sb-logo-icon"><Droplet size={18} color="#fff"/></div>
          <div>
            <span className="sb-logo-text">Blood<span>Care</span></span>
            <span className="sb-badge">Blood Bank</span>
          </div>
        </div>
        <nav className="sb-nav">
          {NAV.map(({sec,items})=>(
            <div className="sb-sec" key={sec}>
              <div className="sb-sec-title">{sec}</div>
              {items.map(({path,icon:Icon,label,badge})=>(
                <button key={path} className={`sb-link ${isA(path)?'active':''}`} onClick={()=>nav(path)}>
                  <Icon size={15}/>{label}
                  {badge==='req'&&<span className="sb-badge-pill">5</span>}
                  {badge==='stock'&&<span className="sb-badge-pill" style={{background:'var(--amber-500)'}}>⚠</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="sb-footer">
          <div className="sb-user" onClick={logout}>
            <div className="sb-avatar">{bank?.bankName?.charAt(0)||'B'}</div>
            <div style={{flex:1,minWidth:0}}>
              <div className="sb-user-name">{bank?.bankName||'Blood Bank'}</div>
              <div className="sb-user-role">Blood Bank Portal</div>
            </div>
            <LogOut size={14} color="#475569"/>
          </div>
        </div>
      </aside>
      <div className="main-wrap">
        <header className="topbar">
          <div>
            <div className="topbar-title">{TITLES[loc.pathname]||'Blood Bank'}</div>
            <div className="topbar-sub">{SUBS[loc.pathname]||''}</div>
          </div>
          <div className="topbar-right">
            <button className="icon-btn"><Bell size={16}/><span className="dot"/></button>
            <div className="sb-avatar" style={{cursor:'pointer'}} onClick={()=>nav('/profile')}>{bank?.bankName?.charAt(0)||'B'}</div>
          </div>
        </header>
        <main className="page-wrap"><Outlet/></main>
      </div>
    </div>
  );
}
