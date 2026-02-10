import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { getDatabase, ref as dbRef, get as dbGet } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-database.js";
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    where,
    limit,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);

let currentUser = null;
let currentProfile = null;

// Dashboard Initialization
function initDashboard() {
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    const user = currentUser;
    const profile = currentProfile || {};

    // Set user name in header
    const userDisplayName = document.getElementById('userDisplayName');
    const userWelcomeName = document.getElementById('userWelcomeName');
    const displayName = profile.name || profile.fullName || user.displayName || user.email || 'User';

    if (userDisplayName) userDisplayName.textContent = displayName.split(' ')[0];
    if (userWelcomeName) userWelcomeName.textContent = displayName.split(' ')[0];

    // Populate profile form
    const profileName = document.getElementById('profileName');
    const profileBio = document.getElementById('profileBio');
    const profileOccupation = document.getElementById('profileOccupation');
    const profileSkills = document.getElementById('profileSkills');
    const profileTrack = document.getElementById('profileTrack');
    const profileLocation = document.getElementById('profileLocation');
    const profileGradYear = document.getElementById('profileGradYear');
    const profilePortfolio = document.getElementById('profilePortfolio');
    const profileSocial = document.getElementById('profileSocial');

    if (profileName) profileName.value = profile.name || '';
    if (profileBio) profileBio.value = profile.bio || '';
    if (profileOccupation) profileOccupation.value = profile.occupation || '';
    if (profileSkills) profileSkills.value = Array.isArray(profile.skills) ? profile.skills.join(', ') : (profile.skills || '');
    if (profileTrack) profileTrack.value = profile.track || '';
    if (profileLocation) profileLocation.value = profile.location || '';
    if (profileGradYear) profileGradYear.value = profile.gradYear || '';
    if (profilePortfolio) profilePortfolio.value = profile.portfolio || '';
    if (profileSocial) profileSocial.value = profile.social || '';

    if (profile.profileImage) {
        const profilePicPreview = document.getElementById('profilePicPreview');
        if (profilePicPreview) {
            profilePicPreview.style.backgroundImage = `url(${profile.profileImage})`;
        }
    }

    // Initialize sidebar and navigation
    initializeSidebar();
    initializeLogout();
    initializeQuickAccess();
    initializeProfileForm();
    initializeSettingsForm();
    initializeProjectForm();
    initializeTeamForm();
    initializeRepository();
    initializeFeed();
    loadEvents();
    loadFeed();
    updateStats();
    initOverviewBackground();
}

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    currentUser = user;
    try {
        const profileDoc = await getDoc(doc(db, "userProfiles", user.uid));
        currentProfile = profileDoc.exists() ? profileDoc.data() : {};
    } catch (e) {
        currentProfile = {};
    }

    await migrateLocalStorageToFirestore();
    initDashboard();
});

async function migrateLocalStorageToFirestore() {
    if (!currentUser) return;
    if (localStorage.getItem('ummah_migrated_v1')) return;

    const hasLegacyData = [
        'ummah_events',
        'ummah_projects',
        'ummah_teams',
        'ummah_posts',
        'ummah_images',
        'ummah_videos',
        'ummah_files',
        'ummah_settings',
        'ummah_innovations'
    ].some((key) => {
        const raw = localStorage.getItem(key);
        return raw && raw !== '[]' && raw !== '{}';
    });

    if (!hasLegacyData) {
        localStorage.setItem('ummah_migrated_v1', 'true');
        return;
    }

    // Force migration without user prompt

    const safeParse = (key, fallback) => {
        try {
            return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
        } catch (e) {
            return fallback;
        }
    };

    const events = safeParse('ummah_events', []);
    const projects = safeParse('ummah_projects', []);
    const teams = safeParse('ummah_teams', []);
    const posts = safeParse('ummah_posts', []);
    const images = safeParse('ummah_images', []);
    const videos = safeParse('ummah_videos', []);
    const files = safeParse('ummah_files', []);
    const settings = safeParse('ummah_settings', null);
    const innovationsRaw = localStorage.getItem('ummah_innovations') || '';

    const uploads = [];

    events.forEach((event) => {
        uploads.push(addDoc(collection(db, 'events'), {
            createdBy: currentUser.uid,
            title: event.name || event.title || 'Event',
            description: event.desc || event.description || '',
            eventType: event.type || event.eventType || 'Event',
            startDateTime: event.dateTime ? new Date(event.dateTime) : serverTimestamp(),
            location: event.location || 'Online',
            status: event.status || 'upcoming',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        }));
    });

    projects.forEach((project) => {
        uploads.push(addDoc(collection(db, 'projects'), {
            createdBy: currentUser.uid,
            title: project.name || project.title || 'Project',
            description: project.desc || project.description || '',
            status: project.status || 'Active',
            progress: parseInt(project.progress || 0, 10),
            type: project.type || 'Individual',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        }));
    });

    teams.forEach((team) => {
        const members = Array.isArray(team.members)
            ? team.members
            : (team.members ? team.members.split(',').map(m => m.trim()).filter(Boolean) : []);

        uploads.push(addDoc(collection(db, 'teams'), {
            createdBy: currentUser.uid,
            name: team.name || 'Team',
            description: team.desc || team.description || '',
            teamLead: team.lead || team.teamLead || '',
            members: members,
            memberCount: members.length,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        }));
    });

    posts.forEach((post) => {
        uploads.push(addDoc(collection(db, 'posts'), {
            title: post.title || post.name || 'Post',
            description: post.description || post.story || post.content || '',
            category: post.category || 'General',
            uploadedAt: serverTimestamp(),
            createdBy: currentUser.uid
        }));
    });

    images.forEach((image) => {
        uploads.push(addDoc(collection(db, 'images'), {
            fileName: image.fileName || image.filename || image.title || 'Image',
            fileURL: image.fileURL || image.url || '',
            category: image.category || 'General',
            description: image.description || '',
            uploadedBy: image.uploadedBy || currentUser.email || '',
            uploadedAt: serverTimestamp(),
            likes: image.likes || 0,
            shares: image.shares || 0,
            comments: image.comments || [],
            type: 'images'
        }));
    });

    videos.forEach((video) => {
        uploads.push(addDoc(collection(db, 'videos'), {
            fileName: video.fileName || video.filename || video.title || 'Video',
            fileURL: video.fileURL || video.url || '',
            category: video.category || 'General',
            description: video.description || '',
            uploadedBy: video.uploadedBy || currentUser.email || '',
            uploadedAt: serverTimestamp(),
            likes: video.likes || 0,
            shares: video.shares || 0,
            comments: video.comments || [],
            type: 'videos'
        }));
    });

    files.forEach((file) => {
        uploads.push(addDoc(collection(db, 'files'), {
            fileName: file.fileName || file.filename || file.title || 'File',
            fileURL: file.fileURL || file.url || '',
            category: file.category || 'General',
            description: file.description || '',
            uploadedBy: file.uploadedBy || currentUser.email || '',
            uploadedAt: serverTimestamp(),
            type: 'files'
        }));
    });

    if (settings) {
        uploads.push(setDoc(doc(db, 'userSettings', currentUser.uid), {
            email: settings.email || currentUser.email,
            theme: settings.theme || settings.themeMode || 'light',
            colorTheme: settings.colorTheme || 'green',
            updatedAt: serverTimestamp()
        }, { merge: true }));
    }

    if (innovationsRaw) {
        uploads.push(addDoc(collection(db, 'settings'), {
            innovations: innovationsRaw,
            updatedAt: serverTimestamp()
        }));
    }

    try {
        await Promise.all(uploads);
        localStorage.setItem('ummah_migrated_v1', 'true');
        alert('Migration completed successfully!');
    } catch (e) {
        console.error('Migration failed:', e);
        alert('Migration failed. Please try again.');
    }
}

