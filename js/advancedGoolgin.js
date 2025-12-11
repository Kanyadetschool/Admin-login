const NOTIFICATION_TIMEOUT = 25000; // 25 seconds in milliseconds
const NOTIFICATION_VOLUME = 0.5;   // 50% volume

// ⚠️ WARNING: CLIENT-SIDE VALIDATION IS NOT SECURE!
// This is easily bypassed. Use Firebase Cloud Functions or Security Rules for production.
// For proper security, implement server-side validation using Firebase Cloud Functions.

// Function to check if email is allowed (validates against Firestore)
async function isEmailAllowed(email) {
    if (!email) return false;
    
    try {
        // Check Firestore for authorized user
        const docRef = firebase.firestore().collection('authorized_users').doc(email.toLowerCase());
        const doc = await docRef.get();
        
        if (doc.exists && doc.data().approved === true) {
            return true;
        }
        
        // Check if domain is allowed
        const domain = email.split('@')[1];
        const domainRef = firebase.firestore().collection('authorized_domains').doc(domain.toLowerCase());
        const domainDoc = await domainRef.get();
        
        if (domainDoc.exists && domainDoc.data().approved === true) {
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Error checking authorization:', error);
        return false;
    }
}

// NEW: Function to verify 6-digit access code
async function verifyAccessCode(email, code) {
    if (!email || !code) return false;
    
    try {
        const docRef = firebase.firestore().collection('authorized_users').doc(email.toLowerCase());
        const doc = await docRef.get();
        
        if (!doc.exists) {
            console.log('User document not found');
            return false;
        }
        
        const userData = doc.data();
        const storedCode = userData.accessCode || userData.access_code;
        
        // Check if code matches
        if (storedCode && storedCode.toString() === code.toString()) {
            // Optional: Store verification timestamp
            await docRef.update({
                lastCodeVerification: firebase.firestore.FieldValue.serverTimestamp()
            });
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Error verifying access code:', error);
        return false;
    }
}

// NEW: Store verification status in sessionStorage
function setCodeVerified(email) {
    sessionStorage.setItem('codeVerified_' + email, 'true');
    sessionStorage.setItem('codeVerifiedTime_' + email, Date.now().toString());
}

// NEW: Check if code was already verified this session
function isCodeVerified(email) {
    const verified = sessionStorage.getItem('codeVerified_' + email);
    const verifiedTime = sessionStorage.getItem('codeVerifiedTime_' + email);
    
    if (!verified || !verifiedTime) return false;
    
    // Optional: Expire verification after 24 hours
    const timeElapsed = Date.now() - parseInt(verifiedTime);
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    
    if (timeElapsed > TWENTY_FOUR_HOURS) {
        sessionStorage.removeItem('codeVerified_' + email);
        sessionStorage.removeItem('codeVerifiedTime_' + email);
        return false;
    }
    
    return true;
}

// Play success sound
function playSuccessSound() {
    try {
        const audio = new Audio('../audio/success.mp3');
        audio.volume = NOTIFICATION_VOLUME;
        audio.play().catch(e => console.log('Success audio play failed:', e));
    } catch (e) {
        console.error('Success audio error:', e);
    }
}

// Separate notification handler that doesn't affect auth state
function handleNotification(notification, timeoutId) {
    notification.onclick = function() {
        clearTimeout(timeoutId);
        notification.close();
    };
}

function showNotification(title, message) {
    console.log('Attempting to show notification:', title, message);

    // Play notification sound
    try {
        const audio = new Audio('../audio/notification.mp3');
        audio.volume = NOTIFICATION_VOLUME;
        audio.play().catch(e => console.log('Audio play failed:', e));
    } catch (e) {
        console.error('Audio error:', e);
    }

    // Check if the browser supports notifications
    if (!("Notification" in window)) {
        alert(message);
        return;
    }

    // Check if permission is already granted
    if (Notification.permission === "granted") {
        const options = {
            body: message,
            icon: '/img/logo.png',
            requireInteraction: false,
            vibrate: [200, 100, 200],
            silent: false,
            tag: 'notification-' + Date.now()
        };
        
        try {
            const notification = new Notification(title, options);
            const timeoutId = setTimeout(() => notification.close(), NOTIFICATION_TIMEOUT);
            handleNotification(notification, timeoutId);
        } catch (e) {
            console.error('Notification creation failed:', e);
            alert(message);
        }
    } else {
        // Handle permission request or denial
        Notification.requestPermission()
            .then(permission => {
                if (permission === "granted") {
                    showNotification(title, message);
                } else {
                    alert(message);
                }
            });
    }
}

// NEW: Show 6-digit code verification modal
function showCodeVerificationModal(email) {
    // Create modal HTML
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
    
    // Insert modal into page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const modal = document.getElementById('codeVerificationModal');
    const input = document.getElementById('accessCodeInput');
    const verifyBtn = document.getElementById('verifyCodeBtn');
    const cancelBtn = document.getElementById('cancelCodeBtn');
    const errorDiv = document.getElementById('codeError');
    
    // Focus input
    input.focus();
    
    // Only allow numbers
    input.addEventListener('input', function(e) {
        this.value = this.value.replace(/[^0-9]/g, '');
        errorDiv.style.display = 'none';
    });
    
    // Handle verification
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
                // Store verification status
                setCodeVerified(email);
                
                // Close modal
                modal.remove();
                
                // Play success sound
                playSuccessSound();
                showNotification('Access Granted', 'Code verified successfully!');
                
                // Redirect to main page
                setTimeout(() => {
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
            console.error('Verification error:', error);
            errorDiv.textContent = 'Verification failed. Please try again.';
            errorDiv.style.display = 'block';
            verifyBtn.disabled = false;
            verifyBtn.textContent = 'Verify Code';
        }
    }
    
    // Verify on button click
    verifyBtn.addEventListener('click', handleVerification);
    
    // Verify on Enter key
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleVerification();
        }
    });
    
    // Cancel and sign out
    cancelBtn.addEventListener('click', async function() {
        await firebase.auth().signOut();
        modal.remove();
        showNotification('Cancelled', 'Signed out successfully');
        
        // Restart FirebaseUI
        ui.reset();
        ui.start('#firebaseui-auth-container', uiConfig);
    });
}

