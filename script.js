// Global variables
let waitingCustomers = 0;
let chairStates = {
    1: 'available',
    2: 'available', 
    3: 'available'
};

// Settings variables
let adminPassword = '123456'; // Default password
let shopSettings = {
    name: 'صالون الحلاقة الملكي',
    subtitle: 'أفضل خدمات الحلاقة والتجميل',
    chairCount: 3,
    maxWaiting: 20
};
// Ensure i18n can see current settings
window.shopSettings = shopSettings;

// =================== 🔥 نظام التحديث الفوري من Firebase ===================

// 🔥 دالة للتحديث الفوري للجميع
window.forceUpdateForAll = function() {
    console.log('🚀 إجبار التحديث لجميع المستخدمين...');
    
    // إرسال إشارة تحديث إلى Firebase
    if (window.firebase && window.firebase.database) {
        try {
            const db = window.firebase.database();
            db.ref('siteUpdates/lastUpdate').set(Date.now())
                .then(() => console.log('✅ تم إرسال إشارة التحديث للجميع'))
                .catch(err => console.error('❌ فشل إرسال التحديث:', err));
        } catch (e) {
            console.warn('⚠️ Firebase Database غير متاح:', e);
        }
    }
    
    // تحديث localStorage لجميع البيانات
    const updateTime = Date.now();
    localStorage.setItem('forceRefreshAll', updateTime.toString());
    localStorage.setItem('lastGlobalUpdate', updateTime.toString());
    
    // تحديث جميع الصفحات المفتوحة
    broadcastUpdateToAllTabs();
    
    // إشعار المستخدم
    if (window.showNotification) {
        window.showNotification('✅ تم إرسال التحديث لجميع الزبائن', 'success');
    }
    
    return true;
};

// 🔥 دالة للتحقق من التحديثات الجديدة
window.checkForUpdates = function() {
    const lastCheck = localStorage.getItem('lastUpdateCheck') || 0;
    const now = Date.now();
    
    // إذا مر أكثر من 30 ثانية منذ آخر تحقق
    if (now - parseInt(lastCheck) > 30000) {
        localStorage.setItem('lastUpdateCheck', now.toString());
        
        // تحديث من Firebase
        if (window.loadAllData) {
            window.loadAllData().then(() => {
                console.log('✅ تم التحقق من التحديثات بنجاح');
                if (window.showNotification) {
                    window.showNotification('✅ تم تحديث البيانات', 'success');
                }
            }).catch(console.warn);
        }
    }
    return true;
};

// 🔥 بث التحديث لجميع التبويبات المفتوحة
function broadcastUpdateToAllTabs() {
    if ('BroadcastChannel' in window) {
        try {
            const updateChannel = new BroadcastChannel('barbershop_updates');
            updateChannel.postMessage({
                type: 'forceUpdate',
                timestamp: Date.now(),
                source: 'admin'
            });
            console.log('📡 تم بث التحديث لجميع التبويبات');
        } catch (e) {
            console.warn('⚠️ فشل بث التحديث:', e);
        }
    }
}

// 🔥 الاستماع للتحديثات من التبويبات الأخرى
if ('BroadcastChannel' in window) {
    const updateChannel = new BroadcastChannel('barbershop_updates');
    updateChannel.onmessage = (event) => {
        if (event.data.type === 'forceUpdate') {
            console.log('📡 تلقيت تحديثاً من تبويب آخر');
            
            // مسح الكاش المحلي
            localStorage.removeItem('lastSystemUpdate');
            localStorage.removeItem('lastUpdateCheck');
            
            // إعادة تحميل البيانات
            if (window.loadAllData) {
                window.loadAllData();
            }
            
            // إعادة تحميل الصفحة إذا كانت هناك تغييرات كبيرة
            setTimeout(() => {
                location.reload();
            }, 1000);
        }
    };
}

