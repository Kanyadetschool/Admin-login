import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.8.2/firebase-app.js';
import { getDatabase, ref, onValue, set, push, get } from 'https://www.gstatic.com/firebasejs/9.8.2/firebase-database.js';
import firebaseConfig from '../js/GoogleAuthfireBase.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const DataStore = {
    db: null,
    refs: {},
    tables: {},

    async init() {
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
                    { data: 'value', render: data => `$${parseFloat(data).toLocaleString()}` }
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
                    { data: 'accountId' },
                    { data: 'accountName' },
                    { data: 'category' },
                    { data: 'balance', render: data => `$${parseFloat(data).toLocaleString()}` },
                    { data: 'lastTransaction' },
                    { data: 'status', render: data => `<span class="badge bg-${data === 'Active' ? 'success' : 'warning'}">${data}</span>` },
                    {
                        data: null,
                        render: data => `
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-info" onclick="viewTransactions('${data.accountId}')">View</button>
                                <button class="btn btn-primary" onclick="editAccount('${data.accountId}')">Edit</button>
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
                    { data: 'condition' }
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
                    { data: 'status', render: data => `<span class="badge bg-${data === 'Completed' ? 'success' : 'warning'}">${data}</span>` }
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
            }
        ];

        // Initialize each table
        for (const table of tables) {
            this.refs[table.name] = ref(this.db, table.name);
            
            // Initialize DataTable with proper configuration
            this.tables[table.name] = $(`#${table.tableId}`).DataTable({
                columns: table.columns,
                data: [],
                responsive: true,
                processing: true,
                language: {
                    processing: "Loading data...",
                    emptyTable: "No data available"
                }
            });

            // Setup real-time listener
            onValue(this.refs[table.name], (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const arrayData = Object.values(data);
                    window[table.name] = arrayData;
                    this.tables[table.name].clear().rows.add(arrayData).draw();
                    console.log(`Updated ${table.name} with ${arrayData.length} records`);
                } else {
                    console.log(`No data available for ${table.name}`);
                    window[table.name] = [];
                    this.tables[table.name].clear().draw();
                }
            }, (error) => {
                console.error(`Error fetching ${table.name}:`, error);
            });
        }
    },

    async addRecord(type, record) {
        try {
            const newRef = push(this.refs[type]);
            record.id = record.id || `${type.slice(0, 2).toUpperCase()}${Date.now()}`;
            record.lastUpdated = new Date().toISOString().split('T')[0];
            
            await set(newRef, record);
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
            // For accounts, check both id and accountId
            const recordKey = Object.keys(records).find(key => 
                records[key].id === id || records[key].accountId === id
            );
            
            if (recordKey) {
                const updatedRecord = {
                    ...records[recordKey],
                    ...updates,
                    lastUpdated: new Date().toISOString().split('T')[0]
                };
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
            const recordKey = Object.keys(records).find(key => records[key].id === id);
            
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

// Initialize DataStore
try {
    await DataStore.init();
    console.log('DataStore initialized successfully');
} catch (error) {
    console.error('Failed to initialize DataStore:', error);
    alert('Failed to load data. Please check your connection and refresh the page.');
}

// Make helpers available globally
window.inventoryHelpers = DataStore.helpers;
window.accountHelpers = DataStore.helpers;
window.DataStore = DataStore;

export { DataStore };
