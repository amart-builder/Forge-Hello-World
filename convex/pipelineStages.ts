/* eslint-disable @typescript-eslint/no-explicit-any */
// ^ Required: Convex _generated types don't exist until `npx convex dev` runs
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * List all stages for a pipeline, sorted by position.
 */
export const list = query({
  args: { pipelineId: v.id("pipelines") },
  handler: async (ctx: any, { pipelineId }: { pipelineId: string }) => {
    const stages = await ctx.db
      .query("pipelineStages")
      .withIndex("by_pipeline", (q: any) => q.eq("pipelineId", pipelineId))
      .collect();
    return stages.sort(
      (a: { position: number }, b: { position: number }) =>
        a.position - b.position
    );
  },
});

/**
 * Create a new stage in a pipeline (placed at end).
 */
export const create = mutation({
  args: {
    pipelineId: v.id("pipelines"),
    name: v.string(),
  },
  handler: async (
    ctx: any,
    args: { pipelineId: string; name: string }
  ) => {
    const existing = await ctx.db
      .query("pipelineStages")
      .withIndex("by_pipeline", (q: any) =>
        q.eq("pipelineId", args.pipelineId)
      )
      .collect();
    const maxPos = existing.reduce(
      (max: number, s: { position: number }) => Math.max(max, s.position),
      0
    );

    return await ctx.db.insert("pipelineStages", {
      pipelineId: args.pipelineId,
      name: args.name,
      position: maxPos + 1.0,
      createdAt: Date.now(),
    });
  },
});

/**
 * Rename a stage.
 */
export const rename = mutation({
  args: {
    id: v.id("pipelineStages"),
    name: v.string(),
  },
  handler: async (
    ctx: any,
    { id, name }: { id: string; name: string }
  ) => {
    await ctx.db.patch(id, { name });
  },
});

/**
 * Update a stage's position (for reordering).
 */
export const updatePosition = mutation({
  args: {
    id: v.id("pipelineStages"),
    position: v.float64(),
  },
  handler: async (
    ctx: any,
    { id, position }: { id: string; position: number }
  ) => {
    await ctx.db.patch(id, { position });
  },
});

/**
 * Delete a stage and cascade-delete its entries.
 */
export const remove = mutation({
  args: { id: v.id("pipelineStages") },
  handler: async (ctx: any, { id }: { id: string }) => {
    const entries = await ctx.db
      .query("pipelineEntries")
      .withIndex("by_stage", (q: any) => q.eq("stageId", id))
      .collect();
    for (const entry of entries) {
      await ctx.db.delete(entry._id);
    }
    await ctx.db.delete(id);
  },
});
