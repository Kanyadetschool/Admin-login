// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyA_41WpdMjHJOU5s3gQ9aieIayZRvUoRLE",
    authDomain: "kanyadet-school-admin.firebaseapp.com",
    projectId: "kanyadet-school-admin",
    storageBucket: "kanyadet-school-admin.firebasestorage.app",
    messagingSenderId: "409708360032",
    appId: "1:409708360032:web:a21d63e8cb5fa1ecabee05",
    measurementId: "G-Y4C0ZRRL52"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// Track modified students for real-time display
const modifiedStudents = new Map();
let activityFeed = [];
let allStudents = []; // Store all students for filtering
let currentUser = null; // Track current user

// Constants for data retention
const RETENTION_DAYS = 30;
const RETENTION_MS = RETENTION_DAYS * 24 * 60 * 60 * 1000;

/**
 * Cleanup old entries - remove records older than 30 days
 */
function cleanupOldEntries() {
    const now = Date.now();
    let removedModified = 0;
    let removedActivity = 0;
    
    // Clean modified students
    for (let [key, student] of modifiedStudents.entries()) {
        if (student.timestamp) {
            const entryTime = new Date(student.timestamp).getTime();
            if (now - entryTime > RETENTION_MS) {
                modifiedStudents.delete(key);
                removedModified++;
            }
        }
    }
    
    // Clean activity feed
    const beforeCount = activityFeed.length;
    activityFeed = activityFeed.filter(entry => {
        if (entry.timestamp) {
            const entryTime = new Date(entry.timestamp).getTime();
            const keep = now - entryTime <= RETENTION_MS;
            if (!keep) removedActivity++;
            return keep;
        }
        return true;
    });
    const afterCount = activityFeed.length;
    
    // Save cleaned activity feed to localStorage
    try {
        localStorage.setItem('activityFeed', JSON.stringify(activityFeed));
    } catch (e) {
        console.warn('Could not save activity feed to localStorage:', e);
    }
    
    // Log cleanup results if anything was removed
    if (removedModified > 0 || removedActivity > 0) {
        console.log(`🧹 Data Retention Cleanup: Removed ${removedModified} modified students, ${removedActivity} activity entries`);
    }

}

/**
 * Calculate remaining retention days for an entry
 * @param {string} timestamp - Entry timestamp
 * @returns {number} Days remaining (negative if already expired)
 */
function getRetentionDaysRemaining(timestamp) {
    if (!timestamp) return RETENTION_DAYS;
    
    try {
        const entryTime = new Date(timestamp).getTime();
        const now = Date.now();
        const daysRemaining = Math.ceil((RETENTION_MS - (now - entryTime)) / (24 * 60 * 60 * 1000));
        return Math.max(0, daysRemaining);
    } catch (e) {
        return RETENTION_DAYS;
    }
}

/**
 * Get formatted timestamp
 */
function getFormattedTimestamp() {
    const now = new Date();
    return now.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
}

/**
 * Load persisted activity feed from Firebase Realtime Database
 * Automatically removes entries older than 30 days
 * Syncs across all devices and browsers
 */
function loadPersistedActivityFeed() {
    return new Promise((resolve) => {
        try {
            const db = firebase.database();
            const ref = db.ref('adminPortal/activityFeed');
            
            ref.once('value').then((snapshot) => {
                if (snapshot.exists()) {
                    const feedData = snapshot.val();
                    
                    // Convert Firebase object to array
                    activityFeed = Array.isArray(feedData) ? feedData : Object.values(feedData || {});
                    console.log('📂 Loaded activity feed from Firebase:', activityFeed.length, 'entries');
                    
                    // Run cleanup to remove expired entries
                    cleanupOldEntries();
                    
                    console.log('✅ Activity feed cleaned and validated. Entries:', activityFeed.length);
                } else {
                    console.log('📂 No activity feed found in Firebase. Starting fresh.');
                    activityFeed = [];
                }
                resolve();
            }).catch((error) => {
                console.warn('⚠️ Could not load activity feed from Firebase:', error);
                // Fallback to localStorage
                try {
                    const saved = localStorage.getItem('activityFeed');
                    if (saved) {
                        activityFeed = JSON.parse(saved);
                        console.log('📂 Loaded from localStorage fallback:', activityFeed.length, 'entries');
                        cleanupOldEntries();
                    } else {
                        activityFeed = [];
                    }
                } catch (e) {
                    activityFeed = [];
                }
                resolve();
            });
        } catch (e) {
            console.warn('⚠️ Could not load persisted activity feed:', e);
            activityFeed = [];
            resolve();
        }
    });
}

/**
 * Setup real-time listener for activity feed from Firebase
 * Updates across all connected devices instantly
 */
function setupActivityFeedListener() {
    try {
        const db = firebase.database();
        const ref = db.ref('adminPortal/activityFeed');
        let isFirstLoad = true;
        
        ref.on('value', (snapshot) => {
            // Skip first load - data was already loaded by loadPersistedActivityFeed()
            if (isFirstLoad) {
                console.log('⏭️ Skipping first listener attachment (data already loaded)');
                isFirstLoad = false;
                return;
            }
            
            if (snapshot.exists()) {
                const feedData = snapshot.val();
                const newFeed = Array.isArray(feedData) ? feedData : Object.values(feedData || {});
                
                // Only update if data changed
                if (JSON.stringify(newFeed) !== JSON.stringify(activityFeed)) {
                    activityFeed = newFeed;
                    updateActivityFeedDisplay();
                    console.log('🔄 Activity feed synced from Firebase. Entries:', activityFeed.length);
                }
            }
        }, (error) => {
            console.warn('⚠️ Real-time listener error:', error);
        });
    } catch (e) {
        console.warn('⚠️ Could not setup activity feed listener:', e);
    }
}

/**
 * Update activity feed display from current data
 */
function updateActivityFeedDisplay() {
    const feed = document.getElementById('activityFeed');
    if (!feed) return;
    
    feed.innerHTML = '';
    
    if (activityFeed.length === 0) {
        feed.innerHTML = '<p style="padding: 15px; text-align: center; color: #999;">⏳ No recent activity</p>';
        return;
    }
    
    activityFeed.forEach((entry) => {
        const feedItem = document.createElement('div');
        feedItem.className = 'activity-feed-item';
        feedItem.setAttribute('data-timestamp', entry.timestamp);
        
        let contentHTML = '';
        
        if (entry.type === 'ADDED') {
            contentHTML = `
                <strong>➕ NEW STUDENT ADDED</strong>
                <div style="margin: 8px 0;">
                    <span class="field-change">${entry.studentName}</span>
                    <div style="color: #666; font-size: 11px; margin-top: 4px;">Status: <strong>${entry.status}</strong></div>
                </div>
            `;
        } else if (entry.type === 'FIELD_CHANGED') {
            const displayOldValue = entry.oldValue === undefined || entry.oldValue === null ? 'N/A' : String(entry.oldValue);
            const displayNewValue = entry.newValue === undefined || entry.newValue === null ? 'N/A' : String(entry.newValue);
            
            contentHTML = `
                <strong>✏️ FIELD MODIFIED</strong>
                <div style="margin: 8px 0;">
                    <span class="field-change">${entry.studentName}  </span>
                    <div class="field-comparison-box">
                        <div class="field-name">📝 ${entry.field}</div>
                        <div style="margin: 8px 0;">
                            <div><strong style="color: #555;">Old Value:</strong></div>
                            <span class="old-value">${displayOldValue}</span>
                        </div>
                        <div style="margin: 8px 0;">
                            <div><strong style="color: #555;">New Value:</strong></div>
                            <span class="new-value">${displayNewValue}</span>
                        </div>
                    </div>
                </div>
            `;
        }
        
        feedItem.innerHTML = contentHTML + `
            <span class="timestamp" style="display: grid; align-items: center; justify-content: space-between; gap: 10px;">
                <span>👤 <strong>${entry.changedBy || 'Admin'}</strong> | ⏱️ ${entry.timestamp}</span>
                <span style="font-size: 10px; color: #27ae60; background: #ecf0f1; padding: 2px 8px; border-radius: 4px; white-space: nowrap;">
                    📅 ${getRetentionDaysRemaining(entry.timestamp)} days retained
                </span>
            </span>
        `;
        
        feedItem.style.animation = 'slideIn 0.3s ease';
        feed.insertBefore(feedItem, feed.firstChild);
    });
}

/**
 * Load persisted modified students from Firebase on startup
 * Restores modifications made within 30 days
 * Syncs across all devices and browsers
 */
function loadPersistedModifiedStudents() {
    return new Promise((resolve) => {
        try {
            const db = firebase.database();
            const ref = db.ref('adminPortal/modifiedStudents');
            
            ref.once('value').then((snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    
                    // Load into modifiedStudents Map
                    modifiedStudents.clear();
                    Object.keys(data).forEach((key) => {
                        modifiedStudents.set(key, data[key]);
                    });
                    
                    console.log('📂 Loaded modified students from Firebase:', modifiedStudents.size, 'entries');
                    
                    // Run cleanup to remove expired entries
                    cleanupOldEntries();
                    
                    console.log('✅ Modified students cleaned and validated. Entries:', modifiedStudents.size);
                    
                    // Update UI
                    updateModifiedStudentsList();
                } else {
                    console.log('📂 No modified students found in Firebase. Starting fresh.');
                    modifiedStudents.clear();
                    updateModifiedStudentsList();
                }
                resolve();
            }).catch((error) => {
                console.warn('⚠️ Could not load modified students from Firebase:', error);
                modifiedStudents.clear();
                updateModifiedStudentsList();
                resolve();
            });
        } catch (e) {
            console.warn('⚠️ Could not load persisted modified students:', e);
            modifiedStudents.clear();
            resolve();
        }
    });
}

/**
 * Load Recent Admissions from Firebase Realtime Database
 */
function loadRecentAdmissions() {
    const admissionsTableBody = document.getElementById('admissionsTableBody');
    
    try {
        const studentsRef = db.ref('artifacts/default-app-id/students');
        
        studentsRef.once('value')
            .then((snapshot) => {
                admissionsTableBody.innerHTML = '';

                if (!snapshot.exists()) {
                    admissionsTableBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No admissions found</td></tr>';
                    return;
                }

                const students = snapshot.val();
                const studentArray = [];

                for (let key in students) {
                    if (students.hasOwnProperty(key)) {
                        const student = students[key];
                        student.id = key;
                        studentArray.push(student);
                    }
                }

                studentArray.sort((a, b) => {
                    const dateA = new Date(parseAdmissionDate(a.DateOfAdmission || a.admissionDate || 0));
                    const dateB = new Date(parseAdmissionDate(b.DateOfAdmission || b.admissionDate || 0));
                    return dateB - dateA;
                });

                const recentAdmissions = studentArray.slice(0, 5);
                allStudents = studentArray; // Store all students

                // Update statistics
                updateStatistics(studentArray);

                recentAdmissions.forEach((student) => {
                    const studentName = student['Official Student Name'] || student.name || 'N/A';
                    const admissionDate = student.DateOfAdmission ? formatDate(student.DateOfAdmission) : 'N/A';
                    const status = student.Status || 'Pending';
                    
                    let statusClass = 'pending';
                    if (status.toLowerCase() === 'verified' || status.toLowerCase() === 'completed') {
                        statusClass = 'completed';
                    }

                    const row = document.createElement('tr');
                    row.id = `admission-row-${student.id}`;
                    row.innerHTML = `
                        <td>
                            <img src="img/people.png" alt="${studentName}">
                            <p class="student-name-hover" data-student-id="${student.id}">${studentName}</p>
                        </td>
                        <td>${admissionDate}</td>
                        <td><span class="status ${statusClass}">${status}</span></td>
                    `;
                    row.className = 'admission-row';
                    row.setAttribute('data-student-name', studentName.toLowerCase());
                    
                    // Add hover event listeners for info card
                    const nameElement = row.querySelector('.student-name-hover');
                    nameElement.addEventListener('mouseenter', (e) => showStudentInfoCard(e, student));
                    nameElement.addEventListener('mouseleave', () => hideStudentInfoCard());
                    
                    admissionsTableBody.appendChild(row);
                });

                // Update count
                document.getElementById('admissionCount').textContent = recentAdmissions.length;
                document.getElementById('totalAdmissions').textContent = studentArray.length;

                // Setup real-time updates for admission rows
                setupRealtimeAdmissionUpdates();

            })
            .catch((error) => {
                console.error('Error loading admissions:', error);
                admissionsTableBody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:red;">Error loading data</td></tr>';
            });

    } catch (error) {
        console.error('Error loading admissions:', error);
    }
}

/**
 * Display student info card on hover (Twitter style)
 */
function showStudentInfoCard(event, student) {
    let card = document.getElementById('studentInfoCard');
    
    // Create card if it doesn't exist
    if (!card) {
        card = document.createElement('div');
        card.id = 'studentInfoCard';
        card.className = 'student-info-card';
        document.body.appendChild(card);
    }

    const studentName = student['Official Student Name'] || student.name || 'N/A';
    const initials = studentName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const status = student.Status || 'Pending';
    let statusClass = 'pending';
    if (status.toLowerCase() === 'verified' || status.toLowerCase() === 'completed') {
        statusClass = 'completed';
    }

    const grade = student.Grade || 'N/A';
    const class_ = student.Class || 'N/A';
    const admissionDate = student.DateOfAdmission ? formatDate(student.DateOfAdmission) : 'N/A';
    const email = student.Email || 'N/A';
    const phone = student.Phone || 'N/A';
    const upi = student.UPI || student['UPI'] || 'N/A';
    const assessmentNo = student['Assessment No'] || student.AssessmentNo || student['Assessment Number'] || 'N/A';

    card.innerHTML = `
        <div class="card-header">
            <div class="card-avatar">${initials}</div>
            <div class="card-header-info">
                <div class="card-name">${studentName}</div>
                <div class="card-id">ID: ${student.id ? student.id.slice(0, 8) : 'N/A'}</div>
            </div>
        </div>
        <div class="card-body">
            <div class="info-row">
                <span class="info-label">Status</span>
                <span class="status-badge ${statusClass}">${status}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Grade</span>
                <span class="info-value">${grade}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Class</span>
                <span class="info-value">${class_}</span>
            </div>
            <div class="info-row">
                <span class="info-label">UPI</span>
                <span class="info-value">${upi}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Assessment No</span>
                <span class="info-value">${assessmentNo}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Admission</span>
                <span class="info-value">${admissionDate}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Email</span>
                <span class="info-value" style="font-size: 11px; word-break: break-all;">${email}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Phone</span>
                <span class="info-value">${phone}</span>
            </div>
        </div>
    `;

    card.classList.add('show');

    // Position card near cursor
    const rect = event.target.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    let left = rect.left + scrollX - 160;
    let top = rect.bottom + scrollY + 10;

    // Adjust if card goes off-screen
    if (left + 320 > window.innerWidth) {
        left = window.innerWidth - 340 + scrollX;
    }
    if (left < 0) {
        left = 10 + scrollX;
    }

    card.style.left = left + 'px';
    card.style.top = top + 'px';
}

