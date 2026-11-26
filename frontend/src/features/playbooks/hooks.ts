"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { completePlaybook, listPlaybooks } from "./api";

export function usePlaybooks(params: { status?: "open" | "done"; limit: number; offset: number }) {
  return useQuery({
    queryKey: ["playbooks", params],
    queryFn: () => listPlaybooks(params),
  });
}

export function useCompletePlaybook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => completePlaybook(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["playbooks"] });
    },
  });
}
