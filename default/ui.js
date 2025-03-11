document.addEventListener('DOMContentLoaded', function() {
    initializeTables();
    setupEventListeners();
});

function initializeTables() {
    // Initialize equipment table with search and filter support
    const equipmentTable = $('#inventoryTable').DataTable({
        data: inventoryData,
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
    const teacher = teachersInventory.find(t => t.id === id);
    
    const modalContent = `
        <div class="modal fade" id="teacherModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Teacher Item Details</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <dl class="row">
                            <dt class="col-sm-4">ID:</dt>
                            <dd class="col-sm-8">${teacher.id}</dd>
                            <dt class="col-sm-4">Teacher:</dt>
                            <dd class="col-sm-8">${teacher.teacherName}</dd>
                            <dt class="col-sm-4">Department:</dt>
                            <dd class="col-sm-8">${teacher.department}</dd>
                            <dt class="col-sm-4">Item:</dt>
                            <dd class="col-sm-8">${teacher.itemName}</dd>
                            <dt class="col-sm-4">Status:</dt>
                            <dd class="col-sm-8">${teacher.status}</dd>
                            <dt class="col-sm-4">Assigned:</dt>
                            <dd class="col-sm-8">${teacher.assignedDate}</dd>
                            <dt class="col-sm-4">Return:</dt>
                            <dd class="col-sm-8">${teacher.returnDate}</dd>
                        </dl>
                        <p class="text-muted">This is a read-only view. Modifications are not permitted.</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.querySelector('#teacherModal')?.remove();
    document.body.insertAdjacentHTML('beforeend', modalContent);
    const modal = new bootstrap.Modal(document.querySelector('#teacherModal'));
    modal.show();
}

function deleteTeacherItem(id) {
    alert('Delete operation is not available in read-only mode.');
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
    const account = accountsData.find(a => a.accountId === accountId);
    
    const modalContent = `
        <div class="modal fade" id="accountModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Account Details</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <dl class="row">
                            <dt class="col-sm-4">Account ID:</dt>
                            <dd class="col-sm-8">${account.accountId}</dd>
                            <dt class="col-sm-4">Name:</dt>
                            <dd class="col-sm-8">${account.accountName}</dd>
                            <dt class="col-sm-4">Category:</dt>
                            <dd class="col-sm-8">${account.category}</dd>
                            <dt class="col-sm-4">Balance:</dt>
                            <dd class="col-sm-8">$${account.balance.toLocaleString()}</dd>
                            <dt class="col-sm-4">Status:</dt>
                            <dd class="col-sm-8">${account.status}</dd>
                            <dt class="col-sm-4">Last Updated:</dt>
                            <dd class="col-sm-8">${account.lastTransaction}</dd>
                        </dl>
                        <p class="text-muted">This is a read-only view. Modifications are not permitted.</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.querySelector('#accountModal')?.remove();
    document.body.insertAdjacentHTML('beforeend', modalContent);
    const modal = new bootstrap.Modal(document.querySelector('#accountModal'));
    modal.show();
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

// Add these new functions at the end of the file
function viewReport(id) {
    alert('Viewing report: ' + id);
}

function downloadReport(id) {
    alert('Downloading report: ' + id);
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
}

// Replace the existing basic report functions
function viewReport(id) {
    const report = reportsData.find(r => r.id === id);
    generateReport(id);
}

function downloadReport(id) {
    const report = reportsData.find(r => r.id === id);
    generateReport(id);
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
