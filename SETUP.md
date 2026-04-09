# Forge v2 — Onboarding Guide

This guide walks an agent (or user) through setting up Forge for real use. It covers what works out of the box, what needs connecting, and the recommended onboarding order.

**Live instance:** https://forge-hello-world.vercel.app
**Convex backend:** https://precious-bird-649.convex.cloud
**Repo:** https://github.com/amart-builder/Forge-Hello-World

---

## What Works Right Now vs What Needs Setup

| Feature | Status | What's Needed |
|---------|--------|---------------|
| Tasks (Kanban) | **Ready** | Nothing — works immediately with 3 default columns |
| CRM (Contacts) | **Ready** | Import data (CSV or Attio) or create contacts manually |
| CRM (Companies) | **Ready** | Auto-created from email domains during triage, or manual |
| CRM (Pipelines) | **Ready** | Create a pipeline and add contacts to it |
| CRM (Analytics) | **Ready** | Shows charts once pipelines have entries |
| CSV Import | **Ready** | Export a CSV from your current CRM and upload it |
| Attio Import | **Ready** | Needs an Attio API key |
| Email Triage UI | **Ready** | Needs emails flowing in (see Step 3) |
| Email Ingestion | **Needs setup** | No Gmail integration yet — needs external agent or webhook |
| Authentication | **Not configured** | No OAuth providers — app is currently public |
| Calendar Sync | **Not built** | Meeting notes are manual entry only |
| Contact Enrichment | **Stub** | `/api/enrich` returns placeholder |
| Natural Language Query | **Stub** | `/api/query` returns placeholder |
| Morning Brief | **Ready** | Works once data exists — returns zeros on empty DB |

---

## Recommended Onboarding Order

### Step 1: Import Existing CRM Data

This is the highest-value first step — get real contacts and companies into Forge so the CRM is immediately useful.

**Option A: CSV Import (works for any CRM)**
1. Export contacts from your current CRM as CSV
2. Go to `/crm/contacts` → click "Import" in the empty state
3. Select the "CSV" tab
4. Paste or upload the CSV content
5. Preview the mapped data, then import
6. The importer handles header aliases automatically (e.g., `full_name` → `name`, `company_name` → `company`)

**Option B: Attio Direct Import**
1. Get your Attio API key from https://app.attio.com/settings/api-keys
2. Set `NEXT_PUBLIC_ATTIO_API_KEY` in Vercel env vars (or enter it in the import modal)
3. Go to `/crm/contacts` → Import → "Attio" tab
4. Click "Fetch from Attio" → preview → import

**Option C: Programmatic Import via API**
For agents importing contacts on the user's behalf:
```bash
curl -X POST https://precious-bird-649.convex.site/api/contacts \
  -H "Authorization: Bearer $FORGE_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane Doe", "email": "jane@example.com", "company": "Acme Corp"}'
```

**What to ask the user:**
- "What CRM do you currently use?" (Attio, HubSpot, Salesforce, spreadsheet, nothing?)
- "Can you export your contacts as a CSV?"
- "Do you have an Attio API key?"

### Step 2: Set Up Authentication (Recommended Before Sharing)

The app currently has no auth — anyone with the URL can access everything. This is fine for testing but needs to be configured before real use.

