/**
 * Student-Focused Missing Data Reporter
 * Shows students with missing data and allows editing all missing fields at once
 */

// Global variables for Firebase imports and application state
let firebaseImports;
let studentsData = [];
let db;
let auth;
let pendingUpdates = new Map(); // Track all pending changes across students

// Pagination and search state
let currentPage = 1;
let itemsPerPage = 1; // shows number of students per page
let filteredAndSearchedStudents = [];
let searchQuery = '';

// --- Firebase Configuration ---
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

// --- DOM Elements ---
let gradeFilter, studentFilter, searchInput, itemsPerPageSelect, tableBody;
let reportSummary, paginationInfo, paginationControls, loader;
let signInBtn, signOutBtn, userInfo, controlsDiv, printAreaDiv, saveAllBtn;

// Auto-clear on focus for all inputs
document.addEventListener('focus', function(e) {
    if (e.target.tagName === 'INPUT' && 
        (e.target.type === 'text' || e.target.type === 'search')) {
        if (e.target.value) {
            e.target.value = '';
            e.target.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }
}, true);

// --- Enhanced Notification System ---
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
            backdrop-filter: blur(10px);
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        
        notification.innerHTML = `
            <div style="
                font-size: 24px;
                font-weight: bold;
                min-width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 50%;
            ">${icons[type]}</div>
            <div style="flex: 1; font-size: 14px; line-height: 1.5;">${message}</div>
            <div style="
                font-size: 20px;
                opacity: 0.7;
                cursor: pointer;
                padding: 0 4px;
            " onclick="this.parentElement.remove()">×</div>
        `;
        
        notification.onmouseenter = () => {
            notification.style.transform = 'translateX(-4px)';
            notification.style.boxShadow = `0 12px 32px ${color.shadow}`;
        };
        notification.onmouseleave = () => {
            notification.style.transform = 'translateX(0)';
            notification.style.boxShadow = `0 8px 24px ${color.shadow}`;
        };
        
        this.container.insertBefore(notification, this.container.firstChild);
        
        if (duration > 0) {
            setTimeout(() => {
                notification.style.animation = 'slideOut 0.4s ease-in-out';
                setTimeout(() => notification.remove(), 400);
            }, duration);
        }
        
        return id;
    },
    
    success(message, duration) {
        return this.show(message, 'success', duration);
    },
    
    error(message, duration) {
        return this.show(message, 'error', duration);
    },
    
    warning(message, duration) {
        return this.show(message, 'warning', duration);
    },
    
    info(message, duration) {
        return this.show(message, 'info', duration);
    }
};

