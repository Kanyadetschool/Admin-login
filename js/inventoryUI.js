document.addEventListener('DOMContentLoaded', function() {
    initializeTables();
    updateStats();
    initializeCharts();
    setupEventListeners();
});

function initializeTables() {
    // Initialize equipment table
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
        ]
    });

    // Initialize teachers table
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

    // Initialize accounts table
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
                data: 'transactions',
                render: function(data) {
                    const monthly = data.filter(t => {
                        const date = new Date(t.date);
                        const now = new Date();
                        return date.getMonth() === now.getMonth() && 
                               date.getFullYear() === now.getFullYear();
                    });
                    return `${monthly.length} transactions`;
                }
            },
            {
                data: 'status',
                render: function(data) {
                    const statusClass = data === 'Active' ? 'status-good' : 'status-low';
                    return `<span class="status-indicator ${statusClass}"></span>${data}`;
                }
            },
            {
                data: null,
                render: function(data) {
                    return `
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-info" onclick="viewTransactions('${data.accountId}')">
                                <i class="fas fa-list"></i>
                            </button>
                            <button class="btn btn-primary" onclick="editAccount('${data.accountId}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-success" onclick="newTransaction('${data.accountId}')">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ]
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

    updateAccountStats();

    // Initialize column filters
    equipmentTable.columns().every(function() {
        const column = this;
        $('.column-filter').eq(column.index()).on('keyup change', function() {
            if (column.search() !== this.value) {
                column.search(this.value).draw();
            }
        });
    });
}

function updateStats() {
    document.getElementById('totalItems').textContent = inventoryHelpers.getTotalItems().toLocaleString();
    document.getElementById('lowStockItems').textContent = inventoryHelpers.getLowStockItems();
    document.getElementById('totalCategories').textContent = inventoryHelpers.getUniqueCategories();
    document.getElementById('totalValue').textContent = inventoryHelpers.getTotalValue();

    const categories = inventoryHelpers.getUniqueCategories();
    const totalItems = inventoryHelpers.getTotalItems();

    updateTrendText('totalItems', `Items in ${categories} categories`);
    updateTrendText('lowStockItems', `${inventoryHelpers.getLowStockItems()} items below threshold`);
    updateTrendText('totalCategories', `Avg ${Math.round(totalItems/categories)} per category`);
    updateTrendText('totalValue', 'Current inventory value');
}

function updateTrendText(elementId, text) {
    document.querySelector(`#${elementId} + .stats-trend`).textContent = text;
}

function initializeCharts() {
    const ctx = document.getElementById('inventoryChart').getContext('2d');
    const categories = [...new Set(inventoryData.map(item => item.category))];
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                data: categories.map(category => 
                    inventoryData
                        .filter(item => item.category === category)
                        .reduce((sum, item) => sum + item.quantity, 0)
                ),
                backgroundColor: ['#2ecc71', '#3498db', '#9b59b6', '#e74c3c']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                }
            }
        }
    });
}

function setupEventListeners() {
    // Existing search box listener
    document.querySelector('.search-box').addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const activeTabId = document.querySelector('.nav-tabs .active').getAttribute('href').substring(1);
        const table = $(`#${activeTabId}Table`).DataTable();
        table.search(searchTerm).draw();
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

function updateAccountStats() {
    const totalBalance = accountHelpers.getTotalBalance();
    const activeAccounts = accountHelpers.getActiveAccounts();
    const monthlyTotals = accountHelpers.getMonthlyTotals();

    document.getElementById('totalBalance').textContent = `$${totalBalance.toLocaleString()}`;
    document.getElementById('activeAccounts').textContent = activeAccounts;
    document.getElementById('monthlyIncome').textContent = `$${monthlyTotals.income.toLocaleString()}`;
    document.getElementById('monthlyExpenses').textContent = `$${monthlyTotals.expenses.toLocaleString()}`;
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
