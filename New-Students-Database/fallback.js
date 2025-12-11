// =============================================================================
// REFRESH DATA FUNCTIONALITY
// =============================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";




function refreshData() {
    if (!realtimeListenerActive) {
        showToast('Please sign in to refresh data', 'warning');
        return;
    }
    
    showToast('Refreshing data...', 'info');
    
    // Clear cache
    pdfExistenceCache.clear();
    
    // Reset background check
    backgroundCheckRunning = false;
    
    // Mark all students as unchecked
    allStudents.forEach(student => {
        student.hasPdf = undefined;
    });
    
    // Re-render
    applyFiltersAndRender();
    
    // Start background check
    setTimeout(() => {
        startBackgroundPdfCheck();
        showToast('Data refreshed successfully', 'success');
    }, 500);
}

window.refreshData = refreshData;

// =============================================================================
// BULK ACTIONS
// =============================================================================

function selectAllStudents() {
    const checkboxes = document.querySelectorAll('.student-checkbox');
    const selectAllCheckbox = document.getElementById('select-all-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
    });
    
    updateBulkActionButtons();
}

function updateBulkActionButtons() {
    const selectedCount = document.querySelectorAll('.student-checkbox:checked').length;
    const bulkActionsDiv = document.getElementById('bulk-actions');
    
    if (bulkActionsDiv) {
        if (selectedCount > 0) {
            bulkActionsDiv.classList.remove('hidden');
            const countSpan = document.getElementById('selected-count');
            if (countSpan) {
                countSpan.textContent = selectedCount;
            }
        } else {
            bulkActionsDiv.classList.add('hidden');
        }
    }
}

window.selectAllStudents = selectAllStudents;

// =============================================================================
// OFFLINE DETECTION
// =============================================================================

function setupOfflineDetection() {
    window.addEventListener('online', () => {
        showToast('Connection restored', 'success');
        if (realtimeListenerActive) {
            refreshData();
        }
    });
    
    window.addEventListener('offline', () => {
        showToast('No internet connection', 'error');
    });
}

// =============================================================================
// ADVANCED FILTERS
// =============================================================================

function applyAdvancedFilters(filters) {
    filteredStudents = allStudents.filter(student => {
        let matches = true;
        
        // Search term
        if (filters.searchTerm) {
            const name = (student.name || '').toLowerCase();
            const assessmentNo = (student.assessmentNo || '').toLowerCase();
            const term = filters.searchTerm.toLowerCase();
            matches = matches && (name.includes(term) || assessmentNo.includes(term));
        }
        
        // PDF filter
        if (filters.pdfStatus !== 'all') {
            if (filters.pdfStatus === 'with-pdf') {
                matches = matches && student.hasPdf === true;
            } else if (filters.pdfStatus === 'without-pdf') {
                matches = matches && student.hasPdf === false;
            } else if (filters.pdfStatus === 'unchecked') {
                matches = matches && student.hasPdf === undefined;
            }
        }
        
        // Grade filter
        if (filters.grade !== 'all') {
            matches = matches && student.grade === filters.grade;
        }
        
        return matches;
    });
    
    currentPage = 1;
    renderStudents();
}

// =============================================================================
// PERFORMANCE MONITORING
// =============================================================================

let performanceMetrics = {
    pageLoadTime: 0,
    pdfCheckTime: 0,
    renderTime: 0
};

function measurePerformance(label, callback) {
    const start = performance.now();
    const result = callback();
    const end = performance.now();
    const duration = end - start;
    
    performanceMetrics[label] = duration;
    console.log(`${label}: ${duration.toFixed(2)}ms`);
    
    return result;
}

function getPerformanceReport() {
    console.table(performanceMetrics);
    return performanceMetrics;
}

window.getPerformanceReport = getPerformanceReport;

// =============================================================================
// DATA VALIDATION
// =============================================================================

function validateStudentData(student) {
    const errors = [];
    
    if (!student.name || student.name.trim() === '') {
        errors.push('Student name is required');
    }
    
    if (!student.assessmentNo || student.assessmentNo.trim() === '') {
        errors.push('Assessment number is required');
    }
    
    if (!student.grade) {
        errors.push('Grade is required');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

// =============================================================================
// THEME TOGGLE (DARK MODE)
// =============================================================================

function toggleTheme() {
    const currentTheme = localStorage.getItem('theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', newTheme);
    
    showToast(`Switched to ${newTheme} mode`, 'info');
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
    }
}

window.toggleTheme = toggleTheme;

// =============================================================================
// ENHANCED ERROR HANDLING
// =============================================================================

window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    
    // Don't show toast for minor errors
    if (event.error && event.error.message) {
        const message = event.error.message;
        if (!message.includes('ResizeObserver') && !message.includes('Script error')) {
            showToast('An error occurred. Please refresh the page.', 'error');
        }
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    showToast('An error occurred. Please try again.', 'error');
});

// =============================================================================
// STUDENT DETAILS MODAL
// =============================================================================

function showStudentDetails(student) {
    const modalTitle = getElement('modal-title');
    const modalMessage = getElement('modal-message');
    const modalBackdrop = getElement('modal-backdrop');
    
    if (!modalTitle || !modalMessage || !modalBackdrop) return;
    
    modalTitle.textContent = 'Student Details';
    
    const pdfStatusText = student.hasPdf === true ? 'Available' : 
                         student.hasPdf === false ? 'Not Available' : 
                         'Unknown';
    const pdfStatusColor = student.hasPdf === true ? 'text-green-600' : 
                           student.hasPdf === false ? 'text-red-600' : 
                           'text-gray-600';
    
    modalMessage.innerHTML = `
        <div class="space-y-4 text-left">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <p class="text-sm font-semibold text-gray-500">Name</p>
                    <p class="text-lg font-medium">${escapeHtml(student.name || 'N/A')}</p>
                </div>
                <div>
                    <p class="text-sm font-semibold text-gray-500">Assessment No</p>
                    <p class="text-lg font-medium">${escapeHtml(student.assessmentNo || 'N/A')}</p>
                </div>
                <div>
                    <p class="text-sm font-semibold text-gray-500">UPI</p>
                    <p class="text-lg font-medium">${escapeHtml(student.upi || 'N/A')}</p>
                </div>
                <div>
                    <p class="text-sm font-semibold text-gray-500">Grade</p>
                    <p class="text-lg font-medium">${escapeHtml(student.grade || 'N/A')}</p>
                </div>
                <div class="col-span-2">
                    <p class="text-sm font-semibold text-gray-500">Birth Certificate Status</p>
                    <p class="text-lg font-medium ${pdfStatusColor}">${pdfStatusText}</p>
                </div>
            </div>
            ${student.hasPdf === true ? `
                <button onclick="openLocalPDF('${escapeHtml(student.name).replace(/'/g, "\\'")}', '${escapeHtml(student.grade).replace(/'/g, "\\'")}'); document.getElementById('modal-backdrop').classList.add('hidden');"
                        class="w-full mt-4 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors">
                    View Birth Certificate
                </button>
            ` : ''}
        </div>
    `;
    
    modalBackdrop.classList.remove('hidden');
    modalBackdrop.classList.add('flex');
}

window.showStudentDetails = showStudentDetails;

// =============================================================================
// ANALYTICS AND INSIGHTS
// =============================================================================

function generateInsights() {
    const insights = [];
    
    const checkedStudents = allStudents.filter(s => s.hasPdf !== undefined);
    const withPdf = allStudents.filter(s => s.hasPdf === true).length;
    const withoutPdf = allStudents.filter(s => s.hasPdf === false).length;
    const total = allStudents.length;
    
    if (checkedStudents.length === total) {
        const percentage = ((withPdf / total) * 100).toFixed(1);
        insights.push({
            type: 'info',
            message: `${percentage}% of students have birth certificates on file`
        });
    }
    
    if (withoutPdf > 0) {
        insights.push({
            type: 'warning',
            message: `${withoutPdf} student${withoutPdf > 1 ? 's' : ''} missing birth certificates`
        });
    }
    
    // Grade-specific insights
    const gradeData = {};
    allStudents.forEach(s => {
        if (!gradeData[s.grade]) {
            gradeData[s.grade] = { total: 0, withPdf: 0 };
        }
        gradeData[s.grade].total++;
        if (s.hasPdf === true) gradeData[s.grade].withPdf++;
    });
    
    let lowestGrade = null;
    let lowestPercentage = 100;
    
    Object.entries(gradeData).forEach(([grade, data]) => {
        const percentage = (data.withPdf / data.total) * 100;
        if (percentage < lowestPercentage && grade !== 'N/A') {
            lowestPercentage = percentage;
            lowestGrade = grade;
        }
    });
    
    if (lowestGrade && lowestPercentage < 80) {
        insights.push({
            type: 'warning',
            message: `${lowestGrade} has the lowest certificate completion rate (${lowestPercentage.toFixed(1)}%)`
        });
    }
    
    return insights;
}

function displayInsights() {
    const insights = generateInsights();
    const insightsContainer = document.getElementById('insights-container');
    
    if (!insightsContainer || insights.length === 0) return;
    
    insightsContainer.innerHTML = insights.map(insight => {
        const colors = {
            info: 'bg-blue-50 border-blue-200 text-blue-800',
            warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
            success: 'bg-green-50 border-green-200 text-green-800'
        };
        
        return `
            <div class="p-3 rounded-md border ${colors[insight.type]} text-sm">
                ${escapeHtml(insight.message)}
            </div>
        `;
    }).join('');
}

// =============================================================================
// INITIALIZE ON DOM READY
// =============================================================================import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signOut,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// Global variables provided by the environment
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

// Custom config from user prompt
const customFirebaseConfig = {
    apiKey: "AIzaSyA_41WpdMjHJOU5s3gQ9aieIayZRvUoRLE",
    authDomain: "kanyadet-school-admin.firebaseapp.com",
    projectId: "kanyadet-school-admin",
    databaseURL: "https://kanyadet-school-admin-default-rtdb.firebaseio.com",
    storageBucket: "kanyadet-school-admin.firebasestorage.app",
    messagingSenderId: "409708360032",
    appId: "1:409708360032:web:a21d63e8cb5fa1ecabee05",
    measurementId: "G-Y4C0ZRRL52"
};

// Merge provided config with user's custom config
const mergedConfig = { ...customFirebaseConfig, ...firebaseConfig };

// Initialize Firebase
const app = initializeApp(mergedConfig);
const auth = getAuth(app);
const db = getDatabase(app);

let userId = 'anonymous';

