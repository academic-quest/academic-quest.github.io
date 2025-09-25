// This file contains all logic for the student dashboard (index.html)

document.addEventListener('DOMContentLoaded', () => {
    const auth = firebase.auth();
    const db = firebase.firestore();

    auth.onAuthStateChanged(user => {
        if (user) {
            initStudentDashboard(user);
        }
    });

    // Main function to initialize the student dashboard
    function initStudentDashboard(user) {
        const mainContent = document.getElementById('content');
        if (!mainContent) {
            return;
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
    }

    // --- Dynamic Page Loading Functions ---
    async function loadPage(page, user) {
        const mainContent = document.getElementById('content');
        mainContent.innerHTML = '';
        const navLinks = document.querySelectorAll('.nav-link');
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

    async function renderDashboard(user) {
        const userDocRef = db.collection('users').doc(user.uid);
        const userDoc = await userDocRef.get();
        const userData = userDoc.data();

        mainContent.innerHTML = `
            <section id="dashboard-content" class="page-content">
                <h2>Welcome, ${userData.name}!</h2>
                <div class="stats-container">
                    <div class="stat-box">
                        <h3>Your Points</h3>
                        <p id="current-points">${userData.points}</p>
                    </div>
                    <div class="stat-box">
                        <h3>Your Level</h3>
                        <p id="current-level">${calculateLevel(userData.points)}</p>
                    </div>
                </div>
                <div class="recent-activity">
                    <h3>Recent Activity</h3>
                    <ul id="activity-log-list"></ul>
                </div>
            </section>
        `;

        await renderActivityLog(user);
    }

    // ... (rest of the functions from your original student.js file)
    async function renderQuests(user) {
        const mainContent = document.getElementById('content');
        const userQuests = (await db.collection('users').doc(user.uid).get()).data().questsCompleted || [];
        const questsSnapshot = await db.collection('quests').get();
        let questsHtml = `
            <section id="quests-content" class="page-content">
                <h2>Available Quests</h2>
                <div class="quest-list-container">
                    <ul class="quest-list">
        `;
        questsSnapshot.forEach(doc => {
            const quest = { id: doc.id, ...doc.data() };
            const isCompleted = userQuests.includes(quest.id);
            questsHtml += `
                <li class="quest-item ${isCompleted ? 'completed' : ''}">
                    <h3>${quest.name}</h3>
                    <p>${quest.description}</p>
                    <div class="quest-meta">
                        <span>${quest.points} points</span> | <span>${quest.type}</span>
                    </div>
                    ${!isCompleted ? `<button class="complete-btn" data-id="${quest.id}">Complete Quest</button>` : '<span>Completed! ✅</span>'}
                </li>
            `;
        });
        questsHtml += `</ul></div></section>`;
        mainContent.innerHTML = questsHtml;

        const completeButtons = document.querySelectorAll('.complete-btn');
        completeButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                const questId = e.target.dataset.id;
                await completeQuest(user, questId);
            });
        });
    }

    async function completeQuest(user, questId) {
        const userRef = db.collection('users').doc(user.uid);
        const questRef = db.collection('quests').doc(questId);
    
        try {
            const userDoc = await userRef.get();
            const questDoc = await questRef.get();
    
            if (userDoc.exists && questDoc.exists) {
                const userData = userDoc.data();
                const questData = questDoc.data();
                const questsCompleted = userData.questsCompleted || [];
    
                if (!questsCompleted.includes(questId)) {
                    await userRef.update({
                        points: firebase.firestore.FieldValue.increment(questData.points),
                        questsCompleted: firebase.firestore.FieldValue.arrayUnion(questId)
                    });
    
                    await db.collection('activityLog').add({
                        userId: user.uid,
                        message: `Completed the quest "${questData.name}" and earned ${questData.points} points.`,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    });
    
                    alert(`Quest "${questData.name}" completed! You earned ${questData.points} points.`);
                    await loadPage('#quests', user);
                } else {
                    alert('You have already completed this quest.');
                }
            } else {
                alert('Quest or user not found.');
            }
        } catch (error) {
            console.error("Error completing quest:", error);
            alert("Failed to complete quest.");
        }
    }

    async function renderLeaderboard() {
        const mainContent = document.getElementById('content');
        const usersSnapshot = await db.collection('users').orderBy('points', 'desc').get();
        let leaderboardHtml = `
            <section id="leaderboard-content" class="page-content">
                <h2>Leaderboard</h2>
                <ol id="leaderboard-list">
        `;
        usersSnapshot.forEach((doc, index) => {
            const user = doc.data();
            leaderboardHtml += `
                <li>
                    <span>#${index + 1}</span>
                    <span>${user.name}</span>
                    <span>${user.points} points</span>
                </li>
            `;
        });
        leaderboardHtml += `</ol></section>`;
        mainContent.innerHTML = leaderboardHtml;
    }

    async function renderProfile(user) {
        const mainContent = document.getElementById('content');
        const userDoc = await db.collection('users').doc(user.uid).get();
        const userData = userDoc.data();
        const badgesSnapshot = await db.collection('badges').where('id', 'in', userData.badges || []).get();

        let badgesHtml = '';
        badgesSnapshot.forEach(doc => {
            const badge = doc.data();
            badgesHtml += `<li>${badge.name} - ${badge.description}</li>`;
        });

        mainContent.innerHTML = `
            <section id="profile-content" class="page-content">
                <h2>Your Profile</h2>
                <form id="profile-form">
                    <label for="profile-name">Full Name:</label>
                    <input type="text" id="profile-name" value="${userData.name}" required>
                    
                    <label for="profile-id">University ID:</label>
                    <input type="text" id="profile-id" value="${userData.universityId}" required>
                    
                    <label for="profile-year">University Year:</label>
                    <select id="profile-year" required>
                        <option value="Freshman" ${userData.year === 'Freshman' ? 'selected' : ''}>Freshman</option>
                        <option value="Sophomore" ${userData.year === 'Sophomore' ? 'selected' : ''}>Sophomore</option>
                        <option value="Junior" ${userData.year === 'Junior' ? 'selected' : ''}>Junior</option>
                        <option value="Senior" ${userData.year === 'Senior' ? 'selected' : ''}>Senior</option>
                    </select>

                    <label for="profile-courses">Courses (comma-separated):</label>
                    <input type="text" id="profile-courses" value="${userData.courses ? userData.courses.join(', ') : ''}" required>
                    
                    <button type="submit">Update Profile</button>
                </form>
                
                <h3>Your Badges</h3>
                <ul id="badge-list">${badgesHtml}</ul>
            </section>
        `;
        const profileForm = document.getElementById('profile-form');
        profileForm.addEventListener('submit', async (e) => {
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
            await renderProfile(user);
        } catch (error) {
            console.error("Error updating profile: ", error);
            alert('Failed to update profile.');
        }
    }

    async function renderActivityLog(user) {
        const activityLogList = document.getElementById('activity-log-list');
        const activitySnapshot = await db.collection('activityLog')
            .where('userId', '==', user.uid)
            .orderBy('timestamp', 'desc')
            .limit(10)
            .get();

        if (!activitySnapshot.empty) {
            activityLogList.innerHTML = '';
            activitySnapshot.forEach(doc => {
                const activity = doc.data();
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

    function calculateLevel(points) {
        return Math.floor(points / 100) + 1;
    }

});
