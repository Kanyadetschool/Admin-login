var mainApp = {};
(function() {
    var mainContainer = document.getElementById("main_container");

    var logout = async function() {
        try {
            await secureCleanup();
            await firebase.auth().signOut();
            window.location.replace("https://admin-kanyadet.web.app/GoogleAuthlogin.html");
        } catch (error) {
            console.error('Logout error:', error);
            window.location.replace("https://admin-kanyadet.web.app/GoogleAuthlogin.html");
        }
    };

    var init = function() {
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                console.log("stay");
                mainContainer.style.display = "";
                inactivityTime.reset(); // Start the inactivity timer
                inactivityTime.setup(); // Set up the event listeners for user activity
            } else {
                mainContainer.style.display = "none";
                window.location.replace("https://admin-kanyadet.web.app/GoogleAuthlogin.html");
            }
        });
    };

    var inactivityTime = function() {
        var timer;
        var warningTimer;
        var sessionStartTime;
        const IDLE_TIMEOUT = 360000;      // 6 minutes idle timeout
        const ABSOLUTE_TIMEOUT = 1200000;  // 20 minutes absolute session length
        const WARNING_BEFORE_LOGOUT = 30000; // 30 seconds warning
        const SESSION_CHECK_INTERVAL = 10000; // Check every 10 seconds

        // Session storage key for cross-tab communication
        const LAST_ACTIVITY_KEY = 'lastActivityTime';
        const SESSION_ID_KEY = 'sessionId';

        function updateLastActivity() {
            const timestamp = Date.now();
            localStorage.setItem(LAST_ACTIVITY_KEY, timestamp.toString());
            sessionStartTime = parseInt(localStorage.getItem('sessionStartTime')) || timestamp;
        }

        function initializeSession() {
            if (!localStorage.getItem('sessionStartTime')) {
                localStorage.setItem('sessionStartTime', Date.now().toString());
            }
            if (!localStorage.getItem(SESSION_ID_KEY)) {
                localStorage.setItem(SESSION_ID_KEY, Math.random().toString(36).substring(2));
            }
            updateLastActivity();
        }

        function resetTimer() {
            clearTimeout(timer);
            clearTimeout(warningTimer);
            updateLastActivity();
            
            const sessionAge = Date.now() - sessionStartTime;
            
            if (sessionAge >= ABSOLUTE_TIMEOUT) {
                logout();
                return;
            }

            const timeUntilWarning = Math.min(
                IDLE_TIMEOUT - WARNING_BEFORE_LOGOUT,
                ABSOLUTE_TIMEOUT - sessionAge - WARNING_BEFORE_LOGOUT
            );

            if (timeUntilWarning > 0) {
                timer = setTimeout(showWarning, timeUntilWarning);
            }
        }

        function showWarning() {
            var countdown = 30;
            const lastActivity = parseInt(localStorage.getItem(LAST_ACTIVITY_KEY));
            const idleTime = Date.now() - lastActivity;

            // If user was active in another tab, reset timer instead of showing warning
            if (idleTime < IDLE_TIMEOUT - WARNING_BEFORE_LOGOUT) {
                resetTimer();
                return;
            }

            Swal.fire({
                title: 'Session Expiring Soon',
                html: `Your session will expire in <strong id="countdown">${countdown}</strong> seconds.<br>Would you like to continue working?`,
                icon: 'warning',
                timer: WARNING_BEFORE_LOGOUT,
                timerProgressBar: true,
                showCancelButton: true,
                confirmButtonText: 'Yes, Continue Session',
                cancelButtonText: 'Logout Now',
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then((result) => {
                if (result.isConfirmed) {
                    updateLastActivity();
                    resetTimer();
                    // Broadcast session continuation to other tabs
                    localStorage.setItem('sessionContinued', Date.now().toString());
                } else {
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

            warningTimer = setTimeout(logout, WARNING_BEFORE_LOGOUT);
        }

        function setupInactivityListener() {
            initializeSession();
            resetTimer();
            
            const throttledReset = throttle(resetTimer, 1000);
            
            // Activity events
            ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 
             'click', 'focus'].forEach(event => {
                window.addEventListener(event, throttledReset, { passive: true });
            });

            // Handle tab visibility changes
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden) {
                    const lastActivity = parseInt(localStorage.getItem(LAST_ACTIVITY_KEY));
                    const idleTime = Date.now() - lastActivity;
                    if (idleTime < IDLE_TIMEOUT) {
                        resetTimer();
                    }
                }
            });

            // Listen for session updates from other tabs
            window.addEventListener('storage', (e) => {
                if (e.key === 'sessionContinued') {
                    resetTimer();
                }
            });

            // Regular session checks
            setInterval(() => {
                const lastActivity = parseInt(localStorage.getItem(LAST_ACTIVITY_KEY));
                const idleTime = Date.now() - lastActivity;
                
                if (idleTime >= IDLE_TIMEOUT && !document.querySelector('.swal2-container')) {
                    showWarning();
                }
            }, SESSION_CHECK_INTERVAL);

            // Clean up on page unload
            window.addEventListener('beforeunload', secureCleanup);
        }

        // Throttle function to limit how often resetTimer is called
        function throttle(func, limit) {
            let inThrottle;
            return function() {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            }
        }

        return {
            reset: resetTimer,
            setup: setupInactivityListener,
            forceLogout: logout,
            updateActivity: updateLastActivity
        };
    }();

    init();

    mainApp.logout = logout;
})();