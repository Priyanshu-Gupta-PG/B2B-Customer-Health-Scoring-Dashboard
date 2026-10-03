import cron from "node-cron";
import { config } from "../config/index.js";
import { logger } from "../infrastructure/logger.js";
import { runDailySnapshots, runIngestion } from "./ingestion.js";

let ingestRunning = false;

export function currentCronStatus(persisted?: string | null): "running" | "idle" | "stalled" {
  if (ingestRunning) return "running";
  if (persisted === "stalled") return "stalled";
  return "idle";
}

export function startCron() {
  cron.schedule(config.ingestCron, async () => {
    if (ingestRunning) {
      logger.warn("skipping overlapping ingest cron");
      return;
    }
    ingestRunning = true;
    try {
      await runIngestion();
    } catch (err) {
      logger.error({ err }, "scheduled ingestion failed");
    } finally {
      ingestRunning = false;
    }
  });

  cron.schedule(config.snapshotCron, async () => {
    try {
      await runDailySnapshots();
    } catch (err) {
      logger.error({ err }, "scheduled snapshot failed");
    }
  });

  logger.info({ ingest: config.ingestCron, snapshot: config.snapshotCron }, "cron jobs scheduled");
}

export async function triggerManualIngest() {
  if (ingestRunning) return { already: true };
  ingestRunning = true;
  setTimeout(() => {
    void runIngestion()
      .catch((err) => logger.error({ err }, "manual ingestion failed"))
      .finally(() => {
        ingestRunning = false;
      });
  }, 50);
  return { already: false };
}
