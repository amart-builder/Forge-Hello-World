/* eslint-disable @typescript-eslint/no-explicit-any */
// ^ Required: Convex _generated types don't exist until `npx convex dev` runs
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * List all columns, ordered by position.
 */
export const list = query({
  args: {},
  handler: async (ctx: any) => {
    const cols = await ctx.db.query("columns").collect();
    return cols.sort(
      (a: { position: number }, b: { position: number }) =>
        a.position - b.position
    );
  },
});

/**
 * Create a new column at the end of the board.
 */
export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx: any, { name }: { name: string }) => {
    const existing = await ctx.db.query("columns").collect();
    const maxPos = existing.reduce(
      (max: number, c: { position: number }) => Math.max(max, c.position),
      0
    );
    return await ctx.db.insert("columns", {
      name,
      position: maxPos + 1.0,
      createdAt: Date.now(),
    });
  },
});

/**
 * Rename a column.
 */
export const rename = mutation({
  args: { id: v.id("columns"), name: v.string() },
  handler: async (ctx: any, { id, name }: { id: string; name: string }) => {
    await ctx.db.patch(id, { name });
  },
});

/**
 * Delete a column and all its tasks.
 */
export const remove = mutation({
  args: { id: v.id("columns") },
  handler: async (ctx: any, { id }: { id: string }) => {
    // Delete all tasks in this column first
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_column", (q: any) => q.eq("columnId", id))
      .collect();
    for (const task of tasks) {
      await ctx.db.delete(task._id);
    }
    await ctx.db.delete(id);
  },
});

/**
 * Update position of a column (for reordering).
 */
export const updatePosition = mutation({
  args: { id: v.id("columns"), position: v.float64() },
  handler: async (
    ctx: any,
    { id, position }: { id: string; position: number }
  ) => {
    await ctx.db.patch(id, { position });
  },
});
