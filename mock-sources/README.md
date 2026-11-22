# Mock data websites

Three small websites that stand in for real Stripe, Zendesk, and product-usage APIs. Each request regenerates random metrics so the health dashboard always ingests changing data.

| Site | Port | UI | JSON feed |
|------|------|----|-----------|
| **Ledger Wire** (Stripe invoices) | 4101 | http://localhost:4101 | `POST /mock/stripe/invoices` |
| **Desk Relay** (Zendesk tickets) | 4102 | http://localhost:4102 | `POST /mock/zendesk/tickets` |
| **Signal Meter** (product usage) | 4103 | http://localhost:4103 | `POST /mock/product/usage` |

## Run

```bash
cd mock-sources
npm ci
npm start
```

Or one service at a time:

```bash
npm run start:stripe
npm run start:zendesk
npm run start:product
```

## Request body (from the dashboard backend)

```json
{
  "accounts": [
    { "id": "uuid", "domain": "acmecorp.com", "company_name": "Acme Corp" }
  ]
}
```

`GET` without a body returns the built-in demo catalog (for the website UI).

## Metric mapping

| Source | Response field | Dashboard metric |
|--------|----------------|------------------|
| Stripe | `overdue_invoices` / `metric.value` | `overdue_invoice` |
| Zendesk | `open_tickets` / `metric.value` | `support_tickets` |
| Product | `active_logins_30d` / `metric.value` | `product_usage` |
