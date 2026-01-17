 /* Advanced Student Portal with Firebase Integration
 * Real-time data fetching, filtering, and advanced features
 */

// ============================================
// GLOBAL VARIABLES & CONFIGURATION
// ============================================

let firebaseImports;
let studentsData = [];
let db;
let auth;
let currentPage = 1;
let itemsPerPage = 10;
let filteredAndSearchedStudents = [];
let searchQuery = '';
let selectedFields = [];

// Firebase Configuration
const appId = 'default-app-id'; 
const sanitizedAppId = appId.replace(/\./g, '_');
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

// ============================================
// DOM ELEMENTS
// ============================================

const gradeFilter = document.getElementById('grade-filter');
const fieldFilter = document.getElementById('field-filter');
const searchInput = document.getElementById('search-input');
const itemsPerPageSelect = document.getElementById('items-per-page');
const tableBody = document.querySelector('#studentTable tbody');
const reportSummary = document.getElementById('report-summary');
const paginationInfo = document.getElementById('pagination-info');
const paginationControls = document.getElementById('pagination-controls');
const loader = document.getElementById('loader');
const signInBtn = document.getElementById('signInBtn');
const signOutBtn = document.getElementById('sign-out-btn');
const userInfo = document.getElementById('user-info');
const controlsDiv = document.querySelector('.controls') || document.querySelector('.filter-section');
const printAreaDiv = document.getElementById('print-area') || document.querySelector('#studentTable');

// ============================================
// NOTIFICATION MANAGER
// ============================================

