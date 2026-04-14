import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";
import type { Id } from "./_generated/dataModel";

const http = httpRouter();

auth.addHttpRoutes(http);

// ── Shared helpers ──────────────────────────────────────

const JSON_HEADERS = { "Content-Type": "application/json" };
const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function jsonResponse(data: unknown, status = 200, cors = false) {
  return new Response(JSON.stringify(data), {
    status,
    headers: cors ? CORS_HEADERS : JSON_HEADERS,
  });
}

function errorResponse(message: string, status: number, cors = false) {
  return jsonResponse({ error: message }, status, cors);
}

/**
 * Validate a Bearer token against FORGE_API_SECRET.
 *
 * Returns true iff:
 *  - Authorization header is present and starts with "Bearer "
 *  - FORGE_API_SECRET env var is configured (fail-closed if not)
 *  - The provided token matches the secret exactly (constant-time compare)
 */
function checkAuth(request: Request): boolean {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return false;

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) return false;

  const secret = process.env.FORGE_API_SECRET;
  if (!secret) return false; // fail-closed: no secret configured = reject all

  // Constant-time comparison to avoid timing attacks
  if (token.length !== secret.length) return false;
  let diff = 0;
  for (let i = 0; i < token.length; i++) {
    diff |= token.charCodeAt(i) ^ secret.charCodeAt(i);
  }
  return diff === 0;
}

// ── Free email providers (don't create companies for these) ──
const FREE_EMAIL_PROVIDERS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "aol.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "protonmail.com",
  "proton.me",
  "mail.com",
  "zoho.com",
  "yandex.com",
  "tutanota.com",
  "fastmail.com",
]);

function extractDomain(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at < 0) return null;
  return email.slice(at + 1).toLowerCase();
}

// ── CORS preflight handler ──────────────────────────────

const corsPreflightHandler = httpAction(async () => {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
});

const apiPaths = [
  "/api/triage",
  "/api/query",
  "/api/contacts",
  "/api/companies",
  "/api/status",
  "/api/enrich",
  "/api/morning-brief",
];
for (const path of apiPaths) {
  http.route({ path, method: "OPTIONS", handler: corsPreflightHandler });
}

// ── POST /api/triage ────────────────────────────────────

interface TriageItem {
  threadId?: string;
  messageId?: string;
  senderName?: string;
  senderEmail?: string;
  subject?: string;
  summary?: string;
  context?: string;
  recommendedAction?: string;
  draftResponse?: string;
  priority?: number;
  gmailThreadUrl?: string;
  receivedAt?: number;
  triageModel?: string;
  triageRunId?: string;
}

http.route({
  path: "/api/triage",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!checkAuth(request)) return errorResponse("Unauthorized", 401);

    let body: { items?: TriageItem[]; triageSummary?: string };
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON body", 400);
    }

    if (!body.items || !Array.isArray(body.items)) {
      return errorResponse("Missing or invalid 'items' array", 400);
    }

    let created = 0;

    for (const item of body.items) {
      let contactId: Id<"contacts"> | undefined;
      let companyId: Id<"companies"> | undefined;
      let autoCreatedContact = false;
      let autoCreatedCompany = false;

      if (item.senderEmail) {
        const existingContact = await ctx.runQuery(
          internal.httpHelpers.getContactByEmail,
          { email: item.senderEmail }
        );

        if (existingContact) {
          contactId = existingContact._id;
          companyId = existingContact.primaryCompanyId ?? undefined;
        } else {
          const domain = extractDomain(item.senderEmail);
          if (domain && !FREE_EMAIL_PROVIDERS.has(domain)) {
            const existingCompany = await ctx.runQuery(
              internal.httpHelpers.getCompanyByDomain,
              { domain }
            );

            if (existingCompany) {
              companyId = existingCompany._id;
            } else {
              companyId = await ctx.runMutation(
                internal.httpHelpers.createCompanyFromTriage,
                { domain }
              );
              autoCreatedCompany = true;
            }
          }

          contactId = await ctx.runMutation(
            internal.httpHelpers.createContactFromTriage,
            {
              name: item.senderName || item.senderEmail,
              email: item.senderEmail,
              primaryCompanyId: companyId,
            }
          );
          autoCreatedContact = true;
        }
      }

      await ctx.runMutation(internal.httpHelpers.createEmailItem, {
        threadId: item.threadId,
        messageId: item.messageId,
        senderName: item.senderName,
        senderEmail: item.senderEmail,
        subject: item.subject,
        summary: item.summary,
        context: item.context,
        recommendedAction: item.recommendedAction,
        draftResponse: item.draftResponse,
        priority: item.priority,
        contactId,
        companyId,
        gmailThreadUrl: item.gmailThreadUrl,
        receivedAt: item.receivedAt,
        autoCreatedContact,
        autoCreatedCompany,
        triageModel: item.triageModel,
        triageRunId: item.triageRunId,
      });
      created++;
    }

    if (body.triageSummary) {
      await ctx.runMutation(internal.httpHelpers.setAppState, {
        key: "triage_summary",
        value: body.triageSummary,
      });
    }

    return jsonResponse({ success: true, created });
  }),
});

// ── POST /api/query (stub — no auth, browser-callable) ──

