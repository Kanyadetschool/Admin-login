var mainApp = {};
(function() {
    var mainContainer = document.getElementById("main_container");

    var logout = function() {
        firebase.auth().signOut().then(function() {
            window.location.replace("https://admin-kanyadet.web.app/GoogleAuthlogin.html");
        }, function() {});
        
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
        const IDLE_TIMEOUT = 900000; // 15 minutes idle timeout (standard practice)
        const ABSOLUTE_TIMEOUT = 1800000; // 30 minutes absolute session length
        const WARNING_BEFORE_LOGOUT = 60000; // 60 seconds warning (more user-friendly)

        function resetTimer() {
            clearTimeout(timer);
            clearTimeout(warningTimer);
            
            const sessionAge = Date.now() - sessionStartTime;
            
            // Check absolute timeout first
            if (sessionAge >= ABSOLUTE_TIMEOUT) {
                logout();
                return;
            }

            // Handle idle timeout
            const timeUntilWarning = Math.min(
                IDLE_TIMEOUT - WARNING_BEFORE_LOGOUT,
                ABSOLUTE_TIMEOUT - sessionAge - WARNING_BEFORE_LOGOUT
            );

            if (timeUntilWarning > 0) {
                timer = setTimeout(showWarning, timeUntilWarning);
            } else {
                showWarning();
            }
        }

        function showWarning() {
            var countdown = 60;
            Swal.fire({
                title: 'Session Expiring Soon',
                html: `For security reasons, your session will expire in <strong id="countdown">${countdown}</strong> seconds.<br>Would you like to continue working?`,
                icon: 'warning',
                timer: WARNING_BEFORE_LOGOUT,
                timerProgressBar: true,
                showCancelButton: true,
                confirmButtonText: 'Yes, Continue Session',
                cancelButtonText: 'Logout Now',
                allowOutsideClick: false,
                allowEscapeKey: false,
                willClose: () => {
                    clearTimeout(warningTimer);
                }
            }).then((result) => {
                const sessionAge = Date.now() - sessionStartTime;
                if (result.isConfirmed && sessionAge < ABSOLUTE_TIMEOUT) {
                    resetTimer();
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
            sessionStartTime = Date.now();
            resetTimer();
            
            // Throttled event listeners to prevent excessive resets
            const throttledReset = throttle(resetTimer, 1000);
            
            ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'].forEach(event => {
                window.addEventListener(event, throttledReset, { passive: true });
            });

            // Check session periodically
            setInterval(() => {
                const sessionAge = Date.now() - sessionStartTime;
                if (sessionAge >= ABSOLUTE_TIMEOUT) {
                    logout();
                }
            }, 60000); // Check every minute
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
            setup: setupInactivityListener
        };
    }();

    init();

    mainApp.logout = logout;
})();