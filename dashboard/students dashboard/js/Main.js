// Import statements remain the same
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

const grades = {
  Grade1,
  Grade2,
  Grade3,
  Grade4,
  Grade5,
  Grade6,
  Grade7,
  Grade8,
  Grade9,
};
  
let filteredStudents = [];
let allStudentsList = []; // New variable to store all students
let noDataAlertShown = false;
let swalInstance = null;

// ... (previous disableFormFields function remains the same)

function getAllStudents() {
  return Object.values(grades)
    .filter(Array.isArray)
    .flatMap(grade => grade)
    .filter(student => student && student.StudentFullName);
}

function populateForm(data) {
  // Check if data exists
  if (!data) {
    console.warn('No data provided to populateForm');
    return;
  }

  // Helper function to safely set form values
  const setFormValue = (selector, value) => {
    const element = document.querySelector(selector);
    if (element) {
      element.value = value || '';
    } else {
      console.warn(`Element not found for selector: ${selector}`);
    }
  };

  // Map of selectors to data properties
  const formFields = {
    'input[name="CurentGrade"]': data.CurentGrade,
    'input[name="StudentFullName"]': data.StudentFullName,
    'input[name="Disability"]': data.Disability,
    'input[name="Status"]': data.Status,
    'input[name="Admission No"]': data.AdmissionNo,
    'input[name="EntryNo"]': data.EntryNo,
    'input[name="YearOfGraduation"]': data.YearOfGraduation,
   // 'select[name="Disability"]': data.Disability,
    'input[name="DateOfAdm"]': data.DateOfAdm,
    'input[name="DateOfBirth"]': data.DateOfBirth,
    'input[name="Admission Class"]': data.AdmissionClass,
    'input[name="Gender"]': data.Gender,
    '#Assessment\\ Number': data.AssessmentNumber,
    'input[name="U.P.I"]': data.UPI,
    'input[type="tel"]': data.PhoneNumber,
    'input[type="email"]': data.StudentSchoolEmail,
    'input[name="Class Teacher:"]': data.ClassTeacher,
    'input[name="Fathers Name"]': data.FathersName,
    'input[name="Fathers PhoneNumber"]': data.FathersPhoneNumber,
    'input[name="Mothers Name"]': data.MothersName,
    'input[name="Mothers PhoneNumber"]': data.MothersPhoneNumber,
    'textarea[name="Siblings"]': data.Siblings
  };

  // Populate all form fields
  Object.entries(formFields).forEach(([selector, value]) => {
    setFormValue(selector, value);
  });


  // Handle file downloads
  for (let i = 1; i <= 4; i++) {
    const fileUrl = data[`FileUrl${i}`];
    const container = document.getElementById(`fileDownload${i}`);
    
    if (container) {
      container.innerHTML = '';
      container.style.display = 'none';

      if (fileUrl) {
        const link = document.createElement('a');
        link.href = fileUrl;
        const fileName = fileUrl.substring(fileUrl.lastIndexOf('/') + 1);
        link.textContent = fileName;
        link.download = fileName;
        container.appendChild(link);
        container.style.display = 'block';
      }
    }
  }

  // Display learner images (FileUrl4)
  const learnerImageContainer = document.getElementById('learnerImages');
  const learnerImageUrl = data.FileUrl4;
  if (learnerImageUrl) {
    const img = document.createElement('img');
    img.src = learnerImageUrl;
    img.alt = `${data.StudentFullName}'s Image`;
    learnerImageContainer.innerHTML = '';
    learnerImageContainer.appendChild(img);
    learnerImageContainer.style.display = 'block';
  }

  // Close the SweetAlert pop-up after populating the form
  if (swalInstance) {
    swalInstance.close();
  }
}

