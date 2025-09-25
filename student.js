// This file contains all logic for the student dashboard (index.html)

function initStudentDashboard(user) {
    const auth = firebase.auth();
    const db = firebase.firestore();
    
    const mainContent = document.getElementById('content');
    if (!mainContent) {
        return; // This script is for index.html only
    }

    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.target.getAttribute('href');
            history.pushState(null, '', target);
            loadPage(target, user);
        });
    });

    const currentHash = window.location.hash || '#dashboard';
    loadPage(currentHash, user);

    // --- Dynamic Page Loading Functions ---
    async function loadPage(page, user) {
        mainContent.innerHTML = '';
        navLinks.forEach(link => link.classList.remove('active'));
        const activeLink = document.querySelector(`.nav-link[href=\"${page}\"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        switch (page) {
            case '#dashboard':
                await renderDashboard(user);
                break;
            case '#quests':
                await renderQuests(user);
                break;
            case '#leaderboard':
                await renderLeaderboard(user);
                break;
            case '#profile':
                await renderProfile(user);
                break;
        }
    }

    // --- Rendering Functions ---
    async function renderDashboard(user) {
        // ... (existing code for rendering dashboard)
        const userDoc = await db.collection('users').doc(user.uid).get();
        const userData = userDoc.data();
        const dashboardHtml = `
            <div class=\"page-section\">
                <h2>Dashboard</h2>
                <div class=\"stats-grid\">
                    <div class=\"stat-card\">
                        <h3>Current Points</h3>
                        <p>${userData.points || 0}</p>
                    </div>
                    <div class=\"stat-card\">
                        <h3>Current Level</h3>
                        <p>${calculateLevel(userData.points || 0)}</p>
                    </div>
                </div>
                <div class=\"page-section\">
                    <h2>My Badges</h2>
                    <div class=\"badges-grid\" id=\"my-badges\">
                        <p>No badges yet.</p>
                    </div>
                </div>
            </div>
        `;
        mainContent.innerHTML = dashboardHtml;
        await displayMyBadges(user.uid);
    }
    
    async function renderQuests(user) {
        // ... (existing code for rendering quests)
        const questsHtml = `
            <div class=\"page-section\">
                <h2>Available Quests</h2>
                <ul id=\"quest-list\">
                </ul>
            </div>
            <div class=\"page-section\">
                <h2>My Completed Quests</h2>
                <ul id=\"completed-quests\">
                </ul>
            </div>
        `;
        mainContent.innerHTML = questsHtml;
        await displayAllQuests(user);
        await displayCompletedQuests(user.uid);
    }
    
    async function renderLeaderboard(user) {
        // ... (existing code for rendering leaderboard)
        const leaderboardHtml = `
            <div class=\"page-section\">
                <h2>Leaderboard</h2>
                <ol id=\"leaderboard-list\"></ol>
            </div>
        `;
        mainContent.innerHTML = leaderboardHtml;
        await displayLeaderboard();
    }
    
    async function renderProfile(user) {
        // ... (existing code for rendering profile)
        const userDoc = await db.collection('users').doc(user.uid).get();
        const userData = userDoc.data();
        const profileHtml = `
            <div class=\"page-section\">
                <h2>My Profile</h2>
                <form id=\"edit-profile-form\">
                    <label for=\"profile-email\">Email:</label>
                    <input type=\"email\" id=\"profile-email\" value=\"${user.email}\" disabled>
                    <label for=\"profile-name\">Full Name:</label>
                    <input type=\"text\" id=\"profile-name\" value=\"${userData.name || ''}\">
                    <label for=\"profile-id\">University ID:</label>
                    <input type=\"text\" id=\"profile-id\" value=\"${userData.universityId || ''}\">
                    <label for=\"profile-year\">University Year:</label>
                    <select id=\"profile-year\">
                        <option value=\"\">Select Year</option>
                        <option value=\"Freshman\" ${userData.year === 'Freshman' ? 'selected' : ''}>Freshman</option>
                        <option value=\"Sophomore\" ${userData.year === 'Sophomore' ? 'selected' : ''}>Sophomore</option>
                        <option value=\"Junior\" ${userData.year === 'Junior' ? 'selected' : ''}>Junior</option>
                        <option value=\"Senior\" ${userData.year === 'Senior' ? 'selected' : ''}>Senior</option>
                    </select>
                    <label for=\"profile-courses\">Courses (comma-separated):</label>
                    <input type=\"text\" id=\"profile-courses\" value=\"${(userData.courses || []).join(', ')}\">
                    <button type=\"submit\" class=\"btn\">Save Changes</button>
                </form>
            </div>
            <div class=\"page-section\">
                <h2>Activity Log</h2>
                <ul id=\"activity-log\">
                </ul>
            </div>
        `;
        mainContent.innerHTML = profileHtml;

        document.getElementById('edit-profile-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await updateProfile(user.uid);
        });
        await displayActivityLog(user.uid);
    }
    
    // ... (include all other functions like updateProfile, displayAllQuests, etc. as they were before)
    async function displayAllQuests(user) {
        const questList = document.getElementById('quest-list');
        const questsSnapshot = await db.collection('quests').get();
        const userDoc = await db.collection('users').doc(user.uid).get();
        const userData = userDoc.data();
    
        questList.innerHTML = '';
        questsSnapshot.forEach(doc => {
            const quest = doc.data();
            const isCompleted = (userData.completedQuests || []).some(cq => cq.questId === doc.id);
            const li = document.createElement('li');
            li.className = 'quest-item';
            li.innerHTML = `
                <h4>${quest.name} (+${quest.points} pts)</h4>
                <p>${quest.description}</p>
                <div class="quest-item-actions">
                    <span class="quest-type">${quest.type}</span>
                    <button class="complete-quest-btn btn" data-id="${doc.id}" ${isCompleted ? 'disabled' : ''}>
                        ${isCompleted ? 'Completed' : 'Complete'}
                    </button>
                </div>
            `;
            questList.appendChild(li);
        });
    }

    async function displayLeaderboard() {
        const leaderboardList = document.getElementById('leaderboard-list');
        const usersSnapshot = await db.collection('users').orderBy('points', 'desc').limit(10).get();
        
        leaderboardList.innerHTML = '';
        let rank = 1;
        usersSnapshot.forEach(doc => {
            const user = doc.data();
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="rank">${rank}.</span>
                <span class="leaderboard-name">${user.name}</span>
                <span class="leaderboard-points">${user.points || 0} pts</span>
            `;
            leaderboardList.appendChild(li);
            rank++;
        });
    }

    async function displayMyBadges(userId) {
        const myBadgesContainer = document.getElementById('my-badges');
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();

        if (userData && userData.badges && userData.badges.length > 0) {
            myBadgesContainer.innerHTML = '';
            userData.badges.forEach(async (badgeId) => {
                const badgeDoc = await db.collection('badges').doc(badgeId).get();
                if (badgeDoc.exists) {
                    const badge = badgeDoc.data();
                    const badgeCard = document.createElement('div');
                    badgeCard.className = 'badge-card';
                    badgeCard.innerHTML = `
                        <h4>${badge.name}</h4>
                        <p>${badge.description}</p>
                    `;
                    myBadgesContainer.appendChild(badgeCard);
                }
            });
        } else {
            myBadgesContainer.innerHTML = '<p>No badges yet.</p>';
        }
    }

    async function displayCompletedQuests(userId) {
        const completedQuestsList = document.getElementById('completed-quests');
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();
        
        completedQuestsList.innerHTML = '';
        if (userData.completedQuests && userData.completedQuests.length > 0) {
            for (const completedQuest of userData.completedQuests) {
                const questDoc = await db.collection('quests').doc(completedQuest.questId).get();
                if (questDoc.exists) {
                    const quest = questDoc.data();
                    const li = document.createElement('li');
                    li.innerHTML = `${quest.name} (Completed on: ${new Date(completedQuest.completedAt.seconds * 1000).toLocaleDateString()})`;
                    completedQuestsList.appendChild(li);
                }
            }
        } else {
            completedQuestsList.innerHTML = '<p>No quests completed yet.</p>';
        }
    }
    
    async function displayActivityLog(userId) {
        const activityLogList = document.getElementById('activity-log');
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();
    
        activityLogList.innerHTML = '';
        if (userData.activityLog && userData.activityLog.length > 0) {
            userData.activityLog.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);
            userData.activityLog.forEach(activity => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <p class="log-message">${activity.message}</p>
                    <span class="log-timestamp">${new Date(activity.timestamp.seconds * 1000).toLocaleString()}</span>
                `;
                activityLogList.appendChild(li);
            });
        } else {
            activityLogList.innerHTML = '<p>No activity recorded yet.</p>';
        }
    }

    async function updateProfile(userId) {
        const name = document.getElementById('profile-name').value;
        const id = document.getElementById('profile-id').value;
        const year = document.getElementById('profile-year').value;
        const courses = document.getElementById('profile-courses').value.split(',').map(c => c.trim());

        try {
            await db.collection('users').doc(userId).update({
                name: name,
                universityId: id,
                year: year,
                courses: courses
            });
            alert('Profile updated successfully!');
            await renderProfile(user);
        } catch (error) {
            console.error(\"Error updating profile: \", error);
            alert('Failed to update profile.');
        }
    }

    // --- Utility Function to calculate level ---
    function calculateLevel(points) {
        return Math.floor(points / 100) + 1;
    }
}

// Expose the init function to the global scope
window.initStudentDashboard = initStudentDashboard;
