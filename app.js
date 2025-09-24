if (!window.FIREBASE_CONFIG || !window.FIREBASE_CONFIG.apiKey) {
  alert("Firebase not configured. Edit config.js");
} else {
  firebase.initializeApp(window.FIREBASE_CONFIG);
  const auth = firebase.auth();
  const db = firebase.firestore();

  // Auto-create admin
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
          activity: [{ msg: "Default admin created", ts: firebase.firestore.FieldValue.serverTimestamp() }]
        });
      }
    } catch (e) { console.log("Admin check error", e.message); }
  }
  ensureAdmin();

  // Signup
  async function signup() {
    const name = document.getElementById("suName").value;
    const studentId = document.getElementById("suStudentId").value;
    const email = document.getElementById("suEmail").value;
    const pass = document.getElementById("suPass").value;
    const year = document.getElementById("suYear").value;
    try {
      const cred = await auth.createUserWithEmailAndPassword(email, pass);
      await db.collection("users").doc(cred.user.uid).set({
        name, studentId, email, year, role: "student", points: 0, badges: [],
        quests: [], activity: [{ msg: "Account created", ts: firebase.firestore.FieldValue.serverTimestamp() }]
      });
      alert("Account created.");
    } catch (err) { alert("Signup error: " + err.message); }
  }

  // Login
  async function login() {
    const email = document.getElementById("loginEmail").value;
    const pass = document.getElementById("loginPass").value;
    try {
      const cred = await auth.signInWithEmailAndPassword(email, pass);
      const doc = await db.collection("users").doc(cred.user.uid).get();
      if (doc.exists) {
        document.getElementById("auth").classList.add("hidden");
        document.getElementById("app").classList.remove("hidden");
        renderJourney();
        renderLeaderboard();
        if (doc.data().role === "admin") document.getElementById("admin-tab").style.display = "inline";
      }
    } catch (err) { alert("Login error: " + err.message); }
  }

  function logout() { auth.signOut().then(() => location.reload()); }

  async function renderJourney() {
    const doc = await db.collection("users").doc(auth.currentUser.uid).get();
    if (!doc.exists) return;
    const year = doc.data().year || "Freshman";
    const levels = ["Freshman","Second Year","Third Year","Final Year"];
    let html = "";
    levels.forEach(l => { html += `<div class="step ${l === year ? "active":""}">${l}</div>`; });
    document.getElementById("journey").innerHTML = html;
    document.getElementById("journeyLevel").innerText = "Current Year: " + year;
  }

  async function renderLeaderboard() {
    const snap = await db.collection("users").orderBy("points","desc").get();
    let rows = "", i = 1;
    snap.forEach(doc => {
      const d = doc.data();
      rows += `<tr><td>${i++}</td><td>${d.name}</td><td>${d.year}</td><td>${d.points}</td></tr>`;
    });
    document.getElementById("lbTable").innerHTML = rows;
    let top = ""; let rank=1;
    snap.forEach(doc => { if(rank<=5){ top+=`<li>${doc.data().name} - ${doc.data().points} pts</li>`; rank++; }});
    document.getElementById("top5").innerHTML = top;
  }

  async function addQuest() {
    const title = document.getElementById("adminQuestTitle").value;
    const pts = parseInt(document.getElementById("adminQuestPts").value)||0;
    await db.collection("quests").add({ title, pts, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    alert("Quest added");
  }

  async function addBadge() {
    const id = document.getElementById("adminBadgeId").value;
    const label = document.getElementById("adminBadgeLabel").value;
    await db.collection("badges").doc(id).set({ id, label, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    alert("Badge added");
  }

  window.signup = signup;
  window.login = login;
  window.logout = logout;
  window.updateYear = async function() {
    const year = document.getElementById("editYear").value;
    await db.collection("users").doc(auth.currentUser.uid).update({ year });
    renderJourney();
  };
  window.addQuest = addQuest;
  window.addBadge = addBadge;

  document.getElementById("logoutBtn").onclick = logout;
  $$(".nav a").forEach(link=>{
    link.onclick = (e)=>{e.preventDefault();showTab(link.dataset.tab);}
  });

  function showTab(tab){
    $$("#app .page").forEach(p=>p.classList.add("hidden"));
    document.getElementById("tab-"+tab).classList.remove("hidden");
  }
}