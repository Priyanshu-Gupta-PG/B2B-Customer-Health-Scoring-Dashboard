import { apiClient } from "@/lib/axiosClient";
import type {
  BulkUpdateRulesRequest,
  BulkUpdateRulesResponse,
  RulesResponse,
  ScoringRule,
  UpdateRuleRequest,
  UpdateRuleResponse,
} from "@/types/api";

export async function fetchRules(): Promise<ScoringRule[]> {
  const { data } = await apiClient.get<RulesResponse>("/rules");
  return data.data;
}

export async function updateRule(id: string, body: UpdateRuleRequest): Promise<UpdateRuleResponse> {
  const { data } = await apiClient.patch<UpdateRuleResponse>(`/rules/${id}`, body);
  return data;
}

export async function bulkUpdateRules(
  body: BulkUpdateRulesRequest,
): Promise<BulkUpdateRulesResponse> {
  const { data } = await apiClient.put<BulkUpdateRulesResponse>("/rules", body);
  return data;
}
