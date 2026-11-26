import { apiClient } from "@/lib/axiosClient";
import type { Paginated, PlaybookTask } from "@/types/api";

export async function listPlaybooks(params: {
  status?: "open" | "done";
  limit?: number;
  offset?: number;
}): Promise<Paginated<PlaybookTask>> {
  const { data } = await apiClient.get<Paginated<PlaybookTask>>("/playbooks", { params });
  return data;
}

export async function completePlaybook(id: string): Promise<{ id: string; status: string; completed_at: string | null }> {
  const { data } = await apiClient.post<{ id: string; status: string; completed_at: string | null }>(
    `/playbooks/${id}/complete`,
  );
  return data;
}
