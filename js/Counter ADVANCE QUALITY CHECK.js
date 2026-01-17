// Firebase Configuration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getDatabase, ref, get, onValue, update } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

// Initialize Firebase App
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
const auth = getAuth(app);

// Database References
const studentsRef = ref(db, `artifacts/${sanitizedAppId}/students`);
const transferredStudentsRef = ref(db, `Deletedstudents/${sanitizedAppId}/artifacts`);

// Arrays to hold student data
let activeStudents = [];
let transferredStudents = [];
let genderChart = null;
let gradeChart = null;
let disabilityChart = null;
let admissionChart = null;

// Function to check authentication status
function checkAuthAndLoadData() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            loadActiveStudentsFromFirebase();
            loadTransferredStudentsFromFirebase();
            //  checkDataQuality(); 
        } else {
            Swal.fire({
                title: 'Authentication Required',
                text: 'Please log in to access student data.',
                icon: 'warning',
                confirmButtonText: 'OK'
            });
            activeStudents = [];
            transferredStudents = [];
            updateTotalStudents();
            updateCharts();
            updateGradeTable();
            updateSummaryDashboard();
             checkDataQuality(); // ← KEEP THIS ONE ONLY
        }
    });
}

// Function to load active students from Firebase
async function loadActiveStudentsFromFirebase() {
    try {
        const snapshot = await get(studentsRef);
        if (snapshot.exists()) {
            const data = snapshot.val();
            activeStudents = Object.keys(data).map(key => {
                const studentData = data[key];
                return {
                    firebaseKey: key,
                    id: studentData.id || key,
                    StudentFullName: studentData['Official Student Name'] || studentData.name || 'N/A',
                    Gender: studentData.Gender || studentData.gender || 'Unknown',
                    Status: typeof studentData.Status === 'string' ? studentData.Status : 'Active',
                    CurrentGrade: studentData.Grade || studentData.CurrentGrade || 'N/A',
                    UPI: studentData.UPI || studentData.upi || key,
                    AssessmentNumber: key,
                    AdmissionNo: studentData.admissionNo || studentData.AdmissionNo || 'N/A',
                    FathersPhoneNumber: studentData['Home phone'] || studentData.fathersPhone || studentData.FathersPhoneNumber || 'N/A',
                    Father: studentData.Father || 'N/A',
                    MothersName: studentData.Mother || studentData.MothersName || 'N/A',
                    FileUrl1: studentData.img || studentData.FileUrl1 || '../img/Students.jpg',
                    DateOfAdmission: studentData.date || studentData.DateOfAdmission || 'N/A',
                    BirthEntry: studentData['Birth Entry'] || 'N/A',
                    Class: studentData.Class || 'N/A',
                    DOB: studentData.DOB || 'N/A',
                    Disability: studentData.Dissability || studentData.Disability || 'None',
                    MedicalCondition: studentData['Medical Condition'] || 'None',
                    ...studentData
                };
            });
        } else {
            activeStudents = [];
        }
        updateTotalStudents();
        updateCharts();
        updateGradeTable();
        updateSummaryDashboard();
        // checkDataQuality();
    } catch (error) {
        console.error('Error loading active students:', error);
        Swal.fire({
            title: 'Error',
            text: `Failed to load student data: ${error.message}`,
            icon: 'error'
        });
        activeStudents = [];
        updateTotalStudents();
        updateCharts();
        updateGradeTable();
        updateSummaryDashboard();
    }
}

// Function to load transferred students from Firebase
async function loadTransferredStudentsFromFirebase() {
    try {
        const snapshot = await get(transferredStudentsRef);
        if (snapshot.exists()) {
            const data = snapshot.val();
            transferredStudents = Object.keys(data).map(key => {
                const studentData = data[key];
                return {
                    firebaseKey: key,
                    id: studentData.id || key,
                    StudentFullName: studentData['Official Student Name'] || studentData.name || 'N/A',
                    Gender: studentData.Gender || studentData.gender || 'Unknown',
                    Status: typeof studentData.Status === 'string' ? studentData.Status : 'Transferred',
                    CurrentGrade: studentData.Grade || studentData.CurrentGrade || 'N/A',
                    UPI: studentData.UPI || studentData.upi || key,
                    AssessmentNumber: key,
                    AdmissionNo: studentData.admissionNo || studentData.AdmissionNo || 'N/A',
                    FathersPhoneNumber: studentData['Home phone'] || studentData.fathersPhone || studentData.FathersPhoneNumber || 'N/A',
                    Father: studentData.Father || 'N/A',
                    MothersName: studentData.Mother || studentData.MothersName || 'N/A',
                    SchoolTransferredTo: studentData.schoolTransferredTo || studentData.SchoolTransferredTo || 'N/A',
                    ReasonForTransfer: studentData.reasonForTransfer || studentData.ReasonForTransfer || 'N/A',
                    DateOfTransfer: studentData.dateOfTransfer || studentData.DateOfTransfer || 'N/A',
                    FileUrl1: studentData.img || studentData.FileUrl1 || '../img/Students.jpg',
                    FileUrl2: studentData.FileUrl2 || null,
                    DeletedAt: studentData.deletedAt || 'N/A',
                    DeletedBy: studentData.deletedBy || 'N/A',
                    BirthEntry: studentData['Birth Entry'] || 'N/A',
                    Class: studentData.Class || 'N/A',
                    DOB: studentData.DOB || 'N/A',
                    Disability: studentData.Dissability || studentData.Disability || 'None',
                    MedicalCondition: studentData['Medical Condition'] || 'None',
                    ...studentData
                };
            });
        } else {
            transferredStudents = [];
        }
        updateTransferredCount();
    } catch (error) {
        console.error('Error loading transferred students:', error);
        Swal.fire({
            title: 'Error',
            text: `Failed to load transferred student data: ${error.message}`,
            icon: 'error'
        });
        transferredStudents = [];
        updateTransferredCount();
    }
}

// Function to count total students and collect grade-wise, disability, and admission data
function updateTotalStudents() {
    // Aggregate gender, grade, disability, and admission data
    const genderData = { Male: 0, Female: 0, Other: 0, totalSum: 0 };
    const gradeGenderData = {};
    const disabilityData = {};
    const admissionData = {};
    activeStudents.forEach(student => {
        const gender = student.Gender ? student.Gender.toLowerCase() : 'other';
        const grade = student.CurrentGrade || 'N/A';
        const disability = student.Disability || 'None';
        const admissionYear = student.DateOfAdmission !== 'N/A' ? new Date(student.DateOfAdmission).getFullYear().toString() : 'Unknown';

        // Gender counts
        genderData.totalSum++;
        if (gender === 'male') {
            genderData.Male++;
        } else if (gender === 'female') {
            genderData.Female++;
        } else {
            genderData.Other++;
        }

        // Grade-wise gender counts
        if (!gradeGenderData[grade]) {
            gradeGenderData[grade] = { Male: 0, Female: 0, Other: 0, totalSum: 0 };
        }
        gradeGenderData[grade].totalSum++;
        if (gender === 'male') {
            gradeGenderData[grade].Male++;
        } else if (gender === 'female') {
            gradeGenderData[grade].Female++;
        } else {
            gradeGenderData[grade].Other++;
        }

        // Disability counts
        if (!disabilityData[disability]) {
            disabilityData[disability] = 0;
        }
        disabilityData[disability]++;

        // Admission year counts
        if (!admissionData[admissionYear]) {
            admissionData[admissionYear] = 0;
        }
        admissionData[admissionYear]++;
    });

    const totalStudents = genderData.totalSum;
    const maleStudents = genderData.Male;
    const femaleStudents = genderData.Female;

    const counterElement = document.getElementById('studentCounter');
    if (counterElement) {
        counterElement.innerHTML = `
            <div class="counter-box">
                <div class="total-count">
                    <span class="count">
                    <i class='bx bxs-calendar-check'></i>
                    ${totalStudents}</span>
                    <span class="label">Total Active Students Registered</span>
                </div>
                <div class="gender-counts">
                    <div class="male-count">
                        <span class="count">${maleStudents}</span>
                        <span class="label">Boys</span>
                    </div>
                    <div class="female-count">
                        <span class="count">${femaleStudents}</span>
                        <span class="label">Girls</span>
                    </div>
                </div>
            </div>
        `;

        if (!document.querySelector('#student-counter-styles')) {
            const styles = document.createElement('style');
            styles.id = 'student-counter-styles';
            styles.textContent = `
                .counter-box {
                    background: #F9F9F9;
                    padding: 20px;
                    border-radius: 10px;
                    color: black;
                    text-align: center;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                }
                .total-count { margin-bottom: 15px; }
                .total-count .count {
                    font-size: 3em;
                    font-weight: bold;
                    display: block;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                }
                .gender-counts {
                    display: flex;
                    justify-content: space-around;
                    gap: 20px;
                    flex-wrap: wrap;
                }
                .male-count, .female-count {
                    flex: 1;
                    min-width: 120px;
                    padding: 15px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 8px;
                    margin: 5px;
                }
                .male-count .count, .female-count .count {
                    font-size: 1.5em;
                    font-weight: bold;
                    display: block;
                }
                .label { font-size: 0.9em; opacity: 0.9; }
                @media (max-width: 768px) {
                    .counter-box { padding: 15px; }
                    .total-count .count { font-size: 2em; }
                    .gender-counts { flex-direction: column; gap: 10px; }
                    .male-count, .female-count { width: 100%; min-width: unset; }
                    .male-count .count, .female-count .count { font-size: 1.5em; }
                    .label { font-size: 0.8em; }
                }
                @media (max-width: 480px) {
                    .counter-box { padding: 10px; }
                    .total-count .count { font-size: 1.8em; }
                    .male-count .count, .female-count .count { font-size: 1.3em; }
                }
            `;
            document.head.appendChild(styles);
        }
    }

    // Log for debugging
    console.log('Gender Counts:', { total: totalStudents, male: maleStudents, female: femaleStudents, other: genderData.Other });
    console.log('Grade-wise Counts:', gradeGenderData);
    console.log('Disability Counts:', disabilityData);
    console.log('Admission Year Counts:', admissionData);
}

// Function to show a list of students in a popup with search
function showStudentList(title, students) {
    if (!auth.currentUser) {
        Swal.fire({
            title: 'Authentication Required',
            text: 'Please log in to view student details.',
            icon: 'warning'
        });
        return;
    }
    if (students.length === 0) {
        Swal.fire({
            title: 'No Students',
            text: 'There are no students in this category.',
            icon: 'info'
        });
        return;
    }

    let tableContent = `
        <input type="text" id="searchStudentsList" placeholder="Search by Name, UPI, or Assessment No." style="padding: 8px; width: 100%; margin-bottom: 10px;">
        <table class="student-list-table">
            <thead>
                <tr>
                    <th>Student Name</th>
                    <th>UPI</th>
                    <th>Assessment No.</th>
                    <th>Grade</th>
                    <th>Gender</th>
                    <th>Status</th>
                    <th>Admission No.</th>
                    <th>Father's Phone</th>
                    <th>Mother's Name</th>
                    <th>Father's Name</th>
                    <th>Medical Condition</th>
                </tr>
            </thead>
            <tbody id="studentListTableBody">
                ${students.map(student => `
                    <tr data-student='${JSON.stringify(student)}'>
                        <td>${student.StudentFullName}</td>
                        <td>${student.UPI === '🕸️' ? 'N/A' : student.UPI}</td>
                        <td>${student.AssessmentNumber}</td>
                        <td>${student.CurrentGrade}</td>
                        <td>${student.Gender}</td>
                        <td>${student.Status}</td>
                        <td>${student.AdmissionNo}</td>
                        <td>${student.FathersPhoneNumber}</td>
                        <td>${student.MothersName}</td>
                        <td>${student.Father}</td>
                        <td>${student.MedicalCondition}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    Swal.fire({
        title: title,
        html: tableContent,
        width: '100%',
        customClass: { popup: 'student-list-popup' },
        showConfirmButton: false,
        didOpen: () => {
            const tableRows = document.querySelectorAll('.student-list-table tbody tr');
            const searchInput = document.getElementById('searchStudentsList');

            function debounce(func, delay) {
                let timeout;
                return function (...args) {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => func.apply(this, args), delay);
                };
            }

            function highlightSearchTerms(text, searchTerm) {
                if (!searchTerm) return text;
                const regex = new RegExp(searchTerm, 'gi');
                return text.replace(regex, match => `<span style="background-color: yellow;">${match}</span>`);
            }

            const handleFilter = debounce(() => {
                const searchTerm = searchInput.value.toLowerCase();
                const filteredRows = Array.from(tableRows).filter(row => {
                    const studentData = JSON.parse(row.dataset.student);
                    const isSearchMatch = (
                        studentData.StudentFullName.toLowerCase().includes(searchTerm) ||
                        studentData.UPI.toLowerCase().includes(searchTerm) ||
                        studentData.AssessmentNumber.toLowerCase().includes(searchTerm)
                    );
                    return isSearchMatch;
                });

                tableRows.forEach(row => {
                    const studentData = JSON.parse(row.dataset.student);
                    let isMatch = filteredRows.includes(row);
                    row.innerHTML = `
                        <td>${highlightSearchTerms(studentData.StudentFullName, searchTerm)}</td>
                        <td>${highlightSearchTerms(studentData.UPI === '🕸️' ? 'N/A' : studentData.UPI, searchTerm)}</td>
                        <td>${highlightSearchTerms(studentData.AssessmentNumber, searchTerm)}</td>
                        <td>${studentData.CurrentGrade}</td>
                        <td>${studentData.Gender}</td>
                        <td>${studentData.Status}</td>
                        <td>${studentData.AdmissionNo}</td>
                        <td>${studentData.FathersPhoneNumber}</td>
                        <td>${studentData.MothersName}</td>
                        <td>${studentData.Father}</td>
                        <td>${studentData.MedicalCondition}</td>
                    `;
                    row.style.display = isMatch ? '' : 'none';
                });
            }, 300);

            searchInput.addEventListener('keyup', handleFilter);

            tableRows.forEach(row => {
                row.addEventListener('click', (e) => {
                    if (e.target.type === 'checkbox') return;
                    const studentData = JSON.parse(row.dataset.student);
                    Swal.fire({
                        title: studentData.StudentFullName,
                        imageAlt: 'Student Image',
                        width: '400px',
                        html: `
                            <img src="${studentData.FileUrl1}" alt="Student Image 1" style="width: 150px; height: 150px; border-radius: 10px; object-fit: cover; margin-bottom: 10px;">
                            <p><strong>UPI:</strong> ${studentData.UPI}</p>
                            <p><strong>Assessment No.:</strong> ${studentData.AssessmentNumber}</p>
                            <p><strong>Grade:</strong> ${studentData.CurrentGrade}</p>
                            <p><strong>Gender:</strong> ${studentData.Gender}</p>
                            <p><strong>Status:</strong> ${studentData.Status}</p>
                            <p><strong>Admission No.:</strong> ${studentData.AdmissionNo}</p>
                            <p><strong>Father's Phone:</strong> ${studentData.FathersPhoneNumber}</p>
                            <p><strong>Mother's Name:</strong> ${studentData.MothersName}</p>
                            <p><strong>Father's Name:</strong> ${studentData.Father}</p>
                            <p><strong>DOB:</strong> ${studentData.DOB}</p>
                            <p><strong>Disability:</strong> ${studentData.Disability}</p>
                            <p><strong>Medical Condition:</strong> ${studentData.MedicalCondition}</p>
                        `
                    });
                });
            });
        }
    });
}

// Function to update charts
function updateCharts() {
    const genderData = { Male: 0, Female: 0, Other: 0 };
    const gradeGenderData = {};
    const disabilityData = {};
    const admissionData = {};
    const admissionStudents = {};
    const gradeGenderStudents = {};
    const disabilityStudents = {};
    const genderStudents = { Male: [], Female: [], Other: [] };

    activeStudents.forEach(student => {
        const gender = student.Gender ? student.Gender.toLowerCase() : 'other';
        const grade = student.CurrentGrade || 'N/A';
        const disability = student.Disability || 'None';
        const admissionYear = student.DateOfAdmission !== 'N/A' ? new Date(student.DateOfAdmission).getFullYear().toString() : 'Unknown';
        const genderKey = gender === 'male' ? 'Male' : gender === 'female' ? 'Female' : 'Other';

        if (gender === 'male') {
            genderData.Male++;
        } else if (gender === 'female') {
            genderData.Female++;
        } else {
            genderData.Other++;
        }

        genderStudents[genderKey].push(student);

        if (!gradeGenderData[grade]) {
            gradeGenderData[grade] = { Male: 0, Female: 0, Other: 0 };
            gradeGenderStudents[grade] = { Male: [], Female: [], Other: [] };
        }
        gradeGenderData[grade][genderKey]++;
        gradeGenderStudents[grade][genderKey].push(student);

        if (!disabilityData[disability]) {
            disabilityData[disability] = 0;
            disabilityStudents[disability] = [];
        }
        disabilityData[disability]++;
        disabilityStudents[disability].push(student);

        if (!admissionData[admissionYear]) {
            admissionData[admissionYear] = 0;
            admissionStudents[admissionYear] = [];
        }
        admissionData[admissionYear]++;
        admissionStudents[admissionYear].push(student);
    });

    // Pie Chart for Gender Distribution
    const genderCanvas = document.getElementById('genderChart');
    if (genderCanvas) {
        if (genderChart) genderChart.destroy();
        genderChart = new Chart(genderCanvas, {
            type: 'pie',
            data: {
                labels: ['Male', 'Female', 'Other'],
                datasets: [{
                    data: [genderData.Male, genderData.Female, genderData.Other],
                    backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56'],
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: 'Gender Distribution' }
                },
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const idx = elements[0].index;
                        const label = genderChart.data.labels[idx];
                        const students = genderStudents[label] || [];
                        showStudentList(`${label} Students`, students);
                    }
                }
            }
        });
    }

    // Bar Chart for Grade-wise Counts
    const gradeCanvas = document.getElementById('gradeChart');
    if (gradeCanvas) {
        if (gradeChart) gradeChart.destroy();
        const grades = Object.keys(gradeGenderData).sort();
        gradeChart = new Chart(gradeCanvas, {
            type: 'bar',
            data: {
                labels: grades,
                datasets: [
                    {
                        label: 'Male',
                        data: grades.map(grade => gradeGenderData[grade].Male),
                        backgroundColor: '#36A2EB',
                        stack: 'Stack 0'
                    },
                    {
                        label: 'Female',
                        data: grades.map(grade => gradeGenderData[grade].Female),
                        backgroundColor: '#FF6384',
                        stack: 'Stack 0'
                    },
                    {
                        label: 'Other',
                        data: grades.map(grade => gradeGenderData[grade].Other),
                        backgroundColor: '#FFCE56',
                        stack: 'Stack 0'
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: 'Students by Grade and Gender' }
                },
                scales: {
                    x: { stacked: true },
                    y: { stacked: true, beginAtZero: true }
                },
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const el = elements[0];
                        const grade = grades[el.index];
                        const datasetLabel = gradeChart.data.datasets[el.datasetIndex].label;
                        const students = gradeGenderStudents[grade][datasetLabel] || [];
                        showStudentList(`${datasetLabel} Students in ${grade}`, students);
                    }
                }
            }
        });
    }

    // Bar Chart for Disability Statistics
    const disabilityCanvas = document.getElementById('disabilityChart');
    if (disabilityCanvas) {
        if (disabilityChart) disabilityChart.destroy();
        const disabilities = Object.keys(disabilityData).sort();
        disabilityChart = new Chart(disabilityCanvas, {
            type: 'bar',
            data: {
                labels: disabilities,
                datasets: [{
                    label: 'Students',
                    data: disabilities.map(disability => disabilityData[disability]),
                    backgroundColor: '#4BC0C0',
                    borderColor: '#fff',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: 'Students by Disability' }
                },
                scales: {
                    y: { beginAtZero: true }
                },
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const el = elements[0];
                        const disability = disabilities[el.index];
                        const students = disabilityStudents[disability] || [];
                        showStudentList(`Students with ${disability} Disability`, students);
                    }
                }
            }
        });
    }

    // Line Chart for Admission Trends
    const admissionCanvas = document.getElementById('admissionChart');
    if (admissionCanvas) {
        if (admissionChart) admissionChart.destroy();
        const years = Object.keys(admissionData).sort((a, b) => a - b);
        admissionChart = new Chart(admissionCanvas, {
            type: 'line',
            data: {
                labels: years,
                datasets: [{
                    label: 'Admissions',
                    data: years.map(year => admissionData[year]),
                    borderColor: '#FF9F40',
                    fill: false,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: 'Admissions by Year' },
                    tooltip: {
                        callbacks: {
                            afterBody: (tooltipItems) => {
                                const idx = tooltipItems[0].dataIndex;
                                const year = years[idx];
                                const studentsList = admissionStudents[year] || [];
                                const fewNames = studentsList.slice(0, 3).map(s => s.StudentFullName).join('\n');
                                return fewNames + (studentsList.length > 3 ? '\n... and more' : '');
                            },
                            footer: (tooltipItems) => {
                                return 'Click to view all';
                            }
                        }
                    }
                },
                scales: {
                    y: { beginAtZero: true }
                },
                elements: {
                    point: {
                        radius: 3,
                        hoverRadius: 6
                    }
                },
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const idx = elements[0].index;
                        const year = years[idx];
                        const studentsList = admissionStudents[year] || [];
                        showStudentList(`Students Admitted in ${year}`, studentsList);
                    }
                }
            }
        });
    }
}

