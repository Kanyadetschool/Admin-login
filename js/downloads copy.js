let downloadFiles = [];
let selectedFiles = new Set();
let currentFilter = 'all';
let currentSort = 'name-asc';
let currentView = 'list';
let searchQuery = '';
let filesLoaded = false;
let currentContextFile = null;
let listenersAttached = false;
let itemListenersDelegated = false;
let searchTimeout;

// UPDATED: Changed folder path to XHTML folder
const FOLDER_PATH = '../Term I 2026 Combined primary school/';

// DOM Elements
const downloadBtn = document.getElementById('downloadBtn');
const modalOverlaydownload = document.getElementById('modalOverlaydownload');
const closeBtn = document.getElementById('closeBtn');
const modalBody = document.getElementById('modalBody');
const searchInputdownload = document.getElementById('searchInputdownload');
const filterSelect = document.getElementById('filterSelect');
const sortSelect = document.getElementById('sortSelect');
const selectAllBtn = document.getElementById('selectAllBtn');
const downloadSelectedBtn = document.getElementById('downloadSelectedBtn');
const refreshBtn = document.getElementById('refreshBtn');
const exportBtn = document.getElementById('exportBtn');
const selectedCount = document.getElementById('selectedCount');
const selectedCountBtn = document.getElementById('selectedCountBtn');
const totalCount = document.getElementById('totalCount');
const headerTotalFiles = document.getElementById('headerTotalFiles');
const headerTotalSize = document.getElementById('headerTotalSize');
const lastUpdated = document.getElementById('lastUpdated');
const progressOverlay = document.getElementById('progressOverlay');
const progressBarFill = document.getElementById('progressBarFill');
const progressPercent = document.getElementById('progressPercent');
const progressStatus = document.getElementById('progressStatus');
const previewModal = document.getElementById('previewModal');
const previewFileName = document.getElementById('previewFileName');
const previewContent = document.getElementById('previewContent');
const closePreviewBtn = document.getElementById('closePreviewBtn');
const downloadPreviewBtn = document.getElementById('downloadPreviewBtn');
const contextMenu = document.getElementById('contextMenu');

// File type detection
function getFileType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const typeMap = {
        'xhtml': 'document', 'html': 'document', 'htm': 'document',
        'pdf': 'document', 'doc': 'document', 'docx': 'document', 'txt': 'document', 'rtf': 'document',
        'xlsx': 'document', 'xls': 'document', 'csv': 'document', 'pptx': 'document', 'ppt': 'document',
        'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'gif': 'image', 'bmp': 'image', 'svg': 'image', 'webp': 'image',
        'mp4': 'video', 'avi': 'video', 'mov': 'video', 'mkv': 'video', 'wmv': 'video', 'flv': 'video', 'webm': 'video',
        'mp3': 'audio', 'wav': 'audio', 'flac': 'audio', 'aac': 'audio', 'ogg': 'audio', 'm4a': 'audio',
        'zip': 'archive', 'rar': 'archive', '7z': 'archive', 'tar': 'archive', 'gz': 'archive', 'exe': 'archive', 'dmg': 'archive',
    };
    return typeMap[ext] || 'document';
}

function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const iconMap = {
        'xhtml': 'bxs-file-html', 'html': 'bxs-file-html', 'htm': 'bxs-file-html',
        'pdf': 'bxs-file-pdf', 'doc': 'bxs-file-doc', 'docx': 'bxs-file-doc', 'txt': 'bxs-file-txt',
        'xlsx': 'bxs-spreadsheet', 'xls': 'bxs-spreadsheet', 'csv': 'bxs-spreadsheet',
        'pptx': 'bxs-file', 'ppt': 'bxs-file',
        'jpg': 'bxs-image', 'jpeg': 'bxs-image', 'png': 'bxs-image', 'gif': 'bxs-image', 'svg': 'bxs-image',
        'mp4': 'bxs-video', 'avi': 'bxs-video', 'mov': 'bxs-video', 'mkv': 'bxs-video',
        'mp3': 'bxs-music', 'wav': 'bxs-music', 'flac': 'bxs-music',
        'zip': 'bxs-archive', 'rar': 'bxs-archive', '7z': 'bxs-archive',
        'exe': 'bxs-package', 'dmg': 'bxs-package',
    };
    return iconMap[ext] || 'bxs-file';
}