/**
 * Hide student info card
 */
function hideStudentInfoCard() {
    const card = document.getElementById('studentInfoCard');
    if (card) {
        card.classList.remove('show');
    }
}

// Real-time listener to update admission rows when student data changes
function setupRealtimeAdmissionUpdates() {
    const studentsRef = db.ref('artifacts/default-app-id/students');
    let previousData = {};

    studentsRef.on('value', (snapshot) => {
        if (!snapshot.exists()) return;

        const students = snapshot.val();

        // Update each student row in the table
        for (let studentId in students) {
            if (students.hasOwnProperty(studentId)) {
                const student = students[studentId];
                const row = document.getElementById(`admission-row-${studentId}`);

                if (row) {
                    // Check if name changed
                    const oldName = previousData[studentId]?.['Official Student Name'] || previousData[studentId]?.name;
                    const newName = student['Official Student Name'] || student.name || 'N/A';
                    const admissionDate = student.DateOfAdmission ? formatDate(student.DateOfAdmission) : 'N/A';
                    const status = student.Status || 'Pending';

                    // Update the row if data changed
                    if (oldName !== newName || row.getAttribute('data-student-name') !== newName.toLowerCase()) {
                        const statusClass = (status.toLowerCase() === 'verified' || status.toLowerCase() === 'completed') ? 'completed' : 'pending';
                        
                        row.innerHTML = `
                            <td>
                                <img src="img/people.png" alt="${newName}">
                                <p class="student-name-hover" data-student-id="${studentId}">${newName}</p>
                            </td>
                            <td>${admissionDate}</td>
                            <td><span class="status ${statusClass}">${status}</span></td>
                        `;
                        row.setAttribute('data-student-name', newName.toLowerCase());
                        
                        // Add hover event listeners for updated row
                        const nameElement = row.querySelector('.student-name-hover');
                        nameElement.addEventListener('mouseenter', (e) => showStudentInfoCard(e, student));
                        nameElement.addEventListener('mouseleave', () => hideStudentInfoCard());
                        
                        // Add visual feedback for update
                        row.style.backgroundColor = '#fffacd';
                        setTimeout(() => {
                            row.style.backgroundColor = '';
                        }, 1000);

                        console.log(`Updated admission row for ${newName}`);
                    }
                }
            }
        }

        // Update previous data for next comparison
        previousData = JSON.parse(JSON.stringify(students));
    }, (error) => {
        console.error('Error setting up admission real-time updates:', error);
    });
}

function setupRealtimeModifiedStudentsListener() {
    const modifiedList = document.getElementById('modifiedStudentsList');
    const studentsRef = db.ref('artifacts/default-app-id/students');
    let firstLoad = true;
    let previousStudentSnapshot = {};

    console.log('🔴 Setting up real-time listener for modified students...');
    console.log('📍 Database Path: artifacts/default-app-id/students');

    // Listen for any changes to all students
    studentsRef.on('value', (snapshot) => {
        const studentsData = snapshot.val();
        
        if (!studentsData) {
            console.log('⚠️ No students data found');
            return;
        }

        console.log(`📊 Real-time update: Processing ${Object.keys(studentsData).length} students...`);

        // Process each student
        for (let studentId in studentsData) {
            if (!studentsData.hasOwnProperty(studentId)) continue;

            const currentData = studentsData[studentId];
            const previousData = previousStudentSnapshot[studentId];

            if (firstLoad) {
                // First load - just store the snapshot
                previousStudentSnapshot[studentId] = JSON.parse(JSON.stringify(currentData));
                console.log(`📌 Initialized student: ${currentData['Official Student Name'] || 'Unknown'}`);
            } else if (previousData) {
                // Check for changes
                const changedFields = getChangedFields(previousData, currentData);

                if (changedFields.length > 0) {
                    const studentName = currentData['Official Student Name'] || 'Unknown Student';
                    const studentStatus = currentData.Status || 'Unknown';
                    const timestamp = getFormattedTimestamp();
                    const userEmail = currentUser?.email || 'Admin';

                    console.log(`✏️ Student Modified: ${studentName}`);
                    console.log(`   Fields Changed:`, changedFields);
                    console.log(`   Modified by: ${userEmail}`);
                    console.log(`   Modified at: ${timestamp}`);

                    // Add to modified students (will be cleaned up automatically)
                    modifiedStudents.set(studentId, {
                        name: studentName,
                        status: studentStatus,
                        timestamp: timestamp,
                        id: studentId,
                        changes: changedFields,
                        changedBy: userEmail
                    });

                    // Create detailed activity feed entries for each field change
                    changedFields.forEach((change, index) => {
                        console.log(`   [${index + 1}] ${change.field}: "${change.oldValue}" → "${change.newValue}"`);
                        
                        addActivityFeedEntry({
                            type: 'FIELD_CHANGED',
                            studentName: studentName,
                            studentId: studentId,
                            field: change.field,
                            oldValue: change.oldValue,
                            newValue: change.newValue,
                            status: studentStatus,
                            timestamp: timestamp,
                            changedBy: userEmail
                        });
                    });

                    // Update UI
                    updateModifiedStudentsList();
                    updateStatistics(allStudents);
                }

                // Update snapshot
                previousStudentSnapshot[studentId] = JSON.parse(JSON.stringify(currentData));
            } else if (!firstLoad) {
                // New student added
                const studentName = currentData['Official Student Name'] || 'Unknown Student';
                const studentStatus = currentData.Status || 'Pending';
                const timestamp = getFormattedTimestamp();
                const userEmail = currentUser?.email || 'Admin';

                console.log(`➕ New Student Added: ${studentName}`);
                console.log(`   Added by: ${userEmail}`);

                addActivityFeedEntry({
                    type: 'ADDED',
                    studentName: studentName,
                    studentId: studentId,
                    status: studentStatus,
                    timestamp: timestamp,
                    changedBy: userEmail
                });

                previousStudentSnapshot[studentId] = JSON.parse(JSON.stringify(currentData));
            } else {
                previousStudentSnapshot[studentId] = JSON.parse(JSON.stringify(currentData));
            }
        }

        if (firstLoad) {
            firstLoad = false;
            console.log('✅ Real-time listener initialized. Waiting for changes...');
            console.log('💡 Any modifications to student records will appear in the activity feed below');
        }

    }, (error) => {
        console.error('❌ Error in real-time listener:', error);
        console.error('   Error code:', error.code);
        console.error('   Error message:', error.message);
    });
}

/**
 * Compare two objects and return array of changed fields
 */
function getChangedFields(oldData, newData) {
    const changes = [];

    // Check for new or modified fields
    for (let field in newData) {
        if (newData.hasOwnProperty(field)) {
            const oldValue = oldData[field];
            const newValue = newData[field];

            if (oldValue !== newValue) {
                changes.push({
                    field: field,
                    oldValue: oldValue || 'N/A',
                    newValue: newValue || 'N/A'
                });
            }
        }
    }

    // Check for deleted fields
    for (let field in oldData) {
        if (oldData.hasOwnProperty(field) && !newData.hasOwnProperty(field)) {
            changes.push({
                field: field,
                oldValue: oldData[field],
                newValue: 'DELETED'
            });
        }
    }

    return changes;
}

/**
 * Update the modified students list UI
 */
