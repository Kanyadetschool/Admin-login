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
// Hide sidebar by default
sidebar.classList.add('hide');

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


// DOM Elements
const searchInput = document.querySelector('.form-input input');
const admissionsTable = document.querySelector('.order table tbody');
const addAdmissionBtn = document.createElement('button');
const sortButton = document.createElement('button');
sortButton.innerHTML = '<i class="bx bx-sort-alt-2"></i>';
document.querySelector('.order .head').appendChild(sortButton);

// Import statements and grade data
import { Grade1 } from './Grade 1.js';
import { Grade2 } from './Grade 2.js';
import { Grade3 } from './Grade 3.js';
import { Grade4 } from './Grade 4.js';
import { Grade5 } from './Grade 5.js';
import { Grade6 } from './Grade 6.js';
import { Grade7 } from './Grade 7.js';
import { Grade8 } from './Grade 8.js';
import { Grade9 } from './Grade 9.js';

// Combine all grades data
const grades = {
    Grade1,
    Grade2,
    Grade3,
    Grade4,
    Grade5,
    Grade6,
    Grade7,
    Grade8,
    Grade9
};

// Create allStudents array from imported data
const allStudents = Object.values(grades).flat();

// Sorting state
let sortDirection = 'asc';

// Create Add Admission button and add to DOM
addAdmissionBtn.innerHTML = '<i class="bx bx-plus"></i>';
document.querySelector('.order .head').appendChild(addAdmissionBtn);

// Add filter buttons to the header
const headerDiv = document.querySelector('.order .head');
const filterContainer = document.createElement('div');
filterContainer.className = 'filter-container';
filterContainer.style.marginLeft = 'auto';
filterContainer.style.display = 'flex';
filterContainer.style.gap = '10px';
filterContainer.style.alignItems = 'center';

// Create filter dropdowns
const classFilter = document.createElement('select');
const genderFilter = document.createElement('select');
const statsDisplay = document.createElement('div');

classFilter.innerHTML = `
    <option value="">All Classes</option>
    <option value="Grade 1">Grade 1</option>
    <option value="Grade 2">Grade 2</option>
    <option value="Grade 3">Grade 3</option>
    <option value="Grade 4">Grade 4</option>
    <option value="Grade 5">Grade 5</option>
    <option value="Grade 6">Grade 6</option>
    <option value="Grade 7">Grade 7</option>
    <option value="Grade 8">Grade 8</option>
    <option value="Grade 9">Grade 9</option>
`;

genderFilter.innerHTML = `
    <option value="">All Genders</option>
    <option value="Male">Male</option>
    <option value="Female">Female</option>
`;

// Style the filters
[classFilter, genderFilter].forEach(filter => {
    filter.style.padding = '5px';
    filter.style.borderRadius = '5px';
    filter.style.border = '1px solid #ddd';
});

// Add stats display
statsDisplay.style.marginLeft = '20px';
statsDisplay.style.fontSize = '0.9em';

// Add elements to the header
filterContainer.appendChild(classFilter);
filterContainer.appendChild(genderFilter);
filterContainer.appendChild(statsDisplay);
headerDiv.appendChild(filterContainer);

// Render students table - Updated to use allStudents
function renderStudents(studentsToRender = allStudents) {
    if (!admissionsTable) {
        console.error('Table body not found');
        return;
    }

    admissionsTable.innerHTML = studentsToRender
        .map(student => `
            <tr>
                <td>
                    <img src="${student.FileUrl1 || './img/people.png'}" alt="Student">
                    <p>${student.StudentFullName}</p>
                </td>
                <td>${student.AssessmentNumber || 'N/A'}</td>
                <td><span class="status ${student.Status?.toLowerCase() || ''}">${student.UPI || 'N/A'}</span></td>
                <td>${student.EntryNo || 'N/A'}</td>
                <td>${student.Gender || 'N/A'}</td>
                <td>${student.MothersPhoneNumber || 'N/A'}</td>
                <td>${student.DateOfAdm || 'N/A'}</td>
                <td>${student.CurentGrade || 'N/A'}</td>
                <td>${student.Status || 'N/A'}</td>
            </tr>
        `)
        .join('');
}

