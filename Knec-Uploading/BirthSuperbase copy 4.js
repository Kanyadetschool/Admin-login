import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signOut,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Supabase Configuration
const SUPABASE_URL = 'https://lnswbbabxfhdujktoabf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxuc3diYmFieGZoZHVqa3RvYWJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTE4NzcsImV4cCI6MjA3NjY2Nzg3N30.iXGqMyDtl5ScgLlxNWVkIG0zLuvGp8a6MZ9o35T2uCc';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Firebase Configuration
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

const customFirebaseConfig = {
    apiKey: "AIzaSyA_41WpdMjHJOU5s3gQ9aieIayZRvUoRLE",
    authDomain: "kanyadet-school-admin.firebaseapp.com",
    projectId: "kanyadet-school-admin",
    databaseURL: "https://kanyadet-school-admin-default-rtdb.firebaseio.com",
    storageBucket: "kanyadet-school-admin.firebasestorage.app",
    messagingSenderId: "409708360032",
    appId: "1:409708360032:web:a21d63e8cb5fa1ecabee05",
    measurementId: "G-Y4C0ZRRL52"
};

const mergedConfig = { ...customFirebaseConfig, ...firebaseConfig };
const app = initializeApp(mergedConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Add Firebase connection error handling
import { connectDatabaseEmulator } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// Enable offline persistence
db.goOffline = () => console.log('Firebase went offline');
db.goOnline = () => console.log('Firebase is online');

// Add connection state monitoring
const connectedRef = ref(db, '.info/connected');
onValue(connectedRef, (snapshot) => {
    if (snapshot.val() === true) {
        console.log('✅ Firebase connected');
        showToast('Database connected', 'success');
    } else {
        console.log('❌ Firebase disconnected');
        showToast('Database connection lost', 'warning');
    }
});
let userId = 'anonymous';
const sanitizedAppId = appId.replace(/[.#$[\]]/g, '_');

// Global variables
let allStudents = [];
let currentFilter = 'all';
let currentSearchTerm = '';
let currentGrade = 'all';
let filteredStudents = [];
let currentPage = 1;
let itemsPerPage = 10;
let backgroundCheckRunning = false;
let realtimeListenerActive = false;
let currentSortField = 'name';
let currentSortOrder = 'asc';
const pdfExistenceCache = new Map();
let exportInProgress = false;

const grades = [
    "Grade 1", "Grade 2", "Grade 3", 
    "Grade 4", "Grade 5", "Grade 6", 
    "Grade 7", "Grade 8", "Grade 9"
];

// =============================================================================
// SUPABASE STORAGE FUNCTIONS
// =============================================================================

// Storage bucket name
const STORAGE_BUCKET = 'birth-certificates';

// Check if PDF exists in Supabase Storage
// Check ALL PDFs in grade at once (FAST)
async function checkPdfsForGrade(grade, students) {
    try {
        // Single API call for entire grade
        const { data, error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .list(grade, { limit: 1000 });
        
        if (error) throw error;
        
        // Create lookup map (O(1) lookups)
        const pdfMap = new Map(
            data.map(file => [file.name.toLowerCase(), true])
        );
        
        // Update all students in this grade
        students.forEach(student => {
            if (student.grade === grade) {
                const pdfName = `${student.name}.pdf`.toLowerCase();
                student.hasPdf = pdfMap.has(pdfName);
                pdfExistenceCache.set(`${grade}/${student.name}`, student.hasPdf);
            }
        });
        
        return true;
    } catch (error) {
        console.error(`Error checking grade ${grade}:`, error);
        return false;
    }
}
// Get signed URL for PDF viewing
// Get signed URL for PDF viewing with longer expiry
async function getSupabasePdfUrl(studentName, studentGrade) {
    try {
        // Try both extensions
        const paths = [
            `${studentGrade}/${studentName}.PDF`,
            `${studentGrade}/${studentName}.pdf`
        ];
        
        for (const path of paths) {
            const { data, error } = await supabase.storage
                .from(STORAGE_BUCKET)
                .createSignedUrl(path, 7200); // 2 hours expiry for better caching
            
            if (data && !error) {
                return data.signedUrl;
            }
        }
        
        throw new Error('PDF not found');
    } catch (error) {
        console.error('Error getting PDF URL:', error);
        return null;
    }
}
// Upload PDF to Supabase Storage
async function uploadPdfToSupabase(file, studentName, studentGrade) {
    try {
        const fileExt = file.name.split('.').pop().toLowerCase();
        const filePath = `${studentGrade}/${studentName}.${fileExt}`;
        
        showToast('Uploading PDF...', 'info');
        
        const { data, error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true // Replace if exists
            });
        
        if (error) throw error;
        
        // Clear cache for this student
        const cacheKey = `${studentGrade}/${studentName}`;
        pdfExistenceCache.delete(cacheKey);
        
        showToast('PDF uploaded successfully!', 'success');
        return true;
    } catch (error) {
        console.error('Upload error:', error);
        showToast(`Upload failed: ${error.message}`, 'error');
        return false;
    }
}

// Delete PDF from Supabase Storage
async function deletePdfFromSupabase(studentName, studentGrade) {
    try {
        const paths = [
            `${studentGrade}/${studentName}.PDF`,
            `${studentGrade}/${studentName}.pdf`
        ];
        
        let deleted = false;
        for (const path of paths) {
            const { error } = await supabase.storage
                .from(STORAGE_BUCKET)
                .remove([path]);
            
            if (!error) {
                deleted = true;
                break;
            }
        }
        
        if (deleted) {
            const cacheKey = `${studentGrade}/${studentName}`;
            pdfExistenceCache.delete(cacheKey);
            showToast('PDF deleted successfully!', 'success');
            return true;
        } else {
            throw new Error('PDF not found');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showToast(`Delete failed: ${error.message}`, 'error');
        return false;
    }
}

// =============================================================================
// PDF MODAL FUNCTIONS - UPDATED FOR SUPABASE
// =============================================================================
window.openLocalPDF = async function(studentName, studentGrade) {
    const pdfContainer = document.getElementById('pdf-iframe');
    const pdfModalBackdrop = document.getElementById('pdf-modal-backdrop');
    
    if (!pdfContainer || !pdfModalBackdrop) {
        const error = 'PDF modal elements not found';
        console.error(error);
        alert(error);
        return;
    }
    
    // Show modal immediately
    pdfModalBackdrop.classList.remove('hidden');
    pdfModalBackdrop.classList.add('flex');
    
    // Show loading
    pdfContainer.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f3f4f6;">
            <div style="text-align: center;">
                <div style="border: 4px solid #e5e7eb; border-top: 4px solid #3b82f6; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 16px;"></div>
                <div style="color: #4b5563; font-size: 14px;">Loading PDF...</div>
            </div>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    
    showToast('Loading PDF...', 'info');
    
    try {
        const pdfUrl = await getSupabasePdfUrl(studentName, studentGrade);
        
        if (!pdfUrl) {
            throw new Error('PDF not found');
        }
        
        console.log('PDF URL:', pdfUrl);
        
        // Use Google PDF Viewer for MUCH faster loading
        const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
        
        pdfContainer.innerHTML = `
            <iframe 
                src="${googleViewerUrl}" 
                width="100%" 
                height="100%"
                style="border: none;"
                frameborder="0"
            ></iframe>
        `;
        
        showToast('PDF loaded successfully', 'success');
        
        // Add outside click listener
        if (!pdfModalBackdrop.dataset.outsideClickAdded) {
            pdfModalBackdrop.addEventListener('click', function(event) {
                if (event.target === pdfModalBackdrop) {
                    closePDFModal();
                }
            });
            pdfModalBackdrop.dataset.outsideClickAdded = 'true';
        }
        
    } catch (error) {
        console.error('Error opening PDF:', error);
        showToast(`Failed to load PDF: ${error.message}`, 'error');
        
        pdfContainer.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #fef2f2; padding: 20px;">
                <div style="text-align: center; max-width: 400px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
                    <div style="color: #991b1b; font-size: 18px; font-weight: 600; margin-bottom: 12px;">Error Loading PDF</div>
                    <div style="color: #7f1d1d; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
                        ${error.message || 'An unexpected error occurred'}
                    </div>
                    <button 
                        onclick="window.openLocalPDF('${studentName.replace(/'/g, "\\'")}', '${studentGrade}')"
                        style="background: #dc2626; color: white; padding: 10px 24px; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; transition: background 0.2s;"
                        onmouseover="this.style.background='#b91c1c'"
                        onmouseout="this.style.background='#dc2626'">
                        Retry
                    </button>
                </div>
            </div>
        `;
    }
};
function closePDFModal() {
    const pdfModalBackdrop = document.getElementById('pdf-modal-backdrop');
    const pdfContainer = document.getElementById('pdf-iframe');
    
    if (!pdfModalBackdrop || !pdfContainer) return;
    
    pdfModalBackdrop.classList.remove('flex');
    pdfModalBackdrop.classList.add('hidden');
    
    // Clear the iframe to free memory
    pdfContainer.innerHTML = '';
}

// =============================================================================
// PDF UPLOAD INTERFACE
// =============================================================================
function showUploadPdfModal(student) {
    const modalBackdrop = document.getElementById('modal-backdrop');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    
    if (!modalBackdrop || !modalTitle || !modalMessage) return;
    
    modalTitle.textContent = 'Upload Birth Certificate';
    
    modalMessage.innerHTML = `
        <div class="space-y-4">
            <div>
                <p class="font-semibold text-gray-700">Student: ${escapeHtml(student.name || 'N/A')}</p>
                <p class="text-sm text-gray-500">Grade: ${escapeHtml(student.grade || 'N/A')}</p>
            </div>
            
            <div id="drop-zone" class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-all duration-200">
                <svg class="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                </svg>
                <input type="file" id="pdf-upload-input" accept=".pdf,.PDF" class="hidden">
                <label for="pdf-upload-input" class="cursor-pointer">
                    <span class="text-blue-600 hover:text-blue-700 font-semibold">Click to upload</span>
                    <span class="text-gray-500"> or drag and drop</span>
                </label>
                <p class="text-xs text-gray-500 mt-2">PDF files only (Max 10MB)</p>
            </div>
            
            <div id="upload-progress" class="hidden">
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div id="upload-progress-bar" class="bg-blue-600 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                </div>
                <p id="upload-status" class="text-sm text-gray-600 mt-2 text-center"></p>
            </div>
            
            <div class="flex gap-3">
                <button onclick="document.getElementById('modal-backdrop').classList.add('hidden')" 
                        class="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md font-semibold transition-colors">
                    Cancel
                </button>
                <button id="upload-submit-btn" disabled 
                        class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed">
                    Upload
                </button>
            </div>
        </div>
    `;
    
    modalBackdrop.classList.remove('hidden');
    modalBackdrop.classList.add('flex');
    
    // Setup file input and drag-drop handlers
    const fileInput = document.getElementById('pdf-upload-input');
    const uploadBtn = document.getElementById('upload-submit-btn');
    const dropZone = document.getElementById('drop-zone');
    let selectedFile = null;
    
    // Function to validate and handle file selection
    function handleFileSelection(file) {
        if (file && file.type === 'application/pdf' && file.size <= 10 * 1024 * 1024) {
            selectedFile = file;
            uploadBtn.disabled = false;
            dropZone.classList.add('border-green-500', 'bg-green-50');
            showToast(`Selected: ${file.name}`, 'success');
        } else {
            selectedFile = null;
            uploadBtn.disabled = true;
            dropZone.classList.remove('border-green-500', 'bg-green-50');
            showToast('Invalid file. Please select a PDF under 10MB', 'error');
            fileInput.value = '';
        }
    }
    
    // File input change handler
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        handleFileSelection(file);
    });
    
    // Drag and drop handlers
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('border-blue-500', 'bg-blue-50');
    });
    
    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('border-blue-500', 'bg-blue-50');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('border-blue-500', 'bg-blue-50');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelection(files[0]);
        }
    });
    
    // Upload button handler
    uploadBtn.onclick = async () => {
        if (!selectedFile) return;
        
        uploadBtn.disabled = true;
        const progressDiv = document.getElementById('upload-progress');
        const statusText = document.getElementById('upload-status');
        
        progressDiv.classList.remove('hidden');
        statusText.textContent = 'Uploading...';
        
        const success = await uploadPdfToSupabase(selectedFile, student.name, student.grade);
        
        if (success) {
            student.hasPdf = true;
            renderStudents();
            modalBackdrop.classList.add('hidden');
        } else {
            uploadBtn.disabled = false;
            progressDiv.classList.add('hidden');
        }
    };
}
window.showUploadPdfModal = showUploadPdfModal;

// =============================================================================
// PDF CHECK FUNCTIONS - UPDATED FOR SUPABASE
// =============================================================================
async function checkPdfForVisibleStudents() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const studentsToCheck = filteredStudents.slice(start, end);
    
    const studentsNeedingChecks = studentsToCheck.filter(s => s.hasPdf === undefined);
    
    if (studentsNeedingChecks.length === 0) return;
    
    // ✅ FIXED: Group students by grade first
    const gradeGroups = {};
    studentsNeedingChecks.forEach(student => {
        if (!gradeGroups[student.grade]) {
            gradeGroups[student.grade] = [];
        }
        gradeGroups[student.grade].push(student);
    });
    
    // ✅ FIXED: Pass grade and array of students
    await Promise.all(
        Object.entries(gradeGroups).map(([grade, students]) => 
            checkPdfsForGrade(grade, students)
        )
    );
    
    renderStudents();
    
    // Preload next page
    const nextPageStart = end;
    const nextPageEnd = nextPageStart + itemsPerPage;
    const nextPageStudents = filteredStudents.slice(nextPageStart, nextPageEnd)
        .filter(s => s.hasPdf === undefined);
    
    if (nextPageStudents.length > 0) {
        // ✅ FIXED: Group next page students by grade too
        const nextGradeGroups = {};
        nextPageStudents.forEach(student => {
            if (!nextGradeGroups[student.grade]) {
                nextGradeGroups[student.grade] = [];
            }
            nextGradeGroups[student.grade].push(student);
        });
        
        Promise.all(
            Object.entries(nextGradeGroups).map(([grade, students]) => 
                checkPdfsForGrade(grade, students)
            )
        ).catch(err => console.warn('Preload:', err));
    }
}
// =============================================================================
// BACKGROUND PDF CHECKING - OPTIMIZED WITH GRADE-BASED BATCHING
// =============================================================================

function startBackgroundPdfCheck() {
    if (backgroundCheckRunning) return;
    
    backgroundCheckRunning = true;
    showToast('Checking PDFs in background...', 'info');
    
    // ✨ IMPROVEMENT: Group ALL students by grade, not just undefined ones
    const gradeGroups = {};
    const gradesToCheck = new Set();
    
    allStudents.forEach(student => {
        if (!gradeGroups[student.grade]) {
            gradeGroups[student.grade] = [];
        }
        gradeGroups[student.grade].push(student);
        
        // Mark grade for checking if ANY student has undefined status
        if (student.hasPdf === undefined) {
            gradesToCheck.add(student.grade);
        }
    });
    
    // Only check grades that need checking
    const grades = Array.from(gradesToCheck);
    
    if (grades.length === 0) {
        showToast('All PDFs already checked', 'info');
        backgroundCheckRunning = false;
        return;
    }
    
    let currentGradeIndex = 0;
    let totalChecked = 0;
    
    async function checkNextGrade() {
        if (!backgroundCheckRunning || currentGradeIndex >= grades.length) {
            backgroundCheckRunning = false;
            showToast(`✓ Checked ${totalChecked} students across ${grades.length} grades`, 'success');
            updateStatistics();
            renderStudents();
            return;
        }
        
        const grade = grades[currentGradeIndex];
        const studentsInGrade = gradeGroups[grade]; // All students in this grade
        
        try {
            // Get all PDFs in this grade folder at once
            const { data, error } = await supabase.storage
                .from(STORAGE_BUCKET)
                .list(grade, {
                    limit: 1000,
                    sortBy: { column: 'name', order: 'asc' }
                });
            
            if (!error && data) {
                // Create a Set of existing filenames (lowercase for comparison)
                const existingFiles = new Set(
                    data.map(file => file.name.toLowerCase())
                );
                
                // ✨ IMPROVEMENT: Check ALL students in this grade (not just undefined)
                studentsInGrade.forEach(student => {
                    const pdfName = `${student.name}.pdf`.toLowerCase();
                    const hasPdf = existingFiles.has(pdfName);
                    
                    // Only update if status changed or was undefined
                    if (student.hasPdf !== hasPdf) {
                        student.hasPdf = hasPdf;
                        totalChecked++;
                    }
                    
                    // Update cache
                    const cacheKey = `${student.grade}/${student.name}`;
                    pdfExistenceCache.set(cacheKey, hasPdf);
                });
                
                console.log(`✓ Checked ${studentsInGrade.length} students in ${grade} (${data.length} PDFs found)`);
            } else if (error) {
                console.error(`Error checking grade ${grade}:`, error);
                showToast(`Error checking ${grade}: ${error.message}`, 'warning');
            }
        } catch (error) {
            console.error(`Exception checking grade ${grade}:`, error);
        }
        
        currentGradeIndex++;
        
        // ✨ IMPROVEMENT: Update UI after EACH grade (not every 3)
        updateStatistics();
        
        // Only re-render if we're on a page showing students from this grade
        const currentPageGrades = new Set(
            filteredStudents
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map(s => s.grade)
        );
        
        if (currentPageGrades.has(grade)) {
            renderStudents();
        }
        
        // Continue with next grade
        if (currentGradeIndex < grades.length && backgroundCheckRunning) {
            setTimeout(checkNextGrade, 150); // Slightly faster delay
        } else {
            backgroundCheckRunning = false;
            updateStatistics();
            renderStudents();
        }
    }
    
    checkNextGrade();
}
// =============================================================================
// REFRESH DATA FUNCTIONALITY
// =============================================================================

function refreshData() {
    if (!realtimeListenerActive) {
        showToast('Please sign in to refresh data', 'warning');
        return;
    }
    
    showToast('Refreshing data...', 'info');
    
    pdfExistenceCache.clear();
    backgroundCheckRunning = false;
    
    allStudents.forEach(student => {
        student.hasPdf = undefined;
    });
    
    applyFiltersAndRender();
    
    setTimeout(() => {
        startBackgroundPdfCheck();
        showToast('Data refreshed successfully', 'success');
    }, 500);
}

window.refreshData = refreshData;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast-notification transform transition-all duration-300 translate-x-full`;
    
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    };
    
    const icons = {
        success: '✓',
        error: '✗',
        warning: '⚠',
        info: 'ℹ'
    };
    
    toast.innerHTML = `
        <div class="${colors[type]} text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
            <span class="text-xl">${icons[type]}</span>
            <span>${escapeHtml(message)}</span>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.remove('translate-x-full');
    }, 10);
    
    setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300);
    }, 3000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed top-4 right-4 z-50 space-y-2';
    document.body.appendChild(container);
    return container;
}

// =============================================================================
// RENDERING FUNCTIONS (UPDATED WITH UPLOAD BUTTON)
// =============================================================================

function renderStudents() {
    const studentTableBody = document.getElementById('student-table-body');
    if (!studentTableBody) return;
    
    studentTableBody.innerHTML = '';
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const studentsToDisplay = filteredStudents.slice(start, end);

    if (studentsToDisplay.length === 0) {
        const noStudentsMessage = document.getElementById('no-students-message');
        if (noStudentsMessage) {
            noStudentsMessage.classList.remove('hidden');
        }
        return;
    }

    studentsToDisplay.forEach((student, index) => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-100 transition-colors duration-200';
        
        if (index % 2 === 0) {
            row.classList.add('bg-gray-50');
        }

        let pdfStatus, pdfIcon;
        if (student.hasPdf === undefined) {
            pdfStatus = '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-500">Checking...</span>';
            pdfIcon = '⏳';
        } else if (student.hasPdf) {
            pdfStatus = '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Has PDF</span>';
            pdfIcon = '✓';
        } else {
            pdfStatus = '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">No PDF</span>';
            pdfIcon = '✗';
        }

        const safeName = escapeHtml(student.name || '');
        const safeAssessmentNo = escapeHtml(student.assessmentNo || '');
        const safeUpi = escapeHtml(student.upi || 'N/A');
        const safeGrade = escapeHtml(student.grade || 'N/A');
        const rowNumber = start + index + 1;

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${rowNumber}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${safeName}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${safeAssessmentNo}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${safeUpi}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${safeGrade}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span class="mr-2">${pdfIcon}</span>${pdfStatus}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex gap-2 justify-end">
                    ${student.hasPdf === true ? `
                        <button onclick="openLocalPDF('${safeName.replace(/'/g, "\\'")}', '${safeGrade.replace(/'/g, "\\'")}')"
                            class="px-4 py-2 text-white font-semibold rounded-md shadow-md transition-all duration-200 bg-blue-600 hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5"
                            aria-label="View PDF for ${safeName}">
                            <span class="flex items-center gap-2">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                </svg>
                                View
                            </span>
                        </button>
                    ` : ''}
                    <button onclick="showUploadPdfModal(${JSON.stringify(student).replace(/"/g, '&quot;')})"
                        class="px-4 py-2 text-white font-semibold rounded-md shadow-md transition-all duration-200 ${student.hasPdf === true ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}">
                        <span class="flex items-center gap-2">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                            </svg>
                            ${student.hasPdf === true ? 'Replace' : 'Upload'}
                        </span>
                    </button>
                </div>
            </td>
        `;
        studentTableBody.appendChild(row);
    });

    updateStatistics();
    checkPdfForVisibleStudents();
}

