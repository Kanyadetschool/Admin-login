(function () {
    // Initialize Firebase (Make sure to use your actual Firebase configuration here)
    const firebaseConfig = {
        apiKey: "AIzaSyDuoaOZvCSZp_d2eTfUjBIZtoIFEKysgJ8",
        authDomain: "admin-kanyadet.firebaseapp.com",
        projectId: "admin-kanyadet",
        storageBucket: "admin-kanyadet.firebasestorage.app",
        messagingSenderId: "920056467446",
        appId: "1:920056467446:web:eb416e8125a21463b501d7",
        measurementId: "G-GL27FQHVPY"
    };

    // Initialize Firebase if not already initialized
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    const auth = firebase.auth();

    // Ensure persistence to LOCAL
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(() => {
            console.log("Persistence set to LOCAL");
        })
        .catch((error) => {
            console.error("Error setting persistence:", error);
        });

    // Check auth state and redirect if necessary
    auth.onAuthStateChanged((user) => {
        if (!user) {
            // If no user is signed in, redirect to login page
            window.location.replace("https://admin-kanyadet.web.app/GoogleAuthlogin.html");
        } else {
            // If user is signed in, proceed as usual (optional: you can handle user data here)
            console.log("User is signed in:", user);
        }
    });
})();
