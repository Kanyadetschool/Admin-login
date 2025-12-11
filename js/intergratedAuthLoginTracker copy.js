const NOTIFICATION_VOLUME = 0.5;

// Add comprehensive logging
const AUTH_LOG = {
    log: (message, data = null) => {
        const timestamp = new Date().toISOString();
        console.log(`[AUTH ${timestamp}] ${message}`, data || '');
    },
    error: (message, error = null) => {
        const timestamp = new Date().toISOString();
        console.error(`[AUTH ERROR ${timestamp}] ${message}`, error || '');
    }
};

// =============================================================================
// FIXED: checkSessionValidity - NOW CHECKS SESSION REVOCATION
// =============================================================================

async function checkSessionValidity(email) {
    AUTH_LOG.log('Checking session validity for:', email);
    
    try {
        const docRef = firebase.firestore().collection('authorized_users').doc(email.toLowerCase());
        const doc = await docRef.get();
        
        if (!doc.exists) {
            AUTH_LOG.error('User document no longer exists');
            return { valid: false, reason: 'User removed from system' };
        }
        
        const userData = doc.data();
        
        // Check approval
        const isApproved = userData.approved === true || 
                          userData.approved === 'true' ||
                          userData['approved '] === true ||
                          userData['approved '] === 'true';
        
        if (!isApproved) {
            AUTH_LOG.error('User no longer approved');
            return { valid: false, reason: 'Access revoked by administrator' };
        }
        
        // Check if disabled
        const isDisabled = userData.disabled === true || userData.disabled === 'true';
        if (isDisabled) {
            AUTH_LOG.error('User account disabled');
            return { valid: false, reason: 'Account has been disabled' };
        }
        
        // ✅ FIX 1: CHECK SESSION REVOCATION
        if (userData.revokeSessionsAfter) {
            const revokeTime = userData.revokeSessionsAfter.toDate();
            const loginTime = new Date(sessionStorage.getItem('loginTime_' + email) || 0);
            
            AUTH_LOG.log('Checking revocation:', {
                revokeTime: revokeTime.toISOString(),
                loginTime: loginTime.toISOString()
            });
            
            if (revokeTime > loginTime) {
                AUTH_LOG.error('Session revoked by admin');
                return { valid: false, reason: 'Your session has been revoked by an administrator' };
            }
        }
        
        // Check if access code changed
        const currentCode = userData.accessCode || userData.access_code || userData.accesscode;
        if (currentUserAccessCode && currentCode && currentCode.toString() !== currentUserAccessCode) {
            AUTH_LOG.error('Access code has been changed');
            return { valid: false, reason: 'Your access code has been changed. Please login again with your new code.' };
        }
        
        AUTH_LOG.log('✅ Session is valid');
        return { valid: true };
        
    } catch (error) {
        AUTH_LOG.error('Error checking session validity:', error);
        return { valid: false, reason: 'Unable to verify session' };
    }
}




// =============================================================================
// REAL-TIME ACCESS CODE CHANGE MONITORING
// =============================================================================
// Add this to your authentication system for instant logout when code changes

let accessCodeListener = false;
let sessionCheckInterval = null; // ✅ ADD THIS LINE
let currentUserAccessCode = null; // ✅ ADD THIS LINE TOO (I notice this is also used but never declared)

// =============================================================================
// FIXED: Real-time Monitoring - NOW CHECKS SESSION REVOCATION
// =============================================================================

function startRealtimeAccessCodeMonitoring(email) {
    AUTH_LOG.log('Starting real-time access code monitoring for:', email);
    
    stopRealtimeAccessCodeMonitoring();
    
    const docRef = firebase.firestore().collection('authorized_users').doc(email.toLowerCase());
    
    let isFirstSnapshot = true;
    
    accessCodeListener = docRef.onSnapshot((doc) => {
        if (!doc.exists) {
            AUTH_LOG.error('User document no longer exists');
            handleAccessRevoked('Your account has been removed from the system');
            return;
        }
        
        const userData = doc.data();
        const currentCode = userData.accessCode || userData.access_code || userData.accesscode;
        
        // Initialize access code on first snapshot
        if (isFirstSnapshot) {
            if (!currentUserAccessCode && currentCode) {
                currentUserAccessCode = currentCode.toString();
                AUTH_LOG.log('✅ Initialized access code monitoring with code:', currentUserAccessCode);
            }
            isFirstSnapshot = false;
            AUTH_LOG.log('First snapshot - skipping checks, baseline established');
            return;
        }
        
        // Check approval status
        const isApproved = userData.approved === true || 
                          userData.approved === 'true' ||
                          userData['approved '] === true ||
                          userData['approved '] === 'true';
        
        if (!isApproved) {
            AUTH_LOG.error('User approval revoked');
            handleAccessRevoked('Your access has been revoked by an administrator');
            return;
        }
        
        // Check disabled status
        const isDisabled = userData.disabled === true || userData.disabled === 'true';
        if (isDisabled) {
            AUTH_LOG.error('User account disabled');
            handleAccessRevoked('Your account has been disabled');
            return;
        }
        
        // ✅ FIX 2: CHECK SESSION REVOCATION IN REAL-TIME
        if (userData.revokeSessionsAfter) {
            const revokeTime = userData.revokeSessionsAfter.toDate();
            const loginTime = new Date(sessionStorage.getItem('loginTime_' + email) || 0);
            
            if (revokeTime > loginTime) {
                AUTH_LOG.error('🚨 Session revoked by admin');
                handleAccessRevoked('Your session has been revoked by an administrator');
                return;
            }
        }
        
        // Check if access code changed
        if (currentUserAccessCode && currentCode && currentCode.toString() !== currentUserAccessCode) {
            AUTH_LOG.error('🚨 Access code changed - logging out user');
            AUTH_LOG.error('Old code:', currentUserAccessCode);
            AUTH_LOG.error('New code:', currentCode.toString());
            handleAccessRevoked('Your access code has been changed. Please login again with your new code.');
            return;
        }
        
        AUTH_LOG.log('✅ Real-time check passed - session still valid');
    }, (error) => {
        AUTH_LOG.error('Error in real-time listener:', error);
        if (error.code === 'permission-denied') {
            handleAccessRevoked('Database permission denied');
        }
    });
}






