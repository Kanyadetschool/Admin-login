/**
 * Advanced Student Missing Data Reporter
 * Enhanced with search, pagination, and powerful editing features
 */


// // Target all search inputs and select text on focus
// document.addEventListener('DOMContentLoaded', () => {
//     // Select all input elements with type="search" or specific search-related attributes
//     const searchInputs = document.querySelectorAll('input[type="search"], input[id*="search"], input[class*="search"]');
    
//     searchInputs.forEach(input => {
//         input.addEventListener('focus', function() {
//             this.select();
//         });
//     });
// });







// Global variables for Firebase imports and application state
let firebaseImports;
let studentsData = [];
let db;
let auth;
let editingCells = new Map();
let pendingUpdates = new Map();

// Pagination and search state
let currentPage = 1;
let itemsPerPage = 10;
let filteredAndSearchedStudents = [];
let searchQuery = '';
let selectedFields = []; // ADD THIS - stores user-selected fields

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
const gradeFilter = document.getElementById('grade-filter');
const fieldFilter = document.getElementById('field-filter');
const searchInput = document.getElementById('search-input');
const itemsPerPageSelect = document.getElementById('items-per-page');
const tableBody = document.querySelector('#missing-data-table tbody');
const reportSummary = document.getElementById('report-summary');
const paginationInfo = document.getElementById('pagination-info');
const paginationControls = document.getElementById('pagination-controls');
const loader = document.getElementById('loader');
const signInBtn = document.getElementById('google-sign-in-btn');
const signOutBtn = document.getElementById('sign-out-btn');
const userInfo = document.getElementById('user-info');
const controlsDiv = document.querySelector('.controls');
const printAreaDiv = document.getElementById('print-area');




// Replace around line 153 with this complete solution:
searchInput.addEventListener('input', handleSearch);

// Auto-clear on focus for all inputs (including dynamically created ones)
document.addEventListener('focus', function(e) {
    // Target all text-type inputs
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
            applyFilters();
        });
        fieldFilter.addEventListener('change', handleFieldSelection);
        searchInput.addEventListener('input', handleSearch);
        itemsPerPageSelect.addEventListener('change', handleItemsPerPageChange);
        signInBtn.addEventListener('click', signInWithGoogle);
        signOutBtn.addEventListener('click', signOutUser);

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
    searchInput.value = '';
    tableBody.innerHTML = '';
    reportSummary.textContent = 'Please sign in to load the data.';
    paginationInfo.textContent = '';
    paginationControls.innerHTML = '';
    controlsDiv.style.display = 'none';
    printAreaDiv.style.display = 'none';
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
    
    // Smooth scroll to top of table
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
    const allKeys = new Set();

    students.forEach(student => {
        if (student['Grade']) {
            grades.add(student['Grade']);
        }
        Object.keys(student).forEach(key => allKeys.add(key));
    });

    gradeFilter.innerHTML = '<option value="">All Years</option>';
    Array.from(grades).sort().forEach(grade => {
        const option = document.createElement('option');
        option.value = grade;
        option.textContent = `${grade}`;
        gradeFilter.appendChild(option);
    });

    const excludedFields = [
        'id', 'Assessment No', 'Official Student Name', 'Gender', 
         'Class', 'Grade'
    ]; 
    
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




function handleFieldSelection() {
    const selectedField = fieldFilter.value;
    
    if (!selectedField) return;
    
    // Check if field is already added
    if (selectedFields.includes(selectedField)) {
        NotificationManager.warning(`"${selectedField}" is already added to the table`);
        fieldFilter.value = ''; // Reset dropdown
        return;
    }
    
    // Add the field to selected fields
    selectedFields.push(selectedField);
    
    // Update the display
    updateFieldTags();
    renderCurrentPage();
    
    // Reset dropdown
    fieldFilter.value = '';
    
    NotificationManager.success(`Added "${selectedField}" to table columns`);
}








