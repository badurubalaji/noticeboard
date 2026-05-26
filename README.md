# 📋 NoticeBoard

**A digital signage platform you run on your own network.** Built for factories, warehouses, shops, and offices that want to put live information on TVs and tablets — production numbers, safety messages, KPIs, photos, announcements — without exposing anything to the public internet.

> 🔒 **Internal use only.** This app rejects connections that don't come from your local network. Don't put it behind a public URL.

| | |
|---|---|
| **Stack** | Angular 21 PWA · Node.js / Express · MongoDB · Socket.IO |
| **Runs on** | Windows 10/11, macOS, Linux |
| **Devices that consume it** | Any modern browser — Smart TVs, tablets, Fire TV / Chromecast, kiosks, phones |

---

## 🚀 One-click setup

There is **nothing to install first** — the setup scripts will install Node.js and MongoDB for you if they're missing.

### 🪟 Windows

Just **double-click `setup.cmd`**.

It uses **winget** (built into Windows 10 / 11) to install Node.js LTS and MongoDB Community when they aren't already there. Accept the UAC prompts. No restart needed.

### 🍎 macOS / 🐧 Linux

Open a terminal in this folder and run:

```bash
./setup.sh
```

- macOS: uses Homebrew (`brew install node`) when Node is missing.
- Linux: uses your distro's package manager (`apt`, `dnf`, `pacman`, or `zypper`).
- MongoDB install instructions are printed when it isn't running. Re-run setup after MongoDB is up.

### What setup does

1. Confirms **Node.js 18+** is installed (offers to install when not).
2. Confirms **MongoDB** is reachable at `localhost:27017` (offers to install on Windows; gives copy-paste instructions on macOS/Linux).
3. Generates **strong, random JWT secrets** and writes `server/.env`. (Refuses to start with weak or default secrets.)
4. Installs all server and client dependencies.
5. Seeds a demo workspace.
6. Builds the Angular UI into a production bundle.
7. Starts the server on port **3000**.
8. Prints the LAN URL anyone on the same network can use:

```
🚀 NoticeBoard is ready.
   • Local:     http://localhost:3000
   • Network:   http://192.168.1.42:3000   ← share this with TVs / colleagues on the same network
```

### Flags

```bash
./setup.sh --reset       # wipe the local DB and start fresh
./setup.sh --no-seed     # skip demo data
./setup.sh --no-build    # skip the Angular production build
./setup.sh --no-start    # configure but don't start
```

Windows equivalents: `setup.cmd --reset` (or `.\setup.ps1 --reset` in PowerShell).

### Re-running

Safe to re-run any time you pull updates. It keeps a strong `.env`, reuses already-installed dependencies, and re-builds the UI as needed.

---

## 🔑 First-time login

After setup, open the **Network** URL on any device on the same Wi-Fi/LAN.

| Field    | Value                        |
|----------|------------------------------|
| Email    | `admin@noticeboard.local`    |
| Password | `admin123`                   |

> ⚠️ **Change this password right after first login** (Settings → 👥 Users).

---

## ❓ How do I use it?

If you've never used NoticeBoard, the in-app **💡 Help** page has step-by-step guides for everyday tasks (updating numbers, uploading files, replacing pictures, branding…). The same content lives in [`docs/`](./docs/) as plain markdown files you can read in any editor or share with staff.

The everyday workflow looks like this:

```
You open the board     →     Click a widget     →     Edit numbers     →     Save
                                                                              ↓
                                               TV updates on its own in seconds
```

Three concepts to know:

- **Board** — one screen of info. Each TV shows one board.
- **Page** — a board can flip between pages, like slides.
- **Widget** — a box on a page that shows one thing (table, chart, image, template, notice).

---

## ✨ What it can do

### Boards & displays
- **4 layout modes** — Carousel, Grid, List, Single notice.
- **Multi-page boards** with smooth animated transitions (slide / fade / zoom / flip).
- **Auto-scroll** for long lists, configurable speed and direction.
- **Live clock and date** in the header.
- **Double-click** any TV to go fullscreen. PWA-installable on tablets.
- **Live updates** — when you save changes, every TV updates within seconds via WebSockets.
- **Branded "Loading" and "Board not available"** screens — admin sets logo, colours, and custom messages so non-technical staff see your company, not generic placeholders.

### Widgets
- **Table** — typed rows or live data, with **row totals** and **column totals** (auto-sum numeric cells).
- **Chart** — bar, line, pie, doughnut. Wired to use **Apache ECharts** going forward.
- **Image** — upload from disk, paste a URL, or pick from the media library. Per-widget controls for **fit** (cover / contain / stretch / original), **width / height percentage**, **alignment**, **edge-to-edge**, and **background colour**. Tested on real TVs at 720p, 1080p, and 4K.
- **Template** — fill in admin-designed templates with safe `{{key}}` substitutions. HTML rendered with **DOMPurify** sanitization.
- **Notice** — pick a notice from a drop-down (by title + date — no IDs to type).

### Data sources
Connect any widget to live data so it updates without anyone touching it.

