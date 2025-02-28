document.addEventListener('DOMContentLoaded', function() {
    const loader = document.querySelector('.l-vue-loading__wrapper');
    const spinner = document.querySelector('.spinner-wrapper');
    
    function showLoader() {
        loader.style.display = 'flex';
        spinner.style.display = 'none';
        
        // Show spinner after 1 second
        setTimeout(() => {
            spinner.style.display = 'block';
            spinner.style.opacity = '1';
        }, 1000);

        // Hide entire loader after 3 seconds
        setTimeout(() => {
            loader.style.display = 'none';
        }, 3000);
    }

    // Show loader on initial page load
    showLoader();

    // Show loader on page reload
    window.addEventListener('beforeunload', () => {
        showLoader();
    });
});
