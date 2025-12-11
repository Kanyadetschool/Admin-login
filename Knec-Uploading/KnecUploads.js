// Admin Configuration
const ADMIN_EMAILS = [
    'admin@kanyadet.school',
    'oduorgeofrey141@gmail.com',
    'principal@kanyadet.school',
    'geofreyonayango167@gmail.com',  // Add your admin emails here
];

// Check if current user is admin
function isAdmin(userEmail) {
    return ADMIN_EMAILS.includes(userEmail.toLowerCase());
}

// ===================================
// SUPABASE CONFIGURATION
// ===================================
const SUPABASE_URL = 'https://ygwtztvyuimjxxxigaht.supabase.co'; // Replace with your URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlnd3R6dHZ5dWltanh4eGlnYWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyMjA0OTcsImV4cCI6MjA3Nzc5NjQ5N30.Gs-COgd8ReKqpjX9qS_GjkR0fU_zKNqHzaF5NX9ODeY'; // Replace with your key

// Initialize Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===================================
// FIREBASE CONFIGURATION (Keep for Database & Auth)
// ===================================
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

// Initialize Firebase (for Auth and Database only)
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();
// NOTE: Removed storage initialization - now using Supabase!

// Reference to submissions in database
const submissionsRef = database.ref('teacherSubmissions');

// Global state
let allSubmissions = [];
let currentFilters = {
    status: 'all',
    subject: 'all',
    search: ''
};
let currentUser = null;

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const mainApp = document.getElementById('mainApp');
const googleSignInBtn = document.getElementById('googleSignInBtn');
const signOutBtn = document.getElementById('signOutBtn');
const userPhoto = document.getElementById('userPhoto');
const userName = document.getElementById('userName');
const uploadBtn = document.getElementById('uploadBtn');
const uploadModal = document.getElementById('uploadModal');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const submitBtn = document.getElementById('submitBtn');
const fileUpload = document.getElementById('fileUpload');
const fileUploadArea = document.getElementById('fileUploadArea');
const fileInfo = document.getElementById('fileInfo');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const subjectFilter = document.getElementById('subjectFilter');
const exportBtn = document.getElementById('exportBtn');
const tableBody = document.getElementById('submissionsTableBody');
const noDataMessage = document.getElementById('noDataMessage');

// Authentication State Observer
let authInitialized = false;

auth.onAuthStateChanged((user) => {
    // Hide loading screen
    const authLoading = document.getElementById('authLoading');
    if (authLoading) {
        authLoading.style.display = 'none';
    }
    
    if (user) {
        currentUser = user;
        showMainApp(user);
        
        // Only initialize once
        if (!authInitialized) {
            authInitialized = true;
            initializeApp();
        }
    } else {
        currentUser = null;
        showLoginScreen();
    }
});


function showLoginScreen() {
    const authLoading = document.getElementById('authLoading');
    if (authLoading) authLoading.style.display = 'none';
    
    loginScreen.style.display = 'flex';
    mainApp.style.display = 'none';
}



// Show Main App
function showMainApp(user) {
    const authLoading = document.getElementById('authLoading');
    if (authLoading) authLoading.style.display = 'none';
    
    loginScreen.style.display = 'none';
    mainApp.style.display = 'block';
    
    userName.textContent = user.displayName || user.email;
    userPhoto.src = user.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.displayName || 'User');
    
    currentUser.isAdmin = isAdmin(user.email);
    
    if (currentUser.isAdmin) {
        userName.innerHTML += ' <span style="background: #ef4444; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-left: 8px;">ADMIN</span>';
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel) {
            adminPanel.style.display = 'block';
        }
    }
}

// Google Sign In
googleSignInBtn.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    
    googleSignInBtn.disabled = true;
    googleSignInBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
    
    auth.signInWithPopup(provider)
        .then((result) => {
            console.log('Signed in successfully:', result.user.email);
            showToast('Welcome ' + result.user.displayName, 'success');
        })
        .catch((error) => {
            console.error('Sign in error:', error);
            showToast('Sign in failed: ' + error.message, 'error');
            
            // Re-enable button with full HTML
            googleSignInBtn.disabled = false;
            googleSignInBtn.innerHTML = `
                <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                Sign in with Google
            `;
        });
});

