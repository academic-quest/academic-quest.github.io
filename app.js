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
      // use a secondary app so we don't switch the current session
      const secondary = firebase.initializeApp(window.FIREBASE_CONFIG, "secondary");
      const sAuth = secondary.auth();

      const cred = await sAuth.createUserWithEmailAndPassword("admin@admin.com", "123456");
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

      await sAuth.signOut();
      await secondary.delete();
      console.log("✅ Default admin created (secondary app, session preserved)");
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

      db.collection("users").doc(user.uid).onSnapshot(doc => {
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

// =============================
// 📋 Render Quests (Dashboard + Quests page)
// =============================
async function renderQuests() {
  const snap = await db.collection("quests").orderBy("createdAt", "desc").get();

  // Dashboard "Current Quests" (ul#currentQuests)
  const ul = document.getElementById("currentQuests");
  ul.innerHTML = "";
  snap.forEach(doc => {
    const q = doc.data();
    const li = document.createElement("li");
    li.textContent = `${q.title} (+${q.pts})`;
    ul.appendChild(li);
  });

  // Quests page (div#questGrid)
  const grid = document.getElementById("questGrid");
  grid.innerHTML = "";
  snap.forEach(doc => {
    const q = doc.data();
    const card = document.createElement("div");
    card.className = "quest-card";
    card.innerHTML = `
      <div class="q-title">${q.title}</div>
      <div class="q-pts">+${q.pts} pts</div>
    `;
    grid.appendChild(card);
  });
  
    // Render donut chart (live updates)
    renderDonut(u.breakdown || {});

    renderQuests();  
    // 🔥 Render full Profile page
    document.getElementById("pfName").innerText = u.name || "—";
    document.getElementById("pfId").innerText = u.studentId || "—";
    document.getElementById("pfYear").innerText = u.year || "—";
    document.getElementById("pfCourses").innerText = (u.courses || []).join(", ");
    document.getElementById("pfPoints").innerText = u.points || 0;
    document.getElementById("pfBadges").innerHTML = (u.badges || [])
      .map(b => `<span class="badge">${b}</span>`).join(" ");
    document.getElementById("activityLog").innerHTML = (u.activity || [])
      .map(a => `<li>${a.msg}</li>`).join("");      

    // ✍️ Prefill edit form
    document.getElementById("editName").value = u.name || "";
    document.getElementById("editId").value = u.studentId || "";
    document.getElementById("editCourses").value = (u.courses || []).join(", ");
    document.getElementById("editYear").value = u.year || "Freshman";            
  }
});
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
// 🛠️ Admin Button Listeners
// =============================
const addQuestBtn = document.getElementById("addQuest");
const addBadgeBtn = document.getElementById("addBadge");

if (addQuestBtn) {
  addQuestBtn.addEventListener("click", () => window.addQuest());
}
if (addBadgeBtn) {
  addBadgeBtn.addEventListener("click", () => window.addBadge());
}

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
  const title = document.getElementById("adminQuestTitle").value.trim();
  const pts = parseInt(document.getElementById("adminQuestPts").value) || 0;
  if (!title) return alert("Enter a quest title.");
  await db.collection("quests").add({
    title, pts, createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  alert("Quest added ✅");
  renderQuests();
};
window.addBadge = async function() {
  const id = document.getElementById("adminBadgeId").value.trim();
  const label = document.getElementById("adminBadgeLabel").value.trim();
  if (!id || !label) return alert("Enter badge id and label.");
  await db.collection("badges").doc(id).set({
    id, label, createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  alert("Badge added ✅");
  // badges show on profile from user doc; awarding flow can be added later
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
  // =============================
// 💾 Save Profile (all fields)
// =============================
document.getElementById("saveProfile").addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return;

  const name = document.getElementById("editName").value.trim();
  const studentId = document.getElementById("editId").value.trim();
  const courses = document.getElementById("editCourses").value
    .split(",").map(c => c.trim()).filter(Boolean);
  const year = document.getElementById("editYear").value;

  await db.collection("users").doc(user.uid).set({
    name,
    studentId,
    courses,
    year,
    activity: firebase.firestore.FieldValue.arrayUnion({
      msg: "Profile updated (name/id/courses/year)",
      ts: firebase.firestore.FieldValue.serverTimestamp()
    })
  }, { merge: true });

  renderJourney(year);
  alert("Profile saved ✅");
});
}
function renderDonut(breakdown) {
  const canvas = document.getElementById("donut");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Default values
  const data = {
    assignments: breakdown.assignments || 0,
    exams: breakdown.exams || 0,
    attendance: breakdown.attendance || 0,
    other: breakdown.other || 0
  };

  const total = Object.values(data).reduce((a, b) => a + b, 0) || 1;

  const colors = ["#2563eb", "#16a34a", "#f59e0b", "#9ca3af"]; // blue, green, orange, gray
  const values = Object.values(data);
  let start = 0;

  values.forEach((val, i) => {
    const slice = (val / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, canvas.height / 2);
    ctx.arc(canvas.width / 2, canvas.height / 2, 90, start, start + slice);
    ctx.fillStyle = colors[i];
    ctx.fill();
    start += slice;
  });

  // Hollow center
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, 50, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();
}
