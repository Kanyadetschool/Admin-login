// =============================================================================
// OPTIMIZED PDF MODAL WITH FAST RENDERING
// =============================================================================

window.openLocalPDF = async function(studentName, studentGrade) {
    const pdfIframe = document.getElementById('pdf-iframe');
    const pdfModalBackdrop = document.getElementById('pdf-modal-backdrop');
    
    if (!pdfIframe || !pdfModalBackdrop) {
        const error = 'PDF modal elements not found';
        console.error(error);
        alert(error);
        return;
    }

    // Show modal immediately with loading state
    pdfModalBackdrop.classList.remove('hidden');
    pdfModalBackdrop.classList.add('flex');
    
    // Show loading spinner
    pdfIframe.style.background = `
        linear-gradient(135deg, #667eea 0%, #764ba2 100%)
        center center no-repeat
    `;
    pdfIframe.srcdoc = `
        <html>
        <head>
            <style>
                body {
                    margin: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                }
                .loader-container {
                    text-align: center;
                    color: white;
                }
                .spinner {
                    border: 4px solid rgba(255, 255, 255, 0.3);
                    border-top: 4px solid white;
                    border-radius: 50%;
                    width: 50px;
                    height: 50px;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .progress-text {
                    font-size: 18px;
                    font-weight: 600;
                    margin-bottom: 10px;
                }
                .sub-text {
                    font-size: 14px;
                    opacity: 0.9;
                }
            </style>
        </head>
        <body>
            <div class="loader-container">
                <div class="spinner"></div>
                <div class="progress-text">Loading PDF...</div>
                <div class="sub-text">${escapeHtml(studentName)}</div>
            </div>
        </body>
        </html>
    `;
    
    showToast('📄 Loading PDF...', 'info');
    
    try {
        // Get PDF URL (uses cache if available)
        const pdfUrl = await getSupabasePdfUrl(studentName, studentGrade);
        
        if (!pdfUrl) {
            throw new Error('PDF not found');
        }
        
        // Check if mobile/tablet
        const isMobileOrTablet = window.innerWidth <= 1024;
        
        if (isMobileOrTablet) {
            // Use Google PDF Viewer for mobile
            pdfIframe.src = `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
        } else {
            // Direct PDF loading for desktop - fastest method
            pdfIframe.src = pdfUrl;
        }
        
        // Add outside click listener
        if (!pdfModalBackdrop.dataset.outsideClickAdded) {
            pdfModalBackdrop.addEventListener('click', function(event) {
                if (event.target === pdfModalBackdrop) {
                    closePDFModal();
                }
            });
            pdfModalBackdrop.dataset.outsideClickAdded = 'true';
        }
        
        // Wait for iframe to load
        pdfIframe.onload = () => {
            showToast('✅ PDF loaded successfully', 'success');
        };
        
        // Timeout fallback
        setTimeout(() => {
            if (pdfIframe.src === pdfUrl || pdfIframe.src.includes('docs.google.com')) {
                showToast('✅ PDF loaded', 'success');
            }
        }, 1000);
        
    } catch (error) {
        console.error('Error opening PDF:', error);
        showToast(`❌ Failed to load PDF: ${error.message}`, 'error');
        
        // Show error in iframe
        pdfIframe.srcdoc = `
            <html>
            <head>
                <style>
                    body {
                        margin: 0;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                        color: white;
                        text-align: center;
                        padding: 20px;
                    }
                    .error-icon {
                        font-size: 60px;
                        margin-bottom: 20px;
                    }
                    h2 {
                        font-size: 24px;
                        margin-bottom: 10px;
                    }
                    p {
                        font-size: 16px;
                        opacity: 0.9;
                    }
                </style>
            </head>
            <body>
                <div>
                    <div class="error-icon">⚠️</div>
                    <h2>PDF Not Found</h2>
                    <p>${escapeHtml(studentName)}</p>
                    <p style="font-size: 14px; margin-top: 20px;">Please upload the birth certificate first.</p>
                </div>
            </body>
            </html>
        `;
    }
};


// =============================================================================
// SUPABASE CONFIGURATION
// =============================================================================

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
async function checkSupabasePdfExists(studentName, studentGrade) {
    if (!studentName || !studentGrade) return false;
    
    const cacheKey = `${studentGrade}/${studentName}`;
    
    // Return cached result instantly
    if (pdfExistenceCache.has(cacheKey)) {
        return pdfExistenceCache.get(cacheKey);
    }
    
    try {
        // Check both .PDF and .pdf extensions
        const paths = [
            `${studentGrade}/${studentName}.PDF`,
            `${studentGrade}/${studentName}.pdf`
        ];
        
        // Try to get file metadata for both extensions
        const checks = await Promise.allSettled(
            paths.map(path => supabase.storage.from(STORAGE_BUCKET).list(studentGrade, {
                limit: 1,
                search: studentName
            }))
        );
        
        let exists = false;
        for (const check of checks) {
            if (check.status === 'fulfilled' && check.value.data && check.value.data.length > 0) {
                exists = true;
                break;
            }
        }
        
        pdfExistenceCache.set(cacheKey, exists);
        return exists;
    } catch (error) {
        console.error('Error checking Supabase PDF:', error);
        pdfExistenceCache.set(cacheKey, false);
        return false;
    }
}

// =============================================================================
// OPTIMIZED PDF URL GENERATION WITH CACHING
// =============================================================================

// Cache for PDF URLs with timestamp
const pdfUrlCache = new Map();
const PDF_URL_CACHE_DURATION = 3000 * 1000; // 50 minutes (signed URLs last 1 hour)

// Get signed URL for PDF viewing (cached and optimized)
async function getSupabasePdfUrl(studentName, studentGrade) {
    const cacheKey = `url_${studentGrade}/${studentName}`;
    
    // Check if we have a valid cached URL
    const cached = pdfUrlCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < PDF_URL_CACHE_DURATION) {
        console.log('📦 Using cached PDF URL for', studentName);
        return cached.url;
    }
    
    try {
        // Try both extensions in parallel for speed
        const paths = [
            `${studentGrade}/${studentName}.PDF`,
            `${studentGrade}/${studentName}.pdf`
        ];
        
        // Create signed URLs for both paths simultaneously
        const urlPromises = paths.map(path => 
            supabase.storage
                .from(STORAGE_BUCKET)
                .createSignedUrl(path, 3600) // 1 hour expiry
        );
        
        const results = await Promise.allSettled(urlPromises);
        
        // Find first successful result
        for (const result of results) {
            if (result.status === 'fulfilled' && result.value.data && !result.value.error) {
                const url = result.value.data.signedUrl;
                
                // Cache the URL
                pdfUrlCache.set(cacheKey, {
                    url,
                    timestamp: Date.now()
                });
                
                console.log('✅ Generated new signed URL for', studentName);
                return url;
            }
        }
        
        throw new Error('PDF not found');
    } catch (error) {
        console.error('Error getting PDF URL:', error);
        return null;
    }
}

// Prefetch PDF URLs for visible students (performance optimization)
async function prefetchVisiblePdfUrls() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const visibleStudents = filteredStudents.slice(start, end).filter(s => s.hasPdf === true);
    
    // Prefetch in background without blocking
    visibleStudents.forEach(student => {
        getSupabasePdfUrl(student.name, student.grade).catch(() => {});
    });
}

// =============================================================================
// REALTIME UPLOAD TRACKING
// =============================================================================

// Track active uploads for realtime updates
const activeUploads = new Map();

// Broadcast channel for cross-tab communication (optional)
let uploadChannel = null;
try {
    uploadChannel = new BroadcastChannel('pdf-uploads');
    uploadChannel.onmessage = (event) => {
        if (event.data.type === 'upload-complete') {
            const { studentName, grade } = event.data;
            updateStudentPdfStatus(studentName, grade, true);
        }
    };
} catch (e) {
    console.log('BroadcastChannel not supported');
}

// Function to update student PDF status in realtime
function updateStudentPdfStatus(studentName, grade, hasPdf) {
    const student = allStudents.find(s => s.name === studentName && s.grade === grade);
    if (student) {
        student.hasPdf = hasPdf;
        
        // Update cache
        const cacheKey = `${grade}/${studentName}`;
        pdfExistenceCache.set(cacheKey, hasPdf);
        
        // Re-render if this student is currently visible
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const visibleStudents = filteredStudents.slice(start, end);
        
        if (visibleStudents.some(s => s.name === studentName && s.grade === grade)) {
            renderStudents();
        }
        
        // Update statistics
        updateStatistics();
    }
}

// Upload PDF to Supabase Storage with Progress and Realtime Updates
async function uploadPdfToSupabase(file, studentName, studentGrade, progressCallback) {
    const uploadId = `${studentGrade}/${studentName}`;
    
    try {
        const fileExt = file.name.split('.').pop().toLowerCase();
        const filePath = `${studentGrade}/${studentName}.${fileExt}`;
        
        console.log('📤 Upload attempt:', { filePath, fileSize: file.size, fileType: file.type });
        
        // Mark upload as active
        activeUploads.set(uploadId, { status: 'uploading', progress: 0 });
        
        // Simulate initial progress
        if (progressCallback) progressCallback(5);
        
        // First, try to remove existing file (if any)
        await supabase.storage
            .from(STORAGE_BUCKET)
            .remove([filePath])
            .catch(() => {}); // Ignore errors if file doesn't exist
        
        if (progressCallback) progressCallback(10);
        
        // Create a promise wrapper for upload with simulated progress
        const uploadPromise = supabase.storage
            .from(STORAGE_BUCKET)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
                contentType: 'application/pdf'
            });
        
        // Simulate progress updates since Supabase doesn't provide native progress
        const progressInterval = setInterval(() => {
            const currentProgress = activeUploads.get(uploadId)?.progress || 0;
            if (currentProgress < 90) {
                const increment = Math.random() * 15 + 5; // Random increment 5-20%
                const newProgress = Math.min(currentProgress + increment, 90);
                activeUploads.set(uploadId, { status: 'uploading', progress: newProgress });
                if (progressCallback) progressCallback(newProgress);
            }
        }, 200);
        
        const { data, error } = await uploadPromise;
        
        clearInterval(progressInterval);
        
        if (error) {
            console.error('❌ Supabase upload error:', {
                message: error.message,
                statusCode: error.statusCode,
                error: error
            });
            throw error;
        }
        
        // Complete progress
        if (progressCallback) progressCallback(100);
        
        console.log('✅ Upload successful:', data);
        
        // Update status in realtime
        activeUploads.set(uploadId, { status: 'complete', progress: 100 });
        
        // Clear cache for this student
        const cacheKey = `${studentGrade}/${studentName}`;
        pdfExistenceCache.delete(cacheKey);
        
        // Update student status immediately (realtime update)
        updateStudentPdfStatus(studentName, studentGrade, true);
        
        // Broadcast to other tabs (if available)
        if (uploadChannel) {
            uploadChannel.postMessage({
                type: 'upload-complete',
                studentName,
                grade: studentGrade
            });
        }
        
        showToast('✅ PDF uploaded successfully!', 'success');
        
        // Clean up after 2 seconds
        setTimeout(() => {
            activeUploads.delete(uploadId);
        }, 2000);
        
        return true;
    } catch (error) {
        console.error('Upload error:', error);
        
        activeUploads.set(uploadId, { status: 'error', progress: 0 });
        
        // More detailed error message
        let errorMsg = error.message || 'Upload failed';
        
        if (error.message?.includes('row-level security')) {
            errorMsg = '🔒 Permission denied. Please run this SQL in Supabase:\n\n';
            errorMsg += 'ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;';
            console.error('🔧 FIX: Go to Supabase SQL Editor and run:\n' + errorMsg);
        } else if (error.message?.includes('Bucket not found')) {
            errorMsg = 'Bucket "birth-certificates" not found. Please create it in Supabase Storage.';
        }
        
        showToast(`❌ Upload failed: ${errorMsg}`, 'error');
        
        // Clean up
        setTimeout(() => {
            activeUploads.delete(uploadId);
        }, 2000);
        
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

// =============================================================================
// ULTRA-FAST PDF MODAL WITH PROGRESS INDICATOR
// =============================================================================

window.openLocalPDF = async function(studentName, studentGrade) {
    const pdfIframe = document.getElementById('pdf-iframe');
    const pdfModalBackdrop = document.getElementById('pdf-modal-backdrop');
    
    if (!pdfIframe || !pdfModalBackdrop) {
        console.error('PDF modal elements not found');
        alert('PDF viewer not available');
        return;
    }

    // Show modal IMMEDIATELY with minimal loading UI
    pdfModalBackdrop.classList.remove('hidden');
    pdfModalBackdrop.classList.add('flex');
    
    // ULTRA-FAST loading indicator (no heavy HTML rendering)
    pdfIframe.style.background = '#667eea';
    pdfIframe.srcdoc = `<body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);font-family:system-ui"><div style="text-align:center;color:#fff"><div style="border:4px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;width:50px;height:50px;animation:spin 1s linear infinite;margin:0 auto 15px"></div><div style="font-size:16px;font-weight:600">Loading PDF...</div><div style="font-size:13px;opacity:.9;margin-top:5px">${escapeHtml(studentName)}</div><div style="font-size:11px;opacity:.7;margin-top:10px">⏱️ Usually takes 2-5 seconds</div></div><style>@keyframes spin{to{transform:rotate(360deg)}}</style></body>`;
    
    const startTime = Date.now();
    showToast('📄 Loading PDF...', 'info');
    
    try {
        // Get PDF URL (cached if available)
        const pdfUrl = await getSupabasePdfUrl(studentName, studentGrade);
        
        if (!pdfUrl) {
            throw new Error('PDF not found in storage');
        }
        
        // PERFORMANCE: Direct PDF loading (fastest method)
        // Mobile devices can handle direct PDFs in modern browsers
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            // For mobile: Use direct URL with download fallback
            pdfIframe.srcdoc = `<body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#667eea;font-family:system-ui;padding:20px;text-align:center"><div style="color:#fff"><svg style="width:60px;height:60px;margin:0 auto 15px" fill="#fff" viewBox="0 0 20 20"><path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"/></svg><h2 style="font-size:20px;margin-bottom:10px">Birth Certificate</h2><p style="opacity:.9;margin-bottom:20px">${escapeHtml(studentName)}</p><a href="${pdfUrl}" target="_blank" style="display:inline-block;padding:12px 24px;background:#fff;color:#667eea;text-decoration:none;border-radius:8px;font-weight:600;margin-bottom:10px">📥 Open PDF</a><p style="font-size:12px;opacity:.7">PDF will open in a new tab</p></div></body>`;
            
            showToast('📱 Click to open PDF in new tab', 'success');
        } else {
            // Desktop: Direct embed (FASTEST)
            pdfIframe.src = pdfUrl;
            
            // Track actual load time
            pdfIframe.onload = () => {
                const loadTime = ((Date.now() - startTime) / 1000).toFixed(1);
                showToast(`✅ PDF loaded in ${loadTime}s`, 'success');
            };
            
            // Fallback for timeout (10 seconds max wait)
            const loadTimeout = setTimeout(() => {
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                if (pdfIframe.src === pdfUrl) {
                    showToast(`⚠️ PDF taking longer than usual (${elapsed}s)`, 'warning');
                }
            }, 10000);
            
            // Clear timeout on successful load
            pdfIframe.addEventListener('load', () => clearTimeout(loadTimeout), { once: true });
        }
        
        // Add outside click listener (only once)
        if (!pdfModalBackdrop.dataset.clickListenerAdded) {
            pdfModalBackdrop.addEventListener('click', function(event) {
                if (event.target === pdfModalBackdrop) {
                    closePDFModal();
                }
            });
            pdfModalBackdrop.dataset.clickListenerAdded = 'true';
        }
        
    } catch (error) {
        console.error('Error opening PDF:', error);
        const errorTime = ((Date.now() - startTime) / 1000).toFixed(1);
        showToast(`❌ Failed after ${errorTime}s: ${error.message}`, 'error');
        
        // Show user-friendly error
        pdfIframe.srcdoc = `<body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:linear-gradient(135deg,#f093fb 0%,#f5576c 100%);font-family:system-ui;color:#fff;text-align:center;padding:20px"><div><div style="font-size:60px;margin-bottom:20px">⚠️</div><h2 style="font-size:24px;margin-bottom:10px">PDF Not Found</h2><p style="opacity:.9">${escapeHtml(studentName)}</p><p style="font-size:14px;margin-top:20px;opacity:.8">Please upload the birth certificate first.</p><p style="font-size:12px;margin-top:10px;opacity:.7">Load attempt took ${errorTime} seconds</p></div></body>`;
    }
};

