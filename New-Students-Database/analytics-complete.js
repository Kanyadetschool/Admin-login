// =============================================================================
// ADVANCED ANALYTICS FUNCTIONALITY WITH INTERACTIVE CHARTS
// =============================================================================

function showAdvancedAnalytics() {
    const analyticsBackdrop = document.getElementById('analytics-modal-backdrop');
    const analyticsContent = document.getElementById('analytics-content');
    
    if (!analyticsBackdrop || !analyticsContent) {
        console.error('Analytics modal elements not found');
        return;
    }
    
    // Generate analytics
    const analytics = generateAdvancedAnalytics();
    
    // Render analytics content
    analyticsContent.innerHTML = `
        <!-- Overview Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div class="neuro-card p-6">
                <div class="flex items-center justify-between mb-2">
                    <h4 class="text-sm font-semibold text-gray-500 dark:text-gray-400">Total Students</h4>
                    <svg class="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                    </svg>
                </div>
                <p class="text-3xl font-bold gradient-text">${analytics.overview.totalStudents}</p>
            </div>
            
            <div class="neuro-card p-6">
                <div class="flex items-center justify-between mb-2">
                    <h4 class="text-sm font-semibold text-gray-500 dark:text-gray-400">Completion Rate</h4>
                    <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <p class="text-3xl font-bold gradient-text">${analytics.overview.completionRate}%</p>
            </div>
            
            <div class="neuro-card p-6">
                <div class="flex items-center justify-between mb-2">
                    <h4 class="text-sm font-semibold text-gray-500 dark:text-gray-400">Documents</h4>
                    <svg class="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                </div>
                <p class="text-3xl font-bold gradient-text">${analytics.overview.withDocuments}</p>
            </div>
            
            <div class="neuro-card p-6">
                <div class="flex items-center justify-between mb-2">
                    <h4 class="text-sm font-semibold text-gray-500 dark:text-gray-400">Pending</h4>
                    <svg class="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <p class="text-3xl font-bold gradient-text">${analytics.overview.pending}</p>
            </div>
        </div>
        
        <!-- Interactive Charts -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <!-- Completion Rate Pie Chart -->
            <div class="glass-morph rounded-2xl p-6">
                <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path>
                    </svg>
                    Document Status Distribution
                </h3>
                <canvas id="statusPieChart" height="250"></canvas>
            </div>
            
            <!-- Grade Performance Bar Chart -->
            <div class="glass-morph rounded-2xl p-6">
                <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                    Grade-wise Completion
                </h3>
                <canvas id="gradeBarChart" height="250"></canvas>
            </div>
        </div>
        
        <!-- Quick Action Buttons -->
        <div class="glass-morph rounded-2xl p-6 mb-6">
            <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                Quick Actions
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button onclick="filterByStatus('pending')" class="action-btn p-4 bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105">
                    <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p class="font-semibold text-sm">View Pending</p>
                </button>
                
                <button onclick="filterByStatus('completed')" class="action-btn p-4 bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105">
                    <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p class="font-semibold text-sm">View Completed</p>
                </button>
                
                <button onclick="showTopGrade()" class="action-btn p-4 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105">
                    <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
                    </svg>
                    <p class="font-semibold text-sm">Top Grade</p>
                </button>
                
                <button onclick="exportAnalyticsReport()" class="action-btn p-4 bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105">
                    <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <p class="font-semibold text-sm">Export Report</p>
                </button>
            </div>
        </div>
        
        <!-- Grade Breakdown -->
        <div class="glass-morph rounded-2xl p-6 mb-6">
            <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
                Grade-wise Analysis
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${analytics.gradeBreakdown.map(grade => `
                    <div class="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105" onclick="filterByGrade('${grade.name}')">
                        <div class="flex items-center justify-between mb-3">
                            <h4 class="font-bold text-gray-800 dark:text-white">${grade.name}</h4>
                            <span class="text-xs font-semibold px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                                ${grade.total} students
                            </span>
                        </div>
                        <div class="space-y-2">
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600 dark:text-gray-400">With Documents:</span>
                                <span class="font-semibold text-green-600">${grade.withPdf} (${grade.withPdfPercent}%)</span>
                            </div>
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600 dark:text-gray-400">Pending:</span>
                                <span class="font-semibold text-orange-600">${grade.withoutPdf} (${grade.withoutPdfPercent}%)</span>
                            </div>
                            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                                <div class="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500" 
                                     style="width: ${grade.withPdfPercent}%"></div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <!-- Insights & Recommendations -->
        <div class="glass-morph rounded-2xl p-6 mb-6">
            <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
                Insights & Recommendations
            </h3>
            <div class="space-y-3">
                ${analytics.insights.map(insight => {
                    const iconColors = {
                        success: 'text-green-600',
                        warning: 'text-yellow-600',
                        info: 'text-blue-600',
                        error: 'text-red-600'
                    };
                    const bgColors = {
                        success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
                        warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
                        info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
                        error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    };
                    return `
                        <div class="p-4 ${bgColors[insight.type]} border rounded-lg flex items-start gap-3">
                            <svg class="w-5 h-5 ${iconColors[insight.type]} flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <div>
                                <p class="font-semibold text-gray-800 dark:text-white">${insight.title}</p>
                                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">${insight.message}</p>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
        
        <!-- Performance Metrics -->
        <div class="glass-morph rounded-2xl p-6">
            <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                System Performance
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-all duration-300" onclick="showCheckedStudents()">
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Checked Students</p>
                    <p class="text-2xl font-bold text-gray-800 dark:text-white">${analytics.performance.checkedCount}</p>
                    <p class="text-xs text-gray-500 mt-1">${analytics.performance.checkedPercentage}% Complete</p>
                </div>
                <div class="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Cache Size</p>
                    <p class="text-2xl font-bold text-gray-800 dark:text-white">${analytics.performance.cacheSize}</p>
                    <p class="text-xs text-gray-500 mt-1">PDF existence cache</p>
                </div>
                <div class="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Filters</p>
                    <p class="text-2xl font-bold text-gray-800 dark:text-white">${analytics.performance.activeFilters}</p>
                    <p class="text-xs text-gray-500 mt-1">Current filter: ${currentFilter}</p>
                </div>
            </div>
        </div>
    `;
    
    // Show modal
    analyticsBackdrop.classList.remove('hidden');
    analyticsBackdrop.classList.add('flex');
    
    // Initialize charts after a brief delay to ensure canvas is rendered
    setTimeout(() => {
        initializeAnalyticsCharts(analytics);
    }, 100);
}

function initializeAnalyticsCharts(analytics) {
    // Pie Chart for Document Status
    const pieCtx = document.getElementById('statusPieChart');
    if (pieCtx && window.Chart) {
        new Chart(pieCtx, {
            type: 'doughnut',
            data: {
                labels: ['With Documents', 'Pending', 'Not Checked'],
                datasets: [{
                    data: [
                        analytics.overview.withDocuments,
                        analytics.overview.pending,
                        analytics.overview.totalStudents - analytics.performance.checkedCount
                    ],
                    backgroundColor: [
                        'rgba(34, 197, 94, 0.8)',
                        'rgba(251, 146, 60, 0.8)',
                        'rgba(148, 163, 184, 0.8)'
                    ],
                    borderColor: [
                        'rgba(34, 197, 94, 1)',
                        'rgba(251, 146, 60, 1)',
                        'rgba(148, 163, 184, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Bar Chart for Grade Performance
    const barCtx = document.getElementById('gradeBarChart');
    if (barCtx && window.Chart) {
        const gradeLabels = analytics.gradeBreakdown.map(g => g.name);
        const withPdfData = analytics.gradeBreakdown.map(g => g.withPdf);
        const withoutPdfData = analytics.gradeBreakdown.map(g => g.withoutPdf);
        
        new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: gradeLabels,
                datasets: [
                    {
                        label: 'With Documents',
                        data: withPdfData,
                        backgroundColor: 'rgba(34, 197, 94, 0.8)',
                        borderColor: 'rgba(34, 197, 94, 1)',
                        borderWidth: 2
                    },
                    {
                        label: 'Pending',
                        data: withoutPdfData,
                        backgroundColor: 'rgba(251, 146, 60, 0.8)',
                        borderColor: 'rgba(251, 146, 60, 1)',
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y || 0;
                                return `${label}: ${value} students`;
                            }
                        }
                    }
                },
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const gradeIndex = elements[0].index;
                        const gradeName = gradeLabels[gradeIndex];
                        filterByGrade(gradeName);
                        closeAnalyticsModal();
                    }
                }
            }
        });
    }
}

function generateAdvancedAnalytics() {
    const totalStudents = allStudents.length;
    const checkedStudents = allStudents.filter(s => s.hasPdf !== undefined);
    const withDocuments = allStudents.filter(s => s.hasPdf === true).length;
    const pending = allStudents.filter(s => s.hasPdf === false).length;
    const completionRate = checkedStudents.length > 0 
        ? ((withDocuments / checkedStudents.length) * 100).toFixed(1) 
        : '0.0';
    
    // Grade breakdown
    const gradeData = {};
    allStudents.forEach(s => {
        const grade = s.grade || 'N/A';
        if (!gradeData[grade]) {
            gradeData[grade] = { total: 0, withPdf: 0, withoutPdf: 0 };
        }
        gradeData[grade].total++;
        if (s.hasPdf === true) gradeData[grade].withPdf++;
        if (s.hasPdf === false) gradeData[grade].withoutPdf++;
    });
    
    const gradeBreakdown = Object.entries(gradeData).map(([name, data]) => ({
        name,
        total: data.total,
        withPdf: data.withPdf,
        withoutPdf: data.withoutPdf,
        withPdfPercent: data.total > 0 ? ((data.withPdf / data.total) * 100).toFixed(1) : '0.0',
        withoutPdfPercent: data.total > 0 ? ((data.withoutPdf / data.total) * 100).toFixed(1) : '0.0'
    })).sort((a, b) => a.name.localeCompare(b.name));
    
    // Generate insights
    const insights = [];
    
    if (parseFloat(completionRate) === 100) {
        insights.push({
            type: 'success',
            title: 'Excellent! 100% Completion',
            message: 'All checked students have their birth certificates on file. Great work!'
        });
    } else if (parseFloat(completionRate) >= 80) {
        insights.push({
            type: 'success',
            title: 'Good Progress',
            message: `${completionRate}% of students have documents. You're doing great!`
        });
    } else if (parseFloat(completionRate) >= 50) {
        insights.push({
            type: 'warning',
            title: 'Moderate Completion',
            message: `${completionRate}% completion rate. Consider following up on missing documents.`
        });
    } else {
        insights.push({
            type: 'error',
            title: 'Action Required',
            message: `Only ${completionRate}% completion. Urgent attention needed for missing documents.`
        });
    }
    
    if (pending > 0) {
        insights.push({
            type: 'info',
            title: `${pending} Documents Pending`,
            message: `There are ${pending} students without birth certificates. Consider sending reminders to parents.`
        });
    }
    
    // Find grade with lowest completion
    const lowestGrade = gradeBreakdown.reduce((lowest, current) => {
        const currentRate = parseFloat(current.withPdfPercent);
        const lowestRate = parseFloat(lowest.withPdfPercent);
        return currentRate < lowestRate ? current : lowest;
    }, gradeBreakdown[0]);
    
    if (lowestGrade && parseFloat(lowestGrade.withPdfPercent) < 70) {
        insights.push({
            type: 'warning',
            title: `${lowestGrade.name} Needs Attention`,
            message: `${lowestGrade.name} has only ${lowestGrade.withPdfPercent}% completion rate (${lowestGrade.withPdf}/${lowestGrade.total} students).`
        });
    }
    
    return {
        overview: {
            totalStudents,
            completionRate,
            withDocuments,
            pending
        },
        gradeBreakdown,
        insights,
        performance: {
            checkedCount: checkedStudents.length,
            checkedPercentage: totalStudents > 0 ? ((checkedStudents.length / totalStudents) * 100).toFixed(1) : '0.0',
            cacheSize: pdfExistenceCache.size,
            activeFilters: currentFilter !== 'all' || currentGrade !== 'all' || currentSearchTerm ? 
                [currentFilter !== 'all' ? 1 : 0, currentGrade !== 'all' ? 1 : 0, currentSearchTerm ? 1 : 0].reduce((a, b) => a + b, 0) : 0
        }
    };
}

function closeAnalyticsModal() {
    const analyticsBackdrop = document.getElementById('analytics-modal-backdrop');
    if (analyticsBackdrop) {
        analyticsBackdrop.classList.add('hidden');
        analyticsBackdrop.classList.remove('flex');
    }
}

// Quick Action Functions
function filterByStatus(status) {
    closeAnalyticsModal();
    if (status === 'pending') {
        if (typeof setFilter === 'function') {
            setFilter('without');
            showToast('Showing students without documents', 'info');
        }
    } else if (status === 'completed') {
        if (typeof setFilter === 'function') {
            setFilter('with');
            showToast('Showing students with documents', 'success');
        }
    }
}

function filterByGrade(gradeName) {
    closeAnalyticsModal();
    if (typeof window.currentGrade !== 'undefined') {
        window.currentGrade = gradeName;
        if (typeof applyFilters === 'function') {
            applyFilters();
            showToast(`Showing ${gradeName} students`, 'info');
        }
    }
}

function showTopGrade() {
    const analytics = generateAdvancedAnalytics();
    const topGrade = analytics.gradeBreakdown.reduce((top, current) => {
        const currentRate = parseFloat(current.withPdfPercent);
        const topRate = parseFloat(top.withPdfPercent);
        return currentRate > topRate ? current : top;
    }, analytics.gradeBreakdown[0]);
    
    if (topGrade) {
        closeAnalyticsModal();
        showToast(`Top Grade: ${topGrade.name} with ${topGrade.withPdfPercent}% completion!`, 'success');
        filterByGrade(topGrade.name);
    }
}

function showCheckedStudents() {
    closeAnalyticsModal();
    const checkedStudents = allStudents.filter(s => s.hasPdf !== undefined);
    showToast(`Total checked: ${checkedStudents.length} students`, 'info');
}

function exportAnalyticsReport() {
    const analytics = generateAdvancedAnalytics();
    
    const report = {
        generatedDate: new Date().toISOString(),
        schoolName: 'KANYADET PRI & JUNIOR SCHOOL',
        overview: analytics.overview,
        gradeBreakdown: analytics.gradeBreakdown,
        insights: analytics.insights,
        performance: analytics.performance
    };
    
    const jsonContent = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_report_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Analytics report exported successfully!', 'success');
}

// Close modal when clicking outside or on close button
document.addEventListener('DOMContentLoaded', function() {
    const analyticsCloseBtn = document.getElementById('analytics-modal-close-btn');
    const analyticsBackdrop = document.getElementById('analytics-modal-backdrop');
    
    if (analyticsCloseBtn) {
        analyticsCloseBtn.addEventListener('click', closeAnalyticsModal);
    }
    
    if (analyticsBackdrop) {
        analyticsBackdrop.addEventListener('click', function(e) {
            if (e.target === analyticsBackdrop) {
                closeAnalyticsModal();
            }
        });
    }
});

// Export functions to window
window.showAdvancedAnalytics = showAdvancedAnalytics;
window.closeAnalyticsModal = closeAnalyticsModal;
window.exportAnalyticsReport = exportAnalyticsReport;
window.filterByStatus = filterByStatus;
window.filterByGrade = filterByGrade;
window.showTopGrade = showTopGrade;
window.showCheckedStudents = showCheckedStudents;
window.initializeAnalyticsCharts = initializeAnalyticsCharts;

console.log('✅ Advanced Analytics module loaded with interactive charts');