// Sign Out
signOutBtn.addEventListener('click', () => {
    auth.signOut()
        .then(() => {
            showToast('Signed out successfully', 'success');
        })
        .catch((error) => {
            console.error('Sign out error:', error);
            showToast('Sign out failed', 'error');
        });
});

// Initialize App
let listenersInitialized = false;
let realtimeListenersSetup = false;  // ADD THIS

function initializeApp() {
    if (!listenersInitialized) {
        initializeEventListeners();
        listenersInitialized = true;
    }
    
    // Only setup realtime listeners once
    if (!realtimeListenersSetup) {
        setupRealtimeListener();
        realtimeListenersSetup = true;
    }
    
    loadSubmissions();
}


// File area click handler - defined BEFORE it's used
// File area click handler - defined BEFORE it's used
function handleFileAreaClick(e) {
    // Don't trigger if a file is already selected
    if (fileUpload.files.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        showToast('File already selected. Click "Change" to select a different file.', 'info');
        return;
    }
    fileUpload.click();
}

// File Handling
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            showToast('File size exceeds 10MB limit', 'error');
            fileUpload.value = '';
            return;
        }
        
        fileInfo.style.display = 'block';
        fileInfo.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px; background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-check-circle" style="color: #16a34a; font-size: 18px;"></i>
                    <div>
                        <div style="font-weight: 500; color: #15803d;">${file.name}</div>
                        <div style="color: #6b7280; font-size: 12px;">${formatFileSize(file.size)}</div>
                    </div>
                </div>
                <button type="button" onclick="changeFile()" class="btn-action" style="background: #6b7280; padding: 6px 12px; font-size: 13px;">
                    <i class="fas fa-sync-alt"></i> Change File
                </button>
            </div>
        `;
    }
}

// Function to change the selected file
window.changeFile = function() {
    fileUpload.value = '';
    fileInfo.style.display = 'none';
    fileInfo.innerHTML = '';
    fileUpload.click();
}

// Event Listeners
// Event Listeners
function initializeEventListeners() {
    uploadBtn.addEventListener('click', openModal);
    closeModal.addEventListener('click', closeUploadModal);
    cancelBtn.addEventListener('click', closeUploadModal);
    submitBtn.addEventListener('click', handleSubmission);
    
    fileUpload.addEventListener('change', handleFileSelect);
    
    // FIX: Properly handle file upload area click
    fileUploadArea.addEventListener('click', handleFileAreaClick);
    
    searchInput.addEventListener('input', (e) => {
        currentFilters.search = e.target.value.toLowerCase();
        filterAndDisplaySubmissions();
    });
    
    statusFilter.addEventListener('change', (e) => {
        currentFilters.status = e.target.value;
        filterAndDisplaySubmissions();
    });
    
    subjectFilter.addEventListener('change', (e) => {
        currentFilters.subject = e.target.value;
        filterAndDisplaySubmissions();
    });
    
    exportBtn.addEventListener('click', exportToCSV);
    
    uploadModal.addEventListener('click', (e) => {
        if (e.target === uploadModal) {
            closeUploadModal();
        }
    });
}



// Modal Functions
function openModal() {
    uploadModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeUploadModal() {
    uploadModal.classList.remove('active');
    document.body.style.overflow = 'auto';
    resetForm();
}

function resetForm() {
    document.getElementById('teacherName').value = '';
    document.getElementById('subject').value = '';
    document.getElementById('grade').value = '';
    document.getElementById('documentType').value = '';
    fileUpload.value = '';
    fileInfo.style.display = 'none';
    fileInfo.innerHTML = '';
    
    // Re-enable upload area
    fileUploadArea.style.pointerEvents = 'auto';
    fileUploadArea.style.opacity = '1';
}

// File Handling
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            showToast('File size exceeds 10MB limit', 'error');
            fileUpload.value = '';
            return;
        }
        
        fileInfo.style.display = 'block';
        fileInfo.innerHTML = `<i class="fas fa-file-alt"></i> Selected: ${file.name}`;
    }
}

// ===================================
// UPDATED: Submit Submission with Supabase Storage
// ===================================
async function handleSubmission() {
    const teacherName = document.getElementById('teacherName').value.trim();
    const subject = document.getElementById('subject').value;
    const grade = document.getElementById('grade').value;
    const documentType = document.getElementById('documentType').value;
    const file = fileUpload.files[0];
    
    // Validation
    if (!teacherName || !subject || !grade || !documentType || !file) {
        showToast('Please fill all required fields', 'error');
        return;
    }
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    
    try {
        // Upload file to Supabase Storage
        const timestamp = Date.now();
        const fileName = `${timestamp}_${file.name}`;
        
        // Upload to Supabase
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('submissions')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });
        
        if (uploadError) {
            throw uploadError;
        }
        
        // Get public URL
        const { data: urlData } = supabase.storage
            .from('submissions')
            .getPublicUrl(fileName);
        
        const fileURL = urlData.publicUrl;
        
        // Create submission object
        const submission = {
            teacherName,
            subject,
            grade,
            documentType,
            fileName: file.name,
            fileURL,
            fileSize: file.size,
            status: 'pending',
            submittedDate: new Date().toISOString(),
            timestamp: timestamp,
            submittedBy: currentUser.email,
            submittedByName: currentUser.displayName,
            userId: currentUser.uid,
            reviewedBy: null,
            reviewDate: null
        };
        
        // Save to Firebase Database
        await submissionsRef.push(submission);
        
        showToast('Submission uploaded successfully!', 'success');
        closeUploadModal();
        
    } catch (error) {
        console.error('Upload error:', error);
        showToast('Upload failed: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Document';
    }
}

// Load Submissions from Firebase
function loadSubmissions() {
    submissionsRef.once('value', (snapshot) => {
        allSubmissions = [];
        snapshot.forEach((childSnapshot) => {
            const submission = {
                id: childSnapshot.key,
                ...childSnapshot.val()
            };
            allSubmissions.push(submission);
        });
        
        allSubmissions.sort((a, b) => b.timestamp - a.timestamp);
        
        filterAndDisplaySubmissions();
        updateStatistics();
    });
}

// Setup Realtime Listener
function setupRealtimeListener() {
    // Remove any existing listeners first
    submissionsRef.off();
    
    submissionsRef.on('child_added', (snapshot) => {
        const newSubmission = {
            id: snapshot.key,
            ...snapshot.val()
        };
        
        const exists = allSubmissions.some(sub => sub.id === newSubmission.id);
        if (!exists) {
            allSubmissions.unshift(newSubmission);
            filterAndDisplaySubmissions();
            updateStatistics();
        }
    });
    
    submissionsRef.on('child_changed', (snapshot) => {
        const updatedSubmission = {
            id: snapshot.key,
            ...snapshot.val()
        };
        
        const index = allSubmissions.findIndex(sub => sub.id === updatedSubmission.id);
        if (index !== -1) {
            allSubmissions[index] = updatedSubmission;
            filterAndDisplaySubmissions();
            updateStatistics();
        }
    });
    
    submissionsRef.on('child_removed', (snapshot) => {
        allSubmissions = allSubmissions.filter(sub => sub.id !== snapshot.key);
        filterAndDisplaySubmissions();
        updateStatistics();
    });
}
// Filter and Display Submissions
function filterAndDisplaySubmissions() {
    let filtered = allSubmissions.filter(submission => {
        const matchesStatus = currentFilters.status === 'all' || 
                             submission.status === currentFilters.status;
        
        const matchesSubject = currentFilters.subject === 'all' || 
                              submission.subject === currentFilters.subject;
        
        const matchesSearch = submission.teacherName.toLowerCase().includes(currentFilters.search) ||
                             submission.subject.toLowerCase().includes(currentFilters.search) ||
                             submission.documentType.toLowerCase().includes(currentFilters.search);
        
        return matchesStatus && matchesSubject && matchesSearch;
    });
    
    displaySubmissions(filtered);
}

// Display Submissions in Table
function displaySubmissions(submissions) {
    tableBody.innerHTML = '';
    
    if (submissions.length === 0) {
        noDataMessage.style.display = 'block';
        return;
    }
    
    noDataMessage.style.display = 'none';
    
    submissions.forEach(submission => {
        const row = createSubmissionRow(submission);
        tableBody.appendChild(row);
    });
}

// Create Table Row
function createSubmissionRow(submission) {
    const row = document.createElement('tr');
    
    const date = new Date(submission.submittedDate);
    const formattedDate = date.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    const initials = submission.teacherName
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    
    const statusClass = `status-${submission.status}`;
    const statusIcon = getStatusIcon(submission.status);
    
    row.innerHTML = `
        <td>
            <div class="teacher-cell">
                <div class="teacher-avatar">${initials}</div>
                <span>${submission.teacherName}</span>
            </div>
        </td>
        <td>${submission.subject}</td>
        <td>${submission.grade}</td>
        <td>${submission.documentType}</td>
        <td>
            <i class="fas fa-calendar-alt" style="margin-right: 6px; color: #9ca3af;"></i>
            ${formattedDate}
        </td>
        <td>
            <span class="status-badge ${statusClass}">
                ${statusIcon}
                ${submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
            </span>
        </td>
        <td>
            <div class="action-buttons">
                ${createActionButtons(submission)}
            </div>
        </td>
    `;
    
    return row;
}

// Get Status Icon
function getStatusIcon(status) {
    const icons = {
        approved: '<i class="fas fa-check-circle"></i>',
        pending: '<i class="fas fa-clock"></i>',
        rejected: '<i class="fas fa-times-circle"></i>'
    };
    return icons[status] || '';
}

// Create Action Buttons all user see delete button
// function createActionButtons(submission) {
//     const viewButton = `
//         <button class="btn-action btn-view" onclick="viewFile('${submission.fileURL}', '${submission.fileName}')">
//             <i class="fas fa-eye"></i> View
//         </button>
//     `;
    
//     const downloadButton = `
//         <button class="btn-action btn-download" onclick="downloadFile('${submission.fileURL}', '${submission.fileName}')">
//             <i class="fas fa-download"></i> Download
//         </button>
//     `;
    
//     const deleteButton = `
//         <button class="btn-action btn-delete" onclick="deleteSubmission('${submission.id}', '${submission.fileName}')">
//             <i class="fas fa-trash"></i> Delete
//         </button>
//     `;
    
//     if (submission.status === 'pending') {
//         return `
//             ${viewButton}
//             <button class="btn-action btn-approve" onclick="updateSubmissionStatus('${submission.id}', 'approved')">
//                 <i class="fas fa-check"></i> Approve
//             </button>
//             <button class="btn-action btn-reject" onclick="updateSubmissionStatus('${submission.id}', 'rejected')">
//                 <i class="fas fa-times"></i> Reject
//             </button>
//             ${deleteButton}
//         `;
//     } else {
//         return `
//             ${viewButton}
//             ${downloadButton}
//             ${deleteButton}
//         `;
//     }
// }






// Create Action Buttons  only admin can delete
function createActionButtons(submission) {
    const viewButton = `
        <button class="btn-action btn-view" onclick="viewFile('${submission.fileURL}', '${submission.fileName}')">
            <i class="fas fa-eye"></i> View
        </button>
    `;
    
    const downloadButton = `
        <button class="btn-action btn-download" onclick="downloadFile('${submission.fileURL}', '${submission.fileName}')">
            <i class="fas fa-download"></i> Download
        </button>
    `;
    
    // Only show delete button to admins
    const deleteButton = currentUser && currentUser.isAdmin ? `
        <button class="btn-action btn-delete" onclick="deleteSubmission('${submission.id}', '${submission.fileName}')">
            <i class="fas fa-trash"></i> Delete
        </button>
    ` : '';
    
    if (submission.status === 'pending') {
        return `
            ${viewButton}
            <button class="btn-action btn-approve" onclick="updateSubmissionStatus('${submission.id}', 'approved')">
                <i class="fas fa-check"></i> Approve
            </button>
            <button class="btn-action btn-reject" onclick="updateSubmissionStatus('${submission.id}', 'rejected')">
                <i class="fas fa-times"></i> Reject
            </button>
            ${deleteButton}
        `;
    } else {
        return `
            ${viewButton}
            ${downloadButton}
            ${deleteButton}
        `;
    }
}













// View File in Modal
window.viewFile = function(fileURL, fileName) {
    const fileExtension = fileName.split('.').pop().toLowerCase();
    
    // Create modal HTML
    const modalHTML = `
        <div id="fileViewModal" class="modal active">
            <div class="modal-content" style="max-width: 90%; max-height: 90vh; width: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="margin: 0;">${fileName}</h2>
                    <button id="closeFileView" class="btn-action" style="background: #ef4444;">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
                <div style="overflow: auto; max-height: calc(90vh - 100px);">
                    ${getFilePreview(fileURL, fileExtension)}
                </div>
            </div>
        </div>
    `;
    
    // Insert modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.style.overflow = 'hidden';
    
    // Close handlers
    const modal = document.getElementById('fileViewModal');
    const closeBtn = document.getElementById('closeFileView');
    
    closeBtn.addEventListener('click', () => {
        modal.remove();
        document.body.style.overflow = 'auto';
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
            document.body.style.overflow = 'auto';
        }
    });
};

