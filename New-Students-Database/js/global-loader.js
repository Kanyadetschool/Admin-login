// COMPLETE GLOBAL LOADER - SINGLE DIV innerHTML IMPLEMENTATION

class GlobalLoader {
    constructor() {
        this.instances = new Map();
        this.currentProgress = 0;
        this.targetProgress = 0;
        this.animationId = null;
        this.isVisible = false;
    }

    // Get complete CSS as string
    getCSS() {
        return `
            <style id="global-loader-styles">
                .global-loader-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(255, 255, 255, 0.9);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 50;
                    transition: opacity 0.3s ease-out, transform 0.3s ease-out;
                }
                
                .global-loader-overlay.hidden {
                    display: none;
                }
                
                .global-loader-overlay.fade-out {
                    opacity: 0;
                    transform: scale(0.95);
                }

                .global-loader-container {
                    text-align: center;
                }

                /* Google-style circular progress */
                .global-progress-circle {
                    position: relative;
                    width: 64px;
                    height: 64px;
                    margin: 0 auto 16px auto;
                }

                .global-progress-circle svg {
                    width: 64px;
                    height: 64px;
                    transform: rotate(-90deg);
                }

                .global-progress-circle circle.bg-circle {
                    stroke: #e5e7eb;
                    stroke-width: 4;
                    fill: none;
                }

                .global-progress-circle circle.progress-circle {
                    stroke: #4285f4;
                    stroke-width: 4;
                    fill: none;
                    stroke-linecap: round;
                    stroke-dasharray: 175.93;
                    stroke-dashoffset: 175.93;
                    transition: stroke-dashoffset 0.3s ease-in-out;
                }

                /* Percentage text */
                .global-percentage-text {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    font-weight: 500;
                    color: #374151;
                }

                /* Loading message */
                .global-loading-message {
                    color: #4b5563;
                    font-weight: 500;
                    margin-bottom: 8px;
                    font-size: 16px;
                }

                /* Progress bar */
                .global-progress-bar-container {
                    width: 256px;
                    background: #e5e7eb;
                    border-radius: 9999px;
                    height: 4px;
                    margin: 0 auto;
                }

                .global-progress-bar {
                    background: #3b82f6;
                    height: 4px;
                    border-radius: 9999px;
                    transition: width 0.3s ease-out;
                    width: 0%;
                }

                /* Sub-message */
                .global-sub-message {
                    font-size: 14px;
                    color: #6b7280;
                    margin-top: 8px;
                    min-height: 20px;
                }

                /* Spinner animation for loading states without progress */
                .global-spinner {
                    display: inline-block;
                    width: 32px;
                    height: 32px;
                    border: 3px solid #f3f3f3;
                    border-top: 3px solid #3498db;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 16px;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                /* Modal variant */
                .global-loader-modal {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: white;
                    border-radius: 12px;
                    padding: 32px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    z-index: 51;
                    min-width: 300px;
                }

                .global-loader-backdrop {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.5);
                    backdrop-filter: blur(2px);
                    z-index: 50;
                }

                /* Notification variant */
                .global-loader-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    border-radius: 8px;
                    padding: 16px 20px;
                    box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                    z-index: 51;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    min-width: 250px;
                    border-left: 4px solid #3b82f6;
                }

                /* Theme variants */
                .global-loader-success .progress-circle { stroke: #10b981; }
                .global-loader-success .global-progress-bar { background: #10b981; }
                .global-loader-success .global-loader-notification { border-left-color: #10b981; }

                .global-loader-error .progress-circle { stroke: #ef4444; }
                .global-loader-error .global-progress-bar { background: #ef4444; }
                .global-loader-error .global-loader-notification { border-left-color: #ef4444; }

                .global-loader-warning .progress-circle { stroke: #f59e0b; }
                .global-loader-warning .global-progress-bar { background: #f59e0b; }
                .global-loader-warning .global-loader-notification { border-left-color: #f59e0b; }

                /* Responsive adjustments */
                @media (max-width: 480px) {
                    .global-progress-bar-container {
                        width: 200px;
                    }
                    
                    .global-loader-modal {
                        margin: 20px;
                        min-width: 280px;
                    }
                    
                    .global-loader-notification {
                        right: 10px;
                        left: 10px;
                        min-width: auto;
                    }
                }
            </style>
        `;
    }