// Initialize Sidebar Toggle
function initializeSidebar() {
    const hamburger = document.getElementById('hamburgerToggle');
    const sidebar = document.getElementById('sidebar');

    if (!hamburger || !sidebar) return;

    const setSidebarLock = () => {
        document.body.classList.toggle('sidebar-open', !sidebar.classList.contains('hidden') && window.innerWidth <= 1024);
    };

    if (window.innerWidth <= 1024) {
        sidebar.classList.add('hidden');
    }
    setSidebarLock();

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        sidebar.classList.toggle('hidden');
        setSidebarLock();
    });

    // Close sidebar on mobile when clicking outside
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 1024) {
            if (!sidebar.contains(e.target) && !hamburger.contains(e.target)) {
                hamburger.classList.remove('active');
                sidebar.classList.add('hidden');
                setSidebarLock();
            }
        }
    });
}

// Initialize Navigation
function initializeNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn[data-page]');
    const contentPlaceholders = document.querySelectorAll('#overview-placeholder, #feed-placeholder, #events-placeholder, #projects-placeholder, #teams-placeholder, #repository-placeholder, #profile-placeholder, #settings-placeholder');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const page = button.getAttribute('data-page');

            // Update active button
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Update active page (show/hide content placeholders only)
            contentPlaceholders.forEach(placeholder => {
                placeholder.style.display = 'none';
                // Also hide any content-page inside the placeholder
                const contentPage = placeholder.querySelector('.content-page');
                if (contentPage) contentPage.classList.remove('active');
            });

            const activePlaceholder = document.getElementById(`${page}-placeholder`);
            if (activePlaceholder) {
                activePlaceholder.style.display = 'block';
                // Show the content-page inside the active placeholder
                const contentPage = activePlaceholder.querySelector('.content-page');
                if (contentPage) contentPage.classList.add('active');
            }

            // Update page title based on page
            const pageTitle = document.getElementById('pageTitle');
            if (pageTitle) {
                pageTitle.classList.remove('title-animate', 'glow-title');
                const titles = {
                    overview: 'Ummah TechHub',
                    feed: 'Community Feed',
                    events: 'Events',
                    projects: 'Projects',
                    teams: 'Teams',
                    repository: 'Repository',
                    profile: 'Ummah TechHub',
                    settings: 'Ummah TechHub'
                };
                pageTitle.textContent = titles[page] || 'Ummah TechHub';
                if (page === 'overview' || page === 'profile' || page === 'settings') {
                    pageTitle.classList.add('title-animate');
                } else {
                    pageTitle.classList.add('glow-title');
                }
            }

            if (page === 'overview') {
                updateStats();
            }

            // Close sidebar on mobile
            if (window.innerWidth <= 1024) {
                const sidebar = document.getElementById('sidebar');
                const hamburger = document.getElementById('hamburgerToggle');
                if (sidebar) sidebar.classList.add('hidden');
                if (hamburger) hamburger.classList.remove('active');
                document.body.classList.remove('sidebar-open');
            }
        });
    });

    // Set default active page (feed) after a short delay to ensure all content is loaded
    setTimeout(() => {
        const feedBtn = document.querySelector('.nav-btn[data-page="feed"]');
        if (feedBtn) {
            feedBtn.click();
        }
    }, 1000);
}

// Make initializeNavigation globally available
window.initializeNavigation = initializeNavigation;

// Initialize Logout
function initializeLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    const profileLogoutBtn = document.getElementById('profileLogoutBtn');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await signOut(auth);
            } catch (e) {
                // ignore
            }
            localStorage.removeItem('ummah_user');
            localStorage.removeItem('ummah_profile');
            window.location.href = 'login.html';
        });
    }

    if (profileLogoutBtn) {
        profileLogoutBtn.addEventListener('click', async () => {
            try {
                await signOut(auth);
            } catch (e) {
                // ignore
            }
            localStorage.removeItem('ummah_user');
            localStorage.removeItem('ummah_profile');
            window.location.href = 'login.html';
        });
    }
}

// Initialize Quick Access Navigation
function initializeQuickAccess() {
    const navButtons = document.querySelectorAll('.nav-btn[data-page]');

    // Use event delegation so buttons work even if content is reloaded
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.quick-btn[data-nav]');
        if (!btn) return;

        const page = btn.getAttribute('data-nav');
        const targetNavBtn = Array.from(navButtons).find(nb => nb.getAttribute('data-page') === page);
        if (targetNavBtn) {
            targetNavBtn.click();

            // Close sidebar on mobile
            if (window.innerWidth <= 1024) {
                const sidebar = document.getElementById('sidebar');
                const hamburger = document.getElementById('hamburgerToggle');
                if (sidebar) sidebar.classList.add('hidden');
                if (hamburger) hamburger.classList.remove('active');
                document.body.classList.remove('sidebar-open');
            }
        }
    });
}

function initOverviewBackground() {
    const hero = document.querySelector('.overview-hero');
    if (!hero) return;

    const images = [
        'https://i.ibb.co/8gvyB70N/Whats-App-Image-2026-01-31-at-8-39-50-AM.jpg',
        'https://i.ibb.co/8nGxRDD5/Whats-App-Image-2026-01-30-at-5-21-42-PM-1.jpg',
        'https://i.ibb.co/4gFV0J71/Whats-App-Image-2026-01-31-at-8-39-45-AM-1.jpg',
        'https://i.ibb.co/zHBgc73k/Whats-App-Image-2026-01-31-at-8-39-50-AM-3.jpg',
        'https://i.ibb.co/xSXGYMfm/Whats-App-Image-2026-01-30-at-5-20-25-PM-2.jpg',
        'https://i.ibb.co/Gh8B3hh/Whats-App-Image-2026-02-02-at-10-40-42-AM-1.jpg',
        'https://i.ibb.co/99jNbn9N/Whats-App-Image-2026-02-02-at-10-40-41-AM-1.jpg',
        'https://i.ibb.co/NnVLLrbx/Whats-App-Image-2026-02-02-at-10-40-40-AM.jpg',
        'https://i.ibb.co/v6b3ypg1/Whats-App-Image-2026-02-06-at-9-36-24-AM.jpg',
        'https://i.ibb.co/jk0GgbXG/Whats-App-Image-2026-01-29-at-3-13-17-PM.jpg',
        'https://i.ibb.co/NdRCSfyr/Whats-App-Image-2026-01-31-at-8-42-25-AM-1.jpg'
    ];

    let index = 0;
    const applyImage = () => {
        hero.style.backgroundImage = `url('${images[index]}')`;
    };

    applyImage();

    if (window._overviewBgTimer) {
        clearInterval(window._overviewBgTimer);
    }

    window._overviewBgTimer = setInterval(() => {
        index = (index + 1) % images.length;
        applyImage();
    }, 3000);
}

