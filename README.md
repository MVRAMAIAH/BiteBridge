# CurryCircle 🍛

CurryCircle is a world-class, real-time, peer-to-peer food sharing platform designed for students, hostels, PG roommates, and local families. Users can dynamically share homemade curries or meals at low cost or request food posts dynamically without any restrictive user role locking.

## Key Features

1. **Equal & Dynamic Peer-to-Peer Roles:**
   - No rigid "cooker" or "eater" roles. Any user can share a homemade curry post today and request a meal from another community peer tomorrow.

2. **Hostel & PG Room-Based Privacy:**
   - Join apartment, hostel, or PG groups using a dynamic room code.
   - **High-Priority Privacy Rule:** All posts by room members appear to other community peers labeled as: `"Posted by Room: <Room Name>"`, safeguarding room layouts.
   - Admins retain absolute approval over member requests.

3. **Geospatial Proximity Feed:**
   - Filters and prioritizes local food posts nearest to you.
   - Geolocation dashboard sorting toggles instantly.

4. **Socket.io Real-Time Layer:**
   - Real-time instant socket alerts when a food share is posted nearby (within 10km), when food is requested, or when room approvals change.

5. **Multi-Language Engine:**
   - Instant dynamic UI translations between **English**, **Telugu (తెలుగు)**, **Hindi (हिंदी)**, and **Tamil (தமிழ்)**.

6. **Premium Dual-Theme Design:**
   - Sophisticated warm saffron spice theme with fully integrated dark mode switch.

---

## Directory Structure

```
CurryCircle/
├── backend/            # Express, Node, MongoDB Server
│   ├── config/         # MongoDB DB & server config
│   ├── controllers/    # API endpoint controllers (Auth, Room, Food, Request)
│   ├── middleware/     # JWT protection layers
│   ├── models/         # Mongoose Schemas (User, Room, Request, Notification, etc.)
│   ├── routes/         # REST routes
│   └── services/       # Socket.io event layer
└── frontend/           # React + Vite Client
    ├── src/
    │   ├── components/ # Reusable elements (FeedCard, Navbar, etc.)
    │   ├── context/    # Shared states (Auth, Theme, Language i18n, Socket)
    │   ├── pages/      # Route screens (Dashboard, RoomDetails, Profile, Landing)
    │   └── services/   # Client-side API fetch client
    └── tailwind.config.js
```

---

## Setup & Running Locally

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Local Instance (`mongodb://127.0.0.1:27017`) or remote Atlas string.

### Step 1: Start Backend API Server
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Copy configuration settings:
   ```bash
   cp .env.example .env
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   *(Running on `http://localhost:5000`)*

### Step 2: Start Frontend Application
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React client:
   ```bash
   npm run dev
   ```
   *(Running on `http://localhost:5173`)*

---

## Technical Specifications
- **Authentication:** Mock Google profile JWT credentials for easy testing, allowing instant role swaps.
- **Styling:** Tailored Tailwind CSS palette + glassmorphism index classes.
- **Localization:** Direct Context-based translation mapping.
