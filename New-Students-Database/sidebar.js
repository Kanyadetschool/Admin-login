// =============================================================================
// SIDEBAR FUNCTIONALITY - UPDATED WITH CORRECT IDS
// =============================================================================

// Close sidebar on mobile after link click
function closeSidebarOnMobile() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (sidebar && window.innerWidth < 1024) { // Only close on mobile/tablet (< lg breakpoint)
        sidebar.classList.add('-translate-x-full');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }
}

// Setup overlay for mobile sidebar
function setupSidebarOverlay() {
    let overlay = document.getElementById('sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'sidebar-overlay';
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-30 hidden lg:hidden';
        document.body.appendChild(overlay);
        
        // Close sidebar when clicking overlay
        overlay.addEventListener('click', () => {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) {
                sidebar.classList.add('-translate-x-full');
                overlay.classList.add('hidden');
            }
        });
    }
    
    // Show/hide overlay based on sidebar state
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            if (sidebar && overlay) {
                const isOpen = !sidebar.classList.contains('-translate-x-full');
                if (isOpen) {
                    overlay.classList.add('hidden');
                } else {
                    overlay.classList.remove('hidden');
                }
            }
        });
    }
}

// Initialize sidebar functionality
function initializeSidebar() {
    // Get all sidebar links
    const sidebarLinks = document.querySelectorAll('#sidebar nav a');
    
    // Dashboard / All Students (first two links)
    if (sidebarLinks[0]) {
        sidebarLinks[0].addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('show-all')?.click();
            updateSidebarActiveState(e.currentTarget);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            closeSidebarOnMobile();
        });
    }
    
    if (sidebarLinks[1]) {
        sidebarLinks[1].addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('show-all')?.click();
            updateSidebarActiveState(e.currentTarget);
            closeSidebarOnMobile();
        });
    }
    
    // With Documents - already has onclick in HTML, but add listener for consistency
    if (sidebarLinks[2]) {
        sidebarLinks[2].addEventListener('click', (e) => {
            updateSidebarActiveState(e.currentTarget);
            closeSidebarOnMobile();
        });
    }
    
    // Without Documents - already has onclick in HTML
    if (sidebarLinks[3]) {
        sidebarLinks[3].addEventListener('click', (e) => {
            updateSidebarActiveState(e.currentTarget);
            closeSidebarOnMobile();
        });
    }
    
    // Export Data - already has onclick in HTML
    if (sidebarLinks[4]) {
        sidebarLinks[4].addEventListener('click', () => {
            closeSidebarOnMobile();
        });
    }
    
    // Print List - already has onclick in HTML
    if (sidebarLinks[5]) {
        sidebarLinks[5].addEventListener('click', () => {
            closeSidebarOnMobile();
        });
    }
    
    // Refresh Data - already has onclick in HTML
    if (sidebarLinks[6]) {
        sidebarLinks[6].addEventListener('click', () => {
            closeSidebarOnMobile();
        });
    }
    
    // Check All PDFs - already has onclick in HTML
    if (sidebarLinks[7]) {
        sidebarLinks[7].addEventListener('click', () => {
            closeSidebarOnMobile();
        });
    }
    
    // Toggle Theme - already has onclick in HTML
    if (sidebarLinks[8]) {
        sidebarLinks[8].addEventListener('click', () => {
            closeSidebarOnMobile();
        });
    }
    
    // Sign Out Button
    const signOutBtn = document.getElementById('sign-out-btn');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', () => {
            if (typeof handleSignOut === 'function') {
                handleSignOut();
            }
            closeSidebarOnMobile();
        });
    }
    
    // Setup overlay for mobile
    setupSidebarOverlay();
}

