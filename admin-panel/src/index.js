import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import BloodCareAI from './components/BloodCareAI';

// Dark mode — page load-லயே apply பண்ணு (flicker இல்லாம)
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  document.body.classList.add('dark-mode');
  document.body.style.background = '#0F172A';
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
    <BloodCareAI />
  </React.StrictMode>
);