- **URL source** — point at any JSON-returning API. Headers (e.g. `Authorization: Bearer …`) are supported. Refreshes on a per-source interval (default 5 minutes, min 30s).
- **JSON file / paste source** — upload a `.json` file or paste JSON directly. Stored once, no polling. Great for daily figure exports from another system.
- **Test before saving** — built-in "Run test" button shows the response and the result of applying your `dataPath`, so admins can verify the shape before committing.
- **Field mapping** for tables (which keys become which columns, with **auto-fill from sample**) and charts (label field + value field).
- **SSRF-protected** — server refuses to fetch from private IPs, loopback, link-local, and cloud-metadata ranges.

### Branding & fonts
- Upload logo, pick three brand colours (primary / secondary / accent), choose dark or light theme.
- Built-in fonts plus **add a custom font** by pasting a Google Fonts URL or uploading a `.woff2` / `.ttf`.
- **Live preview** in the settings page — see what staff will see on the TV before saving.
- Custom display-screen text for Loading / Unavailable / No-notices.

### Notices & templates
- Status workflow: Draft → Scheduled → Active → Expired.
- Schedule a notice to appear/disappear on specific dates.
- Categories with colours and icons.
- Industry-specific seed templates: Manufacturing, Assembly, Logistics, Healthcare, Education, Retail, IT.

### In-app help
- **💡 Help** in the sidebar — searchable, task-focused guides for non-technical staff.
- Markdown rendered with the **marked** library (real tables, code blocks, lists, alignment).
- Also available as standalone files in [`docs/`](./docs/) for sharing or printing.

---

## 🔒 Security & network posture

The app is hardened for internal-network use. Headline protections:

| Area | Protection |
|---|---|
| **JWT secrets** | Generated freshly per install; server refuses to start with placeholder/weak values |
| **Auth rate-limit** | 8 logins/min, 5 registrations/hour per IP (`express-rate-limit`) |
| **SSRF** | URL allowlist (http/https only); DNS lookup with private/loopback/metadata IPs blocked; redirects re-validated |
| **XSS** | Template HTML sanitized with **DOMPurify**; tightened **Content-Security-Policy** via helmet |
| **CSRF** | JWT in `Authorization` header (no auth cookies) |
| **Network** | `LAN_ONLY=true` middleware rejects anything outside RFC1918 / loopback ranges |
| **WebSockets** | JWT verified on handshake; tenant rooms require matching `tenantId`; board rooms require an active board |
| **Tenant isolation** | All controllers filter by `req.tenantId`; mass-assignment guards strip `tenantId`/`_id`/`createdBy` from request bodies |
| **Uploads** | SVG blocked (script vector); allowlisted MIME types; `Content-Disposition: attachment` for any `.svg/.html/.js` that slips through |
| **DB queries** | Regex metacharacters escaped on search; prototype keys blocked in dot-path traversal |
| **Passwords** | bcryptjs with cost 12 |
| **Audit** | `npm audit` is clean on both `server/` and `client/` |

To intentionally disable LAN-only (e.g. behind a reverse proxy that already filters), set `LAN_ONLY=false` in `server/.env`.

---

## 📺 Putting a board on a TV

1. In the app, open the board you want to show → click **Display** to get its URL (looks like `http://192.168.1.42:3000/display/<boardId>`).
2. On the TV, open the built-in browser and visit that URL.
3. Press **F11** (or double-click) for fullscreen.
4. Disable the TV's screen timeout.

The TV refreshes itself. You never have to touch it.

Detailed guide: [`docs/08-show-on-tv.md`](./docs/08-show-on-tv.md).

---

## ⚙️ Environment variables

`server/.env` is generated by `setup.js`. The interesting knobs:

```env
PORT=3000                    # API + UI port
HOST=0.0.0.0                 # bind to all interfaces so LAN can reach
NODE_ENV=production
LAN_ONLY=true                # 'false' to disable IP allowlist

MONGODB_URI=mongodb://localhost:27017/noticeboard

JWT_SECRET=<random 64 bytes>           # generated at setup
JWT_REFRESH_SECRET=<random 64 bytes>   # generated at setup
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800       # 50 MB

# Only used when ng serve runs separately on :4200 for development
CORS_ORIGIN=http://localhost:4200
SOCKET_CORS_ORIGIN=http://localhost:4200
```

---

## 🛠️ Development mode

If you're editing the code and want hot reload on port 4200:

```bash
# Terminal 1 — API on :3000 with node --watch
cd server && npm run dev

# Terminal 2 — Angular dev server on :4200 (proxies /api → :3000)
cd client && npm start
```

Production-style serving (single port via Express): just run `npm start` in `server/` after `ng build`. The Express app serves `client/dist/client/browser/` as static assets and falls back to `index.html` for Angular routes.

---

## 📁 Project layout