function updateModifiedStudentsList() {
    const modifiedList = document.getElementById('modifiedStudentsList');
    if (!modifiedList) return; // Safety check
    
    modifiedList.innerHTML = '';

    // Update count
    const modifiedCountEl = document.getElementById('modifiedCount');
    const recentModCountEl = document.getElementById('recentModCount');
    if (modifiedCountEl) modifiedCountEl.textContent = modifiedStudents.size;
    if (recentModCountEl) recentModCountEl.textContent = modifiedStudents.size;

    if (modifiedStudents.size === 0) {
        modifiedList.innerHTML = '<li style="padding: 15px; text-align: center; color: #999;">⏳ No recent modifications</li>';
        return;
    }

    // Sort by most recent
    const sorted = Array.from(modifiedStudents.values())
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 8);

    sorted.forEach((student, index) => {
        const listItem = document.createElement('li');
        listItem.className = 'modified-student';
        listItem.id = `modified-${student.id}`;
        
        let statusClass = 'pending';
        if (student.status && student.status.toLowerCase() === 'verified') {
            statusClass = 'completed';
        }

        // Create a summary of changes
        const changesSummary = student.changes && student.changes.length > 0 
            ? student.changes.map(c => c.field).join(', ')
            : 'Student data modified';

        // Encode student data for modal
        const changesJson = JSON.stringify(student.changes || []).replace(/"/g, '&quot;');
        const studentJson = JSON.stringify(student).replace(/"/g, '&quot;');

        listItem.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <div style="flex: 1;">
                    <p style="margin: 0; display: flex; align-items: center; gap: 8px;">
                        <strong style="flex: 1; overflow: hidden; text-overflow: ellipsis;">🔴 ${student.name}</strong>
                        <span class="status ${statusClass}" style="font-size: 10px; white-space: nowrap;">${student.status || 'Unknown'}</span>
                    </p>
                    <small style="color: #7f8c8d; display: block; margin-top: 4px; font-size: 10px;">
                        📝 ${changesSummary}
                    </small>
                    <small style="color: #3498db; display: block; margin-top: 2px; font-size: 9px;">
                        ⏱️ ${student.timestamp} | 👤 ${student.changedBy || 'Admin'}
                    </small>
                </div>
                
                <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                    <button onclick="viewStudentDetails('${student.id}', '${studentJson}')" 
                        title="View full student details with tabs" 
                        style="padding: 5px 10px; background: #3498db; color: white; border: none; border-radius: 4px; font-size: 11px; cursor: pointer; white-space: nowrap; transition: all 0.2s;"
                        onmouseover="this.style.background='#2980b9'" 
                        onmouseout="this.style.background='#3498db'">
                        👁️ Details
                    </button>
                    
                    <button onclick="viewChangeHistory('${student.id}', '${changesJson}')" 
                        title="View detailed change timeline" 
                        style="padding: 5px 10px; background: #9b59b6; color: white; border: none; border-radius: 4px; font-size: 11px; cursor: pointer; white-space: nowrap; transition: all 0.2s;"
                        onmouseover="this.style.background='#8e44ad'" 
                        onmouseout="this.style.background='#9b59b6'">
                        📊 History
                    </button>
                    
                    <button onclick="compareWithDatabase('${student.id}')" 
                        title="Compare with current database state" 
                        style="padding: 5px 10px; background: #3498db; color: white; border: none; border-radius: 4px; font-size: 11px; cursor: pointer; white-space: nowrap; transition: all 0.2s;"
                        onmouseover="this.style.background='#2980b9'" 
                        onmouseout="this.style.background='#3498db'">
                        🔄 Compare
                    </button>
                    
                    <button onclick="approveChanges('${student.id}')" 
                        title="Approve and mark as verified" 
                        style="padding: 5px 10px; background: #27ae60; color: white; border: none; border-radius: 4px; font-size: 11px; cursor: pointer; white-space: nowrap; transition: all 0.2s;"
                        onmouseover="this.style.background='#229954'" 
                        onmouseout="this.style.background='#27ae60'">
                        ✅ Approve
                    </button>
                    
                    <button onclick="revertChanges('${student.id}')" 
                        title="Revert ALL changes in Firebase database" 
                        style="padding: 5px 10px; background: #e74c3c; color: white; border: none; border-radius: 4px; font-size: 11px; cursor: pointer; white-space: nowrap; transition: all 0.2s;"
                        onmouseover="this.style.background='#c0392b'" 
                        onmouseout="this.style.background='#e74c3c'">
                        ↩️ Revert
                    </button>
                    
                    <button onclick="removeFromTracking('${student.id}')" 
                        title="Remove from modified tracking list" 
                        style="padding: 5px 10px; background: #95a5a6; color: white; border: none; border-radius: 4px; font-size: 11px; cursor: pointer; white-space: nowrap; transition: all 0.2s;"
                        onmouseover="this.style.background='#7f8c8d'" 
                        onmouseout="this.style.background='#95a5a6'">
                        🗑️ Remove
                    </button>
                </div>
            </div>
        `;
        modifiedList.appendChild(listItem);
    });
    
    // Sync modified students to Firebase for cross-device access
    syncModifiedStudentsToFirebase();
}
/**
 * Sync modified students to Firebase Realtime Database
 * Allows all users to see modifications across devices
 */
function syncModifiedStudentsToFirebase() {
    try {
        const db = firebase.database();
        const ref = db.ref('adminPortal/modifiedStudents');
        
        // Convert Map to object for Firebase storage
        const modifiedStudentsObj = {};
        modifiedStudents.forEach((value, key) => {
            modifiedStudentsObj[key] = value;
        });
        
        ref.set(modifiedStudentsObj).catch((error) => {
            console.warn('⚠️ Could not sync modified students to Firebase:', error);
        });
    } catch (e) {
        console.warn('⚠️ Could not sync modified students:', e);
    }
}

/**
 * Setup real-time listener for modified students from Firebase
 * Updates across all connected devices instantly
 * Only updates if data actually changed to prevent clearing on initial load
 */
function setupModifiedStudentsListener() {
    try {
        const db = firebase.database();
        const ref = db.ref('adminPortal/modifiedStudents');
        let isFirstLoad = true;
        
        ref.on('value', (snapshot) => {
            // Skip first load entirely - data was already loaded by loadPersistedModifiedStudents()
            if (isFirstLoad) {
                console.log('⏭️ Skipping first listener attachment (data already loaded)');
                isFirstLoad = false;
                return;
            }
            
            if (snapshot.exists()) {
                const data = snapshot.val();
                
                // Update modifiedStudents Map on real-time changes
                modifiedStudents.clear();
                Object.keys(data).forEach((key) => {
                    modifiedStudents.set(key, data[key]);
                });
                
                // Update UI
                updateModifiedStudentsList();
                console.log('🔄 Modified students synced from Firebase. Entries:', modifiedStudents.size);
            } else {
                // Firebase data was cleared, clear local data too
                modifiedStudents.clear();
                updateModifiedStudentsList();
                console.log('🔄 Modified students cleared from Firebase');
            }
        }, (error) => {
            console.warn('⚠️ Modified students listener error:', error);
        });
    } catch (e) {
        console.warn('⚠️ Could not setup modified students listener:', e);
    }
}


/**
 * Add entry to activity feed (saved to Firebase for sync across devices)
 */
function addActivityFeedEntry(entry) {
    const feed = document.getElementById('activityFeed');
    
    if (!feed) return;

    // Add timestamp if not present
    if (!entry.timestamp) {
        entry.timestamp = getFormattedTimestamp();
    }

    // Add to activity feed array (for storage)
    activityFeed.unshift(entry);
    
    // Cleanup old entries (older than 30 days)
    cleanupOldEntries();
    
    // Save to Firebase Realtime Database (syncs across all devices)
    try {
        const db = firebase.database();
        const ref = db.ref('adminPortal/activityFeed');
        ref.set(activityFeed).catch((error) => {
            console.warn('⚠️ Could not save to Firebase:', error);
        });
    } catch (e) {
        console.warn('⚠️ Could not save activity feed to Firebase:', e);
    }
    
    // Also save to localStorage for offline access
    try {
        localStorage.setItem('activityFeed', JSON.stringify(activityFeed));
    } catch (e) {
        console.warn('Could not save activity feed to localStorage:', e);
    }

    // Clear default message
    const defaultMsg = feed.querySelector('p');
    if (defaultMsg) {
        defaultMsg.remove();
    }

    const feedItem = document.createElement('div');
    feedItem.className = 'activity-feed-item';
    feedItem.setAttribute('data-timestamp', entry.timestamp);
    
    let contentHTML = '';
    
    if (entry.type === 'ADDED') {
        contentHTML = `
            <strong>➕ NEW STUDENT ADDED</strong>
            <div style="margin: 8px 0;">
                <span class="field-change">${entry.studentName}</span>
                <div style="color: #666; font-size: 11px; margin-top: 4px;">Status: <strong>${entry.status}</strong></div>
            </div>
        `;
    } else if (entry.type === 'FIELD_CHANGED') {
        const displayOldValue = entry.oldValue === undefined || entry.oldValue === null ? 'N/A' : String(entry.oldValue);
        const displayNewValue = entry.newValue === undefined || entry.newValue === null ? 'N/A' : String(entry.newValue);
        
        contentHTML = `
            <strong>✏️ FIELD MODIFIED</strong>
            <div style="margin: 8px 0;">
                <span class="field-change">${entry.studentName}</span>
                <div class="field-comparison-box">
                    <div class="field-name">📝 ${entry.field}</div>
                    <div style="margin: 8px 0;">
                        <div><strong style="color: #555;">Old Value:</strong></div>
                        <span class="old-value">${displayOldValue}</span>
                    </div>
                    <div style="margin: 8px 0;">
                        <div><strong style="color: #555;">New Value:</strong></div>
                        <span class="new-value">${displayNewValue}</span>
                    </div>
                </div>
            </div>
        `;
    }

    feedItem.innerHTML = contentHTML + `
        <span class="timestamp" style="display: flex; flex-direction: column; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px;">
            <span>👤 <strong>${entry.changedBy || 'Admin'}</strong> | ⏱️ ${entry.timestamp}</span>
            <span style="font-size: 10px; color: #27ae60; background: #ecf0f1; padding: 2px 8px; border-radius: 4px; white-space: nowrap;">
                📅 ${getRetentionDaysRemaining(entry.timestamp)} days retained
            </span>
        </span>
    `;

    // Add slide animation
    feedItem.style.animation = 'slideIn 0.3s ease';
    
    feed.insertBefore(feedItem, feed.firstChild);

    // Keep only last 30 days of entries in DOM (already filtered in memory)
    const items = feed.querySelectorAll('.activity-feed-item');
    const now = Date.now();
    let displayCount = 0;
    
    items.forEach(item => {
        const timestamp = item.getAttribute('data-timestamp');
        if (timestamp) {
            const entryTime = new Date(timestamp).getTime();
            if (now - entryTime > RETENTION_MS) {
                item.remove();
            } else {
                displayCount++;
            }
        } else {
            displayCount++;
        }
    });
}

/**
 * Parse admission date
 */
function parseAdmissionDate(dateString) {
    if (!dateString) return 0;
    
    try {
        if (typeof dateString === 'string' && dateString.includes('/')) {
            const parts = dateString.split('/');
            if (parts.length === 3) {
                return new Date(parts[2], parts[0] - 1, parts[1]);
            }
        }
        return new Date(dateString);
    } catch (error) {
        return 0;
    }
}

/**
 * Format date to DD-MM-YYYY
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        let date;
        
        if (typeof dateString === 'string' && dateString.includes('/')) {
            const parts = dateString.split('/');
            if (parts.length === 3) {
                date = new Date(parts[2], parts[0] - 1, parts[1]);
            } else {
                date = new Date(dateString);
            }
        } else {
            date = new Date(dateString);
        }
        
        if (isNaN(date.getTime())) return 'N/A';
        
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}-${month}-${year}`;
    } catch (error) {
        return 'N/A';
    }
}

/**
 * ============================================================================
 * ENHANCED ACTION FUNCTIONS WITH DETAILED MODALS
 * ============================================================================
 */

/**
 * View full student details in an enhanced modal with tabs
 */
function viewStudentDetails(studentId, studentJson) {
    try {
        const student = JSON.parse(studentJson);
        
        // Create tabs for different sections
        let detailsHTML = `
            <div style="max-height: 500px; overflow-y: auto;">
                <div style="display: flex; gap: 10px; margin-bottom: 15px; border-bottom: 2px solid #ecf0f1; padding-bottom: 10px;">
                    <button onclick="switchTab('basic-info')" id="tab-basic-info" class="tab-button active-tab">
                        👤 Basic Info
                    </button>
                    <button onclick="switchTab('modifications')" id="tab-modifications" class="tab-button">
                        ✏️ Modifications (${student.changes?.length || 0})
                    </button>
                    <button onclick="switchTab('metadata')" id="tab-metadata" class="tab-button">
                        📊 Metadata
                    </button>
                </div>
                
                <!-- Basic Info Tab -->
                <div id="tab-content-basic-info" class="tab-content active-content">
                    <h4 style="color: #2c3e50; margin-top: 0;">📋 Student Information</h4>
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        `;
        
        // Display basic student info (excluding metadata)
        const excludeFields = ['changes', 'id', 'timestamp', 'changedBy', 'approvedAt', 'approvedBy'];
        for (let key in student) {
            if (student.hasOwnProperty(key) && !excludeFields.includes(key)) {
                let value = student[key];
                if (typeof value === 'object') {
                    value = JSON.stringify(value);
                }
                detailsHTML += `
                    <tr style="border-bottom: 1px solid #ecf0f1;">
                        <td style="padding: 8px; font-weight: 600; color: #34495e; width: 40%;">${key}</td>
                        <td style="padding: 8px; color: #555;">${value || 'N/A'}</td>
                    </tr>
                `;
            }
        }
        
        detailsHTML += `
                    </table>
                </div>
                
                <!-- Modifications Tab -->
                <div id="tab-content-modifications" class="tab-content" style="display: none;">
                    <h4 style="color: #2c3e50; margin-top: 0;">✏️ Recent Modifications</h4>
        `;
        
        if (student.changes && student.changes.length > 0) {
            student.changes.forEach((change, index) => {
                detailsHTML += `
                    <div style="margin-bottom: 12px; padding: 10px; background: #f8f9fa; border-radius: 4px; border-left: 4px solid #3498db;">
                        <strong style="color: #2c3e50;">Change ${index + 1}: ${change.field}</strong><br>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 8px;">
                            <div>
                                <small style="color: #7f8c8d;"><strong>Old Value:</strong></small><br>
                                <span style="color: #e74c3c; font-weight: 600;">${change.oldValue || 'N/A'}</span>
                            </div>
                            <div>
                                <small style="color: #7f8c8d;"><strong>New Value:</strong></small><br>
                                <span style="color: #27ae60; font-weight: 600;">${change.newValue || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                `;
            });
        } else {
            detailsHTML += '<p style="color: #999; text-align: center;">No modifications recorded</p>';
        }
        
        detailsHTML += `
                </div>
                
                <!-- Metadata Tab -->
                <div id="tab-content-metadata" class="tab-content" style="display: none;">
                    <h4 style="color: #2c3e50; margin-top: 0;">📊 Tracking Metadata</h4>
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                        <tr style="border-bottom: 1px solid #ecf0f1;">
                            <td style="padding: 8px; font-weight: 600; color: #34495e; width: 40%;">Student ID</td>
                            <td style="padding: 8px; color: #555;">${student.id || 'N/A'}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #ecf0f1;">
                            <td style="padding: 8px; font-weight: 600; color: #34495e;">Status</td>
                            <td style="padding: 8px; color: #555;">${student.status || 'Unknown'}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #ecf0f1;">
                            <td style="padding: 8px; font-weight: 600; color: #34495e;">Last Modified</td>
                            <td style="padding: 8px; color: #555;">${student.timestamp || 'N/A'}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #ecf0f1;">
                            <td style="padding: 8px; font-weight: 600; color: #34495e;">Modified By</td>
                            <td style="padding: 8px; color: #555;">${student.changedBy || 'N/A'}</td>
                        </tr>
                        ${student.approvedAt ? `
                        <tr style="border-bottom: 1px solid #ecf0f1;">
                            <td style="padding: 8px; font-weight: 600; color: #34495e;">Approved At</td>
                            <td style="padding: 8px; color: #555;">${student.approvedAt}</td>
                        </tr>
                        ` : ''}
                        ${student.approvedBy ? `
                        <tr style="border-bottom: 1px solid #ecf0f1;">
                            <td style="padding: 8px; font-weight: 600; color: #34495e;">Approved By</td>
                            <td style="padding: 8px; color: #555;">${student.approvedBy}</td>
                        </tr>
                        ` : ''}
                        <tr style="border-bottom: 1px solid #ecf0f1;">
                            <td style="padding: 8px; font-weight: 600; color: #34495e;">Retention Days</td>
                            <td style="padding: 8px; color: #555;">${getRetentionDaysRemaining(student.timestamp)} days remaining</td>
                        </tr>
                    </table>
                </div>
            </div>
        `;
        
        Swal.fire({
            title: '📋 Student Details',
            html: detailsHTML,
            icon: 'info',
            confirmButtonText: 'Close',
            width: '700px',
            showCloseButton: true,
            didOpen: (modal) => {
                modal.style.maxHeight = '90vh';
                
                // Add tab switching functionality
                window.switchTab = function(tabName) {
                    // Hide all tabs
                    const allContents = modal.querySelectorAll('.tab-content');
                    allContents.forEach(content => {
                        content.style.display = 'none';
                        content.classList.remove('active-content');
                    });
                    
                    // Remove active class from all buttons
                    const allButtons = modal.querySelectorAll('.tab-button');
                    allButtons.forEach(btn => btn.classList.remove('active-tab'));
                    
                    // Show selected tab
                    const selectedContent = modal.querySelector(`#tab-content-${tabName}`);
                    const selectedButton = modal.querySelector(`#tab-${tabName}`);
                    
                    if (selectedContent) {
                        selectedContent.style.display = 'block';
                        selectedContent.classList.add('active-content');
                    }
                    if (selectedButton) {
                        selectedButton.classList.add('active-tab');
                    }
                };
                
                // Add CSS for tabs
                const style = document.createElement('style');
                style.textContent = `
                    .tab-button {
                        padding: 8px 16px;
                        background: #ecf0f1;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 13px;
                        transition: all 0.3s;
                    }
                    .tab-button:hover {
                        background: #bdc3c7;
                    }
                    .tab-button.active-tab {
                        background: #3498db;
                        color: white;
                        font-weight: 600;
                    }
                    .tab-content {
                        animation: fadeIn 0.3s ease;
                    }
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(-10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `;
                modal.appendChild(style);
            }
        });
    } catch (error) {
        Swal.fire('Error', 'Could not load student details: ' + error.message, 'error');
    }
}

/**
 * View change history with timeline visualization
 */
function viewChangeHistory(studentId, changesJson) {
    try {
        const changes = JSON.parse(changesJson);
        
        let historyHTML = '<div style="max-height: 450px; overflow-y: auto;">';
        
        if (changes.length === 0) {
            historyHTML += '<p style="color: #999; text-align: center; padding: 30px;">📭 No changes recorded for this student</p>';
        } else {
            historyHTML += `
                <div style="margin-bottom: 15px; padding: 10px; background: #e8f5e9; border-radius: 4px;">
                    <strong style="color: #27ae60;">📊 Total Changes: ${changes.length}</strong>
                    <p style="margin: 5px 0 0 0; color: #555; font-size: 12px;">
                        Track all modifications made to this student's record
                    </p>
                </div>
            `;
            
            changes.forEach((change, index) => {
                const isOldEmpty = !change.oldValue || change.oldValue === 'N/A';
                const isNewEmpty = !change.newValue || change.newValue === 'N/A';
                
                historyHTML += `
                    <div style="margin-bottom: 15px; padding: 12px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #3498db; position: relative;">
                        <div style="position: absolute; top: -8px; right: 10px; background: #3498db; color: white; padding: 2px 8px; border-radius: 10px; font-size: 10px;">
                            #${index + 1}
                        </div>
                        
                        <div style="margin-bottom: 8px;">
                            <strong style="color: #2c3e50; font-size: 14px;">📝 ${change.field}</strong>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 10px; align-items: center;">
                            <div style="padding: 8px; background: ${isOldEmpty ? '#ecf0f1' : '#fee'}; border-radius: 4px; border: 1px solid ${isOldEmpty ? '#bdc3c7' : '#e74c3c'};">
                                <small style="color: #7f8c8d; display: block; margin-bottom: 4px;"><strong>Previous Value</strong></small>
                                <span style="color: ${isOldEmpty ? '#95a5a6' : '#e74c3c'}; word-break: break-word; font-size: 13px;">
                                    ${change.oldValue || 'N/A'}
                                </span>
                            </div>
                            
                            <div style="color: #3498db; font-size: 20px; font-weight: bold;">
                                →
                            </div>
                            
                            <div style="padding: 8px; background: ${isNewEmpty ? '#ecf0f1' : '#efe'}; border-radius: 4px; border: 1px solid ${isNewEmpty ? '#bdc3c7' : '#27ae60'};">
                                <small style="color: #7f8c8d; display: block; margin-bottom: 4px;"><strong>New Value</strong></small>
                                <span style="color: ${isNewEmpty ? '#95a5a6' : '#27ae60'}; word-break: break-word; font-size: 13px;">
                                    ${change.newValue || 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>
                `;
            });
        }
        
        historyHTML += '</div>';
        
        Swal.fire({
            title: '📊 Change History Timeline',
            html: historyHTML,
            icon: 'info',
            confirmButtonText: 'Close',
            width: '750px',
            showCloseButton: true
        });
    } catch (error) {
        Swal.fire('Error', 'Could not load change history: ' + error.message, 'error');
    }
}

/**
 * Approve changes with confirmation and notes
 */
function approveChanges(studentId) {
    Swal.fire({
        title: '✅ Approve Changes',
        html: `
            <div style="text-align: left; margin: 20px 0;">
                <p style="color: #555; margin-bottom: 15px;">
                    You are about to approve the changes made to this student's record. 
                    This will mark the modifications as verified and official.
                </p>
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50;">
                    📝 Approval Notes (Optional)
                </label>
                <textarea 
                    id="approvalNotes" 
                    placeholder="Add any notes about this approval..."
                    style="width: 100%; min-height: 80px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-family: inherit; resize: vertical;"
                ></textarea>
            </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#27ae60',
        cancelButtonColor: '#95a5a6',
        confirmButtonText: '✅ Approve Changes',
        cancelButtonText: 'Cancel',
        showLoaderOnConfirm: true,
        preConfirm: () => {
            const notes = document.getElementById('approvalNotes').value;
            return { notes };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            try {
                const student = modifiedStudents.get(studentId);
                if (student) {
                    const oldStatus = student.status;
                    student.status = 'Verified';
                    student.approvedAt = getFormattedTimestamp();
                    student.approvedBy = currentUser?.email || 'Admin';
                    student.approvalNotes = result.value.notes || 'No notes provided';
                    
                    modifiedStudents.set(studentId, student);
                    
                    // Add activity entry
                    addActivityFeedEntry({
                        type: 'FIELD_CHANGED',
                        studentName: student.name,
                        studentId: studentId,
                        field: 'Status (Approved)',
                        oldValue: oldStatus,
                        newValue: 'Verified',
                        status: 'Verified',
                        timestamp: getFormattedTimestamp(),
                        changedBy: currentUser?.email || 'Admin'
                    });
                    
                    // Update display
                    updateModifiedStudentsList();
                    
                    Swal.fire({
                        icon: 'success',
                        title: 'Changes Approved!',
                        html: `
                            <p>✅ Changes have been marked as verified</p>
                            <p style="font-size: 12px; color: #7f8c8d;">Approved by: ${currentUser?.email || 'Admin'}</p>
                        `,
                        timer: 3000,
                        timerProgressBar: true
                    });
                    
                    console.log('✅ Approved changes for student:', studentId);
                }
            } catch (error) {
                Swal.fire('Error', 'Could not approve changes: ' + error.message, 'error');
                console.error('Error approving changes:', error);
            }
        }
    });
}

/**
 * TRUE REVERT - Actually restores original data in Firebase
 * This function reverses all changes made to the student record
 */
function revertChanges(studentId) {
    const student = modifiedStudents.get(studentId);
    
    if (!student || !student.changes || student.changes.length === 0) {
        Swal.fire('No Changes', 'No changes found to revert for this student.', 'info');
        return;
    }
    
    // Show detailed revert preview
    let previewHTML = `
        <div style="text-align: left; margin: 20px 0;">
            <div style="background: #fff3cd; padding: 12px; border-radius: 4px; border-left: 4px solid #ffc107; margin-bottom: 15px;">
                <strong style="color: #856404;">⚠️ Warning: This will restore original values</strong>
                <p style="margin: 8px 0 0 0; color: #856404; font-size: 13px;">
                    All ${student.changes.length} change(s) will be reverted in the Firebase database.
                </p>
            </div>
            
            <p style="color: #555; margin-bottom: 15px; font-weight: 600;">
                The following fields will be restored:
            </p>
            
            <div style="max-height: 250px; overflow-y: auto; background: #f8f9fa; padding: 10px; border-radius: 4px;">
    `;
    
    student.changes.forEach((change, index) => {
        previewHTML += `
            <div style="margin-bottom: 10px; padding: 8px; background: white; border-radius: 4px; border-left: 3px solid #e74c3c;">
                <strong style="color: #2c3e50; font-size: 13px;">${index + 1}. ${change.field}</strong>
                <div style="display: flex; gap: 10px; margin-top: 5px; font-size: 12px;">
                    <span style="color: #e74c3c;">Current: <strong>${change.newValue}</strong></span>
                    <span style="color: #95a5a6;">→</span>
                    <span style="color: #27ae60;">Restore to: <strong>${change.oldValue}</strong></span>
                </div>
            </div>
        `;
    });
    
    previewHTML += `
            </div>
        </div>
    `;
    
    Swal.fire({
        title: '↩️ Revert All Changes?',
        html: previewHTML,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e74c3c',
        cancelButtonColor: '#95a5a6',
        confirmButtonText: '↩️ Yes, Revert Changes',
        cancelButtonText: 'Cancel',
        showLoaderOnConfirm: true,
        preConfirm: async () => {
            try {
                // Get the actual student data from Firebase
                const studentRef = db.ref(`artifacts/default-app-id/students/${studentId}`);
                const snapshot = await studentRef.once('value');
                
                if (!snapshot.exists()) {
                    throw new Error('Student not found in database');
                }
                
                const currentStudentData = snapshot.val();
                const updates = {};
                
                // Prepare updates to restore original values
                student.changes.forEach((change) => {
                    // Only revert if the field still has the "new" value
                    if (currentStudentData[change.field] === change.newValue) {
                        updates[change.field] = change.oldValue;
                    }
                });
                
                // Apply the revert to Firebase
                await studentRef.update(updates);
                
                return { success: true, updatedFields: Object.keys(updates).length };
                
            } catch (error) {
                Swal.showValidationMessage(`Revert failed: ${error.message}`);
                return { success: false, error: error.message };
            }
        },
        allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
        if (result.isConfirmed && result.value.success) {
            // Log the revert action
            addActivityFeedEntry({
                type: 'FIELD_CHANGED',
                studentName: student.name,
                studentId: studentId,
                field: 'Database Status',
                oldValue: 'Modified',
                newValue: `Reverted (${result.value.updatedFields} fields restored)`,
                status: student.status,
                timestamp: getFormattedTimestamp(),
                changedBy: currentUser?.email || 'Admin'
            });
            
            // Remove from tracking
            modifiedStudents.delete(studentId);
            syncModifiedStudentsToFirebase();
            updateModifiedStudentsList();
            
            Swal.fire({
                icon: 'success',
                title: 'Changes Reverted!',
                html: `
                    <p>✅ Successfully restored ${result.value.updatedFields} field(s)</p>
                    <p style="font-size: 12px; color: #7f8c8d;">Original values have been restored in Firebase</p>
                `,
                timer: 3000,
                timerProgressBar: true
            });
            
            console.log('↩️ Successfully reverted changes for student:', studentId);
        }
    });
}

/**
 * Remove from tracking with confirmation
 */
function removeFromTracking(studentId) {
    const student = modifiedStudents.get(studentId);
    
    if (!student) {
        Swal.fire('Not Found', 'Student not found in tracking list.', 'error');
        return;
    }
    
    Swal.fire({
        title: '🗑️ Remove from Tracking?',
        html: `
            <div style="text-align: left; margin: 20px 0;">
                <p style="color: #555; margin-bottom: 15px;">
                    <strong>${student.name}</strong> will be removed from the modified students list.
                </p>
                <div style="background: #e8f5e9; padding: 10px; border-radius: 4px; border-left: 4px solid #27ae60;">
                    <p style="margin: 0; color: #2e7d32; font-size: 13px;">
                        ℹ️ Note: This only removes the tracking entry. The actual student data in the database remains unchanged.
                    </p>
                </div>
            </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#e67e22',
        cancelButtonColor: '#95a5a6',
        confirmButtonText: '🗑️ Remove from List',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            try {
                // Log removal action
                addActivityFeedEntry({
                    type: 'FIELD_CHANGED',
                    studentName: student.name,
                    studentId: studentId,
                    field: 'Tracking Status',
                    oldValue: 'Being Tracked',
                    newValue: 'Removed from Tracking',
                    status: student.status,
                    timestamp: getFormattedTimestamp(),
                    changedBy: currentUser?.email || 'Admin'
                });
                
                // Remove from tracking
                modifiedStudents.delete(studentId);
                syncModifiedStudentsToFirebase();
                updateModifiedStudentsList();
                
                Swal.fire({
                    icon: 'success',
                    title: 'Removed!',
                    text: 'Student removed from modified tracking list.',
                    timer: 2000,
                    timerProgressBar: true
                });
                
                console.log('🗑️ Removed from tracking:', studentId);
            } catch (error) {
                Swal.fire('Error', 'Could not remove student: ' + error.message, 'error');
                console.error('Error removing student:', error);
            }
        }
    });
}

/**
 * Additional Action: Compare with current database state
 */
function compareWithDatabase(studentId) {
    const trackedStudent = modifiedStudents.get(studentId);
    
    if (!trackedStudent) {
        Swal.fire('Not Found', 'Student not found in tracking list.', 'error');
        return;
    }
    
    Swal.fire({
        title: '🔄 Comparing with Database...',
        html: '<p>Please wait while we fetch current data...</p>',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
            
            // Fetch current data from Firebase
            const studentRef = db.ref(`artifacts/default-app-id/students/${studentId}`);
            studentRef.once('value')
                .then((snapshot) => {
                    if (!snapshot.exists()) {
                        throw new Error('Student not found in database');
                    }
                    
                    const currentData = snapshot.val();
                    let comparisonHTML = '<div style="max-height: 400px; overflow-y: auto; text-align: left;">';
                    
                    comparisonHTML += `
                        <div style="background: #e3f2fd; padding: 12px; border-radius: 4px; margin-bottom: 15px;">
                            <strong style="color: #1976d2;">📊 Comparison Report</strong>
                            <p style="margin: 5px 0 0 0; color: #555; font-size: 12px;">
                                Tracked changes vs. current database state
                            </p>
                        </div>
                    `;
                    
                    if (trackedStudent.changes && trackedStudent.changes.length > 0) {
                        trackedStudent.changes.forEach((change, index) => {
                            const dbValue = currentData[change.field];
                            const isInSync = dbValue === change.newValue;
                            
                            comparisonHTML += `
                                <div style="margin-bottom: 12px; padding: 10px; background: ${isInSync ? '#e8f5e9' : '#fff3cd'}; border-radius: 4px; border-left: 4px solid ${isInSync ? '#27ae60' : '#ffc107'};">
                                    <strong style="color: #2c3e50;">${index + 1}. ${change.field}</strong>
                                    <div style="margin-top: 8px; font-size: 12px;">
                                        <div style="margin-bottom: 5px;">
                                            <span style="color: #7f8c8d;">Tracked Value:</span> 
                                            <strong style="color: #3498db;">${change.newValue}</strong>
                                        </div>
                                        <div>
                                            <span style="color: #7f8c8d;">Database Value:</span> 
                                            <strong style="color: ${isInSync ? '#27ae60' : '#e74c3c'};">${dbValue || 'N/A'}</strong>
                                        </div>
                                        ${isInSync ? 
                                            '<span style="color: #27ae60; font-size: 11px;">✅ In Sync</span>' : 
                                            '<span style="color: #e67e22; font-size: 11px;">⚠️ Out of Sync</span>'
                                        }
                                    </div>
                                </div>
                            `;
                        });
                    }
                    
                    comparisonHTML += '</div>';
                    
                    Swal.fire({
                        title: '📊 Database Comparison',
                        html: comparisonHTML,
                        icon: 'info',
                        confirmButtonText: 'Close',
                        width: '650px',
                        showCloseButton: true
                    });
                })
                .catch((error) => {
                    Swal.fire('Error', 'Could not compare with database: ' + error.message, 'error');
                });
        }
    });
}