// =============================================================================
// STATISTICS
// =============================================================================

function updateStatistics() {
    const total = allStudents.length;
    const checkedStudents = allStudents.filter(s => s.hasPdf !== undefined);
    const withPdfCount = checkedStudents.filter(s => s.hasPdf === true).length;
    const withoutPdfCount = checkedStudents.filter(s => s.hasPdf === false).length;
    
    const withPdfPercentage = checkedStudents.length > 0 
        ? ((withPdfCount / checkedStudents.length) * 100).toFixed(2) 
        : '0.00';
    const withoutPdfPercentage = checkedStudents.length > 0 
        ? ((withoutPdfCount / checkedStudents.length) * 100).toFixed(2) 
        : '0.00';

    const totalCountEl = document.getElementById('total-count');
    const pdfCountEl = document.getElementById('pdf-count');
    const noPdfCountEl = document.getElementById('no-pdf-count');
    const filteredCountEl = document.getElementById('filtered-count');

    if (totalCountEl) totalCountEl.textContent = total;
    if (pdfCountEl) pdfCountEl.textContent = `${withPdfCount} (${withPdfPercentage}%)`;
    if (noPdfCountEl) noPdfCountEl.textContent = `${withoutPdfCount} (${withoutPdfPercentage}%)`;
    if (filteredCountEl) filteredCountEl.textContent = filteredStudents.length;
}

