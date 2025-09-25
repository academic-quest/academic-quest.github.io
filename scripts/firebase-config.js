// Ensure this config EXACTLY matches your Firebase project settings
const firebaseConfig = {
    apiKey: "AIzaSyB-vArRoYuCqzIWT_b7xPV1Lt6Ev4T3Bsc",
    authDomain: "academic-quest.firebaseapp.com",
    projectId: "academic-quest",
    storageBucket: "academic-quest.appspot.com",
    messagingSenderId: "44540247560",
    appId: "1:44540247560:web:96e1d5bc34baf97e3b1bbd"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Export auth and db services for other modules to use
const auth = firebase.auth();
const db = firebase.firestore();
const adminEmail = "admin@admin.com";
