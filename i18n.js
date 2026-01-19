// Simple i18n module for the barbershop app
(() => {
  const root = document.documentElement;
  let currentLang = localStorage.getItem('barbershopLang') || root.lang || 'ar';

  const translations = {
    ar: {
      app: { title: 'صالون الحلاقة الملكي', subtitle: 'أفضل خدمات الحلاقة والتجميل' },
      waiting: { title: 'العملاء المنتظرون', unit: 'عملاء' },
      chairs: { title: 'الكراسي', label: 'كرسي {n}' },
      chair: { available: 'متاح', occupied: 'مشغول' },
      gallery: { title: 'معرض الصور', no_images_title: 'لا توجد صور مرفوعة', no_images_sub: 'قم برفع الصور من الإعدادات' },
      social: {
        title: 'وسائل التواصل الاجتماعي',
        instagram: 'إنستغرام', facebook: 'فيسبوك', tiktok: 'تيك توك', twitter: 'تويتر', youtube: 'يوتيوب', snapchat: 'سناب شات',
        whatsapp: 'واتساب', telegram: 'تيليجرام', linkedin: 'لينكد إن', phone: 'الهاتف', email: 'إيميل', website: 'موقع إلكتروني', location: 'الموقع',
        no_links: 'لا توجد روابط اجتماعية'
      },
      notify: {
        addCustomer: 'تم إضافة عميل جديد',
        removeCustomer: 'تم إزالة عميل',
        noCustomers: 'لا يوجد عملاء في الانتظار',
        resetQueue: 'تم إعادة تعيين قائمة الانتظار',
        chairOccupied: 'كرسي {n} أصبح مشغولاً',
        chairAvailable: 'كرسي {n} أصبح متاحاً',
        moveConfirm: 'هل تريد نقل عميل من قائمة الانتظار إلى كرسي {n}؟',
        movedToChair: 'تم نقل عميل إلى كرسي {n}',
        fillRequired: 'يرجى ملء جميع الحقول المطلوبة',
        maxWaitingRange: 'الحد الأقصى للعملاء يجب أن يكون بين 1 و 100',
        settingsSaved: 'تم حفظ الإعدادات بنجاح',
        loginSuccessSettings: 'تم الدخول بنجاح إلى الإعدادات',
        passwordWrong: 'الرمز السري غير صحيح',
        passwordCurrentWrong: 'الرمز السري الحالي غير صحيح',
        passwordNewLength: 'الرمز السري الجديد يجب أن يكون بين 4 و 6 أرقام',
        passwordConfirmMismatch: 'تأكيد الرمز السري غير متطابق',
        passwordOnlyDigits: 'الرمز السري يجب أن يحتوي على أرقام فقط',
        passwordChanged: 'تم تغيير الرمز السري بنجاح',
        resetSettingsConfirm: 'هل أنت متأكد من إعادة تعيين جميع الإعدادات؟',
        resetSettingsDone: 'تم إعادة تعيين جميع الإعدادات',
        specialAllOccupied: 'جميع الكراسي مشغولة! 🎉',
        specialLongQueue: 'قائمة انتظار طويلة! ⚠️',
        contactTypeRequired: 'يرجى اختيار نوع التواصل',
        contactValueRequired: 'يرجى إدخال الرابط أو المعلومات',
        contactExists: 'هذا النوع من التواصل موجود بالفعل',
        contactAdded: 'تم إضافة جهة الاتصال بنجاح',
        contactDeleted: 'تم حذف جهة الاتصال',
        noContacts: 'لا توجد جهات اتصال مضافة',
        noSocialLinks: 'لا توجد روابط اجتماعية'
      },
      background: {
        remove_confirm: 'هل أنت متأكد من إزالة خلفية الصفحة؟',
        removed: 'تم إزالة خلفية الصفحة',
        fileTooLarge: 'حجم الصورة كبير جداً. يرجى اختيار صورة أصغر من 5 ميجابايت',
        changed: 'تم تغيير خلفية الصفحة بنجاح',
        onlyImages: 'يرجى اختيار ملف صورة فقط'
      },
      gallery: {
        title: 'معرض الصور',
        no_images_title: 'لا توجد صور مرفوعة',
        no_images_sub: 'قم برفع الصور من الإعدادات',
        delete_confirm: 'هل أنت متأكد من حذف هذه الصورة؟',
        deleted: 'تم حذف الصورة'
      },
      footer: { rights: 'جميع الحقوق محفوظة.' }
    },
    fr: {
      app: { title: 'Salon de coiffure Royal', subtitle: 'Meilleurs services de coiffure et de beauté' },
      waiting: { title: 'Clients en attente', unit: 'Clients' },
      chairs: { title: 'Chaises', label: 'Chaise {n}' },
      chair: { available: 'Disponible', occupied: 'Occupée' },
      gallery: { title: 'Galerie', no_images_title: 'Aucune image téléchargée', no_images_sub: 'Ajoutez des images depuis les paramètres' },
      social: {
        title: 'Réseaux sociaux',
        instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', twitter: 'Twitter', youtube: 'YouTube', snapchat: 'Snapchat',
        whatsapp: 'WhatsApp', telegram: 'Telegram', linkedin: 'LinkedIn', phone: 'Téléphone', email: 'Email', website: 'Site Web', location: 'Localisation',
        no_links: 'Aucun lien social'
      },
      notify: {
        addCustomer: 'Nouveau client ajouté',
        removeCustomer: 'Client supprimé',
        noCustomers: 'Aucun client en attente',
        resetQueue: 'File d’attente réinitialisée',
        chairOccupied: 'Chaise {n} occupée',
        chairAvailable: 'Chaise {n} disponible',
        moveConfirm: 'Déplacer un client vers la chaise {n} ?',
        movedToChair: 'Client déplacé à la chaise {n}',
        fillRequired: 'Veuillez remplir tous les champs requis',
        maxWaitingRange: 'Le maximum de clients doit être entre 1 et 100',
        settingsSaved: 'Paramètres enregistrés avec succès',
        loginSuccessSettings: 'Accès aux paramètres réussi',
        passwordWrong: 'Mot de passe incorrect',
        passwordCurrentWrong: 'Mot de passe actuel incorrect',
        passwordNewLength: 'Le nouveau mot de passe doit comporter 4 à 6 chiffres',
        passwordConfirmMismatch: 'La confirmation ne correspond pas',
        passwordOnlyDigits: 'Le mot de passe doit contenir uniquement des chiffres',
        passwordChanged: 'Mot de passe modifié avec succès',
        resetSettingsConfirm: 'Êtes-vous sûr de réinitialiser tous les paramètres ?',
        resetSettingsDone: 'Tous les paramètres ont été réinitialisés',
        specialAllOccupied: 'Toutes les chaises sont occupées ! 🎉',
        specialLongQueue: 'File d’attente longue ! ⚠️',
        contactTypeRequired: 'Veuillez choisir le type de contact',
        contactValueRequired: 'Veuillez saisir le lien ou les informations',
        contactExists: 'Ce type de contact existe déjà',
        contactAdded: 'Contact ajouté avec succès',
        contactDeleted: 'Contact supprimé',
        noContacts: 'Aucun contact ajouté',
        noSocialLinks: 'Aucun lien social'
      },
      background: {
        remove_confirm: 'Êtes-vous sûr de retirer l’arrière-plan ?',
        removed: 'Arrière-plan retiré',
        fileTooLarge: 'Image trop volumineuse. Choisissez une image de moins de 5 Mo',
        changed: 'Arrière-plan modifié avec succès',
        onlyImages: 'Veuillez choisir un fichier image uniquement'
      },
      gallery: {
        title: 'Galerie',
        no_images_title: 'Aucune image téléchargée',
        no_images_sub: 'Ajoutez des images depuis les paramètres',
        delete_confirm: 'Êtes-vous sûr de supprimer cette image ?',
        deleted: 'Image supprimée'
      },
      footer: { rights: 'Tous droits réservés.' }
    },
    en: {
      app: { title: 'Royal Barbershop', subtitle: 'Best barber and grooming services' },
      waiting: { title: 'Waiting Customers', unit: 'Customers' },
      chairs: { title: 'Chairs', label: 'Chair {n}' },
      chair: { available: 'Available', occupied: 'Occupied' },
      gallery: { title: 'Photo Gallery', no_images_title: 'No images uploaded', no_images_sub: 'Upload photos from settings' },
      social: {
        title: 'Social Media',
        instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', twitter: 'Twitter', youtube: 'YouTube', snapchat: 'Snapchat',
        whatsapp: 'WhatsApp', telegram: 'Telegram', linkedin: 'LinkedIn', phone: 'Phone', email: 'Email', website: 'Website', location: 'Location',
        no_links: 'No social links'
      },
      notify: {
        addCustomer: 'New customer added',
        removeCustomer: 'Customer removed',
        noCustomers: 'No waiting customers',
        resetQueue: 'Queue reset',
        chairOccupied: 'Chair {n} is occupied',
        chairAvailable: 'Chair {n} is available',
        moveConfirm: 'Move a waiting customer to chair {n}?',
        movedToChair: 'Moved a customer to chair {n}',
        fillRequired: 'Please fill all required fields',
        maxWaitingRange: 'Max waiting must be between 1 and 100',
        settingsSaved: 'Settings saved successfully',
        loginSuccessSettings: 'Accessed settings successfully',
        passwordWrong: 'Incorrect password',
        passwordCurrentWrong: 'Current password is incorrect',
        passwordNewLength: 'New password must be 4–6 digits',
        passwordConfirmMismatch: 'Password confirmation does not match',
        passwordOnlyDigits: 'Password must contain digits only',
        passwordChanged: 'Password changed successfully',
        resetSettingsConfirm: 'Are you sure to reset all settings?',
        resetSettingsDone: 'All settings reset',
        specialAllOccupied: 'All chairs are occupied! 🎉',
        specialLongQueue: 'Long waiting queue! ⚠️',
        contactTypeRequired: 'Please select contact type',
        contactValueRequired: 'Please enter the link or info',
        contactExists: 'This contact type already exists',
        contactAdded: 'Contact added successfully',
        contactDeleted: 'Contact deleted',
        noContacts: 'No contacts added',
        noSocialLinks: 'No social links'
      },
      background: {
        remove_confirm: 'Are you sure you want to remove the page background?',
        removed: 'Page background removed',
        fileTooLarge: 'Image is too large. Please choose one under 5 MB',
        changed: 'Page background changed successfully',
        onlyImages: 'Please choose an image file only'
      },
      gallery: {
        title: 'Photo Gallery',
        no_images_title: 'No images uploaded',
        no_images_sub: 'Upload photos from settings',
        delete_confirm: 'Are you sure you want to delete this image?',
        deleted: 'Image deleted'
      },
      footer: { rights: 'All rights reserved.' }
    }
  };

  function t(key, vars = {}) {
    const parts = key.split('.');
    let value = translations[currentLang];
    for (const p of parts) {
      if (value && p in value) value = value[p]; else { value = null; break; }
    }
    if (typeof value === 'string') {
      return value.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
    }
    return key; // fallback: show key if missing
  }

  function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      // Respect custom shop settings if present
      if (el.classList && el.classList.contains('shop-name')) {
        const customName = (window.shopSettings && window.shopSettings.name) || null;
        if (customName) { el.textContent = customName; return; }
      }
      if (el.classList && el.classList.contains('shop-subtitle')) {
        const customSubtitle = (window.shopSettings && window.shopSettings.subtitle) || null;
        if (customSubtitle) { el.textContent = customSubtitle; return; }
      }
      const text = t(key);
      if (text) el.textContent = text;
    });
  }

  function updateLangLabel() {
    const labelEl = document.querySelector('#langCurrentBtn .lang-label');
    if (!labelEl) return;
    labelEl.textContent = currentLang === 'ar' ? 'ع' : (currentLang === 'fr' ? 'Fr' : 'En');
  }

  function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('barbershopLang', currentLang);
    root.lang = currentLang;
    root.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    updateLangLabel();
    applyTranslations();
  }

  function initLangSwitcher() {
    const currentBtn = document.getElementById('langCurrentBtn');
    const menu = document.getElementById('langMenu');
    const switcher = document.getElementById('langSwitcher');
    if (!currentBtn || !menu || !switcher) return;

    currentBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      switcher.classList.toggle('open');
    });
    menu.querySelectorAll('button[data-lang]').forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang');
        setLanguage(lang);
        switcher.classList.remove('open');
      });
    });
    window.addEventListener('click', (e) => {
      if (!switcher.contains(e.target)) switcher.classList.remove('open');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    // Initialize current language and translations
    setLanguage(currentLang);
    initLangSwitcher();
  });

  // Expose globally if needed by other scripts
  window.t = t;
  window.setLanguage = setLanguage;
  window.applyTranslations = applyTranslations;
})();