function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return 'Unknown';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function calculateTotalSize() {
    const total = downloadFiles.reduce((sum, file) => sum + (file.sizeBytes || 0), 0);
    return formatFileSize(total);
}

function showProgress(show, percent = 0, status = '') {
    progressOverlay.classList.toggle('active', show);
    if (show) {
        progressBarFill.style.width = percent + '%';
        progressPercent.textContent = Math.round(percent) + '%';
        progressStatus.textContent = status;
    }
}

// UPDATED: Load files from XHTML folder
async function autoScanFolder() {
    if (filesLoaded) return;
    
    modalBody.innerHTML = `
        <div class="scanning-state">
            <i class='bx bx-loader-alt'></i>
            <p>Loading XHTML files from folder...</p>
        </div>
    `;
    
    try {
        // UPDATED: Fetch directory listing - requires server to support directory listing
        const response = await fetch(FOLDER_PATH);
        if (!response.ok) throw new Error('Failed to load folder');
        
        const html = await response.text();
        
        // Parse HTML to extract .xhtml file links (for Apache/Nginx directory listing)
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const links = Array.from(doc.querySelectorAll('a[href$=".xhtml"], a[href$=".html"], a[href$=".htm"]'))
            .map(a => a.getAttribute('href'))
            .filter(href => !href.includes('..') && !href.includes('/'));
        
        if (links.length === 0) {
            // Fallback: Try to load a predefined list
            const detectedFiles = await loadPredefinedFiles();
            filesLoaded = true;
            downloadFiles = detectedFiles;
            headerTotalFiles.textContent = detectedFiles.length;
            headerTotalSize.textContent = calculateTotalSize();
            lastUpdated.innerHTML = `<i class='bx bx-time'></i> ${new Date().toLocaleTimeString()}`;
            return detectedFiles;
        }
        
        // Check all files in parallel
        const checkPromises = links.map(filename => checkFile(filename));
        const results = await Promise.all(checkPromises);
        const detectedFiles = results.filter(result => result !== null);

        filesLoaded = true;
        downloadFiles = detectedFiles;
        headerTotalFiles.textContent = detectedFiles.length;
        headerTotalSize.textContent = calculateTotalSize();
        lastUpdated.innerHTML = `<i class='bx bx-time'></i> ${new Date().toLocaleTimeString()}`;
        
        return detectedFiles;
    } catch (error) {
        console.error('Error scanning folder:', error);
        // Fallback to predefined files
        const detectedFiles = await loadPredefinedFiles();
        filesLoaded = true;
        downloadFiles = detectedFiles;
        headerTotalFiles.textContent = detectedFiles.length;
        headerTotalSize.textContent = calculateTotalSize();
        lastUpdated.innerHTML = `<i class='bx bx-time'></i> ${new Date().toLocaleTimeString()}`;
        return detectedFiles;
    }
}

// UPDATED: Fallback method with predefined file list
async function loadPredefinedFiles() {
    const xhtmlFiles = [
        'index.xhtml',
        'class-1.xhtml',
        'class-2.xhtml',
        'class-3.xhtml',
        'class-4.xhtml',
        'class-5.xhtml',
        'class-6.xhtml',
        'class-7.xhtml',
        'class-8.xhtml',
    ];
    
    const checkPromises = xhtmlFiles.map(filename => checkFile(filename));
    const results = await Promise.all(checkPromises);
    return results.filter(result => result !== null);
}

