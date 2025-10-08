// grade-promotion.js - Independent Grade Promotion System with Auto Annual Promotion
// Import this file in your HTML: <script type="module" src="grade-promotion.js"></script>

import { getDatabase, ref, get, update, set } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Configuration
const GRADE_PROMOTION_CONFIG = {
    gradeMap: {
        'PP1': 'PP2',
        'PP2': 'Grade 1',
        'Grade 1': 'Grade 2',
        'Grade 2': 'Grade 3',
        'Grade 3': 'Grade 4',
        'Grade 4': 'Grade 5',
        'Grade 5': 'Grade 6',
        'Grade 6': 'Grade 7',
        'Grade 7': 'Grade 8',
        'Grade 8': 'Grade 9',
        'Grade 9': 'Graduated'
    },
    
    // Auto-promotion settings
    autoPromote: true, // Enable automatic promotion
    autoPromoteDate: '12-31', // MM-DD format (December 31st - Last day of year)
    
    // UI settings
    buttonText: '🎓 Promote All Grades',
    selectiveButtonText: '📋 Promote Specific Grade',
    buttonColor: '#9333ea', // Purple
    confirmations: 2 // Number of confirmation dialogs for manual promotion
};

class GradePromotionSystem {
    constructor(config = GRADE_PROMOTION_CONFIG) {
        this.config = config;
        this.db = null;
        this.auth = null;
        this.appId = null;
        this.sanitizedAppId = null;
        this.initialized = false;
        this.autoPromotionChecked = false;
    }

    // Initialize the system with Firebase references from main app
    initialize(db, auth, appId) {
        this.db = db;
        this.auth = auth;
        this.appId = appId;
        this.sanitizedAppId = appId.replace(/\./g, '_');
        this.initialized = true;
        
        // Inject styles
        this.injectStyles();
        
        // Create UI buttons
        this.createPromotionButtons();
        
        // Check for auto-promotion on initialization
        if (this.config.autoPromote) {
            this.checkAutoPromotion();
        }
        
        // Set up daily check for auto-promotion
        this.setupDailyAutoPromotionCheck();
        
        console.log('Grade Promotion System initialized successfully');
        console.log(`Auto-promotion enabled: Will run on ${this.config.autoPromoteDate} annually`);
        return this;
    }

