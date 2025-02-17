// Check if namespace exists to avoid redeclaration
window.KanyadetNotifications = window.KanyadetNotifications || {};

if (!window.KanyadetNotifications.SyncedNotification) {
    window.KanyadetNotifications.SyncedNotification = class {
        constructor() {
            this.initializeSystem();
        }

        async initializeSystem() {
            try {
                await this.waitForFirebase();
                this.notifications = [];
                this.notificationBell = document.querySelector('.notification');
                this.notificationCount = document.querySelector('.notification .num');
                this.sessionId = this.generateSessionId();
                this.notificationsRef = firebase.database().ref('notifications');
                
                // Test write permission
                const testRef = this.notificationsRef.push();
                await testRef.set({
                    id: Date.now(),
                    title: 'Test',
                    message: 'Testing database access',
                    timestamp: Date.now(),
                    type: 'system'
                });
                await testRef.remove();
                
                this.setupNotificationSystem();
                this.setupRealtimeSync();
            } catch (error) {
                console.error('Firebase initialization error:', error);
                // Fallback to local storage if Firebase fails
                this.useFallbackStorage();
            }
        }

        useFallbackStorage() {
            console.log('Using local storage fallback');
            this.notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
            this.setupNotificationSystem();
            // Other methods remain unchanged but will use localStorage
        }

        waitForFirebase() {
            return new Promise((resolve, reject) => {
                const checkFirebase = () => {
                    if (window.firebase && window.firebase.database) {
                        resolve();
                    } else {
                        setTimeout(checkFirebase, 100);
                    }
                };
                checkFirebase();
            });
        }

        generateSessionId() {
            return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        setupRealtimeSync() {
            // Listen for new notifications
            this.notificationsRef.on('child_added', (snapshot) => {
                const notification = snapshot.val();
                if (notification.sessionId !== this.sessionId) {
                    this.handleIncomingNotification(notification);
                }
            });

            // Listen for notification updates (read status)
            this.notificationsRef.on('child_changed', (snapshot) => {
                const updatedNotification = snapshot.val();
                this.handleNotificationUpdate(updatedNotification);
            });

            // Handle notification removal
            this.notificationsRef.on('child_removed', (snapshot) => {
                const removedNotification = snapshot.val();
                this.handleNotificationRemoval(removedNotification);
            });
        }

        async addNotification(title, message, type = 'info') {
            const notification = {
                id: Date.now(),
                title,
                message,
                type,
                timestamp: Date.now(),
                read: false,
                sessionId: this.sessionId
            };

            // Save to Firebase
            await this.notificationsRef.child(notification.id.toString()).set(notification);
            
            this.notifications.unshift(notification);
            this.updateNotificationCount();
            this.updateNotificationDisplay();
        }

        handleIncomingNotification(notification) {
            // Add notification only if it doesn't exist
            if (!this.notifications.find(n => n.id === notification.id)) {
                this.notifications.unshift(notification);
                this.updateNotificationCount();
                this.updateNotificationDisplay();
                this.showNotificationPopup(notification);
            }
        }

        async markAsRead(id) {
            const notification = this.notifications.find(n => n.id === id);
            if (notification) {
                notification.read = true;
                // Update in Firebase
                await this.notificationsRef.child(id.toString()).update({ read: true });
                this.updateNotificationCount();
                this.updateNotificationDisplay();
            }
        }

        async clearAllNotifications() {
            // Remove all notifications from Firebase
            await this.notificationsRef.remove();
            this.notifications = [];
            this.updateNotificationCount();
            this.updateNotificationDisplay();
            this.container.style.display = 'none';
        }

        showNotificationPopup(notification) {
            // Create and show a temporary popup for new notifications
            const popup = document.createElement('div');
            popup.className = 'notification-popup';
            popup.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: var(--light);
                padding: 15px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                z-index: 9999;
                animation: slideIn 0.3s ease-out;
            `;
            popup.innerHTML = `
                <h4>${notification.title}</h4>
                <p>${notification.message}</p>
            `;

            document.body.appendChild(popup);
            setTimeout(() => {
                popup.style.animation = 'slideOut 0.3s ease-out';
                setTimeout(() => popup.remove(), 300);
            }, 3000);
        }

        setupNotificationSystem() {
            // Create notification container
            const container = document.createElement('div');
            container.className = 'notification-dropdown';
            container.style.cssText = `
                position: absolute;
                top: 60px;
                right: 10px;
                width: 300px;
                background: var(--light);
                border-radius: 10px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                padding: 10px;
                display: none;
                z-index: 1000;
                max-height: 400px;
                overflow-y: auto;
            `;
            document.body.appendChild(container);
            this.container = container;

            // Add click event to bell icon
            this.notificationBell.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleNotifications();
            });

            // Close notifications when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.notification') && !e.target.closest('.notification-dropdown')) {
                    this.container.style.display = 'none';
                }
            });

            // Add initial notifications
            this.addNotification('Welcome', 'System initialized successfully');
        }

        updateNotificationCount() {
            const unreadCount = this.notifications.filter(n => !n.read).length;
            this.notificationCount.textContent = unreadCount;
            this.notificationCount.style.display = unreadCount > 0 ? 'flex' : 'none';
        }

        updateNotificationDisplay() {
            if (!this.container) return;

            this.container.innerHTML = `
                <div class="notification-header" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-bottom: 10px;
                    border-bottom: 1px solid var(--grey);
                    margin-bottom: 10px;
                ">
                    <h3 style="color: var(--dark);">Notifications</h3>
                    <button class="clear-all" style="
                        background: none;
                        border: none;
                        color: var(--blue);
                        cursor: pointer;
                    ">Clear all</button>
                </div>
                ${this.notifications.map(notification => `
                    <div class="notification-item" data-id="${notification.id}" style="
                        padding: 10px;
                        border-radius: 5px;
                        margin-bottom: 8px;
                        background: ${notification.read ? 'var(--grey)' : 'var(--light-blue)'};
                        cursor: pointer;
                        transition: background 0.3s ease;
                    ">
                        <h4 style="color: var(--dark); margin-bottom: 5px;">${notification.title}</h4>
                        <p style="color: var (--dark-grey); font-size: 0.9em;">${notification.message}</p>
                        <small style="color: var(--dark-grey);">${this.formatTime(notification.timestamp)}</small>
                    </div>
                `).join('')}
            `;

            // Add click events to notification items
            this.container.querySelectorAll('.notification-item').forEach(item => {
                item.addEventListener('click', () => {
                    const id = parseInt(item.dataset.id);
                    this.markAsRead(id);
                });
            });

            // Add clear all functionality
            this.container.querySelector('.clear-all').addEventListener('click', () => {
                this.clearAllNotifications();
            });
        }

        toggleNotifications() {
            this.container.style.display = this.container.style.display === 'none' ? 'block' : 'none';
        }

        handleNotificationUpdate(updatedNotification) {
            const notification = this.notifications.find(n => n.id === updatedNotification.id);
            if (notification) {
                notification.read = updatedNotification.read;
                this.updateNotificationCount();
                this.updateNotificationDisplay();
            }
        }

        handleNotificationRemoval(removedNotification) {
            this.notifications = this.notifications.filter(n => n.id !== removedNotification.id);
            this.updateNotificationCount();
            this.updateNotificationDisplay();
        }

        formatTime(date) {
            const now = new Date();
            const diff = now - date;
            const minutes = Math.floor(diff / 60000);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);

            if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
            if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
            if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
            return 'Just now';
        }
    };

    // Initialize the notification system once Firebase is ready
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            if (!window.notificationSystem) {
                window.notificationSystem = new window.KanyadetNotifications.SyncedNotification();
            }
        } catch (error) {
            console.error('Failed to initialize notification system:', error);
        }
    });
}
