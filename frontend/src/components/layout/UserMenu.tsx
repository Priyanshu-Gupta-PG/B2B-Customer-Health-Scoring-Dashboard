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
        className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-surface-raised/70 py-1 pl-1 pr-2.5 text-xs font-medium hover:bg-surface-elevated hover:border-white/15 transition-all duration-150 cursor-pointer select-none"
      >
        <span className="flex size-6 items-center justify-center rounded-full bg-blue-500/20 text-[11px] font-bold text-blue-300">
          {initials}
        </span>
        <span className="hidden max-w-[9rem] truncate text-text md:block font-medium">
          {user.name ?? user.email}
        </span>
        <ChevronDown className={cn("size-3 text-text-muted transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <div
          role="menu"
          className="card-premium animate-scale-in absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-white/10 p-1.5 shadow-2xl backdrop-blur-xl z-50"
        >
          <div className="border-b border-white/[0.06] px-3.5 py-3">
            <p className="truncate text-xs font-semibold text-text">{user.name ?? user.email}</p>
            <p className="truncate text-[11px] text-text-muted font-mono">{user.email}</p>
            <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-0.5 text-[10px] font-medium text-text-muted">
              {user.role === "admin" ? <ShieldCheck className="size-3 text-emerald-400" /> : <User className="size-3 text-blue-400" />}
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
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-text hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer mt-1"
          >
            <LogOut className="size-3.5 text-rose-400" />
            <span>Sign out of session</span>
          </button>
        </div>
      )}
    </div>
  );
}
