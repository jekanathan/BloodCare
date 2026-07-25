import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AboutPage() {
  const navigate = useNavigate();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.body.style.background = dark ? '#0a0a0a' : '';
    document.body.style.color = dark ? '#fff' : '';
  }, [dark]);

  const VALUES = [
    {icon:'❤️', title:'Compassion',  desc:'Every decision is driven by care for human life.'},
    {icon:'⚡', title:'Speed',       desc:'Rapid response in emergency blood situations.'},
    {icon:'🛡️', title:'Trust',      desc:'Verified donors, banks, and institutions only.'},
    {icon:'💡', title:'Innovation',  desc:'AI-powered matching and smart coordination.'},
    {icon:'🌍', title:'Inclusivity', desc:'Serving all communities across Sri Lanka.'},
    {icon:'🤝', title:'Community',   desc:'Building a network of life-saving heroes.'},
  ];

  const STEPS = [
    {num:'01', icon:'👤', title:'Register',         desc:'Create your donor or patient account in under 2 minutes.'},
    {num:'02', icon:'🔍', title:'Request / Donate', desc:'Patients request blood; donors receive smart match alerts.'},
    {num:'03', icon:'🤖', title:'AI Matching',      desc:'System finds the best match by blood type, location & urgency.'},
    {num:'04', icon:'📍', title:'Live Tracking',    desc:'Real-time GPS tracking from blood bank to hospital.'},
  ];

  const USERS = [
    {icon:'🩸', title:'Blood Donors',    color:'#C41E3A', bg:'rgba(196,30,58,.1)',  desc:'Register, book appointments, and track donation history with ease.'},
    {icon:'🏥', title:'Hospitals',       color:'#2563EB', bg:'rgba(37,99,235,.1)',  desc:'Request blood, monitor request status, and manage emergencies efficiently.'},
    {icon:'🏦', title:'Blood Banks',     color:'#7C3AED', bg:'rgba(124,58,237,.1)', desc:'Maintain blood inventory, laboratory records, and ensure safe blood storage.'},
    {icon:'⚙️', title:'Administrators', color:'#16A34A', bg:'rgba(22,163,74,.1)',  desc:'Manage users, approvals, reports, hospitals, and blood banks.'},
  ];

  // Theme colors
  const t = {
    bg:       dark ? '#0a0a0a'             : '#F8FAFC',
    bg2:      dark ? '#0d0d0d'             : '#fff',
    bg3:      dark ? '#111'                : '#F8FAFC',
    card:     dark ? '#111'                : '#fff',
    border:   dark ? 'rgba(255,255,255,.08)' : '#F1F5F9',
    text:     dark ? '#F1F5F9'             : '#0F172A',
    text2:    dark ? '#94A3B8'             : '#475569',
    text3:    dark ? '#64748B'             : '#64748B',
    shadow:   dark ? '0 1px 4px rgba(0,0,0,.4)' : '0 1px 4px rgba(0,0,0,.06)',
  };

  const cardStyle = {
    background: t.card,
    border: `1px solid ${t.border}`,
    borderRadius: 16,
    boxShadow: t.shadow,
  };

  return (
    <div style={{background:t.bg,color:t.text,fontFamily:"'Inter',-apple-system,sans-serif",minHeight:'100vh',transition:'background .3s,color .3s'}}>

      {/* ===== STYLES ===== */}
      <style>{`
        /* 3D Card Effects */
        .card-3d {
          transition: transform .35s ease, box-shadow .35s ease !important;
          transform-style: preserve-3d;
          will-change: transform;
        }
        .card-3d:hover {
          transform: perspective(900px) rotateX(-5deg) rotateY(5deg) translateY(-10px) scale(1.02) !important;
          box-shadow: 10px 20px 48px rgba(196,30,58,.2), 0 4px 12px rgba(0,0,0,.1) !important;
        }
        .card-3d-blue:hover {
          transform: perspective(900px) rotateX(-5deg) rotateY(-5deg) translateY(-10px) scale(1.02) !important;
          box-shadow: -10px 20px 48px rgba(37,99,235,.2), 0 4px 12px rgba(0,0,0,.1) !important;
        }
        .card-value {
          transition: transform .3s ease, box-shadow .3s ease, border-color .2s !important;
          transform-style: preserve-3d;
        }
        .card-value:hover {
          transform: perspective(700px) rotateX(-6deg) rotateY(6deg) translateY(-8px) scale(1.04) !important;
          box-shadow: 8px 14px 32px rgba(196,30,58,.18) !important;
          border-color: #C41E3A !important;
        }
        .card-user {
          transition: transform .3s ease, box-shadow .3s ease !important;
          transform-style: preserve-3d;
        }
        .card-user:hover {
          transform: perspective(800px) rotateX(-5deg) translateY(-10px) scale(1.02) !important;
        }
        .card-step {
          transition: transform .3s ease !important;
        }
        .card-step:hover {
          transform: translateY(-8px) scale(1.03) !important;
        }
        .card-step:hover .step-icon {
          transform: perspective(500px) rotateY(20deg) scale(1.15) !important;
          box-shadow: -8px 10px 28px rgba(196,30,58,.45) !important;
        }
        .step-icon {
          transition: transform .3s ease, box-shadow .3s ease !important;
        }
        .card-stat {
          transition: transform .25s ease !important;
        }
        .card-stat:hover {
          transform: translateY(-6px) scale(1.06) !important;
        }
        .card-dev {
          transition: transform .4s ease, box-shadow .4s ease !important;
        }
        .card-dev:hover {
          transform: perspective(1100px) rotateX(-3deg) rotateY(2deg) translateY(-8px) !important;
          box-shadow: 14px 28px 56px rgba(196,30,58,.18) !important;
        }
        .card-contact {
          transition: transform .3s ease, box-shadow .3s ease !important;
        }
        .card-contact:hover {
          transform: perspective(800px) rotateX(-5deg) translateY(-10px) scale(1.02) !important;
          box-shadow: 0 20px 48px rgba(196,30,58,.25) !important;
        }
        .nav-link {
          transition: color .2s !important;
        }
        .theme-btn {
          transition: all .2s !important;
        }
        .theme-btn:hover {
          transform: scale(1.1) !important;
        }
      `}</style>

      {/* ===== NAVBAR ===== */}
      <nav style={{
        position:'fixed',top:0,left:0,right:0,zIndex:100,
        background: dark ? 'rgba(10,10,10,.97)' : 'rgba(255,255,255,.97)',
        backdropFilter:'blur(20px)',
        borderBottom: `1px solid ${dark?'rgba(255,255,255,.08)':'#E2E8F0'}`,
        padding:'0 5%',display:'flex',alignItems:'center',
        justifyContent:'space-between',height:64,
        transition:'background .3s,border-color .3s',
      }}>
        <div style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}} onClick={()=>navigate('/')}>
          <div style={{width:34,height:34,background:'#C41E3A',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>🩸</div>
          <span style={{fontSize:17,fontWeight:800,color:t.text,fontFamily:"'Plus Jakarta Sans',sans-serif",transition:'color .3s'}}>
            Blood<span style={{color:'#C41E3A'}}>Care</span>
          </span>
        </div>

        <div style={{display:'flex',gap:28}}>
          {[
            {label:'Home',    action:()=>navigate('/')},
            {label:'About',   action:()=>{}},
            {label:'Services',action:()=>navigate('/')},
            {label:'Contact', action:()=>document.getElementById('contact')?.scrollIntoView({behavior:'smooth'})},
          ].map(({label,action})=>(
            <button key={label} onClick={action} className="nav-link" style={{
              background:'none',border:'none',cursor:'pointer',fontSize:14,fontWeight:500,
              color: label==='About' ? '#C41E3A' : t.text2,
              fontFamily:"'Inter',sans-serif",
              borderBottom: label==='About' ? '2px solid #C41E3A' : '2px solid transparent',
              paddingBottom:2,
            }}
              onMouseEnter={e=>{ if(label!=='About') e.currentTarget.style.color='#C41E3A'; }}
              onMouseLeave={e=>{ if(label!=='About') e.currentTarget.style.color=t.text2; }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          {/* Dark/Light toggle */}
          <button className="theme-btn" onClick={()=>setDark(d=>!d)} style={{
            width:40,height:40,borderRadius:10,border:`1px solid ${dark?'rgba(255,255,255,.15)':'#E2E8F0'}`,
            background: dark?'#1E293B':'#F8FAFC',
            display:'flex',alignItems:'center',justifyContent:'center',
            cursor:'pointer',fontSize:18,
          }}>
            {dark ? '☀️' : '🌙'}
          </button>
          <button onClick={()=>navigate('/login')} style={{
            padding:'9px 20px',background:'#C41E3A',color:'#fff',
            border:'none',borderRadius:8,fontSize:13,fontWeight:700,
            cursor:'pointer',fontFamily:"'Inter',sans-serif",
            boxShadow:'0 4px 12px rgba(196,30,58,.3)',
          }}>
            Dashboard Login →
          </button>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section style={{
        paddingTop:64,
        background:'linear-gradient(135deg,#7F0F1E 0%,#C41E3A 50%,#9B1427 100%)',
        position:'relative',overflow:'hidden',minHeight:360,
        display:'flex',alignItems:'center',
      }}>
        <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px)',backgroundSize:'40px 40px'}}/>
        <div style={{position:'absolute',right:'5%',top:'50%',transform:'translateY(-50%)',width:280,height:280,background:'rgba(255,255,255,.06)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{position:'relative'}}>
            <div style={{fontSize:100,filter:'drop-shadow(0 8px 24px rgba(0,0,0,.3))'}}>🩸</div>
            <div style={{position:'absolute',top:-16,right:-24,background:'#fff',borderRadius:10,padding:'8px 14px',boxShadow:'0 4px 16px rgba(0,0,0,.15)',display:'flex',alignItems:'center',gap:6}}>
              <span style={{fontSize:16}}>🩸</span>
              <div><div style={{fontSize:16,fontWeight:800,color:'#C41E3A'}}>151</div><div style={{fontSize:9,color:'#94A3B8'}}>Donors</div></div>
            </div>
            <div style={{position:'absolute',bottom:-16,left:-24,background:'#fff',borderRadius:10,padding:'8px 14px',boxShadow:'0 4px 16px rgba(0,0,0,.15)',display:'flex',alignItems:'center',gap:6}}>
              <span style={{fontSize:16}}>❤️</span>
              <div><div style={{fontSize:16,fontWeight:800,color:'#C41E3A'}}>99</div><div style={{fontSize:9,color:'#94A3B8'}}>Lives Saved</div></div>
            </div>
          </div>
        </div>
        <div style={{padding:'60px 5%',position:'relative',zIndex:1,maxWidth:600}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:6,background:'rgba(255,255,255,.15)',border:'1px solid rgba(255,255,255,.25)',borderRadius:100,padding:'5px 14px',marginBottom:14}}>
            <span style={{color:'#fff',fontSize:12,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase'}}>ABOUT BLOODCARE</span>
          </div>
          <h1 style={{fontSize:46,fontWeight:800,color:'#fff',fontFamily:"'Plus Jakarta Sans',sans-serif",marginBottom:12,lineHeight:1.1,letterSpacing:-1}}>
            Saving Lives Through<br/><span style={{color:'rgba(255,255,255,.75)'}}>Intelligent Technology</span>
          </h1>
          <p style={{fontSize:15,color:'rgba(255,255,255,.8)',lineHeight:1.7,marginBottom:28,maxWidth:500}}>
            Sri Lanka's premier blood bank management system — connecting donors, patients, and blood banks nationwide through AI-powered coordination.
          </p>
          <div style={{display:'flex',gap:12}}>
            <button onClick={()=>document.getElementById('mission')?.scrollIntoView({behavior:'smooth'})}
              style={{padding:'12px 24px',background:'#fff',color:'#C41E3A',border:'none',borderRadius:8,fontSize:14,fontWeight:700,cursor:'pointer'}}>
              🩸 Learn More
            </button>
            <button onClick={()=>document.getElementById('contact')?.scrollIntoView({behavior:'smooth'})}
              style={{padding:'12px 24px',background:'transparent',color:'#fff',border:'1.5px solid rgba(255,255,255,.4)',borderRadius:8,fontSize:14,fontWeight:600,cursor:'pointer'}}>
              Find Blood Banks
            </button>
          </div>
        </div>
      </section>

      {/* ===== STATS BAR ===== */}
      <section style={{background:t.bg2,borderBottom:`1px solid ${t.border}`,padding:'28px 5%',transition:'background .3s'}}>
        <div style={{maxWidth:900,margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:20,textAlign:'center'}}>
          {[
            {icon:'👥', value:'151',   label:'Registered Donors'},
            {icon:'🏦', value:'29',    label:'Blood Banks'},
            {icon:'📞', value:'24/7',  label:'Emergency Support'},
            {icon:'📊', value:'45.8%', label:'Match Rate'},
          ].map(({icon,value,label})=>(
            <div key={label} className="card-stat">
              <div style={{fontSize:26,fontWeight:800,color:'#C41E3A',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{icon} {value}</div>
              <div style={{fontSize:13,color:t.text3,marginTop:4}}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== MISSION & VISION ===== */}
      <section id="mission" style={{padding:'70px 5%',background:t.bg3,transition:'background .3s'}}>
        <div style={{maxWidth:1100,margin:'0 auto',display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
          {[
            {
              icon:'🎯', title:'Our Mission', borderTop:'4px solid #C41E3A', cls:'card-3d',
              text:'To eliminate preventable deaths caused by blood shortages across Sri Lanka by intelligently connecting blood donors, patients, hospitals, and blood banks on a single unified platform.\n\nWe ensure that the right blood reaches the right person at the right time — leveraging AI-powered matching, real-time tracking, and emergency response systems.',
              tags:['Smart Matching','Real-time Alerts','Emergency Response'],
              tagColor:'#C41E3A', tagBg:'rgba(196,30,58,.1)',
            },
            {
              icon:'👁️', title:'Our Vision', borderTop:'4px solid #2563EB', cls:'card-3d card-3d-blue',
              text:"To become the national backbone of Sri Lanka's blood supply chain — a world-class platform where no patient dies due to lack of blood availability.\n\nWe envision a future where every blood bank, hospital, donor, and patient is connected through intelligent technology — making Sri Lanka a model for blood management excellence across South Asia.",
              tags:['Nationwide Network','Zero Blood Shortage','AI Innovation'],
              tagColor:'#2563EB', tagBg:'rgba(37,99,235,.1)',
            },
          ].map(({icon,title,borderTop,cls,text,tags,tagColor,tagBg})=>(
            <div key={title} className={cls} style={{...cardStyle,padding:32,borderTop}}>
              <div style={{width:52,height:52,background:tagBg,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,marginBottom:16}}>{icon}</div>
              <h3 style={{fontSize:20,fontWeight:800,color:t.text,marginBottom:12,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{title}</h3>
              {text.split('\n\n').map((p,i)=>(
                <p key={i} style={{fontSize:14,color:t.text2,lineHeight:1.7,marginBottom:10}}>{p}</p>
              ))}
              <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:8}}>
                {tags.map(tag=>(
                  <span key={tag} style={{background:tagBg,color:tagColor,fontSize:12,fontWeight:600,padding:'4px 12px',borderRadius:100}}>{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CORE VALUES ===== */}
      <section style={{padding:'70px 5%',background:t.bg2,transition:'background .3s'}}>
        <div style={{maxWidth:1100,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:48}}>
            <h2 style={{fontSize:36,fontWeight:800,color:t.text,fontFamily:"'Plus Jakarta Sans',sans-serif",marginBottom:8}}>Our Core Values</h2>
            <p style={{fontSize:15,color:t.text3}}>The principles that guide everything we do</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:16}}>
            {VALUES.map(({icon,title,desc})=>(
              <div key={title} className="card-value" style={{...cardStyle,padding:24,textAlign:'center',cursor:'default'}}>
                <div style={{width:48,height:48,background:'rgba(196,30,58,.1)',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,margin:'0 auto 12px'}}>{icon}</div>
                <h4 style={{fontSize:13,fontWeight:700,color:t.text,marginBottom:6}}>{title}</h4>
                <p style={{fontSize:11,color:t.text3,lineHeight:1.5}}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section style={{padding:'70px 5%',background:t.bg3,transition:'background .3s'}}>
        <div style={{maxWidth:1100,margin:'0 auto'}}>
          <div style={{...cardStyle,padding:'48px 40px'}}>
            <div style={{textAlign:'center',marginBottom:48}}>
              <h2 style={{fontSize:36,fontWeight:800,color:t.text,fontFamily:"'Plus Jakarta Sans',sans-serif",marginBottom:8}}>How BloodCare Works</h2>
              <p style={{fontSize:15,color:t.text3}}>From request to delivery in minutes</p>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,position:'relative'}}>
              <div style={{position:'absolute',top:32,left:'12%',right:'12%',height:2,background:'linear-gradient(90deg,#C41E3A,#E85D75,#C41E3A)',opacity:.4,zIndex:0}}/>
              {STEPS.map(({num,icon,title,desc})=>(
                <div key={num} className="card-step" style={{textAlign:'center',position:'relative',zIndex:1}}>
                  <div className="step-icon" style={{width:64,height:64,borderRadius:'50%',background:'#C41E3A',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px',fontSize:26,boxShadow:'0 6px 20px rgba(196,30,58,.35)',border:'4px solid #fff',position:'relative'}}>
                    {icon}
                    <div style={{position:'absolute',top:-6,right:-6,width:20,height:20,borderRadius:'50%',background:'#0F172A',color:'#fff',fontSize:8,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center'}}>{num}</div>
                  </div>
                  <h4 style={{fontSize:14,fontWeight:700,color:t.text,marginBottom:6,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{title}</h4>
                  <p style={{fontSize:12,color:t.text3,lineHeight:1.5}}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== WHO USES ===== */}
      <section style={{padding:'70px 5%',background:t.bg2,transition:'background .3s'}}>
        <div style={{maxWidth:1100,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:48}}>
            <h2 style={{fontSize:36,fontWeight:800,color:t.text,fontFamily:"'Plus Jakarta Sans',sans-serif",marginBottom:8}}>Who Uses BloodCare?</h2>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:20}}>
            {USERS.map(({icon,title,color,bg,desc})=>(
              <div key={title} className="card-user" style={{...cardStyle,padding:24,borderTop:`3px solid ${color}`,cursor:'default'}}>
                <div style={{width:52,height:52,background:bg,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,marginBottom:14}}>{icon}</div>
                <h4 style={{fontSize:15,fontWeight:700,color:t.text,marginBottom:6,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{title}</h4>
                <p style={{fontSize:12.5,color:t.text2,lineHeight:1.6}}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== MEET THE DEVELOPER ===== */}
      <section style={{padding:'70px 5%',background:t.bg3,transition:'background .3s'}}>
        <div style={{maxWidth:900,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:40}}>
            <div style={{fontSize:12,fontWeight:700,color:'#C41E3A',letterSpacing:2,textTransform:'uppercase',marginBottom:8}}>MEET THE DEVELOPER</div>
          </div>
          <div className="card-dev" style={{...cardStyle,padding:0,overflow:'hidden',display:'flex'}}>
            <div style={{width:220,flexShrink:0,background:'linear-gradient(135deg,#7F0F1E,#C41E3A)',display:'flex',alignItems:'center',justifyContent:'center',padding:28}}>
              <div style={{width:164,height:196,borderRadius:14,overflow:'hidden',border:'3px solid rgba(255,255,255,.35)',boxShadow:'0 8px 28px rgba(0,0,0,.35)'}}>
                <img src="/sasika.jpeg" alt="Sasika Jekanathan"
                  style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top center'}}
                  onError={e=>{e.target.style.display='none';}}/>
              </div>
            </div>
            <div style={{flex:1,padding:36}}>
              <div style={{fontSize:11,fontWeight:700,color:'#C41E3A',letterSpacing:1.5,textTransform:'uppercase',marginBottom:10}}>Meet the Developer</div>
              <h3 style={{fontSize:30,fontWeight:800,color:t.text,fontFamily:"'Plus Jakarta Sans',sans-serif",marginBottom:14}}>Sasika Jekanathan</h3>
              <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:20}}>
                <span style={{background:'rgba(196,30,58,.1)',color:'#C41E3A',fontSize:12,fontWeight:700,padding:'5px 14px',borderRadius:100,border:'1px solid rgba(196,30,58,.2)'}}>Undergraduate</span>
                <span style={{background:dark?'rgba(255,255,255,.06)':'#F8FAFC',color:t.text2,fontSize:11,fontWeight:500,padding:'5px 12px',borderRadius:100,border:`1px solid ${t.border}`,display:'flex',alignItems:'center',gap:4}}>
                  🏫 Gampaha Wickramarachchi University of Indigenous Medicine
                </span>
                <span style={{background:dark?'rgba(255,255,255,.06)':'#F8FAFC',color:t.text2,fontSize:12,fontWeight:500,padding:'5px 12px',borderRadius:100,border:`1px solid ${t.border}`,display:'flex',alignItems:'center',gap:4}}>
                  📍 Sri Lanka
                </span>
              </div>
              <p style={{fontSize:14,color:t.text2,lineHeight:1.8,marginBottom:24}}>
                BloodCare was designed and developed by Sasika Jekanathan as an undergraduate project with the vision of modernizing blood donation and blood bank management through digital technology. The platform focuses on improving communication between blood donors, hospitals, blood banks, and healthcare administrators while supporting faster emergency response and efficient blood management.
              </p>
              <div style={{display:'flex',gap:10}}>
                <button onClick={()=>navigate('/login')} style={{padding:'10px 22px',background:'#C41E3A',color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 12px rgba(196,30,58,.3)'}}>
                  View Dashboard →
                </button>
                <a href="mailto:bloodcareadmin@gmail.com?subject=BloodCare Inquiry&body=Hello Sasika," style={{padding:'10px 22px',background:dark?'rgba(255,255,255,.06)':'#F8FAFC',color:t.text2,border:`1px solid ${t.border}`,borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',textDecoration:'none',display:'flex',alignItems:'center',gap:5}}>
                  ✉️ Contact
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CONTACT ===== */}
      <section id="contact" style={{padding:'70px 5%',background:t.bg2,transition:'background .3s'}}>
        <div style={{maxWidth:900,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:40}}>
            <h2 style={{fontSize:36,fontWeight:800,color:t.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Get In Touch</h2>
            <div style={{width:40,height:3,background:'#C41E3A',margin:'10px auto 0',borderRadius:2}}/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
            <div className="card-contact" style={{background:'linear-gradient(135deg,#9B1427,#C41E3A)',borderRadius:16,padding:32,color:'#fff'}}>
              <div style={{fontSize:28,marginBottom:12}}>📞</div>
              <div style={{fontSize:14,fontWeight:600,opacity:.8,marginBottom:6}}>Emergency Hotline</div>
              <div style={{fontSize:48,fontWeight:800,fontFamily:"'Plus Jakarta Sans',sans-serif",marginBottom:8}}>1990</div>
              <div style={{fontSize:13,opacity:.7,marginBottom:20}}>Available 24 hours, 7 days a week</div>
              <a href="tel:1990" style={{display:'inline-flex',alignItems:'center',gap:6,background:'#fff',color:'#C41E3A',padding:'10px 20px',borderRadius:8,fontSize:13,fontWeight:700,textDecoration:'none'}}>
                📞 Call Now
              </a>
            </div>
            <div className="card-contact" style={{...cardStyle,padding:32}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:20}}>
                <span style={{fontSize:18}}>✉️</span>
                <span style={{fontSize:17,fontWeight:700,color:t.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Contact Us</span>
              </div>
              {[
                {icon:'📍', label:'ADDRESS', value:'Faculty of Indigenous Health Sciences and Technology, Gampaha Wickramarachchi University of Indigenous Medicine, Sri Lanka'},
                {icon:'📞', label:'GENERAL', value:'+94 11 234 5678'},
                {icon:'✉️', label:'EMAIL',   value:'help@bloodcare.lk'},
              ].map(({icon,label,value})=>(
                <div key={label} style={{display:'flex',gap:14,marginBottom:16,paddingBottom:16,borderBottom:`1px solid ${t.border}`}}>
                  <div style={{width:36,height:36,background:'rgba(196,30,58,.08)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>{icon}</div>
                  <div>
                    <div style={{fontSize:10,fontWeight:700,color:'#C41E3A',letterSpacing:1,textTransform:'uppercase',marginBottom:2}}>{label}</div>
                    <div style={{fontSize:13,color:t.text2,lineHeight:1.5}}>{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer style={{background:'#0F172A',color:'rgba(255,255,255,.5)',padding:'50px 5% 24px'}}>
        <div style={{maxWidth:1100,margin:'0 auto'}}>
          <div style={{display:'grid',gridTemplateColumns:'1.5fr 1fr 1fr 1fr',gap:40,marginBottom:36}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                <div style={{width:32,height:32,background:'#C41E3A',borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>🩸</div>
                <span style={{fontSize:16,fontWeight:800,color:'#fff',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Blood<span style={{color:'#C41E3A'}}>Care</span></span>
              </div>
              <p style={{fontSize:12,lineHeight:1.7,marginBottom:14}}>Saving Lives Through Smart Blood Management</p>
              <div style={{display:'flex',gap:8}}>
                {['f','tw','ig','in'].map(s=>(
                  <div key={s} style={{width:30,height:30,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)',borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,cursor:'pointer',transition:'all .2s'}}
                    onMouseEnter={e=>{e.currentTarget.style.background='#C41E3A';e.currentTarget.style.color='#fff';}}
                    onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,.06)';e.currentTarget.style.color='rgba(255,255,255,.5)';}}>
                    {s}
                  </div>
                ))}
              </div>
            </div>
            {[
              {title:'Quick Links',  links:['Home','About Us','Services','Dashboard Login','Contact Us']},
              {title:'Our Services', links:['Donor Management','Blood Inventory','Hospital Management','Emergency Requests','Reports & Analytics']},
              {title:'Contact Info', links:['help@bloodcare.lk','+94 11 234 5678','Sri Lanka']},
            ].map(({title,links})=>(
              <div key={title}>
                <div style={{fontSize:13,fontWeight:700,color:'#fff',marginBottom:14}}>{title}</div>
                {links.map(l=>(
                  <div key={l} style={{fontSize:12,marginBottom:8,cursor:'pointer',transition:'color .15s'}}
                    onMouseEnter={e=>e.currentTarget.style.color='#C41E3A'}
                    onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,.5)'}>
                    {l}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{borderTop:'1px solid rgba(255,255,255,.08)',paddingTop:20,textAlign:'center',fontSize:12}}>
            © 2025 BloodCare. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}