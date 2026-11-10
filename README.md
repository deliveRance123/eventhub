# EventHub — Online Event Management and Registration System

A modern full-stack web application built with **React, Node.js, Express, and PostgreSQL (Neon Database)** with automatic local SQLite fallback.

---

## 🌟 Upgraded Features

- **Neon Cloud Database Ready**: Plug in your Neon PostgreSQL `DATABASE_URL` and all tables + sample data seed automatically.
- **Local SQLite Fallback**: Zero-configuration local development if no cloud database is provided.
- **Scannable QR Code Admission Passes**: Registered attendees receive a digital ticket pass with attendee details, reference code, and scannable QR code for fast gate check-in.
- **Category Filtering**: Explore events by categories (*All*, *Technology*, *Business*, *Arts*, *General*) with responsive pill buttons.
- **Real-Time Keyword Search**: Instantly filters events by title, description, category, and venue.
- **Vercel 1-Click Deployment Ready**: Configured with `vercel.json` and serverless API routing (`/api`).
- **Complete Auth & Role System**: User sign up, JWT login, and dedicated Administrator Portal.
- **Overbooking & Duplicate Prevention**: Server-enforced capacity checking.

---

## 📁 Clean Codebase Architecture

```text
online-event-management-system/
├── api/                   # Vercel Serverless Function entry point
│   └── index.js           # Serverless Express bridge
├── client/                # React + Vite Frontend
│   ├── src/
│   │   ├── components/    # Navbar, EventCard, TicketModal
│   │   ├── context/       # AuthContext
│   │   ├── pages/         # Home, EventDetails, MyEvents, Auth, Admin
│   │   ├── api.js         # Unified API client (auto-detects local vs Vercel)
│   │   └── styles.css     # Production styling + printable ticket layout
│   ├── index.html
│   └── package.json
├── server/                # Node.js + Express Backend API
│   ├── src/
│   │   ├── middleware/    # Auth & Admin validation
│   │   ├── routes/        # Auth, Events, Registrations
│   │   ├── db.js          # Unified DB driver (Neon PostgreSQL + SQLite fallback)
│   │   └── index.js       # Express server
│   ├── .env.example
│   └── package.json
├── preview.html           # Standalone instant browser preview (0 install needed)
├── start-website.bat      # Windows 1-click launcher
├── vercel.json            # Vercel routing & build configuration
├── .gitignore             # Standard git exclusions
└── package.json           # Monorepo root scripts
```

---

## 🚀 Instant Local Preview (Zero Install)

To view all pages, the search bar, category filters, and digital QR ticket passes without running any Node commands:
1. Double-click `preview.html` in File Explorer.
2. It opens immediately in your web browser.

---

## 💻 Running the Full-Stack App Locally

### 1. Launch with the 1-Click Batch File (Windows)
Double-click `start-website.bat` in the root folder. It starts both backend and frontend automatically.

### 2. Or Run Manually

**Terminal 1 — Backend API:**
```bash
cd server
npm install
npm run dev
```
API runs on `http://localhost:5000`.

**Terminal 2 — Frontend Client:**
```bash
cd client
npm install
npm run dev
```
Website runs on `http://localhost:5173`.

---

## 🗄️ Connecting Neon Database (PostgreSQL)

1. Create a free PostgreSQL database at [Neon.tech](https://neon.tech).
2. Copy your **Pooled connection string** from the Neon dashboard:
   ```text
   postgresql://[user]:[password]@[endpoint]-pooler.[region].aws.neon.tech/neondb?sslmode=require
   ```
3. In `server/.env`, set:
   ```env
   DATABASE_URL=postgresql://[user]:[password]@[endpoint]-pooler.[region].aws.neon.tech/neondb?sslmode=require
   ```
4. Start the backend (`npm run dev`). The server connects to Neon and automatically creates the schema and seeds default events.

---

## ☁️ Deploying to Vercel (Step-by-Step)

1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of upgraded EventHub"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

2. **Import into Vercel**:
   - Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
   - Select your GitHub repository.

3. **Set Environment Variables in Vercel**:
   In the Vercel project settings, add the following Environment Variable:
   - `DATABASE_URL`: Your Neon PostgreSQL connection string.
   - `JWT_SECRET`: A long random secret key.

4. **Click Deploy**:
   Vercel will build the React frontend and deploy the serverless Express API. Both frontend and backend will be live on your custom `.vercel.app` domain!

---

## 🔑 Demo Credentials

- **Admin Account**: `admin@example.com` / `Admin123!` (Full system, quota, and attendee control)
- **Attendee Account**: `user@example.com` / `User123!` (Confirmed tickets, scannable QR passes, saved bookmarks)
