

      // Firebase Configuration
const config = {
    apiKey: "AIzaSyA_41WpdMjHJOU5s3gQ9aieIayZRvUoRLE",
    authDomain: "kanyadet-school-admin.firebaseapp.com",
    projectId: "kanyadet-school-admin",
    storageBucket: "kanyadet-school-admin.firebasestorage.app",
    messagingSenderId: "409708360032",
    appId: "1:409708360032:web:a21d63e8cb5fa1ecabee05",
    measurementId: "G-Y4C0ZRRL52"
};

firebase.initializeApp(config);
const db = firebase.firestore();

let allLoginData = [];
let filteredData = [];
let currentPage = 1;
const recordsPerPage = 10;
let currentFilter = 'all';
let searchQuery = '';
let loginChart = null;



// Load login data
async function loadLoginData() {
    try {
        console.log('📊 Loading login data...');
        const snapshot = await db.collection('login_activity')
            .orderBy('timestamp', 'desc')
            .limit(1000)
            .get();

        allLoginData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log(`✅ Loaded ${allLoginData.length} records`);
        updateStats();
        updateChart();
        updateRecentActivity();
        applyFilters();
        
        // ============================================================
        // 🚀 ADVANCED SECURITY ANALYTICS INTEGRATION
        // ============================================================
        if (window.AdvancedSecurity && allLoginData.length > 0) {
            console.log('🛡️ Initializing Advanced Security Analytics...');
            
            // Run threat detection
            const threats = window.AdvancedSecurity.detectThreats(allLoginData);
            console.log('🚨 Threats detected:', threats.length);
            
            // Build user profiles
            const userProfiles = window.AdvancedSecurity.buildUserProfiles(allLoginData);
            console.log('👥 User profiles created:', Object.keys(userProfiles).length);
            
            // Analyze geography
            const geoAnalysis = window.AdvancedSecurity.analyzeGeography(allLoginData);
            console.log('🌍 Geographic analysis complete');
            
            // Calculate advanced stats
            const advancedStats = window.AdvancedSecurity.calculateAdvancedStats(allLoginData);
            console.log('📊 Advanced statistics calculated');
            
            // Generate security report
            const securityReport = window.AdvancedSecurity.generateSecurityReport(
                allLoginData,
                threats,
                userProfiles,
                geoAnalysis
            );
            console.log('📋 Security report generated');
            
            // Render all panels
            window.AdvancedSecurity.renderThreatsPanel(threats);
            window.AdvancedSecurity.renderUserProfilesPanel(userProfiles);
            window.AdvancedSecurity.renderGeographicPanel(geoAnalysis);
            window.AdvancedSecurity.renderSecurityReport(securityReport);
            
            console.log('✅ Advanced Security Analytics initialized successfully!');
        } else {
            console.warn('⚠️ Advanced Security module not loaded or no data available');
        }
        // ============================================================
        
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('tableContent').style.display = 'block';
    } catch (error) {
        console.error('❌ Error loading data:', error);
        
        // ... rest of your error handling code
    
        
        if (error.code === 'permission-denied') {
            document.getElementById('loadingState').innerHTML = `
                <h3>⚠️ Permission Denied</h3>
                <p style="margin-bottom: 15px;">Update your Firestore Security Rules:</p>
                <div style="text-align: left; max-width: 700px; margin: 0 auto; background: rgba(51, 65, 85, 0.5); padding: 20px; border-radius: 10px; font-family: monospace; font-size: 12px; line-height: 1.6;">
                    <strong style="color: #3b82f6;">Firebase Console → Firestore Database → Rules</strong><br><br>
                    <div style="background: rgba(30, 41, 59, 0.5); padding: 15px; border-radius: 5px; border-left: 4px solid #3b82f6;">
                    match /login_activity/{document} {<br>
                    &nbsp;&nbsp;allow read: if request.auth != null;<br>
                    &nbsp;&nbsp;allow write: if request.auth != null;<br>
                    }
                    </div>
                </div>
                <button onclick="location.reload()" style="margin-top: 20px; padding: 12px 24px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 600;">🔄 Retry</button>
            `;
        } else {
            document.getElementById('loadingState').innerHTML = `
                <h3>❌ Error loading data</h3>
                <p>${error.message}</p>
            `;
        }
    }
}