// =============================================================================
// FILTER AND RENDER
// =============================================================================

function applyFiltersAndRender() {
    filteredStudents = allStudents.filter(student => {
        const name = (student.name || '').toLowerCase();
        const assessmentNo = (student.assessmentNo || '').toLowerCase();
        const hasPdf = student.hasPdf;
        const studentGrade = student.grade;

        const matchesSearch = currentSearchTerm === '' ||
            name.includes(currentSearchTerm.toLowerCase()) ||
            assessmentNo.includes(currentSearchTerm.toLowerCase());

        const matchesPdfFilter = currentFilter === 'all' || 
            (currentFilter === 'with-pdf' && hasPdf === true) ||
            (currentFilter === 'without-pdf' && hasPdf === false);

        const matchesGrade = currentGrade === 'all' ||
            studentGrade === currentGrade;

        return matchesSearch && matchesPdfFilter && matchesGrade;
    });

    currentPage = 1;
    renderStudents();
}

// =============================================================================
// FIREBASE REALTIME LISTENER
// =============================================================================

function startRealtimeListener() {
    if (realtimeListenerActive) {
        console.warn('Realtime listener already active');
        return;
    }
    
    realtimeListenerActive = true;
    const dbPath = `artifacts/${sanitizedAppId}/students`;
    const studentsRef = ref(db, dbPath);

    onValue(studentsRef, async (snapshot) => {
        const studentTableBody = document.getElementById('student-table-body');
        if (!studentTableBody) return;
        
        studentTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-gray-500 py-8">
            <div class="flex items-center justify-center">
                <svg class="animate-spin h-5 w-5 mr-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading student records...
            </div>
        </td></tr>`;

        if (snapshot.exists()) {
            const studentsData = snapshot.val();
            const studentEntries = Object.entries(studentsData);

            allStudents = studentEntries.map(([assessmentNo, student]) => ({
                assessmentNo,
                name: student['Official Student Name'] || 'Unknown',
                upi: student.UPI || '',
                grade: student.Grade || 'N/A',
                gender: student.Gender || 'Unknown',
                hasPdf: undefined
            }));

            allStudents.sort((a, b) => {
                const gradeA = a.grade || 'ZZZ';
                const gradeB = b.grade || 'ZZZ';
                if (gradeA !== gradeB) {
                    return gradeA.localeCompare(gradeB);
                }
                return (a.name || '').localeCompare(b.name || '');
            });

            if (allStudents.length === 0) {
                studentTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-gray-500 py-8">No student records found in the database.</td></tr>`;
            } else {
                applyFiltersAndRender();
                
                setTimeout(() => {
                    if (!backgroundCheckRunning) {
                        startBackgroundPdfCheck();
                    }
                }, 500);
            }
        } else {
            allStudents = [];
            studentTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-gray-500 py-8">No student records found in the database.</td></tr>`;
        }
    }, (error) => {
        console.error("Error retrieving student records:", error);
        if (studentTableBody) {
            studentTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-red-500 py-8">
                <div class="flex flex-col items-center">
                    <svg class="h-12 w-12 text-red-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p class="font-semibold">An error occurred while fetching data</p>
                    <p class="text-sm mt-1">Please check your connection and try again</p>
                </div>
            </td></tr>`;
        }
        realtimeListenerActive = false;
    });
}

// =============================================================================
// AUTHENTICATION STATE OBSERVER
// =============================================================================

onAuthStateChanged(auth, (user) => {
    const authContainer = document.getElementById('auth-container');
    const mainAppContainer = document.getElementById('main-app-container');
    const sidebar = document.getElementById('sidebar');
    
    if (user) {
        userId = user.uid;
        
        const userDisplayNameEl = document.getElementById('user-display-name');
        const userAvatarEl = document.getElementById('user-avatar');
        const userRoleEl = document.getElementById('user-role');
        
        const userEmail = user.email || 'No Email';
        const displayName = user.displayName || userEmail.split('@')[0];
        
        if (userDisplayNameEl) {
            userDisplayNameEl.textContent = displayName;
            userDisplayNameEl.title = userEmail;
        }
        
        if (userAvatarEl) {
            const firstLetter = displayName.charAt(0).toUpperCase();
            userAvatarEl.textContent = firstLetter;
        }
        
        if (userRoleEl) {
            if (userEmail.includes('admin')) {
                userRoleEl.textContent = 'Administrator';
            } else if (userEmail.includes('teacher')) {
                userRoleEl.textContent = 'Teacher';
            } else {
                userRoleEl.textContent = 'Portal User';
            }
        }
        
        if (authContainer) authContainer.classList.add('hidden');
        
        if (mainAppContainer) {
            mainAppContainer.classList.remove('hidden');
            mainAppContainer.classList.add('lg:ml-64');
        }
        
        if (sidebar) {
            sidebar.classList.remove('hidden');
        }
        
        startRealtimeListener();
        
    } else {
        userId = 'anonymous';
        
        const userDisplayNameEl = document.getElementById('user-display-name');
        const userAvatarEl = document.getElementById('user-avatar');
        const userRoleEl = document.getElementById('user-role');
        
        if (userDisplayNameEl) userDisplayNameEl.textContent = 'Admin User';
        if (userAvatarEl) userAvatarEl.textContent = 'A';
        if (userRoleEl) userRoleEl.textContent = 'Portal Admin';
        
        if (mainAppContainer) {
            mainAppContainer.classList.add('hidden');
            mainAppContainer.classList.remove('lg:ml-64');
        }
        
        if (authContainer) authContainer.classList.remove('hidden');
        
        if (sidebar) {
            sidebar.classList.add('hidden');
        }
        
        allStudents = [];
        filteredStudents = [];
        pdfExistenceCache.clear();
        realtimeListenerActive = false;
        backgroundCheckRunning = false;
    }
});

// =============================================================================
// AUTHENTICATION HANDLERS
// =============================================================================

let isSigningUp = false;

async function handleAuthFormSubmit(e) {
    e.preventDefault();
    
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    if (!emailInput || !passwordInput) return;
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        showToast("Please enter both email and password", "error");
        return;
    }

    if (password.length < 6) {
        showToast("Password must be at least 6 characters long", "error");
        return;
    }

    try {
        if (isSigningUp) {
            await createUserWithEmailAndPassword(auth, email, password);
            showToast("Account created successfully!", "success");
        } else {
            await signInWithEmailAndPassword(auth, email, password);
            showToast("Signed in successfully!", "success");
        }
        
        emailInput.value = '';
        passwordInput.value = '';
    } catch (error) {
        console.error("Authentication failed:", error);
        showToast(error.message, "error");
    }
}

async function handleSignOut() {
    try {
        await signOut(auth);
        allStudents = [];
        filteredStudents = [];
        pdfExistenceCache.clear();
        realtimeListenerActive = false;
        backgroundCheckRunning = false;
        showToast("Signed out successfully", "success");
    } catch (error) {
        console.error("Sign out failed:", error);
        showToast("Failed to sign out", "error");
    }
}

// =============================================================================
// EVENT LISTENERS INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('📚 Student Management App with Supabase Storage Initialized');
    
    // Auth form
    const authForm = document.getElementById('auth-form');
    if (authForm) {
        authForm.addEventListener('submit', handleAuthFormSubmit);
    }
    
    // Sign out button
    const signOutBtn = document.getElementById('sign-out-btn');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', handleSignOut);
    }
    
    // PDF Modal close
    const pdfModalCloseBtn = document.getElementById('pdf-modal-close-btn');
    if (pdfModalCloseBtn) {
        pdfModalCloseBtn.addEventListener('click', closePDFModal);
    }
    
    // Grade filter
    const gradeFilterSelect = document.getElementById('grade-filter');
    if (gradeFilterSelect) {
        gradeFilterSelect.addEventListener('change', (e) => {
            currentGrade = e.target.value;
            applyFiltersAndRender();
        });
    }
    
    // Items per page
    const itemsPerPageSelect = document.getElementById('items-per-page');
    if (itemsPerPageSelect) {
        itemsPerPageSelect.addEventListener('change', (e) => {
            itemsPerPage = parseInt(e.target.value, 10);
            currentPage = 1;
            applyFiltersAndRender();
        });
    }
    
    // Live filter
    const liveFilterInput = document.getElementById('live-filter');
    if (liveFilterInput) {
        liveFilterInput.addEventListener('input', (e) => {
            currentSearchTerm = e.target.value;
            applyFiltersAndRender();
        });
    }
    
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => {
                b.classList.remove('active', 'bg-gradient-to-r', 'from-indigo-500', 'to-purple-600', 'text-white');
                b.classList.add('bg-gray-200', 'text-gray-700');
            });
            
            e.currentTarget.classList.add('active', 'bg-gradient-to-r', 'from-indigo-500', 'to-purple-600', 'text-white');
            e.currentTarget.classList.remove('bg-gray-200', 'text-gray-700');
            
            currentFilter = e.currentTarget.id.replace('show-', '');
            currentPage = 1;
            applyFiltersAndRender();
        });
    });
    
    // Pagination
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderStudents();
            }
        });
    }
    
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderStudents();
            }
        });
    }
    
    showToast('App ready! Using Supabase Storage for PDFs', 'success');
});



// =============================================================================
// EXPORT GLOBAL FUNCTIONS
// =============================================================================

window.openLocalPDF = window.openLocalPDF;
window.showUploadPdfModal = showUploadPdfModal;
window.refreshData = refreshData;
window.closePDFModal = closePDFModal;

console.log('✅ Supabase Storage integration complete!');