// Sanitize the appId to remove invalid characters for database paths
const sanitizedAppId = appId.replace(/[.#$[\]]/g, '_');

// Global variables for filtering and pagination
let allStudents = [];
let currentFilter = 'all';
let currentSearchTerm = '';
let currentGrade = 'all';
let filteredStudents = [];
let currentPage = 1;
let itemsPerPage = 10;
let backgroundCheckRunning = false;
let realtimeListenerActive = false;
let currentSortField = 'name';
let currentSortOrder = 'asc';

// PDF existence cache to avoid redundant checks - OPTIMIZATION
const pdfExistenceCache = new Map();

// Export/Import functionality
let exportInProgress = false;

// Grade list
const grades = [
    "Grade 1", "Grade 2", "Grade 3", 
    "Grade 4", "Grade 5", "Grade 6", 
    "Grade 7", "Grade 8", "Grade 9"
];

// DOM elements - with safe initialization
const getElement = (id) => {
    const element = document.getElementById(id);
    if (!element) console.warn(`Element with id '${id}' not found`);
    return element;
};

const userIdEl = getElement('user-id');
const pdfModalBackdrop = getElement('pdf-modal-backdrop');
const pdfModalCloseBtn = getElement('pdf-modal-close-btn');
const pdfIframe = getElement('pdf-iframe');
const itemsPerPageSelect = getElement('items-per-page');
const authContainer = getElement('auth-container');
const mainAppContainer = getElement('main-app-container');
const authForm = getElement('auth-form');
const emailInput = getElement('email');
const passwordInput = getElement('password');
const signinBtn = getElement('signin-btn');
const signupLink = getElement('signup-link');
const searchInput = getElement('search-input');
const searchTypeSelect = getElement('search-type');
const liveFilterInput = getElement('live-filter');
const studentListDiv = getElement('student-list');
const paginationControls = getElement('pagination-controls');
const prevPageBtn = getElement('prev-page');
const nextPageBtn = getElement('next-page');
const pageNumbersDiv = getElement('page-numbers');
const gradeFilterSelect = getElement('grade-filter');
const gradeStatsContainer = getElement('grade-stats-container');
const studentTableBody = getElement('student-table-body');
const noStudentsMessage = getElement('no-students-message');

// =============================================================================
// DEBOUNCE UTILITY
// =============================================================================

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// =============================================================================
// ADVANCED SEARCH WITH DEBOUNCE
// =============================================================================

const debouncedSearch = debounce(() => {
    applyFiltersAndRender();
}, 300);

function handleAdvancedSearch(e) {
    currentSearchTerm = e.target.value;
    debouncedSearch();
}

// Update live filter to use debounced search
if (liveFilterInput) {
    liveFilterInput.removeEventListener('input', () => {});
    liveFilterInput.addEventListener('input', handleAdvancedSearch);
}

// =============================================================================
// LOCAL STORAGE FOR USER PREFERENCES
// =============================================================================

function savePreferences() {
    try {
        const prefs = {
            itemsPerPage,
            currentFilter,
            currentGrade,
            currentSortField,
            currentSortOrder
        };
        localStorage.setItem('studentAppPreferences', JSON.stringify(prefs));
    } catch (e) {
        console.warn('Could not save preferences:', e);
    }
}

function loadPreferences() {
    try {
        const saved = localStorage.getItem('studentAppPreferences');
        if (saved) {
            const prefs = JSON.parse(saved);
            itemsPerPage = prefs.itemsPerPage || 10;
            currentFilter = prefs.currentFilter || 'all';
            currentGrade = prefs.currentGrade || 'all';
            currentSortField = prefs.currentSortField || 'name';
            currentSortOrder = prefs.currentSortOrder || 'asc';
            
            // Update UI elements
            if (itemsPerPageSelect) itemsPerPageSelect.value = itemsPerPage;
            if (gradeFilterSelect) gradeFilterSelect.value = currentGrade;
            
            // Set active filter button
            const filterBtn = document.getElementById(`show-${currentFilter}`);
            if (filterBtn) {
                document.querySelectorAll('.filter-btn').forEach(b => {
                    b.classList.remove('active', 'bg-blue-500', 'text-white');
                    b.classList.add('bg-gray-200', 'text-gray-700');
                });
                filterBtn.classList.add('active', 'bg-blue-500', 'text-white');
            }
        }
    } catch (e) {
        console.warn('Could not load preferences:', e);
    }
}

// Save preferences when they change
function watchPreferences() {
    if (itemsPerPageSelect) {
        itemsPerPageSelect.addEventListener('change', savePreferences);
    }
    if (gradeFilterSelect) {
        gradeFilterSelect.addEventListener('change', savePreferences);
    }
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', savePreferences);
    });
}

// =============================================================================
// TOAST NOTIFICATIONS
// =============================================================================

function showToast(message, type = 'info') {
    const toastContainer = document.getElement('toast-container') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast-notification transform transition-all duration-300 translate-x-full`;
    
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    };
    
    const icons = {
        success: '✓',
        error: '✗',
        warning: '⚠',
        info: 'ℹ'
    };
    
    toast.innerHTML = `
        <div class="${colors[type]} text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
            <span class="text-xl">${icons[type]}</span>
            <span>${escapeHtml(message)}</span>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
        toast.classList.remove('translate-x-full');
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300);
    }, 3000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed top-4 right-4 z-50 space-y-2';
    document.body.appendChild(container);
    return container;
}

// =============================================================================
// PRINT FUNCTIONALITY
// =============================================================================

function printStudentList() {
    const printWindow = window.open('', '', 'height=600,width=800');
    
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Student List</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #333; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #4A5568; color: white; }
                tr:nth-child(even) { background-color: #f2f2f2; }
                .has-pdf { color: green; font-weight: bold; }
                .no-pdf { color: red; font-weight: bold; }
                @media print {
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <h1>Student List Report</h1>
            <p>Generated: ${new Date().toLocaleString()}</p>
            <p>Total Students: ${filteredStudents.length}</p>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Assessment No</th>
                        <th>UPI</th>
                        <th>Grade</th>
                        <th>PDF Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredStudents.map((student, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${escapeHtml(student.name || '')}</td>
                            <td>${escapeHtml(student.assessmentNo || '')}</td>
                            <td>${escapeHtml(student.upi || 'N/A')}</td>
                            <td>${escapeHtml(student.grade || 'N/A')}</td>
                            <td class="${student.hasPdf ? 'has-pdf' : 'no-pdf'}">
                                ${student.hasPdf === true ? 'Has PDF' : student.hasPdf === false ? 'No PDF' : 'Unknown'}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <button class="no-print" onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; background: #4A5568; color: white; border: none; border-radius: 5px; cursor: pointer;">
                Print
            </button>
        </body>
        </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
}

window.printStudentList = printStudentList;

// =============================================================================
// KEYBOARD SHORTCUTS
// =============================================================================

function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + K: Focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (liveFilterInput) {
            liveFilterInput.focus();
        }
    }
    
    // Ctrl/Cmd + E: Export data
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        handleExport();
    }
    
    // Arrow keys for pagination
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        if (e.key === 'ArrowLeft') {
            if (currentPage > 1) {
                currentPage--;
                renderStudents();
            }
        } else if (e.key === 'ArrowRight') {
            const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderStudents();
            }
        }
    }
}

// =============================================================================
// EXPORT FUNCTIONALITY
// =============================================================================

window.handleExport = handleExportEnhanced;

function showExportModal(options) {
    const modalBackdrop = getElement('modal-backdrop');
    const modalTitle = getElement('modal-title');
    const modalMessage = getElement('modal-message');
    
    if (!modalBackdrop || !modalTitle || !modalMessage) return;
    
    modalTitle.textContent = 'Export Data';
    
    let optionsHtml = '<div class="space-y-2 mt-4">';
    options.forEach((option, index) => {
        optionsHtml += `
            <button onclick="executeExport('${option.value}')" 
                    class="w-full px-4 py-3 text-left bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded-md transition-colors">
                <span class="font-medium text-gray-800">${option.label}</span>
            </button>
        `;
    });
    optionsHtml += '</div>';
    
    modalMessage.innerHTML = optionsHtml;
    modalBackdrop.classList.remove('hidden');
    modalBackdrop.classList.add('flex');
}

window.executeExport = function(exportType) {
    const modalBackdrop = getElement('modal-backdrop');
    if (modalBackdrop) {
        modalBackdrop.classList.add('hidden');
    }
    
    exportInProgress = true;
    
    setTimeout(() => {
        try {
            switch(exportType) {
                case 'current-csv':
                    exportToCSV(filteredStudents, 'students_current_view');
                    break;
                case 'all-csv':
                    exportToCSV(allStudents, 'students_all');
                    break;
                case 'no-pdf-csv':
                    const noPdfStudents = allStudents.filter(s => s.hasPdf === false);
                    exportToCSV(noPdfStudents, 'students_without_pdf');
                    break;
                case 'stats-json':
                    exportStatistics();
                    break;
            }
            showModal('Success', 'Data exported successfully!');
        } catch (error) {
            console.error('Export error:', error);
            showModal('Export Error', 'Failed to export data. Please try again.');
        } finally {
            exportInProgress = false;
        }
    }, 100);
};

function exportToCSV(data, filename) {
    const headers = ['Name', 'Assessment No', 'UPI', 'Grade', 'Has PDF'];
    const csvContent = [
        headers.join(','),
        ...data.map(student => [
            `"${(student.name || '').replace(/"/g, '""')}"`,
            `"${(student.assessmentNo || '').replace(/"/g, '""')}"`,
            `"${(student.upi || '').replace(/"/g, '""')}"`,
            `"${(student.grade || '').replace(/"/g, '""')}"`,
            student.hasPdf === true ? 'Yes' : student.hasPdf === false ? 'No' : 'Unknown'
        ].join(','))
    ].join('\n');
    
    downloadFile(csvContent, `${filename}_${getTimestamp()}.csv`, 'text/csv');
}

