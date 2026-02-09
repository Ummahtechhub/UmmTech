// ============================================
// FIREBASE IMPLEMENTATION GUIDE
// For Ummah TechHub Application
// ============================================

/*
This guide helps you implement Firebase Firestore, Authentication, 
and Cloud Storage in your application.
*/

// ============================================
// STEP 1: SETUP FIREBASE IN CONSOLE
// ============================================

Steps:
1. Go to https://console.firebase.google.com
2. Select project: "umma-tech-hub-86eda"
3. Navigate to "Firestore Database" > Create Database
   - Location: Closest to your users (e.g., us-east1)
   - Security rules: Start in test mode, then update with production rules
4. Navigate to "Authentication" > Get started
   - Enable "Email/Password" provider
5. Navigate to "Storage" > Get started
   - Location: Same as Firestore

// ============================================
// STEP 2: IMPORT FIRESTORE RULES
// ============================================

For Firestore:
1. Go to Firestore Database > Rules tab
2. Copy content from FIRESTORE_SECURITY_RULES.txt
3. Paste into the Rules editor
4. Click "Publish"

For Cloud Storage:
1. Go to Storage > Rules tab
2. Copy content from FIREBASE_STORAGE_RULES.txt
3. Paste into the Rules editor
4. Click "Publish"

// ============================================
// STEP 3: CREATE INITIAL COLLECTIONS
// ============================================

In Firestore Console, create these collections manually:

Collection Structure:
├── users/{userId}
│   └── (Auto-created by Firebase Auth)
├── userProfiles/{userId}
├── events/{eventId}
│   └── media/{mediaId} (subcollection)
├── projects/{projectId}
│   ├── media/{mediaId} (subcollection)
│   └── collaborators/{userId} (subcollection)
├── teams/{teamId}
│   └── members/{memberId} (subcollection)
├── userSettings/{userId}
├── media/{mediaId}
├── archivedProjects/{projectId}
├── archivedEvents/{eventId}
└── archivedTeams/{teamId}

To create collection:
1. Click "Start Collection"
2. Enter collection name (e.g., "userProfiles")
3. Add first document with ID format suggested in FIRESTORE_COLLECTIONS.js
4. Add fields matching the schema

// ============================================
// STEP 4: UPDATE JAVASCRIPT IMPLEMENTATIONS
// ============================================

Update login.js for Firebase Authentication:

```javascript
// At the top of login.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { getFirestore, getDoc, doc } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

// Initialize Firebase (config already in HTML)
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Modify login function
async function handleLogin(e) {
  e.preventDefault();
  
  const admission = document.getElementById('admission').value;
  const password = document.getElementById('password').value;
  
  try {
    // Parse admission to get email format: COURSE/YEAR/NUMBER
    // Example: BSCS/2024/12345 -> bscs_2024_12345@ummahtech.io
    const [course, year, number] = admission.split('/');
    const email = `${course.toLowerCase()}_${year}_${number}@ummahtech.io`;
    
    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Fetch user profile from Firestore
    const userDoc = await getDoc(doc(db, "userProfiles", user.uid));
    
    if (userDoc.exists()) {
      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify({
        uid: user.uid,
        email: user.email,
        admission: admission,
        profile: userDoc.data()
      }));
      
      // Redirect to dashboard
      window.location.href = 'home.html';
    } else {
      alert('User profile not found. Please register first.');
    }
  } catch (error) {
    console.error('Login error:', error);
    alert(`Login failed: ${error.message}`);
  }
}
```

Update register.js for Firebase Registration:

```javascript
// At the top of register.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { getFirestore, setDoc, doc } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Modify register function
async function handleRegister(e) {
  e.preventDefault();
  
  const name = document.getElementById('name').value;
  const admission = document.getElementById('admission').value;
  const password = document.getElementById('password').value;
  const email = `${admission.toLowerCase().replace(/\//g, '_')}@ummahtech.io`;
  
  try {
    // Create user with Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user document in Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: email,
      admission: admission,
      displayName: name,
      status: "active",
      role: "user",
      createdAt: new Date(),
      lastLogin: new Date()
    });
    
    // Create user profile document
    await setDoc(doc(db, "userProfiles", user.uid), {
      userId: user.uid,
      name: name,
      bio: "",
      phone: "",
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
      updatedAt: new Date()
    });
    
    // Create user settings document
    await setDoc(doc(db, "userSettings", user.uid), {
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
      updatedAt: new Date()
    });
    
    alert('Registration successful! Logging in...');
    window.location.href = 'login.html';
    
  } catch (error) {
    console.error('Registration error:', error);
    alert(`Registration failed: ${error.message}`);
  }
}
```

Update home.js for Firestore Integration:

```javascript
// At the top of home.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  setDoc, 
  getDoc,
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where,
  onSnapshot,
  arrayUnion,
  arrayRemove
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-storage.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

