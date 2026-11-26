import { prisma } from "../infrastructure/prisma.js";
import { logger } from "../infrastructure/logger.js";

const PLAYBOOK_SCORE_THRESHOLD = 40;

export type PlaybookCandidate = {
  id: string;
  companyName: string;
  previousScore: number;
  score: number;
};

/**
 * PRD F-011 — create an open CSM task when an account score drops below 40.
 * Skips if an open task already exists for the account.
 */
export async function createPlaybookTasksForDrops(candidates: PlaybookCandidate[]) {
  const created: string[] = [];
  for (const account of candidates) {
    if (account.score >= PLAYBOOK_SCORE_THRESHOLD) continue;
    if (account.previousScore < PLAYBOOK_SCORE_THRESHOLD) continue;

    const open = await prisma.playbookTask.findFirst({
      where: { accountId: account.id, status: "open" },
      select: { id: true },
    });
    if (open) continue;

    const task = await prisma.playbookTask.create({
      data: {
        accountId: account.id,
        title: `Outreach: ${account.companyName} health dropped below ${PLAYBOOK_SCORE_THRESHOLD}`,
        reason: `Score moved ${account.previousScore} → ${account.score}`,
        score: account.score,
        status: "open",
      },
    });
    created.push(task.id);
  }
  if (created.length > 0) {
    logger.info({ count: created.length }, "playbook tasks created");
  }
  return created;
}

export async function listPlaybookTasks(params: { status?: string; limit: number; offset: number }) {
  const where = params.status ? { status: params.status } : {};
  const [rows, total] = await Promise.all([
    prisma.playbookTask.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: params.limit,
      skip: params.offset,
      include: { account: { select: { companyName: true, ownerCsm: true, healthStatus: true } } },
    }),
    prisma.playbookTask.count({ where }),
  ]);
  return {
    data: rows.map((t) => ({
      id: t.id,
      account_id: t.accountId,
      company_name: t.account.companyName,
      owner_csm: t.account.ownerCsm,
      health_status: t.account.healthStatus,
      title: t.title,
      reason: t.reason,
      score: t.score,
      status: t.status,
      created_at: t.createdAt.toISOString(),
      completed_at: t.completedAt?.toISOString() ?? null,
    })),
    total,
    limit: params.limit,
    offset: params.offset,
  };
}

export async function completePlaybookTask(id: string) {
  const task = await prisma.playbookTask.findUnique({ where: { id } });
  if (!task) return null;
  return prisma.playbookTask.update({
    where: { id },
    data: { status: "done", completedAt: new Date() },
  });
}