    // Inject CSS styles
    injectStyles() {
        const styles = `
            .grade-promotion-container {
                display: flex;
                gap: 10px;
                align-items: center;
                margin-left: 10px;
               flex-wrap: wrap !important;

            }

            .grade-promotion-btn {
                background: ${this.config.buttonColor};
                color: white;
                padding: 10px 20px;
                border-radius: 8px;
                border: none;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 2px 8px rgba(147, 51, 234, 0.3);
                animation: subtle-pulse 3s infinite;
                white-space: nowrap;
            }

            .grade-promotion-btn.selective {
                background: #10b981;
            }
            
            .grade-promotion-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(147, 51, 234, 0.5);
                filter: brightness(1.1);
            }

            .grade-promotion-btn.selective:hover {
                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.5);
            }
            
            .grade-promotion-btn:active {
                transform: translateY(0);
            }
            
            @keyframes subtle-pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.85; }
            }
            
            .promotion-modal {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.6);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                animation: fadeIn 0.3s ease;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            .promotion-modal-content {
                background: white;
                border-radius: 12px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                padding: 24px;
                max-width: 650px;
                width: 90%;
                max-height: 85vh;
                overflow-y: auto;
                animation: slideUp 0.3s ease;
            }
            
            @keyframes slideUp {
                from { transform: translateY(50px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            
            .promotion-stats-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 16px;
                margin-bottom: 24px;
            }
            
            .promotion-stat-card {
                padding: 16px;
                border-radius: 8px;
                text-align: center;
            }
            
            .promotion-stat-card.success {
                background: #dcfce7;
                color: #15803d;
            }
            
            .promotion-stat-card.failed {
                background: #fee2e2;
                color: #dc2626;
            }
            
            .promotion-stat-card.skipped {
                background: #fef3c7;
                color: #ca8a04;
            }
            
            .promotion-stat-number {
                font-size: 32px;
                font-weight: bold;
                line-height: 1;
            }
            
            .promotion-stat-label {
                font-size: 14px;
                margin-top: 4px;
                opacity: 0.8;
            }
            
            .promotion-details-list {
                max-height: 250px;
                overflow-y: auto;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 20px;
            }
            
            .promotion-detail-item {
                padding: 8px;
                border-bottom: 1px solid #f3f4f6;
                font-size: 14px;
            }
            
            .promotion-detail-item:last-child {
                border-bottom: none;
            }
            
            .promotion-modal-buttons {
                display: flex;
                gap: 12px;
            }
            
            .promotion-modal-btn {
                flex: 1;
                padding: 12px 24px;
                border: none;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .promotion-modal-btn.primary {
                background: #3b82f6;
                color: white;
            }
            
            .promotion-modal-btn.primary:hover {
                background: #2563eb;
            }
            
            .promotion-modal-btn.secondary {
                background: #6b7280;
                color: white;
            }
            
            .promotion-modal-btn.secondary:hover {
                background: #4b5563;
            }

            .grade-selector-modal {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.6);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            }

            .grade-selector-content {
                background: white;
                border-radius: 12px;
                padding: 24px;
                max-width: 500px;
                width: 90%;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            }

            .grade-checkbox-list {
                max-height: 300px;
                overflow-y: auto;
                margin: 20px 0;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 12px;
            }

            .grade-checkbox-item {
                display: flex;
                align-items: center;
                padding: 10px;
                margin-bottom: 8px;
                border-radius: 6px;
                transition: background 0.2s;
            }

            .grade-checkbox-item:hover {
                background: #f3f4f6;
            }

            .grade-checkbox-item input[type="checkbox"] {
                width: 18px;
                height: 18px;
                margin-right: 12px;
                cursor: pointer;
            }

            .grade-checkbox-item label {
                cursor: pointer;
                font-size: 14px;
                flex: 1;
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    // Create promotion buttons
    createPromotionButtons() {
        const container = document.createElement('div');
        container.className = 'grade-promotion-container';
        
        // Promote All button
        const promoteAllBtn = document.createElement('button');
        promoteAllBtn.id = 'grade-promotion-trigger-btn';
        promoteAllBtn.className = 'grade-promotion-btn';
        promoteAllBtn.textContent = this.config.buttonText;
        promoteAllBtn.addEventListener('click', () => this.promoteAllStudents(false));
        
        // Promote Specific Grade button
        const promoteSelectiveBtn = document.createElement('button');
        promoteSelectiveBtn.id = 'grade-promotion-selective-btn';
        promoteSelectiveBtn.className = 'grade-promotion-btn selective';
        promoteSelectiveBtn.textContent = this.config.selectiveButtonText;
        promoteSelectiveBtn.addEventListener('click', () => this.showGradeSelector());
        
        container.appendChild(promoteAllBtn);
        container.appendChild(promoteSelectiveBtn);
        
        // Try to insert next to grade filter
        setTimeout(() => {
            const gradeFilter = document.getElementById('grade-filter-select');
            if (gradeFilter && gradeFilter.parentElement) {
                gradeFilter.parentElement.appendChild(container);
            } else {
                // Fallback: append to data section
                const dataSection = document.getElementById('data-section');
                if (dataSection) {
                    const wrapper = document.createElement('div');
                    wrapper.style.padding = '10px 20px';
                    wrapper.appendChild(container);
                    dataSection.insertBefore(wrapper, dataSection.firstChild);
                }
            }
        }, 500);
    }

    // Show grade selector modal for selective promotion
    showGradeSelector() {
        const modal = document.createElement('div');
        modal.className = 'grade-selector-modal';
        
        const grades = Object.keys(this.config.gradeMap);
        
        modal.innerHTML = `
            <div class="grade-selector-content">
                <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 16px; color: #1f2937;">
                    Select Grades to Promote
                </h2>
                <p style="font-size: 14px; color: #6b7280; margin-bottom: 16px;">
                    Choose which grades you want to promote to the next level.
                </p>
                
                <div class="grade-checkbox-list">
                    ${grades.map(grade => `
                        <div class="grade-checkbox-item">
                            <input type="checkbox" id="grade-${grade.replace(/\s/g, '_')}" value="${grade}">
                            <label for="grade-${grade.replace(/\s/g, '_')}">${grade} → ${this.config.gradeMap[grade]}</label>
                        </div>
                    `).join('')}
                </div>

                <div class="promotion-modal-buttons">
                    <button class="promotion-modal-btn primary" id="confirm-selective-promotion">
                        Promote Selected
                    </button>
                    <button class="promotion-modal-btn secondary" id="cancel-selective-promotion">
                        Cancel
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners
        modal.querySelector('#confirm-selective-promotion').addEventListener('click', () => {
            const checkboxes = modal.querySelectorAll('input[type="checkbox"]:checked');
            const selectedGrades = Array.from(checkboxes).map(cb => cb.value);
            
            if (selectedGrades.length === 0) {
                alert('Please select at least one grade to promote.');
                return;
            }
            
            modal.remove();
            this.promoteSpecificGrades(selectedGrades);
        });
        
        modal.querySelector('#cancel-selective-promotion').addEventListener('click', () => {
            modal.remove();
        });
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // Show loading indicator
    showLoader(show = true) {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.classList.toggle('hidden', !show);
        }
    }

