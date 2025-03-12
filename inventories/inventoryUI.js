document.addEventListener('DOMContentLoaded', function() {
    initializeTables();
    setupEventListeners();
});

function initializeTables() {
    // Helper function to safely initialize DataTable
    const safeInitDataTable = (selector, options) => {
        const table = $(selector);
        // Destroy existing instance if it exists
        if ($.fn.DataTable.isDataTable(table)) {
            table.DataTable().destroy();
            table.empty(); // Clear the table content
        }

        // Add filter row handling to the options
        const enhancedOptions = {
            ...options,
            initComplete: function(settings, json) {
                const api = this.api();
                
                // Add filter inputs to each header cell
                $('#' + settings.nTable.id + ' thead tr:eq(1) th').each(function(i) {
                    const title = $(this).text();
                    const isSelect = $(this).find('select').length > 0;
                    
                    if (isSelect) {
                        // For select filters
                        $('select', this).on('change', function() {
                            if (api.column(i).search() !== this.value) {
                                api.column(i)
                                    .search(this.value ? '^' + this.value + '$' : '', true, false)
                                    .draw();
                            }
                        });
                    } else {
                        // For text input filters
                        $('input', this).on('keyup change', function() {
                            if (api.column(i).search() !== this.value) {
                                api.column(i)
                                    .search(this.value)
                                    .draw();
                            }
                        });
                    }
                });

                // Call original initComplete if it exists
                if (options.initComplete) {
                    options.initComplete.call(this, settings, json);
                }
            }
        };

        return table.DataTable(enhancedOptions);
    };

    // Initialize equipment table
    const equipmentTable = safeInitDataTable('#inventoryTable', {
        data: window.inventoryData || [], // Fix: use window.inventoryData
        columns: [
            { data: 'id', name: 'id' },
            { data: 'name', name: 'name' },
            { data: 'category', name: 'category' },
            { data: 'quantity', name: 'quantity' },
            { 
                data: 'status',
                name: 'status',
                render: function(data, type, row) {
                    if (!data) return '';  // Handle null/undefined
                    const statusClass = data === 'low' ? 'status-low' : 'status-good';
                    return `<span class="status-indicator ${statusClass}"></span>${data}`;
                }
            },
            { data: 'location', name: 'location' },
            { data: 'lastUpdated', name: 'lastUpdated' },
            { 
                data: 'value',
                name: 'value',
                render: function(data) {
                    if (!data) return '$0';  // Handle null/undefined
                    return `$${parseFloat(data).toLocaleString()}`;
                }
            },
            {
                data: null,
                orderable: false,
                render: function(data) {
                    if (!data || !data.id) return '';  // Handle null/undefined
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
    const teachersTable = safeInitDataTable('#teachersTable', {
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
    const accountsTable = safeInitDataTable('#accountsTable', {
        data: accountsData,
        scrollX: true,
        columns: [
            { data: 'accountId' },
            { data: 'accountName' },
            { data: 'category' },
            { 
                data: 'balance',
                render: function(data) {
                    const colorClass = parseFloat(data) >= 0 ? 'text-success' : 'text-danger';
                    return `<span class="${colorClass}">$${Math.abs(parseFloat(data)).toLocaleString()}</span>`;
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
                orderable: false,
                render: function(data) {
                    return `
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-info" onclick="viewTransactions('${data.accountId}')" title="View Transactions">
                                <i class="fas fa-list"></i>
                            </button>
                            <button class="btn btn-primary" onclick="editAccount('${data.accountId}')" title="Edit Account">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-danger" onclick="deleteAccount('${data.accountId}')" title="Delete Account">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ],
        order: [[1, 'asc']],
        responsive: true
    });

    // Initialize recent transactions table
    safeInitDataTable('#recentTransactionsTable', {
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
    safeInitDataTable('#suppliesTable', {
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
    safeInitDataTable('#facilitiesTable', {
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
    safeInitDataTable('#maintenanceTable', {
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
    const reportsTable = safeInitDataTable('#reportsTable', {
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
                data: null,
                render: function(data, type, row) {
                    if (row.status === 'Generated') {
                        return `
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-info" onclick="viewReport('${row.id}')">
                                    <i class="fas fa-eye"></i> View
                                </button>
                                <button class="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown">
                                    <i class="fas fa-download"></i> Export
                                </button>
                                <ul class="dropdown-menu">
                                    <li><a class="dropdown-item" onclick="exportReport('${row.id}', 'pdf')">
                                        <i class="fas fa-file-pdf"></i> PDF
                                    </a></li>
                                    <li><a class="dropdown-item" onclick="exportReport('${row.id}', 'excel')">
                                        <i class="fas fa-file-excel"></i> Excel
                                    </a></li>
                                    <li><a class="dropdown-item" onclick="exportReport('${row.id}', 'word')">
                                        <i class="fas fa-file-word"></i> Word
                                    </a></li>
                                    <li><hr class="dropdown-divider"></li>
                                    <li><a class="dropdown-item" onclick="printReport('${row.id}')">
                                        <i class="fas fa-print"></i> Print
                                    </a></li>
                                </ul>
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
    // Update search functionality for all search boxes and column filters
    $('.search-box, .column-filter').each(function() {
        const $this = $(this);
        const tableId = $this.closest('.tab-pane').find('table').attr('id');
        const table = $(`#${tableId}`).DataTable();
        const isColumnFilter = $this.hasClass('column-filter');
        const columnIndex = isColumnFilter ? $this.closest('th').index() : null;
        
        let searchTimeout;
        
        $this.on('keyup change', function() {
            clearTimeout(searchTimeout);
            const value = this.value;
            
            searchTimeout = setTimeout(() => {
                if (isColumnFilter) {
                    // Column-specific search
                    table.column(columnIndex).search(value).draw();
                } else {
                    // Global search across all columns
                    table.search(value).draw();
                }
            }, 300);
        });
    });

    // Add special handling for status filters
    $('#transferStatusFilter').on('change', function() {
        const table = $('#transferredStudentsTable').DataTable();
        table.column(6).search(this.value).draw(); // 6 is the status column index
    });

    // Clear filters button for each table
    $('.tab-pane').each(function() {
        const $tabPane = $(this);
        const tableId = $tabPane.find('table').attr('id');
        const $clearButton = $('<button>')
            .addClass('btn btn-outline-secondary ms-2')
            .html('<i class="fas fa-times"></i> Clear Filters')
            .on('click', function() {
                const table = $(`#${tableId}`).DataTable();
                
                // Clear all search boxes in this tab
                $tabPane.find('.search-box, .column-filter').val('');
                
                // Clear all column filters
                table.columns().search('');
                
                // Clear global search
                table.search('');
                
                // Redraw the table
                table.draw();
            });
        
        $tabPane.find('.search-box').after($clearButton);
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
    document.querySelector('#addNewAccount')?.addEventListener('click', () => {
        addNewRecord('accountsData');
    });

    // Add global add button handler
    const globalAddButton = document.getElementById('globalAddButton');
    globalAddButton.addEventListener('click', () => {
        // Get active tab ID
        const activeTab = document.querySelector('.tab-pane.active');
        if (!activeTab) return;

        const tabId = activeTab.id;
        const typeMap = {
            'equipment': 'inventoryData',
            'teachers': 'teachersInventory',
            'accounts': 'accountsData',
            'supplies': 'suppliesData',
            'facilities': 'facilitiesData',
            'maintenance': 'maintenanceData',
            'transferredStudents': 'transferredStudents'
        };

        const recordType = typeMap[tabId];
        if (recordType) {
            if (recordType === 'transferredStudents') {
                addNewTransfer();
            } else {
                addNewRecord(recordType);
            }
        }
    });

    // Update button visibility based on active tab
    $('a[data-bs-toggle="tab"]').on('shown.bs.tab', function (e) {
        const targetId = e.target.getAttribute('href').substring(1);
        const globalAddButton = document.getElementById('globalAddButton');
        
        // Hide button for tabs that don't need it
        const hideButtonForTabs = ['reports']; // Add any tabs that shouldn't show the add button
        globalAddButton.style.display = hideButtonForTabs.includes(targetId) ? 'none' : 'block';
    });

    // Make sure this is added to window object
    window.deleteAccount = deleteAccount;
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
                            <div class="mb-3">
                                <label>Item ID</label>
                                <input type="text" class="form-control" name="id" value="${teacher.id}" required>
                            </div>
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
                            <div class="mb-3">
                                <label>Account ID</label>
                                <input type="text" class="form-control" name="id" value="${account.accountId}" required>
                            </div>
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
                                <label class="form-label">Item ID</label>
                                <input type="text" class="form-control" name="id" required 
                                    pattern="[A-Za-z0-9-_]+" 
                                    title="Only letters, numbers, hyphens and underscores allowed"
                                    placeholder="Enter unique ID">
                            </div>
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
                            <div class="mb-3">
                                <label>Equipment ID</label>
                                <input type="text" class="form-control" name="id" value="${equipment.id}" required>
                            </div>
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

    const modalContent = `
        <div class="modal fade" id="reportModal">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${report.name}</h5>
                        <div class="btn-group ms-auto me-2">
                            <button class="btn btn-outline-primary" onclick="exportReport('${report.id}', 'pdf')">
                                <i class="fas fa-file-pdf"></i> PDF
                            </button>
                            <button class="btn btn-outline-success" onclick="exportReport('${report.id}', 'excel')">
                                <i class="fas fa-file-excel"></i> Excel
                            </button>
                            <button class="btn btn-outline-info" onclick="exportReport('${report.id}', 'word')">
                                <i class="fas fa-file-word"></i> Word
                            </button>
                            <button class="btn btn-outline-secondary" onclick="printReport('${report.id}')">
                                <i class="fas fa-print"></i> Print
                            </button>
                        </div>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" id="reportContent">
                        <div class="text-center">
                            <div class="spinner-border" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.querySelector('#reportModal')?.remove();
    document.body.insertAdjacentHTML('beforeend', modalContent);
    
    const modal = new bootstrap.Modal(document.querySelector('#reportModal'));
    modal.show();

    generateReport(id).then(content => {
        document.getElementById('reportContent').innerHTML = content;
    });
}

function exportReport(id, format) {
    const report = window.reportsData.find(r => r.id === id);
    if (!report) return;

    const content = document.getElementById('reportContent');
    const fileName = `${report.name}_${new Date().toISOString().split('T')[0]}`;

    switch (format) {
        case 'pdf':
            const pdfOpts = {
                margin: 1,
                filename: `${fileName}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
            };
            html2pdf().set(pdfOpts).from(content).save();
            break;

        case 'excel':
            const ws = XLSX.utils.table_to_sheet(content.querySelector('table'));
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, report.name);
            XLSX.writeFile(wb, `${fileName}.xlsx`);
            break;

        case 'word':
            const htmlContent = content.innerHTML;
            const blob = new Blob([`
                <html>
                    <head>
                        <meta charset='utf-8'>
                        <title>${report.name}</title>
                        <style>
                            table { border-collapse: collapse; width: 100%; }
                            th, td { border: 1px solid black; padding: 8px; }
                            th { background-color: #f5f5f5; }
                        </style>
                    </head>
                    <body>
                        ${htmlContent}
                    </body>
                </html>
            `], { type: 'application/msword' });
            const docUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = docUrl;
            link.download = `${fileName}.doc`;
            link.click();
            URL.revokeObjectURL(docUrl);
            break;
    }
}

function printReport(id) {
    const report = window.reportsData.find(r => r.id === id);
    if (!report) return;

    const content = document.getElementById('reportContent');
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
        <html>
            <head>
                <title>${report.name}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f5f5f5; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .footer { margin-top: 50px; text-align: center; font-size: 0.9em; }
                    @media print {
                        .no-print { display: none; }
                        @page { margin: 2cm; }
                    }
                </style>
            </head>
            <body>
                ${content.innerHTML}
            </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
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
                            <div class="mb-3">
                                <label>Facility ID</label>
                                <input type="text" class="form-control" name="id" value="${facility.id}" required>
                            </div>
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
                            <div class="mb-3">
                                <label>Maintenance ID</label>
                                <input type="text" class="form-control" name="id" value="${maintenance.id}" required>
                            </div>
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
                                <label>Account ID</label>
                                <input type="text" class="form-control" name="id" required 
                                    pattern="[A-Za-z0-9-_]+" 
                                    title="Only letters, numbers, hyphens and underscores allowed"
                                    placeholder="Enter unique ID">
                            </div>
                            <div class="mb-3">
                                <label>Account Name</label>
                                <input type="text" class="form-control" name="accountName" required>
                            </div>
                            <div class="mb-3">
                                <label>Category</label>
                                <select class="form-control" name="category" required>
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
                                <select class="form-control" name="status" required>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                    <option value="Frozen">Frozen</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label>Last Transaction Date</label>
                                <input type="date" class="form-control" name="lastTransaction" 
                                    value="${new Date().toISOString().split('T')[0]}" required>
                            </div>
                            <div class="mb-3">
                                <label>Description</label>
                                <textarea class="form-control" name="description" rows="3"></textarea>
                            </div>
                            <button type="submit" class="btn btn-primary">Save Account</button>
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
    try {
        // Clean up any existing instances
        if (window.DataStore?.destroy) {
            window.DataStore.destroy();
        }
        
        while (!window.DataStore) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        initializeTables();
        setupEventListeners();
    } catch (error) {
        console.error('Failed to initialize UI:', error);
    }
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

function addNewTransfer() {
    const modalContent = `
        <div class="modal fade" id="addTransferModal">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Add New Transfer Student</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="transferForm">
                            <div class="mb-3">
                                <label>Student ID</label>
                                <input type="text" class="form-control" name="studentId" required>
                            </div>
                            <div class="mb-3">
                                <label>Name</label>
                                <input type="text" class="form-control" name="name" required>
                            </div>
                            <div class="mb-3">
                                <label>Previous Class</label>
                                <input type="text" class="form-control" name="previousClass" required>
                            </div>
                            <div class="mb-3">
                                <label>New School</label>
                                <input type="text" class="form-control" name="newSchool" required>
                            </div>
                            <div class="mb-3">
                                <label>Transfer Date</label>
                                <input type="date" class="form-control" name="transferDate" required>
                            </div>
                            <div class="mb-3">
                                <label>Reason</label>
                                <textarea class="form-control" name="reason" required></textarea>
                            </div>
                            <div class="mb-3">
                                <label>Status</label>
                                <select class="form-control" name="status">
                                    <option value="Pending">Pending</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>
                            <button type="submit" class="btn btn-primary">Save</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.querySelector('#addTransferModal')?.remove();
    document.body.insertAdjacentHTML('beforeend', modalContent);
    
    const modal = new bootstrap.Modal(document.querySelector('#addTransferModal'));
    modal.show();

    document.getElementById('transferForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const transfer = Object.fromEntries(formData.entries());
        
        try {
            await DataStore.addRecord('transferredStudents', {
                ...transfer,
                createdAt: new Date().toISOString()
            });
            modal.hide();
            alert('Transfer record added successfully');
        } catch (error) {
            alert('Error adding transfer: ' + error.message);
        }
    });
}

// Add these to the global assignments
Object.assign(window, {
    // ...existing code...
    addNewTransfer,
    viewTransferDetails,
    editTransfer,
    deleteTransfer
});

function editTransfer(studentId) {
    const transfer = window.transferredStudents?.find(t => t.studentId === studentId);
    if (!transfer) {
        alert('Transfer record not found');
        return;
    }

    const modalContent = `
        <div class="modal fade" id="editTransferModal">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Edit Transfer Record</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="editTransferForm">
                            <input type="hidden" name="studentId" value="${transfer.studentId}">
                            <div class="mb-3">
                                <label>Name</label>
                                <input type="text" class="form-control" name="name" value="${transfer.name}" required>
                            </div>
                            <div class="mb-3">
                                <label>Previous Class</label>
                                <input type="text" class="form-control" name="previousClass" value="${transfer.previousClass}" required>
                            </div>
                            <div class="mb-3">
                                <label>New School</label>
                                <input type="text" class="form-control" name="newSchool" value="${transfer.newSchool}" required>
                            </div>
                            <div class="mb-3">
                                <label>Transfer Date</label>
                                <input type="date" class="form-control" name="transferDate" value="${transfer.transferDate}" required>
                            </div>
                            <div class="mb-3">
                                <label>Reason</label>
                                <textarea class="form-control" name="reason" required>${transfer.reason}</textarea>
                            </div>
                            <div class="mb-3">
                                <label>Status</label>
                                <select class="form-control" name="status">
                                    <option value="Pending" ${transfer.status === 'Pending' ? 'selected' : ''}>Pending</option>
                                    <option value="Completed" ${transfer.status === 'Completed' ? 'selected' : ''}>Completed</option>
                                    <option value="Cancelled" ${transfer.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                                </select>
                            </div>
                            <button type="submit" class="btn btn-primary">Save Changes</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.querySelector('#editTransferModal')?.remove();
    document.body.insertAdjacentHTML('beforeend', modalContent);
    
    const modal = new bootstrap.Modal(document.querySelector('#editTransferModal'));
    modal.show();

    document.getElementById('editTransferForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const updates = Object.fromEntries(formData.entries());
        
        try {
            await DataStore.updateRecord('transferredStudents', updates.studentId, updates);
            modal.hide();
            alert('Transfer record updated successfully');
        } catch (error) {
            alert('Error updating transfer: ' + error.message);
        }
    });
}

function deleteTransfer(studentId) {
    if (confirm('Are you sure you want to delete this transfer record?')) {
        DataStore.deleteRecord('transferredStudents', studentId)
            .then(result => {
                if (result.success) {
                    alert('Transfer record deleted successfully');
                } else {
                    alert(`Failed to delete transfer record: ${result.error}`);
                }
            })
            .catch(error => {
                alert(`Error: ${error.message}`);
            });
    }
}

function viewTransferDetails(studentId) {
    const transfer = window.transferredStudents?.find(t => t.studentId === studentId);
    if (!transfer) {
        alert('Transfer record not found');
        return;
    }

    const modalContent = `
        <div class="modal fade" id="viewTransferModal">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Transfer Details</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <dl class="row">
                            <dt class="col-sm-4">Student ID:</dt>
                            <dd class="col-sm-8">${transfer.studentId}</dd>
                            <dt class="col-sm-4">Name:</dt>
                            <dd class="col-sm-8">${transfer.name}</dd>
                            <dt class="col-sm-4">Previous Class:</dt>
                            <dd class="col-sm-8">${transfer.previousClass}</dd>
                            <dt class="col-sm-4">New School:</dt>
                            <dd class="col-sm-8">${transfer.newSchool}</dd>
                            <dt class="col-sm-4">Transfer Date:</dt>
                            <dd class="col-sm-8">${transfer.transferDate}</dd>
                            <dt class="col-sm-4">Reason:</dt>
                            <dd class="col-sm-8">${transfer.reason}</dd>
                            <dt class="col-sm-4">Status:</dt>
                            <dd class="col-sm-8">
                                <span class="badge bg-${transfer.status === 'Completed' ? 'success' : 
                                                      transfer.status === 'Pending' ? 'warning' : 'danger'}">
                                    ${transfer.status}
                                </span>
                            </dd>
                        </dl>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" onclick="editTransfer('${transfer.studentId}')">Edit</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.querySelector('#viewTransferModal')?.remove();
    document.body.insertAdjacentHTML('beforeend', modalContent);
    
    const modal = new bootstrap.Modal(document.querySelector('#viewTransferModal'));
    modal.show();
}

async function deleteAccount(accountId) {
    if (!accountId) {
        console.error('No account ID provided');
        return;
    }

    if (confirm('Are you sure you want to delete this account?')) {
        try {
            const result = await DataStore.deleteRecord('accountsData', accountId);
            if (result.success) {
                alert('Account deleted successfully');
                // Refresh the table
                const accountsTable = $('#accountsTable').DataTable();
                if (accountsTable) {
                    accountsTable.ajax.reload();
                }
            } else {
                alert(`Failed to delete account: ${result.error}`);
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            alert(`Error: ${error.message}`);
        }
    }
}

// Make sure deleteAccount is available globally
window.deleteAccount = deleteAccount;

// ...existing code...

function showAccountForm() {
    const modalContent = `
        <div class="modal fade" id="addAccountModal">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Add New Account</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="addAccountForm">
                            <div class="mb-3">
                                <label class="form-label">Account ID</label>
                                <input type="text" class="form-control" name="accountId" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Account Name</label>
                                <input type="text" class="form-control" name="accountName" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Category</label>
                                <select class="form-control" name="category" required>
                                    <option value="Operating">Operating</option>
                                    <option value="Restricted">Restricted</option>
                                    <option value="Special Purpose">Special Purpose</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Initial Balance</label>
                                <input type="number" step="0.01" class="form-control" name="balance" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Status</label>
                                <select class="form-control" name="status" required>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                    <option value="Frozen">Frozen</option>
                                </select>
                            </div>
                            <button type="submit" class="btn btn-primary">Save Account</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    document.querySelector('#addAccountModal')?.remove();
    
    // Add new modal to document
    document.body.insertAdjacentHTML('beforeend', modalContent);
    
    // Initialize the modal
    const modal = new bootstrap.Modal(document.querySelector('#addAccountModal'));
    modal.show();

    // Handle form submission
    document.querySelector('#addAccountForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const record = Object.fromEntries(formData.entries());
        
        try {
            // Add required fields
            record.id = record.accountId;
            record.lastTransaction = new Date().toISOString().split('T')[0];
            
            const result = await DataStore.addRecord('accountsData', record);
            if (result.success) {
                modal.hide();
                alert('Account added successfully');
                // Refresh the accounts table
                const table = $('#accountsTable').DataTable();
                table.ajax.reload();
            } else {
                alert('Failed to add account: ' + result.error);
            }
        } catch (error) {
            console.error('Error adding account:', error);
            alert('Error adding account: ' + error.message);
        }
    });
}

// Make sure showAccountForm is available globally
window.showAccountForm = showAccountForm;

// ...existing code...

function generateTableReport() {
    // Get active tab and table
    const activeTab = document.querySelector('.tab-pane.active');
    const activeTabId = activeTab.id;
    const table = $(`#${activeTabId}Table`).DataTable();
    
    // Get data from DataTable - Fix for empty table issue
    let data = [];
    table.rows().every(function() {
        // Get raw data for each row
        data.push(this.data());
    });

    // Debug log to verify data
    console.log(`Generating report for ${activeTabId} with ${data.length} records`);

    // Verify data exists
    if (!data || data.length === 0) {
        console.warn('No data available for report');
        alert('No data available to generate report');
        return;
    }

    let tableTitle = activeTabId.charAt(0).toUpperCase() + activeTabId.slice(1);

    const reportHeader = `
        <div class="report-header">
            <div class="school-info">
                <img src="../images/logo.png" alt="School Logo" class="school-logo">
                <div class="school-details">
                    <h1>Kanyadet Pri & Junior School</h1>
                    <p>45 - 40139 Akala, City: Kisumu, State: Kenya</p>
                    <p>Phone: (555) 123-4567 | Email: kanyadetpri@gmail.com</p>
                    <p>https://kanyadet-school-portal.web.app/</p>
                </div>
            </div>
            <div class="report-title">
                <h2>${tableTitle} Report</h2>
                <p class="report-date">Generated on: ${new Date().toLocaleString()}</p>
                <p class="report-id">Report ID: RPT-${Date.now().toString(36).toUpperCase()}</p>
            </div>
        </div>
    `;

    const reportContent = `
        <div class="report-container">
            ${reportHeader}
            <div class="report-body">
                <table class="report-table">
                    <thead>
                        ${generateTableHeaders(activeTabId)}
                    </thead>
                    <tbody>
                        ${generateTableRows(activeTabId, data)}
                    </tbody>
                    ${generateTableSummary(activeTabId, data)}
                </table>
            </div>
            <div class="report-footer">
                <div class="signature-section">
                    <div class="signature-line">
                        <span>_________________________</span>
                        <p>Administrator Signature</p>
                    </div>
                    <div class="signature-line">
                        <span>_________________________</span>
                        <p>Date</p>
                    </div>
                </div>
                <div class="footer-info">
                    <img src="../images/logo.png" alt="" class="footer-logo">
                    <p>Official School Document</p>
                    <p>Generated by School Inventory Management System</p>
                </div>
            </div>
        </div>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>${tableTitle} Report - St. Patrick's School</title>
                <style>
                    @page {
                        margin: 1.5cm;
                        size: A4;
                    }
                    body { 
                        font-family: Arial, sans-serif;
                        padding: 20px;
                        color: #333;
                    }
                    .report-container { 
                        max-width: 1000px;
                        margin: 0 auto;
                    }
                    .school-info {
                        display: flex;
                        align-items: center;
                        margin-bottom: 30px;
                        border-bottom: 2px solid #2c3e50;
                        padding-bottom: 20px;
                    }
                    .school-logo {
                        width: 100px;
                        height: auto;
                        margin-right: 20px;
                    }
                    .school-details {
                        flex: 1;
                    }
                    .school-details h1 {
                        color: #2c3e50;
                        margin: 0 0 10px 0;
                    }
                    .school-details p {
                        margin: 2px 0;
                        color: #666;
                    }
                    .report-title {
                        text-align: center;
                        margin: 20px 0;
                    }
                    .report-date, .report-id {
                        color: #666;
                        font-size: 0.9em;
                    }
                    .report-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                    }
                    .report-table th, .report-table td {
                        border: 1px solid #ddd;
                        padding: 12px;
                        text-align: left;
                    }
                    .report-table th {
                        background-color: #2c3e50;
                        color: white;
                    }
                    .report-table tr:nth-child(even) {
                        background-color: #f9f9f9;
                    }
                    .signature-section {
                        margin-top: 50px;
                        display: flex;
                        justify-content: space-around;
                    }
                    .signature-line {
                        text-align: center;
                    }
                    .signature-line span {
                        border-top: 1px solid #333;
                        padding-top: 5px;
                    }
                    .footer-info {
                        text-align: center;
                        margin-top: 50px;
                        color: #666;
                        font-size: 0.8em;
                        border-top: 1px solid #ddd;
                        padding-top: 20px;
                    }
                    .footer-logo {
                        width: 40px;
                        opacity: 0.5;
                        margin-bottom: 10px;
                    }
                    @media print {
                        .no-print { display: none; }
                        @page { margin: 2cm; }
                    }
                </style>
            </head>
            <body>
                ${reportContent}
                <div class="no-print" style="text-align: center; margin-top: 20px;">
                    <button onclick="window.print()">Print Report</button>
                </div>
            </body>
        </html>
    `);
    printWindow.document.close();
}

function generateTableHeaders(tabId) {
    // Define headers for each table type
    const headerMap = {
        equipment: [
            { title: 'ID', field: 'id' },
            { title: 'Item Name', field: 'name' },
            { title: 'Category', field: 'category' },
            { title: 'Quantity', field: 'quantity' },
            { title: 'Status', field: 'status' },
            { title: 'Location', field: 'location' },
            { title: 'Last Updated', field: 'lastUpdated' },
            { title: 'Value', field: 'value' }
        ],
        teachers: [
            { title: 'ID', field: 'id' },
            { title: 'Teacher Name', field: 'teacherName' },
            { title: 'Department', field: 'department' },
            { title: 'Item Name', field: 'itemName' },
            { title: 'Status', field: 'status' },
            { title: 'Assigned Date', field: 'assignedDate' },
            { title: 'Return Date', field: 'returnDate' }
        ],
        accounts: [
            { title: 'Account ID', field: 'accountId' },
            { title: 'Account Name', field: 'accountName' },
            { title: 'Category', field: 'category' },
            { title: 'Balance', field: 'balance' },
            { title: 'Last Updated', field: 'lastTransaction' },
            { title: 'Status', field: 'status' }
        ],
        supplies: [
            { title: 'ID', field: 'id' },
            { title: 'Name', field: 'name' },
            { title: 'Category', field: 'category' },
            { title: 'Quantity', field: 'quantity' },
            { title: 'Status', field: 'status' },
            { title: 'Location', field: 'location' },
            { title: 'Last Updated', field: 'lastUpdated' },
            { title: 'Value', field: 'value' }
        ],
        facilities: [
            { title: 'ID', field: 'id' },
            { title: 'Name', field: 'name' },
            { title: 'Location', field: 'location' },
            { title: 'Status', field: 'status' },
            { title: 'Last Maintenance', field: 'lastMaintenance' },
            { title: 'Next Maintenance', field: 'nextMaintenance' },
            { title: 'Condition', field: 'condition' }
        ],
        maintenance: [
            { title: 'ID', field: 'id' },
            { title: 'Date', field: 'date' },
            { title: 'Item Name', field: 'itemName' },
            { title: 'Type', field: 'type' },
            { title: 'Description', field: 'description' },
            { title: 'Cost', field: 'cost' },
            { title: 'Status', field: 'status' }
        ],
        transferredStudents: [
            { title: 'Student ID', field: 'studentId' },
            { title: 'Name', field: 'name' },
            { title: 'Previous Class', field: 'previousClass' },
            { title: 'New School', field: 'newSchool' },
            { title: 'Transfer Date', field: 'transferDate' },
            { title: 'Reason', field: 'reason' },
            { title: 'Status', field: 'status' }
        ]
    };

    const headers = headerMap[tabId] || [];
    return `
        <tr>
            ${headers.map(header => `<th>${header.title}</th>`).join('')}
        </tr>
    `;
}

// Move headerMap definition to file scope so it can be used by multiple functions
const headerMap = {
    equipment: [
        { title: 'ID', field: 'id' },
        { title: 'Item Name', field: 'name' },
        { title: 'Category', field: 'category' },
        { title: 'Quantity', field: 'quantity' },
        { title: 'Status', field: 'status' },
        { title: 'Location', field: 'location' },
        { title: 'Last Updated', field: 'lastUpdated' },
        { title: 'Value', field: 'value' }
    ],
    maintenance: [
        { title: 'ID', field: 'id' },
        { title: 'Date', field: 'date' },
        { title: 'Item Name', field: 'itemName' },
        { title: 'Type', field: 'type' },
        { title: 'Description', field: 'description' },
        { title: 'Cost', field: 'cost' },
        { title: 'Status', field: 'status' }
    ],
    transferredStudents: [
        { title: 'Student ID', field: 'studentId' },
        { title: 'Name', field: 'name' },
        { title: 'Previous Class', field: 'previousClass' },
        { title: 'New School', field: 'newSchool' },
        { title: 'Transfer Date', field: 'transferDate' },
        { title: 'Reason', field: 'reason' },
        { title: 'Status', field: 'status' }
    ],
    teachers: [
        { title: 'ID', field: 'id' },
        { title: 'Teacher Name', field: 'teacherName' },
        { title: 'Department', field: 'department' },
        { title: 'Item Name', field: 'itemName' },
        { title: 'Status', field: 'status' },
        { title: 'Assigned Date', field: 'assignedDate' },
        { title: 'Return Date', field: 'returnDate' }
    ],
    accounts: [
        { title: 'Account ID', field: 'accountId' },
        { title: 'Account Name', field: 'accountName' },
        { title: 'Category', field: 'category' },
        { title: 'Balance', field: 'balance' },
        { title: 'Last Updated', field: 'lastTransaction' },
        { title: 'Status', field: 'status' }
    ],
    supplies: [
        { title: 'ID', field: 'id' },
        { title: 'Name', field: 'name' },
        { title: 'Category', field: 'category' },
        { title: 'Quantity', field: 'quantity' },
        { title: 'Status', field: 'status' },
        { title: 'Location', field: 'location' },
        { title: 'Last Updated', field: 'lastUpdated' },
        { title: 'Value', field: 'value' }
    ],
    facilities: [
        { title: 'ID', field: 'id' },
        { title: 'Name', field: 'name' },
        { title: 'Location', field: 'location' },
        { title: 'Status', field: 'status' },
        { title: 'Last Maintenance', field: 'lastMaintenance' },
        { title: 'Next Maintenance', field: 'nextMaintenance' },
        { title: 'Condition', field: 'condition' }
    ]
};

function generateTableRows(tabId, data) {
    console.log(`Generating rows for ${tabId} with ${data.length} records`);
    
    if (!data || !data.length) {
        return `<tr><td colspan="8" class="text-center">No data available</td></tr>`;
    }

    const headers = headerMap[tabId];
    if (!headers) {
        console.warn(`No header configuration found for table: ${tabId}`);
        return `<tr><td colspan="8" class="text-center">Table configuration not found</td></tr>`;
    }

    return data.map(item => {
        console.log(`Processing item:`, item);
        if (tabId === 'transferredStudents') {
            return `
                <tr>
                    <td>${item.studentId || ''}</td>
                    <td>${item.name || ''}</td>
                    <td>${item.previousClass || ''}</td>
                    <td>${item.newSchool || ''}</td>
                    <td>${item.transferDate || ''}</td>
                    <td>${item.reason || ''}</td>
                    <td><span class="badge bg-${item.status === 'Completed' ? 'success' : 
                                             item.status === 'Pending' ? 'warning' : 'danger'}">${item.status || ''}</span></td>
                </tr>
            `;
        }
        
        return `
            <tr>
                ${headers.map(header => {
                    const value = item[header.field];
                    if (header.field === 'cost') {
                        return `<td>$${parseFloat(value || 0).toLocaleString()}</td>`;
                    }
                    return `<td>${value || ''}</td>`;
                }).join('')}
            </tr>
        `;
    }).join('');
}

// ...existing code...

function generateTableSummary(tabId, data) {
    let summary = '';
    switch(tabId) {
        case 'equipment':
            const totalValue = data.reduce((sum, item) => sum + (parseFloat(item.value) * parseInt(item.quantity)), 0);
            const totalItems = data.reduce((sum, item) => sum + parseInt(item.quantity), 0);
            summary = `
                <tfoot>
                    <tr class="summary-row">
                        <td colspan="3">Totals</td>
                        <td>${totalItems}</td>
                        <td colspan="2"></td>
                        <td>$${totalValue.toLocaleString()}</td>
                    </tr>
                </tfoot>
            `;
            break;
        case 'accounts':
            const totalBalance = data.reduce((sum, item) => sum + parseFloat(item.balance), 0);
            summary = `
                <tfoot>
                    <tr class="summary-row">
                        <td colspan="3">Total Balance</td>
                        <td colspan="3">$${totalBalance.toLocaleString()}</td>
                    </tr>
                </tfoot>
            `;
            break;
    }
    return summary;
}

// Add to window object
window.generateTableReport = generateTableReport;

// ...existing code...



