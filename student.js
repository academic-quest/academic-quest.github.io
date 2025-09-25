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

// Add or modify the renderDashboard function
async function renderDashboard(user) {
    const mainContent = document.getElementById('content');
    const userDoc = await db.collection('users').doc(user.uid).get();
    const userData = userDoc.data() || { points: 0, badges: [] };
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
            <p>${100 - (points % 100)} points to the next level!</p>
            <h3>Recent Activity</h3>
            <ul id="activity-log-list"></ul>
        </div>
    `;
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


// Add or modify the renderQuests function
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
    const userDoc = await db.collection('users').doc(user.uid).get();
    const completedQuests = userDoc.data().completedQuests || [];

    if (!questsSnapshot.empty) {
        questsSnapshot.forEach(doc => {
            const quest = doc.data();
            const questId = doc.id;
            const isCompleted = completedQuests.includes(questId);
            const deadline = quest.deadline ? new Date(quest.deadline) : null;
            const isLate = deadline && new Date() > deadline;

            const li = document.createElement('li');
            li.className = 'quest-item';
            
            let statusText = '';
            let buttonHtml = '';
            if (isCompleted) {
                statusText = '<span class="completed">✅ Completed</span>';
            } else if (isLate) {
                statusText = '<span class="late">❌ Expired</span>';
            } else {
                buttonHtml = `<button class="take-points-btn" data-quest-id="${questId}" data-points="${quest.points}" data-badge="${quest.badge}">Take Points</button>`;
            }

            const deadlineText = deadline ? `Due: ${deadline.toLocaleString()}` : 'No deadline';

            li.innerHTML = `
                <div class="quest-details">
                    <h4>${quest.name}</h4>
                    <p>${quest.description}</p>
                    <span class="quest-points">Points: ${quest.points}</span>
                    <span class="quest-deadline">${deadlineText}</span>
                    ${statusText}
                </div>
                ${buttonHtml}
            `;
            questsList.appendChild(li);
        });

        // Add event listeners for "Take Points" buttons
        document.querySelectorAll('.take-points-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const questId = e.target.dataset.questId;
                const points = parseInt(e.target.dataset.points);
                const badge = e.target.dataset.badge;

                await completeQuest(user, questId, points, badge);
            });
        });

    } else {
        questsList.innerHTML = '<p>No quests available at the moment. Check back later!</p>';
    }
}
    
// Add this new function to handle quest completion
async function completeQuest(user, questId, points, badge) {
    const userRef = db.collection('users').doc(user.uid);
    const questRef = db.collection('quests').doc(questId);
    
    // Check if the quest has a deadline and if it's expired
    const questDoc = await questRef.get();
    const questData = questDoc.data();
    if (questData.deadline && new Date() > new Date(questData.deadline)) {
        alert('This quest has expired and you can no longer get points.');
        return;
    }

    // Use a transaction to safely update user data
    await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
            throw "Document does not exist!";
        }
        
        const userData = userDoc.data();
        const newPoints = (userData.points || 0) + points;
        const newCompletedQuests = [...(userData.completedQuests || []), questId];
        const newBadges = [...(userData.badges || [])];

        // Add badge if it's a new one
        if (badge && !newBadges.includes(badge)) {
            newBadges.push(badge);
        }

        transaction.update(userRef, {
            points: newPoints,
            completedQuests: newCompletedQuests,
            badges: newBadges
        });
    });

    alert(`You've completed the quest and earned ${points} points!`);
    
    // Re-render the page to show the updated quest status
    window.location.reload();
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
