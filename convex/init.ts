import { mutation } from "./_generated/server";

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if columns already exist (idempotent)
    const existingColumns = await ctx.db.query("columns").collect();
    if (existingColumns.length > 0) {
      return { seeded: false, message: "Default data already exists" };
    }

    const now = Date.now();

    // Create default task columns
    await ctx.db.insert("columns", {
      name: "To Do",
      position: 1.0,
      createdAt: now,
    });
    await ctx.db.insert("columns", {
      name: "In Progress",
      position: 2.0,
      createdAt: now,
    });
    await ctx.db.insert("columns", {
      name: "Done",
      position: 3.0,
      createdAt: now,
    });

    // Set initial app state
    await ctx.db.insert("appState", {
      key: "app_version",
      value: "2.0.0",
      updatedAt: now,
    });
    await ctx.db.insert("appState", {
      key: "setup_complete",
      value: "true",
      updatedAt: now,
    });

    return { seeded: true, message: "Default columns and app state created" };
  },
});
