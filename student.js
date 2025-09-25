// This is the complete and final code for student.js
document.addEventListener('DOMContentLoaded', () => {
    // These are initialized in script.js
    const auth = firebase.auth();
    const db = firebase.firestore();

    // This listener ensures that the dashboard logic only runs for a logged-in user
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is authenticated, set up the student dashboard
            setupStudentNavigation(user);
        }
    });

    // This function sets up the navigation and loads the initial page
    function setupStudentNavigation(user) {
        // Listen for clicks on the nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetPage = e.currentTarget.getAttribute('href');
                // Use the URL hash to manage navigation state
                window.location.hash = targetPage;
            });
        });
        
        // When the hash changes (e.g., from a link click), load the corresponding page
        window.addEventListener('hashchange', () => loadPageContent(user));
        
        // Load the initial page content when the app first starts
        loadPageContent(user);
    }

    // This function acts as a router to display the correct page content
    async function loadPageContent(user) {
        const pageId = window.location.hash || '#dashboard';

        // Update the 'active' class on the navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === pageId);
        });

        // Call the appropriate function to render the page
        switch (pageId) {
            case '#quests':
                await renderQuestsPage(user);
                break;
            case '#leaderboard':
                await renderLeaderboardPage(user);
                break;
            case '#profile':
                await renderProfilePage(user);
                break;
            case '#dashboard':
            default:
                await renderDashboard(user);
                break;
        }
    }

    // --- PAGE RENDERING FUNCTIONS ---

    async function renderDashboard(user) {
        const mainContent = document.getElementById('content');
        mainContent.innerHTML = `<h2>Loading Dashboard...</h2>`;
        try {
            // Fetch all required data in parallel for speed
            const [userDoc, questsSnapshot, leaderboardSnapshot] = await Promise.all([
                db.collection('users').doc(user.uid).get(),
                db.collection('quests').orderBy('deadline', 'desc').limit(5).get(),
                db.collection('users').orderBy('points', 'desc').limit(5).get()
            ]);

            if (!userDoc.exists) {
                return mainContent.innerHTML = '<h2>Error: Your user data was not found. Please try signing up again.</h2>';
            }

            const userData = userDoc.data();
            mainContent.innerHTML = `
                <div class="dashboard-grid">
                    <div class="dash-card card-user-info"><h3>${userData.name || 'Student'}</h3><p>ID: ${userData.universityId || 'N/A'}</p></div>
                    <div class="dash-card card-quests"><h4>Current Quests</h4><ul id="dashboard-quest-list"></ul></div>
                    <div class="dash-card card-journey"><h4>Academic Journey</h4><div class="journey-stepper"><div class="step ${userData.year === 'Freshman' ? 'active' : ''}">Freshman</div><div class="step ${userData.year === 'Sophomore' ? 'active' : ''}">Sophomore</div><div class="step ${userData.year === 'Junior' ? 'active' : ''}">Junior</div><div class="step ${userData.year === 'Senior' ? 'active' : ''}">Senior</div></div></div>
                    <div class="dash-card card-leaderboard"><h4>Leaderboard</h4><ol id="dashboard-leaderboard-list"></ol></div>
                </div>`;
            
            // --- Populate the dynamic content into the template ---
            const questList = document.getElementById('dashboard-quest-list');
            let questCount = 0;
            questsSnapshot.forEach(doc => {
                questCount++;
                const quest = doc.data();
                const li = document.createElement('li');
                li.innerHTML = `<span>${quest.name}</span><span class="quest-points">+${quest.points}</span>`;
                questList.appendChild(li);
            });
            if (questCount === 0) questList.innerHTML = `<li>No quests available.</li>`;

            const leaderboardList = document.getElementById('dashboard-leaderboard-list');
            leaderboardSnapshot.forEach(doc => {
                const boardUser = doc.data();
                const li = document.createElement('li');
                li.innerHTML = `<span>${boardUser.name}</span><span>${boardUser.points} pts</span>`;
                leaderboardList.appendChild(li);
            });

        } catch (error) {
            console.error("Dashboard Rendering Error:", error);
            mainContent.innerHTML = `<h2>There was an error loading the dashboard.</h2><p>Please check the console for details. The most likely cause is a misconfiguration of Firestore Security Rules.</p>`;
        }
    }

    async function renderQuestsPage(user) {
        document.getElementById('content').innerHTML = `<h2>All Quests</h2><p>This page is under construction.</p>`;
    }

    async function renderLeaderboardPage(user) {
        document.getElementById('content').innerHTML = `<h2>Full Leaderboard</h2><p>This page is under construction.</p>`;
    }

    async function renderProfilePage(user) {
        document.getElementById('content').innerHTML = `<h2>My Profile</h2><p>This page is under construction.</p>`;
    }
});
