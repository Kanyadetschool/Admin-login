// Import Firebase (modern SDK with modules)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getDatabase, ref, query, orderByChild, equalTo, get, set, off, on } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

// Firebase Configuration
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

// Initialize Firebase
const app = initializeApp(customFirebaseConfig);
const database = getDatabase(app);


// ============================================
// ADD THIS LINE - Define sanitizedAppId
// ============================================
const sanitizedAppId = 'default-app-id'; // Or extract from your config/environment



// Store logged-in student data
let currentStudent = null;

// Login with student from database
async function loginWithFirebase() {
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;
    
    try {
        // Reference to students
         const studentsRef = ref(database, `artifacts/${sanitizedAppId}/students`);
        const snapshot = await get(studentsRef);
        
        if (snapshot.exists()) {
            const allStudents = snapshot.val();
            let foundStudent = null;
            let studentKey = null;
            
            // Search for student by email
            for (const key in allStudents) {
                const student = allStudents[key];
                if (student.Email === email) {
                    foundStudent = student;
                    studentKey = key;
                    break;
                }
            }
            
            if (foundStudent) {
                // Simple password check (for demo - use Firebase Auth in production)
                if (password === 'password123') {
                    currentStudent = {
                        id: studentKey,
                        ...foundStudent
                    };
                    
                    // Show portal and populate data
                    document.getElementById('loginSection').style.display = 'none';
                    document.getElementById('portalSection').classList.remove('portal-hidden');
                    initializePortalWithStudent(currentStudent);
                    
                    console.log('Login successful:', currentStudent);
                } else {
                    alert('Invalid password');
                }
            } else {
                alert('Student email not found');
            }
        } else {
            alert('No students found in database');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Error during login: ' + error.message);
    }
}

// Initialize portal with student data from Firebase
function initializePortalWithStudent(student) {
    const date = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    
    // Update header with student info
    document.getElementById('currentDate').textContent = date.toLocaleDateString('en-US', options);
    document.getElementById('studentName').textContent = `Welcome, ${student['Official Student Name']}!`;
    document.getElementById('studentNameSmall').textContent = student['Official Student Name'];
    
    // Get initials from student name
    const nameParts = student['Official Student Name'].split(' ');
    const initials = nameParts.map(n => n[0]).join('').substring(0, 2);
    document.getElementById('studentInitials').textContent = initials;
    
    // Update student grade info if available
    if (student.Grade) {
        const gradeElements = document.querySelectorAll('.profile-info p:nth-child(2)');
        gradeElements.forEach(el => el.textContent = student.Grade);
    }
    
    // Load student data
    loadStudentGrades(student.Grade);
    loadStudentAssignments();
    loadAttendanceData(student.Grade);
    loadStudentProfile(student);
    
    // Set up real-time listener
    listenToStudentUpdates(student.id);
}

// Fetch and load grades (from hardcoded or Firebase)
async function loadStudentGrades(grade) {
    try {
        const gradesRef = ref(database, `artifacts/${sanitizedAppId}/grades`);
        const snapshot = await get(gradesRef);
        
        if (snapshot.exists()) {
            const gradesData = snapshot.val();
            populateGradesTable(gradesData);
        } else {
            // Load default grades if none in database
            loadDefaultGrades();
        }
    } catch (error) {
        console.error('Error loading grades:', error);
        loadDefaultGrades();
    }
}

// Default grades for demo
function loadDefaultGrades() {
    const defaultGrades = {
        'English Literature': { term1: 88, term2: 91, term3: 89, average: 89.3, grade: 'A' },
        'Mathematics': { term1: 92, term2: 94, term3: 91, average: 92.3, grade: 'A' },
        'Science': { term1: 85, term2: 87, term3: 86, average: 86, grade: 'B+' },
        'Social Studies': { term1: 83, term2: 85, term3: 84, average: 84, grade: 'B' },
        'Kiswahili': { term1: 79, term2: 81, term3: 82, average: 80.7, grade: 'B' },
        'French': { term1: 81, term2: 83, term3: 85, average: 83, grade: 'B' },
        'Physical Education': { term1: 90, term2: 92, term3: 91, average: 91, grade: 'A' }
    };
    populateGradesTable(defaultGrades);
}

// Populate grades in the UI
function populateGradesTable(gradesData) {
    const tbody = document.querySelector('.grades-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    Object.keys(gradesData).forEach(subject => {
        const subjectData = gradesData[subject];
        const row = document.createElement('tr');
        
        const term1 = subjectData.term1 || '-';
        const term2 = subjectData.term2 || '-';
        const term3 = subjectData.term3 || '-';
        const average = subjectData.average || '-';
        const letterGrade = subjectData.grade || '-';
        
        row.innerHTML = `
            <td><strong>${subject}</strong></td>
            <td>${term1}</td>
            <td>${term2}</td>
            <td>${term3}</td>
            <td>${average}</td>
            <td><span class="grade-badge">${letterGrade}</span></td>
        `;
        
        tbody.appendChild(row);
    });
}

// Load student assignments from Firebase
async function loadStudentAssignments() {
    try {
        const assignmentsRef = ref(database, `artifacts/${sanitizedAppId}/assignments`);
        const snapshot = await get(assignmentsRef);
        
        if (snapshot.exists()) {
            const assignmentsData = snapshot.val();
            populateAssignments(assignmentsData);
        } else {
            loadDefaultAssignments();
        }
    } catch (error) {
        console.error('Error loading assignments:', error);
        loadDefaultAssignments();
    }
}