// Initialize Profile Form
function initializeProfileForm() {
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const profilePicInput = document.getElementById('profilePicInput');
    const profilePicPreview = document.getElementById('profilePicPreview');

    // Handle profile picture upload
    if (profilePicInput) {
        profilePicInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.size > 1 * 1024 * 1024) {
                alert('File size must be less than 1MB');
                return;
            }

            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const imageData = event.target.result;
                    if (profilePicPreview) {
                        profilePicPreview.style.backgroundImage = `url(${imageData})`;
                    }
                    if (currentUser) {
                        setDoc(doc(db, "userProfiles", currentUser.uid), {
                            profileImage: imageData,
                            updatedAt: serverTimestamp()
                        }, { merge: true }).catch(() => {});
                    }
                };
                reader.readAsDataURL(file);
            } else {
                alert('Please select a valid image file');
            }
        });
    }

    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', async () => {
            const profileName = document.getElementById('profileName').value.trim();
            const profileBio = document.getElementById('profileBio').value.trim();
            const profileOccupation = document.getElementById('profileOccupation')?.value.trim() || '';
            const profileSkills = document.getElementById('profileSkills')?.value.trim() || '';
            const profileTrack = document.getElementById('profileTrack')?.value.trim() || '';
            const profileLocation = document.getElementById('profileLocation')?.value.trim() || '';
            const profileGradYear = document.getElementById('profileGradYear')?.value.trim() || '';
            const profilePortfolio = document.getElementById('profilePortfolio')?.value.trim() || '';
            const profileSocial = document.getElementById('profileSocial')?.value.trim() || '';

            if (!profileName) {
                alert('Please enter your name');
                return;
            }

            const profile = {
                name: profileName,
                bio: profileBio,
                occupation: profileOccupation,
                skills: profileSkills ? profileSkills.split(',').map(s => s.trim()).filter(Boolean) : [],
                track: profileTrack,
                location: profileLocation,
                gradYear: profileGradYear,
                portfolio: profilePortfolio,
                social: profileSocial,
                updatedAt: serverTimestamp()
            };

            if (currentUser) {
                try {
                    await setDoc(doc(db, "userProfiles", currentUser.uid), profile, { merge: true });
                } catch (e) {
                    alert('Failed to update profile.');
                    return;
                }
            }

            const userDisplayName = document.getElementById('userDisplayName');
            if (userDisplayName) userDisplayName.textContent = profileName.split(' ')[0];

            alert('Profile updated successfully!');
        });
    }
}

// Initialize Settings Form
function initializeSettingsForm() {
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const themeMode = document.getElementById('themeMode');
    const themeSelect = document.getElementById('themeSelect');
    
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', async () => {
            const email = document.getElementById('settingsEmail').value;
            const mode = themeMode?.value || 'dark';
            const color = themeSelect?.value || 'green';

            if (!email.trim()) {
                alert('Please enter your email');
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Please enter a valid email');
                return;
            }

            const settings = {
                email: email,
                theme: mode,
                colorTheme: color,
                updatedAt: serverTimestamp()
            };

            if (currentUser) {
                await setDoc(doc(db, "userSettings", currentUser.uid), settings, { merge: true });
                applyTheme(mode, color);
                alert('Settings updated successfully!');
            }
        });
    }

    // Load existing settings
    const settingsEmail = document.getElementById('settingsEmail');
    
    if (currentUser) {
        getDoc(doc(db, "userSettings", currentUser.uid)).then((docSnap) => {
            if (!docSnap.exists()) return;
            const settings = docSnap.data() || {};
            if (settingsEmail) settingsEmail.value = settings.email || '';
            if (themeMode) themeMode.value = settings.theme || 'dark';
            if (themeSelect) themeSelect.value = settings.colorTheme || 'green';
            applyTheme(settings.theme || 'light', settings.colorTheme || 'green');
        }).catch(() => {});
    }

    // Real-time theme preview
    if (themeMode) {
        themeMode.addEventListener('change', () => {
            const color = themeSelect?.value || 'green';
            applyTheme(themeMode.value, color);
        });
    }

    if (themeSelect) {
        themeSelect.addEventListener('change', () => {
            const mode = themeMode?.value || 'dark';
            applyTheme(mode, themeSelect.value);
        });
    }
}

// Apply theme
function applyTheme(mode, color) {
    const root = document.documentElement;
    const body = document.body;

    if (mode === 'light') {
        root.style.removeProperty('--bg-primary');
        root.style.removeProperty('--bg-secondary');
        root.style.removeProperty('--text-primary');
        root.style.removeProperty('--text-secondary');
        root.style.removeProperty('--card-bg');
        root.style.removeProperty('--border-color');
        root.style.removeProperty('--bg-color');
        if (body) body.classList.remove('theme-dark');
    } else {
        root.style.setProperty('--bg-primary', '#151515');
        root.style.setProperty('--bg-secondary', '#1f1f1f');
        root.style.setProperty('--text-primary', '#ffffff');
        root.style.setProperty('--text-secondary', '#c7c7c7');
        root.style.setProperty('--card-bg', '#1f1f1f');
        root.style.setProperty('--border-color', '#3b3b3b');
        root.style.setProperty('--bg-color', '#121212');
        if (body) body.classList.add('theme-dark');
    }
}

// Handle window resize for responsive sidebar
window.addEventListener('resize', () => {
    const sidebar = document.getElementById('sidebar');
    const hamburger = document.getElementById('hamburgerToggle');
    
    if (window.innerWidth > 1024) {
        if (sidebar) sidebar.classList.remove('hidden');
        if (hamburger) hamburger.classList.remove('active');
        document.body.classList.remove('sidebar-open');
    } else {
        document.body.classList.toggle('sidebar-open', sidebar && !sidebar.classList.contains('hidden'));
    }
});



async function loadEvents() {
    const upcomingGrid = document.getElementById('upcomingEventsGrid');
    if (!upcomingGrid) return;

    upcomingGrid.innerHTML = '';

    try {
        const eventsQuery = query(collection(db, 'events'), orderBy('startDateTime', 'desc'));
        const snapshot = await getDocs(eventsQuery);
        const events = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        renderEvents(events);
    } catch (e) {
        console.error('Failed to load events:', e);
        upcomingGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 40px;">Unable to load events.</p>';
    }
}

function renderEvents(events) {
    const upcomingGrid = document.getElementById('upcomingEventsGrid');
    if (!upcomingGrid) return;
    upcomingGrid.innerHTML = '';

    if (!events || events.length === 0) {
        upcomingGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 40px;">No events yet. Create your first event!</p>';
        return;
    }

    events.forEach(event => {
        const eventCard = document.createElement('div');
        eventCard.className = 'event-card';
        const dateText = event.startDateTime?.seconds
            ? new Date(event.startDateTime.seconds * 1000).toLocaleString()
            : (event.startDateTime || event.dateTime || 'Date TBD');

        eventCard.innerHTML = `
            <div class="event-media"><i class="fas fa-calendar" style="font-size: 40px; color: #2e8b57;"></i></div>
            <h3>${event.title || event.name || 'Event'}</h3>
            <p><i class="fas fa-clock"></i> ${dateText}</p>
            <p>${event.description || event.desc || ''}</p>
            <span class="badge" style="background: var(--primary-color); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${event.eventType || event.type || 'Event'}</span>
            <button onclick="window.deleteEvent('${event.id}')" style="margin-top: 10px; padding: 8px 12px; background: #ff6b6b; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; width: 100%;">Delete</button>
        `;
        upcomingGrid.appendChild(eventCard);
    });
}

window.deleteEvent = async function(eventId) {
    if (confirm('Delete this event?')) {
        try {
            await deleteDoc(doc(db, 'events', eventId));
            loadEvents();
            updateStats();
        } catch (e) {
            alert('Failed to delete event.');
        }
    }
};



