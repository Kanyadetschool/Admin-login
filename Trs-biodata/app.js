// ====================================================================
// FIREBASE CONFIGURATION & INITIALIZATION
// ====================================================================

// Your Firebase Config (using the config provided by the user)
const firebaseConfig = {
    apiKey: "AIzaSyA_41WpdMjHJOU5s3gQ9aieIayZRvUoRLE",
    authDomain: "kanyadet-school-admin.firebaseapp.com",
    projectId: "kanyadet-school-admin",
    storageBucket: "kanyadet-school-admin.appspot.com",
    messagingSenderId: "409708360032",
    appId: "1:409708360032:web:a21d63e8cb5fa1ecabee05",
    measurementId: "G-Y4C0ZRRL52"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const teachersRef = db.ref('teachers'); 

// ====================================================================
// GLOBAL STATE & DOM REFERENCES
// ====================================================================

let cachedTeachersData = {}; // Stores all teacher data for client-side filtering
let allKeys = []; // Stores all unique data keys for dynamic columns

const teacherForm = document.getElementById('teacher-form');
const customFieldsContainer = document.getElementById('custom-fields-container');
const addCustomFieldBtn = document.getElementById('add-custom-field');
const teachersList = document.getElementById('teachers-list');
const teachersTable = document.getElementById('teachers-table');
const filterSubject = document.getElementById('filter-subject');
const searchInput = document.getElementById('teacher-search');

let customFieldCounter = 0;

// ====================================================================
// UTILITY FUNCTIONS
// ====================================================================

/**
 * Normalizes keys by replacing spaces with underscores and lowercasing.
 * @param {string} key - The original field key.
 * @returns {string} The cleaned key.
 */
function cleanKey(key) {
    return key.replace(/\s/g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
}

/**
 * Determines all unique keys (columns) to build the table header dynamically.
 * @param {object} teachersData - The raw data object from Firebase.
 * @returns {Array<string>} A sorted array of unique keys.
 */
function getUniqueKeys(teachersData) {
    const defaultKeys = ['name', 'subject', 'email'];
    const customKeys = new Set();

    if (!teachersData) return defaultKeys;

    for (const id in teachersData) {
        const teacher = teachersData[id];
        for (const key in teacher) {
            if (!defaultKeys.includes(key) && key !== 'firebase_id') {
                customKeys.add(key);
            }
        }
    }
    // Combine default and custom keys, sorting custom keys alphabetically
    return [...defaultKeys, ...Array.from(customKeys).sort()];
}


// ====================================================================
// MANUAL INPUT LOGIC (CREATE)
// ====================================================================

// Dynamic Custom Field Generation
addCustomFieldBtn.addEventListener('click', () => {
    customFieldCounter++;
    const div = document.createElement('div');
    div.classList.add('custom-field-group');

    const keyInput = document.createElement('input');
    keyInput.type = 'text';
    keyInput.placeholder = `Custom Field Key ${customFieldCounter}`;
    keyInput.className = 'custom-key';
    
    const valueInput = document.createElement('input');
    valueInput.type = 'text';
    valueInput.placeholder = `Value`;
    valueInput.className = 'custom-value';

    div.appendChild(keyInput);
    div.appendChild(valueInput);
    customFieldsContainer.appendChild(div);
});

// Handle form submission
teacherForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const teacherData = {
        name: document.getElementById('name').value,
        subject: document.getElementById('subject').value,
        email: document.getElementById('email').value
    };

    // Collect custom fields
    const customKeys = document.querySelectorAll('.custom-key');
    const customValues = document.querySelectorAll('.custom-value');
    
    customKeys.forEach((keyInput, index) => {
        const key = keyInput.value.trim();
        const value = customValues[index].value.trim();
        if (key && value) {
            teacherData[cleanKey(key)] = value;
        }
    });

    // Save data to Firebase
    teachersRef.push(teacherData)
        .then(() => {
            alert('Teacher saved successfully!');
            teacherForm.reset();
            customFieldsContainer.innerHTML = ''; 
            customFieldCounter = 0;
        })
        .catch(error => console.error('Error saving data:', error));
});

// ====================================================================
// BULK UPLOAD LOGIC
// ====================================================================

const xlsxFile = document.getElementById('xlsx-file');
const uploadXlsxBtn = document.getElementById('upload-xlsx');

uploadXlsxBtn.addEventListener('click', () => {
    if (!xlsxFile.files.length) {
        alert("Please select an XLSX file first.");
        return;
    }

    const file = xlsxFile.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonTeachers = XLSX.utils.sheet_to_json(worksheet);

        if (jsonTeachers.length === 0) {
            alert("No data found in the spreadsheet.");
            return;
        }

        const updates = {};
        jsonTeachers.forEach(teacher => {
            const newKey = teachersRef.push().key; 
            const cleanedTeacher = {};
            
            // Clean keys for all fields in the spreadsheet
            for (const key in teacher) {
                cleanedTeacher[cleanKey(key)] = teacher[key];
            }
            updates[`/teachers/${newKey}`] = cleanedTeacher;
        });

        // Batch operation for efficiency
        db.ref().update(updates)
            .then(() => {
                alert(`Successfully uploaded ${jsonTeachers.length} teachers.`);
                xlsxFile.value = '';
            })
            .catch(error => console.error('Error in bulk upload:', error));
    };

    reader.readAsArrayBuffer(file);
});

