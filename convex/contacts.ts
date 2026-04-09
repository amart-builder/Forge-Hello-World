/* eslint-disable @typescript-eslint/no-explicit-any */
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const statusValidator = v.optional(
  v.union(
    v.literal("lead"),
    v.literal("active"),
    v.literal("warm"),
    v.literal("cold"),
    v.literal("archived")
  )
);

/**
 * List contacts with optional filters. Supports search, tier, status, tag filtering.
 */
export const list = query({
  args: {
    search: v.optional(v.string()),
    tier: v.optional(v.string()),
    status: v.optional(v.string()),
    tag: v.optional(v.string()),
    sortBy: v.optional(v.string()),
    sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
  handler: async (ctx: any, args: any) => {
    let contacts = await ctx.db.query("contacts").collect();

    // Apply filters
    if (args.search) {
      const q = args.search.toLowerCase();
      contacts = contacts.filter(
        (c: any) =>
          c.name?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.company?.toLowerCase().includes(q) ||
          c.companyNameCached?.toLowerCase().includes(q)
      );
    }
    if (args.tier) {
      contacts = contacts.filter((c: any) => c.tier === args.tier);
    }
    if (args.status) {
      contacts = contacts.filter((c: any) => c.status === args.status);
    }
    if (args.tag) {
      contacts = contacts.filter((c: any) => c.tags?.includes(args.tag));
    }

    // Sort
    const sortBy = args.sortBy ?? "name";
    const sortOrder = args.sortOrder ?? "asc";
    const dir = sortOrder === "asc" ? 1 : -1;
    contacts.sort((a: any, b: any) => {
      const aVal = a[sortBy] ?? "";
      const bVal = b[sortBy] ?? "";
      if (typeof aVal === "string" && typeof bVal === "string") {
        return aVal.localeCompare(bVal) * dir;
      }
      return ((aVal as number) - (bVal as number)) * dir;
    });

    return contacts;
  },
});

/**
 * Get a single contact by ID.
 */
export const get = query({
  args: { id: v.id("contacts") },
  handler: async (ctx: any, { id }: { id: string }) => {
    return await ctx.db.get(id);
  },
});

/**
 * Create a new contact.
 */
export const create = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    primaryCompanyId: v.optional(v.id("companies")),
    role: v.optional(v.string()),
    linkedin: v.optional(v.string()),
    location: v.optional(v.string()),
    tier: v.string(),
    tags: v.optional(v.array(v.string())),
    howWeMet: v.optional(v.string()),
    notes: v.optional(v.string()),
    status: statusValidator,
  },
  handler: async (ctx: any, args: any) => {
    const now = Date.now();
    return await ctx.db.insert("contacts", {
      ...args,
      tags: args.tags ?? [],
      notes: args.notes ?? "",
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update a contact.
 */
export const update = mutation({
  args: {
    id: v.id("contacts"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    primaryCompanyId: v.optional(v.id("companies")),
    role: v.optional(v.string()),
    linkedin: v.optional(v.string()),
    location: v.optional(v.string()),
    tier: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    howWeMet: v.optional(v.string()),
    notes: v.optional(v.string()),
    status: statusValidator,
    lastContactDate: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const { id, ...updates } = args;
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) cleaned[key] = value;
    }
    cleaned.updatedAt = Date.now();
    await ctx.db.patch(id, cleaned);
  },
});

/**
 * Delete a contact.
 */
export const remove = mutation({
  args: { id: v.id("contacts") },
  handler: async (ctx: any, { id }: { id: string }) => {
    await ctx.db.delete(id);
  },
});