// 🔥 تحديث تلقائي من Firebase مباشرة
(function setupRealTimeFirebaseRefresh() {
    console.log('🚀 بدء نظام التحديث التلقائي...');
    
    // رابط فريد للتحديث يختلف لكل مستخدم
    const USER_ID = 'user_' + Math.random().toString(36).substr(2, 9);
    let lastFirebaseUpdate = null;
    let refreshInterval = null;
    
    function startRefreshSystem() {
        // تأكد من عدم وجود فاصل زمني سابق
        if (refreshInterval) clearInterval(refreshInterval);
        
        // تحديث كل 3 ثواني - سريع جداً
        refreshInterval = setInterval(async () => {
            try {
                // التحقق من تحديثات Firebase Realtime Database
                if (window.firebase && window.firebase.database) {
                    const db = window.firebase.database();
                    const updateRef = db.ref('siteUpdates/lastUpdate');
                    
                    updateRef.once('value', (snapshot) => {
                        const newUpdate = snapshot.val();
                        
                        if (newUpdate && newUpdate !== lastFirebaseUpdate) {
                            console.log('🔄 اكتشاف تحديث جديد من Firebase!');
                            lastFirebaseUpdate = newUpdate;
                            
                            // تحديث جميع البيانات
                            if (window.loadAllData) window.loadAllData();
                            if (window.loadContacts) window.loadContacts();
                            if (window.loadGalleryImages) window.loadGalleryImages();
                            if (window.loadBackgroundImage) window.loadBackgroundImage();
                            
                            // إعادة تحميل الصفحة إذا كانت التغييرات كبيرة
                            const lastFullReload = localStorage.getItem('lastFullReload') || 0;
                            if (Date.now() - parseInt(lastFullReload) > 30000) {
                                localStorage.setItem('lastFullReload', Date.now().toString());
                                console.log('🔄 إعادة تحميل الصفحة للتحديثات الكبيرة');
                                location.reload();
                            }
                        }
                    }).catch(() => {
                        // إذا فشل Firebase، استخدم localStorage كبديل
                        checkLocalStorageUpdates();
                    });
                } else {
                    // إذا لم يكن Firebase متاحاً، استخدم localStorage
                    checkLocalStorageUpdates();
                }
                
                // طريقة بديلة: التحقق من localStorage للتحديثات
                const lastLocalUpdate = localStorage.getItem('lastSystemUpdate');
                const serverTime = Date.now();
                
                // إذا مرت 10 ثواني منذ آخر تحديث، تحديث البيانات
                if (!lastLocalUpdate || (serverTime - parseInt(lastLocalUpdate)) > 10000) {
                    localStorage.setItem('lastSystemUpdate', serverTime.toString());
                    
                    // تحديث جميع البيانات المخزنة محلياً
                    if (window.loadAllData) {
                        try { await window.loadAllData(); } catch(e) { console.warn('⚠️', e); }
                    }
                }
                
            } catch (error) {
                console.warn('⚠️ فشل في التحديث التلقائي:', error);
            }
        }, 3000); // كل 3 ثواني
        
        console.log('✅ نظام التحديث التلقائي يعمل كل 3 ثواني');
    }
    
    function checkLocalStorageUpdates() {
        const globalUpdate = localStorage.getItem('lastGlobalUpdate');
        const myLastUpdate = localStorage.getItem('myLastUpdate') || 0;
        
        if (globalUpdate && parseInt(globalUpdate) > parseInt(myLastUpdate)) {
            console.log('🔄 اكتشاف تحديث من localStorage');
            localStorage.setItem('myLastUpdate', globalUpdate);
            
            // إعادة تحميل البيانات
            if (window.loadAllData) window.loadAllData();
            if (window.loadContacts) window.loadContacts();
            if (window.loadGalleryImages) window.loadGalleryImages();
            if (window.loadBackgroundImage) window.loadBackgroundImage();
            
            // إعادة تحميل الصفحة
            setTimeout(() => {
                location.reload();
            }, 500);
        }
    }
    
    // بدء النظام بعد تحميل الصفحة
    setTimeout(() => {
        startRefreshSystem();
    }, 2000);
    
    // تحديث فوري عند فتح الصفحة
    setTimeout(() => {
        if (window.loadAllData) {
            window.loadAllData().catch(console.warn);
        }
    }, 1000);
    
    // علامة في localStorage لمعرفة إذا كان النظام يعمل
    localStorage.setItem('autoRefreshActive', 'true');
    localStorage.setItem('userSessionId', USER_ID);
    
    console.log('✅ نظام التحديث التلقائي مفعل للمستخدم:', USER_ID);
})();

// =================== 🔥 نهاية نظام التحديث ===================

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Load saved settings first (so UI respects custom name/subtitle)
    try { loadSettingsFromLocalStorage(); } catch (_) {}
    updateWaitingCount();
    updateAllChairStates();
    
    // Add smooth animations
    addAnimations();
    
    // Sync shared data from server (settings, contacts, gallery, background)
    try { syncWithServerOnLoad(); } catch (_) {}
    
    // 🔥 بدء التحديث التلقائي فور تحميل الصفحة
    setTimeout(() => {
        if (window.checkForUpdates) window.checkForUpdates();
    }, 3000);
});

// Customer management functions
function addCustomer() {
    waitingCustomers++;
    updateWaitingCount();
    showNotification(t('notify.addCustomer'), 'success');
    animateCounter();
    
    // 🔥 إرسال تحديث للجميع
    setTimeout(() => {
        if (window.forceUpdateForAll) window.forceUpdateForAll();
    }, 100);
}

function removeCustomer() {
    if (waitingCustomers > 0) {
        waitingCustomers--;
        updateWaitingCount();
        showNotification(t('notify.removeCustomer'), 'info');
        animateCounter();
        
        // 🔥 إرسال تحديث للجميع
        setTimeout(() => {
            if (window.forceUpdateForAll) window.forceUpdateForAll();
        }, 100);
    } else {
        showNotification(t('notify.noCustomers'), 'warning');
    }
}

function resetQueue() {
    waitingCustomers = 0;
    updateWaitingCount();
    showNotification(t('notify.resetQueue'), 'info');
    animateCounter();
    
    // 🔥 إرسال تحديث للجميع
    setTimeout(() => {
        if (window.forceUpdateForAll) window.forceUpdateForAll();
    }, 100);
}

// Chair management functions
function toggleChair(chairNumber) {
    const currentState = chairStates[chairNumber];
    chairStates[chairNumber] = currentState === 'available' ? 'occupied' : 'available';
    
    updateChairState(chairNumber);
    
    const newState = chairStates[chairNumber];
    const message = newState === 'occupied' ? 
        t('notify.chairOccupied', { n: chairNumber }) : 
        t('notify.chairAvailable', { n: chairNumber });
    
    showNotification(message, newState === 'occupied' ? 'warning' : 'success');
    
    // If chair becomes available and there are waiting customers, suggest moving customer
    if (newState === 'available' && waitingCustomers > 0) {
        setTimeout(() => {
            if (confirm(t('notify.moveConfirm', { n: chairNumber }))) {
                removeCustomer();
                chairStates[chairNumber] = 'occupied';
                updateChairState(chairNumber);
                showNotification(t('notify.movedToChair', { n: chairNumber }), 'success');
                
                // 🔥 إرسال تحديث للجميع
                setTimeout(() => {
                    if (window.forceUpdateForAll) window.forceUpdateForAll();
                }, 100);
            }
        }, 500);
    } else {
        // 🔥 إرسال تحديث للجميع
        setTimeout(() => {
            if (window.forceUpdateForAll) window.forceUpdateForAll();
        }, 100);
    }
}