function exportStatistics() {
    const stats = {
        exportDate: new Date().toISOString(),
        totalStudents: allStudents.length,
        checkedStudents: allStudents.filter(s => s.hasPdf !== undefined).length,
        withPDF: allStudents.filter(s => s.hasPdf === true).length,
        withoutPDF: allStudents.filter(s => s.hasPdf === false).length,
        unchecked: allStudents.filter(s => s.hasPdf === undefined).length,
        gradeBreakdown: {}
    };
    
    // Grade breakdown
    grades.forEach(grade => {
        const gradeStudents = allStudents.filter(s => s.grade === grade);
        stats.gradeBreakdown[grade] = {
            total: gradeStudents.length,
            withPDF: gradeStudents.filter(s => s.hasPdf === true).length,
            withoutPDF: gradeStudents.filter(s => s.hasPdf === false).length
        };
    });
    
    const jsonContent = JSON.stringify(stats, null, 2);
    downloadFile(jsonContent, `statistics_${getTimestamp()}.json`, 'application/json');
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function getTimestamp() {
    const now = new Date();
    return now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
}

// =============================================================================
// BULK PDF CHECK
// =============================================================================

function handleBulkCheck() {
    if (backgroundCheckRunning) {
        showModal('Already Running', 'PDF check is already in progress.');
        return;
    }
    
    const uncheckedCount = allStudents.filter(s => s.hasPdf === undefined).length;
    
    if (uncheckedCount === 0) {
        showModal('All Checked', 'All student PDFs have already been checked.');
        return;
    }
    
    showModal('Bulk Check Started', `Checking PDFs for ${uncheckedCount} students. This will run in the background.`);
    startBackgroundPdfCheck();
}

// =============================================================================
// SORTING FUNCTIONALITY
// =============================================================================

function sortStudents(field) {
    if (currentSortField === field) {
        // Toggle sort order
        currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortField = field;
        currentSortOrder = 'asc';
    }
    
    filteredStudents.sort((a, b) => {
        let valueA, valueB;
        
        switch(field) {
            case 'name':
                valueA = (a.name || '').toLowerCase();
                valueB = (b.name || '').toLowerCase();
                break;
            case 'assessmentNo':
                valueA = a.assessmentNo || '';
                valueB = b.assessmentNo || '';
                break;
            case 'grade':
                valueA = a.grade || 'ZZZ';
                valueB = b.grade || 'ZZZ';
                break;
            case 'pdf':
                valueA = a.hasPdf === true ? 2 : a.hasPdf === false ? 0 : 1;
                valueB = b.hasPdf === true ? 2 : b.hasPdf === false ? 0 : 1;
                break;
            default:
                return 0;
        }
        
        if (valueA < valueB) return currentSortOrder === 'asc' ? -1 : 1;
        if (valueA > valueB) return currentSortOrder === 'asc' ? 1 : -1;
        return 0;
    });
    
    currentPage = 1;
    renderStudents();
    updateSortIndicators();
}

function updateSortIndicators() {
    // Remove all sort indicators
    document.querySelectorAll('.sort-indicator').forEach(el => {
        el.textContent = '';
    });
    
    // Add current sort indicator
    const indicator = document.querySelector(`[data-sort="${currentSortField}"] .sort-indicator`);
    if (indicator) {
        indicator.textContent = currentSortOrder === 'asc' ? ' ▲' : ' ▼';
    }
}

window.sortStudents = sortStudents;

// =============================================================================
// PDF MODAL FUNCTIONS
// =============================================================================

window.openLocalPDF = function(studentName, studentGrade) {
    if (!pdfIframe || !pdfModalBackdrop) {
        console.error('PDF modal elements not found');
        return;
    }

    // Sanitize inputs to prevent XSS
    const safeName = String(studentName).replace(/[^a-zA-Z0-9\s-_]/g, '');
    const safeGrade = String(studentGrade).replace(/[^a-zA-Z0-9\s]/g, '');
    
    const pdfPathUppercase = `./birth_certificates/${safeGrade}/${safeName}.PDF`;
    const pdfPathLowercase = `./birth_certificates/${safeGrade}/${safeName}.pdf`;
   
    // Set default to uppercase first
    pdfIframe.src = pdfPathUppercase;
    
    // Fallback to lowercase if uppercase fails
    pdfIframe.onerror = function() {
        if (pdfIframe.src.endsWith('.PDF')) {
            pdfIframe.src = pdfPathLowercase;
        }
    };
   
    // Display the modal
    pdfModalBackdrop.classList.remove('hidden');
    pdfModalBackdrop.classList.add('flex');
   
    // Add outside click listener (one-time setup)
    if (!pdfModalBackdrop.dataset.outsideClickAdded) {
        pdfModalBackdrop.addEventListener('click', function(event) {
            if (event.target === pdfModalBackdrop) {
                closePDFModal();
            }
        });
        pdfModalBackdrop.dataset.outsideClickAdded = 'true';
    }
};

function closePDFModal() {
    if (!pdfModalBackdrop || !pdfIframe) return;
    
    pdfModalBackdrop.classList.remove('flex');
    pdfModalBackdrop.classList.add('hidden');
    pdfIframe.src = ''; // Stop loading
}

// =============================================================================
// EVENT LISTENERS SETUP
// =============================================================================

function initializeEventListeners() {
    // PDF Modal close button
    if (pdfModalCloseBtn) {
        pdfModalCloseBtn.addEventListener('click', closePDFModal);
    }

    // Grade filter
    if (gradeFilterSelect) {
        gradeFilterSelect.addEventListener('change', (e) => {
            currentGrade = e.target.value;
            applyFiltersAndRender();
        });
    }

    // Items per page
    if (itemsPerPageSelect) {
        itemsPerPageSelect.addEventListener('change', (e) => {
            itemsPerPage = parseInt(e.target.value, 10);
            currentPage = 1;
            applyFiltersAndRender();
        });
    }

    // Modal close button
    const modalCloseBtn = getElement('modal-close-btn');
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', () => {
            const modalBackdrop = getElement('modal-backdrop');
            if (modalBackdrop) {
                modalBackdrop.classList.add('hidden');
                modalBackdrop.classList.remove('flex');
            }
        });
    }

    // Sign up link toggle
    if (signupLink) {
        signupLink.addEventListener('click', handleSignupLinkClick);
    }

    // Auth form submission
    if (authForm) {
        authForm.addEventListener('submit', handleAuthFormSubmit);
    }

    // Sign out button
    const signOutBtn = getElement('sign-out-btn');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', handleSignOut);
    }

    // Search type select
    if (searchTypeSelect && searchInput) {
        searchTypeSelect.addEventListener('change', (event) => {
            const selectedType = event.target.value;
            searchInput.placeholder = selectedType === 'assessmentNo' 
                ? 'Enter Assessment No.' 
                : 'Enter Student Name';
        });
    }

    // Search button
    const searchBtn = getElement('search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }

    // Live filter input
    if (liveFilterInput) {
        liveFilterInput.addEventListener('input', (e) => {
            currentSearchTerm = e.target.value;
            applyFiltersAndRender();
        });
    }

    // Clear filter button
    const clearFilterBtn = getElement('clear-filter');
    if (clearFilterBtn && liveFilterInput) {
        clearFilterBtn.addEventListener('click', () => {
            liveFilterInput.value = '';
            currentSearchTerm = '';
            applyFiltersAndRender();
        });
    }

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', handleFilterButtonClick);
    });

    // Pagination buttons
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderStudents();
            }
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderStudents();
            }
        });
    }

    // Auto-clear on focus (FIXED - removed unnecessary handler)
    document.addEventListener('focus', function(e) {
        if (e.target.tagName === 'INPUT' && 
            (e.target.type === 'text' || e.target.type === 'search') &&
            e.target !== liveFilterInput && // Don't clear live filter
            e.target !== searchInput) { // Don't clear search input
            if (e.target.value) {
                e.target.value = '';
                e.target.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
    }, true);

    // Export button
    const exportBtn = getElement('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', handleExport);
    }

    // Bulk check PDFs button
    const bulkCheckBtn = getElement('bulk-check-btn');
    if (bulkCheckBtn) {
        bulkCheckBtn.addEventListener('click', handleBulkCheck);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// =============================================================================
// AUTH HANDLERS
// =============================================================================

let isSigningUp = false;

function handleSignupLinkClick(e) {
    e.preventDefault();
    isSigningUp = !isSigningUp;
    
    if (signinBtn && signupLink) {
        if (isSigningUp) {
            signinBtn.textContent = 'Sign Up';
            signupLink.textContent = 'Already have an account? Sign in here';
        } else {
            signinBtn.textContent = 'Sign In';
            signupLink.textContent = 'Don\'t have an account? Sign up here';
        }
    }
}

async function handleAuthFormSubmit(e) {
    e.preventDefault();
    
    if (!emailInput || !passwordInput) return;
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Basic validation
    if (!email || !password) {
        showModal("Validation Error", "Please enter both email and password.");
        return;
    }

    if (password.length < 6) {
        showModal("Validation Error", "Password must be at least 6 characters long.");
        return;
    }

    try {
        if (isSigningUp) {
            await createUserWithEmailAndPassword(auth, email, password);
            showModal("Success", "Account created successfully! You are now signed in.");
            isSigningUp = false;
            if (signinBtn) signinBtn.textContent = 'Sign In';
            if (signupLink) signupLink.textContent = 'Don\'t have an account? Sign up here';
        } else {
            await signInWithEmailAndPassword(auth, email, password);
            showModal("Success", "Signed in successfully!");
        }
        
        // Clear form
        emailInput.value = '';
        passwordInput.value = '';
    } catch (error) {
        console.error("Authentication failed:", error);
        const errorMessage = getFirebaseErrorMessage(error.code);
        showModal(isSigningUp ? "Sign Up Failed" : "Sign In Failed", errorMessage);
    }
}

async function handleSignOut() {
    try {
        await signOut(auth);
        // Clear data on sign out
        allStudents = [];
        filteredStudents = [];
        pdfExistenceCache.clear();
        realtimeListenerActive = false;
        backgroundCheckRunning = false;
    } catch (error) {
        console.error("Sign out failed:", error);
        showModal("Sign Out Error", "Failed to sign out. Please try again.");
    }
}

function getFirebaseErrorMessage(errorCode) {
    const errorMessages = {
        'auth/invalid-email': 'Invalid email address format.',
        'auth/user-disabled': 'This account has been disabled.',
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/email-already-in-use': 'An account already exists with this email.',
        'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
        'auth/network-request-failed': 'Network error. Please check your connection.',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later.'
    };
    return errorMessages[errorCode] || 'An error occurred. Please try again.';
}

// =============================================================================
// MODAL FUNCTIONS
// =============================================================================

function showModal(title, message) {
    const modalTitle = getElement('modal-title');
    const modalMessage = getElement('modal-message');
    const modalBackdrop = getElement('modal-backdrop');
    
    if (modalTitle) modalTitle.textContent = title;
    if (modalMessage) modalMessage.textContent = message;
    if (modalBackdrop) {
        modalBackdrop.classList.remove('hidden');
        modalBackdrop.classList.add('flex');
    }
}

// =============================================================================
// SEARCH AND FILTER HANDLERS
// =============================================================================

function handleSearch() {
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.trim();
    if (searchTerm) {
        currentSearchTerm = searchTerm;
        applyFiltersAndRender();
    } else {
        showModal("Validation Error", "Please enter a search term.");
    }
}

function handleFilterButtonClick(e) {
    // Get the button that was clicked
    const clickedButton = e.currentTarget;
    
    // Update active button styling
    document.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.remove('active', 'bg-gradient-to-r', 'from-indigo-500', 'to-purple-600', 'text-white');
        b.classList.add('bg-gray-200', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300');
    });

    clickedButton.classList.add('active', 'bg-gradient-to-r', 'from-indigo-500', 'to-purple-600', 'text-white');
    clickedButton.classList.remove('bg-gray-200', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300');

    // Extract filter type from button id
    currentFilter = clickedButton.id.replace('show-', '');
    
    // Reset search and grade filters when "all" is selected
    if (currentFilter === 'all') {
        if (liveFilterInput) liveFilterInput.value = '';
        if (gradeFilterSelect) gradeFilterSelect.value = 'all';
        currentSearchTerm = '';
        currentGrade = 'all';
    }
    
    currentPage = 1;
    applyFiltersAndRender();
}

// =============================================================================
// PDF CHECK FUNCTIONS
// =============================================================================

async function checkLocalPdfExists(studentName, studentGrade) {
    if (!studentName || !studentGrade) return false;
    
    const cacheKey = `${studentGrade}/${studentName}`;
    
    // Return cached result if available
    if (pdfExistenceCache.has(cacheKey)) {
        return pdfExistenceCache.get(cacheKey);
    }
    
    try {
        const basePath = `./birth_certificates/${studentGrade}/${studentName}`;
        
        // Try uppercase extension first
        let pdfPath = `${basePath}.PDF`;
        let response = await fetch(pdfPath, { method: 'HEAD' });
        
        // If uppercase doesn't exist, try lowercase
        if (!response.ok) {
            pdfPath = `${basePath}.pdf`;
            response = await fetch(pdfPath, { method: 'HEAD' });
        }
        
        const exists = response.ok;
        
        // Cache the result
        pdfExistenceCache.set(cacheKey, exists);
        
        return exists;
    } catch (e) {
        console.error(`Error checking PDF for ${studentName} (${studentGrade}):`, e);
        pdfExistenceCache.set(cacheKey, false);
        return false;
    }
}

async function checkPdfForVisibleStudents() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const studentsToCheck = filteredStudents.slice(start, end);
    
    // Find students that need PDF checks
    const studentsNeedingChecks = studentsToCheck.filter(s => s.hasPdf === undefined);
    
    if (studentsNeedingChecks.length === 0) return;
    
    // Check PDFs in parallel for visible students only
    const pdfChecks = studentsNeedingChecks.map(async (student) => {
        const hasPdf = await checkLocalPdfExists(student.name, student.grade);
        student.hasPdf = hasPdf;
        return student;
    });
    
    await Promise.all(pdfChecks);
    
    // Re-render to update PDF status
    renderStudents();
}

// =============================================================================
// BACKGROUND PDF CHECKING
// =============================================================================

function startBackgroundPdfCheck() {
    if (backgroundCheckRunning) return; // Prevent multiple instances
    
    backgroundCheckRunning = true;
    const batchSize = 10;
    let currentIndex = 0;
    
    async function checkNextBatch() {
        if (!backgroundCheckRunning || currentIndex >= allStudents.length) {
            backgroundCheckRunning = false;
            return;
        }
        
        const batch = allStudents.slice(currentIndex, currentIndex + batchSize);
        const unchecked = batch.filter(s => s.hasPdf === undefined);
        
        if (unchecked.length > 0) {
            try {
                await Promise.all(unchecked.map(async (student) => {
                    student.hasPdf = await checkLocalPdfExists(student.name, student.grade);
                }));
                
                // Update statistics and visible rows if needed
                updateStatistics();
                
                // Update visible rows if they're in current batch
                const visibleStart = (currentPage - 1) * itemsPerPage;
                const visibleEnd = visibleStart + itemsPerPage;
                const batchStart = currentIndex;
                const batchEnd = currentIndex + batchSize;
                
                if (batchStart < visibleEnd && batchEnd > visibleStart) {
                    renderStudents();
                }
            } catch (error) {
                console.error('Error in background PDF check:', error);
            }
        }
        
        currentIndex += batchSize;
        
        // Continue checking in background
        if (currentIndex < allStudents.length && backgroundCheckRunning) {
            setTimeout(checkNextBatch, 100);
        } else {
            backgroundCheckRunning = false;
        }
    }
    
    checkNextBatch();
}

// =============================================================================
// RENDERING FUNCTIONS
// =============================================================================

function highlightText(text, searchTerm) {
    if (!searchTerm || !text) return text;
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function renderStudents() {
    if (!studentTableBody) return;
    
    studentTableBody.innerHTML = '';
    
    if (noStudentsMessage) {
        noStudentsMessage.classList.add('hidden');
    }

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const studentsToDisplay = filteredStudents.slice(start, end);

    if (studentsToDisplay.length === 0) {
        if (noStudentsMessage) {
            noStudentsMessage.classList.remove('hidden');
        }
        if (paginationControls) {
            paginationControls.classList.add('hidden');
        }
        return;
    }

    studentsToDisplay.forEach((student, index) => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-100 transition-colors duration-200';
        
        // Add alternating row colors
        if (index % 2 === 0) {
            row.classList.add('bg-gray-50');
        }

        // Determine PDF status display
        let pdfStatus, pdfIcon;
        if (student.hasPdf === undefined) {
            pdfStatus = '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-500">Checking...</span>';
            pdfIcon = '⏳';
        } else if (student.hasPdf) {
            pdfStatus = '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Has PDF</span>';
            pdfIcon = '✓';
        } else {
            pdfStatus = '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">No PDF</span>';
            pdfIcon = '✗';
        }

        const viewButtonDisabled = student.hasPdf !== true;

        // Escape and sanitize data
        const safeName = escapeHtml(student.name || '');
        const safeAssessmentNo = escapeHtml(student.assessmentNo || '');
        const safeUpi = escapeHtml(student.upi || 'N/A');
        const safeGrade = escapeHtml(student.grade || 'N/A');
        
        // Calculate row number
        const rowNumber = start + index + 1;

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${rowNumber}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${highlightText(safeName, currentSearchTerm)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${highlightText(safeAssessmentNo, currentSearchTerm)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${safeUpi}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${safeGrade}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span class="mr-2">${pdfIcon}</span>${pdfStatus}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="openLocalPDF('${safeName.replace(/'/g, "\\'")}', '${safeGrade.replace(/'/g, "\\'")}')"
                    class="px-4 py-2 text-white font-semibold rounded-md shadow-md transition-all duration-200 ${student.hasPdf === true
                        ? 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5'
                        : 'bg-gray-400 cursor-not-allowed'}"
                    ${viewButtonDisabled ? 'disabled' : ''}
                    aria-label="View PDF for ${safeName}">
                    <span class="flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                        View
                    </span>
                </button>
            </td>
        `;
        studentTableBody.appendChild(row);
    });

    updatePaginationControls();
    updateStatistics();
    
    // Check PDFs for visible students after rendering
    checkPdfForVisibleStudents();
}

function updatePaginationControls() {
    if (!pageNumbersDiv || !paginationControls) return;
    
    pageNumbersDiv.innerHTML = '';
    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

    if (totalPages > 1) {
        paginationControls.classList.remove('hidden');
        
        if (prevPageBtn) prevPageBtn.disabled = currentPage === 1;
        if (nextPageBtn) nextPageBtn.disabled = currentPage === totalPages;

        // Show max 10 page buttons with ellipsis for large page counts
        const maxButtons = 10;
        let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxButtons - 1);
        
        if (endPage - startPage < maxButtons - 1) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }

        // First page button
        if (startPage > 1) {
            addPageButton(1);
            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.className = 'px-2 text-gray-500';
                pageNumbersDiv.appendChild(ellipsis);
            }
        }

        // Page buttons
        for (let i = startPage; i <= endPage; i++) {
            addPageButton(i);
        }

        // Last page button
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.className = 'px-2 text-gray-500';
                pageNumbersDiv.appendChild(ellipsis);
            }
            addPageButton(totalPages);
        }
    } else {
        paginationControls.classList.add('hidden');
    }
}

function addPageButton(pageNum) {
    const pageButton = document.createElement('button');
    pageButton.textContent = pageNum;
    pageButton.className = `px-3 py-1 text-sm font-medium rounded-md transition-colors ${
        pageNum === currentPage 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
    }`;
    pageButton.addEventListener('click', () => {
        currentPage = pageNum;
        renderStudents();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    pageNumbersDiv.appendChild(pageButton);
}

// =============================================================================
// STATISTICS FUNCTIONS
// =============================================================================

function createProgressNote() {
    const note = document.createElement('p');
    note.id = 'progress-note';
    note.className = 'text-sm text-gray-500 mt-2 animate-pulse';
    const totalCountEl = getElement('total-count');
    if (totalCountEl && totalCountEl.parentElement) {
        totalCountEl.parentElement.appendChild(note);
    }
    return note;
}

function updateStatistics() {
    const total = allStudents.length;
    const checkedStudents = allStudents.filter(s => s.hasPdf !== undefined);
    const withPdfCount = checkedStudents.filter(s => s.hasPdf === true).length;
    const withoutPdfCount = checkedStudents.filter(s => s.hasPdf === false).length;
    const uncheckedCount = total - checkedStudents.length;
    
    const withPdfPercentage = checkedStudents.length > 0 
        ? ((withPdfCount / checkedStudents.length) * 100).toFixed(2) 
        : '0.00';
    const withoutPdfPercentage = checkedStudents.length > 0 
        ? ((withoutPdfCount / checkedStudents.length) * 100).toFixed(2) 
        : '0.00';

    const totalCountEl = getElement('total-count');
    const pdfCountEl = getElement('pdf-count');
    const noPdfCountEl = getElement('no-pdf-count');
    const filteredCountEl = getElement('filtered-count');

    if (totalCountEl) totalCountEl.textContent = total;
    if (pdfCountEl) pdfCountEl.textContent = `${withPdfCount} (${withPdfPercentage}%)`;
    if (noPdfCountEl) noPdfCountEl.textContent = `${withoutPdfCount} (${withoutPdfPercentage}%)`;
    if (filteredCountEl) filteredCountEl.textContent = filteredStudents.length;

    // Progress indicator
    let progressNote = getElement('progress-note');
    if (uncheckedCount > 0) {
        if (!progressNote) {
            progressNote = createProgressNote();
        }
        if (progressNote) {
            const percentage = ((checkedStudents.length / total) * 100).toFixed(0);
            progressNote.textContent = `Checking PDFs... ${checkedStudents.length}/${total} (${percentage}%)`;
        }
    } else {
        if (progressNote) progressNote.remove();
    }

    // Grade-specific statistics
    updateGradeStatistics(checkedStudents);
}

function updateGradeStatistics(checkedStudents) {
    if (!gradeStatsContainer) return;
    
    const gradeStats = {};
    
    checkedStudents.forEach(student => {
        const grade = student.grade || 'N/A';
        if (!gradeStats[grade]) {
            gradeStats[grade] = {
                total: 0,
                withPdf: 0,
                withoutPdf: 0
            };
        }
        gradeStats[grade].total++;
        if (student.hasPdf) {
            gradeStats[grade].withPdf++;
        } else {
            gradeStats[grade].withoutPdf++;
        }
    });

    gradeStatsContainer.innerHTML = '';
    const sortedGrades = Object.keys(gradeStats).sort((a, b) => {
        // Sort "Grade X" numerically, put "N/A" last
        if (a === 'N/A') return 1;
        if (b === 'N/A') return -1;
        const numA = parseInt(a.replace('Grade ', ''));
        const numB = parseInt(b.replace('Grade ', ''));
        return numA - numB;
    });

    sortedGrades.forEach(grade => {
        const stats = gradeStats[grade];
        const gradeTotal = stats.total;
        const withPdfPercent = gradeTotal > 0 
            ? ((stats.withPdf / gradeTotal) * 100).toFixed(2) 
            : '0.00';
        const withoutPdfPercent = gradeTotal > 0 
            ? ((stats.withoutPdf / gradeTotal) * 100).toFixed(2) 
            : '0.00';

        const gradeStatDiv = document.createElement('div');
        gradeStatDiv.className = 'p-4 bg-white rounded-md shadow-md mb-2';
        gradeStatDiv.innerHTML = `
            <h4 class="font-bold text-md text-gray-800">${escapeHtml(grade)} (${gradeTotal} students checked)</h4>
            <p class="text-sm text-green-600">With PDF: ${stats.withPdf} (${withPdfPercent}%)</p>
            <p class="text-sm text-red-600">Without PDF: ${stats.withoutPdf} (${withoutPdfPercent}%)</p>
        `;
        gradeStatsContainer.appendChild(gradeStatDiv);
    });
}

// =============================================================================
// FILTER AND RENDER FUNCTIONS
// =============================================================================

function applyFiltersAndRender() {
    filteredStudents = allStudents.filter(student => {
        const name = (student.name || '').toLowerCase();
        const assessmentNo = (student.assessmentNo || '').toLowerCase();
        const hasPdf = student.hasPdf;
        const studentGrade = student.grade;

        const matchesSearch = currentSearchTerm === '' ||
            name.includes(currentSearchTerm.toLowerCase()) ||
            assessmentNo.includes(currentSearchTerm.toLowerCase());

        const matchesPdfFilter = currentFilter === 'all' || 
            (currentFilter === 'with-pdf' && hasPdf === true) ||
            (currentFilter === 'without-pdf' && hasPdf === false);

        const matchesGrade = currentGrade === 'all' ||
            studentGrade === currentGrade;

        return matchesSearch && matchesPdfFilter && matchesGrade;
    });

    currentPage = 1;
    renderStudents();
}

// Add event listener for the second one
const advancedSearchFilter = document.getElementById('advanced-search-filter');
if (advancedSearchFilter) {
    advancedSearchFilter.addEventListener('input', handleAdvancedSearch);
}
// =============================================================================
// FIREBASE REALTIME LISTENER
// =============================================================================

function startRealtimeListener() {
    if (realtimeListenerActive) {
        console.warn('Realtime listener already active');
        return;
    }
    
    realtimeListenerActive = true;
    const dbPath = `artifacts/${sanitizedAppId}/students`;
    const studentsRef = ref(db, dbPath);

    onValue(studentsRef, async (snapshot) => {
        if (!studentTableBody) return;
        
        studentTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-gray-500 py-8">
            <div class="flex items-center justify-center">
                <svg class="animate-spin h-5 w-5 mr-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading student records...
            </div>
        </td></tr>`;

        if (snapshot.exists()) {
            const studentsData = snapshot.val();
            const studentEntries = Object.entries(studentsData);

            // CRITICAL: Don't check PDFs here - just load the data
            allStudents = studentEntries.map(([assessmentNo, student]) => ({
                assessmentNo,
                name: student['Official Student Name'] || 'Unknown',
                upi: student.UPI || '',
                grade: student.Grade || 'N/A',
                hasPdf: undefined // Will be checked lazily for visible students
            }));

            // Sort by grade and name
            allStudents.sort((a, b) => {
                const gradeA = a.grade || 'ZZZ'; // Put N/A at the end
                const gradeB = b.grade || 'ZZZ';
                if (gradeA !== gradeB) {
                    return gradeA.localeCompare(gradeB);
                }
                return (a.name || '').localeCompare(b.name || '');
            });

            if (allStudents.length === 0) {
                studentTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-gray-500 py-8">No student records found in the database.</td></tr>`;
                if (paginationControls) {
                    paginationControls.classList.add('hidden');
                }
            } else {
                // Render immediately without waiting for PDF checks
                applyFiltersAndRender();
                
                // Start background PDF checking after a short delay
                setTimeout(() => {
                    if (!backgroundCheckRunning) {
                        startBackgroundPdfCheck();
                    }
                }, 500);
            }
        } else {
            allStudents = [];
            studentTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-gray-500 py-8">No student records found in the database.</td></tr>`;
            if (paginationControls) {
                paginationControls.classList.add('hidden');
            }
        }
    }, (error) => {
        console.error("Error retrieving student records:", error);
        if (studentTableBody) {
            studentTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-red-500 py-8">
                <div class="flex flex-col items-center">
                    <svg class="h-12 w-12 text-red-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p class="font-semibold">An error occurred while fetching data</p>
                    <p class="text-sm mt-1">Please check your connection and try again</p>
                </div>
            </td></tr>`;
        }
        realtimeListenerActive = false;
    });
}

// =============================================================================
// AUTHENTICATION STATE OBSERVER
// =============================================================================

// Replace the existing onAuthStateChanged function with this:
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        userId = user.uid;
        
        // Get user display elements
        const userDisplayNameEl = document.getElementById('user-display-name');
        const userAvatarEl = document.getElementById('user-avatar');
        const userRoleEl = document.getElementById('user-role');
        
        // Get user email and name
        const userEmail = user.email || 'No Email';
        const displayName = user.displayName || userEmail.split('@')[0]; // Use email prefix if no display name
        
        // Update display name
        if (userDisplayNameEl) {
            userDisplayNameEl.textContent = displayName;
            userDisplayNameEl.title = userEmail; // Show full email on hover
        }
        
        // Update avatar with first letter of name
        if (userAvatarEl) {
            const firstLetter = displayName.charAt(0).toUpperCase();
            userAvatarEl.textContent = firstLetter;
        }
        
        // Update role based on email (optional)
        if (userRoleEl) {
            if (userEmail.includes('admin')) {
                userRoleEl.textContent = 'Administrator';
            } else if (userEmail.includes('teacher')) {
                userRoleEl.textContent = 'Teacher';
            } else {
                userRoleEl.textContent = 'Portal User';
            }
        }
        
        // Hide auth container, show main app
        if (authContainer) authContainer.classList.add('hidden');
        
        // Show main container with proper margin
        if (mainAppContainer) {
            mainAppContainer.classList.remove('hidden');
            mainAppContainer.classList.add('lg:ml-64');
        }
        
        // Show sidebar after login
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.remove('hidden');
        }
        
        // Start the real-time listener
        startRealtimeListener();
        
    } else {
        // User is signed out
        userId = 'anonymous';
        
        // Reset user display
        const userDisplayNameEl = document.getElementById('user-display-name');
        const userAvatarEl = document.getElementById('user-avatar');
        const userRoleEl = document.getElementById('user-role');
        
        if (userDisplayNameEl) userDisplayNameEl.textContent = 'Admin User';
        if (userAvatarEl) userAvatarEl.textContent = 'A';
        if (userRoleEl) userRoleEl.textContent = 'Portal Admin';
        
        // Hide main container and remove margin
        if (mainAppContainer) {
            mainAppContainer.classList.add('hidden');
            mainAppContainer.classList.remove('lg:ml-64');
        }
        
        if (authContainer) authContainer.classList.remove('hidden');
        
        // Hide sidebar when logged out
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.add('hidden');
        }
        
        // Clear data
        allStudents = [];
        filteredStudents = [];
        pdfExistenceCache.clear();
        realtimeListenerActive = false;
        backgroundCheckRunning = false;
    }
});

// =============================================================================
// INITIALIZE ON DOM READY
// =============================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('📚 Student Management App Initialized');
    
    // Load theme
    loadTheme();
    
    // Load user preferences
    loadPreferences();
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Watch for preference changes
    watchPreferences();
    
    // Setup offline detection
    setupOfflineDetection();
    
     // **ADD THIS LINE - Reset all filters on page load**
    resetAllFilters();
    
    // Initialize PDF open buttons if they exist
    const buttons = document.querySelectorAll('.open-pdf-button');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            const studentName = this.getAttribute('data-student-name');
            const studentGrade = this.getAttribute('data-student-grade');
            if (studentName && studentGrade) {
                window.openLocalPDF(studentName, studentGrade);
            } else {
                console.error('No student name or grade provided for PDF button.');
                showModal('Error', 'No student name or grade provided.');
            }
        });
    });
    
    // Log performance metrics after 5 seconds
    setTimeout(() => {
        console.log('📊 Performance Metrics:');
        getPerformanceReport();
    }, 5000);
    
    // Show helpful tips
    console.log('💡 Keyboard Shortcuts:');
    console.log('  - Ctrl/Cmd + K: Focus search');
    console.log('  - Ctrl/Cmd + E: Export data');
    console.log('  - Arrow Left/Right: Navigate pages');
    console.log('📝 Available Functions:');
    console.log('  - refreshData(): Refresh all student data');
    console.log('  - printStudentList(): Print current view');
    console.log('  - getPerformanceReport(): View performance metrics');
    console.log('  - toggleTheme(): Switch between light/dark mode');
});

// =============================================================================
// ENHANCED EXPORT FUNCTIONALITY - PDF, WORD, EXCEL
// =============================================================================

// Required libraries:
// - jsPDF: https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js
// - jsPDF-AutoTable: https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js
// - SheetJS (XLSX): https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js
// - docxtemplater: https://cdnjs.cloudflare.com/ajax/libs/docxtemplater/3.37.11/docxtemplater.js
// - PizZip: https://cdnjs.cloudflare.com/ajax/libs/pizzip/3.1.3/pizzip.min.js

// =============================================================================
// ENHANCED EXPORT TO PDF WITH PREMIUM STYLING
// =============================================================================

const exportToPdfEnhanced = async () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape');

    // Use currently filtered students (respects all active filters)
    const dataToExport = filteredStudents;
    
    // Get active filter description
    const selectedGrade = currentGrade !== 'all' ? currentGrade : 'All Grades';
    const filterType = currentFilter !== 'all' ? 
        (currentFilter === 'with-pdf' ? ' (With PDF)' : 
         currentFilter === 'without-pdf' ? ' (Without PDF)' : '') : '';
    const searchFilter = currentSearchTerm ? ` (Search: "${currentSearchTerm}")` : '';
    
    const title = `Student Data Report`;
    const subtitle = `${selectedGrade}${filterType}${searchFilter}`;
    const totalStudents = dataToExport.length;
    
    // Load and process logo image to make it completely white
    const logoImg = new Image();
    logoImg.src = './images/logo.png';
    logoImg.crossOrigin = 'anonymous';
    
    // Load Kenya Ministry of Education logo for background
    const ministryLogoImg = new Image();
    ministryLogoImg.src = './images/kenya_ministry_education.png';
    ministryLogoImg.crossOrigin = 'anonymous';
    
    // Wait for logo to load and apply 100% white filter
    await new Promise((resolve, reject) => {
        logoImg.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = logoImg.width;
            canvas.height = logoImg.height;
            
            ctx.drawImage(logoImg, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            for (let i = 0; i < data.length; i += 4) {
                if (data[i + 3] > 0) {
                    data[i] = 255;
                    data[i + 1] = 255;
                    data[i + 2] = 255;
                }
            }
            
            ctx.putImageData(imageData, 0, 0);
            logoImg.src = canvas.toDataURL();
            resolve();
        };
        logoImg.onerror = () => resolve(); // Continue even if logo fails
    });
    
    await new Promise((resolve) => {
        ministryLogoImg.onload = resolve;
        ministryLogoImg.onerror = () => resolve();
    });
    
    // Essential columns
    const essentialColumns = [
        'No.',
        'Name',
        'Assessment No', 
        'UPI',
        'Grade',
        'PDF Status'
    ];
    
    const headers = essentialColumns;
    const body = dataToExport.map((student, index) => {
        return [
            String(index + 1),
            student.name || '-',
            student.assessmentNo || '-',
            student.upi || '-',
            student.grade || '-',
            student.hasPdf === true ? '✓ Has PDF' : student.hasPdf === false ? '✗ No PDF' : '⏳ Checking'
        ];
    });

    // Premium Header Function
    const addHeader = (data) => {
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        
        // Add Kenya Ministry logo as watermark
        try {
            if (ministryLogoImg.complete && ministryLogoImg.naturalHeight !== 0) {
                const watermarkSize = 80;
                const watermarkX = (pageWidth - watermarkSize) / 2;
                const watermarkY = (pageHeight - watermarkSize) / 2;
                
                doc.saveGraphicsState();
                doc.setGState(new doc.GState({ opacity: 0.08 }));
                doc.addImage(ministryLogoImg, 'PNG', watermarkX, watermarkY, watermarkSize, watermarkSize);
                doc.restoreGraphicsState();
            }
        } catch (e) {
            console.log('Ministry logo not available');
        }
        
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
        
        // School name
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('KANYADET PRI & JUNIOR SCHOOL', logoX + logoWidth + 5, 10);
        
        // Report title
        doc.setFontSize(12);
        doc.text(title, logoX + logoWidth + 5, 16);
        
        // Date and info (right aligned)
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        const dateText = `Date: ${new Date().toLocaleDateString()}`;
        const gradeText = subtitle;
        const studentCount = `Total Students: ${totalStudents}`;
        doc.text(dateText, pageWidth - 14, 8, { align: 'right' });
        doc.text(gradeText, pageWidth - 14, 13, { align: 'right' });
        doc.text(studentCount, pageWidth - 14, 18, { align: 'right' });
        
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
        doc.text('STAMP', pageWidth - 71, footerY +  5, { align: 'center' });
    };

    // Generate table
    doc.autoTable({
        head: [headers],
        body: body,
        startY: 25,
        styles: { 
            fontSize: 9,
            cellPadding: 3,
            overflow: 'linebreak',
            cellWidth: 'auto',
            font: 'helvetica' // Explicitly set font
        },
        columnStyles: {
            0: { cellWidth: 15 }
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

    const filename = `student_data_${currentGrade !== 'all' ? currentGrade : 'all'}_${currentFilter}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    
    showToast('PDF exported successfully!', 'success');
};

// =============================================================================
// EXPORT TO EXCEL WITH PREMIUM STYLING
// =============================================================================

const exportToExcelEnhanced = async () => {
    const XLSX = window.XLSX;
    if (!XLSX) {
        showToast('Excel export library not loaded', 'error');
        return;
    }

    // Use currently filtered students (respects all active filters)
    const dataToExport = filteredStudents;
    
    // Get active filter description
    const selectedGrade = currentGrade !== 'all' ? currentGrade : 'All Grades';
    const filterType = currentFilter !== 'all' ? 
        (currentFilter === 'with-pdf' ? ' (With PDF)' : 
         currentFilter === 'without-pdf' ? ' (Without PDF)' : '') : '';
    const searchFilter = currentSearchTerm ? ` (Search: "${currentSearchTerm}")` : '';
    const filterDescription = `${selectedGrade}${filterType}${searchFilter}`;

    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Create header rows
    const headerData = [
        ['KANYADET PRI & JUNIOR SCHOOL'],
        ['Student Data Report'],
        [`Date: ${new Date().toLocaleDateString()}`, '', '', `Filter: ${filterDescription}`],
        [`Total Students: ${dataToExport.length}`],
        [], // Empty row
        ['No.', 'Name', 'Assessment No', 'UPI', 'Grade', 'PDF Status']
    ];

    // Create data rows
    const bodyData = dataToExport.map((student, index) => [
        index + 1,
        student.name || '-',
        student.assessmentNo || '-',
        student.upi || '-',
        student.grade || '-',
        student.hasPdf === true ? 'Has PDF' : student.hasPdf === false ? 'No PDF' : 'Checking'
    ]);

    // Add footer rows
    const footerData = [
        [],
        ['Prepared by: _________________', '', '', '', 'Verified by: _________________'],
        ['Signature & Date', '', '', '', 'Signature & Stamp']
    ];

    // Combine all data
    const wsData = [...headerData, ...bodyData, ...footerData];

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    ws['!cols'] = [
        { wch: 8 },  // No.
        { wch: 25 }, // Name
        { wch: 18 }, // Assessment No
        { wch: 15 }, // UPI
        { wch: 12 }, // Grade
        { wch: 15 }  // PDF Status
    ];

    // Merge cells for header
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // School name
        { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }, // Report title
        { s: { r: 3, c: 0 }, e: { r: 3, c: 5 } }  // Total students
    ];

    // Apply styles (basic approach - Excel styling is limited in SheetJS free version)
    const range = XLSX.utils.decode_range(ws['!ref']);
    
    // Style header rows (0-5)
    for (let R = 0; R <= 5; R++) {
        for (let C = 0; C <= 5; C++) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            if (!ws[cellAddress]) continue;
            
            ws[cellAddress].s = {
                font: { bold: true, sz: R < 2 ? 14 : 11 },
                alignment: { horizontal: 'center', vertical: 'center' },
                fill: R === 5 ? { fgColor: { rgb: '2980B9' } } : undefined
            };
        }
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Student Data');

    // Save file
    const filename = `student_data_${currentGrade !== 'all' ? currentGrade : 'all'}_${currentFilter}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
    
    showToast('Excel file exported successfully!', 'success');
};

// =============================================================================
// EXPORT TO WORD WITH PREMIUM STYLING
// =============================================================================

const exportToWordEnhanced = async () => {
    // Use currently filtered students (respects all active filters)
    const dataToExport = filteredStudents;
    
    // Get active filter description
    const selectedGrade = currentGrade !== 'all' ? currentGrade : 'All Grades';
    const filterType = currentFilter !== 'all' ? 
        (currentFilter === 'with-pdf' ? ' (With PDF)' : 
         currentFilter === 'without-pdf' ? ' (Without PDF)' : '') : '';
    const searchFilter = currentSearchTerm ? ` (Search: "${currentSearchTerm}")` : '';
    const filterDescription = `${selectedGrade}${filterType}${searchFilter}`;

    // Create HTML content with premium styling
    let htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page {
            size: A4 landscape;
            margin: 0.5in;
        }
        body {
            font-family: 'Calibri', Arial, sans-serif;
            margin: 0;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #2980B9 0%, #3498DB 100%);
            color: white;
            padding: 20px;
            margin: -20px -20px 20px -20px;
            position: relative;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: bold;
        }
        .header h2 {
            margin: 5px 0 0 0;
            font-size: 16px;
            font-weight: normal;
        }
        .header-info {
            position: absolute;
            right: 20px;
            top: 20px;
            text-align: right;
            font-size: 12px;
        }
        .logo {
            position: absolute;
            left: 20px;
            top: 10px;
            width: 50px;
            height: 50px;
            background: white;
            border-radius: 50%;
        }
        .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            opacity: 0.05;
            font-size: 200px;
            font-weight: bold;
            z-index: -1;
            pointer-events: none;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th {
            background-color: #2980B9;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
            border: 1px solid #2471A3;
        }
        td {
            padding: 10px;
            border: 1px solid #ddd;
        }
        tr:nth-child(even) {
            background-color: #f5f5f5;
        }
        tr:hover {
            background-color: #e8f4f8;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #2980B9;
            display: flex;
            justify-content: space-between;
        }
        .footer-section {
            flex: 1;
        }
        .signature-line {
            border-top: 1px solid #333;
            margin-top: 40px;
            padding-top: 5px;
            font-size: 11px;
            color: #666;
        }
        .stamp-box {
            border: 2px solid #2980B9;
            padding: 10px;
            text-align: center;
            color: #999;
            font-size: 10px;
        }
    </style>
</head>
<body>
    <div class="watermark">KANYADET</div>
    
    <div class="header">
        <div class="logo"></div>
        <h1>KANYADET PRI & JUNIOR SCHOOL</h1>
        <h2>Student Data Report</h2>
        <div class="header-info">
            <div>Date: ${new Date().toLocaleDateString()}</div>
            <div>Filter: ${filterDescription}</div>
            <div>Total Students: ${dataToExport.length}</div>
        </div>
    </div>
    
    <table>
        <thead>
            <tr>
                <th style="width: 5%">No.</th>
                <th style="width: 25%">Name</th>
                <th style="width: 15%">Assessment No</th>
                <th style="width: 15%">UPI</th>
                <th style="width: 10%">Grade</th>
                <th style="width: 15%">PDF Status</th>
            </tr>
        </thead>
        <tbody>
`;

    // Add data rows
    dataToExport.forEach((student, index) => {
        const pdfStatus = student.hasPdf === true ? '✓ Has PDF' : 
                         student.hasPdf === false ? '✗ No PDF' : '⏳ Checking';
        
        htmlContent += `
            <tr>
                <td>${index + 1}</td>
                <td>${student.name || '-'}</td>
                <td>${student.assessmentNo || '-'}</td>
                <td>${student.upi || '-'}</td>
                <td>${student.grade || '-'}</td>
                <td>${pdfStatus}</td>
            </tr>
        `;
    });

    htmlContent += `
        </tbody>
    </table>
    
    <div class="footer">
        <div class="footer-section">
            <strong>Prepared by:</strong>
            <div class="signature-line">Signature & Date</div>
        </div>
        <div class="footer-section" style="text-align: right;">
            <strong>Verified by:</strong>
            <div class="signature-line">Signature & Date</div>
            <div class="stamp-box" style="margin-top: 10px; display: inline-block;">
                OFFICIAL<br>STAMP
            </div>
        </div>
    </div>
</body>
</html>
    `;

    // Convert HTML to blob and download
    const blob = new Blob(['\ufeff', htmlContent], {
        type: 'application/msword'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `student_data_${currentGrade !== 'all' ? currentGrade : 'all'}_${currentFilter}_${new Date().toISOString().split('T')[0]}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast('Word document exported successfully!', 'success');
};

// =============================================================================
// UNIFIED EXPORT FUNCTION
// =============================================================================

function handleExportEnhanced() {
    if (exportInProgress) return;
    
    const exportOptions = [
        { label: 'Export to PDF (Premium Format)', value: 'pdf', icon: '📄' },
        { label: 'Export to Excel (Premium Format)', value: 'excel', icon: '📊' },
        { label: 'Export to Word (Premium Format)', value: 'word', icon: '📝' },
        { label: 'Export Current View (CSV)', value: 'current-csv', icon: '📋' },
        { label: 'Export All Students (CSV)', value: 'all-csv', icon: '📋' },
        { label: 'Export Students Without PDF (CSV)', value: 'no-pdf-csv', icon: '⚠️' },
        { label: 'Export Statistics (JSON)', value: 'stats-json', icon: '📈' }
    ];
    
    showExportModalEnhanced(exportOptions);
}

function showExportModalEnhanced(options) {
    const modalBackdrop = getElement('modal-backdrop');
    const modalTitle = getElement('modal-title');
    const modalMessage = getElement('modal-message');
    
    if (!modalBackdrop || !modalTitle || !modalMessage) return;
    
    modalTitle.textContent = 'Export Data';
    
    let optionsHtml = '<div class="space-y-2 mt-4">';
    options.forEach((option) => {
        optionsHtml += `
            <button onclick="executeExportEnhanced('${option.value}')" 
                    class="w-full px-4 py-3 text-left bg-gradient-to-r from-gray-50 to-blue-50 hover:from-blue-50 hover:to-blue-100 border border-gray-200 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md">
                <span class="text-2xl mr-3">${option.icon}</span>
                <span class="font-medium text-gray-800">${option.label}</span>
            </button>
        `;
    });
    optionsHtml += '</div>';
    
    modalMessage.innerHTML = optionsHtml;
    modalBackdrop.classList.remove('hidden');
    modalBackdrop.classList.add('flex');
}

window.executeExportEnhanced = function(exportType) {
    const modalBackdrop = getElement('modal-backdrop');
    if (modalBackdrop) {
        modalBackdrop.classList.add('hidden');
    }
    
    exportInProgress = true;
    showToast('Preparing export...', 'info');
    
    setTimeout(async () => {
        try {
            switch(exportType) {
                case 'pdf':
                    await exportToPdfEnhanced();
                    break;
                case 'excel':
                    await exportToExcelEnhanced();
                    break;
                case 'word':
                    await exportToWordEnhanced();
                    break;
                case 'current-csv':
                    exportToCSV(filteredStudents, 'students_current_view');
                    showToast('CSV exported successfully!', 'success');
                    break;
                case 'all-csv':
                    exportToCSV(allStudents, 'students_all');
                    showToast('CSV exported successfully!', 'success');
                    break;
                case 'no-pdf-csv':
                    const noPdfStudents = allStudents.filter(s => s.hasPdf === false);
                    exportToCSV(noPdfStudents, 'students_without_pdf');
                    showToast('CSV exported successfully!', 'success');
                    break;
                case 'stats-json':
                    exportStatistics();
                    showToast('Statistics exported successfully!', 'success');
                    break;
            }
        } catch (error) {
            console.error('Export error:', error);
            showToast('Failed to export data. Please try again.', 'error');
        } finally {
            exportInProgress = false;
        }
    }, 100);
};

// Add this function after applyFiltersAndRender()
function resetAllFilters() {
    // Reset filter variables
    currentFilter = 'all';
    currentSearchTerm = '';
    currentGrade = 'all';
    currentPage = 1;
    
    // Reset UI elements
    if (liveFilterInput) liveFilterInput.value = '';
    if (searchInput) searchInput.value = '';
    if (gradeFilterSelect) gradeFilterSelect.value = 'all';
    
    // Reset filter buttons visual state
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-gradient-to-r', 'from-indigo-500', 'to-purple-600', 'text-white');
        btn.classList.add('bg-gray-200', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300');
    });
    
    // Set "All Students" button as active
    const showAllBtn = document.getElementById('show-all');
    if (showAllBtn) {
        showAllBtn.classList.add('active', 'bg-gradient-to-r', 'from-indigo-500', 'to-purple-600', 'text-white');
        showAllBtn.classList.remove('bg-gray-200', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300');
    }
    
    // Re-render with reset filters
    applyFiltersAndRender();
}


// =============================================================================
// ADVANCED ANALYTICS FUNCTIONALITY WITH INTERACTIVE CHARTS
// =============================================================================

function showAdvancedAnalytics() {
    const analyticsBackdrop = document.getElementById('analytics-modal-backdrop');
    const analyticsContent = document.getElementById('analytics-content');
    
    if (!analyticsBackdrop || !analyticsContent) {
        console.error('Analytics modal elements not found');
        return;
    }
    
    // Generate analytics
    const analytics = generateAdvancedAnalytics();
    
    // Render analytics content
    analyticsContent.innerHTML = `
        <!-- Overview Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div class="neuro-card p-6">
                <div class="flex items-center justify-between mb-2">
                    <h4 class="text-sm font-semibold text-gray-500 dark:text-gray-400">Total Students</h4>
                    <svg class="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                    </svg>
                </div>
                <p class="text-3xl font-bold gradient-text">${analytics.overview.totalStudents}</p>
            </div>
            
            <div class="neuro-card p-6">
                <div class="flex items-center justify-between mb-2">
                    <h4 class="text-sm font-semibold text-gray-500 dark:text-gray-400">Completion Rate</h4>
                    <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <p class="text-3xl font-bold gradient-text">${analytics.overview.completionRate}%</p>
            </div>
            
            <div class="neuro-card p-6">
                <div class="flex items-center justify-between mb-2">
                    <h4 class="text-sm font-semibold text-gray-500 dark:text-gray-400">Documents</h4>
                    <svg class="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                </div>
                <p class="text-3xl font-bold gradient-text">${analytics.overview.withDocuments}</p>
            </div>
            
            <div class="neuro-card p-6">
                <div class="flex items-center justify-between mb-2">
                    <h4 class="text-sm font-semibold text-gray-500 dark:text-gray-400">Pending</h4>
                    <svg class="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <p class="text-3xl font-bold gradient-text">${analytics.overview.pending}</p>
            </div>
        </div>
        
        <!-- Interactive Charts -->
        <div class="grid grid-cols-1 lg:grid-cols-2 h-80vh overflow-y-auto gap-6 mb-6">
            <!-- Completion Rate Pie Chart -->
            <div class="glass-morph rounded-2xl p-6">
                <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path>
                    </svg>
                    Document Status Distribution
                </h3>
                <canvas id="statusPieChart" height="250px"></canvas>
            </div>
            
            <!-- Grade Performance Bar Chart -->
            <div class="glass-morph rounded-2xl p-6">
                <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                    Grade-wise Completion
                </h3>
                <canvas id="gradeBarChart" height="250px"></canvas>
            </div>
        </div>
        
        <!-- Quick Action Buttons -->
        <div class="glass-morph rounded-2xl p-6 mb-6">
            <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                Quick Actions
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button onclick="filterByStatus('pending')" class="action-btn p-4 bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105">
                    <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p class="font-semibold text-sm">View Pending</p>
                </button>
                
                <button onclick="filterByStatus('completed')" class="action-btn p-4 bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105">
                    <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p class="font-semibold text-sm">View Completed</p>
                </button>
                
                <button onclick="showTopGrade()" class="action-btn p-4 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105">
                    <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
                    </svg>
                    <p class="font-semibold text-sm">Top Grade</p>
                </button>
                
                <button onclick="exportAnalyticsReport()" class="action-btn p-4 bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105">
                    <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <p class="font-semibold text-sm">Export Report</p>
                </button>
            </div>
        </div>
        
        <!-- Grade Breakdown -->
        <div class="glass-morph rounded-2xl p-6 mb-6">
            <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
                Grade-wise Analysis
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${analytics.gradeBreakdown.map(grade => `
                    <div class="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105" onclick="filterByGrade('${grade.name}')">
                        <div class="flex items-center justify-between mb-3">
                            <h4 class="font-bold text-gray-800 dark:text-white">${grade.name}</h4>
                            <span class="text-xs font-semibold px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                                ${grade.total} students
                            </span>
                        </div>
                        <div class="space-y-2">
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600 dark:text-gray-400">With Documents:</span>
                                <span class="font-semibold text-green-600">${grade.withPdf} (${grade.withPdfPercent}%)</span>
                            </div>
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600 dark:text-gray-400">Pending:</span>
                                <span class="font-semibold text-orange-600">${grade.withoutPdf} (${grade.withoutPdfPercent}%)</span>
                            </div>
                            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                                <div class="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500" 
                                     style="width: ${grade.withPdfPercent}%"></div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <!-- Insights & Recommendations -->
        <div class="glass-morph rounded-2xl p-6 mb-6">
            <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
                Insights & Recommendations
            </h3>
            <div class="space-y-3">
                ${analytics.insights.map(insight => {
                    const iconColors = {
                        success: 'text-green-600',
                        warning: 'text-yellow-600',
                        info: 'text-blue-600',
                        error: 'text-red-600'
                    };
                    const bgColors = {
                        success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
                        warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
                        info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
                        error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    };
                    return `
                        <div class="p-4 ${bgColors[insight.type]} border rounded-lg flex items-start gap-3">
                            <svg class="w-5 h-5 ${iconColors[insight.type]} flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <div>
                                <p class="font-semibold text-gray-800 dark:text-white">${insight.title}</p>
                                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">${insight.message}</p>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
        
        <!-- Performance Metrics -->
        <div class="glass-morph rounded-2xl p-6">
            <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                System Performance
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-all duration-300" onclick="showCheckedStudents()">
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Checked Students</p>
                    <p class="text-2xl font-bold text-gray-800 dark:text-white">${analytics.performance.checkedCount}</p>
                    <p class="text-xs text-gray-500 mt-1">${analytics.performance.checkedPercentage}% Complete</p>
                </div>
                <div class="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Cache Size</p>
                    <p class="text-2xl font-bold text-gray-800 dark:text-white">${analytics.performance.cacheSize}</p>
                    <p class="text-xs text-gray-500 mt-1">PDF existence cache</p>
                </div>
                <div class="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Filters</p>
                    <p class="text-2xl font-bold text-gray-800 dark:text-white">${analytics.performance.activeFilters}</p>
                    <p class="text-xs text-gray-500 mt-1">Current filter: ${currentFilter}</p>
                </div>
            </div>
        </div>
    `;
    
    // Show modal
    analyticsBackdrop.classList.remove('hidden');
    analyticsBackdrop.classList.add('flex');
    
    // Initialize charts after a brief delay to ensure canvas is rendered
    setTimeout(() => {
        initializeAnalyticsCharts(analytics);
    }, 100);
}

function initializeAnalyticsCharts(analytics) {
    // Pie Chart for Document Status
    const pieCtx = document.getElementById('statusPieChart');
    if (pieCtx && window.Chart) {
        new Chart(pieCtx, {
            type: 'doughnut',
            data: {
                labels: ['With Documents', 'Pending', 'Not Checked'],
                datasets: [{
                    data: [
                        analytics.overview.withDocuments,
                        analytics.overview.pending,
                        analytics.overview.totalStudents - analytics.performance.checkedCount
                    ],
                    backgroundColor: [
                        'rgba(34, 197, 94, 0.8)',
                        'rgba(251, 146, 60, 0.8)',
                        'rgba(148, 163, 184, 0.8)'
                    ],
                    borderColor: [
                        'rgba(34, 197, 94, 1)',
                        'rgba(251, 146, 60, 1)',
                        'rgba(148, 163, 184, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Bar Chart for Grade Performance
    const barCtx = document.getElementById('gradeBarChart');
    if (barCtx && window.Chart) {
        const gradeLabels = analytics.gradeBreakdown.map(g => g.name);
        const withPdfData = analytics.gradeBreakdown.map(g => g.withPdf);
        const withoutPdfData = analytics.gradeBreakdown.map(g => g.withoutPdf);
        
        new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: gradeLabels,
                datasets: [
                    {
                        label: 'With Documents',
                        data: withPdfData,
                        backgroundColor: 'rgba(34, 197, 94, 0.8)',
                        borderColor: 'rgba(34, 197, 94, 1)',
                        borderWidth: 2
                    },
                    {
                        label: 'Pending',
                        data: withoutPdfData,
                        backgroundColor: 'rgba(251, 146, 60, 0.8)',
                        borderColor: 'rgba(251, 146, 60, 1)',
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y || 0;
                                return `${label}: ${value} students`;
                            }
                        }
                    }
                },
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const gradeIndex = elements[0].index;
                        const gradeName = gradeLabels[gradeIndex];
                        filterByGrade(gradeName);
                        closeAnalyticsModal();
                    }
                }
            }
        });
    }
}

function generateAdvancedAnalytics() {
    const totalStudents = allStudents.length;
    const checkedStudents = allStudents.filter(s => s.hasPdf !== undefined);
    const withDocuments = allStudents.filter(s => s.hasPdf === true).length;
    const pending = allStudents.filter(s => s.hasPdf === false).length;
    const completionRate = checkedStudents.length > 0 
        ? ((withDocuments / checkedStudents.length) * 100).toFixed(1) 
        : '0.0';
    
    // Grade breakdown
    const gradeData = {};
    allStudents.forEach(s => {
        const grade = s.grade || 'N/A';
        if (!gradeData[grade]) {
            gradeData[grade] = { total: 0, withPdf: 0, withoutPdf: 0 };
        }
        gradeData[grade].total++;
        if (s.hasPdf === true) gradeData[grade].withPdf++;
        if (s.hasPdf === false) gradeData[grade].withoutPdf++;
    });
    
    const gradeBreakdown = Object.entries(gradeData).map(([name, data]) => ({
        name,
        total: data.total,
        withPdf: data.withPdf,
        withoutPdf: data.withoutPdf,
        withPdfPercent: data.total > 0 ? ((data.withPdf / data.total) * 100).toFixed(1) : '0.0',
        withoutPdfPercent: data.total > 0 ? ((data.withoutPdf / data.total) * 100).toFixed(1) : '0.0'
    })).sort((a, b) => a.name.localeCompare(b.name));
    
    // Generate insights
    const insights = [];
    
    if (parseFloat(completionRate) === 100) {
        insights.push({
            type: 'success',
            title: 'Excellent! 100% Completion',
            message: 'All checked students have their birth certificates on file. Great work!'
        });
    } else if (parseFloat(completionRate) >= 80) {
        insights.push({
            type: 'success',
            title: 'Good Progress',
            message: `${completionRate}% of students have documents. You're doing great!`
        });
    } else if (parseFloat(completionRate) >= 50) {
        insights.push({
            type: 'warning',
            title: 'Moderate Completion',
            message: `${completionRate}% completion rate. Consider following up on missing documents.`
        });
    } else {
        insights.push({
            type: 'error',
            title: 'Action Required',
            message: `Only ${completionRate}% completion. Urgent attention needed for missing documents.`
        });
    }
    
    if (pending > 0) {
        insights.push({
            type: 'info',
            title: `${pending} Documents Pending`,
            message: `There are ${pending} students without birth certificates. Consider sending reminders to parents.`
        });
    }
    
    // Find grade with lowest completion
    const lowestGrade = gradeBreakdown.reduce((lowest, current) => {
        const currentRate = parseFloat(current.withPdfPercent);
        const lowestRate = parseFloat(lowest.withPdfPercent);
        return currentRate < lowestRate ? current : lowest;
    }, gradeBreakdown[0]);
    
    if (lowestGrade && parseFloat(lowestGrade.withPdfPercent) < 70) {
        insights.push({
            type: 'warning',
            title: `${lowestGrade.name} Needs Attention`,
            message: `${lowestGrade.name} has only ${lowestGrade.withPdfPercent}% completion rate (${lowestGrade.withPdf}/${lowestGrade.total} students).`
        });
    }
    
    return {
        overview: {
            totalStudents,
            completionRate,
            withDocuments,
            pending
        },
        gradeBreakdown,
        insights,
        performance: {
            checkedCount: checkedStudents.length,
            checkedPercentage: totalStudents > 0 ? ((checkedStudents.length / totalStudents) * 100).toFixed(1) : '0.0',
            cacheSize: pdfExistenceCache.size,
            activeFilters: currentFilter !== 'all' || currentGrade !== 'all' || currentSearchTerm ? 
                [currentFilter !== 'all' ? 1 : 0, currentGrade !== 'all' ? 1 : 0, currentSearchTerm ? 1 : 0].reduce((a, b) => a + b, 0) : 0
        }
    };
}

function closeAnalyticsModal() {
    const analyticsBackdrop = document.getElementById('analytics-modal-backdrop');
    if (analyticsBackdrop) {
        analyticsBackdrop.classList.add('hidden');
        analyticsBackdrop.classList.remove('flex');
    }
}

// Quick Action Functions
function filterByStatus(status) {
    closeAnalyticsModal();
    if (status === 'pending') {
        if (typeof setFilter === 'function') {
            setFilter('without');
            showToast('Showing students without documents', 'info');
        }
    } else if (status === 'completed') {
        if (typeof setFilter === 'function') {
            setFilter('with');
            showToast('Showing students with documents', 'success');
        }
    }
}

function filterByGrade(gradeName) {
    closeAnalyticsModal();
    if (typeof window.currentGrade !== 'undefined') {
        window.currentGrade = gradeName;
        if (typeof applyFilters === 'function') {
            applyFilters();
            showToast(`Showing ${gradeName} students`, 'info');
        }
    }
}

function showTopGrade() {
    const analytics = generateAdvancedAnalytics();
    const topGrade = analytics.gradeBreakdown.reduce((top, current) => {
        const currentRate = parseFloat(current.withPdfPercent);
        const topRate = parseFloat(top.withPdfPercent);
        return currentRate > topRate ? current : top;
    }, analytics.gradeBreakdown[0]);
    
    if (topGrade) {
        closeAnalyticsModal();
        showToast(`Top Grade: ${topGrade.name} with ${topGrade.withPdfPercent}% completion!`, 'success');
        filterByGrade(topGrade.name);
    }
}

function showCheckedStudents() {
    closeAnalyticsModal();
    const checkedStudents = allStudents.filter(s => s.hasPdf !== undefined);
    showToast(`Total checked: ${checkedStudents.length} students`, 'info');
}

function exportAnalyticsReport() {
    const analytics = generateAdvancedAnalytics();
    
    const report = {
        generatedDate: new Date().toISOString(),
        schoolName: 'KANYADET PRI & JUNIOR SCHOOL',
        overview: analytics.overview,
        gradeBreakdown: analytics.gradeBreakdown,
        insights: analytics.insights,
        performance: analytics.performance
    };
    
    const jsonContent = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_report_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Analytics report exported successfully!', 'success');
}

// Close modal when clicking outside or on close button
document.addEventListener('DOMContentLoaded', function() {
    const analyticsCloseBtn = document.getElementById('analytics-modal-close-btn');
    const analyticsBackdrop = document.getElementById('analytics-modal-backdrop');
    
    if (analyticsCloseBtn) {
        analyticsCloseBtn.addEventListener('click', closeAnalyticsModal);
    }
    
    if (analyticsBackdrop) {
        analyticsBackdrop.addEventListener('click', function(e) {
            if (e.target === analyticsBackdrop) {
                closeAnalyticsModal();
            }
        });
    }
});

// Export functions to window
window.showAdvancedAnalytics = showAdvancedAnalytics;
window.closeAnalyticsModal = closeAnalyticsModal;
window.exportAnalyticsReport = exportAnalyticsReport;
window.filterByStatus = filterByStatus;
window.filterByGrade = filterByGrade;
window.showTopGrade = showTopGrade;
window.showCheckedStudents = showCheckedStudents;
window.initializeAnalyticsCharts = initializeAnalyticsCharts;

console.log('✅ Advanced Analytics module loaded with interactive charts');
window.resetAllFilters = resetAllFilters;
// Export functions to window
window.exportToPdfEnhanced = exportToPdfEnhanced;
window.exportToExcelEnhanced = exportToExcelEnhanced;
window.exportToWordEnhanced = exportToWordEnhanced;
window.handleExportEnhanced = handleExportEnhanced;

console.log('✅ Enhanced export functions loaded (PDF, Excel, Word with premium styling)');