document.addEventListener('DOMContentLoaded', () => {
    const appRoot = document.getElementById('app-root');
    
    // Authentication guard
    auth.onAuthStateChanged(user => {
        if (user) {
            runApp(user);
        } else {
            window.location.href = 'login.html';
        }
    });

    function runApp(user) {
        // Setup header
        document.getElementById('logout-btn').addEventListener('click', () => auth.signOut());
        if (user.email === adminEmail) {
            document.getElementById('admin-link').style.display = 'block';
        }

        renderDashboard(user);
    }

    async function renderDashboard(user) {
        appRoot.innerHTML = `<p>Loading dashboard...</p>`;

        try {
            // Fetch all data in parallel
            const [userDoc, questsSnapshot, leaderboardSnapshot] = await Promise.all([
                db.collection('users').doc(user.uid).get(),
                db.collection('quests').limit(5).get(),
                db.collection('users').orderBy('points', 'desc').limit(5).get()
            ]);

            if (!userDoc.exists) throw new Error("User data not found.");

            const userData = userDoc.data();
            const points = userData.points || 0;
            const level = Math.floor(points / 100) + 1;
            const progress = points % 100;

            // Generate HTML structure
            appRoot.innerHTML = `
                <div class="dash-card profile-card">
                    <h2>${userData.name}</h2>
                    <p>${userData.universityId}</p>
                    <div class="progress-circle" style="--p:${progress};">
                        <span>Lvl ${level}</span>
                    </div>
                    <p>${100 - progress} points to next level</p>
                </div>
                <div class="main-dashboard">
                    <div class="dash-card">
                        <h3>Available Quests</h3>
                        <ul class="quest-list" id="dash-quest-list"></ul>
                    </div>
                    <div class="dash-card">
                        <h3>Leaderboard</h3>
                        <ol class="leaderboard-list" id="dash-leaderboard-list"></ol>
                    </div>
                </div>
            `;

            // Populate lists
            const questList = document.getElementById('dash-quest-list');
            questsSnapshot.forEach(doc => {
                const quest = doc.data();
                questList.innerHTML += `<li><span>${quest.name}</span><span>+${quest.points} pts</span></li>`;
            });

            const leaderboardList = document.getElementById('dash-leaderboard-list');
            leaderboardSnapshot.forEach(doc => {
                const boardUser = doc.data();
                leaderboardList.innerHTML += `<li><span>${boardUser.name}</span><span>${boardUser.points} pts</span></li>`;
            });

        } catch (error) {
            console.error(error);
            appRoot.innerHTML = `<p>Error loading dashboard: ${error.message}</p>`;
        }
    }
});
