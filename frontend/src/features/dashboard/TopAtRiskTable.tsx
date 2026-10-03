"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCompactCurrency, formatRelative } from "@/lib/format";
import { scoreTextClass } from "@/lib/status";
import type { AccountSummary } from "@/types/api";

export function TopAtRiskTable({ accounts }: { accounts: AccountSummary[] }) {
  const router = useRouter();

  return (
    <Card>
      <CardHeader
        title="Top at-risk accounts"
        description="Lowest scores first · Critical and At-Risk"
        action={
          <Link href="/accounts" className="text-xs font-medium text-blue-300 hover:text-white">
            View all
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
              <tr className="text-text-muted text-left text-[11px] tracking-wide uppercase">
                <th className="px-5 py-3 font-medium">Company</th>
                <th className="px-5 py-3 font-medium">Score</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">ARR</th>
                <th className="px-5 py-3 font-medium">Last active</th>
                <th className="w-8 px-3 py-3">
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr
                  key={account.id}
                  tabIndex={0}
                  role="link"
                  aria-label={`Open ${account.company_name}`}
                  className="border-border hover:bg-surface-raised/80 focus-visible:bg-surface-raised/80 focus-visible:ring-primary/40 cursor-pointer border-t transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
                  onClick={() => router.push(`/accounts/${account.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      router.push(`/accounts/${account.id}`);
                    }
                  }}
                >
                  <td className="text-text px-5 py-3.5 font-medium">{account.company_name}</td>
                  <td
                    className={`num px-5 py-3.5 font-semibold ${scoreTextClass(account.current_score)}`}
                  >
                    {account.current_score}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={account.health_status} size="sm" />
                  </td>
                  <td className="num text-text px-5 py-3.5 text-right">
                    {formatCompactCurrency(account.arr)}
                  </td>
                  <td className="text-text-muted px-5 py-3.5">
                    {formatRelative(account.last_active_at)}
                  </td>
                  <td className="text-text-muted px-3 py-3.5">
                    <ChevronRight className="size-4" aria-hidden />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      )}
    </Card>
  );
}