    // Show modal message
    showModal(message) {
        const modal = document.getElementById('message-modal');
        const modalText = document.getElementById('modal-text');
        if (modal && modalText) {
            modalText.textContent = message;
            modal.classList.remove('hidden');
            setTimeout(() => modal.classList.add('hidden'), 2000);
        }
    }

    // Promote single student
    async promoteStudent(studentId, currentGrade) {
        const nextGrade = this.config.gradeMap[currentGrade];
        
        if (!nextGrade) {
            return { 
                success: false, 
                reason: 'No promotion mapping',
                currentGrade 
            };
        }

        try {
            const studentRef = ref(this.db, `artifacts/${this.sanitizedAppId}/students/${studentId}`);
            await update(studentRef, { Grade: nextGrade });
            return { 
                success: true, 
                from: currentGrade, 
                to: nextGrade 
            };
        } catch (error) {
            console.error(`Error promoting student ${studentId}:`, error);
            return { 
                success: false, 
                error: error.message,
                currentGrade 
            };
        }
    }

    // Promote all students
    async promoteAllStudents(isAutomatic = false) {
        if (!this.initialized) {
            alert('Grade Promotion System not initialized properly.');
            return;
        }

        // Show confirmations only for manual promotion
        if (!isAutomatic) {
            for (let i = 0; i < this.config.confirmations; i++) {
                const message = i === 0 
                    ? '⚠️ WARNING: This will promote ALL students to the next grade level.\n\nThis action affects the entire database and cannot be easily undone.\n\nAre you absolutely sure you want to proceed?'
                    : 'This is your FINAL confirmation.\n\nClick OK to promote all students now.';
                
                if (!confirm(message)) {
                    return;
                }
            }
        }

        const promotionType = isAutomatic ? 'Automatic Annual' : 'Manual';
        this.showModal(`Starting ${promotionType.toLowerCase()} grade promotion...`);
        this.showLoader(true);

        const results = {
            successful: 0,
            failed: 0,
            skipped: 0,
            details: [],
            isAutomatic: isAutomatic
        };

        try {
            const studentsRef = ref(this.db, `artifacts/${this.sanitizedAppId}/students`);
            const snapshot = await get(studentsRef);

            if (!snapshot.exists()) {
                this.showModal('No students found in database.');
                this.showLoader(false);
                return;
            }

            const students = snapshot.val();
            const studentIds = Object.keys(students);

            // Process each student
            for (const studentId of studentIds) {
                const student = students[studentId];
                const currentGrade = student.Grade;

                if (!currentGrade) {
                    results.skipped++;
                    results.details.push({
                        id: studentId,
                        name: student['Official Student Name'] || 'Unknown',
                        status: 'Skipped - No grade assigned'
                    });
                    continue;
                }

                const result = await this.promoteStudent(studentId, currentGrade);

                if (result.success) {
                    results.successful++;
                    results.details.push({
                        id: studentId,
                        name: student['Official Student Name'] || 'Unknown',
                        status: `Promoted: ${result.from} → ${result.to}`
                    });
                } else {
                    results.failed++;
                    results.details.push({
                        id: studentId,
                        name: student['Official Student Name'] || 'Unknown',
                        status: `Failed: ${result.reason || result.error}`
                    });
                }
            }

            // Display results
            this.displayResults(results, promotionType);

            // Log promotion
            await this.logPromotion(results, promotionType);

        } catch (error) {
            console.error('Error during grade promotion:', error);
            alert(`Error during grade promotion: ${error.message}`);
        } finally {
            this.showLoader(false);
        }
    }