    // Generate unique ID
    generateId() {
        return 'global-loader-' + Math.random().toString(36).substr(2, 9);
    }

    // Get complete fullscreen loader HTML with CSS included
    getFullscreenLoaderHTML(id, message = "Loading data...") {
        return `
            ${this.getCSS()}
            <div class="global-loader-overlay" id="${id}" style="display: flex;">
                <div class="global-loader-container">
                    <!-- Google-style circular progress -->
                    <div class="global-progress-circle">
                        <svg viewBox="0 0 64 64">
                            <!-- Background circle -->
                            <circle class="bg-circle" cx="32" cy="32" r="28"></circle>
                            <!-- Progress circle -->
                            <circle class="progress-circle" cx="32" cy="32" r="28"></circle>
                        </svg>
                        <!-- Percentage text -->
                        <div class="global-percentage-text">0%</div>
                    </div>
                    
                    <!-- Loading message -->
                    <div class="global-loading-message">${message}</div>
                    
                    <!-- Progress bar -->
                    <div class="global-progress-bar-container">
                        <div class="global-progress-bar"></div>
                    </div>
                    
                    <!-- Sub-message -->
                    <div class="global-sub-message">Initializing...</div>
                </div>
            </div>
        `;
    }

    // Get modal loader HTML with CSS
    getModalLoaderHTML(id, message = "Processing...") {
        return `
            ${this.getCSS()}
            <div class="global-loader-backdrop" id="backdrop-${id}"></div>
            <div class="global-loader-modal" id="${id}">
                <div class="global-loader-container">
                    <div class="global-progress-circle">
                        <svg viewBox="0 0 64 64">
                            <circle class="bg-circle" cx="32" cy="32" r="28"></circle>
                            <circle class="progress-circle" cx="32" cy="32" r="28"></circle>
                        </svg>
                        <div class="global-percentage-text">0%</div>
                    </div>
                    <div class="global-loading-message">${message}</div>
                    <div class="global-progress-bar-container">
                        <div class="global-progress-bar"></div>
                    </div>
                    <div class="global-sub-message">Processing...</div>
                </div>
            </div>
        `;
    }

    // Get notification loader HTML with CSS
    getNotificationLoaderHTML(id, message = "Loading...") {
        return `
            ${this.getCSS()}
            <div class="global-loader-notification" id="${id}">
                <div class="global-spinner"></div>
                <div>
                    <div class="global-loading-message" style="margin-bottom: 4px; font-size: 14px;">${message}</div>
                    <div class="global-sub-message" style="margin-top: 0; font-size: 12px;"></div>
                </div>
            </div>
        `;
    }

    // Create loader from HTML string (NEW METHOD)
    createFromHTML(html, container = document.body) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // Find the main loader element (not the style tag)
        const loaderElement = tempDiv.querySelector('[id^="global-loader-"]');
        const id = loaderElement ? loaderElement.id : this.generateId();
        
        // Append all content to container
        while (tempDiv.firstChild) {
            container.appendChild(tempDiv.firstChild);
        }
        
        const instance = {
            id: id,
            element: document.getElementById(id),
            container: container,
            currentProgress: 0,
            targetProgress: 0,
            animationId: null,
            type: 'fullscreen' // Default type
        };
        
