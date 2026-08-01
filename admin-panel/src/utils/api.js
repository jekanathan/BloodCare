import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

// Response interceptor for error handling
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('bloodcare_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
