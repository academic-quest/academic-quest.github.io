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

// --- General Auth Listener (Handles all pages) ---
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
        
        // Show/hide admin link
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

// --- Logout Logic (for all pages with a logout button) ---
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
});