// Update functions
function updateWaitingCount() {
    const countElement = document.getElementById('waiting-count');
    if (countElement) {
        countElement.textContent = waitingCustomers;
    }
}

function updateChairState(chairNumber) {
    const chairCard = document.querySelector(`[data-chair="${chairNumber}"]`);
    const statusElement = chairCard.querySelector('.chair-status');
    const chairBtn = document.getElementById(`chairBtn${chairNumber}`);
    const titleEl = chairCard.querySelector('h3');

    // Update chair title label with translation
    if (titleEl) {
        titleEl.textContent = t('chairs.label', { n: chairNumber });
    }
    
    if (chairStates[chairNumber] === 'available') {
        chairCard.className = 'chair-card available';
        statusElement.className = 'chair-status available';
        statusElement.textContent = t('chair.available');
        
        // Update settings button
        if (chairBtn) {
            chairBtn.className = 'chair-control-btn available';
            chairBtn.textContent = t('chair.available');
        }
    } else {
        chairCard.className = 'chair-card occupied';
        statusElement.className = 'chair-status occupied';
        statusElement.textContent = t('chair.occupied');
        
        // Update settings button
        if (chairBtn) {
            chairBtn.className = 'chair-control-btn occupied';
            chairBtn.textContent = t('chair.occupied');
        }
    }
    
    // Add animation
    chairCard.style.transform = 'scale(0.95)';
    setTimeout(() => {
        chairCard.style.transform = 'scale(1)';
    }, 150);
}

function updateAllChairStates() {
    for (let chairNumber in chairStates) {
        updateChairState(parseInt(chairNumber));
    }
}

// Animation functions
function animateCounter() {
    const counter = document.getElementById('waiting-count');
    counter.style.transform = 'scale(1.2)';
    counter.style.color = '#fff';
    
    setTimeout(() => {
        counter.style.transform = 'scale(1)';
    }, 200);
}

