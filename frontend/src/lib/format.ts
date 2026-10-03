const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const compactCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

const number = new Intl.NumberFormat("en-US");

export function formatCurrency(value: number) {
  return currency.format(value);
}

export function formatCompactCurrency(value: number) {
  return compactCurrency.format(value);
}

export function formatNumber(value: number) {
  return number.format(value);
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatRelative(iso: string | null | undefined, now = Date.now()) {
  if (!iso) return "never";
  const diff = Math.round((now - new Date(iso).getTime()) / 1000);
  if (diff < 45) return "just now";
  if (diff < 3600) return `${Math.round(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)} h ago`;
  return `${Math.round(diff / 86400)} d ago`;
}

export const METRIC_LABEL: Record<string, string> = {
  product_usage: "Product Usage",
  support_tickets: "Support Tickets",
  overdue_invoice: "Billing Status",
};

export function metricLabel(name: string) {
  return METRIC_LABEL[name] ?? name;
}
