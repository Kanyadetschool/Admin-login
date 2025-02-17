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

                // Force add default notifications on initialization
                await this.addDefaultNotifications();
                
                this.setupNotificationSystem();
                this.setupRealtimeSync();
            } catch (error) {
                console.error('Firebase initialization error:', error);
                // Fallback to local storage if Firebase fails
                this.useFallbackStorage();
            }
        }

        async addDefaultNotifications() {
            const defaultMessages = [
                { title: '👋 Welcome!', message: 'Welcome to Kanyadet School Management System', type: 'success' },
                { title: '📚 New Term', message: 'Term 1 2024 has begun', type: 'info' },
                { title: '📅 Important', message: 'Please update your class schedules', type: 'warning' },
                { title: '🔔 Reminder', message: 'Staff meeting every Monday at 8 AM', type: 'info' },
                { title: '💡 Quick Tip', message: 'Click on notifications to mark them as read', type: 'info' }
            ];

            // Clear existing notifications first
            await this.notificationsRef.remove();

            // Add new notifications with proper delays
            for (const message of defaultMessages) {
                const notification = {
                    id: Date.now(),
                    ...message,
                    timestamp: Date.now(),
                    read: false,
                    sessionId: 'system_default_' + Date.now()
                };
                
                try {
                    await this.notificationsRef.push().set(notification);
                    // Add a small delay between notifications
                    await new Promise(resolve => setTimeout(resolve, 300));
                } catch (error) {
                    console.error('Error adding notification:', error);
                }
            }

            console.log('Default notifications added successfully');
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
            // Listen for all changes in notifications node
            this.notificationsRef
                .orderByChild('timestamp')
                .limitToLast(100)
                .on('child_added', (snapshot) => {
                    const notification = snapshot.val();
                    // Accept all notifications regardless of sessionId
                    this.handleIncomingNotification(notification);
                });

            // Also listen for direct pushes to the notifications node
            firebase.database().ref('notifications').on('child_added', (snapshot) => {
                const notification = snapshot.val();
                if (notification && notification.sessionId?.includes('console_')) {
                    this.handleIncomingNotification(notification);
                }
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
            // Prevent duplicate notifications
            if (!this.notifications.some(n => n.id === notification.id)) {
                this.notifications.unshift(notification);
                this.updateNotificationCount();
                this.updateNotificationDisplay();
                this.showNotificationPopup(notification);
                
                // Play notification sound
                this.playNotificationSound();
            }
        }

        playNotificationSound() {
            try {
                // Create audio element once and reuse
                if (!this.audioElement) {
                    this.audioElement = new Audio('notification-sound.mp3');
                    this.audioElement.volume = 0.3;
                }

                // Only play sound if there was a recent user interaction
                if (document.lastInteractionTime && 
                    (Date.now() - document.lastInteractionTime) < 300000) { // 5 minutes
                    this.audioElement.play().catch(error => {
                        console.log('Sound play failed:', error);
                    });
                }
            } catch (error) {
                console.error('Error playing notification sound:', error);
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

            // Add click event to bell icon with sound
            this.notificationBell.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleNotifications();
                // Play a click sound when bell is clicked
                const audio = new Audio('notification-sound.mp3');
                audio.volume = 0.2; // Lower volume for click sound
                audio.play().catch(error => {
                    console.log('Click sound failed:', error);
                });
                // Mark user interaction time
                document.lastInteractionTime = Date.now();
            });

            // Close notifications when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.notification') && !e.target.closest('.notification-dropdown')) {
                    this.container.style.display = 'none';
                }
            });

            // Track user interaction
            const trackInteraction = () => {
                document.lastInteractionTime = Date.now();
            };

            // Add interaction listeners
            ['click', 'touchstart', 'keydown'].forEach(eventType => {
                document.addEventListener(eventType, trackInteraction);
            });

            // Initialize with current time if user is already interactive
            if (document.hasFocus()) {
                trackInteraction();
            }

            // Only load existing notifications from Firebase
            this.loadExistingNotifications();
        }

        async loadExistingNotifications() {
            try {
                // Get the last 20 notifications
                const snapshot = await this.notificationsRef
                    .orderByChild('timestamp')
                    .limitToLast(20)
                    .once('value');
                
                const notifications = [];
                snapshot.forEach(child => {
                    notifications.unshift(child.val());
                });
                
                this.notifications = notifications;
                this.updateNotificationCount();
                this.updateNotificationDisplay();
            } catch (error) {
                console.error('Error loading notifications:', error);
            }
        }

        // Add this method to easily create notifications from anywhere in your code
        static notify(title, message, type = 'info') {
            if (window.notificationSystem) {
                window.notificationSystem.addNotification(title, message, type);
            }
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
                        transition: all 0.3s ease;
                    ">
                        <h4 style="color: var(--dark); margin-bottom: 5px;">${notification.title}</h4>
                        <p class="message-preview" style="
                            color: var(--dark-grey);
                            font-size: 0.9em;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            display: -webkit-box;
                            -webkit-line-clamp: 2;
                            -webkit-box-orient: vertical;
                        ">${notification.message}</p>
                        <p class="message-full" style="
                            display: none;
                            color: var(--dark-grey);
                            font-size: 0.9em;
                            margin-top: 5px;
                            padding: 5px;
                            background: var(--light);
                            border-radius: 4px;
                        ">${notification.message}</p>
                        <small style="color: var(--dark-grey);">${this.formatTime(notification.timestamp)}</small>
                    </div>
                `).join('')}
            `;

            // Add click events to notification items
            this.container.querySelectorAll('.notification-item').forEach(item => {
                const preview = item.querySelector('.message-preview');
                const fullMessage = item.querySelector('.message-full');
                
                item.addEventListener('click', () => {
                    const id = parseInt(item.dataset.id);
                    this.markAsRead(id);
                    
                    // Toggle message visibility
                    if (fullMessage.style.display === 'none') {
                        preview.style.display = 'none';
                        fullMessage.style.display = 'block';
                        item.style.backgroundColor = 'var(--light)';
                    } else {
                        preview.style.display = '-webkit-box';
                        fullMessage.style.display = 'none';
                        item.style.backgroundColor = 'var(--grey)';
                    }
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

// Example usage in other files:
KanyadetNotifications.SyncedNotification.notify(
    'New Student Added', 
    'Student John Doe has been registered successfully',
    'success'
);

// Or for an error notification
KanyadetNotifications.SyncedNotification.notify(
    'Error', 
    'Failed to update student record',
    'error'
);
