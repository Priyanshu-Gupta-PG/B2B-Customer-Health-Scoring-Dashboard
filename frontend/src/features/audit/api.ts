import { apiClient } from "@/lib/axiosClient";
import type { AuditLogEntry, AuditLogParams, Paginated } from "@/types/api";

export async function fetchAuditLogs(params: AuditLogParams = {}): Promise<Paginated<AuditLogEntry>> {
  const { data } = await apiClient.get<Paginated<AuditLogEntry>>("/audit-logs", { params });
  return data;
}

export async function fetchAuditActors(): Promise<string[]> {
  const { data } = await apiClient.get<{ data: string[] }>("/audit-logs/actors");
  return data.data;
}
