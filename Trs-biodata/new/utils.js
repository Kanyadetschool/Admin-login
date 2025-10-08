// Utility Functions Module

/**
 * Show notification message
 */
function showNotification(message, type = 'info') {
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

/**
 * Generate unique teacher ID
 */
function generateTeacherId(teachersData) {
    const teachers = Object.values(teachersData);
    const existingIds = teachers.map(t => t.teacherId).filter(id => id && id.startsWith('T'));
    let maxNumber = 0;
    
    existingIds.forEach(id => {
        const number = parseInt(id.replace('T', ''));
        if (number > maxNumber) {
            maxNumber = number;
        }
    });
    
    return 'T' + String(maxNumber + 1).padStart(3, '0');
}

/**
 * Format date to readable string
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

/**
 * Format date to ISO string (YYYY-MM-DD)
 */
function formatDateISO(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
}

/**
 * Get form data as object
 */
function getFormData(formElement) {
    const formData = new FormData(formElement);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    return data;
}

/**
 * Get custom fields from form
 */
function getCustomFields(container) {
    const customFields = {};
    const fieldItems = container.querySelectorAll('.custom-field-item');
    
    fieldItems.forEach(item => {
        const keyInput = item.querySelector('input[placeholder="Field Name"]');
        const valueInput = item.querySelector('input[placeholder="Field Value"]');
        
        if (keyInput && valueInput && keyInput.value && valueInput.value) {
            customFields[keyInput.value.trim()] = valueInput.value.trim();
        }
    });
    
    return customFields;
}

/**
 * Render custom fields for display
 */
function renderCustomFieldsDisplay(customFields) {
    if (!customFields || Object.keys(customFields).length === 0) {
        return '';
    }
    
    let html = '<div class="teacher-info" style="margin-top: 10px; border-top: 1px solid #ddd; padding-top: 10px;">';
    
    for (const [key, value] of Object.entries(customFields)) {
        html += `
            <div class="info-item">
                <span class="info-label">${escapeHtml(key)}:</span>
                <span class="info-value">${escapeHtml(value)}</span>
            </div>
        `;
    }
    
    html += '</div>';
    return html;
}

/**
 * Render custom fields for edit form
 */
function renderCustomFieldsForEdit(customFields) {
    if (!customFields) return '';
    
    let html = '';
    for (const [key, value] of Object.entries(customFields)) {
        html += `
            <div class="custom-field-item">
                <input type="text" placeholder="Field Name" value="${escapeHtml(key)}">
                <input type="text" placeholder="Field Value" value="${escapeHtml(value)}">
                <button type="button" class="btn btn-danger btn-small" onclick="removeCustomField(this)">Remove</button>
            </div>
        `;
    }
    return html;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate phone number (basic)
 */
function isValidPhone(phone) {
    if (!phone) return true; // Phone is optional
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone);
}

/**
 * Calculate age from date of birth
 */
function calculateAge(dateOfBirth) {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
}

/**
 * Get current month teachers
 */
function getTeachersAddedThisMonth(teachersData) {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    return Object.values(teachersData).filter(teacher => {
        if (!teacher.createdAt) return false;
        const teacherDate = new Date(teacher.createdAt);
        return teacherDate.getMonth() === currentMonth && 
               teacherDate.getFullYear() === currentYear;
    });
}

/**
 * Get department statistics
 */
function getDepartmentStats(teachersData) {
    const stats = {};
    
    Object.values(teachersData).forEach(teacher => {
        if (teacher.department) {
            stats[teacher.department] = (stats[teacher.department] || 0) + 1;
        }
    });
    
    return stats;
}

/**
 * Sort teachers by field
 */
function sortTeachers(teachers, field, ascending = true) {
    return teachers.sort((a, b) => {
        let aVal = a[field];
        let bVal = b[field];
        
        // Handle null/undefined values
        if (!aVal) return 1;
        if (!bVal) return -1;
        
        // Convert to lowercase for string comparison
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        
        if (aVal < bVal) return ascending ? -1 : 1;
        if (aVal > bVal) return ascending ? 1 : -1;
        return 0;
    });
}

/**
 * Filter teachers by criteria
 */
function filterTeachersData(teachersData, searchTerm, department, status) {
    return Object.entries(teachersData).filter(([teacherId, teacher]) => {
        const matchesSearch = !searchTerm || 
            `${teacher.firstName} ${teacher.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (teacher.email && teacher.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (teacher.teacherId && teacher.teacherId.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesDepartment = !department || teacher.department === department;
        const matchesStatus = !status || teacher.status === status;
        
        return matchesSearch && matchesDepartment && matchesStatus;
    });
}

/**
 * Export data to Excel
 */
function exportDataToExcel(data, filename, sheetName = 'Sheet1') {
    if (!data || data.length === 0) {
        showNotification('No data to export', 'error');
        return;
    }
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    XLSX.writeFile(workbook, filename);
}

/**
 * Process Excel row for import
 */
function processExcelRow(row, rowNumber, requiredFields) {
    const errors = [];
    const data = {};
    
    // Check required fields
    requiredFields.forEach(field => {
        if (!row[field] || row[field].toString().trim() === '') {
            errors.push(`Row ${rowNumber}: Missing required field '${field}'`);
        }
    });
    
    // Process all fields
    for (const [key, value] of Object.entries(row)) {
        if (value !== null && value !== undefined && value !== '') {
            data[key] = typeof value === 'string' ? value.trim() : value;
        }
    }
    
    return { data, errors };
}

/**
 * Debounce function for search optimization
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Check if date is today
 */
function isToday(dateString) {
    const today = new Date();
    const date = new Date(dateString);
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
}

/**
 * Calculate performance score
 */
function calculatePerformanceScore(metrics) {
    if (!metrics) return 0;
    
    const {
        classesAttended = 0,
        totalClasses = 1,
        studentRating = 0,
        punctuality = 0
    } = metrics;
    
    const attendanceScore = (classesAttended / totalClasses) * 40;
    const ratingScore = (studentRating / 5) * 40;
    const punctualityScore = punctuality * 20;
    
    return Math.round(attendanceScore + ratingScore + punctualityScore);
}

/**
 * Get performance level based on score
 */
function getPerformanceLevel(score) {
    if (score >= 90) return { level: 'Excellent', color: '#27ae60' };
    if (score >= 75) return { level: 'Good', color: '#3498db' };
    if (score >= 60) return { level: 'Average', color: '#f39c12' };
    return { level: 'Needs Improvement', color: '#e74c3c' };
}

/**
 * Initialize date input to today
 */
function initializeDateInput(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.value = getTodayDate();
    }
}

/**
 * Confirm action with user
 */
function confirmAction(message) {
    return confirm(message);
}