    // Promote specific grades
    async promoteSpecificGrades(gradesToPromote) {
        if (!this.initialized) {
            alert('Grade Promotion System not initialized properly.');
            return;
        }

        if (!confirm(`This will promote students in grades: ${gradesToPromote.join(', ')}\n\nContinue?`)) {
            return;
        }

        this.showModal('Promoting selected grades...');
        this.showLoader(true);

        const results = {
            successful: 0,
            failed: 0,
            skipped: 0,
            details: [],
            isAutomatic: false,
            selectedGrades: gradesToPromote
        };

        try {
            const studentsRef = ref(this.db, `artifacts/${this.sanitizedAppId}/students`);
            const snapshot = await get(studentsRef);

            if (!snapshot.exists()) {
                this.showModal('No students found.');
                this.showLoader(false);
                return;
            }

            const students = snapshot.val();

            for (const [studentId, student] of Object.entries(students)) {
                if (gradesToPromote.includes(student.Grade)) {
                    const result = await this.promoteStudent(studentId, student.Grade);
                    if (result.success) {
                        results.successful++;
                        results.details.push({
                            id: studentId,
                            name: student['Official Student Name'] || 'Unknown',
                            status: `Promoted: ${result.from} → ${result.to}`
                        });
                    } else {
                        results.failed++;
                        results.details.push({
                            id: studentId,
                            name: student['Official Student Name'] || 'Unknown',
                            status: `Failed: ${result.reason || result.error}`
                        });
                    }
                }
            }

            this.displayResults(results, `Selective (${gradesToPromote.join(', ')})`);
            await this.logPromotion(results, 'Selective');

        } catch (error) {
            console.error('Error during selective promotion:', error);
            alert(`Error: ${error.message}`);
        } finally {
            this.showLoader(false);
        }
    }

