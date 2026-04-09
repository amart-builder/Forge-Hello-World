/* eslint-disable @typescript-eslint/no-explicit-any */
// ^ Required: Convex _generated types don't exist until `npx convex dev` runs
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const recommendedActionValidator = v.union(
  v.literal("reply"),
  v.literal("archive"),
  v.literal("follow_up"),
  v.literal("delegate"),
  v.literal("flag"),
  v.literal("review")
);

const statusValidator = v.union(
  v.literal("pending"),
  v.literal("actioned"),
  v.literal("dismissed")
);

/**
 * List email items, optionally filtered by status. Sorted by priority (1=high first).
 */
export const list = query({
  args: { status: v.optional(statusValidator) },
  handler: async (ctx: any, { status }: { status?: string }) => {
    let items;
    if (status) {
      items = await ctx.db
        .query("emailItems")
        .withIndex("by_status", (q: any) => q.eq("status", status))
        .collect();
    } else {
      items = await ctx.db.query("emailItems").collect();
    }
    return items.sort(
      (a: { priority: number }, b: { priority: number }) =>
        a.priority - b.priority
    );
  },
});

/**
 * Get a single email item.
 */
export const get = query({
  args: { id: v.id("emailItems") },
  handler: async (ctx: any, { id }: { id: string }) => {
    return await ctx.db.get(id);
  },
});

/**
 * Get counts by status for the summary card.
 */
export const counts = query({
  args: {},
  handler: async (ctx: any) => {
    const all = await ctx.db.query("emailItems").collect();
    const pending = all.filter((e: any) => e.status === "pending").length;
    const actioned = all.filter((e: any) => e.status === "actioned").length;
    const dismissed = all.filter((e: any) => e.status === "dismissed").length;
    return { total: all.length, pending, actioned, dismissed };
  },
});

/**
 * Create an email item (used by triage endpoint).
 */
export const create = mutation({
  args: {
    threadId: v.optional(v.string()),
    messageId: v.optional(v.string()),
    senderName: v.optional(v.string()),
    senderEmail: v.optional(v.string()),
    subject: v.optional(v.string()),
    summary: v.optional(v.string()),
    context: v.optional(v.string()),
    recommendedAction: recommendedActionValidator,
    draftResponse: v.optional(v.string()),
    priority: v.float64(),
    contactId: v.optional(v.id("contacts")),
    companyId: v.optional(v.id("companies")),
    triageSource: v.optional(
      v.union(v.literal("cron"), v.literal("manual"), v.literal("import"))
    ),
    gmailThreadUrl: v.optional(v.string()),
    receivedAt: v.optional(v.float64()),
    triageModel: v.optional(v.string()),
    triageRunId: v.optional(v.string()),
    autoCreatedContact: v.optional(v.boolean()),
    autoCreatedCompany: v.optional(v.boolean()),
  },
  handler: async (ctx: any, args: Record<string, unknown>) => {
    const now = Date.now();
    return await ctx.db.insert("emailItems", {
      ...args,
      status: "pending",
      createdAt: now,
      lastSyncedAt: now,
    });
  },
});

/**
 * Update status of an email item (action / dismiss).
 */
export const updateStatus = mutation({
  args: {
    id: v.id("emailItems"),
    status: statusValidator,
  },
  handler: async (
    ctx: any,
    { id, status }: { id: string; status: string }
  ) => {
    const updates: Record<string, unknown> = { status };
    if (status === "actioned" || status === "dismissed") {
      updates.actionedAt = Date.now();
    }
    await ctx.db.patch(id, updates);
  },
});

/**
 * Update draft response on an email item.
 */
export const updateDraft = mutation({
  args: {
    id: v.id("emailItems"),
    draftResponse: v.string(),
  },
  handler: async (
    ctx: any,
    { id, draftResponse }: { id: string; draftResponse: string }
  ) => {
    await ctx.db.patch(id, { draftResponse });
  },
});
