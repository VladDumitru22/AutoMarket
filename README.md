# 🚗 AutoMarket

> A modern web platform for buying and selling vehicles — built with a React SPA frontend, a FastAPI backend, real-time WebSocket notifications, and cloud infrastructure on Azure SQL + Cloudinary.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Directory Structure](#directory-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Overview](#api-overview)
- [User Roles](#user-roles)
- [Learning Outcomes](#learning-outcomes)

---

## Overview

AutoMarket is a full-stack vehicle marketplace where sellers can post detailed listings with photos, and buyers can search, save favourites, negotiate prices through an integrated offer system, and communicate via built-in real-time messaging. An admin panel provides moderation tools, report management, and live platform statistics.

The project was built as a university capstone and covers the full software lifecycle: requirements analysis, database design, REST API development, real-time communication, cloud integration, and a production-grade UI.

---

## Features

### For Buyers
- 🔍 **Advanced search & filtering** — by brand, model, year range, price range, and keyword
- 💬 **Real-time messaging** — per-listing WebSocket chat with unread badge counters
- 💰 **Offer system** — place, accept, reject, or counter offers with a full negotiation flow
- ❤️ **Favourites** — save and revisit listings at any time
- 🚩 **Report listings** — flag fraudulent or misleading content for admin review

### For Sellers
- 📸 **Listing creation & editing** — upload up to 5 photos (Cloudinary CDN), set a cover image, provide full vehicle specs
- 📥 **Offer management** — receive, accept, reject, or counter incoming offers with real-time notifications
- ✅ **Mark as sold** — close a listing with an optional final selling price
- 🗑️ **Delete listings** — with an in-app confirmation modal

### For Admins
- 🛡️ **Report queue** — review pending user-submitted reports with listing context and colour-coded reason badges
- 📊 **Live stats** — pending reports, registered users, active listings
- ⚡ **Real-time updates** — the admin panel and navbar badge refresh automatically via WebSocket when new reports arrive
- 🗑️ **Moderate listings** — remove any listing directly from the admin panel

### Platform-wide
- 🌙 **Dark / Light mode** — toggle with `localStorage` persistence, respects OS preference on first load
- 🔔 **Real-time notifications** — WebSocket-powered badge counters in the navbar for messages, offers, counter-offers, and admin reports
- 🔐 **JWT authentication** — secure stateless auth with `HS256` signed tokens
- 📜 **Terms & Conditions** page

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI component library |
| TypeScript | ~6.0 | Static typing |
| Vite | 8 | Dev server & bundler |
| Tailwind CSS | v4 | Utility-first CSS, dark mode |
| React Router | v7 | Client-side routing |
| Axios | 1.x | HTTP client with JWT interceptors |
| Lucide React | 1.x | SVG icon library |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Python | 3.11+ | Runtime |
| FastAPI | 0.120 | REST API + WebSocket framework |
| SQLAlchemy | 2.0 | ORM |
| Pydantic v2 | 2.x | Data validation & serialisation |
| python-jose | 3.x | JWT generation & verification |
| bcrypt / passlib | — | Password hashing |
| Uvicorn | 0.38 | ASGI server |
| python-dotenv | 1.x | Environment variable loading |

### Infrastructure & Services
| Service | Purpose |
|---|---|
| Microsoft Azure SQL | Relational database (SQL Server hosted in the cloud) |
| Cloudinary | Image storage & CDN delivery |
| ODBC Driver 18 for SQL Server | Database connectivity driver |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Browser (React SPA)                       │
│  React + TypeScript + Tailwind CSS + React Router                │
│  AuthContext (JWT) │ Axios HTTP client │ WebSocket connections   │
└────────────────────┬─────────────────────────────┬───────────────┘
                     │  HTTP/HTTPS (REST API)       │  WebSocket
                     │  /api/*                      │  /ws/*
┌────────────────────▼─────────────────────────────▼───────────────┐
│                      FastAPI Backend (Uvicorn)                    │
│  routers/  │  models/  │  schemas/  │  utils/  │  core/          │
│  JWT auth  │  SQLAlchemy ORM  │  Pydantic v2  │  WSManager       │
└────────────────────┬─────────────────────────────┬───────────────┘
                     │  pyodbc / SQLAlchemy         │  Cloudinary SDK
          ┌──────────▼──────────┐        ┌──────────▼──────────┐
          │   Azure SQL Server  │        │     Cloudinary CDN  │
          │  (AutoMarketDB)     │        │  (listing images)   │
          └─────────────────────┘        └─────────────────────┘
```

The Vite dev server proxies all `/api/*` requests to `http://localhost:8000` and all `/ws/*` WebSocket connections to `ws://localhost:8000`, so no CORS configuration is needed during development.

---

## Directory Structure

```
AutoMarket/
│
├── backend/
│   ├── core/
│   │   ├── config.py          # Settings loaded from .env via pydantic-settings
│   │   └── ws_manager.py      # WebSocket connection manager + fire_notify helper
│   │
│   ├── db/
│   │   ├── session.py         # SQLAlchemy engine + session factory
│   │   └── migrations/        # Raw SQL migration scripts
│   │       ├── 001_add_offer_status.sql
│   │       └── 002_seed_brands_models.sql
│   │
│   ├── models/                # SQLAlchemy ORM models
│   │   ├── user.py
│   │   ├── listing.py         # Listing, ListingImage, CarModel, Brand, ListingStatus
│   │   ├── offer.py
│   │   ├── conversation.py    # Conversation + Message
│   │   ├── favorite.py
│   │   └── report.py
│   │
│   ├── routers/               # FastAPI route handlers (one file per domain)
│   │   ├── auth.py            # Register, login, /me
│   │   ├── listings.py        # CRUD, search, mark-sold, delete
│   │   ├── offers.py          # Place, accept, reject, counter, accept-counter, reject-counter
│   │   ├── conversations.py   # Start conversation, send message, mark read
│   │   ├── favorites.py       # Add, remove, list, get IDs
│   │   ├── reports.py         # Submit report
│   │   ├── admin.py           # Report queue, stats, resolve
│   │   ├── notifications.py   # Unread counts endpoint
│   │   ├── upload.py          # Cloudinary image upload proxy
│   │   └── ws.py              # WebSocket endpoints (conversations + notifications)
│   │
│   ├── schemas/               # Pydantic request/response models
│   │   ├── user.py
│   │   ├── listing.py
│   │   ├── offer.py
│   │   ├── conversation.py
│   │   └── report.py
│   │
│   ├── services/
│   │   └── cloudinary_service.py  # Cloudinary upload wrapper
│   │
│   ├── utils/
│   │   └── auth.py            # JWT helpers, get_current_user, require_admin
│   │
│   ├── main.py                # FastAPI app, middleware, router registration, startup hook
│   └── .env                   # Environment variables (not committed — see below)
│
├── frontend/
│   ├── public/
│   │   └── favicon.svg        # Custom orange-rose gradient car icon
│   │
│   └── src/
│       ├── api/               # Typed Axios wrappers per domain
│       │   ├── client.ts      # Axios instance with JWT Authorization header
│       │   ├── auth.ts
│       │   ├── listings.ts
│       │   ├── offers.ts
│       │   ├── conversations.ts
│       │   ├── favorites.ts
│       │   ├── notifications.ts
│       │   └── upload.ts
│       │
│       ├── components/
│       │   ├── Navbar.tsx       # Sticky nav with real-time notification badges + dark toggle
│       │   ├── ListingCard.tsx  # Reusable card used on Home, Favourites, My Listings
│       │   └── ReportModal.tsx  # In-app report dialog
│       │
│       ├── context/
│       │   └── AuthContext.tsx  # Global JWT + user state via React Context
│       │
│       ├── pages/
│       │   ├── HomePage.tsx           # Search filters + listing grid
│       │   ├── ListingDetailPage.tsx  # Gallery, offer panel, messaging, admin actions
│       │   ├── CreateListingPage.tsx  # Create & edit form with Cloudinary image upload
│       │   ├── MyListingsPage.tsx
│       │   ├── MyOffersPage.tsx       # Sent & received offers with counter-offer flow
│       │   ├── MessagesPage.tsx       # Real-time WebSocket chat
│       │   ├── FavoritesPage.tsx
│       │   ├── AdminPage.tsx          # Report queue + stats + live WebSocket updates
│       │   ├── LoginPage.tsx
│       │   ├── RegisterPage.tsx       # Password strength rules panel
│       │   └── TermsPage.tsx
│       │
│       ├── App.tsx        # Router, dark-mode toggle, animated gradient background blobs
│       ├── main.tsx
│       └── index.css      # Tailwind v4 import + blob-drift keyframe animations
│
├── script.sql             # Full database schema — run this first
├── requirements.txt       # Python dependencies
└── README.md
```

---

## Getting Started

### Prerequisites

Make sure the following are installed on your machine:

- **Node.js** ≥ 18 and **npm** ≥ 9
- **Python** ≥ 3.11
- **ODBC Driver 18 for SQL Server** — [download here](https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server)
- A **Microsoft Azure SQL** database (or a local SQL Server instance)
- A **Cloudinary** account (free tier is sufficient)

---

### Environment Variables

Create a file at `backend/.env` with the following content:

```env
# ── JWT ──────────────────────────────────────────────────────────
SECRET_KEY=<generate with: python -c "import secrets; print(secrets.token_hex(32))">
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# ── Azure SQL Database ───────────────────────────────────────────
user=<your-azure-sql-admin-username>
password=<your-azure-sql-password>
server=<your-server-name>.database.windows.net
database=<your-database-name>

# ── Cloudinary ───────────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
```

### Backend Setup

```bash
# 1. Navigate to the project root
cd AutoMarket

# 2. Create a virtual environment
python -m venv backend/venv

# 3. Activate it
# Windows (PowerShell)
backend\venv\Scripts\Activate.ps1

# macOS / Linux
source backend/venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt
```

---

### Frontend Setup

```bash
cd frontend
npm install
```

---

### Database Setup

1. Connect to your Azure SQL database using **Azure Data Studio**, **SSMS**, or any SQL client.
2. Open and execute **`script.sql`** from the project root — this creates all tables, foreign keys, and seeds the `ListingStatus` table.
3. Optionally run the scripts in `backend/db/migrations/` in order to seed car brands and models:
   - `001_add_offer_status.sql`
   - `002_seed_brands_models.sql`

---

## Running the Application

You need **two terminals** running simultaneously.

### Terminal 1 — Backend

```bash
# From the project root (virtual environment must be active)
cd backend
uvicorn main:app --reload --port 8000
```

- API base URL: `http://localhost:8000`
- Interactive Swagger docs: `http://localhost:8000/docs`

### Terminal 2 — Frontend

```bash
cd frontend
npm run dev
```

- App URL: `http://localhost:5173`

> The Vite dev server automatically proxies `/api/*` → `http://localhost:8000` and `/ws/*` → `ws://localhost:8000`. No additional configuration needed.

---

## API Overview

All endpoints are prefixed with `/api` via the Vite proxy in development.

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/auth/register` | Create a new user account | — |
| `POST` | `/auth/token` | Login, returns a JWT | — |
| `GET` | `/auth/me` | Get current user profile | ✅ |
| `GET` | `/listings` | Search listings with filters | — |
| `POST` | `/listings` | Create a new listing | ✅ |
| `GET` | `/listings/{id}` | Get a single listing | — |
| `PUT` | `/listings/{id}` | Edit a listing | ✅ Owner |
| `DELETE` | `/listings/{id}` | Delete a listing | ✅ Owner/Admin |
| `POST` | `/listings/{id}/mark-sold` | Mark as sold | ✅ Owner |
| `POST` | `/offers/{listing_id}` | Place an offer | ✅ |
| `POST` | `/offers/{id}/accept` | Accept an offer | ✅ Seller |
| `POST` | `/offers/{id}/reject` | Reject an offer | ✅ Seller |
| `POST` | `/offers/{id}/counter` | Send a counter-offer | ✅ Seller |
| `POST` | `/offers/{id}/accept-counter` | Accept a counter-offer | ✅ Buyer |
| `POST` | `/offers/{id}/reject-counter` | Reject a counter-offer | ✅ Buyer |
| `POST` | `/conversations/{listing_id}` | Start a conversation | ✅ |
| `POST` | `/conversations/{id}/messages` | Send a message | ✅ |
| `PATCH` | `/conversations/{id}/messages/read` | Mark messages as read | ✅ |
| `GET` | `/favorites` | List favourited listings | ✅ |
| `POST` | `/favorites/{listing_id}` | Add to favourites | ✅ |
| `DELETE` | `/favorites/{listing_id}` | Remove from favourites | ✅ |
| `POST` | `/reports` | Submit a report | ✅ |
| `GET` | `/admin/reports` | Get pending reports | ✅ Admin |
| `GET` | `/admin/stats` | Platform statistics | ✅ Admin |
| `POST` | `/admin/reports/{id}/resolve` | Dismiss or remove | ✅ Admin |
| `GET` | `/notifications/count` | Unread badge counts | ✅ |
| `POST` | `/upload` | Upload images to Cloudinary | ✅ |
| `WS` | `/ws/conversations/{id}` | Real-time chat stream | ✅ |
| `WS` | `/ws/notifications` | Real-time notification events | ✅ |

Full interactive documentation is available at `http://localhost:8000/docs` when the backend is running.

---

## User Roles

| Role | `RoleID` | Capabilities |
|---|---|---|
| **Visitor** | — | Browse and view listings without an account |
| **Member** | 1 / 2 | Register, post listings, place offers, message sellers, save favourites, report listings |
| **Admin** | 3 | Access the admin panel — cannot post listings or place offers on their own account |

> To promote a user to admin, manually update their `RoleID` to `3` in the `Users` table.

---

## Learning Outcomes

Building AutoMarket from scratch covered a wide range of modern full-stack engineering concepts:

**Backend & API Design**
- Designing a RESTful API with clear resource boundaries, proper HTTP status codes, and structured error responses
- Using FastAPI's dependency injection (`Depends`) for authentication, DB sessions, and role-based access control
- Writing SQLAlchemy 2.0 ORM models with relationships, eager loading (`joinedload`), and avoiding the N+1 query problem
- JWT authentication — stateless token generation, verification middleware, and secure password hashing with bcrypt
- Pydantic v2 for strict input validation and clean serialisation of ORM objects to JSON

**Real-time Communication**
- Implementing a WebSocket manager that maintains persistent connections per conversation and per user
- Building a pub/sub notification system (`fire_notify`) that bridges synchronous HTTP handlers with an async WebSocket event loop using `asyncio.run_coroutine_threadsafe`
- Handling WebSocket reconnection on the frontend with automatic retry

**Frontend Engineering**
- Building a React 19 SPA with TypeScript, structured around feature-based pages and a shared component library
- Managing global state with React Context (AuthContext) and local component state with hooks
- Implementing optimistic UI updates — favourites toggle and offer state — without blocking on server round-trips
- Designing a glassmorphism UI (backdrop blur, semi-transparent surfaces, dark/light mode) with Tailwind CSS v4 and CSS keyframe animations
- Using Vite's dev proxy to avoid CORS issues during development while keeping the production build environment-agnostic

**Cloud & Infrastructure**
- Connecting a Python application to Microsoft Azure SQL via pyodbc and a properly formatted ODBC connection string
- Integrating Cloudinary for managed image upload, transformation, and CDN delivery
- Understanding the trade-offs of externalising binary assets to a dedicated service vs. storing them on the application server

**Software Engineering Practices**
- Structured project layout with clear separation of concerns: models / schemas / routers / services / utils
- Environment-based configuration with `.env` files and `pydantic-settings` — no hardcoded secrets
- Versioned database migration scripts
- Identifying and fixing React anti-patterns: setState during render, stale closures in WebSocket handlers, missing dependency arrays

---
