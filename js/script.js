import { authenticateTeacher } from './authService.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.querySelector('.toggle-password');
    const submitBtn = document.querySelector('.submit-btn');
    const resetBtn = document.getElementById('resetPasswordBtn');

    // Toggle password visibility
    if (togglePassword) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            togglePassword.classList.toggle('fa-eye');
            togglePassword.classList.toggle('fa-eye-slash');
        });
    }

    // Form validation and submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // ✅ CHECK COOLDOWN BEFORE ATTEMPTING LOGIN
        const cooldownCheck = checkLoginCooldown();
        if (cooldownCheck.inCooldown) {
            showError(null, `Too many failed attempts. Please wait ${cooldownCheck.remainingTime} seconds before trying again.`);
            return;
        }

        // Show loading state
        const btnSpan = submitBtn.querySelector('span');
        const btnSpinner = submitBtn.querySelector('.spinner');
        
        if (btnSpan) btnSpan.style.opacity = '0';
        if (btnSpinner) btnSpinner.style.display = 'block';
        submitBtn.disabled = true;

        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value;

        try {
            const { user, teacherData } = await authenticateTeacher(email, password);
            
            // ✅ RESET attempts on successful login
            resetLoginAttempts();
            
            // ✅ HIDE reset button on successful login
            if (resetBtn) {
                resetBtn.style.display = 'none';
            }
            
            await handleSuccessfulLogin(user, teacherData);
            
        } catch (error) {
            // ✅ RECORD failed attempt
            const cooldownActivated = recordFailedAttempt();
            
            // ✅ SHOW reset button on failed login
            if (resetBtn) {
                resetBtn.style.display = 'block';
            }
            
            // ✅ RESET BUTTON STATE IMMEDIATELY ON ERROR
            if (btnSpan) btnSpan.style.opacity = '1';
            if (btnSpinner) btnSpinner.style.display = 'none';
            submitBtn.disabled = false;
            
            // Show appropriate error message
            if (cooldownActivated) {
                showError(null, `Too many failed attempts. Please wait 30 seconds before trying again.`);
            } else {
                const attemptsLeft = maxAttempts - loginAttempts;
                const attemptWarning = attemptsLeft <= 1 ? ` (${attemptsLeft} attempt remaining)` : ` (${attemptsLeft} attempts remaining)`;
                showError(null, error.message + attemptWarning);
            }
            
            console.error('Login error:', error);
        }
    });

    async function handleSuccessfulLogin(user, teacherData) {
        console.log('Teacher data received:', teacherData);
        
        const authToken = {
            token: user.uid,
            expiry: Date.now() + (8 * 60 * 60 * 1000) // 8 hours expiry
        };
        
        // Get the display name from any available field
        const displayName = teacherData.username || 
                          teacherData.name || 
                          teacherData.teacherName || 
                          'Teacher';
        
        localStorage.setItem('authToken', JSON.stringify(authToken));
        localStorage.setItem('teacherInfo', JSON.stringify({
            username: displayName,
            email: teacherData.email,
            role: teacherData.role || 'teacher',
            id: teacherData.id
        }));
        
        showSuccess(`Welcome back, ${displayName}!`);
        
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 1500);
    }

    // Show error message
    function showError(input, message) {
        const notification = createNotification(message, 'error');
        
        if (input) {
            input.classList.add('error');
            input.addEventListener('input', () => {
                input.classList.remove('error');
            }, { once: true });
        }
    }

    // Show success message
    function showSuccess(message) {
        createNotification(message, 'success');
    }

    // Create notification element
    function createNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button class="notification-close">×</button>
            </div>
        `;

        // Add click handler for close button
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            removeNotification(notification);
        });

        // Auto-remove after 10 seconds
        setTimeout(() => {
            removeNotification(notification);
        }, 10000);

        document.body.appendChild(notification);
        return notification;
    }

    function removeNotification(notification) {
        if (!notification.classList.contains('removing')) {
            notification.classList.add('removing');
            // Wait for fadeOut animation to complete before removing
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 500);
        }
    }

    // Reset button state (helper function - now rarely needed)
    function resetButton() {
        if (submitBtn) {
            const btnSpan = submitBtn.querySelector('span');
            const btnSpinner = submitBtn.querySelector('.spinner');
            
            if (btnSpan) btnSpan.style.opacity = '1';
            if (btnSpinner) btnSpinner.style.display = 'none';
            submitBtn.disabled = false;
        }
    }

    // Add floating animation to background elements
    const floatingElements = document.querySelectorAll('.floating-element');
    floatingElements.forEach(element => {
        element.style.animation = `float ${15 + Math.random() * 10}s infinite`;
    });

    // Add particle background
    function createParticles() {
        const particleContainer = document.createElement('div');
        particleContainer.className = 'dynamic-bg';
        document.body.appendChild(particleContainer);

        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.width = Math.random() * 5 + 'px';
            particle.style.height = particle.style.width;
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.animationDuration = Math.random() * 3 + 2 + 's';
            particleContainer.appendChild(particle);
        }
    }

    // Enhanced security with attempt tracking
    const maxAttempts = 3;
    let loginAttempts = 0;
    const cooldownTime = 30000; // 30 seconds
    
    function checkLoginCooldown() {
        const cooldownUntil = localStorage.getItem('cooldownUntil');
        if (cooldownUntil) {
            const remainingTime = Math.ceil((parseInt(cooldownUntil) - Date.now()) / 1000);
            if (remainingTime > 0) {
                return { 
                    inCooldown: true, 
                    remainingTime 
                };
            } else {
                // Cooldown expired, clear it
                localStorage.removeItem('cooldownUntil');
                loginAttempts = 0;
            }
        }
        return { inCooldown: false };
    }
    
    function recordFailedAttempt() {
        loginAttempts++;
        console.log(`Failed login attempt ${loginAttempts}/${maxAttempts}`);
        
        if (loginAttempts >= maxAttempts) {
            const cooldownUntil = Date.now() + cooldownTime;
            localStorage.setItem('cooldownUntil', cooldownUntil.toString());
            console.log('Max attempts reached. Cooldown activated.');
            return true; // Cooldown activated
        }
        return false; // Still has attempts left
    }
    
    function resetLoginAttempts() {
        loginAttempts = 0;
        localStorage.removeItem('cooldownUntil');
        console.log('Login attempts reset');
    }

    // Password strength checker
    function checkPasswordStrength(password) {
        const strengthMeter = {
            score: 0,
            feedback: []
        };

        if (password.length >= 8) strengthMeter.score++;
        if (/[A-Z]/.test(password)) strengthMeter.score++;
        if (/[a-z]/.test(password)) strengthMeter.score++;
        if (/[0-9]/.test(password)) strengthMeter.score++;
        if (/[^A-Za-z0-9]/.test(password)) strengthMeter.score++;

        return strengthMeter;
    }

    // Initialize advanced features
    createParticles();
    
    // Add password strength indicator
    if (passwordInput) {
        passwordInput.addEventListener('input', (e) => {
            const strength = checkPasswordStrength(e.target.value);
            const strengthBar = document.querySelector('.strength-bar');
            
            if (strengthBar) {
                strengthBar.style.width = (strength.score * 20) + '%';
                const colors = ['#ff4444', '#ffbb33', '#00C851', '#33b5e5', '#2BBBAD'];
                strengthBar.style.backgroundColor = colors[strength.score - 1] || '#ff4444';
            }
        });
    }
});