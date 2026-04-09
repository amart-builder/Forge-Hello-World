import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  // ── Tasks ──────────────────────────────────────────────

  columns: defineTable({
    name: v.string(),
    position: v.float64(),
    createdAt: v.float64(),
  }),

  tasks: defineTable({
    columnId: v.id("columns"),
    title: v.string(),
    description: v.string(),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high")
    ),
    dueDate: v.optional(v.string()),
    tags: v.array(v.string()),
    position: v.float64(),
    createdAt: v.float64(),
    updatedAt: v.float64(),
  }).index("by_column", ["columnId"]),

  // ── Email ──────────────────────────────────────────────

  emailItems: defineTable({
    threadId: v.optional(v.string()),
    messageId: v.optional(v.string()),
    senderName: v.optional(v.string()),
    senderEmail: v.optional(v.string()),
    subject: v.optional(v.string()),
    summary: v.optional(v.string()),
    context: v.optional(v.string()),
    recommendedAction: v.union(
      v.literal("reply"),
      v.literal("archive"),
      v.literal("follow_up"),
      v.literal("delegate"),
      v.literal("flag"),
      v.literal("review")
    ),
    draftResponse: v.optional(v.string()),
    priority: v.float64(),
    status: v.union(
      v.literal("pending"),
      v.literal("actioned"),
      v.literal("dismissed")
    ),
    actionedAt: v.optional(v.float64()),
    createdAt: v.float64(),
    contactId: v.optional(v.id("contacts")),
    companyId: v.optional(v.id("companies")),
    triageSource: v.optional(
      v.union(
        v.literal("cron"),
        v.literal("manual"),
        v.literal("import")
      )
    ),
    gmailThreadUrl: v.optional(v.string()),
    receivedAt: v.optional(v.float64()),
    lastSyncedAt: v.optional(v.float64()),
    autoCreatedContact: v.optional(v.boolean()),
    autoCreatedCompany: v.optional(v.boolean()),
    triageModel: v.optional(v.string()),
    triageRunId: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_contact", ["contactId"])
    .index("by_company", ["companyId"])
    .index("by_sender_email", ["senderEmail"]),

  emailActions: defineTable({
    emailItemId: v.id("emailItems"),
    actionType: v.string(),
    description: v.optional(v.string()),
    createdAt: v.float64(),
    contactId: v.optional(v.id("contacts")),
    companyId: v.optional(v.id("companies")),
    performedBy: v.optional(
      v.union(
        v.literal("user"),
        v.literal("agent"),
        v.literal("system")
      )
    ),
    metadata: v.optional(v.string()),
  })
    .index("by_email", ["emailItemId"])
    .index("by_contact", ["contactId"])
    .index("by_company", ["companyId"]),

  // ── CRM: Companies ────────────────────────────────────

  companies: defineTable({
    name: v.string(),
    domain: v.optional(v.string()),
    website: v.optional(v.string()),
    linkedin: v.optional(v.string()),
    industry: v.optional(v.string()),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    tags: v.array(v.string()),
    notes: v.string(),
    ownerContactId: v.optional(v.id("contacts")),
    lastInteractionAt: v.optional(v.float64()),
    createdAt: v.float64(),
    updatedAt: v.float64(),
    sourceSystem: v.optional(
      v.union(
        v.literal("attio"),
        v.literal("csv"),
        v.literal("supabase"),
        v.literal("manual"),
        v.literal("email")
      )
    ),
    sourceId: v.optional(v.string()),
    sourcePayload: v.optional(v.string()),
  })
    .index("by_name", ["name"])
    .index("by_domain", ["domain"])
    .index("by_source_system_source_id", ["sourceSystem", "sourceId"]),

  // ── CRM: Contacts ─────────────────────────────────────

  contacts: defineTable({
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    primaryCompanyId: v.optional(v.id("companies")),
    companyNameCached: v.optional(v.string()),
    role: v.optional(v.string()),
    linkedin: v.optional(v.string()),
    location: v.optional(v.string()),
    tier: v.string(),
    tags: v.array(v.string()),
    howWeMet: v.optional(v.string()),
    notes: v.string(),
    lastContactDate: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("lead"),
        v.literal("active"),
        v.literal("warm"),
        v.literal("cold"),
        v.literal("archived")
      )
    ),
    lastInboundAt: v.optional(v.float64()),
    lastOutboundAt: v.optional(v.float64()),
    lastInteractionAt: v.optional(v.float64()),
    lastEnrichedAt: v.optional(v.float64()),
    sourceSystem: v.optional(
      v.union(
        v.literal("attio"),
        v.literal("csv"),
        v.literal("supabase"),
        v.literal("manual"),
        v.literal("email")
      )
    ),
    sourceId: v.optional(v.string()),
    sourcePayload: v.optional(v.string()),
    createdAt: v.float64(),
    updatedAt: v.float64(),
  })
    .index("by_name", ["name"])
    .index("by_tier", ["tier"])
    .index("by_email", ["email"])
    .index("by_primary_company", ["primaryCompanyId"])
    .index("by_last_interaction", ["lastInteractionAt"])
    .index("by_source_system_source_id", ["sourceSystem", "sourceId"]),

  // ── CRM: Activities ───────────────────────────────────

  contactActivities: defineTable({
    contactId: v.id("contacts"),
    activityType: v.union(
      v.literal("email_sent"),
      v.literal("email_received"),
      v.literal("meeting"),
      v.literal("note"),
      v.literal("call"),
      v.literal("import"),
      v.literal("status_change"),
      v.literal("relationship_update")
    ),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    metadata: v.optional(v.string()),
    createdAt: v.float64(),
    companyId: v.optional(v.id("companies")),
    emailItemId: v.optional(v.id("emailItems")),
    direction: v.optional(
      v.union(
        v.literal("inbound"),
        v.literal("outbound"),
        v.literal("internal")
      )
    ),
  })
    .index("by_contact", ["contactId"])
    .index("by_company", ["companyId"]),

  // ── CRM: Meeting Notes ────────────────────────────────

  meetingNotes: defineTable({
    contactId: v.id("contacts"),
    date: v.optional(v.string()),
    attendees: v.array(v.string()),
    summary: v.optional(v.string()),
    actionItems: v.array(v.string()),
    sourceEmailId: v.optional(v.string()),
    createdAt: v.float64(),
    companyId: v.optional(v.id("companies")),
    title: v.optional(v.string()),
    rawSource: v.optional(v.string()),
  })
    .index("by_contact", ["contactId"])
    .index("by_company", ["companyId"]),

  // ── CRM: Pipelines ────────────────────────────────────

  pipelines: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    createdAt: v.float64(),
    updatedAt: v.float64(),
  }),

  pipelineStages: defineTable({
    pipelineId: v.id("pipelines"),
    name: v.string(),
    position: v.float64(),
    createdAt: v.float64(),
  }).index("by_pipeline", ["pipelineId"]),

  pipelineEntries: defineTable({
    pipelineId: v.id("pipelines"),
    stageId: v.id("pipelineStages"),
    contactId: v.id("contacts"),
    position: v.float64(),
    enteredStageAt: v.float64(),
    notes: v.optional(v.string()),
    createdAt: v.float64(),
    updatedAt: v.float64(),
  })
    .index("by_pipeline", ["pipelineId"])
    .index("by_stage", ["stageId"])
    .index("by_contact", ["contactId"]),

  // ── System ────────────────────────────────────────────

  appState: defineTable({
    key: v.string(),
    value: v.optional(v.string()),
    updatedAt: v.float64(),
  }).index("by_key", ["key"]),
});
