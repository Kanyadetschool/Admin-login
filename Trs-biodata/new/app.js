// Main Application Module

// Global State
let teachersData = {};
let schedulesData = {};
let attendanceData = {};
let performanceData = {};
let currentEditingTeacher = null;
let uploadedFile = null;
let selectedTeachers = new Set();

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    setupFirebaseListeners();
    setupEventListeners();
    setupFileUpload();
    initializeDateInput('attendanceDate');
});

// ======================
// Firebase Listeners
// ======================

function setupFirebaseListeners() {
    // Connection Status
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

    // Teachers Data
    teachersRef.on('value', function(snapshot) {
        teachersData = snapshot.val() || {};
        updateDashboard();
        renderTeachersList();
        updateRecentActivity();
        populateTeacherSelects();
    });

    // Schedules Data
    schedulesRef.on('value', function(snapshot) {
        schedulesData = snapshot.val() || {};
        renderSchedulesList();
    });

    // Attendance Data
    attendanceRef.on('value', function(snapshot) {
        attendanceData = snapshot.val() || {};
        loadAttendance();
    });

    // Performance Data
    performanceRef.on('value', function(snapshot) {
        performanceData = snapshot.val() || {};
        renderPerformanceList();
    });

    // Real-time notifications
    teachersRef.on('child_added', function(snapshot, prevChildKey) {
        // Skip initial load
        if (prevChildKey !== null) {
            const teacher = snapshot.val();
            showNotification(`New teacher ${teacher.firstName} ${teacher.lastName} added!`, 'success');
        }
    });

    teachersRef.on('child_changed', function(snapshot) {
        const teacher = snapshot.val();
        showNotification(`Teacher ${teacher.firstName} ${teacher.lastName} updated!`, 'info');
    });

    teachersRef.on('child_removed', function(snapshot) {
        const teacher = snapshot.val();
        showNotification(`Teacher ${teacher.firstName} ${teacher.lastName} removed!`, 'error');
    });
}

// ======================
// Event Listeners Setup
// ======================

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

    // Schedule form submission
    document.getElementById('scheduleForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addSchedule();
    });

    // Teacher ID auto-generation
    const teacherIdInput = document.getElementById('teacherId');
    teacherIdInput.addEventListener('focus', function() {
        if (!this.value) {
            this.placeholder = generateTeacherId(teachersData);
        }
    });

    teacherIdInput.addEventListener('dblclick', function() {
        if (!this.value) {
            this.value = generateTeacherId(teachersData);
        }
    });

    // Modal close on outside click
    window.addEventListener('click', function(e) {
        const editModal = document.getElementById('editModal');
        const scheduleModal = document.getElementById('scheduleModal');
        
        if (e.target === editModal) {
            closeEditModal();
        }
        if (e.target === scheduleModal) {
            closeScheduleModal();
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeEditModal();
            closeScheduleModal();
        }
        
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            switchTab('add-teacher');
            document.getElementById('teacherId').focus();
        }
    });
}

// ======================
// Tab Management
// ======================

function switchTab(tabId) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');

    // Load tab-specific data
    if (tabId === 'attendance') {
        loadAttendance();
    } else if (tabId === 'performance') {
        renderPerformanceList();
    }
}

// ======================
// Dashboard Functions
// ======================

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

    // On leave count
    const onLeave = teachers.filter(t => t.status === 'On Leave').length;
    document.getElementById('onLeaveCount').textContent = onLeave;

    // New this month
    const newThisMonth = getTeachersAddedThisMonth(teachersData).length;
    document.getElementById('newThisMonth').textContent = newThisMonth;

    // Render department chart
    renderDepartmentChart();
}

