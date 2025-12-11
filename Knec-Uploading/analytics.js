// =============================================================================
// ADVANCED ANALYTICS FUNCTIONALITY WITH INTERACTIVE CHARTS + ENHANCED FEATURES
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
        <!-- Tab Navigation -->
        <div class="mb-6 border-b border-gray-200 dark:border-gray-700">
            <nav class="flex gap-4" aria-label="Analytics Tabs">
                <button onclick="switchAnalyticsTab('overview')" id="tab-overview" class="analytics-tab active px-6 py-3 font-semibold text-indigo-600 border-b-2 border-indigo-600 transition-all">
                    <svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                    Overview
                </button>
                <button onclick="switchAnalyticsTab('grades')" id="tab-grades" class="analytics-tab px-6 py-3 font-semibold text-gray-600 hover:text-indigo-600 transition-all">
                    <svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                    </svg>
                    Grades
                </button>
                <button onclick="switchAnalyticsTab('trends')" id="tab-trends" class="analytics-tab px-6 py-3 font-semibold text-gray-600 hover:text-indigo-600 transition-all">
                    <svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path>
                    </svg>
                    Trends
                </button>
                <button onclick="switchAnalyticsTab('comparison')" id="tab-comparison" class="analytics-tab px-6 py-3 font-semibold text-gray-600 hover:text-indigo-600 transition-all">
                    <svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                    Compare
                </button>
                <button onclick="switchAnalyticsTab('export')" id="tab-export" class="analytics-tab px-6 py-3 font-semibold text-gray-600 hover:text-indigo-600 transition-all">
                    <svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    Export
                </button>
            </nav>
        </div>

        <!-- Tab Content Container -->
        <div id="analytics-tab-content">
            ${renderOverviewTab(analytics)}
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

// =============================================================================
// TAB RENDERING FUNCTIONS
// =============================================================================

function renderOverviewTab(analytics) {
    return `
        <!-- Overview Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div class="neuro-card p-6 cursor-pointer hover:scale-105 transition-transform" onclick="showStudentList('all')">
                <div class="flex items-center justify-between mb-2">
                    <h4 class="text-sm font-semibold text-gray-500 dark:text-gray-400">Total Students</h4>
                    <svg class="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                    </svg>
                </div>
                <p class="text-3xl font-bold gradient-text">${analytics.overview.totalStudents}</p>
                <p class="text-xs text-gray-500 mt-2">Click to view all</p>
            </div>
            
            <div class="neuro-card p-6 cursor-pointer hover:scale-105 transition-transform" onclick="showCompletionTrend()">
                <div class="flex items-center justify-between mb-2">
                    <h4 class="text-sm font-semibold text-gray-500 dark:text-gray-400">Completion Rate</h4>
                    <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <p class="text-3xl font-bold gradient-text">${analytics.overview.completionRate}%</p>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                    <div class="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500" 
                         style="width: ${analytics.overview.completionRate}%"></div>
                </div>
            </div>
            
            <div class="neuro-card p-6 cursor-pointer hover:scale-105 transition-transform" onclick="filterByStatus('completed')">
                <div class="flex items-center justify-between mb-2">
                    <h4 class="text-sm font-semibold text-gray-500 dark:text-gray-400">Documents</h4>
                    <svg class="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                </div>
                <p class="text-3xl font-bold gradient-text">${analytics.overview.withDocuments}</p>
                <p class="text-xs text-green-600 font-semibold mt-2">✓ Complete</p>
            </div>
            
            <div class="neuro-card p-6 cursor-pointer hover:scale-105 transition-transform" onclick="filterByStatus('pending')">
                <div class="flex items-center justify-between mb-2">
                    <h4 class="text-sm font-semibold text-gray-500 dark:text-gray-400">Pending</h4>
                    <svg class="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <p class="text-3xl font-bold gradient-text">${analytics.overview.pending}</p>
                <p class="text-xs text-orange-600 font-semibold mt-2">⚠ Action needed</p>
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
                <div style="height: 280px;">
                    <canvas id="statusPieChart"></canvas>
                </div>
            </div>
            
            <!-- Grade Performance Bar Chart -->
            <div class="glass-morph rounded-2xl p-6">
                <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                    Grade-wise Completion
                </h3>
                <div style="height: 280px;">
                    <canvas id="gradeBarChart"></canvas>
                </div>
            </div>
        </div>
        
        <!-- Gender Distribution Chart -->
        <div class="glass-morph rounded-2xl p-6 mb-6">
            <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <svg class="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                Gender Distribution by Grade
            </h3>
            <div style="height: 300px;">
                <canvas id="genderChart"></canvas>
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
                
                <button onclick="generateEmailList()" class="action-btn p-4 bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105">
                    <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                    <p class="font-semibold text-sm">Email List</p>
                </button>
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
    `;
}

