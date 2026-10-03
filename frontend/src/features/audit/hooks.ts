import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import type { AuditLogParams } from "@/types/api";
import { fetchAuditActors, fetchAuditLogs } from "./api";

export function useAuditLogs(params: AuditLogParams) {
  return useQuery({
    queryKey: queryKeys.auditLogs(params),
    queryFn: () => fetchAuditLogs(params),
    placeholderData: keepPreviousData,
  });
}

export function useAuditActors() {
  return useQuery({
    queryKey: ["audit-logs", "actors"],
    queryFn: fetchAuditActors,
    staleTime: 5 * 60_000,
  });
}
