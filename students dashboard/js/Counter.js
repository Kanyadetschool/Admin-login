import { Grade1 } from '../Grades/Grade 1.js';
import { Grade2 } from '../Grades/Grade 2.js';
import { Grade3 } from '../Grades/Grade 3.js';
import { Grade4 } from '../Grades/Grade 4.js';
import { Grade5 } from '../Grades/Grade 5.js';
import { Grade6 } from '../Grades/Grade 6.js';
import { Grade7 } from '../Grades/Grade 7.js';
import { Grade8 } from '../Grades/Grade 8.js';
import { Grade9 } from '../Grades/Grade 9.js';

// Function to count total students
function updateTotalStudents() {
    const grades = [Grade1,
       Grade2, 
       Grade3,
       Grade4,
       Grade5,
       Grade6, 
       Grade7,
       Grade8, 
       Grade9];
    
    // Filter out transferred students
    const activeStudents = grades.map(grade => grade.filter(student => student.Status?.toLowerCase() !== 'transferred')).flat();
       
    const totalStudents = activeStudents.length;
    
    // Get gender counts
    const maleStudents = activeStudents.filter(student => student.Gender?.includes('Male')).length;
    const femaleStudents = activeStudents.filter(student => student.Gender?.includes('Female')).length;

    // Update the counter element
    const counterElement = document.getElementById('studentCounter');
    if (counterElement) {
        counterElement.innerHTML = `
            <div class="counter-box">
                <div class="total-count">
                    <span class="count">
                    <i class='bx bxs-calendar-check' ></i>
                    ${totalStudents}</span>
                    <span class="label">Total active Students Registered</span>
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

        // Add styles
        const styles = document.createElement('style');
        styles.textContent = `
            .counter-box {
                background:#F9F9F9;
                padding: 20px;
                border-radius: 10px;
                color: black;
                text-align: center;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            }

            .total-count {
                margin-bottom: 15px;
            }

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

            .label {
                font-size: 0.9em;
                opacity: 0.9;
            }

            @media (max-width: 768px) {
                .counter-box {
                    padding: 15px;
                }
                
                .total-count .count {
                    font-size: 2em;
                }
                
                .gender-counts {
                    flex-direction: column;
                    gap: 10px;
                }
                
                .male-count, .female-count {
                    width: 100%;
                    min-width: unset;
                }
                
                .male-count .count, .female-count .count {
                    font-size: 1.5em;
                }

                .label {
                    font-size: 0.8em;
                }
            }

            @media (max-width: 480px) {
                .counter-box {
                    padding: 10px;
                }
                
                .total-count .count {
                    font-size: 1.8em;
                }
                
                .male-count .count, .female-count .count {
                    font-size: 1.3em;
                }
            }
        `;
        document.head.appendChild(styles); 
    }
}

// Function to count transferred students
function updateTransferredCount() {
    const grades = [Grade1, Grade2, Grade3, Grade4, Grade5, Grade6, Grade7, Grade8, Grade9];
    const transferredStudents = grades.flat().filter(student => student.Status?.toLowerCase() === 'transferred').length;
    
    const transferredCounter = document.getElementById('transferredCounter');
    if (transferredCounter) {
        transferredCounter.textContent = transferredStudents;
    }
}

// Function to display transferred students details
function showTransferredStudentsDetails() {
    const grades = [Grade1, Grade2, Grade3, Grade4, Grade5, Grade6, Grade7, Grade8, Grade9];
    let transferredStudents = grades.flat()
        .filter(student => student.Status === 'Transferred')
        .map(student => ({
            Name: student.StudentFullName || 'N/A',
            UPI: student.UPI === '🕸️' ? 'N/A' : student.UPI,
            AssessmentNumber: student.AssessmentNumber || 'N/A',
            CurrentGrade: student.CurentGrade || 'N/A',
            DateOfTransfer: student.DateOfTransfer || 'N/A',
            AdmissionNumber: student.AdmissionNo || 'N/A',
            FathersPhoneNumber: student.FathersPhoneNumber || 'N/A',
            MothersName: student.MothersName || 'N/A',
            SchoolTransferedTo: student.SchoolTransferedTo || 'N/A',
            ReasonForTransfer: student.ReasonForTransfer || 'N/A',
            FileUrl1: student.FileUrl1 || '../img/Students.jpg' // Default image if FileUrl1 is missing
        }));
    
    if (transferredStudents.length === 0) {
        Swal.fire({
            title: 'No Transferred Students',
            text: 'There are currently no transferred students in the records.',
            icon: 'info'
        });
        return;
    }

    // Sorting functionality
    transferredStudents.sort((a, b) => {
        const dateA = new Date(a.DateOfTransfer);
        const dateB = new Date(b.DateOfTransfer);
        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;
        
        // If dates are equal, sort by grade
        const gradeA = parseInt(a.CurrentGrade.replace('Grade ', ''));
        const gradeB = parseInt(b.CurrentGrade.replace('Grade ', ''));
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
                </tr>
            </thead>
            <tbody>
                ${transferredStudents.map(student => `
                    <tr data-student='${JSON.stringify(student)}'>
                        <td>${student.Name}</td>
                        <td>${student.UPI}</td>
                        <td>${student.AssessmentNumber}</td>
                        <td>${student.CurrentGrade}</td>
                        <td>${student.DateOfTransfer}</td>
                        <td>${student.AdmissionNumber}</td>
                        <td>${student.FathersPhoneNumber}</td>
                        <td>${student.MothersName}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    Swal.fire({
        title: 'Transferred Students',
        html: tableContent,
        width: '100%',
        customClass: {
            popup: 'transferred-popup',
        },
        showConfirmButton: false,
        didOpen: () => {
            const tableRows = document.querySelectorAll('.transferred-table tbody tr');

            // Debounce function
            function debounce(func, delay) {
                let timeout;
                return function(...args) {
                    const context = this;
                    clearTimeout(timeout);
                    timeout = setTimeout(() => func.apply(context, args), delay);
                }
            }

            // Function to highlight search terms
            function highlightSearchTerms(text, searchTerm) {
                if (!searchTerm) return text;
                const regex = new RegExp(searchTerm, 'gi');
                return text.replace(regex, match => `<span style="background-color: yellow;">${match}</span>`);
            }

            // Add search functionality
            const searchInput = document.getElementById('searchTransferredStudents');
            const handleSearch = debounce(() => {
                const searchTerm = searchInput.value.toLowerCase();
                const filteredRows = Array.from(tableRows).filter(row => {
                    const studentData = JSON.parse(row.dataset.student);
                    return (
                        studentData.Name.toLowerCase().includes(searchTerm) ||
                        studentData.CurrentGrade.toLowerCase().includes(searchTerm) ||
                        studentData.AssessmentNumber.toLowerCase().includes(searchTerm) ||
                        studentData.  DateOfTransfer.toLowerCase().includes(searchTerm)||
                        studentData.UPI.toLowerCase().includes(searchTerm)
                    );
                });

                // Hide or show rows based on search term
                tableRows.forEach(row => {
                    const studentData = JSON.parse(row.dataset.student);
                    let isMatch = filteredRows.includes(row);

                    row.innerHTML = `
                        <td>${highlightSearchTerms(studentData.Name, searchTerm)}</td>
                        <td>${highlightSearchTerms(studentData.UPI, searchTerm)}</td>
                        <td>${highlightSearchTerms(studentData.AssessmentNumber, searchTerm)}</td>
                        <td>${highlightSearchTerms(studentData.CurrentGrade, searchTerm)}</td>
                        <td>${highlightSearchTerms(studentData.DateOfTransfer, searchTerm)}</td>
                        <td>${highlightSearchTerms(studentData.AdmissionNumber, searchTerm)}</td>
                        <td>${highlightSearchTerms(studentData.FathersPhoneNumber, searchTerm)}</td>
                        <td>${highlightSearchTerms(studentData.MothersName, searchTerm)}</td>
                    `;

                    row.style.display = isMatch ? '' : 'none';
                });
            }, 300); // 300ms delay

            searchInput.addEventListener('keyup', handleSearch);

            tableRows.forEach(row => {
                row.addEventListener('click', () => {
                    const studentData = JSON.parse(row.dataset.student);
                    Swal.fire({
                        title: studentData.Name,
                        imageAlt: 'Student Image',
                        width: '400px',
                        html: `
                            <img src="${studentData.FileUrl1}" alt="Student Image 1" style="width: 150px; height: 150px; border-radius: 10px; object-fit: cover; margin-bottom: 10px;">
                            ${studentData.FileUrl2 ? `<img src="${studentData.FileUrl2}" alt="Student Image 2" style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; margin-bottom: 10px;">` : ''}
                            <p><strong>Reason for Transfer:</strong> ${studentData.ReasonForTransfer}</p>
                            <p><strong>School Transferred To:</strong> ${studentData.SchoolTransferedTo}</p>
                            <p><strong>Father's Phone:</strong> ${studentData.FathersPhoneNumber}</p>
                            <p><strong>Mother's Name:</strong> ${studentData.MothersName}</p>
                        `
                    });
                });
            });
        }
    });
}

// Initial update
document.addEventListener('DOMContentLoaded', () => {
    updateTotalStudents();
    updateTransferredCount();
    
    const transferredCounterElement = document.getElementById('transferredCounter').parentElement.parentElement;
    transferredCounterElement.addEventListener('click', showTransferredStudentsDetails);
    
    // Add styles for the transferred students popup
    const styles = document.createElement('style');
    styles.textContent = `
        .transferred-popup {
            max-height: 80vh;
            overflow-y: auto;
        }
        
        .transferred-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin-top: 20px;
            min-width: 800px;
            background-color: #ffffff;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .transferred-table th,
        .transferred-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e3e8f0;
            border-right: 1px solid #e3e8f0;
            white-space: nowrap;
        }

        .transferred-table th:last-child,
        .transferred-table td:last-child {
            border-right: none;
        }
        
        .transferred-table th {
            background-color: #f8fafc;
            font-weight: bold;
            position: sticky;
            top: 0;
            z-index: 1;
            border-top: 1px solid rgb(240, 227, 227);
            border-bottom: 2px solid #cbd5e1;
            color: #475569;
        }
        
        .transferred-table tr:hover {
            background-color: #f1f5f9;
            transition: background-color 0.2s ease;
        }

        .transferred-table tbody tr {
            border-bottom: 1px solid #e3e8f0;
        }

        .transferred-table tbody tr:nth-child(even) {
            background-color: #f8fafc;
        }

        .transferred-table tbody tr:nth-child(odd) {
            background-color: #ffffff;
        }

        .transferred-table tbody tr:last-child td {
            border-bottom: 2px solid #e3e8f0;
        }

        /* Highlight first column for better readability */
        .transferred-table td:first-child {
            font-weight: 500;
            color: #1e293b;
        }

        /* Add subtle transition effects */
        .transferred-table tbody tr {
            transition: all 0.2s ease;
        }

        .transferred-table tbody tr:hover td {
            background-color: #e2e8f0;
            color: #000000;
        }

        /* Rest of existing styles... */
        .swal2-html-container {
            overflow-x: auto !important;
            margin: 0 !important;
            padding: 10px !important;
        }
        
        #searchTransferredStudents {
            position: sticky;
            left: 0;
            z-index: 2;
            background: white;
        }
        
        @media (max-width: 768px) {
            .transferred-table {
                font-size: 14px;
            }
            
            .transferred-table th,
            .transferred-table td {
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
});

// Export functions
export { updateTotalStudents, updateTransferredCount };
