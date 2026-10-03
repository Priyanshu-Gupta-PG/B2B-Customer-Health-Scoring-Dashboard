import type { Prisma } from "@prisma/client";
import { prisma } from "../infrastructure/prisma.js";
import type { AuthUser } from "../middleware/auth.js";

export type AuditAction = "RULE_UPDATED" | "RULES_BULK_UPDATED" | "RECALCULATION_RUN" | "INGESTION_TRIGGERED";

function asJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === null || value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function writeAudit(
  actor: AuthUser,
  action: AuditAction,
  metricName: string | null,
  beforeState: unknown,
  afterState: unknown,
) {
  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      actorEmail: actor.email,
      action,
      metricName,
      beforeState: asJson(beforeState),
      afterState: asJson(afterState),
    },
  });
}

export async function listAudit(params: {
  limit: number;
  offset: number;
  actor?: string;
  from?: string;
  to?: string;
}) {
  const where: Prisma.AuditLogWhereInput = {};
  if (params.actor) where.actorEmail = params.actor;
  if (params.from || params.to) {
    where.createdAt = {};
    if (params.from) where.createdAt.gte = new Date(params.from);
    if (params.to) {
      const end = new Date(params.to);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: params.offset,
      take: params.limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    data: data.map((row) => ({
      id: row.id,
      actor: { id: row.actorId, email: row.actorEmail },
      action: row.action,
      metric_name: row.metricName,
      before_state: row.beforeState,
      after_state: row.afterState,
      created_at: row.createdAt.toISOString(),
    })),
    total,
    limit: params.limit,
    offset: params.offset,
  };
}

export async function listAuditActors() {
  const rows = await prisma.auditLog.findMany({
    distinct: ["actorEmail"],
    select: { actorEmail: true },
    orderBy: { actorEmail: "asc" },
  });
  return rows.map((r) => r.actorEmail);
}
