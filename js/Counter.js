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
            checkDataQuality();
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
        checkDataQuality();
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

// // Function to check data quality
// function checkDataQuality() {
//     const issues = [];
//     activeStudents.forEach(student => {
//         if (student.Gender === 'Unknown' || !student.Gender) {
//             issues.push(`<b>${student.Grade}</b> Student<b> ${student.StudentFullName}</b> has missing or invalid Gender`);
//         }
//         if (student.UPI === student.firebaseKey || student.UPI === '---' || !student.UPI) {
//             issues.push(`<b>${student.Grade}</b> Student <b>${student.StudentFullName}</b> has missing UPI`);
//         }
//         if (student.DOB === '---' || !student.DOB) {
//             issues.push(`<b>${student.Grade}</b> Student <b>${student.StudentFullName}</b> has missing DOB`);
//         }
//     });

//     if (issues.length > 0) {
//         Swal.fire({
//             title: 'Data Quality Issues',
//             html: `<ul>${issues.map(issue => `<li>${issue}</li>`).join('')}</ul>`,
//             icon: 'warning',
//             confirmButtonText: 'OK'
//         });
//     }
// }









// // Function to check data quality
// function checkDataQuality() {
//     const studentIssues = {};
    
//     activeStudents.forEach(student => {
//         const issues = [];
        
//         if (student.Gender === 'Unknown' || !student.Gender) {
//             issues.push('or invalid Gender');
//         }
//         if (student.UPI === student.firebaseKey || student.UPI === '---' || !student.UPI) {
//             issues.push('UPI');
//         }
//         if (student.DOB === '---' || !student.DOB) {
//             issues.push('DOB');
//         }

//         if (student['Birth Entry'] === '---' || !student['Birth Entry']) {
//             issues.push('Birth Entry');
//         }
        

//         if (student['Home phone'] === '---' || !student['Home phone']) {
//             issues.push('Home phone');
//         }
        

//         if (student['Status'] === '---' || !student['Status']) {
//             issues.push('Status ');
//         }

//         if (student.Father === '---' || !student.Father) {
//             issues.push('Father');
//         }

//         if (student.Mother === '---' || !student.Mother) {
//             issues.push('Mother');
//         }
        
//         if (issues.length > 0) {
//             const studentKey = `${student.Grade}-${student.StudentFullName}`;
//             studentIssues[studentKey] = {
//                 grade: student.Grade,
//                 name: student.StudentFullName,
//                 issues: issues
//             };
//         }
//     });

//     const issuesList = Object.values(studentIssues);
    
//     if (issuesList.length > 0) {
//         const htmlContent = issuesList.map((student, index) => 
//             `<li><b>${index + 1}.</b> <b>${student.grade}</b> Student <b>${student.name}</b> has missing <b  style="color:red;">${student.issues.join(', ')}</b></li>`
//         ).join('');
        
//         Swal.fire({
//             title: 'Data Quality Issues',
//             html: `<h2 style="background-color: #fff; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); padding: 5px;"><b>Total students with issues: ${issuesList.length}</b></h2><ul><hr>${htmlContent}</ul> `,
//             icon: 'warning',
//             confirmButtonText: 'OK'
//         });
//     }
// }










// Function to check data quality with search and filtering
























// Data Quality Functions - No exports, direct function declarations
// Include this directly in your main JavaScript file after Firebase imports

function checkDataQuality() {
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
        showFastEditModal(issuesList);
    } else {
        Swal.fire({
            title: 'Data Quality Check',
            text: 'No data quality issues found!',
            icon: 'success',
            confirmButtonText: 'Great!',
            timer: 3000.                
        });
    }
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
        confirmButtonText: '← Back to Data Quality',
        cancelButtonText: 'Cancel',
        reverseButtons: true, // 👈 makes Cancel appear first
        width: '800px',
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
                    case 'Birth Entry':
                    case 'DateOfAdmission':
                        return `<input type="date" onchange="updateField('${studentKey}', '${field}', this.value)" 
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
      // User clicked "← Back to Data Quality"
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

// Generic function to check for specific issue types
function checkDataQualityByIssue(specificIssue = null) {
    const studentIssues = {};
    
    activeStudents.forEach(student => {
        const issues = [];
        
        if (student.Gender === 'Unknown' || !student.Gender) issues.push('Gender');
        if (student.UPI === student.firebaseKey || student.UPI === '---' || !student.UPI) issues.push('UPI');
        if (student.DOB === '---' || !student.DOB) issues.push('DOB');
        if (student['Birth Entry'] === '---' || !student['Birth Entry']) issues.push('Birth Entry');
        if (student['Home phone'] === '---' || !student['Home phone']) issues.push('Home phone');
        if (student['Status'] === '---' || !student['Status']) issues.push('Status');
        if (student.Father === '---' || !student.Father) issues.push('Father');
        if (student.Mother === '---' || !student.Mother) issues.push('Mother');
        
        if (specificIssue && !issues.includes(specificIssue)) return;
        
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
        showFastEditModal(issuesList);
    } else {
        Swal.fire({
            title: 'Data Quality Check',
            text: specificIssue ? `No missing ${specificIssue} found!` : 'No issues found!',
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
        showFastEditModal(issuesList);
    } else {
        Swal.fire({
            title: 'Parent Information Check',
            text: 'All students have complete parent information!',
            icon: 'success',
            confirmButtonText: 'Great!'
        });
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

// Initial load and event listeners
document.addEventListener('DOMContentLoaded', () => {
    checkAuthAndLoadData();
    setupRealtimeListeners();

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