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
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const adminEmail = "admin@admin.com";

// --- General Authentication and Redirection Listener ---
auth.onAuthStateChanged(user => {
    const currentPath = window.location.pathname;

    if (user) {
        // User is logged in
        if (currentPath.endsWith('sign-up.html')) {
            window.location.href = 'index.html';
        }

        const userEmailSpan = document.getElementById('user-email');
        if (userEmailSpan) {
            userEmailSpan.textContent = user.email;
        }

        const adminLinkContainer = document.getElementById('admin-link-container');
        if (adminLinkContainer) {
            if (user.email === adminEmail) {
                adminLinkContainer.style.display = 'list-item';
            } else {
                adminLinkContainer.style.display = 'none';
            }
        }
    } else {
        // No user logged in, redirect to login page if not already there
        if (!currentPath.endsWith('sign-up.html')) {
            window.location.href = 'sign-up.html';
        }
    }
});

// --- Logout Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logout-btn');
    const adminLogoutBtn = document.getElementById('admin-logout-btn');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.signOut().then(() => {
                window.location.href = 'sign-up.html';
            });
        });
    }

    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', () => {
            auth.signOut().then(() => {
                window.location.href = 'sign-up.html';
            });
        });
    }

    // --- Login and Signup Form Logic ---
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const showLoginLink = document.getElementById('show-login-link');
    const showSignupLink = document.getElementById('show-signup-link');
    const loginSection = document.getElementById('login-section');
    const signupSection = document.getElementById('signup-section');

    if (showLoginLink && showSignupLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginSection.style.display = 'block';
            signupSection.style.display = 'none';
        });

        showSignupLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginSection.style.display = 'none';
            signupSection.style.display = 'block';
        });
    }
    
    // Handle Login Form Submission
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = loginForm['login-email'].value;
            const password = loginForm['login-password'].value;
            
            auth.signInWithEmailAndPassword(email, password)
                .then((cred) => {
                    console.log('User logged in successfully:', cred.user);
                    window.location.href = 'index.html';
                })
                .catch((error) => {
                    console.error('Login Error:', error);
                    alert(`Login failed: ${error.message}`);
                });
        });
    }
    
// Find this event listener and replace it
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
            alert('Passwords do not match!');
            return;
        }

        auth.createUserWithEmailAndPassword(email, password)
            .then((cred) => {
                // This creates the user's profile in the database
                return db.collection('users').doc(cred.user.uid).set({
                    name: name,
                    universityId: universityId,
                    email: email,
                    courses: courses,
                    year: year,
                    points: 0,
                    badges: [],
                    completedQuests: [] // <-- CORRECTED FIELD NAME
                });
            })
            .then(() => {
                alert('Account created successfully!');
                window.location.href = 'index.html';
            })
            .catch((error) => {
                console.error('Signup Error:', error);
                alert(`Signup failed: ${error.message}`);
            });
    });
}