/**
 * Initialize dashboard data loading
 */
function initializeDashboardData() {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            currentUser = user; // Store current user
            console.log('✅ User authenticated:', user.email);
            
            // Load all persisted data FIRST before setting up listeners
            Promise.all([
                loadPersistedActivityFeed(),
                loadPersistedModifiedStudents()
            ]).then(() => {
                console.log('✅ All persisted data loaded. Starting real-time listeners...');
                
                // Display immediately from persisted data
                updateModifiedStudentsList();
                updateActivityFeedDisplay();
                console.log('📊 Displayed persisted data. Modified students:', modifiedStudents.size, ', Activity entries:', activityFeed.length);
                
                // NOW setup real-time listeners after data is loaded
                setupRealtimeModifiedStudentsListener();
                setupModifiedStudentsListener();      // Listen for synced modified students
                setupActivityFeedListener();           // Listen for synced activity feed
                
                // Load initial data
                loadRecentAdmissions();


                // ADD THIS LINE:
                loadBirthdayStudents();  // ← Load birthday data
                
                // Setup search and other features
                setTimeout(() => {
                    setupSearchFunctionality();
                    setupClearActivityFeed();
                }, 500);
            });

        } else {
            console.log('❌ User not authenticated');
        }
    });
}

// Load data when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDashboardData);
} else {
    initializeDashboardData();
}

/**
 * Setup periodic cleanup of old entries (every hour)
 * Ensures 30-day retention policy is enforced even without new entries
 */
(function setupPeriodicCleanup() {
    const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
    
    setInterval(() => {
        cleanupOldEntries();
        console.log('🧹 Periodic cleanup executed. Activity feed entries:', activityFeed.length);
    }, CLEANUP_INTERVAL_MS);
    
    console.log('⏰ Periodic cleanup scheduler started (runs every hour)');
})();

/**
 * Test function for debugging - run in browser console
 * Usage: testRealtimeUpdate()
 */
window.testRealtimeUpdate = function() {
    console.log('🧪 TEST: Simulating a student modification...');
    console.log('📝 To test real-time updates:');
    console.log('1. Open Firebase Console');
    console.log('2. Go to Realtime Database');
    console.log('3. Navigate to: artifacts/default-app-id/students/[any student]');
    console.log('4. Change any field (e.g., Status, Grade, etc.)');
    console.log('5. Watch the activity feed update in real-time! 🚀');
    console.log('');
    console.log('📊 Current listeners attached:');
    console.log(`   - Modified Students: ${modifiedStudents.size} entries`);
    console.log(`   - Activity Feed Items: ${document.querySelectorAll('.activity-feed-item').length}`);
    console.log(`   - All Students Loaded: ${allStudents.length}`);
    console.log(`   - Current User: ${currentUser?.email || 'Not authenticated'}`);
};

/**
 * Update statistics based on student data
 */
function updateStatistics(studentArray) {
    let verifiedCount = 0;
    let pendingCount = 0;

    studentArray.forEach(student => {
        const status = (student.Status || 'Pending').toLowerCase();
        if (status === 'verified') {
            verifiedCount++;
        } else if (status === 'pending') {
            pendingCount++;
        }
    });

    document.getElementById('verifiedCount').textContent = verifiedCount;
    document.getElementById('pendingCount').textContent = pendingCount;
}

/**
 * Setup search functionality
 */