// UPDATED: Check file with correct folder path
async function checkFile(filename) {
    try {
        const filepath = `${FOLDER_PATH}${filename}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(filepath, { 
            method: 'HEAD',
            signal: controller.signal 
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            const size = response.headers.get('content-length');
            const lastModified = response.headers.get('last-modified');
            
            return {
                name: filename,
                size: size ? formatFileSize(parseInt(size)) : 'Unknown',
                sizeBytes: size ? parseInt(size) : 0,
                type: getFileType(filename),
                icon: getFileIcon(filename),
                date: lastModified ? new Date(lastModified).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                path: filepath
            };
        }
    } catch (e) {
        console.warn(`Failed to check file ${filename}:`, e.message);
        return null;
    }
    return null;
}

async function loadFiles(force = false) {
    if (!force && filesLoaded) {
        renderDownloads();
        return;
    }

    modalBody.innerHTML = `
        <div class="loading-state">
            <i class='bx bx-loader-alt'></i>
            <p>Preparing scan...</p>
        </div>
    `;

    try {
        downloadFiles = await autoScanFolder();
        
        if (downloadFiles.length === 0) {
            modalBody.innerHTML = `
                <div class="empty-state">
                    <i class='bx bx-folder-open'></i>
                    <p>No XHTML files found</p>
                    <small>Make sure the folder "${FOLDER_PATH}" contains XHTML files</small>
                </div>
            `;
        } else {
            headerTotalFiles.textContent = downloadFiles.length;
            headerTotalSize.textContent = calculateTotalSize();
            lastUpdated.innerHTML = `<i class='bx bx-time'></i> ${new Date().toLocaleTimeString()}`;
            renderDownloads();
        }
    } catch (error) {
        console.error('Error loading files:', error);
        modalBody.innerHTML = `
            <div class="empty-state">
                <i class='bx bx-error-circle'></i>
                <p>Failed to scan folder</p>
                <small>Make sure the folder path is correct: ${FOLDER_PATH}</small>
            </div>
        `;
    }
}

// UPDATED: Preview XHTML files
function previewFile(file) {
    previewFileName.textContent = file.name;
    previewContent.innerHTML = '';
    
    const ext = file.name.split('.').pop().toLowerCase();
    const absoluteUrl = new URL(file.path.replace('./', ''), window.location.href).href;
    
    // XHTML/HTML files
    if (['xhtml', 'html', 'htm'].includes(ext)) {
        previewContent.innerHTML = `
            <div class="preview-loading" id="previewLoading">
                <i class='bx bx-loader-alt bx-spin'></i>
                <p>Loading XHTML file...</p>
            </div>
            <iframe class="preview-iframe" 
                    id="previewIframe"
                    src="${file.path}"
                    sandbox="allow-same-origin allow-scripts"
                    style="display: none;">
            </iframe>
        `;
        
        const iframe = document.getElementById('previewIframe');
        const loading = document.getElementById('previewLoading');
        let loaded = false;
        
        iframe.onload = function() {
            if (!loaded) {
                loaded = true;
                if (loading && loading.parentNode) loading.remove();
                iframe.style.display = 'block';
            }
        };
        
        iframe.onerror = function() {
            if (!loaded) {
                loaded = true;
                previewContent.innerHTML = `
                    <div class="preview-error">
                        <i class='bx bx-error-circle'></i>
                        <p>Failed to load XHTML file</p>
                        <small>The file might be unavailable or contain errors</small>
                        <button onclick="downloadFile('${file.path}', '${file.name}')" 
                                style="margin-top: 15px; padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;">
                            Download File
                        </button>
                    </div>
                `;
            }
        };
        
        setTimeout(() => {
            if (!loaded && loading && loading.parentNode) {
                loading.innerHTML = `
                    <i class='bx bx-time'></i>
                    <p>File is taking longer than expected...</p>
                `;
            }
        }, 10000);
        
        setTimeout(() => {
            if (!loaded) {
                loaded = true;
                previewContent.innerHTML = `
                    <div class="preview-error">
                        <i class='bx bx-time-five'></i>
                        <p>Preview timeout</p>
                        <small>The file took too long to load</small>
                        <button onclick="downloadFile('${file.path}', '${file.name}')" 
                                style="margin-top: 15px; padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;">
                            Download File
                        </button>
                    </div>
                `;
            }
        }, 30000);
    } 
    // Images
    else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext)) {
        previewContent.innerHTML = `
            <div class="preview-loading" id="imageLoading">
                <i class='bx bx-loader-alt bx-spin'></i>
                <p>Loading image...</p>
            </div>
            <img class="preview-image" 
                 id="previewImage"
                 src="${file.path}" 
                 alt="${file.name}"
                 style="display: none;">
        `;
        
        const img = document.getElementById('previewImage');
        const loading = document.getElementById('imageLoading');
        
        img.onload = function() {
            if (loading && loading.parentNode) loading.remove();
            img.style.display = 'block';
        };
        
        img.onerror = function() {
            previewContent.innerHTML = `
                <div class="preview-error">
                    <i class='bx bx-image-alt'></i>
                    <p>Failed to load image</p>
                    <small>The image file might be corrupted or unavailable</small>
                </div>
            `;
        };
    } 
    // Videos
    else if (['mp4', 'webm', 'ogg', 'avi', 'mov'].includes(ext)) {
        previewContent.innerHTML = `
            <video class="preview-video" controls preload="metadata">
                <source src="${file.path}" type="video/${ext === 'mov' ? 'quicktime' : ext}">
                Your browser does not support the video tag.
            </video>
        `;
    } 
    // Audio
    else if (['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext)) {
        previewContent.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 300px;">
                <i class='bx bx-music' style="font-size: 64px; color: #667eea; margin-bottom: 20px;"></i>
                <audio class="preview-audio" controls preload="metadata">
                    <source src="${file.path}" type="audio/${ext}">
                </audio>
            </div>
        `;
    } 
    // Text files
    else if (ext === 'txt') {
        previewContent.innerHTML = `
            <div class="preview-loading">
                <i class='bx bx-loader-alt bx-spin'></i>
                <p>Loading text file...</p>
            </div>
        `;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        fetch(file.path, { signal: controller.signal })
            .then(res => {
                clearTimeout(timeoutId);
                return res.ok ? res.text() : Promise.reject('Failed to fetch');
            })
            .then(text => {
                const escapedText = text
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#039;');
                
                previewContent.innerHTML = `
                    <pre style="background: white; padding: 30px; border-radius: 12px; max-width: 900px; overflow: auto; text-align: left; color: #000; white-space: pre-wrap; word-wrap: break-word;">${escapedText}</pre>
                `;
            })
            .catch(error => {
                clearTimeout(timeoutId);
                previewContent.innerHTML = `
                    <div class="preview-error">
                        <i class='bx bx-file-blank'></i>
                        <p>Failed to load text file</p>
                        <small>${error}</small>
                    </div>
                `;
            });
    }
    
    previewModal.classList.add('active');
    downloadPreviewBtn.onclick = () => downloadFile(file.path, file.name);
}

