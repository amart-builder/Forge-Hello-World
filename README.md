# Forge v2

Forge is the operational surface for Edge Fund — tasks, email triage, and CRM in a single app. Built with Next.js 16, Convex, and Tailwind CSS 4.

## Tech Stack

- **Frontend:** Next.js 16.2 (App Router) + React 19 + Tailwind CSS 4
- **Backend:** Convex (real-time database, mutations, queries, HTTP actions)
- **Auth:** Convex Auth (`@convex-dev/auth`)
- **Drag & Drop:** dnd-kit (tasks kanban + pipeline boards)
- **Charts:** Recharts (pipeline analytics)

## Features

### Tasks (Kanban)
- Drag-and-drop kanban board with custom columns
- Task detail modal with priority, due date, tags, description
- Column creation, renaming, reordering, deletion (with confirmation)

### Email Triage
- AI-powered email triage via `/api/triage` HTTP endpoint
- Action cards with draft responses, reply/archive/follow-up/delegate actions
- Summary card with triage statistics
- Collapsible action log with filtering
- Recommended real-world path: connect OpenClaw to the user's Gmail via Google Cloud Console, then have OpenClaw push triaged emails into Forge.
- Forge itself does not poll Gmail yet. OpenClaw or another external agent handles inbox access and sends results to `/api/triage`.

### CRM
- **Contacts:** Master list with search, tier/status/tag filters, detail panel with activity timeline, meeting notes, inline editing
- **Companies:** Company directory with industry/tag filters, linked contacts, domain tracking
- **Pipelines:** Visual pipeline boards with drag-and-drop stage management, contact cards
- **Analytics:** Pipeline breakdown charts per stage

### Import
- **CSV Import:** RFC 4180-compliant parser with header alias mapping, preview table, deduplication
- **Attio Import:** Direct Attio v2 API integration, record normalization, preview before import

### HTTP API
- `POST /api/triage` — AI email triage endpoint
- `POST /api/query` — Natural language query (no auth, CORS enabled)
- `POST /api/contacts` — Create contact from external agent
- `POST /api/companies` — Create company from external agent
- `GET /api/status` — App state overview
- `POST /api/enrich` — Contact enrichment (stub)
- `GET /api/morning-brief` — Daily briefing with counts, pipeline stats, recommendations

### System
- Global command palette (Cmd+K) with contact/company deep-linking
- Toast notification system for user-visible error feedback
- Full accessibility: ARIA labels, keyboard navigation, focus management

## Setup

### Prerequisites
- Node.js 20+
- A Convex account

### Environment Variables

Forge uses two env layers:

1. **Local Next.js env** in `.env.local`
2. **Convex backend env** set with `npx convex env set ...`

On a fresh install, `npx convex dev` provisions the dev deployment and writes these local values into `.env.local` automatically:

```
CONVEX_DEPLOYMENT=your-convex-deployment
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=https://your-project.convex.site
```

Optional local env:

```
NEXT_PUBLIC_ATTIO_API_KEY=your-attio-api-key
```

Required Convex backend env:

```bash
npx convex env set AUTH_DOMAIN "http://localhost:3000"
npx convex env set FORGE_API_SECRET "your-api-secret-for-http-endpoints"
```

### Install & Run

```bash
npm install

# First run: provisions Convex and writes .env.local
npx convex dev

# If Convex stops and says AUTH_DOMAIN is missing, set it once:
npx convex env set AUTH_DOMAIN "http://localhost:3000"

# Required for authenticated HTTP endpoints like /api/triage
npx convex env set FORGE_API_SECRET "your-api-secret-for-http-endpoints"

# Start Convex again if needed, then run the frontend in another terminal
npx convex dev
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

## Onboarding a User

Setting up Forge as a dev environment (above) gets the app running. Turning it into a real working instance — Gmail connected, contacts imported, pipelines created, API secret configured — is covered in separate onboarding guides designed for an agent to walk the user through:

- **[`SETUP.md`](./SETUP.md)** — Full onboarding guide: status of every integration, recommended setup order, what to ask the user at each step, env var reference
- **[`SETUP_GMAIL.md`](./SETUP_GMAIL.md)** — End-state spec for Gmail ingestion (OAuth via Google Cloud Console, scheduled pulling, LLM classification, end-to-end verification). Written so the agent owns the implementation within a fixed set of constraints

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Redirects to /tasks
│   ├── tasks/              # Kanban board
│   ├── email/              # Email triage
│   └── crm/
│       ├── contacts/       # Contact management
│       ├── companies/      # Company directory
│       ├── pipelines/      # Pipeline boards
│       └── analytics/      # Pipeline analytics
├── components/
│   ├── ui/                 # Shared UI (Button, Badge, Modal, Toast, EmptyState, etc.)
│   ├── layout/             # TabNav, CrmSubNav, CommandPalette
│   ├── tasks/              # KanbanBoard, Column, TaskCard, TaskDetailModal
│   ├── email/              # SummaryCard, ActionCard, ActionLog
│   └── crm/
│       ├── contacts/       # ContactList, ContactDetail, ContactForm
│       ├── companies/      # CompanyList, CompanyDetail, CompanyForm
│       ├── pipelines/      # PipelineBoard, StageColumn, PipelineCard, etc.
│       ├── analytics/      # PipelineBreakdownChart
│       └── import/         # ImportModal, CsvImporter, AttioImporter
└── lib/
    └── utils.ts            # cn(), relativeDate(), formatDate()

convex/
├── schema.ts               # Database schema
├── auth.ts                 # Authentication
├── http.ts                 # HTTP API endpoints + CORS
├── tasks.ts, columns.ts    # Task mutations/queries
├── emails.ts, emailActions.ts  # Email mutations/queries
├── contacts.ts, companies.ts   # CRM mutations/queries
├── pipelines.ts, pipelineStages.ts, pipelineEntries.ts
├── contactActivities.ts, meetingNotes.ts
├── importers.ts, importerDedupe.ts, importerTypes.ts
├── appState.ts             # Key-value app state
└── init.ts                 # Seed data
```
