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
        showToast('Deleting PDF...', 'info');
        
        // First, let's check what files actually exist
        const { data: fileList, error: listError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .list(studentGrade);
        
        if (listError) {
            console.error('Error listing files:', listError);
            throw listError;
        }
        
        console.log('Files in grade folder:', fileList);
        
        // Find the exact filename (case-insensitive match)
        const studentFileName = fileList.find(file => 
            file.name.toLowerCase() === `${studentName.toLowerCase()}.pdf`
        );
        
        if (!studentFileName) {
            throw new Error('PDF file not found in storage');
        }
        
        const fullPath = `${studentGrade}/${studentFileName.name}`;
        console.log('Attempting to delete:', fullPath);
        
        // Delete the file
        const { data, error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .remove([fullPath]);
        
        console.log('Delete result:', { data, error });
        
        if (error) {
            throw error;
        }
        
        // Clear cache for this student
        const cacheKey = `${studentGrade}/${studentName}`;
        pdfExistenceCache.delete(cacheKey);
        
        console.log(`✅ PDF deleted successfully: ${fullPath}`);
        showToast('PDF deleted successfully!', 'success');
        return true;
        
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
function showUploadPdfModal(studentName, studentGrade) {
    // Find the actual student object from the array
    const student = allStudents.find(s => s.name === studentName && s.grade === studentGrade);
    
    if (!student) {
        showToast('Student not found', 'error');
        return;
    }
    
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
    
    // ===== SETUP FILE INPUT AND DRAG-DROP HANDLERS =====
    const fileInput = document.getElementById('pdf-upload-input');
    const uploadBtn = document.getElementById('upload-submit-btn');
    const dropZone = document.getElementById('drop-zone');
    let selectedFile = null;
    
    // Function to validate and handle file selection
    function handleFileSelection(file) {
        if (file && file.type === 'application/pdf' && file.size <= 10 * 1024 * 1024) {
            selectedFile = file;
            uploadBtn.disabled = false;
            dropZone.classList.remove('border-gray-300');
            dropZone.classList.add('border-green-500', 'bg-green-50');
            showToast(`✓ Selected: ${file.name}`, 'success');
        } else {
            selectedFile = null;
            uploadBtn.disabled = true;
            dropZone.classList.remove('border-green-500', 'bg-green-50', 'border-blue-500', 'bg-blue-50');
            dropZone.classList.add('border-gray-300');
            
            if (file) {
                if (file.type !== 'application/pdf') {
                    showToast('❌ Invalid file type. Please select a PDF', 'error');
                } else if (file.size > 10 * 1024 * 1024) {
                    showToast('❌ File too large. Maximum size is 10MB', 'error');
                }
            }
            fileInput.value = '';
        }
    }
    
    // ✅ FILE INPUT CHANGE HANDLER
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        handleFileSelection(file);
    });
    
    // ✅ DRAG OVER HANDLER (when file is dragged over the drop zone)
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('border-gray-300', 'border-green-500', 'bg-green-50');
        dropZone.classList.add('border-blue-500', 'bg-blue-50');
    });
    
    // ✅ DRAG ENTER HANDLER (when file enters the drop zone)
    dropZone.addEventListener('dragenter', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('border-gray-300');
        dropZone.classList.add('border-blue-500', 'bg-blue-50');
    });
    
    // ✅ DRAG LEAVE HANDLER (when file leaves the drop zone)
    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Only remove styles if leaving the dropZone itself (not child elements)
        if (e.target === dropZone) {
            dropZone.classList.remove('border-blue-500', 'bg-blue-50');
            if (!selectedFile) {
                dropZone.classList.add('border-gray-300');
            } else {
                dropZone.classList.add('border-green-500', 'bg-green-50');
            }
        }
    });
    
    // ✅ DROP HANDLER (when file is dropped)
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Remove drag styles
        dropZone.classList.remove('border-blue-500', 'bg-blue-50');
        
        // Get the dropped files
        const files = e.dataTransfer.files;
        
        if (files.length > 0) {
            handleFileSelection(files[0]);
        } else {
            showToast('❌ No file detected', 'error');
        }
    });
    
    // ✅ UPLOAD BUTTON HANDLER
    uploadBtn.onclick = async () => {
        if (!selectedFile) return;
        
        uploadBtn.disabled = true;
        const progressDiv = document.getElementById('upload-progress');
        const statusText = document.getElementById('upload-status');
        const progressBar = document.getElementById('upload-progress-bar');
        
        if (progressDiv && statusText && progressBar) {
            progressDiv.classList.remove('hidden');
            statusText.textContent = 'Uploading...';
            progressBar.style.width = '50%';
        }
        
        const success = await uploadPdfToSupabase(selectedFile, student.name, student.grade);
        
        if (success) {
            // Update the actual student object reference
            student.hasPdf = true;
            
            if (progressBar) progressBar.style.width = '100%';
            if (statusText) statusText.textContent = 'Upload complete!';
            
            renderStudents();
            updateStatistics();
            
            // Close modal after short delay
            setTimeout(() => {
                modalBackdrop.classList.add('hidden');
            }, 1000);
        } else {
            uploadBtn.disabled = false;
            if (progressDiv) progressDiv.classList.add('hidden');
            if (progressBar) progressBar.style.width = '0%';
        }
    };
}

