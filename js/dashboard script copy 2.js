







// Firebase Configuration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getDatabase, ref, push, set, get, remove, update, onValue } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
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



const app = initializeApp(customFirebaseConfig);
const db = getDatabase(app);

// Database References
const studentsRef = ref(db, `artifacts/${sanitizedAppId}/students`);
const transfersRef = ref(db, `Deletedstudents/${sanitizedAppId}/artifacts/`);

// Sidebar Menu Navigation
const allSideMenu = document.querySelectorAll('#sidebar .side-menu.top li a','.side-menu.top');

allSideMenu.forEach(item=> {
	const li = item.parentElement;

	item.addEventListener('click', function () {
		allSideMenu.forEach(i=> {
			i.parentElement.classList.remove('active');
		})
		li.classList.add('active');
		
		//Hide sidebar if the clicked item is already active
		if (li.classList.contains('active')) {
			sidebar.classList.add('hide');
		}
	})
});

// TOGGLE SIDEBAR
const menuBar = document.querySelector('.bx.bx-menu');
const sidebar = document.getElementById('sidebar');

menuBar.addEventListener('click', function () {
	sidebar.classList.toggle('hide');
})

// Search Form Toggle
const searchButton = document.querySelector('#content nav form .form-input button');
const searchButtonIcon = document.querySelector('#content nav form .form-input button .bx');
const searchForm = document.querySelector('#content nav form');

searchButton.addEventListener('click', function (e) {
	if(window.innerWidth < 576) {
		e.preventDefault();
		searchForm.classList.toggle('show');
		if(searchForm.classList.contains('show')) {
			searchButtonIcon.classList.replace('bx-search', 'bx-x');
		} else {
			searchButtonIcon.classList.replace('bx-x', 'bx-search');
		}
	}
})

// Responsive Behavior
if(window.innerWidth < 768) {
	sidebar.classList.add('hide');
} else if(window.innerWidth > 576) {
	searchButtonIcon.classList.replace('bx-x', 'bx-search');
	searchForm.classList.remove('show');
}

window.addEventListener('resize', function () {
	if(this.innerWidth > 576) {
		searchButtonIcon.classList.replace('bx-x', 'bx-search');
		searchForm.classList.remove('show');
	}
})

// Dark Mode Toggle
const switchMode = document.getElementById('switch-mode');

switchMode.addEventListener('change', function () {
	if(this.checked) {
		document.body.classList.add('dark');
	} else {
		document.body.classList.remove('dark');
	}
})

// Enhanced dark mode switch handler
switchMode.addEventListener('change', function () {
    const headers = document.querySelectorAll('.order .head, .order table thead .');
    const headerCells = document.querySelectorAll('.order table thead th');
    
    if (this.checked) {
        document.body.classList.add('dark');
        headers.forEach(header => {
            header.style.transition = 'all 0.3s ease';
            header.style.opacity = '0';
            setTimeout(() => {
                header.style.opacity = '1';
            }, 50);
        });
        
        // Add shimmer effect to header cells
        headerCells.forEach((cell, index) => {
            setTimeout(() => {
                cell.style.transition = 'all 0.3s ease';
                cell.style.opacity = '0';
                setTimeout(() => {
                    cell.style.opacity = '1';
                }, 50);
            }, index * 50);
        });
    } else {
        document.body.classList.remove('dark');
        headers.forEach(header => {
            header.style.transition = 'all 0.3s ease';
        });
    }
});

// Add sorting indicator and active state
document.querySelectorAll('.order table thead th').forEach(th => {
    th.addEventListener('click', () => {
        document.querySelectorAll('.order table thead th').forEach(cell => {
            cell.classList.remove('active');
        });
        th.classList.add('active');
    });
});

// DOM Elements
const searchInput = document.querySelector('.form-input input');
const admissionsTable = document.querySelector('.order table tbody');
const transfersList = document.querySelector('.todo-list');
const addAdmissionBtn = document.createElement('button');
const addTransferBtn = document.querySelector('.todo .head .bx-plus');
const sortButton = document.createElement('button');
sortButton.innerHTML = '<i class="bx bx-sort-alt-2"></i>';
document.querySelector('.order .head').appendChild(sortButton);

// Data Arrays (will be populated from Firebase)
let students = [];
let transfers = [];
let sortDirection = 'asc';

// Create Add Admission button and add to DOM
addAdmissionBtn.innerHTML = '<i class="bx bx-plus"></i>';
document.querySelector('.order .head').appendChild(addAdmissionBtn);