// Initialize Project Form
// Initialize Project Form
function initializeProjectForm() {
    const addProjectBtn = document.getElementById('addProjectBtn');
    const projectFormContainer = document.getElementById('projectFormContainer');
    const saveProjectBtn = document.getElementById('saveProjectBtn');
    const cancelProjectBtn = document.getElementById('cancelProjectBtn');
    const projectTabs = document.querySelectorAll('.project-tab');

    if (!addProjectBtn) return;

    addProjectBtn.addEventListener('click', () => {
        projectFormContainer.style.display = projectFormContainer.style.display === 'none' ? 'block' : 'none';
    });

    if (cancelProjectBtn) {
        cancelProjectBtn.addEventListener('click', () => {
            projectFormContainer.style.display = 'none';
            document.getElementById('projectName').value = '';
            document.getElementById('projectDesc').value = '';
            document.getElementById('projectProgress').value = '';
            const projectType = document.getElementById('projectType');
            if (projectType) projectType.value = 'Individual';
        });
    }

    if (saveProjectBtn) {
        saveProjectBtn.addEventListener('click', async () => {
            const name = document.getElementById('projectName').value;
            const desc = document.getElementById('projectDesc').value;
            const status = document.getElementById('projectStatus').value;
            const progress = document.getElementById('projectProgress').value;
            const type = document.getElementById('projectType')?.value || 'Individual';

            if (!name.trim()) {
                alert('Please enter project name');
                return;
            }

            if (!currentUser) {
                alert('Please log in to create a project');
                return;
            }

            try {
                const docRef = await addDoc(collection(db, "projects"), {
                    createdBy: currentUser.uid,
                    title: name,
                    description: desc,
                    status: status,
                    progress: parseInt(progress || 0, 10),
                    type: type,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });

                alert('Project created successfully!');
                projectFormContainer.style.display = 'none';
                document.getElementById('projectName').value = '';
                document.getElementById('projectDesc').value = '';
                document.getElementById('projectProgress').value = '';
                const projectType = document.getElementById('projectType');
                if (projectType) projectType.value = 'Individual';
                displayProjects(docRef.id);
                updateStats();
            } catch (e) {
                alert('Failed to create project.');
            }
        });
    }

    if (projectTabs.length) {
        projectTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                projectTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                displayProjects();
            });
        });
    }

    displayProjects();
}

async function displayProjects(highlightId) {
    const projectsGrid = document.getElementById('projectsGrid');
    if (!projectsGrid) return;

    projectsGrid.innerHTML = '';

    try {
        const projectsQuery = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(projectsQuery);
        const projects = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

        const activeTab = document.querySelector('.project-tab.active');
        const filter = activeTab?.getAttribute('data-filter') || 'individual';
        const filteredProjects = projects.filter(project => {
            const type = (project.type || 'Individual').toLowerCase();
            return filter === 'team' ? type === 'team' : type === 'individual';
        });

        if (filteredProjects.length === 0) {
            projectsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 40px;">No projects yet. Create your first project!</p>';
            return;
        }

        filteredProjects.forEach(project => {
            const projectCard = document.createElement('div');
            projectCard.className = 'project-card';
            if (highlightId && project.id === highlightId) {
                projectCard.classList.add('card-pop');
            }

            const statusColor = project.status === 'Active' ? 'active' : project.status === 'Planning' ? 'planning' : 'completed';
            const projectProgress = parseInt(project.progress) || 0;

            projectCard.innerHTML = `
                <div class="project-header" style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                    <h3 style="margin: 0;">${project.title || project.name || 'Project'}</h3>
                    <span class="status-badge ${statusColor}">${project.status || 'Active'}</span>
                </div>
                <p class="card-text" style="margin: 10px 0; font-size: 14px;">${project.description || project.desc || ''}</p>
                <p class="project-motto">Purpose-led. Impact-driven.</p>
                <div class="progress-bar">
                    <div class="progress" style="width: ${projectProgress}%"></div>
                </div>
                <p class="progress-text">${projectProgress}% Complete</p>
                <button onclick="window.deleteProject('${project.id}')" style="margin-top: 10px; padding: 8px 12px; background: #ff6b6b; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Delete</button>
            `;
            projectsGrid.appendChild(projectCard);
        });
    } catch (e) {
        projectsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 40px;">Unable to load projects.</p>';
    }
}

window.deleteProject = async function(projectId) {
    if (confirm('Delete this project?')) {
        try {
            await deleteDoc(doc(db, 'projects', projectId));
            displayProjects();
            updateStats();
        } catch (e) {
            alert('Failed to delete project.');
        }
    }
};



// Initialize Team Form
function initializeTeamForm() {
    const addTeamBtn = document.getElementById('addTeamBtn');
    const teamFormContainer = document.getElementById('teamFormContainer');
    const saveTeamBtn = document.getElementById('saveTeamBtn');
    const cancelTeamBtn = document.getElementById('cancelTeamBtn');
    const teamCountSpan = document.getElementById('teamCount');
    const MAX_TEAMS = 4;

    if (!addTeamBtn) return;

    // Update team count on load
    updateTeamCount();
    displayTeams();

    addTeamBtn.addEventListener('click', async () => {
        const teamCount = await getUserTeamCount();
        if (teamCount >= MAX_TEAMS) {
            alert('Maximum 4 teams reached. Delete a team to create a new one.');
            return;
        }
        teamFormContainer.style.display = teamFormContainer.style.display === 'none' ? 'block' : 'none';
    });

    if (cancelTeamBtn) {
        cancelTeamBtn.addEventListener('click', () => {
            teamFormContainer.style.display = 'none';
            document.getElementById('teamName').value = '';
            document.getElementById('teamDesc').value = '';
            document.getElementById('teamLead').value = '';
            document.getElementById('teamMembers').value = '';
        });
    }

    if (saveTeamBtn) {
        saveTeamBtn.addEventListener('click', async () => {
            if (!currentUser) {
                alert('Please log in to create a team');
                return;
            }

            const teamCount = await getUserTeamCount();
            if (teamCount >= MAX_TEAMS) {
                alert('Maximum 4 teams reached.');
                return;
            }

            const name = document.getElementById('teamName').value;
            const desc = document.getElementById('teamDesc').value;
            const lead = document.getElementById('teamLead').value;
            const members = document.getElementById('teamMembers').value;

            if (!name.trim()) {
                alert('Please enter team name');
                return;
            }

            const memberList = members
                ? members.split(',').map(m => m.trim()).filter(Boolean)
                : [];

            try {
                const docRef = await addDoc(collection(db, "teams"), {
                    createdBy: currentUser.uid,
                    name,
                    description: desc,
                    teamLead: lead,
                    members: memberList,
                    memberCount: memberList.length,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });

                alert('Team created successfully!');
                teamFormContainer.style.display = 'none';
                document.getElementById('teamName').value = '';
                document.getElementById('teamDesc').value = '';
                document.getElementById('teamLead').value = '';
                document.getElementById('teamMembers').value = '';
                
                updateTeamCount();
                displayTeams(docRef.id);
                updateStats();
            } catch (e) {
                alert('Failed to create team.');
            }
        });
    }

    async function getUserTeamCount() {
        if (!currentUser) return 0;
        const q = query(collection(db, "teams"), where("createdBy", "==", currentUser.uid));
        const snap = await getDocs(q);
        return snap.size;
    }

    async function updateTeamCount() {
        const teamCount = await getUserTeamCount();
        if (teamCountSpan) teamCountSpan.textContent = teamCount;
    }
}

