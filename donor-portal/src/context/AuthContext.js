import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [donor, setDonor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('bc_donor_token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      api.get('/donor/me')
        .then(res => setDonor(res.data))
        .catch(() => localStorage.removeItem('bc_donor_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/donor/login', { email, password });
    const { token, donor } = res.data;
    localStorage.setItem('bc_donor_token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setDonor(donor);
    return donor;
  };

  const register = async (data) => {
    const res = await api.post('/donor/register', data);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('bc_donor_token');
    delete api.defaults.headers.common['Authorization'];
    setDonor(null);
  };

  const updateDonor = (data) => setDonor(prev => ({ ...prev, ...data }));

  const refreshDonor = async () => {
    try {
      const res = await api.get('/donor/me');
      setDonor(res.data);
      return res.data;
    } catch (err) {
      console.error('Refresh donor error:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ donor, login, register, logout, loading, updateDonor, refreshDonor }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);