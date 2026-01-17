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
let currentUpiFilter = 'all'; // ✅ ADD THIS LINE
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
                upsert: true
            });
        
        if (error) throw error;
        
        // Clear cache for this student
        const cacheKey = `${studentGrade}/${studentName}`;
        pdfExistenceCache.delete(cacheKey);
        
        // ✅ BROADCAST THE UPLOAD EVENT
        if (supabaseChannel) {
            await supabaseChannel.send({
                type: 'broadcast',
                event: 'pdf-change',
                payload: {
                    action: 'upload',
                    studentName: studentName,
                    grade: studentGrade,
                    timestamp: new Date().toISOString()
                }
            });
        }
        
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
        
        const { data: fileList, error: listError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .list(studentGrade);
        
        if (listError) throw listError;
        
        const studentFileName = fileList.find(file => 
            file.name.toLowerCase() === `${studentName.toLowerCase()}.pdf`
        );
        
        if (!studentFileName) {
            throw new Error('PDF file not found in storage');
        }
        
        const fullPath = `${studentGrade}/${studentFileName.name}`;
        
        const { data, error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .remove([fullPath]);
        
        if (error) throw error;
        
        // Clear cache for this student
        const cacheKey = `${studentGrade}/${studentName}`;
        pdfExistenceCache.delete(cacheKey);
        
        // ✅ BROADCAST THE DELETE EVENT
        if (supabaseChannel) {
            await supabaseChannel.send({
                type: 'broadcast',
                event: 'pdf-change',
                payload: {
                    action: 'delete',
                    studentName: studentName,
                    grade: studentGrade,
                    timestamp: new Date().toISOString()
                }
            });
        }
        
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

        // 🔹 Outside click to close
    if (!modalBackdrop.dataset.outsideClickAdded) {
        modalBackdrop.addEventListener('click', (event) => {
            if (event.target === modalBackdrop) {
                modalBackdrop.classList.add('hidden');
                modalBackdrop.classList.remove('flex');
            }
        });
        modalBackdrop.dataset.outsideClickAdded = 'true';
    }

    
    
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

    const noStudentsMessage = document.getElementById('no-students-message');
    if (studentsToDisplay.length === 0) {
        if (noStudentsMessage) {
            noStudentsMessage.classList.remove('hidden');
        }
        return;
        } else {
        // ✅ HIDE the no-students message when students ARE displayed
        if (noStudentsMessage) {
            noStudentsMessage.classList.add('hidden');
        }
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
    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-b border-[#3498db]">${rowNumber}</td>
    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-b border-[#3498db]">${safeName}</td>
    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-b border-[#3498db]">${safeAssessmentNo}</td>
    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-b border-[#3498db]">${safeUpi}</td>
    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-b border-[#3498db]">${safeGrade}</td>
    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-b border-[#3498db]">
        <span class="mr-2">${pdfIcon}</span>${pdfStatus}
    </td>
<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium  border-b border-[#3498db]">
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
    const paginationControls = document.getElementById('pagination-controls');
    paginationControls.innerHTML = '';
    
    // Update pagination info (e.g., "Showing 1 to 10 of 46 entries")
    const paginationInfo = document.getElementById('pagination-info');
    const startEntry = (currentPage - 1) * itemsPerPage + 1;
    const endEntry = Math.min(currentPage * itemsPerPage, filteredStudents.length);
    const totalEntries = filteredStudents.length;
   paginationInfo.innerHTML = `<span style="background-color: #3498db; color: white; padding: 6px 12px; border-radius: 6px; font-weight: 200;">Showing ${startEntry} to ${endEntry} of ${totalEntries} entries</span>`;
    
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
    
    // First page button
    const firstBtn = document.createElement('button');
    firstBtn.innerHTML = '⟨⟨';
    firstBtn.title = 'First page';
    firstBtn.style.cssText = currentPage === 1 ? disabledButtonStyle : buttonStyle;
    firstBtn.disabled = currentPage === 1;
    firstBtn.onclick = () => goToPage(1);
    paginationControls.appendChild(firstBtn);
    
    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '⟨ Previous';
    prevBtn.style.cssText = currentPage === 1 ? disabledButtonStyle : buttonStyle;
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => goToPage(currentPage - 1);
    paginationControls.appendChild(prevBtn);
    
    // Page number buttons
    let startPage = Math.max(1, currentPage - 3);
    let endPage = Math.min(totalPages, currentPage + 3);
    
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
    
    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = 'Next ⟩';
    nextBtn.style.cssText = currentPage === totalPages ? disabledButtonStyle : buttonStyle;
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => goToPage(currentPage + 1);
    paginationControls.appendChild(nextBtn);
    
    // Last page button
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
    
    // ✅ Calculate UPI statistics
    const withValidUpi = allStudents.filter(s => {
        const upi = (s.upi || '').trim();
        return upi && upi !== '---' && upi !== 'N/A' && upi !== 'null' && upi.length > 0;
    }).length;
    const withoutValidUpi = total - withValidUpi;
    
    const withPdfPercentage = checkedStudents.length > 0 
        ? ((withPdfCount / checkedStudents.length) * 100).toFixed(2) 
        : '0.00';
    const withoutPdfPercentage = checkedStudents.length > 0 
        ? ((withoutPdfCount / checkedStudents.length) * 100).toFixed(2) 
        : '0.00';
    
    // ✅ UPI percentages
    const withUpiPercentage = total > 0 
        ? ((withValidUpi / total) * 100).toFixed(2) 
        : '0.00';
    const withoutUpiPercentage = total > 0 
        ? ((withoutValidUpi / total) * 100).toFixed(2) 
        : '0.00';

    const totalCountEl = document.getElementById('total-count');
    const pdfCountEl = document.getElementById('pdf-count');
    const noPdfCountEl = document.getElementById('no-pdf-count');
    const filteredCountEl = document.getElementById('filtered-count');
    const filteredCountEl2 = document.getElementById('filtered-count2');

    if (totalCountEl) totalCountEl.textContent = total;
    if (pdfCountEl) pdfCountEl.textContent = `${withPdfCount} (${withPdfPercentage}%)`;
    if (noPdfCountEl) noPdfCountEl.textContent = `${withoutPdfCount} (${withoutPdfPercentage}%)`;
    if (filteredCountEl) filteredCountEl.textContent = filteredStudents.length;
    if (filteredCountEl2) filteredCountEl2.textContent = filteredStudents.length;
      
    // ✅ Log UPI stats to console (optional)
    console.log(`UPI Stats - Valid: ${withValidUpi} (${withUpiPercentage}%), Invalid: ${withoutValidUpi} (${withoutUpiPercentage}%)`);
    
    updateGradeStatistics(checkedStudents);
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
        const upi = (student.upi || '').trim();

        // ✅ UPI validation logic
        const hasValidUpi = upi && 
                           upi !== '---' && 
                           upi !== 'N/A' && 
                           upi !== 'null' &&
                           upi.length > 0;

        // Search filter
        const matchesSearch = currentSearchTerm === '' ||
            name.includes(currentSearchTerm.toLowerCase()) ||
            assessmentNo.includes(currentSearchTerm.toLowerCase());

        // PDF filter
        const matchesPdfFilter = currentFilter === 'all' || 
            (currentFilter === 'with-pdf' && hasPdf === true) ||
            (currentFilter === 'without-pdf' && hasPdf === false);

        // Grade filter
        const matchesGrade = currentGrade === 'all' ||
            studentGrade === currentGrade;

        // ✅ UPI filter
        const matchesUpiFilter = currentUpiFilter === 'all' ||
            (currentUpiFilter === 'with-upi' && hasValidUpi) ||
            (currentUpiFilter === 'without-upi' && !hasValidUpi);

        return matchesSearch && matchesPdfFilter && matchesGrade && matchesUpiFilter;
    });

    currentPage = 1;
    renderStudents();
}

// ============================================================================
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
// =============================================================================
// SUPABASE REALTIME LISTENER FOR PDF CHANGES (BROADCAST VERSION)
// =============================================================================

let supabaseChannel = null;

function startSupabaseRealtimeListener() {
    // Clean up existing channel if any
    if (supabaseChannel) {
        supabase.removeChannel(supabaseChannel);
    }
    
    console.log('🔄 Starting Supabase realtime listener (Broadcast mode)...');
    
    supabaseChannel = supabase
        .channel('pdf-updates-channel')
        .on('broadcast', { event: 'pdf-change' }, (payload) => {
            console.log('📁 PDF change broadcast received:', payload);
            
            const { action, studentName, grade } = payload.payload;
            
            if (!studentName || !grade) {
                console.warn('Invalid payload received');
                return;
            }
            
            console.log(`Action: ${action}, Student: ${studentName}, Grade: ${grade}`);
            
            // Find ALL matching students
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
                
                if (action === 'delete') {
                    student.hasPdf = false;
                } else if (action === 'upload') {
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
            const actionText = action === 'delete' ? 'deleted' : 'uploaded';
            showToast(`✓ PDF ${actionText} for ${studentName} (${grade})`, 'success');
        })
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log('✅ Supabase realtime connected (Broadcast mode)');
                showToast('PDF monitoring active', 'success');
            } else if (status === 'CLOSED') {
                console.log('⚠️ Supabase realtime disconnected');
            } else if (status === 'CHANNEL_ERROR') {
                console.error('❌ Supabase realtime error');
                showToast('Internet Disconnected PDF monitoring error - will retry', 'error');
            //    console.error('Internet Disconnected PDF monitoring error - will retry', 'error');
                
                // Auto-retry after 5 seconds
                setTimeout(() => {
                    if (realtimeListenerActive) {
                        console.log('🔄 Retrying Supabase connection...');
                        startSupabaseRealtimeListener();
                    }
                }, 5000);
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
    //
      if (allStudents.length > 0) {
        const checkedStudents = allStudents.filter(s => s.hasPdf !== undefined);
        updateGradeStatistics(checkedStudents);
    }
    
    // Sign out button
    const signOutBtn = document.getElementById('sign-out-btn');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', handleSignOut);
    }
    // ✅ ADD UPI FILTER EVENT LISTENER
    const upiFilterSelect = document.getElementById('upi-filter');
    if (upiFilterSelect) {
        upiFilterSelect.addEventListener('change', (e) => {
            currentUpiFilter = e.target.value;
            applyFiltersAndRender();
            
            // Show toast notification
            let message = '';
            switch(currentUpiFilter) {
                case 'all':
                    message = 'Showing all students';
                    break;
                case 'with-upi':
                    message = 'Showing students with valid UPI';
                    break;
                case 'without-upi':
                    message = 'Showing students without valid UPI';
                    break;
            }
            showToast(message, 'info');
        });
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
// ADVANCED ANALYTICS FUNCTIONALITY WITH INTERACTIVE CHARTS
// =============================================================================

// =============================================================================
// ADVANCED ANALYTICS FUNCTIONALITY WITH INTERACTIVE CHARTS + ENHANCED FEATURES
// =============================================================================

function showAdvancedAnalytics() {
    const analyticsBackdrop = document.getElementById('analytics-modal-backdrop');
    const analyticsContent = document.getElementById('analytics-content');
    
    if (!analyticsBackdrop || !analyticsContent) {
        console.error('Analytics modal elements not found');
        return;
    }
    
    // Generate analytics
    const analytics = generateAdvancedAnalytics();
    
    // Render analytics content
    analyticsContent.innerHTML = `
        <!-- Tab Navigation -->
        <div class="mb-6 border-b border-gray-200 dark:border-gray-700">
            <nav class="flex gap-4" aria-label="Analytics Tabs">
                <button onclick="switchAnalyticsTab('overview')" id="tab-overview" class="analytics-tab active px-6 py-3 font-semibold text-indigo-600 border-b-2 border-indigo-600 transition-all">
                    <svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                    Overview
                </button>
                <button onclick="switchAnalyticsTab('grades')" id="tab-grades" class="analytics-tab px-6 py-3 font-semibold text-gray-600 hover:text-indigo-600 transition-all">
                    <svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                    </svg>
                    Grades
                </button>
                <button onclick="switchAnalyticsTab('trends')" id="tab-trends" class="analytics-tab px-6 py-3 font-semibold text-gray-600 hover:text-indigo-600 transition-all">
                    <svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path>
                    </svg>
                    Trends
                </button>
                <button onclick="switchAnalyticsTab('comparison')" id="tab-comparison" class="analytics-tab px-6 py-3 font-semibold text-gray-600 hover:text-indigo-600 transition-all">
                    <svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                    Compare
                </button>
                <button onclick="switchAnalyticsTab('export')" id="tab-export" class="analytics-tab px-6 py-3 font-semibold text-gray-600 hover:text-indigo-600 transition-all">
                    <svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    Export
                </button>
            </nav>
        </div>

        <!-- Tab Content Container -->
        <div id="analytics-tab-content">
            ${renderOverviewTab(analytics)}
        </div>
    `;
    
    // Show modal
    analyticsBackdrop.classList.remove('hidden');
    analyticsBackdrop.classList.add('flex');
    
    // Initialize charts after a brief delay to ensure canvas is rendered
    setTimeout(() => {
        initializeAnalyticsCharts(analytics);
    }, 100);
}

// =============================================================================
// TAB RENDERING FUNCTIONS
// =============================================================================

function renderOverviewTab(analytics) {
    return `
        <!-- Overview Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div class="neuro-card p-6 cursor-pointer hover:scale-105 transition-transform" onclick="showStudentList('all')">
                <div class="flex items-center justify-between mb-2">
                    <h4 class="text-sm font-semibold text-gray-500 dark:text-gray-400">Total Students</h4>
                    <svg class="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                    </svg>
                </div>
                <p class="text-3xl font-bold gradient-text">${analytics.overview.totalStudents}</p>
                <p class="text-xs text-gray-500 mt-2">Click to view all</p>
            </div>
            
            <div class="neuro-card p-6 cursor-pointer hover:scale-105 transition-transform" onclick="showCompletionTrend()">
                <div class="flex items-center justify-between mb-2">
                    <h4 class="text-sm font-semibold text-gray-500 dark:text-gray-400">Completion Rate</h4>
                    <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <p class="text-3xl font-bold gradient-text">${analytics.overview.completionRate}%</p>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                    <div class="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500" 
                         style="width: ${analytics.overview.completionRate}%"></div>
                </div>
            </div>
            
            <div class="neuro-card p-6 cursor-pointer hover:scale-105 transition-transform" onclick="filterByStatus('completed')">
                <div class="flex items-center justify-between mb-2">
                    <h4 class="text-sm font-semibold text-gray-500 dark:text-gray-400">Documents</h4>
                    <svg class="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                </div>
                <p class="text-3xl font-bold gradient-text">${analytics.overview.withDocuments}</p>
                <p class="text-xs text-green-600 font-semibold mt-2">✓ Complete</p>
            </div>
            
            <div class="neuro-card p-6 cursor-pointer hover:scale-105 transition-transform" onclick="filterByStatus('pending')">
                <div class="flex items-center justify-between mb-2">
                    <h4 class="text-sm font-semibold text-gray-500 dark:text-gray-400">Pending</h4>
                    <svg class="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <p class="text-3xl font-bold gradient-text">${analytics.overview.pending}</p>
                <p class="text-xs text-orange-600 font-semibold mt-2">⚠ Action needed</p>
            </div>
        </div>
        
        <!-- Interactive Charts -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <!-- Completion Rate Pie Chart -->
            <div class="glass-morph rounded-2xl p-6">
                <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path>
                    </svg>
                    Document Status Distribution
                </h3>
                <div style="height: 280px;">
                    <canvas id="statusPieChart"></canvas>
                </div>
            </div>
            
            <!-- Grade Performance Bar Chart -->
            <div class="glass-morph rounded-2xl p-6">
                <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                    Grade-wise Completion
                </h3>
                <div style="height: 280px;">
                    <canvas id="gradeBarChart"></canvas>
                </div>
            </div>
        </div>
        
        <!-- Gender Distribution Chart -->
        <div class="glass-morph rounded-2xl p-6 mb-6">
            <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <svg class="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                Gender Distribution by Grade
            </h3>
            <div style="height: 300px;">
                <canvas id="genderChart"></canvas>
            </div>
        </div>
        
        <!-- Quick Action Buttons -->
        <div class="glass-morph rounded-2xl p-6 mb-6">
            <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                Quick Actions
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button onclick="filterByStatus('pending')" class="action-btn p-4 bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105">
                    <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p class="font-semibold text-sm">View Pending</p>
                </button>
                
                <button onclick="filterByStatus('completed')" class="action-btn p-4 bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105">
                    <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p class="font-semibold text-sm">View Completed</p>
                </button>
                
                <button onclick="showTopGrade()" class="action-btn p-4 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105">
                    <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
                    </svg>
                    <p class="font-semibold text-sm">Top Grade</p>
                </button>
                
                <button onclick="generateEmailList()" class="action-btn p-4 bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105">
                    <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                    <p class="font-semibold text-sm">Email List</p>
                </button>
            </div>
        </div>
        
        <!-- Insights & Recommendations -->
        <div class="glass-morph rounded-2xl p-6 mb-6">
            <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
                Insights & Recommendations
            </h3>
            <div class="space-y-3">
                ${analytics.insights.map(insight => {
                    const iconColors = {
                        success: 'text-green-600',
                        warning: 'text-yellow-600',
                        info: 'text-blue-600',
                        error: 'text-red-600'
                    };
                    const bgColors = {
                        success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
                        warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
                        info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
                        error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    };
                    return `
                        <div class="p-4 ${bgColors[insight.type]} border rounded-lg flex items-start gap-3">
                            <svg class="w-5 h-5 ${iconColors[insight.type]} flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <div>
                                <p class="font-semibold text-gray-800 dark:text-white">${insight.title}</p>
                                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">${insight.message}</p>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

function renderGradesTab(analytics) {
    return `
        <!-- Grade Breakdown -->
        <div class="glass-morph rounded-2xl p-6 mb-6">
            <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
                Grade-wise Analysis
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${analytics.gradeBreakdown.map(grade => `
                    <div class="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105" onclick="filterByGrade('${grade.name}')">
                        <div class="flex items-center justify-between mb-3">
                            <h4 class="font-bold text-gray-800 dark:text-white">${grade.name}</h4>
                            <span class="text-xs font-semibold px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                                ${grade.total} students
                            </span>
                        </div>
                        <div class="space-y-2">
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600 dark:text-gray-400">With Documents:</span>
                                <span class="font-semibold text-green-600">${grade.withPdf} (${grade.withPdfPercent}%)</span>
                            </div>
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600 dark:text-gray-400">Pending:</span>
                                <span class="font-semibold text-orange-600">${grade.withoutPdf} (${grade.withoutPdfPercent}%)</span>
                            </div>
                            <div class="flex justify-between text-sm mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                <span class="text-gray-600 dark:text-gray-400">Gender:</span>
                                <span class="font-semibold text-blue-600">
                                    <span class="inline-flex items-center gap-1">
                                        <svg class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                                        </svg>
                                        ${grade.male || 0}M
                                    </span>
                                    <span class="mx-1">|</span>
                                    <span class="inline-flex items-center gap-1">
                                        <svg class="w-4 h-4 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                                        </svg>
                                        ${grade.female || 0}F
                                    </span>
                                </span>
                            </div>
                            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                                <div class="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500" 
                                     style="width: ${grade.withPdfPercent}%"></div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <!-- Grade Comparison Table -->
        <div class="glass-morph rounded-2xl p-6">
            <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4">Grade Comparison Table</h3>
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead>
                        <tr class="bg-gray-100 dark:bg-gray-800">
                            <th class="px-4 py-3 text-left font-semibold">Grade</th>
                            <th class="px-4 py-3 text-center font-semibold">Total</th>
                            <th class="px-4 py-3 text-center font-semibold">Complete</th>
                            <th class="px-4 py-3 text-center font-semibold">Pending</th>
                            <th class="px-4 py-3 text-center font-semibold">Male</th>
                            <th class="px-4 py-3 text-center font-semibold">Female</th>
                            <th class="px-4 py-3 text-center font-semibold">Completion %</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${analytics.gradeBreakdown.map((grade, index) => `
                            <tr class="${index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'} hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors" onclick="filterByGrade('${grade.name}')">
                                <td class="px-4 py-3 font-semibold">${grade.name}</td>
                                <td class="px-4 py-3 text-center">${grade.total}</td>
                                <td class="px-4 py-3 text-center text-green-600 font-semibold">${grade.withPdf}</td>
                                <td class="px-4 py-3 text-center text-orange-600 font-semibold">${grade.withoutPdf}</td>
                                <td class="px-4 py-3 text-center text-blue-600">${grade.male || 0}</td>
                                <td class="px-4 py-3 text-center text-pink-600">${grade.female || 0}</td>
                                <td class="px-4 py-3 text-center">
                                    <span class="px-3 py-1 rounded-full text-xs font-bold ${parseFloat(grade.withPdfPercent) >= 80 ? 'bg-green-100 text-green-800' : parseFloat(grade.withPdfPercent) >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}">
                                        ${grade.withPdfPercent}%
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderTrendsTab(analytics) {
    return `
        <!-- Trends and Patterns -->
        <div class="glass-morph rounded-2xl p-6 mb-6">
            <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path>
                </svg>
                Completion Trends
            </h3>
            <div style="height: 350px;">
                <canvas id="trendLineChart"></canvas>
            </div>
        </div>
        
        <!-- Best and Worst Performing Grades -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div class="glass-morph rounded-2xl p-6">
                <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
                    </svg>
                    Top Performing Grades
                </h3>
                <div class="space-y-3">
                    ${analytics.gradeBreakdown
                        .sort((a, b) => parseFloat(b.withPdfPercent) - parseFloat(a.withPdfPercent))
                        .slice(0, 3)
                        .map((grade, index) => `
                            <div class="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800 cursor-pointer hover:shadow-lg transition-all" onclick="filterByGrade('${grade.name}')">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-3">
                                        <span class="text-2xl font-bold text-green-600">#${index + 1}</span>
                                        <div>
                                            <p class="font-bold text-gray-800 dark:text-white">${grade.name}</p>
                                            <p class="text-sm text-gray-600 dark:text-gray-400">${grade.withPdf}/${grade.total} students</p>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <p class="text-2xl font-bold text-green-600">${grade.withPdfPercent}%</p>
                                        <p class="text-xs text-gray-500">completion</p>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                </div>
            </div>
            
            <div class="glass-morph rounded-2xl p-6">
                <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                    Needs Attention
                </h3>
                <div class="space-y-3">
                    ${analytics.gradeBreakdown
                        .sort((a, b) => parseFloat(a.withPdfPercent) - parseFloat(b.withPdfPercent))
                        .slice(0, 3)
                        .map((grade, index) => `
                            <div class="p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg border border-red-200 dark:border-red-800 cursor-pointer hover:shadow-lg transition-all" onclick="filterByGrade('${grade.name}')">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-3">
                                        <span class="text-2xl font-bold text-red-600">⚠</span>
                                        <div>
                                            <p class="font-bold text-gray-800 dark:text-white">${grade.name}</p>
                                            <p class="text-sm text-gray-600 dark:text-gray-400">${grade.withoutPdf} pending documents</p>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <p class="text-2xl font-bold text-red-600">${grade.withPdfPercent}%</p>
                                        <p class="text-xs text-gray-500">completion</p>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                </div>
            </div>
        </div>
        
        <!-- Gender Distribution Trends -->
        <div class="glass-morph rounded-2xl p-6">
            <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                Gender Distribution Across Grades
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Male</p>
                    <p class="text-3xl font-bold text-blue-600">${analytics.gradeBreakdown.reduce((sum, g) => sum + (g.male || 0), 0)}</p>
                </div>
                <div class="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Female</p>
                    <p class="text-3xl font-bold text-pink-600">${analytics.gradeBreakdown.reduce((sum, g) => sum + (g.female || 0), 0)}</p>
                </div>
                <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">M:F Ratio</p>
                    <p class="text-3xl font-bold text-green-600">${calculateGenderRatio(analytics)}</p>
                </div>
                <div class="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Balanced Grades</p>
                    <p class="text-3xl font-bold text-purple-600">${countBalancedGrades(analytics)}</p>
                </div>
            </div>
            <div style="height: 300px;">
                <canvas id="genderComparisonChart"></canvas>
            </div>
        </div>
    `;
}

function renderComparisonTab(analytics) {
    return `
        <!-- Grade Comparison -->
        <div class="glass-morph rounded-2xl p-6 mb-6">
            <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
                Side-by-Side Grade Comparison
            </h3>
            
            <div class="mb-4 flex gap-4">
                <div class="flex-1">
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Select Grade 1</label>
                    <select id="compare-grade-1" class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" onchange="updateComparison()">
                        ${analytics.gradeBreakdown.map(g => `<option value="${g.name}">${g.name}</option>`).join('')}
                    </select>
                </div>
                <div class="flex-1">
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Select Grade 2</label>
                    <select id="compare-grade-2" class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" onchange="updateComparison()">
                        ${analytics.gradeBreakdown.map((g, i) => `<option value="${g.name}" ${i === 1 ? 'selected' : ''}>${g.name}</option>`).join('')}
                    </select>
                </div>
            </div>
            
            <div id="comparison-result" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Will be populated by updateComparison() -->
            </div>
        </div>
        
        <!-- Radar Chart Comparison -->
        <div class="glass-morph rounded-2xl p-6 mb-6">
            <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4">Multi-Metric Comparison</h3>
            <div style="height: 400px;">
                <canvas id="radarComparisonChart"></canvas>
            </div>
        </div>
        
        <!-- Statistical Summary -->
        <div class="glass-morph rounded-2xl p-6">
            <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4">Statistical Summary</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Average Completion</p>
                    <p class="text-3xl font-bold text-blue-600">${calculateAverageCompletion(analytics)}%</p>
                </div>
                <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Highest Grade</p>
                    <p class="text-2xl font-bold text-green-600">${getHighestGrade(analytics).name}</p>
                    <p class="text-sm text-gray-500">${getHighestGrade(analytics).withPdfPercent}% completion</p>
                </div>
                <div class="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Lowest Grade</p>
                    <p class="text-2xl font-bold text-red-600">${getLowestGrade(analytics).name}</p>
                    <p class="text-sm text-gray-500">${getLowestGrade(analytics).withPdfPercent}% completion</p>
                </div>
            </div>
        </div>
    `;
}

function renderExportTab(analytics) {
    return `
        <!-- Export Options -->
        <div class="glass-morph rounded-2xl p-6 mb-6">
            <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                Export Options
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <!-- PDF Export -->
                <div class="p-6 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-xl border border-red-200 dark:border-red-800 cursor-pointer hover:shadow-lg transition-all hover:scale-105" onclick="exportAnalyticsToPDF()">
                    <svg class="w-12 h-12 text-red-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                    </svg>
                    <h4 class="font-bold text-gray-800 dark:text-white mb-2">PDF Report</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Complete analytics report with charts</p>
                </div>
                
                <!-- Excel Export -->
                <div class="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800 cursor-pointer hover:shadow-lg transition-all hover:scale-105" onclick="exportAnalyticsToExcel()">
                    <svg class="w-12 h-12 text-green-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <h4 class="font-bold text-gray-800 dark:text-white mb-2">Excel Spreadsheet</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Detailed data for further analysis</p>
                </div>
                
                <!-- JSON Export -->
                <div class="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 cursor-pointer hover:shadow-lg transition-all hover:scale-105" onclick="exportAnalyticsReport()">
                    <svg class="w-12 h-12 text-blue-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                    </svg>
                    <h4 class="font-bold text-gray-800 dark:text-white mb-2">JSON Data</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Raw data for API integration</p>
                </div>
                
                <!-- Print Report -->
                <div class="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800 cursor-pointer hover:shadow-lg transition-all hover:scale-105" onclick="printAnalyticsReport()">
                    <svg class="w-12 h-12 text-purple-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                    </svg>
                    <h4 class="font-bold text-gray-800 dark:text-white mb-2">Print Report</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Printer-friendly format</p>
                </div>
                
                <!-- Email List -->
                <div class="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800 cursor-pointer hover:shadow-lg transition-all hover:scale-105" onclick="generateEmailList()">
                    <svg class="w-12 h-12 text-yellow-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                    <h4 class="font-bold text-gray-800 dark:text-white mb-2">Email List</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Contact list for reminders</p>
                </div>
                
                <!-- Summary Report -->
                <div class="p-6 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800 cursor-pointer hover:shadow-lg transition-all hover:scale-105" onclick="exportSummaryReport()">
                    <svg class="w-12 h-12 text-indigo-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <h4 class="font-bold text-gray-800 dark:text-white mb-2">Summary Report</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Quick overview document</p>
                </div>
            </div>
        </div>
        
        <!-- Advanced Export Options -->
        <div class="glass-morph rounded-2xl p-6">
            <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4">Custom Export Settings</h3>
            
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Include Sections</label>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <label class="flex items-center gap-2">
                            <input type="checkbox" id="export-overview" checked class="rounded">
                            <span class="text-sm">Overview</span>
                        </label>
                        <label class="flex items-center gap-2">
                            <input type="checkbox" id="export-grades" checked class="rounded">
                            <span class="text-sm">Grade Details</span>
                        </label>
                        <label class="flex items-center gap-2">
                            <input type="checkbox" id="export-charts" checked class="rounded">
                            <span class="text-sm">Charts</span>
                        </label>
                        <label class="flex items-center gap-2">
                            <input type="checkbox" id="export-insights" checked class="rounded">
                            <span class="text-sm">Insights</span>
                        </label>
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Date Range</label>
                    <div class="flex gap-4">
                        <input type="date" id="export-date-from" class="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
                        <span class="self-center text-gray-500">to</span>
                        <input type="date" id="export-date-to" class="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                </div>
                
                <button onclick="exportCustomReport()" class="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all hover:scale-105">
                    Generate Custom Report
                </button>
            </div>
        </div>
    `;
}

// =============================================================================
// TAB SWITCHING FUNCTIONALITY
// =============================================================================

function switchAnalyticsTab(tabName) {
    // Remove active class from all tabs
    document.querySelectorAll('.analytics-tab').forEach(tab => {
        tab.classList.remove('active', 'text-indigo-600', 'border-b-2', 'border-indigo-600');
        tab.classList.add('text-gray-600');
    });
    
    // Add active class to selected tab
    const activeTab = document.getElementById(`tab-${tabName}`);
    if (activeTab) {
        activeTab.classList.add('active', 'text-indigo-600', 'border-b-2', 'border-indigo-600');
        activeTab.classList.remove('text-gray-600');
    }
    
    // Generate analytics data
    const analytics = generateAdvancedAnalytics();
    
    // Render appropriate tab content
    const tabContent = document.getElementById('analytics-tab-content');
    if (!tabContent) return;
    
    switch(tabName) {
        case 'overview':
            tabContent.innerHTML = renderOverviewTab(analytics);
            setTimeout(() => initializeAnalyticsCharts(analytics), 100);
            break;
        case 'grades':
            tabContent.innerHTML = renderGradesTab(analytics);
            break;
        case 'trends':
            tabContent.innerHTML = renderTrendsTab(analytics);
            setTimeout(() => initializeTrendCharts(analytics), 100);
            break;
        case 'comparison':
            tabContent.innerHTML = renderComparisonTab(analytics);
            setTimeout(() => {
                updateComparison();
                initializeRadarChart(analytics);
            }, 100);
            break;
        case 'export':
            tabContent.innerHTML = renderExportTab(analytics);
            break;
    }
}

// =============================================================================
// CHART INITIALIZATION FUNCTIONS
// =============================================================================

function initializeAnalyticsCharts(analytics) {
    // Pie Chart for Document Status
    const pieCtx = document.getElementById('statusPieChart');
    if (pieCtx && window.Chart) {
        new Chart(pieCtx, {
            type: 'doughnut',
            data: {
                labels: ['With Documents', 'Pending', 'Not Checked'],
                datasets: [{
                    data: [
                        analytics.overview.withDocuments,
                        analytics.overview.pending,
                        analytics.overview.totalStudents - analytics.performance.checkedCount
                    ],
                    backgroundColor: [
                        'rgba(34, 197, 94, 0.8)',
                        'rgba(251, 146, 60, 0.8)',
                        'rgba(148, 163, 184, 0.8)'
                    ],
                    borderColor: [
                        'rgba(34, 197, 94, 1)',
                        'rgba(251, 146, 60, 1)',
                        'rgba(148, 163, 184, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    
    // Bar Chart for Grade Performance
    const barCtx = document.getElementById('gradeBarChart');
    if (barCtx && window.Chart) {
        const gradeLabels = analytics.gradeBreakdown.map(g => g.name);
        const withPdfData = analytics.gradeBreakdown.map(g => g.withPdf);
        const withoutPdfData = analytics.gradeBreakdown.map(g => g.withoutPdf);
        
        new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: gradeLabels,
                datasets: [
                    {
                        label: 'With Documents',
                        data: withPdfData,
                        backgroundColor: 'rgba(34, 197, 94, 0.8)',
                        borderColor: 'rgba(34, 197, 94, 1)',
                        borderWidth: 2
                    },
                    {
                        label: 'Pending',
                        data: withoutPdfData,
                        backgroundColor: 'rgba(251, 146, 60, 0.8)',
                        borderColor: 'rgba(251, 146, 60, 1)',
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y || 0;
                                return `${label}: ${value} students`;
                            }
                        }
                    }
                },
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const gradeIndex = elements[0].index;
                        const gradeName = gradeLabels[gradeIndex];
                        filterByGrade(gradeName);
                        closeAnalyticsModal();
                    }
                }
            }
        });
    }
    
    // Gender Distribution Chart
    const genderCtx = document.getElementById('genderChart');
    if (genderCtx && window.Chart) {
        const gradeLabels = analytics.gradeBreakdown.map(g => g.name);
        const maleData = analytics.gradeBreakdown.map(g => g.male || 0);
        const femaleData = analytics.gradeBreakdown.map(g => g.female || 0);
        
        new Chart(genderCtx, {
            type: 'bar',
            data: {
                labels: gradeLabels,
                datasets: [
                    {
                        label: 'Male',
                        data: maleData,
                        backgroundColor: 'rgba(59, 130, 246, 0.8)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 2
                    },
                    {
                        label: 'Female',
                        data: femaleData,
                        backgroundColor: 'rgba(236, 72, 153, 0.8)',
                        borderColor: 'rgba(236, 72, 153, 1)',
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: false
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        }
                    }
                }
            }
        });
    }
}

function initializeTrendCharts(analytics) {
    // Trend Line Chart
    const trendCtx = document.getElementById('trendLineChart');
    if (trendCtx && window.Chart) {
        const gradeLabels = analytics.gradeBreakdown.map(g => g.name);
        const completionData = analytics.gradeBreakdown.map(g => parseFloat(g.withPdfPercent));
        
        new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: gradeLabels,
                datasets: [{
                    label: 'Completion Rate (%)',
                    data: completionData,
                    borderColor: 'rgba(99, 102, 241, 1)',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: 'rgba(99, 102, 241, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.parsed.y}% completion`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Gender Comparison Chart
    const genderCompCtx = document.getElementById('genderComparisonChart');
    if (genderCompCtx && window.Chart) {
        const gradeLabels = analytics.gradeBreakdown.map(g => g.name);
        const maleData = analytics.gradeBreakdown.map(g => g.male || 0);
        const femaleData = analytics.gradeBreakdown.map(g => g.female || 0);
        
        new Chart(genderCompCtx, {
            type: 'line',
            data: {
                labels: gradeLabels,
                datasets: [
                    {
                        label: 'Male Students',
                        data: maleData,
                        borderColor: 'rgba(59, 130, 246, 1)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Female Students',
                        data: femaleData,
                        borderColor: 'rgba(236, 72, 153, 1)',
                        backgroundColor: 'rgba(236, 72, 153, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
    }
}

function initializeRadarChart(analytics) {
    const radarCtx = document.getElementById('radarComparisonChart');
    if (radarCtx && window.Chart) {
        const grade1Select = document.getElementById('compare-grade-1');
        const grade2Select = document.getElementById('compare-grade-2');
        
        const grade1Name = grade1Select ? grade1Select.value : analytics.gradeBreakdown[0]?.name;
        const grade2Name = grade2Select ? grade2Select.value : analytics.gradeBreakdown[1]?.name;
        
        const grade1 = analytics.gradeBreakdown.find(g => g.name === grade1Name);
        const grade2 = analytics.gradeBreakdown.find(g => g.name === grade2Name);
        
        if (!grade1 || !grade2) return;
        
        new Chart(radarCtx, {
            type: 'radar',
            data: {
                labels: ['Completion Rate', 'Total Students', 'Male %', 'Female %', 'With Documents'],
                datasets: [
                    {
                        label: grade1.name,
                        data: [
                            parseFloat(grade1.withPdfPercent),
                            (grade1.total / analytics.overview.totalStudents) * 100,
                            grade1.total > 0 ? ((grade1.male || 0) / grade1.total * 100) : 0,
                            grade1.total > 0 ? ((grade1.female || 0) / grade1.total * 100) : 0,
                            grade1.total > 0 ? (grade1.withPdf / grade1.total * 100) : 0
                        ],
                        borderColor: 'rgba(59, 130, 246, 1)',
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        borderWidth: 2
                    },
                    {
                        label: grade2.name,
                        data: [
                            parseFloat(grade2.withPdfPercent),
                            (grade2.total / analytics.overview.totalStudents) * 100,
                            grade2.total > 0 ? ((grade2.male || 0) / grade2.total * 100) : 0,
                            grade2.total > 0 ? ((grade2.female || 0) / grade2.total * 100) : 0,
                            grade2.total > 0 ? (grade2.withPdf / grade2.total * 100) : 0
                        ],
                        borderColor: 'rgba(236, 72, 153, 1)',
                        backgroundColor: 'rgba(236, 72, 153, 0.2)',
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
    }
}

// =============================================================================
// COMPARISON FUNCTIONS
// =============================================================================

function updateComparison() {
    const analytics = generateAdvancedAnalytics();
    const grade1Select = document.getElementById('compare-grade-1');
    const grade2Select = document.getElementById('compare-grade-2');
    const resultDiv = document.getElementById('comparison-result');
    
    if (!grade1Select || !grade2Select || !resultDiv) return;
    
    const grade1Name = grade1Select.value;
    const grade2Name = grade2Select.value;
    
    const grade1 = analytics.gradeBreakdown.find(g => g.name === grade1Name);
    const grade2 = analytics.gradeBreakdown.find(g => g.name === grade2Name);
    
    if (!grade1 || !grade2) return;
    
    resultDiv.innerHTML = `
        <!-- Grade 1 Card -->
        <div class="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-blue-300 dark:border-blue-700">
            <h4 class="text-2xl font-bold text-blue-600 mb-4">${grade1.name}</h4>
            <div class="space-y-3">
                <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Total Students:</span>
                    <span class="font-bold text-gray-800 dark:text-white">${grade1.total}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Completion Rate:</span>
                    <span class="font-bold text-green-600">${grade1.withPdfPercent}%</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">With Documents:</span>
                    <span class="font-bold text-green-600">${grade1.withPdf}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Pending:</span>
                    <span class="font-bold text-orange-600">${grade1.withoutPdf}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Male Students:</span>
                    <span class="font-bold text-blue-600">${grade1.male || 0}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Female Students:</span>
                    <span class="font-bold text-pink-600">${grade1.female || 0}</span>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mt-4">
                    <div class="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full" style="width: ${grade1.withPdfPercent}%"></div>
                </div>
            </div>
        </div>
        
        <!-- Grade 2 Card -->
        <div class="p-6 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-xl border-2 border-pink-300 dark:border-pink-700">
            <h4 class="text-2xl font-bold text-pink-600 mb-4">${grade2.name}</h4>
            <div class="space-y-3">
                <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Total Students:</span>
                    <span class="font-bold text-gray-800 dark:text-white">${grade2.total}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Completion Rate:</span>
                    <span class="font-bold text-green-600">${grade2.withPdfPercent}%</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">With Documents:</span>
                    <span class="font-bold text-green-600">${grade2.withPdf}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Pending:</span>
                    <span class="font-bold text-orange-600">${grade2.withoutPdf}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Male Students:</span>
                    <span class="font-bold text-blue-600">${grade2.male || 0}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Female Students:</span>
                    <span class="font-bold text-pink-600">${grade2.female || 0}</span>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mt-4">
                    <div class="bg-gradient-to-r from-pink-500 to-purple-500 h-3 rounded-full" style="width: ${grade2.withPdfPercent}%"></div>
                </div>
            </div>
        </div>
        
        <!-- Comparison Summary -->
        <div class="col-span-full p-6 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 rounded-xl border border-gray-300 dark:border-gray-700 mt-4">
            <h4 class="text-xl font-bold text-gray-800 dark:text-white mb-4">Comparison Summary</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="text-center p-4 bg-white dark:bg-gray-900 rounded-lg">
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Better Completion</p>
                    <p class="text-2xl font-bold ${parseFloat(grade1.withPdfPercent) > parseFloat(grade2.withPdfPercent) ? 'text-blue-600' : 'text-pink-600'}">
                        ${parseFloat(grade1.withPdfPercent) > parseFloat(grade2.withPdfPercent) ? grade1.name : grade2.name}
                    </p>
                    <p class="text-xs text-gray-500">by ${Math.abs(parseFloat(grade1.withPdfPercent) - parseFloat(grade2.withPdfPercent)).toFixed(1)}%</p>
                </div>
                <div class="text-center p-4 bg-white dark:bg-gray-900 rounded-lg">
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Larger Grade</p>
                    <p class="text-2xl font-bold ${grade1.total > grade2.total ? 'text-blue-600' : 'text-pink-600'}">
                        ${grade1.total > grade2.total ? grade1.name : grade2.name}
                    </p>
                    <p class="text-xs text-gray-500">by ${Math.abs(grade1.total - grade2.total)} students</p>
                </div>
                <div class="text-center p-4 bg-white dark:bg-gray-900 rounded-lg">
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">More Balanced Gender</p>
                    <p class="text-2xl font-bold ${Math.abs((grade1.male || 0) - (grade1.female || 0)) < Math.abs((grade2.male || 0) - (grade2.female || 0)) ? 'text-blue-600' : 'text-pink-600'}">
                        ${Math.abs((grade1.male || 0) - (grade1.female || 0)) < Math.abs((grade2.male || 0) - (grade2.female || 0)) ? grade1.name : grade2.name}
                    </p>
                    <p class="text-xs text-gray-500">More equal distribution</p>
                </div>
            </div>
        </div>
    `;
    
    // Update radar chart
    initializeRadarChart(analytics);
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function calculateGenderRatio(analytics) {
    const totalMale = analytics.gradeBreakdown.reduce((sum, g) => sum + (g.male || 0), 0);
    const totalFemale = analytics.gradeBreakdown.reduce((sum, g) => sum + (g.female || 0), 0);
    
    if (totalFemale === 0) return `${totalMale}:0`;
    
    const ratio = (totalMale / totalFemale).toFixed(2);
    return `${ratio}:1`;
}

function countBalancedGrades(analytics) {
    return analytics.gradeBreakdown.filter(g => {
        const male = g.male || 0;
        const female = g.female || 0;
        const diff = Math.abs(male - female);
        const total = male + female;
        return total > 0 && (diff / total) < 0.2; // Within 20% difference
    }).length;
}

function calculateAverageCompletion(analytics) {
    const totalCompletion = analytics.gradeBreakdown.reduce((sum, g) => sum + parseFloat(g.withPdfPercent), 0);
    return (totalCompletion / analytics.gradeBreakdown.length).toFixed(1);
}

function getHighestGrade(analytics) {
    return analytics.gradeBreakdown.reduce((highest, current) => {
        return parseFloat(current.withPdfPercent) > parseFloat(highest.withPdfPercent) ? current : highest;
    }, analytics.gradeBreakdown[0]);
}

function getLowestGrade(analytics) {
    return analytics.gradeBreakdown.reduce((lowest, current) => {
        return parseFloat(current.withPdfPercent) < parseFloat(lowest.withPdfPercent) ? current : lowest;
    }, analytics.gradeBreakdown[0]);
}

// =============================================================================
// NEW EXPORT FUNCTIONS
// =============================================================================

function exportAnalyticsToPDF() {
    showToast('Generating PDF analytics report...', 'info');
    // Call existing PDF export with analytics data
    if (typeof exportToPdfEnhanced === 'function') {
        exportToPdfEnhanced();
    }
    closeAnalyticsModal();
}

function exportAnalyticsToExcel() {
    showToast('Generating Excel analytics report...', 'info');
    // Call existing Excel export with analytics data
    if (typeof exportToExcelEnhanced === 'function') {
        exportToExcelEnhanced();
    }
    closeAnalyticsModal();
}

function generateEmailList() {
    const pendingStudents = allStudents.filter(s => s.hasPdf === false);
    
    if (pendingStudents.length === 0) {
        showToast('No pending students to email!', 'info');
        return;
    }
    
    const emailList = pendingStudents.map(s => `${s.name} (${s.grade})`).join('\n');
    
    const blob = new Blob([emailList], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pending_students_email_list_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast(`Email list generated for ${pendingStudents.length} students!`, 'success');
}

function exportSummaryReport() {
    const analytics = generateAdvancedAnalytics();
    
    const summary = `
KANYADET PRI & JUNIOR SCHOOL
STUDENT DOCUMENT SUMMARY REPORT
Generated: ${new Date().toLocaleString()}
=====================================

OVERVIEW:
---------
Total Students: ${analytics.overview.totalStudents}
Completion Rate: ${analytics.overview.completionRate}%
With Documents: ${analytics.overview.withDocuments}
Pending Documents: ${analytics.overview.pending}

GRADE BREAKDOWN:
----------------
${analytics.gradeBreakdown.map(g => `
${g.name}:
  Total: ${g.total} students
  Completed: ${g.withPdf} (${g.withPdfPercent}%)
  Pending: ${g.withoutPdf} (${g.withoutPdfPercent}%)
  Male: ${g.male || 0}
  Female: ${g.female || 0}
`).join('\n')}

KEY INSIGHTS:
-------------
${analytics.insights.map((insight, i) => `${i + 1}. ${insight.title}\n   ${insight.message}`).join('\n\n')}

=====================================
End of Report
    `;
    
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `summary_report_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Summary report exported successfully!', 'success');
}

function printAnalyticsReport() {
    window.print();
    showToast('Opening print dialog...', 'info');
}

function exportCustomReport() {
    const includeOverview = document.getElementById('export-overview')?.checked;
    const includeGrades = document.getElementById('export-grades')?.checked;
    const includeCharts = document.getElementById('export-charts')?.checked;
    const includeInsights = document.getElementById('export-insights')?.checked;
    
    showToast('Custom report generation started...', 'info');
    
    // Generate custom report based on selections
    const analytics = generateAdvancedAnalytics();
    const customReport = {
        generatedDate: new Date().toISOString(),
        schoolName: 'KANYADET PRI & JUNIOR SCHOOL',
        includesSections: {
            overview: includeOverview,
            grades: includeGrades,
            charts: includeCharts,
            insights: includeInsights
        }
    };
    
    if (includeOverview) customReport.overview = analytics.overview;
    if (includeGrades) customReport.gradeBreakdown = analytics.gradeBreakdown;
    if (includeInsights) customReport.insights = analytics.insights;
    
    const jsonContent = JSON.stringify(customReport, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `custom_analytics_report_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Custom report exported successfully!', 'success');
}

function showStudentList(type) {
    closeAnalyticsModal();
    showToast('Showing all students...', 'info');
    document.getElementById('show-all')?.click();
}

function showCompletionTrend() {
    switchAnalyticsTab('trends');
}

// =============================================================================
// EXISTING FUNCTIONS (UPDATED)
// =============================================================================

function generateAdvancedAnalytics() {
    const totalStudents = allStudents.length;
    const checkedStudents = allStudents.filter(s => s.hasPdf !== undefined);
    const withDocuments = allStudents.filter(s => s.hasPdf === true).length;
    const pending = allStudents.filter(s => s.hasPdf === false).length;
    const completionRate = checkedStudents.length > 0 
        ? ((withDocuments / checkedStudents.length) * 100).toFixed(1) 
        : '0.0';
    
    // Grade breakdown
    const gradeData = {};
    allStudents.forEach(s => {
        const grade = s.grade || 'N/A';
        if (!gradeData[grade]) {
            gradeData[grade] = { total: 0, withPdf: 0, withoutPdf: 0, male: 0, female: 0 };
        }
        gradeData[grade].total++;
        if (s.hasPdf === true) gradeData[grade].withPdf++;
        if (s.hasPdf === false) gradeData[grade].withoutPdf++;
        
        const gender = (s.gender || '').toLowerCase().trim();
        if (gender === 'male') {
            gradeData[grade].male++;
        } else if (gender === 'female') {
            gradeData[grade].female++;
        }
    });
    
    const gradeBreakdown = Object.entries(gradeData).map(([name, data]) => ({
        name,
        total: data.total,
        withPdf: data.withPdf,
        withoutPdf: data.withoutPdf,
        male: data.male,
        female: data.female,
        withPdfPercent: data.total > 0 ? ((data.withPdf / data.total) * 100).toFixed(1) : '0.0',
        withoutPdfPercent: data.total > 0 ? ((data.withoutPdf / data.total) * 100).toFixed(1) : '0.0'
    })).sort((a, b) => a.name.localeCompare(b.name));
    
    // Generate insights
    const insights = [];
    
    if (parseFloat(completionRate) === 100) {
        insights.push({
            type: 'success',
            title: 'Excellent! 100% Completion',
            message: 'All checked students have their birth certificates on file. Great work!'
        });
    } else if (parseFloat(completionRate) >= 80) {
        insights.push({
            type: 'success',
            title: 'Good Progress',
            message: `${completionRate}% of students have documents. You're doing great!`
        });
    } else if (parseFloat(completionRate) >= 50) {
        insights.push({
            type: 'warning',
            title: 'Moderate Completion',
            message: `${completionRate}% completion rate. Consider following up on missing documents.`
        });
    } else {
        insights.push({
            type: 'error',
            title: 'Action Required',
            message: `Only ${completionRate}% completion. Urgent attention needed for missing documents.`
        });
    }
    
    if (pending > 0) {
        insights.push({
            type: 'info',
            title: `${pending} Documents Pending`,
            message: `There are ${pending} students without birth certificates. Consider sending reminders to parents.`
        });
    }
    
    // Find grade with lowest completion
    const lowestGrade = gradeBreakdown.reduce((lowest, current) => {
        const currentRate = parseFloat(current.withPdfPercent);
        const lowestRate = parseFloat(lowest.withPdfPercent);
        return currentRate < lowestRate ? current : lowest;
    }, gradeBreakdown[0]);
    
    if (lowestGrade && parseFloat(lowestGrade.withPdfPercent)< 70) {
        insights.push({
            type: 'warning',
            title: `${lowestGrade.name} Needs Attention`,
            message: `${lowestGrade.name} has only ${lowestGrade.withPdfPercent}% completion rate (${lowestGrade.withPdf}/${lowestGrade.total} students).`
        });
    }
    
    // Check gender balance
    const genderImbalance = gradeBreakdown.filter(g => {
        const male = g.male || 0;
        const female = g.female || 0;
        const total = male + female;
        if (total === 0) return false;
        const diff = Math.abs(male - female);
        return (diff / total) > 0.3; // More than 30% difference
    });
    
    if (genderImbalance.length > 0) {
        insights.push({
            type: 'info',
            title: 'Gender Distribution Notice',
            message: `${genderImbalance.length} grade(s) have significant gender imbalance. Consider reviewing enrollment patterns.`
        });
    }
    
    return {
        overview: {
            totalStudents,
            completionRate,
            withDocuments,
            pending
        },
        gradeBreakdown,
        insights,
        performance: {
            checkedCount: checkedStudents.length,
            checkedPercentage: totalStudents > 0 ? ((checkedStudents.length / totalStudents) * 100).toFixed(1) : '0.0',
            cacheSize: typeof pdfExistenceCache !== 'undefined' ? pdfExistenceCache.size : 0,
            activeFilters: (typeof currentFilter !== 'undefined' && currentFilter !== 'all') || 
                          (typeof currentGrade !== 'undefined' && currentGrade !== 'all') || 
                          (typeof currentSearchTerm !== 'undefined' && currentSearchTerm) ? 
                [currentFilter !== 'all' ? 1 : 0, currentGrade !== 'all' ? 1 : 0, currentSearchTerm ? 1 : 0].reduce((a, b) => a + b, 0) : 0
        }
    };
}

function closeAnalyticsModal() {
    const analyticsBackdrop = document.getElementById('analytics-modal-backdrop');
    if (analyticsBackdrop) {
        analyticsBackdrop.classList.add('hidden');
        analyticsBackdrop.classList.remove('flex');
    }
}

// Quick Action Functions
function filterByStatus(status) {
    closeAnalyticsModal();
    if (status === 'pending') {
        document.getElementById('show-without-pdf')?.click();
        if (typeof currentFilter !== 'undefined') currentFilter = 'without-pdf';
        if (typeof applyFiltersAndRender === 'function') applyFiltersAndRender();
        showToast('Showing students without Birth certificates', 'info');
    } else if (status === 'completed') {
        document.getElementById('show-with-pdf')?.click();
        if (typeof currentFilter !== 'undefined') currentFilter = 'with-pdf';
        if (typeof applyFiltersAndRender === 'function') applyFiltersAndRender();
        showToast('Showing students with Birth certificates', 'success');
    }
}

function filterByGrade(gradeName) {
    closeAnalyticsModal();
    
    const gradeSelect = document.getElementById('grade-filter');
    if (gradeSelect) {
        gradeSelect.value = gradeName;
        gradeSelect.dispatchEvent(new Event('change'));
    }
    
    if (typeof window.currentGrade !== 'undefined') {
        window.currentGrade = gradeName;
    }
    
    if (typeof applyFiltersAndRender === 'function') {
        applyFiltersAndRender();
    }
    
    showToast(`Showing ${gradeName} students`, 'info');
    
    // Scroll to top of table
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showTopGrade() {
    const analytics = generateAdvancedAnalytics();
    const topGrade = analytics.gradeBreakdown.reduce((top, current) => {
        const currentRate = parseFloat(current.withPdfPercent);
        const topRate = parseFloat(top.withPdfPercent);
        return currentRate > topRate ? current : top;
    }, analytics.gradeBreakdown[0]);
    
    if (topGrade) {
        closeAnalyticsModal();
        showToast(`🏆 Top Grade: ${topGrade.name} with ${topGrade.withPdfPercent}% completion!`, 'success');
        setTimeout(() => {
            filterByGrade(topGrade.name);
        }, 1000);
    }
}

function showCheckedStudents() {
    closeAnalyticsModal();
    const checkedStudents = allStudents.filter(s => s.hasPdf !== undefined);
    showToast(`✓ Total checked: ${checkedStudents.length} students`, 'info');
}

function exportAnalyticsReport() {
    const analytics = generateAdvancedAnalytics();
    
    const report = {
        generatedDate: new Date().toISOString(),
        schoolName: 'KANYADET PRI & JUNIOR SCHOOL',
        overview: analytics.overview,
        gradeBreakdown: analytics.gradeBreakdown,
        insights: analytics.insights,
        performance: analytics.performance,
        statistics: {
            averageCompletion: calculateAverageCompletion(analytics),
            highestGrade: getHighestGrade(analytics),
            lowestGrade: getLowestGrade(analytics),
            genderRatio: calculateGenderRatio(analytics),
            balancedGrades: countBalancedGrades(analytics)
        }
    };
    
    const jsonContent = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_report_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('✓ Analytics report exported successfully!', 'success');
}

// Close modal when clicking outside or on close button
document.addEventListener('DOMContentLoaded', function() {
    const analyticsCloseBtn = document.getElementById('analytics-modal-close-btn');
    const analyticsBackdrop = document.getElementById('analytics-modal-backdrop');
    
    if (analyticsCloseBtn) {
        analyticsCloseBtn.addEventListener('click', closeAnalyticsModal);
    }
    
    if (analyticsBackdrop) {
        analyticsBackdrop.addEventListener('click', function(e) {
            if (e.target === analyticsBackdrop) {
                closeAnalyticsModal();
            }
        });
    }
    
    // Add keyboard shortcut to close modal (Escape key)
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && analyticsBackdrop && !analyticsBackdrop.classList.contains('hidden')) {
            closeAnalyticsModal();
        }
    });
});


// =============================================================================
// SEARCH INPUT AUTO-CLEAR ON FOCUS - SIMPLE VERSION
// =============================================================================

document.addEventListener('DOMContentLoaded', function() {
    // Get search input elements
    const searchInput1 = document.getElementById('live-filter');
    const searchInput2 = document.getElementById('live-filter2');
    
    // Function to handle auto-clear on focus
    function setupAutoClear(inputElement) {
        if (!inputElement) return;
        
        inputElement.addEventListener('focus', function() {
            // Just clear it if it has content - that's it!
            if (this.value) {
                this.value = '';
                this.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
        
        // Handle input changes
        inputElement.addEventListener('input', function() {
            currentSearchTerm = this.value;
            applyFiltersAndRender();
        });
    }
    
    // Apply auto-clear to both search inputs
    setupAutoClear(searchInput1);
    setupAutoClear(searchInput2);
});

// Optional: Add ESC key to clear active input
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const activeElement = document.activeElement;
        if (activeElement && 
            activeElement.tagName === 'INPUT' && 
            (activeElement.type === 'text' || activeElement.type === 'search')) {
            activeElement.value = '';
            activeElement.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }
});

// =============================================================================
// EXPORT ALL FUNCTIONS TO WINDOW
// =============================================================================

window.showAdvancedAnalytics = showAdvancedAnalytics;
window.closeAnalyticsModal = closeAnalyticsModal;
window.exportAnalyticsReport = exportAnalyticsReport;
window.filterByStatus = filterByStatus;
window.filterByGrade = filterByGrade;
window.showTopGrade = showTopGrade;
window.showCheckedStudents = showCheckedStudents;
window.initializeAnalyticsCharts = initializeAnalyticsCharts;
window.switchAnalyticsTab = switchAnalyticsTab;
window.updateComparison = updateComparison;
window.generateEmailList = generateEmailList;
window.exportAnalyticsToPDF = exportAnalyticsToPDF;
window.exportAnalyticsToExcel = exportAnalyticsToExcel;
window.exportSummaryReport = exportSummaryReport;
window.printAnalyticsReport = printAnalyticsReport;
window.exportCustomReport = exportCustomReport;
window.showStudentList = showStudentList;
window.showCompletionTrend = showCompletionTrend;
window.initializeTrendCharts = initializeTrendCharts;
window.initializeRadarChart = initializeRadarChart;
window.calculateGenderRatio = calculateGenderRatio;
window.countBalancedGrades = countBalancedGrades;
window.calculateAverageCompletion = calculateAverageCompletion;
window.getHighestGrade = getHighestGrade;
window.getLowestGrade = getLowestGrade;









function resetAllFilters() {
    // Reset all filter dropdowns
    const gradeSelect = document.getElementById('grade-filter');
    const upiSelect = document.getElementById('upi-filter');
    const searchInput = document.getElementById('live-filter');
    const searchInput2 = document.getElementById('live-filter2');
    
    if (gradeSelect) gradeSelect.value = 'all';
    if (upiSelect) upiSelect.value = 'all'; // ✅ RESET UPI FILTER
    if (searchInput) searchInput.value = '';
    if (searchInput2) searchInput2.value = '';
    
    // Reset global variables
    currentFilter = 'all';
    currentGrade = 'all';
    currentUpiFilter = 'all'; // ✅ RESET UPI FILTER
    currentSearchTerm = '';
    
    // Reset active filter button
    document.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.remove('active', 'bg-gradient-to-r', 'from-indigo-500', 'to-purple-600', 'text-white');
        b.classList.add('bg-gray-200', 'text-gray-700');
    });
    
    document.getElementById('show-all')?.classList.add('active', 'bg-gradient-to-r', 'from-indigo-500', 'to-purple-600', 'text-white');
    
    applyFiltersAndRender();
    showToast('All filters cleared', 'success');
}

window.resetAllFilters = resetAllFilters;









// =============================================================================
// STATISTICS FUNCTIONS
// =============================================================================

function createProgressNote() {
    const note = document.createElement('p');
    note.id = 'progress-note';
    note.className = 'text-sm text-gray-500 mt-2 animate-pulse';
    const totalCountEl = getElement('total-count');
    if (totalCountEl && totalCountEl.parentElement) {
        totalCountEl.parentElement.appendChild(note);
    }
    return note;
}

function updateGradeStatistics(checkedStudents) {
    const gradeStatsContainer = document.getElementById('grade-stats-container');
    if (!gradeStatsContainer) return;
    
    const gradeStats = {};
    
    // ✅ FIX: Add gender counting
    checkedStudents.forEach(student => {
        const grade = student.grade || 'N/A';
        if (!gradeStats[grade]) {
            gradeStats[grade] = {
                total: 0,
                withPdf: 0,
                withoutPdf: 0,
                male: 0,      // ✅ ADD THIS
                female: 0     // ✅ ADD THIS
            };
        }
        gradeStats[grade].total++;
        if (student.hasPdf) {
            gradeStats[grade].withPdf++;
        } else {
            gradeStats[grade].withoutPdf++;
        }
        
        // ✅ ADD GENDER COUNTING
        const gender = (student.gender || '').toLowerCase().trim();
        if (gender === 'male') {
            gradeStats[grade].male++;
        } else if (gender === 'female') {
            gradeStats[grade].female++;
        }
    });

    // Sort grades numerically
    const sortedGrades = Object.keys(gradeStats).sort((a, b) => {
        if (a === 'N/A') return 1;
        if (b === 'N/A') return -1;
        const numA = parseInt(a.replace('Grade ', ''));
        const numB = parseInt(b.replace('Grade ', ''));
        return numA - numB;
    });

    // ✅ FIX: Initialize chart FIRST (before clearing container)
    if (window.Chart && document.getElementById('gradeStatsChart')) {
        initializeGradeStatsChart(gradeStats, sortedGrades, currentChartType || 'line');
    }

    // Clear existing cards
    gradeStatsContainer.innerHTML = '';

    // Render each grade's statistics cards
    sortedGrades.forEach(grade => {
        const stats = gradeStats[grade];
        const gradeTotal = stats.total;
        const withPdfPercent = gradeTotal > 0 
            ? ((stats.withPdf / gradeTotal) * 100).toFixed(2) 
            : '0.00';
        const withoutPdfPercent = gradeTotal > 0 
            ? ((stats.withoutPdf / gradeTotal) * 100).toFixed(2) 
            : '0.00';

        const gradeStatDiv = document.createElement('div');
        gradeStatDiv.className = 'neuro-card p-4 cursor-pointer hover:scale-105 transition-transform';
        gradeStatDiv.onclick = () => filterByGrade(grade);
        
        gradeStatDiv.innerHTML = `
            <div class="flex items-center justify-between mb-3">
                <h4 class="font-bold text-lg text-orange-500 dark:text-orange-500">${escapeHtml(grade)}</h4>
                <span class="text-xs font-semibold px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full">
                    ${gradeTotal} students
                </span>
                <span class="font-semibold text-blue-600">
                    <span class="inline-flex items-center gap-1">
                        <svg class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                        </svg>
                        ${stats.male || 0}M  <!-- ✅ FIXED: Use stats.male -->
                    </span>
                    <span class="mx-1">|</span>
                    <span class="inline-flex items-center gap-1">
                        <svg class="w-4 h-4 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                        </svg>
                        ${stats.female || 0}F  <!-- ✅ FIXED: Use stats.female -->
                    </span>
                </span>
            </div>
            
            <div class="space-y-2 mb-3">
                <div class="flex justify-between items-center text-sm">
                    <span class="text-gray-600 dark:text-gray-400">With PDF:</span>
                    <span class="font-bold text-green-600">${stats.withPdf} (${withPdfPercent}%)</span>
                </div>
                <div class="flex justify-between items-center text-sm">
                    <span class="text-gray-600 dark:text-gray-400">Without PDF:</span>
                    <span class="font-bold text-red-600">${stats.withoutPdf} (${withoutPdfPercent}%)</span>
                </div>
            </div>
            
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div class="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500" 
                     style="width: ${withPdfPercent}%"></div>
            </div>
            
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">Click to filter</p>
        `;
        
        gradeStatsContainer.appendChild(gradeStatDiv);
    });
}
// =============================================================================
// GRADE STATISTICS CHART FUNCTIONS
// =============================================================================

let currentGradeChart = null;
let currentChartType = 'line';

function initializeGradeStatsChart(gradeStats, sortedGrades, chartType = 'bar') {
    const canvas = document.getElementById('gradeStatsChart');
    if (!canvas || !window.Chart) return;
    
    // Destroy existing chart
    if (currentGradeChart) {
        currentGradeChart.destroy();
    }
    
    const ctx = canvas.getContext('2d');
    const labels = sortedGrades;
    
    // Prepare data
    const withPdfData = sortedGrades.map(grade => gradeStats[grade].withPdf);
    const withoutPdfData = sortedGrades.map(grade => gradeStats[grade].withoutPdf);
    const completionPercentData = sortedGrades.map(grade => {
        const total = gradeStats[grade].total;
        return total > 0 ? ((gradeStats[grade].withPdf / total) * 100).toFixed(1) : 0;
    });
    
    let config = {};
    
    switch(chartType) {
        case 'bar':
            config = {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'With Documents',
                            data: withPdfData,
                            backgroundColor: 'rgba(34, 197, 94, 0.8)',
                            borderColor: 'rgba(34, 197, 94, 1)',
                            borderWidth: 2
                        },
                        {
                            label: 'Pending',
                            data: withoutPdfData,
                            backgroundColor: 'rgba(251, 146, 60, 0.8)',
                            borderColor: 'rgba(251, 146, 60, 1)',
                            borderWidth: 2
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { stepSize: 1 }
                        }
                    },
                    plugins: {
                        legend: { position: 'top' },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.dataset.label}: ${context.parsed.y} students`;
                                }
                            }
                        }
                    },
                    onClick: (event, elements) => {
                        if (elements.length > 0) {
                            filterByGrade(labels[elements[0].index]);
                        }
                    }
                }
            };
            break;
            
        case 'line':
            config = {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'With Documents',
                            data: withPdfData,
                            borderColor: 'rgba(34, 197, 94, 1)',
                            backgroundColor: 'rgba(34, 197, 94, 0.1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 6,
                            pointHoverRadius: 8
                        },
                        {
                            label: 'Pending',
                            data: withoutPdfData,
                            borderColor: 'rgba(251, 146, 60, 1)',
                            backgroundColor: 'rgba(251, 146, 60, 0.1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 6,
                            pointHoverRadius: 8
                        },
                        {
                            label: 'Completion %',
                            data: completionPercentData,
                            borderColor: 'rgba(99, 102, 241, 1)',
                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                            borderWidth: 3,
                            fill: false,
                            tension: 0.4,
                            pointRadius: 6,
                            pointHoverRadius: 8,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            position: 'left',
                            ticks: { stepSize: 1 }
                        },
                        y1: {
                            beginAtZero: true,
                            position: 'right',
                            max: 100,
                            grid: { drawOnChartArea: false },
                            ticks: {
                                callback: function(value) {
                                    return value + '%';
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: { position: 'top' }
                    }
                }
            };
            break;
            
        case 'pie':
            // Aggregate data for pie chart
            const totalWithPdf = withPdfData.reduce((a, b) => a + b, 0);
            const totalWithoutPdf = withoutPdfData.reduce((a, b) => a + b, 0);
            
            config = {
                type: 'doughnut',
                data: {
                    labels: ['With Documents', 'Pending'],
                    datasets: [{
                        data: [totalWithPdf, totalWithoutPdf],
                        backgroundColor: [
                            'rgba(34, 197, 94, 0.8)',
                            'rgba(251, 146, 60, 0.8)'
                        ],
                        borderColor: [
                            'rgba(34, 197, 94, 1)',
                            'rgba(251, 146, 60, 1)'
                        ],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const value = context.parsed || 0;
                                    const total = totalWithPdf + totalWithoutPdf;
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return `${context.label}: ${value} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            };
            break;
            
        case 'radar':
            config = {
                type: 'radar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Completion Rate (%)',
                            data: completionPercentData,
                            borderColor: 'rgba(99, 102, 241, 1)',
                            backgroundColor: 'rgba(99, 102, 241, 0.2)',
                            borderWidth: 2,
                            pointBackgroundColor: 'rgba(99, 102, 241, 1)',
                            pointRadius: 5
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        r: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                stepSize: 20,
                                callback: function(value) {
                                    return value + '%';
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: { position: 'top' }
                    }
                }
            };
            break;
    }
    
    currentGradeChart = new Chart(ctx, config);
    currentChartType = chartType;
}

function toggleGradeChart(chartType) {
    // Update button states
    ['bar', 'line', 'pie', 'radar'].forEach(type => {
        const btn = document.getElementById(`btn-chart-${type}`);
        if (btn) {
            if (type === chartType) {
                btn.className = 'px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all';
            } else {
                btn.className = 'px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all';
            }
        }
    });
    
    // Update chart title
    const titles = {
        line: 'Grade-wise Trends (Line)',
        bar: 'Grade-wise Document Completion (Bar)',
        pie: 'Overall Completion Distribution (Pie)',
        radar: 'Grade Performance Radar'
    };
    
    const titleEl = document.getElementById('chart-title');
    if (titleEl) {
        titleEl.textContent = titles[chartType] || 'Grade Statistics';
    }
    
    // Recreate chart with new type
    const checkedStudents = allStudents.filter(s => s.hasPdf !== undefined);
    const gradeStats = {};
    
    checkedStudents.forEach(student => {
        const grade = student.grade || 'N/A';
        if (!gradeStats[grade]) {
            gradeStats[grade] = { total: 0, withPdf: 0, withoutPdf: 0 };
        }
        gradeStats[grade].total++;
        if (student.hasPdf) {
            gradeStats[grade].withPdf++;
        } else {
            gradeStats[grade].withoutPdf++;
        }
    });
    
    const sortedGrades = Object.keys(gradeStats).sort((a, b) => {
        if (a === 'N/A') return 1;
        if (b === 'N/A') return -1;
        const numA = parseInt(a.replace('Grade ', ''));
        const numB = parseInt(b.replace('Grade ', ''));
        return numA - numB;
    });
    
    initializeGradeStatsChart(gradeStats, sortedGrades, chartType);
}

// Export to window
window.toggleGradeChart = toggleGradeChart;
window.initializeGradeStatsChart = initializeGradeStatsChart;




console.log('✅ Advanced Analytics module loaded with enhanced features:');
console.log('   - 5 Tab Navigation (Overview, Grades, Trends, Comparison, Export)');
console.log('   - Interactive Charts (Pie, Bar, Line, Radar, Gender Distribution)');
console.log('   - Grade Comparison Tool');
console.log('   - Trend Analysis');
console.log('   - Multiple Export Formats (PDF, Excel, JSON, Print, Email List)');
console.log('   - Custom Report Generator');
console.log('   - Gender Distribution Analytics');
console.log('   - Statistical Summary');
console.log('   - Best/Worst Grade Identification');
console.log('   - Keyboard Shortcuts (ESC to close)');
// =============================================================================
// EXPORT GLOBAL FUNCTIONS
// =============================================================================

window.openLocalPDF = window.openLocalPDF;
window.showUploadPdfModal = showUploadPdfModal;
window.refreshData = refreshData;
window.closePDFModal = closePDFModal;

console.log('✅ Supabase Storage integration complete!');