async function displayTeams(highlightId) {
    const teamsGrid = document.getElementById('teamsGrid');
    if (!teamsGrid) return;

    teamsGrid.innerHTML = '';

    try {
        const teamsQuery = query(collection(db, "teams"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(teamsQuery);
        const teams = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

        if (teams.length === 0) {
            teamsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 40px;">No teams yet. Create your first team!</p>';
            return;
        }

        teams.forEach(team => {
            const teamCard = document.createElement('div');
            teamCard.className = 'team-card';
            if (highlightId && team.id === highlightId) {
                teamCard.classList.add('card-pop');
            }

            const membersList = team.members && team.members.length > 0
                ? team.members.map(m => `<div class="member-avatar" title="${m}">${m.charAt(0).toUpperCase()}</div>`).join('')
                : '';

            teamCard.innerHTML = `
                <h3>${team.name || 'Team'}</h3>
                <p class="card-text">${team.description || team.desc || ''}</p>
                <p class="card-subtext" style="font-size: 13px;"><strong>Lead:</strong> ${team.teamLead || team.lead || '-'}</p>
                <div class="team-members" style="display: flex; gap: 8px; margin: 10px 0;">
                    ${membersList}
                </div>
                <button onclick="window.deleteTeam('${team.id}')" style="margin-top: 10px; padding: 8px 12px; background: #ff6b6b; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; width: 100%;">Delete</button>
            `;
            teamsGrid.appendChild(teamCard);
        });
    } catch (e) {
        teamsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 40px;">Unable to load teams.</p>';
    }
}

window.deleteTeam = async function(teamId) {
    if (confirm('Delete this team?')) {
        try {
            await deleteDoc(doc(db, "teams", teamId));
            displayTeams();
            const teamCountSpan = document.getElementById('teamCount');
            if (teamCountSpan) teamCountSpan.textContent = '';
            updateStats();
        } catch (e) {
            alert('Failed to delete team.');
        }
    }
};



// Initialize Community Feed
function initializeFeed() {
    const feedBtn = document.querySelector('[data-page="feed"]');
    if (feedBtn) {
        feedBtn.addEventListener('click', loadFeed);
    }
}

// Initialize Repository
function initializeRepository() {
    const repositoryBtn = document.querySelector('[data-page="repository"]');
    if (repositoryBtn) {
        repositoryBtn.addEventListener('click', () => {
            loadRepository();
        });
    }
}

const defaultRepoHighlights = [
    {
        title: 'CyberShujaa',
        description: 'Registration moments and learning tracks.',
        imageUrl: 'https://i.ibb.co/Rp9V5qXQ/cybershujaa-registration-1.jpg',
        linkUrl: '#'
    },
    {
        title: 'USIU SheHacks',
        description: 'Intervarsity competition highlights.',
        imageUrl: 'https://i.ibb.co/FkM7v6XW/USIU-shehacks-intervasity-competition-1.jpg',
        linkUrl: '#'
    },
    {
        title: 'eMobilis Training',
        description: 'Web development training sessions.',
        imageUrl: 'https://i.ibb.co/tTGcH9gt/Emobilis-web-development-training.jpg',
        linkUrl: '#'
    },
    {
        title: 'Green Tech',
        description: 'Innovation for sustainable futures.',
        imageUrl: 'https://i.ibb.co/hF0Fqq2G/GREEN-TECH-INNOVATION.jpg',
        linkUrl: '#'
    },
    {
        title: 'Community Study',
        description: 'Focused sessions and shared goals.',
        imageUrl: 'https://i.ibb.co/39MWW4Lw/Whats-App-Image-2023-09-13-at-12-23-39-PM.jpg',
        linkUrl: '#'
    },
    {
        title: 'Repository',
        description: 'Curated materials for deeper learning.',
        imageUrl: 'https://i.ibb.co/zT5GQH90/Whats-App-Image-2023-11-03-at-6-40-00-PM.jpg',
        linkUrl: '#'
    }
];

async function loadRepository() {
    loadRepositoryHighlights();

    const filesGrid = document.getElementById('repositoryFilesGrid');
    const imagesGrid = document.getElementById('repositoryImagesGrid');
    const videosGrid = document.getElementById('repositoryVideosGrid');
    if (!filesGrid || !videosGrid || !imagesGrid) return;

    filesGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 30px;">Loading repository files...</p>';
    imagesGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 30px;">Loading repository images...</p>';
    videosGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 30px;">Loading repository videos...</p>';

    let files = [];
    let images = [];
    let videos = [];

    try {
        const filesQuery = query(collection(db, 'files'), orderBy('uploadedAt', 'desc'));
        const imagesQuery = query(collection(db, 'images'), orderBy('uploadedAt', 'desc'));
        const videosQuery = query(collection(db, 'videos'), orderBy('uploadedAt', 'desc'));
        const [filesSnap, imagesSnap, videosSnap] = await Promise.all([
            getDocs(filesQuery),
            getDocs(imagesQuery),
            getDocs(videosQuery)
        ]);

        files = filesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        images = imagesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        videos = videosSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
        console.error('Repository load failed:', e);
    }

    try {
        const uploadsSnap = await dbGet(dbRef(rtdb, 'uploads'));
        if (uploadsSnap.exists()) {
            const uploads = uploadsSnap.val() || {};
            const rtdbFiles = uploads.files ? Object.values(uploads.files) : [];
            const rtdbImages = uploads.images ? Object.values(uploads.images) : [];
            const rtdbVideos = uploads.videos ? Object.values(uploads.videos) : [];
            if (rtdbFiles.length) files = [...rtdbFiles, ...files];
            if (rtdbImages.length) images = [...rtdbImages, ...images];
            if (rtdbVideos.length) videos = [...rtdbVideos, ...videos];
        }
    } catch (e) {
        console.error('Repository realtime load failed:', e);
    }

    filesGrid.innerHTML = '';
    imagesGrid.innerHTML = '';
    videosGrid.innerHTML = '';

    if (files.length === 0) {
        filesGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 30px;">No study notes or reports yet.</p>';
    } else {
        files.forEach(file => {
            filesGrid.appendChild(createRepositoryCard(file, 'file'));
        });
    }

    if (images.length === 0) {
        imagesGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 30px;">No photos yet.</p>';
    } else {
        images.forEach(image => {
            imagesGrid.appendChild(createRepositoryCard(image, 'image'));
        });
    }

    if (videos.length === 0) {
        videosGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 30px;">No short videos yet.</p>';
    } else {
        videos.forEach(video => {
            videosGrid.appendChild(createRepositoryCard(video, 'video'));
        });
    }
}

async function loadRepositoryHighlights() {
    const grid = document.getElementById('repoShowcaseGrid');
    if (!grid) return;

    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 20px;">Loading highlights...</p>';

    let highlights = [];

    try {
        const highlightsQuery = query(collection(db, 'repositoryHighlights'), orderBy('order', 'asc'));
        const snapshot = await getDocs(highlightsQuery);
        highlights = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    } catch (e) {
        console.error('Repository highlights load failed:', e);
    }

    if (!highlights.length) {
        highlights = defaultRepoHighlights;
    }

    grid.innerHTML = '';

    highlights.forEach((item) => {
        const link = item.linkUrl || item.link || item.url || '#';
        const card = document.createElement('a');
        card.className = 'repo-showcase-link';
        card.href = link || '#';
        if (link && link !== '#') {
            card.target = '_blank';
            card.rel = 'noopener';
        }

        card.innerHTML = `
            <div class="repo-showcase-card">
                <img src="${item.imageUrl || item.image || ''}" alt="${item.title || 'Repository highlight'}">
                <div class="repo-showcase-overlay">
                    <h4>${item.title || 'Highlight'}</h4>
                    <p>${item.description || 'Explore the official program.'}</p>
                </div>
            </div>
        `;

        grid.appendChild(card);
    });
}

function createRepositoryCard(item, kind) {
    const card = document.createElement('div');
    card.className = 'project-card';

    const description = item.description || item.story || 'No description provided.';
    const fileURL = kind === 'video'
        ? (item.fileURL || item.url || '')
        : (item.compressedURL || item.fileURL || item.url || '');
    const thumbURL = item.thumbnailURL || item.thumbnail || item.compressedURL || '';

    let media = '';
    if (kind === 'video') {
        media = `
            <div style="width: 100%; aspect-ratio: 16 / 9; background: #000; border-radius: 8px; overflow: hidden; margin-bottom: 12px; display: flex; align-items: center; justify-content: center;">
                ${fileURL ? `<video src="${fileURL}" ${thumbURL ? `poster="${thumbURL}"` : ''} controls controlsList="nodownload noplaybackrate" preload="metadata" style="width: 100%; height: 100%; object-fit: contain; background: #000;"></video>` : `<i class="fas fa-play-circle" style="font-size: 46px; color: var(--primary-color); text-shadow: 0 6px 14px rgba(0,0,0,0.6);"></i>`}
            </div>
        `;
    } else if (kind === 'image') {
        const imageURL = item.compressedURL || item.fileURL || item.url || '';
        media = `
            <div style="width: 100%; aspect-ratio: 16 / 9; border-radius: 8px; overflow: hidden; margin-bottom: 12px; background: rgba(46, 139, 87, 0.08); display: flex; align-items: center; justify-content: center;">
                ${imageURL ? `<img src="${imageURL}" alt="" style="width: 100%; height: 100%; object-fit: contain; background: #fff;">` : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;"><i class="fas fa-image" style="font-size: 42px; color: rgba(46, 139, 87, 0.6);"></i></div>`}
            </div>
        `;
    } else {
        media = `
            <div style="width: 100%; height: 180px; background: rgba(46, 139, 87, 0.08); border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px;">
                <i class="fas fa-file-alt" style="font-size: 42px; color: rgba(46, 139, 87, 0.6);"></i>
            </div>
        `;
    }

    card.innerHTML = `
        ${media}
        <p class="card-text">${description}</p>
        ${kind === 'file' && fileURL ? `<a class="btn btn-primary" href="${fileURL}" target="_blank" rel="noopener">Open</a>` : ''}
    `;

    return card;
}

async function loadFeed() {
    const feedContainer = document.getElementById('feedContainer');
    if (!feedContainer) return;

    feedContainer.innerHTML = '';
    let feedItems = [];

    try {
        const imagesQuery = query(collection(db, 'images'), orderBy('uploadedAt', 'desc'));
        const videosQuery = query(collection(db, 'videos'), orderBy('uploadedAt', 'desc'));
        const postsQuery = query(collection(db, 'posts'), orderBy('uploadedAt', 'desc'));

        const [imagesSnap, videosSnap, postsSnap] = await Promise.all([
            getDocs(imagesQuery),
            getDocs(videosQuery),
            getDocs(postsQuery)
        ]);

        imagesSnap.forEach((docSnap) => {
            feedItems.push({ id: docSnap.id, ...docSnap.data(), type: 'image' });
        });

        videosSnap.forEach((docSnap) => {
            feedItems.push({ id: docSnap.id, ...docSnap.data(), type: 'video' });
        });

        postsSnap.forEach((docSnap) => {
            const post = docSnap.data();
            const postDate = post.uploadedAt?.seconds
                ? new Date(post.uploadedAt.seconds * 1000).toLocaleDateString()
                : (post.createdDate || '');

            feedItems.push({
                id: docSnap.id,
                ...post,
                type: 'post',
                title: post.title || post.name || 'Post',
                description: post.description || post.story || post.content || '',
                category: post.category || 'General',
                createdDate: postDate
            });
        });
    } catch (e) {
        console.error('Feed load failed:', e);
    }

    try {
        const uploadsSnap = await dbGet(dbRef(rtdb, 'uploads'));
        if (uploadsSnap.exists()) {
            const uploads = uploadsSnap.val() || {};
            const rtdbImages = uploads.images ? Object.values(uploads.images) : [];
            const rtdbVideos = uploads.videos ? Object.values(uploads.videos) : [];
            rtdbImages.forEach(item => feedItems.push({ ...item, type: 'image' }));
            rtdbVideos.forEach(item => feedItems.push({ ...item, type: 'video' }));
        }
    } catch (e) {
        console.error('Feed realtime load failed:', e);
    }

    // Sort by most recent
    feedItems.sort((a, b) => {
        const dateA = a.uploadedAt?.seconds ? a.uploadedAt.seconds * 1000 : (a.id || 0);
        const dateB = b.uploadedAt?.seconds ? b.uploadedAt.seconds * 1000 : (b.id || 0);
        return dateB - dateA;
    });

    if (feedItems.length === 0) {
        feedContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 40px;">No content available yet. Check back soon!</p>';
        return;
    }

    feedItems.forEach(item => {
        const feedCard = createFeedCard(item);
        feedContainer.appendChild(feedCard);
    });
}

function createFeedCard(item) {
    const card = document.createElement('div');
    card.style.cssText = 'background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; transition: all 0.3s ease;';
    
    const itemKey = String(item.id || item.fileURL || item.url || item.thumbnail || item.title || item.fileName || item.filename || item.createdAt || item.uploadedAt?.seconds || Math.random());
    const itemId = itemKey.replace(/[^a-zA-Z0-9_-]/g, '_');
    const titleText = item.title || item.fileName || item.filename || item.name || 'Post';
    const descriptionText = item.description || item.story || item.content || '';
    const shortDesc = descriptionText || 'No description provided.';
    const createdDate = item.createdDate
        || (item.uploadedAt?.seconds ? new Date(item.uploadedAt.seconds * 1000).toLocaleDateString() : '');

    let content = '';
    
    if (item.type === 'post') {
        content = `
            <div style="padding: 20px;">
                <h3 style="margin-bottom: 10px; color: var(--text-primary);">${titleText}</h3>
                ${item.thumbnail ? `<img src="${item.thumbnail}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 15px;">` : ''}
                <p style="color: var(--text-secondary); margin-bottom: 15px; line-height: 1.6;">${descriptionText}</p>
                <div style="display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap;">
                    <span class="badge badge-blue">${item.category}</span>
                    <small style="color: #999;">${createdDate}</small>
                </div>
            </div>
        `;
    } else if (item.type === 'video') {
        const poster = item.thumbnailURL || item.thumbnail || item.compressedURL || '';
        const videoUrl = item.fileURL || item.url || '';
        content = `
            <div style="padding: 20px;">
                <div style="width: 100%; height: 260px; background: #000; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; margin-bottom: 12px;">
                    ${videoUrl ? `<video src="${videoUrl}" ${poster ? `poster="${poster}"` : ''} class="feed-media feed-media-video" controls controlsList="nodownload noplaybackrate" preload="metadata"></video>` : `<i class="fas fa-play-circle" style="font-size: 60px; color: var(--primary-color); text-shadow: 0 10px 18px rgba(0,0,0,0.7);"></i>`}
                </div>
                <p style="color: var(--text-secondary); margin-bottom: 0;">${shortDesc}</p>
            </div>
        `;
    } else if (item.type === 'image') {
        const imageUrl = item.compressedURL || item.fileURL || item.url || item.thumbnail || '';
        content = `
            <div>
                <img src="${imageUrl}" class="feed-media feed-media-image" alt="">
                <div style="padding: 15px;">
                    <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 0;">${shortDesc}</p>
                </div>
            </div>
        `;
    }

    // Create interactions section
    const interactionsKey = `interactions_${itemId}`;
    let interactions = JSON.parse(localStorage.getItem(interactionsKey) || '{"likes": 0, "shares": 0, "comments": []}');

    const likesCount = interactions.likes || 0;
    const sharesCount = interactions.shares || 0;
    const commentsCount = (interactions.comments?.length) || 0;
    const shareText = encodeURIComponent(shortDesc || titleText || 'Check this out on Ummah TechHub');
    const shareUrl = encodeURIComponent(window.location.href);

    card.innerHTML = `
        ${content}
        <div style="padding: 15px; border-top: 1px solid var(--border-color); display: flex; justify-content: space-around; flex-wrap: wrap; gap: 10px;">
            <button onclick="window.toggleLike('${itemId}')" class="feed-action-btn" style="flex: 1; min-width: 80px; padding: 10px; background: transparent; border: none; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; border-radius: 6px; transition: all 0.3s ease;">
                <i class="fas fa-thumbs-up"></i>
                <span>Like (<span class="like-count-${itemId}">${likesCount}</span>)</span>
            </button>
            <button onclick="window.toggleShare('${itemId}')" class="feed-action-btn" style="flex: 1; min-width: 80px; padding: 10px; background: transparent; border: none; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; border-radius: 6px; transition: all 0.3s ease;">
                <i class="fas fa-share"></i>
                <span>Share (<span class="share-count-${itemId}">${sharesCount}</span>)</span>
            </button>
            <button onclick="window.toggleComment('${itemId}')" class="feed-action-btn" style="flex: 1; min-width: 80px; padding: 10px; background: transparent; border: none; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; border-radius: 6px; transition: all 0.3s ease;">
                <i class="fas fa-comment"></i>
                <span>Comment (<span class="comment-count-${itemId}">${commentsCount}</span>)</span>
            </button>
        </div>
        <div id="share-${itemId}" style="display: none; padding: 12px 15px; border-top: 1px solid var(--border-color); background: rgba(46, 139, 87, 0.05);">
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                <a href="https://www.facebook.com/sharer/sharer.php?u=${shareUrl}" target="_blank" rel="noopener" onclick="window.trackShare('${itemId}')" style="color: #1877f2; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
                    <i class="fab fa-facebook"></i> Facebook
                </a>
                <a href="https://www.instagram.com/" target="_blank" rel="noopener" onclick="window.trackShare('${itemId}')" style="color: #dd2a7b; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
                    <i class="fab fa-instagram"></i> Instagram
                </a>
                <a href="https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}" target="_blank" rel="noopener" onclick="window.trackShare('${itemId}')" style="color: #111; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
                    <i class="fab fa-x-twitter"></i> X
                </a>
                <a href="https://wa.me/?text=${shareText}%20${shareUrl}" target="_blank" rel="noopener" onclick="window.trackShare('${itemId}')" style="color: #25d366; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
                    <i class="fab fa-whatsapp"></i> WhatsApp
                </a>
                <a href="https://t.me/share/url?url=${shareUrl}&text=${shareText}" target="_blank" rel="noopener" onclick="window.trackShare('${itemId}')" style="color: #229ed9; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
                    <i class="fab fa-telegram"></i> Telegram
                </a>
            </div>
        </div>
        <div id="comments-${itemId}" style="display: none; padding: 15px; border-top: 1px solid var(--border-color); background: rgba(46, 139, 87, 0.05);">
            <div id="comments-list-${itemId}" style="margin-bottom: 15px; max-height: 220px; overflow-y: auto;">
                ${renderComments(itemId)}
            </div>
            <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
                <input type="text" placeholder="Add a comment..." id="comment-input-${itemId}" style="flex: 1; min-width: 150px; padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; background: var(--card-bg); color: var(--text-primary);">
                <button onclick="window.addComment('${itemId}')" style="padding: 10px 20px; background: var(--primary-color); color: white; border: none; border-radius: 6px; cursor: pointer;">Post</button>
            </div>
            <div style="margin-top: 8px; display: flex; gap: 8px; flex-wrap: wrap;">
                <button onclick="window.insertEmoji('comment-input-${itemId}', '👍')" style="border: none; background: transparent; cursor: pointer;">👍</button>
                <button onclick="window.insertEmoji('comment-input-${itemId}', '❤️')" style="border: none; background: transparent; cursor: pointer;">❤️</button>
                <button onclick="window.insertEmoji('comment-input-${itemId}', '😂')" style="border: none; background: transparent; cursor: pointer;">😂</button>
                <button onclick="window.insertEmoji('comment-input-${itemId}', '🎉')" style="border: none; background: transparent; cursor: pointer;">🎉</button>
                <button onclick="window.insertEmoji('comment-input-${itemId}', '🙏')" style="border: none; background: transparent; cursor: pointer;">🙏</button>
            </div>
        </div>
    `;

    return card;
}

function renderComments(itemId) {
    const interactionsKey = `interactions_${itemId}`;
    const interactions = JSON.parse(localStorage.getItem(interactionsKey) || '{"likes": 0, "shares": 0, "comments": []}');
    
    if (!interactions.comments || interactions.comments.length === 0) {
        return '<p style="color: var(--text-secondary); font-size: 12px;">No comments yet</p>';
    }

    const renderReplies = (comment) => {
        if (!comment.replies || comment.replies.length === 0) return '';
        return comment.replies.map(reply => `
            <div style="margin-left: 22px; margin-top: 8px; padding: 8px; background: rgba(0,0,0,0.03); border-radius: 6px;">
                <strong style="color: var(--text-primary); font-size: 12px;">${reply.author}</strong>
                <p style="font-size: 12px; color: var(--text-secondary); margin: 4px 0;">${reply.text}</p>
                <small style="color: #999; font-size: 11px;">${reply.date}</small>
            </div>
        `).join('');
    };

    return interactions.comments.map(comment => `
        <div style="padding: 10px; background: var(--card-bg); border-radius: 6px; margin-bottom: 8px;">
            <strong style="color: var(--text-primary);">${comment.author}</strong>
            <p style="font-size: 13px; color: var(--text-secondary); margin: 5px 0;">${comment.text}</p>
            <div style="display: flex; gap: 12px; align-items: center; font-size: 12px; color: #999;">
                <span>${comment.date}</span>
                <button onclick="window.likeComment('${itemId}', '${comment.id}')" style="border: none; background: transparent; cursor: pointer; color: #1877f2;">Like (${comment.likes || 0})</button>
                <button onclick="window.toggleReply('${itemId}', '${comment.id}')" style="border: none; background: transparent; cursor: pointer; color: #2e8b57;">Reply</button>
            </div>
            <div id="reply-box-${itemId}-${comment.id}" style="display: none; margin-top: 8px;">
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <input type="text" id="reply-input-${itemId}-${comment.id}" placeholder="Write a reply..." style="flex: 1; min-width: 150px; padding: 8px; border: 1px solid var(--border-color); border-radius: 6px; background: var(--card-bg); color: var(--text-primary);">
                    <button onclick="window.addReply('${itemId}', '${comment.id}')" style="padding: 8px 14px; background: var(--primary-color); color: white; border: none; border-radius: 6px; cursor: pointer;">Reply</button>
                </div>
                <div style="margin-top: 6px; display: flex; gap: 6px; flex-wrap: wrap;">
                    <button onclick="window.insertEmoji('reply-input-${itemId}-${comment.id}', '👍')" style="border: none; background: transparent; cursor: pointer;">👍</button>
                    <button onclick="window.insertEmoji('reply-input-${itemId}-${comment.id}', '❤️')" style="border: none; background: transparent; cursor: pointer;">❤️</button>
                    <button onclick="window.insertEmoji('reply-input-${itemId}-${comment.id}', '😂')" style="border: none; background: transparent; cursor: pointer;">😂</button>
                    <button onclick="window.insertEmoji('reply-input-${itemId}-${comment.id}', '🎉')" style="border: none; background: transparent; cursor: pointer;">🎉</button>
                    <button onclick="window.insertEmoji('reply-input-${itemId}-${comment.id}', '🙏')" style="border: none; background: transparent; cursor: pointer;">🙏</button>
                </div>
            </div>
            ${renderReplies(comment)}
        </div>
    `).join('');
}

window.toggleLike = function(itemId) {
    const interactionsKey = `interactions_${itemId}`;
    let interactions = JSON.parse(localStorage.getItem(interactionsKey) || '{"likes": 0, "shares": 0, "comments": []}');
    
    interactions.likes = (interactions.likes || 0) + 1;
    localStorage.setItem(interactionsKey, JSON.stringify(interactions));
    
    const likeCountEl = document.querySelector(`.like-count-${itemId}`);
    if (likeCountEl) likeCountEl.textContent = interactions.likes;
};

window.toggleComment = function(itemId) {
    const commentsSection = document.getElementById(`comments-${itemId}`);
    if (commentsSection.style.display === 'none') {
        commentsSection.style.display = 'block';
        const input = document.getElementById(`comment-input-${itemId}`);
        if (input) input.focus();
    } else {
        commentsSection.style.display = 'none';
    }
};

window.addComment = function(itemId) {
    const input = document.getElementById(`comment-input-${itemId}`);
    const text = input.value.trim();
    
    if (!text) {
        alert('Please write a comment');
        return;
    }

    const interactionsKey = `interactions_${itemId}`;
    let interactions = JSON.parse(localStorage.getItem(interactionsKey) || '{"likes": 0, "shares": 0, "comments": []}');
    
    if (!interactions.comments) interactions.comments = [];
    
    const userData = JSON.parse(localStorage.getItem('ummah_user') || '{}');
    const author = userData.name || userData.email?.split('@')[0] || 'Anonymous';
    
    interactions.comments.push({
        id: `c_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        author,
        text,
        date: new Date().toLocaleDateString(),
        likes: 0,
        replies: []
    });

    localStorage.setItem(interactionsKey, JSON.stringify(interactions));
    
    // Update UI
    const commentCountEl = document.querySelector(`.comment-count-${itemId}`);
    if (commentCountEl) commentCountEl.textContent = interactions.comments.length;
    document.getElementById(`comments-list-${itemId}`).innerHTML = renderComments(itemId);
    input.value = '';
};