// Enhanced Modal HTML with Edit Mode Support
const modalHTML = `
    <div id="addStudentModal" class="modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000;">
        <div class="modal-content" style="position: relative; background: white; margin: 15% auto; padding: 20px; width: 50%; border-radius: 8px;">
            <span class="close" style="position: absolute; right: 10px; top: 10px; cursor: pointer; font-size: 20px;">&times;</span>
            <h2 id="modalTitle">Add New Student</h2>
            <form id="studentForm" style="display: flex; flex-direction: column; gap: 10px; margin-top: 20px;">
                <input type="hidden" id="studentId">
                <input type="text" id="studentName" placeholder="Student Name" required style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                <input type="date" id="admissionDate" required style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                <select id="studentStatus" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="Grade 1">Grade 1</option>
                    <option value="Grade 2">Grade 2</option>
                    <option value="Grade 3">Grade 3</option>
                    <option value="Grade 4">Grade 4</option>
                    <option value="Grade 5">Grade 5</option>
                    <option value="Grade 6">Grade 6</option>
                    <option value="Grade 7">Grade 7</option>
                    <option value="Grade 8">Grade 8</option>
                    <option value="Grade 9">Grade 9</option>
                </select>
                <button type="submit" id="submitBtn" style="padding: 8px; background: #3C91E6; color: white; border: none; border-radius: 4px; cursor: pointer;">Add Student</button>
            </form>
        </div>
    </div>
`;

const transferModalHTML = `
    <div id="addTransferModal" class="modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000;">
        <div class="modal-content" style="position: relative; background: white; margin: 15% auto; padding: 20px; width: 50%; border-radius: 8px;">
            <span class="close" style="position: absolute; right: 10px; top: 10px; cursor: pointer; font-size: 20px;">&times;</span>
            <h2 id="transferModalTitle">Add New Transfer</h2>
            <form id="transferForm" style="display: flex; flex-direction: column; gap: 10px; margin-top: 20px;">
                <input type="hidden" id="transferId">
                <input type="text" id="transferName" placeholder="Student Name" required style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                <input type="text" id="grade" placeholder="Grade (e.g., Grade 3)" required style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                <div style="display: flex; gap: 10px;">
                    <button type="submit" id="transferSubmitBtn" style="padding: 8px; background: #3C91E6; color: white; border: none; border-radius: 4px; cursor: pointer;">Add Transfer</button>
                    <button type="button" id="deleteTransferBtn" style="padding: 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; display: none;">Delete</button>
                </div>
            </form>
        </div>
    </div>
`;

// Add modals to DOM
document.body.insertAdjacentHTML('beforeend', modalHTML);
document.body.insertAdjacentHTML('beforeend', transferModalHTML);

// Modal elements
const studentModal = document.getElementById('addStudentModal');
const transferModal = document.getElementById('addTransferModal');
const studentForm = document.getElementById('studentForm');
const transferForm = document.getElementById('transferForm');
const closeButtons = document.querySelectorAll('.close');
const deleteTransferBtn = document.getElementById('deleteTransferBtn');

// Firebase Database Functions
async function loadStudentsFromFirebase() {
    try {
        const snapshot = await get(studentsRef);
        if (snapshot.exists()) {
            const data = snapshot.val();
            students = Object.keys(data).map(key => ({
                firebaseKey: key,
                id: data[key].id || key,
                ...data[key]
            }));
        } else {
            students = [];
        }
        renderAdmissions();
        updateAdmissionsCounter();
    } catch (error) {
        console.error('Error loading students:', error);
        students = [];
    }
}

async function loadTransfersFromFirebase() {
    try {
        const snapshot = await get(transfersRef);
        if (snapshot.exists()) {
            const data = snapshot.val();
            transfers = Object.keys(data).map(key => ({
                firebaseKey: key,
                id: data[key].id || key,
                ...data[key]
            }));
        } else {
            transfers = [];
        }
        renderTransfers();
    } catch (error) {
        console.error('Error loading transfers:', error);
        transfers = [];
    }
}

async function addStudentToFirebase(studentData) {
    try {
        const newStudentRef = push(studentsRef);
        await set(newStudentRef, {
            ...studentData,
            id: newStudentRef.key,
            createdAt: new Date().toISOString()
        });
        loadStudentsFromFirebase(); // Reload to get updated data
    } catch (error) {
        console.error('Error adding student:', error);
        alert('Error adding student. Please try again.');
    }
}

