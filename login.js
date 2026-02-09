import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const adminInput = document.getElementById('admin');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('submit');
const rememberMe = document.getElementById('checkid');
const registerLink = document.getElementById('register');

const ADMIN_EMAILS = ['admin@ummah.ac.ke', 'admin@ummah.edu'];

// Redirect to register
registerLink.onclick = () => window.location.href = "register.html";

// Prefill if coming from registration demo
window.addEventListener('load', () => {
    const saved = localStorage.getItem('registeredEmail');
    if (saved) {
        adminInput.value = saved;
        localStorage.removeItem('registeredEmail');
    }
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
        adminInput.value = savedEmail;
        rememberMe.checked = true;
    }
});

loginBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    const email = adminInput.value.trim();
    const password = passwordInput.value.trim();

    if (email === "" || password === "") {
        alert("Please fill in all fields.");
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert("Invalid email format! Please use a valid email address.");
        return;
    }

    try {
        await setPersistence(auth, browserLocalPersistence);
        const credential = await signInWithEmailAndPassword(auth, email, password);
        const user = credential.user;

        const profileDoc = await getDoc(doc(db, "userProfiles", user.uid));
        const profileData = profileDoc.exists() ? profileDoc.data() : {};
        const displayName = profileData.name || user.displayName || email.split('@')[0];

        if (rememberMe.checked) {
            localStorage.setItem('rememberedEmail', email);
        } else {
            localStorage.removeItem('rememberedEmail');
        }

        const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());
        const userData = { uid: user.uid, email, name: displayName, isAdmin };
        localStorage.setItem('ummah_user', JSON.stringify(userData));

        if (isAdmin) {
            localStorage.setItem('ummah_admin_key', 'true');
            window.location.href = 'admin.html';
        } else {
            localStorage.removeItem('ummah_admin_key');
            window.location.href = 'home.html';
        }
    } catch (err) {
        console.error('Login error:', err);
        alert(`Login failed: ${err.message}`);
    }
});
