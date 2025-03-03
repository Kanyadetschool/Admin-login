function checkAuth() {
    const authUser = localStorage.getItem('authUser');
    if (!authUser) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const userData = JSON.parse(authUser);
        const lastLogin = userData.lastLogin;
        const currentTime = new Date().getTime();
        // Check if last login was more than 24 hours ago
        if (currentTime - lastLogin > 24 * 60 * 60 * 1000) {
            localStorage.removeItem('authUser');
            window.location.href = 'login.html';
        }
    } catch (e) {
        console.error('Auth check failed:', e);
        window.location.href = 'login.html';
    }
}

// Run auth check immediately
checkAuth();
