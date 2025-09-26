document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('loader');
    const appContainer = document.getElementById('app-container');
    const logoutBtn = document.getElementById('logout-btn');
    const adminPanelLink = document.getElementById('admin-panel-link');
    const navLinks = document.querySelectorAll('.nav-link[data-page]');
    const pages = document.querySelectorAll('.page');

    let currentUser = null;
    let currentUserData = null;
    let allQuests = [];
    let allUsers = [];

    // Check auth state
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            // Show admin link if user is the admin
            if (user.email === 'admin@admin.com') {
                adminPanelLink.style.display = 'block';
            }
            initializeApp();
        } else {
            // If no user, redirect to login page
            window.location.href = 'auth.html';
        }
    });

    // Logout functionality
    logoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => {
            window.location.href = 'auth.html';
        });
    });

    // SPA Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.getAttribute('data-page');
            
            if (!pageId) return;

            pages.forEach(page => page.classList.remove('active'));
            navLinks.forEach(nav => nav.classList.remove('active'));
            
            document.getElementById(pageId).classList.add('active');
            link.classList.add('active');
        });
    });
    
    // Main data fetching and app initialization
    const initializeApp = async () => {
        loader.style.display = 'flex';
        try {
            // Fetch all necessary data in parallel
            const [userDoc, questsSnapshot, usersSnapshot] = await Promise.all([
                db.collection('users').doc(currentUser.uid).get(),
                db.collection('quests').get(),
                db.collection('users').orderBy('points', 'desc').get()
            ]);

            if (userDoc.exists) {
                currentUserData = { id: userDoc.id, ...userDoc.data() };
            } else {
                console.error("User data not found!");
                auth.signOut();
                return;
            }
            
            allQuests = questsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Render all components
            renderDashboard();
            renderQuestsPage();
            renderLeaderboardPage();
            renderProfilePage();
            
        } catch (error) {
            console.error("Error initializing app:", error);
        } finally {
            loader.style.display = 'none';
        }
    };
    
    // --- RENDER FUNCTIONS --- //
    
    const renderDashboard = () => {
        // Profile Card
        document.getElementById('dashboard-username').textContent = currentUserData.fullName;
        document.getElementById('dashboard-uid').textContent = `ID: ${currentUserData.universityId}`;
        document.getElementById('dashboard-level').textContent = currentUserData.level;
        document.getElementById('dashboard-points').textContent = currentUserData.points;
        // Progress bar (simple logic: points towards next level)
        const pointsForNextLevel = currentUserData.level * 100;
        const progress = (currentUserData.points % pointsForNextLevel) / pointsForNextLevel * 360;
        document.getElementById('level-progress-bar').style.background = `conic-gradient(#FFC72C ${progress}deg, #e0e0e0 0deg)`;

        // Academic Journey
        const stepperContainer = document.getElementById('journey-stepper');
        stepperContainer.innerHTML = '';
        for (let i = 1; i <= 4; i++) {
            let stepClass = 'step';
            if (i < currentUserData.universityYear) {
                stepClass += ' completed';
            } else if (i == currentUserData.universityYear) {
                stepClass += ' active';
            }
            stepperContainer.innerHTML += `
                <div class="${stepClass}">
                    <div class="step-circle">${i}</div>
                    <span class="step-label">Year ${i}</span>
                </div>
            `;
        }

        // Current Quests (show top 5 uncompleted)
        const questsList = document.getElementById('dashboard-quests-list');
        questsList.innerHTML = '';
        const uncompletedQuests = allQuests
            .filter(q => !currentUserData.completedQuests.includes(q.id))
            .slice(0, 5);
            
        if (uncompletedQuests.length > 0) {
            uncompletedQuests.forEach(quest => {
                questsList.innerHTML += `
                    <div class="quest-item">
                        <div class="quest-item-info">
                            <span class="name">${quest.name}</span>
                            <span class="points">${quest.points} Points</span>
                        </div>
                        <a href="#" class="nav-link" data-page="quests"><button class="btn">View</button></a>
                    </div>
                `;
            });
        } else {
            questsList.innerHTML = '<p>No new quests available.</p>';
        }

        // Leaderboard Preview
        const leaderboardList = document.getElementById('dashboard-leaderboard-list');
        leaderboardList.innerHTML = '';
        const top5Users = allUsers.slice(0, 5);
        top5Users.forEach((user, index) => {
            leaderboardList.innerHTML += `
                <li class="leaderboard-item">
                    <span class="rank">${index + 1}</span>
                    <span class="name">${user.fullName}</span>
                    <span class="points">${user.points} pts</span>
                </li>
            `;
        });
    };

    const renderQuestsPage = () => {
        const questContainer = document.getElementById('full-quests-list');
        questContainer.innerHTML = '';
        allQuests.forEach(quest => {
            const isCompleted = currentUserData.completedQuests.includes(quest.id);
            const isDeadlinePassed = new Date(quest.deadline) < new Date();
            const badgeHTML = quest.badge.startsWith('fa-')
                ? `<i class="fas ${quest.badge}"></i>` // If it's an icon
                : `<img src="${quest.badge}" alt="Badge">`; // If it's an image
            const deadlineDate = new Date(quest.deadline);
            const formattedDeadline = deadlineDate.toLocaleString('en-US', { 
                month: 'short', day: 'numeric', year: 'numeric', 
                hour: 'numeric', minute: '2-digit', hour12: true 
            }); // Example: "Oct 24, 2025, 5:30 PM"

            const questCard = `
                <div class="full-quest-card ${isCompleted ? 'completed' : ''}">
                    <div class="quest-header">
                        <div>
                            <h3 class="quest-title">${quest.name}</h3>
                            <span class="quest-points">${quest.points} Points</span>
                        </div>
                        <div class="badge">${badgeHTML}</div>
                    </div>
           
                    <p class="quest-description">${quest.description}</p>
                    <div class="quest-footer">
                        <span class="quest-deadline">Due: ${quest.deadline}</span>
                        <button class="btn complete-quest-btn" data-quest-id="${quest.id}" ${isCompleted || isDeadlinePassed ? 'disabled' : ''}>
                            ${isCompleted ? 'Completed' : isDeadlinePassed ? 'Expired' : 'Complete Quest'}
                        </button>
                    </div>
                </div>
            `;
            questContainer.innerHTML += questCard;
        });

        // Add event listeners to "Complete Quest" buttons
        document.querySelectorAll('.complete-quest-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const questId = e.target.getAttribute('data-quest-id');
                await completeQuest(questId);
            });
        });
    };
    
    const renderLeaderboardPage = () => {
        const leaderboardContainer = document.getElementById('full-leaderboard');
        leaderboardContainer.innerHTML = '';
        allUsers.forEach((user, index) => {
            const isCurrentUser = user.id === currentUser.uid;
            leaderboardContainer.innerHTML += `
                <div class="leaderboard-row ${isCurrentUser ? 'current-user' : ''}">
                    <div class="leaderboard-rank">${index + 1}</div>
                    <div class="leaderboard-name">${user.fullName}</div>
                    <div class="leaderboard-points">${user.points} Points</div>
                </div>
            `;
        });
    };
    
    const renderProfilePage = () => {
        // Box 1: Display Info
        document.getElementById('profile-name').textContent = currentUserData.fullName;
        document.getElementById('profile-uid').textContent = currentUserData.universityId;
        document.getElementById('profile-year').textContent = `Year ${currentUserData.universityYear}`;
        document.getElementById('profile-email').textContent = currentUserData.email;
        document.getElementById('profile-courses').textContent = currentUserData.courses;

        // Box 2: Achievements
        document.getElementById('profile-points').textContent = currentUserData.points;
        const badgeGallery = document.getElementById('profile-badges');
        badgeGallery.innerHTML = '';
        if (currentUserData.badges && currentUserData.badges.length > 0) {
            currentUserData.badges.forEach(badge => {
                const badgeContent = badge.startsWith('fa-')
                    ? `<i class="fas ${badge}"></i>` // If it's an icon
                    : `<img src="${badge}" alt="Earned Badge">`; // If it's an image

                badgeGallery.innerHTML += `<div class="badge-item" title="${badge}">${badgeContent}</div>`;
            });
        } else {
            badgeGallery.innerHTML = '<p>No badges earned yet.</p>';
        }

        // Box 3: Update Form - Pre-fill with current data
        document.getElementById('update-name').value = currentUserData.fullName;
        document.getElementById('update-uid').value = currentUserData.universityId;
        document.getElementById('update-year').value = currentUserData.universityYear;
        document.getElementById('update-courses').value = currentUserData.courses;
    };
    
    // --- ACTION FUNCTIONS --- //
    
    const completeQuest = async (questId) => {
        const quest = allQuests.find(q => q.id === questId);
        if (!quest) return;
        
        loader.style.display = 'flex';
        try {
            await db.collection('users').doc(currentUser.uid).update({
                points: firebase.firestore.FieldValue.increment(quest.points),
                completedQuests: firebase.firestore.FieldValue.arrayUnion(quest.id),
                badges: firebase.firestore.FieldValue.arrayUnion(quest.badge)
            });
            // Re-fetch data and re-render
            await initializeApp();
        } catch (error) {
            console.error("Error completing quest:", error);
        } finally {
            loader.style.display = 'none';
        }
    };
    
    // Profile Update Form Logic
    const updateProfileForm = document.getElementById('update-profile-form');
    updateProfileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loader.style.display = 'flex';
        
        const updatedData = {
            fullName: document.getElementById('update-name').value,
            universityId: document.getElementById('update-uid').value,
            universityYear: parseInt(document.getElementById('update-year').value),
            courses: document.getElementById('update-courses').value,
        };
        
        try {
            await db.collection('users').doc(currentUser.uid).update(updatedData);
            
            // Re-fetch data to reflect changes immediately
            await initializeApp(); 
            
            const successMsg = document.getElementById('update-success-msg');
            successMsg.textContent = "Profile updated successfully!";
            setTimeout(() => { successMsg.textContent = ''; }, 3000);

        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile.");
        } finally {
            loader.style.display = 'none';
        }
    });

});
