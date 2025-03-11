import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.8.2/firebase-app.js';
import { getDatabase, ref, onValue, set, push, get } from 'https://www.gstatic.com/firebasejs/9.8.2/firebase-database.js';
import firebaseConfig from '../config/firebase.js';

// Sample inventory data
const inventoryData = [
    {
        id: "EQ001",
        name: "Projector",
        category: "Electronics",
        quantity: 1,
        status: "good",
        location: "Storage Room A",
        lastUpdated: "2025-03-8",
        value: 599.99
    },
    {
        id: "EQ002",
        name: "Laptop",
        category: "Electronics",
        quantity: 2,
        status: "good",
        location: "IT Lab",
        lastUpdated: "2023-07-14",
        value: 999.99
    },
    {
        id: "EQ002",
        name: "Laptop",
        category: "Electronics",
        quantity: 3,
        status: "low",
        location: "IT Lab",
        lastUpdated: "2023-07-14",
        value: 999.99
    },
    {
        id: "SP001",
        name: "Whiteboard Markers",
        category: "Supplies",
        quantity: 150,
        status: "good",
        location: "Supply Closet",
        lastUpdated: "2023-07-10",
        value: 2.99
    },
    {
        id: "SP001",
        name: " Markers",
        category: "Supplies",
        quantity: 100,
        status: "good",
        location: "Supply Closet",
        lastUpdated: "2023-07-10",
        value: 2.99
    },
    {
        id: "FR001",
        name: "Student Desks",
        category: "Furniture",
        quantity: 8,
        status: "low",
        location: "Classroom 101",
        lastUpdated: "2023-07-01",
        value: 149.99
    },
    {
        id: "BK001",
        name: "Science Textbooks",
        category: "Books",
        quantity: 45,
        status: "good",
        location: "Library",
        lastUpdated: "2023-06-28",
        value: 79.99
    }
];

const teachersInventory = [
    {
        id: "T001",
        teacherName: "John Smith",
        department: "Science",
        itemName: "Laptop",
        status: "Active",
        assignedDate: "2023-06-01",
        returnDate: "2024-05-31",
    },
    {
        id: "T002",
        teacherName: "Sarah Johnson",
        department: "Mathematics",
        itemName: "Projector",
        status: "Active",
        assignedDate: "2023-05-15",
        returnDate: "2024-05-31",
    },
    {
        id: "T003",
        teacherName: "Michael Brown",
        department: "English",
        itemName: "Tablet",
        status: "Returned",
        assignedDate: "2023-01-15",
        returnDate: "2023-06-30",
    }
];

const accountsData = [
    {
        accountId: "ACC001",
        accountName: "Nemis UIC",
        category: "Operating",
        balance: 150000.00,
        lastTransaction: "2023-07-15",
        status: "Active",
        transactions: [
            {
                date: "2023-07-15",
                description: "Teacher Supplies",
                type: "Expense",
                amount: -1500.00
            },
            {
                date: "2023-07-01",
                description: "Government Funding",
                type: "Income",
                amount: 50000.00
            }
        ]
    },
    {
        accountId: "ACC002",
        accountName: "Library Fund",
        category: "Restricted",
        balance: 25000.00,
        lastTransaction: "2023-07-10",
        status: "Active",
        transactions: [
            {
                date: "2023-07-10",
                description: "Book Purchase",
                type: "Expense",
                amount: -2000.00
            }
        ]
    },
    {
        accountId: "ACC003",
        accountName: "Technology Fund",
        category: "Special Purpose",
        balance: 75000.00,
        lastTransaction: "2023-07-12",
        status: "Active",
        transactions: [
            {
                date: "2023-07-12",
                description: "Computer Lab Equipment",
                type: "Expense",
                amount: -15000.00
            }
        ]
    }
];

const recentTransactionsData = [
    {
        transactionId: "TRX001",
        date: "2023-07-15",
        accountName: "General Fund",
        description: "Teacher Supplies",
        type: "Expense",
        reference: "PO-2023-0715",
        amount: -1500.00,
        balance: 150000.00
    },
    {
        transactionId: "TRX002",
        date: "2023-07-12",
        accountName: "Technology Fund",
        description: "Computer Lab Equipment",
        type: "Expense",
        reference: "PO-2023-0712",
        amount: -15000.00,
        balance: 75000.00
    },
    {
        transactionId: "TRX003",
        date: "2023-07-10",
        accountName: "Library Fund",
        description: "Book Purchase",
        type: "Expense",
        reference: "PO-2023-0710",
        amount: -2000.00,
        balance: 25000.00
    },
    {
        transactionId: "TRX004",
        date: "2023-07-01",
        accountName: "General Fund",
        description: "Government Funding",
        type: "Income",
        reference: "GF-2023-0701",
        amount: 50000.00,
        balance: 151500.00
    }
];

const facilitiesData = [
    {
        id: "FAC001",
        name: "Main Building",
        location: "School Campus",
        status: "Operational",
        lastMaintenance: "2023-06-15",
        nextMaintenance: "2023-09-15",
        condition: "Good"
    },
    {
        id: "FAC002",
        name: "Science Laboratory",
        location: "Building B",
        status: "Maintenance Required",
        lastMaintenance: "2023-03-10",
        nextMaintenance: "2023-08-10",
        condition: "Fair"
    },
    {
        id: "FAC003",
        name: "Computer Lab",
        location: "Building A",
        status: "Operational",
        lastMaintenance: "2023-07-01",
        nextMaintenance: "2023-10-01",
        condition: "Excellent"
    }
];

