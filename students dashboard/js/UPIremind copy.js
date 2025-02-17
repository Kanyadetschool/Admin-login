// Import all the grade data modules (e.g., Grade3, Grade4, etc.)
// import { Grade1 } from './Grade 1.js';
// import { Grade2 } from './Grade 2.js';
// import { Grade3 } from './Grade 3.js';
// import { Grade4 } from './Grade 4.js';
// import { Grade5 } from './Grade 5.js';
// import { Grade6 } from './Grade 6.js';
// import { Grade7 } from './Grade 7.js';
// import { Grade8 } from './Grade 8.js';
import { Grade9 } from './Grade 9.js';

const allGrades = [
//    Grade1,
//    Grade2,
//     Grade3,
//      Grade4, 
//      Grade5,
//     Grade6,
//      Grade7,
//       Grade8, 
      Grade9
];

window.onload = function() {
    function toSentenceCase(str) {
        return str.toLowerCase().replace(/(^\w|\s\w)/g, m => m.toUpperCase());
    }

    // Define required fields and their display names
    const requiredFields = {
        StudentFullName: 'Student Full Name',
        CurentGrade: 'Current Grade',
        YearOfGraduation:'Year Of Graduation',
        Status:'Status',
        AdmissionNo: 'Admission Number',
        AssessmentNumber: 'Assessment Number',
        EntryNo: 'Entry Number',
        Gender: 'Gender',
        classfilteringbyGender: 'Class Filtering by Gender',
        classfilteringCode: 'Class Filtering Code',
        Disability: 'Disability Status',
        DateOfAdm: 'Date of Admission',
        AdmissionClass: 'Admission Class',
        DateOfBirth: 'Date of Birth',
        UPI: 'UPI',
        PhoneNumber: 'Phone Number',
        StudentSchoolEmail: 'Student School Email',
        ClassTeacher: 'Class Teacher',
        FathersName: "Father's Name",
        FathersPhoneNumber: "Father's PhoneNumber",
        MothersName: "Mother's Name",
        MothersPhoneNumber: "Mother,s PhoneNumber",
        FileUrl1: "Knec Report",
        FileUrl2: "Leaving certificate",
        FileUrl3: "Performance Archive",
        FileUrl4: "Students Photo",
        Siblings: 'Siblings',
        
    };

    // Function to check if a field is empty or contains placeholder values
    function isFieldIncomplete(value) {
        if (!value) return true;
        if (value === '') return true;
        if (value === '⚠️') return true;
        if (value === '🕸️') return true;
        if (value === 'XXXXXXXXXXXX') return true;
        if (value.startsWith('*') && value.length <= 4) return true;
        return false;
    }

    // Function to get missing fields for a student
    function getMissingFields(student) {
        const missing = [];
        for (const [field, displayName] of Object.entries(requiredFields)) {
            if (isFieldIncomplete(student[field])) {
                missing.push(displayName);
            }
        }
        return missing;
    }

    // Create modal HTML structure
    const modalHtml = `
        <div class="section">
            <input class="modal-btn" type="checkbox" id="modal-btn" name="modal-btn"/>
            <div class="modal">     
                <div class="modal-wrap" id="modalContent">  
                    <div class="sub">
                        <p><i class="fas fa-graduation-cap"></i>Students With Incomplete Data 2025</p>
                        <div id="gradesContainer"></div>
                        <div class="ui active inline loader"></div>
                    </div>
                </div>              
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    let content = '';

    // Process each grade
    allGrades.forEach(gradeGroup => {
        const grade = gradeGroup[0].CurentGrade;
        
        // Filter students with any missing data
        const incompleteStudents = gradeGroup.filter(student => 
            getMissingFields(student).length > 0
        );

        if (incompleteStudents.length > 0) {
            content += `
                <h3>${grade} (Total Students with Incomplete Data: ${incompleteStudents.length})</h3>
                <ul class="incomplete-students">
                    ${incompleteStudents.map(student => {
                        const missingFields = getMissingFields(student);
                        return `
                            <li class="student-entry">
                                <strong>Name:</strong> ${toSentenceCase(student.StudentFullName)}<br>
                                <strong>Admission No:</strong> ${student.AdmissionNo}<br>
                                <strong>Missing Information:</strong>
                                <ul class="missing-fields">
                                    ${missingFields.map(field => `
                                        <li>${field}</li>
                                    `).join('')}
                                </ul>
                            </li>
                        `;
                    }).join('')}
                </ul>
            `;
        } else {
            content += `
                <h3 id="complete">${grade} (All student records complete)</h3>
            `;
        }
    });

    // Update modal content
    if (content) {
        document.getElementById('modal-btn').checked = true;
        document.getElementById('modalContent').innerHTML = `
            <h2>Students with Incomplete Data 2025</h2>
            <button id="closeModal" class="close-btn">Close Modal</button>
            ${content}
            <style>
                .incomplete-students {
                    list-style: none;
                    padding: 0;
                }
                .student-entry {
                    margin-bottom: 20px;
                    padding: 15px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    background-color: #f9f9f9;
                }
                .missing-fields {
                    margin-top: 5px;
                    padding-left: 20px;
                    color: #dc3545;
                }
            </style>
        `;
    } else {
        document.getElementById('modalContent').innerHTML = `
            <h2>All student records are complete!</h2>
        `;
    }

    // Event listeners for modal closing
    document.getElementById('closeModal').addEventListener('click', function() {
        document.getElementById('modal-btn').checked = false;
    });

    const modal = document.querySelector('.modal');
    const modalWrap = document.querySelector('.modal-wrap');

    modal.addEventListener('click', function(e) {
        if (!modalWrap.contains(e.target)) {
            document.getElementById('modal-btn').checked = true;
        }
    });
};