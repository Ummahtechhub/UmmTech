import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
  const regForm = document.getElementById('registerForm');
  const backToLogin = document.getElementById('backToLogin');

  // 🔹 Back to Login button
  backToLogin.onclick = () => {
    // Adjust path depending on folder structure
    window.location.href = "index.html"; // if register.html is in root
    // window.location.href = "../index.html"; // if register.html is in /register/ folder
  };

  // 🔹 Firebase registration
  regForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('tel').value.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Invalid email format!");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const user = credential.user;

      await updateProfile(user, { displayName: name });

      // Save user data in Firestore
      await Promise.all([
        setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email,
          displayName: name,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          status: "active",
          role: "user"
        }),
        setDoc(doc(db, "userProfiles", user.uid), {
          userId: user.uid,
          name,
          bio: "",
          phone: phone || "",
          department: "",
          semester: 0,
          skills: [],
          interests: [],
          socialLinks: {},
          profileImage: "",
          backgroundImage: "",
          joinedTeams: [],
          createdProjects: [],
          registeredEvents: [],
          updatedAt: serverTimestamp()
        }),
        setDoc(doc(db, "userSettings", user.uid), {
          userId: user.uid,
          theme: "light",
          email,
          emailNotifications: {
            events: true,
            projects: true,
            teams: true,
            messages: true,
            weekly: false
          },
          pushNotifications: true,
          privacy: {
            profileVisibility: "public",
            showEmail: false,
            showPhone: false,
            allowDirectMessages: true
          },
          language: "en",
          timezone: "UTC",
          updatedAt: serverTimestamp()
        })
      ]);

      localStorage.setItem('registeredEmail', email);
      localStorage.setItem('ummah_user', JSON.stringify({ uid: user.uid, email, name }));

      alert("Registration successful! Redirecting to dashboard...");
      window.location.href = "home.html";
    } catch (error) {
      console.error("Registration error:", error);
      alert(`Registration failed: ${error.message}`);
    }
  });
});
