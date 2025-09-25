<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Access</title>
    <link rel="stylesheet" href="./styles/main.css">
</head>
<body class="auth-page-body">
    <main class="auth-container">
        <div id="login-view">
            <h2>Log In</h2>
            <form id="login-form">
                <input type="email" id="login-email" placeholder="Email" required>
                <input type="password" id="login-password" placeholder="Password" required>
                <button type="submit">Log In</button>
            </form>
            <p>No account? <a href="#" id="show-signup">Sign Up</a></p>
        </div>

        <div id="signup-view" style="display: none;">
            <h2>Create Account</h2>
            <form id="signup-form">
                <input type="text" id="signup-name" placeholder="Full Name" required>
                <input type="text" id="signup-id" placeholder="University ID" required>
                <input type="email" id="signup-email" placeholder="Email" required>
                <input type="password" id="signup-password" placeholder="Password" required>
                <button type="submit">Create Account</button>
            </form>
            <p>Have an account? <a href="#" id="show-login">Log In</a></p>
        </div>
    </main>
    <script src="https://www.gstatic.com/firebasejs/8.6.8/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.6.8/firebase-auth.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.6.8/firebase-firestore.js"></script>
    <script src="./scripts/firebase-config.js"></script>
    <script src="./scripts/auth.js"></script>
</body>
</html>
