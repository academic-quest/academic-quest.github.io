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
    // Show a loading state first
    mainContent.innerHTML = '<h2>Loading Dashboard...</h2>'; 

    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (!userDoc.exists) {
            mainContent.innerHTML = '<h2>Error: User data not found.</h2>';
            return;
        }

        const userData = userDoc.data();
        const points = userData.points || 0;
        const level = calculateLevel(points);
        const pointsToNextLevel = 100 - (points % 100);
        const progressPercentage = (points % 100);

        mainContent.innerHTML = `
            <div class="dashboard-container">
                <h2>Welcome, ${userData.name || 'Student'}!</h2>
                <div class="dashboard-grid">
                    <div class="stats-card main-stats">
                        <div class="progress-circle" style="--p:${progressPercentage};">
                            <div class="progress-info">
                                <h3>Level ${level}</h3>
                                <span>${points} pts</span>
                            </div>
                        </div>
                        <p>${pointsToNextLevel} points to the next level!</p>
                    </div>
                    <div class="stats-card">
                        <h3>Points Breakdown</h3>
                        <ul id="points-breakdown-list"></ul>
                    </div>
                    <div class="stats-card">
                        <h3>Badges Earned</h3>
                        <div id="badges-earned-list" class="badge-display">
                            ${(userData.badges && userData.badges.length > 0) ? userData.badges.map(b => `<span>${b}</span>`).join('') : '<p>No badges yet!</p>'}
                        </div>
                    </div>
                </div>
            </div>
        `;
        // Now that the container exists, render the points breakdown
        await renderPointsBreakdown(user);
    } catch (error) {
        console.error("Error rendering dashboard: ", error);
        mainContent.innerHTML = '<h2>Could not load dashboard.</h2>';
    }
}

    function renderDashboardQuests(questsSnapshot, completedQuests) {
    const questList = document.getElementById('dashboard-quest-list');
    questList.innerHTML = '';
    let availableQuests = 0;
    questsSnapshot.forEach(doc => {
        const quest = doc.data();
        const isCompleted = completedQuests.includes(doc.id);
        if (!isCompleted) {
             availableQuests++;
             const li = document.createElement('li');
             li.innerHTML = `<span>${quest.name}</span> <span class="quest-points">+${quest.points}</span>`;
             questList.appendChild(li);
        }
    });
    if (availableQuests === 0) {
        questList.innerHTML = '<li>No new quests available.</li>';
    }
}

