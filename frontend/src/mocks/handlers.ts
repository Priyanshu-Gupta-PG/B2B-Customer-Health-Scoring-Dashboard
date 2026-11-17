import { delay, http, HttpResponse } from "msw";
import { env } from "@/lib/env";
import type {
  AuthUser,
  BulkUpdateRulesRequest,
  HealthStatus,
  LoginRequest,
  ProblemDetails,
  UpdateRuleRequest,
} from "@/types/api";
import { mockDb } from "./db";

const API = env.apiUrl;
const ORIGIN = env.apiOrigin;
const LATENCY = { min: 120, max: 420 };

function problem(status: number, title: string, detail: string, instance?: string) {
  const body: ProblemDetails = {
    type: `https://health-dashboard.internal/errors/${title.toLowerCase().replace(/\s+/g, "-")}`,
    title,
    status,
    detail,
    instance,
  };
  return HttpResponse.json(body, {
    status,
    headers: { "Content-Type": "application/problem+json" },
  });
}

function jitter() {
  return delay(LATENCY.min + Math.random() * (LATENCY.max - LATENCY.min));
}

function authenticate(request: Request): AuthUser | Response {
  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const user = mockDb().userFromToken(token);
  if (!user) {
    return problem(
      401,
      "Unauthorized",
      "A valid bearer token is required.",
      new URL(request.url).pathname,
    );
  }
  return user;
}

function requireAdmin(user: AuthUser, request: Request): Response | null {
  if (user.role !== "admin") {
    return problem(403, "Forbidden", "Admin privileges required.", new URL(request.url).pathname);
  }
  return null;
}

const isUser = (v: AuthUser | Response): v is AuthUser => !(v instanceof Response);

const VALID_STATUS: HealthStatus[] = ["Critical", "At-Risk", "Healthy"];

