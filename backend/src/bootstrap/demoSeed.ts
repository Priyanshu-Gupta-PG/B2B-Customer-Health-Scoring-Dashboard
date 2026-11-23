import bcrypt from "bcryptjs";
import { prisma } from "../infrastructure/prisma.js";
import { ScoringCalculator } from "../engine/ScoringCalculator.js";
import { fetchMetricsFromMockSources } from "../workers/mockSources.js";
import { recalculateAll } from "../engine/RecalculationService.js";
import { logger } from "../infrastructure/logger.js";

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeUuid(rand: () => number) {
  const hex = "0123456789abcdef";
  let out = "";
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) out += "-";
    else if (i === 14) out += "4";
    else if (i === 19) out += hex[(Math.floor(rand() * 16) & 0x3) | 0x8];
    else out += hex[Math.floor(rand() * 16)];
  }
  return out;
}

const PREFIXES = [
  "Acme", "Northwind", "Globex", "Initech", "Umbrella", "Vandelay", "Stark", "Wayne", "Hooli",
  "Pied Piper", "Aperture", "Cyberdyne", "Soylent", "Tyrell", "Wonka", "Massive", "Dunder",
  "Bluth", "Sterling", "Prestige", "Oceanic", "Virtucon", "Gringotts", "Monarch", "Lumon",
  "Vehement", "Arasaka", "Weyland", "Rekall", "Nakatomi", "Zorg", "Oscorp", "Ollivander",
  "Kaiba", "Shinra", "Abstergo", "Blackwood", "Helix", "Nimbus", "Quantum", "Vertex", "Zenith",
  "Harbor", "Beacon", "Summit", "Cobalt", "Granite", "Ember", "Juniper", "Meridian",
];
const SUFFIXES = [
  "Corp", "Labs", "Systems", "Technologies", "Industries", "Dynamics", "Holdings", "Software",
  "Networks", "Logistics", "Analytics", "Health", "Capital", "Robotics", "Cloud", "Digital",
];
const PLANS = ["Starter", "Growth", "Business", "Enterprise"] as const;
const CSMS = ["Sarah Lopez", "Marcus Reed", "Priya Nair", "Tom Becker", "Elena Rossi"];

