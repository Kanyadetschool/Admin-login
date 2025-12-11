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
// SESSION REVOCATION SYSTEM
// =============================================================================

let sessionCheckInterval = null;
let currentUserAccessCode = null;

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
        
        const isApproved = userData.approved === true || 
                          userData.approved === 'true' ||
                          userData['approved '] === true ||
                          userData['approved '] === 'true';
        
        if (!isApproved) {
            AUTH_LOG.error('User no longer approved');
            return { valid: false, reason: 'Access revoked by administrator' };
        }
        
        const isDisabled = userData.disabled === true || userData.disabled === 'true';
        if (isDisabled) {
            AUTH_LOG.error('User account disabled');
            return { valid: false, reason: 'Account has been disabled' };
        }
        
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

let accessCodeListener = false;

function startRealtimeAccessCodeMonitoring(email) {
    AUTH_LOG.log('Starting real-time access code monitoring for:', email);
    
    stopRealtimeAccessCodeMonitoring();
    
    const docRef = firebase.firestore().collection('authorized_users').doc(email.toLowerCase());
    
    accessCodeListener = docRef.onSnapshot((doc) => {
        if (!doc.exists) {
            AUTH_LOG.error('User document no longer exists');
            handleAccessRevoked('Your account has been removed from the system');
            return;
        }
        
        const userData = doc.data();
        
        const isApproved = userData.approved === true || 
                          userData.approved === 'true' ||
                          userData['approved '] === true ||
                          userData['approved '] === 'true';
        
        if (!isApproved) {
            AUTH_LOG.error('User approval revoked');
            handleAccessRevoked('Your access has been revoked by an administrator');
            return;
        }
        
        const isDisabled = userData.disabled === true || userData.disabled === 'true';
        if (isDisabled) {
            AUTH_LOG.error('User account disabled');
            handleAccessRevoked('Your account has been disabled');
            return;
        }
        
        const currentCode = userData.accessCode || userData.access_code || userData.accesscode;
        if (currentUserAccessCode && currentCode && currentCode.toString() !== currentUserAccessCode) {
            AUTH_LOG.error('Access code changed - logging out user');
            handleAccessRevoked('Your access code has been changed. Please login again with your new code.');
            return;
        }
        
        AUTH_LOG.log('Real-time check passed - session still valid');
    }, (error) => {
        AUTH_LOG.error('Error in real-time listener:', error);
        if (error.code === 'permission-denied') {
            handleAccessRevoked('Database permission denied');
        }
    });
}

function startSessionMonitoring(email) {
    AUTH_LOG.log('Starting periodic session monitoring for:', email);
    
    if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval);
    }
    
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

// =============================================================================
// 10-MINUTE SESSION TIMEOUT
// =============================================================================

let sessionTimeoutTimer = null;
const SESSION_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

function startSessionTimeout(email) {
    AUTH_LOG.log('Starting 10-minute session timeout for:', email);
    
    if (sessionTimeoutTimer) {
        clearTimeout(sessionTimeoutTimer);
    }
    
    sessionTimeoutTimer = setTimeout(async () => {
        AUTH_LOG.log('⏰ 10-minute session expired');
        handleAccessRevoked('Your session has expired after 10 minutes. Please login again.');
    }, SESSION_TIMEOUT_MS);
}

function stopSessionTimeout() {
    if (sessionTimeoutTimer) {
        clearTimeout(sessionTimeoutTimer);
        sessionTimeoutTimer = null;
        AUTH_LOG.log('Session timeout cleared');
    }
}

function resetSessionTimeout(email) {
    AUTH_LOG.log('Resetting session timeout (user activity detected)');
    startSessionTimeout(email);
}

async function handleAccessRevoked(reason) {
    AUTH_LOG.error('Access revoked:', reason);
    
    stopAllSessionMonitoring();
    
    await firebase.auth().signOut();
    
    toast.error('Session Ended', {
        description: reason,
        duration: 6000
    });
    
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1000);
}

function startAllSessionMonitoring(email) {
    AUTH_LOG.log('Starting all session monitoring for:', email);
    
    startSessionMonitoring(email);
    startRealtimeAccessCodeMonitoring(email);
    startSessionTimeout(email);
}

function stopAllSessionMonitoring() {
    stopSessionMonitoring();
    stopRealtimeAccessCodeMonitoring();
    stopSessionTimeout();
}

// =============================================================================
// LOGIN ACTIVITY TRACKING
// =============================================================================