export const handlers = [
  // ---------- Auth ----------
  http.post(`${API}/auth/login`, async ({ request }) => {
    await jitter();
    const body = (await request.json().catch(() => null)) as LoginRequest | null;
    if (!body?.email || !body?.password) {
      return problem(
        422,
        "Validation Error",
        "Email and password are required.",
        "/api/v1/auth/login",
      );
    }
    const session = await mockDb().login(body.email, body.password);
    if (!session) {
      return problem(
        401,
        "Invalid credentials",
        "Email or password is incorrect.",
        "/api/v1/auth/login",
      );
    }
    return HttpResponse.json(session);
  }),

  /** Mock-only sample login — issues an opaque session without shipping passwords in the UI. */
  http.post(`${API}/auth/demo`, async ({ request }) => {
    await jitter();
    const body = (await request.json().catch(() => null)) as { role?: string } | null;
    if (body?.role !== "admin" && body?.role !== "csm") {
      return problem(422, "Validation Error", "role must be admin or csm.", "/api/v1/auth/demo");
    }
    const session = mockDb().loginAsDemo(body.role);
    if (!session) {
      return problem(401, "Invalid credentials", "Demo user is unavailable.", "/api/v1/auth/demo");
    }
    return HttpResponse.json(session);
  }),

  // ---------- Accounts ----------
  http.get(`${API}/accounts`, async ({ request }) => {
    const auth = authenticate(request);
    if (!isUser(auth)) return auth;
    await jitter();
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    if (status && !VALID_STATUS.includes(status as HealthStatus)) {
      return problem(422, "Validation Error", "status must be Critical, At-Risk or Healthy.");
    }
    return HttpResponse.json(
      mockDb().listAccounts({
        status: (status as HealthStatus | null) ?? undefined,
        search: url.searchParams.get("search") ?? undefined,
        limit: Number(url.searchParams.get("limit") ?? 50),
        offset: Number(url.searchParams.get("offset") ?? 0),
      }),
    );
  }),

  http.get(`${API}/accounts/:id`, async ({ request, params }) => {
    const auth = authenticate(request);
    if (!isUser(auth)) return auth;
    await jitter();
    const account = mockDb().getAccount(String(params.id));
    if (!account)
      return problem(404, "Not Found", "Account not found.", `/api/v1/accounts/${params.id}`);
    return HttpResponse.json(account);
  }),

  http.get(`${API}/accounts/:id/history`, async ({ request, params }) => {
    const auth = authenticate(request);
    if (!isUser(auth)) return auth;
    await jitter();
    const days = Number(new URL(request.url).searchParams.get("days") ?? 30);
    if (!Number.isFinite(days) || days < 1 || days > 90) {
      return problem(422, "Validation Error", "days must be between 1 and 90.");
    }
    const history = mockDb().getHistory(String(params.id), days);
    if (!history) return problem(404, "Not Found", "Account not found.");
    return HttpResponse.json(history);
  }),

  // ---------- Dashboard (gap) ----------
  http.get(`${API}/dashboard/summary`, async ({ request }) => {
    const auth = authenticate(request);
    if (!isUser(auth)) return auth;
    await jitter();
    return HttpResponse.json(mockDb().getDashboard());
  }),

  // ---------- Rules ----------
  http.get(`${API}/rules`, async ({ request }) => {
    const auth = authenticate(request);
    if (!isUser(auth)) return auth;
    await jitter();
    return HttpResponse.json({ data: mockDb().getRules() });
  }),

  http.patch(`${API}/rules/:id`, async ({ request, params }) => {
    const auth = authenticate(request);
    if (!isUser(auth)) return auth;
    const forbidden = requireAdmin(auth, request);
    if (forbidden) return forbidden;
    await jitter();
    const body = (await request.json().catch(() => null)) as UpdateRuleRequest | null;
    if (!body) return problem(422, "Validation Error", "Request body must be JSON.");
    const result = mockDb().updateRule(String(params.id), body, auth);
    if (result.error === "not_found") return problem(404, "Not Found", "Rule not found.");
    if (result.error)
      return problem(422, "Validation Error", result.error, `/api/v1/rules/${params.id}`);
    return HttpResponse.json({
      message: "Rule updated successfully. Batch recalculation triggered.",
      rule: result.rule,
    });
  }),

  http.put(`${API}/rules`, async ({ request }) => {
    const auth = authenticate(request);
    if (!isUser(auth)) return auth;
    const forbidden = requireAdmin(auth, request);
    if (forbidden) return forbidden;
    await delay(600 + Math.random() * 500); // batch recalculation feels like work
    const body = (await request.json().catch(() => null)) as BulkUpdateRulesRequest | null;
    if (!body?.rules || !Array.isArray(body.rules)) {
      return problem(422, "Validation Error", "rules[] is required.");
    }
    const result = mockDb().bulkUpdateRules(body, auth);
    if (result.error) return problem(422, "Validation Error", result.error, "/api/v1/rules");
    return HttpResponse.json(result.result);
  }),

  // ---------- Audit ----------
  http.get(`${API}/audit-logs`, async ({ request }) => {
    const auth = authenticate(request);
    if (!isUser(auth)) return auth;
    await jitter();
    const url = new URL(request.url);
    return HttpResponse.json(
      mockDb().listAudit({
        limit: Number(url.searchParams.get("limit") ?? 25),
        offset: Number(url.searchParams.get("offset") ?? 0),
        actor: url.searchParams.get("actor") ?? undefined,
        from: url.searchParams.get("from") ?? undefined,
        to: url.searchParams.get("to") ?? undefined,
      }),
    );
  }),

  http.get(`${API}/audit-logs/actors`, async ({ request }) => {
    const auth = authenticate(request);
    if (!isUser(auth)) return auth;
    return HttpResponse.json({ data: mockDb().auditActors() });
  }),

  // ---------- System ----------
  http.post(`${API}/ingest/trigger`, async ({ request }) => {
    const auth = authenticate(request);
    if (!isUser(auth)) return auth;
    const forbidden = requireAdmin(auth, request);
    if (forbidden) return forbidden;
    await jitter();
    const { already } = mockDb().triggerIngest(auth);
    if (already) {
      return problem(
        409,
        "Conflict",
        "An ingestion job is already running.",
        "/api/v1/ingest/trigger",
      );
    }
    return HttpResponse.json(
      { status: "processing", message: "Manual ingestion job queued." },
      { status: 202 },
    );
  }),

  http.get(`${ORIGIN}/health`, async () => {
    await delay(80);
    return HttpResponse.json(mockDb().health());
  }),
];