**To add Google OAuth:**
1. Create OAuth credentials in Google Cloud Console (https://console.cloud.google.com/apis/credentials)
   - Application type: Web application
   - Authorized redirect URI: `https://precious-bird-649.convex.site/api/auth/callback/google`
2. Set env vars in Convex:
   ```bash
   npx convex env set AUTH_GOOGLE_CLIENT_ID "your-client-id"
   npx convex env set AUTH_GOOGLE_CLIENT_SECRET "your-client-secret"
   ```
3. Update `convex/auth.ts` to add Google as a provider:
   ```typescript
   import Google from "@auth/core/providers/google";
   export const { auth, signIn, signOut, store } = convexAuth({
     providers: [Google],
   });
   ```
4. Add a login page or auth guard to `layout.tsx`

**What to ask the user:**
- "Do you want Google sign-in, or a different provider?"
- "Should the app require login, or is it fine as-is for now?"

### Step 3: Connect Email (Requires External Agent)

Forge's email triage UI is fully functional, but emails need to be *pushed* into Forge via the `/api/triage` endpoint. There is no built-in Gmail polling.

**Architecture:** An external agent (OpenClaw, cron job, or Zapier) reads Gmail → classifies emails → POSTs to Forge's triage endpoint.

**The triage endpoint expects this shape:**
```json
POST /api/triage
Authorization: Bearer $FORGE_API_SECRET
Content-Type: application/json

{
  "items": [
    {
      "subject": "Partnership proposal",
      "sender": "jane@acme.com",
      "receivedAt": "2026-04-09T10:30:00Z",
      "snippet": "First 200 chars of the email body...",
      "summary": "Jane from Acme wants to discuss a partnership.",
      "context": "Acme is a portfolio company, Jane is the CEO.",
      "recommendedAction": "reply",
      "draftResponse": "Hi Jane, thanks for reaching out...",
      "priority": 1,
      "labels": ["partnership", "portfolio"]
    }
  ]
}
```

**What to ask the user:**
- "Do you use Gmail? What Google Workspace account?"
- "How often should emails be checked? Every 5 minutes? Every hour?"
- "Should all emails be triaged, or only from specific senders/labels?"

**To implement:** This requires building a Gmail → Forge integration, likely as:
- A scheduled OpenClaw task that reads Gmail API and calls `/api/triage`
- Or a Google Apps Script that triggers on new emails
- Or a Zapier/Make.com workflow

The `FORGE_API_SECRET` env var must be set in Convex for the Bearer token auth to work.

### Step 4: Create Initial Pipelines

Pipelines are the deal/relationship tracking system. They're empty on fresh deploy.

1. Go to `/crm/pipelines`
2. Click "New Pipeline"
3. Name it (e.g., "Deal Flow", "LP Outreach", "Hiring")
4. Add stages (e.g., "Intro → Meeting → Due Diligence → Term Sheet → Closed")
5. Add contacts from your CRM to the pipeline

**What to ask the user:**
- "What pipelines do you need? Deal flow? LP fundraising? Hiring?"
- "What stages does each pipeline have?"

### Step 5: Set the API Secret

The HTTP API endpoints (`/api/triage`, `/api/contacts`, `/api/companies`, `/api/status`, `/api/morning-brief`) require Bearer token authentication.

```bash
# Set in Convex
npx convex env set FORGE_API_SECRET "your-secret-here"
```

Use a strong random string. This is what external agents use to authenticate.

### Step 6: Configure the Morning Brief (Optional)

The morning brief endpoint returns a JSON summary of your inbox, contacts, and pipelines. It works automatically once data exists, but to make it useful:

1. Set up email ingestion (Step 3) so there are pending emails to report on
2. Import contacts (Step 1) so stale contact detection works
3. Create pipelines (Step 4) so pipeline stats are populated

**To fetch the brief:**
```bash
curl -H "Authorization: Bearer $FORGE_API_SECRET" \
  https://precious-bird-649.convex.site/api/morning-brief
```

This can be called by an agent daily to generate a morning summary.

---

## Environment Variables Reference

### Vercel (Frontend)
| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_CONVEX_URL` | Yes | Convex cloud URL |
| `CONVEX_DEPLOYMENT` | Yes | Convex deployment name |
| `NEXT_PUBLIC_ATTIO_API_KEY` | No | Pre-fills Attio import form |

### Convex (Backend)
| Variable | Required | Description |
|----------|----------|-------------|
| `FORGE_API_SECRET` | Yes (for API) | Bearer token for HTTP endpoints |
| `AUTH_DOMAIN` | Yes (for auth) | Your Vercel domain (e.g., `https://forge-hello-world.vercel.app`) |
| `AUTH_GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `AUTH_GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |

---

## Not Yet Built (Future Work)

These features are referenced in the UI or spec but not implemented:

- **Gmail auto-fetch** — No polling or webhook. Emails must be pushed via `/api/triage`.
- **Google Calendar sync** — Meeting notes are manual CRUD. No calendar API integration.
- **Auto-generated activity timeline** — Contact activities are manual inserts. Email/calendar events don't auto-create activities.
- **Contact enrichment** — `/api/enrich` is a stub. Would need Clearbit, Apollo, or similar.
- **Natural language query** — `/api/query` is a stub. Would need an LLM integration.
- **Scheduled morning brief** — The endpoint exists but nothing calls it on a schedule.
- **Auth guards** — No login page, no route protection. App is currently public access.
