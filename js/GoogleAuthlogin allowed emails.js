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
            tag: 'notification-' + Date.now() // Unique tag to prevent interference
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

// FirebaseUI config with email validation callback
var uiConfig = {
    signInFlow: 'popup',
    signInOptions: [
        {
            provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
            // Force account selection every time
            customParameters: {
                prompt: 'select_account'
            }
        }
    ],
    tosUrl: './terms.html',
    callbacks: {
        signInSuccessWithAuthResult: function(authResult, redirectUrl) {
            // Don't handle anything here - let onAuthStateChanged handle it
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
            
            // Play success sound
            playSuccessSound();
            showNotification('Login Successful', 'Welcome back!');
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 500);
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

// Handle auth state changes and check authorization
let isCheckingAuth = false;

firebase.auth().onAuthStateChanged(async (user) => {
    // Prevent multiple simultaneous checks
    if (isCheckingAuth) return;
    
    const isLoginPage = window.location.pathname.includes('login.html');
    
    if (user) {
        console.log('User signed in:', user.email);
        isCheckingAuth = true;
        
        try {
            // Check if email is allowed
            const allowed = await isEmailAllowed(user.email);
            
            if (!allowed) {
                console.log('Unauthorized email detected:', user.email);
                
                // Sign out immediately
                await firebase.auth().signOut();
                
                // Try to delete the user account to prevent future auto-login
                try {
                    await user.delete();
                } catch (err) {
                    console.log('Could not delete user:', err);
                }
                
              showNotification('Access Denied', 
                    'Your email (' + user.email + ') is not authorized to access this system. Please contact your administrator.');
                
                isCheckingAuth = false;
                
                // Restart FirebaseUI to show sign-in options again
                if (isLoginPage) {
                    ui.reset();
                    ui.start('#firebaseui-auth-container', uiConfig);
                } else {
                    window.location.href = 'login.html';
                }
                return;
                
            }

            
            // Email is allowed
            if (isLoginPage) {
                // User successfully logged in and is authorized
                playSuccessSound();
                showNotification('Login Successful', 'Welcome, ' + user.email + '!');
                
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 500);
            }
            // else: user is on another page and is authorized, let them stay
            
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
            // Redirect to login if not on login page
            window.location.href = 'login.html';
        }
        // else: on login page with no user, which is expected
    }
});