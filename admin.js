document.addEventListener('DOMContentLoaded', () => {
    // Only run this script on the admin page
    if (!document.body.classList.contains('admin-page')) return;

    const auth = firebase.auth();
    const db = firebase.firestore();

    auth.onAuthStateChanged(user => {
        if (user && user.email === "admin@admin.com") {
            runAdminPanel(user);
        } else {
            // If not admin, kick them out
            window.location.href = 'index.html';
        }
    });

    function runAdminPanel(user) {
        const addQuestForm = document.getElementById('add-quest-form');
        const questList = document.getElementById('quest-list');

        addQuestForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const questData = {
                name: addQuestForm['quest-name'].value,
                points: parseInt(addQuestForm['quest-points'].value),
                description: addQuestForm['quest-description'].value,
                deadline: new Date(addQuestForm['quest-deadline'].value),
                badge: addQuestForm['quest-badge'].value || null
            };
            try {
                await db.collection('quests').add(questData);
                alert('Quest added successfully!');
                addQuestForm.reset();
                displayQuests();
            } catch (error) {
                console.error("Error adding quest:", error);
                alert(`Error: ${error.message}`);
            }
        });

        async function displayQuests() {
            questList.innerHTML = '<li>Loading quests...</li>';
            const snapshot = await db.collection('quests').orderBy('deadline', 'desc').get();
            questList.innerHTML = '';
            snapshot.forEach(doc => {
                const quest = doc.data();
                const li = document.createElement('li');
                li.textContent = `${quest.name} - ${quest.points} pts`;
                questList.appendChild(li);
            });
        }

        displayQuests(); // Initial load
    }
});
