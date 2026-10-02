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
        className="flex items-center gap-2 rounded-full border border-border bg-surface py-1 pl-1 pr-2 text-sm hover:bg-surface-raised"
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-blue-300">
          {initials}
        </span>
        <span className="hidden max-w-[10rem] truncate text-text md:block">{user.name ?? user.email}</span>
        <ChevronDown className={cn("size-3.5 text-text-muted transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-60 overflow-hidden rounded-lg border border-border bg-surface shadow-xl shadow-black/40"
        >
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-medium text-text">{user.name ?? user.email}</p>
            <p className="truncate text-xs text-text-muted">{user.email}</p>
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-surface-raised px-2 py-0.5 text-[11px] font-medium text-text-muted">
              {user.role === "admin" ? <ShieldCheck className="size-3" /> : <User className="size-3" />}
              {user.role === "admin" ? "Administrator" : "CSM · read-only"}
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
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-text hover:bg-surface-raised"
          >
            <LogOut className="size-4 text-text-muted" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
