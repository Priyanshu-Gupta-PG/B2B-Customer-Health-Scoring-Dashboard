import { DollarSign, Globe, Shield, User } from "lucide-react";
import type { AccountDetail } from "@/types/api";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { STATUS_COLOR, getStatusTier, scoreTextClass } from "@/lib/status";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function AccountInfoCard({ account }: { account: AccountDetail }) {
  const score = account.current_score;
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const strokeColor = STATUS_COLOR[getStatusTier(score)];

  return (
    <Card className="flex h-full flex-col">
      <CardHeader
        title="Account profile"
        description="Contract and health snapshot"
        action={<StatusBadge status={account.health_status} />}
      />
      <CardBody className="flex flex-1 flex-col justify-between space-y-5">
        <div className="border-border bg-surface-raised flex items-center gap-4 rounded-md border p-4">
          <div className="relative size-24 shrink-0">
            <svg className="size-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-border"
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
              <span className={`num text-2xl font-bold ${scoreTextClass(score)}`}>{score}</span>
              <span className="text-text-muted text-[9px] tracking-wider uppercase">Score</span>
            </div>
          </div>

          <div>
            <p className="text-text text-xs font-semibold">Deterministic Health</p>
            <p className="text-text-muted mt-0.5 text-[11px]">
              Derived from 3 ingested telemetries (Usage, Support, Billing).
            </p>
            <div className="text-text mt-2 text-xs font-medium">
              Status: <span className={scoreTextClass(score)}>{account.health_status}</span>
            </div>
          </div>
        </div>

        {/* Detailed Metadata Fields */}
        <div className="grid grid-cols-2 gap-3.5 text-xs">
          <div className="border-border-subtle bg-surface-raised rounded-lg border p-2.5">
            <p className="text-text-muted flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase">
              <DollarSign className="text-success size-3" />
              Annual Contract
            </p>
            <p className="num text-text mt-1 text-sm font-semibold">
              {formatCurrency(account.arr)}
            </p>
          </div>

          <div className="border-border-subtle bg-surface-raised rounded-lg border p-2.5">
            <p className="text-text-muted flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase">
              <Shield className="text-primary size-3" />
              Tier Plan
            </p>
            <p className="text-text mt-1 text-sm font-semibold">{account.plan}</p>
          </div>

          <div className="border-border-subtle bg-surface-raised rounded-lg border p-2.5">
            <p className="text-text-muted flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase">
              <Globe className="text-text-muted size-3" />
              Domain
            </p>
            <p className="text-text mt-1 truncate font-mono text-xs font-medium">
              {account.domain}
            </p>
          </div>

          <div className="border-border-subtle bg-surface-raised rounded-lg border p-2.5">
            <p className="text-text-muted flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase">
              <User className="text-text-muted size-3" />
              Owner CSM
            </p>
            <p className="text-text mt-1 truncate text-xs font-medium">{account.owner_csm}</p>
          </div>
        </div>

        {/* Timestamps */}
        <div className="border-border text-text-muted space-y-1 border-t pt-3 text-[11px]">
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
