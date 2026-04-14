# SETUP_GMAIL.md — Gmail Ingestion Setup

**Audience:** an agent (OpenClaw, Claude, or equivalent) walking a user through connecting their Gmail account to Forge so emails flow in automatically.

**Philosophy:** this document defines the *end state* and the *non-negotiable constraints*. It does **not** prescribe a step-by-step implementation. You, the agent running this setup, own the implementation decision — because Google Cloud Console UI changes, OAuth policies evolve, and available tooling shifts faster than this doc. Use current, up-to-date information to pick the best path to the end state.

---

## End State

When this setup is complete, the user experiences:

1. **New emails arriving at their Gmail** appear in Forge's Email tab automatically — no manual action required
2. **Each email in Forge is pre-triaged:** summary, context, priority (1–5), recommended action (reply / archive / follow_up / delegate / flag / review), and a draft response where appropriate are all populated before the email ever appears in the UI
3. **New mail appears in Forge within 5–15 minutes** of hitting Gmail — not instantaneous (that's over-engineering), but fresh enough to be useful
4. **The user wrote no code and ran no commands themselves.** The agent did the heavy lifting; the user clicked "Allow" on an OAuth consent screen, nothing more
5. **Access is revocable.** The user can disconnect Gmail at any time by revoking the OAuth grant in their Google account, and Forge handles that gracefully (stops polling, doesn't crash, surfaces the disconnection to the user)
6. **Contacts and companies auto-populate** from email senders (this is already wired in `/api/triage` — sender → contact lookup or creation, domain → company lookup or creation)

---

## Non-Negotiable Constraints

These are the rules. The agent picks the path, but the path must satisfy every one of these:

### Security & Credentials

- **OAuth 2.0 only.** Do not use App Passwords or IMAP credentials. OAuth is the only mechanism that supports proper scoping, user-visible consent, and clean revocation.
- **Refresh tokens live in Convex env** (set via `npx convex env set`), never in `.env.local`, never in the frontend bundle, never committed to git. The Convex backend reads them at runtime via `process.env`.
- **Minimum scope.** Request only what Forge needs. Typically `gmail.readonly` or `gmail.modify` — never broader scopes "just in case."
- **Per-user isolation.** If the same Forge instance will eventually serve multiple users, the token storage must be keyed per user. Document how this works even for single-user installs so multi-user expansion is possible later.
- **The `FORGE_API_SECRET` used by `/api/triage` is separate from the Gmail OAuth token** and should not be conflated. One is for authenticating the ingestion pipeline itself; the other is for accessing Google.

### Reliability

- **Runs unattended.** The user closes their laptop, goes to sleep, wakes up — new emails have been processed. No human in the loop to keep it alive.
- **Dedup on `Gmail messageId`.** Re-runs, retries, and cold starts must not create duplicate email items in Forge. The existing `/api/triage` endpoint accepts `messageId` — use it.
- **Classification failure does not lose data.** If the LLM call that produces `summary`/`priority`/`recommendedAction` fails, the raw Gmail message must still be preserved somewhere so it can be retried. Never silently drop an email because classification errored.
- **Rate limiting awareness.** Gmail API has quotas; Anthropic (or whichever LLM) has rate limits. The implementation must handle both gracefully — back off, queue, don't crash.

### Data Flow

- **Classification happens before insertion to `/api/triage`.** The endpoint is designed to receive already-classified emails. Do not insert raw Gmail messages and "classify later" — that inverts the design.
- **Use `/api/triage` for insertion.** Do not write directly to the `emailItems` table from the ingestion pipeline; the HTTP endpoint handles contact/company resolution, auto-creation, and auth. Going around it creates drift.
- **Field mapping to the shipped API:** `items[*].senderEmail`, `senderName`, `subject`, `summary`, `context`, `priority`, `recommendedAction`, `draftResponse`, `messageId`, `threadId`, `gmailThreadUrl`, `receivedAt` (ms timestamp), optionally `triageModel` and `triageRunId`. Full shape documented in `SETUP.md`.

### User Experience

- **Disconnect path must exist.** The user (or agent) must have a way to revoke access. At minimum: a documented command to unset the refresh token from Convex env and a note on revoking at `myaccount.google.com/permissions`. Ideally: a UI button in Forge that does both.
- **Setup is documented per install.** After the agent completes setup, write a short summary file (e.g., `setup-log-[date].md`) in a known location recording: which Gmail account was connected, which Google Cloud project was created, which scopes were granted, where the refresh token lives, how often polling runs, which LLM + model is used for classification. The next agent that touches this install will need that context.

---

## Recommended Path (Illustrative — Not Prescriptive)

This is **one** reasonable implementation. Agents should feel free to choose differently if better tooling exists by the time you read this.

**Sketch:**

1. **Google Cloud project** — create a new project in Google Cloud Console, enable the Gmail API, configure the OAuth consent screen (external user type, scopes: `gmail.readonly` or `gmail.modify`), create OAuth 2.0 Client ID credentials (type: Web application), set redirect URI to a known Convex HTTP action endpoint.

2. **OAuth flow** — build (or have the user run) a one-time auth flow that gets an authorization code and exchanges it for a refresh token. Store the refresh token via `npx convex env set GMAIL_REFRESH_TOKEN "..."` (and similarly for `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`).

3. **Scheduled Convex action** — write a new Convex `action` (not mutation — actions can make external HTTP calls) that:
   - Reads the stored refresh token from `process.env`
   - Exchanges it for an access token
   - Queries the Gmail API for messages since the last run (store `lastSyncedAt` in `appState`)
   - For each new message, calls an LLM (Anthropic or OpenAI) to produce `summary`/`priority`/`recommendedAction`/`draftResponse`
   - POSTs the classified items to `/api/triage` with the `FORGE_API_SECRET` Bearer token

4. **Cron it** — use Convex's cron.ts (`crons.interval`) to run the action every 5–10 minutes.

5. **Classification model + API key** — request user's LLM API key (Anthropic most likely), store via `npx convex env set ANTHROPIC_API_KEY "..."`. Use a small/fast model (Haiku-class) with a tight prompt that returns structured JSON.

**Alternative paths worth considering:**

- **OpenClaw scheduled task** rather than Convex cron. Pros: OpenClaw already has a scheduling mechanism and may already have Gmail + LLM plumbing. Cons: couples Forge ingestion to OpenClaw being up.
- **Gmail push notifications (Pub/Sub)** rather than polling. Pros: near-real-time. Cons: requires more Google Cloud setup (Pub/Sub topic, subscription, webhook endpoint), more moving parts.
- **Third-party intermediary** (Zapier, Make, n8n). Pros: minimal code. Cons: yet another service to monitor, usually has a per-run cost at scale.

**The agent decides.** Pick what's right given current tooling, the user's technical comfort, and what already exists in their setup.

---

## What to Ask the User

Before starting setup, the agent should gather:

1. **Which Gmail account?** (`alex@edge-fund.io` vs personal vs both)
2. **Google Workspace or personal Gmail?** (affects OAuth consent screen requirements — Workspace admins may need to pre-approve the app)
3. **Which emails should flow into Forge?**
   - All mail
   - Only inbox (not spam/promotions)
   - Only specific labels (e.g., "Deal Flow", "LPs")
   - Only emails from known contacts (CRM-gated)
   The choice affects Gmail API query parameters (`q=` and `labelIds=`).
4. **How aggressive should triage be?**
   - Every email gets classified
   - Only emails marked "unread" or "starred"
   - Only emails not already archived
5. **Which LLM for classification?** Anthropic (Haiku recommended for cost/speed)? OpenAI? Something already used elsewhere in the user's stack?
6. **Does the user have an LLM API key they want to use?** If not, help them get one.
7. **Is this single-user or multi-user down the road?** Single-user simplifies a lot (one token, one env var). Multi-user needs per-user token storage from day one.

---

## Verification Before Declaring Done

The agent must verify — not just build:

1. **End-to-end test:** Send a test email from another account to the connected Gmail. Within the expected poll interval, confirm:
   - The email appears in Forge's Email tab
   - `summary`, `priority`, `recommendedAction` are all populated (not defaults)
   - `senderEmail` and `senderName` are correct
   - A corresponding contact (and company, if applicable) was created or matched
2. **Dedup check:** Trigger the ingestion action twice in a row. Confirm no duplicate email items appear for the same `messageId`.
3. **Classification failure handling:** Temporarily break the LLM call (bad API key, or inject a synthetic error). Confirm the raw email is preserved (somewhere — logs, a retry queue, a flagged record) and not silently dropped.
4. **Disconnect:** Unset the refresh token (`npx convex env unset GMAIL_REFRESH_TOKEN`). Confirm the next scheduled run fails gracefully (no crash, surfaces a clear error) rather than retrying forever.
5. **Setup log written:** The per-install setup log exists and captures everything the next agent would need to understand/repair this setup.

If any of these fail, setup is not done. Fix and re-verify.

---

## Future Work (Not Required for v1)

These are nice-to-haves that future builds can add:

- **Push notifications via Pub/Sub** instead of polling — near-real-time instead of 5–15 min delay
- **Reply sending** — Forge currently stores draft responses; a follow-up build could send them via Gmail API when the user hits "Approve & Send"
- **Calendar sync** — same OAuth grant can cover Google Calendar; meeting notes and contact interaction history could auto-populate
- **Multi-account support** — one Forge install, multiple Gmail inboxes

---

## Why This Doc Exists

The Forge v2 build shipped `/api/triage` as a receive-only endpoint, intentionally decoupling ingestion from the app itself. That decoupling is still the right architecture — it means the ingestion pipeline can be swapped (Gmail today, Outlook tomorrow, a unified Unified inbox the day after) without touching Forge. But the user-facing product promise is "Forge triages your email," not "Forge accepts HTTP POSTs of pre-triaged emails." This doc bridges the gap between the architecture and the promise: how an agent turns a bare Forge install into a real user-visible email triage system.