// Add animation styles
if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        @keyframes shimmer {
            0% { background-position: -1000px 0; }
            100% { background-position: 1000px 0; }
        }
    `;
    document.head.appendChild(style);
}

// --- Main Application Flow ---

document.addEventListener('DOMContentLoaded', () => {
    firebaseImports = window.firebaseImports;
    if (firebaseImports) {
        initializeAppAndSetListeners();
    } else {
        userInfo.textContent = "Error: Firebase modules failed to load.";
        loader.style.display = 'none';
        NotificationManager.error('Failed to initialize Firebase modules');
    }
});

function initializeAppAndSetListeners() {
    const { initializeApp, getDatabase, getAuth, onAuthStateChanged } = firebaseImports;
    
    // Initialize DOM elements
    gradeFilter = document.getElementById('grade-filter');
    studentFilter = document.getElementById('student-filter');
    searchInput = document.getElementById('search-input');
    itemsPerPageSelect = document.getElementById('items-per-page');
    tableBody = document.querySelector('#missing-data-table tbody');
    reportSummary = document.getElementById('report-summary');
    paginationInfo = document.getElementById('pagination-info');
    paginationControls = document.getElementById('pagination-controls');
    loader = document.getElementById('loader');
    signInBtn = document.getElementById('google-sign-in-btn');
    signOutBtn = document.getElementById('sign-out-btn');
    userInfo = document.getElementById('user-info');
    controlsDiv = document.querySelector('.controls');
    printAreaDiv = document.getElementById('print-area');
    saveAllBtn = document.getElementById('save-all-btn');
    
    // Check for required elements
    if (!gradeFilter || !studentFilter || !searchInput || !itemsPerPageSelect || 
        !tableBody || !reportSummary || !paginationInfo || !paginationControls || 
        !loader || !signInBtn || !signOutBtn || !userInfo || !controlsDiv || 
        !printAreaDiv || !saveAllBtn) {
        console.error('Missing required DOM elements. Please check your HTML.');
        if (userInfo) {
            userInfo.textContent = "Error: Missing required HTML elements. Please check console.";
        }
        if (loader) {
            loader.style.display = 'none';
        }
        NotificationManager.error('Missing required HTML elements. Please ensure all elements are present.');
        return;
    }
    
    try {
        const app = initializeApp(customFirebaseConfig);
        db = getDatabase(app);
        auth = getAuth(app);
        
        controlsDiv.style.display = 'none';
        printAreaDiv.style.display = 'none';
        reportSummary.textContent = 'Please sign in to load the data.';

        onAuthStateChanged(auth, (user) => {
            if (user) {
                handleSignIn(user);
            } else {
                handleSignOut();
            }
        });

        gradeFilter.addEventListener('change', () => {
            currentPage = 1;
            populateStudentFilter();
            applyFilters();
        });
        studentFilter.addEventListener('change', () => {
            currentPage = 1;
            applyFilters();
        });
        searchInput.addEventListener('input', handleSearch);
        itemsPerPageSelect.addEventListener('change', handleItemsPerPageChange);
        signInBtn.addEventListener('click', signInWithGoogle);
        signOutBtn.addEventListener('click', signOutUser);
        saveAllBtn.addEventListener('click', saveAllChanges);

    } catch (e) {
        console.error("Firebase Initialization Error:", e);
        userInfo.textContent = `Error initializing Firebase: ${e.message}`;
        loader.style.display = 'none';
        NotificationManager.error(`Firebase initialization failed: ${e.message}`);
    }
}

// --- Authentication Functions ---

async function signInWithGoogle() {
    const { GoogleAuthProvider, signInWithPopup } = firebaseImports;
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
        NotificationManager.success('Successfully signed in! Welcome aboard.');
    } catch (error) {
        console.error("Google Sign-In Error:", error);
        userInfo.textContent = `Sign-in failed: ${error.message}`;
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
    signInBtn.style.display = 'none';
    signOutBtn.style.display = 'inline-block';
    controlsDiv.style.display = 'flex';
    printAreaDiv.style.display = 'block';
    
    fetchStudentsData();
}

function handleSignOut() {
    userInfo.textContent = "Please sign in to view the student data.";
    signInBtn.style.display = 'inline-block';
    signOutBtn.style.display = 'none';
    loader.style.display = 'none'; 
    
    studentsData = [];
    filteredAndSearchedStudents = [];
    searchQuery = '';
    currentPage = 1;
    pendingUpdates.clear();
    searchInput.value = '';
    tableBody.innerHTML = '';
    reportSummary.textContent = 'Please sign in to load the data.';
    paginationInfo.textContent = '';
    paginationControls.innerHTML = '';
    controlsDiv.style.display = 'none';
    printAreaDiv.style.display = 'none';
    updateSaveAllButton();
}

// --- Search and Pagination Handlers ---

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

function goToPage(page) {
    const totalPages = Math.ceil(filteredAndSearchedStudents.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderCurrentPage();
    
    document.querySelector('#missing-data-table').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
    });
}

// --- Data Fetching and Filtering Functions ---

function fetchStudentsData() {
    loader.style.display = 'flex'; 

    const { ref, onValue } = firebaseImports;
    const studentsRef = ref(db, `Alumni/${sanitizedAppId}/students`);
    
    onValue(studentsRef, (snapshot) => {
        const students = [];
        const data = snapshot.val();
        
        if (data) {
            for (let key in data) {
                students.push({ id: key, ...data[key] }); 
            }
        }
        
        students.sort((a, b) => {
            const assessmentNoA = parseFloat(a['Assessment No']) || Infinity;
            const assessmentNoB = parseFloat(b['Assessment No']) || Infinity;
            return assessmentNoA - assessmentNoB;
        });

        studentsData = students;
        populateFilters(students);
        applyFilters(); 
        loader.style.display = 'none';
        
        NotificationManager.success(`Loaded ${students.length} student records successfully`);
    }, (error) => {
        console.error("Error fetching students:", error);
        reportSummary.textContent = `Error fetching data: ${error.message}. Please check your Firebase Security Rules.`;
        loader.style.display = 'none';
        NotificationManager.error(`Failed to fetch data: ${error.message}`);
    });
}

function populateFilters(students) {
    const grades = new Set();

    students.forEach(student => {
        if (student['Grade']) {
            grades.add(student['Grade']);
        }
    });

    gradeFilter.innerHTML = '<option value="">All Grades</option>';
    Array.from(grades).sort().forEach(grade => {
        const option = document.createElement('option');
        option.value = grade;
        option.textContent = `Grade ${grade}`;
        gradeFilter.appendChild(option);
    });

    populateStudentFilter();
}

function populateStudentFilter() {
    const selectedGrade = gradeFilter.value;
    let studentsForFilter = studentsData;

    if (selectedGrade) {
        studentsForFilter = studentsData.filter(s => s['Grade'] === selectedGrade);
    }

    // Only show students with missing data
    studentsForFilter = studentsForFilter.filter(student => {
        const missingFields = getMissingFields(student);
        return missingFields.length > 0;
    });

    studentFilter.innerHTML = '<option value="">All Students with Missing Data</option>';
    studentsForFilter.forEach(student => {
        const option = document.createElement('option');
        option.value = student.id;
        const missingCount = getMissingFields(student).length;
        option.textContent = `${student['Official Student Name'] || 'N/A'} (${missingCount} missing)`;
        studentFilter.appendChild(option);
    });
}

function getMissingFields(student) {
    const excludedFields = [
        'id', 'Assessment No', 'Official Student Name', 'Gender', 
        'Class', 'Grade'
    ];
    
    const missingFields = [];
    
    for (let key in student) {
        if (excludedFields.includes(key)) continue;
        
        const value = student[key];
        if (value === undefined || value === null || value === "") {
            missingFields.push(key);
        } else if (typeof value === 'string' && 
                   (value.toUpperCase() === 'NA' || 
                    value.toUpperCase() === 'N/A' || 
                    value.toUpperCase() === '---' || 
                    value.toUpperCase() === '-')) {
            missingFields.push(key);
        }
    }
    
    return missingFields;
}



function getAllEditableFields(student) {
    const excludedFields = [
        'id', 'Assessment No', 'Official Student Name', 'Gender', 
        'Class', 'Grade'
    ];
    
    const editableFields = [];
    
    for (let key in student) {
        if (excludedFields.includes(key)) continue;
        editableFields.push(key);
    }
    
    return editableFields;
}

function applyFilters() {
    const selectedGrade = gradeFilter.value;
    const selectedStudentId = studentFilter.value;
    let filtered = studentsData;

    // Apply grade filter
    if (selectedGrade) {
        filtered = filtered.filter(student => student['Grade'] === selectedGrade);
    }

    // Filter to only students with missing data
    filtered = filtered.filter(student => getMissingFields(student).length > 0);

    // Apply student filter
    if (selectedStudentId) {
        filtered = filtered.filter(student => student.id === selectedStudentId);
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

// --- Advanced Rendering with Pagination ---

function renderCurrentPage() {
    const selectedStudentId = studentFilter.value;
    const totalStudents = filteredAndSearchedStudents.length;
    const totalPages = Math.ceil(totalStudents / itemsPerPage);
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalStudents);
    const studentsToRender = filteredAndSearchedStudents.slice(startIndex, endIndex);

    // Update summary
    let summaryText = `Report Summary: <b style="color: #2980b9;">${totalStudents}</b> students with missing data`;
    if (gradeFilter.value) {
        summaryText += ` in <b style="color: #2980b9;">Grade ${gradeFilter.value}</b>`;
    }
    if (selectedStudentId) {
        const student = studentsData.find(s => s.id === selectedStudentId);
        if (student) {
            summaryText += ` - Viewing: <b style="color: #2980b9;">${student['Official Student Name']}</b>`;
        }
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
        cell.colSpan = 5;
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

    studentsToRender.forEach((student, index) => {
        renderStudentRow(student, startIndex + index);
    });

    // Render pagination controls
    renderPaginationControls(totalPages);
}
function renderStudentRow(student, globalIndex) {
    const editableFields = getAllEditableFields(student);
    const missingFields = getMissingFields(student);
    const filledFields = editableFields.filter(f => !missingFields.includes(f));
    
    const row = tableBody.insertRow();
    row.dataset.studentId = student.id;
    row.style.cssText = 'border-bottom: 4px solid #064671ff; background: white;';
    
    // Track which fields to show for this row
    let showMissing = true;
    
    // Index
    const indexCell = row.insertCell(0);
    indexCell.textContent = (globalIndex + 1).toString();
    indexCell.style.cssText = 'font-weight: bold; vertical-align: top; padding-top: 20px; border-right: 1px solid #ecf0f1;';
    
    // Student Info
    const infoCell = row.insertCell(1);
    infoCell.style.cssText = 'vertical-align: top; padding-top: 20px; border-right: 1px solid #ecf0f1;';
    infoCell.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 4px;">
            <div style="font-weight: 600; font-size: 14px; color: #2c3e50;">${student['Official Student Name'] || 'N/A'}</div>
            <div style="font-size: 12px; color: #7f8c8d;">
                <span>Grade ${student['Grade'] || 'N/A'}</span> | 
                <span>Assessment No: ${student['Assessment No'] || 'N/A'}</span> | 
                <span>UPI: ${student['UPI'] || 'N/A'}</span>
            </div>
        </div>
    `;
    
    // Missing Fields Count - CLICKABLE
    const countCell = row.insertCell(2);
    countCell.style.cssText = 'vertical-align: top; padding-top: 20px; border-right: 1px solid #ecf0f1;';
    
    const missingFieldsCount = missingFields.length;
    const filledFieldsCount = filledFields.length;
    const totalFieldsCount = editableFields.length;
    
    const countContainer = document.createElement('div');
    countContainer.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';
    
    const missingBadge = document.createElement('div');
    missingBadge.style.cssText = `
        background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-weight: 600;
        text-align: center;
        display: inline-block;
        box-shadow: 0 2px 8px rgba(231, 76, 60, 0.3);
        cursor: pointer;
        transition: all 0.3s ease;
    `;
    missingBadge.textContent = `${missingFieldsCount} Missing`;
    
    const filledBadge = document.createElement('div');
    filledBadge.style.cssText = `
        background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-weight: 600;
        text-align: center;
        display: inline-block;
        box-shadow: 0 2px 8px rgba(39, 174, 96, 0.3);
        cursor: pointer;
        transition: all 0.3s ease;
    `;
    filledBadge.textContent = `${filledFieldsCount} Filled`;
    
    countContainer.appendChild(missingBadge);
    countContainer.appendChild(filledBadge);
    countCell.appendChild(countContainer);
    
    // Fields List with Inputs - Will be toggled
    const fieldsCell = row.insertCell(3);
    fieldsCell.style.cssText = 'padding: 16px 12px; background: #fafbfc; border-right: 1px solid #ecf0f1;';
    
    const fieldsContainer = document.createElement('div');
    fieldsContainer.style.cssText = 'display: flex; flex-direction: column; gap: 12px;';
    
    // Function to render fields based on filter
    const renderFields = (fieldsToShow) => {
        fieldsContainer.innerHTML = '';
        
        fieldsToShow.forEach((fieldName, index) => {
            const isMissing = missingFields.includes(fieldName);
            const currentValue = student[fieldName] || '';
            
            const fieldRow = document.createElement('div');
            fieldRow.style.cssText = 'display: flex; align-items: center; gap: 8px; padding: 8px; background: white; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 4px solid #95a5a6; border-right: 4px solid #95a5a6;';
            
            const label = document.createElement('div');
            label.style.cssText = 'min-width: 150px; font-weight: 500; font-size: 13px; color: #2c3e50;';
            label.textContent = fieldName + ':';
            
            // Add indicator for missing fields
            if (isMissing) {
                const indicator = document.createElement('span');
                indicator.textContent = '⚠ Missing';
                indicator.style.cssText = 'font-size: 10px; color: #e74c3c; font-weight: bold; white-space: nowrap; margin-left: 4px;';
                label.appendChild(indicator);
            }
            
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'missing-field-input';
            input.value = currentValue;
            input.placeholder = `Enter ${fieldName}...`;
            input.dataset.studentId = student.id;
            input.dataset.fieldName = fieldName;
            input.dataset.originalValue = currentValue; // Store original value
            input.style.cssText = `
                flex: 1;
                padding: 8px 12px;
                border: 2px solid ${isMissing ? '#e74c3c' : '#27ae60'};
                border-radius: 6px;
                font-size: 13px;
                transition: all 0.3s ease;
                background: ${isMissing ? '#ffe6e6' : '#e8f8f0'};
            `;
            
            input.addEventListener('focus', () => {
                input.style.borderColor = '#3498db';
                input.style.boxShadow = '0 0 0 3px rgba(52, 152, 219, 0.1)';
            });
            
            input.addEventListener('blur', () => {
                const newValue = input.value.trim();
                const originalValue = input.dataset.originalValue;
                
                // Revert to original value if no pending update exists
                const key = `${student.id}:${fieldName}`;
                if (!pendingUpdates.has(key)) {
                    input.value = originalValue;
                }
                
                if (newValue !== originalValue) {
                    input.style.borderColor = '#f39c12';
                    input.style.background = '#fff9e6';
                } else {
                    input.style.borderColor = isMissing ? '#e74c3c' : '#27ae60';
                    input.style.background = isMissing ? '#ffe6e6' : '#e8f8f0';
                }
            });
            
            input.addEventListener('input', () => {
                const newValue = input.value.trim();
                const originalValue = input.dataset.originalValue;
                const key = `${student.id}:${fieldName}`;
                
                if (newValue && newValue !== originalValue) {
                    pendingUpdates.set(key, {
                        studentId: student.id,
                        fieldName: fieldName,
                        value: newValue,
                        studentName: student['Official Student Name']
                    });
                    input.style.borderColor = '#f39c12';
                    input.style.background = '#fff9e6';
                } else {
                    pendingUpdates.delete(key);
                    input.style.borderColor = isMissing ? '#e74c3c' : '#27ae60';
                    input.style.background = isMissing ? '#ffe6e6' : '#e8f8f0';
                }
                
                updateSaveAllButton();
            });
            
            fieldRow.appendChild(label);
            fieldRow.appendChild(input);
            fieldsContainer.appendChild(fieldRow);
        });
    };
    
    // Initial render - show missing fields by default
    renderFields(missingFields);
    fieldsCell.appendChild(fieldsContainer);
    
    // Add click handlers to toggle between missing and filled
    missingBadge.addEventListener('click', () => {
        showMissing = true;
        renderFields(missingFields);
        missingBadge.style.opacity = '1';
        missingBadge.style.transform = 'scale(1.05)';
        filledBadge.style.opacity = '0.6';
        filledBadge.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            missingBadge.style.transform = 'scale(1)';
        }, 150);
    });
    
    missingBadge.addEventListener('mouseenter', () => {
        if (showMissing) {
            missingBadge.style.boxShadow = '0 4px 16px rgba(231, 76, 60, 0.4)';
        } else {
            missingBadge.style.opacity = '0.8';
        }
    });
    
    missingBadge.addEventListener('mouseleave', () => {
        missingBadge.style.boxShadow = '0 2px 8px rgba(231, 76, 60, 0.3)';
        missingBadge.style.opacity = showMissing ? '1' : '0.6';
    });
    
    filledBadge.addEventListener('click', () => {
        showMissing = false;
        renderFields(filledFields);
        filledBadge.style.opacity = '1';
        filledBadge.style.transform = 'scale(1.05)';
        missingBadge.style.opacity = '0.6';
        missingBadge.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            filledBadge.style.transform = 'scale(1)';
        }, 150);
    });
    
    filledBadge.addEventListener('mouseenter', () => {
        if (!showMissing) {
            filledBadge.style.boxShadow = '0 4px 16px rgba(39, 174, 96, 0.4)';
        } else {
            filledBadge.style.opacity = '0.8';
        }
    });
    
    filledBadge.addEventListener('mouseleave', () => {
        filledBadge.style.boxShadow = '0 2px 8px rgba(39, 174, 96, 0.3)';
        filledBadge.style.opacity = showMissing ? '0.6' : '1';
    });
    
    // Action Buttons
    const actionCell = row.insertCell(4);
    actionCell.style.cssText = 'padding: 12px; vertical-align: top; padding-top: 20px;';
    
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'display: flex; gap: 8px; justify-content: center;';
    
    const saveStudentBtn = document.createElement('button');
    saveStudentBtn.textContent = '💾 Save Student';
    saveStudentBtn.style.cssText = `
        padding: 10px 20px;
        background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        font-size: 13px;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(39, 174, 96, 0.3);
    `;
    
    saveStudentBtn.onmouseenter = () => {
        saveStudentBtn.style.transform = 'translateY(-2px)';
        saveStudentBtn.style.boxShadow = '0 4px 12px rgba(39, 174, 96, 0.4)';
    };
    saveStudentBtn.onmouseleave = () => {
        saveStudentBtn.style.transform = 'translateY(0)';
        saveStudentBtn.style.boxShadow = '0 2px 8px rgba(39, 174, 96, 0.3)';
    };
    
    saveStudentBtn.onclick = () => saveStudentChanges(student.id, row);
    
    buttonContainer.appendChild(saveStudentBtn);
    actionCell.appendChild(buttonContainer);
}

