import { apiClient, originClient } from "@/lib/axiosClient";
import type { HealthResponse, IngestTriggerResponse } from "@/types/api";

export async function fetchHealth(): Promise<HealthResponse> {
  const { data } = await originClient.get<HealthResponse>("/health");
  return data;
}

export async function triggerIngestion(): Promise<IngestTriggerResponse> {
  const { data } = await apiClient.post<IngestTriggerResponse>("/ingest/trigger");
  return data;
}