// Sort students - Updated to use allStudents
function sortStudents() {
    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    const sortedStudents = [...allStudents].sort((a, b) => {
        return sortDirection === 'asc' 
            ? a.StudentFullName.localeCompare(b.StudentFullName)
            : b.StudentFullName.localeCompare(a.StudentFullName);
    });
    renderStudents(sortedStudents);
}

// Search students - Updated to use allStudents
function searchStudents(query) {
    const filtered = allStudents.filter(student => 
        student.StudentFullName.toLowerCase().includes(query.toLowerCase())
    );
    renderStudents(filtered);
}

// Event Listeners
searchInput.addEventListener('input', (e) => searchStudents(e.target.value));
sortButton.addEventListener('click', sortStudents);
addAdmissionBtn.addEventListener('click', () => {
    document.getElementById('addStudentModal').style.display = 'block';
});

// Initial render
renderStudents();

// Add student detail modal HTML
const studentDetailModalHTML = `
    <div id="studentDetailModal" class="modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 999999; overflow-y: auto;">
        <div class="modal-content" style="position: relative;  background-image: url(./img/BackgroundUniversal.jpg);background-size: cover; margin: 3% auto; padding: 0; width: 85%; max-width: 1200px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
            <div class="modal-header" style="background: linear-gradient(45deg,#2e374b,#ff1cac);border-radius: 10px ;; color: white; padding: 20px 30px;">
                <h2 style="margin: 0; font-size: 1.8em;">Student Information</h2>
                <span class="close" style="position: absolute; right: 20px; top: 20px; cursor: pointer; font-size: 24px; color: white;">&times;</span>
            </div>
            <div class="student-data" style="padding: 30px;">
                <!-- Content will be dynamically inserted here -->
            </div>
        </div>
    </div>
`;

// Add modal to DOM
document.body.insertAdjacentHTML('beforeend', studentDetailModalHTML);

// Function to show student details
function showStudentDetails(student) {
    const modal = document.getElementById('studentDetailModal');
    const content = modal.querySelector('.student-data');

    // Fields to exclude from display
    const excludedFields = [
        'StudentFullName',
        'AssessmentNumber',
        'UPI',
        'EntryNo',
        'Gender',
        'Status',
        'DateOfAdm',
        'CurentGrade',
        'FileUrl1' // Hide FileUrl1 from display but keep its functionality
    ];

    // Get profile image (FileUrl1)
    const profileImage = student.FileUrl1 && student.FileUrl1.trim() !== '' 
        ? student.FileUrl1 
        : './img/people.png';

    // Filter and format the data
    const additionalData = Object.entries(student)
        .filter(([key, value]) => {
            return !excludedFields.includes(key) && 
                   value && 
                   value.toString().trim() !== '' &&
                   value !== '🕸️';
        })
        .map(([key, value]) => {
            if (key.startsWith('FileUrl') && value) {
                return `
                    <div class="data-item" style="margin-bottom: 20px;">
                        <h3 style="color: #666; margin-bottom: 10px;">${key.replace(/([A-Z])/g, ' $1').trim()}</h3>
                        <button onclick="window.open('${value}', '_blank')" 
                                style="background: #3C91E6; color: white; border: none; 
                                       padding: 8px 15px; border-radius: 5px; cursor: pointer;
                                       display: flex; align-items: center; gap: 5px;">
                            <i class='bx bx-image'></i>
                            View Image
                        </button>
                        <img src="${value}" alt="Additional Image" 
                             style="max-width: 200px; border-radius: 8px; 
                                    box-shadow: 0 2px 8px rgba(0,0,0,0.1); 
                                    margin-top: 10px;">
                    </div>
                `;
            }
            return `
                <div class="data-item" style="margin-bottom: 20px;">
                    <h3 style="color: #666; margin-bottom: 5px;">${key.replace(/([A-Z])/g, ' $1').trim()}</h3>
                    <p style="margin: 0; color: #333; font-size: 1.1em;">${value}</p>
                </div>
            `;
        })
        .join('');

    content.innerHTML = `
        <div style="display: flex; gap: 20px; margin-bottom: 30px;">
            <img src="${profileImage}" alt="Student Profile" 
                style="width: 150px; height: 150px; border-radius: 10px; 
                       object-fit: cover; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
            <div style="flex-grow: 1;">
                <h2 style="margin: 0 0 10px 0; color: #2e374b;">${student.StudentFullName || 'N/A'}</h2>
                <p style="margin: 0; color: #666; font-size: 1.1em;">
                    ${student.CurentGrade || 'N/A'} | 
                    ${student.Gender || 'N/A'} | 
                    UPI: ${student.UPI || 'N/A'}
                </p>
            </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
            ${additionalData}
        </div>
    `;

    // Add print button to header
    const modalHeader = modal.querySelector('.modal-header');
    modalHeader.innerHTML = `
        <h2 style="margin: 0; font-size: 1.8em;">Student Information</h2>
        <button onclick="printStudentData(${JSON.stringify(student).replace(/"/g, '&quot;')})" 
                style="position: absolute; right: 60px; top: 15px; 
                       background: #fff; color: #2e374b; border: none;
                       padding: 8px 15px; border-radius: 5px; cursor: pointer;
                       display: flex; align-items: center; gap: 5px;">
            <i class='bx bx-printer'></i>
            Print
        </button>
        <span class="close" style="position: absolute; right: 20px; top: 20px; cursor: pointer; font-size: 24px; color: white;">&times;</span>
    `;

    modal.style.display = 'block';

    // Close modal functionality
    const closeBtn = modal.querySelector('.close');
    const closeModal = () => modal.style.display = 'none';
    
    closeBtn.onclick = closeModal;
    window.onclick = (event) => {
        if (event.target === modal) closeModal();
    };
}