function updateSaveAllButton() {
    const count = pendingUpdates.size;
    
    if (count > 0) {
        saveAllBtn.style.display = 'inline-block';
        saveAllBtn.textContent = `💾 Save All Changes (${count})`;
        saveAllBtn.style.animation = 'pulse 2s infinite';
    } else {
        saveAllBtn.style.display = 'none';
        saveAllBtn.style.animation = 'none';
    }
}

async function saveStudentChanges(studentId, row) {
    const inputs = row.querySelectorAll('.missing-field-input');
    const updates = {};
    let hasUpdates = false;
    
    inputs.forEach(input => {
        const value = input.value.trim();
        if (value) {
            updates[input.dataset.fieldName] = value;
            hasUpdates = true;
        }
    });
    
    if (!hasUpdates) {
        NotificationManager.warning('Please enter at least one value before saving');
        return;
    }
    
    const { ref, update } = firebaseImports;
    const saveBtn = row.cells[4].querySelector('button');
    const originalBtnContent = saveBtn.innerHTML;
    
    try {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '⏳ Saving...';
        saveBtn.style.background = 'linear-gradient(90deg, #3498db, #2980b9, #3498db)';
        saveBtn.style.backgroundSize = '200% 100%';
        saveBtn.style.animation = 'shimmer 1.5s infinite';
        
        inputs.forEach(input => {
            input.disabled = true;
            input.style.opacity = '0.6';
        });
        
        const studentRef = ref(db, `Alumni/${sanitizedAppId}/students/${studentId}`);
        await update(studentRef, updates);
        
        // Update local data
        const student = studentsData.find(s => s.id === studentId);
        if (student) {
            Object.assign(student, updates);
        }
        
        // Remove from pending updates
        inputs.forEach(input => {
            const key = `${studentId}:${input.dataset.fieldName}`;
            pendingUpdates.delete(key);
        });
        
        saveBtn.innerHTML = '✓ Saved!';
        saveBtn.style.background = 'linear-gradient(135deg, #27ae60 0%, #229954 100%)';
        saveBtn.style.animation = '';
        
        const studentName = student ? student['Official Student Name'] : 'Student';
        const fieldCount = Object.keys(updates).length;
        
        NotificationManager.success(
            `<strong>${studentName}</strong><br/>` +
            `<span style="font-size: 12px;">✓ ${fieldCount} field${fieldCount !== 1 ? 's' : ''} updated successfully</span>`,
            5000
        );
        
        updateSaveAllButton();
        
        setTimeout(() => {
            row.style.transition = 'all 0.5s ease';
            row.style.transform = 'translateX(100%)';
            row.style.opacity = '0';
            
            setTimeout(() => {
                applyFilters();
            }, 500);
        }, 1500);
        
    } catch (error) {
        console.error('Error updating student:', error);
        
        saveBtn.innerHTML = '✕ Failed';
        saveBtn.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
        saveBtn.style.animation = '';
        
        NotificationManager.error(
            `<strong>Update Failed</strong><br/>` +
            `<span style="font-size: 12px;">${error.message}</span>`,
            5000
        );
        
        setTimeout(() => {
            saveBtn.innerHTML = originalBtnContent;
            saveBtn.style.background = 'linear-gradient(135deg, #27ae60 0%, #229954 100%)';
            saveBtn.disabled = false;
            inputs.forEach(input => {
                input.disabled = false;
                input.style.opacity = '1';
            });
        }, 2000);
    }
}

