/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as appState from "../appState.js";
import type * as auth from "../auth.js";
import type * as columns from "../columns.js";
import type * as companies from "../companies.js";
import type * as contactActivities from "../contactActivities.js";
import type * as contacts from "../contacts.js";
import type * as emailActions from "../emailActions.js";
import type * as emails from "../emails.js";
import type * as http from "../http.js";
import type * as importerDedupe from "../importerDedupe.js";
import type * as importerTypes from "../importerTypes.js";
import type * as importers from "../importers.js";
import type * as init from "../init.js";
import type * as meetingNotes from "../meetingNotes.js";
import type * as pipelineEntries from "../pipelineEntries.js";
import type * as pipelineStages from "../pipelineStages.js";
import type * as pipelines from "../pipelines.js";
import type * as tasks from "../tasks.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  appState: typeof appState;
  auth: typeof auth;
  columns: typeof columns;
  companies: typeof companies;
  contactActivities: typeof contactActivities;
  contacts: typeof contacts;
  emailActions: typeof emailActions;
  emails: typeof emails;
  http: typeof http;
  importerDedupe: typeof importerDedupe;
  importerTypes: typeof importerTypes;
  importers: typeof importers;
  init: typeof init;
  meetingNotes: typeof meetingNotes;
  pipelineEntries: typeof pipelineEntries;
  pipelineStages: typeof pipelineStages;
  pipelines: typeof pipelines;
  tasks: typeof tasks;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
