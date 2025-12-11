// =====================================================
// TEACHER SUBMISSION TRACKER - JAVASCRIPT
// =====================================================

// Global State
const state = {
    currentUser: null,
    isSigningUp: false,
    submissions: [],
    teachers: [],
    subjects: [
        'Mathematics', 'English', 'Kiswahili', 'Science',
        'Social Studies', 'Religious Education', 'Creative Arts',
        'Physical Education', 'Computer Studies'
    ],
    currentView: 'dashboard',
    isDarkMode: false
};

// =====================================================
// INITIALIZATION
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    loadTheme();
    loadMockData();
});

function initializeApp() {
    console.log('🚀 Teacher Submission Tracker Initialized');
    populateSubjectSelects();
}

function populateSubjectSelects() {
    const subjectSelect = document.getElementById('subject-select');
    const filterSubject = document.getElementById('filter-subject');
    
    state.subjects.forEach(subject => {
        const option1 = new Option(subject, subject);
        const option2 = new Option(subject, subject);
        subjectSelect?.appendChild(option1);
        filterSubject?.appendChild(option2);
    });
}

// =====================================================
// EVENT LISTENERS
// =====================================================
function setupEventListeners() {
    // Auth
    document.getElementById('auth-form')?.addEventListener('submit', handleAuth);
    document.getElementById('signup-link')?.addEventListener('click', toggleAuthMode);
    document.getElementById('signout-btn')?.addEventListener('click', handleSignOut);
    
    // Navigation
    document.querySelectorAll('.nav-item[data-view]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = e.currentTarget.dataset.view;
            switchView(view);
        });
    });
    
    document.querySelectorAll('[data-view-link]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const view = e.currentTarget.dataset.viewLink;
            switchView(view);
        });
    });
    
    // Mobile menu
    document.getElementById('mobile-menu-btn')?.addEventListener('click', toggleMobileMenu);
    
    // Theme toggle
    document.getElementById('theme-toggle')?.addEventListener('click', (e) => {
        e.preventDefault();
        toggleTheme();
    });
    
    // Submission modal
    document.getElementById('new-submission-btn')?.addEventListener('click', openSubmissionModal);
    document.getElementById('new-submission-btn-2')?.addEventListener('click', openSubmissionModal);
    document.getElementById('close-modal')?.addEventListener('click', closeSubmissionModal);
    document.getElementById('cancel-submit')?.addEventListener('click', closeSubmissionModal);
    document.getElementById('submission-form')?.addEventListener('submit', handleSubmission);
    
    // File upload
    const fileUploadArea = document.getElementById('file-upload-area');
    const fileInput = document.getElementById('file-input');
    
    fileUploadArea?.addEventListener('click', () => fileInput?.click());
    fileInput?.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    fileUploadArea?.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadArea.style.borderColor = 'var(--primary)';
    });
    
    fileUploadArea?.addEventListener('dragleave', () => {
        fileUploadArea.style.borderColor = 'var(--border)';
    });
    
    fileUploadArea?.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadArea.style.borderColor = 'var(--border)';
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            handleFileSelect({ target: fileInput });
        }
    });
    
    // Filters
    document.getElementById('filter-status')?.addEventListener('change', applyFilters);
    document.getElementById('filter-subject')?.addEventListener('change', applyFilters);
    document.getElementById('filter-grade')?.addEventListener('change', applyFilters);
    document.getElementById('filter-date')?.addEventListener('change', applyFilters);
    
    // Search
    document.getElementById('global-search')?.addEventListener('input', handleSearch);
    
    // Refresh
    document.getElementById('refresh-btn')?.addEventListener('click', refreshData);
}

// =====================================================
// AUTHENTICATION
// =====================================================
async function handleAuth(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    showLoading();
    
    // Simulate API call
    setTimeout(() => {
        if (state.isSigningUp) {
            state.currentUser = {
                id: Date.now(),
                email: email,
                name: email.split('@')[0],
                role: 'teacher'
            };
            showToast('Account created successfully!', 'success');
        } else {
            state.currentUser = {
                id: 1,
                email: email,
                name: email.split('@')[0],
                role: 'teacher'
            };
            showToast('Signed in successfully!', 'success');
        }
        
        hideLoading();
        showMainApp();
        renderDashboard();
    }, 1000);
}

