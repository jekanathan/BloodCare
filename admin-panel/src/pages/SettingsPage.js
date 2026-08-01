import React, { useState, useEffect } from 'react';
import { Settings, Globe, Mail, Phone, Palette, Shield, Bell, Database, Save, Eye, EyeOff, CheckCircle, Upload, RefreshCw, Moon, Sun, Monitor } from 'lucide-react';
import api from '../utils/api';

export default function SettingsPage() {
  const [tab, setTab]           = useState('general');
  const [saved, setSaved]       = useState(false);
  const [saveError, setSaveError] = useState('');
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [showPass, setShowPass] = useState({});
  const [theme, setTheme]       = useState('light');
  const [lang, setLang]         = useState('english');
  const [timezone, setTimezone] = useState('Asia/Colombo');
  const [emailSettings, setEmailSettings] = useState({
    host:'smtp.gmail.com', port:'587', user:'noreply@bloodcare.lk', pass:'', from:'BloodCare System', ssl:true
  });
  const [smsSettings, setSmsSettings] = useState({
    provider:'Dialog', apiKey:'', senderId:'BLOODCARE', enabled:true
  });
  const [notifSettings, setNotifSettings] = useState({
    emailAlerts:true, smsAlerts:true, pushAlerts:true,
    emergencyEmail:true, emergencySMS:true,
    dailyReport:true, weeklyReport:true, monthlyReport:true,
    donorApproval:true, hospitalApproval:true, lowStock:true,
  });

  // ── General settings — now backed by real DB persistence ──────────────────
  const [generalSettings, setGeneralSettings] = useState({
    siteName:'BloodCare',
    siteUrl:'https://bloodcare.lk',
    adminEmail:'admin@bloodcare.lk',
    emergencyHotline:'1919',
    address:'123, Health Care Road, Colombo, Sri Lanka',
    maintenanceMode:false,
    registrationOpen:true,
    autoApprove:false,
  });

  useEffect(() => {
    setLoading(true);
    api.get('/settings')
      .then(res => {
        const s = res.data?.settings;
        if (s) {
          setGeneralSettings({
            siteName: s.siteName, siteUrl: s.siteUrl, adminEmail: s.adminEmail,
            emergencyHotline: s.emergencyHotline, address: s.address,
            maintenanceMode: s.maintenanceMode, registrationOpen: s.registrationOpen,
            autoApprove: s.autoApprove,
          });
        }
      })
      .catch(err => console.error('Load settings error:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = () => {
    setSaving(true);
    setSaveError('');
    api.put('/settings', generalSettings)
      .then(() => {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      })
      .catch(err => {
        console.error('Save settings error:', err);
        setSaveError(err.response?.data?.message || 'Failed to save settings');
      })
      .finally(() => setSaving(false));
  };

  const TABS = [
    {key:'general',      label:'⚙️ General',      },
    {key:'website',      label:'🌐 Website',       },
    {key:'email',        label:'📧 Email',         },
    {key:'sms',          label:'📱 SMS Gateway',   },
    {key:'notifications',label:'🔔 Notifications', },
    {key:'theme',        label:'🎨 Theme',         },
    {key:'security',     label:'🔒 Security',      },
    {key:'backup',       label:'💾 Backup',        },
  ];

  return (
    <div className="animate-fade">

      {/* Save Success Toast */}
      {saved && (
        <div className="toast">
          <CheckCircle size={18} color="var(--green-500)"/>
          <span style={{fontSize:13,fontWeight:600,color:'var(--slate-900)'}}>Settings saved successfully!</span>
        </div>
      )}
      {saveError && (
        <div className="toast" style={{background:'#FEE2E8'}}>
          <span style={{fontSize:13,fontWeight:600,color:'var(--red-600)'}}>⚠️ {saveError}</span>
        </div>
      )}

      <div className="page-header">
        <div className="page-header-left">
          <h1>System Settings</h1>
          <p>Configure system preferences and integrations</p>
        </div>
        <button className="btn-add" onClick={handleSave} disabled={saving}>
          <Save size={15}/> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'220px 1fr',gap:20}}>

        {/* Sidebar Nav */}
        <div className="card" style={{height:'fit-content',padding:'8px'}}>
          {TABS.map(t=>(
            <button key={t.key} onClick={()=>setTab(t.key)} style={{
              display:'block',width:'100%',textAlign:'left',
              padding:'10px 14px',border:'none',cursor:'pointer',
              borderRadius:'var(--r-sm)',fontSize:13,fontWeight:600,
              fontFamily:'var(--font-body)',marginBottom:2,
              background:tab===t.key?'var(--red-50)':'transparent',
              color:tab===t.key?'var(--red-600)':'var(--slate-600)',
              borderLeft:tab===t.key?'3px solid var(--red-500)':'3px solid transparent',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Content */}
        <div style={{display:'flex',flexDirection:'column',gap:20}}>

          {/* GENERAL */}
          {tab==='general' && (
            <div className="card">
              <div className="card-header"><div className="card-title">General Settings</div></div>
              <div className="card-body">
                {loading ? (
                  <div className="empty-state" style={{padding:'30px 0'}}><p>Loading settings...</p></div>
                ) : (
                <>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                  {[
                    {label:'Site Name',         key:'siteName',        type:'text',  placeholder:'BloodCare'},
                    {label:'Site URL',          key:'siteUrl',         type:'url',   placeholder:'https://bloodcare.lk'},
                    {label:'Admin Email',       key:'adminEmail',      type:'email', placeholder:'admin@bloodcare.lk'},
                    {label:'Emergency Hotline', key:'emergencyHotline',type:'text',  placeholder:'1919'},
                    {label:'Address',           key:'address',         type:'text',  placeholder:'Address', span:2},
                  ].map(({label,key,type,placeholder,span})=>(
                    <div key={key} style={{gridColumn:span?`span ${span}`:'auto'}}>
                      <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>{label}</label>
                      <input type={type} value={generalSettings[key]}
                        onChange={e=>setGeneralSettings(p=>({...p,[key]:e.target.value}))}
                        placeholder={placeholder}
                        style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,fontFamily:'var(--font-body)',outline:'none'}}/>
                    </div>
                  ))}
                </div>

                <div style={{marginTop:20,display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
                  {[
                    {label:'Maintenance Mode',    key:'maintenanceMode',  desc:'Take site offline for maintenance'},
                    {label:'Open Registration',   key:'registrationOpen', desc:'Allow new donor registrations'},
                    {label:'Auto-Approve Donors', key:'autoApprove',      desc:'Automatically approve new donors'},
                  ].map(({label,key,desc})=>(
                    <div key={key} style={{padding:'14px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',background:'var(--slate-50)'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                        <span style={{fontSize:13,fontWeight:600,color:'var(--slate-900)'}}>{label}</span>
                        <div onClick={()=>setGeneralSettings(p=>({...p,[key]:!p[key]}))}
                          style={{width:40,height:22,borderRadius:11,background:generalSettings[key]?'var(--green-500)':'var(--slate-300)',cursor:'pointer',position:'relative',transition:'background .2s'}}>
                          <div style={{position:'absolute',top:3,left:generalSettings[key]?20:3,width:16,height:16,borderRadius:'50%',background:'#fff',transition:'left .2s'}}/>
                        </div>
                      </div>
                      <div style={{fontSize:11,color:'var(--slate-400)'}}>{desc}</div>
                    </div>
                  ))}
                </div>
                <div style={{marginTop:14,fontSize:11,color:'var(--slate-400)'}}>
                  💡 These 3 toggles are saved to the database and take effect immediately — no restart needed.
                </div>
                </>
                )}
              </div>
            </div>
          )}

          {/* WEBSITE */}
          {tab==='website' && (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <div className="card">
                <div className="card-header"><div className="card-title">Logo & Branding</div></div>
                <div className="card-body">
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
                    {['Main Logo','Favicon'].map(item=>(
                      <div key={item}>
                        <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:10}}>{item}</label>
                        <div style={{border:'2px dashed var(--slate-200)',borderRadius:'var(--r-md)',padding:'24px',textAlign:'center',cursor:'pointer',background:'var(--slate-50)'}}>
                          <Upload size={24} style={{margin:'0 auto 8px',color:'var(--slate-400)'}}/>
                          <div style={{fontSize:13,color:'var(--slate-500)',marginBottom:4}}>Click to upload</div>
                          <div style={{fontSize:11,color:'var(--slate-400)'}}>PNG, JPG up to 2MB</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="card-header"><div className="card-title">Banner Settings</div></div>
                <div className="card-body">
                  <div style={{display:'grid',gap:14}}>
                    {[
                      {label:'Banner Title',    placeholder:'Welcome to BloodCare'},
                      {label:'Banner Subtitle', placeholder:'Connecting Donors, Hospitals & Blood Banks'},
                      {label:'Banner CTA Text', placeholder:'Donate Blood Now'},
                    ].map(({label,placeholder})=>(
                      <div key={label}>
                        <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>{label}</label>
                        <input type="text" placeholder={placeholder}
                          style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,fontFamily:'var(--font-body)',outline:'none'}}/>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* EMAIL */}
          {tab==='email' && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">Email Settings (SMTP)</div>
                <button style={{padding:'7px 14px',background:'var(--blue-100)',color:'var(--blue-600)',border:'none',borderRadius:'var(--r-sm)',fontSize:12,fontWeight:600,cursor:'pointer'}}>
                  Test Connection
                </button>
              </div>
              <div className="card-body">
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                  {[
                    {label:'SMTP Host',   key:'host', type:'text',  placeholder:'smtp.gmail.com'},
                    {label:'SMTP Port',   key:'port', type:'number',placeholder:'587'},
                    {label:'Username',    key:'user', type:'email', placeholder:'noreply@bloodcare.lk'},
                    {label:'From Name',   key:'from', type:'text',  placeholder:'BloodCare System'},
                  ].map(({label,key,type,placeholder})=>(
                    <div key={key}>
                      <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>{label}</label>
                      <input type={type} value={emailSettings[key]}
                        onChange={e=>setEmailSettings(p=>({...p,[key]:e.target.value}))}
                        placeholder={placeholder}
                        style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,fontFamily:'var(--font-body)',outline:'none'}}/>
                    </div>
                  ))}
                  <div style={{gridColumn:'span 2'}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>SMTP Password</label>
                    <div style={{position:'relative'}}>
                      <input type={showPass.email?'text':'password'} value={emailSettings.pass}
                        onChange={e=>setEmailSettings(p=>({...p,pass:e.target.value}))}
                        placeholder="Enter SMTP password"
                        style={{width:'100%',padding:'9px 40px 9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,fontFamily:'var(--font-body)',outline:'none'}}/>
                      <button onClick={()=>setShowPass(p=>({...p,email:!p.email}))}
                        style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'var(--slate-400)'}}>
                        {showPass.email?<EyeOff size={16}/>:<Eye size={16}/>}
                      </button>
                    </div>
                  </div>
                </div>
                <div style={{marginTop:16,padding:'14px',background:'var(--blue-50)',border:'1px solid var(--blue-100)',borderRadius:'var(--r-sm)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:'var(--blue-700)'}}>SSL/TLS Encryption</div>
                    <div style={{fontSize:11,color:'var(--blue-500)'}}>Enable secure email transmission</div>
                  </div>
                  <div onClick={()=>setEmailSettings(p=>({...p,ssl:!p.ssl}))}
                    style={{width:40,height:22,borderRadius:11,background:emailSettings.ssl?'var(--green-500)':'var(--slate-300)',cursor:'pointer',position:'relative',transition:'background .2s'}}>
                    <div style={{position:'absolute',top:3,left:emailSettings.ssl?20:3,width:16,height:16,borderRadius:'50%',background:'#fff',transition:'left .2s'}}/>
                  </div>
                </div>
                <div style={{marginTop:16}}>
                  <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Send Test Email To</label>
                  <div style={{display:'flex',gap:10}}>
                    <input type="email" placeholder="test@example.com"
                      style={{flex:1,padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,fontFamily:'var(--font-body)',outline:'none'}}/>
                    <button style={{padding:'9px 20px',background:'var(--blue-600)',color:'#fff',border:'none',borderRadius:'var(--r-sm)',fontSize:13,fontWeight:600,cursor:'pointer'}}>
                      Send Test
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SMS */}
          {tab==='sms' && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">SMS Gateway Settings</div>
                <div onClick={()=>setSmsSettings(p=>({...p,enabled:!p.enabled}))}
                  style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
                  <span style={{fontSize:12,fontWeight:600,color:'var(--slate-600)'}}>SMS {smsSettings.enabled?'Enabled':'Disabled'}</span>
                  <div style={{width:40,height:22,borderRadius:11,background:smsSettings.enabled?'var(--green-500)':'var(--slate-300)',position:'relative',transition:'background .2s'}}>
                    <div style={{position:'absolute',top:3,left:smsSettings.enabled?20:3,width:16,height:16,borderRadius:'50%',background:'#fff',transition:'left .2s'}}/>
                  </div>
                </div>
              </div>
              <div className="card-body">
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>SMS Provider</label>
                    <select value={smsSettings.provider} onChange={e=>setSmsSettings(p=>({...p,provider:e.target.value}))}
                      style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,fontFamily:'var(--font-body)',outline:'none',background:'#fff'}}>
                      {['Dialog','Mobitel','Hutch','Airtel','Custom API'].map(p=><option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Sender ID</label>
                    <input type="text" value={smsSettings.senderId}
                      onChange={e=>setSmsSettings(p=>({...p,senderId:e.target.value}))}
                      placeholder="BLOODCARE"
                      style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,fontFamily:'var(--font-body)',outline:'none'}}/>
                  </div>
                  <div style={{gridColumn:'span 2'}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>API Key</label>
                    <div style={{position:'relative'}}>
                      <input type={showPass.sms?'text':'password'} value={smsSettings.apiKey}
                        onChange={e=>setSmsSettings(p=>({...p,apiKey:e.target.value}))}
                        placeholder="Enter API key"
                        style={{width:'100%',padding:'9px 40px 9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,fontFamily:'var(--font-body)',outline:'none'}}/>
                      <button onClick={()=>setShowPass(p=>({...p,sms:!p.sms}))}
                        style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'var(--slate-400)'}}>
                        {showPass.sms?<EyeOff size={16}/>:<Eye size={16}/>}
                      </button>
                    </div>
                  </div>
                </div>

                {/* SMS Templates */}
                <div style={{marginTop:20}}>
                  <div style={{fontSize:13,fontWeight:700,color:'var(--slate-900)',marginBottom:12}}>SMS Templates</div>
                  {[
                    {label:'Emergency Alert',     template:'BLOODCARE EMERGENCY: {BloodGroup} blood needed at {Hospital}. Call {Phone} immediately.'},
                    {label:'Donor Approval',      template:'Dear {Name}, your BloodCare donor registration has been approved. Thank you!'},
                    {label:'Donation Reminder',   template:'Dear {Name}, you are now eligible to donate blood. Visit nearest blood bank today!'},
                    {label:'Request Fulfillment', template:'Your blood request for {Units} units of {BloodGroup} has been fulfilled. Contact: {Phone}'},
                  ].map(({label,template})=>(
                    <div key={label} style={{marginBottom:12}}>
                      <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:4}}>{label}</label>
                      <textarea defaultValue={template} rows={2}
                        style={{width:'100%',padding:'8px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:12,fontFamily:'var(--font-body)',outline:'none',resize:'vertical'}}/>
                    </div>
                  ))}
                </div>

                <div style={{marginTop:8}}>
                  <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Test SMS</label>
                  <div style={{display:'flex',gap:10}}>
                    <input type="tel" placeholder="07X XXXXXXX"
                      style={{flex:1,padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,fontFamily:'var(--font-body)',outline:'none'}}/>
                    <button style={{padding:'9px 20px',background:'var(--green-600)',color:'#fff',border:'none',borderRadius:'var(--r-sm)',fontSize:13,fontWeight:600,cursor:'pointer'}}>
                      Send Test SMS
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {tab==='notifications' && (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              {[
                {title:'Alert Channels', items:[
                  {key:'emailAlerts', label:'Email Alerts',       desc:'Send alerts via email'},
                  {key:'smsAlerts',   label:'SMS Alerts',         desc:'Send alerts via SMS'},
                  {key:'pushAlerts',  label:'Push Notifications', desc:'Send push notifications to app'},
                ]},
                {title:'Emergency Notifications', items:[
                  {key:'emergencyEmail', label:'Emergency Email', desc:'Email alerts for emergency requests'},
                  {key:'emergencySMS',   label:'Emergency SMS',   desc:'SMS alerts for emergency requests'},
                ]},
                {title:'Report Notifications', items:[
                  {key:'dailyReport',   label:'Daily Report',   desc:'Send daily summary report'},
                  {key:'weeklyReport',  label:'Weekly Report',  desc:'Send weekly summary report'},
                  {key:'monthlyReport', label:'Monthly Report', desc:'Send monthly summary report'},
                ]},
                {title:'System Notifications', items:[
                  {key:'donorApproval',   label:'Donor Approval',   desc:'Notify when donor needs approval'},
                  {key:'hospitalApproval',label:'Hospital Approval', desc:'Notify when hospital needs approval'},
                  {key:'lowStock',        label:'Low Stock Alert',   desc:'Alert when blood stock is critically low'},
                ]},
              ].map(({title,items})=>(
                <div key={title} className="card">
                  <div className="card-header"><div className="card-title">{title}</div></div>
                  <div className="card-body">
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                      {items.map(({key,label,desc})=>(
                        <div key={key} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 14px',background:'var(--slate-50)',borderRadius:'var(--r-sm)',border:'1px solid var(--slate-200)'}}>
                          <div>
                            <div style={{fontSize:13,fontWeight:600,color:'var(--slate-900)'}}>{label}</div>
                            <div style={{fontSize:11,color:'var(--slate-400)',marginTop:2}}>{desc}</div>
                          </div>
                          <div onClick={()=>setNotifSettings(p=>({...p,[key]:!p[key]}))}
                            style={{width:40,height:22,borderRadius:11,background:notifSettings[key]?'var(--green-500)':'var(--slate-300)',cursor:'pointer',position:'relative',transition:'background .2s',flexShrink:0}}>
                            <div style={{position:'absolute',top:3,left:notifSettings[key]?20:3,width:16,height:16,borderRadius:'50%',background:'#fff',transition:'left .2s'}}/>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* THEME */}
          {tab==='theme' && (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <div className="card">
                <div className="card-header"><div className="card-title">Theme Mode</div></div>
                <div className="card-body">
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:24}}>
                    {[
                      {key:'light',  label:'Light Mode',  icon:<Sun size={24}/>,     bg:'#fff',     border:'var(--slate-200)'},
                      {key:'dark',   label:'Dark Mode',   icon:<Moon size={24}/>,    bg:'#0F172A',  border:'var(--slate-700)'},
                      {key:'system', label:'System Mode', icon:<Monitor size={24}/>, bg:'linear-gradient(135deg,#fff 50%,#0F172A 50%)', border:'var(--slate-300)'},
                    ].map(({key,label,icon,bg,border})=>(
                      <div key={key} onClick={()=>setTheme(key)} style={{
                        padding:'20px',borderRadius:'var(--r-md)',cursor:'pointer',textAlign:'center',
                        border:`2px solid ${theme===key?'var(--red-500)':border}`,
                        background:theme===key?'var(--red-50)':'#fff',
                        transition:'all .2s',
                      }}>
                        <div style={{width:60,height:40,borderRadius:8,background:bg,border:'1px solid var(--slate-200)',margin:'0 auto 12px',display:'flex',alignItems:'center',justifyContent:'center',color:key==='dark'?'#fff':'var(--slate-600)'}}>{icon}</div>
                        <div style={{fontSize:13,fontWeight:600,color:theme===key?'var(--red-600)':'var(--slate-700)'}}>{label}</div>
                        {theme===key && <div style={{fontSize:11,color:'var(--red-500)',marginTop:4}}>● Active</div>}
                      </div>
                    ))}
                  </div>

                  {/* Language */}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                    <div>
                      <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Language</label>
                      <select value={lang} onChange={e=>setLang(e.target.value)}
                        style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,fontFamily:'var(--font-body)',outline:'none',background:'#fff'}}>
                        <option value="english">English</option>
                        <option value="sinhala">සිංහල</option>
                        <option value="tamil">தமிழ்</option>
                      </select>
                    </div>
                    <div>
                      <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Timezone</label>
                      <select value={timezone} onChange={e=>setTimezone(e.target.value)}
                        style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,fontFamily:'var(--font-body)',outline:'none',background:'#fff'}}>
                        <option value="Asia/Colombo">Asia/Colombo (UTC+5:30)</option>
                        <option value="UTC">UTC</option>
                        <option value="Asia/Kolkata">Asia/Kolkata (UTC+5:30)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Color Scheme */}
              <div className="card">
                <div className="card-header"><div className="card-title">Color Scheme</div></div>
                <div className="card-body">
                  <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                    {[
                      {name:'Blood Red',    primary:'#C41E3A', active:true},
                      {name:'Ocean Blue',   primary:'#2563EB', active:false},
                      {name:'Forest Green', primary:'#16A34A', active:false},
                      {name:'Royal Purple', primary:'#7C3AED', active:false},
                      {name:'Sunset Orange',primary:'#EA580C', active:false},
                      {name:'Dark Teal',    primary:'#0F766E', active:false},
                    ].map(({name,primary,active})=>(
                      <div key={name} style={{textAlign:'center',cursor:'pointer'}}>
                        <div style={{width:44,height:44,borderRadius:'50%',background:primary,margin:'0 auto 6px',border:active?`3px solid ${primary}`:'3px solid transparent',outline:active?`2px solid white`:'none',boxShadow:active?`0 0 0 3px ${primary}40`:'none'}}/>
                        <div style={{fontSize:11,color:'var(--slate-600)',fontWeight:active?700:400}}>{name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECURITY */}
          {tab==='security' && (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <div className="card">
                <div className="card-header"><div className="card-title">Password Policy</div></div>
                <div className="card-body">
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                    <div>
                      <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Minimum Password Length</label>
                      <input type="number" defaultValue={8} min={6} max={20}
                        style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,fontFamily:'var(--font-body)',outline:'none'}}/>
                    </div>
                    <div>
                      <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--slate-600)',marginBottom:6}}>Session Timeout (minutes)</label>
                      <input type="number" defaultValue={60}
                        style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--slate-200)',borderRadius:'var(--r-sm)',fontSize:13,fontFamily:'var(--font-body)',outline:'none'}}/>
                    </div>
                  </div>
                  <div style={{marginTop:16,display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                    {[
                      {label:'Require Uppercase',     desc:'Must contain uppercase letter'},
                      {label:'Require Numbers',        desc:'Must contain numbers'},
                      {label:'Require Special Chars',  desc:'Must contain special characters'},
                      {label:'Two-Factor Auth (2FA)',  desc:'Enable 2FA for admin accounts'},
                    ].map(({label,desc})=>(
                      <div key={label} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 14px',background:'var(--slate-50)',borderRadius:'var(--r-sm)',border:'1px solid var(--slate-200)'}}>
                        <div>
                          <div style={{fontSize:13,fontWeight:600,color:'var(--slate-900)'}}>{label}</div>
                          <div style={{fontSize:11,color:'var(--slate-400)',marginTop:1}}>{desc}</div>
                        </div>
                        <div style={{width:40,height:22,borderRadius:11,background:'var(--green-500)',cursor:'pointer',position:'relative'}}>
                          <div style={{position:'absolute',top:3,left:20,width:16,height:16,borderRadius:'50%',background:'#fff'}}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header"><div className="card-title">Login Activity Log</div></div>
                <div style={{padding:'14px 20px',fontSize:12,color:'var(--slate-500)'}}>
                  📋 Real login logs are now tracked separately — see <b>Security → Login Logs</b> in the sidebar for the full live table.
                </div>
              </div>
            </div>
          )}

          {/* BACKUP */}
          {tab==='backup' && (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <div className="card">
                <div className="card-header"><div className="card-title">Database Backup</div></div>
                <div className="card-body">
                  <div className="empty-state" style={{padding:'30px 0'}}>
                    <p>Backup & Restore tools are being built — see <b>Security → Backup & Restore</b> in the sidebar for updates.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div style={{display:'flex',justifyContent:'flex-end',gap:10}}>
            <button style={{padding:'10px 24px',background:'var(--slate-100)',color:'var(--slate-700)',border:'none',borderRadius:'var(--r-sm)',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'var(--font-body)'}}>
              Reset to Default
            </button>
            <button className="btn-add" style={{padding:'10px 28px',fontSize:14}} onClick={handleSave} disabled={saving}>
              <Save size={15}/> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}