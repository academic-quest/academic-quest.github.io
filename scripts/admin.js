document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('loader');
    const adminContainer = document.getElementById('admin-container');
    const logoutBtn = document.getElementById('logout-btn');

    const questForm = document.getElementById('quest-form');
    const formTitle = document.getElementById('form-title');
    const questIdField = document.getElementById('quest-id');
    const saveQuestBtn = document.getElementById('save-quest-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const adminQuestList = document.getElementById('admin-quest-list');

    // Authentication check
    auth.onAuthStateChanged(user => {
        if (user && user.email === 'admin@admin.com') {
            loader.style.display = 'none';
            adminContainer.style.display = 'grid';
            loadQuests();
        } else {
            // If not admin, redirect to student dashboard
            window.location.href = 'index.html';
        }
    });

    // Logout
    logoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => {
            window.location.href = 'auth.html';
        });
    });

    // Real-time listener for quests
    const loadQuests = () => {
        db.collection('quests').orderBy('deadline', 'desc').onSnapshot(snapshot => {
            adminQuestList.innerHTML = '';
            if (snapshot.empty) {
                adminQuestList.innerHTML = '<p>No quests found. Add one to get started.</p>';
                return;
            }
            snapshot.forEach(doc => {
                const quest = { id: doc.id, ...doc.data() };
                const questElement = document.createElement('div');
                questElement.classList.add('admin-quest-item');
                questElement.innerHTML = `
                    <div class="admin-quest-info">
                        <p class="name">${quest.name}</p>
                        <p class="points">${quest.points} points - Due: ${quest.deadline}</p>
                    </div>
                    <div class="admin-quest-actions">
                        <button class="btn-edit" data-id="${quest.id}"><i class="fas fa-edit"></i></button>
                        <button class="btn-delete" data-id="${quest.id}"><i class="fas fa-trash"></i></button>
                    </div>
                `;
                adminQuestList.appendChild(questElement);
            });
        }, error => {
            console.error("Error fetching quests:", error);
        });
    };

    // Form submission (handles both Add and Edit)
    questForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = questIdField.value;
        const questData = {
            name: questForm['quest-name'].value,
            description: questForm['quest-desc'].value,
            points: parseInt(questForm['quest-points'].value),
            deadline: questForm['quest-deadline'].value,
            badge: questForm['quest-badge'].value
        };

        if (id) {
            // Update existing quest
            await db.collection('quests').doc(id).update(questData);
        } else {
            // Add new quest
            await db.collection('quests').add(questData);
        }
        
        resetForm();
    });

    // Handle clicks on Edit and Delete buttons
    adminQuestList.addEventListener('click', async (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const id = target.getAttribute('data-id');

        if (target.classList.contains('btn-delete')) {
            if (confirm('Are you sure you want to delete this quest?')) {
                await db.collection('quests').doc(id).delete();
            }
        }

        if (target.classList.contains('btn-edit')) {
            const questDoc = await db.collection('quests').doc(id).get();
            if (questDoc.exists) {
                const quest = questDoc.data();
                formTitle.textContent = 'Edit Quest';
                questIdField.value = id;
                questForm['quest-name'].value = quest.name;
                questForm['quest-desc'].value = quest.description;
                questForm['quest-points'].value = quest.points;
                questForm['quest-deadline'].value = quest.deadline;
                questForm['quest-badge'].value = quest.badge;
                saveQuestBtn.textContent = 'Update Quest';
                cancelEditBtn.style.display = 'inline-block';
                window.scrollTo(0, 0); // Scroll to top to see the form
            }
        }
    });

    // Cancel Edit button
    cancelEditBtn.addEventListener('click', () => {
        resetForm();
    });
    
    // Function to reset the form to its initial state
    const resetForm = () => {
        questForm.reset();
        questIdField.value = '';
        formTitle.textContent = 'Add New Quest';
        saveQuestBtn.textContent = 'Save Quest';
        cancelEditBtn.style.display = 'none';
    };
});
