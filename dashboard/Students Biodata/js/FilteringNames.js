// Import student data modules
import { Grade1 } from './Grade 1.js';
import { Grade2 } from './Grade 2.js';
import { Grade3 } from './Grade 3.js';
import { Grade4 } from './Grade 4.js';
import { Grade5 } from './Grade 5.js';
import { Grade6 } from './Grade 6.js';
import { Grade7 } from './Grade 7.js';
import { Grade8 } from './Grade 8.js';
import { Grade9 } from './Grade 9.js';

// Combine and process all student data
export const getAllStudents = () => {
    const allStudents = [
        ...Grade1.map(student => ({ ...student, gradeLabel: 'Grade 1' })),
        ...Grade2.map(student => ({ ...student, gradeLabel: 'Grade 2' })),
        ...Grade3.map(student => ({ ...student, gradeLabel: 'Grade 3' })),
        ...Grade4.map(student => ({ ...student, gradeLabel: 'Grade 4' })),
        ...Grade5.map(student => ({ ...student, gradeLabel: 'Grade 5' })),
        ...Grade6.map(student => ({ ...student, gradeLabel: 'Grade 6' })),
        ...Grade7.map(student => ({ ...student, gradeLabel: 'Grade 7' })),
        ...Grade8.map(student => ({ ...student, gradeLabel: 'Grade 8' })),
        ...Grade9.map(student => ({ ...student, gradeLabel: 'Grade 9' })),
    ];
    
    // Sort students alphabetically by name
    return allStudents.sort((a, b) => 
        a.StudentFullName.localeCompare(b.StudentFullName)
    );
};

// Export selectStudent function
export const selectStudent = (studentName) => {
    const searchInput = document.getElementById('search');
    if (searchInput) {
        // Update the search input value
        searchInput.value = studentName;
        searchInput.dispatchEvent(new Event('input'));

        // Find the clicked student and apply fade-out effect
        const studentListItems = document.querySelectorAll('#studentList li');
        studentListItems.forEach(student => {
            if (student.textContent.trim().startsWith(studentName)) {
                // Apply fade-out effect
                student.style.transition = 'opacity 0.5s ease';
                student.style.opacity = '0';

                // Wait for the transition to complete, then hide the element
                setTimeout(() => {
                    student.style.display = 'none';
                }, 500); // Match the CSS transition duration
            }
        });
    } else {
        console.error("Search input element not found.");
    }
};



// Create and insert the HTML structure for the student list
export const createStudentListHTML = () => {
    const allStudents = getAllStudents();
    const studentListElement = document.getElementById('studentList');

    if (studentListElement) {
        const studentHTML = allStudents.map(student => `
            <li onclick="selectStudent('${student.StudentFullName}')" 
                data-grade="${student.gradeLabel}"
                data-assessment="${student.AssessmentNumber || ''}"
                data-upi="${student.UPI || ''}"
                data-entry="${student.EntryNo || ''}"
                data-gender="${student.Gender || ''}"
                data-class-code="${student.classfilteringCode || ''}"
                data-class-gender="${student.classfilteringbyGender || ''}"
                data-current-grade="${student.CurentGrade || ''}">
                ${student.StudentFullName} 
                <span class="grade-indicator">${student.gradeLabel}</span>
            </li>
        `).join('');

        studentListElement.innerHTML = studentHTML;
    } else {
        console.error("Student list element not found.");
    }
};

// Search functionality
window.onSearch = () => {
    const searchInput = document.getElementById('search');
    const students = document.querySelectorAll('#studentList li');
    const scrollIndicator = document.getElementById('scrollIndicator');
    const studentList = document.getElementById('studentList');
    
    const searchValue = searchInput.value.trim().toLowerCase();
    let matchCount = 0;

    students.forEach((student, index) => {
        const originalStudentName = student.textContent
            .replace(/^\d+\.\s/, '') // Remove existing numbering
            .trim();
        const studentNameLowerCase = originalStudentName.toLowerCase();
        const studentGrade = student.getAttribute('data-grade');
        
        // Combined search criteria
        const matchesOriginalSearch = studentNameLowerCase.includes(searchValue) || 
                                    studentGrade.toLowerCase().includes(searchValue);
                                    
        const matchesNewCriteria = 
            (student.getAttribute('data-assessment') && 
             student.getAttribute('data-assessment').toLowerCase().includes(searchValue)) ||
            (student.getAttribute('data-upi') && 
             student.getAttribute('data-upi').toLowerCase().includes(searchValue)) ||
            (student.getAttribute('data-entry') && 
             student.getAttribute('data-entry').toLowerCase().includes(searchValue)) ||
            (student.getAttribute('data-gender') && 
             student.getAttribute('data-gender').toLowerCase().includes(searchValue)) ||
            (student.getAttribute('data-class-code') && 
             student.getAttribute('data-class-code').toLowerCase().includes(searchValue)) ||
            (student.getAttribute('data-class-gender') && 
             student.getAttribute('data-class-gender').toLowerCase().includes(searchValue)) ||
            (student.getAttribute('data-current-grade') && 
             student.getAttribute('data-current-grade').toLowerCase().includes(searchValue));

        // If either original or new search criteria match
        if (matchesOriginalSearch || matchesNewCriteria) {
            matchCount++;
            student.style.display = 'block';
            student.innerHTML = `${matchCount}. ${originalStudentName.split('Grade')[0].trim()} 
                               <span class="grade-indicator">${studentGrade}</span>`;
        } else {
            student.style.display = 'none';
        }
    });

    // Update counter
    const counter = document.getElementById('counter');
    if (counter) {
        counter.textContent = `${matchCount} student${matchCount !== 1 ? 's' : ''} found`;
    }

    // Update scroll indicator
    scrollIndicator.style.display = 
        studentList.scrollHeight > studentList.clientHeight ? 'block' : 'none';
};


// Initialize the application
export const initializeApp = () => {
    createStudentListHTML();
    const searchInput = document.getElementById('search');
    if (searchInput) {
        searchInput.addEventListener('input', onSearch);
    }
};

// Add styles
const addStyles = () => {
    const styles = `
        <style>
            .grade-indicator {
                font-size: 0.8em;
                color: #666;
                margin-left: 8px;
                padding: 5px 6px;
                border-radius: 4px;
                background-color: #fafafa;
                  box-shadow: 0 0 20px 1px rgba(0, 0, 0, 0.1);

            }
            .counter {
                text-align: center;
                margin-top: 10px;
                color: #666;
            }
            #studentList {
                max-height: 400px;
                overflow-y: auto;
            }
        </style>
    `;
    document.head.insertAdjacentHTML('beforeend', styles);
};

// Start the application
addStyles();
initializeApp();

// Make functions globally available
window.selectStudent = selectStudent;
