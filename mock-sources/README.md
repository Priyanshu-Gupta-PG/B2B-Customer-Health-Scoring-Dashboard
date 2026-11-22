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

## Developer Settings (on each website)

API details are **not** shown on the main page. Open **Developer Settings** on
each site to reveal masked endpoint/body/env values, then **Reveal** or **Copy**.

`GET` without a body returns the built-in demo catalog (for the website UI).
`POST` with an `accounts` array is what the dashboard backend uses.
