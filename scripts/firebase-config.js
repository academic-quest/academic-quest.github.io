const firebaseConfig = {
  apiKey: "AIzaSyB-vArRoYuCqzIWT_b7xPV1Lt6Ev4T3Bsc",
  authDomain: "academic-quest.firebaseapp.com",
  projectId: "academic-quest",
  storageBucket: "academic-quest.firebasestorage.app",
  messagingSenderId: "44540247560",
  appId: "1:44540247560:web:96e1d5bc34baf97e3b1bbd",
  measurementId: "G-4F3SGQ510Y"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get references to Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
