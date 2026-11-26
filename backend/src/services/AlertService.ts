import { logger } from "../infrastructure/logger.js";
import { config } from "../config/index.js";

export type CriticalTransition = {
  id: string;
  companyName: string;
  previousStatus: string;
  newStatus: string;
  score: number;
  arr: number;
};

/**
 * PRD F-010 — notify when a high-value account turns Critical.
 * Posts a Slack-compatible webhook payload when ALERT_WEBHOOK_URL is set.
 */
export async function notifyCriticalTransitions(transitions: CriticalTransition[]) {
  const webhook = config.alertWebhookUrl;
  if (!webhook || transitions.length === 0) return;

  for (const account of transitions) {
    const text =
      `🚨 *Critical health alert*\n` +
      `*${account.companyName}* moved ${account.previousStatus} → Critical ` +
      `(score ${account.score}, ARR $${account.arr.toLocaleString()}).`;
    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          text,
          account_id: account.id,
          company_name: account.companyName,
          previous_status: account.previousStatus,
          new_status: account.newStatus,
          score: account.score,
          arr: account.arr,
        }),
      });
      if (!res.ok) {
        logger.warn({ status: res.status, accountId: account.id }, "alert webhook failed");
      }
    } catch (err) {
      logger.warn({ err, accountId: account.id }, "alert webhook error");
    }
  }
}