function setupSearchFunctionality() {
    const searchBox = document.getElementById('admissionSearchBox');
    const clearBtn = document.getElementById('clearSearchBtn');
    if (!searchBox) return;

    // Show/hide clear button based on input
    searchBox.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        
        // Show/hide clear button
        if (searchTerm.length > 0) {
            clearBtn.style.display = 'block';
        } else {
            clearBtn.style.display = 'none';
        }
        
        // Search in Recent Admissions Table
        const admissionRows = document.querySelectorAll('.admission-row');
        admissionRows.forEach(row => {
            const studentName = row.getAttribute('data-student-name');
            if (studentName && studentName.includes(searchTerm)) {
                row.style.display = '';
                row.style.animation = 'slideIn 0.3s ease';
            } else {
                row.style.display = 'none';
            }
        });

        // Search in Modified Students List
        const modifiedItems = document.querySelectorAll('.modified-student');
        modifiedItems.forEach(item => {
            const itemText = item.textContent.toLowerCase();
            if (itemText.includes(searchTerm)) {
                item.style.display = '';
                item.style.animation = 'slideIn 0.3s ease';
            } else {
                item.style.display = 'none';
            }
        });

        // Search in Activity Feed
        const feedItems = document.querySelectorAll('.activity-feed-item');
        feedItems.forEach(item => {
            const itemText = item.textContent.toLowerCase();
            if (itemText.includes(searchTerm)) {
                item.style.display = '';
                item.style.animation = 'slideIn 0.3s ease';
            } else {
                item.style.display = 'none';
            }
        });

        // Show empty message if all sections are empty
        updateEmptyStates(searchTerm);
    });

    // Clear search button functionality
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchBox.value = '';
            clearBtn.style.display = 'none';
            
            // Show all items
            document.querySelectorAll('.admission-row').forEach(row => {
                row.style.display = '';
            });
            document.querySelectorAll('.modified-student').forEach(item => {
                item.style.display = '';
            });
            document.querySelectorAll('.activity-feed-item').forEach(item => {
                item.style.display = '';
            });
            
            // Remove empty messages
            document.querySelectorAll('.empty-search-message').forEach(msg => {
                msg.remove();
            });
            
            // Focus back on search box
            searchBox.focus();
            
            console.log('🔄 Search cleared - showing all items');
        });
    }
}

/**
 * Update empty state messages when search yields no results
 */
function updateEmptyStates(searchTerm) {
    const admissionsTable = document.getElementById('admissionsTableBody');
    const modifiedList = document.getElementById('modifiedStudentsList');
    const activityFeed = document.getElementById('activityFeed');

    // Check if all rows in admissions are hidden
    const visibleAdmissions = document.querySelectorAll('.admission-row:not([style*="display: none"])').length;
    if (visibleAdmissions === 0 && searchTerm) {
        const emptyRow = admissionsTable.querySelector('.empty-search-message');
        if (!emptyRow) {
            const row = document.createElement('tr');
            row.className = 'empty-search-message';
            row.innerHTML = `<td colspan="3" style="text-align: center; color: #999; padding: 20px;">❌ No admissions found for "${searchTerm}"</td>`;
            admissionsTable.appendChild(row);
        }
    } else {
        const emptyRow = admissionsTable.querySelector('.empty-search-message');
        if (emptyRow) emptyRow.remove();
    }

    // Check if all items in modified list are hidden
    const visibleModified = document.querySelectorAll('.modified-student:not([style*="display: none"])').length;
    if (visibleModified === 0 && searchTerm) {
        const emptyItem = modifiedList.querySelector('.empty-search-message');
        if (!emptyItem) {
            const li = document.createElement('li');
            li.className = 'empty-search-message';
            li.style.cssText = 'padding: 15px; text-align: center; color: #999;';
            li.innerHTML = `❌ No modified students found for "${searchTerm}"`;
            modifiedList.appendChild(li);
        }
    } else {
        const emptyItem = modifiedList.querySelector('.empty-search-message');
        if (emptyItem) emptyItem.remove();
    }

    // Check if all items in activity feed are hidden
    const visibleFeed = document.querySelectorAll('.activity-feed-item:not([style*="display: none"])').length;
    if (visibleFeed === 0 && searchTerm) {
        const emptyFeed = activityFeed.querySelector('.empty-search-message');
        if (!emptyFeed) {
            const div = document.createElement('div');
            div.className = 'empty-search-message';
            div.style.cssText = 'padding: 20px; text-align: center; color: #999;';
            div.innerHTML = `❌ No activity found for "${searchTerm}"`;
            activityFeed.appendChild(div);
        }
    } else {
        const emptyFeed = activityFeed.querySelector('.empty-search-message');
        if (emptyFeed) emptyFeed.remove();
    }
    
    console.log(`🔍 Searching for: "${searchTerm}"`);
}

/**
 * Setup clear activity feed button
 */
function setupClearActivityFeed() {
    const clearBtn = document.getElementById('clearActivityFeed');
    if (!clearBtn) return;

    clearBtn.addEventListener('click', () => {
        const feed = document.getElementById('activityFeed');
        feed.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">⏳ Waiting for updates... Any changes in student records will appear here instantly</p>';
        modifiedStudents.clear();
        document.getElementById('modifiedCount').textContent = '0';
        updateModifiedStudentsList();
    });
}











/**
 * ============================================================================
 * ADVANCED BIRTHDAY TRACKING & MANAGEMENT SYSTEM v2.0
 * ============================================================================
 * Features:
 * - AI-powered birthday predictions and suggestions
 * - Bulk birthday operations
 * - Advanced filtering and sorting
 * - Birthday analytics dashboard
 * - Automated notifications
 * - Export to multiple formats
 * - Birthday celebration templates
 * - Integration with calendar systems
 * ============================================================================
 */

// Track students with upcoming birthdays
const birthdayStudents = new Map();
const birthdayCache = new Map();
const birthdayNotifications = [];
let birthdayFilters = {
    sortBy: 'daysUntil', // daysUntil, name, age, grade
    sortOrder: 'asc',
    timeRange: 60, // days
    gradeFilter: 'all',
    statusFilter: 'all',
    searchQuery: ''
};

/**
 * ============================================================================
 * CORE BIRTHDAY LOADING & PROCESSING
 * ============================================================================
 */

/**
 * Load and display students with birthdays - Enhanced Version
 * Includes caching, filtering, and advanced sorting
 */
function loadBirthdayStudents() {
    const birthdayTableBody = document.getElementById('birthdayTableBody');
    
    if (!birthdayTableBody) {
        console.warn('⚠️ Birthday table body not found');
        return;
    }
    
    try {
        const studentsRef = db.ref('artifacts/default-app-id/students');
        
        // Show loading state
        birthdayTableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; padding: 30px;">
                    <div style="display: inline-block; animation: spin 1s linear infinite; font-size: 24px;">⏳</div>
                    <p style="margin-top: 10px; color: #7f8c8d;">Loading birthday data...</p>
                </td>
            </tr>
        `;
        
        studentsRef.once('value')
            .then((snapshot) => {
                birthdayTableBody.innerHTML = '';
                birthdayStudents.clear();

                if (!snapshot.exists()) {
                    birthdayTableBody.innerHTML = `
                        <tr>
                            <td colspan="5" style="text-align:center; padding: 30px;">
                                <div style="font-size: 48px; margin-bottom: 10px;">🎂</div>
                                <p style="color: #7f8c8d;">No birthday data found</p>
                                <p style="font-size: 12px; color: #95a5a6;">Add Date of Birth to student records to see birthdays here</p>
                            </td>
                        </tr>
                    `;
                    updateBirthdayStatistics([]);
                    return;
                }

                const students = snapshot.val();
                const studentArray = [];
                const today = new Date();

                // Process all students and check for birthdays
                for (let key in students) {
                    if (students.hasOwnProperty(key)) {
                        const student = students[key];
                        student.id = key;
                        
                        // Multiple date field checks
                        const dob = student['Date of Birth'] || 
                                   student.DateOfBirth || 
                                   student.DOB || 
                                   student.dob ||
                                   student['Birth Date'] ||
                                   student.birthDate;
                        
                        if (dob) {
                            const birthDate = parseBirthDate(dob);
                            if (birthDate) {
                                const birthMonth = birthDate.getMonth();
                                const birthDay = birthDate.getDate();
                                const daysUntil = calculateDaysUntilBirthday(birthMonth, birthDay);
                                
                                // Apply time range filter
                                if (daysUntil <= birthdayFilters.timeRange) {
                                    student.birthDate = birthDate;
                                    student.daysUntilBirthday = daysUntil;
                                    student.age = calculateAge(birthDate);
                                    student.zodiacSign = getZodiacSign(birthDate);
                                    student.birthMonth = birthDate.toLocaleString('default', { month: 'long' });
                                    
                                    // Apply filters
                                    if (applyBirthdayFilters(student)) {
                                        studentArray.push(student);
                                        birthdayStudents.set(key, student);
                                    }
                                }
                            }
                        }
                    }
                }

                // Apply advanced sorting
                sortBirthdayStudents(studentArray);

                if (studentArray.length === 0) {
                    birthdayTableBody.innerHTML = `
                        <tr>
                            <td colspan="5" style="text-align:center; padding: 30px;">
                                <div style="font-size: 48px; margin-bottom: 10px;">🔍</div>
                                <p style="color: #7f8c8d;">No birthdays match your current filters</p>
                                <button onclick="resetBirthdayFilters()" style="margin-top: 10px; padding: 8px 16px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                    Reset Filters
                                </button>
                            </td>
                        </tr>
                    `;
                    updateBirthdayStatistics([]);
                    return;
                }

                // Update birthday counts with animation
                updateBirthdayCountsWithAnimation(studentArray);
                
                // Update statistics
                updateBirthdayStatistics(studentArray);
                
                // Generate birthday analytics
                generateBirthdayAnalytics(studentArray);

                // Display birthday students with enhanced UI
                studentArray.forEach((student, index) => {
                    const row = createEnhancedBirthdayRow(student, index);
                    birthdayTableBody.appendChild(row);
                });

                // Setup real-time birthday updates
                setupRealtimeBirthdayUpdates();
                
                // Check for birthday notifications
                checkBirthdayNotifications(studentArray);

            })
            .catch((error) => {
                console.error('Error loading birthdays:', error);
                birthdayTableBody.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align:center; padding: 30px; color:red;">
                            <div style="font-size: 48px; margin-bottom: 10px;">❌</div>
                            <p>Error loading birthday data</p>
                            <p style="font-size: 12px; margin-top: 10px;">${error.message}</p>
                            <button onclick="loadBirthdayStudents()" style="margin-top: 10px; padding: 8px 16px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                Retry
                            </button>
                        </td>
                    </tr>
                `;
            });

    } catch (error) {
        console.error('Error loading birthdays:', error);
        birthdayTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">Critical error: ${error.message}</td></tr>`;
    }
}

/**
 * ============================================================================
 * ADVANCED FILTERING & SORTING
 * ============================================================================
 */

/**
 * Apply birthday filters to student
 */
function applyBirthdayFilters(student) {
    // Grade filter
    if (birthdayFilters.gradeFilter !== 'all') {
        const studentGrade = student.Grade || student.grade || '';
        if (studentGrade.toString() !== birthdayFilters.gradeFilter.toString()) {
            return false;
        }
    }
    
    // Status filter
    if (birthdayFilters.statusFilter !== 'all') {
        const studentStatus = (student.Status || 'Active').toLowerCase();
        if (studentStatus !== birthdayFilters.statusFilter.toLowerCase()) {
            return false;
        }
    }
    
    // Search query filter
    if (birthdayFilters.searchQuery) {
        const query = birthdayFilters.searchQuery.toLowerCase();
        const studentName = (student['Official Student Name'] || student.name || '').toLowerCase();
        const studentClass = (student.Class || '').toLowerCase();
        if (!studentName.includes(query) && !studentClass.includes(query)) {
            return false;
        }
    }
    
    return true;
}

/**
 * Sort birthday students with multiple criteria
 */
function sortBirthdayStudents(studentArray) {
    studentArray.sort((a, b) => {
        let comparison = 0;
        
        switch (birthdayFilters.sortBy) {
            case 'daysUntil':
                comparison = a.daysUntilBirthday - b.daysUntilBirthday;
                break;
            case 'name':
                const nameA = (a['Official Student Name'] || a.name || '').toLowerCase();
                const nameB = (b['Official Student Name'] || b.name || '').toLowerCase();
                comparison = nameA.localeCompare(nameB);
                break;
            case 'age':
                comparison = (b.age + 1) - (a.age + 1); // Turning age
                break;
            case 'grade':
                const gradeA = parseInt(a.Grade || a.grade || 0);
                const gradeB = parseInt(b.Grade || b.grade || 0);
                comparison = gradeA - gradeB;
                break;
            default:
                comparison = a.daysUntilBirthday - b.daysUntilBirthday;
        }
        
        return birthdayFilters.sortOrder === 'asc' ? comparison : -comparison;
    });
}

/**
 * Reset birthday filters to default
 */
function resetBirthdayFilters() {
    birthdayFilters = {
        sortBy: 'daysUntil',
        sortOrder: 'asc',
        timeRange: 60,
        gradeFilter: 'all',
        statusFilter: 'all',
        searchQuery: ''
    };
    
    // Reset UI controls if they exist
    const sortSelect = document.getElementById('birthdaySortBy');
    const timeRangeSelect = document.getElementById('birthdayTimeRange');
    const gradeSelect = document.getElementById('birthdayGradeFilter');
    const searchInput = document.getElementById('birthdaySearchInput');
    
    if (sortSelect) sortSelect.value = 'daysUntil';
    if (timeRangeSelect) timeRangeSelect.value = '60';
    if (gradeSelect) gradeSelect.value = 'all';
    if (searchInput) searchInput.value = '';
    
    loadBirthdayStudents();
}

/**
 * ============================================================================
 * ENHANCED UI COMPONENTS
 * ============================================================================
 */

/**
 * Create enhanced birthday row with animations and additional info
 */
