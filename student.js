// This file contains all logic for the student dashboard (index.html)

document.addEventListener('DOMContentLoaded', () => {
    const auth = firebase.auth();
    const db = firebase.firestore();

    auth.onAuthStateChanged(user => {
        if (user) {
            initStudentDashboard(user);
        }
    });

    function initStudentDashboard(user) {
        const mainContent = document.getElementById('content');
        if (!mainContent) {
            return;
        }

        const navLinks = document.querySelectorAll('.nav-link');
        const contentSections = document.querySelectorAll('.page-content');

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

    async function loadPage(page, user) {
        document.querySelectorAll('.page-content').forEach(section => {
            section.style.display = 'none';
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        const activeLink = document.querySelector(`.nav-link[href="${page}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        const contentSectionId = page.substring(1) + '-content';
        const contentSection = document.getElementById(contentSectionId);
        if (contentSection) {
            contentSection.style.display = 'block';
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
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                document.getElementById('student-name').textContent = userData.name || 'N/A';
                document.getElementById('student-id').textContent = `ID: ${userData.universityId || 'N/A'}`;
                document.getElementById('student-year').textContent = `University Year: ${userData.year || 'N/A'}`;
                document.getElementById('user-points').textContent = userData.points || 0;
                document.getElementById('user-level').textContent = calculateLevel(userData.points || 0);

                await renderQuestsOverview(user);
                await renderLeaderboardOverview();
                await renderPointsBreakdown(user);
            }
        } catch (error) {
            console.error("Error rendering dashboard: ", error);
        }
    }

async function renderDashboard(user) {
    const mainContent = document.getElementById('content');
    const userDoc = await db.collection('users').doc(user.uid).get();
    const userData = userDoc.data();
    const points = userData.points || 0;
    const level = calculateLevel(points);

    mainContent.innerHTML = `
        <div class="dashboard-container">
            <h2>Welcome, ${userData.name}!</h2>
            <div class="stats-card">
                <div class="stat-item">
                    <h3>Total Points</h3>
                    <p>${points}</p>
                </div>
                <div class="stat-item">
                    <h3>Current Level</h3>
                    <p>${level}</p>
                </div>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${(points % 100)}%;"></div>
            </div>
            <p>${100 - (points % 100)} points to the next level!</p>
            <h3>Recent Activity</h3>
            <ul id="activity-log-list"></ul>
        </div>
    `;

    // A separate function to render the activity log
    await renderActivityLog(user);
}


    
    async function renderQuestsOverview(user) {
        const questList = document.getElementById('quests-overview-list');
        questList.innerHTML = '<li>Loading...</li>';
        try {
            const questsSnapshot = await db.collection('quests').get();
            const completedQuestsSnapshot = await db.collection('completedQuests').where('userId', '==', user.uid).get();
            const completedQuests = new Set(completedQuestsSnapshot.docs.map(doc => doc.data().questId));
            
            questList.innerHTML = '';
            if (!questsSnapshot.empty) {
                questsSnapshot.docs.slice(0, 3).forEach(doc => {
                    const quest = doc.data();
                    const isCompleted = completedQuests.has(doc.id);
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <div class="quest-item">
                            <span class="quest-name">${quest.name}</span>
                            <span class="quest-status">${isCompleted ? '✓ Completed' : 'Pending'}</span>
                        </div>
                    `;
                    questList.appendChild(li);
                });
            } else {
                questList.innerHTML = '<li>No quests found.</li>';
            }
        } catch (error) {
            console.error("Error rendering quests overview: ", error);
        }
    }
    
    async function renderLeaderboardOverview() {
        const leaderboardList = document.getElementById('leaderboard-overview-list');
        leaderboardList.innerHTML = '<li>Loading...</li>';
        try {
            const usersSnapshot = await db.collection('users').orderBy('points', 'desc').limit(3).get();
            leaderboardList.innerHTML = '';
            let rank = 1;
            if (!usersSnapshot.empty) {
                usersSnapshot.forEach(doc => {
                    const user = doc.data();
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <div class="leaderboard-item">
                            <span class="leaderboard-rank">#${rank}</span>
                            <span class="leaderboard-name">${user.name}</span>
                            <span class="leaderboard-level">Level ${calculateLevel(user.points)}</span>
                        </div>
                    `;
                    leaderboardList.appendChild(li);
                    rank++;
                });
            } else {
                leaderboardList.innerHTML = '<li>No users on leaderboard.</li>';
            }
        } catch (error) {
            console.error("Error rendering leaderboard overview: ", error);
        }
    }

    async function renderPointsBreakdown(user) {
        const pointsBreakdownList = document.getElementById('points-breakdown-list');
        pointsBreakdownList.innerHTML = '<li>Loading...</li>';
        try {
            const activitySnapshot = await db.collection('activityLog')
                .where('userId', '==', user.uid)
                .orderBy('timestamp', 'desc')
                .limit(5)
                .get();
            pointsBreakdownList.innerHTML = '';
            if (!activitySnapshot.empty) {
                activitySnapshot.forEach(doc => {
                    const activity = doc.data();
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <div class="point-item">
                            <span class="point-description">${activity.message}</span>
                            <span class="point-value">+${activity.points} pts</span>
                        </div>
                    `;
                    pointsBreakdownList.appendChild(li);
                });
            } else {
                pointsBreakdownList.innerHTML = '<li>No points earned yet.</li>';
            }
        } catch (error) {
            console.error("Error rendering points breakdown: ", error);
        }
    }

    async function renderQuests(user) {
        const questList = document.getElementById('quest-list');
        questList.innerHTML = '<li>Loading...</li>';
        try {
            const questsSnapshot = await db.collection('quests').get();
            const completedQuestsSnapshot = await db.collection('completedQuests').where('userId', '==', user.uid).get();
            const completedQuests = new Set(completedQuestsSnapshot.docs.map(doc => doc.data().questId));

            questList.innerHTML = '';
            if (!questsSnapshot.empty) {
                questsSnapshot.forEach(doc => {
                    const quest = doc.data();
                    const isCompleted = completedQuests.has(doc.id);
                    const li = document.createElement('li');
                    li.classList.add('quest-card');
                    li.innerHTML = `
                        <div class="quest-header">
                            <h3>${quest.name}</h3>
                            <span class="quest-points">+${quest.points} pts</span>
                        </div>
                        <p class="quest-description">${quest.description}</p>
                        <button class="complete-btn" data-id="${doc.id}" data-points="${quest.points}" ${isCompleted ? 'disabled' : ''}>
                            ${isCompleted ? 'Completed' : 'Complete Quest'}
                        </button>
                    `;
                    questList.appendChild(li);
                });
                
                // Add event listeners for quest completion
                document.querySelectorAll('.complete-btn').forEach(button => {
                    button.addEventListener('click', async (e) => {
                        const questId = e.target.dataset.id;
                        const points = parseInt(e.target.dataset.points);
                        await completeQuest(user.uid, questId, points);
                    });
                });
            } else {
                questList.innerHTML = '<p>No quests available at the moment.</p>';
            }
        } catch (error) {
            console.error("Error rendering quests: ", error);
        }
    }

async function renderQuests(user) {
    const mainContent = document.getElementById('content');
    mainContent.innerHTML = `
        <div class="quests-container">
            <h2>Available Quests</h2>
            <ul id="quests-list"></ul>
        </div>
    `;
    const questsList = document.getElementById('quests-list');
    const questsSnapshot = await db.collection('quests').get();

    if (!questsSnapshot.empty) {
        questsSnapshot.forEach(doc => {
            const quest = doc.data();
            const li = document.createElement('li');
            li.innerHTML = `
                <h4>${quest.name}</h4>
                <p>${quest.description}</p>
                <span>Points: ${quest.points}</span>
            `;
            questsList.appendChild(li);
        });
    } else {
        questsList.innerHTML = '<p>No quests available at the moment. Check back later!</p>';
    }
}

    
    async function completeQuest(userId, questId, points) {
        try {
            await db.collection('completedQuests').add({
                userId: userId,
                questId: questId,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            await db.collection('users').doc(userId).update({
                points: firebase.firestore.FieldValue.increment(points)
            });

            await db.collection('activityLog').add({
                userId: userId,
                message: `Completed a quest and earned ${points} points.`,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                points: points
            });

            alert('Quest completed successfully!');
            loadPage('#quests', { uid: userId }); // Reload the quests page to show the updated status
        } catch (error) {
            console.error("Error completing quest: ", error);
            alert('Failed to complete quest.');
        }
    }

    async function renderLeaderboard(user) {
        const leaderboardList = document.getElementById('leaderboard-list');
        leaderboardList.innerHTML = '<li>Loading...</li>';
        try {
            const usersSnapshot = await db.collection('users').orderBy('points', 'desc').get();
            leaderboardList.innerHTML = '';
            let rank = 1;
            if (!usersSnapshot.empty) {
                usersSnapshot.forEach(doc => {
                    const leaderboardUser = doc.data();
                    const li = document.createElement('li');
                    li.classList.add('leaderboard-item');
                    li.innerHTML = `
                        <div class="leaderboard-rank">#${rank}</div>
                        <div class="leaderboard-info">
                            <span class="leaderboard-name">${leaderboardUser.name}</span>
                            <span class="leaderboard-id">ID: ${leaderboardUser.universityId}</span>
                        </div>
                        <div class="leaderboard-score">
                            <span class="leaderboard-level">Level ${calculateLevel(leaderboardUser.points)}</span>
                            <span class="leaderboard-points">${leaderboardUser.points} pts</span>
                        </div>
                    `;
                    leaderboardList.appendChild(li);
                    rank++;
                });
            } else {
                leaderboardList.innerHTML = '<p>No users on the leaderboard yet.</p>';
            }
        } catch (error) {
            console.error("Error rendering leaderboard: ", error);
        }
    }

    async function renderProfile(user) {
        const profileForm = document.getElementById('profile-form');
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            document.getElementById('profile-card-name').textContent = userData.name || 'N/A';
            document.getElementById('profile-card-year').textContent = `University Year: ${userData.year || 'N/A'}`;
            document.getElementById('profile-name').value = userData.name || '';
            document.getElementById('profile-id').value = userData.universityId || '';
            document.getElementById('profile-email').value = user.email;
            document.getElementById('profile-year').value = userData.year || 'Freshman';
            document.getElementById('profile-courses').value = userData.courses.join(', ') || '';
        }

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
            // Reload the profile page to show the updated info
            loadPage('#profile', { uid: userId });
        } catch (error) {
            console.error("Error updating profile: ", error);
            alert('Failed to update profile.');
        }
    }

    function calculateLevel(points) {
        return Math.floor(points / 100) + 1;
    }
});