function startSessionMonitoring(email) {
    AUTH_LOG.log('Starting periodic session monitoring for:', email);
    
    // Clear any existing interval
    if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval);
    }
    
    // Check session validity every 60 seconds
    sessionCheckInterval = setInterval(async () => {
        const result = await checkSessionValidity(email);
        
        if (!result.valid) {
            AUTH_LOG.error('Session invalidated:', result.reason);
            handleAccessRevoked(result.reason);
        }
    }, 60000);
}

function stopSessionMonitoring() {
    if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval);
        sessionCheckInterval = null;
        AUTH_LOG.log('Periodic session monitoring stopped');
    }
}

function stopRealtimeAccessCodeMonitoring() {
    if (accessCodeListener) {
        accessCodeListener();
        accessCodeListener = null;
        AUTH_LOG.log('Real-time access code monitoring stopped');
    }
}
async function handleAccessRevoked(reason) {
    AUTH_LOG.error('Access revoked:', reason);
    
    // Stop all monitoring
    stopAllSessionMonitoring();
    
    // ✅ RESET MODAL FLAG
    isModalOpen = false;
    
    // Remove any existing modal
    const existingModal = document.getElementById('codeVerificationModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Sign out user
    await firebase.auth().signOut();
    
    // Show notification
    toast.error('Session Ended', {
        description: reason,
        duration: 6000
    });
    
    // Redirect to login
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1000);
}
// =============================================================================
// UPDATED: Start BOTH periodic and real-time monitoring
// =============================================================================

function startAllSessionMonitoring(email) {
    AUTH_LOG.log('Starting all session monitoring for:', email);
    
    // Start periodic check (every 60 seconds as backup)
    startSessionMonitoring(email);
    
    // Start real-time listener (instant detection)
    startRealtimeAccessCodeMonitoring(email);
}

function stopAllSessionMonitoring() {
    stopSessionMonitoring();  // ✅ Calls the correct function
    stopRealtimeAccessCodeMonitoring();
}

// =============================================================================
// USAGE: Replace startSessionMonitoring() calls with startAllSessionMonitoring()
// =============================================================================


// =============================================================================
// LOGIN ACTIVITY TRACKING
// =============================================================================
// LOGIN ACTIVITY TRACKING (FIXED)
// =============================================================================

async function logLoginActivity(email, status, errorMessage = null) {
    try {
        // Only log successful logins when user is authenticated
        const currentUser = firebase.auth().currentUser;
        
        if (status === 'failed') {
            // For failed logins, just log to console since user isn't authenticated
            AUTH_LOG.log(`❌ Failed login attempt for ${email}: ${errorMessage}`);
            return;
        }
        
        // For successful logins, verify user is authenticated
        if (!currentUser || currentUser.email.toLowerCase() !== email.toLowerCase()) {
            AUTH_LOG.log(`⚠️ Cannot log activity - user not authenticated: ${email}`);
            return;
        }

        const loginData = {
            email: email.toLowerCase(),
            status: status,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            device: getDeviceInfo(),
            browser: getBrowserInfo(),
            errorMessage: errorMessage
        };

        // Try to get IP and location (optional)
        try {
            const ipResponse = await fetch('https://api.ipify.org?format=json', {
                signal: AbortSignal.timeout(3000)
            });
            const ipData = await ipResponse.json();
            loginData.ipAddress = ipData.ip;

            const locResponse = await fetch(`https://ipapi.co/${ipData.ip}/json/`, {
                signal: AbortSignal.timeout(3000)
            });
            const locData = await locResponse.json();
            loginData.location = `${locData.city || 'Unknown'}, ${locData.country_name || 'Unknown'}`;
        } catch (e) {
            AUTH_LOG.log('Could not fetch IP/location:', e.message);
            loginData.ipAddress = 'Unknown';
            loginData.location = 'Unknown';
        }

        await firebase.firestore().collection('login_activity').add(loginData);
        AUTH_LOG.log('✅ Login activity logged successfully for:', email);
        
    } catch (error) {
        if (error.code === 'permission-denied') {
            AUTH_LOG.error('❌ Permission denied logging activity');
        } else {
            AUTH_LOG.error('❌ Error logging login activity:', error);
        }
    }
}

function getDeviceInfo() {
    const ua = navigator.userAgent;
    if (/mobile/i.test(ua)) return 'Mobile';
    if (/tablet/i.test(ua)) return 'Tablet';
    return 'Desktop';
}

function getBrowserInfo() {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome') && !ua.includes('Edge')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
}

// =============================================================================
// ADVANCED TOAST NOTIFICATION SYSTEM
// =============================================================================

class ToastManager {
    constructor() {
        this.toasts = new Map();
        this.container = null;
        this.init();
    }

    init() {
        if (!document.getElementById('advanced-toast-container')) {
            this.container = document.createElement('div');
            this.container.id = 'advanced-toast-container';
            document.body.appendChild(this.container);
            this.injectStyles();
        } else {
            this.container = document.getElementById('advanced-toast-container');
        }
    }