// Get File Preview Based on Type
function getFilePreview(fileURL, extension) {
    // PDF files (use Google PDF Viewer)
    if (extension === 'pdf') {
        return `
            <iframe 
                src="https://docs.google.com/gview?url=${encodeURIComponent(fileURL)}&embedded=true" 
                style="width: 100%; height: 70vh; border: none;">
            </iframe>
        `;
    }
    
    // Image files
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
        return `<img src="${fileURL}" style="max-width: 100%; height: auto;" alt="Document preview">`;
    }
    
    // Office documents (Word, Excel, PowerPoint)
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension)) {
        return `
            <iframe 
                src="https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileURL)}" 
                style="width: 100%; height: 70vh; border:7px solid #ccc;">
            </iframe>
        `;
    }
    
    // Text files
    if (['txt', 'csv'].includes(extension)) {
        return `<iframe src="${fileURL}" style="width: 100%; height: 70vh; border: none;"></iframe>`;
    }
    
    // Unsupported format
    return `
        <div style="text-align: center; padding: 40px;">
            <i class="fas fa-file" style="font-size: 48px; color: #9ca3af; margin-bottom: 20px;"></i>
            <p style="color: #6b7280; margin-bottom: 20px;">Preview not available for this file type</p>
            <button class="btn-action btn-download" onclick="downloadFile('${fileURL}', '')">
                <i class="fas fa-download"></i> Download to View
            </button>
        </div>
    `;
}