// Default assignments for demo
function loadDefaultAssignments() {
    const defaultAssignments = {
        assignment1: {
            title: 'Essay on Shakespeare\'s Hamlet',
            subject: 'English Literature',
            description: 'Write a 1500-word analysis of the major themes in Shakespeare\'s Hamlet',
            status: 'pending',
            dueDate: 'March 20, 2024',
            score: 'Not Graded'
        },
        assignment2: {
            title: 'Algebra Problem Set 5',
            subject: 'Mathematics',
            description: 'Complete exercises 1-20 on quadratic equations and functions',
            status: 'submitted',
            dueDate: 'March 18, 2024',
            score: 'Submitted'
        },
        assignment3: {
            title: 'Photosynthesis Lab Report',
            subject: 'Science',
            description: 'Document your photosynthesis experiment with data analysis',
            status: 'graded',
            dueDate: 'March 15, 2024',
            score: '88/100'
        }
    };
    populateAssignments(defaultAssignments);
}

// Populate assignments in UI
function populateAssignments(assignmentsData) {
    const list = document.querySelector('.assignment-list');
    if (!list) return;
    
    list.innerHTML = '';
    
    Object.keys(assignmentsData).forEach(key => {
        const assignment = assignmentsData[key];
        const li = document.createElement('li');
        li.className = 'assignment-item';
        
        const statusClass = assignment.status === 'pending' ? 'status-pending' : 
                           assignment.status === 'submitted' ? 'status-submitted' : 
                           'status-graded';
        
        li.innerHTML = `
            <div class="assignment-header">
                <h4>${assignment.title}</h4>
                <div class="assignment-status ${statusClass}">${assignment.status}</div>
            </div>
            <p>${assignment.description}</p>
            <div class="assignment-details">
                <div class="detail-item">
                    <span class="detail-label">Subject:</span> ${assignment.subject}
                </div>
                <div class="detail-item">
                    <span class="detail-label">Due:</span> ${assignment.dueDate}
                </div>
                <div class="detail-item">
                    <span class="detail-label">Score:</span> ${assignment.score || 'Not graded'}
                </div>
            </div>
        `;
        
        list.appendChild(li);
    });
}

// Load attendance data
async function loadAttendanceData(grade) {
    try {
        const attendanceRef = ref(database, `artifacts/${sanitizedAppId}/attendance`);
        const snapshot = await get(attendanceRef);
        
        if (snapshot.exists()) {
            const attendanceData = snapshot.val();
            populateAttendance(attendanceData);
        } else {
            loadDefaultAttendance();
        }
    } catch (error) {
        console.error('Error loading attendance:', error);
        loadDefaultAttendance();
    }
}

// Default attendance for demo
function loadDefaultAttendance() {
    const defaultAttendance = {
        overall: '94%',
        present: '45',
        absent: '2',
        late: '1'
    };
    populateAttendance(defaultAttendance);
}

// Populate attendance statistics
function populateAttendance(attendanceData) {
    const percentElements = document.querySelectorAll('.attendance-percent');
    const labelElements = document.querySelectorAll('.attendance-label');
    
    if (percentElements.length > 0) {
        percentElements[0].textContent = attendanceData.overall || '94%';
        percentElements[1].textContent = attendanceData.present || '45';
        percentElements[2].textContent = attendanceData.absent || '2';
        percentElements[3].textContent = attendanceData.late || '1';
    }
}

// Load student profile data
function loadStudentProfile(student) {
    // Update profile section with student data
    const profileInfos = document.querySelectorAll('.card');
    
    profileInfos.forEach(card => {
        if (card.querySelector('h3')?.textContent.includes('Personal')) {
            // This is the personal info card
            const divs = card.querySelectorAll('div > div');
            if (divs.length >= 6) {
                divs[0].querySelector('p:last-child').textContent = student['Official Student Name'] || 'N/A';
                divs[2].querySelector('p:last-child').textContent = student['Grade'] || 'N/A';
                divs[4].querySelector('p:last-child').textContent = student['Email'] || 'N/A';
            }
        }
    });
}

// Save student data updates to Firebase
async function updateStudentData(field, value) {
    if (!currentStudent) return;
    
    try {
        const updateRef = ref(database, `artifacts/${sanitizedAppId}/students/${currentStudent.id}/${field}`);
        await set(updateRef, value);
        console.log('Data updated successfully');
    } catch (error) {
        console.error('Error updating data:', error);
    }
}

// Real-time listener for student updates
function listenToStudentUpdates(studentId) {
    const studentRef = ref(database, `artifacts/${sanitizedAppId}/students/${studentId}`);
    on(studentRef, 'value', (snapshot) => {
        if (snapshot.exists()) {
            currentStudent = {
                id: studentId,
                ...snapshot.val()
            };
            console.log('Student data updated:', currentStudent);
        }
    });
}

// Remove listener when logging out
function stopListeners() {
    if (currentStudent) {
        const studentRef = ref(database, `artifacts/${sanitizedAppId}/students/${currentStudent.id}`);
        off(studentRef);
    }
}

// Updated logout function
function logout() {
    stopListeners();
    currentStudent = null;
    document.getElementById('loginSection').style.display = 'flex';
    document.getElementById('portalSection').classList.add('portal-hidden');
    document.getElementById('emailInput').value = 'student@kanyadet.ac.ke';
    document.getElementById('passwordInput').value = 'password123';
}

// Updated login button handler
function login() {
    loginWithFirebase();
}