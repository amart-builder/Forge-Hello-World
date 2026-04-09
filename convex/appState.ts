import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("appState").collect();
  },
});

export const get = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    return await ctx.db
      .query("appState")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();
  },
});

export const set = mutation({
  args: {
    key: v.string(),
    value: v.optional(v.string()),
  },
  handler: async (ctx, { key, value }) => {
    const existing = await ctx.db
      .query("appState")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("appState", {
      key,
      value,
      updatedAt: Date.now(),
    });
  },
});
