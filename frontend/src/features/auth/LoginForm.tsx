"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AlertBanner } from "@/components/ui/ErrorState";
import { env } from "@/lib/env";
import { toApiError } from "@/lib/errors";
import type { AuthUser } from "@/types/api";
import { useAuth } from "./AuthProvider";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormValues = z.infer<typeof schema>;

function safeNext(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/login"))
    return "/dashboard";
  return next;
}

export function LoginForm() {
  const { login, loginDemo } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [demoLoading, setDemoLoading] = useState<AuthUser["role"] | null>(null);
  const expired = search.get("reason") === "expired";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const finish = () => router.replace(safeNext(search.get("next")));

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await login(values);
      finish();
    } catch (err) {
      const e = toApiError(err);
      setServerError(e.status === 401 ? "Invalid credentials" : e.message);
    }
  });

  const onDemo = async (role: AuthUser["role"]) => {
    setServerError(null);
    setDemoLoading(role);
    try {
      await loginDemo(role);
      finish();
    } catch (err) {
      const e = toApiError(err);
      setServerError(e.message);
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="panel p-5 sm:p-6">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {expired && !serverError && (
          <AlertBanner tone="warning">Your session expired. Please sign in again.</AlertBanner>
        )}

        <Input
          label="Work email"
          type="email"
          autoComplete="email"
          placeholder="user@company.com"
          leading={<Mail className="size-4" />}
          error={errors.email?.message}
          {...register("email")}
        />

        <Input
          label="Password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          placeholder="••••••••••••"
          leading={<Lock className="size-4" />}
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="text-text-muted hover:text-text pointer-events-auto cursor-pointer transition-colors"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          }
          error={errors.password?.message}
          {...register("password")}
        />

        {serverError && (
          <p
            className="border-danger/25 bg-danger-subtle text-danger rounded-md border p-2.5 text-xs font-medium"
            role="alert"
          >
            {serverError}
          </p>
        )}

        <Button type="submit" size="lg" loading={isSubmitting} className="mt-1 w-full gap-2">
          <span>{isSubmitting ? "Signing in…" : "Sign in"}</span>
          <ArrowRight className="size-4" />
        </Button>

        {env.useMocks && (
          <div className="border-border bg-surface-raised text-text-muted mt-2 space-y-2 rounded-md border p-3 text-xs">
            <p className="text-text text-[11px] font-semibold tracking-wide uppercase">
              Sample access
            </p>
            <p className="text-text-muted text-[11px] leading-relaxed">
              Use a one-click sample session. No demo passwords are embedded in the client.
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                disabled={demoLoading !== null || isSubmitting}
                className="border-border bg-surface hover:bg-surface-elevated flex cursor-pointer flex-col rounded-md border p-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => void onDemo("admin")}
              >
                <span className="text-text flex items-center gap-1.5 text-xs font-semibold">
                  <ShieldCheck className="text-success size-3.5" />
                  {demoLoading === "admin" ? "Signing in…" : "Continue as Admin"}
                </span>
                <span className="text-text-muted mt-0.5 text-[10px]">Full access · sample data</span>
              </button>

              <button
                type="button"
                disabled={demoLoading !== null || isSubmitting}
                className="border-border bg-surface hover:bg-surface-elevated flex cursor-pointer flex-col rounded-md border p-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => void onDemo("csm")}
              >
                <span className="text-text flex items-center gap-1.5 text-xs font-semibold">
                  <User className="text-primary size-3.5" />
                  {demoLoading === "csm" ? "Signing in…" : "Continue as CSM"}
                </span>
                <span className="text-text-muted mt-0.5 text-[10px]">Read-only · sample data</span>
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
