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

document.addEventListener('DOMContentLoaded', () => {

    // --- Common Elements for both pages ---
    const userEmailSpan = document.getElementById('user-email');
    const adminLinkContainer = document.getElementById('admin-link-container');

    // --- General Auth Listener ---
    auth.onAuthStateChanged(user => {
auth.onAuthStateChanged(user => {
    if (user) {
        // User is logged in
        if (window.location.pathname.endsWith('sign-up.html')) {
            window.location.href = 'index.html';
        }

        // Handle Admin vs. Student logic
        if (user.email === adminEmail) {
            if (adminLinkContainer) {
                adminLinkContainer.style.display = 'list-item';
            }
            // If the user is on the admin page, load the admin panel
            if (window.location.pathname.endsWith('admin.html')) {
                loadAdminPanel();
            } else {
                // If admin is on a student page, load student content
                const currentHash = window.location.hash || '#dashboard';
                loadPage(currentHash);
            }
        } else {
            // User is a regular student
            if (adminLinkContainer) {
                adminLinkContainer.style.display = 'none';
            }
            // Load student page content
            const currentHash = window.location.hash || '#dashboard';
            loadPage(currentHash);
        }

    } else {
        // No user is logged in
        if (!window.location.pathname.endsWith('sign-up.html')) {
            window.location.href = 'sign-up.html';
        }
    }
});


    // --- Login and Sign-up Page Logic (sign-up.html) ---
    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');
    const signupSection = document.getElementById('signup-section');
    const loginSection = document.getElementById('login-section');
    const showSignupLink = document.getElementById('show-signup-link');
    const showLoginLink = document.getElementById('show-login-link');

    if (showSignupLink) {
        showSignupLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginSection.style.display = 'none';
            signupSection.style.display = 'block';
        });
    }

    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            signupSection.style.display = 'none';
            loginSection.style.display = 'block';
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = signupForm['signup-email'].value;
            const password = signupForm['signup-password'].value;
            const name = signupForm['signup-name'].value;
            const id = signupForm['signup-id'].value;
            const courses = signupForm['signup-courses'].value.split(',').map(c => c.trim());
            const year = signupForm['student-year'].value;

            try {
                const res = await auth.createUserWithEmailAndPassword(email, password);
                await db.collection('users').doc(res.user.uid).set({
                    name: name,
                    universityId: id,
                    email: email,
                    courses: courses,
                    year: year,
                    points: 0,
                    badges: [],
                    questsCompleted: []
                });
                alert('Account created successfully! Redirecting to dashboard...');
                window.location.href = 'index.html';
            } catch (error) {
                alert(error.message);
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm['login-email'].value;
            const password = loginForm['login-password'].value;
            try {
                await auth.signInWithEmailAndPassword(email, password);
                window.location.href = 'index.html';
            } catch (error) {
                alert(error.message);
            }
        });
    }

    // --- Index/Admin Page Logout Logic ---
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

    // --- Dynamic Page Loading Logic (index.html) ---
    const mainContent = document.getElementById('content');
    const navLinks = document.querySelectorAll('.nav-link');

    if (mainContent) {
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = e.target.getAttribute('href');
                history.pushState(null, '', target);
                loadPage(target);
            });
        });
    }

async function loadPage(page) {
        // ... (Your loadPage function remains the same)
        // ... (All your render functions remain the same)
        // ... (All your admin panel functions remain the same)
    }