    injectStyles() {
        if (document.getElementById('advanced-toast-styles')) return;

        const style = document.createElement('style');
        style.id = 'advanced-toast-styles';
        style.textContent = `
            #advanced-toast-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 999999;
                pointer-events: none;
                display: flex;
                flex-direction: column;
                gap: 8px;
                max-width: 420px;
            }

            .advanced-toast {
                pointer-events: auto;
                background: white;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
                padding: 16px;
                display: flex;
                align-items: flex-start;
                gap: 12px;
                position: relative;
                overflow: hidden;
                min-width: 320px;
                transform: translateX(calc(100% + 40px));
                opacity: 0;
                transition: all 0.35s cubic-bezier(0.21, 1.02, 0.73, 1);
                border: 1px solid rgba(0, 0, 0, 0.05);
            }

            .advanced-toast.toast-entering {
                transform: translateX(0);
                opacity: 1;
            }

            .advanced-toast.toast-exiting {
                transform: translateX(calc(100% + 40px));
                opacity: 0;
                transition: all 0.25s cubic-bezier(0.4, 0, 1, 1);
            }

            .advanced-toast::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 3px;
                background: linear-gradient(90deg, var(--toast-color) 0%, var(--toast-color-light) 100%);
                transform: scaleX(0);
                transform-origin: left;
                transition: transform 0.3s ease;
            }

            .advanced-toast.toast-entering::before {
                transform: scaleX(1);
            }

            .toast-icon {
                flex-shrink: 0;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                font-weight: 600;
                background: var(--toast-color);
                color: white;
                animation: iconPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }

            @keyframes iconPop {
                0% { transform: scale(0) rotate(-180deg); }
                50% { transform: scale(1.2) rotate(10deg); }
                100% { transform: scale(1) rotate(0deg); }
            }

            .toast-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .toast-title {
                font-size: 14px;
                font-weight: 600;
                color: #0f172a;
                line-height: 1.4;
            }

            .toast-description {
                font-size: 13px;
                color: #64748b;
                line-height: 1.5;
            }

            .toast-close {
                flex-shrink: 0;
                width: 20px;
                height: 20px;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                color: #94a3b8;
                transition: all 0.2s;
                background: transparent;
                border: none;
                font-size: 18px;
                line-height: 1;
            }

            .toast-close:hover {
                background: #f1f5f9;
                color: #0f172a;
            }

            .toast-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: var(--toast-color);
                transform-origin: left;
                animation: progress var(--duration) linear forwards;
            }

            @keyframes progress {
                from { transform: scaleX(1); }
                to { transform: scaleX(0); }
            }

            .advanced-toast.type-success {
                --toast-color: #10b981;
                --toast-color-light: #34d399;
            }

            .advanced-toast.type-error {
                --toast-color: #ef4444;
                --toast-color-light: #f87171;
            }

            .advanced-toast.type-warning {
                --toast-color: #f59e0b;
                --toast-color-light: #fbbf24;
            }

            .advanced-toast.type-info {
                --toast-color: #3b82f6;
                --toast-color-light: #60a5fa;
            }

            @media (max-width: 640px) {
                #advanced-toast-container {
                    left: 20px;
                    right: 20px;
                    bottom: 20px;
                }
                
                .advanced-toast {
                    min-width: auto;
                    width: 100%;
                }
            }
        `;
        document.head.appendChild(style);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    show(options) {
        const id = options.id || `toast-${Date.now()}-${Math.random()}`;
        
        const config = {
            id,
            type: options.type || 'info',
            title: options.title || options.message || '',
            description: options.description || '',
            duration: options.duration !== undefined ? options.duration : 4000,
            dismissible: options.dismissible !== false,
            onDismiss: options.onDismiss,
            showProgress: options.showProgress !== false,
        };

        const toast = document.createElement('div');
        toast.className = `advanced-toast type-${config.type}`;
        toast.dataset.toastId = id;

        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ',
        };

        const iconHtml = `<div class="toast-icon">${icons[config.type]}</div>`;

        toast.innerHTML = `
            ${iconHtml}
            <div class="toast-content">
                ${config.title ? `<div class="toast-title">${this.escapeHtml(config.title)}</div>` : ''}
                ${config.description ? `<div class="toast-description">${this.escapeHtml(config.description)}</div>` : ''}
            </div>
            ${config.dismissible ? '<button class="toast-close" aria-label="Close">×</button>' : ''}
            ${config.showProgress && config.duration > 0 ? `<div class="toast-progress" style="--duration: ${config.duration}ms"></div>` : ''}
        `;

        this.container.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add('toast-entering');
        });

        this.toasts.set(id, { element: toast, config });

        if (config.dismissible) {
            const closeBtn = toast.querySelector('.toast-close');
            closeBtn?.addEventListener('click', () => this.dismiss(id));
        }

        if (config.duration > 0) {
            setTimeout(() => {
                if (this.toasts.has(id)) {
                    this.dismiss(id);
                }
            }, config.duration);
        }

        return id;
    }

    dismiss(id) {
        const toast = this.toasts.get(id);
        if (!toast) return;

        const { element, config } = toast;
        element.classList.remove('toast-entering');
        element.classList.add('toast-exiting');

        setTimeout(() => {
            element.remove();
            this.toasts.delete(id);
            config.onDismiss?.();
        }, 250);
    }

    dismissAll() {
        this.toasts.forEach((_, id) => this.dismiss(id));
    }
}

// Create global instance
const toastManager = new ToastManager();

// Simple API
const toast = {
    success: (title, options = {}) => toastManager.show({ type: 'success', title, ...options }),
    error: (title, options = {}) => toastManager.show({ type: 'error', title, ...options }),
    warning: (title, options = {}) => toastManager.show({ type: 'warning', title, ...options }),
    info: (title, options = {}) => toastManager.show({ type: 'info', title, ...options }),
    dismiss: (id) => toastManager.dismiss(id),
    dismissAll: () => toastManager.dismissAll(),
};

// =============================================================================
// AUDIO FUNCTIONS
// =============================================================================