```
noticeboard/
├── setup.js                  ← cross-platform setup logic
├── setup.sh                  ← macOS / Linux wrapper
├── setup.cmd / setup.ps1     ← Windows wrapper
├── docs/                     ← plain-English help guides (markdown)
│
├── server/                   ← Express.js API + Socket.IO
│   ├── src/
│   │   ├── app.js
│   │   ├── config/           ← env validator, DB connect, constants
│   │   ├── controllers/      ← auth, notice, board, template, category,
│   │   │                       media, tenant, dataSource
│   │   ├── middleware/       ← auth, tenant, upload, rateLimit, lanOnly
│   │   ├── models/           ← User, Tenant, Notice, Board, Template,
│   │   │                       Category, Media, DataSource
│   │   ├── routes/
│   │   ├── services/         ← fetchDataSource (SSRF-safe), seedTemplates
│   │   ├── jobs/             ← noticeScheduler, dataSourcePoller
│   │   └── scripts/          ← seedDemo
│   └── .env                  ← generated by setup
│
├── client/                   ← Angular 21 PWA
│   └── src/app/
│       ├── core/             ← services (api, auth, socket), guards, interceptors, models
│       ├── features/
│       │   ├── auth/         ← login, register
│       │   ├── dashboard/    ← layout, sidebar
│       │   ├── notices/      ← list, form
│       │   ├── templates/    ← gallery
│       │   ├── boards/       ← list, form, designer (drag-drop widget grid)
│       │   ├── media/        ← upload library
│       │   ├── settings/     ← branding, display screens, fonts, data sources, users
│       │   ├── display/      ← kiosk view (the URL TVs open)
│       │   └── help/         ← in-app help center
│       └── shared/
│
└── uploads/                  ← uploaded media (images, videos)
```

---

## 🌐 API reference

All `/api/*` routes require `Authorization: Bearer <token>` except `/api/auth/login`, `/api/auth/register`, `/api/auth/refresh`, `/api/boards/:id/display`, and `/api/health`.

### Auth
- `POST /api/auth/register` — Create a new tenant + owner user (rate-limited)
- `POST /api/auth/login`    — Log in (rate-limited)
- `POST /api/auth/refresh`  — Trade a refresh token for a new access token
- `GET  /api/auth/me`       — Current user + tenant

### Notices
- `GET    /api/notices`            — List, paginated + filtered
- `POST   /api/notices`            — Create
- `GET    /api/notices/:id`        — Read one
- `PUT    /api/notices/:id`        — Update (only author or admin/owner)
- `DELETE /api/notices/:id`        — Delete
- `PATCH  /api/notices/:id/status` — Change status
- `POST   /api/notices/:id/share`  — Share within tenant

### Boards
- `GET    /api/boards`             — List boards
- `POST   /api/boards`             — Create
- `GET    /api/boards/:id`         — Read
- `PUT    /api/boards/:id`         — Update (whitelisted fields)
- `DELETE /api/boards/:id`         — Delete
- `GET    /api/boards/:id/display` — **Public** kiosk endpoint — board layout + notices + branding + templates + data-source payloads + referenced notices

### Data sources
- `GET    /api/datasources`              — List
- `POST   /api/datasources`              — Create
- `GET    /api/datasources/:id`          — Read
- `PUT    /api/datasources/:id`          — Update
- `DELETE /api/datasources/:id`          — Delete
- `POST   /api/datasources/test`         — Try a config without saving (preview the response)
- `POST   /api/datasources/upload-json`  — Upload a `.json` file (returns parsed payload)
- `POST   /api/datasources/:id/refresh`  — Force-fetch now

### Templates, Categories, Media, Tenant, Users
See `server/src/routes/`.

---

## 🧰 Scripts

### Server (`server/package.json`)
| Script | Command            | Notes |
|--------|--------------------|-------|
| dev    | `npm run dev`      | `node --watch src/app.js` |
| start  | `npm start`        | Production start |
| seed   | `npm run seed:demo`| Re-seed demo data |

### Client (`client/package.json`)
| Script | Command         | Notes |
|--------|-----------------|-------|
| dev    | `npm start`     | `ng serve` on :4200 |
| build  | `npm run build` | Production bundle to `dist/client/browser/` |

---

## 🏭 Pre-seeded industries

Each new tenant can pick an industry and get matching templates pre-seeded:

IT · Logistics · Manufacturing · Assembly · Healthcare · Education · Retail · Other

---

## 🆘 Troubleshooting

- **TV shows "Board not available"** — wrong URL, or the board was paused/deleted. Open the URL on your computer to confirm. See [`docs/09-troubleshooting.md`](./docs/09-troubleshooting.md).
- **"Refused to fetch from ..." on a data source** — the URL points at a private/internal address. SSRF guard is doing its job. Use a public-DNS-resolvable URL.
- **Setup says "MongoDB is not reachable"** — install MongoDB (the script tells you which command for your OS), make sure the service is running, and re-run setup.
- **"Startup blocked: JWT_SECRET is the documented placeholder value"** — delete `server/.env` and re-run setup; it'll regenerate strong secrets.
- **Setup says my OS isn't recognised** — install Node 18+ manually from [nodejs.org](https://nodejs.org) and then run `node setup.js` directly.

The in-app **💡 Help** centre has a deeper troubleshooting guide for non-technical staff.

---

## License

MIT — see [LICENSE](./LICENSE).
