const firebaseConfig = {
    apiKey: "AIzaSyA_41WpdMjHJOU5s3gQ9aieIayZRvUoRLE",
    authDomain: "kanyadet-school-admin.firebaseapp.com",
    projectId: "kanyadet-school-admin",
    storageBucket: "kanyadet-school-admin.firebasestorage.app",
    messagingSenderId: "409708360032",
    appId: "1:409708360032:web:a21d63e8cb5fa1ecabee05",
    measurementId: "G-Y4C0ZRRL52"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Configure database rules for development
db.ref('.settings/rules').set({
    ".read": "true",
    ".write": "true",
    "chats": {
        ".read": "true",
        ".write": "true",
        "$messageId": {
            ".validate": "newData.hasChildren(['senderId', 'senderName', 'message', 'timestamp'])"
        }
    },
    "notifications": {
        ".read": "true",
        ".write": "true"
    }
}).then(() => {
    console.log('Database rules updated successfully');
}).catch(error => {
    console.error('Failed to update database rules:', error);
});

// Test connection and permissions
async function testDatabaseAccess() {
    try {
        // Test write access
        const testRef = db.ref('chats').push();
        await testRef.set({
            senderId: 'system',
            senderName: 'System',
            message: 'Testing database access',
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            type: 'test'
        });
        await testRef.remove();
        console.log('Database write test successful');
        
        // Test read access
        const snapshot = await db.ref('chats').limitToLast(1).once('value');
        console.log('Database read test successful');
        
        return true;
    } catch (error) {
        console.error('Database access test failed:', error);
        return false;
    }
}

// Run access test
testDatabaseAccess();