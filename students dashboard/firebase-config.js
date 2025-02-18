const firebaseConfig = {
    apiKey: "AIzaSyDuoaOZvCSZp_d2eTfUjBIZtoIFEKysgJ8",
    authDomain: "admin-kanyadet.firebaseapp.com",
    projectId: "admin-kanyadet",
    storageBucket: "admin-kanyadet.firebasestorage.app",
    messagingSenderId: "920056467446",
    appId: "1:920056467446:web:eb416e8125a21463b501d7",
    measurementId: "G-GL27FQHVPY"
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