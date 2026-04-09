/* eslint-disable @typescript-eslint/no-explicit-any */
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * List activities for a contact, sorted newest first.
 */
export const listByContact = query({
  args: { contactId: v.id("contacts") },
  handler: async (ctx: any, { contactId }: { contactId: string }) => {
    const activities = await ctx.db
      .query("contactActivities")
      .withIndex("by_contact", (q: any) => q.eq("contactId", contactId))
      .collect();
    return activities.sort(
      (a: { createdAt: number }, b: { createdAt: number }) =>
        b.createdAt - a.createdAt
    );
  },
});

/**
 * Create an activity entry.
 */
export const create = mutation({
  args: {
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
    companyId: v.optional(v.id("companies")),
    emailItemId: v.optional(v.id("emailItems")),
    direction: v.optional(
      v.union(
        v.literal("inbound"),
        v.literal("outbound"),
        v.literal("internal")
      )
    ),
  },
  handler: async (ctx: any, args: any) => {
    return await ctx.db.insert("contactActivities", {
      ...args,
      createdAt: Date.now(),
    });
  },
});
