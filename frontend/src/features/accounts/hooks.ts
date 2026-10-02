import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import type { AccountListParams } from "@/types/api";
import { fetchAccount, fetchAccountHistory, fetchAccounts } from "./api";

/**
 * The accounts page loads the whole portfolio once (limit 500) and lets TanStack Table
 * sort/filter client-side, which is what BR-005 / OBJ-03 ask for (sub-second triage).
 */
export function useAllAccounts() {
  const params: AccountListParams = { limit: 500, offset: 0 };
  return useQuery({
    queryKey: queryKeys.accounts(params),
    queryFn: () => fetchAccounts(params),
    placeholderData: keepPreviousData,
  });
}

export function useAccount(id: string) {
  return useQuery({
    queryKey: queryKeys.account(id),
    queryFn: () => fetchAccount(id),
    enabled: !!id,
  });
}

export function useAccountHistory(id: string, days: number) {
  return useQuery({
    queryKey: queryKeys.accountHistory(id, days),
    queryFn: () => fetchAccountHistory(id, days),
    enabled: !!id,
    placeholderData: keepPreviousData,
  });
}
