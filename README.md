# OS/3 WebWarp — Codename Morgana

> A faithful OS/2 Warp 4 desktop experience running entirely in the browser.  
> Vanilla HTML · CSS · JavaScript · PHP — no frameworks, no dependencies.

![OS/3 WebWarp Morgana](https://img.shields.io/badge/OS%2F3-WebWarp%20Morgana-teal?style=flat-square)
![Phase](https://img.shields.io/badge/Phase-5%2F5%20Complete-brightgreen?style=flat-square)
![Lines of Code](https://img.shields.io/badge/Lines%20of%20Code-4%2C445-blue?style=flat-square)
![Files](https://img.shields.io/badge/Files-30-blue?style=flat-square)

---

## Features

### 🖥️ Desktop Shell (Phase 1)
- WarpCenter taskbar with live clock and CPU pulse meter
- Draggable, resizable windows with minimize / maximize / restore
- 9 folder windows (Programs, Productivity, Internet, Multimedia, Games, System Setup, AI Suite, Information, Startup)
- System context menu (right-click on desktop)
- Full OS/2 Warp 4 visual theme — 3D borders, teal desktop, bitmap-style fonts

### 🔐 Authentication (Phase 2)
- Login and registration dialog styled as an OS/2 system prompt
- PHP session-based auth with bcrypt password hashing
- Per-user JSON storage in `data/users/{username}/` (no SQL database)
- Auth guard on `index.html` — redirects unauthenticated users to `login.html`
- Atomic file writes with `flock()` to prevent corruption

### 📦 Productivity Apps (Phase 3)
| App | Description |
|---|---|
| 📝 Text Editor | Toolbar with **New**, **Save**, **Word Wrap**, **Copy All** · Courier New · status bar (line/col/chars/words) · Tab → 2 spaces · localStorage persistence |
| 🧮 Calculator | 4 operations + % + ± · Memory (MC/MR/M+/M−) · keyboard input (0–9, +−*/., Enter, Esc, Backspace) |
| 📌 Sticky Notes | Draggable notes on desktop · 5 colors · editable text · localStorage persistence |
| 📊 Kanban Board | 3 columns (To Do / In Progress / Done) · drag & drop · add/delete cards · export .txt · localStorage |

### 🤖 AI & Integrations (Phase 4)
| App | Description |
|---|---|
| 🤖 VoiceType AI Chat | GPT-4o / GPT-4o-mini / GPT-3.5 · conversation history · OS/2-style chat bubbles · localStorage |
| ✨ Image Generator | DALL-E 3 / DALL-E 2 · size selector · inline preview · download PNG |
| 🐙 GitHub Viewer | Browse any public repo · file tree with icons · file/image preview · auto-loads README |
| ▶️ YouTube Player | Paste URL or video ID · embedded player · last 10 videos history |
| 🔑 API Keys | Save OpenAI key to user profile · toggle visibility · encrypted server-side storage |

### 🌐 Internet (Phase 5)
| App | Description |
|---|---|
| 🌍 WebExplorer | iframe browser · address bar · back/forward/refresh · bookmarks (Wikipedia, Archive.org, OpenStreetMap, DuckDuckGo) · blocked-page fallback with "Open in New Tab" |
| 📧 Mail Client | 3-panel layout · Inbox, Sent, Drafts, Trash · compose, reply, delete · localStorage persistence · pre-seeded welcome message |
| 📁 File Manager | Upload/download/delete files via PHP backend · per-user server storage · graceful offline fallback |

### 🎵 Multimedia (Phase 5)
| App | Description |
|---|---|
| 🎵 Audio Player | Dark-themed player · playlist · URL or local file load · play/pause/stop/prev/next · seek bar · volume |
| 🎬 Video Player | HTML5 video · URL or local file · seek bar · volume · fullscreen |
| 💿 CD Player | Retro skeuomorphic UI · spinning disc drawn on canvas with rainbow gradient · digital time display · eject to load file |

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5 · CSS3 · JavaScript (Vanilla ES6+) |
| Backend | PHP 8+ (no framework) |
| Storage | JSON files in `data/users/` (no SQL) |
| Auth | PHP sessions + `password_hash()` (bcrypt) |
| AI | OpenAI API — GPT + DALL-E via PHP proxy |

---

## File Structure

```
os_3_morgana/
├── index.html                  # Desktop shell (auth-guarded)
├── login.html                  # Login / register dialog
├── css/
│   └── style.css               # OS/2 Warp 4 theme
├── js/
│   ├── desktop.js              # Window manager, taskbar, drag, clock
│   └── apps/
│       ├── editor.js           # Text Editor
│       ├── calculator.js       # Calculator
│       ├── stickynotes.js      # Sticky Notes
│       ├── kanban.js           # Kanban Board
│       ├── aichat.js           # VoiceType AI Chat
│       ├── imagegen.js         # Image Generator (DALL-E)
│       ├── github.js           # GitHub Viewer
│       ├── youtube.js          # YouTube Player
│       ├── apikeys.js          # API Keys settings
│       ├── webbrowser.js       # WebExplorer (iframe browser)
│       ├── mailclient.js       # Mail Client
│       ├── ftpclient.js        # File Manager
│       ├── audioplayer.js      # Audio Player
│       ├── videoplayer.js      # Video Player
│       └── cdplayer.js         # CD Player
├── backend/
│   ├── config.php              # App configuration
│   ├── auth.php                # Login / logout / register / check API
│   ├── me.php                  # Session verification endpoint
│   ├── files.php               # File Manager — list/upload/download/delete
│   ├── lib/
│   │   ├── storage.php         # Atomic JSON read/write (flock)
│   │   └── users.php           # User CRUD helpers
│   └── ai/
│       ├── chat.php            # OpenAI chat completions proxy
│       ├── image.php           # OpenAI image generation proxy
│       └── apikey.php          # API key save/load per user
└── data/
    ├── .htaccess               # Block direct HTTP access to data/
    └── users/                  # Per-user JSON profile + file storage
```

**Total: 30 files · 4,445 lines of code**

---

## Setup

### Requirements
- PHP 8.0+
- Web server with PHP support (Apache, Nginx, or local via `php -S`)
- OpenAI API key (optional — only needed for Phase 4 AI apps)

### 1. Clone the repo
```bash
git clone https://github.com/MisterCoder74/os_3_morgana.git
cd os_3_morgana
```

### 2. Set permissions
```bash
chmod 755 data/
chmod 755 data/users/
```

### 3. Run locally
```bash
php -S localhost:8080
```
Then open `http://localhost:8080` in your browser.

### 4. First launch
- You'll be redirected to the login screen
- Click **Register** to create an account
- Log in to enter the desktop

### 5. Enable AI apps (optional)
1. Double-click **System Setup → API Keys** on the desktop
2. Paste your OpenAI key (`sk-…`) and click **Save**
3. Open **AI Suite → VoiceType Chat** or **Image Generator**

---

## Development Roadmap

| Phase | Contents | Status |
|---|---|---|
| 1 — Shell | WarpCenter, desktop, window manager, drag/resize, clock | ✅ Done |
| 2 — Auth | Login, registration, PHP sessions, JSON user storage | ✅ Done |
| 3 — Apps | Text Editor, Calculator, Sticky Notes, Kanban Board | ✅ Done |
| 4 — AI & Integrations | GPT Chat, DALL-E, GitHub Viewer, YouTube Player | ✅ Done |
| 5 — Internet & Multimedia | WebExplorer, Mail Client, File Manager, Audio Player, Video Player, CD Player | ✅ Done |

---

## Credits

Built by **Alessandro Demontis** / [Vivacity Design](https://vivacitydesign.it) · Rome, Italy  
Generated and developed with **SureThing AI** · May 2026