// Add print function
window.printStudentData = function(student) {
    const printWindow = window.open('', '', 'width=800,height=600');
    const profileImage = student.FileUrl1 && student.FileUrl1.trim() !== '' 
        ? student.FileUrl1 
        : './img/people.png';

    printWindow.document.write(`
        <html>
            <head>
                <title>Student Information - ${student.StudentFullName}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .header { display: flex; gap: 20px; margin-bottom: 30px; }
                    .profile-img { width: 150px; height: 150px; object-fit: cover; border-radius: 10px; }
                    .student-info { flex-grow: 1; }
                    .data-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
                    .data-item { margin-bottom: 15px; }
                    .data-item h3 { color: #666; margin: 0 0 5px 0; }
                    .data-item p { margin: 0; color: #333; }
                    @media print {
                        .no-print { display: none; }
                        button { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <img src="${profileImage}" alt="Student Profile" class="profile-img">
                    <div class="student-info">
                        <h1 style="margin: 0 0 10px 0;">${student.StudentFullName || 'N/A'}</h1>
                        <p style="margin: 0; font-size: 1.1em;">
                            ${student.CurentGrade || 'N/A'} | 
                            ${student.Gender || 'N/A'} | 
                            UPI: ${student.UPI || 'N/A'}
                        </p>
                    </div>
                </div>
                <div class="data-grid">
                    ${Object.entries(student)
                        .filter(([key, value]) => value && value !== '🕸️')
                        .map(([key, value]) => `
                            <div class="data-item">
                            <div class="data-item">
                                <h3>${key.replace(/([A-Z])/g, ' $1').trim()}</h3>
                                <p>${value}</p>
                            </div>
                        `).join('')}
                </div>
                <button onclick="window.print()" class="no-print" 
                        style="position: fixed; bottom: 20px; right: 20px; 
                               background: #3C91E6; color: white; border: none;
                               padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                    Print
                </button>
            </body>
        </html>
    `);
    printWindow.document.close();
};

