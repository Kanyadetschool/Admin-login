var fireBase = fireBase || firebase;
var hasInit = false;
var config = {
    apiKey: "AIzaSyA_41WpdMjHJOU5s3gQ9aieIayZRvUoRLE",
    authDomain: "kanyadet-school-admin.firebaseapp.com",
    projectId: "kanyadet-school-admin",
    storageBucket: "kanyadet-school-admin.firebasestorage.app",
    messagingSenderId: "409708360032",
    appId: "1:409708360032:web:a21d63e8cb5fa1ecabee05",
    measurementId: "G-Y4C0ZRRL52"
};

if (!firebase.apps.length) {
    const firebaseConfig = {
        apiKey: "AIzaSyA_41WpdMjHJOU5s3gQ9aieIayZRvUoRLE",
        authDomain: "kanyadet-school-admin.firebaseapp.com",
        projectId: "kanyadet-school-admin",
        storageBucket: "kanyadet-school-admin.firebasestorage.app",
        messagingSenderId: "409708360032",
        appId: "1:409708360032:web:a21d63e8cb5fa1ecabee05",
        measurementId: "G-Y4C0ZRRL52"
    };
    firebase.initializeApp(firebaseConfig);
     // Now you can call firebase.auth()
  const auth = firebase.auth()
} else {
    firebase.app(); // if already initialized, use that one
}

