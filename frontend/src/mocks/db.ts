import type {
  AccountDetail,
  AccountHistoryResponse,
  AccountListParams,
  AccountSummary,
  AuditLogEntry,
  AuditLogParams,
  AuthUser,
  BulkUpdateRulesRequest,
  BulkUpdateRulesResponse,
  CronStatus,
  DashboardSummary,
  HealthResponse,
  HealthStatus,
  MetricName,
  Paginated,
  ScoringRule,
  UpdateRuleRequest,
} from "@/types/api";
import { getStatusTier } from "@/lib/status";
import { calculateScore } from "./scoring";
import {
  buildSeedAccounts,
  defaultRules,
  makeUuid,
  metricsFor,
  mulberry32,
  type SeedAccount,
} from "./seed";

/**
 * In-memory mock database. Rules, audit log and sync metadata persist to localStorage so
 * admin changes survive a refresh; accounts are rebuilt from the deterministic seed.
 */

const STORAGE_KEY = "hd.mock.state.v1";
const SEED = 20260903;
const ACCOUNT_COUNT = 150;

interface PersistedState {
  rules: ScoringRule[];
  audit: AuditLogEntry[];
  lastSyncAt: string;
  rawOverrides: Record<string, Partial<Record<MetricName, number>>>;
}

export const MOCK_USERS: AuthUser[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "admin@company.com",
    role: "admin",
    name: "David Chen",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    email: "csm@company.com",
    role: "csm",
    name: "Sarah Lopez",
  },
];

class MockDb {
  private rand = mulberry32(SEED);
  private accounts: SeedAccount[];
  private rules: ScoringRule[];
  private audit: AuditLogEntry[];
  private lastSyncAt: string;
  private rawOverrides: PersistedState["rawOverrides"];
  private cronStatus: CronStatus = "idle";
  private startedAt = Date.now();
  private scores = new Map<string, number>();
  private randomId = () => makeUuid(this.rand);

  constructor() {
    this.accounts = buildSeedAccounts(ACCOUNT_COUNT, this.rand);
    const seededRules = defaultRules(this.rand);
    const persisted = this.load();
    this.rules = persisted?.rules ?? seededRules;
    this.audit = persisted?.audit ?? this.seedAudit(seededRules);
    this.lastSyncAt = persisted?.lastSyncAt ?? new Date(Date.now() - 7 * 60_000).toISOString();
    this.rawOverrides = persisted?.rawOverrides ?? {};
    this.applyOverrides();
    this.recalculateAll();
  }

  // ---------- persistence ----------

