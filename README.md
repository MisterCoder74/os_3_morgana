# OS/3 WebWarp — Codename Morgana

> A faithful web recreation of IBM OS/2 Warp 4 "Merlin" (1996)

## Overview

OS/3 WebWarp is a SaaS-style web desktop inspired by the iconic OS/2 Warp 4 Workplace Shell.
Every element replicates the original 3D-raised-border aesthetic, WarpCenter taskbar, and
folder-based app structure.

## Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | HTML · CSS · JavaScript (Vanilla)   |
| Backend  | PHP (no framework)                  |
| Storage  | JSON files (no SQL database)        |
| AI       | OpenAI API (via PHP proxy)          |
| Deploy   | GitHub API                          |

## File Structure

```
os_3_morgana/
├── index.html          ← Desktop shell entry point
├── css/
│   └── style.css       ← OS/2 Warp 4 theme
├── js/
│   └── desktop.js      ← WPS window manager
├── backend/            ← PHP API (Phase 2)
├── data/               ← JSON storage (Phase 2)
└── images/             ← Assets
```

## Roadmap

| Phase | Content                                              | Status |
|-------|------------------------------------------------------|--------|
| 1     | Shell: WarpCenter, desktop icons, window system      | ✅ Done |
| 2     | Auth: PHP login, session, multi-user JSON storage    | ⏳ Next |
| 3     | Apps: editor, calculator, sticky notes, kanban       | 🔜 Soon |
| 4     | AI & Integrations: OpenAI, GitHub, YouTube           | 🔜 Soon |

## Credits

Developed by **Alessandro Demontis** — [Vivacity Design](https://www.vivacitydesign.net/)
Inspired by IBM OS/2 Warp 4 "Merlin" (1996)