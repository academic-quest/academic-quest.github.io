document.addEventListener('DOMContentLoaded', () => {
    // Authentication guard
    auth.onAuthStateChanged(user => {
        if (!user || user.email !== adminEmail) {
            alert("Access denied.");
            window.location.href = 'index.html';
        } else {
            runAdminPanel();
        }
    });

    function runAdminPanel() {
        const addQuestForm = document.getElementById('add-quest-form');
        const questList = document.getElementById('quest-list');

        // Handle form submission to add new quests
        addQuestForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const questData = {
                name: addQuestForm['quest-name'].value,
                description: addQuestForm['quest-description'].value,
                points: parseInt(addQuestForm['quest-points'].value),
                badge: addQuestForm['quest-badge'].value || null
            };

            try {
                await db.collection('quests').add(questData);
                alert("Quest added!");
                addQuestForm.reset();
                loadQuests();
            } catch (error) {
                console.error(error);
                alert(`Error: ${error.message}`);
            }
        });

        // Function to load and display existing quests
        async function loadQuests() {
            questList.innerHTML = `<li>Loading...</li>`;
            const snapshot = await db.collection('quests').get();
            questList.innerHTML = '';
            snapshot.forEach(doc => {
                const quest = doc.data();
                questList.innerHTML += `<li>${quest.name} (+${quest.points} pts)</li>`;
            });
        }
        
        // Initial load
        loadQuests();
    }
});
