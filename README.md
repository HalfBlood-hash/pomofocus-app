# 🍅 Pomofocus Pro - Pomodoro Timer & Work Management System

A high-performance Pomodoro and daily task management application inspired by [pomofocus.io](https://pomofocus.io/app), equipped with **per-task custom timers**, **multi-task work group templates**, **focus music player**, **anti-sleep screen wake lock**, **analytical time reports**, and a **Node.js + SQLite backend with multi-device cloud sync**.

---

## 📑 Table of Contents
1. [Developer Quick Start (How to Run Locally)](#1-developer-quick-start-how-to-run-locally)
2. [How to View and Inspect the Database](#2-how-to-view-and-inspect-the-database)
3. [Deployment to Render](#3-deployment-to-render)
4. [Project Architecture & File Tree](#4-project-architecture--file-tree)
5. [Detailed Component Breakdown](#5-detailed-component-breakdown)
6. [Backend API Reference](#6-backend-api-reference)
7. [Database Schema Reference](#7-database-schema-reference)
8. [Future Development & Extension Guide](#8-future-development--extension-guide)

---

## 1. Developer Quick Start (How to Run Locally)

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher

### Installation
Clone the repository (or navigate to the project directory) and install dependencies:

```bash
cd promodo
npm install
```

### Running Locally (Frontend + Backend Concurrently)
Run the following single command:

```bash
npm run dev
```

This launches:
* **Node.js Express Backend & SQLite Database**: `http://localhost:3000`
* **Vite React Frontend (with reverse proxy enabled)**: `http://localhost:5173`

> **Note**: In your browser, open **`http://localhost:5173`**. Any `/api/*` or `/health` requests are automatically proxied from port `5173` to `3000`.

### Other npm Scripts
* `npm run build`: Compiles TypeScript and builds production assets into the `dist/` directory.
* `npm start`: Starts only the production Express server (`node server.js`).
* `npm run client`: Runs only the Vite dev frontend.
* `npm run server`: Runs only the Express backend server.

---

## 2. How to View and Inspect the Database

The database is an embedded **SQLite** database stored in `pomofocus.db`.

### Method A: Command-Line Inspector (Local)
Run the included inspector script in your terminal:
```bash
node view-db.js
```
It prints clean tables of all registered accounts, user IDs, emails, stored tasks, pomodoros completed, and work group templates.

### Method B: VS Code Extension GUI (Local)
1. Install the **"SQLite Viewer"** extension (by Florian Klampfer) from the VS Code Marketplace.
2. In the file explorer, click directly on `pomofocus.db`.
3. Browse and edit tables (`users`, `user_data`) directly in the editor.

### Method C: Standalone GUI Tool (Local)
Download and open `pomofocus.db` using [DB Browser for SQLite](https://sqlitebrowser.org/dl/).

### Method D: How to View Production Database on Render
1. Open your [Render Dashboard](https://dashboard.render.com/).
2. Select your `pomofocus` Web Service.
3. In the left sidebar, click **Shell**.
4. In the web terminal, type:
   ```bash
   node view-db.js
   ```
   Press Enter to display your live production database records.

---

## 3. Deployment to Render

The repository is fully configured for Render deployment as a **Web Service**:

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Deploy Pomofocus"
   git push origin main
   ```
2. **On Render Dashboard**:
   * Click **New +** $\rightarrow$ **Web Service**.
   * Connect your GitHub repo.
   * Configure:
     * **Environment / Runtime**: `Node`
     * **Build Command**: `npm install && npm run build`
     * **Start Command**: `npm start`
     * **Advanced $\rightarrow$ Health Check Path**: `/health`
   * Click **Create Web Service**.

> **Keep-Alive Feature**: `server.js` detects Render's `RENDER_EXTERNAL_URL` and self-pings `/health` every 10 minutes to prevent the free instance from spinning down.

---

## 4. Project Architecture & File Tree

```text
promodo/
├── public/
│   ├── favicon.svg          # App icon
│   └── _redirects            # SPA route rewrite rule for static hosting
├── src/
│   ├── assets/              # Icons and static images
│   ├── components/
│   │   ├── AuthModal.tsx     # Sign In & Registration with database sync
│   │   ├── MusicPlayer.tsx   # Radio streams, local MP3 upload & custom URLs
│   │   ├── ReportModal.tsx   # Productivity analytics & "Where I take more time"
│   │   ├── SettingsModal.tsx # Timer duration, auto-starts & alarm sounds
│   │   ├── TaskList.tsx      # Daily work task management & custom timings
│   │   └── TemplateModal.tsx # Multi-task work groups & bulk paste
│   ├── utils/
│   │   ├── audio.ts          # Web Audio API sound synthesizers (Bell, Digital, Kitchen)
│   │   ├── musicTracks.ts    # Preset radio channels (Lofi, Synthwave, Classical, Rain)
│   │   └── useWakeLock.ts    # HTML5 Screen Wake Lock API hook (anti-sleep)
│   ├── App.css              # Component styling
│   ├── App.tsx              # Main application orchestrator & timer clock engine
│   ├── index.css            # Tailwind CSS v4 directives & root design tokens
│   ├── main.tsx             # React DOM entry point
│   └── types.ts             # TypeScript interfaces for Tasks, Templates, Settings, User
├── db.js                    # SQLite database schema, tables & connection
├── server.js                # Express REST API, JWT auth, sync endpoints & static file server
├── view-db.js               # CLI database entity inspector script
├── vite.config.ts           # Vite configuration with Tailwind & backend proxy
├── tsconfig.json            # Base TypeScript config
├── tsconfig.app.json        # Frontend TypeScript compiler options
├── package.json             # Scripts & dependency definitions
└── README.md                # Project documentation
```

---

## 5. Detailed Component Breakdown

### 1. `src/App.tsx` (Main Engine)
* **Purpose**: Coordinates application state, timer countdown loop, keyboard title updates, active task binding, and modal toggles.
* **Key Features**:
  * **Dynamic Background**: Switches colors based on mode (Pomodoro: `#ba4949`, Short Break: `#38858a`, Long Break: `#397097`).
  * **Custom Timer Adaptation**: Adapts the countdown automatically to the active task's `customDurationMinutes`.
  * **Browser Tab Title**: Displays the remaining time and active task in the browser tab title in real-time.
  * **Audio & Confetti**: Plays synthesizer alarms on session completion and fires celebratory confetti.
  * **Auto-Sync Engine**: Debounced background listener (1 second) syncing task, template, and timer changes to `/api/sync`.

### 2. `src/components/TaskList.tsx` (Daily Work Manager)
* **Purpose**: Lists today's tasks, sets the active task, and calculates finish time.
* **Key Features**:
  * **Custom Task Duration**: Each task has an optional `customDurationMinutes` field (e.g. 45m for coding, 15m for emails).
  * **Category Badges**: Categorizes tasks by *Work*, *Study*, *Coding*, *Personal*, or *Reading*.
  * **Dynamic Finish Time Calculator**: Accurately projects finish time (e.g., `"Finish at: 03:45 PM (2.5h left)"`) calculated using individual task durations.
  * **Quick Actions**: Mark complete, edit task, delete, clear completed, or batch delete all tasks.

### 3. `src/components/TemplateModal.tsx` (Work Group Templates)
* **Purpose**: Manages multi-task work groups so users can load entire workflows in one click.
* **Key Features**:
  * **Work Group Structure**: Holds multiple tasks in a single template with individual pomodoro estimates and durations.
  * **Bulk Paste Parser**: Paste raw text lines (e.g., from Jira or notes) to instantly convert them into tasks.
  * **From Current Tasks**: Exports all active daily tasks into a reusable work group.
  * **Pre-Loaded Presets**: Dev Sprint, Deep Study Session, and Office Standup.

### 4. `src/components/MusicPlayer.tsx` (Focus Audio System)
* **Purpose**: Continuous background ambient audio and music player.
* **Key Features**:
  * **Independent Controls**: Manual Play/Pause, Next/Previous station, volume slider, and mute.
  * **5 Curated Channels**: Lofi Chillhop, Lofi Coffee House, Classical Piano, Synthwave, and Rain Atmosphere.
  * **Local Audio Upload**: Play `.mp3` files directly from your computer via HTML5 `URL.createObjectURL`.
  * **Custom URL Streams**: Input custom online radio streams or direct audio URLs.

### 5. `src/components/ReportModal.tsx` (Time Analytics)
* **Purpose**: Shows detailed metrics and answers *"Where do I take more time?"*
* **Key Features**:
  * **Overdue Analysis**: Detects tasks that exceeded their estimated pomodoros and tags them with `+N pomos overdue`.
  * **Visual Bar Charts**: Relative time spent across tasks and categories.
  * **KPI Summary**: Focus hours logged, pomodoros completed, and task completion percentage.

### 6. `src/components/SettingsModal.tsx` (Timer Configuration)
* **Purpose**: Customize global defaults.
* **Key Features**:
  * Configure Pomodoro duration (default 25m), Short Break (5m), and Long Break (15m).
  * Adjust Long Break Interval (e.g. every 4 pomodoros).
  * Toggle Auto-Start Breaks and Auto-Start Pomodoros.
  * Alarm Sound Selector: Bell, Digital Beep, or Kitchen Timer.

### 7. `src/components/AuthModal.tsx` (User Accounts & Sync)
* **Purpose**: User login and registration modal.
* **Key Features**:
  * Communicates with `/api/auth/register` and `/api/auth/login`.
  * Stores JWT tokens in `localStorage`.
  * Automatically pulls saved tasks and work groups from the database on login.

### 8. `src/utils/useWakeLock.ts` (Anti-Sleep Hook)
* **Purpose**: Prevents the screen, display, and computer from sleeping while working.
* **Implementation**: Uses `navigator.wakeLock.request('screen')`. Automatically engages when the timer starts and releases when paused or reset. Automatically re-acquires lock when returning to the browser tab.

### 9. `src/utils/audio.ts` (Audio Synthesizer)
* **Purpose**: Zero-dependency audio effects generated dynamically via Web Audio API oscillators. Requires no external `.wav` or `.mp3` assets for alarm sounds.

---

## 6. Backend API Reference (`server.js`)

All endpoints return JSON responses.

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/health` | No | Health check for Render / monitoring tools |
| `GET` | `/api/ping` | No | Quick ping probe (`pong`) |
| `POST` | `/api/auth/register` | No | Create account: `{ name, email, password }` |
| `POST` | `/api/auth/login` | No | Authenticate user: `{ email, password }` |
| `GET` | `/api/auth/me` | Bearer JWT | Restore profile and load cloud workspace |
| `POST` | `/api/sync` | Bearer JWT | Cloud-sync workspace: `{ tasks, templates, settings, pomodoroCount }` |

---

## 7. Database Schema Reference (`db.js`)

```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_data (
  user_id INTEGER PRIMARY KEY,
  tasks_json TEXT DEFAULT '[]',
  templates_json TEXT DEFAULT '[]',
  settings_json TEXT DEFAULT '{}',
  pomodoro_count INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 8. Future Development & Extension Guide

### How to add a new property to tasks:
1. Open `src/types.ts` and add the field to the `Task` interface:
   ```typescript
   export interface Task {
     // ...
     priority?: 'low' | 'medium' | 'high';
   }
   ```
2. Update `src/components/TaskList.tsx`:
   * Add a state variable (e.g. `const [priority, setPriority] = useState('medium')`).
   * Include the input in the task form.
   * Include the field in `onAddTask` and `onUpdateTask`.
3. The backend requires no schema alterations because tasks are stored in JSON format inside `user_data.tasks_json`.

### How to add a new preset radio channel:
1. Open `src/utils/musicTracks.ts`.
2. Add an entry to the `PRESET_TRACKS` array:
   ```typescript
   {
     id: 'jazz-focus',
     title: '🎷 Cozy Coffee Shop Jazz',
     category: 'ambient',
     url: 'https://your-stream-url.mp3',
     sourceType: 'stream',
   }
   ```

### How to switch from SQLite to PostgreSQL (for permanent Render storage):
1. Install `pg`: `npm install pg`.
2. In `db.js`, replace `better-sqlite3` with a PostgreSQL connection pool (`new pg.Pool({ connectionString: process.env.DATABASE_URL })`).
3. Replace SQLite `?` parameter syntax with Postgres `$1, $2` syntax in `server.js`.
