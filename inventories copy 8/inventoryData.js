import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.8.2/firebase-app.js';
import { getDatabase, ref, onValue, set, push, get } from 'https://www.gstatic.com/firebasejs/9.8.2/firebase-database.js';
import firebaseConfig from '../config/firebase.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const DataStore = {
    db: null,
    refs: {},
    tables: {},

    async init() {
        // Cleanup existing instances if any
        if (this.tables) {
            Object.values(this.tables).forEach(table => {
                if (table && table.destroy) {
                    table.destroy();
                }
            });
            this.tables = {};
        }

        // Wait for DOM and dependencies
        await new Promise(resolve => {
            if (document.readyState === 'complete' && typeof $ !== 'undefined' && $.fn.DataTable) {
                resolve();
            } else {
                const checkDependencies = () => {
                    if (typeof $ !== 'undefined' && $.fn.DataTable) {
                        resolve();
                    }
                };
                document.addEventListener('readystatechange', checkDependencies);
                window.addEventListener('load', checkDependencies);
            }
        });

        this.db = getDatabase(app);

        // Define complete table configurations for all tabs
        const tables = [
            {
                name: 'inventoryData',
                tableId: 'inventoryTable',
                columns: [
                    { data: 'id' },
                    { data: 'name' },
                    { data: 'category' },
                    { data: 'quantity' },
                    { data: 'status', render: data => `<span class="status-indicator ${data === 'low' ? 'status-low' : 'status-good'}"></span>${data}` },
                    { data: 'location' },
                    { data: 'lastUpdated' },
                    { data: 'value', render: data => `$${parseFloat(data).toLocaleString()}` },
                    {
                        data: null,
                        render: function(data) {
                            return `
                                <div class="btn-group btn-group-sm">
                                    <button class="btn btn-primary" onclick="handleAction('editEquipment', '${data.id}')">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-danger" onclick="handleAction('deleteEquipment', '${data.id}')">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            `;
                        }
                    }
                ]
            },
            {
                name: 'teachersInventory',
                tableId: 'teachersTable',
                columns: [
                    { data: 'id' },
                    { data: 'teacherName' },
                    { data: 'department' },
                    { data: 'itemName' },
                    { data: 'status', render: data => `<span class="status-indicator ${data === 'Active' ? 'status-good' : 'status-low'}"></span>${data}` },
                    { data: 'assignedDate' },
                    { data: 'returnDate' },
                    { 
                        data: null,
                        render: function(data) {
                            return `
                                <button class="btn btn-sm btn-primary" onclick="editTeacherItem('${data.id}')">Edit</button>
                                <button class="btn btn-sm btn-danger" onclick="deleteTeacherItem('${data.id}')">Delete</button>
                            `;
                        }
                    }
                ]
            },
            {
                name: 'accountsData',
                tableId: 'accountsTable',
                columns: [
                    { 
                        data: null,
                        render: function(data) {
                            return data.accountId || '';  // Use accountId consistently
                        }
                    },
                    { data: 'accountName' },
                    { data: 'category' },
                    { 
                        data: 'balance',
                        render: data => `$${parseFloat(data).toLocaleString()}`
                    },
                    { 
                        data: 'lastTransaction',  // Changed from lastUpdated to lastTransaction
                        defaultContent: '-'  // Provide default content if missing
                    },
                    { 
                        data: 'status',
                        render: data => `<span class="badge bg-${data === 'Active' ? 'success' : 'warning'}">${data || 'Unknown'}</span>`
                    },
                    {
                        data: null,
                        render: data => `
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-info" onclick="viewTransactions('${data.accountId}')">View</button>
                                <button class="btn btn-primary" onclick="editAccount('${data.accountId}')">Edit</button>
                                <button class="btn btn-danger" onclick="deleteAccount('${data.accountId}')">Delete</button>
                            </div>`
                    }
                ]
            },
            {
                name: 'facilitiesData',
                tableId: 'facilitiesTable',
                columns: [
                    { data: 'id' },
                    { data: 'name' },
                    { data: 'location' },
                    { data: 'status', render: data => `<span class="badge bg-${data === 'Operational' ? 'success' : 'warning'}">${data}</span>` },
                    { data: 'lastMaintenance' },
                    { data: 'nextMaintenance' },
                    { data: 'condition' },
                    {
                        data: null,
                        render: function(data) {
                            return `
                                <div class="btn-group btn-group-sm">
                                    <button class="btn btn-primary" onclick="handleAction('editFacility', '${data.id}')">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-danger" onclick="handleAction('deleteFacility', '${data.id}')">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            `;
                        }
                    }
                ]
            },
            {
                name: 'maintenanceData',
                tableId: 'maintenanceTable',
                columns: [
                    { data: 'id' },
                    { data: 'date' },
                    { data: 'itemName' },
                    { data: 'type' },
                    { data: 'description' },
                    { data: 'cost', render: data => `$${parseFloat(data).toLocaleString()}` },
                    { data: 'status', render: data => `<span class="badge bg-${data === 'Completed' ? 'success' : 'warning'}">${data}</span>` },
                    {
                        data: null,
                        render: function(data) {
                            return `
                                <div class="btn-group btn-group-sm">
                                    <button class="btn btn-primary" onclick="handleAction('editMaintenance', '${data.id}')">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-danger" onclick="handleAction('deleteMaintenance', '${data.id}')">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            `;
                        }
                    }
                ]
            },
            {
                name: 'reportsData',
                tableId: 'reportsTable',
                columns: [
                    { data: 'id' },
                    { data: 'name' },
                    { data: 'type' },
                    { data: 'date' },
                    { data: 'status', render: data => `<span class="badge bg-${data === 'Generated' ? 'success' : 'warning'}">${data}</span>` },
                    {
                        data: null,
                        render: function(data) {
                            return data.status === 'Generated' 
                                ? `<button class="btn btn-info btn-sm" onclick="viewReport('${data.id}')">View</button>`
                                : `<button class="btn btn-primary btn-sm" onclick="generateReport('${data.id}')">Generate</button>`;
                        }
                    }
                ]
            },
            {
                name: 'transferredStudents',
                tableId: 'transferredStudentsTable',
                columns: [
                    { data: 'studentId' },
                    { data: 'name' },
                    { data: 'previousClass' },
                    { data: 'newSchool' },
                    { data: 'transferDate' },
                    { data: 'reason' },
                    { data: 'status' },
                    {
                        data: null,
                        render: function(data) {
                            return `
                                <div class="btn-group btn-group-sm">
                                    <button class="btn btn-info" onclick="viewTransferDetails('${data.studentId}')">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-primary" onclick="editTransfer('${data.studentId}')">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-danger" onclick="deleteTransfer('${data.studentId}')">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            `;
                        }
                    }
                ]
            }
        ];

        // Initialize refs first
        for (const table of tables) {
            this.refs[table.name] = ref(this.db, table.name);
        }

        try {
            // Load all data first in parallel
            const dataLoads = tables.map(async table => {
                const snapshot = await get(this.refs[table.name]);
                const rawData = snapshot.val() || {};
                
                // Validate and transform data
                const validData = Object.values(rawData)
                    .filter(item => item && typeof item === 'object')
                    .map(item => {
                        // Ensure all required properties exist for each table type
                        const baseItem = {
                            id: item.id || '',
                            name: item.name || '',
                            lastUpdated: item.lastUpdated || new Date().toISOString().split('T')[0]
                        };

                        switch(table.name) {
                            case 'inventoryData':
                                return {
                                    ...baseItem,
                                    category: item.category || '',
                                    quantity: parseInt(item.quantity) || 0,
                                    status: item.status || 'unknown',
                                    location: item.location || '',
                                    value: parseFloat(item.value) || 0
                                };
                            case 'teachersInventory':
                                return {
                                    ...baseItem,
                                    teacherName: item.teacherName || '',
                                    department: item.department || '',
                                    itemName: item.itemName || '',
                                    status: item.status || 'Pending',
                                    assignedDate: item.assignedDate || '',
                                    returnDate: item.returnDate || ''
                                };
                            case 'maintenanceData':
                                return {
                                    ...baseItem,
                                    date: item.date || '',
                                    itemName: item.itemName || '',
                                    type: item.type || '',
                                    description: item.description || '',
                                    cost: parseFloat(item.cost) || 0,
                                    status: item.status || 'Pending'
                                };
                            case 'facilitiesData':
                                return {
                                    ...baseItem,
                                    location: item.location || '',
                                    status: item.status || 'Unknown',
                                    lastMaintenance: item.lastMaintenance || '',
                                    nextMaintenance: item.nextMaintenance || '',
                                    condition: item.condition || 'Unknown'
                                };
                            case 'transferredStudents':
                                return {
                                    ...baseItem,
                                    studentId: item.studentId || '',
                                    previousClass: item.previousClass || '',
                                    newSchool: item.newSchool || '',
                                    transferDate: item.transferDate || '',
                                    reason: item.reason || '',
                                    status: item.status || 'Pending'
                                };
                            case 'accountsData':
                                return {
                                    ...baseItem,
                                    accountId: item.accountId || item.id || '',  // Ensure accountId is primary identifier
                                    accountName: item.accountName || '',
                                    category: item.category || '',
                                    balance: parseFloat(item.balance) || 0,
                                    status: item.status || 'Active',
                                    lastTransaction: item.lastTransaction || item.lastUpdated || new Date().toISOString().split('T')[0]
                                };
                            default:
                                return baseItem;
                        }
                    })
                    .filter(item => item.id); // Remove invalid items

                window[table.name] = validData;
                console.log(`Loaded ${validData.length} records for ${table.name}`);
                return { table, data: validData };
            });

            const loadedData = await Promise.all(dataLoads);

            // Initialize tables after data is loaded
            for (const { table, data } of loadedData) {
                try {
                    const tableElement = document.getElementById(table.tableId);
                    if (!tableElement) {
                        console.warn(`Table #${table.tableId} not found, skipping initialization`);
                        continue;
                    }

                    // Save original visibility state
                    const tabPane = tableElement.closest('.tab-pane');
                    const wasActive = tabPane?.classList.contains('active');
                    
                    // Make tab temporarily visible for initialization
                    if (tabPane && !wasActive) {
                        tabPane.classList.add('active', 'temp-visible');
                    }

                    // Initialize DataTable
                    this.tables[table.name] = $(tableElement).DataTable({
                        data,
                        columns: table.columns,
                        responsive: true,
                        processing: true,
                        autoWidth: true,
                        retrieve: true,
                        language: {
                            processing: "Loading data...",
                            emptyTable: "No data available"
                        }
                    });

                    // Restore original visibility state
                    if (tabPane && !wasActive) {
                        tabPane.classList.remove('active', 'temp-visible');
                    }

                    // Setup real-time listener
                    onValue(this.refs[table.name], (snapshot) => {
                        const newData = Object.values(snapshot.val() || {});
                        window[table.name] = newData;
                        if (this.tables[table.name]) {
                            this.tables[table.name].clear().rows.add(newData).draw();
                        }
                    });

                } catch (error) {
                    console.error(`Error initializing ${table.name}:`, error);
                }
            }

            // Add tab change handler for table redraw
            $('a[data-bs-toggle="tab"]').on('shown.bs.tab', (e) => {
                const targetPane = $(e.target.getAttribute('href'));
                const table = targetPane.find('table').DataTable();
                if (table) {
                    table.columns.adjust().draw();
                }
            });

            // Signal completion
            window.dispatchEvent(new Event('DataStoreReady'));

        } catch (error) {
            console.error('Error during initialization:', error);
            throw error;
        }
    },

    destroy() {
        if (this.tables) {
            Object.values(this.tables).forEach(table => {
                if (table && table.destroy) {
                    table.destroy();
                }
            });
            this.tables = {};
        }
    },

    async addRecord(type, record) {
        try {
            if (type === 'accountsData') {
                record = {
                    id: record.id || `ACC${Date.now()}`,
                    accountId: record.id || `ACC${Date.now()}`,
                    accountName: record.accountName || '',
                    category: record.category || 'Operating',
                    balance: parseFloat(record.balance) || 0,
                    status: record.status || 'Active',
                    lastTransaction: record.lastTransaction || new Date().toISOString().split('T')[0],
                    description: record.description || '',
                    createdAt: new Date().toISOString(),
                };
            }

            const newRef = push(this.refs[type]);
            await set(newRef, record);
            
            // Refresh the table after adding
            if (this.tables[type]) {
                this.tables[type].ajax.reload();
            }
            
            return { success: true, id: record.id };
        } catch (error) {
            console.error('Error adding record:', error);
            return { success: false, error: error.message };
        }
    },

    async updateRecord(type, id, updates) {
        try {
            const snapshot = await get(this.refs[type]);
            const records = snapshot.val() || {};
            
            // Check if new ID already exists (if ID is being changed)
            if (updates.id !== id && Object.values(records).some(r => r.id === updates.id)) {
                throw new Error('New ID already exists');
            }

            const recordKey = Object.keys(records).find(key => 
                records[key].id === id || records[key].accountId === id
            );
            
            if (recordKey) {
                const updatedRecord = {
                    ...records[recordKey],
                    ...updates,
                    lastUpdated: new Date().toISOString().split('T')[0]
                };
                
                // For accounts, ensure accountId is updated along with id
                if (type === 'accountsData') {
                    updatedRecord.accountId = updates.id;
                }
                
                await set(ref(this.db, `${type}/${recordKey}`), updatedRecord);
                return { success: true };
            }
            return { success: false, error: 'Record not found' };
        } catch (error) {
            console.error('Error updating record:', error);
            return { success: false, error: error.message };
        }
    },

    async deleteRecord(type, id) {
        try {
            const snapshot = await get(this.refs[type]);
            const records = snapshot.val() || {};
            let recordKey;

            if (type === 'accountsData') {
                recordKey = Object.keys(records).find(key => 
                    records[key].accountId === id || records[key].id === id
                );
            } else {
                recordKey = Object.keys(records).find(key => records[key].id === id);
            }
            
            if (recordKey) {
                await set(ref(this.db, `${type}/${recordKey}`), null);
                return { success: true };
            }
            return { success: false, error: 'Record not found' };
        } catch (error) {
            console.error('Error deleting record:', error);
            return { success: false, error: error.message };
        }
    },

    // Helper functions that now work with real-time data
    helpers: {
        getTotalItems() {
            return (window.inventoryData || [])
                .reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
        },

        getLowStockItems() {
            return (window.inventoryData || [])
                .filter(item => item.status === 'low').length;
        },

        getUniqueCategories() {
            return new Set((window.inventoryData || [])
                .map(item => item.category)).size;
        },

        getTotalValue() {
            const total = (window.inventoryData || [])
                .reduce((sum, item) => sum + (parseFloat(item.value) * parseInt(item.quantity)), 0);
            return `$${total.toLocaleString()}`;
        },

        getTransactionsByAccount(accountId) {
            const account = (window.accountsData || [])
                .find(a => a.accountId === accountId);
            return (window.recentTransactionsData || [])
                .filter(t => t.accountName === account?.accountName);
        },

        getMonthlyTotals() {
            const transactions = window.recentTransactionsData || [];
            const currentMonth = new Date().getMonth();
            const monthlyTransactions = transactions.filter(t => 
                new Date(t.date).getMonth() === currentMonth
            );

            return {
                income: monthlyTransactions
                    .filter(t => t.amount > 0)
                    .reduce((sum, t) => sum + t.amount, 0),
                expenses: Math.abs(monthlyTransactions
                    .filter(t => t.amount < 0)
                    .reduce((sum, t) => sum + t.amount, 0))
            };
        }
    }
};

// Move initialization to after exports
export { DataStore };

// Initialize DataStore after everything is loaded
window.addEventListener('load', async () => {
    try {
        await DataStore.init();
        console.log('DataStore initialized successfully');
        
        // Make helpers available globally
        window.inventoryHelpers = DataStore.helpers;
        window.accountHelpers = DataStore.helpers;
        window.DataStore = DataStore;
        
    } catch (error) {
        console.error('Failed to initialize DataStore:', error);
        alert('Failed to load data. Please check your connection and refresh the page.');
    }
});