document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentView = btn.dataset.view;
        modalBody.classList.toggle('grid-view', currentView === 'grid');
        renderDownloads();
    });
});

downloadBtn.addEventListener('click', (e) => {
    e.preventDefault();
    pageLoader.classList.add('active');
    modalOverlaydownload.classList.add('active');
    loadFiles();
    
    setTimeout(() => {
        pageLoader.classList.remove('active');
    }, 1000);
});

closeBtn.addEventListener('click', () => {
    modalOverlaydownload.classList.remove('active');
});

modalOverlaydownload.addEventListener('click', (e) => {
    if (e.target === modalOverlaydownload) {
        modalOverlaydownload.classList.remove('active');
    }
});

closePreviewBtn.addEventListener('click', () => {
    previewModal.classList.remove('active');
});

previewModal.addEventListener('click', (e) => {
    if (e.target === previewModal) {
        previewModal.classList.remove('active');
    }
});

refreshBtn.addEventListener('click', () => {
    pageLoader.classList.add('active');
    filesLoaded = false;
    selectedFiles.clear();
    loadFiles(true);
    
    setTimeout(() => {
        pageLoader.classList.remove('active');
    }, 1000);
});

exportBtn.addEventListener('click', () => {
    const data = downloadFiles.map(f => ({
        name: f.name,
        type: f.type,
        size: f.size,
        date: f.date,
        path: f.path
    }));
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'file-list.json';
    a.click();
    URL.revokeObjectURL(url);
});

