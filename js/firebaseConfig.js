import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDuoaOZvCSZp_d2eTfUjBIZtoIFEKysgJ8",
  authDomain: "admin-kanyadet.firebaseapp.com",
  projectId: "admin-kanyadet",
  storageBucket: "admin-kanyadet.firebasestorage.app",
  messagingSenderId: "920056467446",
  appId: "1:920056467446:web:eb416e8125a21463b501d7",
  measurementId: "G-GL27FQHVPY"
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