const NotificationManager = {
    container: null,
    
    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            this.container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
            `;
            document.body.appendChild(this.container);
        }
    },
    
    show(message, type = 'success', duration = 4000) {
        this.init();
        
        const notification = document.createElement('div');
        const id = `notif-${Date.now()}`;
        notification.id = id;
        
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        
        const colors = {
            success: { bg: '#27ae60', border: '#229954', shadow: 'rgba(39, 174, 96, 0.3)' },
            error: { bg: '#e74c3c', border: '#c0392b', shadow: 'rgba(231, 76, 60, 0.3)' },
            warning: { bg: '#f39c12', border: '#d68910', shadow: 'rgba(243, 156, 18, 0.3)' },
            info: { bg: '#3498db', border: '#2980b9', shadow: 'rgba(52, 152, 219, 0.3)' }
        };
        
        const color = colors[type] || colors.info;
        
        notification.style.cssText = `
            background: linear-gradient(135deg, ${color.bg} 0%, ${color.border} 100%);
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            margin-bottom: 12px;
            box-shadow: 0 8px 24px ${color.shadow};
            display: flex;
            align-items: center;
            gap: 12px;
            animation: slideIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            border-left: 4px solid ${color.border};
        `;
        
        notification.innerHTML = `
            <div style="font-size: 24px; font-weight: bold; min-width: 32px;">${icons[type]}</div>
            <div style="flex: 1; font-size: 14px; line-height: 1.5;">${message}</div>
            <button onclick="this.parentElement.remove()" style="
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 18px;
            ">×</button>
        `;
        
        this.container.insertBefore(notification, this.container.firstChild);
        
        if (duration > 0) {
            setTimeout(() => {
                notification.style.animation = 'slideOut 0.4s ease-in-out';
                setTimeout(() => notification.remove(), 400);
            }, duration);
        }
        
        return id;
    },
    
    success(message, duration) { return this.show(message, 'success', duration); },
    error(message, duration) { return this.show(message, 'error', duration); },
    warning(message, duration) { return this.show(message, 'warning', duration); },
    info(message, duration) { return this.show(message, 'info', duration); }
};

// Add animation styles
if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
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
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    firebaseImports = window.firebaseImports;
    if (firebaseImports) {
        initializeAppAndSetListeners();
    } else {
        userInfo.textContent = "Error: Firebase modules failed to load.";
        if (loader) loader.style.display = 'none';
        NotificationManager.error('Failed to initialize Firebase modules');
    }
});

function initializeAppAndSetListeners() {
    const { initializeApp, getDatabase, getAuth, onAuthStateChanged } = firebaseImports;
    try {
        const app = initializeApp(customFirebaseConfig);
        db = getDatabase(app);
        auth = getAuth(app);
        
        if (controlsDiv) controlsDiv.style.display = 'none';
        if (printAreaDiv) printAreaDiv.style.display = 'none';
        reportSummary.textContent = 'Please sign in to load the data.';

        onAuthStateChanged(auth, (user) => {
            if (user) {
                handleSignIn(user);
            } else {
                handleSignOut();
            }
        });

        // Event Listeners
        if (gradeFilter) gradeFilter.addEventListener('change', () => {
            currentPage = 1;
            applyFilters();
        });
        if (fieldFilter) fieldFilter.addEventListener('change', handleFieldSelection);
        if (searchInput) searchInput.addEventListener('input', handleSearch);
        if (itemsPerPageSelect) itemsPerPageSelect.addEventListener('change', handleItemsPerPageChange);
        if (signInBtn) signInBtn.addEventListener('click', signInWithGoogle);
        if (signOutBtn) signOutBtn.addEventListener('click', signOutUser);
        
        // Add Export Button Listener
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) exportBtn.addEventListener('click', exportMissingDataToPdf);

    } catch (e) {
        console.error("Firebase Initialization Error:", e);
        userInfo.textContent = `Error initializing Firebase: ${e.message}`;
        if (loader) loader.style.display = 'none';
        NotificationManager.error(`Firebase initialization failed: ${e.message}`);
    }
}
// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

async function signInWithGoogle() {
    const { GoogleAuthProvider, signInWithPopup } = firebaseImports;
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
        NotificationManager.success('Successfully signed in! Welcome aboard.');
    } catch (error) {
        console.error("Google Sign-In Error:", error);
        NotificationManager.error(`Sign-in failed: ${error.message}`);
    }
}

async function signOutUser() {
    const { signOut } = firebaseImports;
    try {
        await signOut(auth);
        NotificationManager.info('Signed out successfully. See you next time!');
    } catch (error) {
        console.error("Sign-Out Error:", error);
        NotificationManager.error('Sign-out failed. Please try again.');
    }
}

function handleSignIn(user) {
    userInfo.textContent = `Welcome, ${user.displayName || user.email}!`;
    if (signInBtn) signInBtn.style.display = 'none';
    if (signOutBtn) signOutBtn.style.display = 'inline-block';
    if (controlsDiv) controlsDiv.style.display = 'flex';
    if (printAreaDiv) printAreaDiv.style.display = 'block';
    
    fetchStudentsData();
}

function handleSignOut() {
    userInfo.textContent = "Please sign in to view the student data.";
    if (signInBtn) signInBtn.style.display = 'inline-block';
    if (signOutBtn) signOutBtn.style.display = 'none';
    if (loader) loader.style.display = 'none'; 
    
    studentsData = [];
    filteredAndSearchedStudents = [];
    searchQuery = '';
    currentPage = 1;
    if (searchInput) searchInput.value = '';
    tableBody.innerHTML = '';
    reportSummary.textContent = 'Please sign in to load the data.';
    paginationInfo.textContent = '';
    paginationControls.innerHTML = '';
    if (controlsDiv) controlsDiv.style.display = 'none';
    if (printAreaDiv) printAreaDiv.style.display = 'none';
}

// ============================================
// DATA FETCHING FROM FIREBASE
// ============================================
function fetchStudentsData() {
    if (loader) loader.style.display = 'flex'; 

    const { ref, onValue } = firebaseImports;
    const studentsRef = ref(db, `artifacts/${sanitizedAppId}/students`);
    
    onValue(studentsRef, (snapshot) => {
        const students = [];
        const data = snapshot.val();
        
        if (data) {
            for (let key in data) {
                students.push({ id: key, ...data[key] }); 
            }
        }
        
        // Sort by Assessment No
        students.sort((a, b) => {
            const assessmentNoA = parseFloat(a['Assessment No']) || Infinity;
            const assessmentNoB = parseFloat(b['Assessment No']) || Infinity;
            return assessmentNoA - assessmentNoB;
        });

        studentsData = students;
        populateFilters(students);
        updateDashboardStats(); // Update stats
        updateAnalyticsSection(); // ADD THIS LINE - Update analytics
        updateLastUpdatedTime();      // ⭐ ADD THIS
logMissingFieldsReport(); 
        applyFilters(); 
        if (loader) loader.style.display = 'none';
        
        NotificationManager.success(`Loaded ${students.length} student records successfully`);
    }, (error) => {
        console.error("Error fetching students:", error);
        reportSummary.textContent = `Error fetching data: ${error.message}`;
        if (loader) loader.style.display = 'none';
        NotificationManager.error(`Failed to fetch data: ${error.message}`);
    });
}
// ============================================
// UPDATE DASHBOARD STATS
// ============================================

function updateDashboardStats() {
    if (studentsData.length === 0) return;
    
    // Calculate total students
    const totalStudents = studentsData.length;
    
    // Calculate unique grades
    const uniqueGrades = new Set();
    studentsData.forEach(student => {
        if (student['Grade']) {
            uniqueGrades.add(student['Grade']);
        }
    });
    const activeGrades = uniqueGrades.size;
    
    // Calculate completion rate
    const requiredFields = ['Official Student Name', 'Grade', 'UPI', 'Assessment No', 'Home phone'];
    let totalFields = studentsData.length * requiredFields.length;
    let completedFields = 0;
    
    studentsData.forEach(student => {
        requiredFields.forEach(field => {
            const value = student[field];
            if (value && value !== '' && value !== 'N/A' && value !== 'NA') {
                completedFields++;
            }
        });
    });
    
    const completionRate = totalFields > 0 
        ? ((completedFields / totalFields) * 100).toFixed(1) 
        : 0;
    
    // Update the stat boxes
    const statBoxes = document.querySelectorAll('.stat-box');
    
    if (statBoxes.length >= 4) {
        // Total Students
        statBoxes[0].querySelector('.stat-number').textContent = totalStudents.toLocaleString();
        
        // Active Grades
        statBoxes[1].querySelector('.stat-number').textContent = activeGrades;
        
        // Complete Records
        statBoxes[2].querySelector('.stat-number').textContent = `${completionRate}%`;
        
        // System Uptime (keep as 24/7 or make dynamic)
        statBoxes[3].querySelector('.stat-number').textContent = '24/7';
    }
    
    // Animate the stats
    statBoxes.forEach((box, index) => {
        setTimeout(() => {
            box.style.transform = 'scale(1.05)';
            setTimeout(() => {
                box.style.transform = 'scale(1)';
            }, 200);
        }, index * 100);
    });
}


// ============================================
// FILTER POPULATION
// ============================================

function populateFilters(students) {
    const grades = new Set();
    const allKeys = new Set();

    students.forEach(student => {
        if (student['Grade']) {
            grades.add(student['Grade']);
        }
        Object.keys(student).forEach(key => allKeys.add(key));
    });

    // Populate Grade Filter
    if (gradeFilter) {
        gradeFilter.innerHTML = '<option value="">All Grades</option>';
        Array.from(grades).sort().forEach(grade => {
            const option = document.createElement('option');
            option.value = grade;
            option.textContent = `Grade ${grade}`;
            gradeFilter.appendChild(option);
        });
    }

    // Populate Field Filter
    const excludedFields = ['id', 'Assessment No', 'Official Student Name', 'Gender', 'Class', 'Grade']; 
    
    if (fieldFilter) {
        fieldFilter.innerHTML = '<option value="">Select Field...</option>';
        Array.from(allKeys)
            .filter(key => !excludedFields.includes(key))
            .sort()
            .forEach(key => {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = key;
                fieldFilter.appendChild(option);
            });
    }
}

// ============================================
// SEARCH & FILTER HANDLERS
// ============================================

function handleSearch() {
    searchQuery = searchInput.value.toLowerCase().trim();
    currentPage = 1;
    applyFilters();
    
    if (searchQuery) {
        NotificationManager.info(`Searching for: "${searchQuery}"`, 2000);
    }
}

function handleItemsPerPageChange() {
    itemsPerPage = parseInt(itemsPerPageSelect.value);
    currentPage = 1;
    renderCurrentPage();
}

function handleFieldSelection() {
    const selectedField = fieldFilter.value;
    
    if (!selectedField) return;
    
    if (selectedFields.includes(selectedField)) {
        NotificationManager.warning(`"${selectedField}" is already added to the table`);
        fieldFilter.value = '';
        return;
    }
    
    selectedFields.push(selectedField);
    updateFieldTags();
    renderCurrentPage();
    fieldFilter.value = '';
    
    NotificationManager.success(`Added "${selectedField}" to table columns`);
}

function removeField(fieldName) {
    selectedFields = selectedFields.filter(f => f !== fieldName);
    updateFieldTags();
    renderCurrentPage();
    NotificationManager.info(`Removed "${fieldName}" from table columns`);
}

// Make removeField globally available
window.removeField = removeField;

function updateFieldTags() {
    const container = document.getElementById('selected-fields-container');
    const tagsDiv = document.getElementById('selected-fields-tags');
    
    if (!tagsDiv) return;
    
    if (selectedFields.length === 0) {
        if (container) container.style.display = 'none';
        return;
    }
    
    if (container) container.style.display = 'block';
    tagsDiv.innerHTML = '';
    
    selectedFields.forEach(field => {
        const tag = document.createElement('div');
        tag.style.cssText = `
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 6px 12px;
            background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
            color: white;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
            box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
            transition: all 0.3s ease;
            margin: 4px;
        `;
        
        tag.innerHTML = `
            <span>${field}</span>
            <button onclick="removeField('${field}')" style="
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
            ">×</button>
        `;
        
        tagsDiv.appendChild(tag);
    });
}

function applyFilters() {
    const selectedGrade = gradeFilter ? gradeFilter.value : '';
    let filtered = studentsData;

    // Apply grade filter
    if (selectedGrade) {
        filtered = filtered.filter(student => student['Grade'] === selectedGrade);
    }

    // Apply search filter
    if (searchQuery) {
        filtered = filtered.filter(student => {
            const searchableFields = [
                student['Official Student Name'],
                student['Assessment No'],
                student['UPI'],
                student['Grade'],
                student['Home phone']
            ].map(field => String(field || '').toLowerCase());
            
            return searchableFields.some(field => field.includes(searchQuery));
        });
    }

    filteredAndSearchedStudents = filtered;
    currentPage = 1;
    renderCurrentPage();
}

// ============================================
// TABLE RENDERING & PAGINATION
// ============================================

function updateTableHeaders() {
    const thead = document.querySelector('#studentTable thead tr');
    if (!thead) return;
    
    const baseHeaders = ['SN', 'Grade', 'Student Name', 'Assessment No', 'UPI', 'Home Phone'];
    
    thead.innerHTML = '';
    
    baseHeaders.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        thead.appendChild(th);
    });
    
    selectedFields.forEach(fieldName => {
        const th = document.createElement('th');
        th.textContent = fieldName;
        th.style.cssText = `
            background: linear-gradient(135deg, #2980b9 0%, #2c3e50 100%);
            color: white;
        `;
        thead.appendChild(th);
    });
}

function renderCurrentPage() {
    const totalStudents = filteredAndSearchedStudents.length;
    const totalPages = Math.ceil(totalStudents / itemsPerPage);

    updateTableHeaders();
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalStudents);
    const studentsToRender = filteredAndSearchedStudents.slice(startIndex, endIndex);

    // Update summary
    let summaryText = `Report Summary: <b style="color: #2980b9;">${totalStudents}</b> students found`;
    if (gradeFilter && gradeFilter.value) {
        summaryText += ` in <b style="color: #2980b9;">${gradeFilter.value}</b>`;
    }
    if (searchQuery) {
        summaryText += ` matching <b style="color: #2980b9;">"${searchQuery}"</b>`;
    }
    reportSummary.innerHTML = summaryText + '.';

    // Update pagination info
    if (totalStudents > 0) {
        paginationInfo.textContent = `Showing ${startIndex + 1}-${endIndex} of ${totalStudents} students`;
    } else {
        paginationInfo.textContent = 'No students found';
    }

    // Render table
    tableBody.innerHTML = '';

    if (studentsToRender.length === 0) {
        const row = tableBody.insertRow();
        const cell = row.insertCell(0);
        cell.colSpan = 6 + selectedFields.length;
        cell.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #7f8c8d;">
                <div style="font-size: 48px; margin-bottom: 16px;">🔍</div>
                <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">No students found</div>
                <div style="font-size: 14px;">Try adjusting your filters or search query</div>
            </div>
        `;
        paginationControls.innerHTML = '';
        return;
    }
    // In renderCurrentPage(), highlight search matches in table cells
if (searchQuery) {
    const cells = tableBody.querySelectorAll('td');
    cells.forEach(cell => {
        const text = cell.textContent;
        if (text.toLowerCase().includes(searchQuery)) {
            cell.style.background = '#fff3cd';
            cell.style.fontWeight = 'bold';
        }
    });
}

    studentsToRender.forEach((student, index) => {
        const row = tableBody.insertRow();
        row.dataset.studentId = student.id;
        row.dataset.rowIndex = startIndex + index;
        
        row.insertCell(0).textContent = (startIndex + index + 1).toString();
        row.insertCell(1).textContent = student['Grade'] || 'N/A';
        row.insertCell(2).textContent = student['Official Student Name'] || 'N/A'; 
        row.insertCell(3).textContent = student['Assessment No'] || 'N/A'; 
        row.insertCell(4).textContent = student['UPI'] || 'N/A'; 
        row.insertCell(5).textContent = student['Home phone'] || 'N/A';
        
        let cellIndex = 6;
        selectedFields.forEach(fieldName => {
            const cell = row.insertCell(cellIndex);
            const value = student[fieldName];
            
            if (value === undefined || value === null || value === "" || 
                (typeof value === 'string' && (value.toUpperCase() === 'NA' || value.toUpperCase() === 'N/A'))) {
                cell.innerHTML = '<span style="color: #e74c3c; font-weight: 600;">[EMPTY]</span>';
                cell.style.background = '#ffebee';
            } else {
                cell.textContent = value;
            }
            
            cellIndex++;
        });

        
    });

    renderPaginationControls(totalPages);
    //     // ⭐ ADD THESE THREE LINES AT THE END ⭐
    highlightSearchMatches();
    makeRowsClickable();
    updateRecordStats();
    
}







