import { prisma } from "../infrastructure/prisma.js";
import { currentCronStatus } from "../workers/cronManager.js";
import { METRIC_META } from "../workers/metricMeta.js";

const METRIC_ORDER = ["product_usage", "support_tickets", "overdue_invoice"] as const;

function toSummary(account: {
  id: string;
  companyName: string;
  currentScore: number;
  healthStatus: string;
  arr: number;
  lastActiveAt: Date | null;
  updatedAt: Date;
}) {
  return {
    id: account.id,
    company_name: account.companyName,
    current_score: account.currentScore,
    health_status: account.healthStatus,
    arr: account.arr,
    last_active_at: account.lastActiveAt?.toISOString() ?? null,
    last_updated: account.updatedAt.toISOString(),
  };
}

export async function listAccounts(params: {
  status?: string;
  search?: string;
  limit: number;
  offset: number;
}) {
  const where = {
    ...(params.status ? { healthStatus: params.status } : {}),
    ...(params.search
      ? { companyName: { contains: params.search, mode: "insensitive" as const } }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.account.findMany({
      where,
      orderBy: [{ currentScore: "asc" }, { companyName: "asc" }],
      skip: params.offset,
      take: params.limit,
    }),
    prisma.account.count({ where }),
  ]);

  return {
    data: rows.map(toSummary),
    total,
    limit: params.limit,
    offset: params.offset,
  };
}

export async function getAccount(id: string) {
  const account = await prisma.account.findUnique({
    where: { id },
    include: { metrics: true },
  });
  if (!account) return null;

  const metrics = METRIC_ORDER.map((type) => {
    const row = account.metrics.find((m) => m.metricType === type);
    const meta = METRIC_META[type];
    return {
      id: row?.id ?? `${account.id}:${type}`,
      source_api: meta.source,
      metric_type: type,
      label: meta.label,
      metric_value: row ? Number(row.metricValue) : 0,
      unit: meta.unit,
      recorded_at: (row?.recordedAt ?? account.updatedAt).toISOString(),
    };
  });

  return {
    ...toSummary(account),
    domain: account.domain,
    plan: account.plan,
    owner_csm: account.ownerCsm,
    created_at: account.createdAt.toISOString(),
    metrics,
  };
}

export async function getAccountHistory(id: string, days: number) {
  const account = await prisma.account.findUnique({ where: { id } });
  if (!account) return null;

  const from = new Date();
  from.setHours(0, 0, 0, 0);
  from.setDate(from.getDate() - (days - 1));

  const snapshots = await prisma.scoreSnapshot.findMany({
    where: { accountId: id, recordedAt: { gte: from } },
    orderBy: { recordedAt: "asc" },
  });

  const byDate = new Map<string, number>();
  for (const snapshot of snapshots) {
    byDate.set(snapshot.recordedAt.toISOString().slice(0, 10), snapshot.calculatedScore);
  }

  return {
    account_id: account.id,
    company_name: account.companyName,
    history: [...byDate.entries()].map(([date, score]) => ({ date, score })),
  };
}

export async function getDashboard() {
  const [accounts, system] = await Promise.all([
    prisma.account.findMany({
      orderBy: [{ currentScore: "asc" }, { arr: "desc" }],
    }),
    prisma.systemState.findUnique({ where: { id: "singleton" } }),
  ]);

  const distribution = { Critical: 0, "At-Risk": 0, Healthy: 0 };
  let sum = 0;
  for (const a of accounts) {
    if (a.healthStatus in distribution) {
      distribution[a.healthStatus as keyof typeof distribution] += 1;
    }
    sum += a.currentScore;
  }

  const top = [...accounts]
    .filter((a) => a.healthStatus !== "Healthy")
    .sort((a, b) => a.currentScore - b.currentScore || b.arr - a.arr)
    .slice(0, 8)
    .map(toSummary);

  return {
    total_accounts: accounts.length,
    at_risk_accounts: distribution.Critical + distribution["At-Risk"],
    critical_accounts: distribution.Critical,
    average_score: accounts.length ? Math.round((sum / accounts.length) * 10) / 10 : 0,
    last_sync_at: system?.lastIngestionAt?.toISOString() ?? null,
    distribution,
    cron_status: currentCronStatus(system?.cronStatus),
    top_at_risk: top,
  };
}