async function saveAllChanges() {
    if (pendingUpdates.size === 0) {
        NotificationManager.warning('No pending changes to save');
        return;
    }
    
    const { ref, update } = firebaseImports;
    const originalBtnContent = saveAllBtn.innerHTML;
    const updateCount = pendingUpdates.size;
    
    // Group updates by student
    const studentUpdates = new Map();
    pendingUpdates.forEach((updateInfo, key) => {
        if (!studentUpdates.has(updateInfo.studentId)) {
            studentUpdates.set(updateInfo.studentId, {
                updates: {},
                studentName: updateInfo.studentName
            });
        }
        studentUpdates.get(updateInfo.studentId).updates[updateInfo.fieldName] = updateInfo.value;
    });
    
    try {
        saveAllBtn.disabled = true;
        saveAllBtn.innerHTML = '⏳ Saving All...';
        saveAllBtn.style.background = 'linear-gradient(90deg, #3498db, #2980b9, #3498db)';
        saveAllBtn.style.backgroundSize = '200% 100%';
        saveAllBtn.style.animation = 'shimmer 1.5s infinite';
        
        // Disable all inputs
        document.querySelectorAll('.missing-field-input').forEach(input => {
            input.disabled = true;
            input.style.opacity = '0.6';
        });
        
        let successCount = 0;
        let failCount = 0;
        const errors = [];
        
        // Process each student's updates
        for (const [studentId, data] of studentUpdates) {
            try {
                const studentRef = ref(db, `Alumni/${sanitizedAppId}/students/${studentId}`);
                await update(studentRef, data.updates);
                
                // Update local data
                const student = studentsData.find(s => s.id === studentId);
                if (student) {
                    Object.assign(student, data.updates);
                }
                
                successCount++;
            } catch (error) {
                console.error(`Error updating student ${studentId}:`, error);
                failCount++;
                errors.push({
                    studentName: data.studentName,
                    error: error.message
                });
            }
        }
        
        // Clear pending updates
        pendingUpdates.clear();
        updateSaveAllButton();
        
        if (failCount === 0) {
            saveAllBtn.innerHTML = '✓ All Saved!';
            saveAllBtn.style.background = 'linear-gradient(135deg, #27ae60 0%, #229954 100%)';
            saveAllBtn.style.animation = '';
            
            NotificationManager.success(
                `<strong>Bulk Update Complete!</strong><br/>` +
                `<span style="font-size: 12px;">✓ ${updateCount} field${updateCount !== 1 ? 's' : ''} updated across ${successCount} student${successCount !== 1 ? 's' : ''}</span>`,
                6000
            );
            
            setTimeout(() => {
                applyFilters();
            }, 2000);
        } else {
            saveAllBtn.innerHTML = '⚠ Partial Save';
            saveAllBtn.style.background = 'linear-gradient(135deg, #f39c12 0%, #d68910 100%)';
            saveAllBtn.style.animation = '';
            
            let errorMessage = `<strong>Partial Update</strong><br/>` +
                `<span style="font-size: 12px;">✓ ${successCount} succeeded, ✕ ${failCount} failed</span>`;
            
            if (errors.length > 0) {
                errorMessage += `<br/><span style="font-size: 11px;">Failed: ${errors[0].studentName}</span>`;
            }
            
            NotificationManager.warning(errorMessage, 8000);
            
            setTimeout(() => {
                applyFilters();
            }, 2000);
        }
        
        setTimeout(() => {
            saveAllBtn.innerHTML = originalBtnContent;
            saveAllBtn.disabled = false;
            document.querySelectorAll('.missing-field-input').forEach(input => {
                input.disabled = false;
                input.style.opacity = '1';
            });
        }, 3000);
        
    } catch (error) {
        console.error('Error in bulk save:', error);
        
        saveAllBtn.innerHTML = '✕ Save Failed';
        saveAllBtn.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
        saveAllBtn.style.animation = '';
        
        NotificationManager.error(
            `<strong>Bulk Save Failed</strong><br/>` +
            `<span style="font-size: 12px;">${error.message}</span>`,
            5000
        );
        
        setTimeout(() => {
            saveAllBtn.innerHTML = originalBtnContent;
            saveAllBtn.disabled = false;
            document.querySelectorAll('.missing-field-input').forEach(input => {
                input.disabled = false;
                input.style.opacity = '1';
            });
        }, 3000);
    }
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

// --- PDF Export Function ---

async function exportMissingDataToPdf() {
    if (!window.jspdf) {
        alert('PDF library not loaded. Please refresh the page and try again.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape');

    const selectedGrade = gradeFilter.value;
    const selectedStudentId = studentFilter.value;
    
    let dataToExport = filteredAndSearchedStudents;

    if (dataToExport.length === 0) {
        alert('No data to export. Please adjust your filters.');
        return;
    }

    const title = 'Students with Missing Data Report';
    const gradeInfo = selectedGrade ? `Grade ${selectedGrade}` : 'All Grades';
    const totalStudents = dataToExport.length;
    
    const logoImg = new Image();
    logoImg.src = 'logo.png';
    logoImg.crossOrigin = 'anonymous';
    
    await new Promise((resolve) => {
        logoImg.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = logoImg.width;
                canvas.height = logoImg.height;
                
                ctx.drawImage(logoImg, 0, 0);
                
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                
                for (let i = 0; i < data.length; i += 4) {
                    const gray = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11;
                    const lightened = gray + (255 - gray) * 0.6;
                    
                    data[i] = lightened;
                    data[i + 1] = lightened;
                    data[i + 2] = lightened;
                }
                
                ctx.putImageData(imageData, 0, 0);
                logoImg.src = canvas.toDataURL();
            } catch (e) {
                console.warn('Logo filter failed:', e);
            }
            resolve();
        };
        logoImg.onerror = () => {
            console.warn('Logo failed to load');
            resolve();
        };
        setTimeout(resolve, 3000);
    });
    
    const headers = [
        'No.',
        'Student Name',
        'Grade',
        'Assessment No',
        'UPI',
        'Missing Fields Count',
        'Missing Fields'
    ];
    
    const body = dataToExport.map((student, index) => {
        const missingFields = getMissingFields(student);
        return [
            String(index + 1),
            String(student['Official Student Name'] || 'N/A'),
            String(student['Grade'] || 'N/A'),
            String(student['Assessment No'] || 'N/A'),
            String(student['UPI'] || student.id || 'N/A'),
            String(missingFields.length),
            missingFields.join(', ')
        ];
    });

    const addHeader = () => {
        const pageWidth = doc.internal.pageSize.width;
        
        doc.setFillColor(41, 128, 185);
        doc.rect(0, 0, pageWidth, 20, 'F');
        
        if (logoImg.complete && logoImg.naturalHeight !== 0) {
            try {
                const logoWidth = 15;
                const logoHeight = 15;
                const logoX = 14;
                const logoY = 2.5;
                doc.addImage(logoImg, 'PNG', logoX, logoY, logoWidth, logoHeight);
            } catch (e) {
                console.warn('Could not add logo to PDF:', e);
            }
        }
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('KANYADET PRI & JUNIOR SCHOOL', 34, 10);
        
        doc.setFontSize(12);
        doc.text(title, 34, 16);
        
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        const dateText = `Date: ${new Date().toLocaleDateString()}`;
        doc.text(dateText, pageWidth - 14, 6, { align: 'right' });
        doc.text(gradeInfo, pageWidth - 14, 11, { align: 'right' });
        
        doc.setFontSize(8);
        doc.text(`Total Students: ${totalStudents}`, pageWidth - 14, 16, { align: 'right' });
        
        if (searchQuery) {
            doc.text(`Search: "${searchQuery}"`, pageWidth - 14, 20, { align: 'right' });
        }
        
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
        doc.setLineWidth(0.3);
        doc.line(0, footerY - 5, pageWidth, footerY - 5);
        
        doc.setTextColor(60, 60, 60);
        doc.setFontSize(8);
        
        doc.setFont(undefined, 'bold');
        doc.text('Prepared by:', 14, footerY);
        doc.setFont(undefined, 'normal');
        doc.text('_________________', 14, footerY + 4);
        doc.setFontSize(7);
        doc.text('Signature & Date', 14, footerY + 8);
        
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        const pageText = `Page ${data.pageNumber} of ${totalPages}`;
        doc.text(pageText, pageWidth / 2, footerY + 2, { align: 'center' });
        
        doc.setFontSize(8);
        doc.setFont(undefined, 'bold');
        doc.text('Verified by:', pageWidth - 14, footerY, { align: 'right' });
        doc.setFont(undefined, 'normal');
        doc.text('_________________', pageWidth - 14, footerY + 4, { align: 'right' });
        doc.setFontSize(7);
        doc.text('Signature & Stamp', pageWidth - 14, footerY + 8, { align: 'right' });
    };

    doc.autoTable({
        head: [headers],
        body: body,
        startY: 25,
        styles: { 
            fontSize: 8,
            cellPadding: 3,
            overflow: 'linebreak',
            cellWidth: 'auto'
        },
        columnStyles: {
            0: { cellWidth: 12 },
            1: { cellWidth: 40 },
            2: { cellWidth: 15 },
            3: { cellWidth: 25 },
            4: { cellWidth: 25 },
            5: { cellWidth: 20 },
            6: { cellWidth: 'auto' }
        },
        headStyles: { 
            fillColor: [41, 128, 185], 
            textColor: [255, 255, 255],
            fontStyle: 'bold'
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 25, right: 10, bottom: 20, left: 10 },
        didDrawPage: function(data) {
            addHeader();
        }
    });

    const totalPages = doc.internal.getNumberOfPages();
    
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addFooter({ pageNumber: i }, totalPages);
    }

    const gradePart = selectedGrade ? `_grade${selectedGrade}` : '_all_grades';
    const searchPart = searchQuery ? `_search_${searchQuery.replace(/\s+/g, '_')}` : '';
    const filename = `students_missing_data${gradePart}${searchPart}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    doc.save(filename);
    
    NotificationManager.success(
        `<strong>PDF Export Complete!</strong><br/>` +
        `<span style="font-size: 12px;">Downloaded: ${filename}<br/>Total records: ${totalStudents}</span>`,
        4000
    );
}

window.exportMissingDataToPdf = exportMissingDataToPdf;