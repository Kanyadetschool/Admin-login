class AdminProtection {
    constructor() {
        // Hash for "Node " - using SHA-256 equivalent simulation
        this.adminKeyHash = "e93372533f323b2f12783aa3a586135cf421486439c2cdcde47411b78f9839ec"; // Hash of "Node "
        this.protectedElements = [
            '#add-field-btn',
            'button[type="submit"]',
            '#file-input'
        ];
        this.maxAttempts = 3;
        this.lockoutTime = 300000; // 5 minutes in ms
        this.attempts = new Map();
        this.verifiedElements = new Set(); // Track verified elements
        this.csrfToken = this.generateCsrfToken();
        this.init();
    }

    init() {
        // Load SweetAlert2 dynamically
        this.loadSweetAlert2().then(() => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setupProtection());
            } else {
                this.setupProtection();
            }
        });
    }

    async loadSweetAlert2() {
        if (!window.Swal) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/sweetalert2@11';
            document.head.appendChild(script);
            return new Promise(resolve => {
                script.onload = resolve;
            });
        }
    }

    generateCsrfToken() {
        return crypto.randomUUID ? crypto.randomUUID() : 
               Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    // Simple SHA-256 equivalent hash function (for demo purposes)
    // In production, use crypto.subtle.digest or a proper crypto library
    async simpleHash(str) {
        if (crypto.subtle) {
            const encoder = new TextEncoder();
            const data = encoder.encode(str);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } else {
            // Fallback simple hash for older browsers
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32-bit integer
            }
            return Math.abs(hash).toString(16).padStart(8, '0');
        }
    }

    // Method to generate new hash keys - for admin use
    async generateNewHashKey(plainTextKey) {
        const hash = await this.simpleHash(plainTextKey);
        console.log(`Hash for "${plainTextKey}": ${hash}`);
        
        // Show admin the hash in a popup for easy copying
        await Swal.fire({
            title: 'Generated Hash Key',
            html: `
                <p><strong>Plain text:</strong> ${plainTextKey}</p>
                <p><strong>Hash:</strong></p>
                <input type="text" value="${hash}" readonly style="width: 100%; font-family: monospace; background: #f5f5f5; padding: 8px; border: 1px solid #ccc; border-radius: 4px;" onclick="this.select()">
                <small style="display: block; margin-top: 10px; color: #666;">Click the hash to select and copy it</small>
            `,
            width: '500px',
            confirmButtonText: 'Close'
        });
        
        return hash;
    }

    // Method to update the admin key hash - for admin use
    updateAdminKeyHash(newHash) {
        this.adminKeyHash = newHash;
        console.log('Admin key hash updated successfully');
        
        Swal.fire({
            icon: 'success',
            title: 'Hash Updated',
            text: 'Admin key hash has been updated successfully!',
            timer: 2000
        });
    }

    // Convenience method to update key from plain text
    async updateAdminKeyFromPlainText(plainTextKey) {
        const newHash = await this.simpleHash(plainTextKey);
        this.updateAdminKeyHash(newHash);
        return newHash;
    }

    setupProtection() {
        this.protectedElements.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                this.protectElement(element);
            });
        });
    }

    protectElement(element) {
        element.dataset.originalDisabled = element.disabled || 'false';
        
        if (element.type === 'file') {
            element.addEventListener('click', (e) => this.handleProtectedAction(e, element));
            element.addEventListener('change', (e) => this.handleFileChange(e, element));
        } else {
            element.addEventListener('click', (e) => this.handleProtectedAction(e, element));
        }

        this.addProtectionIndicator(element);
    }

    getElementKey(element) {
        // Create a unique key for the element
        return element.id || element.name || element.className || element.tagName + Math.random();
    }

    isElementVerified(element) {
        const elementKey = this.getElementKey(element);
        return this.verifiedElements.has(elementKey) || element.dataset.adminVerified === 'true';
    }

    markElementAsVerified(element) {
        const elementKey = this.getElementKey(element);
        this.verifiedElements.add(elementKey);
        element.dataset.adminVerified = 'true';
    }

    async handleProtectedAction(event, element) {
        // Check if element is already verified
        if (this.isElementVerified(element)) {
            // Allow the action to proceed normally
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        const elementId = element.id || element.type;
        if (this.isLockedOut(elementId)) {
            await Swal.fire({
                icon: 'error',
                title: 'Locked Out',
                text: 'Too many failed attempts. Please try again later.',
                timer: 3000
            });
            return;
        }

        const { value: userKey } = await Swal.fire({
            title: 'Admin Access Required',
            input: 'password',
            inputLabel: 'Enter admin key',
            inputPlaceholder: 'Admin key',
            showCancelButton: true,
            inputValidator: (value) => {
                if (!value) return 'Key is required!';
                // Basic input sanitization
                if (value.length > 50 || /[<>{}]/.test(value)) {
                    return 'Invalid key format!';
                }
            }
        });

        if (userKey) {
            const isValid = await this.verifyKey(userKey);
            if (isValid) {
                this.grantAccess(element, event);
                // Re-trigger the original action after a short delay
                setTimeout(() => {
                    element.click();
                }, 100);
            } else {
                this.recordFailedAttempt(elementId);
                await Swal.fire({
                    icon: 'error',
                    title: 'Access Denied',
                    text: 'Invalid admin key.',
                    timer: 3000
                });
            }
        }
    }

    async handleFileChange(event, element) {
        if (element.files.length > 0 && !this.isElementVerified(element)) {
            event.preventDefault();

            const { value: userKey } = await Swal.fire({
                title: 'Admin Access Required',
                input: 'password',
                inputLabel: 'Enter admin key',
                inputPlaceholder: 'Admin key',
                showCancelButton: true,
                inputValidator: (value) => {
                    if (!value) return 'Key is required!';
                    if (value.length > 50 || /[<>{}]/.test(value)) {
                        return 'Invalid key format!';
                    }
                }
            });

            if (userKey) {
                const isValid = await this.verifyKey(userKey);
                if (isValid) {
                    this.markElementAsVerified(element);
                    this.removeProtectionIndicator(element);
                    await this.showAccessGranted();
                } else {
                    element.value = '';
                    this.recordFailedAttempt(element.id || element.type);
                    await Swal.fire({
                        icon: 'error',
                        title: 'Access Denied',
                        text: 'Invalid admin key.',
                        timer: 3000
                    });
                }
            } else {
                element.value = '';
            }
        }
    }

    async verifyKey(userKey) {
        // Hash the user input and compare with stored hash
        const userKeyHash = await this.simpleHash(this.sanitizeInput(userKey));
        
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(userKeyHash === this.adminKeyHash);
            }, 500); // Simulate async verification delay
        });
    }

    sanitizeInput(input) {
        // Basic sanitization - in real apps, use more robust methods
        return input.replace(/[<>{}]/g, '').trim();
    }

    recordFailedAttempt(elementId) {
        const attempts = (this.attempts.get(elementId) || 0) + 1;
        this.attempts.set(elementId, attempts);
        
        if (attempts >= this.maxAttempts) {
            setTimeout(() => this.attempts.delete(elementId), this.lockoutTime);
        }
    }

    isLockedOut(elementId) {
        return (this.attempts.get(elementId) || 0) >= this.maxAttempts;
    }

    grantAccess(element, originalEvent) {
        this.markElementAsVerified(element);
        this.removeProtectionIndicator(element);
        this.showAccessGranted();
    }

    addProtectionIndicator(element) {
        element.style.position = 'relative';
        element.title = 'Admin access required';
        
        if (!element.dataset.protectionAdded) {
            const originalBackground = element.style.backgroundColor;
            element.style.backgroundColor = element.style.backgroundColor || '#f3f4f6';
            element.style.border = '2px dashed #d1d5db';
            element.style.opacity = '0.7';
            element.dataset.originalBackground = originalBackground;
            element.dataset.protectionAdded = 'true';
        }
    }

    removeProtectionIndicator(element) {
        if (element.dataset.protectionAdded) {
            // Restore original styles
            element.style.backgroundColor = element.dataset.originalBackground || '';
            element.style.color = element.dataset.originalColor || '';
            element.style.border = element.dataset.originalBorder || '';
            element.style.opacity = '';
            element.title = '';
            
            // Clean up data attributes
            element.removeAttribute('data-protection-added');
            element.removeAttribute('data-original-background');
            element.removeAttribute('data-original-color');
            element.removeAttribute('data-original-border');
        }
    }

    async showAccessGranted() {
        await Swal.fire({
            icon: 'success',
            title: 'Access Granted',
            text: 'Admin access verified successfully!',
            timer: 2000,
            showConfirmButton: false
        });
    }

    disableProtection() {
        const elements = document.querySelectorAll(this.protectedElements.join(', '));
        elements.forEach(element => {
            this.markElementAsVerified(element);
            this.removeProtectionIndicator(element);
        });
    }

    enableProtection() {
        const elements = document.querySelectorAll(this.protectedElements.join(', '));
        elements.forEach(element => {
            const elementKey = this.getElementKey(element);
            this.verifiedElements.delete(elementKey);
            element.removeAttribute('data-admin-verified');
            this.addProtectionIndicator(element);
        });
    }

    // Method to clear all verifications (useful for testing)
    clearVerifications() {
        this.verifiedElements.clear();
        const elements = document.querySelectorAll(this.protectedElements.join(', '));
        elements.forEach(element => {
            element.removeAttribute('data-admin-verified');
            this.addProtectionIndicator(element);
        });
    }
}

// Initialize the admin protection system
const adminProtection = new AdminProtection();
window.adminProtection = adminProtection;

// Add helper methods to window for easy access in console
window.generateHashKey = (plainText) => adminProtection.generateNewHashKey(plainText);
window.updateAdminKey = (plainText) => adminProtection.updateAdminKeyFromPlainText(plainText);
window.clearVerifications = () => adminProtection.clearVerifications();

console.log('Admin protection system initialized. Protected elements:', adminProtection.protectedElements);
console.log('Current admin key: "Node " (hashed)');
console.log('To generate new hash: generateHashKey("your-new-key")');
console.log('To update admin key: updateAdminKey("your-new-key")');
console.log('To clear all verifications: clearVerifications()');

// Generate hash for any new key
// generateHashKey("Node");

// // This will show a popup with both the plain text and hash
// // Copy the hash and update your code

// Generate and immediately update the admin key
// updateAdminKey("Node");

// // Or just generate without updating
// adminProtection.generateNewHashKey("TestKey").then(hash => {
//     console.log("Generated hash:", hash);
// });

// // Clear all verifications for testing
// // clearVerifications();