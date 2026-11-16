"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AlertBanner } from "@/components/ui/ErrorState";
import { env } from "@/lib/env";
import { toApiError } from "@/lib/errors";
import { useAuth } from "./AuthProvider";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormValues = z.infer<typeof schema>;

function safeNext(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/login")) return "/dashboard";
  return next;
}

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const expired = search.get("reason") === "expired";

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await login(values);
      router.replace(safeNext(search.get("next")));
    } catch (err) {
      const e = toApiError(err);
      setServerError(e.status === 401 ? "Invalid credentials" : e.message);
    }
  });

  return (
    <div className="card-premium relative rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl border border-white/10 animate-fade-in-up">
      {/* Subtle ambient orb */}
      <div className="ambient-glow-indigo pointer-events-none absolute -top-12 -right-12 size-40 rounded-full blur-3xl opacity-50" />

      <form onSubmit={onSubmit} noValidate className="relative z-10 flex flex-col gap-4">
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
              className="pointer-events-auto text-text-muted hover:text-text cursor-pointer transition-colors"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          }
          error={errors.password?.message}
          {...register("password")}
        />

        {serverError && (
          <p className="text-xs font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5" role="alert">
            {serverError}
          </p>
        )}

        <Button type="submit" size="lg" loading={isSubmitting} className="mt-2 w-full gap-2">
          <span>{isSubmitting ? "Signing in…" : "Sign in"}</span>
          <ArrowRight className="size-4" />
        </Button>

        {env.useMocks && (
          <div className="mt-4 rounded-xl border border-white/[0.08] bg-surface-raised/40 p-3.5 text-xs text-text-muted space-y-2">
            <div className="flex items-center gap-1.5 text-text font-medium text-[11px] uppercase tracking-wider">
              <Sparkles className="size-3.5 text-blue-400" />
              <span>Demo accounts</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                className="flex flex-col text-left rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 hover:bg-white/[0.06] hover:border-white/10 transition-all cursor-pointer"
                onClick={() => {
                  setValue("email", "admin@company.com", { shouldValidate: true });
                  setValue("password", "Admin123!", { shouldValidate: true });
                }}
              >
                <span className="flex items-center gap-1.5 font-semibold text-text text-xs">
                  <ShieldCheck className="size-3.5 text-emerald-400" />
                  Admin
                </span>
                <span className="text-[10px] text-text-muted font-mono mt-0.5">admin@company.com</span>
              </button>

              <button
                type="button"
                className="flex flex-col text-left rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 hover:bg-white/[0.06] hover:border-white/10 transition-all cursor-pointer"
                onClick={() => {
                  setValue("email", "csm@company.com", { shouldValidate: true });
                  setValue("password", "Csm12345!", { shouldValidate: true });
                }}
              >
                <span className="flex items-center gap-1.5 font-semibold text-text text-xs">
                  <User className="size-3.5 text-blue-400" />
                  CSM (Read-only)
                </span>
                <span className="text-[10px] text-text-muted font-mono mt-0.5">csm@company.com</span>
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
