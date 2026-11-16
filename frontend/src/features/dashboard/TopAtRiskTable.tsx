"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ChevronRight, ShieldAlert } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCompactCurrency, formatRelative } from "@/lib/format";
import { scoreTextClass } from "@/lib/status";
import type { AccountSummary } from "@/types/api";

export function TopAtRiskTable({ accounts }: { accounts: AccountSummary[] }) {
  const router = useRouter();

  return (
    <Card className="h-full">
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <ShieldAlert className="size-4 text-rose-400" />
            Top At-Risk Accounts
          </span>
        }
        description="Prioritize outreach · Critical (0–30) and At-Risk (31–70)"
        action={
          <Link
            href="/accounts?status=Critical"
            className="group inline-flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
          >
            <span>View critical accounts</span>
            <ArrowUpRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        }
      />
      {accounts.length === 0 ? (
        <EmptyState
          title="No accounts currently at risk"
          description="Every scored account is currently in the Healthy band (71–100)."
          className="py-12"
        />
      ) : (
        <CardBody className="overflow-x-auto p-0">
          <table className="w-full min-w-[36rem] text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02] text-text-muted text-left text-[11px] tracking-wider uppercase">
                <th className="px-5 py-3 font-medium">Company</th>
                <th className="px-5 py-3 font-medium">Score</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">ARR</th>
                <th className="px-5 py-3 font-medium">Last Active</th>
                <th className="w-8 px-3 py-3">
                  <span className="sr-only">Details</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {accounts.map((account) => {
                const initials = account.company_name
                  .split(/\s+/)
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();

                const scoreColor =
                  account.current_score <= 30
                    ? "bg-rose-500"
                    : account.current_score <= 70
                      ? "bg-amber-400"
                      : "bg-emerald-500";

                return (
                  <tr
                    key={account.id}
                    tabIndex={0}
                    role="link"
                    aria-label={`Open ${account.company_name}`}
                    className="group cursor-pointer transition-colors duration-150 hover:bg-white/[0.04] focus-visible:bg-white/[0.04] focus-visible:outline-none"
                    onClick={() => router.push(`/accounts/${account.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        router.push(`/accounts/${account.id}`);
                      }
                    }}
                  >
                    {/* Company Name with Avatar */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-surface-raised border border-white/[0.08] text-[11px] font-medium text-text-muted">
                          {initials}
                        </span>
                        <span className="text-text font-medium group-hover:text-white transition-colors">
                          {account.company_name}
                        </span>
                      </div>
                    </td>

                    {/* Score with Mini Visual Track */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className={`num font-semibold text-sm ${scoreTextClass(account.current_score)}`}>
                          {account.current_score}
                        </span>
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/[0.06]">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${scoreColor}`}
                            style={{ width: `${account.current_score}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-5 py-3.5">
                      <StatusBadge status={account.health_status} size="sm" />
                    </td>

                    {/* ARR */}
                    <td className="num text-text px-5 py-3.5 text-right font-medium">
                      {formatCompactCurrency(account.arr)}
                    </td>

                    {/* Last Active */}
                    <td className="text-text-muted px-5 py-3.5 text-xs">
                      {formatRelative(account.last_active_at)}
                    </td>

                    {/* Action Arrow */}
                    <td className="px-3 py-3.5 text-text-muted">
                      <ChevronRight className="size-4 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-white" aria-hidden />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardBody>
      )}
    </Card>
  );
}
