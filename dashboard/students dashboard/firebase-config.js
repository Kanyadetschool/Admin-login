const firebaseConfig = {
    apiKey: "AIzaSyBuyQzOEh5Wg6W-C_p2c7M7V1T9wr3TlwU",
    authDomain: "kanyadet-school.firebaseapp.com",
    databaseURL: "https://kanyadet-school-default-rtdb.firebaseio.com",
    projectId: "kanyadet-school",
    storageBucket: "kanyadet-school.appspot.com",
    messagingSenderId: "224031504744",
    appId: "1:224031504744:web:8e71e83269abf49ecdfedd",
    measurementId: "G-8F80E3SNG5"
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
