import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/errors";
import type { AccountListParams, AuditLogParams } from "@/types/api";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          const status = error instanceof ApiError ? error.status : 0;
          if (status === 401 || status === 403 || status === 404 || status === 422) return false;
          return failureCount < 2;
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export const queryKeys = {
  dashboard: ["dashboard"] as const,
  accounts: (params: AccountListParams = {}) => ["accounts", params] as const,
  account: (id: string) => ["account", id] as const,
  accountHistory: (id: string, days: number) => ["account", id, "history", days] as const,
  rules: ["rules"] as const,
  auditLogs: (params: AuditLogParams = {}) => ["audit-logs", params] as const,
  health: ["health"] as const,
};
