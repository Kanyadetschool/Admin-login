class ChatSystem {
    constructor() {
        this.initializeChat();
    }

    async initializeChat() {
        try {
            // Wait for Firebase to be ready
            await this.waitForFirebase();
            
            // Initialize Firebase references
            this.chatRef = firebase.database().ref('chats');
            
            // Set up user
            this.setupUser();
            
            // Create UI
            this.setupChat();
            
            // Test connection
            await this.testDatabaseConnection();
            
            console.log('Chat system initialized successfully');
        } catch (error) {
            console.error('Chat initialization error:', error);
        }
    }

    waitForFirebase() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const checkFirebase = () => {
                attempts++;
                if (window.firebase && window.firebase.database) {
                    console.log('Firebase is ready');
                    resolve();
                } else if (attempts > 50) { // 5 seconds timeout
                    reject(new Error('Firebase not available'));
                } else {
                    setTimeout(checkFirebase, 100);
                }
            };
            checkFirebase();
        });
    }

    setupUser() {
        const userId = localStorage.getItem('userId') || `user_${Date.now()}`;
        const userName = localStorage.getItem('userName') || `User_${userId.slice(-4)}`;
        
        this.currentUser = { id: userId, name: userName };
        localStorage.setItem('userId', userId);
        localStorage.setItem('userName', userName);
        
        console.log('User configured:', this.currentUser);
    }

    async testDatabaseConnection() {
        try {
            const testRef = this.chatRef.push();
            await testRef.set({
                type: 'connection_test',
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
            await testRef.remove();
            console.log('Database connection test successful');
        } catch (error) {
            console.error('Database connection test failed:', error);
            throw error;
        }
    }

    setupChat() {
        // Create chat UI
        const chatContainer = document.createElement('div');
        chatContainer.className = 'chat-container';
        chatContainer.innerHTML = `
            <div class="chat-toggle">
                <i class='bx bxs-message-dots'></i>
                <span class="unread-count"></span>
            </div>
            <div class="chat-box">
                <div class="chat-header">
                    <h3>Messages</h3>
                    <button class="minimize-chat">−</button>
                </div>
                <div class="chat-messages"></div>
                <div class="chat-input">
                    <input type="text" placeholder="Type a message...">
                    <button><i class='bx bxs-send'></i></button>
                </div>
            </div>
        `;
        document.body.appendChild(chatContainer);

        // Add styles
        const styles = document.createElement('style');
        styles.textContent = `
            .chat-container {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 1000;
                font-family: var(--lato);
            }

            .chat-toggle {
                background: var(--blue);
                color: white;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                font-size: 24px;
                position: relative;
            }

            .unread-count {
                position: absolute;
                top: -5px;
                right: -5px;
                background: var(--red);
                color: white;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                font-size: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                display: none;
            }

            .chat-box {
                position: absolute;
                bottom: 60px;
                right: 0;
                width: 300px;
                height: 400px;
                background: var(--light);
                border-radius: 10px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                display: none;
                overflow: hidden;
            }

            .chat-header {
                padding: 10px;
                background: var(--blue);
                color: white;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .chat-messages {
                height: 310px;
                padding: 10px;
                overflow-y: auto;
            }

            .message {
                margin-bottom: 10px;
                max-width: 80%;
                padding: 8px 12px;
                border-radius: 15px;
                position: relative;
            }

            .message.sent {
                background: var(--blue);
                color: white;
                margin-left: auto;
                border-bottom-right-radius: 5px;
            }

            .message.received {
                background: var(--grey);
                color: var(--dark);
                margin-right: auto;
                border-bottom-left-radius: 5px;
            }

            .message .sender {
                font-size: 0.8em;
                opacity: 0.7;
                margin-bottom: 3px;
            }

            .chat-input {
                padding: 10px;
                display: flex;
                gap: 10px;
                border-top: 1px solid var(--grey);
            }

            .chat-input input {
                flex: 1;
                padding: 8px;
                border: 1px solid var(--grey);
                border-radius: 20px;
                outline: none;
            }

            .chat-input button {
                background: var(--blue);
                color: white;
                border: none;
                border-radius: 50%;
                width: 35px;
                height: 35px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            }
        `;
        document.head.appendChild(styles);

        // Add event listeners
        this.bindEvents(chatContainer);
        this.listenToMessages();
    }

    bindEvents(container) {
        const toggle = container.querySelector('.chat-toggle');
        const chatBox = container.querySelector('.chat-box');
        const input = container.querySelector('.chat-input input');
        const sendBtn = container.querySelector('.chat-input button');
        const minimizeBtn = container.querySelector('.minimize-chat');

        toggle.addEventListener('click', () => {
            chatBox.style.display = chatBox.style.display === 'none' ? 'block' : 'none';
            container.querySelector('.unread-count').style.display = 'none';
        });

        minimizeBtn.addEventListener('click', () => {
            chatBox.style.display = 'none';
        });

        const sendMessage = () => {
            const message = input.value.trim();
            if (message) {
                this.sendMessage(message);
                input.value = '';
            }
        };

        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    async sendMessage(message) {
        try {
            const messageData = {
                senderId: this.currentUser.id,
                senderName: this.currentUser.name,
                message: message,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            };

            await this.chatRef.push().set(messageData);
            console.log('Message sent successfully:', messageData);
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message. Please try again.');
        }
    }

    listenToMessages() {
        const messagesDiv = document.querySelector('.chat-messages');
        const chatBox = document.querySelector('.chat-box');
        const unreadCount = document.querySelector('.unread-count');
        let unreadMessages = 0;

        this.chatRef.on('child_added', (snapshot) => {
            try {
                const message = snapshot.val();
                
                // Ignore test messages
                if (message.type === 'connection_test') return;

                console.log('New message received:', message);

                const messageElement = document.createElement('div');
                messageElement.className = `message ${message.senderId === this.currentUser.id ? 'sent' : 'received'}`;
                messageElement.innerHTML = `
                    <div class="sender">${message.senderName}</div>
                    <div class="text">${message.message}</div>
                    <div class="time">${this.formatTime(message.timestamp)}</div>
                `;
                messagesDiv.appendChild(messageElement);
                messagesDiv.scrollTop = messagesDiv.scrollHeight;

                // Update unread count if chat is minimized
                if (chatBox.style.display === 'none' && message.senderId !== this.currentUser.id) {
                    unreadMessages++;
                    unreadCount.textContent = unreadMessages;
                    unreadCount.style.display = 'flex';
                }
            } catch (error) {
                console.error('Error processing message:', error);
            }
        }, (error) => {
            console.error('Error listening to messages:', error);
        });
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}

// Initialize chat system with error handling
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.chatSystem = new ChatSystem();
        console.log('Chat system creation initiated');
    } catch (error) {
        console.error('Failed to create chat system:', error);
    }
});

// Add this to test the chat system
window.testChat = async () => {
    try {
        await window.chatSystem.sendMessage('Test message at ' + new Date().toLocaleTimeString());
        console.log('Test message sent successfully');
    } catch (error) {
        console.error('Test message failed:', error);
    }
};
