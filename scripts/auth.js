document.addEventListener('DOMContentLoaded', () => {
    // Redirect if user is already logged in
    auth.onAuthStateChanged(user => {
        if (user) {
            window.location.href = 'index.html';
        }
    });

    const loginView = document.getElementById('login-view');
    const signupView = document.getElementById('signup-view');
    
    // View toggling
    document.getElementById('show-signup').addEventListener('click', (e) => {
        e.preventDefault();
        loginView.style.display = 'none';
        signupView.style.display = 'block';
    });
    document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        loginView.style.display = 'block';
        signupView.style.display = 'none';
    });

    // Login form
    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        auth.signInWithEmailAndPassword(email, password).catch(err => alert(err.message));
    });

    // Signup form
    document.getElementById('signup-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const universityId = document.getElementById('signup-id').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;

        auth.createUserWithEmailAndPassword(email, password)
            .then(cred => {
                // Create a user document in Firestore
                return db.collection('users').doc(cred.user.uid).set({
                    name: name,
                    universityId: universityId,
                    email: email,
                    points: 0,
                    level: 1,
                    year: "Freshman",
                    completedQuests: [],
                    badges: []
                });
            })
            .catch(err => alert(err.message));
    });
});