// Update renderStudentData to make rows clickable
function renderStudentData(studentsToRender = allStudents) {
    const tbody = document.querySelector('tbody');
    if (!tbody) {
        console.error('Table body not found');
        return;
    }

    tbody.innerHTML = '';
    
    if (!studentsToRender || studentsToRender.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center;">No students found</td>
            </tr>
        `;
        return;
    }
    
    studentsToRender.forEach(student => {
        try {
            const tr = document.createElement('tr');
            tr.style.cursor = 'pointer';
            
            // Update image handling to use FileUrl1 with fallback
            const studentImage = student.FileUrl1 && student.FileUrl1.trim() !== '' 
                ? student.FileUrl1 
                : './img/people.png';
            
            tr.innerHTML = `
                <td>
                    <img src="${studentImage}" alt="Student" style="width: 36px; height: 36px; border-radius: 50%;">
                    <p>${student.StudentFullName || 'N/A'}</p>
                </td>
                <td>${student.DateOfAdm || 'N/A'}</td>
                <td>${student.AssessmentNumber || 'N/A'}</td>
                <td><span class="status ${student.Status?.toLowerCase() || ''}">${student.UPI || 'N/A'}</span></td>
                <td>${student.EntryNo || 'N/A'}</td>
                <td>${student.Gender || 'N/A'}</td>
                <td>${student.MothersPhoneNumber || 'N/A'}</td>
                <td>${student.CurentGrade || 'N/A'}</td>
                <td>${student.Status || 'N/A'}</td>
            `;
            
            tr.addEventListener('click', () => showStudentDetails(student));
            tbody.appendChild(tr);
        } catch (error) {
            console.error('Error rendering student:', error, student);
        }
    });
}

function filterMultipleCriteria(searchTerm) {
    const terms = searchTerm.split(' ').map(term => term.toLowerCase());
    
    const filteredStudents = allStudents.filter(student => {
        const searchableFields = {
            name: student.StudentFullName,
            assessment: student.AssessmentNumber,
            upi: student.UPI,
            grade: student.gradeLabel,
            entry: student.EntryNo,
            gender: student.Gender,
            classCode: student.Status,
            classGender: student.DateOfAdm,
            currentGrade: student.CurentGrade
        };

        return terms.every(term => {
            // Check if term is a key:value search
            if (term.includes(':')) {
                const [key, value] = term.split(':');
                return searchableFields[key]?.toLowerCase().includes(value);
            }
            
            // Regular search across all fields
            return Object.values(searchableFields)
                .some(field => field && field.toString().toLowerCase().includes(term));
        });
    });

    renderStudentData(filteredStudents);
}

// Update statistics display
function updateStats(filteredStudents) {
    const total = Object.values(grades).flat().length;
    const filtered = filteredStudents.length;
    const boys = filteredStudents.filter(s => s.Gender === 'Male').length;
    const girls = filteredStudents.filter(s => s.Gender === 'Female').length;
    
    statsDisplay.innerHTML = `
        <strong>Total: ${total}</strong> | 
        Showing: ${filtered} | 
        Boys: ${boys} | 
        Girls: ${girls}
    `;
}

// Enhanced filter function
function filterStudents() {
    const selectedClass = classFilter.value;
    const selectedGender = genderFilter.value;
    const searchTerm = searchInput.value.toLowerCase();
    
    const filteredStudents = allStudents.filter(student => {
        const matchesClass = !selectedClass || student.CurentGrade === selectedClass;
        const matchesGender = !selectedGender || student.Gender === selectedGender;
        const matchesSearch = !searchTerm || 
            Object.values(student)
                .some(value => value?.toString().toLowerCase().includes(searchTerm));
        
        return matchesClass && matchesGender && matchesSearch;
    });

    renderStudentData(filteredStudents);
    updateStats(filteredStudents);
}

// Update event listeners
classFilter.addEventListener('change', filterStudents);
genderFilter.addEventListener('change', filterStudents);
searchInput.addEventListener('input', filterStudents);

// Update search event listener
document.addEventListener('DOMContentLoaded', () => {
    console.log('Total students:', allStudents.length);
    renderStudentData(); // This will now use allStudents by default
    updateStats(allStudents); // Initial stats display
    const searchInput = document.querySelector('.form-input input[type="search"]');
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value;
        if (searchTerm === '') {
            renderStudentData();
        } else {
            filterMultipleCriteria(searchTerm);
        }
    });

    // Add search help tooltip
    searchInput.title = `
        Search using multiple terms or specific fields:
        - Simple search: john grade3
        - Field search: name:john grade:3 gender:male
        Available fields: name, assessment, upi, grade, entry, gender, classCode, classGender, currentGrade
    `.trim();
});

// Add analytics modal HTML
const analyticsModalHTML = `
    <div id="analyticsModal" class="modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 999999; overflow-y: auto;">
        <div class="modal-content" style="background-image: url(./img/BackgroundUniversal.jpg); background-size: cover; margin: 3% auto; padding: 0; width: 90%; max-width: 1400px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
            <div class="modal-header" style="background: linear-gradient(45deg,#2e374b,#ff1cac); border-radius: 10px; color: white; padding: 20px 30px;">
                <h2 style="margin: 0; font-size: 1.8em;">Student Analytics Dashboard</h2>
                <span class="close" style="position: absolute; right: 20px; top: 20px; cursor: pointer; font-size: 24px; color: white;">&times;</span>
            </div>
            <div class="analytics-content" style="padding: 30px;">
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px;">
                    <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <canvas id="genderDistChart"></canvas>
                    </div>
                    <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <canvas id="gradeDistChart"></canvas>
                    </div>
                </div>
                <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <canvas id="trendChart"></canvas>
                </div>
            </div>
        </div>
    </div>
`;

// Add modal to DOM
document.body.insertAdjacentHTML('beforeend', analyticsModalHTML);

// Add click handler to analytics menu item
document.querySelector('a i.bx.bxs-doughnut-chart').parentElement.addEventListener('click', (e) => {
    e.preventDefault();
    showAnalytics();
});

// Function to show analytics
async function showAnalytics() {
    const modal = document.getElementById('analyticsModal');
    modal.style.display = 'block';

    // Load Chart.js if not already loaded
    if (typeof Chart === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        await new Promise((resolve) => {
            script.onload = resolve;
            document.head.appendChild(script);
        });
    }

    // Calculate analytics data
    const genderData = {
        male: allStudents.filter(s => s.Gender === 'Male').length,
        female: allStudents.filter(s => s.Gender === 'Female').length
    };

    const gradeData = {};
    allStudents.forEach(student => {
        const grade = student.CurentGrade;
        gradeData[grade] = (gradeData[grade] || 0) + 1;
    });

    // Gender Distribution Chart
    new Chart(document.getElementById('genderDistChart'), {
        type: 'pie',
        data: {
            labels: ['Male', 'Female'],
            datasets: [{
                data: [genderData.male, genderData.female],
                backgroundColor: ['#36A2EB', '#FF6384']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Gender Distribution'
                }
            }
        }
    });

    // Grade Distribution Chart
    new Chart(document.getElementById('gradeDistChart'), {
        type: 'bar',
        data: {
            labels: Object.keys(gradeData),
            datasets: [{
                label: 'Students per Grade',
                data: Object.values(gradeData),
                backgroundColor: '#4BC0C0'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Students per Grade'
                }
            }
        }
    });

    // Sample Trend Chart (you can modify this with real trend data)
    new Chart(document.getElementById('trendChart'), {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Student Enrollment Trend',
                data: [65, 70, 75, 78, 82, 85],
                borderColor: '#FF9F40',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Enrollment Trend'
                }
            }
        }
    });

    // Close modal functionality
    const closeBtn = modal.querySelector('.close');
    const closeModal = () => modal.style.display = 'none';
    
    closeBtn.onclick = closeModal;
    window.onclick = (event) => {
        if (event.target === modal) closeModal();
    };
}

// Enhanced analytics modal HTML with advanced features
const advancedAnalyticsModalHTML = `
    <div id="analyticsModal" class="modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 999999; overflow-y: auto;">
        <div class="modal-content" style="background-image: url(./img/BackgroundUniversal.jpg); background-size: cover; margin: 2% auto; padding: 0; width: 95%; max-width: 1600px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
            <div class="modal-header" style="background: linear-gradient(45deg,#2e374b,#ff1cac); border-radius: 10px; color: white; padding: 20px 30px; display: flex; justify-content: space-between; align-items: center;">
                <h2 style="margin: 0; font-size: 1.8em;">Advanced Analytics Dashboard</h2>
                <div class="analytics-controls" style="display: flex; gap: 15px; align-items: center;">
                    <select id="dateRangeFilter" style="padding: 8px; border-radius: 5px;">
                        <option value="7">Last 7 days</option>
                        <option value="30">Last 30 days</option>
                        <option value="90">Last 3 months</option>
                        <option value="180">Last 6 months</option>
                        <option value="365">Last year</option>
                        <option value="custom">Custom Range</option>
                    </select>
                    <button id="exportAnalytics" style="padding: 8px 15px; background: #fff; color: #2e374b; border: none; border-radius: 5px; cursor: pointer;">
                        <i class='bx bx-export'></i> Export Report
                    </button>
                    <span class="close" style="cursor: pointer; font-size: 24px; color: white;">&times;</span>
                </div>
            </div>
            <div class="analytics-content" style="padding: 20px;">
                <div class="analytics-summary" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px;">
                    <!-- Summary Cards -->
                </div>
                <div class="analytics-charts" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 20px;">
                    <div class="chart-container" style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <canvas id="genderDistChart"></canvas>
                    </div>
                    <div class="chart-container" style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <canvas id="gradeDistChart"></canvas>
                    </div>
                    <div class="chart-container" style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <canvas id="performanceChart"></canvas>
                    </div>
                    <div class="chart-container" style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <canvas id="attendanceChart"></canvas>
                    </div>
                </div>
                <div class="analytics-details" style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <div class="tabs" style="margin-bottom: 15px;">
                        <button class="tab-btn active" data-tab="demographics">Demographics</button>
                        <button class="tab-btn" data-tab="academic">Academic Performance</button>
                        <button class="tab-btn" data-tab="attendance">Attendance Patterns</button>
                        <button class="tab-btn" data-tab="trends">Trends Analysis</button>
                    </div>
                    <div id="tabContent"></div>
                </div>
            </div>
        </div>
    </div>
`;

// Replace existing analytics modal with advanced version
document.body.insertAdjacentHTML('beforeend', advancedAnalyticsModalHTML);

// Enhanced analytics function
async function showAdvancedAnalytics() {
    const modal = document.getElementById('analyticsModal');
    modal.style.display = 'block';

    // Load required libraries
    await loadLibraries([
        'https://cdn.jsdelivr.net/npm/chart.js',
        'https://cdn.jsdelivr.net/npm/moment',
        'https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels'
    ]);

    // Calculate advanced analytics data
    const analyticsData = calculateAnalyticsData();
    
    // Render summary cards
    renderSummaryCards(analyticsData);
    
    // Render all charts
    renderCharts(analyticsData);
    
    // Initialize tabs
    initializeTabs(analyticsData);
    
    // Setup event listeners
    setupAnalyticsEventListeners(analyticsData);
}

function calculateAnalyticsData() {
    return {
        demographics: calculateDemographics(),
        academic: calculateAcademicMetrics(),
        attendance: calculateAttendanceMetrics(),
        trends: calculateTrends()
    };
}

function calculateDemographics() {
    const demographics = {
        genderDist: {
            male: allStudents.filter(s => s.Gender === 'Male').length,
            female: allStudents.filter(s => s.Gender === 'Female').length
        },
        gradeDistribution: {},
        ageGroups: {},
        // Add more demographic calculations
    };

    allStudents.forEach(student => {
        // Grade distribution
        demographics.gradeDistribution[student.CurentGrade] = 
            (demographics.gradeDistribution[student.CurentGrade] || 0) + 1;
            
        // Age groups calculation
        const age = calculateAge(student.DateOfBirth);
        const ageGroup = getAgeGroup(age);
        demographics.ageGroups[ageGroup] = (demographics.ageGroups[ageGroup] || 0) + 1;
    });

    return demographics;
}

function calculateAcademicMetrics() {
    // Implement academic performance calculations
    return {
        averageScores: calculateAverageScores(),
        performanceTrends: calculatePerformanceTrends(),
        gradeDistribution: calculateGradeDistribution()
    };
}

function renderCharts(data) {
    // Render enhanced charts with interactive features
    renderGenderDistribution(data.demographics.genderDist);
    renderGradeDistribution(data.demographics.gradeDistribution);
    renderPerformanceChart(data.academic.performanceTrends);
    renderAttendanceChart(data.attendance);
}

function setupAnalyticsEventListeners(data) {
    // Date range filter
    document.getElementById('dateRangeFilter').addEventListener('change', (e) => {
        updateChartsForDateRange(e.target.value, data);
    });

    // Export functionality
    document.getElementById('exportAnalytics').addEventListener('click', () => {
        exportAnalyticsReport(data);
    });

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchTab(e.target.dataset.tab, data);
        });
    });
}

function exportAnalyticsReport(data) {
    const report = generateAnalyticsReport(data);
    const blob = new Blob([report], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student-analytics-report.pdf';
    a.click();
}

// Update existing analytics click handler
document.querySelector('a i.bx.bxs-doughnut-chart').parentElement.addEventListener('click', (e) => {
    e.preventDefault();
    showAdvancedAnalytics();
});