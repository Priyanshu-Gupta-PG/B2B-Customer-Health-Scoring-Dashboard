import type { Metadata } from "next";
import { Suspense } from "react";
import { Activity, Clock, TrendingUp } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { LoginForm } from "@/features/auth/LoginForm";
import { LoginRedirect } from "@/features/auth/LoginRedirect";

export const metadata: Metadata = { title: "Sign in · PulseScore" };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen selection:bg-blue-500/20">
      {/* Brand & Editorial Showcase Panel */}
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-white/[0.08] bg-surface/90 p-12 lg:flex">
        {/* Ambient soft glow orbs */}
        <div
          className="pointer-events-none absolute -right-28 -top-28 size-96 rounded-full bg-blue-600/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-36 -left-20 size-96 rounded-full bg-emerald-600/08 blur-3xl"
          aria-hidden
        />

        <div className="relative z-10">
          <Logo />
        </div>

        <div className="relative z-10 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-text-muted backdrop-blur-md">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-soft-pulse" />
            <span>Customer Success console</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-[1.15] text-text">
            Spot at-risk accounts <span className="text-blue-400">before</span> churn hits ARR.
          </h2>

          <p className="text-sm leading-relaxed text-text-muted">
            Stripe, Zendesk, and product usage roll into a deterministic 0–100 health score every 15 minutes — so CSMs know who to call first.
          </p>

          <dl className="grid grid-cols-3 gap-3.5 pt-2">
            {[
              { val: "0–100", label: "Composite Score", icon: Activity },
              { val: "15 min", label: "Sync Interval", icon: Clock },
              { val: "90 days", label: "Audit Trajectory", icon: TrendingUp },
            ].map(({ val, label, icon: Icon }) => (
              <div
                key={label}
                className="card-premium rounded-xl p-3.5 transition-transform duration-200 hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between text-text-muted mb-2">
                  <Icon className="size-3.5 text-blue-400" />
                </div>
                <dt className="num text-xl font-bold text-text tracking-tight">{val}</dt>
                <dd className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mt-1">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-text-muted border-t border-white/[0.06] pt-6">
          <span>PulseScore B2B Console</span>
          <span className="font-mono text-[11px] text-text-subtle">v1.0 Production Architecture</span>
        </div>
      </aside>

      {/* Form authentication panel */}
      <section className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-text">Sign in</h1>
            <p className="mt-1 text-sm text-text-muted">Use your Customer Success credentials.</p>
          </div>
          <div>
            <Suspense fallback={null}>
              <LoginRedirect />
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </section>
    </div>
  );
}