function addAnimations() {
    // Add entrance animations
    const sections = document.querySelectorAll('.header, .quick-actions, .waiting-section, .chairs-section, .social-media');
    
    sections.forEach((section, index) => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            section.style.transition = 'all 0.6s ease';
            section.style.opacity = '1';
            section.style.transform = 'translateY(0)';
        }, index * 200);
    });
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${getNotificationIcon(type)}"></i>
        <span>${message}</span>
    `;
    
    // Style the notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: getNotificationColor(type),
        color: 'white',
        padding: '15px 20px',
        borderRadius: '10px',
        boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
        zIndex: '1000',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '14px',
        fontWeight: '600',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease'
    });
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle',
        error: 'times-circle'
    };
    return icons[type] || 'info-circle';
}

function getNotificationColor(type) {
    const colors = {
        success: 'linear-gradient(135deg, #27ae60, #2ecc71)',
        warning: 'linear-gradient(135deg, #f39c12, #e67e22)',
        info: 'linear-gradient(135deg, #3498db, #2980b9)',
        error: 'linear-gradient(135deg, #e74c3c, #c0392b)'
    };
    return colors[type] || colors.info;
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Alt + A: Add customer
    if (e.altKey && e.key === 'a') {
        e.preventDefault();
        addCustomer();
    }
    
    // Alt + R: Remove customer
    if (e.altKey && e.key === 'r') {
        e.preventDefault();
        removeCustomer();
    }
    
    // Alt + C: Reset queue
    if (e.altKey && e.key === 'c') {
        e.preventDefault();
        resetQueue();
    }
    
    // Alt + 1,2,3: Toggle chairs
    if (e.altKey && ['1', '2', '3'].includes(e.key)) {
        e.preventDefault();
        toggleChair(parseInt(e.key));
    }
});

// Auto-save state to localStorage
function saveState() {
    const state = {
        waitingCustomers: waitingCustomers,
        chairStates: chairStates,
        timestamp: new Date().getTime()
    };
    localStorage.setItem('barbershopState', JSON.stringify(state));
}

function loadState() {
    const savedState = localStorage.getItem('barbershopState');
    if (savedState) {
        try {
            const state = JSON.parse(savedState);
            // Only load if saved within last 24 hours
            if (new Date().getTime() - state.timestamp < 24 * 60 * 60 * 1000) {
                waitingCustomers = state.waitingCustomers || 0;
                chairStates = state.chairStates || {1: 'available', 2: 'available', 3: 'available'};
                updateWaitingCount();
                updateAllChairStates();
            }
        } catch (e) {
            console.log('Could not load saved state');
        }
    }
}

// Auto-save every 30 seconds
setInterval(saveState, 30000);

// Load state on page load
document.addEventListener('DOMContentLoaded', loadState);

// Save state before page unload
window.addEventListener('beforeunload', saveState);

// Add some fun features
function addSpecialEffects() {
    // Add confetti when all chairs are occupied
    const allOccupied = Object.values(chairStates).every(state => state === 'occupied');
    if (allOccupied) {
        showNotification(t('notify.specialAllOccupied'), 'success');
    }
    
    // Add warning when queue gets long
    if (waitingCustomers >= 5) {
        showNotification(t('notify.specialLongQueue'), 'warning');
    }
}

// Check for special conditions after each update
function checkSpecialConditions() {
    addSpecialEffects();
}

// Override existing functions to include special checks
const originalAddCustomer = addCustomer;
addCustomer = function() {
    originalAddCustomer();
    checkSpecialConditions();
};

const originalToggleChair = toggleChair;
toggleChair = function(chairNumber) {
    originalToggleChair(chairNumber);
    checkSpecialConditions();
};

// Settings and Password Functions
function openPasswordModal() {
    document.getElementById('passwordModal').style.display = 'block';
    document.getElementById('passwordInput').focus();
}

function closePasswordModal() {
    document.getElementById('passwordModal').style.display = 'none';
    document.getElementById('passwordInput').value = '';
}

function checkPassword() {
    const enteredPassword = document.getElementById('passwordInput').value;
    
    if (enteredPassword === adminPassword) {
        closePasswordModal();
        openSettingsModal();
        showNotification(t('notify.loginSuccessSettings'), 'success');
    } else {
        showNotification(t('notify.passwordWrong'), 'error');
        document.getElementById('passwordInput').value = '';
        document.getElementById('passwordInput').focus();
    }
}

function openSettingsModal() {
    // Load current settings
    document.getElementById('shopName').value = shopSettings.name;
    document.getElementById('shopSubtitle').value = shopSettings.subtitle;
    document.getElementById('chairCount').value = shopSettings.chairCount;
    document.getElementById('maxWaiting').value = shopSettings.maxWaiting;
    
    // Clear password fields
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    
    document.getElementById('settingsModal').style.display = 'block';
}

function closeSettingsModal() {
    document.getElementById('settingsModal').style.display = 'none';
}

// =================== 🔥 دالة saveSettings المعدلة ===================
function saveSettings() {
    const newName = document.getElementById('shopName').value.trim();
    const newSubtitle = document.getElementById('shopSubtitle').value.trim();
    const newChairCount = parseInt(document.getElementById('chairCount').value);
    const newMaxWaiting = parseInt(document.getElementById('maxWaiting').value);
    
    // Validate inputs
    if (!newName || !newSubtitle) {
        showNotification(t('notify.fillRequired'), 'error');
        return;
    }
    
    if (newMaxWaiting < 1 || newMaxWaiting > 100) {
        showNotification(t('notify.maxWaitingRange'), 'error');
        return;
    }
    
    // Check if password change is requested
    const currentPass = document.getElementById('currentPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const confirmPass = document.getElementById('confirmPassword').value;
    
    if (currentPass || newPass || confirmPass) {
        if (!changePassword(currentPass, newPass, confirmPass)) {
            return; // Password change failed
        }
    }
    
    // Update settings
    shopSettings.name = newName;
    shopSettings.subtitle = newSubtitle;
    shopSettings.chairCount = newChairCount;
    shopSettings.maxWaiting = newMaxWaiting;
    
    // Reflect globally for i18n
    window.shopSettings = shopSettings;
    
    // Apply changes to UI
    document.querySelector('.shop-name').textContent = newName;
    document.querySelector('.shop-subtitle').textContent = newSubtitle;
    
    // 🔥 حفظ في Firebase أولاً
    if (window.saveSettingsToFirebase) {
        window.saveSettingsToFirebase(shopSettings);
    } else {
        // إذا لم يكن Firebase متاحاً، استخدم localStorage
        try { localStorage.setItem('barbershopSettings', JSON.stringify(shopSettings)); } catch (_) {}
    }
    
    // 🔥 إرسال إشارة تحديث للجميع
    if (window.forceUpdateForAll) {
        window.forceUpdateForAll();
    }
    
    // Handle chair count changes
    if (newChairCount !== Object.keys(chairStates).length) {
        updateChairCount(newChairCount);
    }
    
    // Save to localStorage (state only)
    saveState();
    
    closeSettingsModal();
    showNotification('✅ تم الحفظ وسيظهر للزبائن خلال 3-5 ثوانٍ', 'success');
    
    // 🔥 تحديث فوري للصفحة الحالية
    setTimeout(() => {
        if (window.loadAllData) window.loadAllData();
    }, 500);
    
    // 🔥 إعادة تحميل الصفحة بعد حفظ الإعدادات
    setTimeout(() => {
        location.reload();
    }, 1500);
}
// =================== 🔥 نهاية الدالة المعدلة ===================

function changePassword(currentPass, newPass, confirmPass) {
    if (currentPass !== adminPassword) {
        showNotification(t('notify.passwordCurrentWrong'), 'error');
        return false;
    }
    
    if (newPass.length < 4 || newPass.length > 6) {
        showNotification(t('notify.passwordNewLength'), 'error');
        return false;
    }
    
    if (newPass !== confirmPass) {
        showNotification(t('notify.passwordConfirmMismatch'), 'error');
        return false;
    }
    
    if (!/^\d+$/.test(newPass)) {
        showNotification(t('notify.passwordOnlyDigits'), 'error');
        return false;
    }
    
    adminPassword = newPass;
    showNotification(t('notify.passwordChanged'), 'success');
    return true;
}

function resetSettings() {
    if (confirm(t('notify.resetSettingsConfirm'))) {
        // Reset to defaults
        shopSettings = {
            name: 'صالون الحلاقة الملكي',
            subtitle: 'أفضل خدمات الحلاقة والتجميل',
            chairCount: 3,
            maxWaiting: 20
        };
        
        // Reflect globally for i18n
        window.shopSettings = shopSettings;
        
        adminPassword = '123456';
        waitingCustomers = 0;
        chairStates = {1: 'available', 2: 'available', 3: 'available'};
        
        // Update UI
        document.querySelector('.shop-name').textContent = shopSettings.name;
        document.querySelector('.shop-subtitle').textContent = shopSettings.subtitle;
        updateWaitingCount();
        updateChairCount(3);
        
        // Clear local state
        localStorage.removeItem('barbershopState');
        // Save default settings so reload keeps them
        try { localStorage.setItem('barbershopSettings', JSON.stringify(shopSettings)); } catch (_) {}
        
        // 🔥 إرسال تحديث للجميع
        if (window.forceUpdateForAll) {
            window.forceUpdateForAll();
        }
        
        closeSettingsModal();
        showNotification(t('notify.resetSettingsDone'), 'info');
        
        // 🔥 إعادة تحميل الصفحة
        setTimeout(() => {
            location.reload();
        }, 1000);
    }
}

function updateChairCount(newCount) {
    const chairsGrid = document.querySelector('.chairs-grid');
    chairsGrid.innerHTML = '';
    
    // Reset chair states
    chairStates = {};
    
    // Create new chairs
    for (let i = 1; i <= newCount; i++) {
        chairStates[i] = 'available';
        
        const chairCard = document.createElement('div');
        chairCard.className = 'chair-card available';
        chairCard.setAttribute('data-chair', i);
        chairCard.innerHTML = `
            <div class="chair-icon">
                <i class="fas fa-chair"></i>
            </div>
            <h3>${t('chairs.label', { n: i })}</h3>
            <span class="chair-status available">${t('chair.available')}</span>
            <button class="toggle-chair-btn" onclick="toggleChair(${i})">تغيير الحالة</button>
        `;
        
        chairsGrid.appendChild(chairCard);
    }
    
    // 🔥 إرسال تحديث للجميع
    if (window.forceUpdateForAll) {
        setTimeout(() => {
            window.forceUpdateForAll();
        }, 500);
    }
}

// Load settings from localStorage and apply to UI
function loadSettingsFromLocalStorage() {
    const saved = localStorage.getItem('barbershopSettings');
    if (!saved) return;
    try {
        const s = JSON.parse(saved);
        if (s && typeof s === 'object') {
            shopSettings = Object.assign(shopSettings, s);
            // Reflect globally for i18n
            window.shopSettings = shopSettings;
            const nameEl = document.querySelector('.shop-name');
            const subEl = document.querySelector('.shop-subtitle');
            if (nameEl && shopSettings.name) nameEl.textContent = shopSettings.name;
            if (subEl && shopSettings.subtitle) subEl.textContent = shopSettings.subtitle;
            if (typeof shopSettings.chairCount === 'number') {
                updateChairCount(shopSettings.chairCount);
            }
        }
    } catch (_) {}
}

// Close modals when clicking outside
window.onclick = function(event) {
    const passwordModal = document.getElementById('passwordModal');
    const settingsModal = document.getElementById('settingsModal');
    
    if (event.target === passwordModal) {
        closePasswordModal();
    }
    if (event.target === settingsModal) {
        closeSettingsModal();
    }
};

// Handle Enter key in password input
document.addEventListener('DOMContentLoaded', function() {
    const passwordInput = document.getElementById('passwordInput');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                checkPassword();
            }
        });
    }
    
    // Load contacts on page load
    loadContacts();
    displayContactsOnMainPage();
});

// Contact Management System
let contacts = [];

const contactTypes = {
    instagram: { name: 'انستغرام', icon: 'fab fa-instagram', color: '#E4405F' },
    facebook: { name: 'فيسبوك', icon: 'fab fa-facebook', color: '#1877F2' },
    tiktok: { name: 'تيك توك', icon: 'fab fa-tiktok', color: '#000000' },
    twitter: { name: 'تويتر', icon: 'fab fa-twitter', color: '#1DA1F2' },
    youtube: { name: 'يوتيوب', icon: 'fab fa-youtube', color: '#FF0000' },
    snapchat: { name: 'سناب شات', icon: 'fab fa-snapchat', color: '#FFFC00' },
    whatsapp: { name: 'واتساب', icon: 'fab fa-whatsapp', color: '#25D366' },
    telegram: { name: 'تيليجرام', icon: 'fab fa-telegram', color: '#0088CC' },
    linkedin: { name: 'لينكد إن', icon: 'fab fa-linkedin', color: '#0A66C2' },
    phone: { name: 'هاتف', icon: 'fas fa-phone', color: '#34C759' },
    email: { name: 'إيميل', icon: 'fas fa-envelope', color: '#007AFF' },
    website: { name: 'موقع إلكتروني', icon: 'fas fa-globe', color: '#5856D6' },
    location: { name: 'الموقع', icon: 'fas fa-map-marker-alt', color: '#FF3B30' }
};

function addContact() {
    const typeSelect = document.getElementById('contactType');
    const valueInput = document.getElementById('contactValue');
    
    const type = typeSelect.value;
    const value = valueInput.value.trim();
    
    if (!type) {
        showNotification(t('notify.contactTypeRequired'), 'error');
        return;
    }
    
    if (!value) {
        showNotification(t('notify.contactValueRequired'), 'error');
        return;
    }
    
    // Check if contact already exists
    const existingContact = contacts.find(contact => contact.type === type);
    if (existingContact) {
        showNotification(t('notify.contactExists'), 'error');
        return;
    }
    
    // Add new contact
    const newContact = {
        id: Date.now(),
        type: type,
        value: value
    };
    
    contacts.push(newContact);
    
    // Clear inputs
    typeSelect.value = '';
    valueInput.value = '';
    
    // Update displays
    displayContactsInSettings();
    displayContactsOnMainPage();
    saveContacts();
    
    showNotification(t('notify.contactAdded'), 'success');
    
    // 🔥 إرسال تحديث للجميع
    if (window.forceUpdateForAll) {
        setTimeout(() => {
            window.forceUpdateForAll();
        }, 100);
    }
}

function deleteContact(contactId) {
    contacts = contacts.filter(contact => contact.id !== contactId);
    displayContactsInSettings();
    displayContactsOnMainPage();
    saveContacts();
    showNotification(t('notify.contactDeleted'), 'info');
    
    // 🔥 إرسال تحديث للجميع
    if (window.forceUpdateForAll) {
        setTimeout(() => {
            window.forceUpdateForAll();
        }, 100);
    }
}

function displayContactsInSettings() {
    const contactsList = document.getElementById('contactsList');
    
    if (contacts.length === 0) {
        contactsList.innerHTML = '<p class="no-contacts">' + t('notify.noContacts') + '</p>';
        return;
    }
    
    contactsList.innerHTML = contacts.map(contact => {
        const contactInfo = contactTypes[contact.type];
        return `
            <div class="contact-item">
                <div class="contact-info">
                    <i class="${contactInfo.icon}" style="color: ${contactInfo.color}"></i>
                    <span class="contact-name">${t('social.' + contact.type)}</span>
                    <span class="contact-value">${contact.value}</span>
                </div>
                <button class="delete-contact-btn" onclick="deleteContact(${contact.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }).join('');
}

