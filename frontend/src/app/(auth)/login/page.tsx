import type { Metadata } from "next";
import { Suspense } from "react";
import { Logo } from "@/components/layout/Logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LoginForm } from "@/features/auth/LoginForm";
import { LoginRedirect } from "@/features/auth/LoginRedirect";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <aside className="border-border bg-surface relative hidden w-[42%] flex-col justify-between border-r px-10 py-10 lg:flex xl:px-14">
        <Logo />

        <div className="max-w-md space-y-4">
          <p className="text-text-muted text-xs font-medium tracking-[0.12em] uppercase">
            Customer success console
          </p>
          <h2 className="text-text text-3xl leading-snug font-semibold tracking-tight">
            Know which accounts need attention before renewal risk compounds.
          </h2>
          <p className="text-text-muted text-sm leading-relaxed">
            PulseScore combines product usage, support volume, and billing signals into a single
            0–100 health score refreshed every 15 minutes.
          </p>

          <dl className="grid grid-cols-3 gap-3 pt-2 text-xs">
            {[
              { val: "0–100", label: "Score range" },
              { val: "15m", label: "Sync cadence" },
              { val: "90d", label: "Score history" },
            ].map(({ val, label }) => (
              <div
                key={label}
                className="border-border bg-surface-raised rounded-md border px-3 py-2.5"
              >
                <dt className="num text-text text-lg font-semibold">{val}</dt>
                <dd className="text-text-muted mt-0.5 text-[11px]">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="text-text-subtle text-xs">PulseScore · Internal CS tooling</p>
      </aside>

      <section className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-[58%]">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <div className="mb-5">
            <h1 className="text-text text-2xl font-semibold tracking-tight">Sign in</h1>
            <p className="text-text-muted mt-1 text-sm">Use your work credentials to continue.</p>
          </div>
          <Suspense fallback={null}>
            <LoginRedirect />
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
