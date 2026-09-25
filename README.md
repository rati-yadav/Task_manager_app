# TaskManager — Hairdrama Tech Assignment

A full-stack task management web application built with Next.js, Flask, Supabase, and Google OAuth.

## Live URLs
| Service | URL |
|---------|-----|
| Frontend | https://task-manager-app-8snp.onrender.com |
| Backend API | https://taskmanagerappraj.vercel.app  |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (User)                           │
└───────────────────────┬─────────────────────────────────────────┘
                        │ HTTPS
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│              Next.js Frontend (Vercel)                          │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │  Login Page  │  │  Dashboard   │  │  Task Detail / Edit   │ │
│  │ (Google OAuth│  │  (kanban     │  │  (update status,      │ │
│  │  via Supabase│  │   columns)   │  │   assignee, activity) │ │
│  └──────┬───────┘  └──────┬───────┘  └───────────┬───────────┘ │
│         │                 │                        │             │
│         └────────── lib/api.ts ────────────────────┘            │
│                    (fetch + JWT header)                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │ REST / JSON  (Bearer JWT)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              Flask Backend (Render / Railway)                   │
│                                                                 │
│  /api/auth/*   — Google token verification, profile sync       │
│  /api/tasks/*  — CRUD, status updates, activity log            │
│  /api/users/*  — List users for assignment dropdown            │
│                                                                 │
│  auth_utils.py — Validates Supabase JWT on every request       │
│  email_service.py — Gmail SMTP (task created / completed)      │
└────────────┬─────────────────────────────┬──────────────────────┘
             │ supabase-py (service role)  │ smtplib + Gmail SMTP
             ▼                             ▼
┌────────────────────────┐     ┌──────────────────────┐
│  Supabase (PostgreSQL) │     │  Gmail (email alerts)│
│                        │     │                      │
│  profiles              │     │  Task created →      │
│  tasks                 │     │   assignee email     │
│  task_activities       │     │  Task completed →    │
│                        │     │   creator email      │
└────────────────────────┘     └──────────────────────┘
```

### Key Design Decisions

| Decision | Reason |
|---|---|
| **Supabase Auth for Google OAuth** | Handles the full OAuth flow (popup, callback, token refresh, cookie management) out of the box. No custom OAuth server needed. |
| **Flask backend with service role key** | Business logic and email sending stay server-side. The service role key never touches the browser. |
| **JWT passed as Bearer token** | Every API request from Next.js sends the Supabase access token. Flask calls `supabase.auth.get_user(token)` to verify identity. |
| **Gmail SMTP with App Password** | Simple, reliable. Uses Python's built-in `smtplib` over SSL. No third-party email service needed. |
| **RLS on Supabase** | Even if someone bypasses Flask, Supabase row-level security enforces that users can only modify their own data. |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Backend | Python 3.11 + Flask 3 |
| Database | Supabase (PostgreSQL) |
| Auth | Google OAuth 2.0 via Supabase Auth |
| Email | Gmail SMTP (smtplib) |
| Deployment | Vercel (frontend), Render (backend), Supabase (database) |

---

## Features

- **Google OAuth login** — Sign in with Gmail, no passwords
- **Create tasks** — Title, description, priority, due date
- **Assign tasks** — Assign to any registered team member
- **Task status workflow** — Pending → In Progress → Completed
- **Email notifications**
  - Assignee receives email when a task is assigned to them
  - Creator receives email when their task is marked completed
- **Activity log** — Every update is timestamped and tracked
- **Dashboard** — Kanban-style view with stats

---

## Local Development Setup

### Prerequisites
- Node.js 18+, Python 3.11+
- A [Supabase](https://supabase.com) project
- A [Google Cloud Console](https://console.cloud.google.com) project with OAuth credentials
- A Gmail account with an [App Password](https://myaccount.google.com/apppasswords)

### 1. Clone & configure environment

```bash
git clone <your-repo-url>
cd task-management-web-app
cp .env.example backend/.env
cp .env.example frontend/.env.local
# Edit both files with your actual credentials
```

### 2. Run the Supabase migration

In the Supabase dashboard → SQL Editor, run the contents of:
```
migrations/001_initial_schema.sql
```

### 3. Configure Google OAuth in Supabase

1. Supabase Dashboard → Authentication → Providers → Google
2. Paste your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
3. Add `http://localhost:3000/auth/callback` as an authorized redirect URI in Google Cloud Console

### 4. Start the backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
python run.py
# Running on http://localhost:5000
```

### 5. Start the frontend

```bash
cd frontend
npm install
npm run dev
# Running on http://localhost:3000
```

---

## Deployment

### Supabase
1. Run `migrations/001_initial_schema.sql` in the SQL editor
2. Enable Google provider under Authentication → Providers
3. Add your production callback URL to Google Cloud Console

### Backend → Render
1. Create a new Web Service, connect your GitHub repo
2. Set root directory to `backend`
3. Build command: `pip install -r requirements.txt`
4. Start command: `gunicorn run:app`
5. Add all env variables from `.env.example`

### Frontend → Vercel
1. Import your GitHub repo
2. Set root directory to `frontend`
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_API_URL` (your Render backend URL)

---

## Folder Structure

```
├── backend/
│   ├── app/
│   │   ├── __init__.py          # Flask app factory
│   │   ├── config.py            # Environment config
│   │   ├── supabase_client.py   # Supabase service client
│   │   ├── auth_utils.py        # JWT verification decorator
│   │   ├── email_service.py     # Gmail SMTP notifications
│   │   └── routes/
│   │       ├── auth.py          # /api/auth/*
│   │       ├── tasks.py         # /api/tasks/*
│   │       └── users.py         # /api/users/*
│   ├── run.py                   # Entry point
│   ├── requirements.txt
│   ├── Procfile                 # For Render/Heroku
│   └── render.yaml
├── frontend/
│   ├── app/
│   │   ├── layout.tsx           # Root layout
│   │   ├── (auth)/login/        # Login page
│   │   ├── auth/callback/       # OAuth callback handler
│   │   └── (dashboard)/
│   │       ├── dashboard/       # Home / kanban view
│   │       └── tasks/           # Task list, new task, task detail
│   ├── components/
│   │   ├── Sidebar.tsx          # Navigation + user info
│   │   └── TaskCard.tsx         # Reusable task card
│   ├── lib/
│   │   ├── supabase.ts          # Browser Supabase client
│   │   ├── api.ts               # All Flask API calls
│   │   └── utils.ts             # Formatting helpers
│   ├── middleware.ts             # Auth guard + session refresh
│   └── types/index.ts           # Shared TypeScript types
└── migrations/
    └── 001_initial_schema.sql   # Full DB schema + RLS policies
```

---

## Author
Built for the Hairdrama Tech internship assignment.
