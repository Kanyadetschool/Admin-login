var mainApp = {};
(function() {
    var mainContainer = document.getElementById("main_container");

    var logout = function() {
        firebase.auth().signOut().then(function() {
            window.location.replace("GoogleAuthlogin.html");
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
                window.location.replace("GoogleAuthlogin.html");
            }
        });
    };

    var inactivityTime = function() {
        var timer;
        var warningTimer;

        // Function to reset the timer
        function resetTimer() {
            clearTimeout(timer);
            clearTimeout(warningTimer);
            timer = setTimeout(showWarning, 60000); // 1 minute (60,000 milliseconds)
        }

        // Function to show the warning
        function showWarning() {
            var countdown = 30;
            Swal.fire({
                title: 'Inactivity Warning',
                html: `You will be logged out in <strong>${countdown}</strong> seconds due to inactivity.`,
                icon: 'warning',
                timer: 30000,
                showCancelButton: true,
                confirmButtonText: 'Stay Logged In',
                cancelButtonText: 'Log Out Now',
                timerProgressBar: true,
                willClose: () => {
                    clearTimeout(warningTimer);
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    resetTimer(); // User wants to stay logged in
                } else {
                    logout(); // User wants to log out immediately or did not respond in time
                }
            });

            // Update the countdown every second
            var interval = setInterval(() => {
                countdown--;
                if (countdown >= 0) {
                    const content = Swal.getHtmlContainer();
                    if (content) {
                        content.querySelector('strong').textContent = countdown;
                    }
                } else {
                    clearInterval(interval);
                }
            }, 1000);

            warningTimer = setTimeout(logout, 30000); // Auto logout after 30 seconds
        }

        // Set up event listeners for various user activities
        function setupInactivityListener() {
            window.addEventListener('mousemove', resetTimer);
            window.addEventListener('keydown', resetTimer);
            window.addEventListener('scroll', resetTimer);
            window.addEventListener('touchstart', resetTimer);
            window.addEventListener('click', resetTimer);
        }

        return {
            reset: resetTimer,
            setup: setupInactivityListener
        };
    }();

    init();

    mainApp.logout = logout;
})();