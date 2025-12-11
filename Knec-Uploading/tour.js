// =============================================================================
// INTERACTIVE USER GUIDE SYSTEM
// Add this to your main JS file or load it separately
// =============================================================================

class UserGuide {
    constructor() {
        this.currentStep = 0;
        this.isActive = false;
        this.hasSeenGuide = this.checkIfGuideWasSeen();
        
        this.steps = [
            {
                title: "Welcome to Birth Certificate Manager! 🎉",
                message: "Let's take a quick tour to help you get started. This will only take a minute!",
                target: null,
                position: "center",
                highlightColor: "blue"
            },
            {
                title: "Student Statistics 📊",
                message: "Here you can see the total number of students, how many have PDFs uploaded, and how many are missing PDFs.",
                target: "#total-count",
                position: "bottom",
                highlightColor: "green"
            },
            {
                title: "Quick Actions 🔍",
                message: "Use these buttons to quickly filter students: view all, only those with birth certificates, or those without birth certificates.",
                target: "#quick-actions-content",
                position: "bottom",
                highlightColor: "purple"
            },
            {
                title: "Search Students 🔎",
                message: "Type a student's name or assessment number here to quickly find them in the list.",
                target: "#live-filter",
                position: "bottom",
                highlightColor: "blue"
            },
            {
                title: "Advanced Filters 🎓",
                message: "Use these advanced filters to refine your search - filter by grade level, items per page, and search by name or assessment number.",
                target: "#filter-content",
                position: "top",
                highlightColor: "indigo"
            },
            {
                title: "Student Records Table 📋",
                message: "This table displays all student information including their names, assessment numbers, UPI, grade, and birth certificate status. You can sort by clicking column headers.",
                target: "#student-table-body",
                position: "top",
                highlightColor: "blue"
            },
            {
                title: "Upload Birth Certificates 📤",
                message: "Click the 'Upload' button for any student to upload their birth certificate PDF. You can drag and drop files or browse to select them. Click 'Replace' to update existing certificates.",
                target: null,
                position: "center",
                highlightColor: "orange"
            },
            {
                title: "View Birth Certificates 👁️",
                message: "Students with uploaded birth certificates will have a 'View' button. Click it to preview the document in a modal window. You can also delete certificates if needed.",
                target: null,
                position: "center",
                highlightColor: "green"
            },
            {
                title: "Export & Print 📄",
                message: "Use the export button to download data as Excel or PDF. The print button lets you create a formatted list of students for printing.",
                target: "#bulk-check-btn",
                position: "left",
                highlightColor: "cyan"
            },
            {
                title: "Sidebar Navigation 🧭",
                message: "Access additional features from the sidebar including analytics, data export, and system controls. Click the menu icon to expand/collapse on mobile.",
                target: "#sidebar",
                position: "right",
                highlightColor: "purple"
            },
            {
                title: "You're All Set! ✨",
                message: "That's it! You're ready to manage birth certificates. You can restart this tour anytime from the help menu. Happy managing!",
                target: null,
                position: "center",
                highlightColor: "blue"
            }
        ];
        
        this.overlay = null;
        this.tooltip = null;
        this.highlight = null;
    }
    
    checkIfGuideWasSeen() {
        try {
            return localStorage.getItem('userGuideCompleted') === 'true';
        } catch {
            return false;
        }
    }
    
    markGuideAsCompleted() {
        try {
            localStorage.setItem('userGuideCompleted', 'true');
        } catch {
            console.warn('Could not save guide completion status');
        }
    }
    
    start() {
        if (this.isActive) return;
        
        this.isActive = true;
        this.currentStep = 0;
        this.createOverlay();
        this.showStep(0);
    }
    
    restart() {
        this.stop();
        this.start();
    }
    
