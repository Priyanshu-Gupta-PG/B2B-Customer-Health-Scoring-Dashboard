import { DollarSign, Globe, Shield, User } from "lucide-react";
import type { AccountDetail } from "@/types/api";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { scoreTextClass } from "@/lib/status";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function AccountInfoCard({ account }: { account: AccountDetail }) {
  const score = account.current_score;
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const strokeColor =
    score <= 30 ? "#f43f5e" : score <= 70 ? "#f59e0b" : "#10b981";

  return (
    <Card className="flex flex-col h-full animate-fade-in-up">
      <CardHeader
        title="Account Profile"
        description="Health diagnostics & contractual tier"
        action={<StatusBadge status={account.health_status} />}
      />
      <CardBody className="space-y-6 flex-1 flex flex-col justify-between">
        {/* Radial Circular Health Gauge */}
        <div className="flex items-center gap-5 rounded-xl border border-white/[0.06] bg-surface-raised/40 p-4">
          <div className="relative size-24 shrink-0">
            <svg className="size-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-white/[0.06]"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke={strokeColor}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`num text-2xl font-bold ${scoreTextClass(score)}`}>
                {score}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-text-muted">Score</span>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-text">Deterministic Health</p>
            <p className="text-[11px] text-text-muted mt-0.5">
              Derived from 3 ingested telemetries (Usage, Support, Billing).
            </p>
            <div className="mt-2 text-xs font-medium text-text">
              Status: <span className={scoreTextClass(score)}>{account.health_status}</span>
            </div>
          </div>
        </div>

        {/* Detailed Metadata Fields */}
        <div className="grid grid-cols-2 gap-3.5 text-xs">
          <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <DollarSign className="size-3 text-emerald-400" />
              Annual Contract
            </p>
            <p className="num text-sm font-semibold text-text mt-1">
              {formatCurrency(account.arr)}
            </p>
          </div>

          <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <Shield className="size-3 text-blue-400" />
              Tier Plan
            </p>
            <p className="text-sm font-semibold text-text mt-1">{account.plan}</p>
          </div>

          <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <Globe className="size-3 text-text-muted" />
              Domain
            </p>
            <p className="text-xs font-medium text-text mt-1 truncate font-mono">{account.domain}</p>
          </div>

          <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <User className="size-3 text-text-muted" />
              Owner CSM
            </p>
            <p className="text-xs font-medium text-text mt-1 truncate">{account.owner_csm}</p>
          </div>
        </div>

        {/* Timestamps */}
        <div className="border-t border-white/[0.06] pt-3 text-[11px] text-text-muted space-y-1">
          <div className="flex justify-between">
            <span>Customer since</span>
            <span className="text-text">{formatDate(account.created_at)}</span>
          </div>
          <div className="flex justify-between">
            <span>Last activity</span>
            <span className="text-text">{formatDate(account.last_active_at)}</span>
          </div>
          <div className="flex justify-between">
            <span>Last score recalculation</span>
            <span className="text-text">{formatDateTime(account.last_updated)}</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