async function logLoginActivity(email, status, errorMessage = null) {
    try {
        const currentUser = firebase.auth().currentUser;
        
        if (status === 'failed') {
            AUTH_LOG.log(`❌ Failed login attempt for ${email}: ${errorMessage}`);
            return;
        }
        
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
                bottom: 20px;
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

const toastManager = new ToastManager();

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
            
            const isApproved = userData.approved === true || userData.approved === 'true';
            
            if (!isApproved) {
                AUTH_LOG.log('User exists but not approved. approved field value:', userData.approved);
                toast.error('Account Not Approved', {
                    description: 'Your account is pending approval. Please contact your administrator.',
                    duration: 5000
                });
                return false;
            }
            
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
        
        AUTH_LOG.log('Checking access code...');
        AUTH_LOG.log('Stored code exists:', !!storedCode);
        AUTH_LOG.log('Input code length:', inputCode.length);
        AUTH_LOG.log('Stored code length:', storedCodeStr.length);
        
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
            
            currentUserAccessCode = inputCode;
            AUTH_LOG.log('✅ Stored access code for monitoring');
            
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

function setCodeVerified(email) {
    AUTH_LOG.log('Code verified for session:', email);
}

function isCodeVerified(email) {
    return false;
}

// =============================================================================
// CODE VERIFICATION MODAL
// =============================================================================

function showCodeVerificationModal(email) {
    AUTH_LOG.log('Showing code verification modal for:', email);
    
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
            z-index: 999999;
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
                    
                    verifyBtn.textContent = '✓ Verified!';
                    verifyBtn.style.background = '#10b981';
                    input.style.borderColor = '#10b981';
                    
                    await logLoginActivity(email, 'success');
                    
                    playSuccessSound();
                    toast.success('Access Granted!', {
                        description: 'Code verified successfully. Redirecting...'
                    });
                    
                    startAllSessionMonitoring(email);
                    
                    setTimeout(() => {
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
        
        input.addEventListener('input', function(e) {
            this.value = this.value.replace(/[^0-9]/g, '');
            errorDiv.style.display = 'none';
            
            if (this.value.length === 6) {
                AUTH_LOG.log('6 digits entered - auto-submitting');
                setTimeout(() => {
                    handleVerification();
                }, 300);
            }
        });
        
        verifyBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            AUTH_LOG.log('Verify button clicked');
            handleVerification();
        });
        
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                AUTH_LOG.log('Enter key pressed');
                handleVerification();
            }
        });
        
        cancelBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            AUTH_LOG.log('Cancel button clicked');
            stopAllSessionMonitoring();
            await firebase.auth().signOut();
            modal.remove();
            toast.info('Signed Out', {
                description: 'You have been signed out successfully'
            });
            
            if (typeof ui !== 'undefined') {
                ui.reset();
                ui.start('#firebaseui-auth-container', uiConfig);
            }
        });
        
        modal.addEventListener('click', async function(e) {
            if (e.target === modal) {
                AUTH_LOG.log('Clicked outside modal - closing');
                stopAllSessionMonitoring();
                await firebase.auth().signOut();
                modal.remove();
                toast.info('Signed Out', {
                    description: 'You have been signed out successfully'
                });
                
                if (typeof ui !== 'undefined') {
                    ui.reset();
                    ui.start('#firebaseui-auth-container', uiConfig);
                }
            }
        });
        
        document.addEventListener('keydown', async function escHandler(e) {
            if (e.key === 'Escape') {
                AUTH_LOG.log('ESC key pressed - closing modal');
                document.removeEventListener('keydown', escHandler);
                stopAllSessionMonitoring();
                await firebase.auth().signOut();
                modal.remove();
                toast.info('Signed Out', {
                    description: 'You have been signed out successfully'
                });
                
                if (typeof ui !== 'undefined') {
                    ui.reset();
                    ui.start('#firebaseui-auth-container', uiConfig);
                }
            }
        });
    }, 100);
}

// =============================================================================
// GOOGLE ONE TAP SIGN-IN
// =============================================================================

