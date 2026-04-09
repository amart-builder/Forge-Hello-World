/* eslint-disable @typescript-eslint/no-explicit-any */
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";

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

function checkAuth(request: any): boolean {
  const authHeader = request.headers.get("Authorization");
  return Boolean(authHeader?.startsWith("Bearer "));
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

// Register OPTIONS for all API routes
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

http.route({
  path: "/api/triage",
  method: "POST",
  handler: httpAction(async (ctx: any, request: any) => {
    if (!checkAuth(request)) return errorResponse("Unauthorized", 401);

    let body: any;
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
      let contactId: string | undefined;
      let companyId: string | undefined;
      let autoCreatedContact = false;
      let autoCreatedCompany = false;

      if (item.senderEmail) {
        const existingContact = await ctx.runQuery(
          (ctx2: any) =>
            ctx2.db
              .query("contacts")
              .withIndex("by_email", (q: any) => q.eq("email", item.senderEmail))
              .first()
        );

        if (existingContact) {
          contactId = existingContact._id;
          companyId = existingContact.primaryCompanyId ?? undefined;
        } else {
          const domain = extractDomain(item.senderEmail);
          if (domain && !FREE_EMAIL_PROVIDERS.has(domain)) {
            const existingCompany = await ctx.runQuery(
              (ctx2: any) =>
                ctx2.db
                  .query("companies")
                  .withIndex("by_domain", (q: any) => q.eq("domain", domain))
                  .first()
            );

            if (existingCompany) {
              companyId = existingCompany._id;
            } else {
              const now = Date.now();
              companyId = await ctx.runMutation(
                (ctx2: any) =>
                  ctx2.db.insert("companies", {
                    name: domain.split(".")[0].replace(/^\w/, (c: string) => c.toUpperCase()),
                    domain,
                    tags: [],
                    notes: "",
                    sourceSystem: "email",
                    createdAt: now,
                    updatedAt: now,
                  })
              );
              autoCreatedCompany = true;
            }
          }

          const now = Date.now();
          contactId = await ctx.runMutation(
            (ctx2: any) =>
              ctx2.db.insert("contacts", {
                name: item.senderName || item.senderEmail,
                email: item.senderEmail,
                tier: "untiered",
                tags: [],
                notes: "",
                primaryCompanyId: companyId,
                sourceSystem: "email",
                createdAt: now,
                updatedAt: now,
              })
          );
          autoCreatedContact = true;
        }
      }

      await ctx.runMutation(
        (ctx2: any) =>
          ctx2.db.insert("emailItems", {
            threadId: item.threadId,
            messageId: item.messageId,
            senderName: item.senderName,
            senderEmail: item.senderEmail,
            subject: item.subject,
            summary: item.summary,
            context: item.context,
            recommendedAction: item.recommendedAction ?? "review",
            draftResponse: item.draftResponse,
            priority: item.priority ?? 3,
            status: "pending",
            contactId,
            companyId,
            triageSource: "cron",
            gmailThreadUrl: item.gmailThreadUrl,
            receivedAt: item.receivedAt,
            lastSyncedAt: Date.now(),
            autoCreatedContact,
            autoCreatedCompany,
            triageModel: item.triageModel,
            triageRunId: item.triageRunId,
            createdAt: Date.now(),
          })
      );
      created++;
    }

    if (body.triageSummary) {
      const now = Date.now();
      const existing = await ctx.runQuery(
        (ctx2: any) =>
          ctx2.db
            .query("appState")
            .withIndex("by_key", (q: any) => q.eq("key", "triage_summary"))
            .first()
      );
      if (existing) {
        await ctx.runMutation(
          (ctx2: any) => ctx2.db.patch(existing._id, { value: body.triageSummary, updatedAt: now })
        );
      } else {
        await ctx.runMutation(
          (ctx2: any) =>
            ctx2.db.insert("appState", { key: "triage_summary", value: body.triageSummary, updatedAt: now })
        );
      }
    }

    return jsonResponse({ success: true, created });
  }),
});

// ── POST /api/query (stub — no auth, browser-callable) ──

