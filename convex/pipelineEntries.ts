/* eslint-disable @typescript-eslint/no-explicit-any */
// ^ Required: Convex _generated types don't exist until `npx convex dev` runs
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * List all entries for a pipeline (used to populate the board).
 */
export const listByPipeline = query({
  args: { pipelineId: v.id("pipelines") },
  handler: async (ctx: any, { pipelineId }: { pipelineId: string }) => {
    const entries = await ctx.db
      .query("pipelineEntries")
      .withIndex("by_pipeline", (q: any) => q.eq("pipelineId", pipelineId))
      .collect();

    // Enrich each entry with contact data
    const enriched = await Promise.all(
      entries.map(async (entry: any) => {
        const contact = await ctx.db.get(entry.contactId);
        return {
          ...entry,
          contactName: contact?.name ?? "Unknown",
          contactEmail: contact?.email,
          contactCompany: contact?.company ?? contact?.companyNameCached,
          contactLastInteractionAt: contact?.lastInteractionAt,
        };
      })
    );

    return enriched;
  },
});

/**
 * List entries for a specific stage.
 */
export const listByStage = query({
  args: { stageId: v.id("pipelineStages") },
  handler: async (ctx: any, { stageId }: { stageId: string }) => {
    const entries = await ctx.db
      .query("pipelineEntries")
      .withIndex("by_stage", (q: any) => q.eq("stageId", stageId))
      .collect();

    const enriched = await Promise.all(
      entries.map(async (entry: any) => {
        const contact = await ctx.db.get(entry.contactId);
        return {
          ...entry,
          contactName: contact?.name ?? "Unknown",
          contactEmail: contact?.email,
          contactCompany: contact?.company ?? contact?.companyNameCached,
          contactLastInteractionAt: contact?.lastInteractionAt,
        };
      })
    );

    return enriched.sort(
      (a: { position: number }, b: { position: number }) =>
        a.position - b.position
    );
  },
});

/**
 * Check if a contact is already in a pipeline.
 */
export const contactInPipeline = query({
  args: {
    pipelineId: v.id("pipelines"),
    contactId: v.id("contacts"),
  },
  handler: async (
    ctx: any,
    { pipelineId, contactId }: { pipelineId: string; contactId: string }
  ) => {
    const entries = await ctx.db
      .query("pipelineEntries")
      .withIndex("by_pipeline", (q: any) => q.eq("pipelineId", pipelineId))
      .collect();
    return entries.some(
      (e: { contactId: string }) => e.contactId === contactId
    );
  },
});

/**
 * Add a contact to a pipeline stage.
 */
export const create = mutation({
  args: {
    pipelineId: v.id("pipelines"),
    stageId: v.id("pipelineStages"),
    contactId: v.id("contacts"),
    notes: v.optional(v.string()),
  },
  handler: async (
    ctx: any,
    args: {
      pipelineId: string;
      stageId: string;
      contactId: string;
      notes?: string;
    }
  ) => {
    // Place at end of stage
    const existing = await ctx.db
      .query("pipelineEntries")
      .withIndex("by_stage", (q: any) => q.eq("stageId", args.stageId))
      .collect();
    const maxPos = existing.reduce(
      (max: number, e: { position: number }) => Math.max(max, e.position),
      0
    );

    const now = Date.now();
    return await ctx.db.insert("pipelineEntries", {
      pipelineId: args.pipelineId,
      stageId: args.stageId,
      contactId: args.contactId,
      position: maxPos + 1.0,
      enteredStageAt: now,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Move an entry to a different stage and/or position (drag-and-drop).
 */
export const move = mutation({
  args: {
    id: v.id("pipelineEntries"),
    stageId: v.id("pipelineStages"),
    position: v.float64(),
  },
  handler: async (
    ctx: any,
    {
      id,
      stageId,
      position,
    }: { id: string; stageId: string; position: number }
  ) => {
    const entry = await ctx.db.get(id);
    const stageChanged = entry?.stageId !== stageId;
    const now = Date.now();

    await ctx.db.patch(id, {
      stageId,
      position,
      updatedAt: now,
      ...(stageChanged ? { enteredStageAt: now } : {}),
    });
  },
});

/**
 * Update an entry's notes.
 */
export const updateNotes = mutation({
  args: {
    id: v.id("pipelineEntries"),
    notes: v.optional(v.string()),
  },
  handler: async (
    ctx: any,
    { id, notes }: { id: string; notes?: string }
  ) => {
    await ctx.db.patch(id, { notes, updatedAt: Date.now() });
  },
});

/**
 * Remove an entry from a pipeline.
 */
export const remove = mutation({
  args: { id: v.id("pipelineEntries") },
  handler: async (ctx: any, { id }: { id: string }) => {
    await ctx.db.delete(id);
  },
});
