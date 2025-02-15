
const allSideMenu = document.querySelectorAll('#sidebar .side-menu.top li a','.side-menu.top');

allSideMenu.forEach(item=> {
	const li = item.parentElement;

	item.addEventListener('click', function () {
		allSideMenu.forEach(i=> {
			i.parentElement.classList.remove('active');
		})
		li.classList.add('active');
		
		// Hide sidebar if the clicked item is already active
		// if (li.classList.contains('active')) {
		// 	sidebar.classList.add('hide');
		// }
	})
});



// TOGGLE SIDEBAR
const menuBar = document.querySelector('.bx.bx-menu');
const sidebar = document.getElementById('sidebar');

menuBar.addEventListener('click', function () {
	sidebar.classList.toggle('hide');
})







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
    const headers = document.querySelectorAll('.order .head, .order table thead');
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

// Initialize data from localStorage or use default data
let students = JSON.parse(localStorage.getItem('students')) || [
    { id: 1, name: 'John Doe', date: '01-10-2021', status: 'completed', img: 'img/people.png' },
    { id: 2, name: 'Jane Smith', date: '01-10-2021', status: 'pending', img: 'img/people.png' },
];

let transfers = JSON.parse(localStorage.getItem('transfers')) || [
    { id: 1, name: 'Mary Achieng', grade: 'Grade 3', completed: true },
    { id: 2, name: 'John Alan', grade: 'Grade 6', completed: true },
    { id: 3, name: 'Peter Oloo', grade: 'Grade 4', completed: false },
];

// Sorting state
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
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="process">Process</option>
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

// Save to localStorage
function saveData() {
    localStorage.setItem('students', JSON.stringify(students));
    localStorage.setItem('transfers', JSON.stringify(transfers));
    updateAdmissionsCounter(); // Add this line
}

// Enhanced render functions with edit/delete buttons
function renderAdmissions(studentsToRender = students) {
    admissionsTable.innerHTML = studentsToRender.map(student => `
        <tr data-id="${student.id}">
            <td>
                <img src="${student.img}">
                <p>${student.name}</p>
            </td>
            <td>${student.date}</td>
            <td>
                <span class="status ${student.status}">${student.status}</span>
                <div class="actions" style="display: inline-block; margin-left: 10px;">
                    <button onclick="editStudent(${student.id})" style="background: none; border: none; cursor: pointer;">
                        <i class='bx bx-edit-alt'></i>
                    </button>
                    <button onclick="deleteStudent(${student.id})" style="background: none; border: none; cursor: pointer;">
                        <i class='bx bx-trash'></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderTransfers(transfersToRender = transfers) {
    transfersList.innerHTML = transfersToRender.map(transfer => `
        <li class="${transfer.completed ? 'completed' : 'not-completed'}" data-id="${transfer.id}">
            <p>${transfer.name} ${transfer.grade ? `<b>${transfer.grade}</b>` : ''}</p>
            <div>
                <i class='bx bx-edit-alt' onclick="editTransfer(${transfer.id})" style="cursor: pointer; margin-right: 8px;"></i>
                <i class='bx bx-trash' onclick="deleteTransfer(${transfer.id})" style="cursor: pointer; margin-right: 8px;"></i>
                <i class='bx bx-dots-vertical-rounded'></i>
            </div>
        </li>
    `).join('');
}

// Edit functions
window.editStudent = function(id) {
    const student = students.find(s => s.id === id);
    if (student) {
        document.getElementById('studentId').value = student.id;
        document.getElementById('studentName').value = student.name;
        document.getElementById('admissionDate').value = student.date;
        document.getElementById('studentStatus').value = student.status;
        document.getElementById('modalTitle').textContent = 'Edit Student';
        document.getElementById('submitBtn').textContent = 'Update Student';
        studentModal.style.display = 'block';
    }
};

window.editTransfer = function(id) {
    const transfer = transfers.find(t => t.id === id);
    if (transfer) {
        document.getElementById('transferId').value = transfer.id;
        document.getElementById('transferName').value = transfer.name;
        document.getElementById('grade').value = transfer.grade;
        document.getElementById('transferModalTitle').textContent = 'Edit Transfer';
        document.getElementById('transferSubmitBtn').textContent = 'Update Transfer';
        document.getElementById('deleteTransferBtn').style.display = 'block';
        transferModal.style.display = 'block';
    }
};

// Delete functions
window.deleteStudent = function(id) {
    if (confirm('Are you sure you want to delete this student?')) {
        students = students.filter(s => s.id !== id);
        saveData();
        renderAdmissions();
        updateAdmissionsCounter();
        location.reload(); // Add this line to reload the page
    }
};

window.deleteTransfer = function(id) {
    if (confirm('Are you sure you want to delete this transfer?')) {
        transfers = transfers.filter(t => t.id !== id);
        saveData();
        renderTransfers();
    }
};

// Sort function
function sortStudents() {
    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    students.sort((a, b) => {
        if (sortDirection === 'asc') {
            return a.name.localeCompare(b.name);
        } else {
            return b.name.localeCompare(a.name);
        }
    });
    renderAdmissions();
}

// Enhanced search functionality
function filterItems(searchTerm) {
    const filteredStudents = students.filter(student => 
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.date.includes(searchTerm)
    );
    
    const filteredTransfers = transfers.filter(transfer => 
        transfer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transfer.grade.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    renderAdmissions(filteredStudents);
    renderTransfers(filteredTransfers);
}

// Add this function to update admissions counter
function updateAdmissionsCounter() {
    const counter = document.getElementById('admissionsCounter');
    if (counter) {
        counter.textContent = students.length;
    }
}

// Event Listeners
searchInput.addEventListener('input', (e) => filterItems(e.target.value));
sortButton.addEventListener('click', sortStudents);

studentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const studentId = document.getElementById('studentId').value;
    const studentData = {
        name: document.getElementById('studentName').value,
        date: document.getElementById('admissionDate').value,
        status: document.getElementById('studentStatus').value,
        img: 'img/people.png'
    };

    if (studentId) {
        const index = students.findIndex(s => s.id === parseInt(studentId));
        if (index !== -1) {
            students[index] = { ...students[index], ...studentData };
        }
    } else {
        studentData.id = students.length + 1;
        students.push(studentData);
    }

    saveData();
    renderAdmissions();
    updateAdmissionsCounter();
    studentModal.style.display = 'none';
    studentForm.reset();
    location.reload(); // Add this line to reload the page
});

transferForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const transferId = document.getElementById('transferId').value;
    const transferData = {
        name: document.getElementById('transferName').value,
        grade: document.getElementById('grade').value,
        completed: false
    };

    if (transferId) {
        // Update existing transfer
        const index = transfers.findIndex(t => t.id === parseInt(transferId));
        if (index !== -1) {
            transfers[index] = { ...transfers[index], ...transferData };
        }
    } else {
        // Add new transfer
        transferData.id = transfers.length + 1;
        transfers.push(transferData);
    }

    saveData();
    renderTransfers();
    transferModal.style.display = 'none';
    transferForm.reset();
});

// Clear form and reset titles when opening modals
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

// Close modals
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

// Initial render
renderAdmissions();
renderTransfers();
updateAdmissionsCounter(); // Add this line