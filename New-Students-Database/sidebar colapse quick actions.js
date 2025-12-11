// =============================================================================
// SIDEBAR FUNCTIONALITY - UPDATED WITH PIN FEATURE
// =============================================================================

// Close sidebar on mobile after link click
function closeSidebarOnMobile() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (sidebar && window.innerWidth < 1024) {
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
        
        overlay.addEventListener('click', () => {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) {
                sidebar.classList.add('-translate-x-full');
                overlay.classList.add('hidden');
            }
        });
    }
    
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
    const sidebarLinks = document.querySelectorAll('#sidebar nav a');
    
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
    
    if (sidebarLinks[2]) {
        sidebarLinks[2].addEventListener('click', (e) => {
            updateSidebarActiveState(e.currentTarget);
            closeSidebarOnMobile();
        });
    }
    
    if (sidebarLinks[3]) {
        sidebarLinks[3].addEventListener('click', (e) => {
            updateSidebarActiveState(e.currentTarget);
            closeSidebarOnMobile();
        });
    }
    
    for (let i = 4; i < sidebarLinks.length; i++) {
        if (sidebarLinks[i]) {
            sidebarLinks[i].addEventListener('click', () => {
                closeSidebarOnMobile();
            });
        }
    }
    
    const signOutBtn = document.getElementById('sign-out-btn');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', () => {
            if (typeof handleSignOut === 'function') {
                handleSignOut();
            }
            closeSidebarOnMobile();
        });
    }
    
    setupSidebarOverlay();
}

// Update sidebar active state
function updateSidebarActiveState(activeElement) {
    const navLinks = document.querySelectorAll('#sidebar nav a');
    navLinks.forEach((link, index) => {
        if (index < 4) {
            link.classList.remove('bg-gradient-to-r', 'from-indigo-500', 'to-purple-600', 'text-white');
            link.classList.add('text-gray-700', 'dark:text-gray-300');
        }
    });
    
    if (activeElement) {
        activeElement.classList.add('bg-gradient-to-r', 'from-indigo-500', 'to-purple-600', 'text-white');
        activeElement.classList.remove('text-gray-700', 'dark:text-gray-300');
    }
}

// Update sidebar statistics
function updateSidebarStats() {
    if (typeof allStudents === 'undefined') return;
    
    const total = allStudents.length;
    const withPdf = allStudents.filter(s => s.hasPdf === true).length;
    const withoutPdf = allStudents.filter(s => s.hasPdf === false).length;
    
    const totalCountEl = document.getElementById('sidebar-total-count');
    const withCountEl = document.getElementById('sidebar-with-count');
    const withoutCountEl = document.getElementById('sidebar-without-count');
    
    if (totalCountEl) totalCountEl.textContent = `${total} student${total !== 1 ? 's' : ''}`;
    if (withCountEl) withCountEl.textContent = `${withPdf} student${withPdf !== 1 ? 's' : ''}`;
    if (withoutCountEl) withoutCountEl.textContent = `${withoutPdf} student${withoutPdf !== 1 ? 's' : ''}`;
}

// Override the original updateStatistics
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

// Update user info in sidebar
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

// Quick Actions Toggle
function toggleQuickActions() {
    const content = document.getElementById('quick-actions-content');
    const icon = document.getElementById('quick-actions-icon');
    if (content) {
        content.classList.toggle('open');
    }
    if (icon) {
        icon.classList.toggle('rotate-180');
    }
}

// =============================================================================
// AUTO-HOVER WITH PIN FUNCTIONALITY
// =============================================================================

