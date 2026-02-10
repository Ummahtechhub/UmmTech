import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { getDatabase, ref as dbRef, push as dbPush, get as dbGet } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-database.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-storage.js";
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, query, orderBy, doc, getDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app, `gs://${firebaseConfig.storageBucket}`);
const db = getFirestore(app);
const rtdb = getDatabase(app);

const ADMIN_EMAILS = ["admin@ummah.ac.ke", "admin@ummah.edu"];
let currentUser = null;

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }
    const isAdmin = ADMIN_EMAILS.includes(user.email?.toLowerCase() || "");
    if (!isAdmin) {
        alert("Access denied. Admin privileges required.");
        window.location.href = "login.html";
        return;
    }
    currentUser = user;
    updateStats();
});

const contentPages = document.querySelectorAll(".content-page");
const hamburgerToggle = document.getElementById("hamburgerToggle");
const mainContent = document.getElementById("mainContent");

if (hamburgerToggle && mainContent) {
    hamburgerToggle.addEventListener("click", () => {
        mainContent.classList.toggle("hidden");
        hamburgerToggle.classList.toggle("active");
        if (window.innerWidth <= 1024) {
            document.body.classList.toggle("sidebar-open", !mainContent.classList.contains("hidden"));
        }
    });
}

async function logout() {
    try {
        await signOut(auth);
    } catch (e) {
        // ignore
    }
    localStorage.removeItem("ummah_user");
    window.location.href = "login.html";
}

function showPage(pageId) {
    document.querySelectorAll(".nav-btn").forEach((btn) => {
        btn.classList.remove("active");
    });
    const activeNavBtn = document.querySelector(`.nav-btn[data-page="${pageId}"]`);
    if (activeNavBtn) activeNavBtn.classList.add("active");

    contentPages.forEach((page) => {
        page.classList.remove("active");
    });
    const targetPage = document.querySelector(`.content-page[data-page="${pageId}"]`);
    if (targetPage) {
        targetPage.classList.add("active");
        targetPage.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    if (window.innerWidth <= 1024 && mainContent) {
        mainContent.classList.add("hidden");
        if (hamburgerToggle) hamburgerToggle.classList.remove("active");
        document.body.classList.remove("sidebar-open");
    }

    if (pageId === "manage-content") {
        loadContent();
    }

    if (pageId === "repository-highlights") {
        loadRepoHighlights();
    }
}

document.addEventListener("click", (e) => {
    const navBtn = e.target.closest(".nav-btn[data-page], .btn[data-page]");
    if (!navBtn) return;
    const pageId = navBtn.getAttribute("data-page");
    if (pageId) showPage(pageId);
});

document.querySelectorAll(".logout-btn").forEach((btn) => {
    btn.addEventListener("click", logout);
});

window.addEventListener("resize", () => {
    if (window.innerWidth > 1024) {
        document.body.classList.remove("sidebar-open");
    }
});

const MAX_UPLOAD_BYTES = 1 * 1024 * 1024;
const IMAGE_QUALITY_START = 0.75;
const IMAGE_MIN_QUALITY = 0.3;
const IMAGE_MAX_WIDTH = 1600;
const IMAGE_SCALE_STEP = 0.85;
const IMAGE_MAX_ATTEMPTS = 15;
const RTDB_MAX_STRING = 1_000_000; // ~1MB string cap
const IMAGE_RTDB_MAX_BYTES = 680 * 1024; // keep base64 safely under ~1MB
const VIDEO_THUMB_MAX_BYTES = 200 * 1024;

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Failed to read image file."));
        reader.readAsDataURL(file);
    });
}

async function getImageSource(file) {
    if ("createImageBitmap" in window) {
        const bitmap = await createImageBitmap(file);
        return {
            width: bitmap.width,
            height: bitmap.height,
            draw: (ctx, w, h) => ctx.drawImage(bitmap, 0, 0, w, h)
        };
    }

    const dataUrl = await readFileAsDataURL(file);
    const img = new Image();
    img.src = dataUrl;
    await new Promise((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image."));
    });

    return {
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        draw: (ctx, w, h) => ctx.drawImage(img, 0, 0, w, h)
    };
}

async function canvasToBlob(canvas, quality) {
    let blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (blob) return blob;
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    const resp = await fetch(dataUrl);
    return resp.blob();
}