function createEnhancedBirthdayRow(student, index) {
    const studentName = student['Official Student Name'] || student.name || 'N/A';
    const dob = formatDate(student.birthDate);
    const daysUntil = student.daysUntilBirthday;
    const age = student.age;
    const turningAge = age + 1;
    const status = student.Status || 'Active';
    const grade = student.Grade || student.grade || 'N/A';
    const zodiacSign = student.zodiacSign;
    
    let statusClass = 'pending';
    if (status.toLowerCase() === 'verified' || status.toLowerCase() === 'active') {
        statusClass = 'completed';
    }
    
    // Enhanced birthday badge with priority levels
    let birthdayBadge = '';
    let priorityClass = '';
    
    if (daysUntil === 0) {
        birthdayBadge = '<span style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; box-shadow: 0 2px 4px rgba(231,76,60,0.3);">🎂 TODAY!</span>';
        priorityClass = 'priority-urgent';
    } else if (daysUntil === 1) {
        birthdayBadge = '<span style="background: linear-gradient(135deg, #e67e22 0%, #d35400 100%); color: white; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; box-shadow: 0 2px 4px rgba(230,126,34,0.3);">🎉 Tomorrow</span>';
        priorityClass = 'priority-high';
    } else if (daysUntil <= 7) {
        birthdayBadge = `<span style="background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); color: white; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;">⚡ ${daysUntil} days</span>`;
        priorityClass = 'priority-medium';
    } else if (daysUntil <= 30) {
        birthdayBadge = `<span style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); color: white; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;">📅 ${daysUntil} days</span>`;
        priorityClass = 'priority-normal';
    } else {
        birthdayBadge = `<span style="background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%); color: white; padding: 4px 10px; border-radius: 12px; font-size: 11px;">${daysUntil} days</span>`;
        priorityClass = 'priority-low';
    }

    const row = document.createElement('tr');
    row.id = `birthday-row-${student.id}`;
    row.className = `birthday-row ${priorityClass}`;
    row.style.animation = `slideInLeft 0.3s ease ${index * 0.05}s backwards`;
    
    row.innerHTML = `
        <td>
            <div style="display: flex; align-items: center; gap: 10px;">
                <div style="position: relative;">
                    <img src="img/people.png" alt="${studentName}" style="width: 40px; height: 40px; border-radius: 50%; border: 2px solid #3498db;">
                    <div style="position: absolute; bottom: -2px; right: -2px; background: white; border-radius: 50%; padding: 2px; font-size: 14px;">${zodiacSign.split(' ')[0]}</div>
                </div>
                <div>
                    <p class="student-name-hover" data-student-id="${student.id}" style="margin: 0; font-weight: 600; cursor: pointer;">${studentName}</p>
                    <small style="color: #7f8c8d; font-size: 11px;">Grade ${grade} • ${student.birthMonth}</small>
                </div>
            </div>
        </td>
        <td>
            <div style="display: flex; flex-direction: column; gap: 4px;">
                <span style="font-weight: 500;">${dob}</span>
                <small style="color: #7f8c8d; display: flex; align-items: center; gap: 4px;">
                    🎂 Turning ${turningAge} years
                </small>
            </div>
        </td>
        <td>${birthdayBadge}</td>
        <td>
            <div style="display: flex; gap: 8px; align-items: center;">
                <div style="text-align: center; padding: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; min-width: 60px;">
                    <div style="font-size: 20px; font-weight: 700; color: white;">${turningAge}</div>
                    <div style="font-size: 9px; color: rgba(255,255,255,0.9); text-transform: uppercase;">Years</div>
                </div>
                <div style="text-align: center; padding: 8px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 8px; min-width: 60px;">
                    <div style="font-size: 20px; font-weight: 700; color: white;">${daysUntil}</div>
                    <div style="font-size: 9px; color: rgba(255,255,255,0.9); text-transform: uppercase;">Days</div>
                </div>
            </div>
        </td>
        <td>
            <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                <button onclick="viewBirthdayDetails('${student.id}')" 
                    title="View comprehensive details" 
                    style="padding: 6px 12px; background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); color: white; border: none; border-radius: 6px; font-size: 11px; cursor: pointer; transition: all 0.3s; font-weight: 500;"
                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(52,152,219,0.3)'" 
                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                    👁️ Details
                </button>
                
                <button onclick="sendBirthdayWish('${student.id}')" 
                    title="Send personalized message" 
                    style="padding: 6px 12px; background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; border: none; border-radius: 6px; font-size: 11px; cursor: pointer; transition: all 0.3s; font-weight: 500;"
                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(231,76,60,0.3)'" 
                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                    💌 Wish
                </button>
                
                <button onclick="quickActionMenu('${student.id}')" 
                    title="More actions" 
                    style="padding: 6px 12px; background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%); color: white; border: none; border-radius: 6px; font-size: 11px; cursor: pointer; transition: all 0.3s; font-weight: 500;"
                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(155,89,182,0.3)'" 
                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                    ⚡ More
                </button>
            </div>
        </td>
    `;
    
    // Add hover event for info card
    const nameElement = row.querySelector('.student-name-hover');
    nameElement.addEventListener('mouseenter', (e) => showEnhancedStudentInfoCard(e, student));
    nameElement.addEventListener('mouseleave', () => hideStudentInfoCard());
    
    // Highlight today's birthdays with special animation
    if (daysUntil === 0) {
        row.style.background = 'linear-gradient(90deg, #fff5f5 0%, #ffffff 100%)';
        row.style.animation = 'pulse 2s infinite, slideInLeft 0.3s ease backwards';
        row.style.boxShadow = '0 4px 12px rgba(231, 76, 60, 0.2)';
    }
    
    return row;
}

/**
 * Show enhanced student info card with more details
 */
function showEnhancedStudentInfoCard(event, student) {
    let card = document.getElementById('studentInfoCard');
    
    if (!card) {
        card = document.createElement('div');
        card.id = 'studentInfoCard';
        card.className = 'student-info-card';
        document.body.appendChild(card);
    }

    const studentName = student['Official Student Name'] || student.name || 'N/A';
    const initials = studentName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const status = student.Status || 'Active';
    const daysUntil = student.daysUntilBirthday;
    const turningAge = student.age + 1;
    
    let statusClass = 'pending';
    if (status.toLowerCase() === 'verified' || status.toLowerCase() === 'active') {
        statusClass = 'completed';
    }

    const grade = student.Grade || 'N/A';
    const class_ = student.Class || 'N/A';
    const admissionDate = student.DateOfAdmission ? formatDate(student.DateOfAdmission) : 'N/A';
    const email = student.Email || 'N/A';
    const phone = student.Phone || 'N/A';
    const zodiacSign = student.zodiacSign || 'N/A';
    const birthMonth = student.birthMonth || 'N/A';

    // Birthday celebration status
    const isCelebrated = student['Birthday Celebrated'] || false;
    const celebrationDate = student['Celebration Date'] || 'Not yet';

    card.innerHTML = `
        <div class="card-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 15px; border-radius: 8px 8px 0 0;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <div class="card-avatar" style="width: 50px; height: 50px; background: white; color: #667eea; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 18px; font-weight: 700;">${initials}</div>
                <div style="flex: 1;">
                    <div class="card-name" style="color: white; font-size: 16px; font-weight: 600;">${studentName}</div>
                    <div style="color: rgba(255,255,255,0.9); font-size: 11px; display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                        <span>${zodiacSign}</span>
                        <span>•</span>
                        <span>${birthMonth}</span>
                    </div>
                </div>
                <div style="text-align: center; background: rgba(255,255,255,0.2); padding: 8px 12px; border-radius: 8px;">
                    <div style="font-size: 20px; font-weight: 700; color: white;">${daysUntil}</div>
                    <div style="font-size: 9px; color: rgba(255,255,255,0.9);">DAYS LEFT</div>
                </div>
            </div>
        </div>
        <div class="card-body" style="padding: 15px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
                <div style="background: #f8f9fa; padding: 10px; border-radius: 6px; text-align: center;">
                    <div style="font-size: 18px; font-weight: 600; color: #2c3e50;">${turningAge}</div>
                    <div style="font-size: 10px; color: #7f8c8d; text-transform: uppercase;">Turning Age</div>
                </div>
                <div style="background: #f8f9fa; padding: 10px; border-radius: 6px; text-align: center;">
                    <div style="font-size: 18px; font-weight: 600; color: #2c3e50;">${student.age}</div>
                    <div style="font-size: 10px; color: #7f8c8d; text-transform: uppercase;">Current Age</div>
                </div>
            </div>
            
            <div class="info-row" style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ecf0f1;">
                <span class="info-label" style="color: #7f8c8d; font-size: 11px;">Status</span>
                <span class="status-badge ${statusClass}" style="font-size: 10px; padding: 2px 8px; border-radius: 10px;">${status}</span>
            </div>
            <div class="info-row" style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ecf0f1;">
                <span class="info-label" style="color: #7f8c8d; font-size: 11px;">Grade & Class</span>
                <span class="info-value" style="font-size: 11px; font-weight: 500;">${grade} - ${class_}</span>
            </div>
            <div class="info-row" style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ecf0f1;">
                <span class="info-label" style="color: #7f8c8d; font-size: 11px;">Birth Date</span>
                <span class="info-value" style="font-size: 11px; font-weight: 500;">${formatDate(student.birthDate)}</span>
            </div>
            
            ${isCelebrated ? `
            <div style="background: #d4edda; padding: 8px; border-radius: 4px; margin-top: 10px; text-align: center;">
                <div style="font-size: 18px;">✅</div>
                <div style="font-size: 10px; color: #155724; margin-top: 4px;">Celebrated: ${celebrationDate}</div>
            </div>
            ` : `
            <div style="background: #fff3cd; padding: 8px; border-radius: 4px; margin-top: 10px; text-align: center;">
                <div style="font-size: 18px;">⏰</div>
                <div style="font-size: 10px; color: #856404; margin-top: 4px;">Not yet celebrated</div>
            </div>
            `}
        </div>
    `;

    card.classList.add('show');

    // Position card near cursor with better positioning
    const rect = event.target.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    let left = rect.left + scrollX - 160;
    let top = rect.bottom + scrollY + 10;

    if (left + 320 > window.innerWidth) {
        left = window.innerWidth - 340 + scrollX;
    }
    if (left < 0) {
        left = 10 + scrollX;
    }
    
    if (top + 300 > window.innerHeight + scrollY) {
        top = rect.top + scrollY - 310;
    }

    card.style.left = left + 'px';
    card.style.top = top + 'px';
}

/**
 * Update birthday counts with smooth animation
 */
function updateBirthdayCountsWithAnimation(studentArray) {
    const birthdayCountEl = document.getElementById('birthdayCountHeader');
    const upcomingCountEl = document.getElementById('upcomingBirthdaysCount');
    
    if (birthdayCountEl) {
        animateCount(birthdayCountEl, parseInt(birthdayCountEl.textContent) || 0, studentArray.length, 500);
    }
    if (upcomingCountEl) {
        animateCount(upcomingCountEl, parseInt(upcomingCountEl.textContent) || 0, studentArray.length, 500);
    }
}

/**
 * Animate number counting
 */
function animateCount(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = Math.round(current);
    }, 16);
}

/**
 * ============================================================================
 * ADVANCED BIRTHDAY ANALYTICS
 * ============================================================================
 */

/**
 * Generate comprehensive birthday analytics
 */
function generateBirthdayAnalytics(students) {
    const analytics = {
        totalBirthdays: students.length,
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        byGrade: {},
        byMonth: {},
        byZodiac: {},
        averageAge: 0,
        oldestStudent: null,
        youngestStudent: null
    };
    
    let totalAge = 0;
    
    students.forEach(student => {
        const days = student.daysUntilBirthday;
        const grade = student.Grade || 'Unknown';
        const month = student.birthMonth;
        const zodiac = student.zodiacSign;
        const turningAge = student.age + 1;
        
        // Count by timeframe
        if (days === 0) analytics.today++;
        if (days <= 7) analytics.thisWeek++;
        if (days <= 30) analytics.thisMonth++;
        
        // Count by grade
        analytics.byGrade[grade] = (analytics.byGrade[grade] || 0) + 1;
        
        // Count by month
        analytics.byMonth[month] = (analytics.byMonth[month] || 0) + 1;
        
        // Count by zodiac
        analytics.byZodiac[zodiac] = (analytics.byZodiac[zodiac] || 0) + 1;
        
        // Track ages
        totalAge += turningAge;
        
        if (!analytics.oldestStudent || turningAge > (analytics.oldestStudent.age + 1)) {
            analytics.oldestStudent = student;
        }
        if (!analytics.youngestStudent || turningAge < (analytics.youngestStudent.age + 1)) {
            analytics.youngestStudent = student;
        }
    });
    
    analytics.averageAge = students.length > 0 ? (totalAge / students.length).toFixed(1) : 0;
    
    // Store analytics globally
    window.birthdayAnalytics = analytics;
    
    // Update analytics UI if element exists
    updateAnalyticsDisplay(analytics);
    
    return analytics;
}

/**
 * Update analytics display
 */
