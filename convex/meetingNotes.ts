/* eslint-disable @typescript-eslint/no-explicit-any */
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * List meeting notes for a contact, sorted newest first.
 */
export const listByContact = query({
  args: { contactId: v.id("contacts") },
  handler: async (ctx: any, { contactId }: { contactId: string }) => {
    const notes = await ctx.db
      .query("meetingNotes")
      .withIndex("by_contact", (q: any) => q.eq("contactId", contactId))
      .collect();
    return notes.sort(
      (a: { createdAt: number }, b: { createdAt: number }) =>
        b.createdAt - a.createdAt
    );
  },
});

/**
 * Create a meeting note.
 */
export const create = mutation({
  args: {
    contactId: v.id("contacts"),
    title: v.optional(v.string()),
    date: v.optional(v.string()),
    attendees: v.optional(v.array(v.string())),
    summary: v.optional(v.string()),
    actionItems: v.optional(v.array(v.string())),
    companyId: v.optional(v.id("companies")),
  },
  handler: async (ctx: any, args: any) => {
    return await ctx.db.insert("meetingNotes", {
      ...args,
      attendees: args.attendees ?? [],
      actionItems: args.actionItems ?? [],
      createdAt: Date.now(),
    });
  },
});

/**
 * Update a meeting note.
 */
export const update = mutation({
  args: {
    id: v.id("meetingNotes"),
    title: v.optional(v.string()),
    summary: v.optional(v.string()),
    actionItems: v.optional(v.array(v.string())),
  },
  handler: async (ctx: any, args: any) => {
    const { id, ...updates } = args;
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) cleaned[key] = value;
    }
    await ctx.db.patch(id, cleaned);
  },
});

/**
 * Delete a meeting note.
 */
export const remove = mutation({
  args: { id: v.id("meetingNotes") },
  handler: async (ctx: any, { id }: { id: string }) => {
    await ctx.db.delete(id);
  },
});
