import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import { fetchDashboardSummary } from "./api";

export function useDashboardSummary() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: fetchDashboardSummary,
    // UX flow 4: UI polling detects new ingestion data.
    refetchInterval: 30_000,
  });
}
