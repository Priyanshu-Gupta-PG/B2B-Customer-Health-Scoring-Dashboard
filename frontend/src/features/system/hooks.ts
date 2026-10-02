import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import { ApiError } from "@/lib/errors";
import { fetchHealth, triggerIngestion } from "./api";

export function useHealth(options: { refetchInterval?: number } = {}) {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: fetchHealth,
    refetchInterval: options.refetchInterval ?? 15_000,
    retry: (count, error) => !(error instanceof ApiError && error.status === 503) && count < 1,
  });
}

export function useTriggerIngestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: triggerIngestion,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.health });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
      void qc.invalidateQueries({ queryKey: ["audit-logs"] });
      // The job runs in the background; refresh score-derived data once it has likely landed.
      setTimeout(() => {
        void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
        void qc.invalidateQueries({ queryKey: ["accounts"] });
        void qc.invalidateQueries({ queryKey: ["account"] });
        void qc.invalidateQueries({ queryKey: queryKeys.health });
      }, 4_500);
    },
  });
}
