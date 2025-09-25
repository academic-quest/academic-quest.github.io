// Ensure your Firebase config here EXACTLY matches your project settings
const firebaseConfig = {
    apiKey: "AIzaSyB-vArRoYuCqzIWT_b7xPV1Lt6Ev4T3Bsc",
    authDomain: "academic-quest.firebaseapp.com",
    projectId: "academic-quest",
    storageBucket: "academic-quest.appspot.com",
    messagingSenderId: "44540247560",
    appId: "1:44540247560:web:96e1d5bc34baf97e3b1bbd"
};

// --- INITIALIZATION ---
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();
const adminEmail = "admin@admin.com";

// --- GLOBAL AUTHENTICATION LISTENER ---
// This one function controls the entire application state.
auth.onAuthStateChanged(user => {
    const currentPath = window.location.pathname;

    if (user) {
        // --- USER IS LOGGED IN ---
        if (currentPath.includes('sign-up.html')) {
            window.location.href = 'index.html'; // If on signup page, go to app
        }
    } else {
        // --- USER IS LOGGED OUT ---
        if (!currentPath.includes('sign-up.html') && !currentPath.includes('admin.html')) {
            window.location.href = 'sign-up.html'; // If not on an auth page, go to signup
        }
    }
});

// --- AUTH PAGE LOGIC (runs only on sign-up.html) ---
if (document.getElementById('login-form')) {
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = loginForm['login-email'].value;
        const password = loginForm['login-password'].value;
        auth.signInWithEmailAndPassword(email, password).catch(err => alert(err.message));
    });
}