        this.instances.set(id, instance);
        return id;
    }

    // Show fullscreen loader using innerHTML
    show(message = "Loading data...", container = document.body) {
        const id = this.generateId();
        const html = this.getFullscreenLoaderHTML(id, message);
        
        // Use innerHTML on container
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // Append all elements
        while (tempDiv.firstChild) {
            container.appendChild(tempDiv.firstChild);
        }
        
        const instance = {
            id: id,
            element: document.getElementById(id),
            container: container,
            currentProgress: 0,
            targetProgress: 0,
            animationId: null,
            type: 'fullscreen'
        };
        
        this.instances.set(id, instance);
        return id;
    }

    // Show modal loader using innerHTML
    showModal(message = "Processing...", options = {}) {
        const id = this.generateId();
        const theme = options.theme || '';
        const html = this.getModalLoaderHTML(id, message);
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        while (tempDiv.firstChild) {
            document.body.appendChild(tempDiv.firstChild);
        }
        
        const element = document.getElementById(id);
        if (theme) {
            element.classList.add(`global-loader-${theme}`);
        }
        
        const instance = {
            id: id,
            element: element,
            container: document.body,
            currentProgress: 0,
            targetProgress: 0,
            animationId: null,
            type: 'modal'
        };
        
        this.instances.set(id, instance);
        return id;
    }

    // Show notification loader using innerHTML
    showNotification(message = "Loading...", options = {}) {
        const id = this.generateId();
        const theme = options.theme || '';
        const duration = options.duration || null;
        const html = this.getNotificationLoaderHTML(id, message);
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        while (tempDiv.firstChild) {
            document.body.appendChild(tempDiv.firstChild);
        }
        
        const element = document.getElementById(id);
        if (theme) {
            element.classList.add(`global-loader-${theme}`);
        }
        
        const instance = {
            id: id,
            element: element,
            container: document.body,
            currentProgress: 0,
            targetProgress: 0,
            animationId: null,
            type: 'notification'
        };
        
        this.instances.set(id, instance);
        
        // Auto-hide notification after duration
        if (duration) {
            setTimeout(() => this.hide(id), duration);
        }
        
        return id;
    }

    // Set progress with smooth animation
    setProgress(loaderId, percentage, subMessage = '') {
        const instance = this.instances.get(loaderId);
        if (!instance) return;

        instance.targetProgress = Math.max(0, Math.min(100, percentage));
        
        if (subMessage) {
            this.setSubMessage(loaderId, subMessage);
        }
        
        this.animateProgress(instance);
    }

    // Animate progress smoothly
    animateProgress(instance) {
        if (instance.animationId) {
            cancelAnimationFrame(instance.animationId);
        }

        const animate = () => {
            const diff = instance.targetProgress - instance.currentProgress;
            if (Math.abs(diff) > 0.5) {
                instance.currentProgress += diff * 0.1;
                this.updateDisplay(instance);
                instance.animationId = requestAnimationFrame(animate);
            } else {
                instance.currentProgress = instance.targetProgress;
                this.updateDisplay(instance);
                instance.animationId = null;
            }
        };

        animate();
    }

    // Update visual elements
    updateDisplay(instance) {
        const percentage = Math.round(instance.currentProgress);
        const circumference = 175.93; // 2 * π * r (r=28)
        const offset = circumference - (percentage / 100) * circumference;

        // Update circular progress
        const circle = instance.element.querySelector('.progress-circle');
        if (circle) {
            circle.style.strokeDashoffset = offset;
        }

        // Update percentage text
        const percentageText = instance.element.querySelector('.global-percentage-text');
        if (percentageText) {
            percentageText.textContent = `${percentage}%`;
        }

        // Update progress bar
        const progressBar = instance.element.querySelector('.global-progress-bar');
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
    }

    // Set sub message
    setSubMessage(loaderId, message) {
        const instance = this.instances.get(loaderId);
        if (!instance) return;

        const subMessageEl = instance.element.querySelector('.global-sub-message');
        if (subMessageEl) {
            subMessageEl.textContent = message;
        }
    }

    // Set main message
    setMessage(loaderId, message) {
        const instance = this.instances.get(loaderId);
        if (!instance) return;

        const messageEl = instance.element.querySelector('.global-loading-message');
        if (messageEl) {
            messageEl.textContent = message;
        }
    }

    // Hide loader
    hide(loaderId, delay = 500) {
        if (!loaderId) return;

        const instance = this.instances.get(loaderId);
        if (!instance) return;

        // Complete progress first if it's a progress loader
        if (instance.type === 'fullscreen' || instance.type === 'modal') {
            this.setProgress(loaderId, 100, 'Complete!');
        }

        setTimeout(() => {
            if (instance.element) {
                if (instance.type === 'fullscreen') {
                    instance.element.classList.add('fade-out');
                }
                
                setTimeout(() => {
                    // Remove main element
                    if (instance.element && instance.element.parentNode) {
                        instance.element.parentNode.removeChild(instance.element);
                    }
                    
                    // Remove backdrop if modal
                    const backdrop = document.getElementById(`backdrop-${loaderId}`);
                    if (backdrop && backdrop.parentNode) {
                        backdrop.parentNode.removeChild(backdrop);
                    }
                    
                    // Clean up animation
                    if (instance.animationId) {
                        cancelAnimationFrame(instance.animationId);
                    }
                    
                    this.instances.delete(loaderId);
                }, 500);
            }
        }, delay);
    }

    // Hide all loaders
    hideAll() {
        const loaderIds = Array.from(this.instances.keys());
        loaderIds.forEach(id => this.hide(id, 0));
    }

    // Convenience methods
    showSuccess(message = 'Operation completed successfully!', duration = 2000) {
        const id = this.showNotification(message, { theme: 'success', duration });
        return id;
    }

    showError(message = 'An error occurred', duration = 3000) {
        const id = this.showNotification(message, { theme: 'error', duration });
        return id;
    }

    showWarning(message = 'Warning', duration = 3000) {
        const id = this.showNotification(message, { theme: 'warning', duration });
        return id;
    }

    // Get active loaders count
    getActiveCount() {
        return this.instances.size;
    }

    // Check if loader is active
    isActive(loaderId = null) {
        if (loaderId) {
            return this.instances.has(loaderId);
        }
        return this.instances.size > 0;
    }
}

