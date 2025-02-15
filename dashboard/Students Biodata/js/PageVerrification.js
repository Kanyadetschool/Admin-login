document.addEventListener("DOMContentLoaded", function() {
    const loaderContainer = document.querySelector('.loading');
    const body = document.body;

    setTimeout(function() {
        loaderContainer.style.display = 'none';
        body.classList.remove('loading'); // Remove the loading class to remove blur

        // Prompt for password using SweetAlert
        function showPasswordPrompt() {
            Swal.fire({
                title: 'Search Authentication Key',
                input: 'password',
                inputPlaceholder: 'Enter your Auth Key',
                showCancelButton: true,
                confirmButtonText: 'Submit',
                cancelButtonText: 'Bypass',
                inputValidator: (value) => {
                    if (value !== 'niko' && value !== 'map'&& value !== 'parse') {
                        return 'Incorrect password! Please try again.';
                    }
                },
                allowOutsideClick: false, // Disable outside clicks
                allowEscapeKey: false // Disable escape key
            }).then((result) => {
                if (result.isConfirmed){
                    // Password is correct, proceed with update confirmation
                    Swal.fire({
                        title: 'Congratutalions',
                        text: 'Verrification Successful',
                        icon: 'info',
                        showCancelButton: false,
                        confirmButtonText: '',
                        cancelButtonText: 'Not now',
                        timer: 1500, // Auto-close the popup after 5 seconds
                        timerProgressBar: true // Show a progress bar for the timer
                    })
                } else {
                    // Incorrect password or cancel button clicked
                    Swal.fire({
                        title: 'Access Denied',
                        text: 'We cannot verify you.Kindly Contact School ICT Team if this is not correct',
                        icon: 'error',
                        showCancelButton: false, // Remove the "Retry" option
                        confirmButtonText: '',
                        timer: 2000, // Auto-close the popup after 5 seconds
                        timerProgressBar: false // Show a progress bar for the timer
                    }).then(() => {
                        // Redirect to a blank page and replace history state
                        window.location.replace('../index.html');
                    });
                }
            });
        }
        showPasswordPrompt();
    }, 1000); // 2 seconds
});