function renderDepartmentChart() {
    const stats = getDepartmentStats(teachersData);
    const container = document.getElementById('departmentChart');
    
    if (Object.keys(stats).length === 0) {
        container.innerHTML = '<p>No data available</p>';
        return;
    }

    let html = '<div class="chart-bars">';
    const maxCount = Math.max(...Object.values(stats));
    
    for (const [dept, count] of Object.entries(stats)) {
        const percentage = (count / maxCount) * 100;
        html += `
            <div class="chart-bar-item" style="margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.3rem;">
                    <span>${dept}</span>
                    <strong>${count}</strong>
                </div>
                <div style="background: #ecf0f1; height: 25px; border-radius: 5px; overflow: hidden;">
                    <div style="background: linear-gradient(90deg, #3498db, #2ecc71); height: 100%; width: ${percentage}%; transition: width 0.3s ease;"></div>
                </div>
            </div>
        `;
    }
    html += '</div>';
    
    container.innerHTML = html;
}

function updateRecentActivity() {
    const teachers = Object.values(teachersData);
    const recentTeachers = teachers
        .filter(t => t.createdAt)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    const container = document.getElementById('recentActivity');
    if (recentTeachers.length === 0) {
        container.innerHTML = '<p style="color: #999;">No recent activity</p>';
        return;
    }

    let html = '<div class="activity-list">';
    recentTeachers.forEach(teacher => {
        const date = formatDate(teacher.createdAt);
        html += `
            <div style="padding: 0.75rem; border-bottom: 1px solid #ecf0f1;">
                <strong>${escapeHtml(teacher.firstName)} ${escapeHtml(teacher.lastName)}</strong>
                <p style="color: #666; font-size: 0.9rem; margin: 0.3rem 0 0 0;">
                    ${escapeHtml(teacher.department)} • ${date}
                </p>
            </div>
        `;
    });
    html += '</div>';
    container.innerHTML = html;
}

// ======================
// Teacher CRUD Operations
// ======================

