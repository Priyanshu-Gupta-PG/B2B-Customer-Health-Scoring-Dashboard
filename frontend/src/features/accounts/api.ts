import { apiClient } from "@/lib/axiosClient";
import type {
  AccountDetail,
  AccountHistoryResponse,
  AccountListParams,
  AccountSummary,
  Paginated,
} from "@/types/api";

export async function fetchAccounts(params: AccountListParams = {}): Promise<Paginated<AccountSummary>> {
  const { data } = await apiClient.get<Paginated<AccountSummary>>("/accounts", { params });
  return data;
}

export async function fetchAccount(id: string): Promise<AccountDetail> {
  const { data } = await apiClient.get<AccountDetail>(`/accounts/${id}`);
  return data;
}

export async function fetchAccountHistory(id: string, days: number): Promise<AccountHistoryResponse> {
  const { data } = await apiClient.get<AccountHistoryResponse>(`/accounts/${id}/history`, {
    params: { days },
  });
  return data;
}
