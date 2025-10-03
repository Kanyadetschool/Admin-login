// Global navigation controls for website
const NavigationControls = {
    // Go back to the previous page
    goBack: function() {
        try {
            window.history.back();
        } catch (e) {
            console.error('Navigation error (back):', e);
            alert('Unable to go back. No previous page in history.');
        }
    },

    // Go forward to the next page
    goForward: function() {
        try {
            window.history.forward();
        } catch (e) {
            console.error('Navigation error (forward):', e);
            alert('Unable to go forward. No next page in history.');
        }
    },

    // Reload the current page
    reloadPage: function(forceReload = false) {
        try {
            window.location.reload(forceReload);
        } catch (e) {
            console.error('Reload error:', e);
            alert('Unable to reload the page.');
        }
    },

    // Navigate to a specific URL
    goToUrl: function(url) {
        try {
            if (!url) throw new Error('URL is required');
            // Ensure URL has protocol if missing
            if (!url.match(/^https?:\/\//)) {
                url = 'https://' + url;
            }
            window.location.href = url;
        } catch (e) {
            console.error('Navigation error (goToUrl):', e);
            alert('Unable to navigate to the specified URL. Please check the URL and try again.');
        }
    },

    // Get the current URL
    getCurrentUrl: function() {
        try {
            return window.location.href;
        } catch (e) {
            console.error('Error getting current URL:', e);
            return null;
        }
    },

    // Open a new tab/window with the specified URL
    openNewTab: function(url) {
        try {
            if (!url) throw new Error('URL is required');
            // Ensure URL has protocol if missing
            if (!url.match(/^https?:\/\//)) {
                url = 'https://' + url;
            }
            // Basic URL validation
            const urlPattern = /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(\/.*)?$/i;
            if (!urlPattern.test(url)) {
                throw new Error('Invalid URL format');
            }
            console.log('Attempting to open new tab with URL:', url);
            const newWindow = window.open(url, '_blank');
            if (!newWindow) {
                throw new Error('Failed to open new tab. Popup may be blocked.');
            }
        } catch (e) {
            console.error('Error opening new tab:', e);
            alert('Unable to open new tab. Please ensure the URL is valid (e.g., https://example.com) and that popups are not blocked.');
        }
    },

    // Check if navigation controls are supported in the current environment
    isNavigationSupported: function() {
        try {
            return !!(window && window.history && window.location && window.open);
        } catch (e) {
            console.error('Error checking navigation support:', e);
            return false;
        }
    },

    // Toggle visibility of the navigation bar with animation
    toggleNavBar: function() {
        try {
            const navContainer = document.getElementById('navigation-controls');
            const toggleButton = document.getElementById('toggle-nav-button');
            const hamburgerLines = toggleButton.querySelectorAll('.hamburger-line');
            if (navContainer && toggleButton) {
                const isHidden = navContainer.classList.contains('nav-hidden');
                if (isHidden) {
                    navContainer.classList.remove('nav-hidden');
                    navContainer.classList.add('nav-visible');
                    toggleButton.classList.add('open');
                    hamburgerLines[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                    hamburgerLines[1].style.opacity = '0';
                    hamburgerLines[2].style.transform = 'rotate(-45deg) translate(7px, -7px)';
                } else {
                    navContainer.classList.remove('nav-visible');
                    navContainer.classList.add('nav-hidden');
                    toggleButton.classList.remove('open');
                    hamburgerLines[0].style.transform = 'rotate(0) translate(0, 0)';
                    hamburgerLines[1].style.opacity = '1';
                    hamburgerLines[2].style.transform = 'rotate(0) translate(0, 0)';
                }
            }
        } catch (e) {
            console.error('Error toggling navigation bar:', e);
            alert('Unable to toggle navigation controls.');
        }
    },

    // Create and append navigation buttons to the DOM
    initNavigationBar: function() {
        try {
            // Check if navigation is supported
            if (!this.isNavigationSupported()) {
                console.error('Navigation controls not supported in this environment.');
                return;
            }

            // Inject CSS styles for advanced UI
            const style = document.createElement('style');
            style.textContent = `
                #navigation-controls {
                    position: fixed;
                    top: 60px;
                    right: 20px;
                  background:transparent;
                    padding: 15px;
                  
                    border-radius: 12px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.15);
                    z-index: 1000;
                    backdrop-filter: blur(10px);
                    display: flex;
                    gap: 12px;
                    align-items: center;
                    transition: transform 0.3s ease, opacity 0.3s ease;
                }
                #navigation-controls.nav-hidden {
                    transform: translateY(-20px);
                    opacity: 0;
                    pointer-events: none;
                }
                #navigation-controls.nav-visible {
                    transform: translateY(0);
                    opacity: 1;
                    pointer-events: auto;
                }
                .nav-button {
                    padding: 10px 16px;
                    border: none;
                    border-radius: 8px;
                    background: linear-gradient(145deg, #007bff, #0056b3);
                    color: white;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                .nav-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 10px rgba(0,123,255,0.3);
                }
                .nav-button:active {
                    transform: translateY(0);
                }
                #url-input {
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    font-size: 14px;
                    width: 220px;
                    transition: border-color 0.2s ease;
                }
                #url-input:focus {
                    border-color: #007bff;
                    outline: none;
                }
                #toggle-nav-button {
                    position: fixed;
                    top: 10px;
                    right: 20px;
                    width: 40px;
                    height: 40px;
                    border: none;
                    border-radius: 8px;
                   background: linear-gradient(45deg,#2e374b,#ff1cac);

                    cursor: pointer;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.2);
                    z-index: 1001;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    transition: background 0.2s ease;
                }
                #toggle-nav-button:hover {
                     background: linear-gradient(45deg,#87adfe,#ff77cd);


                }
                #toggle-nav-button .hamburger-line {
                    width: 24px;
                    height: 3px;
                    background: white;
                    margin: 2px 0;
                    border-radius: 2px;
                    transition: transform 0.3s ease, opacity 0.3s ease;
                }
            `;
            document.head.appendChild(style);

            // Create toggle button (hamburger menu)
            const toggleButton = document.createElement('button');
            toggleButton.id = 'toggle-nav-button';
            toggleButton.innerHTML = `
                <span class="hamburger-line"></span>
                <span class="hamburger-line"></span>
                <span class="hamburger-line"></span>
            `;
            toggleButton.onclick = () => this.toggleNavBar();

            // Create container for navigation controls (hidden by default)
            const navContainer = document.createElement('div');
            navContainer.id = 'navigation-controls';
            navContainer.classList.add('nav-hidden');

            // Back Button
            const backButton = document.createElement('button');
            backButton.textContent = 'Back';
            backButton.className = 'nav-button';
            backButton.onclick = () => this.goBack();

            // Forward Button
            const forwardButton = document.createElement('button');
            forwardButton.textContent = 'Forward';
            forwardButton.className = 'nav-button';
            forwardButton.onclick = () => this.goForward();

            // Reload Button
            const reloadButton = document.createElement('button');
            reloadButton.textContent = 'Reload';
            reloadButton.className = 'nav-button';
            reloadButton.onclick = () => this.reloadPage();

            // Home Button
            const homeButton = document.createElement('button');
            homeButton.textContent = 'Home';
            homeButton.className = 'nav-button';
            homeButton.onclick = () => this.goToHome();

            // URL Input and Go Button
            const urlInput = document.createElement('input');
            urlInput.id = 'url-input';
            urlInput.type = 'text';
            urlInput.placeholder = 'Enter URL (e.g., example.com)';

            const goButton = document.createElement('button');
            goButton.textContent = 'Go';
            goButton.className = 'nav-button';
            goButton.onclick = () => {
                const url = urlInput.value.trim();
                if (url) this.goToUrl(url);
            };

            // Open in New Tab Button
            const newTabButton = document.createElement('button');
            newTabButton.textContent = 'New Tab';
            newTabButton.className = 'nav-button';
            newTabButton.onclick = () => {
                const url = urlInput.value.trim();
                if (url) this.openNewTab(url);
            };

            // Append buttons and input to container
            navContainer.appendChild(backButton);
            navContainer.appendChild(forwardButton);
            navContainer.appendChild(reloadButton);
            navContainer.appendChild(homeButton);
            navContainer.appendChild(urlInput);
            navContainer.appendChild(goButton);
            navContainer.appendChild(newTabButton);

            // Append toggle button and container to the document body
            document.body.appendChild(toggleButton);
            document.body.appendChild(navContainer);
        } catch (e) {
            console.error('Error initializing navigation bar:', e);
            alert('Unable to initialize navigation controls.');
        }
    }
};

// Export for module-based environments (e.g., Node.js, ES modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NavigationControls;
}

// Make available globally for browser environments and initialize buttons
if (typeof window !== 'undefined') {
    window.NavigationControls = NavigationControls;
    // Initialize navigation bar when the DOM is fully loaded
    window.addEventListener('DOMContentLoaded', () => {
        NavigationControls.initNavigationBar();
    });
}