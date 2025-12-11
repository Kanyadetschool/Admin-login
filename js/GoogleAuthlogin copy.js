const NOTIFICATION_TIMEOUT = 25000; // 5 seconds in milliseconds
const NOTIFICATION_VOLUME = 0.5;   // 50% volume

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

// FirebaseUI config
var uiConfig = {
    signInFlow: 'popup',  // Change to 'redirect' to handle cross-origin issues
    signInSuccessUrl: 'index.html',
    signInOptions: [
        firebase.auth.EmailAuthProvider.PROVIDER_ID,
        // firebase.auth.PhoneAuthProvider.PROVIDER_ID,
        // Uncomment the following lines if you want to support additional sign-in providers
       // firebase.auth.FacebookAuthProvider.PROVIDER_ID,
       // firebase.auth.TwitterAuthProvider.PROVIDER_ID,
        // firebase.auth.GithubAuthProvider.PROVIDER_ID,
    ],
    tosUrl: './terms.html',
    callbacks: {
        signInSuccessWithAuthResult: function(authResult, redirectUrl) {
            // User successfully signed in
            return true; // Return false to prevent redirect
        }
    }
};

// Initialize the FirebaseUI Widget using Firebase
var ui = new firebaseui.auth.AuthUI(firebase.auth());

// Handle traditional email/password login
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const resetBtn = document.getElementById('resetPasswordBtn');

    // Direct authentication attempt
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            if (userCredential) {
                resetBtn.style.display = 'none';
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

// Start the UI for other authentication methods
if (document.getElementById('firebaseui-auth-container')) {
    ui.start('#firebaseui-auth-container', uiConfig);
}

// Add auth state listener
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
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