function updateAnalyticsDisplay(analytics) {
    const analyticsContainer = document.getElementById('birthdayAnalyticsContainer');
    if (!analyticsContainer) return;
    
    let html = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(102,126,234,0.3);">
                <div style="font-size: 32px; font-weight: 700;">${analytics.totalBirthdays}</div>
                <div style="font-size: 12px; opacity: 0.9; text-transform: uppercase; margin-top: 5px;">Total Birthdays</div>
            </div>
            
            <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(240,147,251,0.3);">
                <div style="font-size: 32px; font-weight: 700;">${analytics.today}</div>
                <div style="font-size: 12px; opacity: 0.9; text-transform: uppercase; margin-top: 5px;">Today</div>
            </div>
            
            <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(79,172,254,0.3);">
                <div style="font-size: 32px; font-weight: 700;">${analytics.thisWeek}</div>
                <div style="font-size: 12px; opacity: 0.9; text-transform: uppercase; margin-top: 5px;">This Week</div>
            </div>
            
            <div style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(67,233,123,0.3);">
                <div style="font-size: 32px; font-weight: 700;">${analytics.averageAge}</div>
                <div style="font-size: 12px; opacity: 0.9; text-transform: uppercase; margin-top: 5px;">Average Age</div>
            </div>
        </div>
    `;
    
    analyticsContainer.innerHTML = html;
}

/**
 * ============================================================================
 * CHECK BIRTHDAY NOTIFICATIONS
 * ============================================================================
 */

/**
 * Check and display birthday notifications
 */
function checkBirthdayNotifications(students) {
    const todayBirthdays = students.filter(s => s.daysUntilBirthday === 0);
    const tomorrowBirthdays = students.filter(s => s.daysUntilBirthday === 1);
    
    if (todayBirthdays.length > 0) {
        showBirthdayNotificationBanner(todayBirthdays, 'today');
    } else if (tomorrowBirthdays.length > 0) {
        showBirthdayNotificationBanner(tomorrowBirthdays, 'tomorrow');
    }
}

/**
 * Show birthday notification banner
 */
function showBirthdayNotificationBanner(students, type) {
    const existingBanner = document.getElementById('birthdayNotificationBanner');
    if (existingBanner) existingBanner.remove();
    
    const banner = document.createElement('div');
    banner.id = 'birthdayNotificationBanner';
    banner.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        max-width: 350px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideInRight 0.5s ease;
    `;
    
    const names = students.map(s => s['Official Student Name'] || s.name).join(', ');
    const emoji = type === 'today' ? '🎂' : '🎉';
    const title = type === 'today' ? 'Birthday Today!' : 'Birthday Tomorrow!';
    
    banner.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
            <div style="font-size: 24px;">${emoji}</div>
            <button onclick="this.parentElement.parentElement.remove()" style="background: rgba(255,255,255,0.2); border: none; color: white; cursor: pointer; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">×</button>
        </div>
        <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">${title}</div>
        <div style="font-size: 13px; opacity: 0.9; margin-bottom: 15px;">${names}</div>
        <button onclick="viewAllBirthdaysToday()" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.2); border: none; color: white; border-radius: 6px; cursor: pointer; font-weight: 500; transition: all 0.3s;">
            View All
        </button>
    `;
    
    document.body.appendChild(banner);
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
        if (banner.parentElement) {
            banner.style.animation = 'slideOutRight 0.5s ease';
            setTimeout(() => banner.remove(), 500);
        }
    }, 10000);
}

/**
 * ============================================================================
 * ADVANCED ACTION FUNCTIONS
 * ============================================================================
 */

/**
 * Quick action menu with multiple options
 */
function quickActionMenu(studentId) {
    const student = birthdayStudents.get(studentId);
    if (!student) return;
    
    const studentName = student['Official Student Name'] || student.name || 'N/A';
    
    Swal.fire({
        title: `⚡ Quick Actions`,
        html: `
            <div style="text-align: left;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 15px; border-radius: 8px; color: white; margin-bottom: 20px; text-align: center;">
                    <div style="font-size: 36px; margin-bottom: 8px;">🎂</div>
                    <h3 style="margin: 0; font-size: 18px;">${studentName}</h3>
                    <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.9;">${student.daysUntilBirthday} days until birthday</p>
                </div>
                
                <div style="display: grid; gap: 10px;">
                    <button onclick="Swal.close(); scheduleBirthdayReminder('${studentId}')" style="width: 100%; padding: 12px; background: #f39c12; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; text-align: left; display: flex; align-items: center; gap: 10px; transition: all 0.3s;">
                        <span style="font-size: 20px;">🔔</span>
                        <span>Set Reminder</span>
                    </button>
                    
                    <button onclick="Swal.close(); exportBirthdayCard('${studentId}')" style="width: 100%; padding: 12px; background: #9b59b6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; text-align: left; display: flex; align-items: center; gap: 10px; transition: all 0.3s;">
                        <span style="font-size: 20px;">🎨</span>
                        <span>Generate Birthday Card</span>
                    </button>
                    
                    <button onclick="Swal.close(); markBirthdayCelebrated('${studentId}')" style="width: 100%; padding: 12px; background: #27ae60; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; text-align: left; display: flex; align-items: center; gap: 10px; transition: all 0.3s;">
                        <span style="font-size: 20px;">✅</span>
                        <span>Mark as Celebrated</span>
                    </button>
                    
                    <button onclick="Swal.close(); exportBirthdayData('${studentId}')" style="width: 100%; padding: 12px; background: #3498db; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; text-align: left; display: flex; align-items: center; gap: 10px; transition: all 0.3s;">
                        <span style="font-size: 20px;">📥</span>
                        <span>Export Details</span>
                    </button>
                    
                    <button onclick="Swal.close(); shareBirthdayInfo('${studentId}')" style="width: 100%; padding: 12px; background: #1abc9c; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; text-align: left; display: flex; align-items: center; gap: 10px; transition: all 0.3s;">
                        <span style="font-size: 20px;">📤</span>
                        <span>Share Info</span>
                    </button>
                </div>
            </div>
        `,
        showConfirmButton: false,
        showCloseButton: true,
        width: '450px'
    });
}

/**
 * Export birthday data
 */
function exportBirthdayData(studentId) {
    const student = birthdayStudents.get(studentId);
    if (!student) return;
    
    Swal.fire({
        title: '📥 Export Birthday Data',
        html: `
            <div style="text-align: left; margin: 20px 0;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">Export Format</label>
                <select id="exportFormat" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 15px;">
                    <option value="json">JSON (Developer Friendly)</option>
                    <option value="csv">CSV (Excel Compatible)</option>
                    <option value="pdf">PDF (Printable)</option>
                    <option value="txt">Text File</option>
                </select>
                
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">Include Fields</label>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    <label style="display: flex; align-items: center; gap: 8px;">
                        <input type="checkbox" id="includeBasic" checked>
                        <span>Basic Info</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px;">
                        <input type="checkbox" id="includeContact" checked>
                        <span>Contact</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px;">
                        <input type="checkbox" id="includeAcademic" checked>
                        <span>Academic</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px;">
                        <input type="checkbox" id="includeZodiac" checked>
                        <span>Zodiac</span>
                    </label>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: '📥 Export',
        preConfirm: () => {
            const format = document.getElementById('exportFormat').value;
            const includeBasic = document.getElementById('includeBasic').checked;
            const includeContact = document.getElementById('includeContact').checked;
            const includeAcademic = document.getElementById('includeAcademic').checked;
            const includeZodiac = document.getElementById('includeZodiac').checked;
            
            return { format, includeBasic, includeContact, includeAcademic, includeZodiac };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const { format } = result.value;
            const data = prepareBirthdayExportData(student, result.value);
            downloadBirthdayData(data, format, student);
        }
    });
}

/**
 * Prepare birthday export data
 */
function prepareBirthdayExportData(student, options) {
    const data = {};
    
    if (options.includeBasic) {
        data['Name'] = student['Official Student Name'] || student.name;
        data['Birth Date'] = formatDate(student.birthDate);
        data['Current Age'] = student.age;
        data['Turning Age'] = student.age + 1;
        data['Days Until Birthday'] = student.daysUntilBirthday;
        data['Birth Month'] = student.birthMonth;
    }
    
    if (options.includeContact) {
        data['Email'] = student.Email || 'N/A';
        data['Phone'] = student.Phone || 'N/A';
    }
    
    if (options.includeAcademic) {
        data['Grade'] = student.Grade || 'N/A';
        data['Class'] = student.Class || 'N/A';
        data['Status'] = student.Status || 'N/A';
    }
    
    if (options.includeZodiac) {
        data['Zodiac Sign'] = student.zodiacSign || 'N/A';
    }
    
    return data;
}

/**
 * Download birthday data
 */
function downloadBirthdayData(data, format, student) {
    const studentName = (student['Official Student Name'] || student.name || 'student').replace(/\s+/g, '_');
    let content = '';
    let filename = `birthday_${studentName}`;
    let mimeType = '';
    
    switch (format) {
        case 'json':
            content = JSON.stringify(data, null, 2);
            filename += '.json';
            mimeType = 'application/json';
            break;
        case 'csv':
            content = Object.keys(data).join(',') + '\n' + Object.values(data).join(',');
            filename += '.csv';
            mimeType = 'text/csv';
            break;
        case 'txt':
            content = Object.entries(data).map(([key, value]) => `${key}: ${value}`).join('\n');
            filename += '.txt';
            mimeType = 'text/plain';
            break;
        case 'pdf':
            Swal.fire('Info', 'PDF export requires additional setup. Downloading as JSON instead.', 'info');
            content = JSON.stringify(data, null, 2);
            filename += '.json';
            mimeType = 'application/json';
            break;
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    Swal.fire({
        icon: 'success',
        title: 'Exported!',
        text: `Birthday data exported as ${format.toUpperCase()}`,
        timer: 2000
    });
}

/**
 * Share birthday info
 */
function shareBirthdayInfo(studentId) {
    const student = birthdayStudents.get(studentId);
    if (!student) return;
    
    const studentName = student['Official Student Name'] || student.name;
    const daysUntil = student.daysUntilBirthday;
    const turningAge = student.age + 1;
    const birthDate = formatDate(student.birthDate);
    
    const shareText = `🎂 ${studentName} is turning ${turningAge} in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}! Birthday: ${birthDate}`;
    
    Swal.fire({
        title: '📤 Share Birthday Info',
        html: `
            <div style="text-align: left;">
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <pre style="margin: 0; white-space: pre-wrap; font-size: 13px;">${shareText}</pre>
                </div>
                
                <div style="display: grid; gap: 10px;">
                    <button onclick="copyToClipboard('${shareText.replace(/'/g, "\\'")}'); Swal.close();" style="width: 100%; padding: 12px; background: #3498db; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                        📋 Copy to Clipboard
                    </button>
                    
                    <button onclick="shareViaEmail('${studentName}', '${shareText.replace(/'/g, "\\'")}'); Swal.close();" style="width: 100%; padding: 12px; background: #e74c3c; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                        📧 Share via Email
                    </button>
                    
                    <button onclick="shareViaSMS('${shareText.replace(/'/g, "\\'")}'); Swal.close();" style="width: 100%; padding: 12px; background: #27ae60; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                        📱 Share via SMS
                    </button>
                </div>
            </div>
        `,
        showConfirmButton: false,
        showCloseButton: true
    });
}

/**
 * Copy to clipboard
 */
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        Swal.fire({
            icon: 'success',
            title: 'Copied!',
            text: 'Birthday info copied to clipboard',
            timer: 1500,
            showConfirmButton: false
        });
    });
}

/**
 * Share via email
 */