function displayContactsOnMainPage() {
    const socialLinks = document.querySelector('.social-links');
    
    if (contacts.length === 0) {
        socialLinks.innerHTML = '<p class="no-social-links">' + t('social.no_links') + '</p>';
        return;
    }
    
    socialLinks.innerHTML = contacts.map(contact => {
        const contactInfo = contactTypes[contact.type];
        let href = contact.value;
        
        // Format different types of links
        if (contact.type === 'phone') {
            href = `tel:${contact.value}`;
        } else if (contact.type === 'email') {
            href = `mailto:${contact.value}`;
        } else if (contact.type === 'whatsapp') {
            href = `https://wa.me/${contact.value}`;
        } else if (!href.startsWith('http') && contact.type !== 'location') {
            href = `https://${contact.value}`;
        }
        
        return `
            <a href="${href}" target="_blank" class="social-link" style="color: ${contactInfo.color}">
                <i class="${contactInfo.icon}"></i>
                <span>${t('social.' + contact.type)}</span>
            </a>
        `;
    }).join('');
}

function saveContacts() {
    localStorage.setItem('barbershopContacts', JSON.stringify(contacts));
    
    // 🔥 حفظ في Firebase إذا كان متاحاً
    if (window.saveContactsToFirebase) {
        window.saveContactsToFirebase(contacts);
    }
}

