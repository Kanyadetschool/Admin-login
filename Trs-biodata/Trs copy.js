/* Trs.js */
/* JavaScript for Teacher Management System */
        // Firebase Configuration
        const firebaseConfig = {
            apiKey: "AIzaSyA_41WpdMjHJOU5s3gQ9aieIayZRvUoRLE",
            authDomain: "kanyadet-school-admin.firebaseapp.com",
            databaseURL: "https://kanyadet-school-admin-default-rtdb.firebaseio.com/",
            projectId: "kanyadet-school-admin",
            storageBucket: "kanyadet-school-admin.appspot.com",
            messagingSenderId: "409708360032",
            appId: "1:409708360032:web:a21d63e8cb5fa1ecabee05",
            measurementId: "G-Y4C0ZRRL52"
        };

        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        const database = firebase.database();
        const teachersRef = database.ref('teachers');

        // Global variables
        let teachersData = {};
        let currentEditingTeacher = null;
        let uploadedFile = null;

        // Initialize app
        document.addEventListener('DOMContentLoaded', function() {
            setupFirebaseListeners();
            setupEventListeners();
            setupFileUpload();
        });

        // Firebase Connection Status
        function setupFirebaseListeners() {
            const connectedRef = database.ref('.info/connected');
            connectedRef.on('value', function(snapshot) {
                const connected = snapshot.val();
                const statusElement = document.getElementById('connectionStatus');
                if (connected) {
                    statusElement.textContent = 'Connected';
                    statusElement.className = 'connection-status connected';
                } else {
                    statusElement.textContent = 'Disconnected';
                    statusElement.className = 'connection-status disconnected';
                }
            });

            // Listen for teachers data changes
            teachersRef.on('value', function(snapshot) {
                teachersData = snapshot.val() || {};
                updateDashboard();
                renderTeachersList();
                updateRecentActivity();
            });

            // Listen for child added (new teacher)
            teachersRef.on('child_added', function(snapshot) {
                const teacher = snapshot.val();
                showNotification(`New teacher ${teacher.firstName} ${teacher.lastName} added!`, 'success');
            });

            // Listen for child changed (teacher updated)
            teachersRef.on('child_changed', function(snapshot) {
                const teacher = snapshot.val();
                showNotification(`Teacher ${teacher.firstName} ${teacher.lastName} updated!`, 'info');
            });

            // Listen for child removed (teacher deleted)
            teachersRef.on('child_removed', function(snapshot) {
                const teacher = snapshot.val();
                showNotification(`Teacher ${teacher.firstName} ${teacher.lastName} removed!`, 'error');
            });
        }

        // Setup Event Listeners
        function setupEventListeners() {
            // Tab switching
            document.querySelectorAll('.tab').forEach(tab => {
                tab.addEventListener('click', function() {
                    const tabId = this.getAttribute('data-tab');
                    switchTab(tabId);
                });
            });

            // Teacher form submission
            document.getElementById('teacherForm').addEventListener('submit', function(e) {
                e.preventDefault();
                addTeacher();
            });

            // Edit teacher form submission
            document.getElementById('editTeacherForm').addEventListener('submit', function(e) {
                e.preventDefault();
                updateTeacher();
            });
        }

        // Setup File Upload
        function setupFileUpload() {
            const uploadArea = document.querySelector('.upload-area');
            const fileInput = document.getElementById('fileInput');

            uploadArea.addEventListener('dragover', function(e) {
                e.preventDefault();
                this.classList.add('dragover');
            });

            uploadArea.addEventListener('dragleave', function() {
                this.classList.remove('dragover');
            });

            uploadArea.addEventListener('drop', function(e) {
                e.preventDefault();
                this.classList.remove('dragover');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    handleFileSelection(files[0]);
                }
            });

            fileInput.addEventListener('change', function() {
                if (this.files.length > 0) {
                    handleFileSelection(this.files[0]);
                }
            });
        }

        // Tab Switching
        function switchTab(tabId) {
            // Update tab buttons
            document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
            document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

            // Update tab content
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
        }

        // Add Teacher
        function addTeacher() {
            const form = document.getElementById('teacherForm');
            const formData = new FormData(form);
            const teacherData = {};

            // Get standard form fields
            for (let [key, value] of formData.entries()) {
                teacherData[key] = value;
            } 

            // Get custom fields
            const customFields = {};
            document.querySelectorAll('.custom-field-item').forEach(item => {
                const keyInput = item.querySelector('input[placeholder="Field Name"]');
                const valueInput = item.querySelector('input[placeholder="Field Value"]');
                if (keyInput.value && valueInput.value) {
                    customFields[keyInput.value] = valueInput.value;
                }
            });

            if (Object.keys(customFields).length > 0) {
                teacherData.customFields = customFields;
            }

            // Add metadata
            teacherData.createdAt = new Date().toISOString();
            teacherData.updatedAt = new Date().toISOString();
            teacherData.createdBy = 'admin'; // You can enhance this with user authentication

            // Show loading
            const btnText = document.getElementById('addTeacherBtnText');
            const btnLoader = document.getElementById('addTeacherLoader');
            btnText.style.display = 'none';
            btnLoader.style.display = 'inline-block';

            // Save to Firebase
            teachersRef.child(teacherData.teacherId).set(teacherData)
                .then(() => {
                    showNotification('Teacher added successfully!', 'success');
                    resetForm();
                })
                .catch((error) => {
                    showNotification('Error adding teacher: ' + error.message, 'error');
                })
                .finally(() => {
                    btnText.style.display = 'inline-block';
                    btnLoader.style.display = 'none';
                });
        }

        // Update Teacher
        function updateTeacher() {
            if (!currentEditingTeacher) return;

            const form = document.getElementById('editTeacherForm');
            const formData = new FormData(form);
            const teacherData = {};

            // Get form fields
            for (let [key, value] of formData.entries()) {
                teacherData[key] = value;
            }

            // Get custom fields from edit form
            const customFields = {};
            form.querySelectorAll('.custom-field-item').forEach(item => {
                const keyInput = item.querySelector('input[placeholder="Field Name"]');
                const valueInput = item.querySelector('input[placeholder="Field Value"]');
                if (keyInput.value && valueInput.value) {
                    customFields[keyInput.value] = valueInput.value;
                }
            });

            if (Object.keys(customFields).length > 0) {
                teacherData.customFields = customFields;
            }

            teacherData.updatedAt = new Date().toISOString();

            // Update in Firebase
            teachersRef.child(currentEditingTeacher).update(teacherData)
                .then(() => {
                    showNotification('Teacher updated successfully!', 'success');
                    closeEditModal();
                })
                .catch((error) => {
                    showNotification('Error updating teacher: ' + error.message, 'error');
                });
        }

        // Delete Teacher
        function deleteTeacher(teacherId) {
            if (confirm('Are you sure you want to delete this teacher? This action cannot be undone.')) {
                teachersRef.child(teacherId).remove()
                    .then(() => {
                        showNotification('Teacher deleted successfully!', 'success');
                    })
                    .catch((error) => {
                        showNotification('Error deleting teacher: ' + error.message, 'error');
                    });
            }
        }

        // Edit Teacher
        function editTeacher(teacherId) {
            const teacher = teachersData[teacherId];
            if (!teacher) return;

            currentEditingTeacher = teacherId;
            const modal = document.getElementById('editModal');
            const formFields = document.getElementById('editFormFields');

            // Create edit form fields
            formFields.innerHTML = `
                <div class="form-grid">
                    <div class="form-group">
                        <label>Teacher ID</label>
                        <input type="text" name="teacherId" value="${teacher.teacherId || ''}" readonly>
                    </div>
                    <div class="form-group">
                        <label>First Name *</label>
                        <input type="text" name="firstName" value="${teacher.firstName || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Last Name *</label>
                        <input type="text" name="lastName" value="${teacher.lastName || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Email *</label>
                        <input type="email" name="email" value="${teacher.email || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Phone</label>
                        <input type="tel" name="phone" value="${teacher.phone || ''}">
                    </div>
                    <div class="form-group">
                        <label>Department *</label>
                        <select name="department" required>
                            <option value="">Select Department</option>
                            <option value="Mathematics" ${teacher.department === 'Mathematics' ? 'selected' : ''}>Mathematics</option>
                            <option value="English" ${teacher.department === 'English' ? 'selected' : ''}>English</option>
                            <option value="Science" ${teacher.department === 'Science' ? 'selected' : ''}>Science</option>
                            <option value="History" ${teacher.department === 'History' ? 'selected' : ''}>History</option>
                            <option value="Physical Education" ${teacher.department === 'Physical Education' ? 'selected' : ''}>Physical Education</option>
                            <option value="Arts" ${teacher.department === 'Arts' ? 'selected' : ''}>Arts</option>
                            <option value="Computer Science" ${teacher.department === 'Computer Science' ? 'selected' : ''}>Computer Science</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Position</label>
                        <input type="text" name="position" value="${teacher.position || ''}">
                    </div>
                    <div class="form-group">
                        <label>Salary</label>
                        <input type="number" name="salary" value="${teacher.salary || ''}" min="0" step="0.01">
                    </div>
                    <div class="form-group">
                        <label>Experience (Years)</label>
                        <input type="number" name="experience" value="${teacher.experience || ''}" min="0">
                    </div>
                    <div class="form-group">
                        <label>Qualification</label>
                        <input type="text" name="qualification" value="${teacher.qualification || ''}">
                    </div>
                    <div class="form-group">
                        <label>Joining Date</label>
                        <input type="date" name="joiningDate" value="${teacher.joiningDate || ''}">
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <select name="status">
                            <option value="Active" ${teacher.status === 'Active' ? 'selected' : ''}>Active</option>
                            <option value="Inactive" ${teacher.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                            <option value="On Leave" ${teacher.status === 'On Leave' ? 'selected' : ''}>On Leave</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Address</label>
                    <textarea name="address">${teacher.address || ''}</textarea>
                </div>
                <div class="custom-fields">
                    <h3>Custom Fields</h3>
                    <div id="editCustomFieldsContainer">
                        ${renderCustomFieldsForEdit(teacher.customFields || {})}
                    </div>
                    <button type="button" class="btn btn-secondary btn-small" onclick="addCustomFieldToEdit()">+ Add Custom Field</button>
                </div>
            `;

            modal.classList.add('show');
        }

        // Close Edit Modal
        function closeEditModal() {
            document.getElementById('editModal').classList.remove('show');
            currentEditingTeacher = null;
        }

        // Add Custom Field
        function addCustomField() {
            const container = document.getElementById('customFieldsContainer');
            const fieldItem = document.createElement('div');
            fieldItem.className = 'custom-field-item';
            fieldItem.innerHTML = `
                <input type="text" placeholder="Field Name">
                <input type="text" placeholder="Field Value">
                <button type="button" class="btn btn-danger btn-small" onclick="removeCustomField(this)">Remove</button>
            `;
            container.appendChild(fieldItem);
        }

        // Add Custom Field to Edit Form
        function addCustomFieldToEdit() {
            const container = document.getElementById('editCustomFieldsContainer');
            const fieldItem = document.createElement('div');
            fieldItem.className = 'custom-field-item';
            fieldItem.innerHTML = `
                <input type="text" placeholder="Field Name">
                <input type="text" placeholder="Field Value">
                <button type="button" class="btn btn-danger btn-small" onclick="removeCustomField(this)">Remove</button>
            `;
            container.appendChild(fieldItem);
        }

        // Remove Custom Field
        function removeCustomField(button) {
            button.parentElement.remove();
        }

        // Render Custom Fields for Edit
        function renderCustomFieldsForEdit(customFields) {
            let html = '';
            for (const [key, value] of Object.entries(customFields)) {
                html += `
                    <div class="custom-field-item">
                        <input type="text" placeholder="Field Name" value="${key}">
                        <input type="text" placeholder="Field Value" value="${value}">
                        <button type="button" class="btn btn-danger btn-small" onclick="removeCustomField(this)">Remove</button>
                    </div>
                `;
            }
            return html;
        }

        // Reset Form
        function resetForm() {
            document.getElementById('teacherForm').reset();
            document.getElementById('customFieldsContainer').innerHTML = '';
        }

        // Update Dashboard
        function updateDashboard() {
            const teachers = Object.values(teachersData);
            
            // Total teachers
            document.getElementById('totalTeachers').textContent = teachers.length;
            
            // Active teachers
            const activeTeachers = teachers.filter(t => t.status === 'Active').length;
            document.getElementById('activeTeachers').textContent = activeTeachers;
            
            // Department count
            const departments = new Set(teachers.map(t => t.department).filter(d => d));
            document.getElementById('departmentCount').textContent = departments.size;
            
            // Average experience
            const avgExperience = teachers.length > 0 
                ? (teachers.reduce((sum, t) => sum + (parseInt(t.experience) || 0), 0) / teachers.length).toFixed(1)
                : 0;
            document.getElementById('avgExperience').textContent = avgExperience;
        }

        // Update Recent Activity
        function updateRecentActivity() {
            const teachers = Object.values(teachersData);
            const recentTeachers = teachers
                .filter(t => t.createdAt)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 5);

            const container = document.getElementById('recentActivity');
            if (recentTeachers.length === 0) {
                container.innerHTML = '<p>No recent activity</p>';
                return;
            }

            let html = '<h4>Recently Added Teachers:</h4><ul>';
            recentTeachers.forEach(teacher => {
                const date = new Date(teacher.createdAt).toLocaleDateString();
                html += `<li><strong>${teacher.firstName} ${teacher.lastName}</strong> - ${teacher.department} (${date})</li>`;
            });
            html += '</ul>';
            container.innerHTML = html;
        }

        // Render Teachers List
        function renderTeachersList() {
            const container = document.getElementById('teachersContainer');
            const teachers = Object.entries(teachersData);

            if (teachers.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: #666;">No teachers found</p>';
                return;
            }

            let html = '';
            teachers.forEach(([teacherId, teacher]) => {
                html += `
                    <div class="teacher-card" data-teacher-id="${teacherId}">
                        <div class="teacher-card-header">
                            <h3 class="teacher-name">${teacher.firstName} ${teacher.lastName}</h3>
                            <span class="teacher-id">${teacher.teacherId}</span>
                        </div>
                        <div class="teacher-info">
                            <div class="info-item">
                                <span class="info-label">Email:</span>
                                <span class="info-value">${teacher.email || 'N/A'}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Department:</span>
                                <span class="info-value">${teacher.department || 'N/A'}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Position:</span>
                                <span class="info-value">${teacher.position || 'N/A'}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Status:</span>
                                <span class="info-value" style="color: ${teacher.status === 'Active' ? '#27ae60' : '#e74c3c'}">${teacher.status || 'N/A'}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Experience:</span>
                                <span class="info-value">${teacher.experience || '0'} years</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Phone:</span>
                                <span class="info-value">${teacher.phone || 'N/A'}</span>
                            </div>
                        </div>
                        ${teacher.customFields ? renderCustomFieldsDisplay(teacher.customFields) : ''}
                        <div class="teacher-actions">
                            <button class="btn btn-primary btn-small" onclick="editTeacher('${teacherId}')">Edit</button>
                            <button class="btn btn-danger btn-small" onclick="deleteTeacher('${teacherId}')">Delete</button>
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;
        }

        // Render Custom Fields Display
        function renderCustomFieldsDisplay(customFields) {
            let html = '<div class="teacher-info" style="margin-top: 10px; border-top: 1px solid #ddd; padding-top: 10px;">';
            for (const [key, value] of Object.entries(customFields)) {
                html += `
                    <div class="info-item">
                        <span class="info-label">${key}:</span>
                        <span class="info-value">${value}</span>
                    </div>
                `;
            }
            html += '</div>';
            return html;
        }

        // Filter Teachers
        function filterTeachers() {
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();
            const departmentFilter = document.getElementById('departmentFilter').value;
            const statusFilter = document.getElementById('statusFilter').value;

            const teacherCards = document.querySelectorAll('.teacher-card');
            
            teacherCards.forEach(card => {
                const teacherId = card.getAttribute('data-teacher-id');
                const teacher = teachersData[teacherId];
                
                if (!teacher) return;
                
                const matchesSearch = !searchTerm || 
                    `${teacher.firstName} ${teacher.lastName}`.toLowerCase().includes(searchTerm) ||
                    (teacher.email && teacher.email.toLowerCase().includes(searchTerm)) ||
                    (teacher.teacherId && teacher.teacherId.toLowerCase().includes(searchTerm));
                
                const matchesDepartment = !departmentFilter || teacher.department === departmentFilter;
                const matchesStatus = !statusFilter || teacher.status === statusFilter;
                
                if (matchesSearch && matchesDepartment && matchesStatus) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        }

        // File Upload Handling
        function handleFileSelection(file) {
            if (!file.name.match(/\.(xlsx|xls)$/)) {
                showNotification('Please select an Excel file (.xlsx or .xls)', 'error');
                return;
            }

            uploadedFile = file;
            document.getElementById('processBtn').disabled = false;
            
            // Preview file info
            const previewContainer = document.getElementById('previewContainer');
            const previewContent = document.getElementById('previewContent');
            
            previewContent.innerHTML = `
                <p><strong>File:</strong> ${file.name}</p>
                <p><strong>Size:</strong> ${(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <p><strong>Type:</strong> ${file.type}</p>
            `;
            
            previewContainer.style.display = 'block';
            showNotification('File selected. Click "Process File" to continue.', 'info');
        }

        // Process Excel File
        function processFile() {
            if (!uploadedFile) {
                showNotification('Please select a file first', 'error');
                return;
            }

            const progressBar = document.querySelector('.progress-bar');
            const progressFill = document.getElementById('uploadProgress');
            
            progressBar.style.display = 'block';
            progressFill.style.width = '20%';

            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);

                    progressFill.style.width = '60%';

                    if (jsonData.length === 0) {
                        showNotification('The Excel file appears to be empty', 'error');
                        progressBar.style.display = 'none';
                        return;
                    }

                    // Process and validate data
                    const processedTeachers = [];
                    const errors = [];

                    jsonData.forEach((row, index) => {
                        const teacher = processExcelRow(row, index + 2); // +2 for header and 0-index
                        if (teacher.errors.length > 0) {
                            errors.push(...teacher.errors);
                        } else {
                            processedTeachers.push(teacher.data);
                        }
                    });

                    progressFill.style.width = '80%';

                    if (errors.length > 0) {
                        showNotification(`Found ${errors.length} errors in the file. Please check the console for details.`, 'error');
                        console.error('Excel import errors:', errors);
                        progressBar.style.display = 'none';
                        return;
                    }

                    // Import to Firebase
                    importTeachersToFirebase(processedTeachers)
                        .then(() => {
                            progressFill.style.width = '100%';
                            showNotification(`Successfully imported ${processedTeachers.length} teachers!`, 'success');
                            setTimeout(() => {
                                progressBar.style.display = 'none';
                                progressFill.style.width = '0%';
                            }, 2000);
                        })
                        .catch((error) => {
                            showNotification('Error importing teachers: ' + error.message, 'error');
                            progressBar.style.display = 'none';
                        });

                } catch (error) {
                    showNotification('Error processing file: ' + error.message, 'error');
                    progressBar.style.display = 'none';
                }
            };

            reader.readAsArrayBuffer(uploadedFile);
        }

        // Process Excel Row
        function processExcelRow(row, rowNumber) {
            const errors = [];
            const teacher = {};

            // Required fields
            const requiredFields = ['teacherId', 'firstName', 'lastName', 'email', 'department'];
            
            requiredFields.forEach(field => {
                if (!row[field] || row[field].toString().trim() === '') {
                    errors.push(`Row ${rowNumber}: Missing required field '${field}'`);
                }
            });

            // Map Excel columns to teacher object
            teacher.teacherId = row.teacherId?.toString().trim();
            teacher.firstName = row.firstName?.toString().trim();
            teacher.lastName = row.lastName?.toString().trim();
            teacher.email = row.email?.toString().trim();
            teacher.phone = row.phone?.toString().trim() || '';
            teacher.department = row.department?.toString().trim();
            teacher.position = row.position?.toString().trim() || '';
            teacher.salary = row.salary ? parseFloat(row.salary) : 0;
            teacher.experience = row.experience ? parseInt(row.experience) : 0;
            teacher.qualification = row.qualification?.toString().trim() || '';
            teacher.joiningDate = row.joiningDate || '';
            teacher.status = row.status?.toString().trim() || 'Active';
            teacher.address = row.address?.toString().trim() || '';

            // Add metadata
            teacher.createdAt = new Date().toISOString();
            teacher.updatedAt = new Date().toISOString();
            teacher.createdBy = 'bulk_import';

            // Handle custom fields (any additional columns)
            const customFields = {};
            const standardFields = ['teacherId', 'firstName', 'lastName', 'email', 'phone', 'department', 
                                   'position', 'salary', 'experience', 'qualification', 'joiningDate', 'status', 'address'];
            
            Object.keys(row).forEach(key => {
                if (!standardFields.includes(key) && row[key]) {
                    customFields[key] = row[key].toString().trim();
                }
            });

            if (Object.keys(customFields).length > 0) {
                teacher.customFields = customFields;
            }

            return { data: teacher, errors };
        }

        // Import Teachers to Firebase
        async function importTeachersToFirebase(teachers) {
            const updates = {};
            teachers.forEach(teacher => {
                updates[teacher.teacherId] = teacher;
            });
            
            return teachersRef.update(updates);
        }

        // Download Excel Template
        function downloadTemplate() {
            const templateData = [
                {
                    teacherId: 'T001',
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john.doe@school.com',
                    phone: '1234567890',
                    department: 'Mathematics',
                    position: 'Senior Teacher',
                    salary: 50000,
                    experience: 5,
                    qualification: 'M.Ed',
                    joiningDate: '2023-01-15',
                    status: 'Active',
                    address: '123 Main St, City',
                    specialization: 'Algebra',
                    certifications: 'CBSE Certified'
                }
            ];

            const worksheet = XLSX.utils.json_to_sheet(templateData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Teachers');
            
            XLSX.writeFile(workbook, 'teachers_template.xlsx');
            showNotification('Template downloaded successfully!', 'success');
        }

        // Export to Excel
        function exportToExcel() {
            const teachers = Object.values(teachersData);
            if (teachers.length === 0) {
                showNotification('No teachers to export', 'error');
                return;
            }

            // Prepare data for export
            const exportData = teachers.map(teacher => {
                const row = {
                    teacherId: teacher.teacherId,
                    firstName: teacher.firstName,
                    lastName: teacher.lastName,
                    email: teacher.email,
                    phone: teacher.phone,
                    department: teacher.department,
                    position: teacher.position,
                    salary: teacher.salary,
                    experience: teacher.experience,
                    qualification: teacher.qualification,
                    joiningDate: teacher.joiningDate,
                    status: teacher.status,
                    address: teacher.address,
                    createdAt: teacher.createdAt
                };

                // Add custom fields
                if (teacher.customFields) {
                    Object.assign(row, teacher.customFields);
                }

                return row;
            });

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Teachers');
            
            const fileName = `teachers_export_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(workbook, fileName);
            
            showNotification(`Exported ${teachers.length} teachers successfully!`, 'success');
        }

        // Show Notification
        function showNotification(message, type) {
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => notification.classList.add('show'), 100);
            
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => document.body.removeChild(notification), 300);
            }, 4000);
        }

        // Modal click outside to close
        window.addEventListener('click', function(e) {
            const modal = document.getElementById('editModal');
            if (e.target === modal) {
                closeEditModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            // Escape key closes modal
            if (e.key === 'Escape') {
                closeEditModal();
            }
            
            // Ctrl+N for new teacher (when on add teacher tab)
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                switchTab('add-teacher');
                document.getElementById('teacherId').focus();
            }
        });

        // Auto-generate Teacher ID
        function generateTeacherId() {
            const teachers = Object.values(teachersData);
            const existingIds = teachers.map(t => t.teacherId).filter(id => id.startsWith('T'));
            let maxNumber = 0;
            
            existingIds.forEach(id => {
                const number = parseInt(id.replace('T', ''));
                if (number > maxNumber) {
                    maxNumber = number;
                }
            });
            
            return 'T' + String(maxNumber + 1).padStart(3, '0');
        }

        // Focus on Teacher ID field and suggest auto-generated ID
        document.getElementById('teacherId').addEventListener('focus', function() {
            if (!this.value) {
                this.placeholder = generateTeacherId();
            }
        });

        // Use suggested ID on double click
        document.getElementById('teacherId').addEventListener('dblclick', function() {
            if (!this.value) {
                this.value = generateTeacherId();
            }
        });






        
