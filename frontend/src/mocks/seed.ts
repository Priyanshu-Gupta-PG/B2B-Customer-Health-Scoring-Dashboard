import type { AccountMetric, MetricName, ScoringRule, SourceApi } from "@/types/api";

/** Deterministic PRNG so reloads produce the same portfolio. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeUuid(rand: () => number) {
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

export interface SeedAccount {
  id: string;
  company_name: string;
  domain: string;
  plan: (typeof PLANS)[number];
  owner_csm: string;
  arr: number;
  created_at: string;
  last_active_at: string | null;
  /** raw ingested metrics keyed by metric name */
  raw: Record<MetricName, number>;
  /** 90-day score history, oldest first; last element is replaced by current score at runtime */
  history: number[];
}

export const METRIC_META: Record<
  MetricName,
  { source: SourceApi; label: string; unit: string; normaliseBy: number }
> = {
  product_usage: { source: "product", label: "Active logins (30d)", unit: "logins", normaliseBy: 60 },
  support_tickets: { source: "zendesk", label: "Open support tickets", unit: "tickets", normaliseBy: 10 },
  overdue_invoice: { source: "stripe", label: "Overdue invoices", unit: "invoices", normaliseBy: 5 },
};

export function defaultRules(rand: () => number): ScoringRule[] {
  const ts = new Date(Date.now() - 1000 * 60 * 60 * 24 * 19).toISOString();
  return [
    {
      id: makeUuid(rand),
      metric_name: "product_usage",
      weight_percentage: 40,
      impact_direction: "positive",
      threshold: null,
      is_active: true,
      updated_at: ts,
    },
    {
      id: makeUuid(rand),
      metric_name: "support_tickets",
      weight_percentage: 30,
      impact_direction: "negative",
      threshold: 40,
      is_active: true,
      updated_at: ts,
    },
    {
      id: makeUuid(rand),
      metric_name: "overdue_invoice",
      weight_percentage: 30,
      impact_direction: "negative",
      threshold: 40,
      is_active: true,
      updated_at: ts,
    },
  ];
}

/**
 * Company roster only — metric values start at 0 and must be filled from the
 * live Stripe / Zendesk / product mock websites (see mockSources.ts).
 */
export function buildSeedAccounts(count: number, rand: () => number): SeedAccount[] {
  const used = new Set<string>();
  const out: SeedAccount[] = [];
  const now = Date.now();
  const DAY = 86_400_000;

  while (out.length < count) {
    const name = `${PREFIXES[Math.floor(rand() * PREFIXES.length)]} ${
      SUFFIXES[Math.floor(rand() * SUFFIXES.length)]
    }`;
    if (used.has(name)) continue;
    used.add(name);

    const plan = PLANS[Math.floor(rand() * PLANS.length)];
    const planBase = { Starter: 6_000, Growth: 24_000, Business: 72_000, Enterprise: 180_000 }[plan];
    const arr = Math.round((planBase * (0.6 + rand() * 1.4)) / 100) * 100;
    const inactiveDays = Math.floor(rand() * 14);
    const createdDaysAgo = 120 + Math.floor(rand() * 700);

    out.push({
      id: makeUuid(rand),
      company_name: name,
      domain: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com`,
      plan,
      owner_csm: CSMS[Math.floor(rand() * CSMS.length)],
      arr,
      created_at: new Date(now - createdDaysAgo * DAY).toISOString(),
      last_active_at: new Date(now - inactiveDays * DAY - Math.floor(rand() * DAY)).toISOString(),
      raw: { product_usage: 0, support_tickets: 0, overdue_invoice: 0 },
      history: new Array(90).fill(0),
    });
  }

  return out;
}

export function metricsFor(account: SeedAccount, recordedAt: string): AccountMetric[] {
  return (Object.keys(METRIC_META) as MetricName[]).map((name) => ({
    id: `${account.id}:${name}`,
    source_api: METRIC_META[name].source,
    metric_type: name,
    label: METRIC_META[name].label,
    metric_value: account.raw[name],
    unit: METRIC_META[name].unit,
    recorded_at: recordedAt,
  }));
}