// ====================================================================
// REALTIME LISTENING, RENDERING, AND CRUD (READ/UPDATE/DELETE)
// ====================================================================

// REALTIME LISTENER: Fetches all data and triggers rendering
teachersRef.on('value', (snapshot) => {
    const teachersData = snapshot.val();
    cachedTeachersData = teachersData || {}; // Cache the data

    // 1. Get all unique keys for dynamic table headers and filter options
    allKeys = getUniqueKeys(cachedTeachersData);
    
    // 2. Populate the Subject Filter Dropdown
    const subjects = new Set();
    filterSubject.innerHTML = '<option value="">Filter by Subject (All)</option>';

    if (teachersData) {
        for (const id in teachersData) {
            const subject = teachersData[id].subject;
            if (subject) subjects.add(subject);
        }
        Array.from(subjects).sort().forEach(subject => {
            const option = document.createElement('option');
            option.value = subject;
            option.textContent = subject;
            filterSubject.appendChild(option);
        });
    }

    // 3. Render the table
    renderTeachersTable(cachedTeachersData, allKeys); 
}, (error) => {
    console.error('Realtime Listener Error:', error);
});


/**
 * Renders the table body and header based on current filters.
 */
function renderTeachersTable(data, keys) {
    teachersList.innerHTML = '';
    
    // Build/Update Table Header
    const tableHead = teachersTable.querySelector('thead tr');
    tableHead.innerHTML = '';
    keys.forEach(key => {
        const th = document.createElement('th');
        // Simple display capitalization
        th.textContent = key.replace(/_/g, ' ').toUpperCase(); 
        tableHead.appendChild(th);
    });
    const thActions = document.createElement('th');
    thActions.textContent = 'ACTIONS';
    tableHead.appendChild(thActions);

    if (Object.keys(data).length === 0) {
        teachersList.innerHTML = '<tr><td colspan="' + (keys.length + 1) + '">No teachers found in the database.</td></tr>';
        return;
    }
    
    // Apply client-side filters
    const searchTerm = searchInput.value.toLowerCase();
    const selectedSubject = filterSubject.value;

    for (const id in data) {
        const teacher = data[id];
        
        // Filter Logic
        const matchesSearch = keys.some(key => {
            const value = String(teacher[key] || '').toLowerCase();
            return value.includes(searchTerm);
        });
        
        const matchesSubject = selectedSubject === "" || (teacher.subject && teacher.subject === selectedSubject);

        if (matchesSearch && matchesSubject) {
            const row = document.createElement('tr');
            
            keys.forEach(key => {
                const cell = document.createElement('td');
                cell.textContent = teacher[key] || '—';
                row.appendChild(cell);
            });

            // Actions Cell (Edit/Delete)
            const actionsCell = document.createElement('td');
            actionsCell.classList.add('actions-cell');

            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.classList.add('edit-btn');
            editBtn.onclick = () => handleEdit(id, teacher); 

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.classList.add('delete-btn');
            deleteBtn.onclick = () => deleteTeacher(id, teacher.name);

            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(deleteBtn);
            row.appendChild(actionsCell);
            
            teachersList.appendChild(row);
        }
    }
}

// DELETE function
function deleteTeacher(teacherId, teacherName) {
    if (confirm(`Are you sure you want to delete ${teacherName}? This action is irreversible.`)) {
        teachersRef.child(teacherId).remove()
            .then(() => alert(`${teacherName} deleted successfully.`))
            .catch(error => console.error('Deletion error:', error));
    }
}

// EDIT function (Simplified Inline Prompt)
function handleEdit(teacherId, teacherData) {
    // Collect all existing data for the prompt
    let currentData = `Current Data for ${teacherData.name}:\n\n`;
    for (const key in teacherData) {
        currentData += `${key.replace(/_/g, ' ').toUpperCase()}: ${teacherData[key]}\n`;
    }
    currentData += "\nSeparate key:value pairs with commas. Example: subject:Math, years_exp:10";

    const input = prompt("Enter the fields you wish to update (key:value format):\n\n" + currentData);
    
    if (input === null) return; // Cancelled

    try {
        const updates = {};
        input.split(',').forEach(pair => {
            const [key, value] = pair.split(':').map(s => s.trim());
            if (key && value) {
                // Apply cleaning to the key
                updates[cleanKey(key)] = value;
            }
        });

        if (Object.keys(updates).length > 0) {
            teachersRef.child(teacherId).update(updates)
                .then(() => alert(`${teacherData.name} updated successfully!`))
                .catch(error => console.error('Update failed:', error));
        } else {
            alert('No valid updates provided.');
        }

    } catch (e) {
        alert('Invalid input format. Please use "key:value, key2:value2"');
    }
}

// ====================================================================
// FILTER AND SEARCH EVENT LISTENERS
// ====================================================================

// Re-render the table whenever the search input changes or filter dropdown changes
searchInput.addEventListener('input', () => renderTeachersTable(cachedTeachersData, allKeys));
filterSubject.addEventListener('change', () => renderTeachersTable(cachedTeachersData, allKeys));