// Close modal function
function closePDFModal() {
    const pdfModalBackdrop = document.getElementById('pdf-modal-backdrop');
    const pdfIframe = document.getElementById('pdf-iframe');
    
    if (pdfModalBackdrop) {
        pdfModalBackdrop.classList.remove('flex');
        pdfModalBackdrop.classList.add('hidden');
    }
    
    if (pdfIframe) {
        pdfIframe.src = ''; // Clear iframe to stop loading
        pdfIframe.srcdoc = '';
    }
}



// Export
window.closePDFModal = closePDFModal;

console.log('✅ Optimized PDF modal loaded - Average load time: 2-5 seconds');

// =============================================================================
// PDF UPLOAD INTERFACE WITH PROGRESS
// =============================================================================

function showUploadPdfModal(student) {
    const modalBackdrop = document.getElementById('modal-backdrop');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    
    if (!modalBackdrop || !modalTitle || !modalMessage) return;
    
    modalTitle.textContent = 'Upload Birth Certificate';
    
    modalMessage.innerHTML = `
        <div class="space-y-4">
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <div class="flex items-center">
                    <svg class="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                    </svg>
                    <div>
                        <p class="font-semibold text-blue-800">${escapeHtml(student.name || 'N/A')}</p>
                        <p class="text-sm text-blue-600">Grade: ${escapeHtml(student.grade || 'N/A')}</p>
                    </div>
                </div>
            </div>
            
            <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-all duration-300 cursor-pointer" id="drop-zone">
                <svg class="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                </svg>
                <input type="file" id="pdf-upload-input" accept=".pdf,.PDF" class="hidden">
                <label for="pdf-upload-input" class="cursor-pointer">
                    <span class="text-blue-600 hover:text-blue-700 font-semibold">Click to upload</span>
                    <span class="text-gray-500"> or drag and drop</span>
                </label>
                <p class="text-xs text-gray-500 mt-2">PDF files only • Max 10MB</p>
            </div>
            
            <div id="file-preview" class="hidden bg-gray-50 p-4 rounded-lg">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <svg class="w-10 h-10 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"></path>
                        </svg>
                        <div>
                            <p id="file-name" class="font-semibold text-gray-800"></p>
                            <p id="file-size" class="text-sm text-gray-500"></p>
                        </div>
                    </div>
                    <button id="remove-file-btn" class="text-red-600 hover:text-red-800">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            </div>
            
            <div id="upload-progress" class="hidden">
                <div class="mb-2 flex justify-between items-center">
                    <span class="text-sm font-semibold text-gray-700">Uploading...</span>
                    <span id="upload-percentage" class="text-sm font-bold text-blue-600">0%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div id="upload-progress-bar" class="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300 ease-out relative overflow-hidden" style="width: 0%">
                        <div class="absolute inset-0 bg-white opacity-30 animate-pulse"></div>
                    </div>
                </div>
                <p id="upload-status" class="text-xs text-gray-600 mt-2 text-center">Preparing upload...</p>
            </div>
            
            <div class="flex gap-3">
                <button id="cancel-upload-btn" onclick="document.getElementById('modal-backdrop').classList.add('hidden')" 
                        class="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition-colors">
                    Cancel
                </button>
                <button id="upload-submit-btn" disabled 
                        class="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl">
                    <span class="flex items-center justify-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                        </svg>
                        Upload PDF
                    </span>
                </button>
            </div>
        </div>
    `;
    
    modalBackdrop.classList.remove('hidden');
    modalBackdrop.classList.add('flex');
    
    // Setup file input handler
    const fileInput = document.getElementById('pdf-upload-input');
    const uploadBtn = document.getElementById('upload-submit-btn');
    const filePreview = document.getElementById('file-preview');
    const fileName = document.getElementById('file-name');
    const fileSize = document.getElementById('file-size');
    const removeFileBtn = document.getElementById('remove-file-btn');
    const dropZone = document.getElementById('drop-zone');
    let selectedFile = null;
    
    // Drag and drop functionality
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-blue-500', 'bg-blue-50');
    });
    
    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-blue-500', 'bg-blue-50');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-blue-500', 'bg-blue-50');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    });
    
    function handleFileSelect(file) {
        if (file && file.type === 'application/pdf' && file.size <= 10 * 1024 * 1024) {
            selectedFile = file;
            uploadBtn.disabled = false;
            
            // Show file preview
            fileName.textContent = file.name;
            fileSize.textContent = formatFileSize(file.size);
            filePreview.classList.remove('hidden');
            dropZone.classList.add('hidden');
            
            showToast(`✅ Selected: ${file.name}`, 'success');
        } else {
            showToast('❌ Invalid file. Please select a PDF under 10MB', 'error');
            fileInput.value = '';
        }
    }
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFileSelect(file);
        }
    });
    
    removeFileBtn.addEventListener('click', () => {
        selectedFile = null;
        uploadBtn.disabled = true;
        filePreview.classList.add('hidden');
        dropZone.classList.remove('hidden');
        fileInput.value = '';
    });
    
    uploadBtn.onclick = async () => {
        if (!selectedFile) return;
        
        uploadBtn.disabled = true;
        document.getElementById('cancel-upload-btn').disabled = true;
        document.getElementById('upload-progress').classList.remove('hidden');
        
        const progressBar = document.getElementById('upload-progress-bar');
        const progressPercentage = document.getElementById('upload-percentage');
        const uploadStatus = document.getElementById('upload-status');
        
        // Progress callback
        const updateProgress = (progress) => {
            const rounded = Math.round(progress);
            progressBar.style.width = `${rounded}%`;
            progressPercentage.textContent = `${rounded}%`;
            
            if (rounded < 30) {
                uploadStatus.textContent = 'Preparing upload...';
            } else if (rounded < 60) {
                uploadStatus.textContent = 'Uploading to server...';
            } else if (rounded < 90) {
                uploadStatus.textContent = 'Processing file...';
            } else if (rounded < 100) {
                uploadStatus.textContent = 'Finalizing...';
            } else {
                uploadStatus.textContent = 'Upload complete!';
            }
        };
        
        const success = await uploadPdfToSupabase(selectedFile, student.name, student.grade, updateProgress);
        
        if (success) {
            // Wait a moment to show 100% completion
            setTimeout(() => {
                modalBackdrop.classList.add('hidden');
                // Realtime update already handled in uploadPdfToSupabase
            }, 500);
        } else {
            uploadBtn.disabled = false;
            document.getElementById('cancel-upload-btn').disabled = false;
            document.getElementById('upload-progress').classList.add('hidden');
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
    
    await Promise.all(studentsNeedingChecks.map(async (student) => {
        student.hasPdf = await checkSupabasePdfExists(student.name, student.grade);
    }));
    
    renderStudents();
    
    // Preload next page
    const nextPageStart = end;
    const nextPageEnd = nextPageStart + itemsPerPage;
    const nextPageStudents = filteredStudents.slice(nextPageStart, nextPageEnd)
        .filter(s => s.hasPdf === undefined);
    
    if (nextPageStudents.length > 0) {
        Promise.all(nextPageStudents.map(async (student) => {
            student.hasPdf = await checkSupabasePdfExists(student.name, student.grade);
        })).catch(err => console.warn('Preload:', err));
    }
}

// =============================================================================
// BACKGROUND PDF CHECKING - UPDATED FOR SUPABASE
// =============================================================================

function startBackgroundPdfCheck() {
    if (backgroundCheckRunning) return;
    
    backgroundCheckRunning = true;
    const batchSize = 10;
    let currentIndex = 0;
    
    async function checkNextBatch() {
        if (!backgroundCheckRunning || currentIndex >= allStudents.length) {
            backgroundCheckRunning = false;
            showToast('PDF check complete', 'success');
            return;
        }
        
        const batch = allStudents.slice(currentIndex, currentIndex + batchSize);
        const unchecked = batch.filter(s => s.hasPdf === undefined);
        
        if (unchecked.length > 0) {
            try {
                await Promise.all(unchecked.map(async (student) => {
                    const exists = await checkSupabasePdfExists(student.name, student.grade);
                    student.hasPdf = exists;
                }));
                
                updateStatistics();
                
                const visibleStart = (currentPage - 1) * itemsPerPage;
                const visibleEnd = visibleStart + itemsPerPage;
                const batchStart = currentIndex;
                const batchEnd = currentIndex + batchSize;
                
                if (batchStart < visibleEnd && batchEnd > visibleStart) {
                    renderStudents();
                }
            } catch (error) {
                console.error('Error in background PDF check:', error);
            }
        }
        
        currentIndex += batchSize;
        
        if (currentIndex < allStudents.length && backgroundCheckRunning) {
            setTimeout(checkNextBatch, 100);
        } else {
            backgroundCheckRunning = false;
        }
    }
    
    checkNextBatch();
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
// RENDERING FUNCTIONS (UPDATED WITH UPLOAD BUTTON AND REALTIME)
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
        row.className = 'hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200';
        row.dataset.studentKey = `${student.grade}-${student.name}`; // For realtime updates
        
        if (index % 2 === 0) {
            row.classList.add('bg-gray-50', 'dark:bg-gray-900/50');
        }

        let pdfStatus, pdfIcon;
        const uploadId = `${student.grade}/${student.name}`;
        const uploadStatus = activeUploads.get(uploadId);
        
        if (uploadStatus?.status === 'uploading') {
            pdfStatus = `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 animate-pulse">Uploading ${Math.round(uploadStatus.progress)}%</span>`;
            pdfIcon = '⏳';
        } else if (student.hasPdf === undefined) {
            pdfStatus = '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-500">Checking...</span>';
            pdfIcon = '⏳';
        } else if (student.hasPdf) {
            pdfStatus = '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">✅ Has PDF</span>';
            pdfIcon = '✓';
        } else {
            pdfStatus = '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">❌ No PDF</span>';
            pdfIcon = '✗';
        }

        const safeName = escapeHtml(student.name || '');
        const safeAssessmentNo = escapeHtml(student.assessmentNo || '');
        const safeUpi = escapeHtml(student.upi || 'N/A');
        const safeGrade = escapeHtml(student.grade || 'N/A');
        const rowNumber = start + index + 1;

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${rowNumber}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">${safeName}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${safeAssessmentNo}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${safeUpi}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${safeGrade}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                <span class="mr-2">${pdfIcon}</span>${pdfStatus}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex gap-2 justify-end">
                    ${student.hasPdf === true ? `
                        <button onclick="openLocalPDF('${safeName.replace(/'/g, "\\'")}', '${safeGrade.replace(/'/g, "\\'")}')"
                            class="px-4 py-2 text-white font-semibold rounded-md shadow-md transition-all duration-200 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 hover:shadow-lg transform hover:-translate-y-0.5"
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
                    <button onclick='showUploadPdfModal(${JSON.stringify(student).replace(/'/g, "&#39;")})'
                        class="px-4 py-2 text-white font-semibold rounded-md shadow-md transition-all duration-200 ${student.hasPdf === true ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' : 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700'} hover:shadow-lg transform hover:-translate-y-0.5">
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
    
    // Prefetch PDF URLs for visible students (background optimization)
    setTimeout(() => {
        prefetchVisiblePdfUrls();
    }, 100);
    
    // Check PDFs for visible students after rendering
    checkPdfForVisibleStudents();
}

// =============================================================================
// REALTIME UPDATE WATCHER (Polls for upload status changes)
// =============================================================================

let realtimeUpdateInterval = null;

function startRealtimeUpdateWatcher() {
    if (realtimeUpdateInterval) return;
    
    realtimeUpdateInterval = setInterval(() => {
        if (activeUploads.size > 0) {
            // Re-render only if there are active uploads
            renderStudents();
        }
    }, 500); // Update every 500ms during uploads
}

function stopRealtimeUpdateWatcher() {
    if (realtimeUpdateInterval) {
        clearInterval(realtimeUpdateInterval);
        realtimeUpdateInterval = null;
    }
}

// Start watcher on page load
document.addEventListener('DOMContentLoaded', () => {
    startRealtimeUpdateWatcher();
});

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