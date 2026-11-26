import { prisma } from "../infrastructure/prisma.js";
import { ScoringCalculator } from "../engine/ScoringCalculator.js";
import { logger } from "../infrastructure/logger.js";

const HISTORY_DAYS = 90;

function startOfLocalDay(d: Date) {
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  return day;
}

function clampScore(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * Build a deterministic walk ending at `finalScore` so Recharts has 30/60/90 days of points.
 */
export function syntheticHistoryScores(finalScore: number, days: number, salt: number): number[] {
  const scores: number[] = new Array(days);
  scores[days - 1] = clampScore(finalScore);
  let cursor = finalScore;
  // Walk backwards with small deterministic noise so charts show decay/growth.
  for (let i = days - 2; i >= 0; i--) {
    const wave = Math.sin((i + salt) * 0.35) * 4;
    const drift = ((salt % 7) - 3) * 0.15;
    cursor = clampScore(cursor - drift - wave * 0.25);
    scores[i] = cursor;
  }
  return scores;
}

/**
 * PRD US-004 / F-008 — ensure each account has ~90 daily snapshots.
 * Safe for live DBs: only inserts missing (accountId, day) pairs; never wipes.
 */
export async function backfillScoreHistory(days = HISTORY_DAYS) {
  const accounts = await prisma.account.findMany({
    select: { id: true, currentScore: true, healthStatus: true },
  });
  if (accounts.length === 0) return { inserted: 0, accounts: 0 };

  const today = startOfLocalDay(new Date());
  const from = new Date(today);
  from.setDate(from.getDate() - (days - 1));

  const existing = await prisma.scoreSnapshot.findMany({
    where: { recordedAt: { gte: from } },
    select: { accountId: true, recordedAt: true },
  });
  const have = new Set(
    existing.map((s) => `${s.accountId}|${startOfLocalDay(s.recordedAt).toISOString().slice(0, 10)}`),
  );

  const rows: Array<{
    accountId: string;
    calculatedScore: number;
    healthStatus: string;
    recordedAt: Date;
  }> = [];

  accounts.forEach((account, idx) => {
    const series = syntheticHistoryScores(account.currentScore, days, idx + 1);
    for (let offset = 0; offset < days; offset++) {
      const day = new Date(today);
      day.setDate(today.getDate() - (days - 1 - offset));
      const key = `${account.id}|${day.toISOString().slice(0, 10)}`;
      if (have.has(key)) continue;
      const score = series[offset]!;
      rows.push({
        accountId: account.id,
        calculatedScore: score,
        healthStatus: ScoringCalculator.getStatusTier(score),
        recordedAt: day,
      });
    }
  });

  if (rows.length === 0) {
    logger.info({ accounts: accounts.length, days }, "Score history already complete — skip backfill");
    return { inserted: 0, accounts: accounts.length };
  }

  // createMany in chunks to avoid huge payloads on free-tier Postgres.
  const chunk = 1000;
  for (let i = 0; i < rows.length; i += chunk) {
    await prisma.scoreSnapshot.createMany({ data: rows.slice(i, i + chunk) });
  }
  logger.info({ inserted: rows.length, accounts: accounts.length, days }, "Score history backfilled");
  return { inserted: rows.length, accounts: accounts.length };
}

/** Run backfill when recent history looks too thin for the 30-day chart. */
export async function backfillScoreHistoryIfSparse() {
  const accounts = await prisma.account.count();
  if (accounts === 0) return { inserted: 0, accounts: 0, skipped: true as const };

  const today = startOfLocalDay(new Date());
  const from = new Date(today);
  from.setDate(from.getDate() - 29);
  const recent = await prisma.scoreSnapshot.count({
    where: { recordedAt: { gte: from } },
  });
  // Expect ~1 snapshot/account/day over 30 days.
  if (recent >= accounts * 20) {
    return { inserted: 0, accounts, skipped: true as const };
  }
  const result = await backfillScoreHistory();
  return { ...result, skipped: false as const };
}
