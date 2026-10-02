import type { AuthUser } from "@/types/api";

/**
 * Token persistence. The API contract (API-B2B-01) uses `Authorization: Bearer`,
 * so the token is kept client-side. If the backend later moves to httpOnly cookies
 * (SEC-B2B-01), swap this module for a cookie-based session and drop the header.
 */
const TOKEN_KEY = "hd.token";
const USER_KEY = "hd.user";
const EXPIRES_KEY = "hd.expires_at";

export interface StoredSession {
  token: string;
  user: AuthUser;
  expiresAt: string;
}

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readSession(): StoredSession | null {
  const s = storage();
  if (!s) return null;
  const token = s.getItem(TOKEN_KEY);
  const rawUser = s.getItem(USER_KEY);
  const expiresAt = s.getItem(EXPIRES_KEY);
  if (!token || !rawUser || !expiresAt) return null;
  if (new Date(expiresAt).getTime() <= Date.now()) {
    clearSession();
    return null;
  }
  try {
    return { token, user: JSON.parse(rawUser) as AuthUser, expiresAt };
  } catch {
    clearSession();
    return null;
  }
}

export function writeSession(session: StoredSession) {
  const s = storage();
  if (!s) return;
  s.setItem(TOKEN_KEY, session.token);
  s.setItem(USER_KEY, JSON.stringify(session.user));
  s.setItem(EXPIRES_KEY, session.expiresAt);
}

export function clearSession() {
  const s = storage();
  if (!s) return;
  s.removeItem(TOKEN_KEY);
  s.removeItem(USER_KEY);
  s.removeItem(EXPIRES_KEY);
}

export function getToken(): string | null {
  return readSession()?.token ?? null;
}