function playSuccessSound() {
    try {
        const audio = new Audio('./audio/success.mp3');
        audio.volume = NOTIFICATION_VOLUME;
        audio.play().catch(e => AUTH_LOG.log('Success audio play failed:', e));
    } catch (e) {
        AUTH_LOG.error('Success audio error:', e);
    }
}

function playNotificationSound() {
    try {
        const audio = new Audio('./audio/notification.mp3');
        audio.volume = NOTIFICATION_VOLUME;
        audio.play().catch(e => AUTH_LOG.log('Audio play failed:', e));
    } catch (e) {
        AUTH_LOG.error('Audio error:', e);
    }
}

// =============================================================================
// AUTHORIZATION FUNCTIONS
// =============================================================================
// =============================================================================
// AUTHORIZATION FUNCTIONS (FIXED)
// =============================================================================

async function isEmailAllowed(email) {
    AUTH_LOG.log('Checking if email is allowed:', email);
    
    if (!email) {
        AUTH_LOG.error('No email provided');
        toast.error('Email Required', {
            description: 'Please enter your email address'
        });
        return false;
    }
    
    try {
        const docRef = firebase.firestore().collection('authorized_users').doc(email.toLowerCase());
        const doc = await docRef.get();
        
        AUTH_LOG.log('User doc exists:', doc.exists);
        
        if (doc.exists) {
            const userData = doc.data();
            
            // IMPORTANT: Log the actual data to debug
            // AUTH_LOG.log('User data:', JSON.stringify(userData, null, 2));
            
            // Check if approved - handle both boolean true and string 'true'
            const isApproved = userData.approved === true || userData.approved === 'true';
            
            if (!isApproved) {
                AUTH_LOG.log('User exists but not approved. approved field value:', userData.approved);
                toast.error('Account Not Approved', {
                    description: 'Your account is pending approval. Please contact your administrator.',
                    duration: 5000
                });
                return false;
            }
            
            // Check if disabled
            const isDisabled = userData.disabled === true || userData.disabled === 'true';
            if (isDisabled) {
                AUTH_LOG.log('User exists but is disabled');
                toast.error('Account Disabled', {
                    description: 'Your account has been disabled. Please contact your administrator.',
                    duration: 5000
                });
                return false;
            }
            
            AUTH_LOG.log('User is approved via authorized_users');
            return true;
        }
        
        // If no user document, check domain
        const domain = email.split('@')[1];
        AUTH_LOG.log('Checking domain:', domain);
        
        const domainRef = firebase.firestore().collection('authorized_domains').doc(domain.toLowerCase());
        const domainDoc = await domainRef.get();
        
        AUTH_LOG.log('Domain doc exists:', domainDoc.exists);
        
        if (domainDoc.exists) {
            const domainData = domainDoc.data();
            const isDomainApproved = domainData.approved === true || domainData.approved === 'true';
            
            if (isDomainApproved) {
                AUTH_LOG.log('User is approved via authorized_domains');
                return true;
            }
        }
        
        AUTH_LOG.log('User not authorized');
        toast.error('Access Denied', {
            description: 'Your email is not authorized. Please contact your administrator.',
            duration: 5000
        });
        return false;
        
    } catch (error) {
        AUTH_LOG.error('Error checking authorization:', error);
        
        if (error.code === 'permission-denied') {
            toast.error('Permission Denied', {
                description: 'Database access error. Please contact your administrator.'
            });
        } else if (error.code === 'unavailable') {
            toast.error('Connection Failed', {
                description: 'Unable to reach database. Please check your internet connection.'
            });
        } else {
            toast.error('Authorization Failed', {
                description: error.message
            });
        }
        
        return false;
    }
}

// =============================================================================
// FIXED: verifyAccessCode - NOW STORES LOGIN TIME
// =============================================================================

async function verifyAccessCode(email, code) {
    AUTH_LOG.log('Verifying access code for:', email);
    
    if (!email || !code) {
        AUTH_LOG.error('Missing email or code');
        toast.error('Missing Information', {
            description: 'Email and access code are required'
        });
        return false;
    }
    
    try {
        const docRef = firebase.firestore().collection('authorized_users').doc(email.toLowerCase());
        const doc = await docRef.get();
        
        if (!doc.exists) {
            AUTH_LOG.error('User document not found');
            toast.error('User Not Found', {
                description: 'No user record found in database'
            });
            return false;
        }
        
        const userData = doc.data();
        const storedCode = userData.accessCode || userData.access_code || userData.accesscode;
        const inputCode = code.toString().trim();
        const storedCodeStr = storedCode ? storedCode.toString().trim() : '';
        
        if (!storedCode) {
            AUTH_LOG.error('No access code found in user document');
            toast.error('Configuration Error', {
                description: 'No access code configured for this account. Contact administrator.'
            });
            return false;
        }
        
        if (storedCodeStr === inputCode) {
            try {
                await docRef.update({
                    lastCodeVerification: firebase.firestore.FieldValue.serverTimestamp()
                });
                AUTH_LOG.log('✅ Access code verified and timestamp updated');
            } catch (updateError) {
                AUTH_LOG.log('⚠️ Could not update timestamp');
            }
            
            // Store access code for monitoring
            currentUserAccessCode = inputCode;
            AUTH_LOG.log('✅ Stored access code for monitoring');
            
            // ✅ FIX 3: STORE LOGIN TIME
            sessionStorage.setItem('loginTime_' + email, new Date().toISOString());
            AUTH_LOG.log('✅ Stored login time');
            
            return true;
        }
        
        AUTH_LOG.error('❌ Invalid access code - codes do not match');
        toast.error('Invalid Code', {
            description: 'The access code you entered is incorrect. Please try again.'
        });
        return false;
        
    } catch (error) {
        AUTH_LOG.error('Error verifying access code:', error);
        
        if (error.code === 'permission-denied') {
            toast.error('Permission Denied', {
                description: 'Cannot access user database. Please contact your administrator.'
            });
        } else {
            toast.error('Verification Failed', {
                description: error.message
            });
        }
        
        return false;
    }
}