async function compressImageToLimit(file, maxBytes) {
    if (!file.type.startsWith("image/")) return file;

    const source = await getImageSource(file);
    let width = source.width;
    let height = source.height;
    const maxWidth = IMAGE_MAX_WIDTH;
    if (width > maxWidth) {
        const ratio = maxWidth / width;
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    source.draw(ctx, width, height);

    let quality = IMAGE_QUALITY_START;
    let blob = await canvasToBlob(canvas, quality);

    while (blob && blob.size > maxBytes && quality > IMAGE_MIN_QUALITY) {
        quality -= 0.1;
        blob = await canvasToBlob(canvas, quality);
    }

    if (!blob || blob.size > maxBytes) {
        throw new Error("Image is too large even after compression.");
    }

    return new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), { type: "image/jpeg" });
}

function dataUrlSizeBytes(dataUrl) {
    if (!dataUrl) return 0;
    const base64 = dataUrl.split(",")[1] || "";
    return Math.ceil((base64.length * 3) / 4);
}

async function compressImageToDataUrl(file, maxBytes) {
    const source = await getImageSource(file);
    let width = source.width;
    let height = source.height;
    const maxWidth = IMAGE_MAX_WIDTH;
    if (width > maxWidth) {
        const ratio = maxWidth / width;
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    let quality = IMAGE_QUALITY_START;
    let scale = 1;
    let dataUrl = "";

    for (let i = 0; i < IMAGE_MAX_ATTEMPTS; i += 1) {
        canvas.width = Math.max(1, Math.round(width * scale));
        canvas.height = Math.max(1, Math.round(height * scale));
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        source.draw(ctx, canvas.width, canvas.height);
        dataUrl = canvas.toDataURL("image/jpeg", quality);

        if (dataUrlSizeBytes(dataUrl) <= maxBytes) {
            return dataUrl;
        }

        if (quality > IMAGE_MIN_QUALITY) {
            quality = Math.max(IMAGE_MIN_QUALITY, quality - 0.1);
        } else {
            scale *= IMAGE_SCALE_STEP;
        }
    }

    throw new Error("Image is too large to fit within 1MB base64 limit.");
}

async function videoToThumbnailDataUrl(file, maxBytes) {
    return new Promise((resolve, reject) => {
        const video = document.createElement("video");
        const url = URL.createObjectURL(file);
        let cleaned = false;

        const cleanup = () => {
            if (cleaned) return;
            cleaned = true;
            URL.revokeObjectURL(url);
        };

        video.preload = "metadata";
        video.src = url;
        video.muted = true;
        video.playsInline = true;

        video.addEventListener("error", () => {
            cleanup();
            reject(new Error("Failed to read video for thumbnail."));
        });

        video.addEventListener("loadeddata", async () => {
            try {
                video.currentTime = 0.1;
            } catch (e) {
                video.currentTime = 0;
            }
        });

        video.addEventListener("seeked", () => {
            const canvas = document.createElement("canvas");
            const maxWidth = 640;
            let width = video.videoWidth || 640;
            let height = video.videoHeight || 360;
            if (width > maxWidth) {
                const ratio = maxWidth / width;
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }
            canvas.width = Math.max(1, width);
            canvas.height = Math.max(1, height);
            const ctx = canvas.getContext("2d");
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            let quality = 0.75;
            let dataUrl = canvas.toDataURL("image/jpeg", quality);
            let scale = 1;
            let attempts = 0;
            while (dataUrlSizeBytes(dataUrl) > maxBytes && attempts < 8) {
                if (quality > 0.4) {
                    quality -= 0.1;
                } else {
                    scale *= 0.85;
                    canvas.width = Math.max(1, Math.round(width * scale));
                    canvas.height = Math.max(1, Math.round(height * scale));
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                }
                dataUrl = canvas.toDataURL("image/jpeg", quality);
                attempts += 1;
            }

            cleanup();
            resolve(dataUrl);
        });
    });
}

async function uploadFiles(files, category, story, type) {
    const uploadPromises = Array.from(files).map(async (file) => {
        let processedFile = file;
        let compressedDataUrl = "";
        let thumbnailDataUrl = "";
        let downloadURL = "";
        let storagePath = "";

        if (type === "images" && file.type.startsWith("image/")) {
            processedFile = await compressImageToLimit(file, MAX_UPLOAD_BYTES);
            compressedDataUrl = await compressImageToDataUrl(processedFile, IMAGE_RTDB_MAX_BYTES);
        } else if (file.size > MAX_UPLOAD_BYTES) {
            throw new Error(`File "${file.name}" exceeds 1MB. Please upload smaller files.`);
        }

        if (type === "videos" && file.type.startsWith("video/")) {
            try {
                thumbnailDataUrl = await videoToThumbnailDataUrl(file, VIDEO_THUMB_MAX_BYTES);
            } catch (e) {
                thumbnailDataUrl = "";
            }
        }

        const timestamp = Date.now();
        const fileName = `${timestamp}_${processedFile.name}`;
        storagePath = `${type}/${fileName}`;

        try {
            const storageRef = ref(storage, storagePath);
            const snapshot = await uploadBytes(storageRef, processedFile);
            downloadURL = await getDownloadURL(snapshot.ref);
        } catch (error) {
            if (type === "images" && compressedDataUrl) {
                downloadURL = "";
            } else {
                throw error;
            }
        }

        const docData = {
            fileName: processedFile.name,
            fileURL: downloadURL,
            storagePath: storagePath,
            category: category,
            description: story,
            uploadedBy: currentUser?.email || "unknown",
            uploadedAt: serverTimestamp(),
            likes: 0,
            shares: 0,
            comments: [],
            type: type,
            compressedURL: ""
        };

        await addDoc(collection(db, type), docData);
        await dbPush(dbRef(rtdb, `uploads/${type}`), {
            fileName: processedFile.name,
            fileURL: downloadURL,
            storagePath: storagePath,
            category: category,
            description: story,
            uploadedBy: currentUser?.email || "unknown",
            uploadedAt: Date.now(),
            type: type,
            compressedURL: compressedDataUrl || "",
            thumbnailURL: thumbnailDataUrl || ""
        });

        saveLocalContent(type, processedFile, category, story, downloadURL);
        return downloadURL;
    });

    return Promise.all(uploadPromises);
}

function saveLocalContent(type, file, category, story, downloadURL) {
    const keyMap = {
        images: "ummah_images",
        videos: "ummah_videos",
        files: "ummah_files"
    };

    const storageKey = keyMap[type];
    if (!storageKey) return;

    const item = {
        id: Date.now(),
        title: file.name,
        description: story || "",
        category: category || "General",
        createdDate: new Date().toLocaleDateString(),
        url: downloadURL,
        fileURL: downloadURL,
        filename: file.name,
        fileName: file.name,
        size: file.size || 0
    };

    const existing = JSON.parse(localStorage.getItem(storageKey) || "[]");
    existing.unshift(item);
    localStorage.setItem(storageKey, JSON.stringify(existing));
}

async function updateStats() {
    try {
        const collections = ["images", "videos", "files"];
        let totalImages = 0, totalVideos = 0, totalFiles = 0;

        for (const collectionName of collections) {
            const q = query(collection(db, collectionName));
            const querySnapshot = await getDocs(q);
            const count = querySnapshot.size;
            if (collectionName === "images") totalImages = count;
            else if (collectionName === "videos") totalVideos = count;
            else if (collectionName === "files") totalFiles = count;
        }

        const totalImagesEl = document.getElementById("totalImages");
        const totalVideosEl = document.getElementById("totalVideos");
        const totalFilesEl = document.getElementById("totalFiles");
        const totalUsersEl = document.getElementById("totalUsers");
        if (totalImagesEl) totalImagesEl.textContent = totalImages;
        if (totalVideosEl) totalVideosEl.textContent = totalVideos;
        if (totalFilesEl) totalFilesEl.textContent = totalFiles;
        if (totalUsersEl) totalUsersEl.textContent = "1";
    } catch (error) {
        console.error("Error updating stats:", error);
    }
}

const imageForm = document.getElementById("imageUploadForm");
if (imageForm) imageForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const category = document.getElementById("image-category").value;
    const story = document.getElementById("image-story").value;
    const files = document.getElementById("image-file").files;

    if (!category || !files.length) {
        alert("Please select a category and choose files.");
        return;
    }

    try {
        await uploadFiles(files, category, story, "images");
        alert("Images uploaded successfully!");
        document.getElementById("image-category").value = "";
        document.getElementById("image-story").value = "";
        document.getElementById("image-file").value = "";
        updateStats();
    } catch (error) {
        console.error("Upload failed:", error);
        alert("Upload failed. Please try again. Error: " + error.message);
    }
});

