"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, ShieldCheck, User } from "lucide-react";
import { useAuth } from "@/features/auth/AuthProvider";
import { cn } from "@/lib/cn";

export function UserMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!user) return null;
  const initials = (user.name ?? user.email)
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="border-border bg-surface hover:bg-surface-elevated flex cursor-pointer items-center gap-2 rounded-md border py-1 pr-2 pl-1 text-xs font-medium transition-colors select-none"
      >
        <span className="bg-primary-subtle text-primary flex size-6 items-center justify-center rounded text-[11px] font-semibold">
          {initials}
        </span>
        <span className="text-text hidden max-w-[9rem] truncate md:block">
          {user.name ?? user.email}
        </span>
        <ChevronDown
          className={cn("text-text-muted size-3 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="panel animate-scale-in absolute right-0 z-50 mt-1.5 w-60 overflow-hidden p-1"
        >
          <div className="border-border border-b px-3 py-2.5">
            <p className="text-text truncate text-xs font-semibold">{user.name ?? user.email}</p>
            <p className="text-text-muted truncate font-mono text-[11px]">{user.email}</p>
            <span className="border-border bg-surface-raised text-text-muted mt-2 inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[10px] font-medium">
              {user.role === "admin" ? (
                <ShieldCheck className="text-success size-3" />
              ) : (
                <User className="text-primary size-3" />
              )}
              {user.role === "admin" ? "Administrator" : "CSM · Read-only"}
            </span>
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              logout();
              router.replace("/login");
            }}
            className="text-text hover:bg-surface-elevated flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-medium transition-colors"
          >
            <LogOut className="text-danger size-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
}
