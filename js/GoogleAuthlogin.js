// FirebaseUI config
var uiConfig = {
    signInFlow: 'popup',  // Change to 'redirect' to handle cross-origin issues
    signInSuccessUrl: 'index.html',
    signInOptions: [
        // firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        // firebase.auth.EmailAuthProvider.PROVIDER_ID,
        // firebase.auth.PhoneAuthProvider.PROVIDER_ID,
        // Uncomment the following lines if you want to support additional sign-in providers
       // firebase.auth.FacebookAuthProvider.PROVIDER_ID,
       // firebase.auth.TwitterAuthProvider.PROVIDER_ID,
        // firebase.auth.GithubAuthProvider.PROVIDER_ID,
    ],
    tosUrl: './terms.html',
    callbacks: {
        signInSuccessWithAuthResult: function(authResult, redirectUrl) {
            // User successfully signed in
            return true; // Return false to prevent redirect
        }
    }
};

// Initialize the FirebaseUI Widget using Firebase
var ui = new firebaseui.auth.AuthUI(firebase.auth());

// Handle traditional email/password login
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Redirect to index.html on success
            window.location.href = 'index.html';
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('Login failed: ' + error.message);
        });
});

// Start the UI for other authentication methods
if (document.getElementById('firebaseui-auth-container')) {
    ui.start('#firebaseui-auth-container', uiConfig);
}

// Add auth state listener
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        window.location.href = 'index.html';
    }
});