const videoForm = document.getElementById("videoUploadForm");
if (videoForm) videoForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const category = document.getElementById("video-category").value;
    const story = document.getElementById("video-story").value;
    const files = document.getElementById("video-file").files;

    if (!category || !files.length) {
        alert("Please select a category and choose files.");
        return;
    }

    try {
        await uploadFiles(files, category, story, "videos");
        alert("Videos uploaded successfully!");
        document.getElementById("video-category").value = "";
        document.getElementById("video-story").value = "";
        document.getElementById("video-file").value = "";
        updateStats();
    } catch (error) {
        console.error("Upload failed:", error);
        alert("Upload failed. Please try again. Error: " + error.message);
    }
});

const fileForm = document.getElementById("fileUploadForm");
if (fileForm) fileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const category = document.getElementById("file-category").value;
    const story = document.getElementById("file-story").value;
    const files = document.getElementById("file-upload").files;

    if (!category || !files.length) {
        alert("Please select a category and choose files.");
        return;
    }

    try {
        await uploadFiles(files, category, story, "files");
        alert("Files uploaded successfully!");
        document.getElementById("file-category").value = "";
        document.getElementById("file-story").value = "";
        document.getElementById("file-upload").value = "";
        updateStats();
    } catch (error) {
        console.error("Upload failed:", error);
        alert("Upload failed. Please try again. Error: " + error.message);
    }
});

