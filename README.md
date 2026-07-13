# WorkTrace — Enterprise Work Intelligence Platform

## Problem Statement
Work updates, decisions, and contributions are scattered across emails, meetings, and documents. Individual contributions become invisible as work moves up the hierarchy.

## Solution
A centralized platform where work is tracked from client requirement to final delivery, preserving contribution history and organizational knowledge — with hierarchy-aware access control at its core.

## Architecture Highlights

### Visibility Resolver
The centerpiece of the system. A single function that computes each user's authorized scope from their position in the org hierarchy. Every API endpoint filters through it automatically — no scattered permission checks.

| Role | Visible Scope |
|---|---|
| Employee | Own team only |
| Team Lead | Their entire team |
| Manager | All teams they manage |
| Department Head | All teams in their department |
| Admin | Everything |

### Immutable Activity Log
Every task change (status, assignee, deliverable, comment) is recorded in an append-only log with who made it and when. Contributions are never lost.

## Tech Stack
- **Backend:** FastAPI, SQLModel, SQLite
- **Frontend:** React, Vite, Tailwind CSS
- **Auth:** JWT + bcrypt
- **AI:** Anthropic API (Claude)

## Modules
- Auth & Role-Based Access Control
- Organization Management (Departments, Teams, Employees)
- Project Management (hierarchy-filtered)
- Task & Contribution Tracking with Activity Log
- Client Management
- Requirement Tracking (client requirement → task traceability)
- Document Management (upload/download, hierarchy-protected)
- Work Updates
- Personal Work Progress Tracking (self-only task completion view per project)
- Bench Visibility (teams not currently staffed on an active project)
- AI-Powered Insights (team summaries, task descriptions, requirement-to-task breakdown via Claude)

> Note: AI features require a valid Anthropic API key with available credits.

## Running Locally

### Backend
cd mbackend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env

Fill in `.env` with your own values:
JWT_SECRET_KEY=your-secret-key-here
ANTHROPIC_API_KEY=your-anthropic-key-here

Then:
python -m app.seed
python -m uvicorn app.main:app --reload --reload-dir app

### Frontend
cd frontend
npm install
npm run dev

## Demo Accounts (password: password123)
- alice@worktrace.com → Admin
- bob@worktrace.com → Manager
- carol@worktrace.com → Team Lead
- dave@worktrace.com → Employee
- frank@worktrace.com → Employee (Growth team — no project access)

## Future Work
- Analytics dashboard
- Contribution insights
- Organizational knowledge graph
- Meeting management module