// =============================================================================
// HELPER: Store Login Time and Access Code
// =============================================================================

async function storeLoginSession(email) {
    try {
        // Store login time
        sessionStorage.setItem('loginTime_' + email, new Date().toISOString());
        AUTH_LOG.log('✅ Stored login time for:', email);
        
        // Fetch and store access code
        const docRef = firebase.firestore().collection('authorized_users').doc(email.toLowerCase());
        const doc = await docRef.get();
        
        if (doc.exists) {
            const userData = doc.data();
            const code = userData.accessCode || userData.access_code || userData.accesscode;
            if (code) {
                currentUserAccessCode = code.toString();
                AUTH_LOG.log('✅ Stored access code for monitoring');
            }
        }
    } catch (error) {
        AUTH_LOG.error('Error storing login session:', error);
    }
}


function setCodeVerified(email) {
    // No longer storing verification - always require code
    AUTH_LOG.log('Code verified for session:', email);
}

function isCodeVerified(email) {
    // Always return false to force code entry
    return false;
}

// =============================================================================
// CODE VERIFICATION MODAL
// =============================================================================
let isModalOpen = false;  // ✅ ADD THIS GUARD
function showCodeVerificationModal(email) {
    AUTH_LOG.log('Showing code verification modal for:', email);
    
    // ✅ PREVENT DUPLICATE MODALS
    if (isModalOpen) {
        AUTH_LOG.log('⚠️ Modal already open, ignoring duplicate call');
        return;
    }
    
    // ✅ CHECK IF MODAL ALREADY EXISTS IN DOM
    const existingModal = document.getElementById('codeVerificationModal');
    if (existingModal) {
        AUTH_LOG.log('⚠️ Modal already exists in DOM, removing and recreating');
        existingModal.remove();
    }
    
    isModalOpen = true;  // ✅ SET FLAG
    
    const modalHTML = `
        <div id="codeVerificationModal" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999999;
        ">
            <div id="modalContent" style="
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
                max-width: 400px;
                width: 90%;
            ">
                <h2 style="margin-top: 0; color: #333;">Access Code Required</h2>
                <p style="color: #666;">Enter your 6-digit access code for:</p>
                <p style="font-weight: bold; color: #007bff;">${email}</p>
                
                <input 
                    type="text" 
                    id="accessCodeInput" 
                    maxlength="6" 
                    placeholder="Enter 6-digit code"
                    autocomplete="off"
                    inputmode="numeric"
                    style="
                        width: 100%;
                        padding: 12px;
                        font-size: 18px;
                        text-align: center;
                        letter-spacing: 5px;
                        border: 2px solid #ddd;
                        border-radius: 5px;
                        margin: 20px 0;
                        box-sizing: border-box;
                    "
                />
                
                <div id="codeError" style="
                    color: #dc3545;
                    margin: 10px 0;
                    display: none;
                    font-size: 14px;
                "></div>
                
                <button 
                    id="verifyCodeBtn"
                    type="button"
                    style="
                        width: 100%;
                        padding: 12px;
                        background: #007bff;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        font-size: 16px;
                        cursor: pointer;
                        margin-top: 10px;
                    "
                >Verify Code</button>
                
                <button 
                    id="cancelCodeBtn"
                    type="button"
                    style="
                        width: 100%;
                        padding: 12px;
                        background: #6c757d;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        font-size: 16px;
                        cursor: pointer;
                        margin-top: 10px;
                    "
                >Cancel & Sign Out</button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    setTimeout(() => {
        const modal = document.getElementById('codeVerificationModal');
        const modalContent = document.getElementById('modalContent');
        const input = document.getElementById('accessCodeInput');
        const verifyBtn = document.getElementById('verifyCodeBtn');
        const cancelBtn = document.getElementById('cancelCodeBtn');
        const errorDiv = document.getElementById('codeError');
        
        if (!modal || !input || !verifyBtn || !cancelBtn || !errorDiv) {
            AUTH_LOG.error('Modal elements not found');
            return;
        }
        
        input.focus();
        
        let isProcessing = false;
        
        async function handleVerification() {
            if (isProcessing) {
                AUTH_LOG.log('Already processing, ignoring duplicate call');
                return;
            }
            
            const code = input.value.trim();
            
            if (code.length !== 6) {
                errorDiv.textContent = 'Please enter a 6-digit code';
                errorDiv.style.display = 'block';
                return;
            }
            
            isProcessing = true;
            verifyBtn.disabled = true;
            verifyBtn.textContent = 'Verifying...';
            verifyBtn.style.opacity = '0.6';
            verifyBtn.style.cursor = 'not-allowed';
            input.disabled = true;
            
            try {
                const isValid = await verifyAccessCode(email, code);
                
                if (isValid) {
                    setCodeVerified(email);
                    
                    // ✅ Show success state
                    verifyBtn.textContent = '✓ Verified!';
                    verifyBtn.style.background = '#10b981';
                    input.style.borderColor = '#10b981';
                    
                    await logLoginActivity(email, 'success');
                    
                    playSuccessSound();
                    toast.success('Access Granted!', {
                        description: 'Code verified successfully. Redirecting...'
                    });
                    
                    startAllSessionMonitoring(email);
                    
                  // ✅ AUTO-CLOSE: Remove modal after brief delay
                    setTimeout(() => {
                        isModalOpen = false;  // ✅ RESET FLAG
                        modal.remove();
                    }, 800);
                    
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1000);
                } else {
                    await logLoginActivity(email, 'failed', 'Invalid access code');
                    
                    errorDiv.textContent = 'Invalid access code. Please try again.';
                    errorDiv.style.display = 'block';
                    verifyBtn.disabled = false;
                    verifyBtn.textContent = 'Verify Code';
                    verifyBtn.style.opacity = '1';
                    verifyBtn.style.cursor = 'pointer';
                    input.disabled = false;
                    input.value = '';
                    input.focus();
                    isProcessing = false;
                }
            } catch (error) {
                AUTH_LOG.error('Verification error:', error);
                errorDiv.textContent = 'Verification failed. Please try again.';
                errorDiv.style.display = 'block';
                verifyBtn.disabled = false;
                verifyBtn.textContent = 'Verify Code';
                verifyBtn.style.opacity = '1';
                verifyBtn.style.cursor = 'pointer';
                input.disabled = false;
                isProcessing = false;
            }
        }
        
        // ✅ AUTO-SUBMIT: Trigger verification when 6 digits are entered
        input.addEventListener('input', function(e) {
            this.value = this.value.replace(/[^0-9]/g, '');
            errorDiv.style.display = 'none';
            
            // Auto-submit when 6 digits entered
            if (this.value.length === 6) {
                AUTH_LOG.log('6 digits entered - auto-submitting');
                setTimeout(() => {
                    handleVerification();
                }, 300); // Small delay for better UX
            }
        });
        
        // Verify button click (manual option)
        verifyBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            AUTH_LOG.log('Verify button clicked');
            handleVerification();
        });
        
        // Enter key handling
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                AUTH_LOG.log('Enter key pressed');
                handleVerification();
            }
        });
        
        // Cancel button
// Cancel button
        cancelBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            AUTH_LOG.log('Cancel button clicked');
            isModalOpen = false;  // ✅ RESET FLAG
            stopAllSessionMonitoring();
            await firebase.auth().signOut();
            modal.remove();
            toast.info('Signed Out', {
                description: 'You have been signed out successfully'
            });
            
            ui.reset();
            ui.start('#firebaseui-auth-container', uiConfig);
        });
        
        // Click outside to close
        modal.addEventListener('click', async function(e) {
            if (e.target === modal) {
                AUTH_LOG.log('Clicked outside modal - closing');
                isModalOpen = false;  // ✅ RESET FLAG
                stopAllSessionMonitoring();
                await firebase.auth().signOut();
                modal.remove();
                toast.info('Signed Out', {
                    description: 'You have been signed out successfully'
                });
                
                ui.reset();
                ui.start('#firebaseui-auth-container', uiConfig);
            }
        });
        
        // ESC key to close
// ESC key to close
        document.addEventListener('keydown', async function escHandler(e) {
            if (e.key === 'Escape') {
                AUTH_LOG.log('ESC key pressed - closing modal');
                document.removeEventListener('keydown', escHandler);
                isModalOpen = false;  // ✅ RESET FLAG
                stopAllSessionMonitoring();
                await firebase.auth().signOut();
                modal.remove();
                toast.info('Signed Out', {
                    description: 'You have been signed out successfully'
                });
                
                ui.reset();
                ui.start('#firebaseui-auth-container', uiConfig);
            }
        });
    }, 100);
}
// =============================================================================
// HANDLE REDIRECT RESULT ON PAGE LOAD
// =============================================================================

async function handleRedirectResult() {
    AUTH_LOG.log('Checking for redirect result...');
    
    try {
        const result = await firebase.auth().getRedirectResult();
        
        AUTH_LOG.log('getRedirectResult() returned:', {
            user: result.user ? result.user.email : null,
            credential: result.credential ? 'present' : null,
            operationType: result.operationType || null
        });
        
        if (result.user) {
            AUTH_LOG.log('Redirect sign-in successful:', result.user.email);
            
            const allowed = await isEmailAllowed(result.user.email);
            
            if (!allowed) {
                AUTH_LOG.error('User not authorized:', result.user.email);
                
                await logLoginActivity(result.user.email, 'failed', 'User not authorized');
                
                await firebase.auth().signOut();
                try {
                    await result.user.delete();
                } catch (err) {
                    AUTH_LOG.error('Could not delete user:', err);
                }
                
                playNotificationSound();
                toast.error('Access Denied', {
                    description: `Your email (${result.user.email}) is not authorized. Contact your administrator.`,
                    duration: 5000
                });
                
                setTimeout(() => {
                    ui.reset();
                    ui.start('#firebaseui-auth-container', uiConfig);
                }, 2000);
                
                return;
            }
            
            if (isCodeVerified(result.user.email)) {
                AUTH_LOG.log('Code already verified, redirecting to index.html');
                
                await logLoginActivity(result.user.email, 'success');
                
                playSuccessSound();
                toast.success('Welcome Back!', {
                    description: 'Access verified. Redirecting...'
                });
                
                // Start session monitoring
                 startAllSessionMonitoring(result.user.email);  // ✅ CORRECT
                
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 500);
            } else {
                AUTH_LOG.log('Code not verified, showing modal');
                showCodeVerificationModal(result.user.email);
            }
        } else {
            AUTH_LOG.log('No redirect result found - waiting for user sign-in or already signed in');
        }
    } catch (error) {
        AUTH_LOG.error('Error handling redirect result:', error);
        
        if (error.code === 'auth/account-exists-with-different-credential') {
            toast.error('Account Exists', {
                description: 'An account already exists with this email using a different sign-in method.'
            });
        } else {
            toast.error('Sign-In Failed', {
                description: error.message || 'Unknown error occurred'
            });
        }
    }
}

// =============================================================================
// FIREBASE UI CONFIGURATION
// =============================================================================

var uiConfig = {
    signInFlow: 'popup',
    signInOptions: [
        {
            provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
            customParameters: {
                prompt: 'select_account'
            }
        }
    ],
    tosUrl: './terms.html',
    callbacks: {
        signInSuccessWithAuthResult: async function(authResult, redirectUrl) {
            AUTH_LOG.log('✅ signInSuccessWithAuthResult callback triggered');
            AUTH_LOG.log('User:', authResult.user.email);
            AUTH_LOG.log('Credential:', authResult.credential);
            
            const user = authResult.user;
            
            const allowed = await isEmailAllowed(user.email);
            
            if (!allowed) {
                AUTH_LOG.error('User not authorized:', user.email);
                
                await logLoginActivity(user.email, 'failed', 'User not authorized');
                
                await firebase.auth().signOut();
                try {
                    await user.delete();
                } catch (err) {
                    AUTH_LOG.error('Could not delete user:', err);
                }
                
                playNotificationSound();
                toast.error('Access Denied', {
                    description: `Your email (${user.email}) is not authorized. Contact your administrator.`,
                    duration: 5000
                });
                
                setTimeout(() => {
                    ui.reset();
                    ui.start('#firebaseui-auth-container', uiConfig);
                }, 2000);
                
                return false;
            }
            
            if (isCodeVerified(user.email)) {
                AUTH_LOG.log('Code already verified, redirecting to index.html');
                
                await logLoginActivity(user.email, 'success');
                
                playSuccessSound();
                toast.success('Welcome Back!', {
                    description: 'Access verified. Redirecting...'
                });
                
                // Start session monitoring
               startAllSessionMonitoring(user.email);
                
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 500);
            } else {
                AUTH_LOG.log('Code not verified, showing modal');
                showCodeVerificationModal(user.email);
            }
            
            return false;
        },
        signInFailure: function(error) {
            AUTH_LOG.error('❌ Sign-in failure callback:', error);
            
            if (error.code === 'auth/popup-blocked') {
                toast.error('Popup Blocked', {
                    description: 'Please allow popups in your browser and try again',
                    duration: 6000
                });
            } else if (error.code === 'auth/popup-closed-by-user') {
                toast.info('Sign-in Cancelled', {
                    description: 'You closed the sign-in window'
                });
            } else if (error.code === 'auth/cancelled-popup-request') {
                AUTH_LOG.log('Popup cancelled - another popup may be opening');
            } else {
                toast.error('Sign-In Failed', {
                    description: error.message || 'Unknown error occurred'
                });
            }
            
            return Promise.resolve();
        },
       uiShown: function() {
            AUTH_LOG.log('🎨 Firebase UI widget is now displayed');
        }
    }
};

var ui = new firebaseui.auth.AuthUI(firebase.auth());

// =============================================================================
// INITIALIZE ON PAGE LOAD
// =============================================================================

document.addEventListener('DOMContentLoaded', async function() {
    AUTH_LOG.log('DOMContentLoaded - initializing');
    
    const currentUser = firebase.auth().currentUser;
    AUTH_LOG.log('Current user on page load:', currentUser ? currentUser.email : 'none');
    
    if (currentUser) {
        AUTH_LOG.log('User already signed in, checking authorization');
        
        const allowed = await isEmailAllowed(currentUser.email);
        
        if (!allowed) {
            AUTH_LOG.error('Signed in user not authorized:', currentUser.email);
            
            await logLoginActivity(currentUser.email, 'failed', 'User not authorized');
            
             stopAllSessionMonitoring();
            await firebase.auth().signOut();
            
            playNotificationSound();
            toast.error('Access Denied', {
                description: `Your email (${currentUser.email}) is not authorized. Contact your administrator.`,
                duration: 5000
            });
            
            ui.start('#firebaseui-auth-container', uiConfig);
            return;
        }
        
if (isCodeVerified(currentUser.email)) {
            AUTH_LOG.log('User authorized and code verified, redirecting to index.html');
            
            await logLoginActivity(currentUser.email, 'success');
            
            playSuccessSound();
            toast.success('Welcome Back!', {
                description: 'Access verified. Redirecting...'
            });
            
            startAllSessionMonitoring(currentUser.email);  // ✅ CORRECT
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 500);
        } else {
            AUTH_LOG.log('User authorized but code not verified, showing modal');
            showCodeVerificationModal(currentUser.email);
        }
    } else {
        AUTH_LOG.log('No current user, checking for redirect result');
        
        await handleRedirectResult();
        
        if (!firebase.auth().currentUser) {
            AUTH_LOG.log('Starting Firebase UI');
            ui.start('#firebaseui-auth-container', uiConfig);
        }
    }
});

// =============================================================================
// EMAIL/PASSWORD LOGIN FORM
// =============================================================================

const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        AUTH_LOG.log('Email/password login form submitted');
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const resetBtn = document.getElementById('resetPasswordBtn');

        try {
            const allowed = await isEmailAllowed(email);
            if (!allowed) {
                await logLoginActivity(email, 'failed', 'User not authorized');
                
                playNotificationSound();
                toast.error('Access Denied', {
                    description: 'Your email is not authorized. Contact your administrator.'
                });
                return;
            }

            AUTH_LOG.log('Attempting email/password sign-in');
            const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
            AUTH_LOG.log('Email/password sign-in successful');
            
            if (userCredential && resetBtn) {
                resetBtn.style.display = 'none';
            }
            
            if (isCodeVerified(email)) {
                await logLoginActivity(email, 'success');
                
                playSuccessSound();
                toast.success('Welcome Back!', {
                    description: 'Redirecting...'
                });
                
               startAllSessionMonitoring(email);  // ✅ CORRECT - use 'email' variable
                
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 500);
            } else {
                showCodeVerificationModal(email);
            }
            
        } catch (error) {
            AUTH_LOG.error('Email/password login error:', error);
            AUTH_LOG.error('Error code:', error.code);
            AUTH_LOG.error('Error message:', error.message);
            
            let errorMessage = '';
            let errorTitle = 'Login Failed';
            
            switch(error.code) {
                case 'auth/user-not-found':
                    errorTitle = 'User Not Found';
                    errorMessage = 'This email is not registered. Please contact your administrator.';
                    break;
                case 'auth/wrong-password':
                    errorTitle = 'Invalid Password';
                    errorMessage = 'Incorrect password. Please try again or reset your password.';
                    break;
                case 'auth/invalid-email':
                    errorTitle = 'Invalid Email';
                    errorMessage = 'Please enter a valid email address.';
                    break;
                case 'auth/invalid-login-credentials':
                case 'auth/invalid-credential':
                    errorTitle = 'Invalid Credentials';
                    errorMessage = 'The email or password you entered is incorrect. Please check and try again.';
                    break;
                case 'auth/internal-error':
                    errorTitle = 'Authentication Error';
                    errorMessage = 'Invalid login credentials. Please verify your email and password are correct.';
                    break;
                case 'auth/too-many-requests':
                    errorTitle = 'Too Many Attempts';
                    errorMessage = 'Too many failed login attempts. Please try again later or reset your password.';
                    break;
                case 'auth/user-disabled':
                    errorTitle = 'Account Disabled';
                    errorMessage = 'Your account has been disabled. Please contact your administrator.';
                    break;
                default:
                    errorTitle = 'Authentication Error';
                    errorMessage = `Login failed: ${error.message}. Please check your credentials and try again.`;
            }
            await logLoginActivity(email, 'failed', errorMessage);
            
            if (resetBtn) {
                resetBtn.style.display = 'block';
            }
            
            playNotificationSound();
            toast.error(errorTitle, {
                description: errorMessage
            });
        }
    });
}

const resetPasswordBtn = document.getElementById('resetPasswordBtn');
if (resetPasswordBtn) {
    resetPasswordBtn.addEventListener('mousedown', function(e) {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = 'reset.html';
    });
}

// =============================================================================
// AUTH STATE HANDLER
// =============================================================================

let isCheckingAuth = false;

firebase.auth().onAuthStateChanged(async (user) => {
    if (isCheckingAuth) {
        AUTH_LOG.log('Already checking auth, skipping...');
        return;
    }
    
    AUTH_LOG.log('onAuthStateChanged triggered, user:', user ? user.email : 'null');
    
    const isLoginPage = window.location.pathname.includes('login.html');
    
    if (user) {
        AUTH_LOG.log('User signed in:', user.email);
        
        if (isLoginPage) {
            AUTH_LOG.log('User on login page, processing...');
            isCheckingAuth = true;
            
            try {
                const allowed = await isEmailAllowed(user.email);
                
                if (!allowed) {
                    AUTH_LOG.error('User not authorized:', user.email);
                    
                    await logLoginActivity(user.email, 'failed', 'User not authorized');
                    
                     stopAllSessionMonitoring();
                    await firebase.auth().signOut();
                    
                    playNotificationSound();
                    toast.error('Access Denied', {
                        description: `Your email (${user.email}) is not authorized. Contact your administrator.`,
                        duration: 5000
                    });
                    
                    setTimeout(() => {
                        ui.reset();
                        ui.start('#firebaseui-auth-container', uiConfig);
                    }, 2000);
                    
                    isCheckingAuth = false;
                    return;
                }
                
                if (isCodeVerified(user.email)) {
                    AUTH_LOG.log('Code already verified on login page, redirecting to index.html');
                    
                    await logLoginActivity(user.email, 'success');
                    
                    playSuccessSound();
                    toast.success('Welcome Back!', {
                        description: 'Access verified. Redirecting...'
                    });
                    
                     startAllSessionMonitoring(user.email);  // ✅ CORRECT - use 'user' variable
                    
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 500);
                } else {
                    AUTH_LOG.log('Code not verified on login page, showing modal');
                    showCodeVerificationModal(user.email);
                }
            } catch (error) {
                AUTH_LOG.error('Error processing user on login page:', error);
                 stopAllSessionMonitoring();
                await firebase.auth().signOut();
                toast.error('Authentication Error', {
                    description: error.message
                });
                
                setTimeout(() => {
                    ui.reset();
                    ui.start('#firebaseui-auth-container', uiConfig);
                }, 2000);
            } finally {
                isCheckingAuth = false;
            }
        }  else {
            isCheckingAuth = true;
            
            try {
                const sessionValid = await checkSessionValidity(user.email);
                
                if (!sessionValid.valid) {
                    AUTH_LOG.log('Session invalid on protected page:', sessionValid.reason);
                     stopAllSessionMonitoring();
                    await firebase.auth().signOut();
                    toast.warning('Session Expired', {
                        description: sessionValid.reason
                    });
                    window.location.href = 'login.html';
                    return;
                }
                
                if (!sessionCheckInterval) {
                    startAllSessionMonitoring(user.email);  // ✅ CORRECT
                }
            } catch (error) {
                AUTH_LOG.error('Error checking authorization on protected page:', error);
                 stopAllSessionMonitoring();
                await firebase.auth().signOut();
                toast.error('Authentication Error', {
                    description: error.message
                });
                window.location.href = 'login.html';
            } finally {
                isCheckingAuth = false;
            }
        }
    } else {
        AUTH_LOG.log('No user signed in');
         stopAllSessionMonitoring();
        if (!isLoginPage) {
            AUTH_LOG.log('Not on login page, redirecting to login');
            window.location.href = 'login.html';
        }
    }
});



// =============================================================================
// CLEANUP ON PAGE UNLOAD
// =============================================================================

window.addEventListener('beforeunload', function() {
    stopAllSessionMonitoring();
});