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
    if (user) {
        // User is logged in
        if (window.location.pathname.endsWith('sign-up.html')) {
            window.location.href = 'index.html';
            return;
        }

        const userEmailSpan = document.getElementById('user-email');
        if (userEmailSpan) {
            userEmailSpan.textContent = user.email;
        }

        const adminLinkContainer = document.getElementById('admin-link-container');
        if (user.email === adminEmail) {
            // User is the admin
            if (adminLinkContainer) {
                adminLinkContainer.style.display = 'list-item';
            }
        } else {
            // User is a regular student
            if (adminLinkContainer) {
                adminLinkContainer.style.display = 'none';
            }
        }

        // Call student-specific logic ONLY on the index page
        if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
            window.initStudentDashboard(user);
        }

    } else {
        // No user is logged in, redirect to login page
        window.location.href = 'sign-up.html';
    }
});


// --- Separate DOMContentLoaded for specific page logic ---
document.addEventListener('DOMContentLoaded', () => {

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
            const passwordConfirm = signupForm['signup-password-confirm'].value;
            const password = signupForm['signup-password'].value;
            if (password !== passwordConfirm) {
                alert('Passwords do not match!');
                return;
            }

            const email = signupForm['signup-email'].value;
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
                    level: 1,
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

    // --- Logout Logic ---
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

// --- Admin Panel Logic (for admin.html) ---
function loadAdminPanel() {
    const addQuestForm = document.getElementById('add-quest-form');
    const addBadgeForm = document.getElementById('add-badge-form');
    const questList = document.getElementById('quest-list');
    const badgeList = document.getElementById('badge-list');

    if (!addQuestForm || !addBadgeForm || !questList || !badgeList) {
        return;
    }

    // Add Quest
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

    // Add Badge
    addBadgeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = addBadgeForm['badge-name'].value;
        const description = addBadgeForm['badge-description'].value;
        await db.collection('badges').add({ name, description });
        alert('Badge added!');
        addBadgeForm.reset();
        displayBadges();
    });

    // Display Quests
    async function displayQuests() {
        questList.innerHTML = '';
        const snapshot = await db.collection('quests').get();
        snapshot.forEach(doc => {
            const quest = doc.data();
            const li = document.createElement('li');
            li.innerHTML = `
                ${quest.name} (+${quest.points} pts)
                <button class="edit-btn" data-id="${doc.id}">Edit</button>
                <button class="delete-btn" data-id="${doc.id}">Delete</button>
            `;
            questList.appendChild(li);
        });
    }

    // Display Badges
    async function displayBadges() {
        badgeList.innerHTML = '';
        const snapshot = await db.collection('badges').get();
        snapshot.forEach(doc => {
            const badge = doc.data();
            const li = document.createElement('li');
            li.innerHTML = `${badge.name} <button class="delete-btn" data-id="${doc.id}">Delete</button>`;
            badgeList.appendChild(li);
        });
    }

    // Delete and Edit functionality
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
        } else if (e.target.classList.contains('edit-btn')) {
            const docId = e.target.dataset.id;
            const newName = prompt("Enter new quest name:");
            const newPoints = prompt("Enter new points:");
            const newType = prompt("Enter new type:");
            const newDescription = prompt("Enter new description:");

            if (newName !== null && newPoints !== null && newType !== null && newDescription !== null) {
                await db.collection('quests').doc(docId).update({
                    name: newName,
                    points: parseInt(newPoints),
                    type: newType,
                    description: newDescription
                });
                alert('Quest updated successfully!');
                displayQuests();
            } else {
                alert('Update cancelled.');
            }
        }
    });

    // Initial calls
    displayQuests();
    displayBadges();
}
