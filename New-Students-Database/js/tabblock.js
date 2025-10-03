class AdvancedAdminProtection {
    constructor(config = {}) {
        // Enhanced configuration with enterprise defaults
        this.config = {
            primaryKeyHash: "e93372533f323b2f12783aa3a586135cf421486439c2cdcde47411b78f9839ec", // "Node "
            fallbackKeyHash: null, // Emergency backup key
            masterKeyHash: null, // Master override key
            sessionTimeout: 900000, // 15 minutes
            maxAttempts: 3,
            lockoutTime: 600000, // 10 minutes
            escalationLockout: 3600000, // 1 hour after multiple lockouts
            auditingEnabled: true,
            biometricEnabled: false,
            twoFactorEnabled: false,
            deviceFingerprinting: true,
            sessionPersistence: false,
            encryptionEnabled: true,
            ...config
        };

        // Core system state
        this.protectedElements = new Map();
        this.verifiedElements = new Set();
        this.securityTokens = new Map();
        this.sessionData = new Map();
        this.auditLog = [];
        this.deviceFingerprint = null;
        this.encryptionKey = null;
        this.tempFileData = null; // Add this line
        
        // Advanced tracking
        this.attemptHistory = new Map();
        this.suspiciousActivity = new Map();
        this.geoLocation = null;
        this.behaviorProfile = {
            typingPatterns: [],
            clickPatterns: [],
            navigationPatterns: []
        };

        // Real-time monitoring
        this.securityMetrics = {
            totalAttempts: 0,
            failedAttempts: 0,
            successfulAuthentications: 0,
            suspiciousEvents: 0,
            lastActivity: null,
            threatLevel: 'LOW'
        };

        this.init();
    }

    async init() {
        console.log('🔒 Initializing Advanced Admin Protection System...');
        
        // Load required dependencies
        await Promise.all([
            this.loadDependencies(),
            this.initializeEncryption(),
            this.generateDeviceFingerprint(),
            this.getGeoLocation(),
            this.setupSecurityHeaders()
        ]);

        // Initialize protection after DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupAdvancedProtection());
        } else {
            this.setupAdvancedProtection();
        }

        // Start monitoring systems
        this.startSecurityMonitoring();
        this.startSessionManagement();
        
        console.log('✅ Advanced Admin Protection System initialized');
        console.log(`🔐 Security Level: MAXIMUM | Device ID: ${this.deviceFingerprint?.slice(0, 8)}...`);
    }

    async loadDependencies() {
        const dependencies = [
            'https://cdn.jsdelivr.net/npm/sweetalert2@11',
            'https://cdn.jsdelivr.net/npm/crypto-js@4.1.1/crypto-js.min.js'
        ];

        for (const url of dependencies) {
            await this.loadScript(url);
        }
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async initializeEncryption() {
        if (this.config.encryptionEnabled && window.CryptoJS) {
            this.encryptionKey = CryptoJS.lib.WordArray.random(256/8);
            this.log('Encryption system initialized', 'SECURITY');
        }
    }

    async generateDeviceFingerprint() {
        if (!this.config.deviceFingerprinting) return;

        const fingerprint = {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            screenResolution: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            colorDepth: screen.colorDepth,
            cookieEnabled: navigator.cookieEnabled,
            doNotTrack: navigator.doNotTrack,
            hardwareConcurrency: navigator.hardwareConcurrency,
            maxTouchPoints: navigator.maxTouchPoints,
            timestamp: Date.now()
        };

        // Add WebGL fingerprint
        if (window.WebGLRenderingContext) {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl');
            if (gl) {
                fingerprint.webglVendor = gl.getParameter(gl.VENDOR);
                fingerprint.webglRenderer = gl.getParameter(gl.RENDERER);
            }
        }

        this.deviceFingerprint = await this.hash(JSON.stringify(fingerprint));
        this.log(`Device fingerprint generated: ${this.deviceFingerprint.slice(0, 16)}...`, 'SECURITY');
    }

    async getGeoLocation() {
        try {
            // Use IP-based geolocation for privacy
            const response = await fetch('https://ipapi.co/json/');
            this.geoLocation = await response.json();
            this.log(`Location detected: ${this.geoLocation.city}, ${this.geoLocation.country}`, 'INFO');
        } catch (error) {
            this.log('Geolocation unavailable', 'WARNING');
        }
    }

    setupSecurityHeaders() {
        // Add security meta tags if not present
        const securityHeaders = [
            { name: 'X-Content-Type-Options', content: 'nosniff' },
            { name: 'X-Frame-Options', content: 'DENY' },
            { name: 'X-XSS-Protection', content: '1; mode=block' },
            { name: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' }
        ];

        securityHeaders.forEach(header => {
            if (!document.querySelector(`meta[http-equiv="${header.name}"]`)) {
                const meta = document.createElement('meta');
                meta.setAttribute('http-equiv', header.name);
                meta.setAttribute('content', header.content);
                document.head.appendChild(meta);
            }
        });
    }

    setupAdvancedProtection() {
        this.discoverProtectedElements();
        this.setupEventListeners();
        this.createSecurityOverlay();
        this.startBehaviorAnalysis();
    }

    discoverProtectedElements() {
        // Enhanced element discovery with advanced selectors
        const selectors = [
            'button[data-admin-required="true"]',
            'input[data-sensitive="true"]',
            'form[data-protected="true"]',
            '[data-role="admin"]',
            '.admin-only',
            '#add-field-btn',
            'button[type="submit"]',
            '#file-input',
            '#generateHashBtn',
            'input[type="file"]',
            'button[onclick*="delete"]',
            'button[onclick*="remove"]',
            '[data-action*="delete"]',
            '[data-action*="modify"]',
            'a[href*="admin"]',
            'a[href*="delete"]'
        ];

        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                this.protectAdvancedElement(element, this.determineProtectionLevel(element));
            });
        });

        this.log(`Protected ${this.protectedElements.size} elements`, 'INFO');
    }

    determineProtectionLevel(element) {
        // Intelligent protection level determination
        const criticalKeywords = ['delete', 'remove', 'destroy', 'drop', 'truncate', 'admin'];
        const elementText = (element.textContent || element.value || element.title || '').toLowerCase();
        const elementAttrs = Array.from(element.attributes).map(attr => attr.value.toLowerCase()).join(' ');
        
        const content = `${elementText} ${elementAttrs}`;
        
        if (criticalKeywords.some(keyword => content.includes(keyword))) {
            return 'CRITICAL';
        } else if (element.type === 'file' || element.tagName === 'FORM') {
            return 'HIGH';
        } else {
            return 'MEDIUM';
        }
    }

    protectAdvancedElement(element, level = 'MEDIUM') {
        const elementId = this.generateElementId(element);
        
        const protectionData = {
            element,
            level,
            id: elementId,
            originalEvents: new Map(),
            securityToken: this.generateSecurityToken(),
            createdAt: Date.now(),
            accessCount: 0,
            lastAccess: null
        };

        this.protectedElements.set(elementId, protectionData);
        
        // Store original event handlers
        ['click', 'submit', 'change', 'focus'].forEach(eventType => {
            const originalHandler = element[`on${eventType}`];
            if (originalHandler) {
                protectionData.originalEvents.set(eventType, originalHandler);
                element[`on${eventType}`] = null;
            }
        });

       // Add comprehensive event listeners with different handling for file inputs
if (element.type === 'file') {
    // For file inputs, use capture phase and handle differently
    element.addEventListener('click', (e) => {
        if (!this.isElementVerified(elementId) && !element.dataset.tempUnprotected) {
            e.preventDefault();
            e.stopImmediatePropagation();
            this.initiateAdvancedAuthentication(elementId, protectionData);
        }
    }, true);
    
    // Handle file change separately
    element.addEventListener('change', (e) => this.handleFileUpload(e, elementId), false);
} else {
    // Standard handling for other elements
    element.addEventListener('click', (e) => this.handleSecureAction(e, elementId), true);
}

element.addEventListener('contextmenu', (e) => this.handleContextMenu(e, elementId), true);
element.addEventListener('keydown', (e) => this.handleKeyboardAccess(e, elementId), true);

if (element.tagName === 'FORM') {
    element.addEventListener('submit', (e) => this.handleFormSubmission(e, elementId), true);
}

        this.applyAdvancedStyling(element, level);
        this.log(`Protected element: ${elementId} (Level: ${level})`, 'SECURITY');
    }



    async handleSecureAction(event, elementId) {
        event.preventDefault();
        event.stopImmediatePropagation();

        const protectionData = this.protectedElements.get(elementId);
        if (!protectionData) return;

        // Check if already verified for this session
        if (this.isElementVerified(elementId)) {
            return this.executeOriginalAction(event, protectionData);
        }

        // Record interaction patterns
        this.recordBehaviorPattern('click', event);

        // Check for suspicious activity
        if (this.detectSuspiciousActivity(elementId)) {
            await this.handleSecurityThreat(elementId, 'SUSPICIOUS_ACTIVITY');
            return;
        }

        // Initiate advanced authentication flow
        await this.initiateAdvancedAuthentication(elementId, protectionData);
    }

    async initiateAdvancedAuthentication(elementId, protectionData) {
        const { level, element } = protectionData;
        
        // Escalate security based on protection level
        const authMethods = this.determineAuthMethods(level);
        
        try {
            // Multi-step authentication process
            for (const method of authMethods) {
                const success = await this.executeAuthMethod(method, elementId, level);
                if (!success) {
                    await this.handleAuthFailure(elementId, method);
                    return;
                }
            }
            
            // All authentication methods passed
            await this.grantAdvancedAccess(elementId, protectionData);
            
        } catch (error) {
            this.log(`Authentication error: ${error.message}`, 'ERROR');
            await this.handleSecurityThreat(elementId, 'AUTH_ERROR');
        }
    }

    determineAuthMethods(level) {
        const baseMethods = ['password'];
        
        switch (level) {
            case 'CRITICAL':
                return [...baseMethods, 'confirmation', 'deviceVerification', 'auditLog'];
            case 'HIGH':
                return [...baseMethods, 'confirmation'];
            case 'MEDIUM':
            default:
                return baseMethods;
        }
    }

    async executeAuthMethod(method, elementId, level) {
        const protectionData = this.protectedElements.get(elementId);
        
        switch (method) {
            case 'password':
                return await this.passwordAuthentication(elementId, level);
                
            case 'confirmation':
                return await this.confirmationDialog(elementId, level);
                
            case 'deviceVerification':
                return await this.deviceVerification(elementId);
                
            case 'auditLog':
                return await this.auditConfirmation(elementId);
                
            default:
                return false;
        }
    }

    async passwordAuthentication(elementId, level) {
        const protectionData = this.protectedElements.get(elementId);
        const attempts = this.attemptHistory.get(elementId) || 0;
        
        if (this.isLockedOut(elementId)) {
            await this.showLockoutMessage(elementId);
            return false;
        }

        const { value: credentials, isDismissed } = await Swal.fire({
            title: `🔐 ${level} Security Authentication`,
            html: this.createAdvancedAuthForm(level, attempts),
            showCancelButton: true,
            confirmButtonText: 'Authenticate',
            cancelButtonText: 'Cancel',
            customClass: {
                container: 'admin-auth-container',
                popup: 'admin-auth-popup',
                title: 'admin-auth-title'
            },
            preConfirm: () => {
                const password = document.getElementById('auth-password').value;
                const remember = document.getElementById('auth-remember')?.checked || false;
                
                if (!password) {
                    Swal.showValidationMessage('Password is required');
                    return false;
                }
                
                return { password, remember };
            },
            allowEscapeKey: false,
            allowEnterKey: true,
            focusConfirm: false,
            didOpen: () => {
                document.getElementById('auth-password').focus();
                this.startTypingAnalysis();
            }
        });

        if (isDismissed) {
            this.log(`Authentication cancelled for ${elementId}`, 'WARNING');
            return false;
        }

        const isValid = await this.verifyCredentials(credentials.password);
        
        if (isValid) {
            if (credentials.remember) {
                this.createSecureSession(elementId);
            }
            this.recordSuccessfulAuth(elementId);
            return true;
        } else {
            this.recordFailedAttempt(elementId);
            return false;
        }
    }

    createAdvancedAuthForm(level, attempts) {
        const remainingAttempts = this.config.maxAttempts - attempts;
        const threatIndicator = this.getThreatLevelIndicator();
        
        return `
            <div class="auth-form-container">
                <div class="security-status">
                    <div class="threat-level ${this.securityMetrics.threatLevel.toLowerCase()}">
                        ${threatIndicator} Threat Level: ${this.securityMetrics.threatLevel}
                    </div>
                    <div class="device-info">
                        🖥️ Device: ${this.deviceFingerprint?.slice(0, 8)}...
                        ${this.geoLocation ? `📍 ${this.geoLocation.city}` : ''}
                    </div>
                </div>
                
                <div class="auth-field">
                    <label for="auth-password">Admin Password:</label>
                    <input type="password" id="auth-password" class="auth-input" 
                           placeholder="Enter admin password" autocomplete="off">
                </div>
                
                <div class="auth-options">
                    <label class="checkbox-label">
                        <input type="checkbox" id="auth-remember">
                        Remember for this session
                    </label>
                </div>
                
                <div class="security-info">
                    <small>⚠️ Attempts remaining: ${remainingAttempts}</small>
                    ${level === 'CRITICAL' ? '<small>🚨 Critical action requires maximum security</small>' : ''}
                </div>
            </div>
            
            <style>
                .auth-form-container {
                    text-align: left;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                }
                .security-status {
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding: 12px;
                    margin-bottom: 16px;
                    border-left: 4px solid #007bff;
                }
                .threat-level {
                    font-weight: bold;
                    margin-bottom: 4px;
                }
                .threat-level.low { color: #28a745; }
                .threat-level.medium { color: #ffc107; }
                .threat-level.high { color: #dc3545; }
                .device-info {
                    font-size: 12px;
                    color: #6c757d;
                }
                .auth-field {
                    margin: 16px 0;
                }
                .auth-field label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 600;
                }
                .auth-input {
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #e9ecef;
                    border-radius: 6px;
                    font-size: 16px;
                    transition: border-color 0.3s;
                }
                .auth-input:focus {
                    border-color: #007bff;
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
                }
                .auth-options {
                    margin: 12px 0;
                }
                .checkbox-label {
                    display: flex;
                    align-items: center;
                    font-size: 14px;
                }
                .checkbox-label input {
                    margin-right: 8px;
                }
                .security-info {
                    margin-top: 12px;
                    padding-top: 12px;
                    border-top: 1px solid #e9ecef;
                }
                .security-info small {
                    display: block;
                    color: #6c757d;
                    margin: 4px 0;
                }
            </style>
        `;
    }

    async confirmationDialog(elementId, level) {
        const protectionData = this.protectedElements.get(elementId);
        const actionDescription = this.getActionDescription(protectionData.element);
        
        const result = await Swal.fire({
            title: '⚠️ Confirm Critical Action',
            html: `
                <div class="confirmation-dialog">
                    <p><strong>You are about to perform a ${level.toLowerCase()} security action:</strong></p>
                    <div class="action-details">
                        <p>🎯 <strong>Action:</strong> ${actionDescription}</p>
                        <p>🕒 <strong>Time:</strong> ${new Date().toLocaleString()}</p>
                        <p>📍 <strong>Location:</strong> ${this.geoLocation?.city || 'Unknown'}</p>
                        <p>🖥️ <strong>Device:</strong> ${this.deviceFingerprint?.slice(0, 8)}...</p>
                    </div>
                    <div class="warning-message">
                        <p>⚠️ This action cannot be undone. Are you sure?</p>
                    </div>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, proceed',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#dc3545',
            customClass: {
                confirmButton: 'confirm-dangerous-action'
            }
        });

        return result.isConfirmed;
    }

    async deviceVerification(elementId) {
        const trustedDevices = this.getTrustedDevices();
        const currentDevice = this.deviceFingerprint;
        
        if (trustedDevices.includes(currentDevice)) {
            return true;
        }

        const result = await Swal.fire({
            title: '🔒 Device Verification Required',
            html: `
                <div class="device-verification">
                    <p>This device is not recognized as trusted.</p>
                    <div class="device-info">
                        <p><strong>Device ID:</strong> ${currentDevice?.slice(0, 16)}...</p>
                        <p><strong>Location:</strong> ${this.geoLocation?.city || 'Unknown'}</p>
                        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                    </div>
                    <label class="trust-device-label">
                        <input type="checkbox" id="trust-device">
                        Trust this device for future sessions
                    </label>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Verify and Continue',
            cancelButtonText: 'Cancel',
            preConfirm: () => {
                const trustDevice = document.getElementById('trust-device').checked;
                return { trustDevice };
            }
        });

        if (result.isConfirmed) {
            if (result.value.trustDevice) {
                this.addTrustedDevice(currentDevice);
            }
            return true;
        }

        return false;
    }

    async auditConfirmation(elementId) {
        const auditEntry = {
            elementId,
            action: this.getActionDescription(this.protectedElements.get(elementId).element),
            timestamp: new Date().toISOString(),
            device: this.deviceFingerprint?.slice(0, 8),
            location: this.geoLocation?.city || 'Unknown',
            ipAddress: this.geoLocation?.ip || 'Unknown'
        };

        const result = await Swal.fire({
            title: '📝 Audit Log Entry',
            html: `
                <div class="audit-confirmation">
                    <p>This action will be logged for security audit purposes:</p>
                    <pre class="audit-preview">${JSON.stringify(auditEntry, null, 2)}</pre>
                    <p><small>By proceeding, you acknowledge that this action will be permanently recorded.</small></p>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Accept and Log',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            this.auditLog.push(auditEntry);
            this.log(`Audit entry created for ${elementId}`, 'AUDIT');
            return true;
        }

        return false;
    }

  async grantAdvancedAccess(elementId, protectionData) {
    this.verifiedElements.add(elementId);
    protectionData.accessCount++;
    protectionData.lastAccess = Date.now();
    
    this.removeAdvancedStyling(protectionData.element);
    this.securityMetrics.successfulAuthentications++;
    this.updateThreatLevel();
    
    // Create success animation
    await this.showAccessGrantedAnimation(protectionData.element);
    
    // For file inputs, don't auto-execute, just enable
    if (protectionData.element.type === 'file') {
        // Just enable the file input - user needs to click again
        protectionData.element.style.pointerEvents = 'auto';
        protectionData.element.style.cursor = 'pointer';
        
        await Swal.fire({
            icon: 'success',
            title: 'File Input Enabled',
            text: 'You can now select files. Click the input again to choose files.',
            timer: 3000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
        });
    } else {
        // Execute the original action for other elements
        setTimeout(() => {
            this.executeOriginalAction(null, protectionData);
        }, 500);
    }

    this.log(`Access granted to ${elementId}`, 'SUCCESS');
}
    async showAccessGrantedAnimation(element) {
        // Add success styling
        element.style.transition = 'all 0.3s ease';
        element.style.boxShadow = '0 0 20px rgba(40, 167, 69, 0.5)';
        element.style.border = '2px solid #28a745';
        
        await Swal.fire({
            icon: 'success',
            title: '✅ Access Granted',
            text: 'Authentication successful! Executing action...',
            timer: 5000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
        });
        
        // Reset styling
        setTimeout(() => {
            element.style.boxShadow = '';
            element.style.border = '';
        }, 3000);
    }

  executeOriginalAction(event, protectionData) {
    const { element, originalEvents } = protectionData;
    
    // Execute original event handlers first
    originalEvents.forEach((handler, eventType) => {
        if (handler && typeof handler === 'function') {
            handler.call(element, event);
        }
    });
    
    // Handle file inputs specially
    if (element.type === 'file' && this.tempFileData && this.tempFileData.elementId === this.generateElementId(element)) {
        // Restore the file selection
        const { files } = this.tempFileData;
        
        // Create a new FileList-like object
        const dt = new DataTransfer();
        files.forEach(file => dt.items.add(file));
        element.files = dt.files;
        
        // Trigger change event
        const changeEvent = new Event('change', { bubbles: true });
        element.dispatchEvent(changeEvent);
        
        // Clear temp data
        delete this.tempFileData;
        return;
    }
    
    // For other elements, trigger click if it was a click event
    if (element.tagName === 'BUTTON' || element.tagName === 'A') {
        const newEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
        });
        
        // Temporarily remove our protection to allow the original action
        element.dataset.tempUnprotected = 'true';
        element.dispatchEvent(newEvent);
        delete element.dataset.tempUnprotected;
    }
}
    // Advanced behavior analysis
    startBehaviorAnalysis() {
        document.addEventListener('mousemove', (e) => {
            this.recordBehaviorPattern('mouse', e);
        });

        document.addEventListener('keydown', (e) => {
            this.recordBehaviorPattern('keyboard', e);
        });

        setInterval(() => {
            this.analyzeBehaviorPatterns();
        }, 30000); // Analyze every 30 seconds
    }

    recordBehaviorPattern(type, event) {
        const pattern = {
            type,
            timestamp: Date.now(),
            x: event.clientX || 0,
            y: event.clientY || 0,
            key: event.key || null,
            target: event.target?.tagName || null
        };

        this.behaviorProfile[`${type}Patterns`].push(pattern);
        
        // Keep only last 100 patterns per type
        if (this.behaviorProfile[`${type}Patterns`].length > 100) {
            this.behaviorProfile[`${type}Patterns`].shift();
        }
    }

    analyzeBehaviorPatterns() {
        // Simple anomaly detection
        const recent = Date.now() - 60000; // Last minute
        const recentClicks = this.behaviorProfile.clickPatterns.filter(p => p.timestamp > recent);
        
        if (recentClicks.length > 50) { // Abnormally high click rate
            this.securityMetrics.suspiciousEvents++;
            this.updateThreatLevel();
            this.log('Suspicious activity detected: High click rate', 'WARNING');
        }
    }

    // Advanced security monitoring
    startSecurityMonitoring() {
        // Monitor console access
        this.monitorConsoleAccess();
        
        // Monitor developer tools
        this.monitorDevTools();
        
        // Monitor network requests
        this.monitorNetworkRequests();
        
        // Check for security violations every minute
        setInterval(() => {
            this.performSecurityCheck();
        }, 60000);
    }

    monitorConsoleAccess() {
        const originalLog = console.log;
        console.log = (...args) => {
            if (args.some(arg => typeof arg === 'string' && arg.includes('admin'))) {
                this.log('Suspicious console activity detected', 'WARNING');
                this.securityMetrics.suspiciousEvents++;
            }
            originalLog.apply(console, args);
        };
    }

    monitorDevTools() {
        let devtools = {open: false, orientation: null};
        const threshold = 160;

        setInterval(() => {
            const widthThreshold = window.outerWidth - window.innerWidth > threshold;
            const heightThreshold = window.outerHeight - window.innerHeight > threshold;
            const orientation = widthThreshold ? 'vertical' : 'horizontal';

            if (!(heightThreshold && widthThreshold) &&
                ((window.Firebug && window.Firebug.chrome && window.Firebug.chrome.isInitialized) || 
                 widthThreshold || heightThreshold)) {
                
                if (!devtools.open || devtools.orientation !== orientation) {
                    devtools.open = true;
                    devtools.orientation = orientation;
                    this.handleDevToolsDetection();
                }
            } else {
                devtools.open = false;
                devtools.orientation = null;
            }
        }, 500);
    }

    handleDevToolsDetection() {
        this.log('Developer tools access detected', 'WARNING');
        this.securityMetrics.suspiciousEvents++;
        this.updateThreatLevel();
        
        // Optionally blur or hide sensitive content
        document.body.style.filter = 'blur(5px)';
        setTimeout(() => {
            document.body.style.filter = '';
        }, 2000);
    }

    // Session management
    startSessionManagement() {
        setInterval(() => {
            this.checkSessionTimeout();
            this.cleanupExpiredTokens();
        }, 60000); // Check every minute
    }

    checkSessionTimeout() {
        const now = Date.now();
        const expiredElements = [];
        
        this.verifiedElements.forEach(elementId => {
            const protectionData = this.protectedElements.get(elementId);
            if (protectionData && protectionData.lastAccess) {
                if (now - protectionData.lastAccess > this.config.sessionTimeout) {
                    expiredElements.push(elementId);
                }
            }
        });
        
        expiredElements.forEach(elementId => {
            this.revokeAccess(elementId);
        });
        
        if (expiredElements.length > 0) {
            this.log(`Revoked access for ${expiredElements.length} expired sessions`, 'INFO');
        }
    }

    revokeAccess(elementId) {
        this.verifiedElements.delete(elementId);
        const protectionData = this.protectedElements.get(elementId);
        if (protectionData) {
            this.applyAdvancedStyling(protectionData.element, protectionData.level);
        }
    }

    // Utility methods
    generateElementId(element) {
        return element.id || 
               element.name || 
               `${element.tagName}_${Array.from(element.parentNode.children).indexOf(element)}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateSecurityToken() {
        return crypto.randomUUID?.() || 
               Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    async hash(input) {
        if (crypto.subtle) {
            const encoder = new TextEncoder();
            const data = encoder.encode(input);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } else {
            // Enhanced fallback hash with better distribution
            let hash = 5381;
            for (let i = 0; i < input.length; i++) {
                hash = ((hash << 5) + hash) + input.charCodeAt(i);
            }
            return Math.abs(hash).toString(16).padStart(8, '0');
        }
    }

    encrypt(data) {
        if (this.config.encryptionEnabled && window.CryptoJS && this.encryptionKey) {
            return CryptoJS.AES.encrypt(JSON.stringify(data), this.encryptionKey.toString()).toString();
        }
        return data;
    }

    decrypt(encryptedData) {
        if (this.config.encryptionEnabled && window.CryptoJS && this.encryptionKey) {
            try {
                const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey.toString());
                return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
            } catch (error) {
                this.log('Decryption failed', 'ERROR');
                return null;
            }
        }
        return encryptedData;
    }

    async verifyCredentials(password) {
        const inputHash = await this.hash(this.sanitizeInput(password));
        
        // Check against primary, fallback, and master keys
        const validKeys = [
            this.config.primaryKeyHash,
            this.config.fallbackKeyHash,
            this.config.masterKeyHash
        ].filter(Boolean);

        return validKeys.includes(inputHash);
    }

    sanitizeInput(input) {
        return input.replace(/[<>{}]/g, '').trim().substring(0, 100);
    }

    isElementVerified(elementId) {
        return this.verifiedElements.has(elementId);
    }

    isLockedOut(elementId) {
        const attempts = this.attemptHistory.get(elementId) || 0;
        return attempts >= this.config.maxAttempts;
    }

    recordFailedAttempt(elementId) {
        const attempts = (this.attemptHistory.get(elementId) || 0) + 1;
        this.attemptHistory.set(elementId, attempts);
        this.securityMetrics.failedAttempts++;
        
        if (attempts >= this.config.maxAttempts) {
            setTimeout(() => {
                this.attemptHistory.delete(elementId);
            }, this.config.lockoutTime);
            
            this.log(`Element ${elementId} locked out after ${attempts} failed attempts`, 'WARNING');
        }
        
        this.updateThreatLevel();
    }

    recordSuccessfulAuth(elementId) {
        this.attemptHistory.delete(elementId);
        this.securityMetrics.successfulAuthentications++;
        this.securityMetrics.lastActivity = Date.now();
        this.updateThreatLevel();
    }

    detectSuspiciousActivity(elementId) {
        const now = Date.now();
        const recentAttempts = this.auditLog.filter(entry => 
            entry.elementId === elementId && 
            now - new Date(entry.timestamp).getTime() < 300000 // 5 minutes
        ).length;

        if (recentAttempts > 5) {
            this.suspiciousActivity.set(elementId, now);
            return true;
        }

        // Check for rapid-fire attempts across different elements
        const recentFailures = this.securityMetrics.failedAttempts;
        if (recentFailures > 10) {
            return true;
        }

        return false;
    }

    async handleSecurityThreat(elementId, threatType) {
        this.securityMetrics.suspiciousEvents++;
        this.securityMetrics.threatLevel = 'HIGH';
        
        this.log(`Security threat detected: ${threatType} for ${elementId}`, 'CRITICAL');
        
        // Implement progressive response
        switch (threatType) {
            case 'SUSPICIOUS_ACTIVITY':
                await this.showSecurityWarning('Suspicious activity detected');
                this.increaseSecurityMeasures();
                break;
            case 'BRUTE_FORCE':
                await this.showSecurityWarning('Brute force attack detected');
                this.lockAllElements();
                break;
            case 'AUTH_ERROR':
                await this.showSecurityWarning('Authentication system error');
                break;
        }
    }

    async showSecurityWarning(message) {
        await Swal.fire({
            icon: 'warning',
            title: '🚨 Security Alert',
            text: message,
            confirmButtonText: 'Understood',
            allowEscapeKey: false,
            allowOutsideClick: false,
            customClass: {
                popup: 'security-warning-popup'
            }
        });
    }

    increaseSecurityMeasures() {
        // Increase lockout times
        this.config.lockoutTime *= 2;
        
        // Require additional verification
        this.config.twoFactorEnabled = true;
        
        // Clear all current verifications
        this.verifiedElements.clear();
        
        this.log('Security measures increased due to threat detection', 'WARNING');
    }

    lockAllElements() {
        this.verifiedElements.clear();
        this.protectedElements.forEach((data, elementId) => {
            this.applyAdvancedStyling(data.element, 'CRITICAL');
        });
        
        setTimeout(() => {
            this.config.lockoutTime = Math.min(this.config.lockoutTime / 2, 600000); // Reset but cap at 10 minutes
        }, this.config.escalationLockout);
        
        this.log('All elements locked due to security threat', 'CRITICAL');
    }

    updateThreatLevel() {
        const { failedAttempts, suspiciousEvents, successfulAuthentications } = this.securityMetrics;
        const totalEvents = failedAttempts + suspiciousEvents + successfulAuthentications;
        
        if (totalEvents === 0) {
            this.securityMetrics.threatLevel = 'LOW';
        } else {
            const threatRatio = (failedAttempts + suspiciousEvents * 2) / totalEvents;
            
            if (threatRatio > 0.7) {
                this.securityMetrics.threatLevel = 'HIGH';
            } else if (threatRatio > 0.3) {
                this.securityMetrics.threatLevel = 'MEDIUM';
            } else {
                this.securityMetrics.threatLevel = 'LOW';
            }
        }
    }

    getThreatLevelIndicator() {
        const indicators = {
            'LOW': '🟢',
            'MEDIUM': '🟡',
            'HIGH': '🔴'
        };
        return indicators[this.securityMetrics.threatLevel] || '⚪';
    }

    applyAdvancedStyling(element, level) {
        if (element.dataset.protectionApplied) return;
        
        // Store original styles
        element.dataset.originalStyle = element.style.cssText;
        element.dataset.protectionApplied = 'true';
        
        // Apply protection styling based on level
        const styles = this.getProtectionStyles(level);
        Object.assign(element.style, styles);
        
        // Add visual indicators
        this.addSecurityBadge(element, level);
        this.addProtectionAnimation(element);
    }

    getProtectionStyles(level) {
        const baseStyles = {
            position: 'relative',
            transition: 'all 0.3s ease',
            cursor: 'not-allowed',
            userSelect: 'none'
        };
        
        switch (level) {
            case 'CRITICAL':
                return {
                    ...baseStyles,
                    border: '3px solid #dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    boxShadow: '0 0 15px rgba(220, 53, 69, 0.3)',
                    opacity: '0.6'
                };
            case 'HIGH':
                return {
                    ...baseStyles,
                    border: '2px solid #ffc107',
                    backgroundColor: 'rgba(255, 193, 7, 0.1)',
                    boxShadow: '0 0 10px rgba(255, 193, 7, 0.3)',
                    opacity: '0.7'
                };
            case 'MEDIUM':
            default:
                return {
                    ...baseStyles,
                    border: '2px dashed #6c757d',
                    backgroundColor: 'rgba(108, 117, 125, 0.1)',
                    opacity: '0.8'
                };
        }
    }

    addSecurityBadge(element, level) {
        const badge = document.createElement('div');
        badge.className = 'security-badge';
        badge.innerHTML = this.getSecurityBadgeContent(level);
        badge.style.cssText = `
            position: absolute;
            top: -8px;
            right: -8px;
            background: ${this.getBadgeColor(level)};
            color: white;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            z-index: 1000;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;
        
        element.style.position = 'relative';
        element.appendChild(badge);
    }

    getSecurityBadgeContent(level) {
        const badges = {
            'CRITICAL': '🔒',
            'HIGH': '⚠️',
            'MEDIUM': '🛡️'
        };
        return badges[level] || '🔐';
    }

    getBadgeColor(level) {
        const colors = {
            'CRITICAL': '#dc3545',
            'HIGH': '#ffc107',
            'MEDIUM': '#6c757d'
        };
        return colors[level] || '#6c757d';
    }

    addProtectionAnimation(element) {
        let pulseInterval = setInterval(() => {
            if (this.isElementVerified(this.generateElementId(element))) {
                clearInterval(pulseInterval);
                return;
            }
            
            element.style.transform = 'scale(1.02)';
            setTimeout(() => {
                element.style.transform = 'scale(1)';
            }, 200);
        }, 2000);
    }

    removeAdvancedStyling(element) {
        if (!element.dataset.protectionApplied) return;
        
        // Restore original styles
        element.style.cssText = element.dataset.originalStyle || '';
        element.removeAttribute('data-protection-applied');
        element.removeAttribute('data-original-style');
        
        // Remove security badge
        const badge = element.querySelector('.security-badge');
        if (badge) {
            badge.remove();
        }
        
        // Add success styling temporarily
        element.style.transition = 'all 0.5s ease';
        element.style.border = '2px solid #28a745';
        element.style.boxShadow = '0 0 10px rgba(40, 167, 69, 0.3)';
        
        setTimeout(() => {
            element.style.border = '';
            element.style.boxShadow = '';
        }, 2000);
    }

    getActionDescription(element) {
        const text = element.textContent || element.value || element.title || '';
        const tag = element.tagName.toLowerCase();
        const type = element.type || '';
        
        if (text.trim()) {
            return `${tag} action: "${text.trim().substring(0, 50)}"`;
        } else if (type) {
            return `${tag} (${type}) interaction`;
        } else {
            return `${tag} element interaction`;
        }
    }

    // Context menu protection
    async handleContextMenu(event, elementId) {
        event.preventDefault();
        
        if (this.isElementVerified(elementId)) return;
        
        await Swal.fire({
            title: '🚫 Context Menu Disabled',
            text: 'Right-click is disabled on protected elements. Please authenticate first.',
            icon: 'warning',
            timer: 2000
        });
    }

    // Keyboard access protection
    async handleKeyboardAccess(event, elementId) {
        // Block certain key combinations
        const blockedKeys = ['F12', 'Delete', 'Escape'];
        const blockedCombos = [
            { ctrl: true, shift: true, key: 'I' }, // Dev tools
            { ctrl: true, shift: true, key: 'J' }, // Console
            { ctrl: true, key: 'u' } // View source
        ];
        
        if (blockedKeys.includes(event.key) || 
            blockedCombos.some(combo => 
                (!combo.ctrl || event.ctrlKey) &&
                (!combo.shift || event.shiftKey) &&
                event.key.toLowerCase() === combo.key.toLowerCase()
            )) {
            
            event.preventDefault();
            event.stopPropagation();
            
            if (!this.isElementVerified(elementId)) {
                this.log(`Blocked keyboard access attempt: ${event.key}`, 'WARNING');
                this.securityMetrics.suspiciousEvents++;
            }
        }
    }

    // File upload protection
 async handleFileUpload(event, elementId) {
    // Don't prevent default if already verified
    if (this.isElementVerified(elementId)) {
        // Allow the file selection to proceed normally
        return;
    }
    
    // Only prevent default for unverified elements
    event.preventDefault();
    event.stopPropagation();
    
    const files = Array.from(event.target.files);
    
    // If no files selected, don't proceed
    if (files.length === 0) {
        return;
    }
    
    // Analyze uploaded files for security threats
    const threats = await this.analyzeFiles(files);
    if (threats.length > 0) {
        await this.handleSecurityThreat(elementId, 'MALICIOUS_FILE');
        event.target.value = '';
        return;
    }
    
    // Store the files temporarily
    this.tempFileData = { elementId, files, event };
    
    // Proceed with authentication
    await this.initiateAdvancedAuthentication(elementId, this.protectedElements.get(elementId));
}
    async analyzeFiles(files) {
        const threats = [];
        const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.jar'];
        
        files.forEach(file => {
            const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
            
            if (dangerousExtensions.includes(extension)) {
                threats.push(`Dangerous file type: ${file.name}`);
            }
            
            if (file.size > 100 * 1024 * 1024) { // 100MB
                threats.push(`File too large: ${file.name}`);
            }
        });
        
        return threats;
    }

    // Form submission protection
    async handleFormSubmission(event, elementId) {
        if (this.isElementVerified(elementId)) return;
        
        event.preventDefault();
        
        // Analyze form data for suspicious content
        const formData = new FormData(event.target);
        const suspiciousData = this.analyzeFormData(formData);
        
        if (suspiciousData.length > 0) {
            await this.handleSecurityThreat(elementId, 'SUSPICIOUS_FORM_DATA');
            return;
        }
        
        await this.initiateAdvancedAuthentication(elementId, this.protectedElements.get(elementId));
    }

    analyzeFormData(formData) {
        const suspicious = [];
        const dangerousPatterns = [
            /<script/i, // Script injection
            /javascript:/i, // JavaScript protocol
            /on\w+\s*=/i, // Event handlers
            /eval\s*\(/i, // Eval function
            /document\./i, // DOM manipulation
            /\.\./i // Directory traversal
        ];
        
        for (let [key, value] of formData.entries()) {
            if (typeof value === 'string') {
                dangerousPatterns.forEach(pattern => {
                    if (pattern.test(value)) {
                        suspicious.push(`Suspicious data in field ${key}: ${pattern}`);
                    }
                });
            }
        }
        
        return suspicious;
    }

    // Typing analysis for behavioral biometrics
    startTypingAnalysis() {
        const keyTimes = [];
        
        document.addEventListener('keydown', (e) => {
            keyTimes.push({ key: e.key, time: Date.now(), type: 'down' });
        });
        
        document.addEventListener('keyup', (e) => {
            keyTimes.push({ key: e.key, time: Date.now(), type: 'up' });
        });
        
        // Analyze typing patterns after 10 keystrokes
        setTimeout(() => {
            this.analyzeTypingPatterns(keyTimes);
        }, 10000);
    }

    analyzeTypingPatterns(keyTimes) {
        // Simple dwell time analysis
        const dwellTimes = [];
        for (let i = 0; i < keyTimes.length - 1; i++) {
            if (keyTimes[i].type === 'down' && keyTimes[i + 1].type === 'up' && 
                keyTimes[i].key === keyTimes[i + 1].key) {
                dwellTimes.push(keyTimes[i + 1].time - keyTimes[i].time);
            }
        }
        
        const avgDwellTime = dwellTimes.reduce((a, b) => a + b, 0) / dwellTimes.length;
        
        // Store behavioral signature
        this.behaviorProfile.typingSignature = {
            averageDwellTime: avgDwellTime,
            variance: this.calculateVariance(dwellTimes),
            timestamp: Date.now()
        };
        
        this.log(`Typing pattern analyzed: avg dwell ${avgDwellTime.toFixed(2)}ms`, 'INFO');
    }

    calculateVariance(values) {
        const mean = values.reduce((a, b) => a + b) / values.length;
        return values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length;
    }

    // Advanced session management
    createSecureSession(elementId) {
        const sessionToken = this.generateSecurityToken();
        const sessionData = {
            elementId,
            token: sessionToken,
            createdAt: Date.now(),
            lastActivity: Date.now(),
            deviceFingerprint: this.deviceFingerprint,
            ipAddress: this.geoLocation?.ip
        };
        
        if (this.config.sessionPersistence) {
            try {
                const encryptedSession = this.encrypt(sessionData);
                // Store in memory instead of localStorage for Claude environment
                this.sessionData.set(sessionToken, encryptedSession);
            } catch (error) {
                this.log('Failed to create secure session', 'ERROR');
            }
        }
        
        this.securityTokens.set(elementId, sessionToken);
    }

    cleanupExpiredTokens() {
        const now = Date.now();
        const expiredTokens = [];
        
        this.sessionData.forEach((encryptedData, token) => {
            try {
                const sessionData = this.decrypt(encryptedData);
                if (sessionData && now - sessionData.lastActivity > this.config.sessionTimeout) {
                    expiredTokens.push(token);
                }
            } catch (error) {
                expiredTokens.push(token); // Remove corrupted sessions
            }
        });
        
        expiredTokens.forEach(token => {
            this.sessionData.delete(token);
        });
    }

    // Trusted devices management
    getTrustedDevices() {
        // In a real implementation, this would be stored securely server-side
        return JSON.parse(this.getSecureStorage('trustedDevices') || '[]');
    }

    addTrustedDevice(deviceFingerprint) {
        const trustedDevices = this.getTrustedDevices();
        if (!trustedDevices.includes(deviceFingerprint)) {
            trustedDevices.push(deviceFingerprint);
            this.setSecureStorage('trustedDevices', JSON.stringify(trustedDevices));
            this.log(`Device ${deviceFingerprint.slice(0, 8)}... added to trusted devices`, 'INFO');
        }
    }

    getSecureStorage(key) {
        // Simulate secure storage using memory for Claude environment
        return this.sessionData.get(`storage_${key}`) || null;
    }

    setSecureStorage(key, value) {
        this.sessionData.set(`storage_${key}`, value);
    }

    // Network request monitoring
    monitorNetworkRequests() {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const [url, options] = args;
            
            // Log potentially suspicious requests
            if (typeof url === 'string' && 
                (url.includes('admin') || url.includes('delete') || url.includes('drop'))) {
                this.log(`Monitored network request: ${url}`, 'INFO');
            }
            
            return originalFetch.apply(window, args);
        };
    }

    // Security audit and reporting
    performSecurityCheck() {
        const issues = [];
        
        // Check for anomalies
        if (this.securityMetrics.failedAttempts > this.securityMetrics.successfulAuthentications * 2) {
            issues.push('High failure rate detected');
        }
        
        if (this.securityMetrics.suspiciousEvents > 10) {
            issues.push('Multiple suspicious events detected');
        }
        
        // Check session health
        const activeSessions = Array.from(this.verifiedElements).length;
        if (activeSessions > 10) {
            issues.push('Unusually high number of active sessions');
        }
        
        if (issues.length > 0) {
            this.log(`Security check found ${issues.length} issues: ${issues.join(', ')}`, 'WARNING');
            this.generateSecurityReport();
        }
    }

    generateSecurityReport() {
        const report = {
            timestamp: new Date().toISOString(),
            metrics: this.securityMetrics,
            protectedElements: this.protectedElements.size,
            activeVerifications: this.verifiedElements.size,
            auditLogSize: this.auditLog.length,
            deviceFingerprint: this.deviceFingerprint?.slice(0, 16) + '...',
            location: this.geoLocation?.city || 'Unknown',
            threatLevel: this.securityMetrics.threatLevel,
            recentSuspiciousActivity: this.auditLog.slice(-5)
        };
        
        console.group('🔒 Security Report');
        console.table(report.metrics);
        console.log('Report Details:', report);
        console.groupEnd();
        
        return report;
    }

    // Logging system
    log(message, level = 'INFO') {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            device: this.deviceFingerprint?.slice(0, 8),
            location: this.geoLocation?.city
        };
        
        if (this.config.auditingEnabled) {
            this.auditLog.push(logEntry);
            
            // Keep audit log size manageable
            if (this.auditLog.length > 1000) {
                this.auditLog = this.auditLog.slice(-500);
            }
        }
        
        // Console output with appropriate styling
        const styles = {
            'INFO': 'color: #17a2b8',
            'WARNING': 'color: #ffc107; font-weight: bold',
            'ERROR': 'color: #dc3545; font-weight: bold',
            'SUCCESS': 'color: #28a745; font-weight: bold',
            'CRITICAL': 'color: #dc3545; font-weight: bold; background: #fff3cd',
            'SECURITY': 'color: #6f42c1; font-weight: bold',
            'AUDIT': 'color: #6c757d'
        };
        
        console.log(`%c[${level}] ${message}`, styles[level] || '');
    }

    // Public API methods for admin use
    async generateAdvancedHashKey(plainTextKey) {
        const hash = await this.hash(plainTextKey);
        console.log(`Generated hash for "${plainTextKey}": ${hash}`);
        
        await Swal.fire({
            title: '🔐 Advanced Hash Generator',
            html: `
                <div class="hash-generator">
                    <div class="input-section">
                        <strong>Input:</strong> ${plainTextKey}
                    </div>
                    <div class="hash-section">
                        <strong>SHA-256 Hash:</strong>
                        <textarea readonly onclick="this.select()" style="width: 100%; height: 60px; font-family: monospace; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; padding: 8px;">${hash}</textarea>
                    </div>
                    <div class="security-info">
                        <small>⚡ Generated using ${crypto.subtle ? 'WebCrypto API' : 'fallback hash function'}</small><br>
                        <small>🔒 Click hash to select and copy</small>
                    </div>
                </div>
            `,
            width: '600px',
            confirmButtonText: 'Close',
            customClass: {
                popup: 'hash-generator-popup'
            }
        });
        
        return hash;
    }

    updatePrimaryKey(newHash) {
        this.config.primaryKeyHash = newHash;
        this.log('Primary admin key updated', 'SECURITY');
        
        Swal.fire({
            icon: 'success',
            title: '🔑 Key Updated',
            text: 'Primary admin key has been updated successfully!',
            timer: 2000
        });
    }

    setFallbackKey(keyHash) {
        this.config.fallbackKeyHash = keyHash;
        this.log('Fallback key configured', 'SECURITY');
    }

    setMasterKey(keyHash) {
        this.config.masterKeyHash = keyHash;
        this.log('Master key configured', 'SECURITY');
    }

    // Emergency methods
    emergencyDisable() {
        console.warn('🚨 EMERGENCY DISABLE ACTIVATED');
        this.verifiedElements.clear();
        this.protectedElements.forEach((data) => {
            this.removeAdvancedStyling(data.element);
        });
        this.protectedElements.clear();
        this.log('Emergency disable activated - ALL PROTECTIONS REMOVED', 'CRITICAL');
    }

    emergencyLockdown() {
        console.warn('🔒 EMERGENCY LOCKDOWN ACTIVATED');
        this.verifiedElements.clear();
        this.config.maxAttempts = 0;
        this.protectedElements.forEach((data) => {
            this.applyAdvancedStyling(data.element, 'CRITICAL');
        });
        this.log('Emergency lockdown activated - SYSTEM LOCKED', 'CRITICAL');
    }

    showSecurityDashboard() {
        const report = this.generateSecurityReport();
        
        Swal.fire({
            title: '🛡️ Security Dashboard',
            html: `
                <div class="security-dashboard">
                    <div class="dashboard-grid">
                        <div class="metric-card">
                            <div class="metric-value">${this.securityMetrics.totalAttempts}</div>
                            <div class="metric-label">Total Attempts</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-value">${this.securityMetrics.successfulAuthentications}</div>
                            <div class="metric-label">Successful Auths</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-value">${this.securityMetrics.failedAttempts}</div>
                            <div class="metric-label">Failed Attempts</div>
                        </div>
                        <div class="metric-card threat-${this.securityMetrics.threatLevel.toLowerCase()}">
                            <div class="metric-value">${this.getThreatLevelIndicator()} ${this.securityMetrics.threatLevel}</div>
                            <div class="metric-label">Threat Level</div>
                        </div>
                    </div>
                    
                    <div class="dashboard-details">
                        <div><strong>Protected Elements:</strong> ${this.protectedElements.size}</div>
                        <div><strong>Active Sessions:</strong> ${this.verifiedElements.size}</div>
                        <div><strong>Device:</strong> ${this.deviceFingerprint?.slice(0, 16)}...</div>
                        <div><strong>Location:</strong> ${this.geoLocation?.city || 'Unknown'}</div>
                        <div><strong>Last Activity:</strong> ${this.securityMetrics.lastActivity ? new Date(this.securityMetrics.lastActivity).toLocaleString() : 'Never'}</div>
                    </div>
                </div>
                
                <style>
                    .security-dashboard { text-align: left; }
                    .dashboard-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px; }
                    .metric-card { background: #f8f9fa; border-radius: 8px; padding: 16px; text-align: center; border: 1px solid #dee2e6; }
                    .metric-value { font-size: 24px; font-weight: bold; margin-bottom: 4px; }
                    .metric-label { font-size: 12px; color: #6c757d; text-transform: uppercase; }
                    .threat-low .metric-value { color: #28a745; }
                    .threat-medium .metric-value { color: #ffc107; }
                    .threat-high .metric-value { color: #dc3545; }
                    .dashboard-details > div { margin: 8px 0; font-size: 14px; }
                </style>
            `,
            width: '600px',
            confirmButtonText: 'Close Dashboard'
        });
    }
}

// Initialize the advanced admin protection system
const advancedAdminProtection = new AdvancedAdminProtection({
    // Configuration options
    sessionTimeout: 900000, // 15 minutes
    maxAttempts: 3,
    auditingEnabled: true,
    deviceFingerprinting: true
    // Add other configurations as needed
});



// Define the AdminTools class
    class AdminTools {
      // SHA-256 helper
      async hash(message) {
        const encoder = new TextEncoder();
        const data = encoder.encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }

      // Advanced Hash Key Generator
      async generateAdvancedHashKey(plainTextKey) {
        const hash = await this.hash(plainTextKey);

        await Swal.fire({
          title: '🔐 Advanced Hash Generator',
          html: `
            <div class="hash-generator">
              <div class="input-section">
                <strong>Input:</strong> ${plainTextKey}
              </div>
              <div class="hash-section">
                <strong>SHA-256 Hash:</strong>
                <textarea readonly onclick="this.select()" 
                  style="width:100%;height:60px;font-family:monospace;
                         background:#f8f9fa;border:1px solid #dee2e6;
                         border-radius:4px;padding:8px;">${hash}</textarea>
              </div>
              <div class="security-info">
                <small>⚡ Generated using ${crypto.subtle ? 'WebCrypto API' : 'fallback hash function'}</small><br>
                <small>🔒 Click hash to select and copy</small>
              </div>
            </div>
          `,
          width: '600px',
          confirmButtonText: 'Close',
        });

        return hash;
      }
    }

    // Create instance
    const admin = new AdminTools();

    // Wait for DOM and add click listener
    document.addEventListener("DOMContentLoaded", () => {
      document.getElementById("generateHashBtn").addEventListener("click", async () => {
        const input = prompt("Enter text to hash:");
        if (input) {
          const hash = await admin.generateAdvancedHashKey(input);
          console.log("Returned hash:", hash);
        }
      });
    });