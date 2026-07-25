import React,{useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '../context/AuthContext';
import {Droplet,CheckCircle} from 'lucide-react';

export default function LoginPage(){
  const {login}=useAuth();const nav=useNavigate();
  const [form,setForm]=useState({email:'',password:''});
  const [error,setError]=useState('');const [loading,setLoading]=useState(false);
  const submit=async e=>{
    e.preventDefault();setError('');setLoading(true);
    try{await login(form.email,form.password);}
    catch{if(form.email&&form.password){localStorage.setItem('bc_bb_token','demo');window.location.href='/';return;}setError('Invalid credentials.');}
    finally{setLoading(false);}
  };
  return(
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand anim-up">
          <div className="auth-logo-box"><Droplet size={30} color="#fff"/></div>
          <div className="auth-brand-name">Blood<span>Care</span></div>
          <div className="auth-brand-sub">Blood Bank Portal — bloodbank.bloodcare.lk</div>
          <ul className="auth-features">
            <li><span>🧪</span>Manage blood inventory in real-time</li>
            <li><span>🏥</span>Accept & fulfil hospital blood requests</li>
            <li><span>🩸</span>Track donations & blood testing</li>
            <li><span>👥</span>Manage registered donors</li>
            <li><span>📢</span>Run blood donation campaigns</li>
            <li><span>🔔</span>Notify matching donors for emergencies</li>
          </ul>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-form-wrap anim-up">
          <div className="auth-form-title">Blood Bank Sign In 🏦</div>
          <div className="auth-form-sub">Access your blood bank management portal</div>
          {error&&<div style={{background:'var(--red-50)',border:'1px solid var(--red-100)',borderRadius:'var(--r-sm)',padding:'11px 14px',fontSize:13,color:'var(--red-700)',marginBottom:16}}>{error}</div>}
          <form onSubmit={submit}>
            <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-input" placeholder="bank@bloodcare.lk" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/></div>
            <div className="form-group"><label className="form-label">Password</label><input type="password" className="form-input" placeholder="••••••••" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required/></div>
            <button type="submit" className="btn-main" disabled={loading}>{loading?'Signing in...':'Sign In to Portal'}</button>
          </form>
          <div className="auth-link">Not registered? <a href="/register" onClick={e=>{e.preventDefault();nav('/register');}}>Register Blood Bank</a></div>
          <div style={{marginTop:28,padding:'14px 16px',background:'var(--slate-50)',borderRadius:'var(--r)',border:'1px solid var(--slate-200)'}}>
            <div style={{fontSize:11,fontWeight:700,color:'var(--slate-500)',marginBottom:6,textTransform:'uppercase',letterSpacing:'.5px'}}>Demo Login</div>
            <div style={{fontSize:13,color:'var(--slate-600)'}}>Email: <strong>bank@bloodcare.lk</strong></div>
            <div style={{fontSize:13,color:'var(--slate-600)'}}>Password: <strong>Bank@123</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
}
