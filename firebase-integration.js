// firebase-integration.js - دمج البيانات مع Firebase Realtime Database
import { db } from './firebase-init.js';
import { ref, get, set, onValue } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';

const rSettings = ref(db, 'settings');
const rContacts = ref(db, 'contacts');
const rGallery = ref(db, 'gallery');
const rBackground = ref(db, 'background');
const rVersion = ref(db, 'version');

function bumpVersion() {
  try {
    set(rVersion, Date.now());
  } catch (e) {
    console.warn('تعذّر تحديث النسخة في Firebase:', e);
  }
}

function applyShopSettings(settings) {
  if (!settings) return;
  window.shopSettings = { ...(window.shopSettings || {}), ...settings };
  const nameEl = document.querySelector('.shop-name');
  const subtitleEl = document.querySelector('.shop-subtitle');
  if (nameEl && window.shopSettings?.name) nameEl.textContent = window.shopSettings.name;
  if (subtitleEl && window.shopSettings?.subtitle) subtitleEl.textContent = window.shopSettings.subtitle;
  if (typeof window.updateChairCount === 'function' && typeof window.shopSettings?.chairCount === 'number') {
    window.updateChairCount(window.shopSettings.chairCount);
  }
  try {
    localStorage.setItem('barbershopSettings', JSON.stringify(window.shopSettings));
  } catch {}
}

function applyContacts(list) {
  window.contacts = Array.isArray(list) ? list : [];
  try {
    localStorage.setItem('barbershopContacts', JSON.stringify(window.contacts));
  } catch {}
  if (typeof window.displayContactsInSettings === 'function') window.displayContactsInSettings();
  if (typeof window.displayContactsOnMainPage === 'function') window.displayContactsOnMainPage();
}

function applyGallery(images) {
  window.galleryImages = Array.isArray(images) ? images : [];
  try {
    localStorage.setItem('barbershopGallery', JSON.stringify(window.galleryImages));
  } catch {}
  // إن وُجدت دالة لتحديث واجهة المعرض نستدعيها
  if (typeof window.updateGalleryUI === 'function') window.updateGalleryUI();
}

function applyBackground(bg) {
  window.currentBackground = bg || null;
  try {
    localStorage.setItem('barbershopBackground', JSON.stringify(window.currentBackground));
  } catch {}
  if (typeof window.applyBackgroundImage === 'function') window.applyBackgroundImage();
}

async function ensureAuth() {
  try {
    const auth = getAuth();
    if (!auth.currentUser) {
      console.log('Firebase: محاولة تسجيل دخول مجهول...');
      await signInAnonymously(auth);
      console.log('Firebase: تم تسجيل الدخول المجهول بنجاح');
    }
  } catch (e) {
    console.warn('Firebase Auth: فشل التسجيل المجهول. تأكد من تفعيل Anonymous Authentication في Firebase Console:', e?.code || e?.message || e);
  }
}

async function syncFirebaseOnLoad() {
  try {
    // محاولة المصادقة أولاً
    await ensureAuth();
    
    console.log('Firebase: بدء قراءة البيانات...');
    const [s, c, g, b, v] = await Promise.all([
      get(rSettings),
      get(rContacts),
      get(rGallery),
      get(rBackground),
      get(rVersion)
    ]);

    console.log('Firebase: تم قراءة البيانات بنجاح');
    applyShopSettings(s?.val());
    applyContacts(c?.val());
    applyGallery(g?.val());
    applyBackground(b?.val());

    if (v?.exists()) {
      window.__lastVersion = v.val();
    }

    // مراقبة تغييرات النسخة لإعادة التحميل التلقائي
    onValue(rVersion, (snap) => {
      const nv = snap.val();
      if (window.__lastVersion == null) {
        window.__lastVersion = nv;
        return;
      }
      if (nv !== window.__lastVersion) {
        window.__lastVersion = nv;
        console.log('Firebase: تم اكتشاف تحديث، إعادة تحميل الصفحة...');
        location.reload();
      }
    });

    // مراقبة تغييرات البيانات الأخرى
    onValue(rSettings, (snap) => {
      console.log('Firebase: تحديث الإعدادات');
      applyShopSettings(snap.val());
    });
    
    onValue(rContacts, (snap) => {
      console.log('Firebase: تحديث جهات الاتصال');
      applyContacts(snap.val());
    });
    
    onValue(rGallery, (snap) => {
      console.log('Firebase: تحديث المعرض');
      applyGallery(snap.val());
    });
    
    onValue(rBackground, (snap) => {
      console.log('Firebase: تحديث الخلفية');
      applyBackground(snap.val());
    });

    console.log('Firebase: تم تهيئة التكامل بنجاح');
  } catch (e) {
    console.error('خطأ تزامن Firebase:', e);
    if (e?.code === 'PERMISSION_DENIED') {
      console.error('Firebase: مرفوض الوصول. تحقق من قواعد قاعدة البيانات في Firebase Console');
    }
  }
}

