// Add notification constants at the top
const NOTIFICATION_TIMEOUT = 5000; // 5 seconds in milliseconds
const NOTIFICATION_VOLUME = 0.5;   // 50% volume

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
        const tempAlert = alert(message);
        setTimeout(() => tempAlert.close(), NOTIFICATION_TIMEOUT);
        return;
    }

    // Check if permission is already granted
    if (Notification.permission === "granted") {
        const options = {
            body: message,
            icon: '/img/logo.png',
            requireInteraction: false,
            vibrate: [200, 100, 200],
            silent: false
        };
        
        try {
            const notification = new Notification(title, options);
            const timeoutId = setTimeout(() => {
                if (notification) {
                    notification.close();
                }
            }, NOTIFICATION_TIMEOUT);

            // Clear timeout if user clicks earlier
            notification.onclick = function() {
                clearTimeout(timeoutId);
                window.focus();
                notification.close();
            };
        } catch (e) {
            console.error('Notification creation failed:', e);
            const tempAlert = alert(message);
            setTimeout(() => tempAlert.close(), NOTIFICATION_TIMEOUT);
        }
    } else {
        // Handle permission request or denial
        Notification.requestPermission()
            .then(permission => {
                if (permission === "granted") {
                    showNotification(title, message);
                } else {
                    const tempAlert = alert(message);
                    setTimeout(() => tempAlert.close(), NOTIFICATION_TIMEOUT);
                }
            });
    }
}

// FirebaseUI config
var uiConfig = {
    signInFlow: 'popup',  // Change to 'redirect' to handle cross-origin issues
    signInSuccessUrl: 'index.html',
    signInOptions: [
        // firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        // firebase.auth.EmailAuthProvider.PROVIDER_ID,
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
    e.stopPropagation(); // Stop event bubbling
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const resetBtn = document.getElementById('resetPasswordBtn');

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Hide reset button on successful login
            resetBtn.style.display = 'none';
            // Redirect to index.html on success
            window.location.href = 'index.html';
        })
        .catch((error) => {
            console.error('Error:', error);
            // Show reset button on login failure
            resetBtn.style.display = 'block';
            
            // Show appropriate error message
            let errorMessage = '';
            switch(error.code) {
                case 'auth/wrong-password':
                    errorMessage = 'Incorrect password. Need to reset your password?';
                    break;
                case 'auth/user-not-found':
                    errorMessage = 'No account found with this email.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Please enter a valid email address.';
                    break;
                default:
                    errorMessage = error.message;
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
        // User is signed in
    }
});