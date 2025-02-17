

    // Initialize Firebase (if not already initialized)
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

    // Set persistence to LOCAL to persist authentication across page loads
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(() => {
            console.log("Persistence set to LOCAL");
        })
        .catch((error) => {
            console.error("Error setting persistence:", error);
        });

    // Function to handle user logout
    const logout = function () {
        // Remove session info from localStorage
        localStorage.removeItem('userSessionInfo');

        // Clear persistence to force user to log in again
        auth.setPersistence(firebase.auth.Auth.Persistence.NONE)
            .then(() => {
                // Sign out the user
                return auth.signOut();
            })
            .then(() => {
                console.log("User signed out successfully");
                // Redirect to login page after successful logout
                window.location.replace("https://admin-kanyadet.web.app/GoogleAuthlogin.html");
            })
            .catch((error) => {
                console.error("Logout error:", error);
            });
    };

    // Handle auth state changes
    auth.onAuthStateChanged((user) => {
        if (user) {
            console.log("User is signed in:", user);
            // Display the main container or handle authenticated state
            document.getElementById('main_container').style.display = "";
            // Optionally, update session info in Firebase
            updateSessionInfo(user);
        } else {
            console.log("User is signed out");
            // Redirect to login page if not signed in
            document.getElementById('main_container').style.display = "none";
            window.location.replace("https://admin-kanyadet.web.app/GoogleAuthlogin.html");
        }
    });

    // Function to update session information in Firebase
    const updateSessionInfo = (user) => {
        const sessionInfo = JSON.parse(localStorage.getItem('userSessionInfo') || '{}');
        sessionInfo.lastActive = Date.now();
        sessionInfo.sessionId = sessionInfo.sessionId || generateSessionId();
        localStorage.setItem('userSessionInfo', JSON.stringify(sessionInfo));

        const dbRef = ref(database, 'sessions/' + user.uid);
        set(dbRef, {
            lastActive: Date.now(),
            userAgent: navigator.userAgent,
            startTime: sessionInfo.startTime || Date.now(),
        });
    };

    // Generate a unique session ID
    const generateSessionId = () => {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    };

    // Example: Binding the logout function to a button click (adjust as needed)
    document.getElementById("logout_button").addEventListener("click", logout);

})();