// Update sidebar active state
function updateSidebarActiveState(activeElement) {
    // Remove active state from all navigation links (only main nav, not action buttons)
    const navLinks = document.querySelectorAll('#sidebar nav a');
    navLinks.forEach((link, index) => {
        // Only apply to first 4 links (Dashboard, All Students, With Docs, Without Docs)
        if (index < 4) {
            link.classList.remove('bg-gradient-to-r', 'from-indigo-500', 'to-purple-600', 'text-white');
            link.classList.add('text-gray-700', 'dark:text-gray-300');
        }
    });
    
    // Add active state to clicked link
    if (activeElement) {
        activeElement.classList.add('bg-gradient-to-r', 'from-indigo-500', 'to-purple-600', 'text-white');
        activeElement.classList.remove('text-gray-700', 'dark:text-gray-300');
    }
}

// Update sidebar statistics (if you have stat elements in your sidebar)
function updateSidebarStats() {
    if (typeof allStudents === 'undefined') return;
    
    const total = allStudents.length;
    const checkedStudents = allStudents.filter(s => s.hasPdf !== undefined);
    const withPdf = allStudents.filter(s => s.hasPdf === true).length;
    const withoutPdf = allStudents.filter(s => s.hasPdf === false).length;
    
    // Update any stat counters if they exist in your sidebar
    const totalCountEl = document.getElementById('sidebar-total-count');
    const withCountEl = document.getElementById('sidebar-with-count');
    const withoutCountEl = document.getElementById('sidebar-without-count');
    
    if (totalCountEl) totalCountEl.textContent = `${total} student${total !== 1 ? 's' : ''}`;
    if (withCountEl) withCountEl.textContent = `${withPdf} student${withPdf !== 1 ? 's' : ''}`;
    if (withoutCountEl) withoutCountEl.textContent = `${withoutPdf} student${withoutPdf !== 1 ? 's' : ''}`;
}

// Override the original updateStatistics to also update sidebar
const originalUpdateStatistics = window.updateStatistics || function() {};
window.updateStatistics = function() {
    originalUpdateStatistics();
    updateSidebarStats();
};

// Sidebar toggle button for mobile
document.getElementById('sidebar-toggle')?.addEventListener('click', function() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (sidebar) {
        sidebar.classList.toggle('-translate-x-full');
        
        if (overlay) {
            if (sidebar.classList.contains('-translate-x-full')) {
                overlay.classList.add('hidden');
            } else {
                overlay.classList.remove('hidden');
            }
        }
    }
});

// Update user info in sidebar (if auth is available)
function updateSidebarUserInfo() {
    const auth = window.auth || (typeof firebase !== 'undefined' ? firebase.auth() : null);
    if (!auth || !auth.currentUser) return;
    
    const user = auth.currentUser;
    const userAvatar = document.getElementById('user-avatar');
    const userDisplayName = document.getElementById('user-display-name');
    
    if (userDisplayName) {
        const displayName = user.displayName || user.email || 'Admin User';
        userDisplayName.textContent = displayName;
        userDisplayName.title = user.email || '';
    }
    
    if (userAvatar) {
        const initial = (user.displayName || user.email || 'A').charAt(0).toUpperCase();
        userAvatar.textContent = initial;
    }
}

// Theme Toggle
function toggleTheme() {
    document.documentElement.classList.toggle('dark');
}

// Filter Toggle
function toggleFilters() {
    const content = document.getElementById('filter-content');
    const icon = document.getElementById('filter-icon');
    content.classList.toggle('open');
    icon.classList.toggle('rotate-180');
}

// Grade Statistics Toggle
function toggleGradeStats() {
    const content = document.getElementById('grade-stats-content');
    const icon = document.getElementById('grade-stats-toggle-icon');
    content.classList.toggle('open');
    icon.classList.toggle('rotate-180');
}

