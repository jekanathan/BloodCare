import React,{useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '../context/AuthContext';
import {AlertCircle,Stethoscope} from 'lucide-react';

export default function LoginPage(){
  const {login}=useAuth();
  const nav=useNavigate();
  const [form,setForm]=useState({email:'',password:''});
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);

  const submit=async e=>{
    e.preventDefault();setError('');setLoading(true);
    try{
      await login(form.email,form.password);
      nav('/');
    }catch(err){
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    }finally{
      setLoading(false);
    }
  };

  return(
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand anim-up">
          <div className="auth-logo-box"><Stethoscope size={30} color="#fff"/></div>
          <div className="auth-brand-name">Blood<span>Care</span></div>
          <div className="auth-brand-sub">Hospital Portal — hospital.bloodcare.lk</div>

          <ul className="auth-features">
            <li><span>🏥</span>Register & manage patients</li>
            <li><span>🩸</span>Submit blood requests to blood banks</li>
            <li><span>👥</span>Request donors directly for emergencies</li>
            <li><span>📊</span>Track all blood request statuses</li>
            <li><span>🔔</span>Real-time blood availability alerts</li>
            <li><span>📋</span>Complete transfusion history records</li>
          </ul>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-wrap anim-up">
          <div className="auth-form-title">Hospital Sign In 🏥</div>
          <div className="auth-form-sub">Access your hospital blood management portal</div>

          {error&&<div className="form-error"><AlertCircle size={14}/>{error}</div>}

          <form onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">Hospital Email</label>
              <input type="email" className="form-input" placeholder="hospital@bloodcare.lk"
                value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-input" placeholder="••••••••"
                value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required/>
            </div>
            <button type="submit" className="btn-main" disabled={loading}>{loading?'Signing in...':'Sign In to Hospital Portal'}</button>
          </form>

          <div className="auth-link">Not registered? <a href="/register" onClick={e=>{e.preventDefault();nav('/register');}}>Register Hospital</a></div>
        </div>
      </div>
    </div>
  );
}