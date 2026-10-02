/**
 * API contract types — transcribed from API-B2B-01 (API Specification v1.0).
 * Endpoints marked "gap" are required by UX-B2B-01 but absent from the spec;
 * see frontend/API-GAPS.md.
 */

export type UserRole = "admin" | "csm";

export type HealthStatus = "Critical" | "At-Risk" | "Healthy";

export type ImpactDirection = "positive" | "negative";

export type MetricName = "product_usage" | "support_tickets" | "overdue_invoice";

export type SourceApi = "stripe" | "zendesk" | "product";

// ---------- Auth ----------

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
}

export interface LoginResponse {
  token: string;
  expires_at: string;
  user: AuthUser;
}

// ---------- Accounts ----------

export interface AccountSummary {
  id: string;
  company_name: string;
  current_score: number;
  health_status: HealthStatus;
  arr: number;
  last_active_at: string | null;
  last_updated: string;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface AccountListParams {
  status?: HealthStatus;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface AccountMetric {
  id: string;
  source_api: SourceApi;
  metric_type: MetricName;
  label: string;
  metric_value: number;
  unit: string;
  recorded_at: string;
}

/** gap: account detail with raw metrics */
export interface AccountDetail extends AccountSummary {
  domain: string;
  plan: string;
  owner_csm: string;
  created_at: string;
  metrics: AccountMetric[];
}

export interface HistoryPoint {
  date: string; // YYYY-MM-DD
  score: number;
}

export interface AccountHistoryResponse {
  account_id: string;
  company_name: string;
  history: HistoryPoint[];
}

// ---------- Dashboard (gap) ----------

export interface DashboardSummary {
  total_accounts: number;
  at_risk_accounts: number; // Critical + At-Risk
  critical_accounts: number;
  average_score: number;
  last_sync_at: string | null;
  distribution: Record<HealthStatus, number>;
  cron_status: CronStatus;
  top_at_risk: AccountSummary[];
}

// ---------- Scoring rules ----------

export interface ScoringRule {
  id: string;
  metric_name: MetricName;
  weight_percentage: number;
  impact_direction: ImpactDirection;
  threshold: number | null;
  is_active: boolean;
  updated_at: string;
}

export interface RulesResponse {
  data: ScoringRule[];
}

export interface UpdateRuleRequest {
  weight_percentage?: number;
  impact_direction?: ImpactDirection;
  threshold?: number | null;
  is_active?: boolean;
}

export interface UpdateRuleResponse {
  message: string;
  rule: ScoringRule;
}

/** gap: bulk update so the total can be validated atomically */
export interface BulkUpdateRulesRequest {
  rules: Array<{ id: string } & UpdateRuleRequest>;
}

export interface BulkUpdateRulesResponse {
  message: string;
  rules: ScoringRule[];
  accounts_recalculated: number;
  duration_ms: number;
}

// ---------- Audit log ----------

export type AuditAction = "RULE_UPDATED" | "RULES_BULK_UPDATED" | "RECALCULATION_RUN" | "INGESTION_TRIGGERED";

export interface AuditLogEntry {
  id: string;
  actor: { id: string; email: string };
  action: AuditAction;
  metric_name: MetricName | null;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
  created_at: string;
}

export interface AuditLogParams {
  limit?: number;
  offset?: number;
  actor?: string;
  from?: string;
  to?: string;
}

// ---------- System ----------

export type CronStatus = "running" | "idle" | "stalled";

export interface IngestTriggerResponse {
  status: "processing";
  message: string;
}

export interface HealthResponse {
  status: "ok" | "degraded";
  postgres: "connected" | "disconnected";
  cron_worker: CronStatus;
  uptime_seconds: number;
  last_ingestion_at?: string | null;
  next_ingestion_at?: string | null;
}

// ---------- Errors (RFC 7807) ----------

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
}