// Advanced Filters Hover + Pin
function setupFilterHover() {
    console.log('🔧 Setting up Filter hover...');
    const filterContainers = document.querySelectorAll('.glass-morph');
    let filterContainer = null;
    
    filterContainers.forEach(container => {
        if (container.textContent.includes('Advanced Filters')) {
            filterContainer = container;
        }
    });
    
    const content = document.getElementById('filter-content');
    const icon = document.getElementById('filter-icon');
    
    if (!filterContainer || !content) {
        console.error('❌ Filter container or content not found');
        return;
    }
    console.log('✅ Filter container found');
    
    let hoverTimeout;
    let isPinned = false;
    
    // Create pin button
    const pinButton = document.createElement('button');
    pinButton.className = 'pin-button ml-2 p-1 rounded transition-all duration-200';
    pinButton.innerHTML = '📌';
    pinButton.title = 'Pin to keep open';
    pinButton.style.opacity = '0.6';
    pinButton.style.backgroundColor = 'transparent';
    pinButton.style.fontSize = '16px';
    
    const toggleButton = filterContainer.querySelector('button');
    if (toggleButton) {
        toggleButton.appendChild(pinButton);
        console.log('✅ Pin button added to Advanced Filters');
    } else {
        console.error('❌ Toggle button not found');
    }
    
    pinButton.addEventListener('click', (e) => {
        e.stopPropagation();
        isPinned = !isPinned;
        console.log('📌 Filter pin clicked! isPinned:', isPinned);
        
        if (isPinned) {
            pinButton.style.opacity = '1';
            pinButton.style.backgroundColor = 'rgba(59, 130, 246, 0.3)'; // Blue background
            pinButton.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.5)';
            console.log('🔵 Applied pinned styles');
        } else {
            pinButton.style.opacity = '0.6';
            pinButton.style.backgroundColor = 'transparent';
            pinButton.style.boxShadow = 'none';
            console.log('⚪ Removed pinned styles');
        }
        
        pinButton.title = isPinned ? 'Unpin' : 'Pin to keep open';
        if (isPinned) {
            openFilters();
        }
    });
    
    const openFilters = () => {
        content.classList.add('open');
        icon?.classList.add('rotate-180');
    };
    
    const closeFilters = () => {
        if (!isPinned) {
            content.classList.remove('open');
            icon?.classList.remove('rotate-180');
        }
    };
    
    filterContainer.addEventListener('mouseenter', () => {
        clearTimeout(hoverTimeout);
        openFilters();
    });
    
    filterContainer.addEventListener('mouseleave', () => {
        hoverTimeout = setTimeout(closeFilters, 300);
    });
}

// Grade Statistics Hover + Pin
function setupGradeStatsHover() {
    const gradeStatsContainers = document.querySelectorAll('.glass-morph');
    let gradeStatsContainer = null;
    
    gradeStatsContainers.forEach(container => {
        if (container.textContent.includes('Grade Statistics')) {
            gradeStatsContainer = container;
        }
    });
    
    const content = document.getElementById('grade-stats-content');
    const icon = document.getElementById('grade-stats-toggle-icon');
    
    if (!gradeStatsContainer || !content) return;
    
    let hoverTimeout;
    let isPinned = false;
    
    // Create pin button
    const pinButton = document.createElement('button');
    pinButton.className = 'pin-button ml-2 p-1 rounded transition-all duration-200';
    pinButton.innerHTML = '📌';
    pinButton.title = 'Pin to keep open';
    pinButton.style.opacity = '0.6';
    pinButton.style.backgroundColor = 'transparent';
    
    const toggleButton = gradeStatsContainer.querySelector('button');
    if (toggleButton) {
        toggleButton.appendChild(pinButton);
    }
    
    pinButton.addEventListener('click', (e) => {
        e.stopPropagation();
        isPinned = !isPinned;
        
        if (isPinned) {
            pinButton.style.opacity = '1';
            pinButton.style.backgroundColor = 'rgba(168, 85, 247, 0.3)'; // Purple background
            pinButton.style.boxShadow = '0 0 0 2px rgba(168, 85, 247, 0.5)';
        } else {
            pinButton.style.opacity = '0.6';
            pinButton.style.backgroundColor = 'transparent';
            pinButton.style.boxShadow = 'none';
        }
        
        pinButton.title = isPinned ? 'Unpin' : 'Pin to keep open';
        if (isPinned) {
            openGradeStats();
        }
    });
    
    const openGradeStats = () => {
        content.classList.add('open');
        icon?.classList.add('rotate-180');
    };
    
    const closeGradeStats = () => {
        if (!isPinned) {
            content.classList.remove('open');
            icon?.classList.remove('rotate-180');
        }
    };
    
    gradeStatsContainer.addEventListener('mouseenter', () => {
        clearTimeout(hoverTimeout);
        openGradeStats();
    });
    
    gradeStatsContainer.addEventListener('mouseleave', () => {
        hoverTimeout = setTimeout(closeGradeStats, 300);
    });
}

