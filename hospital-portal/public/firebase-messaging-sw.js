// public/firebase-messaging-sw.js
// This file MUST be placed directly in the `public/` folder (not src/) of each portal,
// and MUST be served from the root (e.g. https://yourapp.com/firebase-messaging-sw.js).

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDo4P2O-RRFhcN-Q4mrUOV35yrGbmZvFiY",
  authDomain: "bloodcare-b4c11.firebaseapp.com",
  projectId: "bloodcare-b4c11",
  storageBucket: "bloodcare-b4c11.firebasestorage.app",
  messagingSenderId: "607544741080",
  appId: "1:607544741080:web:92dffee999759acad49bad",
});

const messaging = firebase.messaging();

// Handles notifications that arrive while the tab is closed / in background
messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || 'BloodCare', {
    body: body || '',
    icon: '/logo192.png', // optional — falls back gracefully if missing
  });
});