import { Grade1 } from './Grade 1.js';
import { Grade2 } from './Grade 2.js';
import { Grade3 } from './Grade 3.js';
import { Grade4 } from './Grade 4.js';
import { Grade5 } from './Grade 5.js';
import { Grade6 } from './Grade 6.js';
import { Grade7 } from './Grade 7.js';
import { Grade8 } from './Grade 8.js';
import { Grade9 } from './Grade 9.js';

// Function to count total students
function updateTotalStudents() {
    const grades = [Grade1, Grade2, Grade3, Grade4, Grade5, Grade6, Grade7, Grade8, Grade9];
    const totalStudents = grades.reduce((total, grade) => total + grade.length, 0);
    
    // Get gender counts
    const maleStudents = grades.flat().filter(student => student.Gender?.includes('Male')).length;
    const femaleStudents = grades.flat().filter(student => student.Gender?.includes('Female')).length;

    // Update the counter element
    const counterElement = document.getElementById('studentCounter');
    if (counterElement) {
        counterElement.innerHTML = `
            <div class="counter-box">
                <div class="total-count">
                    <span class="count">${totalStudents}</span>
                    <span class="label">Total Students Registered</span>
                </div>
                <div class="gender-counts">
                    <div class="male-count">
                        <span class="count">${maleStudents}</span>
                        <span class="label">Boys</span>
                    </div>
                    <div class="female-count">
                        <span class="count">${femaleStudents}</span>
                        <span class="label">Girls</span>
                    </div>
                </div>
            </div>
        `;

        // Add styles
        const styles = document.createElement('style');
        styles.textContent = `
            .counter-box {
                background:#F9F9F9;
                padding: 20px;
                border-radius: 10px;
                color: black;
                text-align: center;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            }

            .total-count {
                margin-bottom: 15px;
            }

            .total-count .count {
                font-size: 3em;
                font-weight: bold;
                display: block;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }

            .gender-counts {
                display: flex;
                justify-content: space-around;
                gap: 20px;
                flex-wrap: wrap;
            }

            .male-count, .female-count {
                flex: 1;
                min-width: 120px;
                padding: 15px;
                background: rgba(255,255,255,0.1);
                border-radius: 8px;
                margin: 5px;
            }

            .male-count .count, .female-count .count {
                font-size: 1.5em;
                font-weight: bold;
                display: block;
            }

            .label {
                font-size: 0.9em;
                opacity: 0.9;
            }

            @media (max-width: 768px) {
                .counter-box {
                    padding: 15px;
                }
                
                .total-count .count {
                    font-size: 2em;
                }
                
                .gender-counts {
                    flex-direction: column;
                    gap: 10px;
                }
                
                .male-count, .female-count {
                    width: 100%;
                    min-width: unset;
                }
                
                .male-count .count, .female-count .count {
                    font-size: 1.5em;
                }

                .label {
                    font-size: 0.8em;
                }
            }

            @media (max-width: 480px) {
                .counter-box {
                    padding: 10px;
                }
                
                .total-count .count {
                    font-size: 1.8em;
                }
                
                .male-count .count, .female-count .count {
                    font-size: 1.3em;
                }
            }
        `;
        document.head.appendChild(styles);
    }
}

// Add this function before showClassStatistics()
function getClassStatistics() {
    const grades = [
        { name: 'Grade PP1', data: Grade1 },
        { name: 'Grade PP2', data: Grade2 },
        { name: 'Grade 1', data: Grade3 },
        { name: 'Grade 2', data: Grade4 },
        { name: 'Grade 3', data: Grade5 },
        { name: 'Grade 4', data: Grade6 },
        { name: 'Grade 5', data: Grade7 },
        { name: 'Grade 6', data: Grade8 },
        { name: 'Grade 7', data: Grade9 }
    ];

    return grades.map(grade => ({
        grade: grade.name,
        total: grade.data?.length || 0,
        boys: grade.data?.filter(student => student.Gender?.toLowerCase().includes('male')).length || 0,
        girls: grade.data?.filter(student => student.Gender?.toLowerCase().includes('female')).length || 0,
        streamA: grade.data?.filter(student => student.Stream?.toLowerCase().includes('a')).length || 0,
        streamB: grade.data?.filter(student => student.Stream?.toLowerCase().includes('b')).length || 0
    }));
}

function showClassStatistics() {
    const stats = getClassStatistics();
    const container = document.getElementById('notificationsContainer');
    container.innerHTML = '';
    
    // Rotate between different modal styles
    const modalStyles = ['top-right', 'side-panel', 'bottom-toast'];
    const currentStyle = modalStyles[Math.floor(Math.random() * modalStyles.length)];
    container.className = `notifications-container ${currentStyle}`;
    
    let visibleCards = currentStyle === 'side-panel' ? stats.length : 3;
    
    stats.slice(0, visibleCards).forEach((cls, index) => {
        setTimeout(() => {
            const notification = document.createElement('div');
            notification.className = `stat-notification ${getModalAnimation(currentStyle)}`;
            notification.innerHTML = `
                <div class="header">
                    <h4>${cls.grade}</h4>
                    <div class="nav-info">
                        <span>${index + 1}/${visibleCards}</span>
                        ${currentStyle !== 'side-panel' ? '<i class="bx bx-x close-btn"></i>' : ''}
                    </div>
                </div>
                <div class="content">
                    <div class="stat-data">
                        <span class="label">Total Students:</span>
                        <span class="value">${cls.total}</span>
                    </div>
                    <div class="stat-data">
                        <span class="label">Boys:</span>
                        <span class="value">${cls.boys}</span>
                    </div>
                    <div class="stat-data">
                        <span class="label">Girls:</span>
                        <span class="value">${cls.girls}</span>
                    </div>
                    <div class="nav-dots">
                        ${createNavDots(visibleCards, index)}
                    </div>
                </div>
            `;
            
            container.appendChild(notification);
            
            // Add close functionality
            const closeBtn = notification.querySelector('.close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    notification.classList.remove('show');
                    setTimeout(() => notification.remove(), 300);
                });
            }
            
            // Show with delay
            requestAnimationFrame(() => notification.classList.add('show'));
            
        }, index * 200);
    });
}

function getModalAnimation(style) {
    switch(style) {
        case 'side-panel': return 'slide-right';
        case 'bottom-toast': return 'slide-up';
        default: return 'fade';
    }
}

function createNavDots(total, active) {
    return Array(total).fill(0)
        .map((_, i) => `<div class="nav-dot ${i === active ? 'active' : ''}"></div>`)
        .join('');
}

document.getElementById('studentCounter').addEventListener('click', () => {
    const container = document.getElementById('notificationsContainer');
    container.innerHTML = ''; // Clear existing notifications
    showClassStatistics();
});

// Initial update
document.addEventListener('DOMContentLoaded', updateTotalStudents);

// Export function for use in other scripts if needed
export { updateTotalStudents };