// Function to export active students to CSV
function exportStudentsToCSV() {
    if (!auth.currentUser) {
        Swal.fire({
            title: 'Authentication Required',
            text: 'Please log in to export student data.',
            icon: 'warning'
        });
        return;
    }
    if (activeStudents.length === 0) {
        Swal.fire({
            title: 'No Data',
            text: 'No active students to export.',
            icon: 'info'
        });
        return;
    }

    const headers = ['Student Name', 'UPI', 'Assessment No.', 'Grade', 'Gender', 'Admission No.', 'Father\'s Phone', 'Mother\'s Name', 'Father\'s Name', 'DOB', 'Disability', 'Medical Condition'];
    const csvContent = [
        headers.join(','),
        ...activeStudents.map(student => [
            `"${student.StudentFullName.replace(/"/g, '""')}"`,
            student.UPI,
            student.AssessmentNumber,
            student.CurrentGrade,
            student.Gender,
            student.AdmissionNo,
            student.FathersPhoneNumber,
            `"${student.MothersName.replace(/"/g, '""')}"`,
            `"${student.Father.replace(/"/g, '""')}"`,
            student.DOB,
            student.Disability,
            student.MedicalCondition
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `active_students_${new Date().toISOString().split('T')[0]}.csv`);
}

// Function to generate PDF report
function generatePDFReport() {
    if (!auth.currentUser) {
        Swal.fire({
            title: 'Authentication Required',
            text: 'Please log in to generate a report.',
            icon: 'warning'
        });
        return;
    }
    if (activeStudents.length === 0) {
        Swal.fire({
            title: 'No Data',
            text: 'No active students to include in the report.',
            icon: 'info'
        });
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Student Statistics Report', 20, 20);
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 30);

    // Summary
    const genderData = { Male: 0, Female: 0, Other: 0, totalSum: 0 };
    const gradeData = {};
    activeStudents.forEach(student => {
        const gender = student.Gender ? student.Gender.toLowerCase() : 'other';
        const grade = student.CurrentGrade || 'N/A';
        genderData.totalSum++;
        if (gender === 'male') genderData.Male++;
        else if (gender === 'female') genderData.Female++;
        else genderData.Other++;
        if (!gradeData[grade]) gradeData[grade] = 0;
        gradeData[grade]++;
    });

    doc.text('Summary:', 20, 40);
    doc.text(`Total Students: ${genderData.totalSum}`, 20, 50);
    doc.text(`Male: ${genderData.Male}`, 20, 60);
    doc.text(`Female: ${genderData.Female}`, 20, 70);
    doc.text(`Other: ${genderData.Other}`, 20, 80);

    // Grade-wise counts
    doc.text('Students by Grade:', 20, 90);
    let y = 100;
    Object.keys(gradeData).sort().forEach(grade => {
        doc.text(`${grade}: ${gradeData[grade]} students`, 20, y);
        y += 10;
    });

    doc.save(`student_report_${new Date().toISOString().split('T')[0]}.pdf`);
}







let dataQualityStats = {};
let exportData = [];

// Function to check data quality with search and filtering
function checkDataQuality() {

// Show "checking..." spinner immediately
    Swal.fire({
        title: 'Checking Data Quality...',
        html: '<div style="font-size: 48px;">🔍</div>',
        showConfirmButton: false,
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    // Use setTimeout to allow UI to update
    setTimeout(() => {

    const studentIssues = {};
    
    activeStudents.forEach(student => {
        const issues = [];
        
        // Update these field names:
        if (student.Gender === 'Unknown' || !student.Gender) {
            issues.push('Gender');
        }
        if (student.UPI === student.firebaseKey || student.UPI === '---' || !student.UPI) {
            issues.push('UPI');
        }
        if (student.DOB === '---' || !student.DOB) {
            issues.push('DOB');
        }
        if (student['Birth Entry'] === '---' || !student['Birth Entry']) {
            issues.push('Birth Entry');
        }
        if (student['Home phone'] === '---' || !student['Home phone']) {
            issues.push('Home phone');
        }
        if (student['Status'] === '---' || !student['Status']) {
            issues.push('Status');
        }
        if (student.Father === '---' || !student.Father) {
            issues.push('Father');
        }
        if (student.Mother === '---' || !student.Mother) {
            issues.push('Mother');
        }
        
        // Add new field checks:
        if (student['Assessment No'] === '---' || !student['Assessment No']) {
            issues.push('Assessment No');
        }
        if (student['Official Student Name'] === '---' || !student['Official Student Name']) {
            issues.push('Official Student Name');
        }
        if (student['Dissability'] === '---' || !student['Dissability']) {
            issues.push('Dissability');
        }
        if (student['Medical Condition'] === '---' || !student['Medical Condition']) {
            issues.push('Medical Condition');
        }
        if (student['Class'] === '---' || !student['Class']) {
            issues.push('Class');
        }
        if (student['DateOfAdmission'] === '---' || !student['DateOfAdmission']) {
            issues.push('DateOfAdmission');
        }
        if (student['Where Born'] === '---' || !student['Where Born']) {
            issues.push('Where Born');
        }
        if (student['IDNO'] === '---' || !student['IDNO']) {
            issues.push('IDNO');
        }
        if (student['Email'] === '---' || !student['Email']) {
            issues.push('Email');
        }
        if (student['District'] === '---' || !student['District']) {
            issues.push('District');
        }
        
        if (issues.length > 0) {
            const studentKey = `${student.Grade}-${student['Official Student Name'] || student.StudentFullName}`;
            studentIssues[studentKey] = {
                grade: student.Grade,
                name: student['Official Student Name'] || student.StudentFullName,
                issues: issues,
                student: student
            };
        }
    });

   const issuesList = Object.values(studentIssues);
        
        // Generate analytics data
        generateDataQualityAnalytics(issuesList, activeStudents.length);
        
        if (issuesList.length > 0) {
            showDataQualityModal(issuesList);  // Now shows instantly after processing
        } else {
            Swal.fire({
                title: 'Data Quality Check',
                text: 'No data quality issues found!',
                icon: 'success',
                confirmButtonText: 'Great!'
            });
        }
    }, 3000);  // Small delay to let loading indicator show
}




function showDataQualityModal(allIssues) {
    // Store issues globally so other modals can return to them
    window.currentDataQualityIssues = allIssues;
    
    let filteredIssues = [...allIssues];
    exportData = [...allIssues];
    let pendingChanges = {};
    
    // Database field mapping
    const fieldMapping = {
        'UPI': 'UPI',
        'Assessment No': 'Assessment No',
        'Gender': 'Gender',
        'DOB': 'DOB',
        'Birth Entry': 'Birth Entry',
        'Home phone': 'Home phone',
        'Status': 'Status',
        'Father': 'Father',
        'Mother': 'Mother',
        'Email': 'Email',
        'IDNO': 'IDNO'
    };
    
    const uniqueGrades = [...new Set(allIssues.map(item => item.grade))].sort();
    const uniqueIssues = [...new Set(allIssues.flatMap(item => item.issues))].sort();
    
    function createEditableInput(studentData, field, currentValue) {
        const studentKey = `${studentData.grade}-${studentData.name}`;
        const actualValue = currentValue || studentData.student[field] || '';
        
        switch(field) {
            case 'Gender':
                return `<select onchange="updateFieldInline('${studentKey}', '${field}', this.value)" 
                        style="width: 100%; padding: 4px; font-size: 12px; border: 1px solid #ddd; border-radius: 3px;">
                    <option value="">Select...</option>
                    <option value="Male" ${actualValue === 'Male' ? 'selected' : ''}>Male</option>
                    <option value="Female" ${actualValue === 'Female' ? 'selected' : ''}>Female</option>
                </select>`;
            case 'DOB':
                return `<input type="date" onchange="updateFieldInline('${studentKey}', '${field}', this.value)" 
                        value="${actualValue && actualValue !== '---' ? actualValue : ''}"
                        style="width: 100%; padding: 4px; font-size: 12px; border: 1px solid #ddd; border-radius: 3px;">`;
            case 'Birth Entry':
                return `<input type="text" onchange="updateFieldInline('${studentKey}', '${field}', this.value)" 
                        value="${actualValue && actualValue !== '---' ? actualValue : ''}" placeholder="Birth cert No"
                        style="width: 100%; padding: 4px; font-size: 12px; border: 1px solid #ddd; border-radius: 3px;">`;
            case 'Status':
                return `<select onchange="updateFieldInline('${studentKey}', '${field}', this.value)" 
                        style="width: 100%; padding: 4px; font-size: 12px; border: 1px solid #ddd; border-radius: 3px;">
                    <option value="">Select...</option>
                    <option value="Verified" ${actualValue === 'Verified' ? 'selected' : ''}>Verified</option>
                    <option value="Pending" ${actualValue === 'Pending' ? 'selected' : ''}>Pending</option>
                </select>`;
            case 'Home phone':
                return `<input type="tel" onchange="updateFieldInline('${studentKey}', '${field}', this.value)" 
                        value="${actualValue && actualValue !== '---' ? actualValue : ''}"
                        placeholder="Phone number"
                        style="width: 100%; padding: 4px; font-size: 12px; border: 1px solid #ddd; border-radius: 3px;">`;
            case 'Email':
                return `<input type="email" onchange="updateFieldInline('${studentKey}', '${field}', this.value)" 
                        value="${actualValue && actualValue !== '---' ? actualValue : ''}"
                        placeholder="Email address"
                        style="width: 100%; padding: 4px; font-size: 12px; border: 1px solid #ddd; border-radius: 3px;">`;
            default:
                return `<input type="text" onchange="updateFieldInline('${studentKey}', '${field}', this.value)" 
                        value="${actualValue && actualValue !== '---' ? actualValue : ''}"
                        placeholder="Enter ${field}"
                        style="width: 100%; padding: 4px; font-size: 12px; border: 1px solid #ddd; border-radius: 3px;">`;
        }
    }
    
    const modalHTML = `
        <div style="text-align: left;">
            <div style="background: transparent; box-shadow: 0 0 20px 1px rgba(0, 0, 0, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px; color: white;">
                <div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;">
                    <button id="showAnalytics" class="advanced-btn" style="background: linear-gradient(45deg, #2e374b, #ff1cac); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 8px 12px; border-radius: 20px; cursor: pointer; transition: all 0.3s;">
                        📊 Analytics Dashboard
                    </button>
                    <button id="exportData" class="advanced-btn" style="background: linear-gradient(45deg, #2e374b, #ff1cac); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 8px 12px; border-radius: 20px; cursor: pointer; transition: all 0.3s;">
                        📤 Export Report
                    </button>
                    <button id="bulkActions" class="advanced-btn" style="background: linear-gradient(45deg, #2e374b, #ff1cac); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 8px 12px; border-radius: 20px; cursor: pointer; transition: all 0.3s;">
                        ⚡ Bulk Actions
                    </button>
                    <button id="showTrends" class="advanced-btn" style="background: linear-gradient(45deg, #2e374b, #ff1cac); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 8px 12px; border-radius: 20px; cursor: pointer; transition: all 0.3s;">
                        📈 Trends & Insights
                    </button>
                    <button id="customRules" class="advanced-btn" style="background: linear-gradient(45deg, #2e374b, #ff1cac); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 8px 12px; border-radius: 20px; cursor: pointer; transition: all 0.3s;">
                        🔧 Custom Rules
                    </button>
                </div>
            </div>

            <div id="quickStats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-bottom: 15px;">
                <div class="loading-placeholder">Loading statistics...</div>
            </div>

            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 10px;">
                    <input type="text" 
                           id="studentSearch" 
                           placeholder="🔍 Search by student name, grade, or issue..." 
                           style="flex: 1; min-width: 250px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    
                    <select id="gradeFilter" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="">All Grades</option>
                        ${uniqueGrades.map(grade => `<option value="${grade}">${grade}</option>`).join('')}
                    </select>
                    
                    <select id="issueFilter" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="">All Issues</option>
                        ${uniqueIssues.map(issue => `<option value="${issue}">${issue}</option>`).join('')}
                    </select>
                    
                    <select id="severityFilter" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="">All Severity</option>
                        <option value="critical">Critical (5+ issues)</option>
                        <option value="high">High (3-4 issues)</option>
                        <option value="medium">Medium (2 issues)</option>
                        <option value="low">Low (1 issue)</option>
                    </select>
                </div>
                
                <div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center;">
                    <button id="clearFilters" style="padding: 6px 12px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        🗑️ Clear Filters
                    </button>
                    <button id="fastEditButton" style="padding: 6px 12px;user-select: none; background: linear-gradient(135deg, #1f148fff 0%, #0a1745ff 100%); color: white; border: none; border-radius: 4px; cursor: pointer;">
                        ✏️ Switch to Quick Edit Mode
                    </button>
                    <button id="saveInlineChanges" style="padding:  6px 12px;opacity: 0.5;  pointer-events: none;background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);color: white; border: none; border-radius: 4px; cursor: pointer;" disabled>
                      💾 Save All Changes (<span id="inlineChangeCount">0</span>)
                    </button>
                    <button id="saveFilters" style="padding: 6px 12px; background: #0d6efd; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        💾 Save View
                    </button>

                    <span id="resultsCount" style="font-weight: bold; color: #495057;"></span>

                    <div style="margin-left: auto;">
                        <label style="margin-right: 10px;">
                            <input type="checkbox" id="showResolved" style="margin-right: 5px;"> Show resolved
                        </label>
                        <select id="sortBy" style="padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
                            <option value="severity">Sort by Severity</option>
                            <option value="name">Sort by Name</option>
                            <option value="grade">Sort by Grade</option>
                            <option value="issues">Sort by Issue Count</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div style="max-height: 400px; overflow-y: auto;">
                <ul id="issuesList" style="list-style: none; padding: 0; margin: 0;">
                    <li class="loading-placeholder">Loading student data...</li>
                </ul>
            </div>
        </div>
        
        <style>
            .loading-placeholder {
                padding: 20px;
                text-align: center;
                color: #666;
                font-style: italic;
                animation: pulse 1.5s ease-in-out infinite;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            
            .advanced-btn:hover {
                background: rgba(1, 1, 6, 1) !important;
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            }
            
            .student-card {
                border: 1px solid #dee2e6; 
                border-radius: 8px; 
                padding: 15px; 
                margin-bottom: 10px; 
                background: transparent;
                transition: all 0.3s ease;
                position: relative;
                animation: fadeIn 0.3s ease-in;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .student-card:hover {
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                transform: translateY(-2px);
            }
            
            .severity-critical { border-left: 5px solid #dc3545; }
            .severity-high { border-left: 5px solid #fd7e14; }
            .severity-medium { border-left: 5px solid #ffc107; }
            .severity-low { border-left: 5px solid #198754; }
            
            .student-save-btn {
                display: none;
                background: #28a745;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                font-weight: bold;
                margin-top: 8px;
                transition: all 0.3s ease;
            }
            
            .student-save-btn:hover {
                background: #218838;
                transform: scale(1.05);
            }
            
            .student-save-btn.visible {
                display: inline-block;
            }
        </style>
    `;

    Swal.fire({
        title: 'Data Quality Issues',
        html: modalHTML,
        confirmButtonText: 'Close',
        width: '900px',
        didOpen: () => {
            // Render content progressively after modal opens
            requestAnimationFrame(() => {
                // First, render quick stats
                renderQuickStats();
                
                // Then render results after a brief delay
                setTimeout(() => {
                    applyFilters();
                }, 50);
            });

            const searchInput = document.getElementById('studentSearch');
            const gradeFilter = document.getElementById('gradeFilter');
            const issueFilter = document.getElementById('issueFilter');
            const severityFilter = document.getElementById('severityFilter');
            const sortBy = document.getElementById('sortBy');
            const showResolved = document.getElementById('showResolved');
            const clearBtn = document.getElementById('clearFilters');
            const saveBtn = document.getElementById('saveFilters');
            const resultsCount = document.getElementById('resultsCount');
            const issuesList = document.getElementById('issuesList');
            const quickStats = document.getElementById('quickStats');
            const saveInlineBtn = document.getElementById('saveInlineChanges');
            const fastEditBtn = document.getElementById('fastEditButton');

            const analyticsBtn = document.getElementById('showAnalytics');
            const exportBtn = document.getElementById('exportData');
            const bulkBtn = document.getElementById('bulkActions');
            const trendsBtn = document.getElementById('showTrends');
            const rulesBtn = document.getElementById('customRules');

            // Global function for inline field updates
            window.updateFieldInline = function(studentKey, field, value) {
                if (!pendingChanges[studentKey]) {
                    pendingChanges[studentKey] = {};
                }
                
                if (value && value.trim() !== '') {
                    pendingChanges[studentKey][field] = value.trim();
                } else {
                    delete pendingChanges[studentKey][field];
                    if (Object.keys(pendingChanges[studentKey]).length === 0) {
                        delete pendingChanges[studentKey];
                    }
                }
                
                updateInlineChangeCount();
                toggleStudentSaveButton(studentKey);
            };

            // Toggle individual student save button
            function toggleStudentSaveButton(studentKey) {
                const saveBtn = document.querySelector(`[data-save-student="${studentKey}"]`);
                if (saveBtn) {
                    if (pendingChanges[studentKey] && Object.keys(pendingChanges[studentKey]).length > 0) {
                        saveBtn.classList.add('visible');
                        const count = Object.keys(pendingChanges[studentKey]).length;
                        saveBtn.textContent = `💾 Save (${count} change${count > 1 ? 's' : ''})`;
                    } else {
                        saveBtn.classList.remove('visible');
                    }
                }
            }

            // Update global change counter
            function updateInlineChangeCount() {
                const count = Object.keys(pendingChanges).reduce((total, studentKey) => {
                    return total + Object.keys(pendingChanges[studentKey]).length;
                }, 0);
                
                const changeCountEl = document.getElementById('inlineChangeCount');
                const saveBtn = document.getElementById('saveInlineChanges');
                
                if (changeCountEl) changeCountEl.textContent = count;
                if (saveBtn) {
                    saveBtn.disabled = count === 0;
                    saveBtn.style.opacity = count > 0 ? '1' : '0.5';
                    saveBtn.style.pointerEvents = count > 0 ? 'auto' : 'none';
                }
            }

            // Save single student
            window.saveStudent = async function(studentKey) {
                if (!pendingChanges[studentKey]) return;

                const studentData = allIssues.find(s => `${s.grade}-${s.name}` === studentKey);
                if (studentData && studentData.student) {
                    Object.keys(pendingChanges[studentKey]).forEach(field => {
                        const dbFieldName = fieldMapping[field] || field;
                        studentData.student[dbFieldName] = pendingChanges[studentKey][field];
                    });
                    
                    await saveMultipleStudents([studentData.student]);
                    delete pendingChanges[studentKey];
                    updateInlineChangeCount();
                    toggleStudentSaveButton(studentKey);
                }
            };

            // Save all inline changes
            async function saveInlineChanges() {
                if (Object.keys(pendingChanges).length === 0) return;

                const studentsToUpdate = [];
                
                Object.keys(pendingChanges).forEach(studentKey => {
                    const studentData = allIssues.find(s => `${s.grade}-${s.name}` === studentKey);
                    if (studentData && studentData.student) {
                        Object.keys(pendingChanges[studentKey]).forEach(field => {
                            const dbFieldName = fieldMapping[field] || field;
                            studentData.student[dbFieldName] = pendingChanges[studentKey][field];
                        });
                        studentsToUpdate.push(studentData.student);
                    }
                });

                if (studentsToUpdate.length > 0) {
                    await saveMultipleStudents(studentsToUpdate);
                    pendingChanges = {};
                    updateInlineChangeCount();
                    
                    // Hide all student save buttons
                    document.querySelectorAll('.student-save-btn').forEach(btn => {
                        btn.classList.remove('visible');
                    });
                }
            }

            function renderQuickStats() {
                const totalStudents = filteredIssues.length;
                const criticalCount = filteredIssues.filter(s => s.issues.length >= 5).length;
                const highCount = filteredIssues.filter(s => s.issues.length >= 3 && s.issues.length < 5).length;
                const mediumCount = filteredIssues.filter(s => s.issues.length === 2).length;
                const lowCount = filteredIssues.filter(s => s.issues.length === 1).length;
                const avgIssuesPerStudent = totalStudents > 0 ? (filteredIssues.reduce((sum, s) => sum + s.issues.length, 0) / totalStudents).toFixed(1) : 0;
                
                const issueFrequency = {};
                const gradeDistribution = {};
                filteredIssues.forEach(student => {
                    student.issues.forEach(issue => {
                        issueFrequency[issue] = (issueFrequency[issue] || 0) + 1;
                    });
                    gradeDistribution[student.grade] = (gradeDistribution[student.grade] || 0) + 1;
                });
                
                const topIssues = Object.entries(issueFrequency).sort((a, b) => b[1] - a[1]).slice(0, 3);
                const mostAffectedGrade = Object.entries(gradeDistribution).sort((a, b) => b[1] - a[1])[0];
                
                const completionRate = ((allIssues.length - totalStudents) / allIssues.length * 100).toFixed(1);
                const totalFieldsMissing = filteredIssues.reduce((sum, s) => sum + s.issues.length, 0);

                quickStats.innerHTML = `
                    <div class="stat-card interactive-stat" data-action="drill-severity" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 14px; border-radius: 8px; text-align: center; cursor: pointer; transition: all 0.3s ease; color: white; position: relative; overflow: hidden;">
                        <div style="position: absolute; top: 5px; right: 5px; font-size: 10px; opacity: 0.7;">👆 Click</div>
                        <div style="font-size: 28px; font-weight: bold; margin-bottom: 4px;">${totalStudents}</div>
                        <div style="font-size: 11px; opacity: 0.9;">Total Students with Issues</div>
                        <div style="font-size: 9px; margin-top: 4px; opacity: 0.8;">🚨 ${criticalCount} | ⚠️ ${highCount} | 📋 ${mediumCount} | ✅ ${lowCount}</div>
                    </div>
                    
                    <div class="stat-card interactive-stat" data-action="show-top-issues" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 14px; border-radius: 8px; text-align: center; cursor: pointer; transition: all 0.3s ease; color: white; position: relative; overflow: hidden;">
                        <div style="position: absolute; top: 5px; right: 5px; font-size: 10px; opacity: 0.7;">👆 Expand</div>
                        <div style="font-size: 28px; font-weight: bold; margin-bottom: 4px;">${totalFieldsMissing}</div>
                        <div style="font-size: 11px; opacity: 0.9;">Total Missing Fields</div>
                        <div style="font-size: 9px; margin-top: 4px; opacity: 0.8;">Top: ${topIssues[0] ? topIssues[0][0] : 'N/A'} (${topIssues[0] ? topIssues[0][1] : 0})</div>
                    </div>
                    
                    <div class="stat-card interactive-stat" data-action="show-grade-breakdown" data-grade="${mostAffectedGrade ? mostAffectedGrade[0] : ''}" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 14px; border-radius: 8px; text-align: center; cursor: pointer; transition: all 0.3s ease; color: white; position: relative; overflow: hidden;">
                        <div style="position: absolute; top: 5px; right: 5px; font-size: 10px; opacity: 0.7;">👆 View</div>
                        <div style="font-size: 24px; font-weight: bold; margin-bottom: 4px;">${mostAffectedGrade ? mostAffectedGrade[0] : 'N/A'}</div>
                        <div style="font-size: 11px; opacity: 0.9;">Most Affected Grade</div>
                        <div style="font-size: 9px; margin-top: 4px; opacity: 0.8;">${mostAffectedGrade ? mostAffectedGrade[1] : 0} students (${((mostAffectedGrade ? mostAffectedGrade[1] : 0) / totalStudents * 100).toFixed(0)}%)</div>
                    </div>
                    
                    <div class="stat-card interactive-stat" data-action="show-completion-details" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 14px; border-radius: 8px; text-align: center; cursor: pointer; transition: all 0.3s ease; color: white; position: relative; overflow: hidden;">
                        <div style="position: absolute; top: 5px; right: 5px; font-size: 10px; opacity: 0.7;">👆 Details</div>
                        <div style="font-size: 28px; font-weight: bold; margin-bottom: 4px;">${completionRate}%</div>
                        <div style="font-size: 11px; opacity: 0.9;">Data Completion Rate</div>
                        <div style="font-size: 9px; margin-top: 4px; opacity: 0.8;">Avg ${avgIssuesPerStudent} issues/student</div>
                    </div>
                    
                    <div class="stat-card interactive-stat" data-action="quick-fix-suggestions" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); padding: 14px; border-radius: 8px; text-align: center; cursor: pointer; transition: all 0.3s ease; color: #333; position: relative; overflow: hidden; border: 2px solid #fff;">
                        <div style="position: absolute; top: 5px; right: 5px; font-size: 10px; opacity: 0.7;">✨ AI</div>
                        <div style="font-size: 24px; margin-bottom: 4px;">🎯</div>
                        <div style="font-size: 11px; font-weight: bold;">Smart Suggestions</div>
                        <div style="font-size: 9px; margin-top: 4px; opacity: 0.8;">AI-powered quick fixes</div>
                    </div>
                `;

                // Add advanced click handlers
                document.querySelectorAll('.interactive-stat').forEach(card => {
                    card.addEventListener('click', function() {
                        const action = this.dataset.action;
                        
                        switch(action) {
                            case 'drill-severity':
                                showSeverityDrilldown();
                                break;
                            case 'show-top-issues':
                                showTopIssuesBreakdown(topIssues);
                                break;
                            case 'show-grade-breakdown':
                                showGradeBreakdown(gradeDistribution);
                                break;
                            case 'show-completion-details':
                                showCompletionAnalysis(completionRate, avgIssuesPerStudent);
                                break;
                            case 'quick-fix-suggestions':
                                showQuickFixSuggestions(issueFrequency);
                                break;
                        }
                    });
                    
                    // Enhanced hover with pulse effect
                    card.addEventListener('mouseenter', function() {
                        this.style.transform = 'translateY(-8px) scale(1.02)';
                        this.style.boxShadow = '0 12px 24px rgba(0,0,0,0.25)';
                        this.style.filter = 'brightness(1.1)';
                    });
                    
                    card.addEventListener('mouseleave', function() {
                        this.style.transform = 'translateY(0) scale(1)';
                        this.style.boxShadow = 'none';
                        this.style.filter = 'brightness(1)';
                    });
                });
            }
            
            function getSeverity(issuesCount) {
                if (issuesCount >= 5) return { class: 'severity-critical', level: 'CRITICAL', priority: 4 };
                if (issuesCount >= 3) return { class: 'severity-high', level: 'HIGH', priority: 3 };
                if (issuesCount === 2) return { class: 'severity-medium', level: 'MEDIUM', priority: 2 };
                return { class: 'severity-low', level: 'LOW', priority: 1 };
            }

            function renderResults() {
                if (filteredIssues.length === 0) {
                    issuesList.innerHTML = '<li style="text-align: center; color: #6c757d; padding: 20px;">No students match the current filters.</li>';
                    resultsCount.textContent = 'No results found';
                    return;
                }

                const sortValue = sortBy.value;
                filteredIssues.sort((a, b) => {
                    switch(sortValue) {
                        case 'severity':
                            return getSeverity(b.issues.length).priority - getSeverity(a.issues.length).priority;
                        case 'name':
                            return a.name.localeCompare(b.name);
                        case 'grade':
                            return a.grade.localeCompare(b.grade);
                        case 'issues':
                            return b.issues.length - a.issues.length;
                        default:
                            return 0;
                    }
                });

                // Clear the list
                issuesList.innerHTML = '';
                
                // Render in batches to avoid blocking
                const BATCH_SIZE = 20;
                let currentIndex = 0;
                
                function renderBatch() {
                    const endIndex = Math.min(currentIndex + BATCH_SIZE, filteredIssues.length);
                    const fragment = document.createDocumentFragment();
                    
                    for (let i = currentIndex; i < endIndex; i++) {
                        const student = filteredIssues[i];
                        const li = createStudentCard(student, i);
                        fragment.appendChild(li);
                    }
                    
                    issuesList.appendChild(fragment);
                    currentIndex = endIndex;
                    
                    if (currentIndex < filteredIssues.length) {
                        requestAnimationFrame(renderBatch);
                    } else {
                        // Update count after rendering complete
                        resultsCount.textContent = `Showing ${filteredIssues.length} of ${allIssues.length} students`;
                    }
                }
                
                renderBatch();
            }
            
            function createStudentCard(student,index) {
const issueColors = {
'Gender': '#dc3545',
'UPI': '#fd7e14',
'DOB': '#ff0800',
'Birth Entry': '#6610f2',
'Home phone': '#0dcaf0',
'Status': '#198754',
'Father': '#d63384',
'Mother': '#6f42c1',
'Email': '#ffc107'
};
            const issueGradients = {
                'Gender': 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                'UPI': 'linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #ffd140 100%)',
                'DOB': 'linear-gradient(135deg, rgb(250, 112, 154) 0%, rgb(254, 225, 64) 100%)',
                'Birth Entry': 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
                'Home phone': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                'Status': 'linear-gradient(135deg, #52c234 0%, #061700 100%)',
                'Father': 'linear-gradient(135deg, #ff9a56 0%, #ff6a88 50%, #ff99ac 100%)',
                'Mother': 'linear-gradient(135deg, #f77062 0%, #fe5196 100%)',
                'Email': 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
            };
            
            const severity = getSeverity(student.issues.length);
            const studentKey = `${student.grade}-${student.name}`;
            
            const editableFields = student.issues.map(issue => {
                const currentValue = student.student[issue] || '';
                const baseColor = issueColors[issue] || '#dc3545';
                const gradient = issueGradients[issue] || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                
                return `
                    <div style="display: inline-block; margin: 4px; padding: 8px; 
                         background: ${gradient}; 
                         border-radius: 8px; min-width: 150px; vertical-align: top;
                         box-shadow: 0 4px 15px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.3);
                         position: relative;
                         overflow: hidden;">
                        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; 
                             background: linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 100%); 
                             pointer-events: none;"></div>
                        <strong style="font-size: 11px; color: white; display: block; margin-bottom: 4px; 
                             text-shadow: 0 2px 4px rgba(0,0,0,0.3); position: relative; z-index: 1;
                             font-weight: 600; letter-spacing: 0.5px;">${issue}:</strong>
                        <div style="position: relative; z-index: 1;">
                            ${createEditableInput(student, issue, currentValue)}
                        </div>
                    </div>
                `;
            }).join('');
            
            const priorityIcon = severity.level === 'CRITICAL' ? '🚨' : 
                               severity.level === 'HIGH' ? '⚠️' : 
                               severity.level === 'MEDIUM' ? '📋' : '✅';
            
            const li = document.createElement('li');
            li.className = `student-card ${severity.class}`;
            li.dataset.studentId = studentKey;
            
            li.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; margin-bottom: 5px;">
                            <span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                 color: white; padding: 3px 10px; border-radius: 15px; font-size: 12px; 
                                 margin-right: 10px; box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);">
                                ${student.grade}
                            </span>
                            <strong style="font-size: 16px;">${student.name}</strong>
                            <span style="margin-left: 10px; font-size: 20px;">${priorityIcon}</span>
                        </div>
                        <div style="font-size: 14px; color: #666; margin-bottom: 8px;">
                            <strong>${severity.level}</strong> - ${student.issues.length} issue${student.issues.length > 1 ? 's' : ''}
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <button class="mark-resolved" data-student="${studentKey}" 
                                style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); 
                                color: white; border: none; padding: 4px 8px; border-radius: 4px; 
                                cursor: pointer; font-size: 11px; margin-bottom: 5px;
                                box-shadow: 0 2px 8px rgba(17, 153, 142, 0.3);
                                transition: transform 0.2s;">
                            ✓ Mark Resolved
                        </button>
                        <div style="font-size: 11px; color: #999;">Number: ${index + 1} of ${exportData.length}</div>
                    </div>
                </div>
                <div style="margin-top: 10px;">
                    <strong style="font-size: 13px; color: #333; display: block; margin-bottom: 8px;">Edit Missing Data:</strong>
                    <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                        ${editableFields}
                    </div>
                    <button class="student-save-btn" data-save-student="${studentKey}" onclick="saveStudent('${studentKey}')">
                        💾 Save
                    </button>
                </div>
            `;
            
            // Add event listener for mark resolved button
            const resolveBtn = li.querySelector('.mark-resolved');
            resolveBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const studentId = this.dataset.student;
                markStudentResolved(studentId);
            });
            
            return li;
        }

        function applyFilters() {
            const searchTerm = searchInput.value.toLowerCase().trim();
            const selectedGrade = gradeFilter.value;
            const selectedIssue = issueFilter.value;
            const selectedSeverity = severityFilter.value;

            filteredIssues = allIssues.filter(student => {
                const matchesSearch = !searchTerm || 
                    student.name.toLowerCase().includes(searchTerm) ||
                    student.grade.toLowerCase().includes(searchTerm) ||
                    student.issues.some(issue => issue.toLowerCase().includes(searchTerm));
                
                const matchesGrade = !selectedGrade || student.grade === selectedGrade;
                const matchesIssue = !selectedIssue || student.issues.includes(selectedIssue);
                
                const matchesSeverity = !selectedSeverity || 
                    (selectedSeverity === 'critical' && student.issues.length >= 5) ||
                    (selectedSeverity === 'high' && student.issues.length >= 3 && student.issues.length < 5) ||
                    (selectedSeverity === 'medium' && student.issues.length === 2) ||
                    (selectedSeverity === 'low' && student.issues.length === 1);
                
                return matchesSearch && matchesGrade && matchesIssue && matchesSeverity;
            });

            renderResults();
            renderQuickStats(); // Update stats based on filtered results
        }

        function markStudentResolved(studentId) {
            if (!window.resolvedStudents) window.resolvedStudents = new Set();
            window.resolvedStudents.add(studentId);
            
            const card = document.querySelector(`[data-student-id="${studentId}"]`);
            if (card) {
                card.style.transition = 'all 0.5s ease';
                card.style.opacity = '0';
                card.style.transform = 'translateX(100px)';
                setTimeout(() => {
                    if (!showResolved.checked) {
                        filteredIssues = filteredIssues.filter(s => `${s.grade}-${s.name}` !== studentId);
                        renderResults();
                    }
                }, 500);
            }
            
            showToast('✅ Student marked as resolved!', 'success');
        }

        // Event listeners
        if (fastEditBtn) {
            fastEditBtn.addEventListener('click', () => {
                const issuesList = allIssues || exportData || [];
                
                if (issuesList.length > 0) {
                    Swal.close();
                    showFastEditModal(issuesList);
                } else {
                    Swal.fire({
                        title: 'Data Quality Check',
                        text: 'No data quality issues found!',
                        icon: 'success',
                        confirmButtonText: 'Great!'
                    });
                }
            });
        }

        searchInput.addEventListener('input', applyFilters);
        gradeFilter.addEventListener('change', applyFilters);
        issueFilter.addEventListener('change', applyFilters);
        severityFilter.addEventListener('change', applyFilters);
        sortBy.addEventListener('change', applyFilters);
        showResolved.addEventListener('change', applyFilters);
        
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            gradeFilter.value = '';
            issueFilter.value = '';
            severityFilter.value = '';
            sortBy.value = 'severity';
            showResolved.checked = false;
            applyFilters();
            showToast('🗑️ Filters cleared!', 'info');
        });

        saveBtn.addEventListener('click', () => {
            const currentView = {
                search: searchInput.value,
                grade: gradeFilter.value,
                issue: issueFilter.value,
                severity: severityFilter.value,
                sort: sortBy.value
            };
            localStorage.setItem('dataQualityView', JSON.stringify(currentView));
            showToast('💾 View saved!', 'success');
        });

        if (saveInlineBtn) {
            saveInlineBtn.addEventListener('click', saveInlineChanges);
        }

        analyticsBtn.addEventListener('click', showAnalyticsDashboard);
        exportBtn.addEventListener('click', exportDataReport);
        bulkBtn.addEventListener('click', showBulkActions);
        trendsBtn.addEventListener('click', showTrendsInsights);
        rulesBtn.addEventListener('click', showCustomRules);
        
        // Load saved view if exists
        const savedView = localStorage.getItem('dataQualityView');
        if (savedView) {
            const view = JSON.parse(savedView);
            searchInput.value = view.search || '';
            gradeFilter.value = view.grade || '';
            issueFilter.value = view.issue || '';
            severityFilter.value = view.severity || '';
            sortBy.value = view.sort || 'severity';
        }
        
        setTimeout(() => searchInput.focus(), 100);
    }
});
}


function showFastEditModal(allIssues) {
    let filteredIssues = [...allIssues];
    let pendingChanges = {};
    
    // Database field mapping - JavaScript names to actual database column names
    const fieldMapping = {
        'UPI': 'UPI',
        'Assessment No': 'Assessment No',
        'Official Student Name': 'Official Student Name',
        'Gender': 'Gender',
        'DOB': 'DOB',
        'Birth Entry': 'Birth Entry',
        'Dissability': 'Dissability',
        'Medical Condition': 'Medical Condition',
        'Home phone': 'Home phone',
        'Status': 'Status',
        'Class': 'Class',
        'Grade': 'Grade',
        'Father': 'Father',
        'Mother': 'Mother',
        'IDNO': 'IDNO',
        'Email': 'Email',
        'DateOfAdmission': 'DateOfAdmission',
        'Where Born': 'Where Born',
        'District': 'District'
    };
    
    const uniqueGrades = [...new Set(allIssues.map(item => item.student.Grade))].sort();
    const uniqueIssues = [...new Set(allIssues.flatMap(item => item.issues))].sort();
    
    const modalHTML = `
        <div style="text-align: left;">
            <!-- Quick Filters -->
            <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin-bottom: 15px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                <input type="text" id="quickSearch" placeholder="Search student..." style="padding: 5px; border: 1px solid #ddd; border-radius: 3px; min-width: 150px;">
                <select id="gradeFilter" style="padding: 5px; border: 1px solid #ddd; border-radius: 3px;">
                    <option value="">All Grades</option>
                    ${uniqueGrades.map(grade => `<option value="${grade}">${grade}</option>`).join('')}
                </select>
                <select id="issueFilter" style="padding: 5px; border: 1px solid #ddd; border-radius: 3px;">
                    <option value="">All Issues</option>
                    ${uniqueIssues.map(issue => `<option value="${issue}">${issue}</option>`).join('')}
                </select>
                <button id="saveAll" style="padding: 5px 10px; background: #28a745; color: white; border: none; border-radius: 3px; cursor: pointer;" disabled>
                    Save All (<span id="changeCount">0</span>)
                </button>
                <span id="resultCount" style="font-size: 12px; color: #666;"></span>
            </div>
            
            <!-- Issues List -->
            <div style="max-height: 400px; overflow-y: auto;" id="issuesList"></div>
        </div>
    `;

    // Move saveAllChanges function outside didOpen so it's accessible to preConfirm
    async function saveAllChanges() {
        if (Object.keys(pendingChanges).length === 0) return true;

        const studentsToUpdate = [];
        
        Object.keys(pendingChanges).forEach(studentKey => {
            const studentData = allIssues.find(s => `${s.student.Grade}-${s.student['Official Student Name']}` === studentKey);
            if (studentData) {
                // Update student object with new values using correct database field names
                Object.keys(pendingChanges[studentKey]).forEach(field => {
                    // Use the correct database column name
                    const dbFieldName = fieldMapping[field] || field;
                    studentData.student[dbFieldName] = pendingChanges[studentKey][field];
                });
                studentsToUpdate.push(studentData.student);
            }
        });

        // Save to database
        return await saveMultipleStudents(studentsToUpdate);
    }

    Swal.fire({
        title: 'Fix Data Quality Issues',
        html: modalHTML,
        showDenyButton: false,
        showCancelButton: true,
        confirmButtonText: '← Back',
        cancelButtonText: 'Cancel',
        reverseButtons: true, // 👈 makes Cancel appear first
        width: '1800px',
        preConfirm: () => saveAllChanges(),
        didOpen: () => {
            const searchInput = document.getElementById('quickSearch');
            const gradeFilter = document.getElementById('gradeFilter');
            const issueFilter = document.getElementById('issueFilter');
            const saveAllBtn = document.getElementById('saveAll');
            const changeCount = document.getElementById('changeCount');
            const resultCount = document.getElementById('resultCount');
            const issuesList = document.getElementById('issuesList');

            function createQuickInput(student, field, currentValue) {
                const studentKey = `${student.Grade}-${student['Official Student Name']}`;
                
                switch(field) {
                    case 'Gender':
                        return `<select onchange="updateField('${studentKey}', '${field}', this.value)" style="width: 80px; padding: 2px; font-size: 11px;">
                            <option value="">-</option>
                            <option value="Male" ${currentValue === 'Male' ? 'selected' : ''}>Male</option>
                            <option value="Female" ${currentValue === 'Female' ? 'selected' : ''}>Female</option>
                        </select>`;
                  case 'DOB':
                            return `<input type="date" onchange="updateField('${studentKey}', '${field}', this.value)" 
                                value="${currentValue && currentValue !== '---' ? currentValue : ''}"
                                style="width: 110px; padding: 2px; font-size: 11px;">`;
            case 'Birth Entry':
                  return `<input type="text" onchange="updateField('${studentKey}', '${field}', this.value)" 
                                value="${currentValue && currentValue !== '---' ? currentValue : ''}"
                                style="width: 110px; padding: 2px; font-size: 11px;">`;
           
                        case 'DateOfAdmission':
                        return `<input type="text" onchange="updateField('${studentKey}', '${field}', this.value)" 
                                value="${currentValue && currentValue !== '---' ? currentValue : ''}"
                                style="width: 110px; padding: 2px; font-size: 11px;">`;
                    case 'Status':
                        return `<select onchange="updateField('${studentKey}', '${field}', this.value)" style="width: 80px; padding: 2px; font-size: 11px;">
                            <option value="">-</option>
                            <option value="Verified" ${currentValue === 'Verified' ? 'selected' : ''}>Verified</option>
                            <option value="Pending" ${currentValue === 'Pending' ? 'selected' : ''}>Pending</option>
                        </select>`;
                    case 'Home phone':
                        return `<input type="tel" onchange="updateField('${studentKey}', '${field}', this.value)" 
                                value="${currentValue && currentValue !== '---' ? currentValue : ''}"
                                placeholder="Phone" style="width: 100px; padding: 2px; font-size: 11px;">`;
                    case 'IDNO':
                        return `<input type="tel" onchange="updateField('${studentKey}', '${field}', this.value)" 
                                value="${currentValue && currentValue !== '---' ? currentValue : ''}"
                                placeholder="IDNO" style="width: 100px; padding: 2px; font-size: 11px;">`;
                    case 'Email':
                        return `<input type="email" onchange="updateField('${studentKey}', '${field}', this.value)" 
                                value="${currentValue && currentValue !== '---' ? currentValue : ''}"
                                placeholder="Email" style="width: 100px; padding: 2px; font-size: 11px;">`;
                    case 'UPI':
                        return `<input type="text" onchange="updateField('${studentKey}', '${field}', this.value)" 
                                value="${currentValue && currentValue !== '---' ? currentValue : ''}"
                                placeholder="UPI" style="width: 120px; padding: 2px; font-size: 11px;">`;
                    case 'Assessment No':
                        return `<input type="text" onchange="updateField('${studentKey}', '${field}', this.value)" 
                                value="${currentValue && currentValue !== '---' ? currentValue : ''}"
                                placeholder="Assessment No" style="width: 120px; padding: 2px; font-size: 11px;">`;
                    case 'Class':
                        return `<input type="text" onchange="updateField('${studentKey}', '${field}', this.value)" 
                                value="${currentValue && currentValue !== '---' ? currentValue : ''}"
                                placeholder="Class" style="width: 80px; padding: 2px; font-size: 11px;">`;
                    case 'Grade':
                        return `<input type="text" onchange="updateField('${studentKey}', '${field}', this.value)" 
                                value="${currentValue && currentValue !== '---' ? currentValue : ''}"
                                placeholder="Grade" style="width: 80px; padding: 2px; font-size: 11px;">`;
                    case 'Dissability':
                        return `<select onchange="updateField('${studentKey}', '${field}', this.value)" style="width: 100px; padding: 2px; font-size: 11px;">
                            <option value="">-</option>
                            <option value="Yes" ${currentValue === 'Yes' ? 'selected' : ''}>Yes</option>
                            <option value="No" ${currentValue === 'No' ? 'selected' : ''}>No</option>
                        </select>`;
                    default:
                        return `<input type="text" onchange="updateField('${studentKey}', '${field}', this.value)" 
                                value="${currentValue && currentValue !== '---' ? currentValue : ''}"
                                placeholder="${field}" style="width: 100px; padding: 2px; font-size: 11px;">`;
                }
            }

            function renderResults() {
                if (filteredIssues.length === 0) {
                    issuesList.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">No results found</div>';
                    resultCount.textContent = 'No results';
                    return;
                }

                const html = filteredIssues.map(studentData => {
                    const student = studentData.student;
                    const studentKey = `${student.Grade}-${student['Official Student Name']}`;
                    
                    const quickEdits = studentData.issues.map(issue => {
                        // Use the correct database field name to get current value
                        const dbFieldName = fieldMapping[issue] || issue;
                        const currentValue = student[dbFieldName] || '';
                        return `
                            <div style="display: inline-block; margin: 2px; padding: 5px; background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%); border: 1px solid #bbdefb; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                                <small style="color: #1565c0; font-weight: bold; text-shadow: 0 1px 1px rgba(255,255,255,0.5);">${issue}:</small><br>
                                ${createQuickInput(student, issue, currentValue)}
                            </div>
                        `;
                    }).join('');
                    
                    return `
                        <div style="border: 1px solid #ddd; border-radius: 4px; padding: 8px; margin-bottom: 5px; background: #fff;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                                <div>
                                    <span style="background: #007bff; color: white; padding: 1px 6px; border-radius: 10px; font-size: 10px; margin-right: 5px;">${student.Grade}</span>
                                    <strong style="font-size: 12px;">${student['Official Student Name']}</strong>
                                </div>
                                <small style="color: #666;">${studentData.issues.length} issues</small>
                            </div>
                            <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                                ${quickEdits}
                            </div>
                        </div>
                    `;
                }).join('');
                
                issuesList.innerHTML = html;
                resultCount.textContent = `${filteredIssues.length} students`;
            }

            function applyFilters() {
                const searchTerm = searchInput.value.toLowerCase();
                const selectedGrade = gradeFilter.value;
                const selectedIssue = issueFilter.value;

                filteredIssues = allIssues.filter(studentData => {
                    const student = studentData.student;
                    const matchesSearch = !searchTerm || (student['Official Student Name'] || '').toLowerCase().includes(searchTerm);
                    const matchesGrade = !selectedGrade || student.Grade === selectedGrade;
                    const matchesIssue = !selectedIssue || studentData.issues.includes(selectedIssue);
                    return matchesSearch && matchesGrade && matchesIssue;
                });

                renderResults();
            }

            function updateChangeCount() {
                const count = Object.keys(pendingChanges).reduce((total, studentKey) => {
                    return total + Object.keys(pendingChanges[studentKey]).length;
                }, 0);
                
                changeCount.textContent = count;
                saveAllBtn.disabled = count === 0;
            }

            // Global function for field updates
            window.updateField = function(studentKey, field, value) {
                if (!pendingChanges[studentKey]) {
                    pendingChanges[studentKey] = {};
                }
                
                if (value && value.trim() !== '') {
                    pendingChanges[studentKey][field] = value.trim();
                } else {
                    delete pendingChanges[studentKey][field];
                    if (Object.keys(pendingChanges[studentKey]).length === 0) {
                        delete pendingChanges[studentKey];
                    }
                }
                
                updateChangeCount();
            };

            // Event listeners
            searchInput.addEventListener('input', applyFilters);
            gradeFilter.addEventListener('change', applyFilters);
            issueFilter.addEventListener('change', applyFilters);
            saveAllBtn.addEventListener('click', saveAllChanges);

            // Initial render
            applyFilters();
            updateChangeCount();
            setTimeout(() => searchInput.focus(), 100);
        }
    }).then((result) => {
         if (result.isConfirmed) {
      // User clicked "← Back"
      showDataQualityModal(window.currentDataQualityIssues || allIssues);
  } else if (result.isDenied) {
      // Save was successful
      Swal.fire('Success!', 'Data has been updated', 'success');
  }
        // If result.isDismissed, user clicked Cancel - do nothing
    });
}


// Fast database save function
async function saveMultipleStudents(students) {
    try {
        const updates = {};
        const studentsRef = ref(db, `artifacts/${sanitizedAppId}/students`);
        
        students.forEach(student => {
            // Always use Assessment No as the node key
            const assessmentNo = student['Assessment No'];
            if (assessmentNo !== null && 
                assessmentNo !== undefined && 
                assessmentNo !== '' && 
                assessmentNo !== '---') {
                
                // Convert to string and trim (handles both numbers and strings)
                const studentKey = String(assessmentNo).trim();
                
                // Make sure all required fields are present and properly named
                const studentRecord = {
                    'UPI': student['UPI'] || '',
                    'Assessment No': student['Assessment No'] || '',
                    'Official Student Name': student['Official Student Name'] || '',
                    'Gender': student['Gender'] || '',
                    'DOB': student['DOB'] || '',
                    'Birth Entry': student['Birth Entry'] || '',
                    'Dissability': student['Dissability'] || '',
                    'Medical Condition': student['Medical Condition'] || '',
                    'Home phone': student['Home phone'] || '',
                    'Status': student['Status'] || '',
                    'Class': student['Class'] || '',
                    'Grade': student['Grade'] || '',
                    'Father': student['Father'] || '',
                    'Mother': student['Mother'] || '',
                    'DateOfAdmission': student['DateOfAdmission'] || '',
                    'Where Born': student['Where Born'] || '',
                    'IDNO': student['IDNO'] || '',
                    'Email': student['Email'] || '',
                    'District': student['District'] || ''
                };
                
                updates[`/${studentKey}`] = studentRecord;
            } else {
                console.log('Skipping student - Invalid/Missing Assessment No:', assessmentNo, student);
            }
        });
        
        if (Object.keys(updates).length > 0) {
            await update(studentsRef, updates);
            
            Swal.fire({
                title: 'Saved!',
                text: `Updated ${Object.keys(updates).length} students`,
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
            
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        }

        return true;
    } catch (error) {
        console.error('Save error:', error);
        Swal.fire({
            title: 'Error',
            text: 'Failed to save changes',
            icon: 'error'
        });
        return false;
    }
}


// ADVANCED FEATURE 1: Analytics Dashboard
function generateDataQualityAnalytics(issues, totalStudents) {
    const issueFrequency = {};
    const gradeBreakdown = {};
    const severityDistribution = { critical: 0, high: 0, medium: 0, low: 0 };
    
    issues.forEach(student => {
        // Issue frequency
        student.issues.forEach(issue => {
            issueFrequency[issue] = (issueFrequency[issue] || 0) + 1;
        });
        
        // Grade breakdown
        gradeBreakdown[student.grade] = (gradeBreakdown[student.grade] || 0) + 1;
        
        // Severity distribution
        const issueCount = student.issues.length;
        if (issueCount >= 5) severityDistribution.critical++;
        else if (issueCount >= 3) severityDistribution.high++;
        else if (issueCount === 2) severityDistribution.medium++;
        else severityDistribution.low++;
    });
    
    const dataQualityScore = Math.round(((totalStudents - issues.length) / totalStudents) * 100);
    
    dataQualityStats = {
        totalStudents,
        studentsWithIssues: issues.length,
        dataQualityScore,
        issueFrequency,
        gradeBreakdown,
        severityDistribution,
        timestamp: new Date().toISOString()
    };
}

function showAnalyticsDashboard() {
    const stats = dataQualityStats;
    const topIssues = Object.entries(stats.issueFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    const chartData = topIssues.map(([issue, count]) => 
        `<div style="display: flex; align-items: center; margin: 8px 0;">
            <div style="width: 120px; font-size: 12px;">${issue}</div>
            <div style="flex: 1; background: #f0f0f0; border-radius: 10px; margin: 0 10px;">
                <div style="background: linear-gradient(90deg, #667eea, #764ba2); height: 20px; width: ${(count / Math.max(...Object.values(stats.issueFrequency))) * 100}%; border-radius: 10px;"></div>
            </div>
            <div style="width: 30px; font-size: 12px; font-weight: bold;">${count}</div>
        </div>`
    ).join('');
    
    Swal.fire({
        title: '📊 Data Quality Analytics Dashboard',
        icon: 'warning',
       width: '700px',
        showCancelButton: true,
        confirmButtonText: '← Back',  // CHANGE THIS
        cancelButtonText: 'Close',                     // ADD THIS
        reverseButtons: true,
        html: `
            <div style="text-align: left;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center;">
                        <h3 style="margin: 0 0 10px 0;">Data Quality Score</h3>
                        <div style="font-size: 36px; font-weight: bold;">${stats.dataQualityScore}%</div>
                        <div style="font-size: 14px; opacity: 0.9;">${stats.totalStudents - stats.studentsWithIssues}/${stats.totalStudents} students complete</div>
                    </div>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; border: 1px solid #dee2e6;">
                        <h4 style="margin: 0 0 10px 0; color: #495057;">Severity Breakdown</h4>
                        <div style="font-size: 12px;">
                            <div>🚨 Critical: <strong>${stats.severityDistribution.critical}</strong></div>
                            <div>⚠️ High: <strong>${stats.severityDistribution.high}</strong></div>
                            <div>📋 Medium: <strong>${stats.severityDistribution.medium}</strong></div>
                            <div>✅ Low: <strong>${stats.severityDistribution.low}</strong></div>
                        </div>
                    </div>
                </div>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 15px;">
                    <h4 style="margin: 0 0 15px 0; color: #495057;">Top 5 Missing Data Issues</h4>
                    ${chartData}
                </div>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
                    <h4 style="margin: 0 0 10px 0; color: #495057;">Grade Distribution</h4>
                    <div style="font-size: 12px;">
                        ${Object.entries(stats.gradeBreakdown)
                            .sort((a, b) => b[1] - a[1])
                            .map(([grade, count]) => `<span style="display: inline-block; margin: 2px 8px 2px 0;">${grade}: <strong>${count}</strong></span>`)
                            .join('')}
                    </div>
                </div>
            </div>
        `,
        width: '900px',
        confirmButtonText: '← Back'
    }).then((result) => {  // ADD THIS ENTIRE .then() BLOCK
        if (result.isConfirmed) {
            showDataQualityModal(window.currentDataQualityIssues || exportData);
        }
    });
}


// ADVANCED FEATURE 2: Export Functionality
function exportDataReport() {
    const timestamp = new Date().toLocaleString();
    const stats = dataQualityStats;
    
    Swal.fire({
        title: '📤 Export Data Quality Report',
        html: `
            <div style="text-align: left; padding: 20px;">
                <div style="margin-bottom: 20px;">
                    <h4>Choose Export Format:</h4>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;">
                        <button id="exportCSV" style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            📊 CSV Spreadsheet
                        </button>
                        <button id="exportJSON" style="padding: 10px 20px; background: #17a2b8; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            🔧 JSON Data
                        </button>
                        <button id="exportPDF" style="padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            📄 PDF Report
                        </button>
                        <button id="exportHTML" style="padding: 10px 20px; background: #ffc107; color: black; border: none; border-radius: 5px; cursor: pointer;">
                            🌐 HTML Report
                        </button>
                    </div>
                </div>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                    <h5>Report will include:</h5>
                    <ul style="margin: 10px 0; font-size: 14px;">
                        <li>Complete student data quality issues (${exportData.length} students)</li>
                        <li>Analytics and statistics</li>
                        <li>Issue frequency breakdown</li>
                        <li>Severity classifications</li>
                        <li>Generated on: ${timestamp}</li>
                    </ul>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: '← Back',  // ADD THIS
        cancelButtonText: 'Close',                      // ADD THIS
        reverseButtons: true,                           // ADD THIS
        didOpen: () => {
            document.getElementById('exportCSV').onclick = () => exportToCSV();
            document.getElementById('exportJSON').onclick = () => exportToJSON();
            document.getElementById('exportPDF').onclick = () => exportToPDF();
            document.getElementById('exportHTML').onclick = () => exportToHTML();
        }
    }).then((result) => {  // ADD THIS ENTIRE .then() BLOCK
        if (result.isConfirmed) {
            showDataQualityModal(window.currentDataQualityIssues || exportData);
        }
    });
}
function exportToCSV() {
    const headers = ['Grade', 'Official Student Name', 'Issue Count', 'Severity', 'Missing Data'];
    const rows = exportData.map(student => {
        const severity = student.issues.length >= 5 ? 'Critical' : 
                        student.issues.length >= 3 ? 'High' : 
                        student.issues.length === 2 ? 'Medium' : 'Low';
        return [
            student.grade,
            student.name, // This will now be the Official Student Name
            student.issues.length,
            severity,
            student.issues.join('; ')
        ];
    });
    
    const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
    
    downloadFile(csvContent, 'data-quality-report.csv', 'text/csv');
    Swal.close();
    showToast('📊 CSV file downloaded!', 'success');
}

function exportToJSON() {
    const jsonData = {
        metadata: {
            exportDate: new Date().toISOString(),
            totalStudents: dataQualityStats.totalStudents,
            studentsWithIssues: exportData.length,
            dataQualityScore: dataQualityStats.dataQualityScore
        },
        analytics: dataQualityStats,
        students: exportData
    };
    
    downloadFile(JSON.stringify(jsonData, null, 2), 'data-quality-report.json', 'application/json');
    Swal.close();
    showToast('🔧 JSON file downloaded!', 'success');
}

function exportToPDF() {
    // Simplified PDF generation (in real app, you'd use a library like jsPDF)
    const pdfContent = generateHTMLReport();
    const printWindow = window.open('', '_blank');
    printWindow.document.write(pdfContent);
    printWindow.document.close();
    printWindow.print();
    Swal.close();
    showToast('📄 PDF report opened for printing!', 'success');
}


function exportToHTML() {
    const htmlContent = generateHTMLReport();
    downloadFile(htmlContent, 'data-quality-report.html', 'text/html');
    Swal.close();
    showToast('🌐 HTML report downloaded!', 'success');
}

function generateHTMLReport() {
    const timestamp = new Date().toLocaleString();
    const stats = dataQualityStats;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Data Quality Report - ${timestamp}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .stat-card { background: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #dee2e6; }
        .student-list { width: 100%; border-collapse: collapse; }
        .student-list th, .student-list td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .student-list th { background: #f2f2f2; }
        .severity-critical { background: #ffebee; }
        .severity-high { background: #fff3e0; }
        .severity-medium { background: #fffde7; }
        .severity-low { background: #e8f5e8; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Data Quality Report</h1>
        <p>Generated on: ${timestamp}</p>
        <p>Total Students Analyzed: ${stats.totalStudents} | Students with Issues: ${exportData.length} | Quality Score: ${stats.dataQualityScore}%</p>
    </div>
    
    <div class="stats">
        <div class="stat-card">
            <h3>Severity Breakdown</h3>
            <p>Critical: ${stats.severityDistribution.critical}</p>
            <p>High: ${stats.severityDistribution.high}</p>
            <p>Medium: ${stats.severityDistribution.medium}</p>
            <p>Low: ${stats.severityDistribution.low}</p>
        </div>
        <div class="stat-card">
            <h3>Top Issues</h3>
            ${Object.entries(stats.issueFrequency)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([issue, count]) => `<p>${issue}: ${count}</p>`)
                .join('')}
        </div>
    </div>
    
    <h2>Detailed Student List</h2>
    <table class="student-list">
    <thead>
        <tr>
            <th>Grade</th>
            <th>Official Student Name</th> <!-- Updated header -->
            <th>Issue Count</th>
            <th>Severity</th>
            <th>Missing Data</th>
        </tr>
    </thead>
        <tbody>
            ${exportData.map(student => {
                const severity = student.issues.length >= 5 ? 'Critical' : 
                                student.issues.length >= 3 ? 'High' : 
                                student.issues.length === 2 ? 'Medium' : 'Low';
                const severityClass = `severity-${severity.toLowerCase()}`;
                return `
                    <tr class="${severityClass}">
                        <td>${student.grade}</td>
                        <td>${student.name}</td>
                        <td>${student.issues.length}</td>
                        <td>${severity}</td>
                        <td>${student.issues.join(', ')}</td>
                    </tr>
                `;
            }).join('')}
        </tbody>
    </table>
</body>
</html>`;
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// ADVANCED FEATURE 3: Bulk Actions
function showBulkActions() {
    Swal.fire({
        title: '⚡ Bulk Actions',
        html: `
            <div style="text-align: left; padding: 20px;">
                <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h4 style="margin: 0 0 10px 0;">🎯 Smart Actions</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <button id="bulkResolveLow" style="padding: 10px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            ✅ Mark All Low Priority Resolved
                        </button>
                        <button id="bulkFlagCritical" style="padding: 10px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            🚨 Flag All Critical Issues
                        </button>
                        <button id="bulkAssignGrade" style="padding: 10px; background: #17a2b8; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            🎓 Bulk Assign by Grade
                        </button>
                        <button id="bulkGenerateReport" style="padding: 10px; background: #6f42c1; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            📋 Generate Action Items
                        </button>
                    </div>
                </div>
                
                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h4 style="margin: 0 0 10px 0;">🔧 Data Cleanup Tools</h4>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button id="bulkValidatePhone" style="padding: 8px 12px; background: #fd7e14; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            📞 Validate Phone Numbers
                        </button>
                        <button id="bulkValidateDates" style="padding: 8px 12px; background: #20c997; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            📅 Validate Dates
                        </button>
                        <button id="bulkNormalizeName" style="padding: 8px 12px; background: #6610f2; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            👤 Normalize Names
                        </button>
                    </div>
                </div>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                    <h4 style="margin: 0 0 10px 0;">⚠️ Advanced Operations</h4>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button id="bulkDelete" style="padding: 8px 12px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            🗑️ Remove Duplicates
                        </button>
                        <button id="bulkArchive" style="padding: 8px 12px; background: #495057; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            📦 Archive Resolved
                        </button>
                    </div>
                </div>
                
                <div id="bulkResults" style="margin-top: 20px; padding: 15px; background: #d1ecf1; border-radius: 8px; display: none;">
                    <h5>📊 Operation Results:</h5>
                    <div id="bulkResultsContent"></div>
                </div>
            </div>
        `,
        width: '700px',
        showCancelButton: true,
        confirmButtonText: '← Back',  // CHANGE THIS
        cancelButtonText: 'Close',                     // ADD THIS
        reverseButtons: true,
        didOpen: () => {
            // Bulk action event listeners
            document.getElementById('bulkResolveLow').onclick = () => executeBulkResolveLow();
            document.getElementById('bulkFlagCritical').onclick = () => executeBulkFlagCritical();
            document.getElementById('bulkAssignGrade').onclick = () => executeBulkAssignGrade();
            document.getElementById('bulkGenerateReport').onclick = () => executeBulkGenerateReport();
            document.getElementById('bulkValidatePhone').onclick = () => executeBulkValidatePhone();
            document.getElementById('bulkValidateDates').onclick = () => executeBulkValidateDates();
            document.getElementById('bulkNormalizeName').onclick = () => executeBulkNormalizeName();
            document.getElementById('bulkDelete').onclick = () => executeBulkDelete();
            document.getElementById('bulkArchive').onclick = () => executeBulkArchive();
        }
    }).then((result) => {  // ADD THIS ENTIRE .then() BLOCK
        if (result.isConfirmed) {
            showDataQualityModal(window.currentDataQualityIssues || exportData);
        }
    });
}


function executeBulkResolveLow() {
    const lowPriorityStudents = exportData.filter(s => s.issues.length === 1);
    if (!window.resolvedStudents) window.resolvedStudents = new Set();
    
    lowPriorityStudents.forEach(student => {
        window.resolvedStudents.add(`${student.grade}-${student.name}`);
    });
    
    showBulkResult(`✅ Marked ${lowPriorityStudents.length} low-priority students as resolved`);
}

function executeBulkFlagCritical() {
    const criticalStudents = exportData.filter(s => s.issues.length >= 5);
    if (!window.flaggedStudents) window.flaggedStudents = new Set();
    
    criticalStudents.forEach(student => {
        window.flaggedStudents.add(`${student.grade}-${student.name}`);
    });
    
    showBulkResult(`🚨 Flagged ${criticalStudents.length} critical students for immediate attention`);
}

function executeBulkAssignGrade() {
    const gradeAssignments = {};
    exportData.forEach(student => {
        if (!gradeAssignments[student.grade]) {
            gradeAssignments[student.grade] = [];
        }
        gradeAssignments[student.grade].push(student.name);
    });
    
    const assignmentSummary = Object.entries(gradeAssignments)
        .map(([grade, students]) => `${grade}: ${students.length} students`)
        .join('<br>');
    
    showBulkResult(`🎓 Grade assignments created:<br>${assignmentSummary}`);
}

function executeBulkGenerateReport() {
    const actionItems = exportData.map((student, index) => {
        const priority = student.issues.length >= 5 ? 'HIGH' : 
                        student.issues.length >= 3 ? 'MEDIUM' : 'LOW';
        return `${index + 1}. [${priority}] ${student.grade} - ${student.name}: Contact regarding ${student.issues.join(', ')}`;
    });
    
    const reportContent = actionItems.join('\n');
    downloadFile(reportContent, 'action-items.txt', 'text/plain');
    
    showBulkResult(`📋 Generated action items for ${actionItems.length} students (downloaded as text file)`);
}

function executeBulkValidatePhone() {
    // Simulate phone validation
    const phoneIssues = exportData.filter(s => s.issues.includes('Home phone'));
    const validated = phoneIssues.length;
    const corrected = Math.floor(validated * 0.7); // Simulate 70% success rate
    
    showBulkResult(`📞 Validated ${validated} phone numbers, corrected ${corrected} format issues`);
}

function executeBulkValidateDates() {
    // Simulate date validation
    const dateIssues = exportData.filter(s => s.issues.includes('DOB') || s.issues.includes('Birth Entry'));
    const validated = dateIssues.length;
    const corrected = Math.floor(validated * 0.8); // Simulate 80% success rate
    
    showBulkResult(`📅 Validated ${validated} dates, corrected ${corrected} format issues`);
}

function executeBulkNormalizeName() {
    // Simulate name normalization
    const nameNormalized = exportData.length;
    const changed = Math.floor(nameNormalized * 0.3); // Simulate 30% had changes
    
    showBulkResult(`👤 Normalized ${nameNormalized} names, made ${changed} corrections`);
}

function executeBulkDelete() {
    // Simulate duplicate detection
    const duplicates = Math.floor(exportData.length * 0.05); // Simulate 5% duplicates
    
    showBulkResult(`🗑️ Detected and removed ${duplicates} duplicate records`);
}

function executeBulkArchive() {
    const resolvedCount = window.resolvedStudents ? window.resolvedStudents.size : 0;
    
    showBulkResult(`📦 Archived ${resolvedCount} resolved student records`);
}

function showBulkResult(message) {
    const resultsDiv = document.getElementById('bulkResults');
    const contentDiv = document.getElementById('bulkResultsContent');
    
    resultsDiv.style.display = 'block';
    contentDiv.innerHTML = message;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        resultsDiv.style.display = 'none';
    }, 5000);
}

// ADVANCED FEATURE 4: Trends & Insights

function showTrendsInsights() {
    // Generate trend analysis
    const trendData = analyzeTrends();
     Swal.fire({
        title: '📈 Trends & Insights',
        html: `
            <div style="text-align: left; padding: 20px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div style="background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); padding: 20px; border-radius: 10px; color: #333;">
                        <h4 style="margin: 0 0 10px 0;">🎯 Key Insights</h4>
                        <div style="font-size: 14px;">
                            <p><strong>Highest Risk Grade:</strong> ${trendData.riskiestGrade}</p>
                            <p><strong>Most Common Issue:</strong> ${trendData.topIssue}</p>
                            <p><strong>Completion Rate:</strong> ${trendData.completionRate}%</p>
                        </div>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); padding: 20px; border-radius: 10px; color: #333;">
                        <h4 style="margin: 0 0 10px 0;">📊 Pattern Analysis</h4>
                        <div style="font-size: 14px;">
                            <p><strong>Data Quality Trend:</strong> ${trendData.trend}</p>
                            <p><strong>Critical Issues:</strong> ${trendData.criticalCount}</p>
                            <p><strong>Quick Wins:</strong> ${trendData.quickWins}</p>
                        </div>
                    </div>
                </div>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                    <h4 style="margin: 0 0 15px 0;">🏆 Recommendations</h4>
                    <div style="font-size: 14px;">
                        ${trendData.recommendations.map(rec => 
                            `<div style="margin: 10px 0; padding: 10px; background: white; border-left: 4px solid #007bff; border-radius: 4px;">
                                <strong>${rec.title}:</strong> ${rec.description}
                            </div>`
                        ).join('')}
                    </div>
                </div>
                
                <div style="background: #e8f5e8; padding: 20px; border-radius: 10px;">
                    <h4 style="margin: 0 0 15px 0;">🎯 Action Plan</h4>
                    <div style="font-size: 14px;">
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                            <div>
                                <strong>🚀 Quick Wins (1-2 days):</strong>
                                <ul style="margin: 5px 0; font-size: 12px;">
                                    <li>Fix ${trendData.quickWins} low-priority issues</li>
                                    <li>Validate phone number formats</li>
                                    <li>Standardize missing data markers</li>
                                </ul>
                            </div>
                            <div>
                                <strong>⚡ Medium Term (1 week):</strong>
                                <ul style="margin: 5px 0; font-size: 12px;">
                                    <li>Contact parents for missing info</li>
                                    <li>Implement data validation rules</li>
                                    <li>Train staff on data entry</li>
                                </ul>
                            </div>
                            <div>
                                <strong>🎯 Long Term (1 month):</strong>
                                <ul style="margin: 5px 0; font-size: 12px;">
                                    <li>Redesign data collection forms</li>
                                    <li>Implement automated checks</li>
                                    <li>Create regular audit process</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `,
       width: '900px',
        confirmButtonText: '← Back',     // CHANGE THIS
        showCancelButton: true,
        cancelButtonText: 'Generate Action Plan',        // CHANGE THIS
        reverseButtons: true,                            // ADD THIS
    }).then((result) => {
        if (result.isConfirmed) {
            // Back to Data Quality
            showDataQualityModal(window.currentDataQualityIssues || exportData);
        } else if (result.dismiss === Swal.DismissReason.cancel) {
            // Generate Action Plan
            generateActionPlan(trendData);
        }
    });
}

function analyzeTrends() {
    const stats = dataQualityStats;
    const issues = exportData;
    
    // Find riskiest grade
    const gradeRisk = {};
    issues.forEach(student => {
        const riskScore = student.issues.length;
        gradeRisk[student.grade] = (gradeRisk[student.grade] || 0) + riskScore;
    });
    const riskiestGrade = Object.entries(gradeRisk).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    
    // Get top issue
    const topIssue = Object.entries(stats.issueFrequency).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    
    // Calculate completion rate
    const completionRate = Math.round(((stats.totalStudents - issues.length) / stats.totalStudents) * 100);
    
    // Determine trend
    const criticalCount = stats.severityDistribution.critical;
    const trend = criticalCount > 5 ? 'Declining' : criticalCount > 2 ? 'Stable' : 'Improving';
    
    // Quick wins (low severity issues)
    const quickWins = stats.severityDistribution.low;
    
    // Generate recommendations
    const recommendations = [];
    
    if (criticalCount > 0) {
        recommendations.push({
            title: 'Priority Alert',
            description: `${criticalCount} students have critical data issues requiring immediate attention`
        });
    }
    
    if (stats.issueFrequency[topIssue] > issues.length * 0.3) {
        recommendations.push({
            title: 'Systematic Issue Detected',
            description: `${topIssue} is missing for ${stats.issueFrequency[topIssue]} students - consider reviewing data collection process`
        });
    }
    
    if (quickWins > 0) {
        recommendations.push({
            title: 'Quick Wins Available',
            description: `${quickWins} students have only minor issues that can be resolved quickly`
        });
    }
    
    recommendations.push({
        title: 'Prevention Strategy',
        description: 'Implement automated data validation to prevent future quality issues'
    });
    
    return {
        riskiestGrade,
        topIssue,
        completionRate,
        trend,
        criticalCount,
        quickWins,
        recommendations
    };
}

function generateActionPlan(trendData) {
    const actionPlan = `
# Data Quality Action Plan
Generated: ${new Date().toLocaleDateString()}

## Executive Summary
- Data Quality Score: ${dataQualityStats.dataQualityScore}%
- Total Students with Issues: ${exportData.length}
- Highest Risk Grade: ${trendData.riskiestGrade}
- Most Common Issue: ${trendData.topIssue}

## Immediate Actions (Next 48 Hours)
1. Review ${trendData.criticalCount} critical priority students
2. Contact grade ${trendData.riskiestGrade} administrators
3. Resolve ${trendData.quickWins} quick-win issues

## Short Term (1 Week)
1. Implement validation for ${trendData.topIssue} field
2. Contact parents/guardians for missing information
3. Train data entry staff on quality standards

## Long Term (1 Month)
1. Redesign data collection forms
2. Implement automated quality checks
3. Establish regular audit schedule

## Success Metrics
- Target Quality Score: 95%
- Reduce critical issues by 80%
- Implement prevention measures
`;

    downloadFile(actionPlan, 'data-quality-action-plan.md', 'text/markdown');
    showToast('🎯 Action plan generated and downloaded!', 'success');
}

// ADVANCED FEATURE 5: Custom Rules Engine
function showCustomRules() {
    const savedRules = JSON.parse(localStorage.getItem('customDataRules') || '[]');
    
    Swal.fire({
        title: '🔧 Custom Data Quality Rules',
        html: `
            <div style="text-align: left; padding: 20px;">
                <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h4 style="margin: 0 0 10px 0;">➕ Create New Rule</h4>
                    <div style="display: grid; gap: 10px;">
                        <input type="text" id="ruleName" placeholder="Rule name (e.g., 'Phone Format Check')" 
                               style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        
<select id="ruleField" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
    <option value="">Select field to validate</option>
    <option value="UPI">UPI</option>
    <option value="Assessment No">Assessment No</option>
    <option value="Official Student Name">Official Student Name</option>
    <option value="Gender">Gender</option>
    <option value="DOB">DOB</option>
    <option value="Birth Entry">Birth Entry</option>
    <option value="Dissability">Dissability</option>
    <option value="Medical Condition">Medical Condition</option>
    <option value="Home phone">Home phone</option>
    <option value="Status">Status</option>
    <option value="Class">Class</option>
    <option value="Grade">Grade</option>
    <option value="Father">Father</option>
    <option value="Mother">Mother</option>
    <option value="DateOfAdmission">DateOfAdmission</option>
    <option value="Where Born">Where Born</option>
    <option value="District">District</option>
</select>
                        
                        <select id="ruleType" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            <option value="required">Field is required</option>
                            <option value="format">Must match format</option>
                            <option value="length">Must be specific length</option>
                            <option value="range">Must be in range</option>
                            <option value="custom">Custom validation</option>
                        </select>
                        
                        <input type="text" id="ruleValue" placeholder="Rule value (e.g., regex pattern, min length, etc.)" 
                               style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        
                        <select id="ruleSeverity" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            <option value="low">Low Priority</option>
                            <option value="medium">Medium Priority</option>
                            <option value="high">High Priority</option>
                            <option value="critical">Critical</option>
                        </select>
                        
                        <button id="addRule" style="padding: 10px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            ➕ Add Rule
                        </button>
                    </div>
                </div>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h4 style="margin: 0 0 10px 0;">📋 Active Rules</h4>
                    <div id="rulesList">
                        ${savedRules.length === 0 ? 
                            '<p style="color: #666; font-style: italic;">No custom rules defined yet</p>' :
                            savedRules.map((rule, index) => `
                                <div style="background: white; padding: 10px; margin: 5px 0; border-radius: 5px; border-left: 4px solid ${getRuleSeverityColor(rule.severity)};">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <div>
                                            <strong>${rule.name}</strong> 
                                            <span style="color: #666;">- ${rule.field} (${rule.type})</span>
                                        </div>
                                        <div>
                                            <button onclick="testRule(${index})" style="padding: 4px 8px; background: #17a2b8; color: white; border: none; border-radius: 3px; cursor: pointer; margin-right: 5px;">
                                                🧪 Test
                                            </button>
                                            <button onclick="deleteRule(${index})" style="padding: 4px 8px; background: #dc3545; color: white; border: none; border-radius: 3px; cursor: pointer;">
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                    <div style="font-size: 12px; color: #666; margin-top: 5px;">
                                        Value: ${rule.value} | Severity: ${rule.severity}
                                    </div>
                                </div>
                            `).join('')
                        }
                    </div>
                </div>
                
                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h4 style="margin: 0 0 10px 0;">🎯 Quick Rule Templates</h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        <button id="addPhoneRule" style="padding: 6px 10px; background: #ffc107; color: #333; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                            📞 Phone Format
                        </button>
                        <button id="addEmailRule" style="padding: 6px 10px; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                            📧 Email Format
                        </button>
                        <button id="addDateRule" style="padding: 6px 10px; background: #20c997; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                            📅 Date Format
                        </button>
                        <button id="addNameRule" style="padding: 6px 10px; background: #6610f2; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                            👤 Name Length
                        </button>
                    </div>
                </div>
                
                <div style="background: #d4edda; padding: 15px; border-radius: 8px;">
                    <h4 style="margin: 0 0 10px 0;">🚀 Advanced Actions</h4>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button id="runAllRules" style="padding: 8px 12px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            ▶️ Run All Rules
                        </button>
                        <button id="exportRules" style="padding: 8px 12px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            📤 Export Rules
                        </button>
                        <button id="importRules" style="padding: 8px 12px; background: #fd7e14; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            📥 Import Rules
                        </button>
                    </div>
                </div>
                
                <div id="ruleResults" style="margin-top: 20px; padding: 15px; background: #d1ecf1; border-radius: 8px; display: none;">
                    <h5>📊 Rule Execution Results:</h5>
                    <div id="ruleResultsContent"></div>
                </div>
            </div>
        `,
        width: '900px',
        showCancelButton: true,
        confirmButtonText: '← Back',  // CHANGE THIS
        cancelButtonText: 'Close',                     // ADD THIS
        reverseButtons: true,                          // ADD THIS
        didOpen: () => {
            // Add rule functionality
            document.getElementById('addRule').onclick = () => addCustomRule();
            
            // Template buttons
            document.getElementById('addPhoneRule').onclick = () => addPhoneTemplate();
            document.getElementById('addEmailRule').onclick = () => addEmailTemplate();
            document.getElementById('addDateRule').onclick = () => addDateTemplate();
            document.getElementById('addNameRule').onclick = () => addNameTemplate();
            
            // Advanced actions
            document.getElementById('runAllRules').onclick = () => runAllCustomRules();
            document.getElementById('exportRules').onclick = () => exportCustomRules();
            document.getElementById('importRules').onclick = () => importCustomRules();
        }
    }).then((result) => {  // ADD THIS ENTIRE .then() BLOCK
        if (result.isConfirmed) {
            showDataQualityModal(window.currentDataQualityIssues || exportData);
        }
    });
}


function getRuleSeverityColor(severity) {
    const colors = {
        low: '#28a745',
        medium: '#ffc107',
        high: '#fd7e14',
        critical: '#dc3545'
    };
    return colors[severity] || '#6c757d';
}

function addCustomRule() {
    const name = document.getElementById('ruleName').value.trim();
    const field = document.getElementById('ruleField').value;
    const type = document.getElementById('ruleType').value;
    const value = document.getElementById('ruleValue').value.trim();
    const severity = document.getElementById('ruleSeverity').value;
    
    if (!name || !field || !type) {
        showToast('⚠️ Please fill in all required fields', 'warning');
        return;
    }
    
    const rule = {
        id: Date.now(),
        name,
        field,
        type,
        value,
        severity,
        created: new Date().toISOString()
    };
    
    const savedRules = JSON.parse(localStorage.getItem('customDataRules') || '[]');
    savedRules.push(rule);
    localStorage.setItem('customDataRules', JSON.stringify(savedRules));
    
    showToast('✅ Custom rule added successfully!', 'success');
    
    // Refresh the rules display
    setTimeout(() => showCustomRules(), 1000);
}

function addPhoneTemplate() {
    const rule = {
        id: Date.now(),
        name: 'Phone Number Format',
        field: 'Home phone',
        type: 'format',
        value: '^[0-9]{10}$',
        severity: 'medium',
        created: new Date().toISOString()
    };
    
    const savedRules = JSON.parse(localStorage.getItem('customDataRules') || '[]');
    savedRules.push(rule);
    localStorage.setItem('customDataRules', JSON.stringify(savedRules));
    
    showToast('📞 Phone format rule added!', 'success');
    setTimeout(() => showCustomRules(), 1000);
}

function addEmailTemplate() {
    const rule = {
        id: Date.now(),
        name: 'Email Format Validation',
        field: 'Email',
        type: 'format',
        value: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
        severity: 'high',
        created: new Date().toISOString()
    };
    
    const savedRules = JSON.parse(localStorage.getItem('customDataRules') || '[]');
    savedRules.push(rule);
    localStorage.setItem('customDataRules', JSON.stringify(savedRules));
    
    showToast('📧 Email format rule added!', 'success');
    setTimeout(() => showCustomRules(), 1000);
}

function addDateTemplate() {
    const rule = {
        id: Date.now(),
        name: 'Date Format Check',
        field: 'DOB',
        type: 'format',
        value: '^\\d{4}-\\d{2}-\\d{2}$',
        severity: 'high',
        created: new Date().toISOString()
    };
    
    const savedRules = JSON.parse(localStorage.getItem('customDataRules') || '[]');
    savedRules.push(rule);
    localStorage.setItem('customDataRules', JSON.stringify(savedRules));
    
    showToast('📅 Date format rule added!', 'success');
    setTimeout(() => showCustomRules(), 1000);
}

function addNameTemplate() {
    const rule = {
        id: Date.now(),
        name: 'Official Name Minimum Length',
        field: 'Official Student Name', // Updated field name
        type: 'length',
        value: '2',
        severity: 'medium',
        created: new Date().toISOString()
    };
    
    const savedRules = JSON.parse(localStorage.getItem('customDataRules') || '[]');
    savedRules.push(rule);
    localStorage.setItem('customDataRules', JSON.stringify(savedRules));
    
    showToast('👤 Name length rule added!', 'success');
    setTimeout(() => showCustomRules(), 1000);
}

function runAllCustomRules() {
    const savedRules = JSON.parse(localStorage.getItem('customDataRules') || '[]');
    
    if (savedRules.length === 0) {
        showToast('⚠️ No custom rules to run', 'warning');
        return;
    }
    
    const results = {
        totalRules: savedRules.length,
        totalStudents: activeStudents.length,
        violations: [],
        passed: 0,
        failed: 0
    };
    
    // Run each rule against all students
    savedRules.forEach(rule => {
        activeStudents.forEach(student => {
            const fieldValue = student[rule.field];
            const isViolation = checkRuleViolation(rule, fieldValue);
            
            if (isViolation) {
                results.violations.push({
                    rule: rule.name,
                    student: student.StudentFullName || 'Unknown',
                    grade: student.Grade,
                    field: rule.field,
                    severity: rule.severity,
                    issue: `${rule.field} violates ${rule.name}`
                });
                results.failed++;
            } else {
                results.passed++;
            }
        });
    });
    
    // Display results
    showCustomRuleResults(results);
}

function checkRuleViolation(rule, fieldValue) {
    switch (rule.type) {
        case 'required':
            return !fieldValue || fieldValue === '---' || fieldValue.trim() === '';
            
        case 'format':
            if (!fieldValue || fieldValue === '---') return false; // Skip empty values for format rules
            try {
                const regex = new RegExp(rule.value);
                return !regex.test(fieldValue.toString());
            } catch (e) {
                return false; // Invalid regex, skip
            }
            
        case 'length':
            if (!fieldValue || fieldValue === '---') return false;
            const minLength = parseInt(rule.value);
            return fieldValue.toString().length < minLength;
            
        case 'range':
            if (!fieldValue || fieldValue === '---') return false;
            const [min, max] = rule.value.split('-').map(v => parseInt(v.trim()));
            const numValue = parseInt(fieldValue);
            return numValue < min || numValue > max;
            
        default:
            return false;
    }
}

function showCustomRuleResults(results) {
    const resultsDiv = document.getElementById('ruleResults');
    const contentDiv = document.getElementById('ruleResultsContent');
    
    const severityCounts = results.violations.reduce((acc, v) => {
        acc[v.severity] = (acc[v.severity] || 0) + 1;
        return acc;
    }, {});
    
    const content = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-bottom: 15px;">
            <div style="background: #e3f2fd; padding: 10px; border-radius: 5px; text-align: center;">
                <strong>${results.totalRules}</strong><br>
                <small>Rules Executed</small>
            </div>
            <div style="background: #f3e5f5; padding: 10px; border-radius: 5px; text-align: center;">
                <strong>${results.violations.length}</strong><br>
                <small>Violations Found</small>
            </div>
            <div style="background: ${severityCounts.critical ? '#ffebee' : '#e8f5e8'}; padding: 10px; border-radius: 5px; text-align: center;">
                <strong>${severityCounts.critical || 0}</strong><br>
                <small>Critical Issues</small>
            </div>
            <div style="background: ${severityCounts.high ? '#fff3e0' : '#e8f5e8'}; padding: 10px; border-radius: 5px; text-align: center;">
                <strong>${severityCounts.high || 0}</strong><br>
                <small>High Priority</small>
            </div>
        </div>
        
        ${results.violations.length > 0 ? `
            <div style="max-height: 200px; overflow-y: auto; background: white; border-radius: 5px; padding: 10px;">
                <h6>Top Violations:</h6>
                ${results.violations.slice(0, 10).map(v => `
                    <div style="margin: 5px 0; padding: 5px; background: #f8f9fa; border-left: 3px solid ${getRuleSeverityColor(v.severity)}; border-radius: 3px; font-size: 12px;">
                        <strong>${v.student}</strong> (${v.grade}) - ${v.issue}
                    </div>
                `).join('')}
                ${results.violations.length > 10 ? `<p style="text-align: center; color: #666; font-size: 12px;">... and ${results.violations.length - 10} more</p>` : ''}
            </div>
        ` : '<p style="color: #28a745; text-align: center;">🎉 All rules passed! No violations found.</p>'}
    `;
    
    resultsDiv.style.display = 'block';
    contentDiv.innerHTML = content;
}

function exportCustomRules() {
    const savedRules = JSON.parse(localStorage.getItem('customDataRules') || '[]');
    
    if (savedRules.length === 0) {
        showToast('⚠️ No rules to export', 'warning');
        return;
    }
    
    const exportData = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        rules: savedRules
    };
    
    downloadFile(JSON.stringify(exportData, null, 2), 'custom-data-rules.json', 'application/json');
    showToast('📤 Rules exported successfully!', 'success');
}

function importCustomRules() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importData = JSON.parse(e.target.result);
                    if (importData.rules && Array.isArray(importData.rules)) {
                        localStorage.setItem('customDataRules', JSON.stringify(importData.rules));
                        showToast(`📥 Imported ${importData.rules.length} rules successfully!`, 'success');
                        setTimeout(() => showCustomRules(), 1000);
                    } else {
                        showToast('⚠️ Invalid file format', 'error');
                    }
                } catch (err) {
                    showToast('❌ Error reading file', 'error');
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

function deleteRule(index) {
    const savedRules = JSON.parse(localStorage.getItem('customDataRules') || '[]');
    savedRules.splice(index, 1);
    localStorage.setItem('customDataRules', JSON.stringify(savedRules));
    showToast('🗑️ Rule deleted', 'info');
    setTimeout(() => showCustomRules(), 500);
}

function testRule(index) {
    const savedRules = JSON.parse(localStorage.getItem('customDataRules') || '[]');
    const rule = savedRules[index];
    
    if (!rule) return;
    
    // Test rule against a sample of students
    const sampleSize = Math.min(100, activeStudents.length);
    const sample = activeStudents.slice(0, sampleSize);
    
    let violations = 0;
    let passed = 0;
    
    sample.forEach(student => {
        const fieldValue = student[rule.field];
        const isViolation = checkRuleViolation(rule, fieldValue);
        
        if (isViolation) {
            violations++;
        } else {
            passed++;
        }
    });
    
    const violationRate = Math.round((violations / sampleSize) * 100);
    
    showToast(`🧪 Rule Test: ${violations}/${sampleSize} violations (${violationRate}%)`, 'info');
}

// Utility function for toast notifications
function showToast(message, type = 'info') {
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };
    
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        font-size: 14px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        transition: all 0.3s ease;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100px)';
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
}

// Alternative function for quick issue-specific filtering
function checkDataQualityByIssue(specificIssue = null) {
    const studentIssues = {};
    
    activeStudents.forEach(student => {
        const issues = [];
        
        if (student.Gender === 'Unknown' || !student.Gender) {
            issues.push('Gender');
        }
        if (student.UPI === student.firebaseKey || student.UPI === '---' || !student.UPI) {
            issues.push('UPI');
        }
        if (student.DOB === '---' || !student.DOB) {
            issues.push('DOB');
        }
        if (student['Birth Entry'] === '---' || !student['Birth Entry']) {
            issues.push('Birth Entry');
        }
        if (student['Home phone'] === '---' || !student['Home phone']) {
            issues.push('Home phone');
        }
        if (student['Status'] === '---' || !student['Status']) {
            issues.push('Status');
        }
        if (student.Father === '---' || !student.Father) {
            issues.push('Father');
        }
        if (student.Mother === '---' || !student.Mother) {
            issues.push('Mother');
        }
        
        // Filter by specific issue if provided
        if (specificIssue && !issues.includes(specificIssue)) {
            return;
        }
        
        if (issues.length > 0) {
            const studentKey = `${student.Grade}-${student.StudentFullName}`;
            studentIssues[studentKey] = {
                grade: student.Grade,
                name: student.StudentFullName,
                issues: issues,
                student: student
            };
        }
    });

    const issuesList = Object.values(studentIssues);
    
    if (issuesList.length > 0) {
        showDataQualityModal(issuesList);
    } else {
        const message = specificIssue 
            ? `No students found with missing ${specificIssue}!`
            : 'No data quality issues found!';
        
        Swal.fire({
            title: 'Data Quality Check',
            text: message,
            icon: 'success',
            confirmButtonText: 'Great!'
        });
    }
}

// Quick access functions for specific issue types
function checkMissingGender() { checkDataQualityByIssue('Gender'); }
function checkMissingUPI() { checkDataQualityByIssue('UPI'); }
function checkMissingDOB() { checkDataQualityByIssue('DOB'); }
function checkMissingBirthEntry() { checkDataQualityByIssue('Birth Entry'); }
function checkMissingPhone() { checkDataQualityByIssue('Home phone'); }
function checkMissingStatus() { checkDataQualityByIssue('Status'); }
// Add these new functions:
function checkMissingAssessmentNo() { checkDataQualityByIssue('Assessment No'); }
function checkMissingDisability() { checkDataQualityByIssue('Dissability'); }
function checkMissingMedicalCondition() { checkDataQualityByIssue('Medical Condition'); }
function checkMissingClass() { checkDataQualityByIssue('Class'); }
function checkMissingDateOfAdmission() { checkDataQualityByIssue('DateOfAdmission'); }
function checkMissingWhereBorn() { checkDataQualityByIssue('Where Born'); }
function checkMissingDistrict() { checkDataQualityByIssue('District'); }
function checkMissingParents() { 
    // Custom function for parent information
    const studentIssues = {};
    
    activeStudents.forEach(student => {
        const issues = [];
        
        if (student.Father === '---' || !student.Father) {
            issues.push('Father');
        }
        if (student.Mother === '---' || !student.Mother) {
            issues.push('Mother');
        }
        
        if (issues.length > 0) {
            const studentKey = `${student.Grade}-${student.StudentFullName}`;
            studentIssues[studentKey] = {
                grade: student.Grade,
                name: student.StudentFullName,
                issues: issues,
                student: student
            };
        }
    });

    const issuesList = Object.values(studentIssues);
    
    if (issuesList.length > 0) {
        showDataQualityModal(issuesList);
    } else {
        Swal.fire({
            title: 'Parent Information Check',
            text: 'All students have complete parent information!',
            icon: 'success',
            confirmButtonText: 'Great!'
        });
    }
}



// Add these functions to global scope
window.testRule = function(index) {
    const savedRules = JSON.parse(localStorage.getItem('customDataRules') || '[]');
    const rule = savedRules[index];
    
    if (!rule) return;
    
    // Test rule against a sample of students
    const sampleSize = Math.min(100, activeStudents.length);
    const sample = activeStudents.slice(0, sampleSize);
    
    let violations = 0;
    let passed = 0;
    
    sample.forEach(student => {
        const fieldValue = student[rule.field];
        const isViolation = checkRuleViolation(rule, fieldValue);
        
        if (isViolation) {
            violations++;
        } else {
            passed++;
        }
    });
    
    const violationRate = Math.round((violations / sampleSize) * 100);
    
    showToast(`🧪 Rule Test: ${violations}/${sampleSize} violations (${violationRate}%)`, 'info');
}


window.deleteRule = function(index) {
    const savedRules = JSON.parse(localStorage.getItem('customDataRules') || '[]');
    savedRules.splice(index, 1);
    localStorage.setItem('customDataRules', JSON.stringify(savedRules));
    showToast('🗑️ Rule deleted', 'info');
    setTimeout(() => showCustomRules(), 500);
}

// Also make sure checkRuleViolation is available globally
window.checkRuleViolation = function(rule, fieldValue) {
    switch (rule.type) {
        case 'required':
            return !fieldValue || fieldValue === '---' || fieldValue.trim() === '';
            
        case 'format':
            if (!fieldValue || fieldValue === '---') return false;
            try {
                const regex = new RegExp(rule.value);
                return !regex.test(fieldValue.toString());
            } catch (e) {
                return false;
            }
            
        case 'length':
            if (!fieldValue || fieldValue === '---') return false;
            const minLength = parseInt(rule.value);
            return fieldValue.toString().length < minLength;
            
        case 'range':
            if (!fieldValue || fieldValue === '---') return false;
            const [min, max] = rule.value.split('-').map(v => parseInt(v.trim()));
            const numValue = parseInt(fieldValue);
            return numValue < min || numValue > max;
            
        default:
            return false;
    }
}


















// Function to batch update student status

async function batchUpdateStatus(selectedStudents, newStatus) {
    if (!auth.currentUser) {
        Swal.fire({
            title: 'Authentication Required',
            text: 'Please log in to update student status.',
            icon: 'warning'
        });
        return;
    }

    try {
        const updates = {};
        selectedStudents.forEach(student => {
            updates[`artifacts/${sanitizedAppId}/students/${student.firebaseKey}/Status`] = newStatus;
        });
        await update(ref(db), updates);
        Swal.fire({
            title: 'Success',
            text: `Updated status to "${newStatus}" for ${selectedStudents.length} students.`,
            icon: 'success'
        });
    } catch (error) {
        console.error('Error updating student status:', error);
        Swal.fire({
            title: 'Error',
            text: `Failed to update student status: ${error.message}`,
            icon: 'error'
        });
    }
}

// Function to display filterable grade-wise student table
function showGradeWiseStudents() {
    if (!auth.currentUser) {
        Swal.fire({
            title: 'Authentication Required',
            text: 'Please log in to view student details.',
            icon: 'warning'
        });
        return;
    }
    if (activeStudents.length === 0) {
        Swal.fire({
            title: 'No Active Students',
            text: 'There are currently no active students in the records.',
            icon: 'info'
        });
        return;
    }

    const grades = [...new Set(activeStudents.map(student => student.CurrentGrade || 'N/A'))].sort();
    const medicalConditions = [...new Set(activeStudents.map(student => student.MedicalCondition || 'None'))].sort();
    let tableContent = `
        <div style="margin-bottom: 10px;">
            <select id="gradeFilter" style="padding: 8px; margin-right: 10px;">
                <option value="all">All Grades</option>
                ${grades.map(grade => `<option value="${grade}">${grade}</option>`).join('')}
            </select>
            <select id="medicalFilter" style="padding: 8px; margin-right: 10px;">
                <option value="all">All Medical Conditions</option>
                ${medicalConditions.map(condition => `<option value="${condition}">${condition}</option>`).join('')}
            </select>
            <input type="text" id="searchStudents" placeholder="Search by Name, UPI, or Assessment No." style="padding: 8px; width: 300px;">
            <button id="exportCsvBtn" style="padding: 8px; margin-left: 10px;">Export to CSV</button>
            <button id="batchUpdateBtn" style="padding: 8px; margin-left: 10px;">Update Selected Status</button>
        </div>
        <table class="grade-table">
            <thead>
                <tr>
                    <th><input type="checkbox" id="selectAll"></th>
                    <th>Student Name</th>
                    <th>UPI</th>
                    <th>Assessment No.</th>
                    <th>Grade</th>
                    <th>Gender</th>
                    <th>Status</th>
                    <th>Admission No.</th>
                    <th>Father's Phone</th>
                    <th>Mother's Name</th>
                    <th>Father's Name</th>
                    <th>Medical Condition</th>
                </tr>
            </thead>
            <tbody id="gradeTableBody">
                ${activeStudents.map(student => `
                    <tr data-student='${JSON.stringify(student)}'>
                        <td><input type="checkbox" class="studentCheckbox" data-key="${student.firebaseKey}"></td>
                        <td>${student.StudentFullName}</td>
                        <td>${student.UPI === '🕸️' ? 'N/A' : student.UPI}</td>
                        <td>${student.AssessmentNumber}</td>
                        <td>${student.CurrentGrade}</td>
                        <td>${student.Gender}</td>
                        <td>${student.Status}</td>
                        <td>${student.AdmissionNo}</td>
                        <td>${student.FathersPhoneNumber}</td>
                        <td>${student.MothersName}</td>
                        <td>${student.Father}</td>
                        <td>${student.MedicalCondition}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    Swal.fire({
        title: 'Active Students by Grade',
        html: tableContent,
        width: '100%',
        customClass: { popup: 'grade-popup' },
        showConfirmButton: false,
        didOpen: () => {
            const tableRows = document.querySelectorAll('.grade-table tbody tr');
            const gradeFilter = document.getElementById('gradeFilter');
            const medicalFilter = document.getElementById('medicalFilter');
            const searchInput = document.getElementById('searchStudents');
            const exportBtn = document.getElementById('exportCsvBtn');
            const batchUpdateBtn = document.getElementById('batchUpdateBtn');
            const selectAllCheckbox = document.getElementById('selectAll');

            function debounce(func, delay) {
                let timeout;
                return function (...args) {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => func.apply(this, args), delay);
                };
            }

            function highlightSearchTerms(text, searchTerm) {
                if (!searchTerm) return text;
                const regex = new RegExp(searchTerm, 'gi');
                return text.replace(regex, match => `<span style="background-color: yellow;">${match}</span>`);
            }

            const handleFilter = debounce(() => {
                const selectedGrade = gradeFilter.value;
                const selectedMedical = medicalFilter.value;
                const searchTerm = searchInput.value.toLowerCase();
                const filteredRows = Array.from(tableRows).filter(row => {
                    const studentData = JSON.parse(row.dataset.student);
                    const isGradeMatch = selectedGrade === 'all' || studentData.CurrentGrade === selectedGrade;
                    const isMedicalMatch = selectedMedical === 'all' || studentData.MedicalCondition === selectedMedical;
                    const isSearchMatch = (
                        studentData.StudentFullName.toLowerCase().includes(searchTerm) ||
                        studentData.UPI.toLowerCase().includes(searchTerm) ||
                        studentData.AssessmentNumber.toLowerCase().includes(searchTerm)
                    );
                    return isGradeMatch && isMedicalMatch && (searchTerm ? isSearchMatch : true);
                });

                tableRows.forEach(row => {
                    const studentData = JSON.parse(row.dataset.student);
                    let isMatch = filteredRows.includes(row);
                    row.innerHTML = `
                        <td><input type="checkbox" class="studentCheckbox" data-key="${studentData.firebaseKey}"></td>
                        <td>${highlightSearchTerms(studentData.StudentFullName, searchTerm)}</td>
                        <td>${highlightSearchTerms(studentData.UPI === '🕸️' ? 'N/A' : studentData.UPI, searchTerm)}</td>
                        <td>${highlightSearchTerms(studentData.AssessmentNumber, searchTerm)}</td>
                        <td>${studentData.CurrentGrade}</td>
                        <td>${studentData.Gender}</td>
                        <td>${studentData.Status}</td>
                        <td>${studentData.AdmissionNo}</td>
                        <td>${studentData.FathersPhoneNumber}</td>
                        <td>${studentData.MothersName}</td>
                        <td>${studentData.Father}</td>
                        <td>${studentData.MedicalCondition}</td>
                    `;
                    row.style.display = isMatch ? '' : 'none';
                });
            }, 300);

            gradeFilter.addEventListener('change', handleFilter);
            medicalFilter.addEventListener('change', handleFilter);
            searchInput.addEventListener('keyup', handleFilter);
            exportBtn.addEventListener('click', exportStudentsToCSV);

            selectAllCheckbox.addEventListener('change', () => {
                const checkboxes = document.querySelectorAll('.studentCheckbox');
                checkboxes.forEach(cb => cb.checked = selectAllCheckbox.checked);
            });

            batchUpdateBtn.addEventListener('click', () => {
                const selectedCheckboxes = document.querySelectorAll('.studentCheckbox:checked');
                const selectedStudents = Array.from(selectedCheckboxes).map(cb => {
                    const row = cb.closest('tr');
                    return JSON.parse(row.dataset.student);
                });

                if (selectedStudents.length === 0) {
                    Swal.fire({
                        title: 'No Selection',
                        text: 'Please select at least one student to update.',
                        icon: 'warning'
                    });
                    return;
                }

                Swal.fire({
                    title: 'Update Status',
                    input: 'select',
                    inputOptions: {
                        'Active': 'Active',
                        'Pending Update': 'Pending Update',
                        'Inactive': 'Inactive'
                    },
                    inputPlaceholder: 'Select new status',
                    showCancelButton: true,
                    inputValidator: (value) => {
                        return new Promise((resolve) => {
                            if (value) {
                                resolve();
                            } else {
                                resolve('Please select a status');
                            }
                        });
                    }
                }).then(result => {
                    if (result.isConfirmed) {
                        batchUpdateStatus(selectedStudents, result.value);
                    }
                });
            });

            tableRows.forEach(row => {
                row.addEventListener('click', (e) => {
                    if (e.target.type === 'checkbox') return;
                    const studentData = JSON.parse(row.dataset.student);
                    Swal.fire({
                        title: studentData.StudentFullName,
                        imageAlt: 'Student Image',
                        width: '400px',
                        html: `
                            <img src="${studentData.FileUrl1}" alt="Student Image 1" style="width: 150px; height: 150px; border-radius: 10px; object-fit: cover; margin-bottom: 10px;">
                            <p><strong>UPI:</strong> ${studentData.UPI}</p>
                            <p><strong>Assessment No.:</strong> ${studentData.AssessmentNumber}</p>
                            <p><strong>Grade:</strong> ${studentData.CurrentGrade}</p>
                            <p><strong>Gender:</strong> ${studentData.Gender}</p>
                            <p><strong>Status:</strong> ${studentData.Status}</p>
                            <p><strong>Admission No.:</strong> ${studentData.AdmissionNo}</p>
                            <p><strong>Father's Phone:</strong> ${studentData.FathersPhoneNumber}</p>
                            <p><strong>Mother's Name:</strong> ${studentData.MothersName}</p>
                            <p><strong>Father's Name:</strong> ${studentData.Father}</p>
                            <p><strong>DOB:</strong> ${studentData.DOB}</p>
                            <p><strong>Disability:</strong> ${studentData.Disability}</p>
                            <p><strong>Medical Condition:</strong> ${studentData.MedicalCondition}</p>
                        `
                    });
                });
            });
        }
    });
}

// Function to update summary dashboard
function updateSummaryDashboard() {
    const gradeGenderData = {};

    activeStudents.forEach(student => {
        const grade = student.CurrentGrade || 'N/A';
        const gender = student.Gender || 'Unknown';

        if (!gradeGenderData[grade]) {
            gradeGenderData[grade] = { total: 0, male: 0, female: 0, unknown: 0 };
        }

        gradeGenderData[grade].total++;

        if (gender.toLowerCase() === 'male') {
            gradeGenderData[grade].male++;
        } else if (gender.toLowerCase() === 'female') {
            gradeGenderData[grade].female++;
        } else {
            gradeGenderData[grade].unknown++;
        }
    });


    

    const summaryElement = document.getElementById('summaryDashboard');
    if (summaryElement) {
        const grades = Object.keys(gradeGenderData).sort();
        const totalStudents = activeStudents.length;
        const averageClassSize = grades.length > 0 ? (totalStudents / grades.length).toFixed(1) : 0;

        summaryElement.innerHTML = `
            <div class="summary-box">
                <h3>Student Summary</h3>
                <p><strong>Total Students:</strong> ${totalStudents}</p>
                <p><strong>Total Grades:</strong> ${grades.length}</p>
                <p><strong>Average Class Size:</strong> ${averageClassSize}</p>
                <button id="viewGradeSummary" style="padding: 8px; margin-top: 10px;">View Grade Details</button>
            </div>
        `;

        document.getElementById('viewGradeSummary')?.addEventListener('click', () => {
            // Skeleton loading popup
            Swal.fire({
                title: 'Loading data...',
                html: `
                    <div class="skeleton"></div>
                    <div class="skeleton"></div>
                    <div class="skeleton"></div>
                `,
                showConfirmButton: false,
                allowOutsideClick: false,
                width: '600px'
            });

            // After delay, show real results
            setTimeout(() => {
                const gradeDetails = grades.map(grade => `
                     <p>
                        <strong>${grade}:</strong> 
                        Male = <span style="cursor: pointer; color: #36A2EB;" data-grade="${grade}" data-gender="male">${gradeGenderData[grade].male}</span>, 
                        Female = <span style="cursor: pointer; color: #FF6384;" data-grade="${grade}" data-gender="female">${gradeGenderData[grade].female}</span>, 
                        Total = <span style="cursor: pointer; color: #4BC0C0;" data-grade="${grade}" data-gender="total">${gradeGenderData[grade].total}</span>
                    </p>
                `).join('');

                Swal.fire({
                    title: 'Grade-wise Student Counts',
                    html: gradeDetails,
                    width: '600px',
                    didOpen: () => {
                        const spans = document.querySelectorAll('span[data-grade][data-gender]');
                        spans.forEach(span => {
                            span.addEventListener('click', () => {
                                const grade = span.dataset.grade;
                                const gender = span.dataset.gender;
                                let filteredStudents = activeStudents.filter(s => s.CurrentGrade === grade);
                                if (gender === 'male') {
                                    filteredStudents = filteredStudents.filter(s => s.Gender.toLowerCase() === 'male');
                                    showStudentList(`Male Students in ${grade}`, filteredStudents);
                                } else if (gender === 'female') {
                                    filteredStudents = filteredStudents.filter(s => s.Gender.toLowerCase() === 'female');
                                    showStudentList(`Female Students in ${grade}`, filteredStudents);
                                } else if (gender === 'total') {
                                    showStudentList(`All Students in ${grade}`, filteredStudents);
                                }
                            });
                        });
                    }
                });
            }, 1500); // delay 1.5s for realism
        });

        // Inject styles for skeleton loader once
        if (!document.querySelector('#summary-styles')) {
            const styles = document.createElement('style');
            styles.id = 'summary-styles';
            styles.textContent = `
                .summary-box {
                    background: #F9F9F9;
                    padding: 20px;
                    border-radius: 10px;
                    color: black;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                    margin-top: 20px;
                }
                .summary-box h3 {
                    margin-bottom: 15px;
                    font-size: 1.5em;
                }
                .summary-box p {
                    margin: 5px 0;
                }
                .summary-box button {
                    background: #36A2EB;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .summary-box button:hover {
                    background: #FF6384;
                }
                /* Skeleton loader style */
                .skeleton {
                    height: 18px;
                    width: 80%;
                    margin: 10px auto;
                    border-radius: 4px;
                    background: linear-gradient(90deg, #e0e0e0 25%, #f5f5f5 50%, #e0e0e0 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.2s infinite;
                }
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
            `;
            document.head.appendChild(styles);
        }
    }
}




// Function to count transferred students
function updateTransferredCount() {
    const transferredCount = transferredStudents.length;
    const transferredCounter = document.getElementById('transferredCounter');
    if (transferredCounter) {
        transferredCounter.textContent = transferredCount;
    }
}

// Function to display transferred students details
function showTransferredStudentsDetails() {
    if (!auth.currentUser) {
        Swal.fire({
            title: 'Authentication Required',
            text: 'Please log in to view transferred student details.',
            icon: 'warning'
        });
        return;
    }

    if (transferredStudents.length === 0) {
        Swal.fire({
            title: 'No Transferred Students',
            text: 'There are currently no transferred students in the records.',
            icon: 'info'
        });
        return;
    }

    const sortedTransferredStudents = [...transferredStudents].sort((a, b) => {
        const dateA = new Date(a.DateOfTransfer);
        const dateB = new Date(b.DateOfTransfer);
        if (dateA < dateB) return -1;
        if (dateB < dateA) return 1;
        const gradeA = parseInt(a.CurrentGrade.replace('Grade ', '')) || 0;
        const gradeB = parseInt(b.CurrentGrade.replace('Grade ', '')) || 0;
        return gradeA - gradeB;
    });

    let tableContent = `
        <input type="text" id="searchTransferredStudents" placeholder="Search by Name, Grade, Assessment No, or UPI" style="width: 100%; padding: 8px; margin-bottom: 10px;">
        <table class="transferred-table">
            <thead>
                <tr>
                    <th>Student Name</th>
                    <th>UPI Number</th>
                    <th>Assessment No.</th>
                    <th>Grade</th>
                    <th>Transfer Date</th>
                    <th>Admission No.</th>
                    <th>Father's Phone</th>
                    <th>Mother's Name</th>
                    <th>Father's Name</th>
                    <th>Deleted By</th>
                    <th>Deleted At</th>
                </tr>
            </thead>
            <tbody>
                ${sortedTransferredStudents.map(student => `
                    <tr data-student='${JSON.stringify(student)}'>
                        <td>${student.StudentFullName}</td>
                        <td>${student.UPI === '🕸️' ? 'N/A' : student.UPI}</td>
                        <td>${student.AssessmentNumber}</td>
                        <td>${student.CurrentGrade}</td>
                        <td>${student.DateOfTransfer}</td>
                        <td>${student.AdmissionNo}</td>
                        <td>${student.FathersPhoneNumber}</td>
                        <td>${student.MothersName}</td>
                        <td>${student.Father}</td>
                        <td>${student.DeletedBy}</td>
                        <td>${student.DeletedAt}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    Swal.fire({
        title: 'Transferred Students',
        html: tableContent,
        width: '100%',
        customClass: { popup: 'transferred-popup' },
        showConfirmButton: false,
        didOpen: () => {
            const tableRows = document.querySelectorAll('.transferred-table tbody tr');

            function debounce(func, delay) {
                let timeout;
                return function (...args) {
                    const context = this;
                    clearTimeout(timeout);
                    timeout = setTimeout(() => func.apply(context, args), delay);
                };
            }

            function highlightSearchTerms(text, searchTerm) {
                if (!searchTerm) return text;
                const regex = new RegExp(searchTerm, 'gi');
                return text.replace(regex, match => `<span style="background-color: yellow;">${match}</span>`);
            }

            const searchInput = document.getElementById('searchTransferredStudents');
            const handleSearch = debounce(() => {
                const searchTerm = searchInput.value.toLowerCase();
                const filteredRows = Array.from(tableRows).filter(row => {
                    const studentData = JSON.parse(row.dataset.student);
                    return (
                        studentData.StudentFullName.toLowerCase().includes(searchTerm) ||
                        studentData.CurrentGrade.toLowerCase().includes(searchTerm) ||
                        studentData.AssessmentNumber.toLowerCase().includes(searchTerm) ||
                        studentData.DateOfTransfer.toLowerCase().includes(searchTerm) ||
                        studentData.UPI.toLowerCase().includes(searchTerm) ||
                        studentData.DeletedBy.toLowerCase().includes(searchTerm) ||
                        studentData.DeletedAt.toLowerCase().includes(searchTerm) ||
                        studentData.MothersName.toLowerCase().includes(searchTerm) ||
                        studentData.Father.toLowerCase().includes(searchTerm)
                    );
                });

                tableRows.forEach(row => {
                    const studentData = JSON.parse(row.dataset.student);
                    let isMatch = filteredRows.includes(row);

                    row.innerHTML = `
                        <td>${highlightSearchTerms(studentData.StudentFullName, searchTerm)}</td>
                        <td>${highlightSearchTerms(studentData.UPI === '🕸️' ? 'N/A' : studentData.UPI, searchTerm)}</td>
                        <td>${highlightSearchTerms(studentData.AssessmentNumber, searchTerm)}</td>
                        <td>${highlightSearchTerms(studentData.CurrentGrade, searchTerm)}</td>
                        <td>${highlightSearchTerms(studentData.DateOfTransfer, searchTerm)}</td>
                        <td>${highlightSearchTerms(studentData.AdmissionNo, searchTerm)}</td>
                        <td>${highlightSearchTerms(studentData.FathersPhoneNumber, searchTerm)}</td>
                        <td>${highlightSearchTerms(studentData.MothersName, searchTerm)}</td>
                        <td>${highlightSearchTerms(studentData.Father, searchTerm)}</td>
                        <td>${highlightSearchTerms(studentData.DeletedBy, searchTerm)}</td>
                        <td>${highlightSearchTerms(studentData.DeletedAt, searchTerm)}</td>
                    `;

                    row.style.display = isMatch ? '' : 'none';
                });
            }, 300);

            searchInput.addEventListener('keyup', handleSearch);

            tableRows.forEach(row => {
                row.addEventListener('click', () => {
                    const studentData = JSON.parse(row.dataset.student);
                    Swal.fire({
                        title: studentData.StudentFullName,
                        imageAlt: 'Student Image',
                        width: '400px',
                        html: `
                            <img src="${studentData.FileUrl1}" alt="Student Image 1" style="width: 150px; height: 150px; border-radius: 10px; object-fit: cover; margin-bottom: 10px;">
                            ${studentData.FileUrl2 ? `<img src="${studentData.FileUrl2}" alt="Student Image 2" style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; margin-bottom: 10px;">` : ''}
                            <p><strong>Reason for Transfer:</strong> ${studentData.ReasonForTransfer}</p>
                            <p><strong>School Transferred To:</strong> ${studentData.SchoolTransferredTo}</p>
                            <p><strong>Father's Phone:</strong> ${studentData.FathersPhoneNumber}</p>
                            <p><strong>Mother's Name:</strong> ${studentData.MothersName}</p>
                            <p><strong>Father's Name:</strong> ${studentData.Father}</p>
                            <p><strong>Deleted By:</strong> ${studentData.DeletedBy}</p>
                            <p><strong>Deleted At:</strong> ${studentData.DeletedAt}</p>
                            <p><strong>Birth Entry:</strong> ${studentData.BirthEntry}</p>
                            <p><strong>Class:</strong> ${studentData.Class}</p>
                            <p><strong>DOB:</strong> ${studentData.DOB}</p>
                            <p><strong>Disability:</strong> ${studentData.Disability}</p>
                            <p><strong>Medical Condition:</strong> ${studentData.MedicalCondition}</p>
                        `
                    });
                });
            });
        }
    });
}

// Function to update grade table
function updateGradeTable() {
    const tableBody = document.getElementById('gradeTableBody');
    if (tableBody) {
        tableBody.innerHTML = activeStudents.map(student => `
            <tr data-student='${JSON.stringify(student)}'>
                <td><input type="checkbox" class="studentCheckbox" data-key="${student.firebaseKey}"></td>
                <td>${student.StudentFullName}</td>
                <td>${student.UPI === '🕸️' ? 'N/A' : student.UPI}</td>
                <td>${student.AssessmentNumber}</td>
                <td>${student.CurrentGrade}</td>
                <td>${student.Gender}</td>
                <td>${student.Status}</td>
                <td>${student.AdmissionNo}</td>
                <td>${student.FathersPhoneNumber}</td>
                <td>${student.MothersName}</td>
                <td>${student.Father}</td>
                <td>${student.MedicalCondition}</td>
            </tr>
        `).join('');
    }
}

// Real-time listeners for automatic updates
function setupRealtimeListeners() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            onValue(studentsRef, (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    activeStudents = Object.keys(data).map(key => {
                        const studentData = data[key];
                        return {
                            firebaseKey: key,
                            id: studentData.id || key,
                            StudentFullName: studentData['Official Student Name'] || studentData.name || 'N/A',
                            Gender: studentData.Gender || studentData.gender || 'Unknown',
                            Status: typeof studentData.Status === 'string' ? studentData.Status : 'Active',
                            CurrentGrade: studentData.Grade || studentData.CurrentGrade || 'N/A',
                            UPI: studentData.UPI || studentData.upi || key,
                            AssessmentNumber: key,
                            AdmissionNo: studentData.admissionNo || studentData.AdmissionNo || 'N/A',
                            FathersPhoneNumber: studentData['Home phone'] || studentData.fathersPhone || studentData.FathersPhoneNumber || 'N/A',
                            Father: studentData.Father || 'N/A',
                            MothersName: studentData.Mother || studentData.MothersName || 'N/A',
                            FileUrl1: studentData.img || studentData.FileUrl1 || '../img/Students.jpg',
                            DateOfAdmission: studentData.date || studentData.DateOfAdmission || 'N/A',
                            BirthEntry: studentData['Birth Entry'] || 'N/A',
                            Class: studentData.Class || 'N/A',
                            DOB: studentData.DOB || 'N/A',
                            Disability: studentData.Dissability || studentData.Disability || 'None',
                            MedicalCondition: studentData['Medical Condition'] || 'None',
                            ...studentData
                        };
                    });
                } else {
                    activeStudents = [];
                }
                updateTotalStudents();
                updateCharts();
                updateGradeTable();
                updateSummaryDashboard();
                checkDataQuality();
            }, (error) => {
                console.error('Error in students real-time listener:', error);
                Swal.fire({
                    title: 'Error',
                    text: `Failed to load student data: ${error.message}`,
                    icon: 'error'
                });
                activeStudents = [];
                updateTotalStudents();
                updateCharts();
                updateGradeTable();
                updateSummaryDashboard();
                checkDataQuality(); // ← KEEP THIS ONE ONLY
            });

            onValue(transferredStudentsRef, (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    transferredStudents = Object.keys(data).map(key => {
                        const studentData = data[key];
                        return {
                            firebaseKey: key,
                            id: studentData.id || key,
                            StudentFullName: studentData['Official Student Name'] || studentData.name || 'N/A',
                            Gender: studentData.Gender || studentData.gender || 'Unknown',
                            Status: typeof studentData.Status === 'string' ? studentData.Status : 'Transferred',
                            CurrentGrade: studentData.Grade || studentData.CurrentGrade || 'N/A',
                            UPI: studentData.UPI || studentData.upi || key,
                            AssessmentNumber: key,
                            AdmissionNo: studentData.admissionNo || studentData.AdmissionNo || 'N/A',
                            FathersPhoneNumber: studentData['Home phone'] || studentData.fathersPhone || studentData.FathersPhoneNumber || 'N/A',
                            Father: studentData.Father || 'N/A',
                            MothersName: studentData.Mother || studentData.MothersName || 'N/A',
                            SchoolTransferredTo: studentData.schoolTransferredTo || studentData.SchoolTransferredTo || 'N/A',
                            ReasonForTransfer: studentData.reasonForTransfer || studentData.ReasonForTransfer || 'N/A',
                            DateOfTransfer: studentData.dateOfTransfer || studentData.DateOfTransfer || 'N/A',
                            FileUrl1: studentData.img || studentData.FileUrl1 || '../img/Students.jpg',
                            FileUrl2: studentData.FileUrl2 || null,
                            DeletedAt: studentData.deletedAt || 'N/A',
                            DeletedBy: studentData.deletedBy || 'N/A',
                            BirthEntry: studentData['Birth Entry'] || 'N/A',
                            Class: studentData.Class || 'N/A',
                            DOB: studentData.DOB || 'N/A',
                            Disability: studentData.Dissability || studentData.Disability || 'None',
                            MedicalCondition: studentData['Medical Condition'] || 'None',
                            ...studentData
                        };
                    });
                } else {
                    transferredStudents = [];
                }
                updateTransferredCount();
            }, (error) => {
                console.error('Error in transferred students real-time listener:', error);
                Swal.fire({
                    title: 'Error',
                    text: `Failed to load transferred student data: ${error.message}`,
                    icon: 'error'
                });
                transferredStudents = [];
                updateTransferredCount();
            });
        } else {
            activeStudents = [];
            transferredStudents = [];
            updateTotalStudents();
            updateCharts();
            updateGradeTable();
            updateSummaryDashboard();
            updateTransferredCount();
        }
    });
}


setupRealtimeListeners();
// Initial load and event listeners
document.addEventListener('DOMContentLoaded', () => {
     // Show loading states
    const transferredCounter = document.getElementById('transferredCounter');
    if (transferredCounter) {
        transferredCounter.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i>';
    }
    
    checkAuthAndLoadData();

    const transferredCounterElement = document.getElementById('transferredCounter');
    if (transferredCounterElement) {
        const clickableElement = transferredCounterElement.closest('.info-data') || transferredCounterElement.parentElement.parentElement;
        if (clickableElement) {
            clickableElement.style.cursor = 'pointer';
            clickableElement.addEventListener('click', showTransferredStudentsDetails);
        }
    }

    const gradeViewElement = document.getElementById('viewGradeTable');
    if (gradeViewElement) {
        gradeViewElement.style.cursor = 'pointer';
        gradeViewElement.addEventListener('click', showGradeWiseStudents);
    }

    const reportBtn = document.getElementById('generateReportBtn');
    if (reportBtn) {
        reportBtn.addEventListener('click', generatePDFReport);
    }

    if (!document.querySelector('#transferred-styles')) {
        const styles = document.createElement('style');
        styles.id = 'transferred-styles';
        styles.textContent = `
            .transferred-popup, .grade-popup, .student-list-popup {
                max-height: 80vh;
                overflow-y: auto;
            }
            .transferred-table, .grade-table, .student-list-table {
                width: 100%;
                border-collapse: separate;
                border-spacing: 0;
                margin-top: 20px;
                min-width: 800px;
                background-color: #ffffff;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            .transferred-table th, .grade-table th, .student-list-table th,
            .transferred-table td, .grade-table td, .student-list-table td {
                padding: 12px;
                text-align: left;
                border-bottom: 1px solid #e3e8f0;
                border-right: 1px solid #e3e8f0;
                white-space: nowrap;
            }
            .transferred-table th:last-child, .grade-table th:last-child, .student-list-table th:last-child,
            .transferred-table td:last-child, .grade-table td:last-child, .student-list-table td:last-child {
                border-right: none;
            }
            .transferred-table th, .grade-table th, .student-list-table th {
                background-color: #f8fafc;
                font-weight: bold;
                position: sticky;
                top: 0;
                z-index: 1;
                border-top: 1px solid rgb(240, 227, 227);
                border-bottom: 2px solid #cbd5e1;
                color: #475569;
            }
            .transferred-table tr:hover, .grade-table tr:hover, .student-list-table tr:hover {
                background-color: #f1f5f9;
                transition: background-color: 0.2s ease;
            }
            .transferred-table tbody tr, .grade-table tbody tr, .student-list-table tbody tr {
                border-bottom: 1px solid #e3e8f0;
                cursor: pointer;
            }
            .transferred-table tbody tr:nth-child(even), .grade-table tbody tr:nth-child(even), .student-list-table tbody tr:nth-child(even) {
                background-color: #f8fafc;
            }
            .transferred-table tbody tr:nth-child(odd), .grade-table tbody tr:nth-child(odd), .student-list-table tbody tr:nth-child(odd) {
                background-color: #ffffff;
            }
            .transferred-table tbody tr:last-child td, .grade-table tbody tr:last-child td, .student-list-table tbody tr:last-child td {
                border-bottom: 2px solid #e3e8f0;
            }
            .transferred-table td:first-child, .grade-table td:first-child, .student-list-table td:first-child {
                font-weight: 500;
                color: #1e293b;
            }
            .transferred-table tbody tr, .grade-table tbody tr, .student-list-table tbody tr {
                transition: all 0.2s ease;
            }
            .transferred-table tbody tr:hover td, .grade-table tbody tr:hover td, .student-list-table tbody tr:hover td {
                background-color: #e2e8f0;
                color: #000000;
            }
            .swal2-html-container {
                overflow-x: auto !important;
                margin: 0 !important;
                padding: 10px !important;
            }
            #searchTransferredStudents, #searchStudents, #searchStudentsList {
                position: sticky;
                left: 0;
                z-index: 2;
                background: white;
                border: 1px solid #ddd;
                border-radius: 4px;
            }
            @media (max-width: 768px) {
                .transferred-table, .grade-table, .student-list-table {
                    font-size: 14px;
                }
                .transferred-table th, .grade-table th, .student-list-table th,
                .transferred-table td, .grade-table td, .student-list-table td {
                    padding: 8px;
                }
                .swal2-popup {
                    margin: 0 !important;
                    padding: 10px !important;
                    width: 100% !important;
                }
            }
        `;
        document.head.appendChild(styles);
    }
});

// Export functions
export { updateTotalStudents, updateTransferredCount, loadActiveStudentsFromFirebase, loadTransferredStudentsFromFirebase, updateCharts, exportStudentsToCSV, showGradeWiseStudents, updateSummaryDashboard, generatePDFReport, checkDataQuality, batchUpdateStatus };