// ============================================================
// ADD THIS NEW FUNCTION - Login Popup Modal
// ============================================================
function showLoginPopup() {
    // Hide loading state
    document.getElementById('loadingState').style.display = 'none';
    
    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'loginModalOverlay';
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(10px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 999999;
        animation: fadeIn 0.3s ease;
    `;
    
    // Create modal content
    modalOverlay.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            border-radius: 20px;
            padding: 40px;
            max-width: 450px;
            width: 90%;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(148, 163, 184, 0.1);
            animation: slideUp 0.3s ease;
        ">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="
                    width: 80px;
                    height: 80px;
                    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 40px;
                    margin: 0 auto 20px;
                    box-shadow: 0 10px 30px rgba(59, 130, 246, 0.3);
                ">🔒</div>
                <h2 style="color: white; margin: 0 0 10px 0; font-size: 28px;">Authentication Required</h2>
                <p style="color: #94a3b8; margin: 0;">Please sign in to access the security dashboard</p>
            </div>
            
            <div id="loginError" style="display: none; padding: 12px; background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; border-radius: 8px; color: #fca5a5; margin-bottom: 20px;"></div>
            
            <button id="googleSignInBtn"
                style="
                    width: 100%;
                    padding: 14px;
                    background: white;
                    color: #1f2937;
                    border: 1px solid #e5e7eb;
                    border-radius: 10px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                "
                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(0, 0, 0, 0.15)';"
                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0, 0, 0, 0.1)';">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19.6 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h5.382a4.6 4.6 0 01-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35z" fill="#4285F4"/>
                    <path d="M10 20c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.123H1.064v2.59A9.996 9.996 0 0010 20z" fill="#34A853"/>
                    <path d="M4.405 11.9c-.2-.6-.314-1.24-.314-1.9 0-.66.114-1.3.314-1.9V5.51H1.064A9.996 9.996 0 000 10c0 1.614.386 3.14 1.064 4.49l3.34-2.59z" fill="#FBBC05"/>
                    <path d="M10 3.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C14.959.99 12.695 0 10 0 6.09 0 2.71 2.24 1.064 5.51l3.34 2.59C5.19 5.736 7.395 3.977 10 3.977z" fill="#EA4335"/>
                </svg>
                Sign in with Google
            </button>
        </div>
    `;
    
    document.body.appendChild(modalOverlay);
    
    // Handle Google Sign-In
    document.getElementById('googleSignInBtn').addEventListener('click', async () => {
        const submitBtn = document.getElementById('googleSignInBtn');
        const errorDiv = document.getElementById('loginError');
        
        // Disable button
        submitBtn.disabled = true;
        submitBtn.innerHTML = '⏳ Signing in with Google...';
        errorDiv.style.display = 'none';
        
        try {
            // Create Google Auth Provider
            const provider = new firebase.auth.GoogleAuthProvider();
            
            // Sign in with popup
            await firebase.auth().signInWithPopup(provider);
            // await firebase.auth().signInWithRedirect(provider);
            
            // Success - close modal
            modalOverlay.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                modalOverlay.remove();
                document.getElementById('loadingState').style.display = 'flex';
                loadLoginData();
            }, 300);
            
        } catch (error) {
            console.error('Google Sign-In error:', error);
            
            // Show error
            errorDiv.style.display = 'block';
            errorDiv.innerHTML = `❌ ${error.message}`;
            
            // Re-enable button
            submitBtn.disabled = false;
            submitBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19.6 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h5.382a4.6 4.6 0 01-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35z" fill="#4285F4"/>
                    <path d="M10 20c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.123H1.064v2.59A9.996 9.996 0 0010 20z" fill="#34A853"/>
                    <path d="M4.405 11.9c-.2-.6-.314-1.24-.314-1.9 0-.66.114-1.3.314-1.9V5.51H1.064A9.996 9.996 0 000 10c0 1.614.386 3.14 1.064 4.49l3.34-2.59z" fill="#FBBC05"/>
                    <path d="M10 3.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C14.959.99 12.695 0 10 0 6.09 0 2.71 2.24 1.064 5.51l3.34 2.59C5.19 5.736 7.395 3.977 10 3.977z" fill="#EA4335"/>
                </svg>
                Sign in with Google
            `;
        }
    });
}



// ============================================================
// ACCESS DENIED POPUP
// ============================================================
function showAccessDeniedPopup(message) {
    const existingModal = document.getElementById('loginModalOverlay');
    if (existingModal) existingModal.remove();
    
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'loginModalOverlay';
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(10px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 999999;
        animation: fadeIn 0.3s ease;
    `;
    
    modalOverlay.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            border-radius: 20px;
            padding: 40px;
            max-width: 450px;
            width: 90%;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(148, 163, 184, 0.1);
            text-align: center;
        ">
            <div style="
                width: 80px;
                height: 80px;
                background: linear-gradient(135deg, #ef4444, #dc2626);
                border-radius: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 40px;
                margin: 0 auto 20px;
                box-shadow: 0 10px 30px rgba(239, 68, 68, 0.3);
            ">⚠️</div>
            <h2 style="color: white; margin: 0 0 10px 0; font-size: 28px;">Access Denied</h2>
            <p style="color: #94a3b8; margin: 0 0 30px 0;">${message}</p>
            <button onclick="showLoginPopup()"
                style="
                    width: 100%;
                    padding: 14px;
                    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                ">
                🔄 Sign In Again
            </button>
        </div>
    `;
    
    document.body.appendChild(modalOverlay);
}

// ============================================================
// ADD THESE CSS ANIMATIONS TO YOUR STYLE TAG OR CSS FILE
// ============================================================
const loginModalStyles = document.createElement('style');
loginModalStyles.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    
    @keyframes slideUp {
        from { 
            transform: translateY(50px); 
            opacity: 0; 
        }
        to { 
            transform: translateY(0); 
            opacity: 1; 
        }
    }
    
    #loginModalOverlay input:focus {
        outline: none;
    }
`;
document.head.appendChild(loginModalStyles);


// ============================================================
// UPDATE THE ADMIN AUTH CHECK SECTION
// Replace the section that shows "Authentication Required" message
// ============================================================

firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) {
        console.log('❌ No authentication');
        showLoginPopup(); // Changed from showing message to showing popup
        return;
    }

    console.log('✅ User authenticated:', user.email);
    
    // Check if user has admin privileges
    try {
        const email = user.email.toLowerCase();
        const docRef = db.collection('authorized_users').doc(email);
        const doc = await docRef.get();
        
       if (!doc.exists) {
    console.log('❌ User document not found');
    await firebase.auth().signOut();
    showAccessDeniedPopup('Your account does not have admin privileges.');
    return;
}
        
        const userData = doc.data();
        
        // Check if approved
        const isApproved = userData.approved === true || userData.approved === 'true';
        if (!isApproved) {
            console.log('❌ User not approved');
            await firebase.auth().signOut();
            alert('Your access has been revoked.');
            showLoginPopup();
            return;
        }
        
        // Check if disabled
        if (userData.disabled === true || userData.disabled === 'true') {
            console.log('❌ User disabled');
            await firebase.auth().signOut();
            alert('Your account has been disabled.');
            showLoginPopup();
            return;
        }
        
        // ✅ CHECK IF USER IS ADMIN
        const isAdmin = userData.role === 'admin' || userData.isAdmin === true || userData.admin === true;
        
       if (!isAdmin) {
    console.log('❌ User is not admin');
    await firebase.auth().signOut();
    showAccessDeniedPopup('This page is restricted to administrators only.');
    return;
}
        
        console.log('✅ Admin access granted');
        
        // Update UI with admin info
        document.getElementById('userEmail').textContent = `👑 Admin: ${user.email}`;
        document.getElementById('sessionStatus').textContent = '🔐 Admin Session Active';
        
        // Start session monitoring for admin
        setInterval(async () => {
            try {
                const checkDoc = await docRef.get();
                
                if (!checkDoc.exists) {
                    console.log('❌ Admin account removed');
                    await firebase.auth().signOut();
                    alert('Your admin account has been removed.');
                    showLoginPopup();
                    return;
                }
                
                const checkData = checkDoc.data();
                const stillApproved = checkData.approved === true || checkData.approved === 'true';
                const notDisabled = !(checkData.disabled === true || checkData.disabled === 'true');
                const stillAdmin = checkData.role === 'admin' || checkData.isAdmin === true || checkData.admin === true;
                
                if (!stillApproved || !notDisabled || !stillAdmin) {
                    console.log('❌ Admin privileges revoked');
                    await firebase.auth().signOut();
                    alert('Your admin privileges have been revoked.');
                    showLoginPopup();
                    return;
                }
                
                console.log('✅ Admin session valid');
            } catch (error) {
                console.error('Admin session check error:', error);
            }
        }, 60000); // Check every 60 seconds
        
        // Load data
        loadLoginData();
        
    } catch (error) {
        console.error('❌ Error checking admin access:', error);
        document.getElementById('loadingState').innerHTML = `
            <h3>❌ Error</h3>
            <p>${error.message}</p>
            <button onclick="location.reload()" style="margin-top: 15px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer;">Retry</button>
        `;
    }
});


// Logout button handler
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        const user = firebase.auth().currentUser;
        if (user) {
            const email = user.email;
            sessionStorage.removeItem('codeVerified_' + email);
            sessionStorage.removeItem('codeVerifiedTime_' + email);
            sessionStorage.removeItem('verifiedCode_' + email);
        }
        
        await firebase.auth().signOut();
        showLoginPopup();
    });
}