function renderGradesTab(analytics) {
    return `
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
                            <div class="flex justify-between text-sm mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                <span class="text-gray-600 dark:text-gray-400">Gender:</span>
                                <span class="font-semibold text-blue-600">
                                    <span class="inline-flex items-center gap-1">
                                        <svg class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                                        </svg>
                                        ${grade.male || 0}M
                                    </span>
                                    <span class="mx-1">|</span>
                                    <span class="inline-flex items-center gap-1">
                                        <svg class="w-4 h-4 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                                        </svg>
                                        ${grade.female || 0}F
                                    </span>
                                </span>
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
        
        <!-- Grade Comparison Table -->
        <div class="glass-morph rounded-2xl p-6">
            <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4">Grade Comparison Table</h3>
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead>
                        <tr class="bg-gray-100 dark:bg-gray-800">
                            <th class="px-4 py-3 text-left font-semibold">Grade</th>
                            <th class="px-4 py-3 text-center font-semibold">Total</th>
                            <th class="px-4 py-3 text-center font-semibold">Complete</th>
                            <th class="px-4 py-3 text-center font-semibold">Pending</th>
                            <th class="px-4 py-3 text-center font-semibold">Male</th>
                            <th class="px-4 py-3 text-center font-semibold">Female</th>
                            <th class="px-4 py-3 text-center font-semibold">Completion %</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${analytics.gradeBreakdown.map((grade, index) => `
                            <tr class="${index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'} hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors" onclick="filterByGrade('${grade.name}')">
                                <td class="px-4 py-3 font-semibold">${grade.name}</td>
                                <td class="px-4 py-3 text-center">${grade.total}</td>
                                <td class="px-4 py-3 text-center text-green-600 font-semibold">${grade.withPdf}</td>
                                <td class="px-4 py-3 text-center text-orange-600 font-semibold">${grade.withoutPdf}</td>
                                <td class="px-4 py-3 text-center text-blue-600">${grade.male || 0}</td>
                                <td class="px-4 py-3 text-center text-pink-600">${grade.female || 0}</td>
                                <td class="px-4 py-3 text-center">
                                    <span class="px-3 py-1 rounded-full text-xs font-bold ${parseFloat(grade.withPdfPercent) >= 80 ? 'bg-green-100 text-green-800' : parseFloat(grade.withPdfPercent) >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}">
                                        ${grade.withPdfPercent}%
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderTrendsTab(analytics) {
    return `
        <!-- Trends and Patterns -->
        <div class="glass-morph rounded-2xl p-6 mb-6">
            <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path>
                </svg>
                Completion Trends
            </h3>
            <div style="height: 350px;">
                <canvas id="trendLineChart"></canvas>
            </div>
        </div>
        
        <!-- Best and Worst Performing Grades -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div class="glass-morph rounded-2xl p-6">
                <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
                    </svg>
                    Top Performing Grades
                </h3>
                <div class="space-y-3">
                    ${analytics.gradeBreakdown
                        .sort((a, b) => parseFloat(b.withPdfPercent) - parseFloat(a.withPdfPercent))
                        .slice(0, 3)
                        .map((grade, index) => `
                            <div class="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800 cursor-pointer hover:shadow-lg transition-all" onclick="filterByGrade('${grade.name}')">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-3">
                                        <span class="text-2xl font-bold text-green-600">#${index + 1}</span>
                                        <div>
                                            <p class="font-bold text-gray-800 dark:text-white">${grade.name}</p>
                                            <p class="text-sm text-gray-600 dark:text-gray-400">${grade.withPdf}/${grade.total} students</p>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <p class="text-2xl font-bold text-green-600">${grade.withPdfPercent}%</p>
                                        <p class="text-xs text-gray-500">completion</p>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                </div>
            </div>
            
            <div class="glass-morph rounded-2xl p-6">
                <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                    Needs Attention
                </h3>
                <div class="space-y-3">
                    ${analytics.gradeBreakdown
                        .sort((a, b) => parseFloat(a.withPdfPercent) - parseFloat(b.withPdfPercent))
                        .slice(0, 3)
                        .map((grade, index) => `
                            <div class="p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg border border-red-200 dark:border-red-800 cursor-pointer hover:shadow-lg transition-all" onclick="filterByGrade('${grade.name}')">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-3">
                                        <span class="text-2xl font-bold text-red-600">⚠</span>
                                        <div>
                                            <p class="font-bold text-gray-800 dark:text-white">${grade.name}</p>
                                            <p class="text-sm text-gray-600 dark:text-gray-400">${grade.withoutPdf} pending documents</p>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <p class="text-2xl font-bold text-red-600">${grade.withPdfPercent}%</p>
                                        <p class="text-xs text-gray-500">completion</p>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                </div>
            </div>
        </div>
        
        <!-- Gender Distribution Trends -->
        <div class="glass-morph rounded-2xl p-6">
            <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                Gender Distribution Across Grades
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Male</p>
                    <p class="text-3xl font-bold text-blue-600">${analytics.gradeBreakdown.reduce((sum, g) => sum + (g.male || 0), 0)}</p>
                </div>
                <div class="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Female</p>
                    <p class="text-3xl font-bold text-pink-600">${analytics.gradeBreakdown.reduce((sum, g) => sum + (g.female || 0), 0)}</p>
                </div>
                <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">M:F Ratio</p>
                    <p class="text-3xl font-bold text-green-600">${calculateGenderRatio(analytics)}</p>
                </div>
                <div class="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Balanced Grades</p>
                    <p class="text-3xl font-bold text-purple-600">${countBalancedGrades(analytics)}</p>
                </div>
            </div>
            <div style="height: 300px;">
                <canvas id="genderComparisonChart"></canvas>
            </div>
        </div>
    `;
}

function renderComparisonTab(analytics) {
    return `
        <!-- Grade Comparison -->
        <div class="glass-morph rounded-2xl p-6 mb-6">
            <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
                Side-by-Side Grade Comparison
            </h3>
            
            <div class="mb-4 flex gap-4">
                <div class="flex-1">
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Select Grade 1</label>
                    <select id="compare-grade-1" class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" onchange="updateComparison()">
                        ${analytics.gradeBreakdown.map(g => `<option value="${g.name}">${g.name}</option>`).join('')}
                    </select>
                </div>
                <div class="flex-1">
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Select Grade 2</label>
                    <select id="compare-grade-2" class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" onchange="updateComparison()">
                        ${analytics.gradeBreakdown.map((g, i) => `<option value="${g.name}" ${i === 1 ? 'selected' : ''}>${g.name}</option>`).join('')}
                    </select>
                </div>
            </div>
            
            <div id="comparison-result" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Will be populated by updateComparison() -->
            </div>
        </div>
        
        <!-- Radar Chart Comparison -->
        <div class="glass-morph rounded-2xl p-6 mb-6">
            <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4">Multi-Metric Comparison</h3>
            <div style="height: 400px;">
                <canvas id="radarComparisonChart"></canvas>
            </div>
        </div>
        
        <!-- Statistical Summary -->
        <div class="glass-morph rounded-2xl p-6">
            <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4">Statistical Summary</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Average Completion</p>
                    <p class="text-3xl font-bold text-blue-600">${calculateAverageCompletion(analytics)}%</p>
                </div>
                <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Highest Grade</p>
                    <p class="text-2xl font-bold text-green-600">${getHighestGrade(analytics).name}</p>
                    <p class="text-sm text-gray-500">${getHighestGrade(analytics).withPdfPercent}% completion</p>
                </div>
                <div class="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Lowest Grade</p>
                    <p class="text-2xl font-bold text-red-600">${getLowestGrade(analytics).name}</p>
                    <p class="text-sm text-gray-500">${getLowestGrade(analytics).withPdfPercent}% completion</p>
                </div>
            </div>
        </div>
    `;
}

function renderExportTab(analytics) {
    return `
        <!-- Export Options -->
        <div class="glass-morph rounded-2xl p-6 mb-6">
            <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                Export Options
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <!-- PDF Export -->
                <div class="p-6 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-xl border border-red-200 dark:border-red-800 cursor-pointer hover:shadow-lg transition-all hover:scale-105" onclick="exportAnalyticsToPDF()">
                    <svg class="w-12 h-12 text-red-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                    </svg>
                    <h4 class="font-bold text-gray-800 dark:text-white mb-2">PDF Report</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Complete analytics report with charts</p>
                </div>
                
                <!-- Excel Export -->
                <div class="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800 cursor-pointer hover:shadow-lg transition-all hover:scale-105" onclick="exportAnalyticsToExcel()">
                    <svg class="w-12 h-12 text-green-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <h4 class="font-bold text-gray-800 dark:text-white mb-2">Excel Spreadsheet</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Detailed data for further analysis</p>
                </div>
                
                <!-- JSON Export -->
                <div class="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 cursor-pointer hover:shadow-lg transition-all hover:scale-105" onclick="exportAnalyticsReport()">
                    <svg class="w-12 h-12 text-blue-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                    </svg>
                    <h4 class="font-bold text-gray-800 dark:text-white mb-2">JSON Data</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Raw data for API integration</p>
                </div>
                
                <!-- Print Report -->
                <div class="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800 cursor-pointer hover:shadow-lg transition-all hover:scale-105" onclick="printAnalyticsReport()">
                    <svg class="w-12 h-12 text-purple-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                    </svg>
                    <h4 class="font-bold text-gray-800 dark:text-white mb-2">Print Report</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Printer-friendly format</p>
                </div>
                
                <!-- Email List -->
                <div class="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800 cursor-pointer hover:shadow-lg transition-all hover:scale-105" onclick="generateEmailList()">
                    <svg class="w-12 h-12 text-yellow-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                    <h4 class="font-bold text-gray-800 dark:text-white mb-2">Email List</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Contact list for reminders</p>
                </div>
                
                <!-- Summary Report -->
                <div class="p-6 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800 cursor-pointer hover:shadow-lg transition-all hover:scale-105" onclick="exportSummaryReport()">
                    <svg class="w-12 h-12 text-indigo-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <h4 class="font-bold text-gray-800 dark:text-white mb-2">Summary Report</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Quick overview document</p>
                </div>
            </div>
        </div>
        
        <!-- Advanced Export Options -->
        <div class="glass-morph rounded-2xl p-6">
            <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4">Custom Export Settings</h3>
            
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Include Sections</label>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <label class="flex items-center gap-2">
                            <input type="checkbox" id="export-overview" checked class="rounded">
                            <span class="text-sm">Overview</span>
                        </label>
                        <label class="flex items-center gap-2">
                            <input type="checkbox" id="export-grades" checked class="rounded">
                            <span class="text-sm">Grade Details</span>
                        </label>
                        <label class="flex items-center gap-2">
                            <input type="checkbox" id="export-charts" checked class="rounded">
                            <span class="text-sm">Charts</span>
                        </label>
                        <label class="flex items-center gap-2">
                            <input type="checkbox" id="export-insights" checked class="rounded">
                            <span class="text-sm">Insights</span>
                        </label>
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Date Range</label>
                    <div class="flex gap-4">
                        <input type="date" id="export-date-from" class="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
                        <span class="self-center text-gray-500">to</span>
                        <input type="date" id="export-date-to" class="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                </div>
                
                <button onclick="exportCustomReport()" class="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all hover:scale-105">
                    Generate Custom Report
                </button>
            </div>
        </div>
    `;
}

// =============================================================================
// TAB SWITCHING FUNCTIONALITY
// =============================================================================

function switchAnalyticsTab(tabName) {
    // Remove active class from all tabs
    document.querySelectorAll('.analytics-tab').forEach(tab => {
        tab.classList.remove('active', 'text-indigo-600', 'border-b-2', 'border-indigo-600');
        tab.classList.add('text-gray-600');
    });
    
    // Add active class to selected tab
    const activeTab = document.getElementById(`tab-${tabName}`);
    if (activeTab) {
        activeTab.classList.add('active', 'text-indigo-600', 'border-b-2', 'border-indigo-600');
        activeTab.classList.remove('text-gray-600');
    }
    
    // Generate analytics data
    const analytics = generateAdvancedAnalytics();
    
    // Render appropriate tab content
    const tabContent = document.getElementById('analytics-tab-content');
    if (!tabContent) return;
    
    switch(tabName) {
        case 'overview':
            tabContent.innerHTML = renderOverviewTab(analytics);
            setTimeout(() => initializeAnalyticsCharts(analytics), 100);
            break;
        case 'grades':
            tabContent.innerHTML = renderGradesTab(analytics);
            break;
        case 'trends':
            tabContent.innerHTML = renderTrendsTab(analytics);
            setTimeout(() => initializeTrendCharts(analytics), 100);
            break;
        case 'comparison':
            tabContent.innerHTML = renderComparisonTab(analytics);
            setTimeout(() => {
                updateComparison();
                initializeRadarChart(analytics);
            }, 100);
            break;
        case 'export':
            tabContent.innerHTML = renderExportTab(analytics);
            break;
    }
}

// =============================================================================
// CHART INITIALIZATION FUNCTIONS
// =============================================================================

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
    
    // Gender Distribution Chart
    const genderCtx = document.getElementById('genderChart');
    if (genderCtx && window.Chart) {
        const gradeLabels = analytics.gradeBreakdown.map(g => g.name);
        const maleData = analytics.gradeBreakdown.map(g => g.male || 0);
        const femaleData = analytics.gradeBreakdown.map(g => g.female || 0);
        
        new Chart(genderCtx, {
            type: 'bar',
            data: {
                labels: gradeLabels,
                datasets: [
                    {
                        label: 'Male',
                        data: maleData,
                        backgroundColor: 'rgba(59, 130, 246, 0.8)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 2
                    },
                    {
                        label: 'Female',
                        data: femaleData,
                        backgroundColor: 'rgba(236, 72, 153, 0.8)',
                        borderColor: 'rgba(236, 72, 153, 1)',
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: false
                    },
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
                    }
                }
            }
        });
    }
}

function initializeTrendCharts(analytics) {
    // Trend Line Chart
    const trendCtx = document.getElementById('trendLineChart');
    if (trendCtx && window.Chart) {
        const gradeLabels = analytics.gradeBreakdown.map(g => g.name);
        const completionData = analytics.gradeBreakdown.map(g => parseFloat(g.withPdfPercent));
        
        new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: gradeLabels,
                datasets: [{
                    label: 'Completion Rate (%)',
                    data: completionData,
                    borderColor: 'rgba(99, 102, 241, 1)',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: 'rgba(99, 102, 241, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.parsed.y}% completion`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Gender Comparison Chart
    const genderCompCtx = document.getElementById('genderComparisonChart');
    if (genderCompCtx && window.Chart) {
        const gradeLabels = analytics.gradeBreakdown.map(g => g.name);
        const maleData = analytics.gradeBreakdown.map(g => g.male || 0);
        const femaleData = analytics.gradeBreakdown.map(g => g.female || 0);
        
        new Chart(genderCompCtx, {
            type: 'line',
            data: {
                labels: gradeLabels,
                datasets: [
                    {
                        label: 'Male Students',
                        data: maleData,
                        borderColor: 'rgba(59, 130, 246, 1)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Female Students',
                        data: femaleData,
                        borderColor: 'rgba(236, 72, 153, 1)',
                        backgroundColor: 'rgba(236, 72, 153, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
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
                        position: 'top'
                    }
                }
            }
        });
    }
}

function initializeRadarChart(analytics) {
    const radarCtx = document.getElementById('radarComparisonChart');
    if (radarCtx && window.Chart) {
        const grade1Select = document.getElementById('compare-grade-1');
        const grade2Select = document.getElementById('compare-grade-2');
        
        const grade1Name = grade1Select ? grade1Select.value : analytics.gradeBreakdown[0]?.name;
        const grade2Name = grade2Select ? grade2Select.value : analytics.gradeBreakdown[1]?.name;
        
        const grade1 = analytics.gradeBreakdown.find(g => g.name === grade1Name);
        const grade2 = analytics.gradeBreakdown.find(g => g.name === grade2Name);
        
        if (!grade1 || !grade2) return;
        
        new Chart(radarCtx, {
            type: 'radar',
            data: {
                labels: ['Completion Rate', 'Total Students', 'Male %', 'Female %', 'With Documents'],
                datasets: [
                    {
                        label: grade1.name,
                        data: [
                            parseFloat(grade1.withPdfPercent),
                            (grade1.total / analytics.overview.totalStudents) * 100,
                            grade1.total > 0 ? ((grade1.male || 0) / grade1.total * 100) : 0,
                            grade1.total > 0 ? ((grade1.female || 0) / grade1.total * 100) : 0,
                            grade1.total > 0 ? (grade1.withPdf / grade1.total * 100) : 0
                        ],
                        borderColor: 'rgba(59, 130, 246, 1)',
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        borderWidth: 2
                    },
                    {
                        label: grade2.name,
                        data: [
                            parseFloat(grade2.withPdfPercent),
                            (grade2.total / analytics.overview.totalStudents) * 100,
                            grade2.total > 0 ? ((grade2.male || 0) / grade2.total * 100) : 0,
                            grade2.total > 0 ? ((grade2.female || 0) / grade2.total * 100) : 0,
                            grade2.total > 0 ? (grade2.withPdf / grade2.total * 100) : 0
                        ],
                        borderColor: 'rgba(236, 72, 153, 1)',
                        backgroundColor: 'rgba(236, 72, 153, 0.2)',
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
    }
}

// =============================================================================
// COMPARISON FUNCTIONS
// =============================================================================

function updateComparison() {
    const analytics = generateAdvancedAnalytics();
    const grade1Select = document.getElementById('compare-grade-1');
    const grade2Select = document.getElementById('compare-grade-2');
    const resultDiv = document.getElementById('comparison-result');
    
    if (!grade1Select || !grade2Select || !resultDiv) return;
    
    const grade1Name = grade1Select.value;
    const grade2Name = grade2Select.value;
    
    const grade1 = analytics.gradeBreakdown.find(g => g.name === grade1Name);
    const grade2 = analytics.gradeBreakdown.find(g => g.name === grade2Name);
    
    if (!grade1 || !grade2) return;
    
    resultDiv.innerHTML = `
        <!-- Grade 1 Card -->
        <div class="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-blue-300 dark:border-blue-700">
            <h4 class="text-2xl font-bold text-blue-600 mb-4">${grade1.name}</h4>
            <div class="space-y-3">
                <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Total Students:</span>
                    <span class="font-bold text-gray-800 dark:text-white">${grade1.total}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Completion Rate:</span>
                    <span class="font-bold text-green-600">${grade1.withPdfPercent}%</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">With Documents:</span>
                    <span class="font-bold text-green-600">${grade1.withPdf}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Pending:</span>
                    <span class="font-bold text-orange-600">${grade1.withoutPdf}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Male Students:</span>
                    <span class="font-bold text-blue-600">${grade1.male || 0}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Female Students:</span>
                    <span class="font-bold text-pink-600">${grade1.female || 0}</span>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mt-4">
                    <div class="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full" style="width: ${grade1.withPdfPercent}%"></div>
                </div>
            </div>
        </div>
        
        <!-- Grade 2 Card -->
        <div class="p-6 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-xl border-2 border-pink-300 dark:border-pink-700">
            <h4 class="text-2xl font-bold text-pink-600 mb-4">${grade2.name}</h4>
            <div class="space-y-3">
                <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Total Students:</span>
                    <span class="font-bold text-gray-800 dark:text-white">${grade2.total}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Completion Rate:</span>
                    <span class="font-bold text-green-600">${grade2.withPdfPercent}%</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">With Documents:</span>
                    <span class="font-bold text-green-600">${grade2.withPdf}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Pending:</span>
                    <span class="font-bold text-orange-600">${grade2.withoutPdf}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Male Students:</span>
                    <span class="font-bold text-blue-600">${grade2.male || 0}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Female Students:</span>
                    <span class="font-bold text-pink-600">${grade2.female || 0}</span>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mt-4">
                    <div class="bg-gradient-to-r from-pink-500 to-purple-500 h-3 rounded-full" style="width: ${grade2.withPdfPercent}%"></div>
                </div>
            </div>
        </div>
        
        <!-- Comparison Summary -->
        <div class="col-span-full p-6 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 rounded-xl border border-gray-300 dark:border-gray-700 mt-4">
            <h4 class="text-xl font-bold text-gray-800 dark:text-white mb-4">Comparison Summary</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="text-center p-4 bg-white dark:bg-gray-900 rounded-lg">
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Better Completion</p>
                    <p class="text-2xl font-bold ${parseFloat(grade1.withPdfPercent) > parseFloat(grade2.withPdfPercent) ? 'text-blue-600' : 'text-pink-600'}">
                        ${parseFloat(grade1.withPdfPercent) > parseFloat(grade2.withPdfPercent) ? grade1.name : grade2.name}
                    </p>
                    <p class="text-xs text-gray-500">by ${Math.abs(parseFloat(grade1.withPdfPercent) - parseFloat(grade2.withPdfPercent)).toFixed(1)}%</p>
                </div>
                <div class="text-center p-4 bg-white dark:bg-gray-900 rounded-lg">
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Larger Grade</p>
                    <p class="text-2xl font-bold ${grade1.total > grade2.total ? 'text-blue-600' : 'text-pink-600'}">
                        ${grade1.total > grade2.total ? grade1.name : grade2.name}
                    </p>
                    <p class="text-xs text-gray-500">by ${Math.abs(grade1.total - grade2.total)} students</p>
                </div>
                <div class="text-center p-4 bg-white dark:bg-gray-900 rounded-lg">
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">More Balanced Gender</p>
                    <p class="text-2xl font-bold ${Math.abs((grade1.male || 0) - (grade1.female || 0)) < Math.abs((grade2.male || 0) - (grade2.female || 0)) ? 'text-blue-600' : 'text-pink-600'}">
                        ${Math.abs((grade1.male || 0) - (grade1.female || 0)) < Math.abs((grade2.male || 0) - (grade2.female || 0)) ? grade1.name : grade2.name}
                    </p>
                    <p class="text-xs text-gray-500">More equal distribution</p>
                </div>
            </div>
        </div>
    `;
    
    // Update radar chart
    initializeRadarChart(analytics);
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function calculateGenderRatio(analytics) {
    const totalMale = analytics.gradeBreakdown.reduce((sum, g) => sum + (g.male || 0), 0);
    const totalFemale = analytics.gradeBreakdown.reduce((sum, g) => sum + (g.female || 0), 0);
    
    if (totalFemale === 0) return `${totalMale}:0`;
    
    const ratio = (totalMale / totalFemale).toFixed(2);
    return `${ratio}:1`;
}

function countBalancedGrades(analytics) {
    return analytics.gradeBreakdown.filter(g => {
        const male = g.male || 0;
        const female = g.female || 0;
        const diff = Math.abs(male - female);
        const total = male + female;
        return total > 0 && (diff / total) < 0.2; // Within 20% difference
    }).length;
}

function calculateAverageCompletion(analytics) {
    const totalCompletion = analytics.gradeBreakdown.reduce((sum, g) => sum + parseFloat(g.withPdfPercent), 0);
    return (totalCompletion / analytics.gradeBreakdown.length).toFixed(1);
}

function getHighestGrade(analytics) {
    return analytics.gradeBreakdown.reduce((highest, current) => {
        return parseFloat(current.withPdfPercent) > parseFloat(highest.withPdfPercent) ? current : highest;
    }, analytics.gradeBreakdown[0]);
}

function getLowestGrade(analytics) {
    return analytics.gradeBreakdown.reduce((lowest, current) => {
        return parseFloat(current.withPdfPercent) < parseFloat(lowest.withPdfPercent) ? current : lowest;
    }, analytics.gradeBreakdown[0]);
}

// =============================================================================
// NEW EXPORT FUNCTIONS
// =============================================================================

function exportAnalyticsToPDF() {
    showToast('Generating PDF analytics report...', 'info');
    // Call existing PDF export with analytics data
    if (typeof exportToPdfEnhanced === 'function') {
        exportToPdfEnhanced();
    }
    closeAnalyticsModal();
}

function exportAnalyticsToExcel() {
    showToast('Generating Excel analytics report...', 'info');
    // Call existing Excel export with analytics data
    if (typeof exportToExcelEnhanced === 'function') {
        exportToExcelEnhanced();
    }
    closeAnalyticsModal();
}

function generateEmailList() {
    const pendingStudents = allStudents.filter(s => s.hasPdf === false);
    
    if (pendingStudents.length === 0) {
        showToast('No pending students to email!', 'info');
        return;
    }
    
    const emailList = pendingStudents.map(s => `${s.name} (${s.grade})`).join('\n');
    
    const blob = new Blob([emailList], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pending_students_email_list_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast(`Email list generated for ${pendingStudents.length} students!`, 'success');
}

function exportSummaryReport() {
    const analytics = generateAdvancedAnalytics();
    
    const summary = `
KANYADET PRI & JUNIOR SCHOOL
STUDENT DOCUMENT SUMMARY REPORT
Generated: ${new Date().toLocaleString()}
=====================================

OVERVIEW:
---------
Total Students: ${analytics.overview.totalStudents}
Completion Rate: ${analytics.overview.completionRate}%
With Documents: ${analytics.overview.withDocuments}
Pending Documents: ${analytics.overview.pending}

GRADE BREAKDOWN:
----------------
${analytics.gradeBreakdown.map(g => `
${g.name}:
  Total: ${g.total} students
  Completed: ${g.withPdf} (${g.withPdfPercent}%)
  Pending: ${g.withoutPdf} (${g.withoutPdfPercent}%)
  Male: ${g.male || 0}
  Female: ${g.female || 0}
`).join('\n')}

KEY INSIGHTS:
-------------
${analytics.insights.map((insight, i) => `${i + 1}. ${insight.title}\n   ${insight.message}`).join('\n\n')}

=====================================
End of Report
    `;
    
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `summary_report_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Summary report exported successfully!', 'success');
}

function printAnalyticsReport() {
    window.print();
    showToast('Opening print dialog...', 'info');
}

function exportCustomReport() {
    const includeOverview = document.getElementById('export-overview')?.checked;
    const includeGrades = document.getElementById('export-grades')?.checked;
    const includeCharts = document.getElementById('export-charts')?.checked;
    const includeInsights = document.getElementById('export-insights')?.checked;
    
    showToast('Custom report generation started...', 'info');
    
    // Generate custom report based on selections
    const analytics = generateAdvancedAnalytics();
    const customReport = {
        generatedDate: new Date().toISOString(),
        schoolName: 'KANYADET PRI & JUNIOR SCHOOL',
        includesSections: {
            overview: includeOverview,
            grades: includeGrades,
            charts: includeCharts,
            insights: includeInsights
        }
    };
    
    if (includeOverview) customReport.overview = analytics.overview;
    if (includeGrades) customReport.gradeBreakdown = analytics.gradeBreakdown;
    if (includeInsights) customReport.insights = analytics.insights;
    
    const jsonContent = JSON.stringify(customReport, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `custom_analytics_report_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Custom report exported successfully!', 'success');
}

function showStudentList(type) {
    closeAnalyticsModal();
    showToast('Showing all students...', 'info');
    document.getElementById('show-all')?.click();
}

function showCompletionTrend() {
    switchAnalyticsTab('trends');
}

// =============================================================================
// EXISTING FUNCTIONS (UPDATED)
// =============================================================================

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
            gradeData[grade] = { total: 0, withPdf: 0, withoutPdf: 0, male: 0, female: 0 };
        }
        gradeData[grade].total++;
        if (s.hasPdf === true) gradeData[grade].withPdf++;
        if (s.hasPdf === false) gradeData[grade].withoutPdf++;
        
        const gender = (s.gender || '').toLowerCase().trim();
        if (gender === 'male') {
            gradeData[grade].male++;
        } else if (gender === 'female') {
            gradeData[grade].female++;
        }
    });
    
    const gradeBreakdown = Object.entries(gradeData).map(([name, data]) => ({
        name,
        total: data.total,
        withPdf: data.withPdf,
        withoutPdf: data.withoutPdf,
        male: data.male,
        female: data.female,
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
    
    if (lowestGrade && parseFloat(lowestGrade.withPdfPercent)< 70) {
        insights.push({
            type: 'warning',
            title: `${lowestGrade.name} Needs Attention`,
            message: `${lowestGrade.name} has only ${lowestGrade.withPdfPercent}% completion rate (${lowestGrade.withPdf}/${lowestGrade.total} students).`
        });
    }
    
    // Check gender balance
    const genderImbalance = gradeBreakdown.filter(g => {
        const male = g.male || 0;
        const female = g.female || 0;
        const total = male + female;
        if (total === 0) return false;
        const diff = Math.abs(male - female);
        return (diff / total) > 0.3; // More than 30% difference
    });
    
    if (genderImbalance.length > 0) {
        insights.push({
            type: 'info',
            title: 'Gender Distribution Notice',
            message: `${genderImbalance.length} grade(s) have significant gender imbalance. Consider reviewing enrollment patterns.`
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
            cacheSize: typeof pdfExistenceCache !== 'undefined' ? pdfExistenceCache.size : 0,
            activeFilters: (typeof currentFilter !== 'undefined' && currentFilter !== 'all') || 
                          (typeof currentGrade !== 'undefined' && currentGrade !== 'all') || 
                          (typeof currentSearchTerm !== 'undefined' && currentSearchTerm) ? 
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
        document.getElementById('show-without-pdf')?.click();
        if (typeof currentFilter !== 'undefined') currentFilter = 'without-pdf';
        if (typeof applyFiltersAndRender === 'function') applyFiltersAndRender();
        showToast('Showing students without documents', 'info');
    } else if (status === 'completed') {
        document.getElementById('show-with-pdf')?.click();
        if (typeof currentFilter !== 'undefined') currentFilter = 'with-pdf';
        if (typeof applyFiltersAndRender === 'function') applyFiltersAndRender();
        showToast('Showing students with documents', 'success');
    }
}

function filterByGrade(gradeName) {
    closeAnalyticsModal();
    
    const gradeSelect = document.getElementById('grade-filter');
    if (gradeSelect) {
        gradeSelect.value = gradeName;
        gradeSelect.dispatchEvent(new Event('change'));
    }
    
    if (typeof window.currentGrade !== 'undefined') {
        window.currentGrade = gradeName;
    }
    
    if (typeof applyFiltersAndRender === 'function') {
        applyFiltersAndRender();
    }
    
    showToast(`Showing ${gradeName} students`, 'info');
    
    // Scroll to top of table
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        showToast(`🏆 Top Grade: ${topGrade.name} with ${topGrade.withPdfPercent}% completion!`, 'success');
        setTimeout(() => {
            filterByGrade(topGrade.name);
        }, 1000);
    }
}

function showCheckedStudents() {
    closeAnalyticsModal();
    const checkedStudents = allStudents.filter(s => s.hasPdf !== undefined);
    showToast(`✓ Total checked: ${checkedStudents.length} students`, 'info');
}

function exportAnalyticsReport() {
    const analytics = generateAdvancedAnalytics();
    
    const report = {
        generatedDate: new Date().toISOString(),
        schoolName: 'KANYADET PRI & JUNIOR SCHOOL',
        overview: analytics.overview,
        gradeBreakdown: analytics.gradeBreakdown,
        insights: analytics.insights,
        performance: analytics.performance,
        statistics: {
            averageCompletion: calculateAverageCompletion(analytics),
            highestGrade: getHighestGrade(analytics),
            lowestGrade: getLowestGrade(analytics),
            genderRatio: calculateGenderRatio(analytics),
            balancedGrades: countBalancedGrades(analytics)
        }
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
    
    showToast('✓ Analytics report exported successfully!', 'success');
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
    
    // Add keyboard shortcut to close modal (Escape key)
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && analyticsBackdrop && !analyticsBackdrop.classList.contains('hidden')) {
            closeAnalyticsModal();
        }
    });
});

// =============================================================================
// EXPORT ALL FUNCTIONS TO WINDOW
// =============================================================================

window.showAdvancedAnalytics = showAdvancedAnalytics;
window.closeAnalyticsModal = closeAnalyticsModal;
window.exportAnalyticsReport = exportAnalyticsReport;
window.filterByStatus = filterByStatus;
window.filterByGrade = filterByGrade;
window.showTopGrade = showTopGrade;
window.showCheckedStudents = showCheckedStudents;
window.initializeAnalyticsCharts = initializeAnalyticsCharts;
window.switchAnalyticsTab = switchAnalyticsTab;
window.updateComparison = updateComparison;
window.generateEmailList = generateEmailList;
window.exportAnalyticsToPDF = exportAnalyticsToPDF;
window.exportAnalyticsToExcel = exportAnalyticsToExcel;
window.exportSummaryReport = exportSummaryReport;
window.printAnalyticsReport = printAnalyticsReport;
window.exportCustomReport = exportCustomReport;
window.showStudentList = showStudentList;
window.showCompletionTrend = showCompletionTrend;
window.initializeTrendCharts = initializeTrendCharts;
window.initializeRadarChart = initializeRadarChart;
window.calculateGenderRatio = calculateGenderRatio;
window.countBalancedGrades = countBalancedGrades;
window.calculateAverageCompletion = calculateAverageCompletion;
window.getHighestGrade = getHighestGrade;
window.getLowestGrade = getLowestGrade;

console.log('✅ Advanced Analytics module loaded with enhanced features:');
console.log('   - 5 Tab Navigation (Overview, Grades, Trends, Comparison, Export)');
console.log('   - Interactive Charts (Pie, Bar, Line, Radar, Gender Distribution)');
console.log('   - Grade Comparison Tool');
console.log('   - Trend Analysis');
console.log('   - Multiple Export Formats (PDF, Excel, JSON, Print, Email List)');
console.log('   - Custom Report Generator');
console.log('   - Gender Distribution Analytics');
console.log('   - Statistical Summary');
console.log('   - Best/Worst Grade Identification');
console.log('   - Keyboard Shortcuts (ESC to close)');