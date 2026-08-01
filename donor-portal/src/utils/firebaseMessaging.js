// src/utils/firebaseMessaging.js
// Drop this file into src/utils/ of donor-portal, hospital-portal, and bloodbank-portal.
// Call requestPushPermission(portal, email, name, bloodGroup) once the user is logged in
// (bloodGroup is optional — only donors have one).

import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import axios from 'axios';

const firebaseConfig = {
  apiKey: "AIzaSyDo4P2O-RRFhcN-Q4mrUOV35yrGbmZvFiY",
  authDomain: "bloodcare-b4c11.firebaseapp.com",
  projectId: "bloodcare-b4c11",
  storageBucket: "bloodcare-b4c11.firebasestorage.app",
  messagingSenderId: "607544741080",
  appId: "1:607544741080:web:92dffee999759acad49bad",
};

const VAPID_KEY = "BKvO5FG93QlYlJrcR_57RNOke36xAydX44xxEVvMQRdLR6F4p3Iclf7nXVlGLlFqxoNSP8QuuXx1J2n5eGhaq8A";

// IMPORTANT: change this to match each portal's own API base URL / port.
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const firebaseApp = initializeApp(firebaseConfig);

/**
 * Requests browser notification permission, gets an FCM token, and registers
 * it with the backend so admin broadcasts can reach this device.
 * @param {string} portal - 'donor' | 'hospital' | 'bloodbank'
 * @param {string} ownerEmail - the logged-in user's email
 * @param {string} ownerName
 * @param {string} [bloodGroup] - only for donor portal
 */
export async function requestPushPermission(portal, ownerEmail, ownerName, bloodGroup) {
  try {
    if (!('serviceWorker' in navigator) || !('Notification' in window)) {
      console.warn('Push notifications are not supported in this browser.');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Push permission not granted.');
      return null;
    }

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const messaging = getMessaging(firebaseApp);
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });

    if (!token) {
      console.warn('Could not get push token.');
      return null;
    }

    await axios.post(`${API_BASE}/push/register-token`, {
      token, portal, ownerEmail, ownerName, bloodGroup,
    });

    // Show a toast/notification while the tab is open and active
    onMessage(messaging, (payload) => {
      const { title, body } = payload.notification || {};
      if (title) {
        new Notification(title, { body });
      }
    });

    console.log('✅ Push notifications enabled.');
    return token;
  } catch (err) {
    console.error('Push permission setup failed:', err);
    return null;
  }
}