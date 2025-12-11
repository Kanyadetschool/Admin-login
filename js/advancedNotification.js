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

// ⚠️ WARNING: CLIENT-SIDE VALIDATION IS NOT SECURE!
// This is easily bypassed. Use Firebase Cloud Functions or Security Rules for production.

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
        
        if (doc.exists && doc.data().approved === true) {
            AUTH_LOG.log('User is approved via authorized_users');
            return true;
        }
        
        const domain = email.split('@')[1];
        AUTH_LOG.log('Checking domain:', domain);
        
        const domainRef = firebase.firestore().collection('authorized_domains').doc(domain.toLowerCase());
        const domainDoc = await domainRef.get();
        
        AUTH_LOG.log('Domain doc exists:', domainDoc.exists);
        
        if (domainDoc.exists && domainDoc.data().approved === true) {
            AUTH_LOG.log('User is approved via authorized_domains');
            return true;
        }
        
        AUTH_LOG.log('User not authorized');
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
        const storedCode = userData.accessCode || userData.access_code;
        
        AUTH_LOG.log('Code match:', storedCode === code.toString());
        
        if (storedCode && storedCode.toString() === code.toString()) {
            await docRef.update({
                lastCodeVerification: firebase.firestore.FieldValue.serverTimestamp()
            });
            AUTH_LOG.log('Access code verified successfully');
            return true;
        }
        
        AUTH_LOG.error('Invalid access code');
        return false;
    } catch (error) {
        AUTH_LOG.error('Error verifying access code:', error);
        
        if (error.code === 'permission-denied') {
            toast.error('Permission Denied', {
                description: 'Please contact your administrator'
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
    AUTH_LOG.log('Setting code verified for:', email);
    sessionStorage.setItem('codeVerified_' + email, 'true');
    sessionStorage.setItem('codeVerifiedTime_' + email, Date.now().toString());
}

function isCodeVerified(email) {
    const verified = sessionStorage.getItem('codeVerified_' + email);
    const verifiedTime = sessionStorage.getItem('codeVerifiedTime_' + email);
    
    if (!verified || !verifiedTime) {
        AUTH_LOG.log('Code not verified for:', email);
        return false;
    }
    
    const timeElapsed = Date.now() - parseInt(verifiedTime);
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    
    if (timeElapsed > TWENTY_FOUR_HOURS) {
        AUTH_LOG.log('Code verification expired for:', email);
        sessionStorage.removeItem('codeVerified_' + email);
        sessionStorage.removeItem('codeVerifiedTime_' + email);
        return false;
    }
    
    AUTH_LOG.log('Code verified for:', email);
    return true;
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
            z-index: 10000;
        ">
            <div style="
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
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
    
    const modal = document.getElementById('codeVerificationModal');
    const input = document.getElementById('accessCodeInput');
    const verifyBtn = document.getElementById('verifyCodeBtn');
    const cancelBtn = document.getElementById('cancelCodeBtn');
    const errorDiv = document.getElementById('codeError');
    
    input.focus();
    
    input.addEventListener('input', function(e) {
        this.value = this.value.replace(/[^0-9]/g, '');
        errorDiv.style.display = 'none';
    });
    
    async function handleVerification() {
        const code = input.value.trim();
        
        if (code.length !== 6) {
            errorDiv.textContent = 'Please enter a 6-digit code';
            errorDiv.style.display = 'block';
            return;
        }
        
        verifyBtn.disabled = true;
        verifyBtn.textContent = 'Verifying...';
        
        try {
            const isValid = await verifyAccessCode(email, code);
            
            if (isValid) {
                setCodeVerified(email);
                modal.remove();
                
                playSuccessSound();
                toast.success('Access Granted!', {
                    description: 'Code verified successfully. Redirecting...'
                });
                
                setTimeout(() => {
                    AUTH_LOG.log('Redirecting to index.html');
                    window.location.href = 'index.html';
                }, 500);
            } else {
                errorDiv.textContent = 'Invalid access code. Please try again.';
                errorDiv.style.display = 'block';
                verifyBtn.disabled = false;
                verifyBtn.textContent = 'Verify Code';
                input.value = '';
                input.focus();
            }
        } catch (error) {
            AUTH_LOG.error('Verification error:', error);
            errorDiv.textContent = 'Verification failed. Please try again.';
            errorDiv.style.display = 'block';
            verifyBtn.disabled = false;
            verifyBtn.textContent = 'Verify Code';
        }
    }
    
    verifyBtn.addEventListener('click', handleVerification);
    
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleVerification();
        }
    });
    
    cancelBtn.addEventListener('click', async function() {
        AUTH_LOG.log('User cancelled - signing out');
        await firebase.auth().signOut();
        modal.remove();
        toast.info('Signed Out', {
            description: 'You have been signed out successfully'
        });
        
        ui.reset();
        ui.start('#firebaseui-auth-container', uiConfig);
    });
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
            
            // Check authorization
            const allowed = await isEmailAllowed(result.user.email);
            
            if (!allowed) {
                AUTH_LOG.error('User not authorized:', result.user.email);
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
            
            // Check if code already verified
            if (isCodeVerified(result.user.email)) {
                AUTH_LOG.log('Code already verified, redirecting to index.html');
                playSuccessSound();
                toast.success('Welcome Back!', {
                    description: 'Access verified. Redirecting...'
                });
                
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 500);
            } else {
                // Show code verification modal
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
    signInFlow: 'popup',  // ✅ CHANGED TO POPUP - more reliable than redirect
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
            
            // Check authorization
            const allowed = await isEmailAllowed(user.email);
            
            if (!allowed) {
                AUTH_LOG.error('User not authorized:', user.email);
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
            
            // Check if code already verified
            if (isCodeVerified(user.email)) {
                AUTH_LOG.log('Code already verified, redirecting to index.html');
                playSuccessSound();
                toast.success('Welcome Back!', {
                    description: 'Access verified. Redirecting...'
                });
                
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 500);
            } else {
                // Show code verification modal
                AUTH_LOG.log('Code not verified, showing modal');
                showCodeVerificationModal(user.email);
            }
            
            return false;  // Prevent default redirect
        },
        signInFailure: function(error) {
            AUTH_LOG.error('❌ Sign-in failure callback:', error);
            
            if (error.code === 'auth/popup-blocked') {
                toast.error('Popup Blocked', {
                    description: 'Please allow popups in your browser and try again',
                    duration: 6000
                });
                
                // Offer redirect as fallback
                AUTH_LOG.log('Popup blocked - user can try redirect mode manually');
                
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
    
    // Check if user is already signed in
    const currentUser = firebase.auth().currentUser;
    AUTH_LOG.log('Current user on page load:', currentUser ? currentUser.email : 'none');
    
    if (currentUser) {
        // User is already signed in, handle it
        AUTH_LOG.log('User already signed in, checking authorization');
        
        const allowed = await isEmailAllowed(currentUser.email);
        
        if (!allowed) {
            AUTH_LOG.error('Signed in user not authorized:', currentUser.email);
            await firebase.auth().signOut();
            
            playNotificationSound();
            toast.error('Access Denied', {
                description: `Your email (${currentUser.email}) is not authorized. Contact your administrator.`,
                duration: 5000
            });
            
            // Restart UI
            ui.start('#firebaseui-auth-container', uiConfig);
            return;
        }
        
        // Check code verification
        if (isCodeVerified(currentUser.email)) {
            AUTH_LOG.log('User authorized and code verified, redirecting to index.html');
            playSuccessSound();
            toast.success('Welcome Back!', {
                description: 'Access verified. Redirecting...'
            });
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 500);
        } else {
            AUTH_LOG.log('User authorized but code not verified, showing modal');
            showCodeVerificationModal(currentUser.email);
        }
    } else {
        // No user signed in, check for redirect result then start UI
        AUTH_LOG.log('No current user, checking for redirect result');
        
        await handleRedirectResult();
        
        // Start UI if still no user
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
            
            // Check code verification
            if (isCodeVerified(email)) {
                playSuccessSound();
                toast.success('Welcome Back!', {
                    description: 'Redirecting...'
                });
                
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 500);
            } else {
                showCodeVerificationModal(email);
            }
            
        } catch (error) {
            AUTH_LOG.error('Email/password login error:', error);
            if (resetBtn) {
                resetBtn.style.display = 'block';
            }

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
    if (isCheckingAuth) return;
    
    AUTH_LOG.log('onAuthStateChanged triggered, user:', user ? user.email : 'null');
    
    const isLoginPage = window.location.pathname.includes('login.html');
    
    if (user) {
        AUTH_LOG.log('User signed in:', user.email);
        
        // Only handle auth state for non-login pages
        if (!isLoginPage) {
            isCheckingAuth = true;
            
            try {
                // Check if code verified for protected pages
                if (!isCodeVerified(user.email)) {
                    AUTH_LOG.log('Code not verified on protected page, redirecting to login');
                    await firebase.auth().signOut();
                    toast.warning('Session Expired', {
                        description: 'Your session has expired. Please login again.'
                    });
                    window.location.href = 'login.html';
                }
            } catch (error) {
                AUTH_LOG.error('Error checking authorization on protected page:', error);
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
        // No user signed in
        AUTH_LOG.log('No user signed in');
        if (!isLoginPage) {
            AUTH_LOG.log('Not on login page, redirecting to login');
            window.location.href = 'login.html';
        }
    }
});