  private load(): PersistedState | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as PersistedState) : null;
    } catch {
      return null;
    }
  }

  private save() {
    if (typeof window === "undefined") return;
    const state: PersistedState = {
      rules: this.rules,
      audit: this.audit.slice(0, 500),
      lastSyncAt: this.lastSyncAt,
      rawOverrides: this.rawOverrides,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  private applyOverrides() {
    for (const acc of this.accounts) {
      const o = this.rawOverrides[acc.id];
      if (o) acc.raw = { ...acc.raw, ...o };
    }
  }

  private seedAudit(rules: ScoringRule[]): AuditLogEntry[] {
    const admin = MOCK_USERS[0];
    const DAY = 86_400_000;
    const entries: AuditLogEntry[] = [
      {
        id: this.randomId(),
        actor: { id: admin.id, email: admin.email },
        action: "RULE_UPDATED",
        metric_name: "overdue_invoice",
        before_state: { weight_percentage: 20 },
        after_state: { weight_percentage: 30 },
        created_at: new Date(Date.now() - 19 * DAY).toISOString(),
      },
      {
        id: this.randomId(),
        actor: { id: admin.id, email: admin.email },
        action: "RULE_UPDATED",
        metric_name: "product_usage",
        before_state: { weight_percentage: 50 },
        after_state: { weight_percentage: 40 },
        created_at: new Date(Date.now() - 19 * DAY + 60_000).toISOString(),
      },
      {
        id: this.randomId(),
        actor: { id: admin.id, email: admin.email },
        action: "RECALCULATION_RUN",
        metric_name: null,
        before_state: null,
        after_state: { accounts_recalculated: ACCOUNT_COUNT, duration_ms: 412 },
        created_at: new Date(Date.now() - 19 * DAY + 61_000).toISOString(),
      },
      {
        id: this.randomId(),
        actor: { id: admin.id, email: admin.email },
        action: "INGESTION_TRIGGERED",
        metric_name: null,
        before_state: null,
        after_state: { sources: ["stripe", "zendesk", "product"] },
        created_at: new Date(Date.now() - 6 * DAY).toISOString(),
      },
    ];
    void rules;
    return entries.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  // ---------- scoring ----------

  private recalculateAll(): number {
    const start = performance.now();
    for (const acc of this.accounts) {
      this.scores.set(acc.id, calculateScore(acc.raw, this.rules));
    }
    return Math.max(1, Math.round(performance.now() - start));
  }

  private scoreOf(acc: SeedAccount) {
    return this.scores.get(acc.id) ?? 100;
  }

  private toSummary(acc: SeedAccount): AccountSummary {
    const score = this.scoreOf(acc);
    return {
      id: acc.id,
      company_name: acc.company_name,
      current_score: score,
      health_status: getStatusTier(score),
      arr: acc.arr,
      last_active_at: acc.last_active_at,
      last_updated: this.lastSyncAt,
    };
  }

  // ---------- auth ----------

  userFromToken(token: string | null): AuthUser | null {
    if (!token) return null;
    try {
      const parts = token.split(".");
      if (parts.length < 2) return null;
      const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
      const payload = JSON.parse(atob(padded)) as {
        sub: string;
        email: string;
        role: AuthUser["role"];
        name?: string;
        exp: number;
      };
      const expMs = payload.exp > 10_000_000_000 ? payload.exp : payload.exp * 1000;
      if (!payload.sub || !payload.email || expMs <= Date.now()) return null;
      if (payload.role !== "admin" && payload.role !== "csm") return null;
      return { id: payload.sub, email: payload.email, role: payload.role, name: payload.name };
    } catch {
      return null;
    }
  }

  // ---------- accounts ----------

  listAccounts(params: AccountListParams): Paginated<AccountSummary> {
    const limit = Math.min(Math.max(params.limit ?? 50, 1), 500);
    const offset = Math.max(params.offset ?? 0, 0);
    const search = params.search?.trim().toLowerCase();

    let rows = this.accounts.map((a) => this.toSummary(a));
    if (params.status) rows = rows.filter((r) => r.health_status === params.status);
    if (search) rows = rows.filter((r) => r.company_name.toLowerCase().includes(search));
    rows.sort((a, b) => a.current_score - b.current_score || a.company_name.localeCompare(b.company_name));

    return { data: rows.slice(offset, offset + limit), total: rows.length, limit, offset };
  }

  getAccount(id: string): AccountDetail | null {
    const acc = this.accounts.find((a) => a.id === id);
    if (!acc) return null;
    return {
      ...this.toSummary(acc),
      domain: acc.domain,
      plan: acc.plan,
      owner_csm: acc.owner_csm,
      created_at: acc.created_at,
      metrics: metricsFor(acc, this.lastSyncAt),
    };
  }

  getHistory(id: string, days: number): AccountHistoryResponse | null {
    const acc = this.accounts.find((a) => a.id === id);
    if (!acc) return null;
    const n = Math.min(Math.max(days, 1), 90);
    const current = this.scoreOf(acc);
    const series = [...acc.history];
    series[series.length - 1] = current;
    const slice = series.slice(series.length - n);
    const DAY = 86_400_000;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return {
      account_id: acc.id,
      company_name: acc.company_name,
      history: slice.map((score, i) => ({
        date: new Date(today.getTime() - (slice.length - 1 - i) * DAY).toISOString().slice(0, 10),
        score,
      })),
    };
  }

  // ---------- dashboard ----------

  getDashboard(): DashboardSummary {
    const rows = this.accounts.map((a) => this.toSummary(a));
    const distribution: Record<HealthStatus, number> = { Critical: 0, "At-Risk": 0, Healthy: 0 };
    let sum = 0;
    for (const r of rows) {
      distribution[r.health_status] += 1;
      sum += r.current_score;
    }
    const top = [...rows]
      .filter((r) => r.health_status !== "Healthy")
      .sort((a, b) => a.current_score - b.current_score || b.arr - a.arr)
      .slice(0, 8);
    return {
      total_accounts: rows.length,
      at_risk_accounts: distribution.Critical + distribution["At-Risk"],
      critical_accounts: distribution.Critical,
      average_score: rows.length ? Math.round((sum / rows.length) * 10) / 10 : 0,
      last_sync_at: this.lastSyncAt,
      distribution,
      cron_status: this.cronStatus,
      top_at_risk: top,
    };
  }

  // ---------- rules ----------

  getRules(): ScoringRule[] {
    return this.rules.map((r) => ({ ...r }));
  }

  private validateTotal(candidate: ScoringRule[]): string | null {
    for (const r of candidate) {
      if (!Number.isInteger(r.weight_percentage) || r.weight_percentage < 0 || r.weight_percentage > 100) {
        return `weight_percentage for ${r.metric_name} must be an integer between 0 and 100.`;
      }
    }
    const total = candidate.filter((r) => r.is_active).reduce((s, r) => s + r.weight_percentage, 0);
    if (total !== 100) {
      return `The sum of all active scoring metric weights must equal exactly 100 (got ${total}).`;
    }
    return null;
  }

  updateRule(id: string, patch: UpdateRuleRequest, actor: AuthUser): { error?: string; rule?: ScoringRule; duration_ms?: number } {
    const idx = this.rules.findIndex((r) => r.id === id);
    if (idx === -1) return { error: "not_found" };
    const before = this.rules[idx];
    const after: ScoringRule = { ...before, ...patch, updated_at: new Date().toISOString() };
    const candidate = this.rules.map((r, i) => (i === idx ? after : r));
    const validation = this.validateTotal(candidate);
    if (validation) return { error: validation };

    this.rules = candidate;
    const duration = this.recalculateAll();
    this.pushAudit(actor, "RULE_UPDATED", before.metric_name, this.diff(before, after));
    this.pushAudit(actor, "RECALCULATION_RUN", null, {
      before: null,
      after: { accounts_recalculated: this.accounts.length, duration_ms: duration },
    });
    this.save();
    return { rule: { ...after }, duration_ms: duration };
  }

  bulkUpdateRules(body: BulkUpdateRulesRequest, actor: AuthUser): { error?: string; result?: BulkUpdateRulesResponse } {
    const byId = new Map(body.rules.map((r) => [r.id, r]));
    const befores = new Map(this.rules.map((r) => [r.id, r]));
    const now = new Date().toISOString();
    const candidate = this.rules.map((r) => {
      const patch = byId.get(r.id);
      if (!patch) return r;
      const { id: _id, ...rest } = patch;
      void _id;
      return { ...r, ...rest, updated_at: now };
    });
    for (const id of byId.keys()) {
      if (!befores.has(id)) return { error: `Unknown rule id ${id}` };
    }
    const validation = this.validateTotal(candidate);
    if (validation) return { error: validation };

    this.rules = candidate;
    const duration = this.recalculateAll();

    const changes: Record<string, unknown> = {};
    const prior: Record<string, unknown> = {};
    for (const r of candidate) {
      const b = befores.get(r.id)!;
      const d = this.diff(b, r);
      if (Object.keys(d.after).length) {
        changes[r.metric_name] = d.after;
        prior[r.metric_name] = d.before;
      }
    }
    if (Object.keys(changes).length) {
      this.pushAudit(actor, "RULES_BULK_UPDATED", null, { before: prior, after: changes });
    }
    this.pushAudit(actor, "RECALCULATION_RUN", null, {
      before: null,
      after: { accounts_recalculated: this.accounts.length, duration_ms: duration },
    });
    this.save();
    return {
      result: {
        message: "Rules updated successfully. Batch recalculation complete.",
        rules: this.getRules(),
        accounts_recalculated: this.accounts.length,
        duration_ms: duration,
      },
    };
  }

  private diff(before: ScoringRule, after: ScoringRule) {
    const keys: Array<keyof ScoringRule> = ["weight_percentage", "impact_direction", "threshold", "is_active"];
    const b: Record<string, unknown> = {};
    const a: Record<string, unknown> = {};
    for (const k of keys) {
      if (before[k] !== after[k]) {
        b[k] = before[k];
        a[k] = after[k];
      }
    }
    return { before: b, after: a };
  }

  // ---------- audit ----------

  private pushAudit(
    actor: AuthUser,
    action: AuditLogEntry["action"],
    metric: MetricName | null,
    states: { before: Record<string, unknown> | null; after: Record<string, unknown> | null },
  ) {
    this.audit.unshift({
      id: this.randomId(),
      actor: { id: actor.id, email: actor.email },
      action,
      metric_name: metric,
      before_state: states.before,
      after_state: states.after,
      created_at: new Date().toISOString(),
    });
  }

  listAudit(params: AuditLogParams): Paginated<AuditLogEntry> {
    const limit = Math.min(Math.max(params.limit ?? 25, 1), 200);
    const offset = Math.max(params.offset ?? 0, 0);
    let rows = this.audit;
    if (params.actor) rows = rows.filter((r) => r.actor.email === params.actor);
    if (params.from) rows = rows.filter((r) => r.created_at >= new Date(params.from!).toISOString());
    if (params.to) {
      const end = new Date(params.to);
      end.setHours(23, 59, 59, 999);
      rows = rows.filter((r) => r.created_at <= end.toISOString());
    }
    return { data: rows.slice(offset, offset + limit), total: rows.length, limit, offset };
  }

  auditActors(): string[] {
    return Array.from(new Set(this.audit.map((a) => a.actor.email)));
  }

  // ---------- system ----------

  triggerIngest(actor: AuthUser) {
    if (this.cronStatus === "running") return { already: true };
    this.cronStatus = "running";
    this.pushAudit(actor, "INGESTION_TRIGGERED", null, {
      before: null,
      after: { sources: ["stripe", "zendesk", "product"], manual: true },
    });
    this.save();

    setTimeout(() => {
      // Simulate fresh data: nudge ~20% of accounts' raw metrics.
      const jitter = mulberry32(Date.now() % 100_000);
      for (const acc of this.accounts) {
        if (jitter() > 0.2) continue;
        const next: Partial<Record<MetricName, number>> = {};
        next.product_usage = Math.max(0, acc.raw.product_usage + Math.round((jitter() - 0.5) * 10));
        next.support_tickets = Math.max(0, acc.raw.support_tickets + Math.round((jitter() - 0.5) * 3));
        next.overdue_invoice = Math.max(0, acc.raw.overdue_invoice + Math.round((jitter() - 0.55) * 2));
        acc.raw = { ...acc.raw, ...next };
        this.rawOverrides[acc.id] = { ...acc.raw };
      }
      this.recalculateAll();
      this.lastSyncAt = new Date().toISOString();
      this.cronStatus = "idle";
      this.save();
    }, 3_500);

    return { already: false };
  }

  health(): HealthResponse {
    const last = new Date(this.lastSyncAt).getTime();
    return {
      status: "ok",
      postgres: "connected",
      cron_worker: this.cronStatus === "running" ? "running" : "idle",
      uptime_seconds: Math.floor((Date.now() - this.startedAt) / 1000) + 3_600,
      last_ingestion_at: this.lastSyncAt,
      next_ingestion_at: new Date(last + 15 * 60_000).toISOString(),
    };
  }
}

let instance: MockDb | null = null;

export function mockDb(): MockDb {
  if (!instance) instance = new MockDb();
  return instance;
}
