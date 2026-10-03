"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
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
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {expired && !serverError && <AlertBanner tone="warning">Your session expired. Please sign in again.</AlertBanner>}

      <Input
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@company.com"
        leading={<Mail className="size-4" />}
        error={errors.email?.message}
        {...register("email")}
      />
      <Input
        label="Password"
        type={showPassword ? "text" : "password"}
        autoComplete="current-password"
        placeholder="••••••••"
        leading={<Lock className="size-4" />}
        trailing={
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="pointer-events-auto text-text-muted hover:text-text"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        }
        error={errors.password?.message}
        {...register("password")}
      />

      {serverError && (
        <p className="text-sm text-danger" role="alert">
          {serverError}
        </p>
      )}

      <Button type="submit" size="lg" loading={isSubmitting} className="mt-2 w-full">
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>

      {env.useMocks && (
        <div className="mt-2 rounded-lg border border-dashed border-border bg-bg/60 p-3 text-xs text-text-muted">
          <p className="mb-2 font-medium text-text">Mock API is enabled — demo accounts</p>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              className="flex items-center justify-between rounded-md px-2 py-1.5 text-left hover:bg-surface-raised"
              onClick={() => {
                setValue("email", "admin@company.com", { shouldValidate: true });
                setValue("password", "Admin123!", { shouldValidate: true });
              }}
            >
              <span>
                <span className="font-mono text-text">admin@company.com</span> · Administrator
              </span>
              <span className="text-blue-300">Use</span>
            </button>
            <button
              type="button"
              className="flex items-center justify-between rounded-md px-2 py-1.5 text-left hover:bg-surface-raised"
              onClick={() => {
                setValue("email", "csm@company.com", { shouldValidate: true });
                setValue("password", "Csm12345!", { shouldValidate: true });
              }}
            >
              <span>
                <span className="font-mono text-text">csm@company.com</span> · CSM (read-only)
              </span>
              <span className="text-blue-300">Use</span>
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
