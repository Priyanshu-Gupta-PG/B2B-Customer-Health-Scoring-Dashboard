import { logger } from "../infrastructure/logger.js";
import { config } from "../config/index.js";

export type CrmAccountScore = {
  id: string;
  companyName: string;
  domain: string;
  score: number;
  healthStatus: string;
  arr: number;
};

/**
 * PRD F-009 — push current scores into a mock CRM (Salesforce/HubSpot-style webhook).
 * No-op when CRM_SYNC_URL is unset.
 */
export async function syncScoresToCrm(accounts: CrmAccountScore[]) {
  const url = config.crmSyncUrl;
  if (!url || accounts.length === 0) return { synced: 0, skipped: true as const };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        source: "pulse-score",
        synced_at: new Date().toISOString(),
        records: accounts.map((a) => ({
          external_id: a.id,
          company_name: a.companyName,
          domain: a.domain,
          health_score: a.score,
          health_status: a.healthStatus,
          arr: a.arr,
        })),
      }),
    });
    if (!res.ok) {
      logger.warn({ status: res.status }, "CRM sync failed");
      return { synced: 0, skipped: false as const, error: `HTTP ${res.status}` };
    }
    logger.info({ count: accounts.length }, "CRM sync complete");
    return { synced: accounts.length, skipped: false as const };
  } catch (err) {
    logger.warn({ err }, "CRM sync error");
    return { synced: 0, skipped: false as const, error: "network" };
  }
}
