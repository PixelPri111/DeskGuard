# 📚 DeskGuard

**Smart Library Seat Booking & Anti-Hoarding System**

DeskGuard is a real-time library seat management platform designed to eliminate desk hoarding and improve study space utilization. Students can check into desks, temporarily mark themselves away, and receive inactivity prompts, while librarians gain a live dashboard to monitor occupancy and manage abandoned seats.

---

## 🚨 Problem Statement

In many college libraries, students reserve desks by leaving their bags and disappearing for long periods. This leads to:

* Unfair desk allocation
* Poor utilization of study spaces
* Difficulty tracking actual occupancy
* Frustration for students looking for available seating

Libraries often rely on manual monitoring, which is inefficient and difficult to scale.

---

## 💡 Solution

DeskGuard introduces a digital seat management system with:

* Real-time desk occupancy tracking
* QR-based desk check-in workflow
* Temporary "Away" mode
* Automatic abandoned desk detection
* Live updates using WebSockets
* Librarian administration dashboard

The system ensures that desks are used fairly and remain available to active students.

---

## ✨ Key Features

### 👨‍🎓 Student Features

* View live library desk map
* Check into available desks
* See desk status in real time
* Activate Away Mode
* Release desk manually
* Receive "Still Here?" inactivity prompts
* Auto-restoration of active sessions

### 🧑‍💼 Librarian Features

* Live dashboard of all desks
* Monitor occupancy status
* View student information
* Reset desks manually
* Identify abandoned desks
* Track overall seat utilization

### ⚡ Real-Time Updates

Using Socket.IO:

* Desk changes instantly update for all connected users
* No page refresh required
* Multi-user synchronization

---

## 🏗️ System Architecture

Frontend (React + Vite)
↓
Socket.IO Client
↓
Node.js + Express API
↓
Socket.IO Server
↓
SQLite Database (better-sqlite3)
↓
Background Sweeper Service

---

## 🔄 Desk Lifecycle

### 1. Available

Status: `free`

A desk is available for booking.

### 2. Checked In

Status: `occupied`

Student successfully checks into a desk.

### 3. Away Mode

Status: `away`

Student temporarily leaves the desk.

* Away timer starts
* Desk remains reserved
* Automatically expires after configured duration

### 4. Abandoned

Status: `abandoned`

Triggered when:

* Student fails inactivity verification
* No response received within required period

### 5. Released

Status: `free`

Desk becomes available again.

---

## 🧹 Automatic Sweeper Service

A background worker continuously monitors desk states.

### Responsibilities

#### Away Expiry

Automatically frees desks when Away Mode expires.

#### Inactivity Detection

Marks desks as abandoned when students fail to respond.

#### Cleanup

Automatically releases abandoned desks after timeout.

---

## 🗂️ Project Structure

```text
deskguard/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DeskMap.jsx
│   │   │   ├── DeskTile.jsx
│   │   │   ├── CheckInModal.jsx
│   │   │   └── StillHereModal.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── StudentView.jsx
│   │   │   ├── AdminView.jsx
│   │   │   └── AdminLogin.jsx
│   │   │
│   │   ├── App.jsx
│   │   └── index.css
│   │
│   └── package.json
│
├── server/
│   ├── jobs/
│   │   └── sweeper.js
│   │
│   ├── routes/
│   │   ├── desks.js
│   │   └── admin.js
│   │
│   ├── db.js
│   ├── index.js
│   └── package.json
│
└── README.md
```

---

## 🛠️ Tech Stack

### Frontend

* React
* Vite
* Tailwind CSS
* React Router DOM
* Axios
* Socket.IO Client

### Backend

* Node.js
* Express.js
* Socket.IO
* Better SQLite3

### Database

* SQLite

### Real-Time Communication

* WebSockets via Socket.IO

---

## 📡 API Endpoints

### Desk Routes

| Method | Endpoint           | Description       |
| ------ | ------------------ | ----------------- |
| GET    | /api/desks         | Fetch all desks   |
| POST   | /api/desks/checkin | Check into a desk |
| POST   | /api/desks/away    | Mark desk as away |
| POST   | /api/desks/back    | Return from away  |
| POST   | /api/desks/release | Release desk      |
| POST   | /api/desks/ping    | Confirm activity  |

### Admin Routes

| Method | Endpoint         | Description    |
| ------ | ---------------- | -------------- |
| POST   | /api/admin/reset | Reset any desk |

---

## 🚀 Local Setup

### Clone Repository

```bash
git clone <repository-url>
cd deskguard
```

### Backend

```bash
cd server
npm install
npm run dev
```

Server runs on:

```text
http://localhost:5000
```

### Frontend

```bash
cd client
npm install
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

---

## 🚀 How to Run

### Prerequisites

Make sure the following are installed:

* Node.js 18+
* npm 9+
* Git

Verify installation:

```bash
node --version
npm --version
```

---

### 1. Clone the Repository

```bash
git clone <repository-url>
cd deskguard
```

---

### 2. Install Backend Dependencies

```bash
cd server
npm install
```

---

### 3. Start Backend Server

```bash
npm run dev
```

Expected output:

```text
✅ Seeded 20 desks
🧹 Sweeper started in DEMO mode
🚀 DeskGuard server running on http://localhost:5000
```

---

### 4. Install Frontend Dependencies

Open a new terminal:

```bash
cd client
npm install
```

---

### 5. Start Frontend

```bash
npm run dev
```

Expected output:

```text
VITE ready in xxx ms

Local: http://localhost:5173/
```

---

### 6. Access Application

Student Portal:

```text
http://localhost:5173
```

Admin Portal:

```text
http://localhost:5173/admin/login
```

Demo Admin Password:

```text
library123
```

---

## 🔧 Environment Variables

This version of DeskGuard does not require any environment variables.

No .env file is needed for local development.

### Future Production Environment Variables

If deployed to production, the following variables are recommended:

```env
PORT=5000
NODE_ENV=production
CLIENT_URL=http://localhost:5173
ADMIN_PASSWORD=your-secure-password
```

---

## 📦 Backend Dependencies

```text
express
socket.io
better-sqlite3
cors
nodemon
```

---

## 📦 Frontend Dependencies

```text
react
vite
react-router-dom
axios
socket.io-client
tailwindcss
postcss
autoprefixer
```

## 🧪 Demo Flow

1. Open Student View
2. Select a free desk
3. Enter student information
4. Desk becomes occupied instantly
5. Open another browser tab
6. Observe real-time synchronization
7. Mark desk as Away
8. Wait for automatic expiry
9. View changes in Admin Dashboard
10. Reset desks from Librarian Panel

---

## 🔐 Future Improvements

* QR code generation for every desk
* University SSO authentication
* Student seat history
* Analytics dashboard
* Peak occupancy predictions
* Email notifications
* Mobile application
* Multi-floor library support
* AI-based seat recommendations

---

## 🎯 Impact

DeskGuard helps libraries:

* Reduce seat hoarding
* Improve fairness
* Increase space utilization
* Minimize manual supervision
* Provide real-time visibility

---

## 👥 Team

Built as a hackathon project to modernize library seat management through real-time occupancy tracking and automated desk monitoring.

---

## 📄 License

MIT License

Feel free to use, modify, and improve this project.
