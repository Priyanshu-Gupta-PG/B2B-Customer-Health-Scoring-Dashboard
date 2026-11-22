import { logger } from "../infrastructure/logger.js";
import {
  DEFAULT_PRODUCT_MOCK_URL,
  DEFAULT_STRIPE_MOCK_URL,
  DEFAULT_ZENDESK_MOCK_URL,
} from "./mockSourceDefaults.js";

export type MockAccountRef = {
  id: string;
  domain: string;
  company_name: string;
};

export type FetchedMetrics = {
  product_usage: number;
  support_tickets: number;
  overdue_invoice: number;
};

type SourceRow = {
  account_id?: string;
  domain?: string;
  metric?: { value?: number };
  overdue_invoices?: number;
  open_tickets?: number;
  active_logins_30d?: number;
};

export function sourceUrls() {
  return {
    stripe: process.env.STRIPE_MOCK_URL || DEFAULT_STRIPE_MOCK_URL,
    zendesk: process.env.ZENDESK_MOCK_URL || DEFAULT_ZENDESK_MOCK_URL,
    product: process.env.PRODUCT_MOCK_URL || DEFAULT_PRODUCT_MOCK_URL,
  };
}

function indexRows(rows: SourceRow[]) {
  const byId = new Map<string, number>();
  const byDomain = new Map<string, number>();
  for (const row of rows) {
    const value =
      typeof row.metric?.value === "number"
        ? row.metric.value
        : typeof row.overdue_invoices === "number"
          ? row.overdue_invoices
          : typeof row.open_tickets === "number"
            ? row.open_tickets
            : typeof row.active_logins_30d === "number"
              ? row.active_logins_30d
              : null;
    if (value === null) continue;
    if (row.account_id) byId.set(row.account_id, value);
    if (row.domain) byDomain.set(row.domain.toLowerCase(), value);
  }
  return { byId, byDomain };
}

async function postSource(url: string, path: string, accounts: MockAccountRef[]): Promise<SourceRow[]> {
  const res = await fetch(`${url.replace(/\/$/, "")}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ accounts }),
  });
  if (!res.ok) {
    throw new Error(`${path} responded ${res.status}`);
  }
  const json = (await res.json()) as { data?: SourceRow[] };
  return Array.isArray(json.data) ? json.data : [];
}

/** True when all three mock website base URLs resolve to non-empty strings. */
export function mockSourcesConfigured() {
  const urls = sourceUrls();
  return Boolean(urls.stripe && urls.zendesk && urls.product);
}

/**
 * Pull fresh metrics from the three mock websites (Stripe / Zendesk / product usage).
 * Values change on every successful fetch.
 */
export async function fetchMetricsFromMockSources(
  accounts: MockAccountRef[],
): Promise<Map<string, FetchedMetrics>> {
  const urls = sourceUrls();
  if (!urls.stripe || !urls.zendesk || !urls.product) {
    throw new Error("Mock source URLs are not configured");
  }

  const payload = accounts.map((a) => ({
    id: a.id,
    domain: a.domain,
    company_name: a.company_name,
  }));

  const [stripeRows, zendeskRows, productRows] = await Promise.all([
    postSource(urls.stripe, "/mock/stripe/invoices", payload),
    postSource(urls.zendesk, "/mock/zendesk/tickets", payload),
    postSource(urls.product, "/mock/product/usage", payload),
  ]);

  const stripe = indexRows(stripeRows);
  const zendesk = indexRows(zendeskRows);
  const product = indexRows(productRows);

  const out = new Map<string, FetchedMetrics>();
  for (const account of accounts) {
    const domain = account.domain.toLowerCase();
    const overdue = stripe.byId.get(account.id) ?? stripe.byDomain.get(domain);
    const tickets = zendesk.byId.get(account.id) ?? zendesk.byDomain.get(domain);
    const usage = product.byId.get(account.id) ?? product.byDomain.get(domain);
    if (overdue === undefined || tickets === undefined || usage === undefined) {
      logger.warn({ accountId: account.id, domain }, "mock source missing metric for account");
      continue;
    }
    out.set(account.id, {
      overdue_invoice: overdue,
      support_tickets: tickets,
      product_usage: usage,
    });
  }
  return out;
}
