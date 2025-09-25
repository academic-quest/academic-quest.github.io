// Your Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyB-vArRoYuCqzIWT_b7xPV1Lt6Ev4T3Bsc",
    authDomain: "academic-quest.firebaseapp.com",
    projectId: "academic-quest",
    storageBucket: "academic-quest.firebasestorage.app",
    messagingSenderId: "44540247560",
    appId: "1:44540247560:web:96e1d5bc34baf97e3b1bbd"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();
const adminEmail = "admin@admin.com";

// Wait for the DOM to be fully loaded before running any scripts
document.addEventListener('DOMContentLoaded', () => {

    // --- General Authentication and Redirection Listener ---
    auth.onAuthStateChanged(user => {
        const currentPath = window.location.pathname;

        if (user) {
            // ---- USER IS LOGGED IN ----
            // If they are on the sign-up page, redirect them to the dashboard
            if (currentPath.includes('sign-up.html')) {
                window.location.href = 'index.html';
            }

            // Show the admin panel link if the user is an admin
            const adminLinkContainer = document.getElementById('admin-link-container');
            if (adminLinkContainer) {
                adminLinkContainer.style.display = (user.email === adminEmail) ? 'list-item' : 'none';
            }
            // Display user email
            const userEmailSpan = document.getElementById('user-email');
            if (userEmailSpan) {
                userEmailSpan.textContent = user.email;
            }

        } else {
            // ---- USER IS NOT LOGGED IN ----
            // If they are NOT on the sign-up or admin page, redirect them to sign-up.
            if (!currentPath.includes('sign-up.html') && !currentPath.includes('admin.html')) {
                window.location.href = 'sign-up.html';
            }
        }
    });

    // --- Event Listeners for sign-up.html page ONLY ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = loginForm['login-email'].value;
            const password = loginForm['login-password'].value;
            auth.signInWithEmailAndPassword(email, password)
                .then(() => { window.location.href = 'index.html'; })
                .catch((error) => { alert(error.message); });
        });
    }

    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = signupForm['signup-name'].value;
            const universityId = signupForm['signup-id'].value;
            const email = signupForm['signup-email'].value;
            const password = signupForm['signup-password'].value;
            const passwordConfirm = signupForm['signup-password-confirm'].value;
            const courses = signupForm['signup-courses'].value.split(',').map(c => c.trim());
            const year = signupForm['student-year'].value;

            if (password !== passwordConfirm) {
                return alert('Passwords do not match!');
            }

            auth.createUserWithEmailAndPassword(email, password)
                .then((cred) => {
                    return db.collection('users').doc(cred.user.uid).set({
                        name, universityId, email, courses, year,
                        points: 0,
                        badges: [],
                        completedQuests: [] // Correct field name
                    });
                })
                .then(() => {
                    window.location.href = 'index.html';
                })
                .catch((error) => {
                    alert(`Signup failed: ${error.message}`);
                });
        });
    }

    // --- Page Toggling on sign-up.html ---
    const showSignupLink = document.getElementById('show-signup-link');
    const showLoginLink = document.getElementById('show-login-link');
    if (showSignupLink && showLoginLink) {
        showSignupLink.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('login-section').style.display = 'none';
            document.getElementById('signup-section').style.display = 'block';
        });

        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('signup-section').style.display = 'none';
            document.getElementById('login-section').style.display = 'block';
        });
    }
    
    // --- Logout Button Functionality (for all pages) ---
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.signOut().then(() => {
                window.location.href = 'sign-up.html';
            });
        });
    }
});
