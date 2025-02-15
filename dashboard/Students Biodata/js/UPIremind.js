// Import all the grade data modules (e.g., Grade3, Grade4, etc.)
import { Grade1 } from './Grade 1.js';
import { Grade2 } from './Grade 2.js';
import { Grade3 } from './Grade 3.js';
import { Grade4 } from './Grade 4.js';
import { Grade5 } from './Grade 5.js';
import { Grade6 } from './Grade 6.js';
import { Grade7 } from './Grade 7.js';
import { Grade8 } from './Grade 8.js';
import { Grade9 } from './Grade 9.js';

const allGrades = [
   Grade1,
   Grade2,
   Grade3,
   Grade4, 
   Grade5,
   Grade6,
   Grade7,
   Grade8, 
   Grade9
];

window.onload = function() {
    function toSentenceCase(str) {
        if (!str) return '';
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

    // Collect unique values for filters
    const filterOptions = {
        grades: new Set(),
        genders: new Set(),
        graduationYears: new Set()
    };

    // Flatten and collect unique filter values
    allGrades.forEach(gradeGroup => {
        gradeGroup.forEach(student => {
            filterOptions.grades.add(student.CurentGrade);
            filterOptions.genders.add(toSentenceCase(student.Gender));
            filterOptions.graduationYears.add(student.YearOfGraduation);
        });
    });

    // Create modal HTML structure
    const modalHtml = `
        <div class="section">
            <input class="modal-btn" type="checkbox" id="modal-btn" name="modal-btn"/>
            <div class="modal">     
                <div class="modal-wrap" id="modalContent">  
                    <div class="sub">
                        <p><i class="fas fa-graduation-cap"></i>Students With Incomplete Data 2025</p>
                        <div id="learnerStats">
                            <div id="totalLearnerCount">Total Learners: 0</div>
                            <div id="incompleteLearnerCount">Learners with Incomplete Data: 0</div>
                        </div>
                        <div id="filterContainer">
                            <div class="filter-group">
                                <label for="gradeSelect">Grade:</label>
                                <select id="gradeSelect">
                                    <option value="">All Grades</option>
                                </select>
                            </div>
                            <div class="filter-group">
                                <label for="genderSelect">Gender:</label>
                                <select id="genderSelect">
                                    <option value="">All Genders</option>
                                </select>
                            </div>
                            <div class="filter-group">
                                <label for="graduationYearSelect">Graduation Year:</label>
                                <select id="graduationYearSelect">
                                    <option value="">All Years</option>
                                </select>
                            </div>
                        </div>
                        <div id="gradesContainer"></div>
                        <div class="ui active inline loader"></div>
                    </div>
                </div>              
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Populate filter dropdowns
    const gradeSelect = document.getElementById('gradeSelect');
    const genderSelect = document.getElementById('genderSelect');
    const graduationYearSelect = document.getElementById('graduationYearSelect');

    // Sort and populate grade dropdown
    [...filterOptions.grades].sort().forEach(grade => {
        const option = document.createElement('option');
        option.value = grade;
        option.textContent = grade;
        gradeSelect.appendChild(option);
    });

    // Sort and populate gender dropdown
    [...filterOptions.genders].sort().forEach(gender => {
        const option = document.createElement('option');
        option.value = gender;
        option.textContent = gender;
        genderSelect.appendChild(option);
    });

    // Sort and populate graduation year dropdown
    [...filterOptions.graduationYears].sort().forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        graduationYearSelect.appendChild(option);
    });

    // Function to render student data with optional filtering
    function renderStudentData(filters = {}) {
        const { 
            grade = '', 
            gender = '', 
            graduationYear = '' 
        } = filters;

        let content = '';
        let totalLearners = 0;
        let incompleteLearners = 0;

        // Process each gradeGroup
        allGrades.forEach(gradeGroup => {
            // Filter students based on all selected criteria
            const filteredStudents = gradeGroup.filter(student => 
                (!filters.grade || student.CurentGrade === filters.grade) &&
                (!gender || toSentenceCase(student.Gender) === gender) &&
                (!graduationYear || student.YearOfGraduation === graduationYear)
            );

            // Skip if no students match the filter
            if (filteredStudents.length === 0) return;

            const currentGrade = filteredStudents[0].CurentGrade;

            // Track total learners 
            const gradeTotal = filteredStudents.length;
            totalLearners += gradeTotal;

            // Filter for incomplete students
            const incompleteStudents = filteredStudents.filter(student => 
                getMissingFields(student).length > 0
            );

            // Track incomplete learners
            incompleteLearners += incompleteStudents.length;

            if (incompleteStudents.length > 0) {
                content += `
                    <h3>${currentGrade} (Total Students with Incomplete Data: ${incompleteStudents.length} out of ${gradeTotal})</h3>
                    <div class="grade-total-learners">Grade Total Learners: ${gradeTotal}</div>
                    <ul class="incomplete-students">
                        ${incompleteStudents.map(student => {
                            const missingFields = getMissingFields(student);
                            return `
                                <li class="student-entry">
                                    <strong>Name:</strong> ${toSentenceCase(student.StudentFullName)}<br>
                                    <strong>Admission No:</strong> ${student.AdmissionNo}<br>
                                    <strong>Grade:</strong> ${student.CurentGrade}<br>
                                    <strong>Gender:</strong> ${toSentenceCase(student.Gender)}<br>
                                    <strong>Graduation Year:</strong> ${student.YearOfGraduation}<br>
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
            }
        });

        // Update modal content
        if (content) {
            document.getElementById('modalContent').innerHTML = `
                <h2>Students with Incomplete Data 2025</h2>
                <button id="closeModal" class="close-btn">Close Modal</button>
                <div id="learnerStats">
                    <div id="totalLearnerCount">Total Learners: ${totalLearners}</div>
                    <div id="incompleteLearnerCount">Learners with Incomplete Data: ${incompleteLearners}</div>
                </div>
                <div id="filterContainer">
                    <div class="filter-group">
                        <label for="gradeSelect">Grade:</label>
                        <select id="gradeSelect">
                            <option value="">All Grades</option>
                            ${[...filterOptions.grades].sort().map(g => `
                                <option value="${g}" ${g === filters.grade ? 'selected' : ''}>${g}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="filter-group">
                        <label for="genderSelect">Gender:</label>
                        <select id="genderSelect">
                            <option value="">All Genders</option>
                            ${[...filterOptions.genders].sort().map(g => `
                                <option value="${g}" ${g === gender ? 'selected' : ''}>${g}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="filter-group">
                        <label for="graduationYearSelect">Graduation Year:</label>
                        <select id="graduationYearSelect">
                            <option value="">All Years</option>
                            ${[...filterOptions.graduationYears].sort().map(y => `
                                <option value="${y}" ${y === graduationYear ? 'selected' : ''}>${y}</option>
                            `).join('')}
                        </select>
                    </div>
                </div>
                ${content}
            
            `;
        }else {
            const modalContent = document.getElementById('modalContent');
            modalContent.innerHTML = `
                <h2>No students match the current filter criteria</h2>
                <div id="learnerStats">
                    <div id="totalLearnerCount">Total Learners: 0</div>
                    <div id="incompleteLearnerCount">Learners with Incomplete Data: 0</div>
                </div>
             <div class="ui active inline loader"></div>

            `;
        
            // Reload the page after 3 seconds
            setTimeout(() => {
                location.reload(); // Reloads the page
            }, 2000); // 3 seconds
        }
        

        // Reattach event listeners
        attachModalEventListeners();
        
        // Reattach filter event listeners
        document.getElementById('gradeSelect').addEventListener('change', function(e) {
            renderStudentData({
                grade: e.target.value, 
                gender: document.getElementById('genderSelect').value,
                graduationYear: document.getElementById('graduationYearSelect').value
            });
        });

        document.getElementById('genderSelect').addEventListener('change', function(e) {
            renderStudentData({
                grade: document.getElementById('gradeSelect').value,
                gender: e.target.value,
                graduationYear: document.getElementById('graduationYearSelect').value
            });
        });

        document.getElementById('graduationYearSelect').addEventListener('change', function(e) {
            renderStudentData({
                grade: document.getElementById('gradeSelect').value,
                gender: document.getElementById('genderSelect').value,
                graduationYear: e.target.value
            });
        });
    }

    // Function to attach modal event listeners
    function attachModalEventListeners() {
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
    }

    // Initial render of student data
    document.getElementById('modal-btn').checked = true;
    renderStudentData();
};