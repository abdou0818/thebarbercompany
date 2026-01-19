// firebase-init.js - تهيئة Firebase بإصدار ESM من CDN
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-analytics.js';
import { getDatabase } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js';

// بيانات التهيئة المقدمة
export const firebaseConfig = {
  apiKey: 'AIzaSyDoUWRZcK0ARp_2ZPoO7OifAzt4YKB9KWc',
  authDomain: 'my-website-settings.firebaseapp.com',
  databaseURL: 'https://my-website-settings-default-rtdb.firebaseio.com',
  projectId: 'my-website-settings',
  storageBucket: 'my-website-settings.firebasestorage.app',
  messagingSenderId: '88338120159',
  appId: '1:88338120159:web:e62460cc704f49866bd86a',
  measurementId: 'G-06QQVH27E2'
};

// Initialize Firebase (يدعم التكوين المخصص إن وُجد)
const effectiveConfig = (typeof window !== 'undefined' && window.__firebaseConfigOverride)
  ? window.__firebaseConfigOverride
  : firebaseConfig;
export const app = initializeApp(effectiveConfig);

// Analytics اختياري، قد يفشل على بيئات محلية بدون دعم gtag
export let analytics;
try {
  analytics = getAnalytics(app);
} catch (err) {
  console.warn('Firebase Analytics غير مفعّل أو غير مدعوم في هذه البيئة:', err?.message || err);
}

// قاعدة البيانات (Realtime Database)
export const db = getDatabase(app);