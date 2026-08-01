import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [count, setCount] = useState({donors:0, hospitals:0, units:0, lives:0});

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const targets = {donors:18256, hospitals:256, units:24782, lives:50000};
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      setCount({
        donors:   Math.round(targets.donors   * progress),
        hospitals:Math.round(targets.hospitals* progress),
        units:    Math.round(targets.units    * progress),
        lives:    Math.round(targets.lives    * progress),
      });
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, []);

  const FEATURES = [
    {icon:'🩸', title:'Real-Time Blood Inventory',    desc:'Track blood stock levels across all banks instantly. Get alerts when critical levels are reached.',           color:'#C41E3A', bg:'#FFF1F3'},
    {icon:'🏥', title:'Hospital Network',              desc:'Connect with 256+ hospitals across Sri Lanka for seamless blood request management and dispatch.',           color:'#2563EB', bg:'#EFF6FF'},
    {icon:'👤', title:'Donor Management',              desc:'Manage 18,000+ donors with eligibility tracking, certificates, and automated reminders.',                   color:'#16A34A', bg:'#F0FDF4'},
    {icon:'🚨', title:'Emergency Response',            desc:'Instant emergency broadcast to nearby donors. Get critical blood within minutes, not hours.',               color:'#D97706', bg:'#FFFBEB'},
    {icon:'📊', title:'Analytics & Reports',           desc:'Province-wise donation trends, hospital performance metrics, and monthly growth analytics.',                color:'#7C3AED', bg:'#F5F3FF'},
    {icon:'📱', title:'Multi-Portal Access',           desc:'Separate portals for donors, hospitals, blood banks, and administrators — all in one ecosystem.',           color:'#0891B2', bg:'#ECFEFF'},
  ];

  const TESTIMONIALS = [
    {name:'Dr. Nimal Perera',    role:'Medical Superintendent, National Hospital Colombo', rating:5, text:'BloodCare has revolutionized how we manage blood requests. What used to take hours now takes minutes. The emergency broadcast feature has saved countless lives.', avatar:'N'},
    {name:'Chamara Silva',       role:'Blood Donor, Colombo',                              rating:5, text:'I have been donating blood for 5 years. BloodCare makes it so easy to track my donations and get notified when my blood type is needed urgently.',                avatar:'C'},
    {name:'Dr. Priya Jayawardena',role:'Director, Kandy Blood Bank',                      rating:5, text:'The inventory management system is exceptional. We can now track every unit of blood from collection to transfusion. Zero wastage, maximum efficiency.',         avatar:'P'},
    {name:'Rajesh Kumar',         role:'Hospital Administrator, Batticaloa',               rating:4, text:'The multi-hospital network has made inter-hospital blood transfers seamless. BloodCare is a game-changer for healthcare in Sri Lanka.',                         avatar:'R'},
  ];

  const STATS = [
    {label:'Registered Donors', value:count.donors,    suffix:'',  icon:'👤', color:'#C41E3A'},
    {label:'Partner Hospitals',  value:count.hospitals, suffix:'+', icon:'🏥', color:'#2563EB'},
    {label:'Blood Units Managed',value:count.units,    suffix:'',  icon:'🩸', color:'#16A34A'},
    {label:'Lives Saved',        value:count.lives,    suffix:'+', icon:'❤️', color:'#D97706'},
  ];

  const TEAM = [
    {name:'Dr. Sunil Perera',    role:'Chief Medical Officer',    avatar:'S', color:'#C41E3A'},
    {name:'Kasun Jayasinghe',    role:'Chief Technology Officer', avatar:'K', color:'#2563EB'},
    {name:'Dr. Nilmini Fernando',role:'Head of Operations',       avatar:'N', color:'#16A34A'},
    {name:'Tharaka Wickramasinghe',role:'Data Analytics Lead',   avatar:'T', color:'#7C3AED'},
  ];

  return (
    <div style={{fontFamily:"'Inter',-apple-system,sans-serif",color:'#0F172A',overflowX:'hidden'}}>

      {/* ===== NAVBAR ===== */}
      <nav style={{
        position:'fixed',top:0,left:0,right:0,zIndex:100,
        background:scrolled?'rgba(255,255,255,.97)':'transparent',
        backdropFilter:scrolled?'blur(20px)':'none',
        borderBottom:scrolled?'1px solid #E2E8F0':'none',
        transition:'all .3s',padding:'0 5%',
        display:'flex',alignItems:'center',justifyContent:'space-between',
        height:68,
      }}>
        {/* Logo */}
        <div style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}} onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}>
          <div style={{width:38,height:38,background:'linear-gradient(135deg,#C41E3A,#7F0F1E)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,boxShadow:'0 4px 12px rgba(196,30,58,.3)'}}>🩸</div>
          <div>
            <div style={{fontSize:18,fontWeight:800,color:scrolled?'#0F172A':'#fff',fontFamily:"'Plus Jakarta Sans',sans-serif",letterSpacing:-.3}}>Blood<span style={{color:'#C41E3A'}}>Care</span></div>
            <div style={{fontSize:9,color:scrolled?'#64748B':'rgba(255,255,255,.7)',marginTop:-2}}>Sri Lanka's Blood Bank Network</div>
          </div>
        </div>

        {/* Nav Links */}
        <div style={{display:'flex',alignItems:'center',gap:32}}>
          {[
            {label:'Home',      action:()=>window.scrollTo({top:0,behavior:'smooth'})},
            {label:'Features',  action:()=>document.getElementById('features')?.scrollIntoView({behavior:'smooth'})},
            {label:'About',     action:()=>navigate('/about')},
            {label:'Contact',   action:()=>document.getElementById('contact')?.scrollIntoView({behavior:'smooth'})},
          ].map(({label,action})=>(
            <button key={label} onClick={action} style={{
              background:'none',border:'none',cursor:'pointer',
              fontSize:14,fontWeight:500,
              color:scrolled?'#475569':'rgba(255,255,255,.85)',
              fontFamily:"'Inter',sans-serif",
              transition:'color .2s',padding:'4px 0',
            }}
              onMouseEnter={e=>e.currentTarget.style.color=scrolled?'#C41E3A':'#fff'}
              onMouseLeave={e=>e.currentTarget.style.color=scrolled?'#475569':'rgba(255,255,255,.85)'}>
              {label}
            </button>
          ))}
        </div>

        {/* CTA Buttons */}
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <button onClick={()=>navigate('/login')} style={{
            padding:'9px 20px',background:'transparent',
            border:`1.5px solid ${scrolled?'#C41E3A':'rgba(255,255,255,.5)'}`,
            borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',
            color:scrolled?'#C41E3A':'#fff',fontFamily:"'Inter',sans-serif",
            transition:'all .2s',
          }}
            onMouseEnter={e=>{e.currentTarget.style.background='#C41E3A';e.currentTarget.style.color='#fff';e.currentTarget.style.borderColor='#C41E3A';}}
            onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color=scrolled?'#C41E3A':'#fff';e.currentTarget.style.borderColor=scrolled?'#C41E3A':'rgba(255,255,255,.5)';}}>
            Admin Login
          </button>
          <button onClick={()=>navigate('/login')} style={{
            padding:'9px 20px',background:'#C41E3A',color:'#fff',
            border:'none',borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer',
            fontFamily:"'Inter',sans-serif",
            boxShadow:'0 4px 12px rgba(196,30,58,.35)',transition:'all .2s',
          }}
            onMouseEnter={e=>{e.currentTarget.style.background='#9B1427';e.currentTarget.style.transform='translateY(-1px)';}}
            onMouseLeave={e=>{e.currentTarget.style.background='#C41E3A';e.currentTarget.style.transform='translateY(0)';}}>
            Get Started →
          </button>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section style={{
        minHeight:'100vh',
        background:'linear-gradient(135deg,#0B1120 0%,#7F0F1E 50%,#0F1729 100%)',
        display:'flex',alignItems:'center',justifyContent:'center',
        position:'relative',overflow:'hidden',paddingTop:68,
      }}>
        {/* Background effects */}
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 30% 50%,rgba(196,30,58,.2) 0%,transparent 60%),radial-gradient(ellipse at 70% 30%,rgba(37,99,235,.1) 0%,transparent 50%)'}}/>
        <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px)',backgroundSize:'50px 50px'}}/>

        {/* Floating circles */}
        {[
          {w:400,h:400,top:'-10%',right:'-5%',bg:'rgba(196,30,58,.08)'},
          {w:300,h:300,bottom:'10%',left:'-5%', bg:'rgba(37,99,235,.06)'},
          {w:200,h:200,top:'30%',right:'20%',   bg:'rgba(196,30,58,.05)'},
        ].map((c,i)=>(
          <div key={i} style={{position:'absolute',width:c.w,height:c.h,top:c.top,bottom:c.bottom,left:c.left,right:c.right,background:c.bg,borderRadius:'50%',filter:'blur(60px)'}}/>
        ))}

        <div style={{position:'relative',zIndex:2,textAlign:'center',padding:'0 20px',maxWidth:800}}>
          {/* Badge */}
          <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(196,30,58,.15)',border:'1px solid rgba(196,30,58,.3)',borderRadius:100,padding:'6px 16px',marginBottom:24}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:'#C41E3A',animation:'pulse 1.5s infinite'}}/>
            <span style={{fontSize:12,fontWeight:600,color:'#FCA5A5'}}>Sri Lanka's #1 Blood Bank Management System</span>
          </div>

          {/* Title */}
          <h1 style={{fontSize:56,fontWeight:800,color:'#fff',lineHeight:1.1,marginBottom:20,fontFamily:"'Plus Jakarta Sans',sans-serif",letterSpacing:-1}}>
            Saving Lives Through
            <span style={{display:'block',background:'linear-gradient(135deg,#C41E3A,#E85D75)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
              Smart Blood Management
            </span>
          </h1>

          <p style={{fontSize:18,color:'rgba(255,255,255,.7)',lineHeight:1.7,marginBottom:36,maxWidth:600,margin:'0 auto 36px'}}>
            BloodCare connects donors, hospitals, and blood banks across Sri Lanka in real-time. Ensuring the right blood reaches the right patient at the right time.
          </p>

          {/* CTA Buttons */}
          <div style={{display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap',marginBottom:48}}>
            <button onClick={()=>navigate('/login')} style={{
              padding:'14px 32px',background:'#C41E3A',color:'#fff',border:'none',
              borderRadius:10,fontSize:15,fontWeight:700,cursor:'pointer',
              boxShadow:'0 8px 24px rgba(196,30,58,.4)',transition:'all .2s',
              fontFamily:"'Inter',sans-serif",
            }}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 12px 32px rgba(196,30,58,.5)';}}
              onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 8px 24px rgba(196,30,58,.4)';}}>
              🚀 Access Admin Panel
            </button>
            <button onClick={()=>navigate('/about')} style={{
              padding:'14px 32px',background:'transparent',color:'#fff',
              border:'1.5px solid rgba(255,255,255,.3)',borderRadius:10,
              fontSize:15,fontWeight:600,cursor:'pointer',transition:'all .2s',
              fontFamily:"'Inter',sans-serif",
            }}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,.1)';e.currentTarget.style.borderColor='rgba(255,255,255,.6)';}}
              onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.borderColor='rgba(255,255,255,.3)';}}>
              📖 Learn More
            </button>
          </div>

          {/* Stats Row */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:20,maxWidth:700,margin:'0 auto'}}>
            {STATS.map(({label,value,suffix,icon,color})=>(
              <div key={label} style={{textAlign:'center',padding:'16px',background:'rgba(255,255,255,.05)',borderRadius:12,border:'1px solid rgba(255,255,255,.08)',backdropFilter:'blur(10px)'}}>
                <div style={{fontSize:20,marginBottom:4}}>{icon}</div>
                <div style={{fontSize:22,fontWeight:800,color:'#fff',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                  {value.toLocaleString()}{suffix}
                </div>
                <div style={{fontSize:11,color:'rgba(255,255,255,.5)',marginTop:2}}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{position:'absolute',bottom:32,left:'50%',transform:'translateX(-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:4,cursor:'pointer',animation:'bounce 2s infinite'}}
          onClick={()=>document.getElementById('features')?.scrollIntoView({behavior:'smooth'})}>
          <span style={{fontSize:11,color:'rgba(255,255,255,.4)',letterSpacing:2}}>SCROLL</span>
          <div style={{width:1,height:40,background:'rgba(255,255,255,.2)'}}/>
          <div style={{width:6,height:6,borderRadius:'50%',background:'rgba(255,255,255,.4)'}}/>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" style={{padding:'100px 5%',background:'#F8FAFC'}}>
        <div style={{maxWidth:1100,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:60}}>
            <div style={{fontSize:12,fontWeight:700,color:'#C41E3A',letterSpacing:2,textTransform:'uppercase',marginBottom:10}}>PLATFORM FEATURES</div>
            <h2 style={{fontSize:40,fontWeight:800,color:'#0F172A',fontFamily:"'Plus Jakarta Sans',sans-serif",marginBottom:14,letterSpacing:-.5}}>Everything You Need to Manage Blood</h2>
            <p style={{fontSize:16,color:'#64748B',maxWidth:520,margin:'0 auto',lineHeight:1.7}}>A complete ecosystem for blood donation management — from donor registration to hospital delivery.</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:24}}>
            {FEATURES.map(({icon,title,desc,color,bg})=>(
              <div key={title} style={{background:'#fff',borderRadius:16,padding:28,border:'1px solid #E2E8F0',transition:'all .25s',cursor:'default'}}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)';e.currentTarget.style.boxShadow='0 12px 32px rgba(0,0,0,.1)';e.currentTarget.style.borderColor=color;}}
                onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none';e.currentTarget.style.borderColor='#E2E8F0';}}>
                <div style={{width:52,height:52,background:bg,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,marginBottom:16}}>{icon}</div>
                <h3 style={{fontSize:16,fontWeight:700,color:'#0F172A',marginBottom:8,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{title}</h3>
                <p style={{fontSize:13.5,color:'#64748B',lineHeight:1.6}}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section style={{padding:'100px 5%',background:'#fff'}}>
        <div style={{maxWidth:1000,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:60}}>
            <div style={{fontSize:12,fontWeight:700,color:'#C41E3A',letterSpacing:2,textTransform:'uppercase',marginBottom:10}}>HOW IT WORKS</div>
            <h2 style={{fontSize:40,fontWeight:800,color:'#0F172A',fontFamily:"'Plus Jakarta Sans',sans-serif",letterSpacing:-.5}}>From Donation to Delivery</h2>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:20,position:'relative'}}>
            {/* Connector line */}
            <div style={{position:'absolute',top:40,left:'12%',right:'12%',height:2,background:'linear-gradient(90deg,#C41E3A,#E85D75,#C41E3A)',opacity:.3}}/>
            {[
              {step:'01',icon:'👤',title:'Donor Registers',    desc:'Donor signs up and completes health profile with blood type and eligibility.'},
              {step:'02',icon:'🩸',title:'Blood Collected',    desc:'Donation made at blood bank. Unit logged in system with full traceability.'},
              {step:'03',icon:'🏥',title:'Hospital Requests',  desc:'Hospital places request. System matches available blood instantly.'},
              {step:'04',icon:'🚑',title:'Life Saved',         desc:'Blood dispatched and delivered. Patient receives critical transfusion.'},
            ].map(({step,icon,title,desc})=>(
              <div key={step} style={{textAlign:'center',position:'relative',zIndex:1}}>
                <div style={{width:80,height:80,borderRadius:'50%',background:'linear-gradient(135deg,#C41E3A,#7F0F1E)',margin:'0 auto 16px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,boxShadow:'0 8px 20px rgba(196,30,58,.3)',border:'4px solid #fff'}}>
                  {icon}
                </div>
                <div style={{fontSize:10,fontWeight:800,color:'#C41E3A',letterSpacing:2,marginBottom:6}}>STEP {step}</div>
                <h4 style={{fontSize:15,fontWeight:700,color:'#0F172A',marginBottom:6,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{title}</h4>
                <p style={{fontSize:12.5,color:'#64748B',lineHeight:1.6}}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== STATS BANNER ===== */}
      <section style={{padding:'80px 5%',background:'linear-gradient(135deg,#0B1120 0%,#7F0F1E 60%,#0F1729 100%)',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px)',backgroundSize:'40px 40px'}}/>
        <div style={{maxWidth:1000,margin:'0 auto',position:'relative',zIndex:1}}>
          <div style={{textAlign:'center',marginBottom:48}}>
            <h2 style={{fontSize:36,fontWeight:800,color:'#fff',fontFamily:"'Plus Jakarta Sans',sans-serif",marginBottom:8}}>BloodCare By The Numbers</h2>
            <p style={{fontSize:15,color:'rgba(255,255,255,.6)'}}>Real impact across Sri Lanka</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:24}}>
            {STATS.map(({label,value,suffix,icon,color})=>(
              <div key={label} style={{textAlign:'center',padding:'28px 20px',background:'rgba(255,255,255,.06)',borderRadius:16,border:'1px solid rgba(255,255,255,.1)',backdropFilter:'blur(10px)'}}>
                <div style={{fontSize:32,marginBottom:8}}>{icon}</div>
                <div style={{fontSize:36,fontWeight:800,color:'#fff',fontFamily:"'Plus Jakarta Sans',sans-serif",lineHeight:1}}>
                  {value.toLocaleString()}{suffix}
                </div>
                <div style={{fontSize:13,color:'rgba(255,255,255,.5)',marginTop:6}}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section style={{padding:'100px 5%',background:'#F8FAFC'}}>
        <div style={{maxWidth:1100,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:56}}>
            <div style={{fontSize:12,fontWeight:700,color:'#C41E3A',letterSpacing:2,textTransform:'uppercase',marginBottom:10}}>TESTIMONIALS</div>
            <h2 style={{fontSize:40,fontWeight:800,color:'#0F172A',fontFamily:"'Plus Jakarta Sans',sans-serif",letterSpacing:-.5}}>What People Are Saying</h2>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:24}}>
            {TESTIMONIALS.map(({name,role,rating,text,avatar})=>(
              <div key={name} style={{background:'#fff',borderRadius:16,padding:28,border:'1px solid #E2E8F0',transition:'box-shadow .2s'}}
                onMouseEnter={e=>e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,.08)'}
                onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
                <div style={{display:'flex',gap:4,marginBottom:16}}>
                  {[...Array(rating)].map((_,i)=><span key={i} style={{color:'#F59E0B',fontSize:16}}>★</span>)}
                </div>
                <p style={{fontSize:14,color:'#475569',lineHeight:1.7,marginBottom:20,fontStyle:'italic'}}>"{text}"</p>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:44,height:44,borderRadius:'50%',background:'linear-gradient(135deg,#C41E3A,#7F0F1E)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:16,fontWeight:800,flexShrink:0}}>
                    {avatar}
                  </div>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,color:'#0F172A'}}>{name}</div>
                    <div style={{fontSize:12,color:'#64748B'}}>{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CONTACT ===== */}
      <section id="contact" style={{padding:'100px 5%',background:'#fff'}}>
        <div style={{maxWidth:700,margin:'0 auto',textAlign:'center'}}>
          <div style={{fontSize:12,fontWeight:700,color:'#C41E3A',letterSpacing:2,textTransform:'uppercase',marginBottom:10}}>CONTACT US</div>
          <h2 style={{fontSize:40,fontWeight:800,color:'#0F172A',fontFamily:"'Plus Jakarta Sans',sans-serif",marginBottom:14,letterSpacing:-.5}}>Get In Touch</h2>
          <p style={{fontSize:15,color:'#64748B',marginBottom:40,lineHeight:1.7}}>Have questions about BloodCare? We're here to help. Reach out to our team.</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20,marginBottom:40}}>
            {[
              {icon:'📞', label:'Phone',   value:'+94 11 123 4567'},
              {icon:'✉️', label:'Email',   value:'support@bloodcare.lk'},
              {icon:'📍', label:'Address', value:'123, Health Care Road, Colombo'},
            ].map(({icon,label,value})=>(
              <div key={label} style={{padding:'24px',background:'#F8FAFC',borderRadius:12,border:'1px solid #E2E8F0',textAlign:'center'}}>
                <div style={{fontSize:28,marginBottom:8}}>{icon}</div>
                <div style={{fontSize:11,fontWeight:700,color:'#C41E3A',textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>{label}</div>
                <div style={{fontSize:13,color:'#475569',fontWeight:500}}>{value}</div>
              </div>
            ))}
          </div>
          {/* Emergency */}
          <div style={{background:'linear-gradient(135deg,#7F0F1E,#C41E3A)',borderRadius:16,padding:'28px',color:'#fff',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:16}}>
            <div>
              <div style={{fontSize:14,opacity:.8,marginBottom:4}}>24/7 Emergency Hotline</div>
              <div style={{fontSize:36,fontWeight:800,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>🚨 1919</div>
            </div>
            <button onClick={()=>navigate('/login')} style={{padding:'12px 28px',background:'#fff',color:'#C41E3A',border:'none',borderRadius:8,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>
              Access Portal →
            </button>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer style={{background:'#0F172A',color:'rgba(255,255,255,.6)',padding:'60px 5% 30px'}}>
        <div style={{maxWidth:1100,margin:'0 auto'}}>
          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:40,marginBottom:40}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
                <div style={{width:36,height:36,background:'#C41E3A',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>🩸</div>
                <span style={{fontSize:18,fontWeight:800,color:'#fff',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>BloodCare</span>
              </div>
              <p style={{fontSize:13,lineHeight:1.7,marginBottom:16}}>Sri Lanka's most trusted blood donation and management platform. Connecting donors, hospitals, and saving lives since 2020.</p>
              <div style={{display:'flex',gap:8}}>
                {['FB','TW','IN','YT'].map(s=>(
                  <div key={s} style={{width:32,height:32,background:'rgba(255,255,255,.08)',borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,cursor:'pointer',transition:'background .2s'}}
                    onMouseEnter={e=>e.currentTarget.style.background='#C41E3A'}
                    onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.08)'}>{s}</div>
                ))}
              </div>
            </div>
            {[
              {title:'Quick Links', links:['Home','Features','About Us','Contact']},
              {title:'Platform',    links:['Admin Portal','Donor Portal','Hospital Portal','Blood Bank Portal']},
              {title:'Support',     links:['Help Center','Documentation','Privacy Policy','Terms of Service']},
            ].map(({title,links})=>(
              <div key={title}>
                <div style={{fontSize:13,fontWeight:700,color:'#fff',marginBottom:14,letterSpacing:.5}}>{title}</div>
                {links.map(l=>(
                  <div key={l} style={{fontSize:13,marginBottom:8,cursor:'pointer',transition:'color .15s'}}
                    onMouseEnter={e=>e.currentTarget.style.color='#fff'}
                    onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,.6)'}>{l}</div>
                ))}
              </div>
            ))}
          </div>
          <div style={{borderTop:'1px solid rgba(255,255,255,.08)',paddingTop:24,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
            <span style={{fontSize:12}}>© 2026 BloodCare.lk. All Rights Reserved.</span>
            <span style={{fontSize:12}}>❤️ Made with love for Sri Lanka</span>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes bounce {
          0%,100%{transform:translateX(-50%) translateY(0)}
          50%{transform:translateX(-50%) translateY(8px)}
        }
        @keyframes pulse {
          0%,100%{opacity:1}50%{opacity:.5}
        }
      `}</style>
    </div>
  );
}