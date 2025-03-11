document.addEventListener('DOMContentLoaded', function() {
    initializeTables();
    setupEventListeners();
});

function initializeTables() {
    // Initialize equipment table with search and filter support
    const equipmentTable = $('#inventoryTable').DataTable({
        data: window.inventoryData || [], // Fix: use window.inventoryData
        columns: [
            { data: 'id' },
            { data: 'name' },
            { data: 'category' },
            { data: 'quantity' },
            { 
                data: 'status',
                render: function(data, type, row) {
                    const statusClass = data === 'low' ? 'status-low' : 'status-good';
                    return `<span class="status-indicator ${statusClass}"></span>${data}`;
                }
            },
            { data: 'location' },
            { data: 'lastUpdated' },
            { 
                data: 'value',
                render: function(data) {
                    return `$${data.toLocaleString()}`;
                }
            },
            {
                data: null,
                render: function(data) {
                    return `
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-primary" onclick="editEquipment('${data.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-danger" onclick="deleteEquipment('${data.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ],
        // Add better error handling
        language: {
            emptyTable: "No equipment data available",
            loadingRecords: "Loading equipment data...",
            zeroRecords: "No matching equipment found"
        },
        // Add initialization callback
        initComplete: function(settings, json) {
            console.log('Equipment table initialized with:', window.inventoryData?.length || 0, 'records');
            if (!window.inventoryData?.length) {
                console.warn('No equipment data available during initialization');
            }
            // Apply search to each column
            this.api().columns().every(function () {
                let column = this;
                $('input, select', this.header()).on('keyup change', function () {
                    if (column.search() !== this.value) {
                        column.search(this.value).draw();
                    }
                });
            });
        }
    });

    // Setup global search for equipment
    $('#equipment .search-box').on('keyup', function() {
        equipmentTable.search(this.value).draw();
    });

    // Initialize teachers table with search
    const teachersTable = $('#teachersTable').DataTable({
        data: teachersInventory,
        columns: [
            { data: 'id' },
            { data: 'teacherName' },
            { data: 'department' },
            { data: 'itemName' },
            { 
                data: 'status',
                render: function(data) {
                    const statusClass = data === 'Active' ? 'status-good' : 'status-low';
                    return `<span class="status-indicator ${statusClass}"></span>${data}`;
                }
            },
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
    });

    // Setup global search for teachers
    $('#teachers .search-box').on('keyup', function() {
        teachersTable.search(this.value).draw();
    });

    // Initialize accounts table with search and filter support
    const accountsTable = $('#accountsTable').DataTable({
        data: accountsData,
        scrollX: true,
        columns: [
            { data: 'accountId' },
            { data: 'accountName' },
            { data: 'category' },
            { 
                data: 'balance',
                render: function(data) {
                    const colorClass = data >= 0 ? 'text-success' : 'text-danger';
                    return `<span class="${colorClass}">$${Math.abs(data).toLocaleString()}</span>`;
                }
            },
            { data: 'lastTransaction' },
            {
                data: 'status',
                render: function(data) {
                    const statusColors = {
                        'Active': 'success',
                        'Inactive': 'warning',
                        'Frozen': 'danger'
                    };
                    return `<span class="badge bg-${statusColors[data]}">${data}</span>`;
                }
            },
            {
                data: null,
                render: function(data) {
                    return `
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-info" onclick="viewTransactions('${data.accountId}')" title="View Transactions">
                                <i class="fas fa-list"></i>
                            </button>
                            <button class="btn btn-primary" onclick="editAccount('${data.accountId}')" title="Edit Account">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-warning" onclick="toggleAccountStatus('${data.accountId}')" title="Toggle Status">
                                <i class="fas fa-power-off"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ],
        initComplete: function () {
            // Apply search to each column
            this.api().columns().every(function () {
                let column = this;
                $('input, select', this.header()).on('keyup change', function () {
                    if (column.search() !== this.value) {
                        column.search(this.value).draw();
                    }
                });
            });
        }
    });

    // Initialize recent transactions table
    $('#recentTransactionsTable').DataTable({
        data: recentTransactionsData,
        scrollX: true,
        pageLength: 5,
        order: [[0, 'desc']],
        columns: [
            { data: 'date' },
            { data: 'accountName' },
            { data: 'description' },
            { data: 'type' },
            { data: 'reference' },
            { 
                data: 'amount',
                render: function(data) {
                    const color = data < 0 ? 'text-danger' : 'text-success';
                    const symbol = data < 0 ? '-' : '+';
                    return `<span class="${color}">${symbol}$${Math.abs(data).toLocaleString()}</span>`;
                }
            },
            { 
                data: 'balance',
                render: function(data) {
                    return `$${data.toLocaleString()}`;
                }
            },
            {
                data: null,
                render: function(data) {
                    return `
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-info" onclick="viewTransactionDetail('${data.transactionId}')" title="View Details">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-secondary" onclick="printTransaction('${data.transactionId}')" title="Print">
                                <i class="fas fa-print"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ]
    });

    // Remove the old column filters initialization
    // Initialize column filters for all tables
    $('.column-filter').each(function() {
        const table = $(this).closest('table').DataTable();
        const columnIdx = $(this).closest('th').index();
        
        $(this).on('keyup change', function() {
            table
                .column(columnIdx)
                .search(this.value)
                .draw();
        });
    });

    // Initialize supplies table
    $('#suppliesTable').DataTable({
        data: inventoryData.filter(item => item.category === 'Supplies'),
        columns: [
            { data: 'id' },
            { data: 'name' },
            { data: 'quantity' },
            { data: 'status' },
            { data: 'location' },
            { data: 'lastUpdated' },
            { data: 'value' }
        ]
    });

    // Initialize facilities table
    $('#facilitiesTable').DataTable({
        data: facilitiesData,
        columns: [
            { data: 'id' },
            { data: 'name' },
            { data: 'location' },
            {
                data: 'status',
                render: function(data) {
                    const statusClass = data === 'Operational' ? 'success' : 'warning';
                    return `<span class="badge bg-${statusClass}">${data}</span>`;
                }
            },
            { data: 'lastMaintenance' },
            { data: 'nextMaintenance' },
            {
                data: 'condition',
                render: function(data) {
                    const conditionColors = {
                        'Excellent': 'success',
                        'Good': 'primary',
                        'Fair': 'warning',
                        'Poor': 'danger'
                    };
                    return `<span class="badge bg-${conditionColors[data]}">${data}</span>`;
                }
            }
        ],
        order: [[0, 'asc']],
        pageLength: 10,
        responsive: true
    });

    // Initialize maintenance table
    $('#maintenanceTable').DataTable({
        data: maintenanceData,
        columns: [
            { data: 'id' },
            { data: 'date' },
            { data: 'itemName' },
            { data: 'type' },
            { data: 'description' },
            {
                data: 'cost',
                render: function(data) {
                    return `$${data.toLocaleString()}`;
                }
            },
            {
                data: 'status',
                render: function(data) {
                    const statusClass = data === 'Completed' ? 'success' : 'warning';
                    return `<span class="badge bg-${statusClass}">${data}</span>`;
                }
            }
        ],
        order: [[1, 'desc']],
        pageLength: 10,
        responsive: true
    });

    // Initialize reports table
    $('#reportsTable').DataTable({
        data: reportsData,
        columns: [
            { data: 'id' },
            { data: 'name' },
            { data: 'type' },
            { data: 'date' },
            {
                data: 'status',
                render: function(data) {
                    const statusClass = data === 'Generated' ? 'success' : 'warning';
                    return `<span class="badge bg-${statusClass}">${data}</span>`;
                }
            },
            {
                data: 'actions',
                render: function(data, type, row) {
                    if (row.status === 'Generated') {
                        return `
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-info" onclick="viewReport('${row.id}')">
                                    <i class="fas fa-eye"></i> View
                                </button>
                                <button class="btn btn-secondary" onclick="downloadReport('${row.id}')">
                                    <i class="fas fa-download"></i> Download
                                </button>
                            </div>`;
                    } else {
                        return `
                            <button class="btn btn-primary btn-sm" onclick="generateReport('${row.id}')">
                                <i class="fas fa-cog"></i> Generate
                            </button>`;
                    }
                }
            }
        ],
        order: [[3, 'desc']],
        pageLength: 10,
        responsive: true
    });
}

// Add data validation function
function validateEquipmentData(data) {
    return Array.isArray(data) && data.every(item => 
        item && typeof item === 'object' && 
        'id' in item && 
        'name' in item &&
        'category' in item &&
        'quantity' in item
    );
}

function setupEventListeners() {
    // Remove old search box listener
    $('.search-box').on('keyup', function() {
        const activeTabId = $('.nav-tabs .active').attr('href').substring(1);
        const table = $(`#${activeTabId}Table`).DataTable();
        table.search(this.value).draw();
    });

    // Add notice for read-only actions
    const readOnlyNotice = () => {
        alert('This is a read-only demonstration. Data modifications are not permitted.');
    };

    // Handle all "Add New" buttons
    document.querySelectorAll('.btn-primary').forEach(btn => {
        if (btn.textContent.includes('Add')) {
            btn.addEventListener('click', readOnlyNotice);
        }
    });

    // Handle Income/Expense buttons
    document.querySelectorAll('.btn-success, .btn-danger').forEach(btn => {
        if (btn.textContent.includes('Income') || btn.textContent.includes('Expense')) {
            btn.addEventListener('click', readOnlyNotice);
        }
    });

    // Add tab change handler
    $('#inventoryTabs a[data-bs-toggle="tab"]').on('shown.bs.tab', function (e) {
        const target = $(e.target).attr('href');
        const table = $(`${target} table`).DataTable();
        if (table) {
            table.columns.adjust().draw();
        }
    });

    // Add handlers for new tab actions
    setupSuppliesHandlers();
    setupFacilitiesHandlers();
    setupMaintenanceHandlers();
    setupReportsHandlers();

    // Add export button handlers
    document.querySelector('#exportAccounts').addEventListener('click', () => {
        exportTableToExcel('accountsTable', 'Accounts_Report');
    });

    document.querySelector('#exportInventory').addEventListener('click', () => {
        exportTableToExcel('inventoryTable', 'Inventory_Report');
    });

    // Add new account button handler
    document.querySelector('#addNewAccount').addEventListener('click', () => {
        addNewRecord('accountsData');
    });
}

// Add new handler functions
function setupSuppliesHandlers() {
    $('#supplies .search-box').on('keyup', function() {
        $('#suppliesTable').DataTable().search(this.value).draw();
    });
}

function setupFacilitiesHandlers() {
    $('#facilities .search-box').on('keyup', function() {
        $('#facilitiesTable').DataTable().search(this.value).draw();
    });
}

function setupMaintenanceHandlers() {
    $('#maintenance .search-box').on('keyup', function() {
        $('#maintenanceTable').DataTable().search(this.value).draw();
    });
}

function setupReportsHandlers() {
    $('#reports .search-box').on('keyup', function() {
        $('#reportsTable').DataTable().search(this.value).draw();
    });
}

function editItem(id) {
    // Implement edit functionality
    console.log('Editing item:', id);
}

function deleteItem(id) {
    // Implement delete functionality
    console.log('Deleting item:', id);
}

function editTeacherItem(id) {
    const teacher = window.teachersInventory.find(t => t.id === id);
    if (!teacher) {
        alert('Teacher record not found');
        return;
    }
    
    const modalContent = `
        <div class="modal fade" id="teacherModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Edit Teacher Item</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="teacherEditForm">
                            <input type="hidden" name="id" value="${teacher.id}">
                            <div class="mb-3">
                                <label>Teacher Name</label>
                                <input type="text" class="form-control" name="teacherName" value="${teacher.teacherName}" required>
                            </div>
                            <div class="mb-3">
                                <label>Department</label>
                                <input type="text" class="form-control" name="department" value="${teacher.department}" required>
                            </div>
                            <div class="mb-3">
                                <label>Item Name</label>
                                <input type="text" class="form-control" name="itemName" value="${teacher.itemName}" required>
                            </div>
                            <div class="mb-3">
                                <label>Status</label>
                                <select class="form-control" name="status">
                                    <option value="Active" ${teacher.status === 'Active' ? 'selected' : ''}>Active</option>
                                    <option value="Returned" ${teacher.status === 'Returned' ? 'selected' : ''}>Returned</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label>Assigned Date</label>
                                <input type="date" class="form-control" name="assignedDate" value="${teacher.assignedDate}" required>
                            </div>
                            <div class="mb-3">
                                <label>Return Date</label>
                                <input type="date" class="form-control" name="returnDate" value="${teacher.returnDate}" required>
                            </div>
                            <button type="submit" class="btn btn-primary">Save Changes</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.querySelector('#teacherModal')?.remove();
    document.body.insertAdjacentHTML('beforeend', modalContent);
    
    const modal = new bootstrap.Modal(document.querySelector('#teacherModal'));
    modal.show();

    document.getElementById('teacherEditForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const updates = Object.fromEntries(formData.entries());
        
        try {
            const result = await DataStore.updateRecord('teachersInventory', updates.id, updates);
            if (result.success) {
                modal.hide();
                alert('Record updated successfully');
            } else {
                alert('Failed to update record: ' + result.error);
            }
        } catch (error) {
            alert('Error updating record: ' + error.message);
        }
    });
}

function deleteTeacherItem(id) {
    if (confirm('Are you sure you want to delete this item?')) {
        DataStore.deleteRecord('teachersInventory', id)
            .then(result => {
                if (result.success) {
                    // Show success message
                    alert('Record deleted successfully');
                } else {
                    // Show error message
                    alert(`Failed to delete record: ${result.error}`);
                }
            })
            .catch(error => {
                alert(`Error: ${error.message}`);
            });
    }
}

function viewTransaction(id) {
    console.log('Viewing transaction:', id);
}

function deleteTransaction(id) {
    console.log('Deleting transaction:', id);
}

function viewTransactions(accountId) {
    const account = accountsData.find(a => a.accountId === accountId);
    const transactions = accountHelpers.getTransactionsByAccount(accountId);
    
    const modalContent = `
        <div class="modal fade" id="transactionModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Transactions - ${account.accountName}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="table-responsive">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Reference</th>
                                        <th>Description</th>
                                        <th>Type</th>
                                        <th>Amount</th>
                                        <th>Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${transactions.map(t => `
                                        <tr>
                                            <td>${t.date}</td>
                                            <td>${t.reference}</td>
                                            <td>${t.description}</td>
                                            <td>${t.type}</td>
                                            <td class="${t.amount < 0 ? 'text-danger' : 'text-success'}">
                                                ${t.amount < 0 ? '-' : '+'}$${Math.abs(t.amount).toLocaleString()}
                                            </td>
                                            <td>$${t.balance.toLocaleString()}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.querySelector('#transactionModal')?.remove();
    document.body.insertAdjacentHTML('beforeend', modalContent);
    const modal = new bootstrap.Modal(document.querySelector('#transactionModal'));
    modal.show();
}

function editAccount(accountId) {
    const account = window.accountsData.find(a => a.accountId === accountId);
    if (!account) {
        alert('Account not found');
        return;
    }

    const modalContent = `
        <div class="modal fade" id="accountModal">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Edit Account</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="accountEditForm">
                            <input type="hidden" name="id" value="${account.accountId}">
                            <div class="mb-3">
                                <label>Account Name</label>
                                <input type="text" class="form-control" name="accountName" value="${account.accountName}" required>
                            </div>
                            <div class="mb-3">
                                <label>Category</label>
                                <select class="form-control" name="category">
                                    <option value="Operating" ${account.category === 'Operating' ? 'selected' : ''}>Operating</option>
                                    <option value="Restricted" ${account.category === 'Restricted' ? 'selected' : ''}>Restricted</option>
                                    <option value="Special Purpose" ${account.category === 'Special Purpose' ? 'selected' : ''}>Special Purpose</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label>Status</label>
                                <select class="form-control" name="status">
                                    <option value="Active" ${account.status === 'Active' ? 'selected' : ''}>Active</option>
                                    <option value="Inactive" ${account.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                                    <option value="Frozen" ${account.status === 'Frozen' ? 'selected' : ''}>Frozen</option>
                                </select>
                            </div>
                            <button type="submit" class="btn btn-primary">Save Changes</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.querySelector('#accountModal')?.remove();
    document.body.insertAdjacentHTML('beforeend', modalContent);
    
    const modal = new bootstrap.Modal(document.querySelector('#accountModal'));
    modal.show();

    document.getElementById('accountEditForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const updates = Object.fromEntries(formData.entries());
        
        try {
            // Use the hidden id field instead of accountId
            const result = await DataStore.updateRecord('accountsData', updates.id, {
                ...updates,
                accountId: updates.id // Ensure accountId is set correctly
            });
            if (result.success) {
                modal.hide();
                alert('Account updated successfully');
            } else {
                alert('Failed to update account: ' + result.error);
            }
        } catch (error) {
            alert('Error updating account: ' + error.message);
        }
    });
}

// Add new function for viewing transaction details
function viewTransactionDetail(transactionId) {
    const transaction = recentTransactionsData.find(t => t.transactionId === transactionId);
    
    const modalContent = `
        <div class="modal fade" id="transactionDetailModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Transaction Details</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <dl class="row">
                            <dt class="col-sm-4">Transaction ID:</dt>
                            <dd class="col-sm-8">${transaction.transactionId}</dd>
                            <dt class="col-sm-4">Date:</dt>
                            <dd class="col-sm-8">${transaction.date}</dd>
                            <dt class="col-sm-4">Account:</dt>
                            <dd class="col-sm-8">${transaction.accountName}</dd>
                            <dt class="col-sm-4">Type:</dt>
                            <dd class="col-sm-8">${transaction.type}</dd>
                            <dt class="col-sm-4">Reference:</dt>
                            <dd class="col-sm-8">${transaction.reference}</dd>
                            <dt class="col-sm-4">Description:</dt>
                            <dd class="col-sm-8">${transaction.description}</dd>
                            <dt class="col-sm-4">Amount:</dt>
                            <dd class="col-sm-8" class="${transaction.amount < 0 ? 'text-danger' : 'text-success'}">
                                ${transaction.amount < 0 ? '-' : '+'}$${Math.abs(transaction.amount).toLocaleString()}
                            </dd>
                            <dt class="col-sm-4">Balance After:</dt>
                            <dd class="col-sm-8">$${transaction.balance.toLocaleString()}</dd>
                        </dl>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="printTransaction('${transaction.transactionId}')">
                            <i class="fas fa-print"></i> Print
                        </button>
                        <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.querySelector('#transactionDetailModal')?.remove();
    document.body.insertAdjacentHTML('beforeend', modalContent);
    const modal = new bootstrap.Modal(document.querySelector('#transactionDetailModal'));
    modal.show();
}

// Add print functionality
function printTransaction(transactionId) {
    const transaction = recentTransactionsData.find(t => t.transactionId === transactionId);
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
        <html>
            <head>
                <title>Transaction ${transaction.transactionId}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .details { margin-bottom: 20px; }
                    .row { display: flex; margin-bottom: 10px; }
                    .label { font-weight: bold; width: 150px; }
                    .value { flex: 1; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>Transaction Receipt</h2>
                    <p>${transaction.date}</p>
                </div>
                <div class="details">
                    <div class="row">
                        <span class="label">Transaction ID:</span>
                        <span class="value">${transaction.transactionId}</span>
                    </div>
                    <div class="row">
                        <span class="label">Account:</span>
                        <span class="value">${transaction.accountName}</span>
                    </div>
                    <div class="row">
                        <span class="label">Type:</span>
                        <span class="value">${transaction.type}</span>
                    </div>
                    <div class="row">
                        <span class="label">Reference:</span>
                        <span class="value">${transaction.reference}</span>
                    </div>
                    <div class="row">
                        <span class="label">Description:</span>
                        <span class="value">${transaction.description}</span>
                    </div>
                    <div class="row">
                        <span class="label">Amount:</span>
                        <span class="value">${transaction.amount < 0 ? '-' : '+'}$${Math.abs(transaction.amount).toLocaleString()}</span>
                    </div>
                </div>
            </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
}




function generateReport(id) {
    const report = reportsData.find(r => r.id === id);
    let reportContent = '';
    
    switch (report.type) {
        case 'Inventory':
            reportContent = generateInventoryReport();
            break;
        case 'Maintenance':
            reportContent = generateMaintenanceReport();
            break;
        case 'Financial':
            reportContent = generateFinancialReport();
            break;
    }

    openReportWindow(report, reportContent);
}

function generateInventoryReport() {
    const categories = [...new Set(inventoryData.map(item => item.category))];
    let content = '';

    categories.forEach(category => {
        const items = inventoryData.filter(item => item.category === category);
        const totalValue = items.reduce((sum, item) => sum + (item.value * item.quantity), 0);
        
        content += `
            <div class="report-section">
                <h3>${category}</h3>
                <table class="report-table">
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Quantity</th>
                        <th>Status</th>
                        <th>Value</th>
                    </tr>
                    ${items.map(item => `
                        <tr>
                            <td>${item.id}</td>
                            <td>${item.name}</td>
                            <td>${item.quantity}</td>
                            <td>${item.status}</td>
                            <td>$${item.value.toLocaleString()}</td>
                        </tr>
                    `).join('')}
                    <tr class="total-row">
                        <td colspan="4">Total Value</td>
                        <td>$${totalValue.toLocaleString()}</td>
                    </tr>
                </table>
            </div>
        `;
    });

    return content;
}

function generateMaintenanceReport() {
    const totalCost = maintenanceData.reduce((sum, item) => sum + item.cost, 0);
    
    return `
        <div class="report-section">
            <h3>Maintenance Records</h3>
            <table class="report-table">
                <tr>
                    <th>Date</th>
                    <th>Item</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Cost</th>
                    <th>Status</th>
                </tr>
                ${maintenanceData.map(item => `
                    <tr>
                        <td>${item.date}</td>
                        <td>${item.itemName}</td>
                        <td>${item.type}</td>
                        <td>${item.description}</td>
                        <td>$${item.cost.toLocaleString()}</td>
                        <td>${item.status}</td>
                    </tr>
                `).join('')}
                <tr class="total-row">
                    <td colspan="4">Total Cost</td>
                    <td>$${totalCost.toLocaleString()}</td>
                    <td></td>
                </tr>
            </table>
        </div>
    `;
}

function generateFinancialReport() {
    const totalIncome = recentTransactionsData
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = recentTransactionsData
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return `
        <div class="report-section">
            <h3>Financial Summary</h3>
            <table class="report-table">
                <tr>
                    <th>Date</th>
                    <th>Account</th>
                    <th>Description</th>
                    <th>Type</th>
                    <th>Amount</th>
                </tr>
                ${recentTransactionsData.map(t => `
                    <tr>
                        <td>${t.date}</td>
                        <td>${t.accountName}</td>
                        <td>${t.description}</td>
                        <td>${t.type}</td>
                        <td class="${t.amount < 0 ? 'text-danger' : 'text-success'}">
                            ${t.amount < 0 ? '-' : '+'}$${Math.abs(t.amount).toLocaleString()}
                        </td>
                    </tr>
                `).join('')}
                <tr class="total-row">
                    <td colspan="4">Total Income</td>
                    <td class="text-success">$${totalIncome.toLocaleString()}</td>
                </tr>
                <tr class="total-row">
                    <td colspan="4">Total Expenses</td>
                    <td class="text-danger">$${totalExpenses.toLocaleString()}</td>
                </tr>
                <tr class="total-row">
                    <td colspan="4">Net Balance</td>
                    <td class="${totalIncome - totalExpenses >= 0 ? 'text-success' : 'text-danger'}">
                        $${(totalIncome - totalExpenses).toLocaleString()}
                    </td>
                </tr>
            </table>
        </div>
    `;
}

function openReportWindow(report, content) {
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
        <html>
            <head>
                <title>${report.name}</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        padding: 20px;
                        max-width: 1200px;
                        margin: 0 auto;
                    }
                    .header { 
                        text-align: center; 
                        margin-bottom: 30px;
                        padding-bottom: 20px;
                        border-bottom: 2px solid #333;
                    }
                    .report-section {
                        margin-bottom: 30px;
                    }
                    .report-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                    }
                    .report-table th, .report-table td {
                        border: 1px solid #ddd;
                        padding: 8px;
                        text-align: left;
                    }
                    .report-table th {
                        background-color: #f5f5f5;
                    }
                    .total-row {
                        font-weight: bold;
                        background-color: #f9f9f9;
                    }
                    .text-danger { color: #dc3545; }
                    .text-success { color: #28a745; }
                    .footer {
                        margin-top: 50px;
                        text-align: center;
                        font-size: 0.9em;
                        color: #666;
                    }
                        .logo{
                        width:20px;
                        height:20px;
                        }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${report.name}</h1>
                    <p>Generated on: ${new Date().toLocaleString()}</p>
                </div>
                ${content}
                <div class="footer">
                    <p>
                    <img src="../img/logo.png" alt="" class="logo" >
                    Generated by School Inventory Management System
                    </p>
                </div>
            </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
}


// Add new record handling functions
function addNewRecord(type) {
    const forms = {
        'inventoryData': generateInventoryForm,
        'teachersInventory': generateTeacherForm,
        'accountsData': generateAccountForm,
        'facilitiesData': generateFacilityForm,
        'maintenanceData': generateMaintenanceForm
    };

    const formGenerator = forms[type];
    if (formGenerator) {
        const modalContent = formGenerator();
        document.querySelector('#addRecordModal')?.remove();
        document.body.insertAdjacentHTML('beforeend', modalContent);
        
        const modal = new bootstrap.Modal(document.querySelector('#addRecordModal'));
        modal.show();

        // Setup form submission
        document.querySelector('#recordForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const record = Object.fromEntries(formData.entries());
            
            // Add ID and timestamps
            record.id = generateId(type);
            record.lastUpdated = new Date().toISOString().split('T')[0];
            
            DataStore.addRecord(type, record);
            modal.hide();
        });
    }
}

function generateId(type) {
    const prefixes = {
        'inventoryData': 'EQ',
        'teachersInventory': 'T',
        'accountsData': 'ACC',
        'facilitiesData': 'FAC',
        'maintenanceData': 'MNT'
    };
    const prefix = prefixes[type];
    const timestamp = Date.now().toString(36);
    return `${prefix}${timestamp}`;
}

// Add form generator functions
function generateInventoryForm() {
    return `
        <div class="modal fade" id="addRecordModal">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Add New Inventory Item</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="recordForm">
                            <div class="mb-3">
                                <label class="form-label">Name</label>
                                <input type="text" class="form-control" name="name" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Category</label>
                                <select class="form-control" name="category" required>
                                    <option value="Electronics">Electronics</option>
                                    <option value="Furniture">Furniture</option>
                                    <option value="Supplies">Supplies</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Quantity</label>
                                <input type="number" class="form-control" name="quantity" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Location</label>
                                <input type="text" class="form-control" name="location" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Value</label>
                                <input type="number" step="0.01" class="form-control" name="value" required>
                            </div>
                            <button type="submit" class="btn btn-primary">Save</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Add similar form generators for other types...

// Add new functions for equipment management
function editEquipment(id) {
    const equipment = window.inventoryData.find(e => e.id === id);
    if (!equipment) {
        alert('Equipment not found');
        return;
    }

    const modalContent = `
        <div class="modal fade" id="equipmentModal">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Edit Equipment</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="equipmentEditForm">
                            <input type="hidden" name="id" value="${equipment.id}">
                            <div class="mb-3">
                                <label>Name</label>
                                <input type="text" class="form-control" name="name" value="${equipment.name}" required>
                            </div>
                            <div class="mb-3">
                                <label>Category</label>
                                <select class="form-control" name="category" required>
                                    <option value="Electronics" ${equipment.category === 'Electronics' ? 'selected' : ''}>Electronics</option>
                                    <option value="Furniture" ${equipment.category === 'Furniture' ? 'selected' : ''}>Furniture</option>
                                    <option value="Supplies" ${equipment.category === 'Supplies' ? 'selected' : ''}>Supplies</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label>Quantity</label>
                                <input type="number" class="form-control" name="quantity" value="${equipment.quantity}" required>
                            </div>
                            <div class="mb-3">
                                <label>Status</label>
                                <select class="form-control" name="status">
                                    <option value="good" ${equipment.status === 'good' ? 'selected' : ''}>Good</option>
                                    <option value="low" ${equipment.status === 'low' ? 'selected' : ''}>Low</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label>Location</label>
                                <input type="text" class="form-control" name="location" value="${equipment.location}" required>
                            </div>
                            <div class="mb-3">
                                <label>Value</label>
                                <input type="number" step="0.01" class="form-control" name="value" value="${equipment.value}" required>
                            </div>
                            <button type="submit" class="btn btn-primary">Save Changes</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.querySelector('#equipmentModal')?.remove();
    document.body.insertAdjacentHTML('beforeend', modalContent);
    
    const modal = new bootstrap.Modal(document.querySelector('#equipmentModal'));
    modal.show();

    document.getElementById('equipmentEditForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const updates = Object.fromEntries(formData.entries());
        try {
            const result = await DataStore.updateRecord('inventoryData', updates.id, updates);
            if (result.success) {
                modal.hide();
                alert('Equipment updated successfully');
            } else {
                alert('Failed to update equipment: ' + result.error);
            }
        } catch (error) {
            alert('Error updating equipment: ' + error.message);
        }
    });
}

function deleteEquipment(id) {
    if (confirm('Are you sure you want to delete this equipment?')) {
        DataStore.deleteRecord('inventoryData', id)
            .then(result => {
                if (result.success) {
                    alert('Equipment deleted successfully');
                } else {
                    alert(`Failed to delete equipment: ${result.error}`);
                }
            })
            .catch(error => {
                alert(`Error: ${error.message}`);
            });
    }
}

// Add functions for exporting data
function exportTableToExcel(tableId, fileName) {
    const table = $(`#${tableId}`).DataTable();
    const data = table.data().toArray();
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
}

// Add new report handling functions
function viewReport(id) {
    const report = window.reportsData.find(r => r.id === id);
    if (!report) {
        alert('Report not found');
        return;
    }
    generateReport(id);
}

function downloadReport(id) {
    const report = window.reportsData.find(r => r.id === id);
    if (!report) {
        alert('Report not found');
        return;
    }

    let reportContent = '';
    switch (report.type) {
        case 'Inventory':
            reportContent = generateInventoryReport();
            break;
        case 'Maintenance':
            reportContent = generateMaintenanceReport();
            break;
        case 'Financial':
            reportContent = generateFinancialReport();
            break;
    }

    // Convert report to Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.table_to_sheet(reportContent);
    XLSX.utils.book_append_sheet(wb, ws, report.name);
    XLSX.writeFile(wb, `${report.name}.xlsx`);
}

// ...existing code...

function generateTeacherForm() {
    return `
        <div class="modal fade" id="addRecordModal">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Add New Teacher Item</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="recordForm">
                            <div class="mb-3">
                                <label>Teacher Name</label>
                                <input type="text" class="form-control" name="teacherName" required>
                            </div>
                            <div class="mb-3">
                                <label>Department</label>
                                <input type="text" class="form-control" name="department" required>
                            </div>
                            <div class="mb-3">
                                <label>Item Name</label>
                                <input type="text" class="form-control" name="itemName" required>
                            </div>
                            <div class="mb-3">
                                <label>Status</label>
                                <select class="form-control" name="status">
                                    <option value="Active">Active</option>
                                    <option value="Returned">Returned</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label>Assigned Date</label>
                                <input type="date" class="form-control" name="assignedDate" required>
                            </div>
                            <div class="mb-3">
                                <label>Return Date</label>
                                <input type="date" class="form-control" name="returnDate" required>
                            </div>
                            <button type="submit" class="btn btn-primary">Save</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function generateFacilityForm() {
    return `
        <div class="modal fade" id="addRecordModal">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Add New Facility</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="recordForm">
                            <div class="mb-3">
                                <label>Name</label>
                                <input type="text" class="form-control" name="name" required>
                            </div>
                            <div class="mb-3">
                                <label>Location</label>
                                <input type="text" class="form-control" name="location" required>
                            </div>
                            <div class="mb-3">
                                <label>Status</label>
                                <select class="form-control" name="status">
                                    <option value="Operational">Operational</option>
                                    <option value="Maintenance Required">Maintenance Required</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label>Last Maintenance</label>
                                <input type="date" class="form-control" name="lastMaintenance" required>
                            </div>
                            <div class="mb-3">
                                <label>Next Maintenance</label>
                                <input type="date" class="form-control" name="nextMaintenance" required>
                            </div>
                            <div class="mb-3">
                                <label>Condition</label>
                                <select class="form-control" name="condition">
                                    <option value="Excellent">Excellent</option>
                                    <option value="Good">Good</option>
                                    <option value="Fair">Fair</option>
                                    <option value="Poor">Poor</option>
                                </select>
                            </div>
                            <button type="submit" class="btn btn-primary">Save</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function generateMaintenanceForm() {
    return `
        <div class="modal fade" id="addRecordModal">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Add New Maintenance Record</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="recordForm">
                            <div class="mb-3">
                                <label>Date</label>
                                <input type="date" class="form-control" name="date" required>
                            </div>
                            <div class="mb-3">
                                <label>Item Name</label>
                                <input type="text" class="form-control" name="itemName" required>
                            </div>
                            <div class="mb-3">
                                <label>Type</label>
                                <select class="form-control" name="type">
                                    <option value="Routine">Routine</option>
                                    <option value="Repair">Repair</option>
                                    <option value="Emergency">Emergency</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label>Description</label>
                                <textarea class="form-control" name="description" required></textarea>
                            </div>
                            <div class="mb-3">
                                <label>Cost</label>
                                <input type="number" step="0.01" class="form-control" name="cost" required>
                            </div>
                            <div class="mb-3">
                                <label>Status</label>
                                <select class="form-control" name="status">
                                    <option value="Scheduled">Scheduled</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                </select>
                            </div>
                            <button type="submit" class="btn btn-primary">Save</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Update the form generators mapping
const forms = {
    'inventoryData': generateInventoryForm,
    'teachersInventory': generateTeacherForm,
    'accountsData': generateAccountForm,
    'facilitiesData': generateFacilityForm,
    'maintenanceData': generateMaintenanceForm
};

// ...existing code...

function editFacility(id) {
    const facility = window.facilitiesData.find(f => f.id === id);
    if (!facility) {
        alert('Facility not found');
        return;
    }

    const modalContent = `
        <div class="modal fade" id="facilityModal">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Edit Facility</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="facilityEditForm">
                            <input type="hidden" name="id" value="${facility.id}">
                            <div class="mb-3">
                                <label>Name</label>
                                <input type="text" class="form-control" name="name" value="${facility.name}" required>
                            </div>
                            <div class="mb-3">
                                <label>Location</label>
                                <input type="text" class="form-control" name="location" value="${facility.location}" required>
                            </div>
                            <div class="mb-3">
                                <label>Status</label>
                                <select class="form-control" name="status">
                                    <option value="Operational" ${facility.status === 'Operational' ? 'selected' : ''}>Operational</option>
                                    <option value="Maintenance Required" ${facility.status === 'Maintenance Required' ? 'selected' : ''}>Maintenance Required</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label>Last Maintenance</label>
                                <input type="date" class="form-control" name="lastMaintenance" value="${facility.lastMaintenance}" required>
                            </div>
                            <div class="mb-3">
                                <label>Next Maintenance</label>
                                <input type="date" class="form-control" name="nextMaintenance" value="${facility.nextMaintenance}" required>
                            </div>
                            <div class="mb-3">
                                <label>Condition</label>
                                <select class="form-control" name="condition">
                                    <option value="Excellent" ${facility.condition === 'Excellent' ? 'selected' : ''}>Excellent</option>
                                    <option value="Good" ${facility.condition === 'Good' ? 'selected' : ''}>Good</option>
                                    <option value="Fair" ${facility.condition === 'Fair' ? 'selected' : ''}>Fair</option>
                                    <option value="Poor" ${facility.condition === 'Poor' ? 'selected' : ''}>Poor</option>
                                </select>
                            </div>
                            <button type="submit" class="btn btn-primary">Save Changes</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.querySelector('#facilityModal')?.remove();
    document.body.insertAdjacentHTML('beforeend', modalContent);
    
    const modal = new bootstrap.Modal(document.querySelector('#facilityModal'));
    modal.show();

    document.getElementById('facilityEditForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const updates = Object.fromEntries(formData.entries());
        
        try {
            const result = await DataStore.updateRecord('facilitiesData', updates.id, updates);
            if (result.success) {
                modal.hide();
                alert('Facility updated successfully');
            } else {
                alert('Failed to update facility: ' + result.error);
            }
        } catch (error) {
            alert('Error updating facility: ' + error.message);
        }
    });
}

function deleteFacility(id) {
    if (confirm('Are you sure you want to delete this facility?')) {
        DataStore.deleteRecord('facilitiesData', id)
            .then(result => {
                if (result.success) {
                    alert('Facility deleted successfully');
                } else {
                    alert(`Failed to delete facility: ${result.error}`);
                }
            })
            .catch(error => {
                alert(`Error: ${error.message}`);
            });
    }
}

function editMaintenance(id) {
    const maintenance = window.maintenanceData.find(m => m.id === id);
    if (!maintenance) {
        alert('Maintenance record not found');
        return;
    }

    const modalContent = `
        <div class="modal fade" id="maintenanceModal">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Edit Maintenance Record</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="maintenanceEditForm">
                            <input type="hidden" name="id" value="${maintenance.id}">
                            <div class="mb-3">
                                <label>Date</label>
                                <input type="date" class="form-control" name="date" value="${maintenance.date}" required>
                            </div>
                            <div class="mb-3">
                                <label>Item Name</label>
                                <input type="text" class="form-control" name="itemName" value="${maintenance.itemName}" required>
                            </div>
                            <div class="mb-3">
                                <label>Type</label>
                                <select class="form-control" name="type">
                                    <option value="Routine" ${maintenance.type === 'Routine' ? 'selected' : ''}>Routine</option>
                                    <option value="Repair" ${maintenance.type === 'Repair' ? 'selected' : ''}>Repair</option>
                                    <option value="Emergency" ${maintenance.type === 'Emergency' ? 'selected' : ''}>Emergency</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label>Description</label>
                                <textarea class="form-control" name="description" required>${maintenance.description}</textarea>
                            </div>
                            <div class="mb-3">
                                <label>Cost</label>
                                <input type="number" step="0.01" class="form-control" name="cost" value="${maintenance.cost}" required>
                            </div>
                            <div class="mb-3">
                                <label>Status</label>
                                <select class="form-control" name="status">
                                    <option value="Scheduled" ${maintenance.status === 'Scheduled' ? 'selected' : ''}>Scheduled</option>
                                    <option value="In Progress" ${maintenance.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                                    <option value="Completed" ${maintenance.status === 'Completed' ? 'selected' : ''}>Completed</option>
                                </select>
                            </div>
                            <button type="submit" class="btn btn-primary">Save Changes</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.querySelector('#maintenanceModal')?.remove();
    document.body.insertAdjacentHTML('beforeend', modalContent);
    
    const modal = new bootstrap.Modal(document.querySelector('#maintenanceModal'));
    modal.show();

    document.getElementById('maintenanceEditForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const updates = Object.fromEntries(formData.entries());
        
        try {
            const result = await DataStore.updateRecord('maintenanceData', updates.id, updates);
            if (result.success) {
                modal.hide();
                alert('Maintenance record updated successfully');
            } else {
                alert('Failed to update maintenance record: ' + result.error);
            }
        } catch (error) {
            alert('Error updating maintenance record: ' + error.message);
        }
    });
}

function deleteMaintenance(id) {
    if (confirm('Are you sure you want to delete this maintenance record?')) {
        DataStore.deleteRecord('maintenanceData', id)
            .then(result => {
                if (result.success) {
                    alert('Maintenance record deleted successfully');
                } else {
                    alert(`Failed to delete maintenance record: ${result.error}`);
                }
            })
            .catch(error => {
                alert(`Error: ${error.message}`);
            });
    }
}

function generateAccountForm() {
    return `
        <div class="modal fade" id="addRecordModal">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Add New Account</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="recordForm">
                            <div class="mb-3">
                                <label>Account Name</label>
                                <input type="text" class="form-control" name="accountName" required>
                            </div>
                            <div class="mb-3">
                                <label>Category</label>
                                <select class="form-control" name="category">
                                    <option value="Operating">Operating</option>
                                    <option value="Restricted">Restricted</option>
                                    <option value="Special Purpose">Special Purpose</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label>Initial Balance</label>
                                <input type="number" step="0.01" class="form-control" name="balance" required>
                            </div>
                            <div class="mb-3">
                                <label>Status</label>
                                <select class="form-control" name="status">
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                    <option value="Frozen">Frozen</option>
                                </select>
                            </div>
                            <button type="submit" class="btn btn-primary">Save</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Remove duplicate declarations
// function viewReport(id) { ... }  REMOVE THIS
// function downloadReport(id) { ... }  REMOVE THIS

// At the end of the file, modify the function declarations
function handleReports() {
    const reportFunctions = {
        viewReport: function(id) {
            const report = window.reportsData?.find(r => r.id === id);
            if (!report) {
                alert('Report not found');
                return;
            }
            generateReport(id);
        },
        downloadReport: function(id) {
            const report = window.reportsData?.find(r => r.id === id);
            if (!report) {
                alert('Report not found');
                return;
            }
            generateReport(id);
        }
    };

    // Assign to window object
    Object.assign(window, reportFunctions);
    return reportFunctions;
}

// Initialize report functions
handleReports();

// Make functions available globally
window.editTeacherItem = editTeacherItem;
window.deleteTeacherItem = deleteTeacherItem;
window.addNewRecord = addNewRecord;
window.viewTransactions = viewTransactions;
window.editAccount = editAccount;
window.generateReport = generateReport;
window.viewReport = viewReport;
window.downloadReport = downloadReport;
window.editEquipment = editEquipment;
window.deleteEquipment = deleteEquipment;
window.editFacility = editFacility;
window.deleteFacility = deleteFacility;
window.editMaintenance = editMaintenance;
window.deleteMaintenance = deleteMaintenance;

// Wait for DataStore initialization
window.addEventListener('load', async () => {
    while (!window.DataStore) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    initializeTables();
    setupEventListeners();
});

// Remove these duplicate declarations
// function viewReport(id) { ... } - REMOVE
// function downloadReport(id) { ... } - REMOVE

// At the end of the file, replace with:
const uiHelpers = {
    viewReport: function(id) {
        const report = window.reportsData?.find(r => r.id === id);
        if (!report) return;
        generateReport(id);
    },
    downloadReport: function(id) {
        const report = window.reportsData?.find(r => r.id === id);
        if (!report) return;
        generateReport(id);
    }
};

// Initialize functions
Object.assign(window, {
    ...uiHelpers,
    editTeacherItem,
    deleteTeacherItem,
    addNewRecord,
    viewTransactions,
    editAccount,
    generateReport,
    editEquipment,
    deleteEquipment,
    editFacility,
    deleteFacility,
    editMaintenance,
    deleteMaintenance
});

// Wait for DataStore and DOM
let dataStoreReady = false;
let domReady = false;

document.addEventListener('DOMContentLoaded', () => {
    domReady = true;
    if (dataStoreReady) initializeUI();
});

window.addEventListener('DataStoreReady', () => {
    dataStoreReady = true;
    if (domReady) initializeUI();
});

function initializeUI() {
    initializeTables();
    setupEventListeners();
}
