/**
 * Advanced Universal Search System with Analytics
 * Searches across page data, Firebase Realtime Database, and Firestore
 * Shows results in a beautiful, feature-rich popup with advanced analytics
 */

class UniversalSearch {
    constructor() {
        this.results = {
            page: [],
            realtime: [],
            firestore: []
        };
        this.recentSearches = this.loadRecentSearches();
        this.searchAnalytics = this.loadAnalytics();
        this.currentCategory = 'all';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.createSearchModal();
    }

    setupEventListeners() {
        const searchInput = document.getElementById('universalSearchInput');
        const searchBtn = document.getElementById('universalSearchBtn');
        const searchForm = document.getElementById('universalSearchForm');

        // Search button click - open modal and focus modal input
        searchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.openSearchModal();
        });

        // Click on search input - open modal and focus modal input
        searchInput.addEventListener('click', (e) => {
            e.preventDefault();
            this.openSearchModal();
        });

        // Keyboard shortcuts
        searchForm.addEventListener('submit', (e) => e.preventDefault());

        // Global keyboard shortcut: Ctrl+K
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.openSearchModal();
            }
            // Esc to close
            if (e.key === 'Escape') {
                this.closeSearchModal();
            }
        });

        // Close modal on outside click
        document.addEventListener('click', (e) => {
            const modal = document.getElementById('searchModal');
            if (modal && e.target === modal) {
                this.closeSearchModal();
            }
        });
    }

    createSearchModal() {
        if (document.getElementById('searchModal')) return;

        const modal = document.createElement('div');
        modal.id = 'searchModal';
        modal.className = 'search-modal';
        modal.innerHTML = `
            <div class="search-modal-content">
                <div class="search-header">
                    <input type="text" class="search-modal-input" placeholder="Search...">
                    <span class="close-search">&times;</span>
                </div>
                <div class="search-tabs-wrapper">
                    <div class="search-tabs">
                        <button class="search-tab active" data-category="all">All Results</button>
                        <button class="search-tab" data-category="page">On Page</button>
                        <button class="search-tab" data-category="realtime">Realtime DB</button>
                        <button class="search-tab" data-category="firestore">Firestore</button>
                    </div>
                </div>
                <div class="search-filters">
                    <input type="text" class="filter-input" placeholder="Filter by status, grade, class...">
                </div>
                <div class="search-results-wrapper">
                    <div class="search-results-container">
                        <div class="search-suggestions" id="searchSuggestions"></div>
                        <div class="search-results" id="searchResults"></div>
                    </div>
                    <div class="search-analytics-panel" id="analyticsPanel"></div>
                </div>
                <div class="search-footer">
                    <span class="search-count">0 results</span>
                    <small>Press <kbd>Esc</kbd> to close · <kbd>Ctrl+K</kbd> to focus · <kbd>Enter</kbd> to select</small>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Modal event listeners
        modal.querySelector('.close-search').addEventListener('click', () => this.closeSearchModal());
        
        const modalInput = modal.querySelector('.search-modal-input');
        
        modalInput.addEventListener('input', (e) => {
            this.performSearch(e.target.value.trim());
        });
        
        // Keyboard navigation in results
        modalInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const firstResult = document.querySelector('.result-card');
                if (firstResult) {
                    firstResult.click();
                }
            }
        });

        // Tab click handlers
        modal.querySelectorAll('.search-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.switchCategory(e.target.dataset.category);
            });
        });

        // Filter input
        modal.querySelector('.filter-input').addEventListener('input', (e) => {
            this.applyFilters(e.target.value.trim());
        });
    }

    async performSearch(query) {
        if (!query) {
            this.showSuggestions();
            return;
        }

        // Track analytics
        this.trackSearch(query);

        this.results = {
            page: this.searchPageData(query),
            realtime: await this.searchRealtimeDatabase(query),
            firestore: await this.searchFirestore(query)
        };

        this.displayResults(query);
        this.saveRecentSearch(query);
        this.showAnalytics();
    }

    searchPageData(query) {
        const results = [];
        const lowerQuery = query.toLowerCase();

        // Search in admission table
        const admissionRows = document.querySelectorAll('.admission-row');
        admissionRows.forEach(row => {
            const cells = row.querySelectorAll('td');
            const studentNameElement = row.querySelector('.student-name-hover');
            const studentName = studentNameElement?.textContent.toLowerCase() || '';
            const cellText = Array.from(cells).map(c => c.textContent.toLowerCase()).join(' ');
            
            if (studentName.includes(lowerQuery) || cellText.includes(lowerQuery)) {
                const statusElement = row.querySelector('.status');
                results.push({
                    type: 'student',
                    category: 'Recent Admissions',
                    name: studentNameElement?.textContent || 'N/A',
                    date: cells[1]?.textContent || 'N/A',
                    status: statusElement?.textContent || 'Pending',
                    score: this.calculateRelevance(studentName, query)
                });
            }
        });

        // Search in sidebar menu
        const sidebarItems = document.querySelectorAll('#sidebar .side-menu a');
        sidebarItems.forEach(item => {
            const textElement = item.querySelector('.text');
            const itemText = (textElement?.textContent || item.textContent).toLowerCase();
            const href = item.getAttribute('href') || '';
            
            if (itemText.includes(lowerQuery)) {
                results.push({
                    type: 'menu',
                    category: 'Menu Navigation',
                    name: textElement?.textContent || item.textContent,
                    info: href.replace(/^\.\//, '').replace(/\.html/, ''),
                    score: this.calculateRelevance(itemText, query)
                });
            }
        });

        // Search in modified students list
        const modifiedStudents = document.querySelectorAll('.modified-student');
        modifiedStudents.forEach(item => {
            const text = item.textContent.toLowerCase();
            if (text.includes(lowerQuery)) {
                results.push({
                    type: 'modified',
                    category: 'Modified Students',
                    name: item.querySelector('h4')?.textContent || 'N/A',
                    info: item.querySelector('p')?.textContent?.substring(0, 60) || '',
                    score: this.calculateRelevance(text, query)
                });
            }
        });

        // Search in activity feed
        const feedItems = document.querySelectorAll('.activity-feed-item');
        feedItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            if (text.includes(lowerQuery)) {
                results.push({
                    type: 'activity',
                    category: 'Activity Feed',
                    name: item.querySelector('.feed-student-name')?.textContent || 'N/A',
                    change: item.querySelector('.feed-change')?.textContent?.substring(0, 50) || '',
                    time: item.querySelector('.feed-time')?.textContent || 'N/A',
                    score: this.calculateRelevance(text, query)
                });
            }
        });

        return results.sort((a, b) => b.score - a.score);
    }

    async searchRealtimeDatabase(query) {
        const results = [];
        const lowerQuery = query.toLowerCase();

        try {
            const db = firebase.database();
            const snapshot = await db.ref('artifacts/default-app-id/students').once('value');
            
            if (snapshot.exists()) {
                const students = snapshot.val();
                for (let id in students) {
                    const student = students[id];
                    const studentText = JSON.stringify(student).toLowerCase();
                    
                    if (studentText.includes(lowerQuery)) {
                        const age = this.calculateAge(student['Date of Birth'] || student['DOB'] || student.dob);
                        results.push({
                            type: 'student',
                            category: 'Realtime Database',
                            name: student['Official Student Name'] || student.name || 'N/A',
                            grade: student.Grade || 'N/A',
                            class: student.Class || 'N/A',
                            status: student.Status || 'Pending',
                            email: student.Email || 'N/A',
                            phone: student.Phone || 'N/A',
                            upi: student.UPI || 'N/A',
                            assessmentNo: student['Assessment No'] || 'N/A',
                            age: age,
                            studentId: id,
                            source: 'realtime',
                            score: this.calculateRelevance(studentText, query)
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Error searching realtime database:', error);
        }

        return results.sort((a, b) => b.score - a.score).slice(0, 10);
    }

    async searchFirestore(query) {
        const results = [];
        const lowerQuery = query.toLowerCase();

        try {
            const db = firebase.firestore();
            const collections = ['students', 'users', 'records', 'admissions'];

            for (const collection of collections) {
                try {
                    const snapshot = await db.collection(collection)
                        .limit(50)
                        .get();

                    snapshot.forEach(doc => {
                        const data = doc.data();
                        const docText = JSON.stringify(data).toLowerCase();

                        if (docText.includes(lowerQuery)) {
                            const age = this.calculateAge(data['Date of Birth'] || data['DOB'] || data.dob);
                            results.push({
                                type: 'document',
                                category: `Firestore - ${collection}`,
                                name: data.name || data['Official Student Name'] || doc.id || 'Document',
                                preview: Object.entries(data)
                                    .slice(0, 2)
                                    .map(([k, v]) => `${k}: ${String(v).substring(0, 30)}`)
                                    .join(' | '),
                                age: age,
                                docId: doc.id,
                                source: 'firestore',
                                score: this.calculateRelevance(docText, query)
                            });
                        }
                    });
                } catch (e) {
                    console.warn(`Collection ${collection} not accessible`, e);
                }
            }
        } catch (error) {
            console.error('Error searching Firestore:', error);
        }

        return results.sort((a, b) => b.score - a.score).slice(0, 10);
    }

    calculateAge(dateOfBirth) {
        if (!dateOfBirth) return null;
        
        let birthDate;
        
        // Handle Excel serial date format (e.g., "41792", "43133")
        // Excel serial dates are days since January 1, 1900
        if (typeof dateOfBirth === 'string' && /^\d+$/.test(dateOfBirth)) {
            const excelSerialNumber = parseInt(dateOfBirth);
            // Standard Excel to JavaScript date conversion
            // 25569 is the Excel serial number for January 1, 1970 (Unix epoch)
            // 86400000 milliseconds in a day
            birthDate = new Date((excelSerialNumber - 25569) * 86400000);
        } else if (typeof dateOfBirth === 'number' && dateOfBirth > 0) {
            // Handle number format directly
            birthDate = new Date((dateOfBirth - 25569) * 86400000);
        } else if (dateOfBirth instanceof Date) {
            birthDate = dateOfBirth;
        } else if (typeof dateOfBirth === 'string') {
            birthDate = new Date(dateOfBirth);
        } else {
            return null;
        }
        
        if (isNaN(birthDate.getTime())) return null;
        
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        // Validate age (must be between 0 and 120)
        return age >= 0 && age <= 120 ? age : null;
    }

    calculateRelevance(text, query) {
        const lowerText = text.toLowerCase();
        const lowerQuery = query.toLowerCase();
        let score = 0;

        // Exact match
        if (lowerText === lowerQuery) score += 1000;
        
        // Starts with
        if (lowerText.startsWith(lowerQuery)) score += 100;
        
        // Contains word
        if (lowerText.includes(' ' + lowerQuery)) score += 50;
        
        // Contains substring
        if (lowerText.includes(lowerQuery)) score += 10;

        // Fuzzy matching
        let fuzzyScore = 0;
        let queryIndex = 0;
        for (let i = 0; i < lowerText.length && queryIndex < lowerQuery.length; i++) {
            if (lowerText[i] === lowerQuery[queryIndex]) {
                fuzzyScore++;
                queryIndex++;
            }
        }
        score += fuzzyScore;

        return score;
    }

    displayResults(query) {
        let resultsToShow = [];
        
        if (this.currentCategory === 'all') {
            resultsToShow = [
                ...this.results.page,
                ...this.results.realtime,
                ...this.results.firestore
            ];
        } else if (this.currentCategory === 'page') {
            resultsToShow = this.results.page;
        } else if (this.currentCategory === 'realtime') {
            resultsToShow = this.results.realtime;
        } else if (this.currentCategory === 'firestore') {
            resultsToShow = this.results.firestore;
        }

        if (resultsToShow.length === 0) {
            this.showNoResults(query);
            return;
        }

        const resultsHtml = resultsToShow.slice(0, 30).map(result => this.createResultCard(result)).join('');
        const resultsContainer = document.getElementById('searchResults');
        const suggestionsContainer = document.getElementById('searchSuggestions');
        
        resultsContainer.innerHTML = resultsHtml;
        suggestionsContainer.innerHTML = ''; // Hide suggestions when results are shown

        document.querySelector('.search-count').textContent = `${resultsToShow.length} results`;
        document.querySelector('.search-modal')?.classList.add('show');

        // Add click handlers to results
        resultsContainer.querySelectorAll('.result-card').forEach(card => {
            // Copy button handler
            const copyBtn = card.querySelector('.result-copy');
            if (copyBtn) {
                copyBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const textToCopy = card.dataset.copyText || card.textContent;
                    this.copyToClipboard(textToCopy);
                });
            }
            
            // Result card click handler
            card.addEventListener('click', (e) => {
                // Don't open modal if copy button was clicked
                if (e.target.closest('.result-copy')) return;
                e.preventDefault();
                e.stopPropagation();
                this.handleResultClick(card);
            });
        });
    }

    handleResultClick(card) {
        const resultData = card.dataset.student ? JSON.parse(card.dataset.student) : null;
        const docId = card.dataset.docId;
        const menuLink = card.dataset.menuLink;

        if (menuLink) {
            // Handle menu navigation - find the corresponding menu item
            const sidebarItems = document.querySelectorAll('#sidebar .side-menu a');
            let foundLink = null;
            sidebarItems.forEach(item => {
                const textElement = item.querySelector('.text');
                if ((textElement?.textContent || item.textContent) === menuLink) {
                    foundLink = item.getAttribute('href');
                }
            });
            if (foundLink) {
                window.location.href = foundLink;
            }
        } else if (resultData) {
            if (resultData.source === 'realtime' || resultData.studentId) {
                this.showStudentDetailsModal(resultData);
            }
        }
        
        console.log('Selected result:', resultData || docId || menuLink);
    }

    showStudentDetailsModal(student) {
        const initials = (student.name || '').split(' ').map(n => n[0]).join('').slice(0, 2);
        const modal = document.createElement('div');
        modal.className = 'student-details-modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-avatar">${initials}</div>
                    <div class="modal-title">${student.name} ${student.age ? `<span class="modal-age">${student.age} years old</span>` : ''}</div>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="detail-row">
                        <span class="detail-label">Age:</span>
                        <span class="detail-value">${student.age ? `${student.age} years old` : 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Status:</span>
                        <span class="detail-value ${(student.status || '').toLowerCase()}">${student.status || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Grade:</span>
                        <span class="detail-value">${student.grade || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Class:</span>
                        <span class="detail-value">${student.class || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">UPI:</span>
                        <span class="detail-value">${student.upi || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Assessment No:</span>
                        <span class="detail-value">${student.assessmentNo || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Email:</span>
                        <span class="detail-value">${student.email || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Phone:</span>
                        <span class="detail-value">${student.phone || 'N/A'}</span>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.classList.add('modal-active');
        setTimeout(() => modal.classList.add('show'), 10);

        const closeModal = () => {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
                document.body.classList.remove('modal-active');
            }, 300);
        };

        modal.querySelector('.modal-close').addEventListener('click', closeModal);
        modal.querySelector('.modal-overlay').addEventListener('click', closeModal);
        
        // Close on Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                escapeHandler.removeEventListener();
                closeModal();
            }
        };
        document.addEventListener('keydown', escapeHandler);
        escapeHandler.removeEventListener = () => {
            document.removeEventListener('keydown', escapeHandler);
        };
    }

    createResultCard(result) {
        let cardHtml = '';

        if (result.type === 'student') {
            const initials = (result.name || '').split(' ').map(n => n[0]).join('').slice(0, 2);
            const statusClass = result.status?.toLowerCase().includes('verified') ? 'verified' : 
                               result.status?.toLowerCase().includes('completed') ? 'completed' : 'pending';
            
            const studentInfo = `Name: ${result.name}\nStatus: ${result.status || 'N/A'}\nGrade: ${result.grade || 'N/A'}\nClass: ${result.class || 'N/A'}\nEmail: ${result.email || 'N/A'}\nPhone: ${result.phone || 'N/A'}`;

            cardHtml = `
                <div class="result-card" data-student-id="${result.studentId || 'page'}" 
                     data-student='${JSON.stringify(result)}' data-copy-text="${studentInfo.replace(/"/g, '&quot;')}">
                    <div class="result-avatar">${initials}</div>
                    <div class="result-content">
                        <div class="result-title">${this.highlightQuery(result.name)} ${result.age ? `<span class="age-badge">${result.age} yrs</span>` : ''}</div>
                        <div class="result-meta">
                            <span class="badge badge-${statusClass}">${result.status || 'N/A'}</span>
                            ${result.grade ? `<span class="badge">Grade: ${result.grade}</span>` : ''}
                            ${result.class ? `<span class="badge">Class: ${result.class}</span>` : ''}
                            ${result.upi ? `<span class="badge">UPI: ${result.upi}</span>` : ''}
                        </div>
                        ${result.email ? `<div class="result-email"><i class='bx bx-envelope'></i> ${result.email}</div>` : ''}
                        ${result.phone ? `<div class="result-phone"><i class='bx bx-phone'></i> ${result.phone}</div>` : ''}
                        ${result.info ? `<div class="result-info">${result.info}</div>` : ''}
                        ${result.change ? `<div class="result-change">${result.change}</div>` : ''}
                        <div class="result-category">${result.category}</div>
                    </div>
                    <div class="result-actions">
                        <button class="result-copy" title="Copy to clipboard" data-copy-text="${studentInfo.replace(/"/g, '&quot;')}"><i class='bx bx-copy'></i></button>
                        <div class="result-action">
                            <i class='bx bx-chevron-right'></i>
                        </div>
                    </div>
                </div>
            `;
        } else if (result.type === 'document') {
            cardHtml = `
                <div class="result-card" data-doc-id="${result.docId}" data-copy-text="${result.name.replace(/"/g, '&quot;')}">
                    <div class="result-icon"><i class='bx bx-file'></i></div>
                    <div class="result-content">
                        <div class="result-title">${this.highlightQuery(result.name)}</div>
                        <div class="result-preview">${result.preview}</div>
                        <div class="result-category">${result.category}</div>
                    </div>
                    <div class="result-actions">
                        <button class="result-copy" title="Copy to clipboard"><i class='bx bx-copy'></i></button>
                        <div class="result-action">
                            <i class='bx bx-chevron-right'></i>
                        </div>
                    </div>
                </div>
            `;
        } else if (result.type === 'menu') {
            cardHtml = `
                <div class="result-card" data-menu-link="${result.name.replace(/"/g, '&quot;')}">
                    <div class="result-icon"><i class='bx bx-menu'></i></div>
                    <div class="result-content">
                        <div class="result-title">${this.highlightQuery(result.name)}</div>
                        ${result.info ? `<div class="result-preview">${result.info}</div>` : ''}
                        <div class="result-category">${result.category}</div>
                    </div>
                    <div class="result-action">
                        <i class='bx bx-chevron-right'></i>
                    </div>
                </div>
            `;
        } else {
            cardHtml = `
                <div class="result-card">
                    <div class="result-icon"><i class='bx bx-user-circle'></i></div>
                    <div class="result-content">
                        <div class="result-title">${this.highlightQuery(result.name)}</div>
                        ${result.date ? `<div class="result-meta">${result.date}</div>` : ''}
                        ${result.time ? `<div class="result-meta">${result.time}</div>` : ''}
                        <div class="result-category">${result.category}</div>
                    </div>
                </div>
            `;
        }

        return cardHtml;
    }

    highlightQuery(text) {
        const input = document.querySelector('.search-modal-input');
        const query = input?.value || '';
        if (!query) return text;

        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<strong>$1</strong>');
    }

    switchCategory(category) {
        this.currentCategory = category;
        
        document.querySelectorAll('.search-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.category === category);
        });

        const input = document.querySelector('.search-modal-input');
        const query = input?.value.trim() || '';
        
        if (query) {
            this.displayResults(query);
        }
    }

    applyFilters(filterValue) {
        let allResults = [];
        
        if (this.currentCategory === 'all') {
            allResults = [
                ...this.results.page,
                ...this.results.realtime,
                ...this.results.firestore
            ];
        } else if (this.currentCategory === 'page') {
            allResults = this.results.page;
        } else if (this.currentCategory === 'realtime') {
            allResults = this.results.realtime;
        } else if (this.currentCategory === 'firestore') {
            allResults = this.results.firestore;
        }

        const filtered = allResults.filter(result => {
            const filterText = filterValue.toLowerCase();
            return (result.status?.toLowerCase().includes(filterText) ||
                   result.grade?.toLowerCase().includes(filterText) ||
                   result.class?.toLowerCase().includes(filterText) ||
                   result.category?.toLowerCase().includes(filterText) ||
                   result.name?.toLowerCase().includes(filterText));
        });

        const resultsHtml = filtered.map(r => this.createResultCard(r)).join('');
        document.getElementById('searchResults').innerHTML = resultsHtml;
        document.querySelector('.search-count').textContent = `${filtered.length} results`;

        // Re-add click handlers
        document.querySelectorAll('.result-card').forEach(card => {
            // Copy button handler
            const copyBtn = card.querySelector('.result-copy');
            if (copyBtn) {
                copyBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const textToCopy = card.dataset.copyText || card.textContent;
                    this.copyToClipboard(textToCopy);
                });
            }
            
            card.addEventListener('click', (e) => {
                if (e.target.closest('.result-copy')) return;
                e.preventDefault();
                e.stopPropagation();
                this.handleResultClick(card);
            });
        });
    }

    showSuggestions() {
        const topSearches = this.getTopSearches();
        const recentSearchesSliced = this.recentSearches.slice(0, 2);
        const topSearchesSliced = topSearches.slice(0, 2);
        
        const suggestionsHtml = `
            <div class="search-suggestions-header">Recent Searches</div>
            ${recentSearchesSliced.length > 0 
                ? recentSearchesSliced.map((search, index) => `
                    <div class="suggestion-item" data-suggestion="${search.replace(/"/g, '&quot;')}">
                        <div class="suggestion-content" onclick="universalSearch.populateSearchInput('${search.replace(/'/g, "\\'")}')">
                            <i class='bx bx-time'></i> ${search}
                        </div>
                        <button class="suggestion-delete" onclick="event.stopPropagation(); universalSearch.deleteRecentSearch('${search.replace(/'/g, "\\'")}', true)" title="Delete">
                            <i class='bx bx-x'></i>
                        </button>
                    </div>
                `).join('')
                : '<div class="suggestion-empty">No recent searches</div>'
            }
            <div class="search-suggestions-header">Top Searches</div>
            ${topSearchesSliced.length > 0
                ? topSearchesSliced.map(item => `
                    <div class="suggestion-item" data-suggestion="${item.query.replace(/"/g, '&quot;')}">
                        <div class="suggestion-content" onclick="universalSearch.populateSearchInput('${item.query.replace(/'/g, "\\'")}')">
                            <i class='bx bx-trending-up'></i> ${item.query} <span style="color:#999">(${item.count})</span>
                        </div>
                        <button class="suggestion-delete" onclick="event.stopPropagation(); universalSearch.deleteSearch('${item.query.replace(/'/g, "\\'")}', false)" title="Delete">
                            <i class='bx bx-x'></i>
                        </button>
                    </div>
                `).join('')
                : '<div class="suggestion-empty">No trending searches yet</div>'
            }
        `;

        document.getElementById('searchSuggestions').innerHTML = suggestionsHtml;
        document.getElementById('searchResults').innerHTML = '';
        document.querySelector('.search-modal')?.classList.add('show');
    }

    showNoResults(query) {
        document.getElementById('searchResults').innerHTML = `
            <div class="no-results">
                <i class='bx bx-search-alt-2'></i>
                <h3>No results found</h3>
                <p>Try searching for different keywords or filters</p>
            </div>
        `;
        document.querySelector('.search-count').textContent = '0 results';
    }

    copyToClipboard(text) {
        // Create textarea element
        const textarea = document.createElement('textarea');
        textarea.value = text.replace(/&quot;/g, '"');
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
            document.execCommand('copy');
            
            // Show toast notification
            this.showCopyToast('✓ Copied to clipboard');
        } catch (err) {
            console.error('Failed to copy:', err);
            this.showCopyToast('✗ Failed to copy', 'error');
        }
        
        document.body.removeChild(textarea);
    }

    showCopyToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `copy-toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Show toast
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Remove after 2 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    populateSearchInput(query) {
        const modal = document.getElementById('searchModal');
        const modalInput = modal?.querySelector('.search-modal-input');
        if (modalInput) {
            modalInput.value = query;
            modalInput.focus();
            // Perform search as if user typed it
            this.performSearch(query);
        }
    }

    openSearchModal() {
        const modal = document.getElementById('searchModal');
        if (modal) {
            modal.classList.add('show');
            document.body.classList.add('search-active');
            
            // Focus the modal input
            const modalInput = modal.querySelector('.search-modal-input');
            setTimeout(() => {
                modalInput.focus();
                if (!modalInput.value.trim()) {
                    this.showSuggestions();
                }
            }, 100);
        }
    }

    closeSearchModal() {
        const modal = document.getElementById('searchModal');
        modal?.classList.remove('show');
        document.getElementById('universalSearchInput').value = '';
    }

    saveRecentSearch(query) {
        let searches = this.loadRecentSearches();
        searches = [query, ...searches.filter(s => s !== query)].slice(0, 5);
        localStorage.setItem('recentSearches', JSON.stringify(searches));
        this.recentSearches = searches;
    }

    deleteRecentSearch(query, isRecent = true) {
        if (isRecent) {
            this.recentSearches = this.recentSearches.filter(s => s !== query);
            localStorage.setItem('recentSearches', JSON.stringify(this.recentSearches));
        } else {
            // Delete from analytics
            delete this.searchAnalytics[query];
            this.saveAnalytics();
        }
        this.showSuggestions();
    }

    deleteSearch(query, isRecent = true) {
        this.deleteRecentSearch(query, isRecent);
    }

    loadRecentSearches() {
        try {
            return JSON.parse(localStorage.getItem('recentSearches')) || [];
        } catch {
            return [];
        }
    }

    showAnalytics() {
        const panel = document.getElementById('analyticsPanel');
        const stats = this.getSearchStats();

        const analyticsHtml = `
            <div class="analytics-header">Search Analytics</div>
            <div class="analytics-stats">
                <div class="stat-item">
                    <div class="stat-value">${stats.totalResults}</div>
                    <div class="stat-label">Total Results</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.pageResults}</div>
                    <div class="stat-label">On Page</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.dbResults}</div>
                    <div class="stat-label">Database</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.fsResults}</div>
                    <div class="stat-label">Firestore</div>
                </div>
            </div>
            <div class="analytics-section">
                <div class="analytics-header">Result Breakdown</div>
                <div class="breakdown-item">
                    <span class="breakdown-label">Students</span>
                    <div class="breakdown-bar">
                        <div class="breakdown-fill" style="width: ${stats.studentPercent}%"></div>
                    </div>
                    <span class="breakdown-count">${stats.studentCount}</span>
                </div>
                <div class="breakdown-item">
                    <span class="breakdown-label">Documents</span>
                    <div class="breakdown-bar">
                        <div class="breakdown-fill" style="width: ${stats.documentPercent}%"></div>
                    </div>
                    <span class="breakdown-count">${stats.documentCount}</span>
                </div>
                <div class="breakdown-item">
                    <span class="breakdown-label">Activity</span>
                    <div class="breakdown-bar">
                        <div class="breakdown-fill" style="width: ${stats.activityPercent}%"></div>
                    </div>
                    <span class="breakdown-count">${stats.activityCount}</span>
                </div>
            </div>
        `;

        panel.innerHTML = analyticsHtml;
    }

    getSearchStats() {
        const allResults = [
            ...this.results.page,
            ...this.results.realtime,
            ...this.results.firestore
        ];

        const total = allResults.length;
        const students = allResults.filter(r => r.type === 'student').length;
        const documents = allResults.filter(r => r.type === 'document').length;
        const activity = allResults.filter(r => r.type === 'activity' || r.type === 'modified').length;

        return {
            totalResults: total,
            pageResults: this.results.page.length,
            dbResults: this.results.realtime.length,
            fsResults: this.results.firestore.length,
            studentCount: students,
            documentCount: documents,
            activityCount: activity,
            studentPercent: total > 0 ? Math.round((students / total) * 100) : 0,
            documentPercent: total > 0 ? Math.round((documents / total) * 100) : 0,
            activityPercent: total > 0 ? Math.round((activity / total) * 100) : 0
        };
    }

    trackSearch(query) {
        if (!this.searchAnalytics[query]) {
            this.searchAnalytics[query] = 0;
        }
        this.searchAnalytics[query]++;
        this.saveAnalytics();
    }

    getTopSearches() {
        return Object.entries(this.searchAnalytics)
            .map(([query, count]) => ({ query, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);
    }

    saveAnalytics() {
        localStorage.setItem('searchAnalytics', JSON.stringify(this.searchAnalytics));
    }

    loadAnalytics() {
        try {
            return JSON.parse(localStorage.getItem('searchAnalytics')) || {};
        } catch {
            return {};
        }
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.universalSearch = new UniversalSearch();
});