function initializeGoogleOneTap() {
    AUTH_LOG.log('Initializing Google One Tap');
    
    if (firebase.auth().currentUser) {
        AUTH_LOG.log('User already signed in, skipping One Tap');
        return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    
    script.onload = () => {
        try {
            window.google.accounts.id.initialize({
                client_id: '409708360032-ducbhdgd7384cnv6mh24eu59baerd8hi.apps.googleusercontent.com', // ✅ REPLACE WITH YOUR CLIENT ID
                callback: handleGoogleOneTapResponse,
                auto_select: false,
                cancel_on_tap_outside: true,
                context: 'signin',
                ux_mode: 'popup',
                itp_support: true
            });
            
            window.google.accounts.id.prompt((notification) => {
                AUTH_LOG.log('One Tap prompt notification:', notification);
                
                if (notification.isNotDisplayed()) {
                    AUTH_LOG.log('One Tap not displayed. Reason:', notification.getNotDisplayedReason());
                    displayGoogleSignInButton();
                } else if (notification.isSkippedMoment()) {
                    AUTH_LOG.log('One Tap skipped. Reason:', notification.getSkippedReason());
                    displayGoogleSignInButton();
                } else if (notification.isDismissedMoment()) {
                    AUTH_LOG.log('One Tap dismissed. Reason:', notification.getDismissedReason());
                    displayGoogleSignInButton();
                }
            });
        } catch (error) {
            AUTH_LOG.error('Error initializing One Tap:', error);
            if (typeof ui !== 'undefined') {
                ui.start('#firebaseui-auth-container', uiConfig);
            }
        }
    };
    
    script.onerror = () => {
        AUTH_LOG.error('Failed to load Google Identity Services script');
        if (typeof ui !== 'undefined') {
            ui.start('#firebaseui-auth-container', uiConfig);
        }
    };
}

async function handleGoogleOneTapResponse(response) {
    AUTH_LOG.log('Google One Tap response received');
    
    try {
        const credential = firebase.auth.GoogleAuthProvider.credential(response.credential);
        const result = await firebase.auth().signInWithCredential(credential);
        
        AUTH_LOG.log('One Tap sign-in successful:', result.user.email);
        
        const allowed = await isEmailAllowed(result.user.email);
        
        if (!allowed) {
            AUTH_LOG.error('User not authorized');
            await logLoginActivity(result.user.email, 'failed', 'User not authorized');
            await firebase.auth().signOut();
            try {
                await result.user.delete();
            } catch (err) {
                AUTH_LOG.error('Could not delete user:', err);
            }
            toast.error('Access Denied', {
                description: 'Your email is not authorized.'
            });
            return;
        }
        
        AUTH_LOG.log('User authorized, showing access code modal');
        showCodeVerificationModal(result.user.email);
        
    } catch (error) {
        AUTH_LOG.error('One Tap sign-in error:', error);
        
        await logLoginActivity(result?.user?.email || 'unknown', 'failed', error.message);
        
        toast.error('Sign-In Failed', {
            description: error.message || 'An error occurred during sign-in'
        });
        
        displayGoogleSignInButton();
    }
}

function displayGoogleSignInButton() {
    AUTH_LOG.log('Displaying Google Sign-In button fallback');
    
    const buttonContainer = document.getElementById('googleSignInButton');
    
    if (!buttonContainer) {
        AUTH_LOG.error('Google Sign-In button container not found in HTML');
        if (typeof ui !== 'undefined') {
            ui.start('#firebaseui-auth-container', uiConfig);
        }
        return;
    }
    
    try {
        window.google.accounts.id.renderButton(
            buttonContainer,
            {
                theme: 'outline',
                size: 'large',
                width: buttonContainer.offsetWidth || 400,
                text: 'signin_with',
                shape: 'rectangular',
                logo_alignment: 'left'
            }
        );
    } catch (error) {
        AUTH_LOG.error('Error rendering Google button:', error);
        if (typeof ui !== 'undefined') {
            ui.start('#firebaseui-auth-container', uiConfig);
        }
    }
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
                    if (typeof ui !== 'undefined') {
                        ui.reset();
                        ui.start('#firebaseui-auth-container', uiConfig);
                    }
                }, 2000);
                
                return;
            }
            
            AUTH_LOG.log('User authorized, showing access code modal');
            showCodeVerificationModal(result.user.email);
        } else {
            AUTH_LOG.log('No redirect result found');
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
            
            AUTH_LOG.log('User authorized, showing access code modal');
            showCodeVerificationModal(user.email);
            
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
    
    initializeGoogleOneTap();
    
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
        
        AUTH_LOG.log('User authorized, showing access code modal');
        showCodeVerificationModal(currentUser.email);
    } else {
        AUTH_LOG.log('No current user, checking for redirect result');
        
        await handleRedirectResult();
        
        if (!firebase.auth().currentUser) {
            AUTH_LOG.log('No user found after redirect check');
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
            
            showCodeVerificationModal(email);
            
        } catch (error) {
            AUTH_LOG.error('Email/password login error:', error);
            
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
                    errorTitle = 'Invalid Credentials';
                    errorMessage = 'The email or password you entered is incorrect.';
                    break;
                default:
                    errorMessage = 'An authentication error occurred. Please try again.';
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
                
                AUTH_LOG.log('User authorized on login page, showing access code modal');
                showCodeVerificationModal(user.email);
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
        } else {
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
                    startAllSessionMonitoring(user.email);
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