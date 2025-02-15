export function checkAuth() {
    const teacherInfo = localStorage.getItem('teacherInfo');
    const authToken = localStorage.getItem('authToken');
    
    if (!teacherInfo || !authToken) {
        window.location.href = '/login/index.html';
        return false;
    }
    
    // Check token expiration
    try {
        const { expiry } = JSON.parse(authToken);
        if (Date.now() > expiry) {
            localStorage.clear();
            window.location.href = '/login/index.html?session=expired';
            return false;
        }
    } catch (error) {
        localStorage.clear();
        window.location.href = '/login/index.html';
        return false;
    }
    
    return true;
}

// Protect specific routes based on user role
export function checkRouteAccess(allowedRoles = []) {
    try {
        const teacherInfo = JSON.parse(localStorage.getItem('teacherInfo'));
        if (!teacherInfo || !allowedRoles.includes(teacherInfo.role)) {
            window.location.href = '/login/dashboard/unauthorized.html';
            return false;
        }
        return true;
    } catch {
        return false;
    }
}
