import axios from 'axios';
const api=axios.create({baseURL:process.env.REACT_APP_API_URL||'http://localhost:5000/api'});
api.interceptors.response.use(r=>r,e=>{if(e.response?.status===401){localStorage.removeItem('bc_bb_token');window.location.href='/login';}return Promise.reject(e);});
export default api;
