"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { AuthUser } from "@/types/api";
import { AUTH_CHANGE_EVENT, clearSession, notifyAuthChange, readSession, writeSession } from "@/lib/auth";
import { loginWithGoogle as loginWithGoogleRequest } from "./api";

interface AuthContextValue {
  user: AuthUser | null;
  /** true until localStorage has been read on the client */
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loginWithGoogle: (idToken: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function subscribeAuth(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key.startsWith("hd.")) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(AUTH_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(AUTH_CHANGE_EVENT, onChange);
  };
}

let cachedRaw: string | null | undefined;
let cachedUser: AuthUser | null = null;

function getAuthUser() {
  const store = typeof window === "undefined" ? null : window.localStorage;
  const raw = store
    ? `${store.getItem("hd.token")}|${store.getItem("hd.user")}|${store.getItem("hd.expires_at")}`
    : null;
  if (raw === cachedRaw) return cachedUser;
  cachedRaw = raw;
  cachedUser = readSession()?.user ?? null;
  return cachedUser;
}

function useClientReady() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const user = useSyncExternalStore(subscribeAuth, getAuthUser, () => null);
  const isLoading = !useClientReady();
  const queryClient = useQueryClient();

  const loginWithGoogle = useCallback(
    async (idToken: string) => {
      const res = await loginWithGoogleRequest(idToken);
      writeSession({ token: res.token, user: res.user, expiresAt: res.expires_at });
      notifyAuthChange();
      queryClient.clear();
      return res.user;
    },
    [queryClient],
  );

  const logout = useCallback(() => {
    clearSession();
    notifyAuthChange();
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      isAdmin: user?.role === "admin",
      loginWithGoogle,
      logout,
    }),
    [user, isLoading, loginWithGoogle, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
