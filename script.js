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
    const mainContent = document.getElementById('content');

    // --- General Auth Listener ---
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is logged in
            if (window.location.pathname.endsWith('sign-up.html')) {
                window.location.href = 'index.html';
                return; // Stop execution here
            }

            userEmailSpan.textContent = user.email;

            if (user.email === adminEmail) {
                // User is the admin
                if (adminLinkContainer) {
                    adminLinkContainer.style.display = 'list-item';
                }
                if (window.location.pathname.endsWith('admin.html')) {
                    // Only load the admin panel logic on the admin page
                    loadAdminPanel();
                } else if (mainContent) {
                    // If an admin is on the index page, load regular dashboard
                    const currentHash = window.location.hash || '#dashboard';
                    loadPage(currentHash);
                }
            } else {
                // User is a regular student
                if (adminLinkContainer) {
                    adminLinkContainer.style.display = 'none';
                }
                if (mainContent) {
                    // Only load student content on the index page
                    const currentHash = window.location.hash || '#dashboard';
                    loadPage(currentHash);
                }
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

    // --- Dynamic Page Loading Functions ---
    async function loadPage(page) {
        // Reset active class on nav links
        navLinks.forEach(link => link.classList.remove('active'));
        const activeLink = document.querySelector(`.nav-link[href="${page}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        if (!mainContent) return; // Exit if not on index.html
        mainContent.innerHTML = ''; // Clear content

        switch (page) {
            case '#dashboard':
                await renderDashboard();
                break;
            case '#quests':
                await renderQuests();
                break;
            case '#leaderboard':
                await renderLeaderboard();
                break;
            case '#profile':
                await renderProfile();
                break;
        }
    }

    async function renderDashboard() {
        // ... (Your existing renderDashboard function) ...
    }

    async function renderQuests() {
        // ... (Your existing renderQuests function) ...
    }

    async function renderLeaderboard() {
        // ... (Your existing renderLeaderboard function) ...
    }

    async function renderProfile() {
        // ... (Your existing renderProfile function) ...
    }

    // --- Admin Panel Logic (for admin.html) ---
    function loadAdminPanel() {
        const addQuestForm = document.getElementById('add-quest-form');
        const addBadgeForm = document.getElementById('add-badge-form');
        const questList = document.getElementById('quest-list');
        const badgeList = document.getElementById('badge-list');

        // Add Quest
        if (addQuestForm) {
            addQuestForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = addQuestForm['quest-name'].value;
                const points = parseInt(addQuestForm['quest-points'].value);
                const type = addQuestForm['quest-type'].value;
                const description = addQuestForm['quest-description'].value;
                await db.collection('quests').add({ name, points, type, description });
                alert('Quest added!');
                addQuestForm.reset();
                displayQuests();
            });
        }

        // Add Badge
        if (addBadgeForm) {
            addBadgeForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = addBadgeForm['badge-name'].value;
                const description = addBadgeForm['badge-description'].value;
                await db.collection('badges').add({ name, description });
                alert('Badge added!');
                addBadgeForm.reset();
                displayBadges();
            });
        }

        // Display Quests
        async function displayQuests() {
            if (questList) {
                questList.innerHTML = '';
                const snapshot = await db.collection('quests').get();
                snapshot.forEach(doc => {
                    const quest = doc.data();
                    const li = document.createElement('li');
                    li.innerHTML = `${quest.name} (+${quest.points} pts) <button class="delete-btn" data-id="${doc.id}">Delete</button>`;
                    questList.appendChild(li);
                });
            }
        }

        // Display Badges
        async function displayBadges() {
            if (badgeList) {
                badgeList.innerHTML = '';
                const snapshot = await db.collection('badges').get();
                snapshot.forEach(doc => {
                    const badge = doc.data();
                    const li = document.createElement('li');
                    li.innerHTML = `${badge.name} <button class="delete-btn" data-id="${doc.id}">Delete</button>`;
                    badgeList.appendChild(li);
                });
            }
        }

        // Delete functionality
        document.addEventListener('click', async (e) => {
            if (e.target.classList.contains('delete-btn')) {
                const docId = e.target.dataset.id;
                const collectionName = e.target.closest('ul').id === 'quest-list' ? 'quests' : 'badges';
                await db.collection(collectionName).doc(docId).delete();
                alert('Item deleted!');
                if (collectionName === 'quests') {
                    displayQuests();
                } else {
                    displayBadges();
                }
            }
        });

        // Initial calls
        displayQuests();
        displayBadges();
    }
});