window.showUploadPdfModal = showUploadPdfModal;


// Add this after showUploadPdfModal function
async function handleDeletePdf(studentName, studentGrade) {
    // Show confirmation modal
    const modalBackdrop = document.getElementById('modal-backdrop');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    
    if (!modalBackdrop || !modalTitle || !modalMessage) return;
    
    modalTitle.textContent = 'Delete Birth Certificate';
    
    modalMessage.innerHTML = `
        <div class="space-y-4">
            <div class="text-center">
                <svg class="w-16 h-16 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                <p class="text-lg font-semibold text-gray-900 mb-2">Are you sure you want to delete this PDF?</p>
                <p class="text-sm text-gray-600">Student: <span class="font-semibold">${escapeHtml(studentName)}</span></p>
                <p class="text-sm text-gray-600">Grade: <span class="font-semibold">${escapeHtml(studentGrade)}</span></p>
                <p class="text-sm text-red-600 mt-3">This action cannot be undone!</p>
            </div>
            
            <div class="flex gap-3">
                <button onclick="document.getElementById('modal-backdrop').classList.add('hidden')" 
                        class="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md font-semibold transition-colors">
                    Cancel
                </button>
                <button id="confirm-delete-btn"
                        class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-semibold transition-colors">
                    Delete PDF
                </button>
            </div>
        </div>
    `;
    
    modalBackdrop.classList.remove('hidden');
    modalBackdrop.classList.add('flex');
    
    // Handle delete confirmation
    const confirmBtn = document.getElementById('confirm-delete-btn');
    if (confirmBtn) {
        confirmBtn.onclick = async () => {
            confirmBtn.disabled = true;
            confirmBtn.textContent = 'Deleting...';
            
            const success = await deletePdfFromSupabase(studentName, studentGrade);
            
            if (success) {
                // Find and update ALL students with this exact name and grade
                allStudents.forEach(student => {
                    if (student.name === studentName && student.grade === studentGrade) {
                        student.hasPdf = false;
                    }
                });
                
                // Clear ALL caches related to this grade
                for (let [key, value] of pdfExistenceCache.entries()) {
                    if (key.startsWith(`${studentGrade}/`)) {
                        pdfExistenceCache.delete(key);
                    }
                }
                
                // Force immediate re-check of the entire grade
                const studentsInGrade = allStudents.filter(s => s.grade === studentGrade);
                if (studentsInGrade.length > 0) {
                    // Reset PDF status for entire grade
                    studentsInGrade.forEach(s => s.hasPdf = undefined);
                    
                    // Re-check the grade
                    await checkPdfsForGrade(studentGrade, studentsInGrade);
                }
                
                // Re-render and update stats
                renderStudents();
                updateStatistics();
                
                modalBackdrop.classList.add('hidden');
                
                showToast(`✓ PDF deleted for ${studentName}`, 'success');
            } else {
                confirmBtn.disabled = false;
                confirmBtn.textContent = 'Delete PDF';
            }
        };
    }
}

