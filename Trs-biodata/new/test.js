// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyA_41WpdMjHJOU5s3gQ9aieIayZRvUoRLE",
    authDomain: "kanyadet-school-admin.firebaseapp.com",
    databaseURL: "https://kanyadet-school-admin-default-rtdb.firebaseio.com/",
    projectId: "kanyadet-school-admin",
    storageBucket: "kanyadet-school-admin.appspot.com",
    messagingSenderId: "409708360032",
    appId: "1:409708360032:web:a21d63e8cb5fa1ecabee05",
    measurementId: "G-Y4C0ZRRL52"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const studentsRef = database.ref('students');

// Global variables
let studentsData = {};
let currentEditingUPI = null;

// Student fields configuration
const studentFields = [
    { field: 'UPI', label: 'UPI', type: 'text' },
    { field: 'Assessment No', label: 'Assessment No', type: 'text' },
    { field: 'Official Student Name', label: 'Official Student Name', type: 'text' },
    { field: 'Gender', label: 'Gender', type: 'select', options: ['Male', 'Female'] },
    { field: 'DOB', label: 'Date of Birth', type: 'date' },
    { field: 'Birth Entry', label: 'Birth Entry', type: 'text' },
    { field: 'Dissability', label: 'Disability', type: 'text' },
    { field: 'Medical Condition', label: 'Medical Condition', type: 'text' },
    { field: 'Home phone', label: 'Home Phone', type: 'tel' },
    { field: 'Status', label: 'Status', type: 'select', options: ['Active', 'Inactive', 'Transferred', 'Graduated'] },
    { field: 'Class', label: 'Class', type: 'text' },
    { field: 'Grade', label: 'Grade', type: 'text' },
    { field: 'Father', label: 'Father', type: 'text' },
    { field: 'Mother', label: 'Mother', type: 'text' },
    { field: 'DateOfAdmission', label: 'Date of Admission', type: 'date' },
    { field: 'Where Born', label: 'Where Born', type: 'text' },
    { field: 'District', label: 'District', type: 'text' }
];

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    setupFirebaseListeners();
    setupEventListeners();
});

// Firebase Connection Status
function setupFirebaseListeners() {
    const connectedRef = database.ref('.info/connected');
    connectedRef.on('value', function(snapshot) {
        const connected = snapshot.val();
        const statusElement = document.getElementById('connectionStatus');
        if (connected) {
            statusElement.textContent = 'Connected';
            statusElement.className = 'connection-status connected';
        } else {
            statusElement.textContent = 'Disconnected';
            statusElement.className = 'connection-status disconnected';
        }
    });

    // Listen for students data changes
    studentsRef.on('value', function(snapshot) {
        studentsData = snapshot.val() || {};
        updateDashboard();
        renderStudents();
        updateFilters();
    });
}

// Setup Event Listeners
function setupEventListeners() {
    // Search and filter listeners
    document.getElementById('searchInput').addEventListener('input', renderStudents);
    document.getElementById('classFilter').addEventListener('change', renderStudents);
    document.getElementById('statusFilter').addEventListener('change', renderStudents);

    // Edit form submission
    document.getElementById('editForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveEditStudent();
    });
}

// Update Dashboard Stats
function updateDashboard() {
    const students = Object.values(studentsData);
    document.getElementById('totalStudents').textContent = students.length;
    document.getElementById('activeStudents').textContent = 
        students.filter(s => s.Status === 'Active').length;
    document.getElementById('maleStudents').textContent = 
        students.filter(s => s.Gender === 'Male').length;
    document.getElementById('femaleStudents').textContent = 
        students.filter(s => s.Gender === 'Female').length;
}

// Update Filter Dropdowns
function updateFilters() {
    const students = Object.values(studentsData);
    
    // Update Classes
    const classes = new Set();
    students.forEach(s => s.Class && classes.add(s.Class));
    const classFilter = document.getElementById('classFilter');
    const currentClass = classFilter.value;
    classFilter.innerHTML = '<option value="">All Classes</option>';
    Array.from(classes).sort().forEach(cls => {
        classFilter.innerHTML += `<option value="${cls}">${cls}</option>`;
    });
    classFilter.value = currentClass;

    // Update Statuses
    const statuses = new Set();
    students.forEach(s => s.Status && statuses.add(s.Status));
    const statusFilter = document.getElementById('statusFilter');
    const currentStatus = statusFilter.value;
    statusFilter.innerHTML = '<option value="">All Statuses</option>';
    Array.from(statuses).forEach(status => {
        statusFilter.innerHTML += `<option value="${status}">${status}</option>`;
    });
    statusFilter.value = currentStatus;
}

