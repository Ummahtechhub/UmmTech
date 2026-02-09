// ============================================
// FIREBASE FIRESTORE COLLECTIONS STRUCTURE
// For Ummah TechHub Application
// ============================================

/*
COLLECTIONS OVERVIEW:
1. users - User profiles and metadata
2. events - Events with media support
3. projects - Projects with media and progress tracking
4. teams - Teams with member lists
5. userProfiles - Extended user information
6. userSettings - User preferences and settings
7. media - Media metadata (images/videos)
*/

// ============================================
// 1. USERS COLLECTION
// ============================================
/*
Collection: users
Location: /users/{userId}
Purpose: User account information (auto-created by Firebase Auth)
*/

users/{userId}: {
  uid: string,                    // Firebase Auth UID (primary key)
  email: string,                  // User email
  admission: string,              // e.g., "BSCS/2024/12345"
  displayName: string,            // User full name
  photoURL: string (optional),    // Profile picture URL
  createdAt: timestamp,           // Account creation date
  lastLogin: timestamp,           // Last login timestamp
  status: string,                 // "active" | "inactive" | "suspended"
  role: string                    // "user" | "admin" | "moderator"
}

// Example:
{
  "uid": "user123abc",
  "email": "john@example.com",
  "admission": "BSCS/2024/12345",
  "displayName": "John Developer",
  "createdAt": "2026-01-15T10:30:00Z",
  "lastLogin": "2026-01-29T14:22:00Z",
  "status": "active",
  "role": "user"
}


// ============================================
// 2. USER PROFILES COLLECTION
// ============================================
/*
Collection: userProfiles
Location: /userProfiles/{userId}
Purpose: Extended user profile information
Relationship: One-to-one with users collection via uid
*/

userProfiles/{userId}: {
  userId: string,                 // Reference to users collection
  name: string,                   // Full name
  bio: string,                    // User biography
  phone: string,                  // Contact phone
  department: string,             // University department
  semester: number,               // Current semester
  skills: array,                  // ["JavaScript", "React", "Node.js", ...]
  interests: array,               // ["Web Dev", "AI", "Mobile", ...]
  socialLinks: {
    github: string,
    linkedin: string,
    twitter: string,
    portfolio: string
  },
  profileImage: string,           // URL to profile image
  backgroundImage: string,        // URL to background image
  joinedTeams: array,             // [teamId1, teamId2, ...]
  createdProjects: array,         // [projectId1, projectId2, ...]
  registeredEvents: array,        // [eventId1, eventId2, ...]
  updatedAt: timestamp
}

// Example:
{
  "userId": "user123abc",
  "name": "John Developer",
  "bio": "Full-stack developer passionate about open source",
  "phone": "+1234567890",
  "department": "Computer Science",
  "semester": 4,
  "skills": ["JavaScript", "React", "Node.js", "MongoDB"],
  "interests": ["Web Development", "AI", "Open Source"],
  "socialLinks": {
    "github": "https://github.com/johndeveloper",
    "linkedin": "https://linkedin.com/in/johndeveloper",
    "twitter": "https://twitter.com/johndeveloper",
    "portfolio": "https://johndeveloper.dev"
  },
  "joinedTeams": ["team001", "team002"],
  "createdProjects": ["project001", "project003"],
  "registeredEvents": ["event001", "event002", "event005"],
  "updatedAt": "2026-01-29T14:22:00Z"
}


// ============================================
// 3. EVENTS COLLECTION
// ============================================
/*
Collection: events
Location: /events/{eventId}
Purpose: Store event information with media
Subcollections: media/{mediaId}
*/

events/{eventId}: {
  eventId: string,                // Unique event ID (document ID)
  createdBy: string,              // userId of event creator
  title: string,                  // Event name (required)
  description: string,            // Event description
  eventType: string,              // "Summit" | "Webinar" | "Meetup" | "Workshop"
  startDateTime: timestamp,       // Event start date/time
  endDateTime: timestamp,         // Event end date/time
  location: string,               // Event location (physical or "Online")
  registrationLimit: number,      // Max attendees (0 = unlimited)
  registeredUsers: array,         // [userId1, userId2, ...]
  mediaUrls: array,               // [{type: "image|video", url: "...", uploadedAt: ...}]
  thumbnail: string,              // URL to event thumbnail
  status: string,                 // "upcoming" | "ongoing" | "completed" | "cancelled"
  tags: array,                    // ["tech", "ai", "networking", ...]
  createdAt: timestamp,
  updatedAt: timestamp
}