/** Full demo portfolio seed. Wipes existing demo tables. */
export async function runDemoSeed() {
  const rand = mulberry32(20260903);
  const count = Number(process.env.SEED_ACCOUNT_COUNT ?? 50);
  const adminHash = await bcrypt.hash("Admin123!", 12);
  const csmHash = await bcrypt.hash("Csm12345!", 12);

  await prisma.auditLog.deleteMany();
  await prisma.scoreSnapshot.deleteMany();
  await prisma.accountMetric.deleteMany();
  await prisma.account.deleteMany();
  await prisma.scoringRule.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.systemState.deleteMany();

  await prisma.adminUser.createMany({
    data: [
      {
        id: "550e8400-e29b-41d4-a716-446655440000",
        email: "admin@company.com",
        passwordHash: adminHash,
        role: "admin",
        name: "David Chen",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440001",
        email: "csm@company.com",
        passwordHash: csmHash,
        role: "csm",
        name: "Sarah Lopez",
      },
    ],
  });

  const rules = [
    { id: makeUuid(rand), metricName: "product_usage", weightPercentage: 40, impactDirection: "positive", threshold: null as number | null },
    { id: makeUuid(rand), metricName: "support_tickets", weightPercentage: 30, impactDirection: "negative", threshold: 40 },
    { id: makeUuid(rand), metricName: "overdue_invoice", weightPercentage: 30, impactDirection: "negative", threshold: 40 },
  ];
  await prisma.scoringRule.createMany({
    data: rules.map((r) => ({
      id: r.id,
      metricName: r.metricName,
      weightPercentage: r.weightPercentage,
      impactDirection: r.impactDirection,
      threshold: r.threshold,
      isActive: true,
    })),
  });

  const used = new Set<string>();
  const now = Date.now();
  const DAY = 86_400_000;
  const accountRefs: { id: string; domain: string; company_name: string }[] = [];

  while (used.size < count) {
    const name = `${PREFIXES[Math.floor(rand() * PREFIXES.length)]} ${SUFFIXES[Math.floor(rand() * SUFFIXES.length)]}`;
    if (used.has(name)) continue;
    used.add(name);

    const plan = PLANS[Math.floor(rand() * PLANS.length)];
    const planBase = { Starter: 6_000, Growth: 24_000, Business: 72_000, Enterprise: 180_000 }[plan];
    const arr = Math.round((planBase * (0.6 + rand() * 1.4)) / 100) * 100;
    const inactiveDays = Math.floor(rand() * 14);
    const createdDaysAgo = 120 + Math.floor(rand() * 700);
    const id = makeUuid(rand);
    const domain = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com`;

    await prisma.account.create({
      data: {
        id,
        companyName: name,
        domain,
        plan,
        ownerCsm: CSMS[Math.floor(rand() * CSMS.length)],
        arr,
        currentScore: 0,
        healthStatus: "Critical",
        lastActiveAt: new Date(now - inactiveDays * DAY - Math.floor(rand() * DAY)),
        createdAt: new Date(now - createdDaysAgo * DAY),
      },
    });
    accountRefs.push({ id, domain, company_name: name });
  }

  logger.info({ accounts: accountRefs.length }, "Created accounts; fetching metrics from mock websites");
  const fetched = await fetchMetricsFromMockSources(accountRefs);
  if (fetched.size === 0) {
    throw new Error("Mock websites returned no metrics — seed aborted");
  }

  const recordedAt = new Date();
  let applied = 0;
  for (const account of accountRefs) {
    const metrics = fetched.get(account.id);
    if (!metrics) continue;
    await prisma.accountMetric.createMany({
      data: [
        { accountId: account.id, sourceApi: "product", metricType: "product_usage", metricValue: metrics.product_usage, recordedAt },
        { accountId: account.id, sourceApi: "zendesk", metricType: "support_tickets", metricValue: metrics.support_tickets, recordedAt },
        { accountId: account.id, sourceApi: "stripe", metricType: "overdue_invoice", metricValue: metrics.overdue_invoice, recordedAt },
      ],
    });
    applied += 1;
  }

  const { accounts: scored } = await recalculateAll();

  const scoredAccounts = await prisma.account.findMany({
    select: { id: true, currentScore: true, healthStatus: true },
  });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await prisma.scoreSnapshot.createMany({
    data: scoredAccounts.map((a) => ({
      accountId: a.id,
      calculatedScore: a.currentScore,
      healthStatus: a.healthStatus || ScoringCalculator.getStatusTier(a.currentScore),
      recordedAt: today,
    })),
  });

  await prisma.systemState.create({
    data: { id: "singleton", cronStatus: "idle", lastIngestionAt: recordedAt },
  });

  await prisma.auditLog.create({
    data: {
      actorId: "550e8400-e29b-41d4-a716-446655440000",
      actorEmail: "admin@company.com",
      action: "RULE_UPDATED",
      metricName: "overdue_invoice",
      beforeState: { weight_percentage: 20 },
      afterState: { weight_percentage: 30 },
      createdAt: new Date(now - 19 * DAY),
    },
  });

  logger.info({ accounts: accountRefs.length, applied, scored }, "Demo seed complete");
}

/** Seed only when the database has no admin users (safe for Render free-tier boot). */
export async function seedIfEmpty() {
  const existing = await prisma.adminUser.count();
  if (existing > 0 && process.env.FORCE_SEED !== "true") {
    logger.info({ existing }, "Database already seeded — skipping");
    return { seeded: false };
  }
  await runDemoSeed();
  return { seeded: true };
}
