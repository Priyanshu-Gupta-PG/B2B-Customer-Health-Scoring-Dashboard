import type { HealthStatus } from "@/types/api";

/** Tier boundaries per LLD-B2B-01 §2.1 getStatusTier and UX-B2B-01 colour tokens. */
export function getStatusTier(score: number): HealthStatus {
  if (score >= 71) return "Healthy";
  if (score >= 31) return "At-Risk";
  return "Critical";
}

export const STATUS_ORDER: Record<HealthStatus, number> = {
  Critical: 0,
  "At-Risk": 1,
  Healthy: 2,
};

export const STATUS_COLOR: Record<HealthStatus, string> = {
  Critical: "#ef4444",
  "At-Risk": "#f59e0b",
  Healthy: "#10b981",
};

export const STATUS_LABEL: Record<HealthStatus, string> = {
  Critical: "Critical",
  "At-Risk": "At-Risk",
  Healthy: "Healthy",
};

export const ALL_STATUSES: HealthStatus[] = ["Critical", "At-Risk", "Healthy"];

export function scoreTextClass(score: number) {
  const tier = getStatusTier(score);
  if (tier === "Critical") return "text-danger";
  if (tier === "At-Risk") return "text-warning";
  return "text-success";
}