http.route({
  path: "/api/query",
  method: "POST",
  handler: httpAction(async (_ctx: any, request: any) => {
    let body: any;
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

http.route({
  path: "/api/contacts",
  method: "POST",
  handler: httpAction(async (ctx: any, request: any) => {
    if (!checkAuth(request)) return errorResponse("Unauthorized", 401);

    let body: any;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON body", 400);
    }

    if (!body.name || typeof body.name !== "string") {
      return errorResponse("Missing or invalid 'name' string", 400);
    }

    const now = Date.now();
    const id = await ctx.runMutation(
      (ctx2: any) =>
        ctx2.db.insert("contacts", {
          name: body.name,
          email: body.email ?? undefined,
          phone: body.phone ?? undefined,
          company: body.company ?? undefined,
          role: body.role ?? undefined,
          linkedin: body.linkedin ?? undefined,
          location: body.location ?? undefined,
          tier: body.tier ?? "C",
          tags: body.tags ?? [],
          howWeMet: body.how_we_met ?? body.howWeMet ?? undefined,
          notes: body.notes ?? "",
          sourceSystem: "manual",
          createdAt: now,
          updatedAt: now,
        })
    );

    return jsonResponse({ success: true, id });
  }),
});

// ── POST /api/companies — create company from external agent ──

http.route({
  path: "/api/companies",
  method: "POST",
  handler: httpAction(async (ctx: any, request: any) => {
    if (!checkAuth(request)) return errorResponse("Unauthorized", 401);

    let body: any;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON body", 400);
    }

    if (!body.name || typeof body.name !== "string") {
      return errorResponse("Missing or invalid 'name' string", 400);
    }

    const now = Date.now();
    const id = await ctx.runMutation(
      (ctx2: any) =>
        ctx2.db.insert("companies", {
          name: body.name,
          domain: body.domain ?? undefined,
          website: body.website ?? undefined,
          linkedin: body.linkedin ?? undefined,
          industry: body.industry ?? undefined,
          description: body.description ?? undefined,
          location: body.location ?? undefined,
          tags: body.tags ?? [],
          notes: body.notes ?? "",
          sourceSystem: "manual",
          createdAt: now,
          updatedAt: now,
        })
    );

    return jsonResponse({ success: true, id });
  }),
});

// ── GET /api/status — returns app state ──

http.route({
  path: "/api/status",
  method: "GET",
  handler: httpAction(async (ctx: any, request: any) => {
    if (!checkAuth(request)) return errorResponse("Unauthorized", 401);

    const allState = await ctx.runQuery(
      (ctx2: any) => ctx2.db.query("appState").collect()
    );

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
  handler: httpAction(async (_ctx: any, request: any) => {
    if (!checkAuth(request)) return errorResponse("Unauthorized", 401);

    let body: any;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON body", 400);
    }

    return jsonResponse({
      result: "Enrichment is a stub. Connect an enrichment provider (e.g. Clearbit, Apollo) to enable contact/company enrichment.",
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
  handler: httpAction(async (ctx: any, request: any) => {
    if (!checkAuth(request)) return errorResponse("Unauthorized", 401);

    // Gather counts
    const pendingEmails = await ctx.runQuery(
      (ctx2: any) =>
        ctx2.db
          .query("emailItems")
          .withIndex("by_status", (q: any) => q.eq("status", "pending"))
          .collect()
    );

    const highPriorityPending = pendingEmails.filter(
      (e: any) => e.priority <= 2
    );

    // Stale contacts: no interaction in last 30 days
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const allContacts = await ctx.runQuery(
      (ctx2: any) => ctx2.db.query("contacts").collect()
    );
    const staleContacts = allContacts.filter(
      (c: any) =>
        !c.lastInteractionAt || c.lastInteractionAt < thirtyDaysAgo
    );

    // Pipeline stats
    const allPipelines = await ctx.runQuery(
      (ctx2: any) => ctx2.db.query("pipelines").collect()
    );
    const allEntries = await ctx.runQuery(
      (ctx2: any) => ctx2.db.query("pipelineEntries").collect()
    );
    const pipelineStats = allPipelines.map((p: any) => ({
      id: p._id,
      name: p.name,
      totalEntries: allEntries.filter((e: any) => e.pipelineId === p._id).length,
    }));

    // Triage summary from appState
    const triageSummary = await ctx.runQuery(
      (ctx2: any) =>
        ctx2.db
          .query("appState")
          .withIndex("by_key", (q: any) => q.eq("key", "triage_summary"))
          .first()
    );

    return jsonResponse({
      generatedAt: new Date().toISOString(),
      counts: {
        pendingEmails: pendingEmails.length,
        highPriorityPending: highPriorityPending.length,
        totalContacts: allContacts.length,
        staleContacts: staleContacts.length,
      },
      pipelineStats,
      triageSummary: triageSummary?.value ?? null,
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
