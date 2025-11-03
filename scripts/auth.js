document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginError = document.getElementById('login-error');
    const signupError = document.getElementById('signup-error');

    const showSignupLink = document.getElementById('show-signup');
    const showLoginLink = document.getElementById('show-login');
    const loginContainer = document.getElementById('login-container');
    const signupContainer = document.getElementById('signup-container');

    const forgotLink = document.getElementById('forgot-link');
    const resetPanel = document.getElementById('reset-panel');
    const resetForm = document.getElementById('reset-form');
    const resetEmail = document.getElementById('reset-email');
    const resetMsg = document.getElementById('reset-msg');
    const resetClose = document.getElementById('reset-close');

    // Switch between login and signup forms
    showSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginContainer.classList.add('hidden');
        signupContainer.classList.remove('hidden');
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        signupContainer.classList.add('hidden');
        loginContainer.classList.remove('hidden');
    });

    // Login functionality
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = loginForm['login-email'].value;
        const password = loginForm['login-password'].value;
        
        auth.signInWithEmailAndPassword(email, password)
            .then(userCredential => {
                window.location.href = 'index.html';
            })
            .catch(error => {
                loginError.textContent = error.message;
            });
    });

    // Signup functionality
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const fullName = signupForm['signup-name'].value;
        const universityId = signupForm['signup-uid'].value;
        const email = signupForm['signup-email'].value;
        const password = signupForm['signup-password'].value;
        const universityYear = signupForm['signup-year'].value;
        const courses = signupForm['signup-course'].value;

        auth.createUserWithEmailAndPassword(email, password)
            .then(userCredential => {
                const user = userCredential.user;
                // Create a corresponding document in Firestore
                return db.collection('users').doc(user.uid).set({
                    fullName,
                    universityId,
                    email,
                    universityYear: parseInt(universityYear),
                    courses,
                    points: 0,
                    level: 1,
                    completedQuests: [],
                    badges: [],
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            })
            .then(() => {
                window.location.href = 'index.html';
            })
            .catch(error => {
                signupError.textContent = error.message;
            });
    });
});