http.route({
  path: "/api/query",
  method: "POST",
  handler: httpAction(async (_ctx, request) => {
    let body: { query?: string };
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON body", 400, true);
    }

    if (!body.query || typeof body.query !== "string") {
      return errorResponse("Missing or invalid 'query' string", 400, true);
    }

    return jsonResponse(
      {
        result: `Query received: "${body.query}". Natural language query processing requires an AI agent integration (OpenClaw). This endpoint is a stub — connect the agent to enable CRM queries.`,
        data: null,
      },
      200,
      true
    );
  }),
});

// ── POST /api/contacts — create contact from external agent ──

interface AgentContactBody {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  role?: string;
  linkedin?: string;
  location?: string;
  tier?: string;
  tags?: string[];
  howWeMet?: string;
  how_we_met?: string;
  notes?: string;
}

http.route({
  path: "/api/contacts",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!checkAuth(request)) return errorResponse("Unauthorized", 401);

    let body: AgentContactBody;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON body", 400);
    }

    if (!body.name || typeof body.name !== "string") {
      return errorResponse("Missing or invalid 'name' string", 400);
    }

    const id = await ctx.runMutation(
      internal.httpHelpers.createContactFromAgent,
      {
        name: body.name,
        email: body.email,
        phone: body.phone,
        company: body.company,
        role: body.role,
        linkedin: body.linkedin,
        location: body.location,
        tier: body.tier,
        tags: body.tags,
        howWeMet: body.how_we_met ?? body.howWeMet,
        notes: body.notes,
      }
    );

    return jsonResponse({ success: true, id });
  }),
});

// ── POST /api/companies — create company from external agent ──

interface AgentCompanyBody {
  name?: string;
  domain?: string;
  website?: string;
  linkedin?: string;
  industry?: string;
  description?: string;
  location?: string;
  tags?: string[];
  notes?: string;
}

http.route({
  path: "/api/companies",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!checkAuth(request)) return errorResponse("Unauthorized", 401);

    let body: AgentCompanyBody;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON body", 400);
    }

    if (!body.name || typeof body.name !== "string") {
      return errorResponse("Missing or invalid 'name' string", 400);
    }

    const id = await ctx.runMutation(
      internal.httpHelpers.createCompanyFromAgent,
      {
        name: body.name,
        domain: body.domain,
        website: body.website,
        linkedin: body.linkedin,
        industry: body.industry,
        description: body.description,
        location: body.location,
        tags: body.tags,
        notes: body.notes,
      }
    );

    return jsonResponse({ success: true, id });
  }),
});

// ── GET /api/status — returns app state ──

http.route({
  path: "/api/status",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    if (!checkAuth(request)) return errorResponse("Unauthorized", 401);

    const allState = await ctx.runQuery(internal.httpHelpers.getAllAppState, {});

    const stateMap: Record<string, string | null> = {};
    for (const entry of allState) {
      stateMap[entry.key] = entry.value ?? null;
    }

    return jsonResponse({ status: "ok", state: stateMap });
  }),
});

// ── POST /api/enrich — stub enrichment endpoint ──

http.route({
  path: "/api/enrich",
  method: "POST",
  handler: httpAction(async (_ctx, request) => {
    if (!checkAuth(request)) return errorResponse("Unauthorized", 401);

    let body: { contactId?: string; companyId?: string };
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON body", 400);
    }

    return jsonResponse({
      result:
        "Enrichment is a stub. Connect an enrichment provider (e.g. Clearbit, Apollo) to enable contact/company enrichment.",
      contactId: body.contactId ?? null,
      companyId: body.companyId ?? null,
      enriched: false,
    });
  }),
});

// ── GET /api/morning-brief — daily briefing snapshot ──

http.route({
  path: "/api/morning-brief",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    if (!checkAuth(request)) return errorResponse("Unauthorized", 401);

    const data = await ctx.runQuery(
      internal.httpHelpers.getMorningBriefData,
      {}
    );

    const highPriorityPending = data.pendingEmails.filter(
      (e: { priority: number }) => e.priority <= 2
    );

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const staleContacts = data.contacts.filter(
      (c: { lastInteractionAt: number | null }) =>
        c.lastInteractionAt === null || c.lastInteractionAt < thirtyDaysAgo
    );

    const pipelineStats = data.pipelines.map(
      (p: { _id: string; name: string }) => ({
        id: p._id,
        name: p.name,
        totalEntries: data.entries.filter(
          (e: { pipelineId: string }) => e.pipelineId === p._id
        ).length,
      })
    );

    return jsonResponse({
      generatedAt: new Date().toISOString(),
      counts: {
        pendingEmails: data.pendingEmails.length,
        highPriorityPending: highPriorityPending.length,
        totalContacts: data.contacts.length,
        staleContacts: staleContacts.length,
      },
      pipelineStats,
      triageSummary: data.triageSummary,
      recommendations: [
        highPriorityPending.length > 0
          ? `You have ${highPriorityPending.length} high-priority email${highPriorityPending.length !== 1 ? "s" : ""} awaiting action.`
          : "No high-priority emails pending.",
        staleContacts.length > 0
          ? `${staleContacts.length} contact${staleContacts.length !== 1 ? "s" : ""} haven't been reached in 30+ days.`
          : "All contacts have recent interactions.",
      ],
    });
  }),
});

export default http;