// // Delete Submission
// window.deleteSubmission = async function(submissionId, fileName) {
//     // Confirm deletion
//     if (!confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
//         return;
//     }
    
//     try {
//         // Show loading toast
//         showToast('Deleting submission...', 'info');
        
//         // Get the submission to find the file path
//         const submission = allSubmissions.find(s => s.id === submissionId);
//         if (!submission) {
//             throw new Error('Submission not found');
//         }
        
//         // Extract the file path from the URL
//         // The file path is the last part after '/submissions/'
//         const urlParts = submission.fileURL.split('/submissions/');
//         const filePath = urlParts[urlParts.length - 1].split('?')[0]; // Remove query params if any
        
//         // Delete from Supabase Storage
//         const { error: storageError } = await supabase.storage
//             .from('submissions')
//             .remove([filePath]);
        
//         if (storageError) {
//             console.error('Storage deletion error:', storageError);
//             // Continue even if storage deletion fails (file might already be deleted)
//         }
        
//         // Delete from Firebase Database
//         await submissionsRef.child(submissionId).remove();
        
//         showToast('Submission deleted successfully', 'success');
        
//     } catch (error) {
//         console.error('Delete error:', error);
//         showToast('Failed to delete submission: ' + error.message, 'error');
//     }
// // };













// Delete Submission (Admin Only)
window.deleteSubmission = async function(submissionId, fileName) {
    // Check if user is admin
    if (!currentUser || !currentUser.isAdmin) {
        showToast('Only administrators can delete submissions', 'error');
        return;
    }
    
    // Confirm deletion
    if (!confirm('⚠️ ADMIN ACTION\n\nAre you sure you want to delete this submission?\n\nThis will:\n• Remove the file from storage\n• Delete the database record\n• This action CANNOT be undone')) {
        return;
    }
    
    try {
        // Show loading toast
        showToast('Deleting submission...', 'info');
        
        // Get the submission to find the file path
        const submission = allSubmissions.find(s => s.id === submissionId);
        if (!submission) {
            throw new Error('Submission not found');
        }
        
        // Extract the file path from the URL
        const urlParts = submission.fileURL.split('/submissions/');
        const filePath = urlParts[urlParts.length - 1].split('?')[0];
        
        // Delete from Supabase Storage
        const { error: storageError } = await supabase.storage
            .from('submissions')
            .remove([filePath]);
        
        if (storageError) {
            console.error('Storage deletion error:', storageError);
            // Continue even if storage deletion fails
        }
        
        // Delete from Firebase Database
        await submissionsRef.child(submissionId).remove();
        
        // Log admin action
        console.log(`Admin ${currentUser.email} deleted submission ${submissionId} at ${new Date().toISOString()}`);
        
        showToast('✓ Submission deleted successfully', 'success');
        
    } catch (error) {
        console.error('Delete error:', error);
        showToast('Failed to delete submission: ' + error.message, 'error');
    }
};