function getMissingFieldsReport() {
    const fieldStats = {};
    Object.keys(studentsData[0] || {}).forEach(field => {
        const missing = studentsData.filter(s => !s[field] || s[field] === 'N/A').length;
        fieldStats[field] = {
            missing,
            percentage: ((missing / studentsData.length) * 100).toFixed(1)
        };
    });
    return fieldStats;
}


function getGradeWiseStats() {
    const gradeStats = {};
    studentsData.forEach(student => {
        const grade = student['Grade'];
        if (!gradeStats[grade]) {
            gradeStats[grade] = { total: 0, complete: 0 };
        }
        gradeStats[grade].total++;
        if (student['Official Student Name'] && student['UPI']) {
            gradeStats[grade].complete++;
        }
    });
    return gradeStats;
}
// Add to fetchStudentsData()
const lastUpdated = new Date().toLocaleString();
document.getElementById('last-updated').textContent = `Last updated: ${lastUpdated}`;




function goToPage(page) {
    const totalPages = Math.ceil(filteredAndSearchedStudents.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderCurrentPage();
    
    document.querySelector('#studentTable').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
    });
}

function renderPaginationControls(totalPages) {
    paginationControls.innerHTML = '';
    
    if (totalPages <= 1) return;

    const buttonStyle = `
        padding: 8px 12px;
        margin: 0 4px;
        border: 2px solid #3498db;
        background: white;
        color: #3498db;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        font-size: 14px;
        transition: all 0.3s ease;
    `;

    const activeButtonStyle = `
        padding: 8px 12px;
        margin: 0 4px;
        border: 2px solid #3498db;
        background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
        color: white;
        border-radius: 6px;
        cursor: default;
        font-weight: 600;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
    `;

    const disabledButtonStyle = `
        padding: 8px 12px;
        margin: 0 4px;
        border: 2px solid #bdc3c7;
        background: #ecf0f1;
        color: #95a5a6;
        border-radius: 6px;
        cursor: not-allowed;
        font-weight: 600;
        font-size: 14px;
    `;

    // First button
    const firstBtn = document.createElement('button');
    firstBtn.innerHTML = '⟨⟨';
    firstBtn.title = 'First page';
    firstBtn.style.cssText = currentPage === 1 ? disabledButtonStyle : buttonStyle;
    firstBtn.disabled = currentPage === 1;
    firstBtn.onclick = () => goToPage(1);
    paginationControls.appendChild(firstBtn);

    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '⟨ Previous';
    prevBtn.style.cssText = currentPage === 1 ? disabledButtonStyle : buttonStyle;
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => goToPage(currentPage - 1);
    paginationControls.appendChild(prevBtn);

    // Page numbers
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    if (startPage > 1) {
        const ellipsis = document.createElement('span');
        ellipsis.textContent = '...';
        ellipsis.style.cssText = 'margin: 0 8px; color: #7f8c8d;';
        paginationControls.appendChild(ellipsis);
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.style.cssText = i === currentPage ? activeButtonStyle : buttonStyle;
        
        if (i !== currentPage) {
            pageBtn.onmouseenter = () => {
                pageBtn.style.background = '#3498db';
                pageBtn.style.color = 'white';
            };
            pageBtn.onmouseleave = () => {
                pageBtn.style.background = 'white';
                pageBtn.style.color = '#3498db';
            };
            pageBtn.onclick = () => goToPage(i);
        }
        
        paginationControls.appendChild(pageBtn);
    }

    if (endPage < totalPages) {
        const ellipsis = document.createElement('span');
        ellipsis.textContent = '...';
        ellipsis.style.cssText = 'margin: 0 8px; color: #7f8c8d;';
        paginationControls.appendChild(ellipsis);
    }

    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = 'Next ⟩';
    nextBtn.style.cssText = currentPage === totalPages ? disabledButtonStyle : buttonStyle;
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => goToPage(currentPage + 1);
    paginationControls.appendChild(nextBtn);

    // Last button
    const lastBtn = document.createElement('button');
    lastBtn.innerHTML = '⟩⟩';
    lastBtn.title = 'Last page';
    lastBtn.style.cssText = currentPage === totalPages ? disabledButtonStyle : buttonStyle;
    lastBtn.disabled = currentPage === totalPages;
    lastBtn.onclick = () => goToPage(totalPages);
    paginationControls.appendChild(lastBtn);
}


