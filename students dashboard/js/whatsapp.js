
const contactButton = document.getElementById('contactSupport');
const loader = document.getElementById('loader');

contactButton.addEventListener('click', (e) => {
    e.preventDefault();
    contactButton.disabled = true;
    loader.style.display = 'inline-block';

    setTimeout(() => {
        // Check if the device is Android or iOS (mobile)
        if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            // Redirect to WhatsApp Messenger for mobile
            window.location.href = 'https://wa.me/254769106047';
        } else {
            // Assume it's a desktop browser and attempt to open WhatsApp Desktop
            const whatsappDesktopUrl = 'whatsapp://send?phone=254769106047';
            const start = new Date().getTime();
            window.location.href = whatsappDesktopUrl;

            // Check if WhatsApp Desktop is not installed
            setTimeout(() => {
                const end = new Date().getTime();
                // If the app didn't open (i.e., time difference is small), show download option
                if (end - start < 2000) {
                    showNotification('Don\'t have WhatsApp Desktop? <a href="https://www.whatsapp.com/download" style="color: #fff; text-decoration: underline;">Download WhatsApp Now</a>');
                }
            }, 4000);
        }

        // Re-enable the button and hide loader
        contactButton.disabled = false;
        loader.style.display = 'none';
    }, 1500);
});