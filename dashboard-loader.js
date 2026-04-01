const DASHBOARD_SECTIONS = [
    { file: 'header.html', placeholderId: 'header-placeholder' },
    { file: 'sidebar.html', placeholderId: 'sidebar-placeholder' },
    { file: 'overview.html', placeholderId: 'overview-placeholder' },
    { file: 'feed.html', placeholderId: 'feed-placeholder' },
    { file: 'events.html', placeholderId: 'events-placeholder' },
    { file: 'projects.html', placeholderId: 'projects-placeholder' },
    { file: 'teams.html', placeholderId: 'teams-placeholder' },
    { file: 'repository.html', placeholderId: 'repository-placeholder' },
    { file: 'roadmap.html', placeholderId: 'roadmap-placeholder' },
    { file: 'profile.html', placeholderId: 'profile-placeholder' },
    { file: 'settings.html', placeholderId: 'settings-placeholder' },
    { file: 'footer.html', placeholderId: 'footer-placeholder' }
];

async function loadHTML(file, placeholderId) {
    const placeholder = document.getElementById(placeholderId);
    if (!placeholder) {
        return;
    }

    try {
        const response = await fetch(file);
        const html = await response.text();
        placeholder.innerHTML = html;
    } catch (error) {
        console.error(`Error loading ${file}:`, error);
    }
}

function getSectionsToLoad() {
    const excludedSections = new Set(
        (document.body.dataset.excludeSections || '')
            .split(',')
            .map((section) => section.trim())
            .filter(Boolean)
    );

    return DASHBOARD_SECTIONS.filter(({ placeholderId }) => !excludedSections.has(placeholderId));
}

function getExcludedPages() {
    return (document.body.dataset.excludeSections || '')
        .split(',')
        .map((section) => section.trim())
        .filter(Boolean)
        .map((section) => section.replace(/-placeholder$/, ''));
}

function pruneExcludedNavigation() {
    for (const page of getExcludedPages()) {
        document.querySelectorAll(`.nav-btn[data-page="${page}"]`).forEach((button) => {
            button.remove();
        });
    }
}

function loadDashboardScript() {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'home.js';
    script.onload = () => {
        if (window.initializeNavigation) {
            window.initializeNavigation();
        }

        window.setTimeout(() => {
            const defaultPage = document.body.dataset.defaultPage || 'feed';
            const defaultButton = document.querySelector(`.nav-btn[data-page="${defaultPage}"]`);
            if (defaultButton) {
                defaultButton.click();
            }
        }, 200);
    };

    document.body.appendChild(script);
}

async function loadDashboard() {
    for (const section of getSectionsToLoad()) {
        await loadHTML(section.file, section.placeholderId);
    }

    pruneExcludedNavigation();
    loadDashboardScript();
}

loadDashboard();
