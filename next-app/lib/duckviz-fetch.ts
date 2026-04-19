import type { FetchFn } from "@duckviz/explorer";

/**
 * Proxies all internal Explorer API calls to `/api/duckviz/*` — where this
 * example app wires its @duckviz/sdk-style server bridge. External URLs
 * pass through unchanged.
 */
export const customFetch: FetchFn = (input, init) => {
  if (typeof input === "string" && input.startsWith("/api/")) {
    input = input.replace(/^\/api\//, "/api/duckviz/");
  }
  return fetch(input, init);
};
