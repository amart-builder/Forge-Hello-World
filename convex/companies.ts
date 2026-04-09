/* eslint-disable @typescript-eslint/no-explicit-any */
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * List companies with optional search and filters.
 */
export const list = query({
  args: {
    search: v.optional(v.string()),
    industry: v.optional(v.string()),
    tag: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    let companies = await ctx.db.query("companies").collect();

    if (args.search) {
      const q = args.search.toLowerCase();
      companies = companies.filter(
        (c: any) =>
          c.name?.toLowerCase().includes(q) ||
          c.domain?.toLowerCase().includes(q) ||
          c.industry?.toLowerCase().includes(q)
      );
    }
    if (args.industry) {
      companies = companies.filter((c: any) => c.industry === args.industry);
    }
    if (args.tag) {
      companies = companies.filter((c: any) => c.tags?.includes(args.tag));
    }

    return companies.sort((a: any, b: any) =>
      (a.name ?? "").localeCompare(b.name ?? "")
    );
  },
});

/**
 * Get a single company.
 */
export const get = query({
  args: { id: v.id("companies") },
  handler: async (ctx: any, { id }: { id: string }) => {
    return await ctx.db.get(id);
  },
});

/**
 * Get contacts linked to a company.
 */
export const linkedContacts = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx: any, { companyId }: { companyId: string }) => {
    return await ctx.db
      .query("contacts")
      .withIndex("by_primary_company", (q: any) =>
        q.eq("primaryCompanyId", companyId)
      )
      .collect();
  },
});

/**
 * Create a company.
 */
export const create = mutation({
  args: {
    name: v.string(),
    domain: v.optional(v.string()),
    website: v.optional(v.string()),
    linkedin: v.optional(v.string()),
    industry: v.optional(v.string()),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const now = Date.now();
    return await ctx.db.insert("companies", {
      ...args,
      tags: args.tags ?? [],
      notes: args.notes ?? "",
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update a company.
 */
export const update = mutation({
  args: {
    id: v.id("companies"),
    name: v.optional(v.string()),
    domain: v.optional(v.string()),
    website: v.optional(v.string()),
    linkedin: v.optional(v.string()),
    industry: v.optional(v.string()),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
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
 * Delete a company.
 */
export const remove = mutation({
  args: { id: v.id("companies") },
  handler: async (ctx: any, { id }: { id: string }) => {
    await ctx.db.delete(id);
  },
});

/**
 * Find or create company by domain.
 */
export const findOrCreateByDomain = mutation({
  args: { domain: v.string(), name: v.optional(v.string()) },
  handler: async (
    ctx: any,
    { domain, name }: { domain: string; name?: string }
  ) => {
    const existing = await ctx.db
      .query("companies")
      .withIndex("by_domain", (q: any) => q.eq("domain", domain))
      .first();
    if (existing) return existing._id;

    const now = Date.now();
    return await ctx.db.insert("companies", {
      name: name ?? domain.split(".")[0].replace(/^\w/, (c: string) => c.toUpperCase()),
      domain,
      tags: [],
      notes: "",
      sourceSystem: "email",
      createdAt: now,
      updatedAt: now,
    });
  },
});
