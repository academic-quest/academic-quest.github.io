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
    // Check if the user is logged in
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
        
        // --- Admin Panel Logic (Runs only on admin.html) ---
        if (window.location.pathname.endsWith('admin.html') && user.email === adminEmail) {
            loadAdminPanel();
        }

    } else {
        // No user is logged in
        if (!window.location.pathname.endsWith('sign-up.html')) {
            window.location.href = 'sign-up.html';
        }
        
        // If on the admin page without a logged-in user, redirect
        if (window.location.pathname.endsWith('admin.html')) {
            window.location.href = 'sign-up.html';
        }
    }
});

// --- Separate DOMContentLoaded for specific page logic ---
document.addEventListener('DOMContentLoaded', () => {
    const mainContent = document.getElementById('content');

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

        // Load the initial page based on the URL hash
        const currentHash = window.location.hash || '#dashboard';
        loadPage(currentHash);
    }

    // --- Dynamic Page Loading Functions ---
    async function loadPage(page) {
        // ... (Your loadPage function remains the same)
        if (!mainContent) return;
        mainContent.innerHTML = '';

        navLinks.forEach(link => link.classList.remove('active'));
        const activeLink = document.querySelector(`.nav-link[href="${page}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

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
        const user = auth.currentUser;
        if (!user) return;
        const userDoc = await db.collection('users').doc(user.uid).get();
        const userData = userDoc.data();
        const dashboardHtml = `
            <div class="page-section">
                <h2>Welcome, ${userData.name}!</h2>
                <p>Your Current Points: <strong>${userData.points}</strong></p>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${(userData.points / 1000) * 100}%;"></div>
                </div>
                <p><strong>Academic Year:</strong> ${userData.year}</p>
            </div>
            <div class="page-section" id="current-quests">
                <h2>Current Quests</h2>
            </div>
            <div class="page-section" id="top-leaderboard">
                <h2>Top 5 Leaderboard</h2>
            </div>
        `;
        mainContent.innerHTML = dashboardHtml;
        const questsSnapshot = await db.collection('quests').get();
        let questsHtml = '<ul>';
        questsSnapshot.forEach(doc => {
            const quest = doc.data();
            questsHtml += `<li>${quest.name} (+${quest.points} pts) - ${quest.description}</li>`;
        });
        questsHtml += '</ul>';
        const currentQuestsEl = document.getElementById('current-quests');
        if (currentQuestsEl) {
            currentQuestsEl.innerHTML += questsHtml;
        }
        const leaderboardSnapshot = await db.collection('users').orderBy('points', 'desc').limit(5).get();
        let leaderboardHtml = '<table><thead><tr><th>Rank</th><th>Name</th><th>Points</th></tr></thead><tbody>';
        let rank = 1;
        leaderboardSnapshot.forEach(doc => {
            const student = doc.data();
            leaderboardHtml += `<tr><td>${rank++}</td><td>${student.name}</td><td>${student.points}</td></tr>`;
        });
        leaderboardHtml += '</tbody></table>';
        const topLeaderboardEl = document.getElementById('top-leaderboard');
        if (topLeaderboardEl) {
            topLeaderboardEl.innerHTML += leaderboardHtml;
        }
    }

    async function renderQuests() {
        const questsSnapshot = await db.collection('quests').get();
        let questsHtml = `
            <div class="page-section">
                <h2>All Available Quests</h2>
                <div id="quest-grid">
        `;
        questsSnapshot.forEach(doc => {
            const quest = doc.data();
            questsHtml += `
                <div class="quest-card">
                    <h3>${quest.name}</h3>
                    <p>${quest.description}</p>
                    <span class="points">+${quest.points} pts</span>
                </div>
            `;
        });
        questsHtml += `
                </div>
            </div>
        `;
        if (mainContent) {
            mainContent.innerHTML = questsHtml;
        }
    }

    async function renderLeaderboard() {
        const leaderboardSnapshot = await db.collection('users').orderBy('points', 'desc').get();
        let leaderboardHtml = `
            <div class="page-section">
                <h2>Global Leaderboard</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Name</th>
                            <th>University Year</th>
                            <th>Points</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        let rank = 1;
        leaderboardSnapshot.forEach(doc => {
            const student = doc.data();
            leaderboardHtml += `
                <tr>
                    <td>${rank++}</td>
                    <td>${student.name}</td>
                    <td>${student.year}</td>
                    <td>${student.points}</td>
                </tr>
            `;
        });
        leaderboardHtml += `
                    </tbody>
                </table>
            </div>
            <div class="page-section" id="badges-container">
                <h2>Badges & Achievements</h2>
            </div>
        `;
        if (mainContent) {
            mainContent.innerHTML = leaderboardHtml;
        }
        const user = auth.currentUser;
        if (!user) return;
        const userDoc = await db.collection('users').doc(user.uid).get();
        const badges = userDoc.data().badges;
        let badgesHtml = '<ul>';
        badges.forEach(badge => {
            badgesHtml += `<li>${badge}</li>`;
        });
        badgesHtml += '</ul>';
        const badgesContainerEl = document.getElementById('badges-container');
        if (badgesContainerEl) {
            badgesContainerEl.innerHTML += badgesHtml;
        }
    }

    async function renderProfile() {
        const user = auth.currentUser;
        if (!user) return;
        const userDoc = await db.collection('users').doc(user.uid).get();
        const userData = userDoc.data();
        const profileHtml = `
            <div class="page-section">
                <h2>My Profile</h2>
                <p><strong>Name:</strong> ${userData.name}</p>
                <p><strong>University ID:</strong> ${userData.universityId}</p>
                <p><strong>Email:</strong> ${userData.email}</p>
                <p><strong>Courses:</strong> ${userData.courses.join(', ')}</p>
                <p><strong>University Year:</strong> <span id="current-year">${userData.year}</span></p>
                <button id="edit-profile-btn">Edit Profile</button>
            </div>
            
            <div class="page-section" id="edit-profile-section" style="display:none;">
                <h3>Edit My Profile</h3>
                <form id="edit-profile-form">
                    <label for="edit-year">Change University Year:</label>
                    <select id="edit-year" required>
                        <option value="Freshman" ${userData.year === 'Freshman' ? 'selected' : ''}>Freshman</option>
                        <option value="Sophomore" ${userData.year === 'Sophomore' ? 'selected' : ''}>Sophomore</option>
                        <option value="Junior" ${userData.year === 'Junior' ? 'selected' : ''}>Junior</option>
                        <option value="Senior" ${userData.year === 'Senior' ? 'selected' : ''}>Senior</option>
                    </select>
                    <button type="submit">Save Changes</button>
                </form>
            </div>
            
            <div class="page-section">
                <h3>My Badges</h3>
                <ul id="profile-badges-list"></ul>
            </div>
        `;
        if (mainContent) {
            mainContent.innerHTML = profileHtml;
        }
        const profileBadgesListEl = document.getElementById('profile-badges-list');
        if (profileBadgesListEl) {
            let badgesHtml = '';
            userData.badges.forEach(badge => {
                badgesHtml += `<li>${badge}</li>`;
            });
            profileBadgesListEl.innerHTML = badgesHtml;
        }
        const editBtn = document.getElementById('edit-profile-btn');
        const editSection = document.getElementById('edit-profile-section');
        const editForm = document.getElementById('edit-profile-form');
        if (editBtn && editSection) {
            editBtn.addEventListener('click', () => {
                editSection.style.display = 'block';
            });
        }
        if (editForm) {
            editForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const newYear = document.getElementById('edit-year').value;
                await db.collection('users').doc(user.uid).update({ year: newYear });
                alert('University year updated successfully!');
                const currentYearEl = document.getElementById('current-year');
                if (currentYearEl) {
                    currentYearEl.textContent = newYear;
                }
                editSection.style.display = 'none';
            });
        }
    }

    // --- Admin Panel Logic (for admin.html) ---
    function loadAdminPanel() {
        const addQuestForm = document.getElementById('add-quest-form');
        const addBadgeForm = document.getElementById('add-badge-form');
        const questList = document.getElementById('quest-list');
        const badgeList = document.getElementById('badge-list');

        if (!addQuestForm || !addBadgeForm || !questList || !badgeList) {
            console.error("Admin page elements not found. Cannot load admin panel.");
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
                li.innerHTML = `${quest.name} (+${quest.points} pts) <button class="delete-btn" data-id="${doc.id}">Delete</button>`;
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