window.toggleShare = function(itemId) {
    const shareSection = document.getElementById(`share-${itemId}`);
    if (!shareSection) return;
    shareSection.style.display = shareSection.style.display === 'none' ? 'block' : 'none';
};

window.trackShare = function(itemId) {
    const interactionsKey = `interactions_${itemId}`;
    let interactions = JSON.parse(localStorage.getItem(interactionsKey) || '{"likes": 0, "shares": 0, "comments": []}');
    
    interactions.shares = (interactions.shares || 0) + 1;
    localStorage.setItem(interactionsKey, JSON.stringify(interactions));
    
    const shareCountEl = document.querySelector(`.share-count-${itemId}`);
    if (shareCountEl) shareCountEl.textContent = interactions.shares;
};

window.likeComment = function(itemId, commentId) {
    const interactionsKey = `interactions_${itemId}`;
    let interactions = JSON.parse(localStorage.getItem(interactionsKey) || '{"likes": 0, "shares": 0, "comments": []}');
    const comment = interactions.comments?.find(c => c.id === commentId);
    if (!comment) return;
    comment.likes = (comment.likes || 0) + 1;
    localStorage.setItem(interactionsKey, JSON.stringify(interactions));
    document.getElementById(`comments-list-${itemId}`).innerHTML = renderComments(itemId);
};