    stop() {
        this.isActive = false;
        this.removeOverlay();
        this.removeTooltip();
        this.removeHighlight();
    }
    
    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.id = 'guide-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 9998;
            transition: opacity 0.3s ease;
            opacity: 0;
        `;
        
        document.body.appendChild(this.overlay);
        
        setTimeout(() => {
            this.overlay.style.opacity = '1';
        }, 10);
    }
    
    removeOverlay() {
        if (this.overlay) {
            this.overlay.style.opacity = '0';
            setTimeout(() => {
                if (this.overlay && this.overlay.parentNode) {
                    this.overlay.parentNode.removeChild(this.overlay);
                }
                this.overlay = null;
            }, 300);
        }
    }
    
    createHighlight(element) {
        this.removeHighlight();
        
        if (!element) return;
        
        const rect = element.getBoundingClientRect();
        const padding = 8;
        
        this.highlight = document.createElement('div');
        this.highlight.id = 'guide-highlight';
        this.highlight.style.cssText = `
            position: fixed;
            top: ${rect.top - padding}px;
            left: ${rect.left - padding}px;
            width: ${rect.width + padding * 2}px;
            height: ${rect.height + padding * 2}px;
            border: 3px solid #3b82f6;
            border-radius: 8px;
            z-index: 9999;
            pointer-events: none;
            box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 20px rgba(59, 130, 246, 0.5);
            transition: all 0.3s ease;
            animation: pulse 2s infinite;
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0%, 100% { box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 20px rgba(59, 130, 246, 0.5); }
                50% { box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 30px rgba(59, 130, 246, 0.8); }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(this.highlight);
    }
    
    removeHighlight() {
        if (this.highlight) {
            if (this.highlight.parentNode) {
                this.highlight.parentNode.removeChild(this.highlight);
            }
            this.highlight = null;
        }
    }
    
    createTooltip(step) {
        this.removeTooltip();
        
        this.tooltip = document.createElement('div');
        this.tooltip.id = 'guide-tooltip';
        
        const isCenter = step.position === 'center';
        
        this.tooltip.style.cssText = `
            position: fixed;
            background: white;
            border-radius: 12px;
            padding: 24px;
            max-width: ${isCenter ? '500px' : '400px'};
            z-index: 10000;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
            opacity: 0;
            transform: scale(0.9);
        `;
        
        if (isCenter) {
            this.tooltip.style.top = '50%';
            this.tooltip.style.left = '50%';
            this.tooltip.style.transform = 'translate(-50%, -50%) scale(0.9)';
        }
        
        const progressPercent = ((this.currentStep + 1) / this.steps.length) * 100;
        
        this.tooltip.innerHTML = `
            <div style="margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 12px; color: #6b7280; font-weight: 600;">
                        STEP ${this.currentStep + 1} OF ${this.steps.length}
                    </span>
                    <button id="guide-close-btn" style="background: none; border: none; cursor: pointer; font-size: 24px; color: #9ca3af; line-height: 1; padding: 0; width: 24px; height: 24px;">
                        ×
                    </button>
                </div>
                <div style="width: 100%; height: 4px; background: #e5e7eb; border-radius: 2px; overflow: hidden;">
                    <div style="width: ${progressPercent}%; height: 100%; background: linear-gradient(90deg, #3b82f6, #8b5cf6); transition: width 0.3s ease;"></div>
                </div>
            </div>
            
            <h3 style="font-size: 20px; font-weight: 700; color: #1f2937; margin: 0 0 12px 0;">
                ${step.title}
            </h3>
            
            <p style="font-size: 15px; color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
                ${step.message}
            </p>
            
            <div style="display: flex; gap: 12px; justify-content: space-between;">
                ${this.currentStep > 0 ? `
                    <button id="guide-prev-btn" style="
                        padding: 10px 20px;
                        background: #f3f4f6;
                        color: #374151;
                        border: none;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                        font-size: 14px;
                    ">
                        ← Previous
                    </button>
                ` : '<div></div>'}
                
                <div style="display: flex; gap: 12px;">
                    <button id="guide-skip-btn" style="
                        padding: 10px 20px;
                        background: white;
                        color: #6b7280;
                        border: 2px solid #e5e7eb;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                        font-size: 14px;
                    ">
                        Skip Tour
                    </button>
                    
                    <button id="guide-next-btn" style="
                        padding: 10px 24px;
                        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                        font-size: 14px;
                        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                    ">
                        ${this.currentStep === this.steps.length - 1 ? 'Finish ✓' : 'Next →'}
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.tooltip);
        
        if (!isCenter && step.target) {
            const targetElement = document.querySelector(step.target);
            if (targetElement) {
                this.positionTooltip(targetElement, step.position);
            }
        }
        
        setTimeout(() => {
            this.tooltip.style.opacity = '1';
            if (isCenter) {
                this.tooltip.style.transform = 'translate(-50%, -50%) scale(1)';
            } else {
                this.tooltip.style.transform = 'scale(1)';
            }
        }, 10);
        
        this.attachTooltipListeners();
    }
    
    positionTooltip(targetElement, position) {
        const rect = targetElement.getBoundingClientRect();
        const tooltipRect = this.tooltip.getBoundingClientRect();
        const padding = 20;
        
        switch (position) {
            case 'top':
                this.tooltip.style.top = `${rect.top - tooltipRect.height - padding}px`;
                this.tooltip.style.left = `${rect.left + rect.width / 2 - tooltipRect.width / 2}px`;
                break;
            case 'bottom':
                this.tooltip.style.top = `${rect.bottom + padding}px`;
                this.tooltip.style.left = `${rect.left + rect.width / 2 - tooltipRect.width / 2}px`;
                break;
            case 'left':
                this.tooltip.style.top = `${rect.top + rect.height / 2 - tooltipRect.height / 2}px`;
                this.tooltip.style.left = `${rect.left - tooltipRect.width - padding}px`;
                break;
            case 'right':
                this.tooltip.style.top = `${rect.top + rect.height / 2 - tooltipRect.height / 2}px`;
                this.tooltip.style.left = `${rect.right + padding}px`;
                break;
        }
        
        const maxLeft = window.innerWidth - tooltipRect.width - 20;
        const maxTop = window.innerHeight - tooltipRect.height - 20;
        
        const currentLeft = parseInt(this.tooltip.style.left);
        const currentTop = parseInt(this.tooltip.style.top);
        
        if (currentLeft < 20) this.tooltip.style.left = '20px';
        if (currentLeft > maxLeft) this.tooltip.style.left = `${maxLeft}px`;
        if (currentTop < 20) this.tooltip.style.top = '20px';
        if (currentTop > maxTop) this.tooltip.style.top = `${maxTop}px`;
    }
    
    removeTooltip() {
        if (this.tooltip) {
            this.tooltip.style.opacity = '0';
            this.tooltip.style.transform = 'scale(0.9)';
            setTimeout(() => {
                if (this.tooltip && this.tooltip.parentNode) {
                    this.tooltip.parentNode.removeChild(this.tooltip);
                }
                this.tooltip = null;
            }, 300);
        }
    }
    
    attachTooltipListeners() {
        const nextBtn = document.getElementById('guide-next-btn');
        const prevBtn = document.getElementById('guide-prev-btn');
        const skipBtn = document.getElementById('guide-skip-btn');
        const closeBtn = document.getElementById('guide-close-btn');
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.next());
            nextBtn.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-2px)';
                this.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
            });
            nextBtn.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
            });
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previous());
            prevBtn.addEventListener('mouseenter', function() {
                this.style.background = '#e5e7eb';
            });
            prevBtn.addEventListener('mouseleave', function() {
                this.style.background = '#f3f4f6';
            });
        }
        
        if (skipBtn) {
            skipBtn.addEventListener('click', () => this.skip());
            skipBtn.addEventListener('mouseenter', function() {
                this.style.background = '#f9fafb';
                this.style.borderColor = '#d1d5db';
            });
            skipBtn.addEventListener('mouseleave', function() {
                this.style.background = 'white';
                this.style.borderColor = '#e5e7eb';
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.skip());
            closeBtn.addEventListener('mouseenter', function() {
                this.style.color = '#ef4444';
            });
            closeBtn.addEventListener('mouseleave', function() {
                this.style.color = '#9ca3af';
            });
        }
    }
    
    showStep(stepIndex) {
        if (stepIndex < 0 || stepIndex >= this.steps.length) return;
        
        this.currentStep = stepIndex;
        const step = this.steps[stepIndex];
        
        if (step.target) {
            const targetElement = document.querySelector(step.target);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                setTimeout(() => {
                    this.createHighlight(targetElement);
                    this.createTooltip(step);
                }, 300);
            } else {
                this.createTooltip(step);
            }
        } else {
            this.removeHighlight();
            this.createTooltip(step);
        }
    }
    
    next() {
        if (this.currentStep < this.steps.length - 1) {
            this.showStep(this.currentStep + 1);
        } else {
            this.complete();
        }
    }
    
    previous() {
        if (this.currentStep > 0) {
            this.showStep(this.currentStep - 1);
        }
    }
    
    skip() {
        this.markGuideAsCompleted();
        this.stop();
    }
    
    complete() {
        this.markGuideAsCompleted();
        this.stop();
        
        // Show completion message
        if (typeof showToast === 'function') {
            showToast('🎉 Tour completed! You\'re ready to manage birth certificates.', 'success');
        }
    }
}

// =============================================================================
// INITIALIZE GUIDE
// =============================================================================

let userGuide;

function initializeUserGuide() {
    userGuide = new UserGuide();
    
    // Auto-start guide for first-time users (after login)
    const authStateCheck = setInterval(() => {
        const mainApp = document.getElementById('main-app-container');
        if (mainApp && !mainApp.classList.contains('hidden')) {
            clearInterval(authStateCheck);
            
            // Wait for data to load
            setTimeout(() => {
                if (!userGuide.hasSeenGuide) {
                    userGuide.start();
                }
            }, 1500);
        }
    }, 500);
    
    // Add help button to trigger guide manually
    addHelpButton();
}

function addHelpButton() {
    const helpBtn = document.createElement('button');
    helpBtn.id = 'help-guide-btn';
    helpBtn.innerHTML = `
        <svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span>Help</span>
    `;
    helpBtn.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        color: white;
        border: none;
        border-radius: 50px;
        padding: 12px 24px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        transition: all 0.3s ease;
    `;
    
    helpBtn.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-4px)';
        this.style.boxShadow = '0 12px 32px rgba(59, 130, 246, 0.5)';
    });
    
    helpBtn.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.4)';
    });
    
    helpBtn.addEventListener('click', () => {
        if (userGuide) {
            userGuide.restart();
        }
    });
    
    document.body.appendChild(helpBtn);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeUserGuide);
} else {
    initializeUserGuide();
}

// Export for manual control
window.userGuide = userGuide;
window.startUserGuide = () => userGuide && userGuide.restart();