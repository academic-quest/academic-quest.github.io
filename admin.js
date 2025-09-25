// This file contains all logic for the admin dashboard (admin.html)

document.addEventListener('DOMContentLoaded', () => {
    const auth = firebase.auth();
    const db = firebase.firestore();
    const adminEmail = "admin@admin.com";

    auth.onAuthStateChanged(user => {
        if (user && user.email === adminEmail) {
            loadAdminPanel();
        } else {
            // Redirect non-admin users away from admin page
            window.location.href = 'index.html';
        }
    });

    // Admin panel functions
    function loadAdminPanel() {
        const addQuestForm = document.getElementById('add-quest-form');
        const addBadgeForm = document.getElementById('add-badge-form');
        const questList = document.getElementById('quest-list');
        const badgeList = document.getElementById('badge-list');

        if (!addQuestForm || !addBadgeForm || !questList || !badgeList) {
            return;
        }

        // Add Quest
        addQuestForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = addQuestForm['quest-name'].value;
            const points = parseInt(addQuestForm['quest-points'].value);
            const type = addQuestForm['quest-type'].value;
            const description = addQuestForm['quest-description'].value;
            await db.collection('quests').add({ name, points, type, description });
            alert('Quest added!');
            addQuestForm.reset();
            displayQuests();
        });

        // Add Badge
        addBadgeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = addBadgeForm['badge-name'].value;
            const description = addBadgeForm['badge-description'].value;
            await db.collection('badges').add({ name, description });
            alert('Badge added!');
            addBadgeForm.reset();
            displayBadges();
        });

        // Display Quests
        async function displayQuests() {
            questList.innerHTML = '';
            const snapshot = await db.collection('quests').get();
            snapshot.forEach(doc => {
                const quest = doc.data();
                const li = document.createElement('li');
                li.innerHTML = `
                    ${quest.name} (+${quest.points} pts)
                    <button class="edit-btn" data-id="${doc.id}">Edit</button>
                    <button class="delete-btn" data-id="${doc.id}">Delete</button>
                `;
                questList.appendChild(li);
            });
        }

        // Display Badges
        async function displayBadges() {
            badgeList.innerHTML = '';
            const snapshot = await db.collection('badges').get();
            snapshot.forEach(doc => {
                const badge = doc.data();
                const li = document.createElement('li');
                li.innerHTML = `${badge.name} <button class="delete-btn" data-id="${doc.id}">Delete</button>`;
                badgeList.appendChild(li);
            });
        }

        // Delete and Edit functionality
        document.addEventListener('click', async (e) => {
            if (e.target.classList.contains('delete-btn')) {
                const docId = e.target.dataset.id;
                const collectionName = e.target.closest('ul').id === 'quest-list' ? 'quests' : 'badges';
                await db.collection(collectionName).doc(docId).delete();
                alert('Item deleted!');
                if (collectionName === 'quests') {
                    displayQuests();
                } else {
                    displayBadges();
                }
            } else if (e.target.classList.contains('edit-btn')) {
                const docId = e.target.dataset.id;
                const docRef = db.collection('quests').doc(docId);
                const doc = await docRef.get();
                const currentData = doc.data();

                const newName = prompt("Enter new quest name:", currentData.name);
                const newPoints = prompt("Enter new points:", currentData.points);
                const newType = prompt("Enter new type:", currentData.type);
                const newDescription = prompt("Enter new description:", currentData.description);

                if (newName !== null && newPoints !== null && newType !== null && newDescription !== null) {
                    await docRef.update({
                        name: newName,
                        points: parseInt(newPoints),
                        type: newType,
                        description: newDescription
                    });
                    alert('Quest updated successfully!');
                    displayQuests();
                } else {
                    alert('Update cancelled.');
                }
            }
        });

        // Initial calls
        displayQuests();
        displayBadges();
    }
});
