/* eslint-disable @typescript-eslint/no-explicit-any */
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { findDuplicateContact, findDuplicateCompany } from "./importerDedupe";

/**
 * Import contacts from CSV or Attio. Handles deduplication.
 */
export const importContacts = mutation({
  args: {
    contacts: v.array(
      v.object({
        name: v.string(),
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
        company: v.optional(v.string()),
        role: v.optional(v.string()),
        linkedin: v.optional(v.string()),
        location: v.optional(v.string()),
        tier: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
        howWeMet: v.optional(v.string()),
        notes: v.optional(v.string()),
        sourceSystem: v.union(v.literal("csv"), v.literal("attio")),
        sourceId: v.optional(v.string()),
        sourcePayload: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx: any, args: any) => {
    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const contact of args.contacts) {
      try {
        const existingId = await findDuplicateContact(ctx, contact);
        if (existingId) {
          skipped++;
          continue;
        }

        const now = Date.now();
        await ctx.db.insert("contacts", {
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          company: contact.company,
          role: contact.role,
          linkedin: contact.linkedin,
          location: contact.location,
          tier: contact.tier || "C",
          tags: contact.tags ?? [],
          howWeMet: contact.howWeMet,
          notes: contact.notes ?? "",
          sourceSystem: contact.sourceSystem,
          sourceId: contact.sourceId,
          sourcePayload: contact.sourcePayload,
          createdAt: now,
          updatedAt: now,
        });
        created++;
      } catch (err: any) {
        errors.push(`Failed to import "${contact.name}": ${err?.message ?? "Unknown error"}`);
      }
    }

    return { created, skipped, errors };
  },
});

/**
 * Import companies from CSV or Attio. Handles deduplication.
 */
export const importCompanies = mutation({
  args: {
    companies: v.array(
      v.object({
        name: v.string(),
        domain: v.optional(v.string()),
        website: v.optional(v.string()),
        linkedin: v.optional(v.string()),
        industry: v.optional(v.string()),
        description: v.optional(v.string()),
        location: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
        notes: v.optional(v.string()),
        sourceSystem: v.union(v.literal("csv"), v.literal("attio")),
        sourceId: v.optional(v.string()),
        sourcePayload: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx: any, args: any) => {
    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const company of args.companies) {
      try {
        const existingId = await findDuplicateCompany(ctx, company);
        if (existingId) {
          skipped++;
          continue;
        }

        const now = Date.now();
        await ctx.db.insert("companies", {
          name: company.name,
          domain: company.domain,
          website: company.website,
          linkedin: company.linkedin,
          industry: company.industry,
          description: company.description,
          location: company.location,
          tags: company.tags ?? [],
          notes: company.notes ?? "",
          sourceSystem: company.sourceSystem,
          sourceId: company.sourceId,
          sourcePayload: company.sourcePayload,
          createdAt: now,
          updatedAt: now,
        });
        created++;
      } catch (err: any) {
        errors.push(`Failed to import "${company.name}": ${err?.message ?? "Unknown error"}`);
      }
    }

    return { created, skipped, errors };
  },
});
