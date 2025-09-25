// This file contains all logic for the student dashboard (index.html)

const auth = firebase.auth();
const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', () => {

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
            loadPage(target);
        });
    });

    const currentHash = window.location.hash || '#dashboard';
    loadPage(currentHash);

    // --- Dynamic Page Loading Functions ---
    async function loadPage(page) {
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
                <p><strong>University ID:</strong> ${userData.universityId}</p>
                <p><strong>Current Level:</strong> ${calculateLevel(userData.points)}</p>
            </div>
            <div class="page-section" id="current-quests">
                <h2>My Quests</h2>
            </div>
            <div class="page-section" id="top-leaderboard">
                <h2>Top 5 Leaderboard</h2>
            </div>
        `;
        mainContent.innerHTML = dashboardHtml;

        // Display Quests on Dashboard
        const questsSnapshot = await db.collection('quests').get();
        const questsCompleted = userData.questsCompleted || [];
        let questsHtml = `<h3>Quests Completed: ${questsCompleted.length}</h3><ul>`;
        questsSnapshot.forEach(doc => {
            const quest = doc.data();
            const isCompleted = questsCompleted.includes(doc.id);
            if (isCompleted) {
                questsHtml += `<li><input type="checkbox" checked disabled> ${quest.name} (+${quest.points} pts)</li>`;
            }
        });
        questsHtml += '</ul>';
        const currentQuestsEl = document.getElementById('current-quests');
        if (currentQuestsEl) {
            currentQuestsEl.innerHTML += questsHtml;
        }

        // Display Top 5 Leaderboard on Dashboard
        const leaderboardSnapshot = await db.collection('users').orderBy('points', 'desc').limit(5).get();
        let leaderboardHtml = '<table><thead><tr><th>Rank</th><th>Name</th><th>Level</th><th>Points</th></tr></thead><tbody>';
        let rank = 1;
        leaderboardSnapshot.forEach(doc => {
            const student = doc.data();
            const level = calculateLevel(student.points);
            leaderboardHtml += `<tr><td>${rank++}</td><td>${student.name}</td><td>${level}</td><td>${student.points}</td></tr>`;
        });
        leaderboardHtml += '</tbody></table>';
        const topLeaderboardEl = document.getElementById('top-leaderboard');
        if (topLeaderboardEl) {
            topLeaderboardEl.innerHTML += leaderboardHtml;
        }
    }

    async function renderQuests() {
        const user = auth.currentUser;
        if (!user) return;
        const userDoc = await db.collection('users').doc(user.uid).get();
        const userData = userDoc.data();
        const questsCompleted = userData.questsCompleted || [];

        const questsSnapshot = await db.collection('quests').get();
        let questsHtml = `
            <div class="page-section">
                <h2>All Available Quests</h2>
                <div id="quest-grid">
        `;
        questsSnapshot.forEach(doc => {
            const quest = doc.data();
            const isCompleted = questsCompleted.includes(doc.id);
            questsHtml += `
                <div class="quest-card">
                    <h3>${quest.name}</h3>
                    <p>${quest.description}</p>
                    <span class="points">+${quest.points} pts</span>
                    ${isCompleted ?
                        '<span class="quest-completed">Completed! ✅</span>' :
                        `<button class="btn complete-quest-btn" data-id="${doc.id}">Done</button>`
                    }
                </div>
            `;
        });
        questsHtml += `
                </div>
            </div>
        `;
        mainContent.innerHTML = questsHtml;

        // Add event listeners for the "Done" buttons
        document.querySelectorAll('.complete-quest-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const questId = e.target.dataset.id;
                await completeQuest(questId);
            });
        });
    }

    async function completeQuest(questId) {
        const user = auth.currentUser;
        if (!user) {
            alert('Please log in to complete a quest.');
            return;
        }

        const userRef = db.collection('users').doc(user.uid);
        const userDoc = await userRef.get();
        const userData = userDoc.data();

        // Check if the quest has already been completed
        if (userData.questsCompleted && userData.questsCompleted.includes(questId)) {
            alert('You have already completed this quest!');
            return;
        }

        const questDoc = await db.collection('quests').doc(questId).get();
        const questData = questDoc.data();
        if (!questData) {
            alert('Quest not found.');
            return;
        }

        const newPoints = userData.points + questData.points;
        const newQuestsCompleted = [...(userData.questsCompleted || []), questId];

        try {
            await userRef.update({
                points: newPoints,
                questsCompleted: newQuestsCompleted
            });
            alert(`You earned ${questData.points} points for completing "${questData.name}"!`);
            // Refresh the page to show the updated quests
            await renderQuests();
        } catch (error) {
            console.error("Error completing quest: ", error);
            alert('Failed to complete quest.');
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
                            <th>Level</th>
                            <th>University Year</th>
                            <th>Points</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        let rank = 1;
        leaderboardSnapshot.forEach(doc => {
            const student = doc.data();
            const level = calculateLevel(student.points);
            leaderboardHtml += `
                <tr>
                    <td>${rank++}</td>
                    <td>${student.name}</td>
                    <td>${level}</td>
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
        mainContent.innerHTML = leaderboardHtml;

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
                <form id="edit-profile-form">
                    <div class="form-group">
                        <label for="profile-name">Full Name</label>
                        <input type="text" id="profile-name" value="${userData.name}" required>
                    </div>
                    <div class="form-group">
                        <label for="profile-id">University ID</label>
                        <input type="text" id="profile-id" value="${userData.universityId}" required disabled>
                    </div>
                    <div class="form-group">
                        <label for="profile-email">Email</label>
                        <input type="email" id="profile-email" value="${userData.email}" disabled>
                    </div>
                    <div class="form-group">
                        <label for="profile-year">University Year</label>
                        <select id="profile-year" required>
                            <option value="Freshman" ${userData.year === 'Freshman' ? 'selected' : ''}>Freshman</option>
                            <option value="Sophomore" ${userData.year === 'Sophomore' ? 'selected' : ''}>Sophomore</option>
                            <option value="Junior" ${userData.year === 'Junior' ? 'selected' : ''}>Junior</option>
                            <option value="Senior" ${userData.year === 'Senior' ? 'selected' : ''}>Senior</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="profile-courses">Courses (comma-separated)</label>
                        <input type="text" id="profile-courses" value="${userData.courses.join(', ')}" required>
                    </div>
                    <button type="submit" class="btn">Save Changes</button>
                </form>
            </div>
            <div class="page-section">
                <h2>Activity Log</h2>
                <ul id="activity-log">
                    </ul>
            </div>
        `;
        mainContent.innerHTML = profileHtml;

        document.getElementById('edit-profile-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await updateProfile(user.uid);
        });
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
            await renderProfile();
        } catch (error) {
            console.error("Error updating profile: ", error);
            alert('Failed to update profile.');
        }
    }

    // --- Utility Function to calculate level ---
    function calculateLevel(points) {
        return Math.floor(points / 100) + 1;
    }
});
