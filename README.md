# 📚 DeskGuard

**Smart Library Seat Booking & Anti-Hoarding System**

DeskGuard is a real-time library seat management platform built to eliminate desk hoarding and make study space allocation fair and transparent. Students get a live view of every desk in the library, can check in instantly, mark themselves away, book future slots up to a week in advance — and the system automatically reclaims abandoned desks so no seat stays blocked unnecessarily.

---

## 🚨 Problem Statement

In most college libraries, students reserve desks by leaving their bags and disappearing for hours. Nobody can tell whether a desk is genuinely occupied or just claimed. The result:

- Unfair desk allocation — early arrivers monopolise seats all day
- Poor space utilisation — desks sit blocked even when empty
- No visibility into real availability for students walking in
- Library staff forced to manually patrol and reclaim seats
- No mechanism to reserve a seat for a future study session

DeskGuard fixes all of this.

---

## 💡 Solution

DeskGuard introduces a digital seat management layer on top of the physical library:

- Every desk has a live status visible to all students in real time
- Students check in digitally, and the system tracks whether they are actually present
- Inactive desks are automatically flagged and eventually released
- Students can book a 2-hour slot up to 7 days in advance — with identity verification at booking time, not relying on stale session data
- Librarians get a dedicated admin dashboard with manual override controls

---

## ✨ Features

### 👨‍🎓 Student Features

- **Live desk map** — see all 20 desks and their current status (Free, Occupied, Away, Abandoned) updated in real time
- **Check-in** — click any free desk, enter your name and student ID, and the desk is yours instantly
- **Away mode** — step out briefly without losing your desk; a 2-minute countdown timer starts and the desk is released automatically if you don't return
- **Still Here? prompt** — if you've been inactive too long, a prompt appears on your screen asking you to confirm you're still present
- **Manual release** — leave early? Hit the ✕ button to free your desk for someone else immediately
- **Slot booking** — reserve a future 2-hour block on any free desk:
  1. Click 📅 Book Slot on any desk tile
  2. Enter your full name and student ID (always asked fresh — no stale data)
  3. Pick from available slots across the next 7 days (08:00 – 20:00)
  4. Confirm — the server validates there are no conflicts for that desk or for you personally
- **My Bookings sidebar** — view all your upcoming and past bookings, cancel any pending one
- **Auto check-in** — when your booked slot begins, the sweeper automatically checks you in if the desk is free
- **QR code support** — desks can be accessed directly via QR link (`/?desk=A1`), which opens the check-in modal immediately

### 🧑‍💼 Admin / Librarian Features

- **Live dashboard** — same real-time desk data as the student view, with full student details visible
- **Manual desk reset** — force-free any desk regardless of its current status
- **Peak hour analytics** — view check-in frequency broken down by hour of day, with the peak hour highlighted
- **All pending bookings** — see every upcoming booking across all desks, sorted by start time
- **Protected login** — admin area is password-gated (`library123` for demo); session persists in localStorage

### ⚡ Real-Time Sync

- Every desk state change (check-in, away, release, abandon, booking auto-check-in) is instantly pushed to all connected clients via **Socket.IO**
- No manual refresh required — the live indicator in the nav bar shows connection status
- Both `desks_updated` and `bookings_updated` events are emitted so all views stay in sync

---

## 🔄 Desk Lifecycle

```
free → occupied → away → free          (student returns in time)
free → occupied → away → abandoned     (student doesn't return)
free → occupied → abandoned → free     (inactivity, no ping)
abandoned → free                       (sweeper cleanup or admin reset)
booking pending → auto check-in → free (slot expires, desk released)
```

| Status | Colour | Description |
|--------|--------|-------------|
| `free` | 🟢 Green | Available for check-in or booking |
| `occupied` | 🔴 Red | Student actively using the desk |
| `away` | 🟡 Yellow | Student temporarily absent — timer running |
| `abandoned` | ⚫ Grey | No activity detected — pending reclaim |

---

## 🧹 Background Sweeper

A background job (`sweeper.js`) runs every **10 seconds** and handles four automatic tasks:

| Task | Demo Timing | Production Timing |
|------|-------------|-------------------|
| Away expiry → desk freed | 2 minutes | 20 minutes |
| No ping → desk marked abandoned | 2 minutes | 2 hours |
| Abandoned cleanup → desk freed | 3 minutes | 2 hours 10 minutes |
| Booked slot start → auto check-in | Every 10s | Every 10s |