window.handleDeletePdf = handleDeletePdf;

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
    <div class="flex gap-2 justify-end items-center group">
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
            <button onclick="handleDeletePdf('${safeName.replace(/'/g, "\\'")}', '${safeGrade.replace(/'/g, "\\'")}')"
                class="px-3 py-2 text-white font-semibold rounded-md shadow-md transition-all duration-200 bg-red-600 hover:bg-red-700 hover:shadow-lg transform hover:-translate-y-0.5 "
                aria-label="Delete PDF for ${safeName}"
                title="Delete PDF">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
            </button>
        ` : ''}
        <button onclick="showUploadPdfModal('${safeName.replace(/'/g, "\\'")}', '${safeGrade.replace(/'/g, "\\'")}')"
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

   // At the end of renderStudents() function, replace these lines:
updateStatistics();
checkPdfForVisibleStudents();

const totalPages = Math.ceil(filteredStudents.length / itemsPerPage); // ✅ Calculate total pages
renderPaginationControls(totalPages); // ✅ Pass total pages
}

window.handleDeletePdf = handleDeletePdf;
// =============================================================================
// PAGINATION RENDERING - COMPLETE WITH PAGE NUMBERS
// =============================================================================

function renderPaginationControls(totalPages) {
    const paginationControls = document.getElementById('pagination-controls'); // ✅ ADD THIS
    paginationControls.innerHTML = '';
    
    if (totalPages <= 1) return;

    const buttonStyle = `
        padding: 8px 12px;
        margin: 0 4px;
        border: 2px solid #3498db;
        background: white;
        color: #3498db;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        font-size: 14px;
        transition: all 0.3s ease;
    `;

    const activeButtonStyle = `
        padding: 8px 12px;
        margin: 0 4px;
        border: 2px solid #3498db;
        background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
        color: white;
        border-radius: 6px;
        cursor: default;
        font-weight: 600;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
    `;

    const disabledButtonStyle = `
        padding: 8px 12px;
        margin: 0 4px;
        border: 2px solid #bdc3c7;
        background: #ecf0f1;
        color: #95a5a6;
        border-radius: 6px;
        cursor: not-allowed;
        font-weight: 600;
        font-size: 14px;
    `;

    const firstBtn = document.createElement('button');
    firstBtn.innerHTML = '⟨⟨';
    firstBtn.title = 'First page';
    firstBtn.style.cssText = currentPage === 1 ? disabledButtonStyle : buttonStyle;
    firstBtn.disabled = currentPage === 1;
    firstBtn.onclick = () => goToPage(1);
    paginationControls.appendChild(firstBtn);

    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '⟨ Previous';
    prevBtn.style.cssText = currentPage === 1 ? disabledButtonStyle : buttonStyle;
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => goToPage(currentPage - 1);
    paginationControls.appendChild(prevBtn);

    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    if (startPage > 1) {
        const ellipsis = document.createElement('span');
        ellipsis.textContent = '...';
        ellipsis.style.cssText = 'margin: 0 8px; color: #7f8c8d;';
        paginationControls.appendChild(ellipsis);
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.style.cssText = i === currentPage ? activeButtonStyle : buttonStyle;
        
        if (i !== currentPage) {
            pageBtn.onmouseenter = () => {
                pageBtn.style.background = '#3498db';
                pageBtn.style.color = 'white';
            };
            pageBtn.onmouseleave = () => {
                pageBtn.style.background = 'white';
                pageBtn.style.color = '#3498db';
            };
            pageBtn.onclick = () => goToPage(i);
        }
        
        paginationControls.appendChild(pageBtn);
    }

    if (endPage < totalPages) {
        const ellipsis = document.createElement('span');
        ellipsis.textContent = '...';
        ellipsis.style.cssText = 'margin: 0 8px; color: #7f8c8d;';
        paginationControls.appendChild(ellipsis);
    }

    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = 'Next ⟩';
    nextBtn.style.cssText = currentPage === totalPages ? disabledButtonStyle : buttonStyle;
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => goToPage(currentPage + 1);
    paginationControls.appendChild(nextBtn);

    const lastBtn = document.createElement('button');
    lastBtn.innerHTML = '⟩⟩';
    lastBtn.title = 'Last page';
    lastBtn.style.cssText = currentPage === totalPages ? disabledButtonStyle : buttonStyle;
    lastBtn.disabled = currentPage === totalPages;
    lastBtn.onclick = () => goToPage(totalPages);
    paginationControls.appendChild(lastBtn);
}
function addPageButton(pageNum, container) {
    const pageButton = document.createElement('button');
    pageButton.textContent = pageNum;
    pageButton.className = `px-3 py-1 text-sm font-medium rounded-md transition-colors ${
        pageNum === currentPage 
            ? 'bg-indigo-600 text-white shadow-md' 
            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
    }`;
    pageButton.addEventListener('click', () => {
        currentPage = pageNum;
        renderStudents();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    container.appendChild(pageButton);
}

// Add keyboard shortcut for pagination
function goToPage(pageNumber) {
    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    if (pageNumber >= 1 && pageNumber <= totalPages) {
        currentPage = pageNumber;
        renderStudents();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

window.goToPage = goToPage;
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
// SUPABASE REALTIME LISTENER FOR PDF CHANGES
// =============================================================================

let supabaseChannel = null;

function startSupabaseRealtimeListener() {
    // Clean up existing channel if any
    if (supabaseChannel) {
        supabase.removeChannel(supabaseChannel);
    }
    
    console.log('🔄 Starting Supabase realtime listener...');
    
    supabaseChannel = supabase
        .channel('storage-changes')
        .on(
            'postgres_changes',
            {
                event: '*', // Listen to INSERT, UPDATE, DELETE
                schema: 'storage',
                table: 'objects',
                filter: `bucket_id=eq.${STORAGE_BUCKET}`
            },
            (payload) => {
                console.log('📁 Storage event detected:', payload);
                
                // Extract file path from payload
                const filePath = payload.new?.name || payload.old?.name;
                if (!filePath) return;
                
                // Parse grade and student name from path (e.g., "Grade 1/John Doe.pdf")
                const pathParts = filePath.split('/');
                if (pathParts.length !== 2) return;
                
                const [grade, fileNameWithExt] = pathParts;
                const studentName = fileNameWithExt
                    .replace('.pdf', '')
                    .replace('.PDF', '');
                
                console.log(`Student: ${studentName}, Grade: ${grade}, Event: ${payload.eventType}`);
                
                // Find ALL matching students (in case of duplicates)
                const matchingStudents = allStudents.filter(s => 
                    s.name === studentName && s.grade === grade
                );
                
                if (matchingStudents.length === 0) {
                    console.log('⚠️ No matching student found');
                    return;
                }
                
                // Update all matching students
                matchingStudents.forEach(student => {
                    const oldStatus = student.hasPdf;
                    
                    if (payload.eventType === 'DELETE') {
                        student.hasPdf = false;
                    } else if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                        student.hasPdf = true;
                    }
                    
                    console.log(`Updated ${student.name}: ${oldStatus} -> ${student.hasPdf}`);
                });
                
                // Clear cache for this student
                const cacheKey = `${grade}/${studentName}`;
                pdfExistenceCache.delete(cacheKey);
                
                // Re-render if on a page showing this student
                const currentPageStudents = filteredStudents.slice(
                    (currentPage - 1) * itemsPerPage,
                    currentPage * itemsPerPage
                );
                
                const isVisible = currentPageStudents.some(s => 
                    s.name === studentName && s.grade === grade
                );
                
                if (isVisible) {
                    renderStudents();
                }
                
                // Always update statistics
                updateStatistics();
                
                // Show notification
                const action = payload.eventType === 'DELETE' ? 'deleted' : 'uploaded';
                showToast(`✓ PDF ${action} for ${studentName} (${grade})`, 'success');
            }
        )
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log('✅ Supabase realtime connected');
                showToast('PDF monitoring active', 'success');
            } else if (status === 'CLOSED') {
                console.log('⚠️ Supabase realtime disconnected');
            } else if (status === 'CHANNEL_ERROR') {
                console.error('❌ Supabase realtime error');
                showToast('PDF monitoring error - will retry', 'warning');
            }
        });
}

function stopSupabaseRealtimeListener() {
    if (supabaseChannel) {
        supabase.removeChannel(supabaseChannel);
        supabaseChannel = null;
        console.log('🛑 Supabase realtime listener stopped');
    }
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
         startSupabaseRealtimeListener(); // ✅ Add this line
        
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
        stopSupabaseRealtimeListener(); // ✅ ADD THIS LINE
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
    // Live filter
    const liveFilterInput2 = document.getElementById('live-filter2');
    if (liveFilterInput2) {
        liveFilterInput2.addEventListener('input', (e) => {
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
// ENHANCED EXPORT FUNCTIONALITY - PDF, WORD, EXCEL
// =============================================================================

// Required libraries:
// - jsPDF: https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js
// - jsPDF-AutoTable: https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js
// - SheetJS (XLSX): https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js
// - docxtemplater: https://cdnjs.cloudflare.com/ajax/libs/docxtemplater/3.37.11/docxtemplater.js
// - PizZip: https://cdnjs.cloudflare.com/ajax/libs/pizzip/3.1.3/pizzip.min.js

// =============================================================================
// ENHANCED EXPORT TO PDF WITH PREMIUM STYLING
// =============================================================================

const exportToPdfEnhanced = async () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape');

    // Use currently filtered students (respects all active filters)
    const dataToExport = filteredStudents;
    
    // Get active filter description
    const selectedGrade = currentGrade !== 'all' ? currentGrade : 'All Grades';
    const filterType = currentFilter !== 'all' ? 
        (currentFilter === 'with-pdf' ? ' (With PDF)' : 
         currentFilter === 'without-pdf' ? ' (Without PDF)' : '') : '';
    const searchFilter = currentSearchTerm ? ` (Search: "${currentSearchTerm}")` : '';
    
    const title = `Student Data Report`;
    const subtitle = `${selectedGrade}${filterType}${searchFilter}`;
    const totalStudents = dataToExport.length;
    
    // Load and process logo image to make it completely white
    const logoImg = new Image();
    logoImg.src = '../images/logo.png';
    logoImg.crossOrigin = 'anonymous';
    
    // Load Kenya Ministry of Education logo for background
    const ministryLogoImg = new Image();
    ministryLogoImg.src = '../images/kenya_ministry_education.png';
    ministryLogoImg.crossOrigin = 'anonymous';
    
    // Wait for logo to load and apply 100% white filter
    await new Promise((resolve, reject) => {
        logoImg.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = logoImg.width;
            canvas.height = logoImg.height;
            
            ctx.drawImage(logoImg, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            for (let i = 0; i < data.length; i += 4) {
                if (data[i + 3] > 0) {
                    data[i] = 255;
                    data[i + 1] = 255;
                    data[i + 2] = 255;
                }
            }
            
            ctx.putImageData(imageData, 0, 0);
            logoImg.src = canvas.toDataURL();
            resolve();
        };
        logoImg.onerror = () => resolve(); // Continue even if logo fails
    });
    
    await new Promise((resolve) => {
        ministryLogoImg.onload = resolve;
        ministryLogoImg.onerror = () => resolve();
    });
    
    // Essential columns
    const essentialColumns = [
        'No.',
        'Name',
        'Assessment No', 
        'UPI',
        'Grade',
        'PDF Status'
    ];
    
    const headers = essentialColumns;
    const body = dataToExport.map((student, index) => {
        return [
            String(index + 1),
            student.name || '-',
            student.assessmentNo || '-',
            student.upi || '-',
            student.grade || '-',
            student.hasPdf === true ? '✓ Has PDF' : student.hasPdf === false ? '✗ No PDF' : '⏳ Checking'
        ];
    });

    // Premium Header Function
    const addHeader = (data) => {
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        
        // Add Kenya Ministry logo as watermark
        try {
            if (ministryLogoImg.complete && ministryLogoImg.naturalHeight !== 0) {
                const watermarkSize = 80;
                const watermarkX = (pageWidth - watermarkSize) / 2;
                const watermarkY = (pageHeight - watermarkSize) / 2;
                
                doc.saveGraphicsState();
                doc.setGState(new doc.GState({ opacity: 0.08 }));
                doc.addImage(ministryLogoImg, 'PNG', watermarkX, watermarkY, watermarkSize, watermarkSize);
                doc.restoreGraphicsState();
            }
        } catch (e) {
            console.log('Ministry logo not available');
        }
        
        // Header background
        doc.setFillColor(41, 128, 185);
        doc.rect(0, 0, pageWidth, 20, 'F');
        
        // Add white logo
        const logoWidth = 15;
        const logoHeight = 15;
        const logoX = 14;
        const logoY = 2.5;
        
        try {
            doc.addImage(logoImg, 'PNG', logoX, logoY, logoWidth, logoHeight);
        } catch (e) {
            console.log('Logo not available');
        }
        
        // School name
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('KANYADET PRI & JUNIOR SCHOOL', logoX + logoWidth + 5, 10);
        
        // Report title
        doc.setFontSize(12);
        doc.text(title, logoX + logoWidth + 5, 16);
        
        // Date and info (right aligned)
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        const dateText = `Date: ${new Date().toLocaleDateString()}`;
        const gradeText = subtitle;
        const studentCount = `Total Students: ${totalStudents}`;
        doc.text(dateText, pageWidth - 14, 8, { align: 'right' });
        doc.text(gradeText, pageWidth - 14, 13, { align: 'right' });
        doc.text(studentCount, pageWidth - 14, 18, { align: 'right' });
        
        // Decorative line
        doc.setDrawColor(41, 128, 185);
        doc.setLineWidth(0.5);
        doc.line(0, 20, pageWidth, 20);
    };

    // Premium Footer Function
    const addFooter = (data, totalPages) => {
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const footerY = pageHeight - 15;
        
        // Footer background
        doc.setFillColor(245, 245, 245);
        doc.rect(0, footerY - 5, pageWidth, 20, 'F');
        
        // Top border
        doc.setDrawColor(41, 128, 185);
        doc.setLineWidth(0.3);
        doc.line(0, footerY - 5, pageWidth, footerY - 5);
        
        doc.setTextColor(60, 60, 60);
        doc.setFontSize(8);
        
        // Left section
        doc.setFont(undefined, 'bold');
        doc.text('Prepared by:', 14, footerY);
        doc.setFont(undefined, 'normal');
        doc.text('_________________', 14, footerY + 4);
        doc.setFontSize(7);
        doc.text('Signature & Date', 14, footerY + 8);
        
        // Center - Page number
        doc.setFontSize(9);
        const pageText = `Page ${data.pageNumber} of ${totalPages}`;
        doc.text(pageText, pageWidth / 2, footerY + 2, { align: 'center' });
        
        // Right section
        doc.setFontSize(8);
        doc.setFont(undefined, 'bold');
        doc.text('Verified by:', pageWidth - 14, footerY, { align: 'right' });
        doc.setFont(undefined, 'normal');
        doc.text('_________________', pageWidth - 14, footerY + 4, { align: 'right' });
        doc.setFontSize(7);
        doc.text('Signature & Stamp', pageWidth - 14, footerY + 8, { align: 'right' });
        
        // Stamp box
        doc.setDrawColor(41, 128, 185);
        doc.setLineWidth(0.2);
        doc.rect(pageWidth - 85, footerY - 3, 28, 10);
        doc.setFontSize(6);
        doc.setTextColor(150, 150, 150);
        doc.text('OFFICIAL', pageWidth - 71, footerY + 2, { align: 'center' });
        doc.text('STAMP', pageWidth - 71, footerY +  5, { align: 'center' });
    };

    // Generate table
    doc.autoTable({
        head: [headers],
        body: body,
        startY: 25,
        styles: { 
            fontSize: 9,
            cellPadding: 3,
            overflow: 'linebreak',
            cellWidth: 'auto',
            font: 'helvetica' // Explicitly set font
        },
        columnStyles: {
            0: { cellWidth: 15 }
        },
        headStyles: { 
            fillColor: [41, 128, 185], 
            textColor: [255, 255, 255],
            fontStyle: 'bold'
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 25, right: 10, bottom: 20, left: 10 },
        didDrawPage: function(data) {
            addHeader(data);
        }
    });

    // Add footers with correct page count
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addFooter({ pageNumber: i }, totalPages);
    }

    const filename = `student_data_${currentGrade !== 'all' ? currentGrade : 'all'}_${currentFilter}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    
    showToast('PDF exported successfully!', 'success');
};