function addTeacher() {
    const form = document.getElementById('teacherForm');
    const teacherData = getFormData(form);
    
    // Validation
    if (!teacherData.teacherId || !teacherData.firstName || !teacherData.lastName || 
        !teacherData.email || !teacherData.department) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    if (!isValidEmail(teacherData.email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }

    // Check if teacher ID already exists
    if (teachersData[teacherData.teacherId]) {
        showNotification('Teacher ID already exists. Please use a different ID.', 'error');
        return;
    }

    // Get custom fields
    const customFields = getCustomFields(document.getElementById('customFieldsContainer'));
    if (Object.keys(customFields).length > 0) {
        teacherData.customFields = customFields;
    }

    // Add metadata
    teacherData.createdAt = new Date().toISOString();
    teacherData.updatedAt = new Date().toISOString();
    teacherData.createdBy = 'admin';

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
                <input type="text" name="teacherId" value="${escapeHtml(teacher.teacherId || '')}" readonly>
            </div>
            <div class="form-group">
                <label>First Name *</label>
                <input type="text" name="firstName" value="${escapeHtml(teacher.firstName || '')}" required>
            </div>
            <div class="form-group">
                <label>Last Name *</label>
                <input type="text" name="lastName" value="${escapeHtml(teacher.lastName || '')}" required>
            </div>
            <div class="form-group">
                <label>Email *</label>
                <input type="email" name="email" value="${escapeHtml(teacher.email || '')}" required>
            </div>
            <div class="form-group">
                <label>Phone</label>
                <input type="tel" name="phone" value="${escapeHtml(teacher.phone || '')}">
            </div>
            <div class="form-group">
                <label>Department *</label>
                <select name="department" required>
                    <option value="">Select Department</option>
                    ${APP_CONFIG.departments.map(dept => 
                        `<option value="${dept}" ${teacher.department === dept ? 'selected' : ''}>${dept}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Position</label>
                <select name="position">
                    <option value="">Select Position</option>
                    ${APP_CONFIG.positions.map(pos => 
                        `<option value="${pos}" ${teacher.position === pos ? 'selected' : ''}>${pos}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Employment Type</label>
                <select name="employmentType">
                    ${APP_CONFIG.employmentTypes.map(type => 
                        `<option value="${type}" ${teacher.employmentType === type ? 'selected' : ''}>${type}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Experience (Years)</label>
                <input type="number" name="experience" value="${teacher.experience || ''}" min="0">
            </div>
            <div class="form-group">
                <label>Qualification</label>
                <input type="text" name="qualification" value="${escapeHtml(teacher.qualification || '')}">
            </div>
            <div class="form-group">
                <label>Specialization</label>
                <input type="text" name="specialization" value="${escapeHtml(teacher.specialization || '')}">
            </div>
            <div class="form-group">
                <label>Joining Date</label>
                <input type="date" name="joiningDate" value="${teacher.joiningDate || ''}">
            </div>
            <div class="form-group">
                <label>Date of Birth</label>
                <input type="date" name="dateOfBirth" value="${teacher.dateOfBirth || ''}">
            </div>
            <div class="form-group">
                <label>Gender</label>
                <select name="gender">
                    <option value="">Select Gender</option>
                    <option value="Male" ${teacher.gender === 'Male' ? 'selected' : ''}>Male</option>
                    <option value="Female" ${teacher.gender === 'Female' ? 'selected' : ''}>Female</option>
                    <option value="Other" ${teacher.gender === 'Other' ? 'selected' : ''}>Other</option>
                </select>
            </div>
            <div class="form-group">
                <label>National ID</label>
                <input type="text" name="nationalId" value="${escapeHtml(teacher.nationalId || '')}">
            </div>
            <div class="form-group">
                <label>Status</label>
                <select name="status">
                    ${APP_CONFIG.statuses.map(status => 
                        `<option value="${status}" ${teacher.status === status ? 'selected' : ''}>${status}</option>`
                    ).join('')}
                </select>
            </div>
        </div>
        <div class="form-group">
            <label>Address</label>
            <textarea name="address" rows="3">${escapeHtml(teacher.address || '')}</textarea>
        </div>
        <div class="form-group">
            <label>Emergency Contact</label>
            <input type="text" name="emergencyContact" value="${escapeHtml(teacher.emergencyContact || '')}">
        </div>
        <div class="form-group">
            <label>Certifications (comma-separated)</label>
            <textarea name="certifications" rows="2">${escapeHtml(teacher.certifications || '')}</textarea>
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

function updateTeacher() {
    if (!currentEditingTeacher) return;

    const form = document.getElementById('editTeacherForm');
    const teacherData = getFormData(form);

    // Validation
    if (!isValidEmail(teacherData.email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }

    // Get custom fields from edit form
    const customFields = getCustomFields(form.querySelector('#editCustomFieldsContainer'));
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

function deleteTeacher(teacherId) {
    if (!confirmAction('Are you sure you want to delete this teacher? This action cannot be undone.')) {
        return;
    }

    teachersRef.child(teacherId).remove()
        .then(() => {
            showNotification('Teacher deleted successfully!', 'success');
        })
        .catch((error) => {
            showNotification('Error deleting teacher: ' + error.message, 'error');
        });
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('show');
    currentEditingTeacher = null;
}

function resetForm() {
    document.getElementById('teacherForm').reset();
    document.getElementById('customFieldsContainer').innerHTML = '';
}

// ======================
// Teachers List Functions
// ======================

function renderTeachersList() {
    const container = document.getElementById('teachersContainer');
    const teachers = Object.entries(teachersData);

    if (teachers.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No teachers found</p>';
        return;
    }

    let html = '';
    teachers.forEach(([teacherId, teacher]) => {
        const isSelected = selectedTeachers.has(teacherId);
        html += `
            <div class="teacher-card" data-teacher-id="${teacherId}">
                <input type="checkbox" class="teacher-card-checkbox" 
                    ${isSelected ? 'checked' : ''} 
                    onchange="toggleTeacherSelection('${teacherId}')">
                <div class="teacher-card-header">
                    <h3 class="teacher-name">${escapeHtml(teacher.firstName)} ${escapeHtml(teacher.lastName)}</h3>
                    <span class="teacher-id">${escapeHtml(teacher.teacherId)}</span>
                </div>
                <div class="teacher-info">
                    <div class="info-item">
                        <span class="info-label">Email:</span>
                        <span class="info-value">${escapeHtml(teacher.email || 'N/A')}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Department:</span>
                        <span class="info-value">${escapeHtml(teacher.department || 'N/A')}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Position:</span>
                        <span class="info-value">${escapeHtml(teacher.position || 'N/A')}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Status:</span>
                        <span class="info-value" style="color: ${teacher.status === 'Active' ? '#27ae60' : teacher.status === 'On Leave' ? '#f39c12' : '#e74c3c'}">
                            ${escapeHtml(teacher.status || 'N/A')}
                        </span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Experience:</span>
                        <span class="info-value">${escapeHtml(teacher.experience || '0')} years</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Phone:</span>
                        <span class="info-value">${escapeHtml(teacher.phone || 'N/A')}</span>
                    </div>
                </div>
                ${renderCustomFieldsDisplay(teacher.customFields)}
                <div class="teacher-actions">
                    <button class="btn btn-primary btn-small" onclick="editTeacher('${teacherId}')">Edit</button>
                    <button class="btn btn-danger btn-small" onclick="deleteTeacher('${teacherId}')">Delete</button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function filterTeachers() {
    const searchTerm = document.getElementById('searchInput').value;
    const departmentFilter = document.getElementById('departmentFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;

    const teacherCards = document.querySelectorAll('.teacher-card');
    
    teacherCards.forEach(card => {
        const teacherId = card.getAttribute('data-teacher-id');
        const teacher = teachersData[teacherId];
        
        if (!teacher) return;
        
        const matchesSearch = !searchTerm || 
            `${teacher.firstName} ${teacher.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (teacher.email && teacher.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (teacher.teacherId && teacher.teacherId.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesDepartment = !departmentFilter || teacher.department === departmentFilter;
        const matchesStatus = !statusFilter || teacher.status === statusFilter;
        
        if (matchesSearch && matchesDepartment && matchesStatus) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('departmentFilter').value = '';
    document.getElementById('statusFilter').value = '';
    filterTeachers();
}

function toggleSelectAll() {
    const selectAllCheckbox = document.getElementById('selectAll');
    const teacherCheckboxes = document.querySelectorAll('.teacher-card-checkbox');
    
    teacherCheckboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
        const teacherId = checkbox.closest('.teacher-card').getAttribute('data-teacher-id');
        if (selectAllCheckbox.checked) {
            selectedTeachers.add(teacherId);
        } else {
            selectedTeachers.delete(teacherId);
        }
    });
    
    updateSelectedCount();
}

function toggleTeacherSelection(teacherId) {
    if (selectedTeachers.has(teacherId)) {
        selectedTeachers.delete(teacherId);
    } else {
        selectedTeachers.add(teacherId);
    }
    updateSelectedCount();
}

function updateSelectedCount() {
    document.getElementById('selectedCount').textContent = `${selectedTeachers.size} selected`;
}

function bulkDeleteSelected() {
    if (selectedTeachers.size === 0) {
        showNotification('Please select teachers to delete', 'warning');
        return;
    }

    if (!confirmAction(`Are you sure you want to delete ${selectedTeachers.size} teacher(s)? This action cannot be undone.`)) {
        return;
    }

    const promises = [];
    selectedTeachers.forEach(teacherId => {
        promises.push(teachersRef.child(teacherId).remove());
    });

    Promise.all(promises)
        .then(() => {
            showNotification(`${selectedTeachers.size} teacher(s) deleted successfully!`, 'success');
            selectedTeachers.clear();
            updateSelectedCount();
            document.getElementById('selectAll').checked = false;
        })
        .catch((error) => {
            showNotification('Error deleting teachers: ' + error.message, 'error');
        });
}

// ======================
// Custom Fields Management
// ======================

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

function removeCustomField(button) {
    button.parentElement.remove();
}

// ======================
// File Upload & Import
// ======================

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
        <p><strong>File:</strong> ${escapeHtml(file.name)}</p>
        <p><strong>Size:</strong> ${(file.size / 1024 / 1024).toFixed(2)} MB</p>
        <p><strong>Type:</strong> ${escapeHtml(file.type)}</p>
    `;
    
    previewContainer.style.display = 'block';
    showNotification('File selected. Click "Process File" to continue.', 'info');
}

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
            const requiredFields = ['teacherId', 'firstName', 'lastName', 'email', 'department'];

            jsonData.forEach((row, index) => {
                const result = processExcelRow(row, index + 2, requiredFields);
                
                if (result.errors.length > 0) {
                    errors.push(...result.errors);
                } else {
                    // Add metadata
                    result.data.createdAt = new Date().toISOString();
                    result.data.updatedAt = new Date().toISOString();
                    result.data.createdBy = 'bulk_import';
                    result.data.status = result.data.status || 'Active';
                    
                    processedTeachers.push(result.data);
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
                        uploadedFile = null;
                        document.getElementById('fileInput').value = '';
                        document.getElementById('previewContainer').style.display = 'none';
                        document.getElementById('processBtn').disabled = true;
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

async function importTeachersToFirebase(teachers) {
    const updates = {};
    teachers.forEach(teacher => {
        updates[teacher.teacherId] = teacher;
    });
    
    return teachersRef.update(updates);
}

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
            employmentType: 'Full-time',
            experience: 5,
            qualification: 'M.Ed',
            specialization: 'Algebra',
            joiningDate: '2023-01-15',
            dateOfBirth: '1985-05-20',
            gender: 'Male',
            nationalId: '12345678',
            status: 'Active',
            address: '123 Main St, City',
            emergencyContact: 'Jane Doe - 0987654321',
            certifications: 'CBSE Certified, Math Olympiad Trainer'
        }
    ];

    exportDataToExcel(templateData, 'teachers_template.xlsx', 'Teachers');
    showNotification('Template downloaded successfully!', 'success');
}

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
            employmentType: teacher.employmentType,
            experience: teacher.experience,
            qualification: teacher.qualification,
            specialization: teacher.specialization,
            joiningDate: teacher.joiningDate,
            dateOfBirth: teacher.dateOfBirth,
            gender: teacher.gender,
            nationalId: teacher.nationalId,
            status: teacher.status,
            address: teacher.address,
            emergencyContact: teacher.emergencyContact,
            certifications: teacher.certifications,
            createdAt: teacher.createdAt
        };

        // Add custom fields
        if (teacher.customFields) {
            Object.assign(row, teacher.customFields);
        }

        return row;
    });

    const fileName = `teachers_export_${getTodayDate()}.xlsx`;
    exportDataToExcel(exportData, fileName, 'Teachers');
    
    showNotification(`Exported ${teachers.length} teachers successfully!`, 'success');
}

// ======================
// Schedule Management
// ======================

function populateTeacherSelects() {
    const select = document.getElementById('scheduleTeacherId');
    const teachers = Object.values(teachersData);
    
    let html = '<option value="">Select Teacher</option>';
    teachers.forEach(teacher => {
        html += `<option value="${teacher.teacherId}">${escapeHtml(teacher.firstName)} ${escapeHtml(teacher.lastName)} - ${escapeHtml(teacher.department)}</option>`;
    });
    
    select.innerHTML = html;
}

function openScheduleModal() {
    document.getElementById('scheduleModal').classList.add('show');
}

function closeScheduleModal() {
    document.getElementById('scheduleModal').classList.remove('show');
    document.getElementById('scheduleForm').reset();
}

function addSchedule() {
    const form = document.getElementById('scheduleForm');
    const scheduleData = getFormData(form);
    
    if (!scheduleData.teacherId || !scheduleData.subject || !scheduleData.day || 
        !scheduleData.startTime || !scheduleData.endTime) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    // Generate schedule ID
    const scheduleId = `SCH_${Date.now()}`;
    scheduleData.scheduleId = scheduleId;
    scheduleData.createdAt = new Date().toISOString();

    schedulesRef.child(scheduleId).set(scheduleData)
        .then(() => {
            showNotification('Schedule added successfully!', 'success');
            closeScheduleModal();
        })
        .catch((error) => {
            showNotification('Error adding schedule: ' + error.message, 'error');
        });
}

function renderSchedulesList() {
    const container = document.getElementById('schedulesList');
    const schedules = Object.values(schedulesData);

    if (schedules.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No schedules found</p>';
        return;
    }

    // Group by day
    const groupedByDay = {};
    schedules.forEach(schedule => {
        if (!groupedByDay[schedule.day]) {
            groupedByDay[schedule.day] = [];
        }
        groupedByDay[schedule.day].push(schedule);
    });

    let html = '';
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    
    days.forEach(day => {
        if (groupedByDay[day]) {
            html += `<h3 style="margin-top: 2rem; color: var(--dark-color);">${day}</h3>`;
            groupedByDay[day].forEach(schedule => {
                const teacher = teachersData[schedule.teacherId];
                const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Unknown Teacher';
                
                html += `
                    <div class="schedule-card">
                        <div class="schedule-info">
                            <h4>${escapeHtml(schedule.subject)}</h4>
                            <p>${teacherName} • ${schedule.startTime} - ${schedule.endTime}</p>
                            ${schedule.room ? `<p>Room: ${escapeHtml(schedule.room)}</p>` : ''}
                        </div>
                        <button class="btn btn-danger btn-small" onclick="deleteSchedule('${schedule.scheduleId}')">Delete</button>
                    </div>
                `;
            });
        }
    });

    container.innerHTML = html;
}

function deleteSchedule(scheduleId) {
    if (!confirmAction('Are you sure you want to delete this schedule?')) {
        return;
    }

    schedulesRef.child(scheduleId).remove()
        .then(() => {
            showNotification('Schedule deleted successfully!', 'success');
        })
        .catch((error) => {
            showNotification('Error deleting schedule: ' + error.message, 'error');
        });
}

// ======================
// Attendance Management
// ======================

function loadAttendance() {
    const dateInput = document.getElementById('attendanceDate');
    const selectedDate = dateInput.value || getTodayDate();
    dateInput.value = selectedDate;

    const container = document.getElementById('attendanceList');
    const teachers = Object.values(teachersData).filter(t => t.status === 'Active');

    if (teachers.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No active teachers found</p>';
        return;
    }

    let html = '';
    teachers.forEach(teacher => {
        const attendanceKey = `${selectedDate}_${teacher.teacherId}`;
        const attendance = attendanceData[attendanceKey] || {};
        const status = attendance.status || '';

        html += `
            <div class="attendance-item">
                <div class="attendance-item-info">
                    <h4>${escapeHtml(teacher.firstName)} ${escapeHtml(teacher.lastName)}</h4>
                    <p>${escapeHtml(teacher.department)} • ${escapeHtml(teacher.teacherId)}</p>
                </div>
                <div class="attendance-status">
                    <button class="status-btn ${status === 'Present' ? 'present' : ''}" 
                        onclick="markAttendance('${teacher.teacherId}', '${selectedDate}', 'Present')">Present</button>
                    <button class="status-btn ${status === 'Absent' ? 'absent' : ''}" 
                        onclick="markAttendance('${teacher.teacherId}', '${selectedDate}', 'Absent')">Absent</button>
                    <button class="status-btn ${status === 'Leave' ? 'leave' : ''}" 
                        onclick="markAttendance('${teacher.teacherId}', '${selectedDate}', 'Leave')">Leave</button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function markAttendance(teacherId, date, status) {
    const attendanceKey = `${date}_${teacherId}`;
    const attendanceRecord = {
        teacherId: teacherId,
        date: date,
        status: status,
        markedAt: new Date().toISOString(),
        markedBy: 'admin'
    };

    attendanceRef.child(attendanceKey).set(attendanceRecord)
        .then(() => {
            showNotification(`Attendance marked as ${status}`, 'success');
        })
        .catch((error) => {
            showNotification('Error marking attendance: ' + error.message, 'error');
        });
}

function markAllPresent() {
    const dateInput = document.getElementById('attendanceDate');
    const selectedDate = dateInput.value || getTodayDate();
    const teachers = Object.values(teachersData).filter(t => t.status === 'Active');

    if (teachers.length === 0) {
        showNotification('No active teachers found', 'error');
        return;
    }

    if (!confirmAction(`Mark all ${teachers.length} active teachers as present for ${selectedDate}?`)) {
        return;
    }

    const updates = {};
    teachers.forEach(teacher => {
        const attendanceKey = `${selectedDate}_${teacher.teacherId}`;
        updates[attendanceKey] = {
            teacherId: teacher.teacherId,
            date: selectedDate,
            status: 'Present',
            markedAt: new Date().toISOString(),
            markedBy: 'admin'
        };
    });

    attendanceRef.update(updates)
        .then(() => {
            showNotification('All teachers marked as present!', 'success');
        })
        .catch((error) => {
            showNotification('Error marking attendance: ' + error.message, 'error');
        });
}

// ======================
// Performance Management
// ======================

function renderPerformanceList() {
    const container = document.getElementById('performanceList');
    const teachers = Object.values(teachersData);

    if (teachers.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No teachers found</p>';
        return;
    }

    let html = '';
    teachers.forEach(teacher => {
        const performance = performanceData[teacher.teacherId] || {
            classesAttended: 0,
            totalClasses: 1,
            studentRating: 0,
            punctuality: 0
        };

        const score = calculatePerformanceScore(performance);
        const level = getPerformanceLevel(score);

        html += `
            <div class="performance-card">
                <div class="performance-header">
                    <h3>${escapeHtml(teacher.firstName)} ${escapeHtml(teacher.lastName)}</h3>
                    <div class="performance-rating" style="background: ${level.color}">
                        ${score}/100 - ${level.level}
                    </div>
                </div>
                <div class="performance-metrics">
                    <div class="metric-item">
                        <h4>Attendance</h4>
                        <div class="metric-value">${performance.classesAttended}/${performance.totalClasses}</div>
                    </div>
                    <div class="metric-item">
                        <h4>Student Rating</h4>
                        <div class="metric-value">${performance.studentRating}/5</div>
                    </div>
                    <div class="metric-item">
                        <h4>Punctuality</h4>
                        <div class="metric-value">${(performance.punctuality * 100).toFixed(0)}%</div>
                    </div>
                    <div class="metric-item">
                        <h4>Experience</h4>
                        <div class="metric-value">${teacher.experience || 0} yrs</div>
                    </div>
                </div>
                <div style="margin-top: 1rem;">
                    <button class="btn btn-primary btn-small" onclick="updatePerformance('${teacher.teacherId}')">Update Metrics</button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function updatePerformance(teacherId) {
    const teacher = teachersData[teacherId];
    if (!teacher) return;

    const currentPerformance = performanceData[teacherId] || {
        classesAttended: 0,
        totalClasses: 0,
        studentRating: 0,
        punctuality: 0
    };

    const classesAttended = prompt(
        `Classes Attended (Current: ${currentPerformance.classesAttended}):`,
        currentPerformance.classesAttended
    );
    
    if (classesAttended === null) return;

    const totalClasses = prompt(
        `Total Classes (Current: ${currentPerformance.totalClasses}):`,
        currentPerformance.totalClasses
    );
    
    if (totalClasses === null) return;

    const studentRating = prompt(
        `Student Rating (0-5) (Current: ${currentPerformance.studentRating}):`,
        currentPerformance.studentRating
    );
    
    if (studentRating === null) return;

    const punctuality = prompt(
        `Punctuality (0-1) (Current: ${currentPerformance.punctuality}):`,
        currentPerformance.punctuality
    );
    
    if (punctuality === null) return;

    const performanceData = {
        teacherId: teacherId,
        classesAttended: parseInt(classesAttended) || 0,
        totalClasses: parseInt(totalClasses) || 1,
        studentRating: parseFloat(studentRating) || 0,
        punctuality: parseFloat(punctuality) || 0,
        updatedAt: new Date().toISOString()
    };

    performanceRef.child(teacherId).set(performanceData)
        .then(() => {
            showNotification('Performance metrics updated!', 'success');
        })
        .catch((error) => {
            showNotification('Error updating performance: ' + error.message, 'error');
        });
}