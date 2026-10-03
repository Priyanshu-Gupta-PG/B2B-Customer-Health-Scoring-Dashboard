import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { ScoringCalculator, METRIC_NORMALISERS } from "../src/engine/ScoringCalculator.js";

dotenv.config();

const prisma = new PrismaClient();

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

type Rule = {
  id: string;
  metricName: string;
  weightPercentage: number;
  impactDirection: "positive" | "negative";
  threshold: number | null;
};

function scoreOf(raw: Record<string, number>, rules: Rule[]) {
  return ScoringCalculator.calculate(
    rules.map((r) => ({
      metricType: r.metricName,
      rawValue: raw[r.metricName] ?? 0,
      weight: r.weightPercentage,
      direction: r.impactDirection,
      normaliseBy: METRIC_NORMALISERS[r.metricName] ?? 1,
    })),
  );
}

async function main() {
  const rand = mulberry32(20260903);
  const count = Number(process.env.SEED_ACCOUNT_COUNT ?? 150);
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

  const rules: Rule[] = [
    { id: makeUuid(rand), metricName: "product_usage", weightPercentage: 40, impactDirection: "positive", threshold: null },
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

  while (used.size < count) {
    const name = `${PREFIXES[Math.floor(rand() * PREFIXES.length)]} ${SUFFIXES[Math.floor(rand() * SUFFIXES.length)]}`;
    if (used.has(name)) continue;
    used.add(name);

    const roll = rand();
    const archetype = roll < 0.55 ? "healthy" : roll < 0.85 ? "drifting" : "critical";
    const plan = PLANS[Math.floor(rand() * PLANS.length)];
    const planBase = { Starter: 6_000, Growth: 24_000, Business: 72_000, Enterprise: 180_000 }[plan];
    const arr = Math.round((planBase * (0.6 + rand() * 1.4)) / 100) * 100;

    let logins: number;
    let tickets: number;
    let overdue: number;
    let inactiveDays: number;
    if (archetype === "healthy") {
      logins = 38 + Math.floor(rand() * 40);
      tickets = Math.floor(rand() * 3);
      overdue = rand() < 0.1 ? 1 : 0;
      inactiveDays = Math.floor(rand() * 3);
    } else if (archetype === "drifting") {
      logins = 12 + Math.floor(rand() * 30);
      tickets = 2 + Math.floor(rand() * 5);
      overdue = rand() < 0.45 ? 1 + Math.floor(rand() * 2) : 0;
      inactiveDays = 2 + Math.floor(rand() * 8);
    } else {
      logins = Math.floor(rand() * 14);
      tickets = 4 + Math.floor(rand() * 8);
      overdue = 1 + Math.floor(rand() * 5);
      inactiveDays = 8 + Math.floor(rand() * 25);
    }

    const raw = { product_usage: logins, support_tickets: tickets, overdue_invoice: overdue };
    const current = scoreOf(raw, rules);
    const status = ScoringCalculator.getStatusTier(current);
    const createdDaysAgo = 120 + Math.floor(rand() * 700);
    const id = makeUuid(rand);

    await prisma.account.create({
      data: {
        id,
        companyName: name,
        domain: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com`,
        plan,
        ownerCsm: CSMS[Math.floor(rand() * CSMS.length)],
        arr,
        currentScore: current,
        healthStatus: status,
        lastActiveAt: new Date(now - inactiveDays * DAY - Math.floor(rand() * DAY)),
        createdAt: new Date(now - createdDaysAgo * DAY),
        metrics: {
          create: [
            { sourceApi: "product", metricType: "product_usage", metricValue: logins },
            { sourceApi: "zendesk", metricType: "support_tickets", metricValue: tickets },
            { sourceApi: "stripe", metricType: "overdue_invoice", metricValue: overdue },
          ],
        },
      },
    });

    const history: { accountId: string; calculatedScore: number; healthStatus: string; recordedAt: Date }[] = [];
    const endGuess = archetype === "healthy" ? 82 : archetype === "drifting" ? 52 : 22;
    let v = endGuess;
    for (let d = 89; d >= 0; d--) {
      const score = d === 89 ? current : Math.max(0, Math.min(100, Math.round(v)));
      history.push({
        accountId: id,
        calculatedScore: score,
        healthStatus: ScoringCalculator.getStatusTier(score),
        recordedAt: new Date(now - (89 - d) * DAY),
      });
      const drift = archetype === "critical" ? 0.55 : archetype === "drifting" ? 0.2 : 0.02;
      v = v + drift + (rand() - 0.5) * 4;
    }
    await prisma.scoreSnapshot.createMany({ data: history });
  }

  await prisma.systemState.create({
    data: { id: "singleton", cronStatus: "idle", lastIngestionAt: new Date(now - 7 * 60_000) },
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

  console.log(`Seeded ${count} accounts, 2 users, 3 rules.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