const settingsForm = document.getElementById("settingsForm");
if (settingsForm) settingsForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const actingProject = document.getElementById("acting-project").value;
    const teamMembers = document.getElementById("team-members").value;
    const upcomingEvents = document.getElementById("upcoming-events").value;
    const innovations = document.getElementById("innovations").value;

    try {
        await addDoc(collection(db, "settings"), {
            actingProject: actingProject,
            teamMembers: teamMembers,
            upcomingEvents: upcomingEvents,
            innovations: innovations,
            updatedAt: serverTimestamp()
        });
        alert("Settings saved successfully!");
    } catch (error) {
        console.error("Error saving settings:", error);
        alert("Failed to save settings. Please try again.");
    }
});

let repoHighlightEditId = null;

const repoHighlightsForm = document.getElementById("repoHighlightsForm");
const repoHighlightReset = document.getElementById("repoHighlightReset");

function resetRepoHighlightForm() {
    repoHighlightEditId = null;
    if (repoHighlightsForm) repoHighlightsForm.reset();
}

async function loadRepoHighlights() {
    try {
        const highlightsQuery = query(collection(db, "repositoryHighlights"), orderBy("order", "asc"));
        const snapshot = await getDocs(highlightsQuery);
        const highlights = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
        if (highlights.length) {
            const latest = highlights[0];
            repoHighlightEditId = latest.id || null;
        }
    } catch (error) {
        console.error("Failed to load repository highlights:", error);
    }
}

if (repoHighlightsForm) {
    repoHighlightsForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const title = document.getElementById("repoHighlightTitle")?.value.trim() || "";
        const description = document.getElementById("repoHighlightDescription")?.value.trim() || "";
        const imageUrl = document.getElementById("repoHighlightImage")?.value.trim() || "";
        const linkUrl = document.getElementById("repoHighlightLink")?.value.trim() || "";
        const orderValue = document.getElementById("repoHighlightOrder")?.value.trim() || "";
        const order = orderValue ? parseInt(orderValue, 10) : null;

        if (!title || !description || !imageUrl || !linkUrl) {
            alert("Please fill in all required fields.");
            return;
        }

        const payload = {
            title,
            description,
            imageUrl,
            linkUrl,
            order: Number.isFinite(order) ? order : 9999,
            updatedAt: serverTimestamp()
        };

        try {
            if (repoHighlightEditId) {
                await updateDoc(doc(db, "repositoryHighlights", repoHighlightEditId), payload);
            } else {
                await addDoc(collection(db, "repositoryHighlights"), {
                    ...payload,
                    createdAt: serverTimestamp()
                });
            }

            resetRepoHighlightForm();
        } catch (error) {
            alert("Failed to save highlight.");
        }
    });
}

if (repoHighlightReset) {
    repoHighlightReset.addEventListener("click", resetRepoHighlightForm);
}

