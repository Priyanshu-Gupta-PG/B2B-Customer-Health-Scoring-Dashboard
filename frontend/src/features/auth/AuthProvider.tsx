"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { AuthUser, LoginRequest } from "@/types/api";
import {
  AUTH_CHANGE_EVENT,
  clearSession,
  notifyAuthChange,
  readSession,
  writeSession,
} from "@/lib/auth";
import { login as loginRequest } from "./api";

interface AuthContextValue {
  user: AuthUser | null;
  /** true until localStorage has been read on the client */
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (body: LoginRequest) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const sync = () => setUser(readSession()?.user ?? null);
    sync();
    setIsLoading(false);

    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key.startsWith("hd.")) sync();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(AUTH_CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(AUTH_CHANGE_EVENT, sync);
    };
  }, []);

  const login = useCallback(
    async (body: LoginRequest) => {
      const res = await loginRequest(body);
      writeSession({ token: res.token, user: res.user, expiresAt: res.expires_at });
      notifyAuthChange();
      setUser(res.user);
      queryClient.clear();
      return res.user;
    },
    [queryClient],
  );

  const logout = useCallback(() => {
    clearSession();
    notifyAuthChange();
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      isAdmin: user?.role === "admin",
      login,
      logout,
    }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