// Example:
{
  "eventId": "event001",
  "createdBy": "user123abc",
  "title": "Web Development Summit 2026",
  "description": "Learn modern web development with industry experts",
  "eventType": "Summit",
  "startDateTime": "2026-02-15T10:00:00Z",
  "endDateTime": "2026-02-15T17:00:00Z",
  "location": "Online",
  "registrationLimit": 500,
  "registeredUsers": ["user001", "user002", "user003"],
  "mediaUrls": [
    {
      "type": "image",
      "url": "gs://umma-tech-hub-86eda.appspot.com/events/event001/poster.jpg",
      "uploadedAt": "2026-01-20T10:00:00Z"
    },
    {
      "type": "video",
      "url": "gs://umma-tech-hub-86eda.appspot.com/events/event001/teaser.mp4",
      "uploadedAt": "2026-01-21T10:00:00Z"
    }
  ],
  "thumbnail": "gs://umma-tech-hub-86eda.appspot.com/events/event001/thumb.jpg",
  "status": "upcoming",
  "tags": ["web-dev", "tech", "learning"],
  "createdAt": "2026-01-15T10:30:00Z",
  "updatedAt": "2026-01-28T15:00:00Z"
}


// ============================================
// 4. PROJECTS COLLECTION
// ============================================
/*
Collection: projects
Location: /projects/{projectId}
Purpose: Store project information with progress tracking
Subcollections: media/{mediaId}, collaborators/{userId}
*/

projects/{projectId}: {
  projectId: string,              // Unique project ID (document ID)
  createdBy: string,              // userId of project creator
  title: string,                  // Project name (required)
  description: string,            // Project description
  status: string,                 // "Active" | "Planning" | "Completed" | "On Hold"
  progress: number,               // 0-100 (percentage complete)
  startDate: timestamp,           // Project start date
  endDate: timestamp,             // Project end date
  priority: string,               // "Low" | "Medium" | "High" | "Critical"
  category: string,               // "Web" | "Mobile" | "AI" | "Data" | "Other"
  collaborators: array,           // [userId1, userId2, ...]
  mediaUrls: array,               // [{type: "image|video", url: "...", uploadedAt: ...}]
  thumbnail: string,              // URL to project thumbnail
  technologies: array,            // ["React", "Node.js", "MongoDB", ...]
  repositoryUrl: string,          // GitHub/GitLab repository link
  liveUrl: string,                // Live project URL (if deployed)
  tags: array,                    // ["full-stack", "open-source", ...]
  createdAt: timestamp,
  updatedAt: timestamp
}

// Example:
{
  "projectId": "project001",
  "createdBy": "user123abc",
  "title": "Mobile App Development",
  "description": "Cross-platform mobile application using React Native",
  "status": "Active",
  "progress": 65,
  "startDate": "2026-01-10T00:00:00Z",
  "endDate": "2026-03-31T00:00:00Z",
  "priority": "High",
  "category": "Mobile",
  "collaborators": ["user001", "user002"],
  "mediaUrls": [
    {
      "type": "image",
      "url": "gs://umma-tech-hub-86eda.appspot.com/projects/project001/screenshot1.png",
      "uploadedAt": "2026-01-15T10:00:00Z"
    }
  ],
  "thumbnail": "gs://umma-tech-hub-86eda.appspot.com/projects/project001/thumb.jpg",
  "technologies": ["React Native", "Firebase", "Node.js"],
  "repositoryUrl": "https://github.com/ummahtech/mobile-app",
  "liveUrl": "https://mobileapp.ummahtech.io",
  "tags": ["mobile", "cross-platform", "production"],
  "createdAt": "2026-01-10T10:30:00Z",
  "updatedAt": "2026-01-28T15:00:00Z"
}


// ============================================
// 5. TEAMS COLLECTION
// ============================================
/*
Collection: teams
Location: /teams/{teamId}
Purpose: Store team information (max 4 teams per user)
Subcollections: members/{userId}
*/

teams/{teamId}: {
  teamId: string,                 // Unique team ID (document ID)
  createdBy: string,              // userId of team creator
  name: string,                   // Team name (required)
  description: string,            // Team description
  teamLead: string,               // userId of team lead
  members: array,                 // [userId1, userId2, userId3, ...]
  memberCount: number,            // Current number of members
  profileImage: string,           // Team logo/image URL
  objective: string,              // Team's main objective
  skills: array,                  // ["Frontend", "Backend", "Design", ...]
  projectsWorkedOn: array,        // [projectId1, projectId2, ...]
  eventsParticipated: array,      // [eventId1, eventId2, ...]
  visibility: string,             // "public" | "private"
  createdAt: timestamp,
  updatedAt: timestamp
}

// Example:
{
  "teamId": "team001",
  "createdBy": "user123abc",
  "name": "Frontend Team",
  "description": "Specialized in building responsive web interfaces",
  "teamLead": "user123abc",
  "members": ["user001", "user002", "user003"],
  "memberCount": 3,
  "profileImage": "gs://umma-tech-hub-86eda.appspot.com/teams/team001/logo.jpg",
  "objective": "Create amazing user interfaces",
  "skills": ["React", "Vue.js", "CSS", "UI/UX"],
  "projectsWorkedOn": ["project001", "project002"],
  "eventsParticipated": ["event001", "event003"],
  "visibility": "public",
  "createdAt": "2026-01-10T10:30:00Z",
  "updatedAt": "2026-01-28T15:00:00Z"
}