function getFilteredAndSortedDownloads() {
    let filtered = downloadFiles.filter(file => {
        const matchesFilter = currentFilter === 'all' || file.type === currentFilter;
        const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    filtered.sort((a, b) => {
        switch(currentSort) {
            case 'name-asc': return a.name.localeCompare(b.name);
            case 'name-desc': return b.name.localeCompare(a.name);
            case 'size-asc': return a.sizeBytes - b.sizeBytes;
            case 'size-desc': return b.sizeBytes - a.sizeBytes;
            case 'date-asc': return new Date(a.date) - new Date(b.date);
            case 'date-desc': return new Date(b.date) - new Date(a.date);
            default: return 0;
        }
    });
    return filtered;
}

function renderDownloads() {
    const filteredFiles = getFilteredAndSortedDownloads();
    totalCount.textContent = filteredFiles.length;

    if (filteredFiles.length === 0) {
        modalBody.innerHTML = `
            <div class="empty-state">
                <i class='bx bx-search-alt'></i>
                <p>No files match your filters</p>
            </div>
        `;
        return;
    }

    modalBody.innerHTML = filteredFiles.map((file) => `
        <div class="download-item ${selectedFiles.has(file.name) ? 'selected' : ''}" 
             data-filename="${file.name}" 
             data-path="${file.path}"
             data-file='${JSON.stringify(file).replace(/'/g, "&#39;")}'>
            <input type="checkbox" class="item-checkbox" ${selectedFiles.has(file.name) ? 'checked' : ''}>
            <div class="item-icon">
                <i class='bx ${file.icon}'></i>
            </div>
            <div class="item-info">
                <div class="item-name" title="${file.name}">${file.name}</div>
                <div class="item-meta">
                    <span class="item-badge badge-${file.type}">${file.type}</span>
                    <span><i class='bx bx-hdd'></i> ${file.size}</span>
                    <span><i class='bx bx-calendar'></i> ${file.date}</span>
                </div>
            </div>
            <div class="item-actions">
                <button class="item-action-btn item-preview-btn" title="Preview">
                    <i class='bx bx-show'></i>
                </button>
                <button class="item-action-btn item-download-btn" title="Download">
                    <i class='bx bxs-download'></i>
                </button>
                <button class="item-action-btn item-info-btn" title="Info">
                    <i class='bx bx-info-circle'></i>
                </button>
            </div>
        </div>
    `).join('');

    attachItemListeners();
}

function attachItemListeners() {
    if (!itemListenersDelegated) {
        modalBody.addEventListener('mouseenter', (e) => {
            const item = e.target.closest('.download-item');
            if (item) {
                showTooltip(JSON.parse(item.dataset.file), e);
            }
        }, true);

        modalBody.addEventListener('mousemove', (e) => {
            if (tooltip.classList.contains('active')) {
                tooltip.style.left = (e.pageX + 15) + 'px';
                tooltip.style.top = (e.pageY + 15) + 'px';
            }
        });

        modalBody.addEventListener('mouseleave', (e) => {
            const item = e.target.closest('.download-item');
            if (item) {
                hideTooltip();
            }
        }, true);

        modalBody.addEventListener('contextmenu', (e) => {
            const item = e.target.closest('.download-item');
            if (item) {
                e.preventDefault();
                hideTooltip();
                currentContextFile = JSON.parse(item.dataset.file);
                contextMenu.style.left = e.pageX + 'px';
                contextMenu.style.top = e.pageY + 'px';
                contextMenu.classList.add('active');
            }
        });

        modalBody.addEventListener('click', (e) => {
            const item = e.target.closest('.download-item');
            if (!item) return;

            const checkbox = item.querySelector('.item-checkbox');
            const fileData = JSON.parse(item.dataset.file);

            if (e.target === checkbox) {
                const filename = item.dataset.filename;
                if (checkbox.checked) {
                    selectedFiles.add(filename);
                    item.classList.add('selected');
                } else {
                    selectedFiles.delete(filename);
                    item.classList.remove('selected');
                }
                updateSelectedCount();
                return;
            }

            if (e.target.closest('.item-preview-btn')) {
                e.stopPropagation();
                hideTooltip();
                previewFile(fileData);
                return;
            }

            if (e.target.closest('.item-download-btn')) {
                e.stopPropagation();
                hideTooltip();
                downloadFile(item.dataset.path, item.dataset.filename);
                return;
            }

            if (e.target.closest('.item-info-btn')) {
                e.stopPropagation();
                hideTooltip();
                alert(`File Information:\n\nName: ${fileData.name}\nType: ${fileData.type}\nSize: ${fileData.size}\nDate: ${fileData.date}\nPath: ${fileData.path}`);
                return;
            }

            if (!e.target.closest('.item-action-btn')) {
                checkbox.checked = !checkbox.checked;
                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });

        itemListenersDelegated = true;
    }
}

function initializeContextMenu() {
    if (listenersAttached) return;
    
    document.querySelectorAll('.context-menu-item').forEach(item => {
        item.addEventListener('click', () => {
            const action = item.dataset.action;
            if (currentContextFile) {
                switch(action) {
                    case 'preview':
                        previewFile(currentContextFile);
                        break;
                    case 'download':
                        downloadFile(currentContextFile.path, currentContextFile.name);
                        break;
                    case 'info':
                        alert(`File Information:\n\nName: ${currentContextFile.name}\nType: ${currentContextFile.type}\nSize: ${currentContextFile.size}\nDate: ${currentContextFile.date}\nPath: ${currentContextFile.path}`);
                        break;
                    case 'select':
                        selectedFiles.add(currentContextFile.name);
                        renderDownloads();
                        updateSelectedCount();
                        break;
                }
            }
            contextMenu.classList.remove('active');
        });
    });
    
    listenersAttached = true;
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('#contextMenu')) {
        contextMenu.classList.remove('active');
    }
});

function updateSelectedCount() {
    selectedCount.textContent = selectedFiles.size;
    selectedCountBtn.textContent = selectedFiles.size;
    downloadSelectedBtn.disabled = selectedFiles.size === 0;
    
    const allSelected = getFilteredAndSortedDownloads().every(file => selectedFiles.has(file.name));
    selectAllBtn.innerHTML = allSelected ? 
        `<i class='bx bx-checkbox-checked'></i> Deselect All` : 
        `<i class='bx bx-check-square'></i> Select All`;
}

function downloadFile(filepath, filename) {
    const a = document.createElement('a');
    a.href = filepath;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

downloadSelectedBtn.addEventListener('click', async () => {
    if (selectedFiles.size > 0) {
        for (const file of downloadFiles) {
            if (selectedFiles.has(file.name)) {
                downloadFile(file.path, file.name);
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }
    }
});

selectAllBtn.addEventListener('click', () => {
    const filteredFiles = getFilteredAndSortedDownloads();
    const allSelected = filteredFiles.every(file => selectedFiles.has(file.name));

    if (allSelected) {
        filteredFiles.forEach(file => selectedFiles.delete(file.name));
    } else {
        filteredFiles.forEach(file => selectedFiles.add(file.name));
    }

    renderDownloads();
    updateSelectedCount();
});

searchInputdownload.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        searchQuery = e.target.value;
        renderDownloads();
    }, 300);
});

