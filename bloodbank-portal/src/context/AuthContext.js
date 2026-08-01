import React,{createContext,useContext,useState,useEffect} from 'react';
import api from '../utils/api';
const Ctx=createContext(null);
export const AuthProvider=({children})=>{
  const [bank,setBank]=useState(null);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    const t=localStorage.getItem('bc_bb_token');
    if(t){api.defaults.headers.common['Authorization']=`Bearer ${t}`;api.get('/bloodbank/me').then(r=>setBank(r.data)).catch(()=>localStorage.removeItem('bc_bb_token')).finally(()=>setLoading(false));}
    else setLoading(false);
  },[]);
  const login=async(email,password)=>{
    const r=await api.post('/bloodbank/login',{email,password});
    localStorage.setItem('bc_bb_token',r.data.token);
    api.defaults.headers.common['Authorization']=`Bearer ${r.data.token}`;
    setBank(r.data.bank);return r.data.bank;
  };
  const logout=()=>{localStorage.removeItem('bc_bb_token');delete api.defaults.headers.common['Authorization'];setBank(null);};
  return <Ctx.Provider value={{bank,login,logout,loading,setBank}}>{children}</Ctx.Provider>;
};
export const useAuth=()=>useContext(Ctx);