// FirebaseUI config with email validation callback
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
        signInSuccessWithAuthResult: function(authResult, redirectUrl) {
            return false; // Prevent automatic redirect
        }
    }
};

// Initialize the FirebaseUI Widget using Firebase
var ui = new firebaseui.auth.AuthUI(firebase.auth());

// Start FirebaseUI on page load
document.addEventListener('DOMContentLoaded', function() {
    ui.start('#firebaseui-auth-container', uiConfig);
});

// Handle traditional email/password login
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const resetBtn = document.getElementById('resetPasswordBtn');

    try {
        // Check if email is allowed before attempting authentication
        const allowed = await isEmailAllowed(email);
        if (!allowed) {
            showNotification('Access Denied', 
                'Your email is not authorized to access this system. Please contact your administrator.');
            return;
        }

        // Direct authentication attempt
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        
        if (userCredential) {
            resetBtn.style.display = 'none';
            // Don't redirect yet - let onAuthStateChanged handle code verification
        }
    } catch (error) {
        console.error('Error:', error);
        if (resetBtn) {
            resetBtn.style.display = 'block';
        }

        let errorMessage = '';
        switch(error.code) {
            case 'auth/user-not-found':
                alert('This email is not registered in the admin system. Please contact your administrator.');
                return;
            case 'auth/wrong-password':
                errorMessage = 'Incorrect password. Please try again or reset your password.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Please enter a valid email address.';
                break;
            case 'auth/invalid-login-credentials':
                errorMessage = 'Invalid login credentials.';
                break;
            default:
                errorMessage = 'Authentication error. Please try again.';
        }
        
        showNotification('Login Failed', errorMessage);
    }
});

// Separate mouseclick-only handler for reset button
document.getElementById('resetPasswordBtn').addEventListener('mousedown', function(e) {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = 'reset.html';
});

// Prevent enter key from triggering reset button
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && document.activeElement.id === 'resetPasswordBtn') {
        e.preventDefault();
        return false;
    }
});

// Handle auth state changes and check authorization + code verification
let isCheckingAuth = false;

firebase.auth().onAuthStateChanged(async (user) => {
    if (isCheckingAuth) return;
    
    const isLoginPage = window.location.pathname.includes('login.html');
    
    if (user) {
        console.log('User signed in:', user.email);
        isCheckingAuth = true;
        
        try {
            // FIRST: Check if email is allowed
            const allowed = await isEmailAllowed(user.email);
            
            if (!allowed) {
                console.log('Unauthorized email detected:', user.email);
                
                await firebase.auth().signOut();
                
                try {
                    await user.delete();
                } catch (err) {
                    console.log('Could not delete user:', err);
                }
                
                showNotification('Access Denied', 
                    'Your email (' + user.email + ') is not authorized to access this system. Please contact your administrator.');
                
                isCheckingAuth = false;
                
                if (isLoginPage) {
                    ui.reset();
                    ui.start('#firebaseui-auth-container', uiConfig);
                } else {
                    window.location.href = 'login.html';
                }
                return;
            }

            // SECOND: Check if 6-digit code is verified
            if (isLoginPage) {
                // Check if code already verified this session
                if (isCodeVerified(user.email)) {
                    // Already verified, proceed to app
                    playSuccessSound();
                    showNotification('Welcome Back', 'Access code verified!');
                    
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 500);
                } else {
                    // Show code verification modal
                    showCodeVerificationModal(user.email);
                }
            } else {
                // On other pages, check if code verified
                if (!isCodeVerified(user.email)) {
                    // Not verified, redirect to login
                    await firebase.auth().signOut();
                    window.location.href = 'login.html';
                }
            }
            
        } catch (error) {
            console.error('Error checking authorization:', error);
            await firebase.auth().signOut();
            showNotification('Error', 'An error occurred. Please try again.');
        } finally {
            isCheckingAuth = false;
        }
    } else {
        // No user signed in
        if (!isLoginPage) {
            window.location.href = 'login.html';
        }
    }
});