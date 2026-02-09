// Dashboard Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Get user data
    const userData = localStorage.getItem('ummah_user');
    const profileData = localStorage.getItem('ummah_profile');
    
    if (!userData) {
        window.location.href = 'login.html';
        return;
    }

    // Parse user data
    let user = null;
    try {
        user = JSON.parse(userData);
    } catch (e) {
        user = { admission: userData };
    }

    // Set user name in header
    const userDisplayName = document.getElementById('userDisplayName');
    const userWelcomeName = document.getElementById('userWelcomeName');
    
    if (profileData) {
        try {
            const profile = JSON.parse(profileData);
            const displayName = profile.name || profile.fullName || user.admission || 'User';
            if (userDisplayName) userDisplayName.textContent = displayName.split(' ')[0];
            if (userWelcomeName) userWelcomeName.textContent = displayName.split(' ')[0];
            
            // Populate profile form
            const profileName = document.getElementById('profileName');
            const profileBio = document.getElementById('profileBio');
            if (profileName) profileName.value = profile.name || '';
            if (profileBio) profileBio.value = profile.bio || '';
        } catch (e) {
            const displayName = user.admission || 'User';
            if (userDisplayName) userDisplayName.textContent = displayName.split('/')[0] || 'User';
            if (userWelcomeName) userWelcomeName.textContent = displayName.split('/')[0] || 'User';
        }
    } else {
        const displayName = user.admission || 'User';
        if (userDisplayName) userDisplayName.textContent = displayName.split('/')[0] || 'User';
        if (userWelcomeName) userWelcomeName.textContent = displayName.split('/')[0] || 'User';
    }

    // Initialize sidebar and navigation
    initializeSidebar();
    initializeNavigation();
    initializeLogout();
    initializeQuickAccess();
    initializeProfileForm();
    initializeSettingsForm();
});

// Initialize Sidebar Toggle
function initializeSidebar() {
    const hamburger = document.getElementById('hamburgerToggle');
    const sidebar = document.getElementById('sidebar');

    if (!hamburger || !sidebar) return;

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        sidebar.classList.toggle('hidden');
    });

    // Close sidebar on mobile when clicking outside
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !hamburger.contains(e.target)) {
                hamburger.classList.remove('active');
                sidebar.classList.add('hidden');
            }
        }
    });
}

// Initialize Navigation
function initializeNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn[data-page]');
    const contentPages = document.querySelectorAll('.content-page');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const page = button.getAttribute('data-page');
            
            // Update active button
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Update active page
            contentPages.forEach(page_el => page_el.style.display = 'none');
            const activePage = document.querySelector(`.content-page[data-page="${page}"]`);
            if (activePage) activePage.style.display = 'block';

            // Close sidebar on mobile
            if (window.innerWidth <= 768) {
                const sidebar = document.getElementById('sidebar');
                const hamburger = document.getElementById('hamburgerToggle');
                if (sidebar) sidebar.classList.add('hidden');
                if (hamburger) hamburger.classList.remove('active');
            }
        });
    });
}

// Initialize Logout
function initializeLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    const profileLogoutBtn = document.getElementById('profileLogoutBtn');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('ummah_user');
            localStorage.removeItem('ummah_profile');
            window.location.href = 'login.html';
        });
    }

    if (profileLogoutBtn) {
        profileLogoutBtn.addEventListener('click', () => {
            localStorage.removeItem('ummah_user');
            localStorage.removeItem('ummah_profile');
            window.location.href = 'login.html';
        });
    }
}

// Initialize Quick Access Navigation
function initializeQuickAccess() {
    const quickBtns = document.querySelectorAll('.quick-btn[data-nav]');
    const navButtons = document.querySelectorAll('.nav-btn[data-page]');
    const contentPages = document.querySelectorAll('.content-page');

    quickBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.getAttribute('data-nav');
            
            // Find and click corresponding nav button
            const targetNavBtn = Array.from(navButtons).find(nb => nb.getAttribute('data-page') === page);
            if (targetNavBtn) {
                navButtons.forEach(nb => nb.classList.remove('active'));
                targetNavBtn.classList.add('active');

                contentPages.forEach(p => p.style.display = 'none');
                const activePage = document.querySelector(`.content-page[data-page="${page}"]`);
                if (activePage) activePage.style.display = 'block';

                // Close sidebar on mobile
                if (window.innerWidth <= 768) {
                    const sidebar = document.getElementById('sidebar');
                    const hamburger = document.getElementById('hamburgerToggle');
                    if (sidebar) sidebar.classList.add('hidden');
                    if (hamburger) hamburger.classList.remove('active');
                }
            }
        });
    });
}

// Initialize Profile Form
function initializeProfileForm() {
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', () => {
            const profileName = document.getElementById('profileName').value;
            const profileBio = document.getElementById('profileBio').value;

            if (!profileName.trim()) {
                alert('Please enter your name');
                return;
            }

            const profile = {
                name: profileName,
                bio: profileBio,
                admission: JSON.parse(localStorage.getItem('ummah_user')).admission || '',
                updatedAt: new Date().toISOString()
            };

            localStorage.setItem('ummah_profile', JSON.stringify(profile));
            
            // Update header
            const userDisplayName = document.getElementById('userDisplayName');
            if (userDisplayName) userDisplayName.textContent = profileName.split(' ')[0];

            alert('Profile updated successfully!');
        });
    }
}

// Initialize Settings Form
function initializeSettingsForm() {
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', () => {
            const email = document.getElementById('settingsEmail').value;
            const theme = document.getElementById('themeSelect').value;

            if (!email.trim()) {
                alert('Please enter your email');
                return;
            }

            // Validate email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Please enter a valid email');
                return;
            }

            const settings = {
                email: email,
                theme: theme,
                updatedAt: new Date().toISOString()
            };

            localStorage.setItem('ummah_settings', JSON.stringify(settings));
            alert('Settings updated successfully!');
        });
    }

    // Load existing settings
    const settingsEmail = document.getElementById('settingsEmail');
    const themeSelect = document.getElementById('themeSelect');
    
    try {
        const settings = JSON.parse(localStorage.getItem('ummah_settings'));
        if (settings) {
            if (settingsEmail) settingsEmail.value = settings.email || '';
            if (themeSelect) themeSelect.value = settings.theme || 'green';
        }
    } catch (e) {
        // Default values
    }
}

// Handle window resize for responsive sidebar
window.addEventListener('resize', () => {
    const sidebar = document.getElementById('sidebar');
    const hamburger = document.getElementById('hamburgerToggle');
    
    if (window.innerWidth > 768) {
        if (sidebar) sidebar.classList.remove('hidden');
        if (hamburger) hamburger.classList.remove('active');
    }
});
