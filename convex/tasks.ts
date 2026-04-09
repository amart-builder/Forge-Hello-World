/* eslint-disable @typescript-eslint/no-explicit-any */
// ^ Required: Convex _generated types don't exist until `npx convex dev` runs
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * List all tasks, optionally filtered by column.
 */
export const list = query({
  args: { columnId: v.optional(v.id("columns")) },
  handler: async (ctx: any, { columnId }: { columnId?: string }) => {
    if (columnId) {
      return await ctx.db
        .query("tasks")
        .withIndex("by_column", (q: any) => q.eq("columnId", columnId))
        .collect();
    }
    return await ctx.db.query("tasks").collect();
  },
});

/**
 * Get a single task by ID.
 */
export const get = query({
  args: { id: v.id("tasks") },
  handler: async (ctx: any, { id }: { id: string }) => {
    return await ctx.db.get(id);
  },
});

/**
 * Create a new task in a column.
 */
export const create = mutation({
  args: {
    columnId: v.id("columns"),
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high")
    ),
    dueDate: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (
    ctx: any,
    args: {
      columnId: string;
      title: string;
      description?: string;
      priority: "low" | "medium" | "high";
      dueDate?: string;
      tags?: string[];
    }
  ) => {
    // Place at end of column
    const existing = await ctx.db
      .query("tasks")
      .withIndex("by_column", (q: any) => q.eq("columnId", args.columnId))
      .collect();
    const maxPos = existing.reduce(
      (max: number, t: { position: number }) => Math.max(max, t.position),
      0
    );

    const now = Date.now();
    return await ctx.db.insert("tasks", {
      columnId: args.columnId,
      title: args.title,
      description: args.description ?? "",
      priority: args.priority,
      dueDate: args.dueDate,
      tags: args.tags ?? [],
      position: maxPos + 1.0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update a task's fields.
 */
export const update = mutation({
  args: {
    id: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high"))
    ),
    dueDate: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    columnId: v.optional(v.id("columns")),
    position: v.optional(v.float64()),
  },
  handler: async (ctx: any, args: Record<string, unknown>) => {
    const { id, ...updates } = args;
    // Remove undefined values
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
 * Move a task to a new column and/or position.
 * Used for drag-and-drop.
 */
export const move = mutation({
  args: {
    id: v.id("tasks"),
    columnId: v.id("columns"),
    position: v.float64(),
  },
  handler: async (
    ctx: any,
    {
      id,
      columnId,
      position,
    }: { id: string; columnId: string; position: number }
  ) => {
    await ctx.db.patch(id, {
      columnId,
      position,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Delete a task.
 */
export const remove = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx: any, { id }: { id: string }) => {
    await ctx.db.delete(id);
  },
});