let currentUser = null;

// Check authentication on page load
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    console.log('User logged in:', user.email);
    
    // Load user profile
    const profileDoc = await getDoc(doc(db, "userProfiles", user.uid));
    if (profileDoc.exists()) {
      console.log('Profile loaded:', profileDoc.data());
    }
  } else {
    console.log('User not logged in');
    window.location.href = 'login.html';
  }
});

// Add Event to Firestore
async function addEvent() {
  const title = document.getElementById('eventTitle').value;
  const description = document.getElementById('eventDesc').value;
  const eventType = document.getElementById('eventType').value;
  const datetime = document.getElementById('eventDateTime').value;
  
  if (!currentUser) {
    alert('Please log in first');
    return;
  }
  
  try {
    const docRef = await addDoc(collection(db, "events"), {
      createdBy: currentUser.uid,
      title: title,
      description: description,
      eventType: eventType,
      startDateTime: new Date(datetime),
      location: "Online",
      registeredUsers: [],
      mediaUrls: [],
      status: "upcoming",
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    alert(`Event "${title}" created successfully!`);
    document.getElementById('eventTitle').value = '';
    document.getElementById('eventDesc').value = '';
    
    // Reload events
    loadEvents();
    
  } catch (error) {
    console.error('Error adding event:', error);
    alert('Failed to create event: ' + error.message);
  }
}

// Load Events from Firestore (Real-time)
function loadEvents() {
  const eventsRef = collection(db, "events");
  const q = query(eventsRef); // You can add filters here
  
  onSnapshot(q, (querySnapshot) => {
    const eventsList = [];
    querySnapshot.forEach((doc) => {
      eventsList.push({ id: doc.id, ...doc.data() });
    });
    
    displayEvents(eventsList);
  });
}

// Upload Event Media
async function uploadEventMedia(eventId, file) {
  if (!currentUser) return;
  
  try {
    const storageRef = ref(
      storage, 
      `events/${currentUser.uid}/${eventId}/${Date.now()}_${file.name}`
    );
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // Add media URL to event
    const eventRef = doc(db, "events", eventId);
    await updateDoc(eventRef, {
      mediaUrls: arrayUnion({
        type: file.type.includes('video') ? 'video' : 'image',
        url: downloadURL,
        uploadedAt: new Date()
      })
    });
    
    alert('Media uploaded successfully!');
    return downloadURL;
    
  } catch (error) {
    console.error('Upload error:', error);
    alert('Failed to upload media: ' + error.message);
  }
}

// Add Project to Firestore
async function addProject() {
  const title = document.getElementById('projectTitle').value;
  const description = document.getElementById('projectDesc').value;
  const status = document.getElementById('projectStatus').value;
  
  if (!currentUser) {
    alert('Please log in first');
    return;
  }
  
  try {
    const docRef = await addDoc(collection(db, "projects"), {
      createdBy: currentUser.uid,
      title: title,
      description: description,
      status: status,
      progress: 0,
      startDate: new Date(),
      category: "Web",
      collaborators: [currentUser.uid],
      mediaUrls: [],
      technologies: [],
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    alert(`Project "${title}" created successfully!`);
    document.getElementById('projectTitle').value = '';
    document.getElementById('projectDesc').value = '';
    
    loadProjects();
    
  } catch (error) {
    console.error('Error adding project:', error);
    alert('Failed to create project: ' + error.message);
  }
}

// Load Projects from Firestore (Real-time)
function loadProjects() {
  const projectsRef = collection(db, "projects");
  
  onSnapshot(projectsRef, (querySnapshot) => {
    const projectsList = [];
    querySnapshot.forEach((doc) => {
      projectsList.push({ id: doc.id, ...doc.data() });
    });
    
    displayProjects(projectsList);
  });
}

// Create Team with Firestore
async function createTeam() {
  const teamName = document.getElementById('teamName').value;
  const teamDesc = document.getElementById('teamDesc').value;
  
  if (!currentUser) {
    alert('Please log in first');
    return;
  }
  
  // Check 4 team limit
  const teamsRef = collection(db, "teams");
  const q = query(teamsRef, where("createdBy", "==", currentUser.uid));
  const snapshot = await getDocs(q);
  
  if (snapshot.size >= 4) {
    alert('You can only create maximum 4 teams');
    return;
  }
  
  try {
    const docRef = await addDoc(collection(db, "teams"), {
      createdBy: currentUser.uid,
      name: teamName,
      description: teamDesc,
      teamLead: currentUser.uid,
      members: [currentUser.uid],
      memberCount: 1,
      skills: [],
      projectsWorkedOn: [],
      eventsParticipated: [],
      visibility: "public",
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    alert(`Team "${teamName}" created successfully!`);
    document.getElementById('teamName').value = '';
    document.getElementById('teamDesc').value = '';
    
    loadTeams();
    
  } catch (error) {
    console.error('Error creating team:', error);
    alert('Failed to create team: ' + error.message);
  }
}

// Load Teams from Firestore (Real-time)
function loadTeams() {
  const teamsRef = collection(db, "teams");
  
  onSnapshot(teamsRef, (querySnapshot) => {
    const teamsList = [];
    querySnapshot.forEach((doc) => {
      teamsList.push({ id: doc.id, ...doc.data() });
    });
    
    displayTeams(teamsList);
  });
}

// Logout Function
async function logout() {
  try {
    await signOut(auth);
    localStorage.removeItem('user');
    window.location.href = 'login.html';
  } catch (error) {
    console.error('Logout error:', error);
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadEvents();
  loadProjects();
  loadTeams();
  
  // Attach event listeners to buttons
  document.getElementById('addEventBtn')?.addEventListener('click', addEvent);
  document.getElementById('addProjectBtn')?.addEventListener('click', addProject);
  document.getElementById('createTeamBtn')?.addEventListener('click', createTeam);
  document.getElementById('logoutBtn')?.addEventListener('click', logout);
});
```

// ============================================
// STEP 5: MIGRATE DATA FROM LOCALSTORAGE TO FIRESTORE
// ============================================

Create a migration script:

```javascript
// firebaseDataMigration.js
// Run this once to migrate existing localStorage data to Firestore

async function migrateLocalStorageToFirestore() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    console.log('No user data in localStorage');
    return;
  }
  
  try {
    // Migrate events
    const events = JSON.parse(localStorage.getItem('ummah_events') || '[]');
    for (const event of events) {
      await addDoc(collection(db, "events"), {
        ...event,
        createdBy: user.uid,
        createdAt: new Date(event.createdAt),
        updatedAt: new Date()
      });
    }
    
    // Migrate projects
    const projects = JSON.parse(localStorage.getItem('ummah_projects') || '[]');
    for (const project of projects) {
      await addDoc(collection(db, "projects"), {
        ...project,
        createdBy: user.uid,
        createdAt: new Date(project.createdAt),
        updatedAt: new Date()
      });
    }
    
    // Migrate teams
    const teams = JSON.parse(localStorage.getItem('ummah_teams') || '[]');
    for (const team of teams) {
      await addDoc(collection(db, "teams"), {
        ...team,
        createdBy: user.uid,
        teamLead: user.uid,
        createdAt: new Date(team.createdAt),
        updatedAt: new Date()
      });
    }
    
    alert('Migration completed successfully!');
    localStorage.clear(); // Optional: Clear old data after successful migration
    
  } catch (error) {
    console.error('Migration error:', error);
    alert('Migration failed: ' + error.message);
  }
}

// Call this function once
migrateLocalStorageToFirestore();
```

// ============================================
// STEP 6: DEPLOY & TEST
// ============================================

Testing Checklist:
☐ Test signup with Firebase Auth
☐ Test login with admission format
☐ Create event and verify in Firestore Console
☐ Upload event media and verify in Cloud Storage
☐ Create project and verify progress tracking
☐ Create team and verify 4 team limit
☐ Update profile and verify changes in Firestore
☐ Test logout and verify redirect
☐ Test real-time updates (open app in 2 windows)
☐ Verify security rules with unauthorized access attempts

Production Deployment:
1. Test all features in development
2. Update Firebase rules from test to production
3. Enable backups in Firestore
4. Setup Cloud Functions for scheduled tasks (event archival, cleanup)
5. Monitor usage in Firebase Console
6. Setup alerts for quota limits
7. Document admin procedures for user management

// ============================================
// STEP 7: MONITORING & MAINTENANCE
// ============================================

Firebase Console Monitoring:
- Firestore: View usage, indexes, and database size
- Storage: Monitor storage usage and download rates
- Authentication: View active users and sign-in methods
- Functions: Monitor Cloud Function invocations
- Alerts: Setup email alerts for quota thresholds

Recommended Alerts:
- Storage exceeds 4GB
- Firestore writes exceed 50k/day
- Authentication errors spike
- App crashes increase

Regular Tasks:
- Weekly: Review console logs for errors
- Monthly: Archive old events/projects
- Quarterly: Review and optimize security rules
- Yearly: Audit user permissions and roles

// ============================================
// TROUBLESHOOTING COMMON ISSUES
// ============================================

Issue: "Permission denied" error
Solution: Check security rules in Firebase Console. Verify user authentication.

Issue: Media upload fails
Solution: Check Cloud Storage rules. Verify file size < 100MB. Check storage quota.

Issue: Real-time updates not working
Solution: Verify Firestore indexes created. Check network connectivity.

Issue: 4 team limit not enforced
Solution: Verify query in home.js. Check Firestore collection data.

Issue: Login always redirects to login page
Solution: Verify Firebase Auth is enabled. Check admission format validation.

For more support: https://firebase.google.com/support

*/
