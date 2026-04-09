/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Deduplication logic for contact and company imports.
 *
 * Dedup strategy (ordered by confidence):
 * 1. sourceSystem + sourceId exact match (indexed)
 * 2. email exact match — contacts (indexed)
 * 3. domain exact match — companies (indexed)
 *
 * Name-based heuristic removed: it required full-table scan (.collect())
 * causing O(n²) memory/time when importing batches into large tables.
 * The indexed tiers catch real duplicates; name collisions (e.g. two
 * "John Smith" entries from different companies) are better resolved
 * manually than silently merged.
 */

/**
 * Find an existing contact that matches the import data.
 * Returns the existing contact ID if found, null otherwise.
 */
export async function findDuplicateContact(
  ctx: any,
  data: { name: string; email?: string; sourceSystem?: string; sourceId?: string }
): Promise<string | null> {
  // 1. sourceSystem + sourceId match
  if (data.sourceSystem && data.sourceId) {
    const bySource = await ctx.db
      .query("contacts")
      .withIndex("by_source_system_source_id", (q: any) =>
        q.eq("sourceSystem", data.sourceSystem).eq("sourceId", data.sourceId)
      )
      .first();
    if (bySource) return bySource._id;
  }

  // 2. email exact match
  if (data.email) {
    const byEmail = await ctx.db
      .query("contacts")
      .withIndex("by_email", (q: any) => q.eq("email", data.email))
      .first();
    if (byEmail) return byEmail._id;
  }

  return null;
}

/**
 * Find an existing company that matches the import data.
 * Returns the existing company ID if found, null otherwise.
 */
export async function findDuplicateCompany(
  ctx: any,
  data: { name: string; domain?: string; sourceSystem?: string; sourceId?: string }
): Promise<string | null> {
  // 1. sourceSystem + sourceId match
  if (data.sourceSystem && data.sourceId) {
    const bySource = await ctx.db
      .query("companies")
      .withIndex("by_source_system_source_id", (q: any) =>
        q.eq("sourceSystem", data.sourceSystem).eq("sourceId", data.sourceId)
      )
      .first();
    if (bySource) return bySource._id;
  }

  // 2. domain exact match
  if (data.domain) {
    const byDomain = await ctx.db
      .query("companies")
      .withIndex("by_domain", (q: any) => q.eq("domain", data.domain))
      .first();
    if (byDomain) return byDomain._id;
  }

  return null;
}
