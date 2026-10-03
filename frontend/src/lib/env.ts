const rawApiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export const env = {
  /** e.g. http://localhost:4000/api/v1 */
  apiUrl: rawApiUrl.replace(/\/$/, ""),
  /** e.g. http://localhost:4000 — /health lives here, outside /api/v1 */
  apiOrigin: rawApiUrl.replace(/\/api\/v\d+\/?$/, "").replace(/\/$/, ""),
  useMocks: process.env.NEXT_PUBLIC_USE_MOCKS === "true",
} as const;
