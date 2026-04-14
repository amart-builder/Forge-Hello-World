/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Internal helpers for HTTP routes in http.ts.
 *
 * Convex httpActions cannot directly access the DB — they must call
 * internal queries/mutations via ctx.runQuery / ctx.runMutation, which
 * require function references (not inline callbacks).
 *
 * This file encapsulates every DB operation needed by http.ts as a
 * proper internal function.
 */

import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// ── Contacts ──────────────────────────────────────────────

export const getContactByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    return await ctx.db
      .query("contacts")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
  },
});

export const createContactFromTriage = internalMutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    primaryCompanyId: v.optional(v.id("companies")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("contacts", {
      name: args.name,
      email: args.email,
      primaryCompanyId: args.primaryCompanyId,
      tier: "untiered",
      tags: [],
      notes: "",
      sourceSystem: "email",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const createContactFromAgent = internalMutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("contacts", {
      name: args.name,
      email: args.email,
      phone: args.phone,
      company: args.company,
      role: args.role,
      linkedin: args.linkedin,
      location: args.location,
      tier: args.tier ?? "C",
      tags: args.tags ?? [],
      howWeMet: args.howWeMet,
      notes: args.notes ?? "",
      sourceSystem: "manual",
      createdAt: now,
      updatedAt: now,
    });
  },
});

// ── Companies ─────────────────────────────────────────────

export const getCompanyByDomain = internalQuery({
  args: { domain: v.string() },
  handler: async (ctx, { domain }) => {
    return await ctx.db
      .query("companies")
      .withIndex("by_domain", (q) => q.eq("domain", domain))
      .first();
  },
});

export const createCompanyFromTriage = internalMutation({
  args: { domain: v.string() },
  handler: async (ctx, { domain }) => {
    const now = Date.now();
    return await ctx.db.insert("companies", {
      name: domain.split(".")[0].replace(/^\w/, (c) => c.toUpperCase()),
      domain,
      tags: [],
      notes: "",
      sourceSystem: "email",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const createCompanyFromAgent = internalMutation({
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
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("companies", {
      name: args.name,
      domain: args.domain,
      website: args.website,
      linkedin: args.linkedin,
      industry: args.industry,
      description: args.description,
      location: args.location,
      tags: args.tags ?? [],
      notes: args.notes ?? "",
      sourceSystem: "manual",
      createdAt: now,
      updatedAt: now,
    });
  },
});

// ── Email items ───────────────────────────────────────────

export const createEmailItem = internalMutation({
  args: {
    threadId: v.optional(v.string()),
    messageId: v.optional(v.string()),
    senderName: v.optional(v.string()),
    senderEmail: v.optional(v.string()),
    subject: v.optional(v.string()),
    summary: v.optional(v.string()),
    context: v.optional(v.string()),
    recommendedAction: v.optional(v.string()),
    draftResponse: v.optional(v.string()),
    priority: v.optional(v.float64()),
    contactId: v.optional(v.id("contacts")),
    companyId: v.optional(v.id("companies")),
    gmailThreadUrl: v.optional(v.string()),
    receivedAt: v.optional(v.float64()),
    autoCreatedContact: v.optional(v.boolean()),
    autoCreatedCompany: v.optional(v.boolean()),
    triageModel: v.optional(v.string()),
    triageRunId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("emailItems", {
      threadId: args.threadId,
      messageId: args.messageId,
      senderName: args.senderName,
      senderEmail: args.senderEmail,
      subject: args.subject,
      summary: args.summary,
      context: args.context,
      recommendedAction: (args.recommendedAction as any) ?? "review",
      draftResponse: args.draftResponse,
      priority: args.priority ?? 3,
      status: "pending",
      contactId: args.contactId,
      companyId: args.companyId,
      triageSource: "cron",
      gmailThreadUrl: args.gmailThreadUrl,
      receivedAt: args.receivedAt,
      lastSyncedAt: now,
      autoCreatedContact: args.autoCreatedContact,
      autoCreatedCompany: args.autoCreatedCompany,
      triageModel: args.triageModel,
      triageRunId: args.triageRunId,
      createdAt: now,
    });
  },
});

// ── App state ─────────────────────────────────────────────

export const getAllAppState = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("appState").collect();
  },
});

export const getAppStateByKey = internalQuery({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    return await ctx.db
      .query("appState")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();
  },
});

export const setAppState = internalMutation({
  args: { key: v.string(), value: v.string() },
  handler: async (ctx, { key, value }) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("appState")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { value, updatedAt: now });
      return existing._id;
    }
    return await ctx.db.insert("appState", { key, value, updatedAt: now });
  },
});

// ── Morning brief aggregates ──────────────────────────────

export const getMorningBriefData = internalQuery({
  args: {},
  handler: async (ctx) => {
    const pendingEmails = await ctx.db
      .query("emailItems")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const allContacts = await ctx.db.query("contacts").collect();
    const allPipelines = await ctx.db.query("pipelines").collect();
    const allEntries = await ctx.db.query("pipelineEntries").collect();

    const triageSummary = await ctx.db
      .query("appState")
      .withIndex("by_key", (q) => q.eq("key", "triage_summary"))
      .first();

    return {
      pendingEmails: pendingEmails.map((e) => ({
        priority: e.priority,
      })),
      contacts: allContacts.map((c) => ({
        lastInteractionAt: c.lastInteractionAt ?? null,
      })),
      pipelines: allPipelines.map((p) => ({ _id: p._id, name: p.name })),
      entries: allEntries.map((e) => ({ pipelineId: e.pipelineId })),
      triageSummary: triageSummary?.value ?? null,
    };
  },
});