// =============================================================================
// EXPORT TO EXCEL WITH PREMIUM STYLING
// =============================================================================

const exportToExcelEnhanced = async () => {
    const XLSX = window.XLSX;
    if (!XLSX) {
        showToast('Excel export library not loaded', 'error');
        return;
    }

    // Use currently filtered students (respects all active filters)
    const dataToExport = filteredStudents;
    
    // Get active filter description
    const selectedGrade = currentGrade !== 'all' ? currentGrade : 'All Grades';
    const filterType = currentFilter !== 'all' ? 
        (currentFilter === 'with-pdf' ? ' (With PDF)' : 
         currentFilter === 'without-pdf' ? ' (Without PDF)' : '') : '';
    const searchFilter = currentSearchTerm ? ` (Search: "${currentSearchTerm}")` : '';
    const filterDescription = `${selectedGrade}${filterType}${searchFilter}`;

    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Create header rows
    const headerData = [
        ['KANYADET PRI & JUNIOR SCHOOL'],
        ['Student Data Report'],
        [`Date: ${new Date().toLocaleDateString()}`, '', '', `Filter: ${filterDescription}`],
        [`Total Students: ${dataToExport.length}`],
        [], // Empty row
        ['No.', 'Name', 'Assessment No', 'UPI', 'Grade', 'PDF Status']
    ];

    // Create data rows
    const bodyData = dataToExport.map((student, index) => [
        index + 1,
        student.name || '-',
        student.assessmentNo || '-',
        student.upi || '-',
        student.grade || '-',
        student.hasPdf === true ? 'Has PDF' : student.hasPdf === false ? 'No PDF' : 'Checking'
    ]);

    // Add footer rows
    const footerData = [
        [],
        ['Prepared by: _________________', '', '', '', 'Verified by: _________________'],
        ['Signature & Date', '', '', '', 'Signature & Stamp']
    ];

    // Combine all data
    const wsData = [...headerData, ...bodyData, ...footerData];

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    ws['!cols'] = [
        { wch: 8 },  // No.
        { wch: 25 }, // Name
        { wch: 18 }, // Assessment No
        { wch: 15 }, // UPI
        { wch: 12 }, // Grade
        { wch: 15 }  // PDF Status
    ];

    // Merge cells for header
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // School name
        { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }, // Report title
        { s: { r: 3, c: 0 }, e: { r: 3, c: 5 } }  // Total students
    ];

    // Apply styles (basic approach - Excel styling is limited in SheetJS free version)
    const range = XLSX.utils.decode_range(ws['!ref']);
    
    // Style header rows (0-5)
    for (let R = 0; R <= 5; R++) {
        for (let C = 0; C <= 5; C++) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            if (!ws[cellAddress]) continue;
            
            ws[cellAddress].s = {
                font: { bold: true, sz: R < 2 ? 14 : 11 },
                alignment: { horizontal: 'center', vertical: 'center' },
                fill: R === 5 ? { fgColor: { rgb: '2980B9' } } : undefined
            };
        }
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Student Data');

    // Save file
    const filename = `student_data_${currentGrade !== 'all' ? currentGrade : 'all'}_${currentFilter}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
    
    showToast('Excel file exported successfully!', 'success');
};

// =============================================================================
// EXPORT TO WORD WITH PREMIUM STYLING
// =============================================================================

const exportToWordEnhanced = async () => {
    // Use currently filtered students (respects all active filters)
    const dataToExport = filteredStudents;
    
    // Get active filter description
    const selectedGrade = currentGrade !== 'all' ? currentGrade : 'All Grades';
    const filterType = currentFilter !== 'all' ? 
        (currentFilter === 'with-pdf' ? ' (With PDF)' : 
         currentFilter === 'without-pdf' ? ' (Without PDF)' : '') : '';
    const searchFilter = currentSearchTerm ? ` (Search: "${currentSearchTerm}")` : '';
    const filterDescription = `${selectedGrade}${filterType}${searchFilter}`;

    // Create HTML content with premium styling
    let htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page {
            size: A4 landscape;
            margin: 0.5in;
        }
        body {
            font-family: 'Calibri', Arial, sans-serif;
            margin: 0;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #2980B9 0%, #3498DB 100%);
            color: white;
            padding: 20px;
            margin: -20px -20px 20px -20px;
            position: relative;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: bold;
        }
        .header h2 {
            margin: 5px 0 0 0;
            font-size: 16px;
            font-weight: normal;
        }
        .header-info {
            position: absolute;
            right: 20px;
            top: 20px;
            text-align: right;
            font-size: 12px;
        }
        .logo {
            position: absolute;
            left: 20px;
            top: 10px;
            width: 50px;
            height: 50px;
            background: white;
            border-radius: 50%;
        }
        .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            opacity: 0.05;
            font-size: 200px;
            font-weight: bold;
            z-index: -1;
            pointer-events: none;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th {
            background-color: #2980B9;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
            border: 1px solid #2471A3;
        }
        td {
            padding: 10px;
            border: 1px solid #ddd;
        }
        tr:nth-child(even) {
            background-color: #f5f5f5;
        }
        tr:hover {
            background-color: #e8f4f8;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #2980B9;
            display: flex;
            justify-content: space-between;
        }
        .footer-section {
            flex: 1;
        }
        .signature-line {
            border-top: 1px solid #333;
            margin-top: 40px;
            padding-top: 5px;
            font-size: 11px;
            color: #666;
        }
        .stamp-box {
            border: 2px solid #2980B9;
            padding: 10px;
            text-align: center;
            color: #999;
            font-size: 10px;
        }
    </style>
</head>
<body>
    <div class="watermark">KANYADET</div>
    
    <div class="header">
        <div class="logo"></div>
        <h1>KANYADET PRI & JUNIOR SCHOOL</h1>
        <h2>Student Data Report</h2>
        <div class="header-info">
            <div>Date: ${new Date().toLocaleDateString()}</div>
            <div>Filter: ${filterDescription}</div>
            <div>Total Students: ${dataToExport.length}</div>
        </div>
    </div>
    
    <table>
        <thead>
            <tr>
                <th style="width: 5%">No.</th>
                <th style="width: 25%">Name</th>
                <th style="width: 15%">Assessment No</th>
                <th style="width: 15%">UPI</th>
                <th style="width: 10%">Grade</th>
                <th style="width: 15%">PDF Status</th>
            </tr>
        </thead>
        <tbody>
`;

    // Add data rows
    dataToExport.forEach((student, index) => {
        const pdfStatus = student.hasPdf === true ? '✓ Has PDF' : 
                         student.hasPdf === false ? '✗ No PDF' : '⏳ Checking';
        
        htmlContent += `
            <tr>
                <td>${index + 1}</td>
                <td>${student.name || '-'}</td>
                <td>${student.assessmentNo || '-'}</td>
                <td>${student.upi || '-'}</td>
                <td>${student.grade || '-'}</td>
                <td>${pdfStatus}</td>
            </tr>
        `;
    });

    htmlContent += `
        </tbody>
    </table>
    
    <div class="footer">
        <div class="footer-section">
            <strong>Prepared by:</strong>
            <div class="signature-line">Signature & Date</div>
        </div>
        <div class="footer-section" style="text-align: right;">
            <strong>Verified by:</strong>
            <div class="signature-line">Signature & Date</div>
            <div class="stamp-box" style="margin-top: 10px; display: inline-block;">
                OFFICIAL<br>STAMP
            </div>
        </div>
    </div>
</body>
</html>
    `;

    // Convert HTML to blob and download
    const blob = new Blob(['\ufeff', htmlContent], {
        type: 'application/msword'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `student_data_${currentGrade !== 'all' ? currentGrade : 'all'}_${currentFilter}_${new Date().toISOString().split('T')[0]}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast('Word document exported successfully!', 'success');
};

// =============================================================================
// UNIFIED EXPORT FUNCTION
// =============================================================================

function handleExportEnhanced() {
    if (exportInProgress) return;
    
    const exportOptions = [
        { label: 'Export to PDF (Premium Format)', value: 'pdf', icon: '📄' },
        { label: 'Export to Excel (Premium Format)', value: 'excel', icon: '📊' },
        { label: 'Export to Word (Premium Format)', value: 'word', icon: '📝' },
        { label: 'Export Current View (CSV)', value: 'current-csv', icon: '📋' },
        { label: 'Export All Students (CSV)', value: 'all-csv', icon: '📋' },
        { label: 'Export Students Without PDF (CSV)', value: 'no-pdf-csv', icon: '⚠️' },
        { label: 'Export Statistics (JSON)', value: 'stats-json', icon: '📈' }
    ];
    
    showExportModalEnhanced(exportOptions);
}

function showExportModalEnhanced(options) {
    const modalBackdrop = document.getElementById('modal-backdrop');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    
    if (!modalBackdrop || !modalTitle || !modalMessage) return;
    
    modalTitle.textContent = 'Export Data';
    
    let optionsHtml = '<div class="space-y-2 mt-4">';
    options.forEach((option) => {
        optionsHtml += `
            <button onclick="executeExportEnhanced('${option.value}')" 
                    class="w-full px-4 py-3 text-left bg-gradient-to-r from-gray-50 to-blue-50 hover:from-blue-50 hover:to-blue-100 border border-gray-200 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md">
                <span class="text-2xl mr-3">${option.icon}</span>
                <span class="font-medium text-gray-800">${option.label}</span>
            </button>
        `;
    });
    optionsHtml += '</div>';
    
    modalMessage.innerHTML = optionsHtml;
    modalBackdrop.classList.remove('hidden');
    modalBackdrop.classList.add('flex');
    
    // ✅ ADD OUTSIDE CLICK TO CLOSE (one-time setup)
    if (!modalBackdrop.dataset.outsideClickAdded) {
        modalBackdrop.addEventListener('click', function(event) {
            // Only close if clicking the backdrop itself (not the modal content)
            if (event.target === modalBackdrop) {
                modalBackdrop.classList.add('hidden');
                modalBackdrop.classList.remove('flex');
            }
        });
        modalBackdrop.dataset.outsideClickAdded = 'true';
    }
}
window.executeExportEnhanced = function(exportType) {
    const modalBackdrop = document.getElementById('modal-backdrop');
    if (modalBackdrop) {
        modalBackdrop.classList.add('hidden');
    }
    
    exportInProgress = true;
    showToast('Preparing export...', 'info');
    
    setTimeout(async () => {
        try {
            switch(exportType) {
                case 'pdf':
                    await exportToPdfEnhanced();
                    break;
                case 'excel':
                    await exportToExcelEnhanced();
                    break;
                case 'word':
                    await exportToWordEnhanced();
                    break;
                case 'current-csv':
                    exportToCSV(filteredStudents, 'students_current_view');
                    showToast('CSV exported successfully!', 'success');
                    break;
                case 'all-csv':
                    exportToCSV(allStudents, 'students_all');
                    showToast('CSV exported successfully!', 'success');
                    break;
                case 'no-pdf-csv':
                    const noPdfStudents = allStudents.filter(s => s.hasPdf === false);
                    exportToCSV(noPdfStudents, 'students_without_pdf');
                    showToast('CSV exported successfully!', 'success');
                    break;
                case 'stats-json':
                    exportStatistics();
                    showToast('Statistics exported successfully!', 'success');
                    break;
            }
        } catch (error) {
            console.error('Export error:', error);
            showToast('Failed to export data. Please try again.', 'error');
        } finally {
            exportInProgress = false;
        }
    }, 100);
};

window.exportToPdfEnhanced = exportToPdfEnhanced;
window.exportToExcelEnhanced = exportToExcelEnhanced;
window.exportToWordEnhanced = exportToWordEnhanced;
window.handleExport = handleExportEnhanced;
window.handleExportEnhanced = handleExportEnhanced;
// =============================================================================
// SORTING FUNCTIONALITY
// =============================================================================

function sortStudents(field) {
    if (currentSortField === field) {
        // Toggle sort order
        currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortField = field;
        currentSortOrder = 'asc';
    }
    
    filteredStudents.sort((a, b) => {
        let valueA, valueB;
        
        switch(field) {
            case 'name':
                valueA = (a.name || '').toLowerCase();
                valueB = (b.name || '').toLowerCase();
                break;
            case 'assessmentNo':
                valueA = a.assessmentNo || '';
                valueB = b.assessmentNo || '';
                break;
            case 'grade':
                valueA = a.grade || 'ZZZ';
                valueB = b.grade || 'ZZZ';
                break;
            case 'pdf':
                valueA = a.hasPdf === true ? 2 : a.hasPdf === false ? 0 : 1;
                valueB = b.hasPdf === true ? 2 : b.hasPdf === false ? 0 : 1;
                break;
            default:
                return 0;
        }
        
        if (valueA < valueB) return currentSortOrder === 'asc' ? -1 : 1;
        if (valueA > valueB) return currentSortOrder === 'asc' ? 1 : -1;
        return 0;
    });
    
    currentPage = 1;
    renderStudents();
    updateSortIndicators();
}

function updateSortIndicators() {
    // Remove all sort indicators
    document.querySelectorAll('.sort-indicator').forEach(el => {
        el.textContent = '';
    });
    
    // Add current sort indicator
    const indicator = document.querySelector(`[data-sort="${currentSortField}"] .sort-indicator`);
    if (indicator) {
        indicator.textContent = currentSortOrder === 'asc' ? ' ▲' : ' ▼';
    }
}

window.sortStudents = sortStudents;

// =============================================================================
// EXPORT GLOBAL FUNCTIONS
// =============================================================================

window.openLocalPDF = window.openLocalPDF;
window.showUploadPdfModal = showUploadPdfModal;
window.refreshData = refreshData;
window.closePDFModal = closePDFModal;

console.log('✅ Supabase Storage integration complete!');