// Quick Actions Hover + Pin
function setupQuickActionsHover() {
    const quickActionsContainers = document.querySelectorAll('.glass-morph');
    let quickActionsContainer = null;
    
    quickActionsContainers.forEach(container => {
        if (container.textContent.includes('Quick Actions')) {
            quickActionsContainer = container;
        }
    });
    
    const content = document.getElementById('quick-actions-content');
    const icon = document.getElementById('quick-actions-icon');
    
    if (!quickActionsContainer || !content) return;
    
    let hoverTimeout;
    let isPinned = false;
    
    // Create pin button
    const pinButton = document.createElement('button');
    pinButton.className = 'pin-button ml-2 p-1 rounded transition-all duration-200';
    pinButton.innerHTML = '📌';
    pinButton.title = 'Pin to keep open';
    pinButton.style.opacity = '0.6';
    pinButton.style.backgroundColor = 'transparent';
    
    const toggleButton = quickActionsContainer.querySelector('button');
    if (toggleButton) {
        toggleButton.appendChild(pinButton);
    }
    
    pinButton.addEventListener('click', (e) => {
        e.stopPropagation();
        isPinned = !isPinned;
        
        if (isPinned) {
            pinButton.style.opacity = '1';
            pinButton.style.backgroundColor = 'rgba(99, 102, 241, 0.3)'; // Indigo background
            pinButton.style.boxShadow = '0 0 0 2px rgba(99, 102, 241, 0.5)';
        } else {
            pinButton.style.opacity = '0.6';
            pinButton.style.backgroundColor = 'transparent';
            pinButton.style.boxShadow = 'none';
        }
        
        pinButton.title = isPinned ? 'Unpin' : 'Pin to keep open';
        if (isPinned) {
            openQuickActions();
        }
    });
    
    const openQuickActions = () => {
        content.classList.add('open');
        icon?.classList.add('rotate-180');
    };
    
    const closeQuickActions = () => {
        if (!isPinned) {
            content.classList.remove('open');
            icon?.classList.remove('rotate-180');
        }
    };
    
    quickActionsContainer.addEventListener('mouseenter', () => {
        clearTimeout(hoverTimeout);
        openQuickActions();
    });
    
    quickActionsContainer.addEventListener('mouseleave', () => {
        hoverTimeout = setTimeout(closeQuickActions, 300);
    });
}

// =============================================================================
// INITIALIZATION
// =============================================================================

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
        
        if (window.innerWidth >= 1024) return;
        if (!sidebar || sidebar.classList.contains('-translate-x-full')) return;
        
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

// Initialize everything when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeSidebar();
        updateSidebarUserInfo();
        setupOutsideClickHandler();
        setupFilterHover();
        setupGradeStatsHover();
        setupQuickActionsHover();
    });
} else {
    initializeSidebar();
    updateSidebarUserInfo();
    setupOutsideClickHandler();
    setupFilterHover();
    setupGradeStatsHover();
    setupQuickActionsHover();
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
window.toggleQuickActions = toggleQuickActions;
window.setupFilterHover = setupFilterHover;
window.setupGradeStatsHover = setupGradeStatsHover;
window.setupQuickActionsHover = setupQuickActionsHover;