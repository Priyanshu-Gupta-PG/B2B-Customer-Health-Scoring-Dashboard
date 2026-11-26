import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { generateKeyPairSync } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import {
  DEFAULT_PRODUCT_MOCK_URL,
  DEFAULT_STRIPE_MOCK_URL,
  DEFAULT_ZENDESK_MOCK_URL,
} from "../workers/mockSourceDefaults.js";

dotenv.config();

const here = dirname(fileURLToPath(import.meta.url));
const backendRoot = join(here, "../..");

function unescapePem(value: string) {
  return value.replace(/\\n/g, "\n");
}

function loadOrCreateDevKeys() {
  const envPriv = process.env.JWT_PRIVATE_KEY;
  const envPub = process.env.JWT_PUBLIC_KEY;
  if (envPriv && envPub) {
    return { privateKey: unescapePem(envPriv), publicKey: unescapePem(envPub) };
  }

  const dir = join(backendRoot, ".dev-keys");
  const privPath = join(dir, "jwt-private.pem");
  const pubPath = join(dir, "jwt-public.pem");
  if (existsSync(privPath) && existsSync(pubPath)) {
    return { privateKey: readFileSync(privPath, "utf8"), publicKey: readFileSync(pubPath, "utf8") };
  }

  try {
    mkdirSync(dir, { recursive: true });
    const pair = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const privateKey = pair.privateKey.export({ type: "pkcs8", format: "pem" }).toString();
    const publicKey = pair.publicKey.export({ type: "spki", format: "pem" }).toString();
    writeFileSync(privPath, privateKey);
    writeFileSync(pubPath, publicKey);
    return { privateKey, publicKey };
  } catch {
    // Fallback in-memory for containerized/ephemeral platforms like Render
    const pair = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const privateKey = pair.privateKey.export({ type: "pkcs8", format: "pem" }).toString();
    const publicKey = pair.publicKey.export({ type: "spki", format: "pem" }).toString();
    return { privateKey, publicKey };
  }
}

const keys = loadOrCreateDevKeys();

export const config = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  databaseUrl: process.env.DATABASE_URL ?? "",
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:3000",
  bcryptCost: Number(process.env.BCRYPT_COST ?? 12),
  ingestCron: process.env.INGEST_CRON ?? "*/15 * * * *",
  snapshotCron: process.env.SNAPSHOT_CRON ?? "0 0 * * *",
  seedAccountCount: Number(process.env.SEED_ACCOUNT_COUNT ?? 150),
  /** Stripe invoice mock website (Ledger Wire). */
  stripeMockUrl: process.env.STRIPE_MOCK_URL || DEFAULT_STRIPE_MOCK_URL,
  /** Zendesk ticket mock website (Desk Relay). */
  zendeskMockUrl: process.env.ZENDESK_MOCK_URL || DEFAULT_ZENDESK_MOCK_URL,
  /** Product-usage mock website (Signal Meter). */
  productMockUrl: process.env.PRODUCT_MOCK_URL || DEFAULT_PRODUCT_MOCK_URL,
  /** Google OAuth Web Client ID (GIS / ID token audience). */
  googleClientId: process.env.GOOGLE_CLIENT_ID?.trim() ?? "",
  /** Comma-separated emails that always receive admin on first Google sign-up. */
  googleAdminEmails: (process.env.GOOGLE_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
  /** Slack-compatible webhook for Critical health transitions (PRD F-010). */
  alertWebhookUrl: process.env.ALERT_WEBHOOK_URL?.trim() ?? "",
  /** Mock CRM endpoint for pushing scores (PRD F-009). Empty disables sync. */
  crmSyncUrl: process.env.CRM_SYNC_URL?.trim() ?? "",
  jwt: {
    privateKey: keys.privateKey,
    publicKey: keys.publicKey,
    expiresIn: "24h" as const,
  },
};

export const startedAt = Date.now();
