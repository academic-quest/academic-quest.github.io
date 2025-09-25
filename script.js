
// Ensure this config EXACTLY matches your Firebase project settings
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

// --- GLOBAL AUTHENTICATION & REDIRECTION ---
auth.onAuthStateChanged(user => {
    const onAuthPage = window.location.pathname.includes('sign-up.html');
    const onAdminPage = window.location.pathname.includes('admin.html');

    if (user) { // User is LOGGED IN
        if (onAuthPage) {
            window.location.href = 'index.html'; // Redirect from login to dashboard
        }
    } else { // User is LOGGED OUT
        if (!onAuthPage && !onAdminPage) {
            window.location.href = 'sign-up.html'; // Redirect from app to login
        }
    }
});

// --- AUTH PAGE LOGIC (runs only on sign-up.html) ---
document.addEventListener('DOMContentLoaded', () => {
    if (document.body.classList.contains('auth-page')) {
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = loginForm['login-email'].value;
            const password = loginForm['login-password'].value;
            auth.signInWithEmailAndPassword(email, password).catch(err => alert(err.message));
        });

        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = signupForm['signup-name'].value;
            const universityId = signupForm['signup-id'].value;
            const email = signupForm['signup-email'].value;
            const password = signupForm['signup-password'].value;
            if (password !== signupForm['signup-password-confirm'].value) {
                return alert('Passwords do not match!');
            }
            auth.createUserWithEmailAndPassword(email, password)
                .then(cred => {
                    return db.collection('users').doc(cred.user.uid).set({
                        name: name,
                        universityId: universityId,
                        email: email,
                        points: 0,
                        year: "Freshman",
                        completedQuests: [],
                        badges: []
                    });
                })
                .catch(err => alert(err.message));
        });
    }
});
