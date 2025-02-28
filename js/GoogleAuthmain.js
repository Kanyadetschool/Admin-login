var mainApp = {};
(function() {
    var mainContainer = document.getElementById("main_container");
    const TOKEN_LIFETIME = 21600000; // 6 hours in milliseconds
    const WARNING_BEFORE_EXPIRY = 300000; // 5 minutes in milliseconds
    let tokenExpiryTimer;
    let warningTimer;

    // Listen for storage events to sync logout across tabs
    window.addEventListener('storage', function(e) {
        if (e.key === 'logout-event') {
            // Perform logout in other tabs without redirect
            firebase.auth().signOut().then(function() {
                window.location.replace("https://admin-kanyadet.web.app/login.html");
            }).catch(function(error) {
                console.error("Logout error:", error);
            });
        }
    });

    var logout = function() {
        // Trigger logout event for other tabs
        localStorage.setItem('logout-event', Date.now().toString());
        
        // Perform logout in current tab
        firebase.auth().signOut().then(function() {
            window.location.replace("https://admin-kanyadet.web.app/login.html");
        }, function(error) {
            console.error("Logout error:", error);
        });
    };

    // Show security notification on every page load
    function showSecurityNotification() {
        Swal.fire({
            title: 'Security Notice',
            text: 'Please ensure you\'re in a secure environment before proceeding.',
            icon: 'info',
            timer: 100,
            timerProgressBar: true,
            confirmButtonText: 'Understood',
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
    }

    // Show warning before token expiration
    function showExpiryWarning() {
        var countdown = 300; // 5 minutes in seconds
        Swal.fire({
            title: 'Session Expiring Soon',
            html: `Your session will expire in <strong id="countdown">${countdown}</strong> seconds.<br>You will need to log in again after expiration.`,
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

    // Set up token expiration timer
    function setupTokenExpiration() {
        clearTimeout(tokenExpiryTimer);
        clearTimeout(warningTimer);

        // Set timer for warning
        warningTimer = setTimeout(showExpiryWarning, TOKEN_LIFETIME - WARNING_BEFORE_EXPIRY);
        
        // Set timer for logout
        tokenExpiryTimer = setTimeout(logout, TOKEN_LIFETIME);
    }

    var init = function() {
        // Show security notification on every page load
        showSecurityNotification();

        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                console.log("stay");
                mainContainer.style.display = "";
                setupTokenExpiration(); // Start token expiration timer
            } else {
                mainContainer.style.display = "none";
                window.location.replace("https://admin-kanyadet.web.app/login.html");
            }
        });
    };

    init();

    mainApp.logout = logout;
})();