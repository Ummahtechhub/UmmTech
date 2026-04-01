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
const repositoryState = {
    files: [],
    images: [],
    videos: [],
    highlights: [],
    filter: 'all',
    search: '',
    sort: 'newest'
};
const roadmapTracks = [
    { title: "Frontend", href: "https://roadmap.sh/frontend", iconClass: "fas fa-laptop-code", description: "Role roadmap." },
    { title: "Backend", href: "https://roadmap.sh/backend", iconClass: "fas fa-server", description: "Role roadmap." },
    { title: "DevOps", href: "https://roadmap.sh/devops", iconClass: "fas fa-cogs", description: "Role roadmap." },
    { title: "Full Stack", href: "https://roadmap.sh/full-stack", iconClass: "fas fa-layer-group", description: "Role roadmap." },
    { title: "AI Data Scientist", href: "https://roadmap.sh/ai-data-scientist", iconClass: "fas fa-brain", description: "Role roadmap." },
    { title: "Data Analyst", href: "https://roadmap.sh/data-analyst", iconClass: "fas fa-chart-line", description: "Role roadmap." },
    { title: "AI Engineer", href: "https://roadmap.sh/ai-engineer", iconClass: "fas fa-robot", description: "Role roadmap." },
    { title: "Software Architect", href: "https://roadmap.sh/software-architect", iconClass: "fas fa-drafting-compass", description: "Role roadmap." },
    { title: "Cyber Security", href: "https://roadmap.sh/cyber-security", iconClass: "fas fa-shield-alt", description: "Role roadmap." },
    { title: "UX Design", href: "https://roadmap.sh/ux-design", iconClass: "fas fa-pencil-ruler", description: "Role roadmap." },
    { title: "Game Developer", href: "https://roadmap.sh/game-developer", iconClass: "fas fa-gamepad", description: "Role roadmap." },
    { title: "Technical Writer", href: "https://roadmap.sh/technical-writer", iconClass: "fas fa-pen-nib", description: "Role roadmap." },
    { title: "MLOps", href: "https://roadmap.sh/mle", iconClass: "fas fa-microchip", description: "Role roadmap." },
    { title: "Product Manager", href: "https://roadmap.sh/product-manager", iconClass: "fas fa-tasks", description: "Role roadmap." },
    { title: "QA", href: "https://roadmap.sh/qa", iconClass: "fas fa-vial", description: "Role roadmap." },
    { title: "Python", href: "https://roadmap.sh/python", iconClass: "fab fa-python", description: "Role roadmap." },
    { title: "Software Design and Architecture", href: "https://roadmap.sh/software-design-architecture", iconClass: "fas fa-sitemap", description: "Role roadmap." },
    { title: "Computer Science", href: "https://roadmap.sh/computer-science", iconClass: "fas fa-network-wired", description: "Role roadmap." },
    { title: "React", href: "https://roadmap.sh/react", iconClass: "fab fa-react", description: "Role roadmap." },
    { title: "Node.js", href: "https://roadmap.sh/nodejs", iconClass: "fab fa-node-js", description: "Role roadmap." },
    { title: "Android", href: "https://roadmap.sh/android", iconClass: "fab fa-android", description: "Role roadmap." },
    { title: "iOS", href: "https://roadmap.sh/ios", iconClass: "fab fa-apple", description: "Role roadmap." },
    { title: "PostgreSQL", href: "https://roadmap.sh/postgresql", iconClass: "fas fa-database", description: "Role roadmap." },
    { title: "Blockchain", href: "https://roadmap.sh/blockchain", iconClass: "fas fa-link", description: "Role roadmap." },
    { title: "ASP.NET Core", href: "https://roadmap.sh/aspnet-core", iconClass: "fas fa-code", description: "Role roadmap." },
    { title: "Java", href: "https://roadmap.sh/java", iconClass: "fab fa-java", description: "Role roadmap." },
    { title: "Spring Boot", href: "https://roadmap.sh/spring-boot", iconClass: "fas fa-leaf", description: "Role roadmap." },
    { title: "Design System", href: "https://roadmap.sh/design-system", iconClass: "fas fa-palette", description: "Role roadmap." },
    { title: "API Design", href: "https://roadmap.sh/api-design", iconClass: "fas fa-plug", description: "Role roadmap." },
    { title: "Code Review", href: "https://roadmap.sh/code-review", iconClass: "fas fa-code-branch", description: "Role roadmap." },
    { title: "Prompt Engineering", href: "https://roadmap.sh/prompt-engineering", iconClass: "fas fa-comment-dots", description: "Role roadmap." },
    { title: "AI Red Teaming", href: "https://roadmap.sh/ai-red-teaming", iconClass: "fas fa-user-secret", description: "Role roadmap." },
    { title: "SQL", href: "https://roadmap.sh/sql", iconClass: "fas fa-table", description: "Skill roadmap." },
    { title: "System Design", href: "https://roadmap.sh/system-design", iconClass: "fas fa-project-diagram", description: "Skill roadmap." },
    { title: "API Security", href: "https://roadmap.sh/api-security", iconClass: "fas fa-lock", description: "Skill roadmap." },
    { title: "MongoDB", href: "https://roadmap.sh/mongodb", iconClass: "fas fa-leaf", description: "Skill roadmap." },
    { title: "Cloudflare", href: "https://roadmap.sh/cloudflare", iconClass: "fas fa-cloud", description: "Skill roadmap." },
    { title: "Docker", href: "https://roadmap.sh/docker", iconClass: "fab fa-docker", description: "Skill roadmap." },
    { title: "Kubernetes", href: "https://roadmap.sh/kubernetes", iconClass: "fas fa-dharmachakra", description: "Skill roadmap." },
    { title: "Linux", href: "https://roadmap.sh/linux", iconClass: "fab fa-linux", description: "Skill roadmap." },
    { title: "Terraform", href: "https://roadmap.sh/terraform", iconClass: "fas fa-mountain", description: "Skill roadmap." },
    { title: "AWS", href: "https://roadmap.sh/aws", iconClass: "fab fa-aws", description: "Skill roadmap." },
    { title: "Azure", href: "https://roadmap.sh/azure", iconClass: "fas fa-cloud", description: "Skill roadmap." },
    { title: "Google Cloud", href: "https://roadmap.sh/google-cloud", iconClass: "fas fa-cloud", description: "Skill roadmap." },
    { title: "JavaScript", href: "https://roadmap.sh/javascript", iconClass: "fab fa-js", description: "Skill roadmap." },
    { title: "TypeScript", href: "https://roadmap.sh/typescript", iconClass: "fas fa-code", description: "Skill roadmap." },
    { title: "Vue", href: "https://roadmap.sh/vue", iconClass: "fab fa-vuejs", description: "Skill roadmap." },
    { title: "Angular", href: "https://roadmap.sh/angular", iconClass: "fab fa-angular", description: "Skill roadmap." },
    { title: "Go", href: "https://roadmap.sh/go", iconClass: "fas fa-terminal", description: "Skill roadmap." },
    { title: "Rust", href: "https://roadmap.sh/rust", iconClass: "fas fa-cog", description: "Skill roadmap." },
    { title: "GraphQL", href: "https://roadmap.sh/graphql-design-patterns", iconClass: "fas fa-share-alt", description: "Skill roadmap." },
    { title: "Design and Architecture", href: "https://roadmap.sh/design-and-architecture", iconClass: "fas fa-ruler-combined", description: "Skill roadmap." },
    { title: "Design Patterns", href: "https://roadmap.sh/design-patterns", iconClass: "fas fa-shapes", description: "Skill roadmap." },
    { title: "Redis", href: "https://roadmap.sh/redis", iconClass: "fas fa-memory", description: "Skill roadmap." },
    { title: "React Native", href: "https://roadmap.sh/react-native", iconClass: "fas fa-mobile-alt", description: "Skill roadmap." },
    { title: "Flutter", href: "https://roadmap.sh/flutter", iconClass: "fas fa-feather-alt", description: "Skill roadmap." },
    { title: "AI Agents", href: "https://roadmap.sh/ai-agents", iconClass: "fas fa-robot", description: "Skill roadmap." },
    { title: "Coding Interview", href: "https://roadmap.sh/coding-interview", iconClass: "fas fa-user-check", description: "Skill roadmap." },
    { title: "JavaScript Interview", href: "https://roadmap.sh/javascript-interview", iconClass: "fas fa-user-check", description: "Skill roadmap." },
    { title: "React Interview", href: "https://roadmap.sh/react-interview", iconClass: "fas fa-user-check", description: "Skill roadmap." },
    { title: "Frontend Interview", href: "https://roadmap.sh/frontend-interview", iconClass: "fas fa-user-check", description: "Skill roadmap." },
    { title: "Backend Interview", href: "https://roadmap.sh/backend-interview", iconClass: "fas fa-user-check", description: "Skill roadmap." },
    { title: "DevOps Interview", href: "https://roadmap.sh/devops-interview", iconClass: "fas fa-user-check", description: "Skill roadmap." },
    { title: "System Design Interview", href: "https://roadmap.sh/system-design-interview", iconClass: "fas fa-user-check", description: "Skill roadmap." },
    { title: "TypeScript Interview", href: "https://roadmap.sh/typescript-interview", iconClass: "fas fa-user-check", description: "Skill roadmap." },
    { title: "Backend Performance", href: "https://roadmap.sh/best-practices/backend-performance", iconClass: "fas fa-tachometer-alt", description: "Best practices roadmap." },
    { title: "Frontend Performance", href: "https://roadmap.sh/best-practices/frontend-performance", iconClass: "fas fa-tachometer-alt", description: "Best practices roadmap." },
    { title: "Code Review Best Practices", href: "https://roadmap.sh/best-practices/code-review", iconClass: "fas fa-code-branch", description: "Best practices roadmap." },
    { title: "AWS Best Practices", href: "https://roadmap.sh/best-practices/aws", iconClass: "fab fa-aws", description: "Best practices roadmap." },
    { title: "React Best Practices", href: "https://roadmap.sh/best-practices/react", iconClass: "fab fa-react", description: "Best practices roadmap." }
];
const projectIdeaTracks = [
    { title: "All Project Ideas", href: "https://roadmap.sh/projects", iconClass: "fas fa-lightbulb", description: "Project ideas." },
    { title: "Frontend Project Ideas", href: "https://roadmap.sh/frontend/projects", iconClass: "fas fa-laptop-code", description: "Project ideas." },
    { title: "Backend Project Ideas", href: "https://roadmap.sh/backend/projects", iconClass: "fas fa-server", description: "Project ideas." },
    { title: "Full Stack Project Ideas", href: "https://roadmap.sh/full-stack/projects", iconClass: "fas fa-layer-group", description: "Project ideas." },
    { title: "DevOps Project Ideas", href: "https://roadmap.sh/devops/projects", iconClass: "fas fa-cogs", description: "Project ideas." },
    { title: "Android Project Ideas", href: "https://roadmap.sh/android/projects", iconClass: "fab fa-android", description: "Project ideas." },
    { title: "Cyber Security Project Ideas", href: "https://roadmap.sh/cyber-security/projects", iconClass: "fas fa-shield-alt", description: "Project ideas." },
    { title: "AI Engineer Project Ideas", href: "https://roadmap.sh/ai-engineer/projects", iconClass: "fas fa-robot", description: "Project ideas." }
];
const infoModalContent = {
    about: {
        kicker: "Ummah TechHub",
        title: "",
        body: `
            <p><strong>Ummah TechHub</strong> is a practical technology community where students learn, build, and grow through real digital skills.</p>
            <p>We focus on hands-on learning in software, networking, cybersecurity, collaboration, innovation, and project development so members gain experience beyond the classroom.</p>
            <p>Through mentorship, peer learning, events, and partnerships with academies such as <strong>Cisco Networking Academy</strong> and <strong>OPSWAT Academy</strong>, we help learners prepare for certification, teamwork, and industry readiness.</p>
        `
    },
    contact: {
        kicker: "Get In Touch",
        title: "",
        body: `
            <p><strong>Email:</strong> <a href="mailto:ummahtechhub@gmail.com">ummahtechhub@gmail.com</a></p>
            <p><strong>Location:</strong> Kajiado Umma Main Campus</p>
            <div class="info-contact-socials">
                <strong>Socials:</strong>
                <div class="info-contact-social-list">
                    <a class="info-contact-social info-contact-social-instagram" href="https://www.instagram.com/ummatechhub?igsh=MXN2bTRhdGFyYjR4dw%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer">
                        <i class="fab fa-instagram" aria-hidden="true"></i>
                        <span>Instagram</span>
                    </a>
                    <a class="info-contact-social info-contact-social-facebook" href="https://www.facebook.com/share/1HzkMNFqZB/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer">
                        <i class="fab fa-facebook-f" aria-hidden="true"></i>
                        <span>Facebook</span>
                    </a>
                    <a class="info-contact-social info-contact-social-x" href="https://x.com/ummatechhub105?s=21" target="_blank" rel="noopener noreferrer">
                        <i class="fab fa-x-twitter" aria-hidden="true"></i>
                        <span>X</span>
                    </a>
                </div>
            </div>
            <div class="info-contact-map">
                <iframe
                    title="Ummah TechHub Location Map"
                    src="https://maps.google.com/maps?q=Kajiado%20Umma%20Main%20Campus&t=&z=13&ie=UTF8&iwloc=&output=embed"
                    loading="lazy"
                    referrerpolicy="no-referrer-when-downgrade"></iframe>
            </div>
        `
    }
};
// Dashboard Initialization
function initDashboard() {
    if (!currentUser) {
        window.location.href = 'index.html';
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

    const headerProfileAvatar = document.getElementById('headerProfileAvatar');
    if (headerProfileAvatar) {
        if (profile.profileImage) {
            headerProfileAvatar.style.backgroundImage = `url(${profile.profileImage})`;
            headerProfileAvatar.innerHTML = '';
        } else {
            headerProfileAvatar.style.backgroundImage = '';
            headerProfileAvatar.innerHTML = '<i class="fas fa-user"></i>';
        }
    }

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
    initializeHeaderUtilities();
    initializeQuickAccess();
    renderRoadmapCards();
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
    setCertificationCounts();
}

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'index.html';
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

function setCertificationCounts() {
    document.querySelectorAll('.certification-value[data-count-target]').forEach((element) => {
        element.textContent = '+0';
    });
}

function stopCertificationAnimation() {
    if (window._certificationAnimationFrame) {
        cancelAnimationFrame(window._certificationAnimationFrame);
        window._certificationAnimationFrame = null;
    }

    if (window._certificationAnimationTimeout) {
        clearTimeout(window._certificationAnimationTimeout);
        window._certificationAnimationTimeout = null;
    }
}

function animateCertificationCounts() {
    const counters = document.querySelectorAll('.certification-value[data-count-target]');
    if (!counters.length) return;

    stopCertificationAnimation();

    counters.forEach((element) => {
        element.textContent = '+0';
    });

    const duration = 2200;
    const start = performance.now();

    const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);

        counters.forEach((element) => {
            const target = Number(element.dataset.countTarget || 0);
            const value = Math.round(target * eased);
            element.textContent = `+${value}`;
        });

        if (progress < 1) {
            window._certificationAnimationFrame = requestAnimationFrame(tick);
        } else {
            window._certificationAnimationTimeout = window.setTimeout(() => {
                animateCertificationCounts();
            }, 700);
        }
    };

    window._certificationAnimationFrame = requestAnimationFrame(tick);
}

