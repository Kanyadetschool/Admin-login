// ============================================================================
// ADVANCED SECURITY ANALYTICS MODULE
// ============================================================================
// This module provides enhanced security analysis, threat detection,
// user behavior profiling, and geographic analysis for the security dashboard
// ============================================================================

window.AdvancedSecurity = (function() {
    'use strict';

    // ========================================================================
    // CONFIGURATION & CONSTANTS
    // ========================================================================
    const CONFIG = {
        THREAT_THRESHOLDS: {
            FAILED_ATTEMPTS: 5,           // Failed attempts in time window
            TIME_WINDOW_MINUTES: 30,       // Time window for rate limiting
            SUSPICIOUS_IP_CHANGES: 3,      // IP changes per user in 24h
            RAPID_LOGIN_SECONDS: 5,        // Time between rapid logins
            UNUSUAL_HOURS: [0, 1, 2, 3, 4, 5], // 12AM - 5AM
            MAX_SESSIONS_PER_USER: 10      // Concurrent sessions threshold
        },
        GEO_ANALYSIS: {
            DISTANCE_THRESHOLD_KM: 500,    // Impossible travel distance
            TIME_THRESHOLD_HOURS: 1        // Time for impossible travel
        }
    };

    // Known suspicious patterns
    const THREAT_PATTERNS = {
        vpnProviders: ['nordvpn', 'expressvpn', 'protonvpn', 'surfshark'],
        suspiciousLocations: ['Unknown', 'Anonymous Proxy'],
        bruteForceIndicators: ['invalid', 'wrong password', 'incorrect']
    };

    // ========================================================================
    // UTILITY FUNCTIONS
    // ========================================================================
    
    function getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
        if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
        if (seconds < 604800) return Math.floor(seconds / 86400) + 'd ago';
        return Math.floor(seconds / 604800) + 'w ago';
    }

    function formatDate(date) {
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    // ========================================================================
    // THREAT DETECTION ENGINE
    // ========================================================================
    
    function detectThreats(loginData) {
        const threats = [];
        const now = new Date();

        // Group by user for analysis
        const userGroups = {};
        loginData.forEach(login => {
            if (!userGroups[login.email]) {
                userGroups[login.email] = [];
            }
            userGroups[login.email].push(login);
        });

        // Analyze each user
        Object.entries(userGroups).forEach(([email, logins]) => {
            
            // 1. BRUTE FORCE DETECTION
            const recentFailed = logins.filter(l => {
                const loginTime = l.timestamp?.toDate() || new Date(0);
                const timeDiff = (now - loginTime) / 1000 / 60; // minutes
                return l.status === 'failed' && timeDiff <= CONFIG.THREAT_THRESHOLDS.TIME_WINDOW_MINUTES;
            });

            if (recentFailed.length >= CONFIG.THREAT_THRESHOLDS.FAILED_ATTEMPTS) {
                threats.push({
                    type: 'BRUTE_FORCE_ATTACK',
                    severity: 'HIGH',
                    user: email,
                    description: `${recentFailed.length} failed login attempts in ${CONFIG.THREAT_THRESHOLDS.TIME_WINDOW_MINUTES} minutes`,
                    timestamp: now,
                    details: recentFailed.slice(0, 5),
                    recommendation: 'Consider temporary account lock or CAPTCHA requirement'
                });
            }

            // 2. SUSPICIOUS IP ACTIVITY
            const last24h = logins.filter(l => {
                const loginTime = l.timestamp?.toDate() || new Date(0);
                return (now - loginTime) / 1000 / 3600 <= 24;
            });

            const uniqueIPs = new Set(last24h.map(l => l.ipAddress));
            if (uniqueIPs.size >= CONFIG.THREAT_THRESHOLDS.SUSPICIOUS_IP_CHANGES) {
                threats.push({
                    type: 'SUSPICIOUS_IP_ACTIVITY',
                    severity: 'MEDIUM',
                    user: email,
                    description: `Account accessed from ${uniqueIPs.size} different IP addresses in 24 hours`,
                    timestamp: now,
                    details: Array.from(uniqueIPs).slice(0, 5),
                    recommendation: 'Verify user identity and recent activity'
                });
            }

            // 3. RAPID SUCCESSIVE LOGINS
            const sortedLogins = logins
                .filter(l => l.status === 'success')
                .sort((a, b) => (b.timestamp?.toDate() || 0) - (a.timestamp?.toDate() || 0));

            for (let i = 0; i < sortedLogins.length - 1; i++) {
                const time1 = sortedLogins[i].timestamp?.toDate();
                const time2 = sortedLogins[i + 1].timestamp?.toDate();
                if (time1 && time2) {
                    const diff = Math.abs(time1 - time2) / 1000;
                    if (diff <= CONFIG.THREAT_THRESHOLDS.RAPID_LOGIN_SECONDS) {
                        threats.push({
                            type: 'RAPID_LOGIN_PATTERN',
                            severity: 'MEDIUM',
                            user: email,
                            description: `Two successful logins within ${diff} seconds`,
                            timestamp: time1,
                            details: [sortedLogins[i], sortedLogins[i + 1]],
                            recommendation: 'Possible session hijacking or automated login'
                        });
                        break;
                    }
                }
            }

            // 4. UNUSUAL TIME ACCESS
            const unusualTimeLogins = logins.filter(l => {
                const loginTime = l.timestamp?.toDate();
                if (!loginTime) return false;
                const hour = loginTime.getHours();
                return CONFIG.THREAT_THRESHOLDS.UNUSUAL_HOURS.includes(hour);
            });

            if (unusualTimeLogins.length >= 3) {
                threats.push({
                    type: 'UNUSUAL_TIME_ACCESS',
                    severity: 'LOW',
                    user: email,
                    description: `${unusualTimeLogins.length} logins during unusual hours (12AM-5AM)`,
                    timestamp: now,
                    details: unusualTimeLogins.slice(0, 3),
                    recommendation: 'Monitor for potential unauthorized access'
                });
            }

            // 5. LOCATION ANOMALY
            const suspiciousLocs = logins.filter(l => 
                THREAT_PATTERNS.suspiciousLocations.some(pattern => 
                    l.location?.toLowerCase().includes(pattern.toLowerCase())
                )
            );

            if (suspiciousLocs.length > 0) {
                threats.push({
                    type: 'SUSPICIOUS_LOCATION',
                    severity: 'MEDIUM',
                    user: email,
                    description: `Login from suspicious location: ${suspiciousLocs[0].location}`,
                    timestamp: suspiciousLocs[0].timestamp?.toDate() || now,
                    details: suspiciousLocs[0],
                    recommendation: 'Verify location and require additional authentication'
                });
            }
        });

        return threats.sort((a, b) => {
            const severityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
            return severityOrder[b.severity] - severityOrder[a.severity];
        });
    }

    // ========================================================================
    // USER BEHAVIOR PROFILING
    // ========================================================================
    
    function buildUserProfiles(loginData) {
        const profiles = {};

        loginData.forEach(login => {
            const email = login.email;
            if (!profiles[email]) {
                profiles[email] = {
                    email: email,
                    totalLogins: 0,
                    successfulLogins: 0,
                    failedLogins: 0,
                    uniqueIPs: new Set(),
                    uniqueLocations: new Set(),
                    devices: new Set(),
                    browsers: new Set(),
                    firstSeen: null,
                    lastSeen: null,
                    loginTimes: [],
                    averageSessionGap: 0,
                    riskScore: 0
                };
            }

            const profile = profiles[email];
            const loginTime = login.timestamp?.toDate();

            profile.totalLogins++;
            if (login.status === 'success') profile.successfulLogins++;
            if (login.status === 'failed') profile.failedLogins++;
            
            if (login.ipAddress) profile.uniqueIPs.add(login.ipAddress);
            if (login.location) profile.uniqueLocations.add(login.location);
            if (login.device) profile.devices.add(login.device);
            if (login.browser) profile.browsers.add(login.browser);
            
            if (loginTime) {
                if (!profile.firstSeen || loginTime < profile.firstSeen) {
                    profile.firstSeen = loginTime;
                }
                if (!profile.lastSeen || loginTime > profile.lastSeen) {
                    profile.lastSeen = loginTime;
                }
                profile.loginTimes.push(loginTime);
            }
        });

        // Calculate derived metrics and risk scores
        Object.values(profiles).forEach(profile => {
            // Convert Sets to counts
            profile.uniqueIPCount = profile.uniqueIPs.size;
            profile.uniqueLocationCount = profile.uniqueLocations.size;
            profile.deviceCount = profile.devices.size;
            profile.browserCount = profile.browsers.size;

            // Convert Sets to arrays for display
            profile.uniqueIPs = Array.from(profile.uniqueIPs);
            profile.uniqueLocations = Array.from(profile.uniqueLocations);
            profile.devices = Array.from(profile.devices);
            profile.browsers = Array.from(profile.browsers);

            // Success rate
            profile.successRate = profile.totalLogins > 0 
                ? ((profile.successfulLogins / profile.totalLogins) * 100).toFixed(1)
                : 0;

            // Calculate risk score (0-100)
            let risk = 0;
            
            // Failed login ratio
            if (profile.totalLogins > 0) {
                risk += (profile.failedLogins / profile.totalLogins) * 30;
            }
            
            // Multiple IPs/locations
            if (profile.uniqueIPCount > 5) risk += 20;
            if (profile.uniqueLocationCount > 3) risk += 15;
            
            // Device/browser diversity
            if (profile.deviceCount > 3) risk += 15;
            if (profile.browserCount > 3) risk += 10;
            
            // Recency factor
            if (profile.lastSeen) {
                const daysSinceLastLogin = (new Date() - profile.lastSeen) / 1000 / 86400;
                if (daysSinceLastLogin > 30) risk += 10;
            }

            profile.riskScore = Math.min(Math.round(risk), 100);
            profile.riskLevel = profile.riskScore >= 70 ? 'HIGH' : 
                               profile.riskScore >= 40 ? 'MEDIUM' : 'LOW';
        });

        return profiles;
    }

    // ========================================================================
    // GEOGRAPHIC ANALYSIS
    // ========================================================================
    
    function analyzeGeography(loginData) {
        const locationStats = {};
        const ipStats = {};
        const countryStats = {};

        loginData.forEach(login => {
            // Location analysis
            const location = login.location || 'Unknown';
            if (!locationStats[location]) {
                locationStats[location] = {
                    location: location,
                    count: 0,
                    successCount: 0,
                    failedCount: 0,
                    users: new Set()
                };
            }
            locationStats[location].count++;
            locationStats[location].users.add(login.email);
            if (login.status === 'success') locationStats[location].successCount++;
            if (login.status === 'failed') locationStats[location].failedCount++;

            // IP analysis
            const ip = login.ipAddress || 'Unknown';
            if (!ipStats[ip]) {
                ipStats[ip] = {
                    ip: ip,
                    count: 0,
                    location: location,
                    users: new Set(),
                    firstSeen: null,
                    lastSeen: null
                };
            }
            ipStats[ip].count++;
            ipStats[ip].users.add(login.email);
            
            const loginTime = login.timestamp?.toDate();
            if (loginTime) {
                if (!ipStats[ip].firstSeen || loginTime < ipStats[ip].firstSeen) {
                    ipStats[ip].firstSeen = loginTime;
                }
                if (!ipStats[ip].lastSeen || loginTime > ipStats[ip].lastSeen) {
                    ipStats[ip].lastSeen = loginTime;
                }
            }

            // Country extraction (assuming format "City, Country")
            const countryMatch = location.match(/,\s*(.+)$/);
            const country = countryMatch ? countryMatch[1].trim() : location;
            if (!countryStats[country]) {
                countryStats[country] = {
                    country: country,
                    count: 0,
                    users: new Set()
                };
            }
            countryStats[country].count++;
            countryStats[country].users.add(login.email);
        });

        // Convert to arrays and sort
        const locations = Object.values(locationStats)
            .map(loc => ({
                ...loc,
                userCount: loc.users.size,
                users: Array.from(loc.users)
            }))
            .sort((a, b) => b.count - a.count);

        const ips = Object.values(ipStats)
            .map(ip => ({
                ...ip,
                userCount: ip.users.size,
                users: Array.from(ip.users)
            }))
            .sort((a, b) => b.count - a.count);

        const countries = Object.values(countryStats)
            .map(country => ({
                ...country,
                userCount: country.users.size,
                users: Array.from(country.users)
            }))
            .sort((a, b) => b.count - a.count);

        return {
            topLocations: locations.slice(0, 10),
            topIPs: ips.slice(0, 10),
            topCountries: countries.slice(0, 10),
            totalLocations: locations.length,
            totalIPs: ips.length,
            totalCountries: countries.length
        };
    }

    // ========================================================================
    // ADVANCED STATISTICS
    // ========================================================================
    
    function calculateAdvancedStats(loginData) {
        const stats = {
            timeDistribution: {},
            dayDistribution: {},
            deviceDistribution: {},
            browserDistribution: {},
            statusDistribution: {},
            hourlyTrends: Array(24).fill(0),
            weeklyTrends: Array(7).fill(0)
        };

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        loginData.forEach(login => {
            const loginTime = login.timestamp?.toDate();
            
            if (loginTime) {
                // Hour distribution
                const hour = loginTime.getHours();
                stats.hourlyTrends[hour]++;
                
                // Day distribution
                const day = loginTime.getDay();
                stats.weeklyTrends[day]++;
                const dayName = dayNames[day];
                stats.dayDistribution[dayName] = (stats.dayDistribution[dayName] || 0) + 1;
            }

            // Device distribution
            const device = login.device || 'Unknown';
            stats.deviceDistribution[device] = (stats.deviceDistribution[device] || 0) + 1;

            // Browser distribution
            const browser = login.browser || 'Unknown';
            stats.browserDistribution[browser] = (stats.browserDistribution[browser] || 0) + 1;

            // Status distribution
            const status = login.status || 'unknown';
            stats.statusDistribution[status] = (stats.statusDistribution[status] || 0) + 1;
        });

        // Find peak times
        const peakHour = stats.hourlyTrends.indexOf(Math.max(...stats.hourlyTrends));
        const peakDay = stats.weeklyTrends.indexOf(Math.max(...stats.weeklyTrends));

        return {
            ...stats,
            peakHour: `${peakHour}:00 - ${peakHour + 1}:00`,
            peakDay: dayNames[peakDay],
            totalDevices: Object.keys(stats.deviceDistribution).length,
            totalBrowsers: Object.keys(stats.browserDistribution).length
        };
    }

    // ========================================================================
    // SECURITY REPORT GENERATOR
    // ========================================================================
    
    function generateSecurityReport(loginData, threats, userProfiles, geoAnalysis) {
        const now = new Date();
        const last24h = loginData.filter(l => {
            const loginTime = l.timestamp?.toDate() || new Date(0);
            return (now - loginTime) / 1000 / 3600 <= 24;
        });

        const last7days = loginData.filter(l => {
            const loginTime = l.timestamp?.toDate() || new Date(0);
            return (now - loginTime) / 1000 / 86400 <= 7;
        });

        const highRiskUsers = Object.values(userProfiles)
            .filter(p => p.riskLevel === 'HIGH')
            .sort((a, b) => b.riskScore - a.riskScore);

        const report = {
            generatedAt: now,
            summary: {
                totalLogins: loginData.length,
                last24h: last24h.length,
                last7days: last7days.length,
                totalUsers: Object.keys(userProfiles).length,
                highRiskUsers: highRiskUsers.length,
                activeThreats: threats.filter(t => t.severity === 'HIGH').length,
                uniqueLocations: geoAnalysis.totalLocations,
                uniqueIPs: geoAnalysis.totalIPs
            },
            threatSummary: {
                high: threats.filter(t => t.severity === 'HIGH').length,
                medium: threats.filter(t => t.severity === 'MEDIUM').length,
                low: threats.filter(t => t.severity === 'LOW').length
            },
            topThreats: threats.slice(0, 5),
            highRiskUsers: highRiskUsers.slice(0, 10),
            recommendations: generateRecommendations(threats, userProfiles, geoAnalysis)
        };

        return report;
    }

    function generateRecommendations(threats, userProfiles, geoAnalysis) {
        const recommendations = [];

        // Threat-based recommendations
        const highThreats = threats.filter(t => t.severity === 'HIGH');
        if (highThreats.length > 0) {
            recommendations.push({
                priority: 'CRITICAL',
                category: 'Threat Response',
                message: `${highThreats.length} high-severity threats detected. Immediate action required.`,
                actions: [
                    'Review and respond to all high-severity alerts',
                    'Consider enabling additional authentication methods',
                    'Implement rate limiting for failed login attempts'
                ]
            });
        }

        // High-risk user recommendations
        const highRiskUsers = Object.values(userProfiles).filter(p => p.riskLevel === 'HIGH');
        if (highRiskUsers.length > 0) {
            recommendations.push({
                priority: 'HIGH',
                category: 'User Security',
                message: `${highRiskUsers.length} high-risk user accounts identified.`,
                actions: [
                    'Require password reset for high-risk accounts',
                    'Enable multi-factor authentication',
                    'Review account activity logs'
                ]
            });
        }

        // Geographic diversity
        if (geoAnalysis.totalCountries > 10) {
            recommendations.push({
                priority: 'MEDIUM',
                category: 'Geographic Security',
                message: `Access from ${geoAnalysis.totalCountries} different countries detected.`,
                actions: [
                    'Implement geo-fencing for sensitive operations',
                    'Review and whitelist expected access locations',
                    'Enable location-based alerts'
                ]
            });
        }

        // General recommendations
        recommendations.push({
            priority: 'LOW',
            category: 'Best Practices',
            message: 'Maintain ongoing security monitoring',
            actions: [
                'Regular security audits and reviews',
                'Keep authentication systems updated',
                'Educate users on security best practices',
                'Implement session timeout policies'
            ]
        });

        return recommendations;
    }

    // ========================================================================
    // UI RENDERING FUNCTIONS
    // ========================================================================
    
    function renderThreatsPanel(threats) {
        const container = document.getElementById('threatsPanelContainer');
        if (!container) {
            console.warn('Threats panel container not found');
            return;
        }

        const html = `
            <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 15px; padding: 20px; margin-bottom: 20px; border: 1px solid rgba(239, 68, 68, 0.2);">
                <h3 style="color: white; margin: 0 0 15px 0; display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 24px;">🚨</span>
                    Active Threats (${threats.length})
                </h3>
                
                ${threats.length === 0 ? `
                    <div style="text-align: center; padding: 30px; color: #10b981;">
                        <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
                        <p style="font-size: 18px; font-weight: 600;">All Clear!</p>
                        <p style="color: #64748b;">No active threats detected</p>
                    </div>
                ` : threats.map(threat => {
                    const severityColors = {
                        HIGH: '#ef4444',
                        MEDIUM: '#f59e0b',
                        LOW: '#3b82f6'
                    };
                    const color = severityColors[threat.severity];
                    
                    return `
                        <div style="background: rgba(51, 65, 85, 0.5); padding: 15px; border-radius: 10px; margin-bottom: 10px; border-left: 4px solid ${color};">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                                <div>
                                    <span style="background: ${color}; color: white; padding: 4px 10px; border-radius: 5px; font-size: 11px; font-weight: 700;">${threat.severity}</span>
                                    <span style="color: white; font-weight: 600; margin-left: 10px;">${threat.type.replace(/_/g, ' ')}</span>
                                </div>
                                <span style="color: #94a3b8; font-size: 12px;">${getTimeAgo(threat.timestamp)}</span>
                            </div>
                            <p style="color: #cbd5e1; margin: 10px 0;">👤 <strong>${threat.user}</strong></p>
                            <p style="color: #94a3b8; margin: 10px 0;">${threat.description}</p>
                            <p style="color: #64748b; font-size: 12px; font-style: italic;">💡 ${threat.recommendation}</p>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        container.innerHTML = html;
    }

    function renderUserProfilesPanel(userProfiles) {
        const container = document.getElementById('userProfilesContainer');
        if (!container) {
            console.warn('User profiles container not found');
            return;
        }

        const profiles = Object.values(userProfiles)
            .sort((a, b) => b.riskScore - a.riskScore)
            .slice(0, 10);

        const html = `
            <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 15px; padding: 20px; margin-bottom: 20px;">
                <h3 style="color: white; margin: 0 0 15px 0; display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 24px;">👥</span>
                    User Risk Profiles (Top 10)
                </h3>
                
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: rgba(51, 65, 85, 0.5);">
                                <th style="padding: 12px; text-align: left; color: #cbd5e1; font-size: 12px;">USER</th>
                                <th style="padding: 12px; text-align: center; color: #cbd5e1; font-size: 12px;">RISK</th>
                                <th style="padding: 12px; text-align: center; color: #cbd5e1; font-size: 12px;">LOGINS</th>
                                <th style="padding: 12px; text-align: center; color: #cbd5e1; font-size: 12px;">SUCCESS</th>
                                <th style="padding: 12px; text-align: center; color: #cbd5e1; font-size: 12px;">IPs</th>
                                <th style="padding: 12px; text-align: center; color: #cbd5e1; font-size: 12px;">LOCATIONS</th>
                                <th style="padding: 12px; text-align: left; color: #cbd5e1; font-size: 12px;">LAST SEEN</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${profiles.map(profile => {
                                const riskColors = {
                                    HIGH: '#ef4444',
                                    MEDIUM: '#f59e0b',
                                    LOW: '#10b981'
                                };
                                const riskColor = riskColors[profile.riskLevel];
                                
                                return `
                                    <tr style="border-bottom: 1px solid rgba(51, 65, 85, 0.3);">
                                        <td style="padding: 12px; color: white;">${profile.email}</td>
                                        <td style="padding: 12px; text-align: center;">
                                            <span style="background: ${riskColor}; color: white; padding: 4px 8px; border-radius: 5px; font-size: 11px; font-weight: 700;">
                                                ${profile.riskLevel}
                                            </span>
                                        </td>
                                        <td style="padding: 12px; text-align: center; color: #cbd5e1;">${profile.totalLogins}</td>
                                        <td style="padding: 12px; text-align: center; color: #10b981;">${profile.successRate}%</td>
                                        <td style="padding: 12px; text-align: center; color: #94a3b8;">${profile.uniqueIPCount}</td>
                                        <td style="padding: 12px; text-align: center; color: #94a3b8;">${profile.uniqueLocationCount}</td>
                                        <td style="padding: 12px; color: #64748b; font-size: 12px;">${profile.lastSeen ? getTimeAgo(profile.lastSeen) : 'Never'}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    function renderGeographicPanel(geoAnalysis) {
        const container = document.getElementById('geographicContainer');
        if (!container) {
            console.warn('Geographic container not found');
            return;
        }

        const html = `
            <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 15px; padding: 20px; margin-bottom: 20px;">
                <h3 style="color: white; margin: 0 0 15px 0; display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 24px;">🌍</span>
                    Geographic Analysis
                </h3>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 20px;">
                    <div style="background: rgba(59, 130, 246, 0.1); padding: 15px; border-radius: 10px; border: 1px solid rgba(59, 130, 246, 0.2);">
                        <div style="font-size: 32px; font-weight: 700; color: #3b82f6;">${geoAnalysis.totalCountries}</div>
                        <div style="color: #94a3b8; font-size: 14px;">Countries</div>
                    </div>
                    <div style="background: rgba(16, 185, 129, 0.1); padding: 15px; border-radius: 10px; border: 1px solid rgba(16, 185, 129, 0.2);">
                        <div style="font-size: 32px; font-weight: 700; color: #10b981;">${geoAnalysis.totalLocations}</div>
                        <div style="color: #94a3b8; font-size: 14px;">Locations</div>
                    </div>
                    <div style="background: rgba(245, 158, 11, 0.1); padding: 15px; border-radius: 10px; border: 1px solid rgba(245, 158, 11, 0.2);">
                        <div style="font-size: 32px; font-weight: 700; color: #f59e0b;">${geoAnalysis.totalIPs}</div>
                        <div style="color: #94a3b8; font-size: 14px;">Unique IPs</div>
                    </div>
                </div>

                <div style="margin-bottom: 20px;">
                    <h4 style="color: #cbd5e1; margin: 0 0 10px 0;">Top Locations</h4>
                    ${geoAnalysis.topLocations.slice(0, 5).map((loc, idx) => `
                        <div style="background: rgba(51, 65, 85, 0.3); padding: 10px 15px; border-radius: 8px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="color: #64748b; font-weight: 700;">#${idx + 1}</span>
                                <span style="color: white;">${loc.location}</span>
                            </div>
                            <div style="display: flex; gap: 15px; align-items: center;">
                                <span style="color: #3b82f6; font-size: 12px;">👤 ${loc.userCount} users</span>
                                <span style="color: #10b981; font-size: 12px;">✓ ${loc.successCount}</span>
                                <span style="color: #ef4444; font-size: 12px;">✗ ${loc.failedCount}</span>
                                <span style="color: #cbd5e1; font-weight: 700;">${loc.count} logins</span>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div>
                    <h4 style="color: #cbd5e1; margin: 0 0 10px 0;">Top IP Addresses</h4>
                    ${geoAnalysis.topIPs.slice(0, 5).map((ip, idx) => `
                        <div style="background: rgba(51, 65, 85, 0.3); padding: 10px 15px; border-radius: 8px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="color: #64748b; font-weight: 700;">#${idx + 1}</span>
                                <span style="color: white; font-family: monospace;">${ip.ip}</span>
                                <span style="color: #64748b; font-size: 12px;">${ip.location}</span>
                            </div>
                            <div style="display: flex; gap: 15px; align-items: center;">
                                <span style="color: #3b82f6; font-size: 12px;">👤 ${ip.userCount} users</span>
                                <span style="color: #cbd5e1; font-weight: 700;">${ip.count} logins</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    function renderSecurityReport(report) {
        const container = document.getElementById('securityReportContainer');
        if (!container) {
            console.warn('Security report container not found');
            return;
        }

        const html = `
            <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 15px; padding: 20px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="color: white; margin: 0; display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 24px;">📊</span>
                        Security Report
                    </h3>
                    <span style="color: #64748b; font-size: 12px;">Generated: ${formatDate(report.generatedAt)}</span>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 25px;">
                    <div style="background: rgba(59, 130, 246, 0.1); padding: 15px; border-radius: 10px; text-align: center; border: 1px solid rgba(59, 130, 246, 0.2);">
                        <div style="font-size: 28px; font-weight: 700; color: #3b82f6;">${report.summary.totalLogins}</div>
                        <div style="color: #94a3b8; font-size: 13px; margin-top: 5px;">Total Logins</div>
                    </div>
                    <div style="background: rgba(16, 185, 129, 0.1); padding: 15px; border-radius: 10px; text-align: center; border: 1px solid rgba(16, 185, 129, 0.2);">
                        <div style="font-size: 28px; font-weight: 700; color: #10b981;">${report.summary.last24h}</div>
                        <div style="color: #94a3b8; font-size: 13px; margin-top: 5px;">Last 24 Hours</div>
                    </div>
                    <div style="background: rgba(245, 158, 11, 0.1); padding: 15px; border-radius: 10px; text-align: center; border: 1px solid rgba(245, 158, 11, 0.2);">
                        <div style="font-size: 28px; font-weight: 700; color: #f59e0b;">${report.summary.totalUsers}</div>
                        <div style="color: #94a3b8; font-size: 13px; margin-top: 5px;">Total Users</div>
                    </div>
                    <div style="background: rgba(239, 68, 68, 0.1); padding: 15px; border-radius: 10px; text-align: center; border: 1px solid rgba(239, 68, 68, 0.2);">
                        <div style="font-size: 28px; font-weight: 700; color: #ef4444;">${report.summary.activeThreats}</div>
                        <div style="color: #94a3b8; font-size: 13px; margin-top: 5px;">Active Threats</div>
                    </div>
                </div>

                <div style="background: rgba(51, 65, 85, 0.3); padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                    <h4 style="color: #cbd5e1; margin: 0 0 15px 0;">Threat Summary</h4>
                    <div style="display: flex; gap: 20px;">
                        <div style="flex: 1;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                                <span style="color: #ef4444; font-size: 13px;">🔴 High Severity</span>
                                <span style="color: white; font-weight: 700;">${report.threatSummary.high}</span>
                            </div>
                            <div style="background: rgba(51, 65, 85, 0.5); height: 8px; border-radius: 4px; overflow: hidden;">
                                <div style="background: #ef4444; height: 100%; width: ${Math.min((report.threatSummary.high / (report.threatSummary.high + report.threatSummary.medium + report.threatSummary.low)) * 100, 100)}%;"></div>
                            </div>
                        </div>
                        <div style="flex: 1;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                                <span style="color: #f59e0b; font-size: 13px;">🟡 Medium Severity</span>
                                <span style="color: white; font-weight: 700;">${report.threatSummary.medium}</span>
                            </div>
                            <div style="background: rgba(51, 65, 85, 0.5); height: 8px; border-radius: 4px; overflow: hidden;">
                                <div style="background: #f59e0b; height: 100%; width: ${Math.min((report.threatSummary.medium / (report.threatSummary.high + report.threatSummary.medium + report.threatSummary.low)) * 100, 100)}%;"></div>
                            </div>
                        </div>
                        <div style="flex: 1;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                                <span style="color: #3b82f6; font-size: 13px;">🔵 Low Severity</span>
                                <span style="color: white; font-weight: 700;">${report.threatSummary.low}</span>
                            </div>
                            <div style="background: rgba(51, 65, 85, 0.5); height: 8px; border-radius: 4px; overflow: hidden;">
                                <div style="background: #3b82f6; height: 100%; width: ${Math.min((report.threatSummary.low / (report.threatSummary.high + report.threatSummary.medium + report.threatSummary.low)) * 100, 100)}%;"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="background: rgba(51, 65, 85, 0.3); padding: 15px; border-radius: 10px;">
                    <h4 style="color: #cbd5e1; margin: 0 0 15px 0;">🎯 Security Recommendations</h4>
                    ${report.recommendations.map(rec => {
                        const priorityColors = {
                            CRITICAL: '#ef4444',
                            HIGH: '#f59e0b',
                            MEDIUM: '#3b82f6',
                            LOW: '#10b981'
                        };
                        const color = priorityColors[rec.priority];
                        
                        return `
                            <div style="background: rgba(51, 65, 85, 0.5); padding: 12px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid ${color};">
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                                    <div>
                                        <span style="background: ${color}; color: white; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 700;">${rec.priority}</span>
                                        <span style="color: #94a3b8; font-size: 12px; margin-left: 8px;">${rec.category}</span>
                                    </div>
                                </div>
                                <p style="color: white; margin: 0 0 10px 0; font-weight: 500;">${rec.message}</p>
                                <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 13px;">
                                    ${rec.actions.map(action => `<li style="margin: 5px 0;">${action}</li>`).join('')}
                                </ul>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    // ========================================================================
    // PUBLIC API
    // ========================================================================
    
    return {
        // Analysis functions
        detectThreats,
        buildUserProfiles,
        analyzeGeography,
        calculateAdvancedStats,
        generateSecurityReport,
        
        // Rendering functions
        renderThreatsPanel,
        renderUserProfilesPanel,
        renderGeographicPanel,
        renderSecurityReport,
        
        // Utility functions
        getTimeAgo,
        formatDate,
        calculateDistance,
        
        // Configuration
        CONFIG,
        THREAT_PATTERNS
    };
})();




// ============================================================================
// SECURITY ANALYTICS MODAL FUNCTIONS
// ============================================================================

function openSecurityModal(title, content) {
    const modal = document.getElementById('securityModal');
    const modalBody = document.getElementById('securityModalBody');
    
    modalBody.innerHTML = `
        <h2 style="color: white; margin: 0 0 20px 0; font-size: 28px;">
            ${title}
        </h2>
        ${content}
    `;
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeSecurityModal() {
    const modal = document.getElementById('securityModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('securityModal');
    if (event.target === modal) {
        closeSecurityModal();
    }
}

// ============================================================================
// CLICK HANDLERS FOR SECURITY STATS
// ============================================================================

function viewAllThreats() {
    if (!window.securityAnalysisData || !window.securityAnalysisData.threats) {
        alert('No threat data available');
        return;
    }
    
    const threats = window.securityAnalysisData.threats;
    
    const content = `
        <div style="color: white;">
            <p style="color: #94a3b8; margin-bottom: 20px;">
                Total Threats Detected: <strong style="color: #ef4444;">${threats.length}</strong>
            </p>
            
            ${threats.length === 0 ? `
                <div style="text-align: center; padding: 40px; background: rgba(16, 185, 129, 0.1); border-radius: 15px;">
                    <div style="font-size: 64px; margin-bottom: 15px;">✅</div>
                    <h3 style="color: #10b981; margin: 0;">No Active Threats</h3>
                    <p style="color: #94a3b8; margin: 10px 0 0 0;">Your system is secure</p>
                </div>
            ` : threats.map((threat, idx) => {
                const severityColors = {
                    HIGH: '#ef4444',
                    MEDIUM: '#f59e0b',
                    LOW: '#3b82f6'
                };
                const color = severityColors[threat.severity];
                
                return `
                    <div style="background: rgba(51, 65, 85, 0.5); padding: 20px; border-radius: 12px; margin-bottom: 15px; border-left: 4px solid ${color};">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                            <div>
                                <span style="background: ${color}; color: white; padding: 5px 12px; border-radius: 6px; font-size: 11px; font-weight: 700;">${threat.severity}</span>
                                <span style="color: white; font-weight: 600; margin-left: 12px; font-size: 16px;">${threat.type.replace(/_/g, ' ')}</span>
                            </div>
                            <span style="color: #64748b; font-size: 13px;">#${idx + 1}</span>
                        </div>
                        <p style="color: #cbd5e1; margin: 12px 0; font-size: 15px;">
                            👤 <strong>${threat.user}</strong>
                        </p>
                        <p style="color: #94a3b8; margin: 12px 0; line-height: 1.6;">
                            ${threat.description}
                        </p>
                        <div style="background: rgba(59, 130, 246, 0.1); padding: 12px; border-radius: 8px; border-left: 3px solid #3b82f6; margin-top: 12px;">
                            <p style="color: #3b82f6; margin: 0; font-size: 13px;">
                                💡 <strong>Recommendation:</strong> ${threat.recommendation}
                            </p>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    
    openSecurityModal('🚨 All Security Threats', content);
}

function viewHighRiskUsers() {
    if (!window.securityAnalysisData || !window.securityAnalysisData.userProfiles) {
        alert('No user profile data available');
        return;
    }
    
    const profiles = Object.values(window.securityAnalysisData.userProfiles)
        .filter(p => p.riskLevel === 'HIGH')
        .sort((a, b) => b.riskScore - a.riskScore);
    
    const content = `
        <div style="color: white;">
            <p style="color: #94a3b8; margin-bottom: 20px;">
                High-Risk Users: <strong style="color: #ef4444;">${profiles.length}</strong>
            </p>
            
            ${profiles.length === 0 ? `
                <div style="text-align: center; padding: 40px; background: rgba(16, 185, 129, 0.1); border-radius: 15px;">
                    <div style="font-size: 64px; margin-bottom: 15px;">✅</div>
                    <h3 style="color: #10b981; margin: 0;">No High-Risk Users</h3>
                    <p style="color: #94a3b8; margin: 10px 0 0 0;">All user accounts are secure</p>
                </div>
            ` : profiles.map(profile => `
                <div style="background: rgba(51, 65, 85, 0.5); padding: 20px; border-radius: 12px; margin-bottom: 15px; border-left: 4px solid #ef4444;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3 style="color: white; margin: 0; font-size: 18px;">${profile.email}</h3>
                        <span style="background: #ef4444; color: white; padding: 6px 12px; border-radius: 6px; font-weight: 700; font-size: 14px;">
                            RISK: ${profile.riskScore}/100
                        </span>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-top: 15px;">
                        <div style="background: rgba(59, 130, 246, 0.1); padding: 12px; border-radius: 8px;">
                            <div style="color: #64748b; font-size: 11px; margin-bottom: 5px;">TOTAL LOGINS</div>
                            <div style="color: white; font-size: 20px; font-weight: 700;">${profile.totalLogins}</div>
                        </div>
                        <div style="background: rgba(16, 185, 129, 0.1); padding: 12px; border-radius: 8px;">
                            <div style="color: #64748b; font-size: 11px; margin-bottom: 5px;">SUCCESS RATE</div>
                            <div style="color: #10b981; font-size: 20px; font-weight: 700;">${profile.successRate}%</div>
                        </div>
                        <div style="background: rgba(245, 158, 11, 0.1); padding: 12px; border-radius: 8px;">
                            <div style="color: #64748b; font-size: 11px; margin-bottom: 5px;">UNIQUE IPs</div>
                            <div style="color: #f59e0b; font-size: 20px; font-weight: 700;">${profile.uniqueIPCount}</div>
                        </div>
                        <div style="background: rgba(139, 92, 246, 0.1); padding: 12px; border-radius: 8px;">
                            <div style="color: #64748b; font-size: 11px; margin-bottom: 5px;">LOCATIONS</div>
                            <div style="color: #8b5cf6; font-size: 20px; font-weight: 700;">${profile.uniqueLocationCount}</div>
                        </div>
                    </div>
                    
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(148, 163, 184, 0.2);">
                        <div style="color: #94a3b8; font-size: 13px; margin-bottom: 8px;">
                            <strong>Last Seen:</strong> ${profile.lastSeen ? new Date(profile.lastSeen).toLocaleString() : 'Never'}
                        </div>
                        <div style="color: #94a3b8; font-size: 13px;">
                            <strong>Devices:</strong> ${profile.devices.join(', ')}
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    openSecurityModal('⚠️ High-Risk User Accounts', content);
}

function viewLocationDetails() {
    if (!window.securityAnalysisData || !window.securityAnalysisData.geoAnalysis) {
        alert('No geographic data available');
        return;
    }
    
    const geo = window.securityAnalysisData.geoAnalysis;
    
    const content = `
        <div style="color: white;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px;">
                <div style="background: rgba(59, 130, 246, 0.1); padding: 20px; border-radius: 12px; text-align: center;">
                    <div style="font-size: 36px; font-weight: 700; color: #3b82f6;">${geo.totalCountries}</div>
                    <div style="color: #94a3b8; font-size: 14px; margin-top: 5px;">Countries</div>
                </div>
                <div style="background: rgba(16, 185, 129, 0.1); padding: 20px; border-radius: 12px; text-align: center;">
                    <div style="font-size: 36px; font-weight: 700; color: #10b981;">${geo.totalLocations}</div>
                    <div style="color: #94a3b8; font-size: 14px; margin-top: 5px;">Locations</div>
                </div>
                <div style="background: rgba(245, 158, 11, 0.1); padding: 20px; border-radius: 12px; text-align: center;">
                    <div style="font-size: 36px; font-weight: 700; color: #f59e0b;">${geo.totalIPs}</div>
                    <div style="color: #94a3b8; font-size: 14px; margin-top: 5px;">Unique IPs</div>
                </div>
            </div>
            
            <h3 style="color: white; margin: 30px 0 15px 0;">🌍 Top Locations</h3>
            ${geo.topLocations.map((loc, idx) => `
                <div style="background: rgba(51, 65, 85, 0.5); padding: 15px; border-radius: 10px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <span style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700;">
                            ${idx + 1}
                        </span>
                        <div>
                            <div style="color: white; font-weight: 600; font-size: 15px;">${loc.location}</div>
                            <div style="color: #64748b; font-size: 12px; margin-top: 3px;">
                                👤 ${loc.userCount} users
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 20px; align-items: center;">
                        <span style="color: #10b981; font-size: 13px;">✓ ${loc.successCount}</span>
                        <span style="color: #ef4444; font-size: 13px;">✗ ${loc.failedCount}</span>
                        <span style="color: white; font-weight: 700; font-size: 16px;">${loc.count} logins</span>
                    </div>
                </div>
            `).join('')}
            
            <h3 style="color: white; margin: 30px 0 15px 0;">🖥️ Top IP Addresses</h3>
            ${geo.topIPs.slice(0, 10).map((ip, idx) => `
                <div style="background: rgba(51, 65, 85, 0.5); padding: 15px; border-radius: 10px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <span style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700;">
                            ${idx + 1}
                        </span>
                        <div>
                            <div style="color: white; font-weight: 600; font-size: 14px; font-family: monospace;">${ip.ip}</div>
                            <div style="color: #64748b; font-size: 12px; margin-top: 3px;">${ip.location}</div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 20px; align-items: center;">
                        <span style="color: #3b82f6; font-size: 13px;">👤 ${ip.userCount} users</span>
                        <span style="color: white; font-weight: 700; font-size: 16px;">${ip.count} logins</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    openSecurityModal('🌍 Geographic Analysis', content);
}

function viewAllUsers() {
    if (!window.securityAnalysisData || !window.securityAnalysisData.userProfiles) {
        alert('No user data available');
        return;
    }
    
    const profiles = Object.values(window.securityAnalysisData.userProfiles)
        .sort((a, b) => b.riskScore - a.riskScore);
    
    const content = `
        <div style="color: white;">
            <p style="color: #94a3b8; margin-bottom: 20px;">
                Total Users: <strong style="color: #3b82f6;">${profiles.length}</strong>
            </p>
            
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: rgba(51, 65, 85, 0.5);">
                            <th style="padding: 12px; text-align: left; color: #cbd5e1; font-size: 12px;">#</th>
                            <th style="padding: 12px; text-align: left; color: #cbd5e1; font-size: 12px;">USER</th>
                            <th style="padding: 12px; text-align: center; color: #cbd5e1; font-size: 12px;">RISK</th>
                            <th style="padding: 12px; text-align: center; color: #cbd5e1; font-size: 12px;">LOGINS</th>
                            <th style="padding: 12px; text-align: center; color: #cbd5e1; font-size: 12px;">SUCCESS</th>
                            <th style="padding: 12px; text-align: center; color: #cbd5e1; font-size: 12px;">IPs</th>
                            <th style="padding: 12px; text-align: left; color: #cbd5e1; font-size: 12px;">LAST SEEN</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${profiles.map((profile, idx) => {
                            const riskColors = {
                                HIGH: '#ef4444',
                                MEDIUM: '#f59e0b',
                                LOW: '#10b981'
                            };
                            const riskColor = riskColors[profile.riskLevel];
                            
                            return `
                                <tr style="border-bottom: 1px solid rgba(51, 65, 85, 0.3);">
                                    <td style="padding: 12px; color: #64748b;">${idx + 1}</td>
                                    <td style="padding: 12px; color: white;">${profile.email}</td>
                                    <td style="padding: 12px; text-align: center;">
                                        <span style="background: ${riskColor}; color: white; padding: 4px 8px; border-radius: 5px; font-size: 11px; font-weight: 700;">
                                            ${profile.riskLevel}
                                        </span>
                                    </td>
                                    <td style="padding: 12px; text-align: center; color: #cbd5e1;">${profile.totalLogins}</td>
                                    <td style="padding: 12px; text-align: center; color: #10b981;">${profile.successRate}%</td>
                                    <td style="padding: 12px; text-align: center; color: #94a3b8;">${profile.uniqueIPCount}</td>
                                    <td style="padding: 12px; color: #64748b; font-size: 12px;">${profile.lastSeen ? new Date(profile.lastSeen).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never'}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    openSecurityModal('👥 All User Profiles', content);
}

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeSecurityModal();
    }
});





// ============================================================================
// END OF ADVANCED SECURITY ANALYTICS MODULE
// ============================================================================

console.log('Advanced Security Analytics Module loaded successfully');