function safeWrap(fnName, afterFn) {
  if (typeof window.wrapAfter === 'function') {
    try {
      window.wrapAfter(fnName, afterFn);
    } catch (e) {
      console.warn('تعذّر ربط', fnName, e);
    }
  }
}

// ربط عمليات الحفظ/التعديل لرفعها إلى Firebase مع زيادة النسخة
safeWrap('saveSettings', async () => {
  try { 
    await ensureAuth();
    await set(rSettings, window.shopSettings); 
    bumpVersion(); 
    console.log('Firebase: تم حفظ الإعدادات بنجاح');
  } catch (e) { 
    console.error('Firebase: فشل حفظ الإعدادات:', e?.code || e?.message || e); 
  }
});

safeWrap('resetSettings', async () => {
  try { 
    await ensureAuth();
    await set(rSettings, window.shopSettings); 
    bumpVersion(); 
    console.log('Firebase: تم إعادة تعيين الإعدادات بنجاح');
  } catch (e) { 
    console.error('Firebase: فشل إعادة تعيين الإعدادات:', e?.code || e?.message || e); 
  }
});

safeWrap('saveContacts', async () => {
  try {
    await ensureAuth();
    const list = JSON.parse(localStorage.getItem('barbershopContacts') || '[]');
    await set(rContacts, list); 
    bumpVersion();
    console.log('Firebase: تم حفظ جهات الاتصال بنجاح');
  } catch (e) { 
    console.error('Firebase: فشل حفظ جهات الاتصال:', e?.code || e?.message || e); 
  }
});

safeWrap('deleteContact', async () => {
  try {
    await ensureAuth();
    const list = JSON.parse(localStorage.getItem('barbershopContacts') || '[]');
    await set(rContacts, list); 
    bumpVersion();
    console.log('Firebase: تم حذف جهة الاتصال بنجاح');
  } catch (e) { 
    console.error('Firebase: فشل حذف جهة الاتصال:', e?.code || e?.message || e); 
  }
});

safeWrap('handleImageFiles', async () => {
  try {
    await ensureAuth();
    const imgs = JSON.parse(localStorage.getItem('barbershopGallery') || '[]');
    await set(rGallery, imgs); 
    bumpVersion();
    console.log('Firebase: تم حفظ صور المعرض بنجاح');
  } catch (e) { 
    console.error('Firebase: فشل حفظ صور المعرض:', e?.code || e?.message || e); 
  }
});

safeWrap('deleteImage', async () => {
  try {
    await ensureAuth();
    const imgs = JSON.parse(localStorage.getItem('barbershopGallery') || '[]');
    await set(rGallery, imgs); 
    bumpVersion();
    console.log('Firebase: تم حذف الصورة بنجاح');
  } catch (e) { 
    console.error('Firebase: فشل حذف الصورة:', e?.code || e?.message || e); 
  }
});

safeWrap('saveBackgroundImage', async () => {
  try {
    await ensureAuth();
    const bg = JSON.parse(localStorage.getItem('barbershopBackground') || 'null');
    await set(rBackground, bg || null); 
    bumpVersion();
    console.log('Firebase: تم حفظ صورة الخلفية بنجاح');
  } catch (e) { 
    console.error('Firebase: فشل حفظ صورة الخلفية:', e?.code || e?.message || e); 
  }
});

safeWrap('removeBackground', async () => {
  try {
    await ensureAuth();
    const bg = JSON.parse(localStorage.getItem('barbershopBackground') || 'null');
    await set(rBackground, bg || null); 
    bumpVersion();
    console.log('Firebase: تم حذف صورة الخلفية بنجاح');
  } catch (e) { 
    console.error('Firebase: فشل حذف صورة الخلفية:', e?.code || e?.message || e); 
  }
});

// بدء التزامن عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', syncFirebaseOnLoad);