// Create the global instance
window.GlobalLoader = new GlobalLoader();

// USAGE EXAMPLES:

// METHOD 1: Direct innerHTML injection (what you requested)
/*
const div = document.createElement('div');
const loaderId = 'my-custom-loader';
div.innerHTML = GlobalLoader.getFullscreenLoaderHTML(loaderId, 'Custom loading message...');
document.body.appendChild(div);

// Then control it
setTimeout(() => GlobalLoader.setProgress(loaderId, 50, 'Half way there...'), 1000);
setTimeout(() => GlobalLoader.hide(loaderId), 3000);
*/

// METHOD 2: Using the show methods (easier)
/*
const loaderId = GlobalLoader.show('Loading application...');
setTimeout(() => GlobalLoader.setProgress(loaderId, 75, 'Almost done...'), 2000);
setTimeout(() => GlobalLoader.hide(loaderId), 4000);
*/

// Your existing window.onload implementation:
window.onload = async () => {
    // Show loader immediately when page loads
    const mainLoader = GlobalLoader.show('Loading Kanyadet School Admin...');
    
    try {
        // Initial progress
        GlobalLoader.setProgress(mainLoader, 20, 'Connecting to Firebase...');
        
        // Call your existing setupFirebase function
        // setupFirebase();
        
        // Progress simulation (adjust timing as needed)
        setTimeout(() => GlobalLoader.setProgress(mainLoader, 50, 'Setting up authentication...'), 1000);
        setTimeout(() => GlobalLoader.setProgress(mainLoader, 80, 'Loading student database...'), 2500);
        setTimeout(() => {
            GlobalLoader.setProgress(mainLoader, 100, 'Ready!');
            setTimeout(() => GlobalLoader.hide(mainLoader), 800);
        }, 4000);
        
    } catch (error) {
        console.error('Error during setup:', error);
        GlobalLoader.hide(mainLoader);
        GlobalLoader.showError('Failed to initialize application. Please refresh and try again.');
    }
};