function toggleAuthMode(e) {
    e.preventDefault();
    state.isSigningUp = !state.isSigningUp;
    
    const signinBtn = document.getElementById('signin-btn');
    const signupLink = document.getElementById('signup-link');
    
    if (state.isSigningUp) {
        signinBtn.querySelector('span').textContent = 'Sign Up';
        signupLink.textContent = 'Already have an account? Sign in here';
    } else {
        signinBtn.querySelector('span').textContent = 'Sign In';
        signupLink.textContent = "Don't have an account? Sign up here";
    }
}

function handleSignOut() {
    state.currentUser = null;
    state.submissions = [];
    document.getElementById('main-app').classList.add('hidden');
    document.getElementById('auth-container').classList.remove('hidden');
    showToast('Signed out successfully', 'info');
}

function showMainApp() {
    document.getElementById('auth-container').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    
    const userName = document.getElementById('user-name');
    const userRole = document.getElementById('user-role');
    
    if (userName) userName.textContent = state.currentUser.name;
    if (userRole) userRole.textContent = state.currentUser.role;
}

// =====================================================
// VIEW MANAGEMENT
// =====================================================
function switchView(viewName) {
    state.currentView = viewName;
    
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    // Show selected view
    const selectedView = document.getElementById(`${viewName}-view`);
    if (selectedView) {
        selectedView.classList.add('active');
    }
    
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.view === viewName) {
            item.classList.add('active');
        }
    });
    
    // Render view content
    switch(viewName) {
        case 'dashboard':
            renderDashboard();
            break;
        case 'my-submissions':
            renderMySubmissions();
            break;
        case 'all-submissions':
            renderAllSubmissions();
            break;
        case 'teachers':
            renderTeachers();
            break;
        case 'subjects':
            renderSubjects();
            break;
        case 'reports':
            renderReports();
            break;
    }
}

// =====================================================
// DASHBOARD RENDERING
// =====================================================
function renderDashboard() {
    const stats = calculateStats();
    
    document.getElementById('stat-total').textContent = stats.total;
    document.getElementById('stat-approved').textContent = stats.approved;
    document.getElementById('stat-pending').textContent = stats.pending;
    document.getElementById('stat-rejected').textContent = stats.rejected;
    
    renderRecentSubmissions();
    renderDeadlineAlerts();
    updateBadges();
}

function calculateStats() {
    const mySubmissions = state.submissions.filter(s => s.teacherId === state.currentUser?.id);
    
    return {
        total: mySubmissions.length,
        approved: mySubmissions.filter(s => s.status === 'approved').length,
        pending: mySubmissions.filter(s => s.status === 'pending').length,
        rejected: mySubmissions.filter(s => s.status === 'rejected').length
    };
}

function renderRecentSubmissions() {
    const tbody = document.getElementById('recent-submissions-tbody');
    if (!tbody) return;
    
    const mySubmissions = state.submissions
        .filter(s => s.teacherId === state.currentUser?.id)
        .slice(0, 5);
    
    tbody.innerHTML = mySubmissions.map(sub => `
        <tr>
            <td><strong>${sub.subject}</strong></td>
            <td>Grade ${sub.grade}</td>
            <td>${sub.type}</td>
            <td>${formatDate(sub.dateSubmitted)}</td>
            <td><span class="status-badge ${sub.status}">${sub.status}</span></td>
            <td>
                <button class="btn-icon-only" onclick="viewSubmission(${sub.id})" title="View">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                </button>
                <button class="btn-icon-only" onclick="deleteSubmission(${sub.id})" title="Delete">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </td>
        </tr>
    `).join('');
    
    if (mySubmissions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-secondary);">No submissions yet. Click "New Submission" to get started.</td></tr>';
    }
}

