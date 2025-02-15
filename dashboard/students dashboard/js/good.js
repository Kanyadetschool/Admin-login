
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

		document.addEventListener('DOMContentLoaded', () => {
			const tbody = document.querySelector('tbody');
			const searchInput = document.querySelector('.form-input input[type="search"]');

			Object.values(grades).forEach(grade => {
				grade.forEach(student => {
					const tr = document.createElement('tr');
					tr.innerHTML = `
						<td>
							<img src="${student.FileUrl1 || './img/people.png'}" alt="Student Image">
							<p>${student.StudentFullName}</p>
						</td>
						<td>${student.AssessmentNumber}</td>
						<td><span class="status ${student.Status ? student.Status.toLowerCase() : ''}">${student.UPI}</span></td>
					`;
					tr.dataset.grade = student.gradeLabel;
					tr.dataset.assessment = student.AssessmentNumber || '';
					tr.dataset.upi = student.UPI || '';
					tr.dataset.entry = student.EntryNo || '';
					tr.dataset.gender = student.Gender || '';
					tr.dataset.classCode = student.classfilteringCode || '';
					tr.dataset.classGender = student.classfilteringbyGender || '';
					tr.dataset.currentGrade = student.CurentGrade || '';
					tbody.appendChild(tr);
				});
			});

			searchInput.addEventListener('input', () => {
				const searchTerm = searchInput.value.toLowerCase();
				const rows = tbody.querySelectorAll('tr');
				rows.forEach(row => {
					const studentName = row.querySelector('td p').textContent.toLowerCase();
					const assessmentNo = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
					const upi = row.querySelector('td:nth-child(3) .status').textContent.toLowerCase();
					const grade = row.dataset.grade.toLowerCase();
					const entry = row.dataset.entry.toLowerCase();
					const gender = row.dataset.gender.toLowerCase();
					const classCode = row.dataset.classCode.toLowerCase();
					const classGender = row.dataset.classGender.toLowerCase();
					const currentGrade = row.dataset.currentGrade.toLowerCase();

					if (
						studentName.includes(searchTerm) ||
						assessmentNo.includes(searchTerm) ||
						upi.includes(searchTerm) ||
						grade.includes(searchTerm) ||
						entry.includes(searchTerm) ||
						gender.includes(searchTerm) ||
						classCode.includes(searchTerm) ||
						classGender.includes(searchTerm) ||
						currentGrade.includes(searchTerm)
					) {
						row.style.display = '';
					} else {
						row.style.display = 'none';
					}
				});
			});
		});