function filterDataByName(searchInput) {
  const inputLowerCase = searchInput.toLowerCase();

  const allStudents = getAllStudents();

  // Filter the combined student list based on any of the three criteria
  return allStudents.filter(student => 
    student &&
    (
      (student.StudentFullName && student.StudentFullName.toLowerCase().includes(inputLowerCase)) ||
      (student.AssessmentNumber && student.AssessmentNumber.toLowerCase().includes(inputLowerCase)) ||
      (student.UPI && student.UPI.toLowerCase().includes(inputLowerCase)) ||
      (student.EntryNo && student.EntryNo.toLowerCase().includes(inputLowerCase)) ||
      (student.Gender && student.Gender.toLowerCase().includes(inputLowerCase)) ||
      (student.classfilteringCode && student.classfilteringCode.toLowerCase().includes(inputLowerCase)) ||
      (student.classfilteringbyGender && student.classfilteringbyGender.toLowerCase().includes(inputLowerCase)) ||
      (student.CurentGrade && student.CurentGrade.toLowerCase().includes(inputLowerCase))
    )
  );
}


function handleNoDataFound() {
  Swal.fire({
    icon: 'warning',
    title: 'No Matching Data Found!',
    text: 'Please refine your search by typing the first three letters for the Christian name.',
    timer: 3000,
    didClose: () => {
      allStudentsList = getAllStudents(); // Store all students
      const studentNames = allStudentsList.map(student => student.StudentFullName);
      generateStudentList(studentNames, 'All Registered Learners', studentNames.length, true);
    }
  });
}

function generateStudentList(studentNames, title, count, isAllStudents = false) {
  if (!Array.isArray(studentNames)) {
    console.error('studentNames must be an array');
    return;
  }

  const studentsToUse = isAllStudents ? allStudentsList : filteredStudents;

  const options = {};
  studentNames.forEach((name, index) => {
    if (name) {
      options[index] = `${index + 1}. ${name}`;
    }
  });

  const htmlContent = `
    <div>
      <h3 for="studentNameSelect">Select a student:</h3>
      <select id="studentNameSelect" class="swal2-select" placeholder="Select learner">
        <option value="">Students</option>
        ${Object.entries(options).map(([index, option]) => `<option value="${index}">${option}</option>`).join('')}
      </select>
    </div>`;

  swalInstance = Swal.fire({
    title: `${title} (${count})`,
    html: htmlContent,
    showCancelButton: false,
    didOpen: () => {
      const studentSelect = document.getElementById('studentNameSelect');
      
      studentSelect.addEventListener('change', function(event) {
        const selectedIndex = event.target.value;
        if (selectedIndex !== '') {
          const selectedStudent = studentsToUse[selectedIndex];
          if (selectedStudent) {
            populateForm(selectedStudent);
          } else {
            console.warn('Selected student not found');
          }
        }
      });
    },
  });
}

document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.querySelector('input[type="search"]');

  function handleLiveFiltering(inputValue) {
    if (inputValue.length < 4) { // Allow filtering with 3+ characters
      noDataAlertShown = false;
      return;
    }
  
    filteredStudents = filterDataByName(inputValue);
  
    if (filteredStudents.length > 0) {
      const studentNames = filteredStudents.map(student => student.StudentFullName);
      generateStudentList(studentNames, 'Matching Learners', filteredStudents.length, false);
      noDataAlertShown = false;
    } else if (!noDataAlertShown) {
      handleNoDataFound();
      noDataAlertShown = true;
    }
  }
  

  if (searchInput) {
    searchInput.addEventListener('input', function(event) {
      const inputValue = event.target.value.trim();
      handleLiveFiltering(inputValue);
    });
  }

  // Initially hide download link containers and learner image container
  document.querySelectorAll('[id^="fileDownload"]').forEach(container => {
    container.style.display = 'block';
    // container.style.display = 'none';
  });

  const learnerImageContainer = document.getElementById('learnerImages');
  if (learnerImageContainer) {
    learnerImageContainer.style.display = 'block';
  }
});

function initializeSearchFocus() {
  const searchInput = document.getElementById('search');
  
  // Only proceed if search input exists
  if (searchInput) {
      window.addEventListener('load', () => {
          searchInput.focus();
          searchInput.select();
      });

      searchInput.addEventListener('focus', (e) => {
          e.target.select();
      });
  }
}