function renderDeadlineAlerts() {
    const alertsContainer = document.getElementById('deadline-alerts');
    if (!alertsContainer) return;
    
    const upcomingDeadlines = state.submissions
        .filter(s => s.teacherId === state.currentUser?.id && s.status === 'pending')
        .filter(s => {
            const dueDate = new Date(s.dueDate);
            const today = new Date();
            const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
            return daysUntil <= 7 && daysUntil >= 0;
        })
        .slice(0, 3);
    
    if (upcomingDeadlines.length === 0) {
        alertsContainer.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--text-secondary);">No upcoming deadlines</p>';
        return;
    }
    
    alertsContainer.innerHTML = upcomingDeadlines.map(sub => {
        const dueDate = new Date(sub.dueDate);
        const today = new Date();
        const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        
        return `
            <div style="padding: 1rem; border-left: 4px solid var(--warning); background: var(--bg-secondary); border-radius: 8px; margin-bottom: 0.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <strong>${sub.subject} - Grade ${sub.grade}</strong>
                        <p style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.25rem;">
                            ${sub.title}
                        </p>
                    </div>
                    <span class="status-badge pending" style="white-space: nowrap;">
                        ${daysUntil} day${daysUntil !== 1 ? 's' : ''} left
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

// =====================================================
// MY SUBMISSIONS VIEW
// =====================================================
function renderMySubmissions() {
    const tbody = document.getElementById('my-submissions-tbody');
    if (!tbody) return;
    
    let mySubmissions = state.submissions.filter(s => s.teacherId === state.currentUser?.id);
    
    // Apply filters
    mySubmissions = applySubmissionFilters(mySubmissions);
    
    tbody.innerHTML = mySubmissions.map(sub => `
        <tr>
            <td><strong>${sub.subject}</strong></td>
            <td>Grade ${sub.grade}</td>
            <td>${sub.type}</td>
            <td>${formatDate(sub.dateSubmitted)}</td>
            <td><span class="status-badge ${sub.status}">${sub.status}</span></td>
            <td>
                ${sub.fileName ? `<a href="#" onclick="downloadFile(${sub.id})" style="color: var(--primary); text-decoration: underline;">${sub.fileName}</a>` : 'N/A'}
            </td>
            <td>
                <button class="btn-icon-only" onclick="viewSubmission(${sub.id})" title="View">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                </button>
                <button class="btn-icon-only" onclick="editSubmission(${sub.id})" title="Edit">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                </button>
                <button class="btn-icon-only" onclick="deleteSubmission(${sub.id})" title="Delete">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </td>
        </tr>
    `).join('');
    
    if (mySubmissions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-secondary);">No submissions found matching your filters.</td></tr>';
    }
}

function applySubmissionFilters(submissions) {
    const statusFilter = document.getElementById('filter-status')?.value || 'all';
    const subjectFilter = document.getElementById('filter-subject')?.value || 'all';
    const gradeFilter = document.getElementById('filter-grade')?.value || 'all';
    const dateFilter = document.getElementById('filter-date')?.value;
    
    return submissions.filter(sub => {
        if (statusFilter !== 'all' && sub.status !== statusFilter) return false;
        if (subjectFilter !== 'all' && sub.subject !== subjectFilter) return false;
        if (gradeFilter !== 'all' && sub.grade !== gradeFilter) return false;
        if (dateFilter && !sub.dateSubmitted.startsWith(dateFilter)) return false;
        return true;
    });
}

function applyFilters() {
    renderMySubmissions();
}

// =====================================================
// ALL SUBMISSIONS VIEW
// =====================================================
function renderAllSubmissions() {
    const view = document.getElementById('all-submissions-view');
    if (!view) return;
    
    view.innerHTML = `
        <div class="page-header">
            <h1>All Submissions</h1>
        </div>
        
        <div class="card">
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Teacher</th>
                            <th>Subject</th>
                            <th>Grade</th>
                            <th>Type</th>
                            <th>Date Submitted</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.submissions.map(sub => `
                            <tr>
                                <td>${sub.teacherName}</td>
                                <td><strong>${sub.subject}</strong></td>
                                <td>Grade ${sub.grade}</td>
                                <td>${sub.type}</td>
                                <td>${formatDate(sub.dateSubmitted)}</td>
                                <td><span class="status-badge ${sub.status}">${sub.status}</span></td>
                                <td>
                                    <button class="btn-icon-only" onclick="viewSubmission(${sub.id})" title="View">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// =====================================================
// TEACHERS VIEW
// =====================================================
function renderTeachers() {
    const view = document.getElementById('teachers-view');
    if (!view) return;
    
    view.innerHTML = `
        <div class="page-header">
            <h1>Teachers</h1>
        </div>
        
        <div class="stats-grid">
            ${state.teachers.map(teacher => `
                <div class="stat-card">
                    <div class="stat-icon blue">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                    </div>
                    <div class="stat-content">
                        <p class="stat-label">${teacher.name}</p>
                        <h3 class="stat-value">${teacher.submissions}</h3>
                        <p class="stat-change neutral">${teacher.subjects.join(', ')}</p>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// =====================================================
// SUBJECTS VIEW
// =====================================================
function renderSubjects() {
    const view = document.getElementById('subjects-view');
    if (!view) return;
    
    const subjectStats = state.subjects.map(subject => {
        const submissions = state.submissions.filter(s => s.subject === subject);
        return {
            name: subject,
            count: submissions.length,
            pending: submissions.filter(s => s.status === 'pending').length
        };
    });
    
    view.innerHTML = `
        <div class="page-header">
            <h1>Subjects</h1>
        </div>
        
        <div class="stats-grid">
            ${subjectStats.map(subject => `
                <div class="stat-card">
                    <div class="stat-icon green">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                        </svg>
                    </div>
                    <div class="stat-content">
                        <p class="stat-label">${subject.name}</p>
                        <h3 class="stat-value">${subject.count}</h3>
                        <p class="stat-change ${subject.pending > 0 ? 'neutral' : 'positive'}">
                            ${subject.pending} pending
                        </p>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// =====================================================
// REPORTS VIEW
// =====================================================
function renderReports() {
    const view = document.getElementById('reports-view');
    if (!view) return;
    
    view.innerHTML = `
        <div class="page-header">
            <h1>Reports & Analytics</h1>
            <button class="btn-primary" onclick="generateReport()">
                <svg class="btn-icon-left" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <span>Generate Report</span>
            </button>
        </div>
        
        <div class="card">
            <h2 style="margin-bottom: 1.5rem;">Submission Trends</h2>
            <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                <svg style="width: 64px; height: 64px; margin: 0 auto 1rem; opacity: 0.5;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
                <p>Chart visualization coming soon</p>
            </div>
        </div>
    `;
}

// =====================================================
// SUBMISSION MODAL
// =====================================================
function openSubmissionModal() {
    document.getElementById('submission-modal').classList.add('active');
    document.getElementById('submission-form').reset();
    document.getElementById('file-preview').classList.add('hidden');
}

function closeSubmissionModal() {
    document.getElementById('submission-modal').classList.remove('active');
}

async function handleSubmission(e) {
    e.preventDefault();
    
    const subject = document.getElementById('subject-select').value;
    const grade = document.getElementById('grade-select').value;
    const type = document.getElementById('type-select').value;
    const dueDate = document.getElementById('due-date').value;
    const title = document.getElementById('submission-title').value;
    const description = document.getElementById('submission-description').value;
    const fileInput = document.getElementById('file-input');
    
    if (!fileInput.files[0]) {
        showToast('Please upload a file', 'error');
        return;
    }
    
    showLoading();
    
    // Simulate file upload
    setTimeout(() => {
        const newSubmission = {
            id: Date.now(),
            teacherId: state.currentUser.id,
            teacherName: state.currentUser.name,
            subject,
            grade,
            type,
            dueDate,
            title,
            description,
            fileName: fileInput.files[0].name,
            dateSubmitted: new Date().toISOString().split('T')[0],
            status: 'pending'
        };
        
        state.submissions.unshift(newSubmission);
        
        hideLoading();
        closeSubmissionModal();
        showToast('Submission created successfully!', 'success');
        
        if (state.currentView === 'dashboard') {
            renderDashboard();
        } else if (state.currentView === 'my-submissions') {
            renderMySubmissions();
        }
        
        updateBadges();
    }, 1500);
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const filePreview = document.getElementById('file-preview');
    filePreview.classList.remove('hidden');
    filePreview.innerHTML = `
        <svg style="width: 24px; height: 24px; color: var(--primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
        </svg>
        <div style="flex: 1;">
            <strong>${file.name}</strong>
            <p style="font-size: 0.75rem; color: var(--text-secondary);">${formatFileSize(file.size)}</p>
        </div>
        <button type="button" onclick="clearFile()" style="background: none; border: none; cursor: pointer; color: var(--danger);">
            <svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        </button>
    `;
}

function clearFile() {
    document.getElementById('file-input').value = '';
    document.getElementById('file-preview').classList.add('hidden');
}

// =====================================================
// SUBMISSION ACTIONS
// =====================================================
function viewSubmission(id) {
    const submission = state.submissions.find(s => s.id === id);
    if (!submission) return;
    
    showToast(`Viewing: ${submission.title}`, 'info');
}

function editSubmission(id) {
    showToast('Edit functionality coming soon', 'info');
}

function deleteSubmission(id) {
    if (!confirm('Are you sure you want to delete this submission?')) return;
    
    state.submissions = state.submissions.filter(s => s.id !== id);
    showToast('Submission deleted successfully', 'success');
    
    if (state.currentView === 'dashboard') {
        renderDashboard();
    } else if (state.currentView === 'my-submissions') {
        renderMySubmissions();
    }
    
    updateBadges();
}

function downloadFile(id) {
    const submission = state.submissions.find(s => s.id === id);
    if (!submission) return;
    
    showToast(`Downloading: ${submission.fileName}`, 'info');
}

function generateReport() {
    showLoading();
    setTimeout(() => {
        hideLoading();
        showToast('Report generated successfully!', 'success');
    }, 1500);
}

// =====================================================
// SEARCH FUNCTIONALITY
// =====================================================
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    if (!searchTerm) return;
    
    const results = state.submissions.filter(sub => 
        sub.subject.toLowerCase().includes(searchTerm) ||
        sub.title.toLowerCase().includes(searchTerm) ||
        sub.teacherName.toLowerCase().includes(searchTerm) ||
        sub.type.toLowerCase().includes(searchTerm)
    );
    
    console.log(`Found ${results.length} results for "${searchTerm}"`);
}

// =====================================================
// UTILITIES
// =====================================================
function updateBadges() {
    const mySubmissions = state.submissions.filter(s => s.teacherId === state.currentUser?.id);
    const badge = document.getElementById('my-submissions-badge');
    if (badge) {
        badge.textContent = mySubmissions.length;
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// =====================================================
// THEME MANAGEMENT
// =====================================================
function toggleTheme() {
    state.isDarkMode = !state.isDarkMode;
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', state.isDarkMode ? 'dark' : 'light');
    showToast(`Switched to ${state.isDarkMode ? 'dark' : 'light'} mode`, 'info');
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        state.isDarkMode = true;
        document.documentElement.classList.add('dark');
    }
}

// =====================================================
// MOBILE MENU
// =====================================================
function toggleMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');
}

// =====================================================
// LOADING & NOTIFICATIONS
// =====================================================
function showLoading() {
    document.getElementById('loading-overlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading-overlay').classList.add('hidden');
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: `<svg style="width: 24px; height: 24px; color: var(--success);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>`,
        error: `<svg style="width: 24px; height: 24px; color: var(--danger);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>`,
        info: `<svg style="width: 24px; height: 24px; color: var(--info);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
               </svg>`
    };
    
    toast.innerHTML = `
        ${icons[type]}
        <span style="flex: 1;">${message}</span>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; cursor: pointer; color: var(--text-secondary);">
            <svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        </button>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// =====================================================
// REFRESH DATA
// =====================================================
function refreshData() {
    showLoading();
    setTimeout(() => {
        hideLoading();
        showToast('Data refreshed successfully', 'success');
        
        if (state.currentView === 'dashboard') {
            renderDashboard();
        } else if (state.currentView === 'my-submissions') {
            renderMySubmissions();
        } else if (state.currentView === 'all-submissions') {
            renderAllSubmissions();
        }
    }, 1000);
}

// =====================================================
// MOCK DATA
// =====================================================
function loadMockData() {
    // Mock Teachers
    state.teachers = [
        { id: 1, name: 'John Doe', subjects: ['Mathematics', 'Science'], submissions: 12 },
        { id: 2, name: 'Jane Smith', subjects: ['English', 'Kiswahili'], submissions: 15 },
        { id: 3, name: 'Peter Kamau', subjects: ['Social Studies'], submissions: 8 },
        { id: 4, name: 'Mary Wanjiku', subjects: ['Creative Arts', 'PE'], submissions: 10 },
        { id: 5, name: 'David Omondi', subjects: ['Computer Studies'], submissions: 6 }
    ];
    
    // Mock Submissions
    state.submissions = [
        {
            id: 1,
            teacherId: 1,
            teacherName: 'John Doe',
            subject: 'Mathematics',
            grade: '5',
            type: 'project',
            title: 'Geometry Projects Collection',
            description: 'Student projects on basic geometry concepts',
            fileName: 'math-grade5-projects.pdf',
            dateSubmitted: '2025-01-15',
            dueDate: '2025-01-20',
            status: 'approved'
        },
        {
            id: 2,
            teacherId: 1,
            teacherName: 'John Doe',
            subject: 'Science',
            grade: '4',
            type: 'practical',
            title: 'Simple Machines Practicals',
            description: 'Practical experiments on simple machines',
            fileName: 'science-grade4-practicals.pdf',
            dateSubmitted: '2025-01-18',
            dueDate: '2025-01-25',
            status: 'pending'
        },
        {
            id: 3,
            teacherId: 2,
            teacherName: 'Jane Smith',
            subject: 'English',
            grade: '5',
            type: 'assignment',
            title: 'Essay Writing Assignments',
            description: 'Collection of student essays',
            fileName: 'english-grade5-essays.docx',
            dateSubmitted: '2025-01-10',
            dueDate: '2025-01-15',
            status: 'approved'
        },
        {
            id: 4,
            teacherId: 2,
            teacherName: 'Jane Smith',
            subject: 'Kiswahili',
            grade: '4',
            type: 'project',
            title: 'Insha za Kiswahili',
            description: 'Student composition writing',
            fileName: 'kiswahili-grade4-insha.pdf',
            dateSubmitted: '2025-01-12',
            dueDate: '2025-01-18',
            status: 'rejected'
        },
        {
            id: 5,
            teacherId: 3,
            teacherName: 'Peter Kamau',
            subject: 'Social Studies',
            grade: '5',
            type: 'project',
            title: 'Community Studies Project',
            description: 'Research on local community',
            fileName: 'social-studies-grade5.pdf',
            dateSubmitted: '2025-01-20',
            dueDate: '2025-01-30',
            status: 'pending'
        },
        {
            id: 6,
            teacherId: 4,
            teacherName: 'Mary Wanjiku',
            subject: 'Creative Arts',
            grade: '4',
            type: 'project',
            title: 'Art Portfolio Grade 4',
            description: 'Student artwork collection',
            fileName: 'creative-arts-grade4.pdf',
            dateSubmitted: '2025-01-22',
            dueDate: '2025-02-05',
            status: 'approved'
        },
        {
            id: 7,
            teacherId: 5,
            teacherName: 'David Omondi',
            subject: 'Computer Studies',
            grade: '5',
            type: 'practical',
            title: 'Coding Projects',
            description: 'Basic programming exercises',
            fileName: 'computer-grade5-coding.pdf',
            dateSubmitted: '2025-01-19',
            dueDate: '2025-01-28',
            status: 'pending'
        },
        {
            id: 8,
            teacherId: 1,
            teacherName: 'John Doe',
            subject: 'Mathematics',
            grade: '4',
            type: 'assignment',
            title: 'Fractions Worksheets',
            description: 'Student work on fractions',
            fileName: 'math-grade4-fractions.pdf',
            dateSubmitted: '2025-01-21',
            dueDate: '2025-01-27',
            status: 'approved'
        }
    ];
    
    console.log(`📚 Loaded ${state.submissions.length} mock submissions`);
    console.log(`👥 Loaded ${state.teachers.length} mock teachers`);
}

// =====================================================
// KEYBOARD SHORTCUTS
// =====================================================
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K for search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('global-search')?.focus();
    }
    
    // Ctrl/Cmd + N for new submission
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        if (!document.getElementById('auth-container').classList.contains('hidden')) return;
        openSubmissionModal();
    }
    
    // Escape to close modal
    if (e.key === 'Escape') {
        const modal = document.getElementById('submission-modal');
        if (modal.classList.contains('active')) {
            closeSubmissionModal();
        }
        
        const sidebar = document.getElementById('sidebar');
        if (sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
        }
    }
});

// =====================================================
// CONSOLE WELCOME MESSAGE
// =====================================================
console.log('%c🎓 KANYADET Teacher Submission Tracker', 'color: #6366f1; font-size: 20px; font-weight: bold;');
console.log('%c✨ Advanced submission tracking system', 'color: #8b5cf6; font-size: 14px;');
console.log('%c⌨️ Keyboard Shortcuts:', 'color: #10b981; font-size: 14px; font-weight: bold;');
console.log('%c  Ctrl/Cmd + K: Focus search', 'color: #6b7280;');
console.log('%c  Ctrl/Cmd + N: New submission', 'color: #6b7280;');
console.log('%c  Esc: Close modal/menu', 'color: #6b7280;');

// =====================================================
// EXPORT FUNCTIONS TO WINDOW
// =====================================================
window.viewSubmission = viewSubmission;
window.editSubmission = editSubmission;
window.deleteSubmission = deleteSubmission;
window.downloadFile = downloadFile;
window.generateReport = generateReport;
window.clearFile = clearFile;// =====================================================
// TEACHER SUBMISSION TRACKER - JAVASCRIPT
// =====================================================



// =====================================================
// INITIALIZATION
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    loadTheme();
    loadMockData();
});

function initializeApp() {
    console.log('🚀 Teacher Submission Tracker Initialized');
    renderView('login');
    updateBadges();
}

function setupEventListeners() {
    document.getElementById('login-form')?.addEventListener('submit', handleLogin);
    document.getElementById('signup-form')?.addEventListener('submit', handleSignup);
    document.getElementById('submission-form')?.addEventListener('submit', handleSubmission);
    document.getElementById('file-input')?.addEventListener('change', handleFileSelect);
    document.getElementById('theme-toggle-btn')?.addEventListener('click', toggleTheme);
    document.getElementById('mobile-menu-btn')?.addEventListener('click', toggleMobileMenu);
    document.getElementById('refresh-btn')?.addEventListener('click', refreshData);
    document.getElementById('global-search')?.addEventListener('input', handleSearch);
}
function renderView(view) {
    state.currentView = view;
    const views = document.querySelectorAll('.view');
    views.forEach(v => v.classList.add('hidden'));
    document.getElementById(view)?.classList.remove('hidden');
    updateBadges();
    document.title = `KANYADET - ${view.charAt(0).toUpperCase() + view.slice(1)}`;
    // Additional view-specific logic can go here
    if (view === 'dashboard') {
        renderDashboard();
    }   else if (view === 'my-submissions') {
        renderMySubmissions();
    } else if (view === 'all-submissions') {
        renderAllSubmissions();
    } else if (view === 'teachers') {
        renderTeachers();
    } else if (view === 'subjects') {
        renderSubjects();
    }
    else if (view === 'reports') {
        renderReports();
    }
}

// =====================================================
// AUTHENTICATION
// =====================================================
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    showLoading();
    setTimeout(() => {
        state.currentUser = {
            id: 1,
            name: 'John Doe',
            email
        };
        hideLoading();
        showToast('Login successful!', 'success');
        renderView('dashboard');
    }, 1500);

}

function handleSignup(e) {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    showLoading();
    setTimeout(() => {
        state.currentUser = {
            id: 2,
            name: 'Jane Doe',
            email
        };
        hideLoading();
        showToast('Signup successful!', 'success');
        renderView('dashboard');
    }, 1500);
}