async function updateStudentInFirebase(firebaseKey, studentData) {
    try {
        const studentRef = ref(db, `artifacts/${sanitizedAppId}/students/${firebaseKey}`);
        await update(studentRef, {
            ...studentData,
            updatedAt: new Date().toISOString()
        });
        loadStudentsFromFirebase(); // Reload to get updated data
    } catch (error) {
        console.error('Error updating student:', error);
        alert('Error updating student. Please try again.');
    }
}

async function deleteStudentFromFirebase(firebaseKey) {
    try {
        const studentRef = ref(db, `artifacts/${sanitizedAppId}/students/${firebaseKey}`);
        await remove(studentRef);
        loadStudentsFromFirebase(); // Reload to get updated data
    } catch (error) {
        console.error('Error deleting student:', error);
        alert('Error deleting student. Please try again.');
    }
}

async function addTransferToFirebase(transferData) {
    try {
        const newTransferRef = push(transfersRef);
        await set(newTransferRef, {
            ...transferData,
            id: newTransferRef.key,
            createdAt: new Date().toISOString()
        });
        loadTransfersFromFirebase(); // Reload to get updated data
    } catch (error) {
        console.error('Error adding transfer:', error);
        alert('Error adding transfer. Please try again.');
    }
}

async function updateTransferInFirebase(firebaseKey, transferData) {
    try {
        const transferRef = ref(db, `Deletedstudents/${sanitizedAppId}/artifacts/${firebaseKey}`);
        await update(transferRef, {
            ...transferData,
            updatedAt: new Date().toISOString()
        });
        loadTransfersFromFirebase(); // Reload to get updated data
    } catch (error) {
        console.error('Error updating transfer:', error);
        alert('Error updating transfer. Please try again.');
    }
}

async function deleteTransferFromFirebase(firebaseKey) {
    try {
        const transferRef = ref(db, `Deletedstudents/${sanitizedAppId}/artifacts/${firebaseKey}`);
        await remove(transferRef);
        loadTransfersFromFirebase(); // Reload to get updated data
    } catch (error) {
        console.error('Error deleting transfer:', error);
        alert('Error deleting transfer. Please try again.');
    }
}