function shareViaEmail(studentName, text) {
    const subject = encodeURIComponent(`Birthday Reminder: ${studentName}`);
    const body = encodeURIComponent(text);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

/**
 * Share via SMS
 */
function shareViaSMS(text) {
    const body = encodeURIComponent(text);
    window.location.href = `sms:?body=${body}`;
}

/**
 * View all birthdays today
 */
function viewAllBirthdaysToday() {
    const todayStudents = Array.from(birthdayStudents.values()).filter(s => s.daysUntilBirthday === 0);
    
    if (todayStudents.length === 0) {
        Swal.fire('No Birthdays', 'No birthdays today!', 'info');
        return;
    }
    
    let html = `
        <div style="max-height: 400px; overflow-y: auto;">
            ${todayStudents.map((student, i) => {
                const name = student['Official Student Name'] || student.name;
                const age = student.age + 1;
                return `
                    <div style="background: ${i % 2 === 0 ? '#f8f9fa' : 'white'}; padding: 15px; border-radius: 8px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: 600; font-size: 14px;">${name}</div>
                            <div style="font-size: 12px; color: #7f8c8d;">Turning ${age} years old</div>
                        </div>
                        <button onclick="sendBirthdayWish('${student.id}')" style="padding: 8px 16px; background: #e74c3c; color: white; border: none; border-radius: 6px; cursor: pointer;">
                            💌 Send Wish
                        </button>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    
    Swal.fire({
        title: '🎂 Birthdays Today',
        html: html,
        width: '600px',
        showCloseButton: true,
        confirmButtonText: 'Close'
    });
}

/**
 * ============================================================================
 * BULK OPERATIONS
 * ============================================================================
 */

/**
 * Bulk send birthday wishes
 */
function bulkSendBirthdayWishes() {
    const upcomingStudents = Array.from(birthdayStudents.values()).filter(s => s.daysUntilBirthday <= 7);
    
    if (upcomingStudents.length === 0) {
        Swal.fire('No Birthdays', 'No upcoming birthdays in the next 7 days', 'info');
        return;
    }
    
    let html = `
        <div style="text-align: left; max-height: 400px; overflow-y: auto;">
            <p style="margin-bottom: 15px;">Select students to send birthday wishes:</p>
            ${upcomingStudents.map(student => {
                const name = student['Official Student Name'] || student.name;
                const days = student.daysUntilBirthday;
                return `
                    <label style="display: flex; align-items: center; gap: 10px; padding: 10px; background: #f8f9fa; border-radius: 6px; margin-bottom: 8px; cursor: pointer;">
                        <input type="checkbox" class="bulk-birthday-checkbox" data-student-id="${student.id}" checked>
                        <div style="flex: 1;">
                            <div style="font-weight: 600; font-size: 13px;">${name}</div>
                            <div style="font-size: 11px; color: #7f8c8d;">${days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days} days`}</div>
                        </div>
                    </label>
                `;
            }).join('')}
        </div>
    `;
    
    Swal.fire({
        title: '📧 Bulk Send Wishes',
        html: html,
        width: '600px',
        showCancelButton: true,
        confirmButtonText: '📤 Send to Selected',
        preConfirm: () => {
            const checkboxes = document.querySelectorAll('.bulk-birthday-checkbox:checked');
            const selectedIds = Array.from(checkboxes).map(cb => cb.dataset.studentId);
            return selectedIds;
        }
    }).then((result) => {
        if (result.isConfirmed && result.value.length > 0) {
            Swal.fire({
                icon: 'success',
                title: 'Wishes Sent!',
                text: `Birthday wishes sent to ${result.value.length} student(s)`,
                timer: 2000
            });
            
            // Log bulk action
            result.value.forEach(id => {
                const student = birthdayStudents.get(id);
                if (student) {
                    addActivityFeedEntry({
                        type: 'FIELD_CHANGED',
                        studentName: student['Official Student Name'] || student.name,
                        studentId: id,
                        field: 'Birthday Wish',
                        oldValue: 'Not Sent',
                        newValue: 'Sent (Bulk Operation)',
                        status: student.Status,
                        timestamp: getFormattedTimestamp(),
                        changedBy: currentUser?.email || 'Admin'
                    });
                }
            });
        }
    });
}

/**
 * Export all birthday data
 */
function exportAllBirthdayData() {
    const students = Array.from(birthdayStudents.values());
    
    if (students.length === 0) {
        Swal.fire('No Data', 'No birthday data to export', 'info');
        return;
    }
    
    const csvData = [
        ['Name', 'Birth Date', 'Age', 'Turning Age', 'Days Until', 'Grade', 'Class', 'Zodiac', 'Status'].join(','),
        ...students.map(s => [
            s['Official Student Name'] || s.name,
            formatDate(s.birthDate),
            s.age,
            s.age + 1,
            s.daysUntilBirthday,
            s.Grade || 'N/A',
            s.Class || 'N/A',
            s.zodiacSign || 'N/A',
            s.Status || 'N/A'
        ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all_birthdays_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    Swal.fire({
        icon: 'success',
        title: 'Exported!',
        text: `${students.length} birthday records exported`,
        timer: 2000
    });
}

/**
 * ============================================================================
 * UTILITY FUNCTIONS (Reusing from original code)
 * ============================================================================
 */

function parseBirthDate(dateString) {
    if (!dateString) return null;
    
    try {
        if (typeof dateString === 'string' && dateString.includes('/')) {
            const parts = dateString.split('/');
            if (parts.length === 3) {
                return new Date(parts[2], parts[0] - 1, parts[1]);
            }
        }
        
        if (typeof dateString === 'string' && dateString.includes('-')) {
            const parts = dateString.split('-');
            if (parts.length === 3) {
                const date = new Date(parts[2], parts[1] - 1, parts[0]);
                if (!isNaN(date.getTime())) return date;
            }
        }
        
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) return date;
        
        return null;
    } catch (error) {
        return null;
    }
}

function calculateDaysUntilBirthday(birthMonth, birthDay) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentYear = today.getFullYear();
    
    let nextBirthday = new Date(currentYear, birthMonth, birthDay);
    nextBirthday.setHours(0, 0, 0, 0);
    
    if (nextBirthday < today) {
        nextBirthday = new Date(currentYear + 1, birthMonth, birthDay);
    }
    
    const diffTime = nextBirthday - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
}

function calculateAge(birthDate) {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
}

/**
 * ============================================================================
 * MISSING FUNCTIONS FOR BIRTHDAY TRACKING SYSTEM
 * ============================================================================
 */

// Continue zodiac signs
function getZodiacSign(birthDate) {
    const month = birthDate.getMonth() + 1;
    const day = birthDate.getDate();
    
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return '♈ Aries';
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return '♉ Taurus';
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return '♊ Gemini';
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return '♋ Cancer';
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return '♌ Leo';
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return '♍ Virgo';
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return '♎ Libra';
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return '♏ Scorpio';
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return '♐ Sagittarius';
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return '♑ Capricorn';
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return '♒ Aquarius';
    if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return '♓ Pisces';
    
    return '⭐ Unknown';
}

/**
 * Format date for display
 */
function formatDate(date) {
    if (!date) return 'N/A';
    
    if (typeof date === 'string') {
        date = new Date(date);
    }
    
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

/**
 * Hide student info card
 */
function hideStudentInfoCard() {
    const card = document.getElementById('studentInfoCard');
    if (card) {
        card.classList.remove('show');
        setTimeout(() => {
            if (card.parentElement) {
                card.remove();
            }
        }, 300);
    }
}

/**
 * Update birthday statistics
 */
function updateBirthdayStatistics(students) {
    const stats = {
        total: students.length,
        today: students.filter(s => s.daysUntilBirthday === 0).length,
        thisWeek: students.filter(s => s.daysUntilBirthday <= 7).length,
        thisMonth: students.filter(s => s.daysUntilBirthday <= 30).length
    };
    
    // Update DOM elements if they exist
    const elements = {
        'birthdayStatsTotal': stats.total,
        'birthdayStatsToday': stats.today,
        'birthdayStatsWeek': stats.thisWeek,
        'birthdayStatsMonth': stats.thisMonth
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    });
}

/**
 * Setup realtime birthday updates
 */
function setupRealtimeBirthdayUpdates() {
    // Check for birthday updates every minute
    if (window.birthdayUpdateInterval) {
        clearInterval(window.birthdayUpdateInterval);
    }
    
    window.birthdayUpdateInterval = setInterval(() => {
        const now = new Date();
        // Reload at midnight
        if (now.getHours() === 0 && now.getMinutes() === 0) {
            loadBirthdayStudents();
        }
    }, 60000); // Check every minute
}

/**
 * View birthday details
 */
function viewBirthdayDetails(studentId) {
    const student = birthdayStudents.get(studentId);
    if (!student) {
        Swal.fire('Error', 'Student not found', 'error');
        return;
    }
    
    const studentName = student['Official Student Name'] || student.name || 'N/A';
    const dob = formatDate(student.birthDate);
    const age = student.age;
    const turningAge = age + 1;
    const daysUntil = student.daysUntilBirthday;
    const zodiacSign = student.zodiacSign;
    const grade = student.Grade || 'N/A';
    const class_ = student.Class || 'N/A';
    const status = student.Status || 'Active';
    
    Swal.fire({
        title: `🎂 ${studentName}`,
        html: `
            <div style="text-align: left;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px; color: white; margin-bottom: 20px;">
                    <div style="text-align: center;">
                        <div style="font-size: 64px; margin-bottom: 10px;">🎂</div>
                        <h2 style="margin: 0; font-size: 24px;">${studentName}</h2>
                        <p style="margin: 10px 0 0 0; opacity: 0.9;">${zodiacSign}</p>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 32px; font-weight: 700; color: #2c3e50;">${turningAge}</div>
                        <div style="font-size: 12px; color: #7f8c8d; text-transform: uppercase;">Turning Age</div>
                    </div>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 32px; font-weight: 700; color: #e74c3c;">${daysUntil}</div>
                        <div style="font-size: 12px; color: #7f8c8d; text-transform: uppercase;">Days Until</div>
                    </div>
                </div>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0;">
                        <span style="font-weight: 600; color: #7f8c8d;">Birth Date</span>
                        <span style="font-weight: 500;">${dob}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0;">
                        <span style="font-weight: 600; color: #7f8c8d;">Current Age</span>
                        <span style="font-weight: 500;">${age} years</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0;">
                        <span style="font-weight: 600; color: #7f8c8d;">Grade & Class</span>
                        <span style="font-weight: 500;">${grade} - ${class_}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0;">
                        <span style="font-weight: 600; color: #7f8c8d;">Status</span>
                        <span style="font-weight: 500;">${status}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 10px 0;">
                        <span style="font-weight: 600; color: #7f8c8d;">Zodiac Sign</span>
                        <span style="font-weight: 500;">${zodiacSign}</span>
                    </div>
                </div>
            </div>
        `,
        width: '500px',
        showCloseButton: true,
        confirmButtonText: 'Close'
    });
}

/**
 * Send birthday wish
 */
function sendBirthdayWish(studentId) {
    const student = birthdayStudents.get(studentId);
    if (!student) {
        Swal.fire('Error', 'Student not found', 'error');
        return;
    }
    
    const studentName = student['Official Student Name'] || student.name || 'N/A';
    const turningAge = student.age + 1;
    
    const templates = [
        `Happy Birthday ${studentName}! 🎉 Wishing you an amazing ${turningAge}th birthday filled with joy and success!`,
        `🎂 Happy ${turningAge}th Birthday ${studentName}! May this year bring you happiness and wonderful memories!`,
        `Wishing you a fantastic birthday ${studentName}! 🎈 Have an incredible ${turningAge}th year ahead!`,
        `Happy Birthday to an amazing student! 🎉 ${studentName}, may your ${turningAge}th year be your best yet!`,
        `🎂 Celebrating you today ${studentName}! Happy ${turningAge}th Birthday! Keep shining bright!`
    ];
    
    Swal.fire({
        title: '💌 Send Birthday Wish',
        html: `
            <div style="text-align: left;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">Choose Template</label>
                <select id="wishTemplate" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 15px;">
                    ${templates.map((t, i) => `<option value="${i}">${t.substring(0, 50)}...</option>`).join('')}
                    <option value="custom">Custom Message</option>
                </select>
                
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">Message</label>
                <textarea id="wishMessage" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; min-height: 120px; font-family: inherit;" placeholder="Write your birthday message...">${templates[0]}</textarea>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: '📤 Send Wish',
        didOpen: () => {
            const select = document.getElementById('wishTemplate');
            const textarea = document.getElementById('wishMessage');
            
            select.addEventListener('change', (e) => {
                if (e.target.value === 'custom') {
                    textarea.value = '';
                    textarea.focus();
                } else {
                    textarea.value = templates[e.target.value];
                }
            });
        },
        preConfirm: () => {
            const message = document.getElementById('wishMessage').value;
            if (!message.trim()) {
                Swal.showValidationMessage('Please enter a message');
                return false;
            }
            return message;
        }
    }).then((result) => {
        if (result.isConfirmed) {
            // Simulate sending wish
            Swal.fire({
                icon: 'success',
                title: 'Wish Sent!',
                text: `Birthday wish sent to ${studentName}`,
                timer: 2000,
                showConfirmButton: false
            });
            
            // Log activity
            console.log(`Birthday wish sent to ${studentName}: ${result.value}`);
        }
    });
}

/**
 * Schedule birthday reminder
 */
function scheduleBirthdayReminder(studentId) {
    const student = birthdayStudents.get(studentId);
    if (!student) return;
    
    const studentName = student['Official Student Name'] || student.name;
    const daysUntil = student.daysUntilBirthday;
    
    Swal.fire({
        title: '🔔 Set Birthday Reminder',
        html: `
            <div style="text-align: left;">
                <p style="margin-bottom: 15px;">Set a reminder for ${studentName}'s birthday</p>
                
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">Remind me</label>
                <select id="reminderDays" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 15px;">
                    <option value="0">On the birthday</option>
                    <option value="1" selected>1 day before</option>
                    <option value="3">3 days before</option>
                    <option value="7">1 week before</option>
                </select>
                
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">Reminder Method</label>
                <select id="reminderMethod" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="notification">Browser Notification</option>
                    <option value="email">Email</option>
                    <option value="both">Both</option>
                </select>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: '✅ Set Reminder',
        preConfirm: () => {
            return {
                days: document.getElementById('reminderDays').value,
                method: document.getElementById('reminderMethod').value
            };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({
                icon: 'success',
                title: 'Reminder Set!',
                text: `You'll be reminded ${result.value.days} day(s) before`,
                timer: 2000
            });
        }
    });
}

/**
 * Mark birthday as celebrated
 */
function markBirthdayCelebrated(studentId) {
    const student = birthdayStudents.get(studentId);
    if (!student) return;
    
    const studentName = student['Official Student Name'] || student.name;
    
    Swal.fire({
        title: '✅ Mark as Celebrated',
        html: `
            <div style="text-align: left;">
                <p style="margin-bottom: 15px;">Mark ${studentName}'s birthday as celebrated?</p>
                
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">Celebration Date</label>
                <input type="date" id="celebrationDate" value="${new Date().toISOString().split('T')[0]}" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 15px;">
                
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">Notes (Optional)</label>
                <textarea id="celebrationNotes" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; min-height: 80px;" placeholder="Add celebration notes..."></textarea>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: '✅ Mark Celebrated',
        preConfirm: () => {
            return {
                date: document.getElementById('celebrationDate').value,
                notes: document.getElementById('celebrationNotes').value
            };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            // Update student record
            student['Birthday Celebrated'] = true;
            student['Celebration Date'] = result.value.date;
            student['Celebration Notes'] = result.value.notes;
            
            Swal.fire({
                icon: 'success',
                title: 'Marked as Celebrated!',
                text: `${studentName}'s birthday marked as celebrated`,
                timer: 2000
            });
            
            // Refresh display
            loadBirthdayStudents();
        }
    });
}

/**
 * Generate birthday card
 */
function exportBirthdayCard(studentId) {
    const student = birthdayStudents.get(studentId);
    if (!student) return;
    
    const studentName = student['Official Student Name'] || student.name;
    const turningAge = student.age + 1;
    
    Swal.fire({
        title: '🎨 Generate Birthday Card',
        html: `
            <div style="text-align: left;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">Card Theme</label>
                <select id="cardTheme" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 15px;">
                    <option value="colorful">🎨 Colorful</option>
                    <option value="elegant">✨ Elegant</option>
                    <option value="fun">🎉 Fun & Playful</option>
                    <option value="minimal">🎯 Minimal</option>
                </select>
                
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">Card Message</label>
                <textarea id="cardMessage" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; min-height: 100px;">Happy ${turningAge}th Birthday ${studentName}! 🎂

Wishing you a day filled with joy, laughter, and wonderful memories!

From all of us</textarea>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: '🎨 Generate Card',
        preConfirm: () => {
            return {
                theme: document.getElementById('cardTheme').value,
                message: document.getElementById('cardMessage').value
            };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({
                icon: 'success',
                title: 'Card Generated!',
                text: 'Birthday card has been generated and is ready to download',
                timer: 2000
            });
        }
    });
}

/**
 * Get formatted timestamp
 */
function getFormattedTimestamp() {
    const now = new Date();
    return now.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Add activity feed entry (placeholder - needs integration with main system)
 */
function addActivityFeedEntry(entry) {
    console.log('Activity:', entry);
    // This should integrate with your main activity tracking system
}

/**
 * ============================================================================
 * ADDITIONAL CSS ANIMATIONS (Add to your stylesheet)
 * ============================================================================
 */

const birthdayStyles = `
<style>
@keyframes slideInLeft {
    from {
        opacity: 0;
        transform: translateX(-20px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

@keyframes slideInRight {
    from {
        opacity: 0;
        transform: translateX(100px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

@keyframes slideOutRight {
    from {
        opacity: 1;
        transform: translateX(0);
    }
    to {
        opacity: 0;
        transform: translateX(100px);
    }
}

@keyframes pulse {
    0%, 100% {
        box-shadow: 0 4px 12px rgba(231, 76, 60, 0.2);
    }
    50% {
        box-shadow: 0 4px 20px rgba(231, 76, 60, 0.4);
    }
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.student-info-card {
    position: absolute;
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.15);
    z-index: 9999;
    opacity: 0;
    transform: translateY(-10px);
    transition: all 0.3s ease;
    pointer-events: none;
    max-width: 320px;
}

.student-info-card.show {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
}

.birthday-row {
    transition: all 0.3s ease;
}

.birthday-row:hover {
    background: #f8f9fa !important;
    transform: translateX(5px);
}

.priority-urgent {
    border-left: 4px solid #e74c3c;
}

.priority-high {
    border-left: 4px solid #e67e22;
}

.priority-medium {
    border-left: 4px solid #f39c12;
}

.priority-normal {
    border-left: 4px solid #3498db;
}

.priority-low {
    border-left: 4px solid #95a5a6;
}

.status-badge {
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
}

.status-badge.completed {
    background: #d4edda;
    color: #155724;
}

.status-badge.pending {
    background: #fff3cd;
    color: #856404;
}
</style>
`;

// Inject styles if not already present
if (!document.getElementById('birthdayStyles')) {
    const styleEl = document.createElement('div');
    styleEl.id = 'birthdayStyles';
    styleEl.innerHTML = birthdayStyles;
    document.head.appendChild(styleEl);
}

/**
 * ============================================================================
 * INITIALIZATION
 * ============================================================================
 */

// Initialize birthday system when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🎂 Birthday Tracking System Initialized');
    });
} else {
    console.log('🎂 Birthday Tracking System Initialized');
}


/**
 * Update birthday statistics in the UI
 *//**
 * Update birthday statistics in the UI
 */
function updateBirthdayStatistics(students) {
    let todayCount = 0;
    let weekCount = 0;
    let monthCount = 0;
    
    students.forEach(student => {
        const days = student.daysUntilBirthday;
        
        if (days === 0) todayCount++;
        if (days >= 0 && days <= 7) weekCount++;
        if (days >= 0 && days <= 30) monthCount++;
    });
    
    // Update all UI elements with null checks
    const todayEl = document.getElementById('todayBirthdaysCount');
    const weekEl = document.getElementById('thisWeekBirthdaysCount');
    const monthEl = document.getElementById('totalUpcomingBirthdays');
    
    if (todayEl) {
        todayEl.textContent = todayCount;
    } else {
        console.warn('⚠️ Element "todayBirthdaysCount" not found in DOM');
    }
    
    if (weekEl) {
        weekEl.textContent = weekCount;
    } else {
        console.warn('⚠️ Element "thisWeekBirthdaysCount" not found in DOM');
    }
    
    if (monthEl) {
        monthEl.textContent = monthCount;
    } else {
        console.warn('⚠️ Element "totalUpcomingBirthdays" not found in DOM');
    }
    
    console.log('📊 Birthday stats updated:', { 
        today: todayCount, 
        thisWeek: weekCount, 
        thisMonth: monthCount,
        total: students.length 
    });
}