const maintenanceData = [
    {
        id: "MNT001",
        date: "2023-07-15",
        itemName: "Air Conditioning Unit",
        type: "Repair",
        description: "Replaced filter and cleaned coils",
        cost: 250.00,
        status: "Completed"
    },
    {
        id: "MNT002",
        date: "2023-07-10",
        itemName: "Classroom Lights",
        type: "Replacement",
        description: "Replaced faulty LED lights",
        cost: 180.00,
        status: "Completed"
    },
    {
        id: "MNT003",
        date: "2023-07-20",
        itemName: "Science Lab Equipment",
        type: "Maintenance",
        description: "Regular calibration and testing",
        cost: 500.00,
        status: "Scheduled"
    }
];

const reportsData = [
    {
        id: "RPT001",
        name: "Monthly Inventory Summary",
        type: "Inventory",
        date: "2023-07-01",
        status: "Generated",
        actions: "View | Download"
    },
    {
        id: "RPT002",
        name: "Maintenance Cost Report",
        type: "Maintenance",
        date: "2023-07-15",
        status: "Generated",
        actions: "View | Download"
    },
    {
        id: "RPT003",
        name: "Asset Depreciation Report",
        type: "Financial",
        date: "2023-07-01",
        status: "Pending",
        actions: "Generate"
    }
];

// Helper functions for inventory management
const inventoryHelpers = {
    getTotalItems() {
        return inventoryData.reduce((sum, item) => sum + item.quantity, 0);
    },

    getLowStockItems() {
        return inventoryData.filter(item => item.status === 'low').length;
    },

    getUniqueCategories() {
        return new Set(inventoryData.map(item => item.category)).size;
    },

    getTotalValue() {
        const total = inventoryData.reduce((sum, item) => sum + (item.value * item.quantity), 0);
        return `$${total.toLocaleString()}`;
    },

    searchItems(term) {
        return inventoryData.filter(item => 
            Object.values(item).some(value => 
                String(value).toLowerCase().includes(term)
            )
        );
    }
};

// Add account helper functions
const accountHelpers = {
    getTotalBalance() {
        return accountsData.reduce((sum, account) => sum + account.balance, 0);
    },
    
    getActiveAccounts() {
        return accountsData.filter(account => account.status === "Active").length;
    },
    
    getRecentTransactions(days = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        return accountsData.flatMap(account => 
            account.transactions.filter(trans => 
                new Date(trans.date) >= cutoffDate
            )
        );
    },
    
    getCategoryTotals() {
        return accountsData.reduce((totals, account) => {
            totals[account.category] = (totals[account.category] || 0) + account.balance;
            return totals;
        }, {});
    },

    getAllTransactions() {
        return recentTransactionsData.sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );
    },

    getTransactionsByAccount(accountId) {
        const account = accountsData.find(a => a.accountId === accountId);
        return recentTransactionsData.filter(t => t.accountName === account.accountName);
    },

    getMonthlyTotals() {
        const currentMonth = new Date().getMonth();
        const monthlyTransactions = recentTransactionsData.filter(t => 
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
};

// Data persistence helpers
const DataStore = {
    db: null,
    refs: {},

    async init() {
        const app = initializeApp(firebaseConfig);
        this.db = getDatabase(app);
        
        // Initialize refs
        const tables = ['inventoryData', 'teachersInventory', 'accountsData', 
                       'facilitiesData', 'maintenanceData', 'reportsData'];
        
        await Promise.all(tables.map(async (table) => {
            this.refs[table] = ref(this.db, table);
            
            // Get initial data
            const snapshot = await get(this.refs[table]);
            if (!snapshot.exists()) {
                await set(this.refs[table], window[table]);
            } else {
                window[table] = Object.values(snapshot.val());
            }

            // Listen for changes
            onValue(this.refs[table], (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    window[table] = Object.values(data);
                    this.updateTable(table, window[table]);
                }
            });
        }));
    },

    saveData(key, data) {
        set(this.refs[key], data);
    },

    addRecord(type, record) {
        const newRef = push(this.refs[type]);
        record.id = record.id || newRef.key;
        set(newRef, record);
    },

    updateRecord(type, id, updates) {
        const itemRef = ref(this.db, `${type}/${id}`);
        set(itemRef, { ...updates, id });
    },

    deleteRecord(type, id) {
        const itemRef = ref(this.db, `${type}/${id}`);
        set(itemRef, null);
    },

    updateTable(key, data) {
        const tables = {
            'inventoryData': '#inventoryTable',
            'teachersInventory': '#teachersTable',
            'accountsData': '#accountsTable',
            'facilitiesData': '#facilitiesTable',
            'maintenanceData': '#maintenanceTable',
            'reportsData': '#reportsTable'
        };

        const tableId = tables[key];
        if (tableId) {
            const table = $(tableId).DataTable();
            table.clear().rows.add(data).draw();
        }
    }
};

// Initialize data store
DataStore.init();

// Make DataStore available globally
window.DataStore = DataStore;

// Make the data and helpers available globally
window.inventoryData = inventoryData;
window.teachersInventory = teachersInventory;
window.accountsData = accountsData;
window.recentTransactionsData = recentTransactionsData;
window.inventoryHelpers = inventoryHelpers;
window.accountHelpers = accountHelpers;
window.facilitiesData = facilitiesData;
window.maintenanceData = maintenanceData;
window.reportsData = reportsData;

export { DataStore };