When a booked slot ends, the sweeper marks the booking `completed` and releases the desk if the student who booked it is still occupying it.

The sweeper emits `desks_updated` and `bookings_updated` Socket.IO events after any change so all clients update automatically.

---

## 📅 Booking System — How It Works

Slots are fixed 2-hour blocks from 08:00 to 20:00 (6 slots per day) across the next 7 days. When a student opens the booking modal:

1. They enter their **name and student ID** — this is always collected fresh; no cached session data is used
2. The available slots for that desk are fetched from the server
3. Slots already booked on that desk appear in red and are non-selectable
4. On confirmation, the server performs **two conflict checks** before inserting:
   - Is this desk already booked for this time?
   - Does this student already have a booking on *any* desk for this time?
5. If both checks pass, the booking is saved with status `pending`

This dual-layer validation means a student can never accidentally (or intentionally) double-book the same time window across different desks.

---

## 🗃️ Database Schema

**`desks` table**

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK | Auto-increment |
| `desk_number` | TEXT UNIQUE | e.g. `A1`, `B3` |
| `status` | TEXT | `free`, `occupied`, `away`, `abandoned` |
| `student_name` | TEXT | Currently occupying student |
| `student_id` | TEXT | Student's ID |
| `checked_in_at` | DATETIME | When the session started |
| `away_since` | DATETIME | When Away mode was activated |
| `last_ping_at` | DATETIME | Last activity timestamp (used by sweeper) |

**`bookings` table**

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK | Auto-increment |
| `desk_number` | TEXT | FK → desks |
| `student_id` | TEXT | Who booked |
| `student_name` | TEXT | Who booked |
| `booking_start` | DATETIME | Slot start (ISO 8601) |
| `booking_end` | DATETIME | Slot end (ISO 8601) |
| `status` | TEXT | `pending`, `completed`, `cancelled` |
| `created_at` | DATETIME | When the booking was made |

**`sessions` table** (auto-managed via SQLite triggers)

Automatically populated on every check-in and check-out via database triggers defined in `routes/desks.js`. Feeds the peak hour analytics endpoint.

---

## 📡 API Endpoints

### Desk Routes — `/api/desks`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Fetch all 20 desks and their current state |
| `POST` | `/checkin` | Check a student into a free desk |
| `POST` | `/away` | Mark a desk as away and start the timer |
| `POST` | `/back` | Mark student as returned, clear away timer |
| `POST` | `/release` | Release desk back to free |
| `POST` | `/ping` | Confirm student is still present (resets inactivity timer) |

### Booking Routes — `/api/bookings`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/slots/:deskNumber` | Get all 2-hour slots for a desk over the next 7 days with availability |
| `POST` | `/create` | Create a booking (validates desk and student conflicts) |
| `GET` | `/my-bookings/:studentId` | All bookings for a given student, newest first |
| `POST` | `/cancel` | Cancel a pending booking by ID |
| `GET` | `/all` | All pending bookings across all desks — admin view |

### Admin Routes — `/api/admin`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/reset` | Force-reset any desk to free |
| `GET` | `/analytics` | Check-in counts by hour of day + peak hour |

---

## 🏗️ System Architecture

```
React + Vite (port 5173)
    │
    ├── Axios          → REST API calls
    └── Socket.IO client → real-time desk/booking updates
            │
            ▼
Node.js + Express (port 5000)
    │
    ├── /api/desks     → desks.js (with SQLite triggers for session logging)
    ├── /api/bookings  → bookings.js
    ├── /api/admin     → admin.js
    │
    ├── Socket.IO server  → emits desks_updated, bookings_updated
    ├── sweeper.js        → setInterval every 10s, handles lifecycle automation
    │
    └── better-sqlite3 → deskguard.sqlite (single file, zero config)
```

---

## 🗂️ Project Structure