    // Display results modal
    displayResults(results, promotionType = 'Manual') {
        const modal = document.createElement('div');
        modal.className = 'promotion-modal';
        modal.innerHTML = `
            <div class="promotion-modal-content">
                <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 8px; color: #1f2937;">
                    Grade Promotion Results
                </h2>
                <p style="font-size: 14px; color: #6b7280; margin-bottom: 20px;">
                    ${promotionType} Promotion - ${new Date().toLocaleDateString()}
                </p>
                
                <div class="promotion-stats-grid">
                    <div class="promotion-stat-card success">
                        <div class="promotion-stat-number">${results.successful}</div>
                        <div class="promotion-stat-label">Promoted</div>
                    </div>
                    <div class="promotion-stat-card failed">
                        <div class="promotion-stat-number">${results.failed}</div>
                        <div class="promotion-stat-label">Failed</div>
                    </div>
                    <div class="promotion-stat-card skipped">
                        <div class="promotion-stat-number">${results.skipped}</div>
                        <div class="promotion-stat-label">Skipped</div>
                    </div>
                </div>

                <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #374151;">
                    Detailed Results:
                </h3>
                <div class="promotion-details-list">
                    ${results.details.map(detail => `
                        <div class="promotion-detail-item">
                            <strong>${detail.name}</strong>: ${detail.status}
                        </div>
                    `).join('')}
                </div>

                <div class="promotion-modal-buttons">
                    <button class="promotion-modal-btn primary" id="download-report-btn">
                        📥 Download Report
                    </button>
                    <button class="promotion-modal-btn secondary" id="close-results-modal">
                        Close & Refresh
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners
        modal.querySelector('#download-report-btn').addEventListener('click', () => {
            this.downloadReport(results, promotionType);
        });
        
        modal.querySelector('#close-results-modal').addEventListener('click', () => {
            modal.remove();
            // Refresh page to show updated data
            window.location.reload();
        });
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                window.location.reload();
            }
        });
    }

    // Download report
    downloadReport(results, promotionType = 'Manual') {
        const csvRows = [
            ['Promotion Type', 'Student Name', 'Status', 'Date', 'Performed By'],
            ...results.details.map(detail => [
                promotionType,
                detail.name,
                detail.status,
                new Date().toLocaleDateString(),
                this.auth.currentUser ? this.auth.currentUser.email : 'System (Automatic)'
            ])
        ];

        const csvContent = csvRows.map(row => 
            row.map(cell => `"${cell}"`).join(',')
        ).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `grade_promotion_${promotionType.toLowerCase().replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Log promotion to Firebase
    async logPromotion(results, promotionType = 'Manual') {
        try {
            const logRef = ref(this.db, `artifacts/${this.sanitizedAppId}/promotionLogs/${Date.now()}`);
            await set(logRef, {
                date: new Date().toISOString(),
                performedBy: this.auth.currentUser ? this.auth.currentUser.email : 'System (Automatic)',
                promotionType: promotionType,
                successful: results.successful,
                failed: results.failed,
                skipped: results.skipped,
                totalProcessed: results.successful + results.failed + results.skipped,
                selectedGrades: results.selectedGrades || 'All'
            });
        } catch (error) {
            console.error('Error logging promotion:', error);
        }
    }

    // Check if promotion was already done today
    async wasPromotedToday() {
        try {
            const today = new Date().toDateString();
            const logsRef = ref(this.db, `artifacts/${this.sanitizedAppId}/promotionLogs`);
            const snapshot = await get(logsRef);
            
            if (snapshot.exists()) {
                const logs = snapshot.val();
                const todayLogs = Object.values(logs).filter(log => {
                    const logDate = new Date(log.date).toDateString();
                    return logDate === today && log.promotionType === 'Automatic Annual';
                });
                return todayLogs.length > 0;
            }
            return false;
        } catch (error) {
            console.error('Error checking promotion history:', error);
            return false;
        }
    }

    // Check for auto-promotion
    async checkAutoPromotion() {
        if (this.autoPromotionChecked) return;
        
        const today = new Date();
        const [month, day] = this.config.autoPromoteDate.split('-');
        const targetDate = new Date(today.getFullYear(), parseInt(month) - 1, parseInt(day));
        
        // Check if today is the auto-promotion date
        if (today.toDateString() === targetDate.toDateString()) {
            const alreadyPromoted = await this.wasPromotedToday();
            
            if (!alreadyPromoted) {
                console.log('🎓 Automatic annual promotion triggered!');
                setTimeout(() => {
                    if (confirm('🎓 It\'s December 31st - Annual Grade Promotion Day!\n\nThe system will now automatically promote all students to the next grade level.\n\nClick OK to proceed.')) {
                        this.promoteAllStudents(true);
                    }
                }, 2000);
            } else {
                console.log('✅ Automatic promotion already completed today');
            }
        }
        
        this.autoPromotionChecked = true;
    }

    // Set up daily check for auto-promotion (checks at midnight)
    setupDailyAutoPromotionCheck() {
        // Check immediately
        this.checkAutoPromotion();
        
        // Calculate time until next midnight
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 1, 0, 0); // 12:01 AM
        
        const timeUntilMidnight = tomorrow.getTime() - now.getTime();
        
        // Set timeout for midnight check
        setTimeout(() => {
            this.autoPromotionChecked = false;
            this.checkAutoPromotion();
            
            // Then check every 24 hours
            setInterval(() => {
                this.autoPromotionChecked = false;
                this.checkAutoPromotion();
            }, 24 * 60 * 60 * 1000);
        }, timeUntilMidnight);
        
        console.log(`Next auto-promotion check scheduled for: ${tomorrow.toLocaleString()}`);
    }
}

// Export for use
export default GradePromotionSystem;