initializeContextMenu();

filterSelect.addEventListener('change', (e) => {
    currentFilter = e.target.value;
    renderDownloads();
});

sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderDownloads();
});

document.addEventListener('keydown', (e) => {
    if (modalOverlaydownload.classList.contains('active') && !previewModal.classList.contains('active')) {
        if (e.key === 'Escape') {
            modalOverlaydownload.classList.remove('active');
        } else if (e.ctrlKey && e.key === 'a') {
            e.preventDefault();
            selectAllBtn.click();
        } else if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            searchInputdownload.focus();
        }
    }
    
    if (previewModal.classList.contains('active') && e.key === 'Escape') {
        previewModal.classList.remove('active');
    }
});

const tooltip = document.createElement('div');
tooltip.className = 'file-tooltip';
tooltip.id = 'fileTooltip';
document.body.appendChild(tooltip);

function showTooltip(file, event) {
    tooltip.innerHTML = `
        <div class="file-tooltip-row">
            <span class="file-tooltip-label">Name:</span>
            <span class="file-tooltip-value">${file.name}</span>
        </div>
        <div class="file-tooltip-row">
            <span class="file-tooltip-label">Type:</span>
            <span class="file-tooltip-value">${file.type}</span>
        </div>
        <div class="file-tooltip-row">
            <span class="file-tooltip-label">Size:</span>
            <span class="file-tooltip-value">${file.size}</span>
        </div>
        <div class="file-tooltip-row">
            <span class="file-tooltip-label">Date:</span>
            <span class="file-tooltip-value">${file.date}</span>
        </div>
        <div class="file-tooltip-row">
            <span class="file-tooltip-label">Path:</span>
            <span class="file-tooltip-value">${file.path}</span>
        </div>
    `;
    
    tooltip.style.left = (event.pageX + 15) + 'px';
    tooltip.style.top = (event.pageY + 15) + 'px';
    tooltip.classList.add('active');
}

function hideTooltip() {
    tooltip.classList.remove('active');
}

const pageLoader = document.getElementById('pageLoader');
pageLoader.classList.add('active');

window.addEventListener('load', () => {
    setTimeout(() => {
        pageLoader.classList.remove('active');
    }, 500);
});