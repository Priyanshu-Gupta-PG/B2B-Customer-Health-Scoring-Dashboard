import axios from "axios";
import { env } from "@/lib/env";
import { clearSession, getToken } from "@/lib/auth";
import { toApiError } from "@/lib/errors";

export const apiClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

/** Client for endpoints outside /api/v1 (currently only GET /health). */
export const originClient = axios.create({
  baseURL: env.apiOrigin,
  timeout: 8_000,
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = toApiError(error);
    const isLoginCall =
      axios.isAxiosError(error) && (error.config?.url ?? "").includes("/auth/login");
    if (apiError.status === 401 && !isLoginCall && typeof window !== "undefined") {
      clearSession();
      const next = window.location.pathname + window.location.search;
      if (!window.location.pathname.startsWith("/login")) {
        // Full navigation so in-memory Query/Auth state cannot outlive a dead token.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign(`/login?next=${encodeURIComponent(next)}&reason=expired`);
      }
    }
    return Promise.reject(apiError);
  },
);

originClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(toApiError(error)),
);