// Auto-open on hover for Filter Toggle
function setupFilterHover() {
    // Select the entire filter section (the glass-morph container that wraps the filter)
    const filterContainers = document.querySelectorAll('.glass-morph');
    let filterContainer = null;
    
    // Find the container that has the Advanced Filters
    filterContainers.forEach(container => {
        if (container.textContent.includes('Advanced Filters')) {
            filterContainer = container;
        }
    });
    
    const content = document.getElementById('filter-content');
    const icon = document.getElementById('filter-icon');
    
    if (!filterContainer || !content) return;
    
    let hoverTimeout;
    
    const openFilters = () => {
        content.classList.add('open');
        icon?.classList.add('rotate-180');
    };
    
    const closeFilters = () => {
        content.classList.remove('open');
        icon?.classList.remove('rotate-180');
    };
    
    filterContainer.addEventListener('mouseenter', () => {
        clearTimeout(hoverTimeout);
        openFilters();
    });
    
    filterContainer.addEventListener('mouseleave', () => {
        hoverTimeout = setTimeout(closeFilters, 300);
    });
}

// Auto-open on hover for Grade Statistics Toggle
function setupGradeStatsHover() {
    // Select the entire grade stats section (the last glass-morph container)
    const gradeStatsContainers = document.querySelectorAll('.glass-morph');
    let gradeStatsContainer = null;
    
    // Find the container that has Grade Statistics
    gradeStatsContainers.forEach(container => {
        if (container.textContent.includes('Grade Statistics')) {
            gradeStatsContainer = container;
        }
    });
    
    const content = document.getElementById('grade-stats-content');
    const icon = document.getElementById('grade-stats-toggle-icon');
    
    if (!gradeStatsContainer || !content) return;
    
    let hoverTimeout;
    
    const openGradeStats = () => {
        content.classList.add('open');
        icon?.classList.add('rotate-180');
    };
    
    const closeGradeStats = () => {
        content.classList.remove('open');
        icon?.classList.remove('rotate-180');
    };
    
    gradeStatsContainer.addEventListener('mouseenter', () => {
        clearTimeout(hoverTimeout);
        openGradeStats();
    });
    
    gradeStatsContainer.addEventListener('mouseleave', () => {
        hoverTimeout = setTimeout(closeGradeStats, 300);
    });
}

// Enable smooth scrolling
document.documentElement.style.scrollBehavior = 'smooth';

// Update sidebar stats periodically
setInterval(updateSidebarStats, 2000);

// Close sidebar when clicking outside
function setupOutsideClickHandler() {
    document.addEventListener('click', (e) => {
        const sidebar = document.getElementById('sidebar');
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const overlay = document.getElementById('sidebar-overlay');
        
        // Only handle on mobile/tablet
        if (window.innerWidth >= 1024) return;
        
        // Check if sidebar is open
        if (!sidebar || sidebar.classList.contains('-translate-x-full')) return;
        
        // Check if click is outside sidebar and toggle button
        const isClickInsideSidebar = sidebar.contains(e.target);
        const isClickOnToggle = sidebarToggle && sidebarToggle.contains(e.target);
        
        if (!isClickInsideSidebar && !isClickOnToggle) {
            sidebar.classList.add('-translate-x-full');
            if (overlay) {
                overlay.classList.add('hidden');
            }
        }
    });
}

// Initialize sidebar when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeSidebar();
        updateSidebarUserInfo();
        setupOutsideClickHandler();
        setupFilterHover();
        setupGradeStatsHover();
    });
} else {
    initializeSidebar();
    updateSidebarUserInfo();
    setupOutsideClickHandler();
    setupFilterHover();
    setupGradeStatsHover();
}

// Make functions globally accessible
window.closeSidebarOnMobile = closeSidebarOnMobile;
window.setupSidebarOverlay = setupSidebarOverlay;
window.initializeSidebar = initializeSidebar;
window.updateSidebarActiveState = updateSidebarActiveState;
window.updateSidebarStats = updateSidebarStats;
window.updateSidebarUserInfo = updateSidebarUserInfo;
window.toggleTheme = toggleTheme;
window.toggleFilters = toggleFilters;
window.toggleGradeStats = toggleGradeStats;
window.setupFilterHover = setupFilterHover;
window.setupGradeStatsHover = setupGradeStatsHover;