function loadContacts() {
    const savedContacts = localStorage.getItem('barbershopContacts');
    if (savedContacts) {
        contacts = JSON.parse(savedContacts);
        displayContactsInSettings();
    }
}

// Gallery Management System
let galleryImages = [];

function initializeGallery() {
    loadGalleryImages();
    displayGalleryOnMainPage();
    displayGalleryInSettings();
    setupImageUpload();
}

function setupImageUpload() {
    const imageInput = document.getElementById('imageInput');
    const uploadArea = document.getElementById('uploadArea');
    
    if (imageInput) {
        imageInput.addEventListener('change', handleImageUpload);
    }
    
    if (uploadArea) {
        // Drag and drop functionality
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            handleImageFiles(files);
        });
    }
}

function handleImageUpload(event) {
    const files = event.target.files;
    handleImageFiles(files);
}

function handleImageFiles(files) {
    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const imageData = {
                    id: Date.now() + Math.random(),
                    src: e.target.result,
                    name: file.name,
                    size: file.size,
                    uploadDate: new Date().toLocaleDateString('ar-SA')
                };
                
                galleryImages.push(imageData);
                saveGalleryImages();
                displayGalleryOnMainPage();
                displayGalleryInSettings();
                showNotification('تم رفع الصورة بنجاح', 'success');
                
                // 🔥 إرسال تحديث للجميع
                if (window.forceUpdateForAll) {
                    setTimeout(() => {
                        window.forceUpdateForAll();
                    }, 100);
                }
            };
            reader.readAsDataURL(file);
        } else {
            showNotification('يرجى اختيار ملفات صور فقط', 'error');
        }
    });
    
    // Clear the input
    const imageInput = document.getElementById('imageInput');
    if (imageInput) {
        imageInput.value = '';
    }
}

function deleteImage(imageId) {
    if (confirm(t('gallery.delete_confirm'))) {
        galleryImages = galleryImages.filter(img => img.id !== imageId);
        saveGalleryImages();
        displayGalleryOnMainPage();
        displayGalleryInSettings();
        showNotification(t('gallery.deleted'), 'info');
        
        // 🔥 إرسال تحديث للجميع
        if (window.forceUpdateForAll) {
            setTimeout(() => {
                window.forceUpdateForAll();
            }, 100);
        }
    }
}

function displayGalleryOnMainPage() {
    const galleryContainer = document.getElementById('galleryContainer');
    const noImagesMessage = document.getElementById('noImagesMessage');
    
    if (!galleryContainer) return;
    
    if (galleryImages.length === 0) {
        if (noImagesMessage) {
            noImagesMessage.style.display = 'block';
        }
        // Remove existing gallery grid if it exists
        const existingGrid = galleryContainer.querySelector('.gallery-grid');
        if (existingGrid) {
            existingGrid.remove();
        }
        return;
    }
    
    if (noImagesMessage) {
        noImagesMessage.style.display = 'none';
    }
    
    // Remove existing gallery grid
    const existingGrid = galleryContainer.querySelector('.gallery-grid');
    if (existingGrid) {
        existingGrid.remove();
    }
    
    // Create new gallery grid
    const galleryGrid = document.createElement('div');
    galleryGrid.className = 'gallery-grid';
    
    galleryImages.forEach(image => {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';
        galleryItem.innerHTML = `
            <img src="${image.src}" alt="${image.name}" loading="lazy">
            <div class="gallery-item-overlay">
                <div class="gallery-item-info">
                    <div>${image.name}</div>
                    <div>تاريخ الرفع: ${image.uploadDate}</div>
                </div>
            </div>
        `;
        
        // Add click event to view image in full size
        galleryItem.addEventListener('click', () => {
            viewImageFullSize(image);
        });
        
        galleryGrid.appendChild(galleryItem);
    });
    
    galleryContainer.appendChild(galleryGrid);
}