window.toggleReply = function(itemId, commentId) {
    const box = document.getElementById(`reply-box-${itemId}-${commentId}`);
    if (!box) return;
    box.style.display = box.style.display === 'none' ? 'block' : 'none';
    const input = document.getElementById(`reply-input-${itemId}-${commentId}`);
    if (input && box.style.display === 'block') input.focus();
};

window.addReply = function(itemId, commentId) {
    const input = document.getElementById(`reply-input-${itemId}-${commentId}`);
    if (!input) return;
    const text = input.value.trim();
    if (!text) {
        alert('Please write a reply');
        return;
    }
    const interactionsKey = `interactions_${itemId}`;
    let interactions = JSON.parse(localStorage.getItem(interactionsKey) || '{"likes": 0, "shares": 0, "comments": []}');
    const comment = interactions.comments?.find(c => c.id === commentId);
    if (!comment) return;
    const userData = JSON.parse(localStorage.getItem('ummah_user') || '{}');
    const author = userData.name || userData.email?.split('@')[0] || 'Anonymous';
    if (!comment.replies) comment.replies = [];
    comment.replies.push({
        author,
        text,
        date: new Date().toLocaleDateString()
    });
    localStorage.setItem(interactionsKey, JSON.stringify(interactions));
    document.getElementById(`comments-list-${itemId}`).innerHTML = renderComments(itemId);
    input.value = '';
};

