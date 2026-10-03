export const METRIC_META: Record<
  string,
  { source: "stripe" | "zendesk" | "product"; label: string; unit: string; normaliseBy: number }
> = {
  product_usage: { source: "product", label: "Active logins (30d)", unit: "logins", normaliseBy: 60 },
  support_tickets: { source: "zendesk", label: "Open support tickets", unit: "tickets", normaliseBy: 10 },
  overdue_invoice: { source: "stripe", label: "Overdue invoices", unit: "invoices", normaliseBy: 5 },
};
