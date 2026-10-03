import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import type { BulkUpdateRulesRequest, UpdateRuleRequest } from "@/types/api";
import { bulkUpdateRules, fetchRules, updateRule } from "./api";

export function useRules() {
  return useQuery({ queryKey: queryKeys.rules, queryFn: fetchRules });
}

/** After any rule change every score may have moved, so invalidate everything score-derived. */
function useInvalidateScores() {
  const qc = useQueryClient();
  return async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.rules }),
      qc.invalidateQueries({ queryKey: ["accounts"] }),
      qc.invalidateQueries({ queryKey: ["account"] }),
      qc.invalidateQueries({ queryKey: queryKeys.dashboard }),
      qc.invalidateQueries({ queryKey: ["audit-logs"] }),
    ]);
  };
}

export function useUpdateRule() {
  const invalidate = useInvalidateScores();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateRuleRequest }) => updateRule(id, body),
    onSuccess: invalidate,
  });
}

export function useBulkUpdateRules() {
  const invalidate = useInvalidateScores();
  return useMutation({
    mutationFn: (body: BulkUpdateRulesRequest) => bulkUpdateRules(body),
    onSuccess: invalidate,
  });
}
