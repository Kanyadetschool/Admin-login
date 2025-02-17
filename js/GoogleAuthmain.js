// Initialize Firebase (only once)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

(function () {
    // Firebase config
    const firebaseConfig = {
        apiKey: "AIzaSyDuoaOZvCSZp_d2eTfUjBIZtoIFEKysgJ8",
        authDomain: "admin-kanyadet.firebaseapp.com",
        projectId: "admin-kanyadet",
        storageBucket: "admin-kanyadet.firebasestorage.app",
        messagingSenderId: "920056467446",
        appId: "1:920056467446:web:eb416e8125a21463b501d7",
        measurementId: "G-GL27FQHVPY"
    };

    
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const database = getDatabase(app);

    // Set persistence to LOCAL to persist authentication across page reloads
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(() => {
            console.log("Persistence set to LOCAL");
        })
        .catch((error) => {
            console.error("Error setting persistence:", error);
        });

    // Token expiration related constants (for example, 6 hours = 21600000 milliseconds)
    const TOKEN_LIFETIME = 21600000; // 6 hours in milliseconds
    const WARNING_BEFORE_EXPIRY = 300000; // 5 minutes in milliseconds

    let tokenExpiryTimer;
    let warningTimer;

    // Track session start time (when the user first logged in)
    let sessionStartTime;

    // Store session info in localStorage
    const SESSION_STORAGE_KEY = 'userSessionInfo';

    // Function to log out the user
    const logout = function () {
        // Clear session info from localStorage
        localStorage.removeItem(SESSION_STORAGE_KEY);

        // Sign out the user
        auth.signOut()
            .then(() => {
                console.log("User signed out successfully");
                // Redirect to login page after successful logout
                window.location.replace("https://admin-kanyadet.web.app/GoogleAuthlogin.html");
            })
            .catch((error) => {
                console.error("Logout error:", error);
            });
    };

    // Function to update session info in localStorage and Firebase
    const updateSessionInfo = (user) => {
        const sessionInfo = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) || '{}');
        sessionInfo.lastActive = Date.now();
        sessionInfo.sessionId = sessionInfo.sessionId || generateSessionId();
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionInfo));

        if (user) {
            // Update session info in Firebase Database
            const dbRef = ref(database, `sessions/${user.uid}/${sessionInfo.sessionId}`);
            set(dbRef, {
                lastActive: Date.now(),
                userAgent: navigator.userAgent,
                startTime: sessionInfo.startTime || Date.now(),
            });
        }
    };

    // Generate a unique session ID
    const generateSessionId = () => {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    };

    // Function to handle session expiration and token warning
    const handleTokenExpiration = () => {
        const countdownElement = document.getElementById('countdown');
        let countdown = Math.floor(TOKEN_LIFETIME / 1000); // Convert to seconds

        // Show warning before expiration
        const showExpiryWarning = () => {
            const sessionInfo = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) || '{}');
            const sessionDuration = Math.floor((Date.now() - sessionInfo.startTime) / 60000); // in minutes

            Swal.fire({
                title: 'Session Expiring Soon',
                html: `Your session will expire in <strong id="countdown">${countdown}</strong> seconds.<br>` +
                    `Session duration: ${sessionDuration} minutes.<br>` +
                    `You will need to log in again after expiration.`,
                icon: 'warning',
                timer: WARNING_BEFORE_EXPIRY,
                timerProgressBar: true,
                showCancelButton: true,
                confirmButtonText: 'Understood',
                cancelButtonText: 'Logout Now',
                allowOutsideClick: false,
                allowEscapeKey: false,
            }).then((result) => {
                if (!result.isConfirmed) {
                    logout(); // If the user clicks "Logout Now"
                }
            });

            const countdownInterval = setInterval(() => {
                countdown--;
                if (countdownElement && countdown >= 0) {
                    countdownElement.textContent = countdown;
                } else {
                    clearInterval(countdownInterval);
                }
            }, 1000);
        };

        // Set a timer to show the warning before expiration
        warningTimer = setTimeout(showExpiryWarning, TOKEN_LIFETIME - WARNING_BEFORE_EXPIRY);

        // Set a timer to logout the user when the session expires
        tokenExpiryTimer = setTimeout(logout, TOKEN_LIFETIME);
    };

    // Auth state change listener to detect when the user logs in or out
    auth.onAuthStateChanged((user) => {
        if (user) {
            console.log("User is signed in:", user);
            sessionStartTime = Date.now();
            updateSessionInfo(user); // Update session info in localStorage and Firebase

            // Set token expiration timers
            handleTokenExpiration();

            // Periodically update session info every minute
            setInterval(() => updateSessionInfo(user), 60000); // Update session every minute
        } else {
            console.log("User is signed out");
            window.location.replace("https://admin-kanyadet.web.app/GoogleAuthlogin.html");
        }
    });

    // Expose the logout function to the global mainApp object so it can be accessed from the HTML
    window.mainApp = {
        logout: logout
    };

})();
