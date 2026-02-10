import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
    const regForm = document.querySelector('form');
    const backToLogin = document.querySelector('a');

    // Dynamic link to login
   backToLogin.href = "../index.html";


    regForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const name = document.getElementById('name').value.trim();
        const phone = document.getElementById('tel').value.trim();

        // Strict Email Check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert("Invalid email format! Please use a valid email address.");
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

            await Promise.all([
                setDoc(doc(db, "users", user.uid), {
                    uid: user.uid,
                    email: email,
                    displayName: name,
                    createdAt: serverTimestamp(),
                    lastLogin: serverTimestamp(),
                    status: "active",
                    role: "user"
                }),
                setDoc(doc(db, "userProfiles", user.uid), {
                    userId: user.uid,
                    name: name,
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
                    email: email,
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
