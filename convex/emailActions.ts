/* eslint-disable @typescript-eslint/no-explicit-any */
// ^ Required: Convex _generated types don't exist until `npx convex dev` runs
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * List all email actions, optionally filtered by emailItemId. Sorted newest first.
 */
export const list = query({
  args: { emailItemId: v.optional(v.id("emailItems")) },
  handler: async (ctx: any, { emailItemId }: { emailItemId?: string }) => {
    let actions;
    if (emailItemId) {
      actions = await ctx.db
        .query("emailActions")
        .withIndex("by_email", (q: any) => q.eq("emailItemId", emailItemId))
        .collect();
    } else {
      actions = await ctx.db.query("emailActions").collect();
    }
    return actions.sort(
      (a: { createdAt: number }, b: { createdAt: number }) =>
        b.createdAt - a.createdAt
    );
  },
});

/**
 * Create an email action (log an action taken on an email).
 */
export const create = mutation({
  args: {
    emailItemId: v.id("emailItems"),
    actionType: v.string(),
    description: v.optional(v.string()),
    contactId: v.optional(v.id("contacts")),
    companyId: v.optional(v.id("companies")),
    performedBy: v.optional(
      v.union(v.literal("user"), v.literal("agent"), v.literal("system"))
    ),
    metadata: v.optional(v.string()),
  },
  handler: async (ctx: any, args: Record<string, unknown>) => {
    return await ctx.db.insert("emailActions", {
      ...args,
      createdAt: Date.now(),
    });
  },
});