// Update statistics
function updateStats() {
    const totalLogins = allLoginData.length;
    const successfulLogins = allLoginData.filter(l => l.status === 'success').length;
    const failedLogins = allLoginData.filter(l => l.status === 'failed').length;
    const uniqueUsers = new Set(allLoginData.map(l => l.email)).size;

    // Calculate hourly changes
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentLogins = allLoginData.filter(l => {
        const loginDate = l.timestamp?.toDate() || new Date(0);
        return loginDate >= oneHourAgo;
    });

    document.getElementById('totalLogins').textContent = totalLogins;
    document.getElementById('successfulLogins').textContent = successfulLogins;
    document.getElementById('failedLogins').textContent = failedLogins;
    document.getElementById('uniqueUsers').textContent = uniqueUsers;

    // Update change indicators
    const successRate = totalLogins > 0 ? ((successfulLogins / totalLogins) * 100).toFixed(1) : 0;
    document.getElementById('totalChange').textContent = `↗ ${recentLogins.length} in last hour`;
    document.getElementById('successChange').textContent = `↗ ${successRate}% success rate`;
    document.getElementById('failedChange').textContent = `${failedLogins} failed attempts`;
    document.getElementById('uniqueChange').textContent = `${uniqueUsers} active users`;
}

// Update chart
function updateChart() {
    const ctx = document.getElementById('loginChart');
    if (!ctx) return;

    // Prepare data for last 24 hours
    const hours = [];
    const successData = [];
    const failedData = [];

    for (let i = 23; i >= 0; i--) {
        const hour = new Date(Date.now() - i * 60 * 60 * 1000);
        hours.push(hour.getHours() + ':00');
        
        const hourStart = new Date(hour);
        hourStart.setMinutes(0, 0, 0);
        const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);

        const hourData = allLoginData.filter(l => {
            const loginDate = l.timestamp?.toDate() || new Date(0);
            return loginDate >= hourStart && loginDate < hourEnd;
        });

        successData.push(hourData.filter(l => l.status === 'success').length);
        failedData.push(hourData.filter(l => l.status === 'failed').length);
    }

    if (loginChart) {
        loginChart.destroy();
    }

    loginChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: hours,
            datasets: [{
                label: 'Successful',
                data: successData,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true,
                borderWidth: 3,
                pointRadius: 4,
                pointHoverRadius: 6
            }, {
                label: 'Failed',
                data: failedData,
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                tension: 0.4,
                fill: true,
                borderWidth: 3,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#94a3b8',
                        font: {
                            size: 12,
                            weight: '600'
                        },
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    borderColor: 'rgba(148, 163, 184, 0.2)',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: true
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(148, 163, 184, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#64748b',
                        font: {
                            size: 11
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(148, 163, 184, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#64748b',
                        font: {
                            size: 11
                        },
                        stepSize: 1
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// Update recent activity
function updateRecentActivity() {
    const recentList = document.getElementById('recentActivityList');
    const recent = allLoginData.slice(0, 10);

    if (recent.length === 0) {
        recentList.innerHTML = '<p style="color: #64748b; text-align: center; padding: 20px;">No recent activity</p>';
        return;
    }

    recentList.innerHTML = recent.map(login => {
        const timestamp = login.timestamp?.toDate() || new Date();
        const timeAgo = getTimeAgo(timestamp);
        const statusClass = login.status === 'success' ? 'success' : 'failed';

        return `
            <div class="activity-item ${statusClass}">
                <div class="activity-header">
                    <span class="activity-email">${login.email || 'Unknown'}</span>
                    <span class="activity-time">${timeAgo}</span>
                </div>
                <div class="activity-meta">
                    <span>📍 ${login.location || 'Unknown'}</span>
                    <span>💻 ${login.device || 'Unknown'}</span>
                    ${login.status === 'failed' ? `<span style="color: #ef4444;">❌ ${login.errorMessage || 'Failed'}</span>` : '<span style="color: #10b981;">✅ Success</span>'}
                </div>
            </div>
        `;
    }).join('');
}

// Time ago helper
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
    return Math.floor(seconds / 86400) + 'd ago';
}

// Apply filters and search
function applyFilters() {
    filteredData = allLoginData;

    // Apply status filter
    if (currentFilter !== 'all') {
        if (currentFilter === 'today') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            filteredData = filteredData.filter(login => {
                const loginDate = login.timestamp?.toDate() || new Date(0);
                return loginDate >= today;
            });
        } else {
            filteredData = filteredData.filter(login => login.status === currentFilter);
        }
    }

    // Apply search
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredData = filteredData.filter(login => 
            login.email?.toLowerCase().includes(query) ||
            login.ipAddress?.toLowerCase().includes(query) ||
            login.location?.toLowerCase().includes(query) ||
            login.device?.toLowerCase().includes(query) ||
            login.browser?.toLowerCase().includes(query)
        );
    }

    currentPage = 1;
    renderTable();
}


// =============================================================================
// SESSION REVOCATION FUNCTIONS
// =============================================================================

async function revokeUserSessions(email) {
    if (!confirm(`Are you sure you want to revoke all active sessions for ${email}?\n\nThis will force them to login again.`)) {
        return;
    }
    
    try {
        const docRef = db.collection('authorized_users').doc(email.toLowerCase());
        
        await docRef.update({
            revokeSessionsAfter: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showNotification('success', `Sessions revoked for ${email}`);
        console.log('✅ Sessions revoked successfully');
    } catch (error) {
        console.error('❌ Error revoking sessions:', error);
        showNotification('error', `Failed to revoke sessions: ${error.message}`);
    }
}

async function disableUser(email) {
    if (!confirm(`Are you sure you want to DISABLE the account for ${email}?\n\nThey will not be able to login until re-enabled.`)) {
        return;
    }
    
    try {
        const docRef = db.collection('authorized_users').doc(email.toLowerCase());
        
        await docRef.update({
            disabled: true,
            disabledAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showNotification('success', `Account disabled for ${email}`);
        console.log('✅ Account disabled successfully');
    } catch (error) {
        console.error('❌ Error disabling account:', error);
        showNotification('error', `Failed to disable account: ${error.message}`);
    }
}

async function enableUser(email) {
    if (!confirm(`Are you sure you want to ENABLE the account for ${email}?`)) {
        return;
    }
    
    try {
        const docRef = db.collection('authorized_users').doc(email.toLowerCase());
        
        await docRef.update({
            disabled: false,
            enabledAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showNotification('success', `Account enabled for ${email}`);
        console.log('✅ Account enabled successfully');
    } catch (error) {
        console.error('❌ Error enabling account:', error);
        showNotification('error', `Failed to enable account: ${error.message}`);
    }
}

async function changeUserAccessCode(email) {
    const newCode = prompt(`Enter new 6-digit access code for ${email}:`);
    
    if (!newCode) return;
    
    if (!/^\d{6}$/.test(newCode)) {
        alert('Access code must be exactly 6 digits!');
        return;
    }
    
    try {
        const docRef = db.collection('authorized_users').doc(email.toLowerCase());
        
        await docRef.update({
            accessCode: parseInt(newCode),
            codeChangedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showNotification('success', `Access code changed for ${email}`);
        console.log('✅ Access code changed successfully');
    } catch (error) {
        console.error('❌ Error changing access code:', error);
        showNotification('error', `Failed to change access code: ${error.message}`);
    }
}

// Notification system
function showNotification(type, message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)'};
        color: white;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 999999;
        font-weight: 600;
        animation: slideIn 0.3s ease;
    `;
    
    notification.innerHTML = `
        ${type === 'success' ? '✅' : '❌'} ${message}
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);





// Render table
// Render table with action buttons
// =============================================================================
// ENHANCED USER MANAGEMENT - REPLACE YOUR renderTable() FUNCTION
// =============================================================================

function renderTable() {
    const tbody = document.getElementById('loginTable');
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    const pageData = filteredData.slice(startIndex, endIndex);

    if (filteredData.length === 0) {
        document.getElementById('tableContent').style.display = 'none';
        document.getElementById('emptyState').style.display = 'block';
        return;
    }

    document.getElementById('tableContent').style.display = 'block';
    document.getElementById('emptyState').style.display = 'none';

    // Get unique users from current page and fetch their status
    const uniqueUsers = [...new Set(pageData.map(login => login.email))];
    
    // Fetch user statuses from Firestore
    const userStatuses = {};
    Promise.all(
        uniqueUsers.map(async (email) => {
            try {
                const docRef = db.collection('authorized_users').doc(email.toLowerCase());
                const doc = await docRef.get();
                if (doc.exists) {
                    const data = doc.data();
                    userStatuses[email] = {
                        disabled: data.disabled === true || data.disabled === 'true',
                        accessCode: data.accessCode || 'Not Set'
                    };
                } else {
                    userStatuses[email] = { disabled: false, accessCode: 'Not Set' };
                }
            } catch (error) {
                console.error(`Error fetching status for ${email}:`, error);
                userStatuses[email] = { disabled: false, accessCode: 'Unknown' };
            }
        })
    ).then(() => {
        renderTableWithStatuses(pageData, userStatuses, startIndex, endIndex);
    });
}

function renderTableWithStatuses(pageData, userStatuses, startIndex, endIndex) {
    const tbody = document.getElementById('loginTable');
    
    tbody.innerHTML = pageData.map((login, index) => {
        const timestamp = login.timestamp?.toDate() || new Date();
        const timeStr = timestamp.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        const statusClass = login.status === 'success' ? 'status-success' : 'status-failed';
        const statusIcon = login.status === 'success' ? '✅' : '❌';
        
        // Show action buttons only for the first occurrence of each user
        const showActions = index === pageData.findIndex(l => l.email === login.email);
        
        // Get user status
        const userStatus = userStatuses[login.email] || { disabled: false, accessCode: 'Unknown' };
        const isDisabled = userStatus.disabled;
        const accessCode = userStatus.accessCode;

        return `
            <tr>
                <td style="color: #6b7280;">${timeStr}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <strong style="color: #1f2937;">${login.email || 'Unknown'}</strong>
                        ${isDisabled ? '<span style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 2px 8px; border-radius: 5px; font-size: 10px; font-weight: 700;">DISABLED</span>' : ''}
                    </div>
                    ${showActions ? `
                        <div style="margin-top: 8px; padding: 8px; background: rgba(51, 65, 85, 0.3); border-radius: 8px; border-left: 3px solid #3b82f6;">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 12px; color: #94a3b8;">
                                <span style="font-weight: 600;">🔑 Access Code:</span>
                                <code style="background: rgba(59, 130, 246, 0.1); padding: 3px 8px; border-radius: 4px; color: #3b82f6; font-weight: 700;">${accessCode}</code>
                            </div>
                            <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                                <button onclick="revokeUserSessions('${login.email}')" 
                                        style="padding: 6px 12px; font-size: 11px; background: linear-gradient(135deg, #f59e0b, #d97706); 
                                               color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;
                                               transition: all 0.2s; box-shadow: 0 2px 4px rgba(245, 158, 11, 0.3);"
                                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(245, 158, 11, 0.4)'"
                                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(245, 158, 11, 0.3)'">
                                    🔄 Revoke Sessions
                                </button>
                                ${isDisabled ? `
                                    <button onclick="enableUser('${login.email}')" 
                                            style="padding: 6px 12px; font-size: 11px; background: linear-gradient(135deg, #10b981, #059669); 
                                                   color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;
                                                   transition: all 0.2s; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);"
                                            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(16, 185, 129, 0.4)'"
                                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(16, 185, 129, 0.3)'">
                                        ✅ Enable Account
                                    </button>
                                ` : `
                                    <button onclick="disableUser('${login.email}')" 
                                            style="padding: 6px 12px; font-size: 11px; background: linear-gradient(135deg, #ef4444, #dc2626); 
                                                   color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;
                                                   transition: all 0.2s; box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);"
                                            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(239, 68, 68, 0.4)'"
                                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(239, 68, 68, 0.3)'">
                                        🚫 Disable Account
                                    </button>
                                `}
                                <button onclick="changeUserAccessCode('${login.email}')" 
                                        style="padding: 6px 12px; font-size: 11px; background: linear-gradient(135deg, #8b5cf6, #7c3aed); 
                                               color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;
                                               transition: all 0.2s; box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3);"
                                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(139, 92, 246, 0.4)'"
                                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(139, 92, 246, 0.3)'">
                                    🔑 Change Access Code
                                </button>
                            </div>
                        </div>
                    ` : ''}
                </td>
                <td><span class="status-badge ${statusClass}">${statusIcon} ${login.status || 'Unknown'}</span></td>
                <td style="font-family: monospace; color: #6366f1;">${login.ipAddress || 'N/A'}</td>
                <td style="color: #4b5563;">🌍 ${login.location || 'Unknown'}</td>
                <td style="color: #4b5563;">
                    <div>💻 ${login.device || 'Unknown'}</div>
                    ${login.browser ? `<div style="font-size: 12px; color: #6b7280; margin-top: 4px;">🌐 ${login.browser}</div>` : ''}
                </td>
            </tr>
        `;
    }).join('');

    // Update pagination
    document.getElementById('pageStart').textContent = filteredData.length > 0 ? startIndex + 1 : 0;
    document.getElementById('pageEnd').textContent = Math.min(endIndex, filteredData.length);
    document.getElementById('totalRecords').textContent = filteredData.length;

    // Add page indicator
    const totalPages = Math.ceil(filteredData.length / recordsPerPage);
    const pageInfo = document.querySelector('.pagination-info');
    if (pageInfo) {
        pageInfo.innerHTML = `
            Showing <span id="pageStart">${startIndex + 1}</span> to 
            <span id="pageEnd">${Math.min(endIndex, filteredData.length)}</span> of 
            <span id="totalRecords">${filteredData.length}</span> records 
            <strong style="color: #3b82f6;">(Page ${currentPage} of ${totalPages})</strong>
        `;
    }

    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = currentPage * recordsPerPage >= filteredData.length;
}

// =============================================================================
// UPDATED ENABLE/DISABLE FUNCTIONS WITH TABLE REFRESH
// =============================================================================

async function disableUser(email) {
    if (!confirm(`⚠️ DISABLE ACCOUNT\n\nAre you sure you want to disable ${email}?\n\nThey will NOT be able to login until re-enabled.`)) {
        return;
    }
    
    try {
        const docRef = db.collection('authorized_users').doc(email.toLowerCase());
        
        await docRef.update({
            disabled: true,
            disabledAt: firebase.firestore.FieldValue.serverTimestamp(),
            disabledBy: firebase.auth().currentUser.email
        });
        
        showNotification('success', `🚫 Account DISABLED for ${email}`);
        console.log('✅ Account disabled successfully');
        
        // Refresh the table to show updated status
        setTimeout(() => renderTable(), 500);
        
    } catch (error) {
        console.error('❌ Error disabling account:', error);
        showNotification('error', `Failed to disable account: ${error.message}`);
    }
}

async function enableUser(email) {
    if (!confirm(`✅ ENABLE ACCOUNT\n\nAre you sure you want to enable ${email}?\n\nThey will be able to login again.`)) {
        return;
    }
    
    try {
        const docRef = db.collection('authorized_users').doc(email.toLowerCase());
        
        await docRef.update({
            disabled: false,
            enabledAt: firebase.firestore.FieldValue.serverTimestamp(),
            enabledBy: firebase.auth().currentUser.email
        });
        
        showNotification('success', `✅ Account ENABLED for ${email}`);
        console.log('✅ Account enabled successfully');
        
        // Refresh the table to show updated status
        setTimeout(() => renderTable(), 500);
        
    } catch (error) {
        console.error('❌ Error enabling account:', error);
        showNotification('error', `Failed to enable account: ${error.message}`);
    }
}

async function changeUserAccessCode(email) {
    const newCode = prompt(`🔑 CHANGE ACCESS CODE\n\nEnter new 6-digit access code for ${email}:`);
    
    if (!newCode) return;
    
    if (!/^\d{6}$/.test(newCode)) {
        alert('❌ Invalid Code!\n\nAccess code must be exactly 6 digits (numbers only).');
        return;
    }
    
    try {
        const docRef = db.collection('authorized_users').doc(email.toLowerCase());
        
        await docRef.update({
            accessCode: parseInt(newCode),
            codeChangedAt: firebase.firestore.FieldValue.serverTimestamp(),
            codeChangedBy: firebase.auth().currentUser.email
        });
        
        showNotification('success', `🔑 Access code changed to ${newCode} for ${email}`);
        console.log('✅ Access code changed successfully');
        
        // Refresh the table to show new access code
        setTimeout(() => renderTable(), 500);
        
    } catch (error) {
        console.error('❌ Error changing access code:', error);
        showNotification('error', `Failed to change access code: ${error.message}`);
    }
}

// Export to CSV
function exportToCSV() {
    const headers = ['Timestamp', 'Email', 'Status', 'IP Address', 'Location', 'Device', 'Browser', 'Error Message'];
    const rows = filteredData.map(login => {
        const timestamp = login.timestamp?.toDate() || new Date();
        return [
            timestamp.toISOString(),
            login.email || '',
            login.status || '',
            login.ipAddress || '',
            login.location || '',
            login.device || '',
            login.browser || '',
            login.errorMessage || ''
        ];
    });

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// Export to PDF with Premium Styling
async function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape');

    const dataToExport = filteredData;
    const totalLogins = dataToExport.length;
    
    // Load logo placeholder
    const logoImg = new Image();
    logoImg.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyNSIgY3k9IjI1IiByPSIyMCIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==';
    
    await new Promise((resolve) => {
        logoImg.onload = resolve;
        logoImg.onerror = () => resolve();
    });
    
    const headers = ['No.', 'Timestamp', 'User Email', 'Status', 'IP Address', 'Location', 'Device/Browser'];
    const body = dataToExport.map((login, index) => {
        const timestamp = login.timestamp?.toDate() || new Date();
        const timeStr = timestamp.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return [
            String(index + 1),
            timeStr,
            login.email || '-',
            login.status || '-',
            login.ipAddress || '-',
            login.location || '-',
            `${login.device || '-'} / ${login.browser || '-'}`
        ];
    });

    // Premium Header Function
    const addHeader = (data) => {
        const pageWidth = doc.internal.pageSize.width;
        
        // Header background
        doc.setFillColor(41, 128, 185);
        doc.rect(0, 0, pageWidth, 20, 'F');
        
        // Add white logo
        const logoWidth = 15;
        const logoHeight = 15;
        const logoX = 14;
        const logoY = 2.5;
        
        try {
            doc.addImage(logoImg, 'PNG', logoX, logoY, logoWidth, logoHeight);
        } catch (e) {
            console.log('Logo not available');
        }
        
        // Title
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('SECURITY COMMAND CENTER', logoX + logoWidth + 5, 10);
        
        // Subtitle
        doc.setFontSize(12);
        doc.text('Login Activity Report', logoX + logoWidth + 5, 16);
        
        // Date and info (right aligned)
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        const dateText = `Date: ${new Date().toLocaleDateString()}`;
        const timeText = `Time: ${new Date().toLocaleTimeString()}`;
        const loginCount = `Total Records: ${totalLogins}`;
        doc.text(dateText, pageWidth - 14, 8, { align: 'right' });
        doc.text(timeText, pageWidth - 14, 13, { align: 'right' });
        doc.text(loginCount, pageWidth - 14, 18, { align: 'right' });
        
        // Decorative line
        doc.setDrawColor(41, 128, 185);
        doc.setLineWidth(0.5);
        doc.line(0, 20, pageWidth, 20);
    };

    // Premium Footer Function
    const addFooter = (data, totalPages) => {
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const footerY = pageHeight - 15;
        
        // Footer background
        doc.setFillColor(245, 245, 245);
        doc.rect(0, footerY - 5, pageWidth, 20, 'F');
        
        // Top border
        doc.setDrawColor(41, 128, 185);
        doc.setLineWidth(0.3);
        doc.line(0, footerY - 5, pageWidth, footerY - 5);
        
        doc.setTextColor(60, 60, 60);
        doc.setFontSize(8);
        
        // Left section
        doc.setFont(undefined, 'bold');
        doc.text('Prepared by:', 14, footerY);
        doc.setFont(undefined, 'normal');
        doc.text('_________________', 14, footerY + 4);
        doc.setFontSize(7);
        doc.text('Signature & Date', 14, footerY + 8);
        
        // Center - Page number
        doc.setFontSize(9);
        const pageText = `Page ${data.pageNumber} of ${totalPages}`;
        doc.text(pageText, pageWidth / 2, footerY + 2, { align: 'center' });
        
        // Right section
        doc.setFontSize(8);
        doc.setFont(undefined, 'bold');
        doc.text('Verified by:', pageWidth - 14, footerY, { align: 'right' });
        doc.setFont(undefined, 'normal');
        doc.text('_________________', pageWidth - 14, footerY + 4, { align: 'right' });
        doc.setFontSize(7);
        doc.text('Signature & Stamp', pageWidth - 14, footerY + 8, { align: 'right' });
        
        // Stamp box
        doc.setDrawColor(41, 128, 185);
        doc.setLineWidth(0.2);
        doc.rect(pageWidth - 85, footerY - 3, 28, 10);
        doc.setFontSize(6);
        doc.setTextColor(150, 150, 150);
        doc.text('OFFICIAL', pageWidth - 71, footerY + 2, { align: 'center' });
        doc.text('STAMP', pageWidth - 71, footerY + 5, { align: 'center' });
    };

    // Generate table
    doc.autoTable({
        head: [headers],
        body: body,
        startY: 25,
        styles: { 
            fontSize: 8,
            cellPadding: 2.5,
            overflow: 'linebreak',
            cellWidth: 'auto',
            font: 'helvetica'
        },
        columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 35 },
            3: { cellWidth: 20 },
            4: { cellWidth: 30 }
        },
        headStyles: { 
            fillColor: [41, 128, 185], 
            textColor: [255, 255, 255],
            fontStyle: 'bold'
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 25, right: 10, bottom: 20, left: 10 },
        didDrawPage: function(data) {
            addHeader(data);
        }
    });

    // Add footers with correct page count
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addFooter({ pageNumber: i }, totalPages);
    }

    const filename = `security_logs_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
}



// Export to Excel with Premium Styling
function exportToExcel() {
    const dataToExport = filteredData;
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Create header rows
    const headerData = [
        ['SECURITY COMMAND CENTER'],
        ['Login Activity Report'],
        [`Date: ${new Date().toLocaleDateString()}`, '', '', `Time: ${new Date().toLocaleTimeString()}`],
        [`Total Records: ${dataToExport.length}`],
        [],
        ['No.', 'Timestamp', 'Email', 'Status', 'IP Address', 'Location', 'Device', 'Browser', 'Error Message']
    ];

    // Create data rows
    const bodyData = dataToExport.map((login, index) => [
        index + 1,
        (login.timestamp?.toDate() || new Date()).toLocaleString(),
        login.email || '',
        login.status || '',
        login.ipAddress || '',
        login.location || '',
        login.device || '',
        login.browser || '',
        login.errorMessage || ''
    ]);

    // Add footer rows
    const footerData = [
        [],
        ['Prepared by: _________________', '', '', '', '', 'Verified by: _________________'],
        ['Signature & Date', '', '', '', '', 'Signature & Stamp']
    ];

    // Combine all data
    const wsData = [...headerData, ...bodyData, ...footerData];

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    ws['!cols'] = [
        { wch: 8 },  // No.
        { wch: 20 }, // Timestamp
        { wch: 25 }, // Email
        { wch: 12 }, // Status
        { wch: 18 }, // IP
        { wch: 20 }, // Location
        { wch: 15 }, // Device
        { wch: 15 }, // Browser
        { wch: 20 }  // Error
    ];

    // Merge cells for header
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }, // Title
        { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } }, // Subtitle
        { s: { r: 3, c: 0 }, e: { r: 3, c: 8 } }  // Total records
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Login Activity');

    // Save file
    const filename = `security_logs_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
}

// Modal functions
function openExportModal() {
    const modal = document.getElementById('exportModal');
    const optionsDiv = document.getElementById('exportOptions');
    
    optionsDiv.innerHTML = `
        <div style="padding: 20px;">
            <p style="color: #64748b; margin-bottom: 20px;">
                Select export format for ${filteredData.length} records
            </p>
            <div style="display: flex; gap: 15px; flex-direction: column;">
                <button onclick="exportToCSV(); closeExportModal();" 
                        style="padding: 15px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); 
                               color: white; border: none; border-radius: 10px; cursor: pointer; 
                               font-weight: 600; font-size: 16px;">
                    📄 Export as CSV
                </button>
                <button onclick="exportToExcel(); closeExportModal();" 
                        style="padding: 15px; background: linear-gradient(135deg, #10b981, #059669); 
                               color: white; border: none; border-radius: 10px; cursor: pointer; 
                               font-weight: 600; font-size: 16px;">
                    📊 Export as Excel (Premium)
                </button>
                <button onclick="exportToPDF(); closeExportModal();" 
                        style="padding: 15px; background: linear-gradient(135deg, #ef4444, #dc2626); 
                               color: white; border: none; border-radius: 10px; cursor: pointer; 
                               font-weight: 600; font-size: 16px;">
                    📕 Export as PDF (Premium)
                </button>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
}

function closeExportModal() {
    document.getElementById('exportModal').style.display = 'none';
}

// Event listeners
document.getElementById('searchInput').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    applyFilters();
});

document.querySelectorAll('[data-filter]').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentFilter = e.target.dataset.filter;
        applyFilters();
    });
});

document.querySelectorAll('.chart-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
        document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        updateChart();
    });
});

document.getElementById('refreshBtn').addEventListener('click', () => {
    loadLoginData();
    const btn = document.getElementById('refreshBtn');
    btn.style.transform = 'rotate(360deg)';
    setTimeout(() => btn.style.transform = '', 500);
});

document.getElementById('exportBtn').addEventListener('click', openExportModal);

document.getElementById('prevBtn').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        renderTable();
    }
});

document.getElementById('nextBtn').addEventListener('click', () => {
    if (currentPage * recordsPerPage < filteredData.length) {
        currentPage++;
        renderTable();
    }
});

// Auto-refresh every 30 seconds
setInterval(() => {
    loadLoginData();
}, 30000);

// Initial load
console.log('🚀 Security Dashboard Initialized');




// Update session timer display
// Update session timer display for admin
function updateSessionTimer() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    const userEmailElement = document.getElementById('userEmail');
    const sessionTimerElement = document.getElementById('sessionTimer');
    const sessionStatusElement = document.getElementById('sessionStatus');
    
    if (userEmailElement) {
        userEmailElement.textContent = `👑 Admin: ${user.email}`;
    }
    
    if (sessionStatusElement) {
        sessionStatusElement.textContent = '🔐 Admin Session Active';
    }
    
    if (sessionTimerElement) {
        const now = new Date();
        sessionTimerElement.textContent = `Last check: ${now.toLocaleTimeString()}`;
    }
}



// Update timer every minute
setInterval(updateSessionTimer, 60000);
updateSessionTimer(); // Initial call




