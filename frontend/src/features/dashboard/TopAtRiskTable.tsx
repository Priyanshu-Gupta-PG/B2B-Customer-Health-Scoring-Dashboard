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
            <ShieldAlert className="text-danger size-4" />
            Top at-risk accounts
          </span>
        }
        description="Priority outreach · Critical (0–30) and At-Risk (31–70)"
        action={
          <Link
            href="/accounts?status=Critical"
            className="group text-primary inline-flex items-center gap-1 text-xs font-medium hover:underline"
          >
            <span>View critical</span>
            <ArrowUpRight className="size-3.5" />
          </Link>
        }
      />
      {accounts.length === 0 ? (
        <EmptyState
          title="No accounts currently at risk"
          description="Every scored account is in the Healthy band (71–100)."
          className="py-12"
        />
      ) : (
        <CardBody className="overflow-x-auto p-0">
          <table className="w-full min-w-[36rem] text-sm">
            <thead>
              <tr className="border-border bg-surface-raised text-text-muted border-b text-left text-[11px] tracking-wide uppercase">
                <th className="px-4 py-2.5 font-medium">Company</th>
                <th className="px-4 py-2.5 font-medium">Score</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 text-right font-medium">ARR</th>
                <th className="px-4 py-2.5 font-medium">Last active</th>
                <th className="w-8 px-3 py-2.5">
                  <span className="sr-only">Details</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-border-subtle divide-y">
              {accounts.map((account) => {
                const initials = account.company_name
                  .split(/\s+/)
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();

                const scoreColor =
                  account.current_score <= 30
                    ? "bg-danger"
                    : account.current_score <= 70
                      ? "bg-warning"
                      : "bg-success";

                return (
                  <tr
                    key={account.id}
                    tabIndex={0}
                    role="link"
                    aria-label={`Open ${account.company_name}`}
                    className="group hover:bg-surface-raised focus-visible:bg-surface-raised cursor-pointer transition-colors focus-visible:outline-none"
                    onClick={() => router.push(`/accounts/${account.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        router.push(`/accounts/${account.id}`);
                      }
                    }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="border-border bg-surface-raised text-text-muted flex size-7 shrink-0 items-center justify-center rounded-md border text-[11px] font-medium">
                          {initials}
                        </span>
                        <span className="text-text font-medium">{account.company_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`num text-sm font-semibold ${scoreTextClass(account.current_score)}`}
                        >
                          {account.current_score}
                        </span>
                        <div className="bg-surface-elevated h-1.5 w-14 overflow-hidden rounded-sm">
                          <div
                            className={`h-full rounded-sm ${scoreColor}`}
                            style={{ width: `${account.current_score}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={account.health_status} size="sm" />
                    </td>
                    <td className="num text-text px-4 py-3 text-right font-medium">
                      {formatCompactCurrency(account.arr)}
                    </td>
                    <td className="text-text-muted px-4 py-3 text-xs">
                      {formatRelative(account.last_active_at)}
                    </td>
                    <td className="text-text-muted px-3 py-3">
                      <ChevronRight className="group-hover:text-text size-4" aria-hidden />
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