window.insertEmoji = function(inputId, emoji) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.value = `${input.value}${emoji}`;
    input.focus();
};

// Handle responsive design
window.addEventListener('resize', () => {
    const sidebar = document.getElementById('sidebar');
    const hamburger = document.getElementById('hamburgerToggle');
    
    if (window.innerWidth > 768) {
        if (sidebar) sidebar.classList.remove('hidden');
        if (hamburger) hamburger.classList.remove('active');
    }
});

// Update stats on overview page
async function updateStats() {
    const statProjects = document.getElementById('statProjects');
    const statTeams = document.getElementById('statTeams');
    const statEvents = document.getElementById('statEvents');
    const statInnovations = document.getElementById('statInnovations');

    try {
        const [projectsSnap, teamsSnap, eventsSnap] = await Promise.all([
            getDocs(query(collection(db, 'projects'))),
            getDocs(query(collection(db, 'teams'))),
            getDocs(query(collection(db, 'events')))
        ]);

        const projectsCount = projectsSnap.size;
        const eventsCount = eventsSnap.size;
        const teams = teamsSnap.docs.map(d => d.data());
        const teamMembersCount = teams.reduce((total, team) => total + (team.members?.length || 0), 0);

        let innovationsCount = 0;
        try {
            const settingsSnap = await getDocs(query(collection(db, 'settings'), orderBy('updatedAt', 'desc'), limit(1)));
            if (!settingsSnap.empty) {
                const settings = settingsSnap.docs[0].data() || {};
                const raw = settings.innovations || '';
                if (Array.isArray(raw)) {
                    innovationsCount = raw.length;
                } else if (typeof raw === 'string') {
                    innovationsCount = raw.split(/\r?\n|,/).map(s => s.trim()).filter(Boolean).length;
                }
            }
        } catch (e) {
            // ignore innovations errors
        }

        if (statProjects) statProjects.textContent = projectsCount > 0 ? projectsCount : '';
        if (statTeams) statTeams.textContent = teamMembersCount > 0 ? teamMembersCount : '';
        if (statEvents) statEvents.textContent = eventsCount > 0 ? eventsCount : '';
        if (statInnovations) statInnovations.textContent = innovationsCount > 0 ? innovationsCount : '';
    } catch (e) {
        // keep silent
    }
}
