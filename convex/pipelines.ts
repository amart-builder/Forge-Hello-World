/* eslint-disable @typescript-eslint/no-explicit-any */
// ^ Required: Convex _generated types don't exist until `npx convex dev` runs
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * List all pipelines, sorted by creation date (newest first).
 */
export const list = query({
  args: {},
  handler: async (ctx: any) => {
    const all = await ctx.db.query("pipelines").collect();
    return all.sort(
      (a: { createdAt: number }, b: { createdAt: number }) =>
        b.createdAt - a.createdAt
    );
  },
});

/**
 * Get a single pipeline by ID.
 */
export const get = query({
  args: { id: v.id("pipelines") },
  handler: async (ctx: any, { id }: { id: string }) => {
    return await ctx.db.get(id);
  },
});

/**
 * Create a new pipeline.
 */
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (
    ctx: any,
    args: { name: string; description?: string }
  ) => {
    const now = Date.now();
    return await ctx.db.insert("pipelines", {
      name: args.name,
      description: args.description,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update a pipeline's name or description.
 */
export const update = mutation({
  args: {
    id: v.id("pipelines"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx: any, args: Record<string, unknown>) => {
    const { id, ...updates } = args;
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        cleaned[key] = value;
      }
    }
    cleaned.updatedAt = Date.now();
    await ctx.db.patch(id, cleaned);
  },
});

/**
 * Delete a pipeline and cascade-delete its stages and entries.
 */
export const remove = mutation({
  args: { id: v.id("pipelines") },
  handler: async (ctx: any, { id }: { id: string }) => {
    // Delete all entries for this pipeline
    const entries = await ctx.db
      .query("pipelineEntries")
      .withIndex("by_pipeline", (q: any) => q.eq("pipelineId", id))
      .collect();
    for (const entry of entries) {
      await ctx.db.delete(entry._id);
    }
    // Delete all stages for this pipeline
    const stages = await ctx.db
      .query("pipelineStages")
      .withIndex("by_pipeline", (q: any) => q.eq("pipelineId", id))
      .collect();
    for (const stage of stages) {
      await ctx.db.delete(stage._id);
    }
    // Delete the pipeline itself
    await ctx.db.delete(id);
  },
});