// ============================================
// UPDATE ANALYTICS SECTION
// ============================================
function updateAnalyticsSection() {
    if (studentsData.length === 0) return;
    
    // ===== ENROLLMENT RATE =====
    // Calculate percentage of students with complete basic info
    const basicFields = ['Official Student Name', 'Grade', 'Assessment No'];
    let studentsWithBasicInfo = 0;
    
    studentsData.forEach(student => {
        const hasBasicInfo = basicFields.every(field => {
            const value = student[field];
            return value && value !== '' && value !== 'N/A' && value !== 'NA';
        });
        if (hasBasicInfo) studentsWithBasicInfo++;
    });
    
    const enrollmentRate = studentsData.length > 0 
        ? ((studentsWithBasicInfo / studentsData.length) * 100).toFixed(1) 
        : 0;
    
    // ===== DATA COMPLETION RATE =====
    // Calculate actual completion from all fields
    const allFields = Object.keys(studentsData[0] || {}).filter(key => key !== 'id');
    let totalPossibleFields = studentsData.length * allFields.length;
    let completedFieldsCount = 0;
    
    studentsData.forEach(student => {
        allFields.forEach(field => {
            const value = student[field];
            if (value && value !== '' && value !== 'N/A' && value !== 'NA') {
                completedFieldsCount++;
            }
        });
    });
    
    const dataCompletionRate = totalPossibleFields > 0 
        ? ((completedFieldsCount / totalPossibleFields) * 100).toFixed(1) 
        : 0;
    
    // ===== GRADE DISTRIBUTION =====
    // Calculate actual grade distribution from database
    const gradeCounts = {};
    const totalStudents = studentsData.length;
    
    studentsData.forEach(student => {
        const grade = student['Grade'];
        if (grade) {
            gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;
        }
    });
    
    // Calculate percentages and sort by count (descending)
    const gradeDistribution = Object.entries(gradeCounts)
        .map(([grade, count]) => ({
            grade: grade,
            count: count,
            percentage: ((count / totalStudents) * 100).toFixed(1)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3); // Get top 3 grades
    
    // ===== UPDATE ANALYTICS CARDS IN DOM =====
    const analyticsCards = document.querySelectorAll('.analytics-card');
    
    if (analyticsCards.length >= 3) {
        // ===== Card 1: ENROLLMENT RATE =====
        const enrollmentCard = analyticsCards[0];
        const enrollmentLabels = enrollmentCard.querySelectorAll('.progress-label span');
        const enrollmentFill = enrollmentCard.querySelector('.progress-fill');
        
        if (enrollmentLabels.length >= 2) {
            enrollmentLabels[1].textContent = `${enrollmentRate}%`;
        }
        if (enrollmentFill) {
            enrollmentFill.style.width = `${enrollmentRate}%`;
        }
        
        // ===== Card 2: DATA COMPLETION =====
        const completionCard = analyticsCards[1];
        const completionLabels = completionCard.querySelectorAll('.progress-label span');
        const completionFill = completionCard.querySelector('.progress-fill');
        
        if (completionLabels.length >= 2) {
            completionLabels[1].textContent = `${dataCompletionRate}%`;
        }
        if (completionFill) {
            completionFill.style.width = `${dataCompletionRate}%`;
        }
        
        // ===== Card 3: GRADE DISTRIBUTION =====
        const gradeCard = analyticsCards[2];
        const h3 = gradeCard.querySelector('h3');
        
        if (h3) {
            // Remove old progress bars and labels
            const oldElements = gradeCard.querySelectorAll('.progress-label, .progress-bar, p[style*="margin-top"]');
            oldElements.forEach(el => el.remove());
            
            // Build new grade distribution HTML
            let gradeHTML = '';
            gradeDistribution.forEach((item, index) => {
                const marginTop = index > 0 ? 'margin-top: 15px;' : '';
                gradeHTML += `
                    <div class="progress-label" style="${marginTop}">
                        <span>Grade ${item.grade}</span>
                        <span>${item.percentage}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${item.percentage}%"></div>
                    </div>
                `;
            });
            
            // Insert after h3
            h3.insertAdjacentHTML('afterend', gradeHTML);
        }
    }
    
    // ===== LOG ANALYTICS DATA (For debugging) =====
    console.log('Analytics Data:', {
        totalStudents: studentsData.length,
        enrollmentRate: `${enrollmentRate}%`,
        dataCompletionRate: `${dataCompletionRate}%`,
        gradeDistribution: gradeDistribution,
        allGrades: gradeCounts
    });
}
// ============================================
// EXPORT TO PDF
// ============================================

async function exportMissingDataToPdf() {
    if (!window.jspdf) {
        alert('PDF library not loaded. Please refresh the page and try again.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape');

    const selectedGrade = gradeFilter ? gradeFilter.value : '';
    let dataToExport = filteredAndSearchedStudents;

    if (dataToExport.length === 0) {
        alert('No data to export. Please adjust your filters.');
        return;
    }

    const title = `Student Biodata Report`;
    const subtitle = `Complete Student Information`;
    const gradeInfo = selectedGrade ? `Grade ${selectedGrade}` : 'All Grades';
    const totalStudents = dataToExport.length;
    
    const headers = [
        'No.',
        'Official Student Name',
        'Grade',
        'UPI',
        'Assessment No',
        'Home phone',
        ...selectedFields
    ];
    
    const body = dataToExport.map((student, index) => {
        const row = [
            String(index + 1),
            String(student['Official Student Name'] || 'N/A'),
            String(student['Grade'] || 'N/A'),
            String(student['UPI'] || 'N/A'),
            String(student['Assessment No'] || 'N/A'),
            String(student['Home phone'] || 'N/A')
        ];
        
        selectedFields.forEach(fieldName => {
            const value = student[fieldName];
            if (value === undefined || value === null || value === "") {
                row.push('[EMPTY]');
            } else if (typeof value === 'string' && (value.toUpperCase() === 'NA' || value.toUpperCase() === 'N/A')) {
                row.push(`[${value.toUpperCase()}]`);
            } else {
                row.push(String(value));
            }
        });
        
        return row;
    });

    const addHeader = () => {
        const pageWidth = doc.internal.pageSize.width;
        
        doc.setFillColor(41, 128, 185);
        doc.rect(0, 0, pageWidth, 20, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('KANYADET PRI & JUNIOR SCHOOL', 14, 10);
        
        doc.setFontSize(12);
        doc.text(title, 14, 16);
        
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        const dateText = `Date: ${new Date().toLocaleDateString()}`;
        doc.text(dateText, pageWidth - 14, 6, { align: 'right' });
        doc.text(subtitle, pageWidth - 14, 11, { align: 'right' });
        doc.text(gradeInfo, pageWidth - 14, 16, { align: 'right' });
        
        doc.setDrawColor(41, 128, 185);
        doc.setLineWidth(0.5);
        doc.line(0, 20, pageWidth, 20);
    };

    const addFooter = (data, totalPages) => {
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const footerY = pageHeight - 15;
        
        doc.setFillColor(245, 245, 245);
        doc.rect(0, footerY - 5, pageWidth, 20, 'F');
        
        doc.setDrawColor(41, 128, 185);
        doc.setLineWidth(0.5);
        doc.line(0, footerY - 5, pageWidth, footerY - 5);
        doc.setTextColor(41, 128, 185);
        
        doc.setFontSize(10);
        doc.text(`Total Students: ${totalStudents}`, 14, footerY + 5);
        const pageText = `Page ${data.pageNumber} of ${totalPages}`;
        doc.text(pageText, pageWidth - 14, footerY + 5, { align: 'right' });
    };

    doc.autoTable({
        head: [headers],
        body: body,
        startY: 25, 
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        didDrawPage: (data) => {
            addHeader();
            const totalPages = doc.internal.getNumberOfPages();
            addFooter(data, totalPages);
        }
    });

    const fileName = `Student_Biodata_Report_${selectedGrade || 'All_Grades'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    NotificationManager.success('PDF report generated successfully!');
}
// Make exportMissingDataToPdf globally available
window.exportMissingDataToPdf = exportMissingDataToPdf;
// ============================================
// END OF FILE
// ============================================
// Note: Ensure that the HTML file includes the necessary script tags to load this JS file and any required libraries.



function getRecordStats() {
    if (studentsData.length === 0) return { complete: 0, incomplete: 0, total: 0 };
    
    const basicFields = ['Official Student Name', 'Grade', 'UPI'];
    const complete = studentsData.filter(s => 
        basicFields.every(f => s[f] && s[f] !== '' && s[f] !== 'N/A')
    ).length;
    
    const incomplete = studentsData.length - complete;
    
    return { complete, incomplete, total: studentsData.length };
}

function updateRecordStats() {
    const stats = getRecordStats();
    const recordStatsDiv = document.getElementById('record-stats');
    
    if (recordStatsDiv) {
        recordStatsDiv.innerHTML = `
            <strong>Complete:</strong> ${stats.complete} | 
            <strong>Incomplete:</strong> ${stats.incomplete}
        `;
    }
}

function getStudentStatus(student) {
    const basicFields = ['Official Student Name', 'Grade', 'UPI'];
    const hasAllFields = basicFields.every(f => student[f] && student[f] !== '' && student[f] !== 'N/A');
    
    return hasAllFields ? 'complete' : 'incomplete';
}


// ============================================
// ⭐ NEW FEATURE 3: SEARCH HIGHLIGHTING
// ============================================

function highlightSearchMatches() {
    if (!searchQuery) return;
    
    const cells = tableBody.querySelectorAll('td');
    cells.forEach(cell => {
        const text = cell.textContent;
        if (text.toLowerCase().includes(searchQuery)) {
            cell.classList.add('search-highlight');
        }
    });
}


// ============================================
// ⭐ NEW FEATURE 4: STUDENT DETAIL MODAL
// ============================================

function showStudentModal(student) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.onclick = () => modal.remove();
    
    const allKeys = Object.keys(student).filter(k => k !== 'id');
    
    let fieldsHTML = '';
    allKeys.forEach(key => {
        const value = student[key] || 'N/A';
        fieldsHTML += `<p><strong>${key}:</strong> ${value}</p>`;
    });
    
    const status = getStudentStatus(student);
    const statusBadge = status === 'complete' 
        ? '<span class="status-complete">✓ Complete</span>'
        : '<span class="status-incomplete">✗ Incomplete</span>';
    
    modal.innerHTML = `
        <div class="modal-content" onclick="event.stopPropagation()">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px;">
                <div>
                    <h2>${student['Official Student Name'] || 'Unknown'}</h2>
                    <p style="margin: 8px 0 0 0; color: #7f8c8d;">Grade ${student['Grade'] || 'N/A'}</p>
                </div>
                <div>${statusBadge}</div>
            </div>
            
            <div style="max-height: 400px; overflow-y: auto; margin-bottom: 20px;">
                ${fieldsHTML}
            </div>
            
            <button onclick="this.parentElement.parentElement.remove()" style="width: 100%;">
                Close
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
}


// ============================================
// ⭐ NEW FEATURE 5: LAST UPDATED TIME
// ============================================

function updateLastUpdatedTime() {
    const lastUpdated = document.getElementById('last-updated');
    if (lastUpdated) {
        const now = new Date().toLocaleString();
        lastUpdated.textContent = `Last updated: ${now}`;
    }
}


// ============================================
// ⭐ NEW FEATURE 6: MISSING FIELDS REPORT
// ============================================

function getMissingFieldsReport() {
    if (studentsData.length === 0) return {};
    
    const fieldStats = {};
    const allKeys = Object.keys(studentsData[0]).filter(k => k !== 'id');
    
    allKeys.forEach(field => {
        const missing = studentsData.filter(s => !s[field] || s[field] === 'N/A' || s[field] === '').length;
        fieldStats[field] = {
            missing,
            percentage: ((missing / studentsData.length) * 100).toFixed(1),
            filled: studentsData.length - missing
        };
    });
    
    return fieldStats;
}

function logMissingFieldsReport() {
    const report = getMissingFieldsReport();
    console.log('📋 MISSING FIELDS REPORT:', report);
    
    // Find most missing fields
    const sorted = Object.entries(report)
        .sort((a, b) => b[1].percentage - a[1].percentage)
        .slice(0, 5);
    
    console.log('🔴 Top 5 Fields with Missing Data:');
    sorted.forEach(([field, stats]) => {
        console.log(`  ${field}: ${stats.missing} missing (${stats.percentage}%)`);
    });
}


// ============================================
// ⭐ NEW FEATURE 7: MAKE ROWS CLICKABLE
// ============================================

function makeRowsClickable() {
    const rows = tableBody.querySelectorAll('tr');
    rows.forEach(row => {
        row.style.cursor = 'pointer';
        row.onclick = () => {
            const studentId = row.dataset.studentId;
            const student = studentsData.find(s => s.id === studentId);
            if (student) {
                showStudentModal(student);
            }
        };
    });
}



