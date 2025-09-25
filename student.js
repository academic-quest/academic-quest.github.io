document.addEventListener('DOMContentLoaded', () => {
    const auth = firebase.auth();
    const db = firebase.firestore();
    const adminEmail = "admin@admin.com";

    auth.onAuthStateChanged(user => {
        if (user) {
            // User is logged in, run the main app logic
            runStudentApp(user);
        }
    });

    function runStudentApp(user) {
        // Display user-specific info in the header
        document.getElementById('user-email').textContent = user.email;
        document.getElementById('admin-link-container').style.display = user.email === adminEmail ? 'list-item' : 'none';
        document.getElementById('logout-btn').addEventListener('click', () => auth.signOut());

        // Set up navigation
        window.addEventListener('hashchange', () => loadPageContent(user));
        loadPageContent(user); // Load the initial page
    }

    async function loadPageContent(user) {
        const pageId = window.location.hash || '#dashboard';

        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === pageId);
        });

        if (pageId === '#dashboard') {
            await renderDashboard(user);
        } else {
            document.getElementById('content').innerHTML = `<h2>${pageId.substring(1)} Page</h2><p>This page is under construction.</p>`;
        }
    }

    async function renderDashboard(user) {
        const mainContent = document.getElementById('content');
        mainContent.innerHTML = `<h2>Loading Dashboard...</h2>`;
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (!userDoc.exists) {
                return mainContent.innerHTML = '<h2>Error: User data not found. Please sign up again.</h2>';
            }
            const userData = userDoc.data();
            mainContent.innerHTML = `<div class="dashboard-grid"><h2>Welcome, ${userData.name}!</h2><p>Your dashboard is ready.</p></div>`;
        } catch (error) {
            console.error("Dashboard Error:", error);
            mainContent.innerHTML = `<h2>Error loading dashboard: ${error.message}</h2>`;
        }
    }
});
