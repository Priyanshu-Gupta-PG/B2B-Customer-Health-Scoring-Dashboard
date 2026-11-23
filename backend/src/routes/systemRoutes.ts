import { Router } from "express";
import { prisma } from "../infrastructure/prisma.js";
import { config, startedAt } from "../config/index.js";
import { requireAdmin } from "../middleware/auth.js";
import { writeAudit } from "../services/AuditService.js";
import { currentCronStatus, triggerManualIngest } from "../workers/cronManager.js";
import { problem } from "../middleware/errorHandler.js";

export const ingestRouter = Router();
export const healthRouter = Router();

ingestRouter.post("/trigger", requireAdmin, async (req, res, next) => {
  try {
    const result = await triggerManualIngest();
    if (result.already) {
      problem(res, 409, "Conflict", "An ingestion job is already running.", req.originalUrl.split("?")[0]);
      return;
    }
    await writeAudit(req.user!, "INGESTION_TRIGGERED", null, null, {
      sources: ["stripe", "zendesk", "product"],
      manual: true,
    });
    res.status(202).json({ status: "processing", message: "Manual ingestion job queued." });
  } catch (err) {
    next(err);
  }
});

healthRouter.get("/", async (_req, res) => {
  let postgres: "connected" | "disconnected" = "disconnected";
  try {
    await prisma.$queryRaw`SELECT 1`;
    postgres = "connected";
  } catch {
    postgres = "disconnected";
  }

  const system = await prisma.systemState.findUnique({ where: { id: "singleton" } }).catch(() => null);
  const cron = currentCronStatus(system?.cronStatus);
  const last = system?.lastIngestionAt ?? null;
  const next = last ? new Date(last.getTime() + 15 * 60_000) : null;

  const gitSha =
    process.env.RENDER_GIT_COMMIT ||
    process.env.GIT_COMMIT ||
    process.env.COMMIT_SHA ||
    null;

  const body = {
    status: postgres === "connected" ? "ok" : "degraded",
    postgres,
    cron_worker: cron,
    uptime_seconds: Math.floor((Date.now() - startedAt) / 1000),
    last_ingestion_at: last?.toISOString() ?? null,
    next_ingestion_at: next?.toISOString() ?? null,
    // Present after Render rebuilds from main — use to confirm live-mock integration is deployed.
    git_sha: gitSha ? gitSha.slice(0, 12) : null,
    metric_sources: {
      stripe: config.stripeMockUrl,
      zendesk: config.zendeskMockUrl,
      product: config.productMockUrl,
    },
  };

  res.status(postgres === "connected" ? 200 : 503).json(body);
});
