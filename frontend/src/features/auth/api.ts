import { apiClient } from "@/lib/axiosClient";
import { env } from "@/lib/env";
import type { LoginRequest, LoginResponse } from "@/types/api";

export async function login(body: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>("/auth/login", body);
  return data;
}

export async function loginWithGoogle(idToken: string): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>("/auth/google", { id_token: idToken });
  return data;
}

export async function fetchGoogleClientId(): Promise<string | null> {
  // Render free APIs often cold-start >15s; retry with a longer timeout than the default client.
  const url = `${env.apiUrl}/auth/google/config`;
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45_000);
    try {
      // Wake the API first (ignore failures).
      if (attempt === 0) {
        void fetch(`${env.apiOrigin}/health`, { method: "GET", mode: "cors" }).catch(() => undefined);
      }
      const res = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
        mode: "cors",
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`Google config request failed (${res.status}).`);
      }
      const data = (await res.json()) as { client_id?: string | null };
      return data.client_id?.trim() || null;
    } catch (err) {
      lastError = err;
      // Brief backoff before retry (cold start).
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Unable to reach the API for Google sign-in config.");
}
