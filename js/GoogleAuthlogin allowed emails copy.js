const NOTIFICATION_TIMEOUT = 25000; // 25 seconds in milliseconds
const NOTIFICATION_VOLUME = 0.5;   // 50% volume

// Add your allowed email addresses here
const ALLOWED_EMAILS = [
    'admin@yourdomain.com',
    'user1@yourdomain.com',
    'user2@yourdomain.com',
    // Add more allowed emails here
];

// You can also allow entire domains
const ALLOWED_DOMAINS = [
    'yourdomain.com',
    // Add more allowed domains here
];

// Function to check if email is allowed
function isEmailAllowed(email) {
    if (!email) return false;
    
    // Check if email is in allowed list
    if (ALLOWED_EMAILS.includes(email.toLowerCase())) {
        return true;
    }
    
    // Check if email domain is in allowed domains
    const domain = email.split('@')[1];
    if (ALLOWED_DOMAINS.includes(domain.toLowerCase())) {
        return true;
    }
    
    return false;
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

// Add persistent auth state handling
function persistAuthState(user) {
    if (user) {
        localStorage.setItem('authUser', JSON.stringify({
            uid: user.uid,
            email: user.email,
            lastLogin: new Date().getTime()
        }));
    } else {
        localStorage.removeItem('authUser');
    }
}

// Custom Google Sign-In with email validation
function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    
    firebase.auth().signInWithPopup(provider)
        .then((result) => {
            const user = result.user;
            
            // Check if email is allowed
            if (!isEmailAllowed(user.email)) {
                // Sign out immediately
                firebase.auth().signOut().then(() => {
                    // Delete the user account to prevent future auto-login
                    user.delete().catch(err => {
                        console.log('Could not delete user:', err);
                    });
                });
                
                showNotification('Access Denied', 
                    'Your email (' + user.email + ') is not authorized to access this system. Please contact your administrator.');
                return;
            }
            
            // Email is allowed - play success sound and proceed
            playSuccessSound();
            showNotification('Login Successful', 'Welcome, ' + user.email + '!');
            persistAuthState(user);
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 500);
        })
        .catch((error) => {
            console.error('Google sign-in error:', error);
            if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
                showNotification('Sign In Failed', error.message);
            }
        });
}

// FirebaseUI config - DISABLED for custom Google sign-in
var uiConfig = {
    signInFlow: 'popup',
    signInSuccessUrl: 'index.html',
    signInOptions: [
        // Removed GoogleAuthProvider from FirebaseUI - we handle it manually now
    ],
    tosUrl: './terms.html',
    callbacks: {
        signInSuccessWithAuthResult: function(authResult, redirectUrl) {
            return true;
        }
    }
};

// Initialize the FirebaseUI Widget using Firebase
var ui = new firebaseui.auth.AuthUI(firebase.auth());

// Add custom Google sign-in button
document.addEventListener('DOMContentLoaded', function() {
    // Create custom Google sign-in button
    const authContainer = document.getElementById('firebaseui-auth-container');
    if (authContainer) {
        authContainer.innerHTML = `
            <div style="text-align: center; margin-top: 20px;">
                <button id="googleSignInBtn" style="
                    background-color: #4285f4;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    font-size: 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    transition: background-color 0.3s;
                ">
                    <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                        <g fill="none" fill-rule="evenodd">
                            <path d="M17.6 9.2l-.1-1.8H9v3.4h4.8C13.6 12 13 13 12 13.6v2.2h3a8.8 8.8 0 0 0 2.6-6.6z" fill="#4285F4"/>
                            <path d="M9 18c2.4 0 4.5-.8 6-2.2l-3-2.2a5.4 5.4 0 0 1-8-2.9H1V13a9 9 0 0 0 8 5z" fill="#34A853"/>
                            <path d="M4 10.7a5.4 5.4 0 0 1 0-3.4V5H1a9 9 0 0 0 0 8l3-2.3z" fill="#FBBC05"/>
                            <path d="M9 3.6c1.3 0 2.5.4 3.4 1.3L15 2.3A9 9 0 0 0 1 5l3 2.4a5.4 5.4 0 0 1 5-3.7z" fill="#EA4335"/>
                        </g>
                    </svg>
                    Sign in with Google
                </button>
            </div>
        `;
        
        // Add hover effect
        const googleBtn = document.getElementById('googleSignInBtn');
        googleBtn.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#357ae8';
        });
        googleBtn.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '#4285f4';
        });
        
        // Add click handler
        googleBtn.addEventListener('click', signInWithGoogle);
    }
});

// Handle traditional email/password login
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const resetBtn = document.getElementById('resetPasswordBtn');

    // Check if email is allowed before attempting authentication
    if (!isEmailAllowed(email)) {
        showNotification('Access Denied', 
            'Your email is not authorized to access this system. Please contact your administrator.');
        return;
    }

    // Direct authentication attempt
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            if (userCredential) {
                resetBtn.style.display = 'none';
                
                // Play success sound
                playSuccessSound();
                showNotification('Login Successful', 'Welcome back!');
                
                persistAuthState(userCredential.user);
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 500);
            }
        })
        .catch((error) => {
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
        });
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

// Add auth state listener with email validation
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // Check if email is allowed
        if (!isEmailAllowed(user.email)) {
            console.log('Unauthorized email detected:', user.email);
            firebase.auth().signOut().then(() => {
                showNotification('Access Denied', 
                    'Your email is not authorized. You have been signed out.');
                localStorage.removeItem('authUser');
                if (!window.location.pathname.includes('login.html')) {
                    window.location.href = 'login.html';
                }
            });
            return;
        }
        persistAuthState(user);
    } else {
        // Clear persisted state if logged out
        localStorage.removeItem('authUser');
        // Redirect to login if not on login page
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
    }
});