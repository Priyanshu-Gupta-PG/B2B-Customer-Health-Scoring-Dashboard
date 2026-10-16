import type { Metadata } from "next";
import { Suspense } from "react";
import { Logo } from "@/components/layout/Logo";
import { GoogleSignUp } from "@/features/auth/GoogleSignUp";
import { LoginRedirect } from "@/features/auth/LoginRedirect";

export const metadata: Metadata = { title: "Sign up" };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-border bg-surface p-10 lg:flex">
        <div
          className="pointer-events-none absolute -right-32 -top-32 size-[28rem] rounded-full bg-primary/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-40 -left-20 size-[26rem] rounded-full bg-success/10 blur-3xl"
          aria-hidden
        />
        <Logo />
        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold leading-tight text-text">
            Know which accounts need you <span className="text-blue-300">today</span>.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-text-muted">
            Billing, support and product usage are combined into a deterministic 0–100 health score every 15
            minutes, so Customer Success can act before churn happens.
          </p>
          <dl className="mt-8 grid grid-cols-3 gap-4">
            {[
              ["0–100", "Health score"],
              ["15 min", "Data sync cadence"],
              ["90 days", "Trend history"],
            ].map(([v, l]) => (
              <div key={l} className="rounded-lg border border-border bg-bg/60 p-3">
                <dt className="num text-lg font-semibold text-text">{v}</dt>
                <dd className="text-[11px] uppercase tracking-wide text-text-muted">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="relative text-xs text-text-muted">B2B Customer Health Scoring Dashboard · Enterprise Edition</p>
      </aside>

      {/* Form */}
      <section className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="text-2xl font-semibold text-text">Sign up</h1>
          <p className="mt-1 text-sm text-text-muted">
            Use your Google account. The first person to sign up becomes the administrator.
          </p>
          <div className="mt-8">
            <Suspense fallback={null}>
              <LoginRedirect />
              <GoogleSignUp />
            </Suspense>
          </div>
        </div>
      </section>
    </div>
  );
}
