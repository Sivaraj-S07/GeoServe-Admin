# GeoServe — Admin Portal (Project 2)

Platform management dashboard for **Administrators**.
Manage users, workers, bookings, categories, and commission wallet.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│             SHARED BACKEND (from Project 1)              │
│         The Admin Portal connects to the same backend    │
│         as the User/Worker Portal — shared data          │
└────────────────────────────┬────────────────────────────┘
                             │
              ┌──────────────▼──────────────┐
              │       Admin Portal           │
              │    frontend/ (port 5174)     │
              └──────────────────────────────┘
```

> **The Admin Portal does NOT need its own separate backend in production.**
> Point `VITE_API_URL` to the backend deployed from **Project 1**.
> Both portals share one backend = one database = perfectly in sync.

The `backend/` folder here is included for **standalone local development**.
In production, use only ONE backend instance.

---

## Local Development

### Option A — Run with Project 1 Backend (Recommended)

```bash
# 1. Start Project 1's backend first (port 5000)
cd ../project1-userworker/backend
npm install && npm run dev

# 2. Start Admin Portal frontend (separate terminal)
cd frontend
npm install
npm run dev
# → http://localhost:5174
```

### Option B — Run this project standalone

```bash
# Start the included backend
cd backend
npm install
cp .env.example .env
npm run dev            # → port 5000

# Start the admin frontend (separate terminal)
cd frontend
npm install
npm run dev            # → port 5174
```

---

## Project Structure

```
project2-admin/
├── backend/              ← Same shared backend (for standalone mode)
│   ├── data/             ← JSON database files
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   └── server.js
│
└── frontend/             ← React/Vite Admin Panel
    ├── src/
    │   ├── pages/
    │   │   ├── LoginPage.jsx     ← Admin-only login
    │   │   ├── Dashboard.jsx     ← Overview & stats
    │   │   ├── UsersPage.jsx     ← User management
    │   │   ├── WorkersPage.jsx   ← Worker approvals & management
    │   │   ├── BookingsPage.jsx  ← All platform bookings
    │   │   └── AnalyticsPage.jsx ← Commission & analytics
    │   ├── components/
    │   │   ├── Sidebar.jsx
    │   │   └── Toast.jsx
    │   ├── context/AuthContext.jsx
    │   └── api/index.js
    └── package.json
```

---

## Admin Capabilities

| Feature               | Description                                    |
|-----------------------|------------------------------------------------|
| User Management       | View all users, delete accounts                |
| Worker Management     | Approve/reject workers, edit profiles, delete  |
| Category Management   | Create, edit, delete service categories        |
| Booking Overview      | View all platform bookings, manage disputes    |
| Commission Wallet     | Track earnings, view transactions, withdraw    |
| Analytics             | Platform stats, booking trends, top workers    |

---

## Production Deployment

### Recommended Production Setup

```
Backend (Project 1)   →  https://geoserve-api.onrender.com
User/Worker Portal    →  https://geoserve.vercel.app
Admin Portal          →  https://geoserve-admin.vercel.app
```

All three point to **one backend**. No data sync issues.

### Admin Frontend (Vercel)
1. Deploy `frontend/` as a Vite project
2. Set `VITE_API_URL=https://geoserve-api.onrender.com/api`
3. Make sure the backend's `CORS_ORIGIN` includes the Admin Portal URL

### Backend CORS Configuration
In your shared backend `.env`:
```
CORS_ORIGIN=https://geoserve.vercel.app,https://geoserve-admin.vercel.app
```

---

## Admin Login

| Email           | Password  |
|-----------------|-----------|
| admin@gmail.com | admin123  |

> This portal is accessible only at its own URL.
> The User/Worker Portal has no admin login link.