function initializeHeaderUtilities() {
    const chipToggle = document.getElementById('profileChipToggle');
    const chipMenu = document.getElementById('profileChipMenu');
    const headerLogoutBtn = document.getElementById('headerLogoutBtn');
    const modalOverlay = document.getElementById('infoModalOverlay');
    const modalBackdrop = document.getElementById('infoModalBackdrop');
    const modalClose = document.getElementById('infoModalClose');
    const modalKicker = document.getElementById('infoModalKicker');
    const modalTitle = document.getElementById('infoModalTitle');
    const modalBody = document.getElementById('infoModalBody');

    if (chipToggle && chipMenu && !chipToggle.dataset.bound) {
        chipToggle.dataset.bound = 'true';
        chipToggle.addEventListener('click', (event) => {
            event.stopPropagation();
            const isOpen = chipMenu.classList.toggle('open');
            chipToggle.setAttribute('aria-expanded', String(isOpen));
        });

        document.addEventListener('click', (event) => {
            if (!chipMenu.contains(event.target) && !chipToggle.contains(event.target)) {
                chipMenu.classList.remove('open');
                chipToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    if (headerLogoutBtn && !headerLogoutBtn.dataset.bound) {
        headerLogoutBtn.dataset.bound = 'true';
        headerLogoutBtn.addEventListener('click', () => {
            document.getElementById('logoutBtn')?.click();
        });
    }

    document.querySelectorAll('[data-page-shortcut]').forEach((button) => {
        if (button.dataset.bound) return;
        button.dataset.bound = 'true';
        button.addEventListener('click', () => {
            const page = button.dataset.pageShortcut;
            document.querySelector(`.nav-btn[data-page="${page}"]`)?.click();
            chipMenu?.classList.remove('open');
            chipToggle?.setAttribute('aria-expanded', 'false');
        });
    });

    const closeModal = () => {
        if (!modalOverlay) return;
        modalOverlay.hidden = true;
        document.body.classList.remove('modal-open');
    };

    const openModal = (key) => {
        const content = infoModalContent[key];
        if (!content || !modalOverlay || !modalKicker || !modalTitle || !modalBody) return;

        chipMenu?.classList.remove('open');
        chipToggle?.setAttribute('aria-expanded', 'false');
        modalKicker.textContent = content.kicker;
        modalTitle.textContent = content.title;
        modalTitle.hidden = !content.title;
        modalBody.innerHTML = content.body;
        modalOverlay.hidden = false;
        document.body.classList.add('modal-open');
    };

    document.querySelectorAll('[data-open-modal]').forEach((button) => {
        if (button.dataset.bound) return;
        button.dataset.bound = 'true';
        button.addEventListener('click', () => openModal(button.dataset.openModal));
    });

    if (modalClose && !modalClose.dataset.bound) {
        modalClose.dataset.bound = 'true';
        modalClose.addEventListener('click', closeModal);
    }

    if (modalBackdrop && !modalBackdrop.dataset.bound) {
        modalBackdrop.dataset.bound = 'true';
        modalBackdrop.addEventListener('click', closeModal);
    }

    closeModal();

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeModal();
            closeRepositoryPreview();
            closeFeedMediaViewer();
            chipMenu?.classList.remove('open');
            chipToggle?.setAttribute('aria-expanded', 'false');
        }
    });
}

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
    const contentPlaceholders = document.querySelectorAll('#overview-placeholder, #feed-placeholder, #events-placeholder, #projects-placeholder, #teams-placeholder, #repository-placeholder, #roadmap-placeholder, #profile-placeholder, #settings-placeholder');

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
                    roadmap: 'Learning Roadmaps',
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
                animateCertificationCounts();
            } else {
                stopCertificationAnimation();
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
            window.location.href = 'index.html';
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
            window.location.href = 'index.html';
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

function renderRoadmapCards() {
    const roadmapGrid = document.getElementById('roadmapGrid');
    if (!roadmapGrid) return;

    roadmapGrid.innerHTML = '';

    const allTracks = [...roadmapTracks, ...projectIdeaTracks];
    const sections = [
        {
            title: 'Role-based Roadmaps',
            matches: (track) => track.description === 'Role roadmap.'
        },
        {
            title: 'Skill-based Roadmaps',
            matches: (track) => track.description === 'Skill roadmap.'
        },
        {
            title: 'Project Ideas',
            matches: (track) => track.description === 'Project ideas.'
        },
        {
            title: 'Best Practices',
            matches: (track) => track.description === 'Best practices roadmap.'
        }
    ];

    sections.forEach((section) => {
        const items = allTracks.filter(section.matches);
        if (!items.length) return;

        const sectionWrap = document.createElement('section');
        sectionWrap.className = 'roadmap-category';

        const heading = document.createElement('h3');
        heading.className = 'roadmap-category-title';
        heading.textContent = section.title;
        sectionWrap.appendChild(heading);

        const grid = document.createElement('div');
        grid.className = 'roadmap-grid';

        items.forEach((track) => {
            const card = document.createElement('a');
            card.className = 'roadmap-card';
            card.href = track.href;
            card.target = '_blank';
            card.rel = 'noopener noreferrer';
            card.innerHTML = `
                <h3><i class="${track.iconClass}"></i> ${track.title}</h3>
                <p>${track.description}</p>
                <span>${section.title === 'Project Ideas' ? 'Explore Project Ideas' : `Open ${track.title} Roadmap`}</span>
            `;
            grid.appendChild(card);
        });

        sectionWrap.appendChild(grid);
        roadmapGrid.appendChild(sectionWrap);
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
    const eventsContainer = document.getElementById('eventsContainer');
    if (!eventsContainer) return;

    eventsContainer.innerHTML = '';
    let events = [];
    let eventMedia = [];

    try {
        const eventsQuery = query(collection(db, 'events'), orderBy('startDateTime', 'desc'));
        const imagesQuery = query(collection(db, 'images'), orderBy('uploadedAt', 'desc'));
        const videosQuery = query(collection(db, 'videos'), orderBy('uploadedAt', 'desc'));
        const [eventsSnap, imagesSnap, videosSnap] = await Promise.all([
            getDocs(eventsQuery),
            getDocs(imagesQuery),
            getDocs(videosQuery)
        ]);

        events = eventsSnap.docs.map((docSnap) => ({ id: docSnap.id, __kind: 'event', ...docSnap.data() }));
        eventMedia = [
            ...imagesSnap.docs.map((docSnap) => ({ id: docSnap.id, type: 'image', __kind: 'media', ...docSnap.data() })),
            ...videosSnap.docs.map((docSnap) => ({ id: docSnap.id, type: 'video', __kind: 'media', ...docSnap.data() }))
        ].filter((item) => normalizeDestination(item.category) === 'event');
    } catch (e) {
        console.error('Failed to load events:', e);
    }

    try {
        const uploadsSnap = await dbGet(dbRef(rtdb, 'uploads'));
        if (uploadsSnap.exists()) {
            const uploads = uploadsSnap.val() || {};
            const rtdbImages = uploads.images ? Object.values(uploads.images).map((item) => ({ type: 'image', __kind: 'media', ...item })) : [];
            const rtdbVideos = uploads.videos ? Object.values(uploads.videos).map((item) => ({ type: 'video', __kind: 'media', ...item })) : [];
            eventMedia = [
                ...eventMedia,
                ...rtdbImages.filter((item) => normalizeDestination(item.category) === 'event'),
                ...rtdbVideos.filter((item) => normalizeDestination(item.category) === 'event')
            ];
        }
    } catch (e) {
        console.error('Event realtime load failed:', e);
    }

    eventMedia = dedupeMediaItems(eventMedia).filter((item) => {
        if (item.type === 'image') {
            return Boolean(item.compressedURL || item.fileURL || item.url || item.thumbnail);
        }

        if (item.type === 'video') {
            return Boolean(item.fileURL || item.url || item.thumbnailURL || item.thumbnail || item.compressedURL);
        }

        return true;
    });

    eventMedia = groupBatchedImageUploads(eventMedia);

    renderEvents(events, eventMedia);
}

function renderEvents(events, eventMedia = []) {
    const eventsContainer = document.getElementById('eventsContainer');
    if (!eventsContainer) return;
    eventsContainer.innerHTML = '';

    if ((!events || events.length === 0) && (!eventMedia || eventMedia.length === 0)) {
        eventsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 40px;">No event content yet.</p>';
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
        eventsContainer.appendChild(eventCard);
    });

    eventMedia.forEach((item) => {
        const mediaCard = document.createElement('div');
        mediaCard.className = 'event-card event-feed-card';
        const titleText = formatUploadTitle(
            item.fileName || item.filename || item.title || item.name,
            item.type === 'video' ? 'Event Video' : item.type === 'image-gallery' ? `${item.images?.length || 2} Event Photos` : 'Event Image'
        );
        const descriptionText = item.description || item.story || item.content || 'Event media uploaded by the admin team.';
        const mediaUrl = item.type === 'video'
            ? (item.fileURL || item.url || '')
            : (item.compressedURL || item.fileURL || item.url || item.thumbnail || '');
        const poster = item.thumbnailURL || item.thumbnail || item.compressedURL || '';
        const dateText = item.uploadedAt?.seconds
            ? new Date(item.uploadedAt.seconds * 1000).toLocaleDateString()
            : (typeof item.uploadedAt === 'number' ? new Date(item.uploadedAt).toLocaleDateString() : 'Recent upload');

        mediaCard.innerHTML = `
            <div class="event-media">
                ${item.type === 'video'
                    ? (mediaUrl
                        ? `<video src="${mediaUrl}" ${poster ? `poster="${poster}"` : ''} controls preload="metadata"></video>`
                        : `<i class="fas fa-play-circle" style="font-size: 40px; color: #2e8b57;"></i>`)
                    : item.type === 'image-gallery'
                        ? createUploadGalleryMarkup(item.images, titleText)
                    : (mediaUrl
                        ? `<button type="button" class="feed-media-open" onclick="window.openFeedMedia('${escapeSingleQuote(mediaUrl)}', '${escapeSingleQuote(titleText)}')"><img src="${mediaUrl}" alt="${titleText}"></button>`
                        : `<i class="fas fa-image" style="font-size: 40px; color: #2e8b57;"></i>`)}
            </div>
            <div class="event-card-content">
                <h3>${titleText}</h3>
                <p><i class="fas fa-clock"></i> ${dateText}</p>
                <p>${descriptionText}</p>
                <span class="badge" style="background: var(--primary-color); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">Event Media</span>
                <div class="upload-card-actions" style="margin-top: 12px;">
                    <button class="feed-action-btn upload-card-action-btn">
                        <i class="fas fa-thumbs-up"></i>
                        <span>Like</span>
                    </button>
                    <button class="feed-action-btn upload-card-action-btn">
                        <i class="fas fa-share"></i>
                        <span>Share</span>
                    </button>
                    <button class="feed-action-btn upload-card-action-btn">
                        <i class="fas fa-comment"></i>
                        <span>Comment</span>
                    </button>
                </div>
            </div>
        `;
        eventsContainer.appendChild(mediaCard);
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

async function loadRepositoryHighlights() {
    const grid = document.getElementById('repoShowcaseGrid');
    if (!grid) return [];

    grid.innerHTML = '<p class="repository-empty-state">Loading highlights...</p>';

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

    return highlights;
}

function initializeRepositoryControls() {
    const searchInput = document.getElementById('repositorySearch');
    const sortSelect = document.getElementById('repositorySort');

    if (searchInput && !searchInput.dataset.bound) {
        searchInput.dataset.bound = 'true';
        searchInput.addEventListener('input', () => {
            repositoryState.search = searchInput.value.trim().toLowerCase();
            renderRepository();
        });
    }

    if (sortSelect && !sortSelect.dataset.bound) {
        sortSelect.dataset.bound = 'true';
        sortSelect.addEventListener('change', () => {
            repositoryState.sort = sortSelect.value;
            renderRepository();
        });
    }

    document.querySelectorAll('[data-repo-filter]').forEach((button) => {
        if (button.dataset.bound) return;
        button.dataset.bound = 'true';
        button.addEventListener('click', () => {
            repositoryState.filter = button.dataset.repoFilter;
            document.querySelectorAll('[data-repo-filter]').forEach((item) => {
                item.classList.toggle('active', item === button);
            });
            renderRepository();
        });
    });
}

async function loadRepository() {
    initializeRepositoryControls();

    const filesGrid = document.getElementById('repositoryFilesGrid');
    const videosGrid = document.getElementById('repositoryVideosGrid');
    if (!filesGrid || !videosGrid) return;

    filesGrid.innerHTML = '<p class="repository-empty-state">Loading repository files...</p>';
    videosGrid.innerHTML = '<p class="repository-empty-state">Loading repository videos...</p>';

    let files = [];
    let videos = [];

    try {
        const filesQuery = query(collection(db, 'files'), orderBy('uploadedAt', 'desc'));
        const videosQuery = query(collection(db, 'videos'), orderBy('uploadedAt', 'desc'));
        const [filesSnap, videosSnap] = await Promise.all([
            getDocs(filesQuery),
            getDocs(videosQuery)
        ]);

        files = filesSnap.docs.map((docSnap) => ({ id: docSnap.id, __source: 'firestore', ...docSnap.data() }));
        videos = videosSnap.docs.map((docSnap) => ({ id: docSnap.id, __source: 'firestore', ...docSnap.data() }));
    } catch (e) {
        console.error('Repository load failed:', e);
    }

    try {
        const uploadsSnap = await dbGet(dbRef(rtdb, 'uploads'));
        if (uploadsSnap.exists()) {
            const uploads = uploadsSnap.val() || {};
            const rtdbFiles = uploads.files ? Object.values(uploads.files).map((item) => ({ ...item, __source: 'rtdb' })) : [];
            const rtdbVideos = uploads.videos ? Object.values(uploads.videos).map((item) => ({ ...item, __source: 'rtdb' })) : [];
            if (rtdbFiles.length) files = [...rtdbFiles, ...files];
            if (rtdbVideos.length) videos = [...rtdbVideos, ...videos];
        }
    } catch (e) {
        console.error('Repository realtime load failed:', e);
    }

    repositoryState.highlights = await loadRepositoryHighlights();
    repositoryState.files = dedupeMediaItems(files).filter((item) => Boolean(item.fileURL || item.url));
    repositoryState.images = [];
    repositoryState.videos = dedupeMediaItems(videos).filter((item) => Boolean(item.fileURL || item.url || item.thumbnailURL || item.thumbnail || item.compressedURL));

    updateRepositoryCounts();
    renderRepository();
}

function updateRepositoryCounts() {
    const counts = {
        files: repositoryState.files.length,
        images: repositoryState.images.length,
        videos: repositoryState.videos.length,
        highlights: repositoryState.highlights.length
    };

    const map = {
        repoCountFiles: counts.files,
        repoCountImages: counts.images,
        repoCountVideos: counts.videos,
        repoCountHighlights: counts.highlights
    };

    Object.entries(map).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = String(value);
    });
}

function renderRepository() {
    renderRepositoryHighlights();
    renderRepositorySection('files', repositoryState.files, document.getElementById('repositoryFilesGrid'), 'file');
    renderRepositorySection('videos', repositoryState.videos, document.getElementById('repositoryVideosGrid'), 'video');
    updateRepositoryVisibility();
    updateRepositoryResultsLine();
}

function renderRepositoryHighlights() {
    const grid = document.getElementById('repoShowcaseGrid');
    if (!grid) return;

    grid.innerHTML = '';
    const items = filterAndSortRepositoryItems(repositoryState.highlights, 'highlight');

    if (!items.length) {
        grid.innerHTML = '<p class="repository-empty-state">No featured highlights match your current search.</p>';
        return;
    }

    items.forEach((item) => {
        const link = item.linkUrl || item.link || item.url || '#';
        const card = document.createElement(link && link !== '#' ? 'a' : 'div');
        card.className = 'repo-showcase-link';
        if (card instanceof HTMLAnchorElement) {
            card.href = link;
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

function renderRepositorySection(sectionKey, items, grid, kind) {
    if (!grid) return;
    grid.innerHTML = '';

    const filteredItems = filterAndSortRepositoryItems(items, kind);

    if (!filteredItems.length) {
        const message = {
            file: 'No study notes or reports match your current search.',
            image: 'No gallery images match your current search.',
            video: 'No short videos match your current search.'
        }[kind] || 'No items match your current search.';

        grid.innerHTML = `<p class="repository-empty-state">${message}</p>`;
        return;
    }

    filteredItems.forEach((item) => {
        grid.appendChild(createRepositoryCard(item, kind));
    });
}

function filterAndSortRepositoryItems(items, kind) {
    const queryText = repositoryState.search;

    let filtered = items.filter((item) => {
        if (repositoryState.filter !== 'all') {
            const targetKey = repositoryState.filter === 'files' ? 'file'
                : repositoryState.filter === 'images' ? 'image'
                : repositoryState.filter === 'videos' ? 'video'
                : repositoryState.filter === 'highlights' ? 'highlight'
                : repositoryState.filter;
            if (targetKey !== kind) return false;
        }

        if (!queryText) return true;

        const haystack = [
            item.title,
            item.fileName,
            item.filename,
            item.name,
            item.description,
            item.story,
            item.content,
            item.category,
            item.uploadedBy,
            item.uploadedByName
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

        return haystack.includes(queryText);
    });

    filtered.sort((a, b) => {
        if (repositoryState.sort === 'title-asc' || repositoryState.sort === 'title-desc') {
            const titleA = getRepositoryTitle(a, kind).toLowerCase();
            const titleB = getRepositoryTitle(b, kind).toLowerCase();
            const compare = titleA.localeCompare(titleB);
            return repositoryState.sort === 'title-asc' ? compare : -compare;
        }

        const dateA = getRepositoryTimestamp(a);
        const dateB = getRepositoryTimestamp(b);
        return repositoryState.sort === 'oldest' ? dateA - dateB : dateB - dateA;
    });

    return filtered;
}

function updateRepositoryVisibility() {
    const sectionMap = {
        highlights: document.getElementById('repositoryHighlightsSection'),
        files: document.getElementById('repositoryFilesSection'),
        images: document.getElementById('repositoryImagesSection'),
        videos: document.getElementById('repositoryVideosSection')
    };

    Object.entries(sectionMap).forEach(([key, element]) => {
        if (!element) return;
        const show = repositoryState.filter === 'all' || repositoryState.filter === key;
        element.classList.toggle('repository-hidden', !show);
    });
}

function updateRepositoryResultsLine() {
    const line = document.getElementById('repositoryResultsLine');
    if (!line) return;

    const visibleCount =
        filterAndSortRepositoryItems(repositoryState.files, 'file').length +
        filterAndSortRepositoryItems(repositoryState.images, 'image').length +
        filterAndSortRepositoryItems(repositoryState.videos, 'video').length +
        filterAndSortRepositoryItems(repositoryState.highlights, 'highlight').length;

    const modeLabel = {
        all: 'all repository items',
        files: 'file resources',
        images: 'gallery images',
        videos: 'short videos',
        highlights: 'featured highlights'
    }[repositoryState.filter] || 'repository items';

    line.textContent = `${visibleCount} result${visibleCount === 1 ? '' : 's'} shown for ${modeLabel}.`;
}

function getRepositoryTitle(item, kind) {
    return formatUploadTitle(item.title || item.fileName || item.filename || item.name, kind === 'file' ? 'Resource File' : kind === 'image' ? 'Gallery Image' : 'Video Resource');
}

function getRepositoryDescription(item) {
    return item.description || item.story || item.content || 'No description provided yet.';
}

function getRepositoryMediaUrl(item, kind) {
    if (kind === 'video') return item.fileURL || item.url || '';
    if (kind === 'image') return item.compressedURL || item.fileURL || item.url || '';
    return item.fileURL || item.url || '';
}

function getRepositoryTimestamp(item) {
    if (item.uploadedAt?.seconds) return item.uploadedAt.seconds * 1000;
    if (typeof item.createdAt === 'number') return item.createdAt;
    const parsed = Date.parse(item.createdDate || item.date || '');
    return Number.isNaN(parsed) ? 0 : parsed;
}

function getRepositoryDate(item) {
    const timestamp = getRepositoryTimestamp(item);
    return timestamp ? new Date(timestamp).toLocaleDateString() : 'Recent upload';
}

function formatUploadTitle(rawTitle, fallback = 'Upload') {
    const source = String(rawTitle || '').trim();
    if (!source) return fallback;

    const withoutExtension = source.replace(/\.[a-z0-9]+$/i, '');
    const normalized = withoutExtension
        .replace(/[_-]+/g, ' ')
        .replace(/\bwhatsapp image\b/ig, '')
        .replace(/\bat\b/ig, ' ')
        .replace(/\bpm\b|\bam\b/ig, ' ')
        .replace(/\b\d{4}\b/g, ' ')
        .replace(/\b\d{1,2}\b/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (!normalized) return fallback;

    return normalized
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function getFileIconClass(url = '') {
    const lower = String(url).toLowerCase();
    if (lower.endsWith('.pdf')) return 'fas fa-file-pdf';
    if (lower.endsWith('.doc') || lower.endsWith('.docx')) return 'fas fa-file-word';
    if (lower.endsWith('.ppt') || lower.endsWith('.pptx')) return 'fas fa-file-powerpoint';
    if (lower.endsWith('.xls') || lower.endsWith('.xlsx') || lower.endsWith('.csv')) return 'fas fa-file-excel';
    if (lower.endsWith('.zip') || lower.endsWith('.rar')) return 'fas fa-file-zipper';
    return 'fas fa-file-lines';
}

function getFileExtensionLabel(url = '') {
    const clean = String(url).split('?')[0];
    const parts = clean.split('.');
    return parts.length > 1 ? parts.pop().toUpperCase() : 'FILE';
}

function createRepositoryCard(item, kind) {
    const card = document.createElement('article');
    card.className = 'repository-resource-card';

    const title = getRepositoryTitle(item, kind);
    const description = getRepositoryDescription(item);
    const mediaUrl = getRepositoryMediaUrl(item, kind);
    const thumbURL = item.thumbnailURL || item.thumbnail || item.compressedURL || mediaUrl;
    const uploader = item.uploadedByName || item.uploadedBy || item.author || 'Admin Team';
    const dateLabel = getRepositoryDate(item);
    const category = item.category || (kind === 'file' ? 'Document' : kind === 'image' ? 'Gallery' : 'Video');
    const isAdminUser = JSON.parse(localStorage.getItem('ummah_user') || '{}')?.isAdmin;

    let media = '';
    if (kind === 'video') {
        media = `
            <button type="button" class="repository-media-button" onclick="window.openRepositoryPreview('${kind}', '${mediaUrl}', '${title.replace(/'/g, "\\'")}', '${thumbURL.replace(/'/g, "\\'")}')">
                <div class="upload-media upload-media-video">
                    ${mediaUrl ? `<video src="${mediaUrl}" ${thumbURL ? `poster="${thumbURL}"` : ''} preload="metadata" class="upload-media-el"></video>` : `<i class="fas fa-play-circle upload-media-icon"></i>`}
                </div>
            </button>
        `;
    } else if (kind === 'image') {
        media = `
            <button type="button" class="repository-media-button" onclick="window.openRepositoryPreview('${kind}', '${mediaUrl}', '${title.replace(/'/g, "\\'")}')">
                <div class="upload-media upload-media-image">
                    ${mediaUrl ? `<img src="${mediaUrl}" alt="${title}" class="upload-media-el">` : `<div class="upload-media-placeholder"><i class="fas fa-image upload-media-icon"></i></div>`}
                </div>
            </button>
        `;
    } else {
        media = `
            <div class="repository-file-media">
                <span class="repository-file-icon"><i class="${getFileIconClass(mediaUrl)}"></i></span>
                <span class="repository-file-ext">${getFileExtensionLabel(mediaUrl)}</span>
            </div>
        `;
    }

    card.innerHTML = `
        ${media}
        <div class="repository-card-body">
            <div class="repository-card-topline">
                <span class="repository-kind-badge">${category}</span>
                <span class="repository-date">${dateLabel}</span>
            </div>
            <h4 class="repository-card-title">${title}</h4>
            <p class="repository-card-description">${description}</p>
            <div class="repository-meta-row">
                <span class="repository-meta-chip"><i class="fas fa-user"></i> ${uploader}</span>
                <span class="repository-meta-chip"><i class="fas fa-tag"></i> ${kind === 'file' ? 'Downloadable' : kind === 'image' ? 'Preview Ready' : 'Playable'}</span>
            </div>
            <div class="repository-actions">
                ${kind !== 'file' ? `<button type="button" class="repository-action-btn" onclick="window.openRepositoryPreview('${kind}', '${mediaUrl}', '${title.replace(/'/g, "\\'")}', '${thumbURL.replace(/'/g, "\\'")}')"><i class="fas fa-eye"></i> Preview</button>` : ''}
                ${mediaUrl ? `<a class="repository-action-btn" href="${mediaUrl}" target="_blank" rel="noopener" download><i class="fas fa-download"></i> Download</a>` : ''}
                ${mediaUrl ? `<button type="button" class="repository-action-btn" onclick="window.shareRepositoryResource('${mediaUrl}', '${title.replace(/'/g, "\\'")}')"><i class="fas fa-share-alt"></i> Share</button>` : ''}
                ${kind === 'file' && mediaUrl ? `<a class="repository-action-btn" href="${mediaUrl}" target="_blank" rel="noopener"><i class="fas fa-arrow-up-right-from-square"></i> Open</a>` : ''}
                ${isAdminUser && item.__source === 'firestore' && item.id ? `<button type="button" class="repository-action-btn repository-action-btn-danger" onclick="window.deleteRepositoryItem('${kind}', '${item.id}')"><i class="fas fa-trash"></i> Delete</button>` : ''}
            </div>
        </div>
    `;

    return card;
}

function ensureRepositoryPreviewModal() {
    let overlay = document.getElementById('repositoryPreviewOverlay');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'repositoryPreviewOverlay';
    overlay.className = 'repository-preview-overlay';
    overlay.hidden = true;
    overlay.innerHTML = `
        <div class="repository-preview-backdrop" data-close-repository-preview="true"></div>
        <section class="repository-preview-panel" aria-modal="true" role="dialog" aria-labelledby="repositoryPreviewTitle">
            <button type="button" class="repository-preview-close" id="repositoryPreviewClose" aria-label="Close preview">
                <i class="fas fa-times"></i>
            </button>
            <div class="repository-preview-head">
                <h3 class="repository-preview-title" id="repositoryPreviewTitle"></h3>
                <div class="repository-preview-actions">
                    <a id="repositoryPreviewDownload" class="repository-action-btn" href="#" download target="_blank" rel="noopener">
                        <i class="fas fa-download"></i> Download
                    </a>
                    <button type="button" id="repositoryPreviewShare" class="repository-action-btn">
                        <i class="fas fa-share-alt"></i> Share
                    </button>
                </div>
            </div>
            <div class="repository-preview-stage" id="repositoryPreviewStage"></div>
        </section>
    `;

    document.body.appendChild(overlay);
    overlay.querySelector('[data-close-repository-preview="true"]')?.addEventListener('click', closeRepositoryPreview);
    document.getElementById('repositoryPreviewClose')?.addEventListener('click', closeRepositoryPreview);
    document.getElementById('repositoryPreviewShare')?.addEventListener('click', () => {
        const shareButton = document.getElementById('repositoryPreviewShare');
        if (!shareButton) return;
        window.shareRepositoryResource(shareButton.dataset.url || '', shareButton.dataset.title || 'Repository Resource');
    });

    return overlay;
}

function closeRepositoryPreview() {
    const overlay = document.getElementById('repositoryPreviewOverlay');
    if (!overlay) return;
    overlay.hidden = true;
    document.body.classList.remove('modal-open');
}

window.openRepositoryPreview = function(kind, mediaUrl, title, poster = '') {
    if (!mediaUrl) return;
    const overlay = ensureRepositoryPreviewModal();
    const stage = document.getElementById('repositoryPreviewStage');
    const titleElement = document.getElementById('repositoryPreviewTitle');
    const downloadLink = document.getElementById('repositoryPreviewDownload');
    const shareButton = document.getElementById('repositoryPreviewShare');
    if (!stage || !titleElement || !downloadLink || !shareButton) return;

    titleElement.textContent = title || 'Repository Preview';
    stage.innerHTML = kind === 'video'
        ? `<video src="${mediaUrl}" ${poster ? `poster="${poster}"` : ''} controls autoplay playsinline></video>`
        : `<img src="${mediaUrl}" alt="${title || 'Repository Preview'}">`;
    downloadLink.href = mediaUrl;
    downloadLink.setAttribute('download', `${(title || 'repository-resource').replace(/\s+/g, '-').toLowerCase()}`);
    shareButton.dataset.url = mediaUrl;
    shareButton.dataset.title = title || 'Repository Resource';

    overlay.hidden = false;
    document.body.classList.add('modal-open');
};

window.shareRepositoryResource = async function(resourceUrl, title = 'Repository Resource') {
    if (!resourceUrl) return;
    if (navigator.share) {
        try {
            await navigator.share({
                title,
                text: title,
                url: resourceUrl
            });
            return;
        } catch (error) {
            if (error && error.name === 'AbortError') return;
        }
    }

    try {
        await navigator.clipboard.writeText(resourceUrl);
        alert('Resource link copied to clipboard.');
    } catch (error) {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(resourceUrl)}`, '_blank', 'noopener');
    }
};

window.deleteRepositoryItem = async function(kind, id) {
    if (!currentUser || !JSON.parse(localStorage.getItem('ummah_user') || '{}')?.isAdmin) {
        alert('Only admins can remove repository items.');
        return;
    }

    const collectionName = kind === 'image' ? 'images' : kind === 'video' ? 'videos' : 'files';
    const confirmed = window.confirm('Delete this repository item? This action cannot be undone.');
    if (!confirmed) return;

    try {
        await deleteDoc(doc(db, collectionName, id));
        await loadRepository();
    } catch (error) {
        console.error('Delete failed:', error);
        alert('Unable to delete that item right now.');
    }
};

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

    feedItems = dedupeMediaItems(feedItems).filter((item) => {
        if (item.type !== 'post' && !shouldDisplayInCommunityFeed(item)) {
            return false;
        }

        if (item.type === 'image') {
            return Boolean(item.compressedURL || item.fileURL || item.url || item.thumbnail);
        }

        if (item.type === 'video') {
            return Boolean(item.fileURL || item.url || item.thumbnailURL || item.thumbnail || item.compressedURL);
        }

        return true;
    });

    feedItems = groupBatchedImageUploads(feedItems);

    // Sort by most recent
    feedItems.sort((a, b) => {
        const dateA = getUploadTimestamp(a);
        const dateB = getUploadTimestamp(b);
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

function dedupeMediaItems(items) {
    const seen = new Set();

    return items.filter((item) => {
        const mediaUrl = item.compressedURL || item.fileURL || item.url || item.thumbnailURL || item.thumbnail || '';
        const name = item.fileName || item.filename || item.title || item.name || '';
        const stamp = item.uploadedAt?.seconds || item.createdAt || item.createdDate || '';
        const key = [
            item.type || 'item',
            String(mediaUrl).trim().toLowerCase(),
            String(name).trim().toLowerCase(),
            String(stamp).trim().toLowerCase()
        ].join('|');

        if (seen.has(key)) {
            return false;
        }

        seen.add(key);
        return true;
    });
}

function getUploadTimestamp(item) {
    if (item.uploadedAt?.seconds) return item.uploadedAt.seconds * 1000;
    if (typeof item.uploadedAt === 'number') return item.uploadedAt;
    if (typeof item.createdAt === 'number') return item.createdAt;
    if (typeof item.id === 'number') return item.id;
    return 0;
}

function escapeSingleQuote(value = '') {
    return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, ' ');
}

function groupBatchedImageUploads(items) {
    const groupedItems = [];
    const galleryMap = new Map();

    items.forEach((item) => {
        if (item.type !== 'image' || !item.batchId || Number(item.batchSize || 1) < 2) {
            groupedItems.push(item);
            return;
        }

        const key = `${normalizeDestination(item.category)}|${item.batchId}`;
        const imageUrl = item.compressedURL || item.fileURL || item.url || item.thumbnail || '';
        if (!imageUrl) return;

        if (!galleryMap.has(key)) {
            const galleryItem = {
                ...item,
                type: 'image-gallery',
                images: []
            };
            galleryMap.set(key, galleryItem);
            groupedItems.push(galleryItem);
        }

        galleryMap.get(key).images.push({
            ...item,
            mediaUrl: imageUrl
        });
    });

    groupedItems.forEach((item) => {
        if (item.type !== 'image-gallery') return;
        item.images.sort((a, b) => (a.batchIndex || 0) - (b.batchIndex || 0));
        if (item.images[0]) {
            Object.assign(item, {
                ...item.images[0],
                type: 'image-gallery',
                images: item.images
            });
        }
    });

    return groupedItems;
}

function createUploadGalleryMarkup(images, titleText) {
    const safeImages = Array.isArray(images) ? images.filter((item) => item?.mediaUrl) : [];
    if (safeImages.length === 0) return '';

    const visibleImages = safeImages.slice(0, 4);
    const extraCount = safeImages.length - visibleImages.length;
    const gridClass = visibleImages.length === 1 ? 'upload-gallery-grid single' : 'upload-gallery-grid';

    return `
        <div class="${gridClass}">
            ${visibleImages.map((image, index) => `
                <button type="button" class="upload-gallery-item" onclick="window.openFeedMedia('${escapeSingleQuote(image.mediaUrl)}', '${escapeSingleQuote(formatUploadTitle(image.fileName || image.filename || image.title || image.name, titleText))}')">
                    <img src="${image.mediaUrl}" alt="${formatUploadTitle(image.fileName || image.filename || image.title || image.name, titleText)}">
                    ${extraCount > 0 && index === visibleImages.length - 1 ? `<span class="upload-gallery-more">+${extraCount}</span>` : ''}
                </button>
            `).join('')}
        </div>
    `;
}

function normalizeDestination(category = '') {
    const value = String(category || '').trim().toLowerCase();
    if (value === 'community-feed') return 'community-feed';
    if (value === 'event') return 'event';
    if (value === 'repository-notes') return 'repository-notes';
    if (value === 'repository-videos') return 'repository-videos';
    if (value === 'others') return 'others';
    return value;
}

function shouldDisplayInCommunityFeed(item) {
    const destination = normalizeDestination(item.category);
    if (!destination) return true;
    return destination === 'community-feed' || destination === 'others';
}

function createFeedCard(item) {
    const card = document.createElement('div');
    card.className = 'feed-card';
    card.style.cssText = 'overflow: hidden; transition: all 0.3s ease; display: flex; flex-direction: column;';
    
    const itemKey = String(item.id || item.fileURL || item.url || item.thumbnail || item.title || item.fileName || item.filename || item.createdAt || item.uploadedAt?.seconds || Math.random());
    const itemId = itemKey.replace(/[^a-zA-Z0-9_-]/g, '_');
    const titleText = formatUploadTitle(item.title || item.fileName || item.filename || item.name, 'Post');
    const descriptionText = item.description || item.story || item.content || '';
    const shortDesc = descriptionText || 'No description provided.';
    const createdDate = item.createdDate
        || (item.uploadedAt?.seconds ? new Date(item.uploadedAt.seconds * 1000).toLocaleDateString() : '');

    let content = '';
    
    if (item.type === 'post') {
        content = `
            ${item.thumbnail ? `<div class="feed-card-media-shell"><img src="${item.thumbnail}" class="feed-post-thumb" alt="${titleText}"></div>` : ''}
            <div class="feed-card-body">
                <h3>${titleText}</h3>
                <p style="margin-bottom: 14px;">${descriptionText}</p>
                <div style="display: flex; gap: 10px; margin-bottom: 0; flex-wrap: wrap;">
                    <span class="badge badge-blue">${item.category}</span>
                    <small style="color: #999;">${createdDate}</small>
                </div>
            </div>
        `;
    } else if (item.type === 'video') {
        const poster = item.thumbnailURL || item.thumbnail || item.compressedURL || '';
        const videoUrl = item.fileURL || item.url || '';
        content = `
            <div class="feed-card-media-shell">
                <div class="feed-card-media-stage">
                    ${videoUrl ? `<video src="${videoUrl}" ${poster ? `poster="${poster}"` : ''} class="feed-media feed-media-video" controls controlsList="nodownload noplaybackrate" preload="metadata"></video>` : `<i class="fas fa-play-circle" style="font-size: 60px; color: var(--primary-color); text-shadow: 0 10px 18px rgba(0,0,0,0.25);"></i>`}
                </div>
            </div>
            <div class="feed-card-body">
                <p>${shortDesc}</p>
            </div>
        `;
    } else if (item.type === 'image') {
        const imageUrl = item.compressedURL || item.fileURL || item.url || item.thumbnail || '';
        content = `
            <div class="feed-card-media-shell">
                <button type="button" class="feed-media-open" onclick="window.openFeedMedia('${escapeSingleQuote(imageUrl)}', '${escapeSingleQuote(titleText)}')">
                    <img src="${imageUrl}" class="feed-media feed-media-image" alt="${titleText}">
                </button>
            </div>
            <div class="feed-card-body">
                <p style="font-size: 13px;">${shortDesc}</p>
            </div>
        `;
    } else if (item.type === 'image-gallery') {
        content = `
            <div class="feed-card-media-shell">
                ${createUploadGalleryMarkup(item.images, titleText)}
            </div>
            <div class="feed-card-body">
                <p style="font-size: 13px;">${shortDesc}</p>
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
        <div class="upload-card-actions">
            <button onclick="window.toggleLike('${itemId}')" class="feed-action-btn upload-card-action-btn">
                <i class="fas fa-thumbs-up"></i>
                <span>Like (<span class="like-count-${itemId}">${likesCount}</span>)</span>
            </button>
            <button onclick="window.toggleShare('${itemId}')" class="feed-action-btn upload-card-action-btn">
                <i class="fas fa-share"></i>
                <span>Share (<span class="share-count-${itemId}">${sharesCount}</span>)</span>
            </button>
            <button onclick="window.toggleComment('${itemId}')" class="feed-action-btn upload-card-action-btn">
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

function ensureFeedMediaViewer() {
    let viewer = document.getElementById('feedMediaViewer');
    if (viewer) return viewer;

    viewer = document.createElement('div');
    viewer.id = 'feedMediaViewer';
    viewer.className = 'feed-media-viewer';
    viewer.hidden = true;
    viewer.innerHTML = `
        <div class="feed-media-viewer-backdrop" data-feed-viewer-close="true"></div>
        <section class="feed-media-viewer-panel" aria-modal="true" role="dialog" aria-labelledby="feedMediaViewerTitle">
            <button type="button" class="feed-media-viewer-close" id="feedMediaViewerClose" aria-label="Close image viewer">
                <i class="fas fa-times"></i>
            </button>
            <div class="feed-media-viewer-topbar">
                <h3 id="feedMediaViewerTitle"></h3>
                <div class="feed-media-viewer-actions">
                    <a id="feedMediaDownloadLink" class="feed-media-viewer-action" href="#" download target="_blank" rel="noopener">
                        <i class="fas fa-download"></i>
                        <span>Download</span>
                    </a>
                    <button type="button" id="feedMediaShareButton" class="feed-media-viewer-action">
                        <i class="fas fa-share-alt"></i>
                        <span>Share</span>
                    </button>
                </div>
            </div>
            <div class="feed-media-viewer-stage">
                <img id="feedMediaViewerImage" src="" alt="">
            </div>
        </section>
    `;

    document.body.appendChild(viewer);

    viewer.querySelector('[data-feed-viewer-close="true"]')?.addEventListener('click', closeFeedMediaViewer);
    document.getElementById('feedMediaViewerClose')?.addEventListener('click', closeFeedMediaViewer);
    document.getElementById('feedMediaShareButton')?.addEventListener('click', shareFeedMedia);

    return viewer;
}

function closeFeedMediaViewer() {
    const viewer = document.getElementById('feedMediaViewer');
    if (!viewer) return;
    viewer.hidden = true;
    document.body.classList.remove('modal-open');
}

window.openFeedMedia = function(imageUrl, title = 'Community Feed Image') {
    const viewer = ensureFeedMediaViewer();
    const titleElement = document.getElementById('feedMediaViewerTitle');
    const imageElement = document.getElementById('feedMediaViewerImage');
    const downloadLink = document.getElementById('feedMediaDownloadLink');
    const shareButton = document.getElementById('feedMediaShareButton');

    if (!titleElement || !imageElement || !downloadLink || !shareButton) return;

    titleElement.textContent = title;
    imageElement.src = imageUrl;
    imageElement.alt = title;
    downloadLink.href = imageUrl;
    downloadLink.setAttribute('download', `${title.replace(/\s+/g, '-').toLowerCase() || 'feed-image'}.jpg`);
    shareButton.dataset.shareUrl = imageUrl;
    shareButton.dataset.shareTitle = title;

    viewer.hidden = false;
    document.body.classList.add('modal-open');
};

async function shareFeedMedia() {
    const shareButton = document.getElementById('feedMediaShareButton');
    if (!shareButton) return;

    const shareUrl = shareButton.dataset.shareUrl || window.location.href;
    const shareTitle = shareButton.dataset.shareTitle || 'Community Feed Image';
    const encodedUrl = encodeURIComponent(shareUrl);

    if (navigator.share) {
        try {
            await navigator.share({
                title: shareTitle,
                text: shareTitle,
                url: shareUrl
            });
            return;
        } catch (error) {
            if (error && error.name === 'AbortError') return;
        }
    }

    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank', 'noopener');
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
    if (interactions.liked) {
        return;
    }
    interactions.likes = (interactions.likes || 0) + 1;
    interactions.liked = true;
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