// ============================================
// 6. USER SETTINGS COLLECTION
// ============================================
/*
Collection: userSettings
Location: /userSettings/{userId}
Purpose: Store user preferences and settings
Relationship: One-to-one with users collection via userId
*/

userSettings/{userId}: {
  userId: string,                 // Reference to users collection
  theme: string,                  // "light" | "dark" | "auto"
  email: string,                  // Primary email
  emailNotifications: {
    events: boolean,              // Notify about events
    projects: boolean,            // Notify about projects
    teams: boolean,               // Notify about teams
    messages: boolean,            // Notify about messages
    weekly: boolean               // Weekly digest
  },
  pushNotifications: boolean,     // Enable/disable push notifications
  privacy: {
    profileVisibility: string,    // "public" | "private" | "friends-only"
    showEmail: boolean,
    showPhone: boolean,
    allowDirectMessages: boolean
  },
  language: string,               // "en" | "ar" | "es" | ...
  timezone: string,               // "UTC" | "America/New_York" | ...
  updatedAt: timestamp
}

// Example:
{
  "userId": "user123abc",
  "theme": "dark",
  "email": "john@example.com",
  "emailNotifications": {
    "events": true,
    "projects": true,
    "teams": true,
    "messages": true,
    "weekly": false
  },
  "pushNotifications": true,
  "privacy": {
    "profileVisibility": "public",
    "showEmail": false,
    "showPhone": false,
    "allowDirectMessages": true
  },
  "language": "en",
  "timezone": "UTC",
  "updatedAt": "2026-01-29T14:22:00Z"
}


// ============================================
// 7. MEDIA COLLECTION
// ============================================
/*
Collection: media
Location: /media/{mediaId}
Purpose: Store metadata about uploaded media files
*/

media/{mediaId}: {
  mediaId: string,                // Unique media ID
  uploadedBy: string,             // userId who uploaded
  mediaType: string,              // "image" | "video" | "document"
  fileType: string,               // "jpg" | "png" | "mp4" | "pdf" | ...
  fileName: string,               // Original file name
  fileSize: number,               // File size in bytes
  storageUrl: string,             // Firebase Storage URL
  duration: number,               // Duration in seconds (for videos)
  width: number,                  // Image width in pixels
  height: number,                 // Image height in pixels
  tags: array,                    // ["thumbnail", "cover", ...]
  relatedTo: {
    collection: string,           // "events" | "projects" | "teams" | "profiles"
    documentId: string            // ID of related document
  },
  createdAt: timestamp,
  expiresAt: timestamp            // Optional expiration date
}

// Example:
{
  "mediaId": "media001",
  "uploadedBy": "user123abc",
  "mediaType": "image",
  "fileType": "jpg",
  "fileName": "event-poster.jpg",
  "fileSize": 2048576,
  "storageUrl": "gs://umma-tech-hub-86eda.appspot.com/events/event001/poster.jpg",
  "width": 1920,
  "height": 1080,
  "tags": ["poster", "cover"],
  "relatedTo": {
    "collection": "events",
    "documentId": "event001"
  },
  "createdAt": "2026-01-20T10:30:00Z"
}


// ============================================
// INDEXES RECOMMENDED FOR QUERIES
// ============================================

// Composite Indexes:
1. events: status + startDateTime (for filtering upcoming events)
2. projects: createdBy + updatedAt (for user projects timeline)
3. projects: status + progress (for project dashboard)
4. teams: createdBy + memberCount (for user teams)
5. userProfiles: skills (for filtering by skills)
6. events: eventType + status + startDateTime (for event discovery)

// Single Field Indexes:
- users: admission (for unique admission lookup)
- userProfiles: skills (array index)
- projects: collaborators (array index)
- teams: members (array index)
- events: registeredUsers (array index)


// ============================================
// LIMITS & CONSTRAINTS
// ============================================

Users: Unlimited
Teams per user: Maximum 4
Team members: Unlimited
Project collaborators: Unlimited
Event registrations: Based on registrationLimit field
Media file size: 100MB (Firebase Cloud Storage limit)
Firestore document size: 1MB maximum
Collection size: Unlimited


// ============================================
// BACKUP & ARCHIVAL STRATEGY
// ============================================

Archive Collections:
- archivedProjects: Completed/old projects
- archivedEvents: Past events
- archivedTeams: Deleted teams (soft delete)

Retention Policies:
- User data: Retained indefinitely (GDPR compliant deletion on request)
- Event records: Kept for 2 years
- Project history: Kept for 1 year
- Deleted team data: Kept in archive for 30 days before permanent deletion
