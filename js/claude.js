var mainApp = {};
(function() {
    var mainContainer = document.getElementById("main_container");
    const TOKEN_LIFETIME = 21600000; // 6 hours in milliseconds
    const WARNING_BEFORE_EXPIRY = 300000; // 5 minutes in milliseconds
    let tokenExpiryTimer;
    let warningTimer;
    let sessionStartTime;
    let lastActivityTime;

    // Store session info in localStorage
    const SESSION_STORAGE_KEY = 'userSessionInfo';

    var logout = function() {
        // Clear session storage before logout
        localStorage.removeItem(SESSION_STORAGE_KEY);
        firebase.auth().signOut().then(function() {
            window.location.replace("https://admin-kanyadet.web.app/GoogleAuthlogin.html");
        }, function() {});
    };

    // Track concurrent sessions
    function checkConcurrentSessions(user) {
        const currentSessionId = generateSessionId();
        const sessionInfo = {
            sessionId: currentSessionId,
            lastActive: Date.now(),
            userAgent: navigator.userAgent,
            startTime: Date.now()
        };
        
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionInfo));

        // Store session info in Firebase to track concurrent sessions
        const sessionRef = firebase.database().ref(`sessions/${user.uid}/${currentSessionId}`);
        sessionRef.set(sessionInfo);
        sessionRef.onDisconnect().remove();

        // Check for other active sessions
        firebase.database().ref(`sessions/${user.uid}`).on('value', (snapshot) => {
            const sessions = snapshot.val() || {};
            const activeSessions = Object.values(sessions).filter(session => 
                Date.now() - session.lastActive < 60000 && session.sessionId !== currentSessionId
            );

            if (activeSessions.length > 0) {
                showConcurrentSessionWarning(activeSessions);
            }
        });
    }

    // Generate unique session ID
    function generateSessionId() {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    // Show warning for concurrent sessions
    function showConcurrentSessionWarning(activeSessions) {
        const sessionList = activeSessions.map(session => 
            `Browser: ${getBrowserInfo(session.userAgent)}<br>Started: ${new Date(session.startTime).toLocaleString()}`
        ).join('<br><br>');

        Swal.fire({
            title: 'Multiple Active Sessions Detected',
            html: `Other active sessions found:<br><br>${sessionList}`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Keep This Session',
            cancelButtonText: 'Logout'
        }).then((result) => {
            if (!result.isConfirmed) {
                logout();
            }
        });
    }

    // Get browser info from user agent
    function getBrowserInfo(userAgent) {
        const ua = userAgent.toLowerCase();
        if (ua.includes('firefox')) return 'Firefox';
        if (ua.includes('chrome')) return 'Chrome';
        if (ua.includes('safari')) return 'Safari';
        if (ua.includes('edge')) return 'Edge';
        return 'Unknown Browser';
    }

    // Show security notification on page reload
    function showSecurityNotification() {
        const lastActivity = localStorage.getItem(SESSION_STORAGE_KEY) ? 
            JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY)).lastActive : null;
        
        const timeSinceLastActivity = lastActivity ? 
            Math.floor((Date.now() - lastActivity) / 60000) : null;

        Swal.fire({
            title: 'Security Notice',
            html: `This page has been reloaded.<br><br>` +
                  `${timeSinceLastActivity ? `Time since last activity: ${timeSinceLastActivity} minutes<br>` : ''}` +
                  `Current browser: ${getBrowserInfo(navigator.userAgent)}<br>` +
                  `Please ensure you're in a secure environment.`,
            icon: 'info',
            confirmButtonText: 'Understood'
        });
    }

    // Show warning before token expiration
    function showExpiryWarning() {
        var countdown = 300; // 5 minutes in seconds
        const sessionInfo = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) || '{}');
        const sessionDuration = Math.floor((Date.now() - sessionInfo.startTime) / 60000);

        Swal.fire({
            title: 'Session Expiring Soon',
            html: `Your session will expire in <strong id="countdown">${countdown}</strong> seconds.<br>` +
                  `Session duration: ${sessionDuration} minutes<br>` +
                  `You will need to log in again after expiration.`,
            icon: 'warning',
            timer: WARNING_BEFORE_EXPIRY,
            timerProgressBar: true,
            showCancelButton: true,
            confirmButtonText: 'Understood',
            cancelButtonText: 'Logout Now',
            allowOutsideClick: false,
            allowEscapeKey: false
        }).then((result) => {
            if (!result.isConfirmed) {
                logout();
            }
        });

        const countdownInterval = setInterval(() => {
            countdown--;
            const element = document.getElementById('countdown');
            if (element && countdown >= 0) {
                element.textContent = countdown;
            } else {
                clearInterval(countdownInterval);
            }
        }, 1000);
    }

    // Update session info periodically
    function updateSessionInfo() {
        const sessionInfo = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) || '{}');
        sessionInfo.lastActive = Date.now();
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionInfo));

        // Update Firebase session info
        const user = firebase.auth().currentUser;
        if (user && sessionInfo.sessionId) {
            firebase.database().ref(`sessions/${user.uid}/${sessionInfo.sessionId}/lastActive`)
                .set(Date.now());
        }
    }

    // Set up token expiration timer
    function setupTokenExpiration() {
        clearTimeout(tokenExpiryTimer);
        clearTimeout(warningTimer);

        // Set timer for warning
        warningTimer = setTimeout(showExpiryWarning, TOKEN_LIFETIME - WARNING_BEFORE_EXPIRY);
        
        // Set timer for logout
        tokenExpiryTimer = setTimeout(logout, TOKEN_LIFETIME);

        // Set up periodic session info updates
        setInterval(updateSessionInfo, 60000); // Update every minute
    }

    var init = function() {
        // Show security notification on page reload
        if (performance.navigation.type === performance.navigation.TYPE_RELOAD) {
            showSecurityNotification();
        }

        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                console.log("stay");
                mainContainer.style.display = "";
                sessionStartTime = Date.now();
                lastActivityTime = Date.now();
                setupTokenExpiration();
                checkConcurrentSessions(user);
            } else {
                mainContainer.style.display = "none";
                window.location.replace("https://admin-kanyadet.web.app/GoogleAuthlogin.html");
            }
        });
    };

    init();

    mainApp.logout = logout;
})();