function renderDashboardLeaderboard(leaderboardSnapshot) {
    const leaderboardList = document.getElementById('dashboard-leaderboard-list');
    leaderboardList.innerHTML = '';
    leaderboardSnapshot.forEach(doc => {
        const user = doc.data();
        const li = document.createElement('li');
        li.innerHTML = `<span>${user.name}</span> <span>${user.points} pts</span>`;
        leaderboardList.appendChild(li);
    });
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


async function renderDashboard(user) {
    const mainContent = document.getElementById('content');
    mainContent.innerHTML = '<div class="loading">Loading Dashboard...</div>';

    try {
        // Fetch all data at the same time
        const [userDoc, questsSnapshot, leaderboardSnapshot] = await Promise.all([
            db.collection('users').doc(user.uid).get(),
            db.collection('quests').orderBy('deadline', 'desc').limit(5).get(),
            db.collection('users').orderBy('points', 'desc').limit(5).get()
        ]);

        if (!userDoc.exists) {
            mainContent.innerHTML = '<h2>Error: User data not found. Please sign up again with a new account.</h2>';
            return;
        }

        const userData = userDoc.data();
        
        mainContent.innerHTML = `
            <div class="dashboard-grid">
                <div class="dash-card card-user-info">
                    <div class="profile-pic-placeholder"></div>
                    <h3>${userData.name || 'Student'}</h3>
                    <p>University ID: ${userData.universityId || 'N/A'}</p>
                </div>
                <div class="dash-card card-quests">
                    <h4>Current Quests</h4>
                    <ul id="dashboard-quest-list"></ul>
                </div>
                <div class="dash-card card-journey">
                    <h4>Academic Journey</h4>
                    <div class="journey-stepper">
                        <div class="step ${userData.year === 'Freshman' ? 'active' : ''}">Freshman</div>
                        <div class="step ${userData.year === 'Sophomore' ? 'active' : ''}">Sophomore</div>
                        <div class="step ${userData.year === 'Junior' ? 'active' : ''}">Junior</div>
                        <div class="step ${userData.year === 'Senior' ? 'active' : ''}">Senior</div>
                    </div>
                </div>
                <div class="dash-card card-leaderboard">
                    <h4>Leaderboard - Top 5</h4>
                    <ol id="dashboard-leaderboard-list"></ol>
                </div>
                <div class="dash-card card-points">
                    <h4>Points Breakdown</h4>
                    <div class="points-circle-placeholder">
                        <p><strong>Total Points</strong><br>${userData.points || 0}</p>
                    </div>
                    <div id="points-breakdown-list"></div>
                </div>
            </div>
        `;

        renderDashboardQuests(questsSnapshot, userData.completedQuests || []);
        renderDashboardLeaderboard(leaderboardSnapshot);
        renderPointsBreakdown(user); // Re-using your existing function

    } catch (error) {
        console.error("Error rendering dashboard: ", error);
        mainContent.innerHTML = '<h2>Could not load dashboard.</h2>';
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
    const mainContent = document.getElementById('content');
    mainContent.innerHTML = `
        <div class="leaderboard-container">
            <h2>Leaderboard</h2>
            <ul id="leaderboard-list"><li>Loading...</li></ul>
        </div>
    `;
    const leaderboardList = document.getElementById('leaderboard-list');
    
    try {
        const usersSnapshot = await db.collection('users').orderBy('points', 'desc').get();
        leaderboardList.innerHTML = ''; // Clear the 'Loading...' message
        let rank = 1;
        if (!usersSnapshot.empty) {
            usersSnapshot.forEach(doc => {
                const leaderboardUser = doc.data();
                const li = document.createElement('li');
                li.classList.add('leaderboard-item');
                // Highlight the current user
                if (doc.id === user.uid) {
                    li.classList.add('current-user');
                }
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
        leaderboardList.innerHTML = '<p>Could not load leaderboard.</p>';
    }
}

async function renderProfile(user) {
    const mainContent = document.getElementById('content');
    const userDoc = await db.collection('users').doc(user.uid).get();
    
    let userData = {};
    if (userDoc.exists) {
        userData = userDoc.data();
    }

    mainContent.innerHTML = `
        <div class="profile-container">
            <h2>My Profile</h2>
            <div class="profile-card">
                <h3 id="profile-card-name">${userData.name || 'N/A'}</h3>
                <p id="profile-card-year">University Year: ${userData.year || 'N/A'}</p>
            </div>
            <form id="profile-form">
                <input type="text" id="profile-name" placeholder="Full Name" value="${userData.name || ''}" required>
                <input type="text" id="profile-id" placeholder="University ID" value="${userData.universityId || ''}" required>
                <input type="email" id="profile-email" placeholder="Email" value="${user.email}" disabled>
                <select id="profile-year">
                    <option value="Freshman" ${userData.year === 'Freshman' ? 'selected' : ''}>Freshman</option>
                    <option value="Sophomore" ${userData.year === 'Sophomore' ? 'selected' : ''}>Sophomore</option>
                    <option value="Junior" ${userData.year === 'Junior' ? 'selected' : ''}>Junior</option>
                    <option value="Senior" ${userData.year === 'Senior' ? 'selected' : ''}>Senior</option>
                </select>
                <textarea id="profile-courses" placeholder="Courses (comma-separated)">${(userData.courses || []).join(', ')}</textarea>
                <button type="submit">Update Profile</button>
            </form>
        </div>
    `;

    // Re-attach event listener since we are overwriting the HTML
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