function displayGalleryInSettings() {
    const galleryManagementList = document.getElementById('galleryManagementList');
    
    if (!galleryManagementList) return;
    
    if (galleryImages.length === 0) {
        galleryManagementList.innerHTML = '<p class="no-images-text">' + t('gallery.no_images_title') + '</p>';
        return;
    }
    
    galleryManagementList.innerHTML = galleryImages.map(image => `
        <div class="gallery-management-item">
            <img src="${image.src}" alt="${image.name}">
            <button class="delete-image-btn" onclick="deleteImage(${image.id})" title="حذف الصورة">
                <i class="fas fa-trash"></i>
            </button>
            <div class="image-info">
                <div>${image.name}</div>
                <div>${formatFileSize(image.size)}</div>
            </div>
        </div>
    `).join('');
}

function viewImageFullSize(image) {
    // Create modal for full-size image view
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        cursor: pointer;
    `;
    
    const img = document.createElement('img');
    img.src = image.src;
    img.style.cssText = `
        max-width: 90%;
        max-height: 90%;
        object-fit: contain;
        border-radius: 10px;
    `;
    
    modal.appendChild(img);
    document.body.appendChild(modal);
    
    // Close modal on click
    modal.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Close modal on escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            document.body.removeChild(modal);
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function saveGalleryImages() {
    localStorage.setItem('barbershopGallery', JSON.stringify(galleryImages));
    
    // 🔥 حفظ في Firebase إذا كان متاحاً
    if (window.saveGalleryToFirebase) {
        window.saveGalleryToFirebase(galleryImages);
    }
}

function loadGalleryImages() {
    const savedImages = localStorage.getItem('barbershopGallery');
    if (savedImages) {
        galleryImages = JSON.parse(savedImages);
    }
}

// Update the DOMContentLoaded event listener to include gallery initialization
document.addEventListener('DOMContentLoaded', function() {
    const passwordInput = document.getElementById('passwordInput');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                checkPassword();
            }
        });
    }
    
    // Load contacts on page load
    loadContacts();
    displayContactsOnMainPage();
    
    // Initialize gallery
    initializeGallery();
    
    // Initialize background management
    initializeBackgroundManagement();

    // Observe language changes to update dynamic UI translations
    try {
        const langObserver = new MutationObserver((mutations) => {
            for (const m of mutations) {
                if (m.attributeName === 'lang') {
                    if (typeof updateAllChairStates === 'function') updateAllChairStates();
                    if (typeof displayContactsInSettings === 'function') displayContactsInSettings();
                    if (typeof displayContactsOnMainPage === 'function') displayContactsOnMainPage();
                    if (typeof displayGalleryOnMainPage === 'function') displayGalleryOnMainPage();
                    if (typeof displayGalleryInSettings === 'function') displayGalleryInSettings();
                    if (typeof displayBackgroundPreview === 'function') displayBackgroundPreview();
                }
            }
        });
        langObserver.observe(document.documentElement, { attributes: true });
    } catch (e) {}
});

// Background Management System
let currentBackground = null;

function initializeBackgroundManagement() {
    loadBackgroundImage();
    displayBackgroundPreview();
    setupBackgroundUpload();
}

function setupBackgroundUpload() {
    const backgroundInput = document.getElementById('backgroundInput');
    const backgroundUploadArea = document.getElementById('backgroundUploadArea');
    
    if (backgroundInput) {
        backgroundInput.addEventListener('change', handleBackgroundUpload);
    }
    
    if (backgroundUploadArea) {
        // Drag and drop functionality
        backgroundUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            backgroundUploadArea.classList.add('dragover');
        });
        
        backgroundUploadArea.addEventListener('dragleave', () => {
            backgroundUploadArea.classList.remove('dragover');
        });
        
        backgroundUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            backgroundUploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleBackgroundFile(files[0]);
            }
        });
        
        // Click to upload
        backgroundUploadArea.addEventListener('click', () => {
            backgroundInput.click();
        });
    }
}

function handleBackgroundUpload(event) {
    const file = event.target.files[0];
    if (file) {
        handleBackgroundFile(file);
    }
}

function handleBackgroundFile(file) {
    if (file.type.startsWith('image/')) {
        // Check file size (limit to 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showNotification(t('background.fileTooLarge'), 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const lang = document.documentElement.lang || 'ar';
            const locale = lang === 'ar' ? 'ar-SA' : (lang === 'fr' ? 'fr-FR' : 'en-US');
            currentBackground = {
                src: e.target.result,
                name: file.name,
                size: file.size,
                uploadDate: new Date().toLocaleDateString(locale)
            };
            
            saveBackgroundImage();
            applyBackgroundImage();
            displayBackgroundPreview();
            showNotification(t('background.changed'), 'success');
            
            // 🔥 إرسال تحديث للجميع
            if (window.forceUpdateForAll) {
                setTimeout(() => {
                    window.forceUpdateForAll();
                }, 100);
            }
        };
        reader.readAsDataURL(file);
    } else {
        showNotification(t('background.onlyImages'), 'error');
    }
    
    // Clear the input
    const backgroundInput = document.getElementById('backgroundInput');
    if (backgroundInput) {
        backgroundInput.value = '';
    }
}

function displayBackgroundPreview() {
    const backgroundPreview = document.getElementById('backgroundPreview');
    const noBackgroundMessage = document.getElementById('noBackgroundMessage');
    const removeBackgroundBtn = document.getElementById('removeBackgroundBtn');
    
    if (!backgroundPreview) return;
    
    if (currentBackground) {
        // Hide no background message
        if (noBackgroundMessage) {
            noBackgroundMessage.style.display = 'none';
        }
        
        // Show background preview
        backgroundPreview.style.backgroundImage = `url(${currentBackground.src})`;
        backgroundPreview.classList.add('has-background');
        
        // Show remove button
        if (removeBackgroundBtn) {
            removeBackgroundBtn.style.display = 'flex';
        }
        
        // Add background info overlay
        let infoOverlay = backgroundPreview.querySelector('.background-info-overlay');
        if (!infoOverlay) {
            infoOverlay = document.createElement('div');
            infoOverlay.className = 'background-info-overlay';
            infoOverlay.style.cssText = `
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(transparent, rgba(0,0,0,0.8));
                color: white;
                padding: 15px 10px 10px;
                font-size: 12px;
                text-align: center;
            `;
            backgroundPreview.appendChild(infoOverlay);
        }
        
        infoOverlay.innerHTML = `
            <div style="font-weight: 600;">${currentBackground.name}</div>
            <div style="opacity: 0.8;">${formatFileSize(currentBackground.size)} • ${currentBackground.uploadDate}</div>
        `;
    } else {
        // Show no background message
        if (noBackgroundMessage) {
            noBackgroundMessage.style.display = 'block';
        }
        
        // Clear background preview
        backgroundPreview.style.backgroundImage = '';
        backgroundPreview.classList.remove('has-background');
        
        // Hide remove button
        if (removeBackgroundBtn) {
            removeBackgroundBtn.style.display = 'none';
        }
        
        // Remove info overlay
        const infoOverlay = backgroundPreview.querySelector('.background-info-overlay');
        if (infoOverlay) {
            infoOverlay.remove();
        }
    }
}

function applyBackgroundImage() {
    const body = document.body;
    
    if (currentBackground) {
        body.style.backgroundImage = `url(${currentBackground.src})`;
        body.classList.add('custom-background');
    } else {
        body.style.backgroundImage = '';
        body.classList.remove('custom-background');
    }
}

function removeBackground() {
    if (confirm(t('background.remove_confirm'))) {
        currentBackground = null;
        saveBackgroundImage();
        applyBackgroundImage();
        displayBackgroundPreview();
        showNotification(t('background.removed'), 'info');
        
        // 🔥 إرسال تحديث للجميع
        if (window.forceUpdateForAll) {
            setTimeout(() => {
                window.forceUpdateForAll();
            }, 100);
        }
    }
}

function saveBackgroundImage() {
    if (currentBackground) {
        localStorage.setItem('barbershopBackground', JSON.stringify(currentBackground));
        
        // 🔥 حفظ في Firebase إذا كان متاحاً
        if (window.saveBackgroundToFirebase) {
            window.saveBackgroundToFirebase(currentBackground);
        }
    } else {
        localStorage.removeItem('barbershopBackground');
        
        // 🔥 حذف من Firebase إذا كان متاحاً
        if (window.removeBackgroundFromFirebase) {
            window.removeBackgroundFromFirebase();
        }
    }
}

function loadBackgroundImage() {
    const savedBackground = localStorage.getItem('barbershopBackground');
    if (savedBackground) {
        currentBackground = JSON.parse(savedBackground);
        applyBackgroundImage();
    }
}

// =================== 🔥 نظام التحديث اليدوي ===================

// زر تحديث يدوي يظهر في الصفحة
function addManualRefreshButton() {
    // تحقق إذا كان الزر موجوداً مسبقاً
    if (document.getElementById('manualRefreshBtn')) return;
    
    const refreshBtn = document.createElement('button');
    refreshBtn.id = 'manualRefreshBtn';
    refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> تحديث الآن';
    refreshBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: linear-gradient(135deg, #3498db, #2980b9);
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 25px;
        font-size: 14px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 3px 15px rgba(52, 152, 219, 0.4);
        z-index: 9999;
        transition: all 0.3s;
    `;
    
    refreshBtn.onmouseover = function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 5px 20px rgba(52, 152, 219, 0.6)';
    };
    
    refreshBtn.onmouseout = function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 3px 15px rgba(52, 152, 219, 0.4)';
    };
    
    refreshBtn.onclick = function() {
        // إضافة تأثير دوران للزر
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحديث...';
        this.disabled = true;
        
        // تحديث جميع البيانات
        if (window.loadAllData) {
            window.loadAllData().then(() => {
                // استعادة الزر بعد التحديث
                setTimeout(() => {
                    this.innerHTML = '<i class="fas fa-sync-alt"></i> تحديث الآن';
                    this.disabled = false;
                    if (window.showNotification) {
                        window.showNotification('✅ تم تحديث البيانات بنجاح', 'success');
                    }
                }, 1000);
            }).catch(() => {
                // في حالة فشل التحديث
                this.innerHTML = '<i class="fas fa-exclamation-triangle"></i> فشل التحديث';
                setTimeout(() => {
                    this.innerHTML = '<i class="fas fa-sync-alt"></i> تحديث الآن';
                    this.disabled = false;
                }, 2000);
            });
        } else {
            // إعادة تحميل الصفحة إذا فشل التحديث
            location.reload();
        }
    };
    
    document.body.appendChild(refreshBtn);
    
    // إظهار إشعار عند ظهور الزر
    setTimeout(() => {
        if (window.showNotification) {
            window.showNotification('🔄 يمكنك استخدام زر التحديث في الزاوية السفلية', 'info');
        }
    }, 3000);
}

// إضافة زر التحديث عند تحميل الصفحة
setTimeout(addManualRefreshButton, 2000);

// =================== 🔥 نهاية النظام اليدوي ===================
