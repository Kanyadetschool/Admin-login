var fireBase = fireBase || firebase;
var hasInit = false;
var config = {
  apiKey: "AIzaSyDuoaOZvCSZp_d2eTfUjBIZtoIFEKysgJ8",
  authDomain: "admin-kanyadet.firebaseapp.com",
  projectId: "admin-kanyadet",
  storageBucket: "admin-kanyadet.firebasestorage.app",
  messagingSenderId: "920056467446",
  appId: "1:920056467446:web:eb416e8125a21463b501d7",
  measurementId: "G-GL27FQHVPY"
};

if (!firebase.apps.length) {
    const firebaseConfig = {
        apiKey: "AIzaSyDuoaOZvCSZp_d2eTfUjBIZtoIFEKysgJ8",
        authDomain: "admin-kanyadet.firebaseapp.com",
        projectId: "admin-kanyadet",
        storageBucket: "admin-kanyadet.firebasestorage.app",
        messagingSenderId: "920056467446",
        appId: "1:920056467446:web:eb416e8125a21463b501d7",
        measurementId: "G-GL27FQHVPY"
    };
    firebase.initializeApp(firebaseConfig);
} else {
    firebase.app(); // if already initialized, use that one
}