```
deskguard/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── BookingModal.jsx        — 2-step booking flow (details → slot → confirm)
│   │   │   ├── MyBookings.jsx          — upcoming & past bookings sidebar panel
│   │   │   ├── DeskMap.jsx             — renders the 4×5 desk grid
│   │   │   ├── DeskTile.jsx            — individual desk tile (admin view)
│   │   │   ├── DeskTileWithBooking.jsx — desk tile with booking button (student view)
│   │   │   ├── CheckInModal.jsx        — check-in form (name + student ID)
│   │   │   └── StillHereModal.jsx      — inactivity confirmation prompt
│   │   ├── pages/
│   │   │   ├── StudentView.jsx         — main student interface
│   │   │   ├── AdminView.jsx           — librarian dashboard
│   │   │   └── AdminLogin.jsx          — password gate for admin
│   │   ├── App.jsx                     — routing, socket connection, shared desk state
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── server/
    ├── routes/
    │   ├── desks.js       — desk CRUD + SQLite triggers for session logging
    │   ├── bookings.js    — slot generation, booking creation, conflict checks
    │   └── admin.js       — reset + analytics
    ├── jobs/
    │   └── sweeper.js     — background lifecycle automation (away, abandon, booking auto-check-in)
    ├── db.js              — database init, table creation, desk seeding
    ├── index.js           — Express server, Socket.IO setup, route mounting
    └── package.json
```

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend framework | React | 19 |
| Build tool | Vite | 8 |
| Styling | Tailwind CSS | 3 |
| HTTP client | Axios | 1.17 |
| Routing | React Router DOM | 7 |
| QR support | react-qr-code | 2.2 |
| Backend | Node.js + Express | 5 |
| Real-time | Socket.IO | 4.8 |
| Database | better-sqlite3 (SQLite) | 12 |
| Dev server | nodemon | 3 |

---

## 🚀 Local Setup

### Prerequisites

- Node.js 18+
- npm 9+

```bash
node --version   # should be 18+
npm --version    # should be 9+
```

### 1. Clone the Repository

```bash
git clone <repository-url>
cd deskguard
```

### 2. Start the Backend

```bash
cd server
npm install
npm run dev
```

Expected output:
```
✅ Seeded 20 desks
🧹 Sweeper started in DEMO mode
🚀 DeskGuard server running on http://localhost:5000
```

> The SQLite database file (`deskguard.sqlite`) is created automatically on first run. No setup required.

### 3. Start the Frontend

Open a new terminal tab:

```bash
cd client
npm install
npm run dev
```

Expected output:
```
VITE ready in xxx ms
Local: http://localhost:5173/
```

### 4. Open the App

| Interface | URL |
|-----------|-----|
| Student Portal | http://localhost:5173 |
| Admin Login | http://localhost:5173/admin/login |
| Admin Password | `library123` |

---

## 🧪 Demo Walkthrough

1. Open **http://localhost:5173** — you'll see the live desk map with all 20 desks green (free)
2. Click any green desk tile → enter your name and student ID → desk turns red instantly
3. Open the same URL in another browser tab — the change is visible immediately (Socket.IO live sync)
4. Click **Away** on your desk — yellow timer appears; wait 2 minutes and the desk auto-releases
5. Click 📅 **Book Slot** on a different desk → enter name and ID → pick a future time slot → confirm
6. Open the booking modal again on any desk — the slot you just booked is greyed out for your student ID
7. Check **My Bookings** in the sidebar to see your upcoming reservation with a cancel option
8. Visit **http://localhost:5173/admin/login** → password `library123` → see the full admin dashboard
9. Use **Reset** on any desk in the admin view to force-free it instantly

---

## 🔧 Inspecting the Database

If you want to inspect stored data directly:

```bash
cd server

# View all bookings
node -e "const {db} = require('./db'); console.table(db.prepare('SELECT * FROM bookings').all())"

# View all desks
node -e "const {db} = require('./db'); console.table(db.prepare('SELECT * FROM desks').all())"

# Clear all bookings
node -e "const {db} = require('./db'); db.prepare('DELETE FROM bookings').run(); console.log('Cleared')"
```

---

## 🔐 Future Improvements

- University SSO / student portal authentication (replace manual name+ID entry)
- QR code generation and printing per desk for physical scan-to-check-in
- Email or SMS reminders before a booked slot starts
- Peak hour analytics dashboard with visual charts
- Multi-floor and multi-library support
- Seat recommendations based on past booking history
- Mobile app (React Native)
- Role-based access (librarian vs student vs admin)

---

## 🎯 Impact

- Eliminates desk hoarding through automated detection and reclaim
- Gives every student equal and fair access to study spaces
- Advance booking removes the race to arrive early
- Transparent live status means no more wandering the floor looking for a seat
- Reduces library staff workload through self-service automation

---

## 📄 License

MIT — free to use, modify, and build upon.