// Render Students
function renderStudents() {
    const container = document.getElementById('studentsContainer');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const classFilter = document.getElementById('classFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;

    let filteredStudents = Object.entries(studentsData);

    // Apply filters
    if (searchTerm) {
        filteredStudents = filteredStudents.filter(([_, student]) => {
            return (student['Official Student Name'] || '').toLowerCase().includes(searchTerm) ||
                   (student['UPI'] || '').toLowerCase().includes(searchTerm) ||
                   (student['Assessment No'] || '').toLowerCase().includes(searchTerm);
        });
    }

    if (classFilter) {
        filteredStudents = filteredStudents.filter(([_, student]) => student.Class === classFilter);
    }

    if (statusFilter) {
        filteredStudents = filteredStudents.filter(([_, student]) => student.Status === statusFilter);
    }

    if (filteredStudents.length === 0) {
        container.innerHTML = '<div class="empty-state">No students found</div>';
        return;
    }

    let html = '';
    filteredStudents.forEach(([upi, student]) => {
        const statusClass = student.Status === 'Active' ? 'status-active' : 'status-inactive';
        html += `
            <div class="student-card">
                <div class="student-header">
                    <div class="student-name">${student['Official Student Name'] || 'N/A'}</div>
                    <div class="student-upi">UPI: ${student.UPI || 'N/A'}</div>
                </div>
                <div class="student-info">
                    <div class="info-row">
                        <span class="info-label">Assessment No:</span>
                        <span class="info-value">${student['Assessment No'] || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Gender:</span>
                        <span class="info-value">${student.Gender || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Class:</span>
                        <span class="info-value">${student.Class || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Grade:</span>
                        <span class="info-value">${student.Grade || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Status:</span>
                        <span class="info-value ${statusClass}">${student.Status || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">DOB:</span>
                        <span class="info-value">${student.DOB || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Father:</span>
                        <span class="info-value">${student.Father || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Mother:</span>
                        <span class="info-value">${student.Mother || 'N/A'}</span>
                    </div>
                </div>
                <div class="student-actions">
                    <button class="btn btn-primary" onclick="editStudent('${upi}')">Edit</button>
                    <button class="btn btn-danger" onclick="deleteStudent('${upi}')">Delete</button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Edit Student
function editStudent(upi) {
    const student = studentsData[upi];
    if (!student) return;

    currentEditingUPI = upi;
    const modal = document.getElementById('editModal');
    const formFields = document.getElementById('editFormFields');

    let html = '';
    studentFields.forEach(({ field, label, type, options }) => {
        const value = student[field] || '';
        html += `
            <div class="form-group">
                <label>${label}</label>
                ${type === 'select' ? 
                    `<select name="${field}">
                        <option value="">Select ${label}</option>
                        ${options.map(opt => `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                    </select>` :
                    `<input type="${type}" name="${field}" value="${value}">`
                }
            </div>
        `;
    });

    formFields.innerHTML = html;
    modal.classList.add('show');
}

// Close Edit Modal
function closeEditModal() {
    document.getElementById('editModal').classList.remove('show');
    currentEditingUPI = null;
}

// Save Edited Student
function saveEditStudent() {
    if (!currentEditingUPI) return;

    const form = document.getElementById('editForm');
    const formData = new FormData(form);
    const studentData = {};
    
    for (let [key, value] of formData.entries()) {
        studentData[key] = value;
    }

    const newUPI = studentData['UPI'];
    
    if (newUPI !== currentEditingUPI) {
        // UPI changed, delete old and create new
        studentsRef.child(currentEditingUPI).remove()
            .then(() => {
                return studentsRef.child(newUPI).set(studentData);
            })
            .then(() => {
                showNotification('Student updated successfully!', 'success');
                closeEditModal();
            })
            .catch((error) => {
                showNotification('Error: ' + error.message, 'error');
            });
    } else {
        studentsRef.child(currentEditingUPI).update(studentData)
            .then(() => {
                showNotification('Student updated successfully!', 'success');
                closeEditModal();
            })
            .catch((error) => {
                showNotification('Error: ' + error.message, 'error');
            });
    }
}

// Delete Student
function deleteStudent(upi) {
    if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
        return;
    }

    studentsRef.child(upi).remove()
        .then(() => {
            showNotification('Student deleted successfully!', 'success');
        })
        .catch((error) => {
            showNotification('Error: ' + error.message, 'error');
        });
}

// Show Notification
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 4000);
}

// Close modal on outside click
document.addEventListener('click', function(e) {
    const modal = document.getElementById('editModal');
    if (e.target === modal) {
        closeEditModal();
    }
});

// Escape key closes modal
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeEditModal();
    }
});