// Render Functions
function renderAdmissions(studentsToRender = students) {
    admissionsTable.innerHTML = studentsToRender.map(student => `
        <tr data-id="${student.firebaseKey}">
            <td>
                <img src="${student.img || 'img/people.png'}">
                <p>${student.name}</p>
            </td>
            <td>${student.date}</td>
            <td>
                <span class="status ${student.status}">${student.status}</span>
                <div class="actions" style="display: inline-block; margin-left: 10px;">
                    <button onclick="editStudent('${student.firebaseKey}')" style="background: none; border: none; cursor: pointer;">
                        <i class='bx bx-edit-alt'></i>
                    </button>
                    <button onclick="deleteStudent('${student.firebaseKey}')" style="background: none; border: none; cursor: pointer;">
                        <i class='bx bx-trash'></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderTransfers(transfersToRender = transfers) {
    transfersList.innerHTML = transfersToRender.map(transfer => `
        <li class="${transfer.completed ? 'completed' : 'not-completed'}" data-id="${transfer.firebaseKey}">
            <p>${transfer.name} ${transfer.grade ? `<b>${transfer.grade}</b>` : ''}</p>
            <div>
                <i class='bx bx-edit-alt' onclick="editTransfer('${transfer.firebaseKey}')" style="cursor: pointer; margin-right: 8px;"></i>
                <i class='bx bx-trash' onclick="deleteTransfer('${transfer.firebaseKey}')" style="cursor: pointer; margin-right: 8px;"></i>
                <i class='bx bx-dots-vertical-rounded'></i>
            </div>
        </li>
    `).join('');
}

// Edit Functions
window.editStudent = function(firebaseKey) {
    const student = students.find(s => s.firebaseKey === firebaseKey);
    if (student) {
        document.getElementById('studentId').value = student.firebaseKey;
        document.getElementById('studentName').value = student.name;
        document.getElementById('admissionDate').value = student.date;
        document.getElementById('studentStatus').value = student.status;
        document.getElementById('modalTitle').textContent = 'Edit Student';
        document.getElementById('submitBtn').textContent = 'Update Student';
        studentModal.style.display = 'block';
    }
};

window.editTransfer = function(firebaseKey) {
    const transfer = transfers.find(t => t.firebaseKey === firebaseKey);
    if (transfer) {
        document.getElementById('transferId').value = transfer.firebaseKey;
        document.getElementById('transferName').value = transfer.name;
        document.getElementById('grade').value = transfer.grade;
        document.getElementById('transferModalTitle').textContent = 'Edit Transfer';
        document.getElementById('transferSubmitBtn').textContent = 'Update Transfer';
        document.getElementById('deleteTransferBtn').style.display = 'block';
        transferModal.style.display = 'block';
    }
};

// Delete Functions
window.deleteStudent = function(firebaseKey) {
    if (confirm('Are you sure you want to delete this student?')) {
        deleteStudentFromFirebase(firebaseKey);
    }
};

window.deleteTransfer = function(firebaseKey) {
    if (confirm('Are you sure you want to delete this transfer?')) {
        deleteTransferFromFirebase(firebaseKey);
    }
};

// Sort Function
function sortStudents() {
    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    const sortedStudents = [...students].sort((a, b) => {
        if (sortDirection === 'asc') {
            return a.name.localeCompare(b.name);
        } else {
            return b.name.localeCompare(a.name);
        }
    });
    renderAdmissions(sortedStudents);
}

// Enhanced Search Functionality
function filterItems(searchTerm) {
    const filteredStudents = students.filter(student => 
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.date.includes(searchTerm)
    );
    
    const filteredTransfers = transfers.filter(transfer => 
        transfer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (transfer.grade && transfer.grade.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    renderAdmissions(filteredStudents);
    renderTransfers(filteredTransfers);
}

// Update Admissions Counter
function updateAdmissionsCounter() {
    const counter = document.getElementById('admissionsCounter');
    if (counter) {
        counter.textContent = students.length;
    }
}

// Event Listeners
searchInput.addEventListener('input', (e) => filterItems(e.target.value));
sortButton.addEventListener('click', sortStudents);

// Student Form Submit
studentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const firebaseKey = document.getElementById('studentId').value;
    const studentData = {
        name: document.getElementById('studentName').value,
        date: document.getElementById('admissionDate').value,
        status: document.getElementById('studentStatus').value,
        img: 'img/people.png'
    };

    if (firebaseKey) {
        // Update existing student
        updateStudentInFirebase(firebaseKey, studentData);
    } else {
        // Add new student
        addStudentToFirebase(studentData);
    }

    studentModal.style.display = 'none';
    studentForm.reset();
});

// Transfer Form Submit
transferForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const firebaseKey = document.getElementById('transferId').value;
    const transferData = {
        name: document.getElementById('transferName').value,
        grade: document.getElementById('grade').value,
        completed: false
    };

    if (firebaseKey) {
        // Update existing transfer
        updateTransferInFirebase(firebaseKey, transferData);
    } else {
        // Add new transfer
        addTransferToFirebase(transferData);
    }

    transferModal.style.display = 'none';
    transferForm.reset();
});

// Modal Event Listeners
addAdmissionBtn.addEventListener('click', () => {
    studentForm.reset();
    document.getElementById('modalTitle').textContent = 'Add New Student';
    document.getElementById('submitBtn').textContent = 'Add Student';
    document.getElementById('studentId').value = '';
    studentModal.style.display = 'block';
});

addTransferBtn.addEventListener('click', () => {
    transferForm.reset();
    document.getElementById('transferModalTitle').textContent = 'Add New Transfer';
    document.getElementById('transferSubmitBtn').textContent = 'Add Transfer';
    document.getElementById('transferId').value = '';
    document.getElementById('deleteTransferBtn').style.display = 'none';
    transferModal.style.display = 'block';
});

// Close Modals
closeButtons.forEach(button => {
    button.addEventListener('click', () => {
        studentModal.style.display = 'none';
        transferModal.style.display = 'none';
    });
});

window.addEventListener('click', (e) => {
    if (e.target === studentModal) {
        studentModal.style.display = 'none';
    }
    if (e.target === transferModal) {
        transferModal.style.display = 'none';
    }
});

// Real-time listeners for automatic updates
onValue(studentsRef, (snapshot) => {
    if (snapshot.exists()) {
        const data = snapshot.val();
        students = Object.keys(data).map(key => ({
            firebaseKey: key,
            id: data[key].id || key,
            ...data[key]
        }));
    } else {
        students = [];
    }
    renderAdmissions();
    updateAdmissionsCounter();
});

onValue(transfersRef, (snapshot) => {
    if (snapshot.exists()) {
        const data = snapshot.val();
        transfers = Object.keys(data).map(key => ({
            firebaseKey: key,
            id: data[key].id || key,
            ...data[key]
        }));
    } else {
        transfers = [];
    }
    renderTransfers();
});

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadStudentsFromFirebase();
    loadTransfersFromFirebase();
});