// Update Submission Status
window.updateSubmissionStatus = async function(submissionId, newStatus) {
    try {
        await submissionsRef.child(submissionId).update({
            status: newStatus,
            reviewedBy: currentUser.displayName || currentUser.email,
            reviewDate: new Date().toISOString()
        });
        
        const statusText = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
        showToast(`Submission ${statusText}`, 'success');
        
    } catch (error) {
        console.error('Error updating status:', error);
        showToast('Failed to update status', 'error');
    }
};

// Download File
window.downloadFile = function(fileURL, fileName) {
    const link = document.createElement('a');
    link.href = fileURL;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Download started', 'success');
};

// Update Statistics
function updateStatistics() {
    const stats = {
        total: allSubmissions.length,
        approved: allSubmissions.filter(s => s.status === 'approved').length,
        pending: allSubmissions.filter(s => s.status === 'pending').length,
        rejected: allSubmissions.filter(s => s.status === 'rejected').length
    };
    
    document.getElementById('totalCount').textContent = stats.total;
    document.getElementById('approvedCount').textContent = stats.approved;
    document.getElementById('pendingCount').textContent = stats.pending;
    document.getElementById('rejectedCount').textContent = stats.rejected;
}

// Export to CSV
function exportToCSV() {
    if (allSubmissions.length === 0) {
        showToast('No data to export', 'error');
        return;
    }
    
    const headers = ['Teacher Name', 'Subject', 'Grade', 'Document Type', 'Status', 'Submitted Date', 'Reviewed By'];
    
    const rows = allSubmissions.map(sub => [
        sub.teacherName,
        sub.subject,
        sub.grade,
        sub.documentType,
        sub.status,
        new Date(sub.submittedDate).toLocaleDateString(),
        sub.reviewedBy || 'N/A'
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `submissions_report_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Report exported successfully', 'success');
}

// Toast Notification
// Toast Notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Utility: Format File Size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && uploadModal.classList.contains('active')) {
        closeUploadModal();
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (mainApp.style.display !== 'none') {
            searchInput.focus();
        }
    }
});

// Console messages
console.log('%c🎓 Kanyadet School Admin System', 'color: #4f46e5; font-size: 20px; font-weight: bold;');
console.log('%cTeacher Submission Tracker v2.0 - Now with Supabase!', 'color: #6b7280; font-size: 14px;');
console.log('%cConnected to Firebase (Auth/DB) ✓', 'color: #10b981; font-size: 12px;');
console.log('%cConnected to Supabase (Storage) ✓', 'color: #10b981; font-size: 12px;');