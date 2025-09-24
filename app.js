if (!window.FIREBASE_CONFIG || !window.FIREBASE_CONFIG.apiKey) {
  alert("⚠️ Firebase not configured. Edit config.js");
} else {
  firebase.initializeApp(window.FIREBASE_CONFIG);
  const auth = firebase.auth();
  const db = firebase.firestore();

  // =============================
  // 🔑 Default Admin Auto-Create
  // =============================
  async function ensureAdmin() {
    try {
      const methods = await auth.fetchSignInMethodsForEmail("admin@admin.com");
      if (methods.length === 0) {
        const cred = await auth.createUserWithEmailAndPassword("admin@admin.com", "123456");
        await db.collection("users").doc(cred.user.uid).set({
          name: "Administrator",
          studentId: "ADMIN",
          email: "admin@admin.com",
          year: "Admin",
          role: "admin",
          points: 0,
          badges: [],
          quests: [],
          activity: [
            { msg: "Default admin created", ts: firebase.firestore.FieldValue.serverTimestamp() }
          ]
        });
        console.log("✅ Default admin created");
      }
    } catch (e) {
      console.log("Admin ensure error:", e.message);
    }
  }
  ensureAdmin();

  // =============================
  // 🟢 Sign Up
  // =============================
  document.getElementById("signupForm").addEventListener("submit", async e => {
    e.preventDefault();
    const name = document.getElementById("suName").value;
    const studentId = document.getElementById("suStudentId").value;
    const email = document.getElementById("suEmail").value;
    const pass = document.getElementById("suPass").value;
    const pass2 = document.getElementById("suPass2").value;
    const year = document.getElementById("suYear").value;
    const courses = document.getElementById("suCourses").value.split(",").map(c => c.trim());

    if (pass !== pass2) {
      alert("Passwords do not match.");
      return;
    }

    try {
      const cred = await auth.createUserWithEmailAndPassword(email, pass);
      await db.collection("users").doc(cred.user.uid).set({
        name,
        studentId,
        email,
        year,
        role: "student",
        points: 0,
        badges: [],
        courses,
        quests: [],
        activity: [
          { msg: "Account created", ts: firebase.firestore.FieldValue.serverTimestamp() }
        ]
      });
      alert("✅ Account created. Please login.");
    } catch (err) {
      alert("Signup error: " + err.message);
    }
  });

  // =============================
  // 🔵 Login
  // =============================
  document.getElementById("loginForm").addEventListener("submit", async e => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const pass = document.getElementById("loginPass").value;
    try {
      await auth.signInWithEmailAndPassword(email, pass);
    } catch (err) {
      alert("Login error: " + err.message);
    }
  });

  // =============================
  // 🔴 Logout
  // =============================
  document.getElementById("logoutBtn").addEventListener("click", () => {
    auth.signOut().then(() => location.reload());
  });

  // =============================
  // 👤 Auth State Change
  // =============================
  auth.onAuthStateChanged(async user => {
    if (user) {
      document.getElementById("auth-section").classList.add("hidden");
      document.getElementById("tab-dashboard").classList.remove("hidden");

      const doc = await db.collection("users").doc(user.uid).get();
      if (doc.exists) {
        const u = doc.data();

        // Show admin tab if role is admin
        if (u.role === "admin") {
          document.getElementById("admin-tab").style.display = "inline";
        }

        // Render profile info
        document.getElementById("infoName").innerText = u.name || "—";
        document.getElementById("infoId").innerText = u.studentId || "—";

        // Render journey
        renderJourney(u.year || "Freshman");

        // Render leaderboard
        renderLeaderboard();
      }
    } else {
      // Not logged in
      document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
      document.getElementById("auth-section").classList.remove("hidden");
    }
  });

  // =============================
  // 📌 Navigation Tabs
  // =============================
  document.querySelectorAll("[data-tab]").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const tab = link.getAttribute("data-tab");

      document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
      document.getElementById(`tab-${tab}`).classList.remove("hidden");
    });
  });

  // =============================
  // 📊 Academic Journey
  // =============================
  function renderJourney(currentYear) {
    const levels = ["Freshman","Second Year","Third Year","Final Year"];
    let html = "";
    levels.forEach(l => {
      html += `<span class="step ${l === currentYear ? "active":""}">${l}</span>`;
    });
    document.getElementById("journey").innerHTML = html;
    document.getElementById("journeyLevel").innerText = "Current Year: " + currentYear;
  }

  // =============================
  // 🏆 Leaderboard
  // =============================
  async function renderLeaderboard() {
    const snap = await db.collection("users").orderBy("points","desc").get();
    let rows = "", i = 1, top5 = "";
    snap.forEach(doc => {
      const d = doc.data();
      rows += `<tr><td>${i}</td><td>${d.name || d.email}</td><td>${d.year || ""}</td><td>${d.points || 0}</td></tr>`;
      if (i <= 5) {
        top5 += `<li>${d.name || d.email} - ${d.points || 0} pts</li>`;
      }
      i++;
    });
    document.getElementById("lbTable").innerHTML = rows;
    document.getElementById("top5").innerHTML = top5;
  }

  // =============================
  // ➕ Admin: Quests & Badges
  // =============================
  window.addQuest = async function() {
    const title = document.getElementById("adminQuestTitle").value;
    const pts = parseInt(document.getElementById("adminQuestPts").value) || 0;
    await db.collection("quests").add({
      title,
      pts,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    alert("Quest added ✅");
  };

  window.addBadge = async function() {
    const id = document.getElementById("adminBadgeId").value;
    const label = document.getElementById("adminBadgeLabel").value;
    await db.collection("badges").doc(id).set({
      id,
      label,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    alert("Badge added ✅");
  };

  // =============================
  // ✏️ Profile Update (Year only for now)
  // =============================
  window.updateYear = async function() {
    const year = document.getElementById("editYear").value;
    await db.collection("users").doc(auth.currentUser.uid).update({ year });
    renderJourney(year);
    alert("Academic year updated to " + year);
  };
}
