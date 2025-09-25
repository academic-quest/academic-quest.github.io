document.addEventListener('DOMContentLoaded', () => {
    // Only run this script on the main page (index.html)
    if (!document.querySelector('.main-content')) return;

    const auth = firebase.auth();
    const db = firebase.firestore();

    auth.onAuthStateChanged(user => {
        if (user) {
            runStudentWebsite(user);
        }
    });

    function runStudentWebsite(user) {
        document.getElementById('user-email').textContent = user.email;
        document.getElementById('logout-btn').addEventListener('click', () => auth.signOut());

        if (user.email === "admin@admin.com") {
            document.getElementById('admin-link-container').style.display = 'list-item';
        }

        window.addEventListener('hashchange', () => loadPageContent(user));
        loadPageContent(user); // Load initial page
    }

    async function loadPageContent(user) {
        const pageId = window.location.hash || '#dashboard';
        if (pageId === '#dashboard') {
            await renderDashboard(user);
        } else {
            document.getElementById('content').innerHTML = `<h2>Page not found</h2>`;
        }
    }

    async function renderDashboard(user) {
        const mainContent = document.getElementById('content');
        mainContent.innerHTML = `<h2>Loading Dashboard...</h2>`;
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (!userDoc.exists) throw new Error("User data not found in database.");
            
            const userData = userDoc.data();
            mainContent.innerHTML = `
                <div class="dashboard-grid">
                    <h2>Welcome, ${userData.name}!</h2>
                    <p>This is your dashboard. More features coming soon.</p>
                </div>`;
        } catch (error) {
            console.error("Dashboard Error:", error);
            mainContent.innerHTML = `<h2>Error: Could not load dashboard.</h2><p>${error.message}</p>`;
        }
    }
});