function updateFieldTags() {
    const container = document.getElementById('selected-fields-container');
    const tagsDiv = document.getElementById('selected-fields-tags');
    
    if (selectedFields.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
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
            " onmouseover="this.style.background='rgba(255,255,255,0.3)'" 
               onmouseout="this.style.background='rgba(255,255,255,0.2)'">×</button>
        `;
        
        tagsDiv.appendChild(tag);
    });
}

// Function to remove a field
function removeField(fieldName) {
    selectedFields = selectedFields.filter(f => f !== fieldName);
    updateFieldTags();
    renderCurrentPage();
    NotificationManager.info(`Removed "${fieldName}" from table columns`);
}

// Make removeField available globally
window.removeField = removeField;








function applyFilters() {
    const selectedGrade = gradeFilter.value;
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
                student['Home phone'],
                student['Parent Name'],  // Add new fields to search
                student['Email']
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
    const totalStudents = filteredAndSearchedStudents.length;
    const totalPages = Math.ceil(totalStudents / itemsPerPage);

    // UPDATE TABLE HEADERS - ADD THIS LINE
    updateTableHeaders();
    
    
    // Calculate pagination range
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalStudents);
    const studentsToRender = filteredAndSearchedStudents.slice(startIndex, endIndex);

    // Update summary
    let summaryText = `Report Summary: <b style="color: #2980b9;">${totalStudents}</b> students found`;
    if (gradeFilter.value) {
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
    cell.colSpan = 7 + selectedFields.length; // Base columns (7) + dynamic fields
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


function updateTableHeaders() {
    const thead = document.querySelector('#missing-data-table thead tr');
    
    // Base headers (always present)
    const baseHeaders = [
        'SN',
        'Image',        // ← ADD THIS
        'Grade',
        'Student Name',
        'Assessment No',
        'UPI',
        'Home Phone'
    ];
    
    // Clear existing headers
    thead.innerHTML = '';
    
    // Add base headers
    baseHeaders.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        thead.appendChild(th);
    });
    
    // Add dynamic headers for selected fields
    selectedFields.forEach(fieldName => {
        const th = document.createElement('th');
        th.textContent = fieldName;
        th.style.background = 'background: linear-gradient(135deg, #2980b9 0%, #2c3e50 100%);';
        th.style.color = 'white';
        thead.appendChild(th);
    });
}



studentsToRender.forEach((student, index) => {
    const row = tableBody.insertRow();
    row.dataset.studentId = student.id;
    row.dataset.rowIndex = startIndex + index;
    
    const indexCell = row.insertCell(0);
    indexCell.textContent = (startIndex + index + 1).toString();


    // ← ADD IMAGE COLUMN HERE (after SN, before Grade)
    const imageCell = row.insertCell(1);
    const imageName = student['Official Student Name'] 
        ? encodeURIComponent(student['Official Student Name']) 
        : '';
    const imagePath = imageName 
        ? `./student_images/${imageName}.jpg` 
        : './student_images/default.jpg';
    
// Update the image rendering to include click handler
// In your renderStudents function, update the image cell rendering:
imageCell.innerHTML = `
    <img src="${imagePath}" 
         alt="${student['Official Student Name'] || 'Student Image'}" 
         class="student-image" 
         onclick="showImageModal('${imagePath}', '${student['Official Student Name'] || 'Unknown'}', '${student['Grade'] || 'N/A'}','${student['UPI'] || 'N/A'}', '${student['Assessment No'] || 'N/A'}')"
         onerror="this.src='./student_images/default.jpg';this.alt='Default Image'"
         style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid #3498db; cursor: pointer;">
`;
    
    
    // Base columns
    row.insertCell(2).textContent = student['Grade'] || 'N/A';
    row.insertCell(3).textContent = student['Official Student Name'] || 'N/A'; 
    row.insertCell(4).textContent = student['Assessment No'] || student.id || 'N/A'; 
    row.insertCell(5).textContent = student['UPI'] || student.id || 'N/A'; 
    row.insertCell(6).textContent = student['Home phone'] || 'N/A';
    
    // Dynamic columns based on selected fields
    let cellIndex = 7; // Starting index after base columns
    selectedFields.forEach(fieldName => {
        const cell = row.insertCell(cellIndex);
        const value = student[fieldName];
        
        // Highlight missing values
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
    // Render pagination controls
    renderPaginationControls(totalPages);
}



// Add this function near the bottom of your script
function showImageModal(imageSrc, studentName, studentGrade, UPI, assessmentNo) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        backdrop-filter: blur(50px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease-out;
    `;
    
    modal.innerHTML = `
        <div style="
            position: relative;
                       background: linear-gradient(135deg, #e9ebecff 0%, #8b9197ff 100%);

            border-radius: 24px;
            padding: 15px;
            max-width: 500px;
            width: 90%;
            animation: slideUp 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        ">
            <!-- Close Button -->
            <button onclick="this.closest('[style*=fixed]').remove()" style="
                position: absolute;
                top: 16px;
                right: 16px;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.2);
                border: 2px solid rgba(255, 255, 255, 0.3);
                color: white;
                font-size: 20px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
                backdrop-filter: blur(10px);
            " onmouseover="this.style.background='rgba(255,255,255,0.3)'; this.style.transform='rotate(90deg)'" 
               onmouseout="this.style.background='rgba(255,255,255,0.2)'; this.style.transform='rotate(0deg)'">
                ×
            </button>
            
            <!-- Student Image -->
            <div style="
                width: 200px;
                height: 200px;
                margin: 0 auto 24px;
                border-radius: 50%;
                overflow: hidden;
                border: 6px solid rgba(255, 255, 255, 0.3);
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
                background: rgba(255, 255, 255, 0.1);
            ">
                <img src="${imageSrc}" 
                     alt="${studentName}" 
                     style="
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                     "
                     onerror="this.src='./student_images/default.jpg'">
            </div>
            
            <!-- Student Info Card -->
            <div style="
                background: rgba(255, 255, 255, 0.95);
                border-radius: 16px;
                padding: 24px;
                text-align: center;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
            ">
                <!-- Student Name -->
                <h2 style="
                    margin: 0 0 16px 0;
                    font-size: 24px;
                    font-weight: 700;
                    color: #2c3e50;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                ">${studentName}</h2>
                
                <!-- Grade Badge -->
                <div style="
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
                    color: white;
                    padding: 10px 20px;
                    border-radius: 50px;
                    font-size: 16px;
                    font-weight: 600;
                    margin-bottom: 16px;
                    box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
                ">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                        <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                    </svg>
                    <span>Grade ${studentGrade}</span>
                </div>
                
                <!-- Assessment Number -->
                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 12px 20px;
                    background: rgba(52, 152, 219, 0.1);
                    border-radius: 12px;
                    font-size: 14px;
                    color: #34495e;
                    font-weight: 500;
                ">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3498db" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <span style="color: #7f8c8d;">Assessment No:</span>
                    <span style="font-weight: 700; color: #2c3e50;">${assessmentNo}</span>
                    <span style="color: #7f8c8d;">UPI:</span>
                    <span style="font-weight: 700; color: #2c3e50;">${UPI}</span>
                </div>
            </div>
            
            <!-- Optional: Add action buttons -->
            <div style="
                display: flex;
                gap: 12px;
                margin-top: 20px;
            ">
                <button onclick="window.print()" style="
                    flex: 1;
                    padding: 12px 24px;
                    background: rgba(255, 255, 255, 0.2);
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    color: white;
                    border-radius: 12px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    backdrop-filter: blur(10px);
                " onmouseover="this.style.background='rgba(255,255,255,0.3)'" 
                   onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                    🖨️ Print
                </button>
                <button onclick="this.closest('[style*=fixed]').remove()" style="
                    flex: 1;
                    padding: 12px 24px;
                    background: rgba(255, 255, 255, 0.95);
                    border: 2px solid transparent;
                    color: #667eea;
                    border-radius: 12px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                " onmouseover="this.style.background='white'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.2)'" 
                   onmouseout="this.style.background='rgba(255,255,255,0.95)'; this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                    Close
                </button>
            </div>
        </div>
    `;
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    // Close modal with Escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
    
    document.body.appendChild(modal);
}

// Add these animations to your CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
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
`;
document.head.appendChild(style);





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

    // Page numbers (show current page and 2 pages before/after)
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



// --- Advanced Update Function with Rich Feedback ---


// --- PDF Export Function ---

async function exportMissingDataToPdf() {
    if (!window.jspdf) {
        alert('PDF library not loaded. Please refresh the page and try again.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape');

    const selectedGrade = gradeFilter.value;
    
    // Use all filtered students (not just current page)
    let dataToExport = filteredAndSearchedStudents;

    if (dataToExport.length === 0) {
        alert('No data to export. Please adjust your filters.');
        return;
    }

   const title = `Student Biodata Report`;
const subtitle = `Complete Student Information`;
    const gradeInfo = selectedGrade ? `Level ${selectedGrade}` : 'All Grades';
    const totalStudents = dataToExport.length;
    
    const logoImg = new Image();
    logoImg.src = '../img/logo.png';
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
    'Official Student Name',
    'Grade',
    'UPI',
    'Assessment No',
    'Home phone',
    ...selectedFields // Add selected fields dynamically
];
    
const body = dataToExport.map((student, index) => {
    const row = [
        String(index + 1),
        String(student['Official Student Name'] || 'N/A'),
        String(student['Grade'] || 'N/A'),
        String(student['UPI'] || student.id || 'N/A'),
        String(student['Assessment No'] || 'N/A'),
        String(student['Home phone'] || 'N/A')
    ];
    
    // Add selected fields dynamically
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
        doc.text(subtitle, pageWidth - 14, 11, { align: 'right' });
        doc.text(gradeInfo, pageWidth - 14, 15, { align: 'right' });
        
        doc.setFontSize(8);
        doc.text(`Total Students: ${totalStudents}`, pageWidth - 14, 20, { align: 'right' });
        
        if (searchQuery) {
            doc.text(`Search: "${searchQuery}"`, pageWidth - 14, 24, { align: 'right' });
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
        
        doc.setDrawColor(41, 128, 185);
        doc.setLineWidth(0.2);
        doc.rect(pageWidth - 85, footerY - 3, 28, 10);
        doc.setFontSize(6);
        doc.setTextColor(150, 150, 150);
        doc.text('OFFICIAL', pageWidth - 71, footerY + 2, { align: 'center' });
        doc.text('STAMP', pageWidth - 71, footerY + 5, { align: 'center' });
    };

    doc.autoTable({
        head: [headers],
        body: body,
        startY: 25,
        styles: { 
            fontSize: 9,
            cellPadding: 3,
            overflow: 'linebreak',
            cellWidth: 'auto'
        },
        columnStyles: {
            0: { cellWidth: 12 },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 'auto' },
            3: { cellWidth: 'auto' },
            4: { cellWidth: 'auto' }
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

   // Build filename with selected fields if any
const fieldsPart = selectedFields.length > 0 ? `_with_${selectedFields.length}_fields` : '';
const gradePart = selectedGrade ? `_grade${selectedGrade}` : '_all_grades';
const searchPart = searchQuery ? `_search_${searchQuery.replace(/\s+/g, '_')}` : '';
const filename = `student_biodata_report${fieldsPart}${gradePart}${searchPart}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    doc.save(filename);
    
    NotificationManager.success(
        `<strong>PDF Export Complete!</strong><br/>` +
        `<span style="font-size: 12px;">Downloaded: ${filename}<br/>Total records: ${totalStudents}</span>`,
        4000
    );
}

window.exportMissingDataToPdf = exportMissingDataToPdf;