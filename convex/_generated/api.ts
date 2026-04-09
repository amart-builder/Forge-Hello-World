/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Stub _generated/api — replaced automatically by `npx convex dev`.
 *
 * This provides enough structure so that `api.moduleName.functionName`
 * resolves to a truthy value. At runtime with a real Convex backend,
 * these are replaced by typed function references.
 */

const handler = new Proxy(
  {},
  {
    get(_target, _prop) {
      return "stub";
    },
  }
);

const apiProxy = new Proxy(
  {},
  {
    get(_target, _prop) {
      return handler;
    },
  }
);

export const api: any = apiProxy;
export const internal: any = apiProxy;