async function loadContent() {
    const contentGrid = document.getElementById("contentGrid");
    if (!contentGrid) return;
    contentGrid.innerHTML = "<p>Loading content...</p>";

    const allContent = [];

    try {
        const collections = ["images", "videos", "files", "posts", "events", "projects", "teams", "settings"];
        for (const collectionName of collections) {
            let q;
            if (collectionName === "settings") {
                q = query(collection(db, collectionName), orderBy("updatedAt", "desc"));
            } else if (collectionName === "events" || collectionName === "projects" || collectionName === "teams") {
                q = query(collection(db, collectionName), orderBy("createdAt", "desc"));
            } else {
                q = query(collection(db, collectionName), orderBy("uploadedAt", "desc"));
            }
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                allContent.push({
                    id: docSnap.id,
                    ...data,
                    collection: collectionName,
                    source: "firestore"
                });
            });
        }
    } catch (error) {
        console.error("Error loading Firestore content:", error);
    }

    try {
        const uploadsRef = dbRef(rtdb, "uploads");
        const snapshot = await dbGet(uploadsRef);
        if (snapshot.exists()) {
            const uploads = snapshot.val() || {};
            Object.keys(uploads).forEach((type) => {
                const items = uploads[type] || {};
                Object.keys(items).forEach((key) => {
                    const data = items[key];
                    allContent.push({
                        id: key,
                        ...data,
                        collection: type,
                        source: "realtime"
                    });
                });
            });
        }
    } catch (error) {
        console.error("Error loading Realtime content:", error);
    }

    contentGrid.innerHTML = "";

    if (allContent.length === 0) {
        contentGrid.innerHTML = "<p>No content uploaded yet.</p>";
        return;
    }

    allContent.sort((a, b) => {
        const dateA = a.uploadedAt?.seconds ? a.uploadedAt.seconds * 1000 : Date.parse(a.createdAt || "") || 0;
        const dateB = b.uploadedAt?.seconds ? b.uploadedAt.seconds * 1000 : Date.parse(a.createdAt || "") || 0;
        return dateB - dateA;
    });

    allContent.forEach((item) => {
        const contentItem = createContentItem(item);
        contentGrid.appendChild(contentItem);
    });
}

function createContentItem(item) {
    const itemDiv = document.createElement("div");
    itemDiv.className = "content-item";

    let mediaElement = "";
    if (item.collection === "images" || item.type === "image") {
        mediaElement = `<img src="${item.compressedURL || item.fileURL || item.url}" alt="${item.fileName || item.title}" class="content-media">`;
    } else if (item.collection === "videos" || item.type === "video") {
        const poster = item.thumbnailURL ? ` poster="${item.thumbnailURL}"` : "";
        mediaElement = `<video src="${item.fileURL || item.url}" class="content-media" controls${poster}></video>`;
    } else {
        mediaElement = `<div class="content-media" style="display: flex; align-items: center; justify-content: center; background: rgba(46, 139, 87, 0.1);">
            <i class="fas fa-file-alt" style="font-size: 48px; color: rgba(46, 139, 87, 0.6);"></i>
        </div>`;
    }

    const title = item.title || item.fileName || item.name || (item.collection || item.type || "Content");
    const description = item.description || item.desc || item.story || "No description";
    const dateText = item.uploadedAt?.seconds
        ? new Date(item.uploadedAt.seconds * 1000).toLocaleDateString()
        : item.updatedAt?.seconds
            ? new Date(item.updatedAt.seconds * 1000).toLocaleDateString()
            : item.createdAt?.seconds
                ? new Date(item.createdAt.seconds * 1000).toLocaleDateString()
                : (item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-");
    const sourceBadge = item.source === "local" ? "Local" : (item.source === "realtime" ? "Realtime DB" : "Firestore");
    const typeBadge = item.collection || item.type || "content";

    itemDiv.innerHTML = `
        ${mediaElement}
        <div class="content-info">
            <div class="content-description"><strong>${title}</strong></div>
            <div class="content-description">${description}</div>
            <div class="content-meta">
                <span>${item.uploadedBy ? `Uploaded by ${item.uploadedBy}` : sourceBadge}</span>
                <span>${dateText}</span>
            </div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px;">
                <span class="badge badge-green">${typeBadge}</span>
                <span class="badge badge-blue">${sourceBadge}</span>
                ${item.meta ? `<span class="badge badge-purple">${item.meta}</span>` : ""}
            </div>
            <div class="content-actions">
                <div style="color: var(--text-secondary); font-size: 12px;">List only (no approvals/actions)</div>
            </div>
        </div>
    `;

    return itemDiv;
}
