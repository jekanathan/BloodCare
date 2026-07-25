import React,{createContext,useContext,useState,useEffect} from 'react';
import api from '../utils/api';
const Ctx=createContext(null);

export const AuthProvider=({children})=>{
  const [hospital,setHospital]=useState(null);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    const token=localStorage.getItem('bc_hosp_token');
    if(token){
      api.defaults.headers.common['Authorization']=`Bearer ${token}`;
      api.get('/hospital-auth/me').then(r=>setHospital(r.data)).catch(()=>localStorage.removeItem('bc_hosp_token')).finally(()=>setLoading(false));
    } else setLoading(false);
  },[]);

  const login=async(email,password)=>{
    const r=await api.post('/hospital-auth/login',{email,password});
    localStorage.setItem('bc_hosp_token',r.data.token);
    api.defaults.headers.common['Authorization']=`Bearer ${r.data.token}`;
    setHospital(r.data.hospital);
    return r.data.hospital;
  };

  const logout=()=>{
    localStorage.removeItem('bc_hosp_token');
    delete api.defaults.headers.common['Authorization'];
    setHospital(null);
  };

  const refreshHospital=async()=>{
    try{
      const r=await api.get('/hospital-auth/me');
      setHospital(r.data);
      return r.data;
    }catch(err){
      console.error('Refresh hospital error:',err);
    }
  };

  return <Ctx.Provider value={{hospital,login,logout,loading,setHospital,refreshHospital}}>{children}</Ctx.Provider>;
};
export const useAuth=()=>useContext(Ctx);