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
              Demo accounts
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                className="border-border bg-surface hover:bg-surface-elevated flex cursor-pointer flex-col rounded-md border p-2 text-left transition-colors"
                onClick={() => {
                  setValue("email", "admin@company.com", { shouldValidate: true });
                  setValue("password", "Admin123!", { shouldValidate: true });
                }}
              >
                <span className="text-text flex items-center gap-1.5 text-xs font-semibold">
                  <ShieldCheck className="text-success size-3.5" />
                  Admin
                </span>
                <span className="text-text-muted mt-0.5 font-mono text-[10px]">
                  admin@company.com
                </span>
              </button>

              <button
                type="button"
                className="border-border bg-surface hover:bg-surface-elevated flex cursor-pointer flex-col rounded-md border p-2 text-left transition-colors"
                onClick={() => {
                  setValue("email", "csm@company.com", { shouldValidate: true });
                  setValue("password", "Csm12345!", { shouldValidate: true });
                }}
              >
                <span className="text-text flex items-center gap-1.5 text-xs font-semibold">
                  <User className="text-primary size-3.5" />
                  CSM (read-only)
                </span>
                <span className="text-text-muted mt-0.5 font-mono text-[10px]">
                  csm@company.com
                </span>
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
