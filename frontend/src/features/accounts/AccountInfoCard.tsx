import type { AccountDetail } from "@/types/api";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { scoreTextClass } from "@/lib/status";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function AccountInfoCard({ account }: { account: AccountDetail }) {
  const fields: Array<{ label: string; value: string; numeric?: boolean; tone?: string }> = [
    { label: "Health score", value: String(account.current_score), numeric: true, tone: scoreTextClass(account.current_score) },
    { label: "ARR", value: formatCurrency(account.arr), numeric: true },
    { label: "Last active", value: formatDate(account.last_active_at) },
    { label: "Domain", value: account.domain },
    { label: "Plan", value: account.plan },
    { label: "Owner CSM", value: account.owner_csm },
    { label: "Customer since", value: formatDate(account.created_at) },
    { label: "Last updated", value: formatDateTime(account.last_updated) },
  ];

  return (
    <Card>
      <CardHeader
        title="Client information"
        description="Current score and account profile."
        action={<StatusBadge status={account.health_status} />}
      />
      <CardBody>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.label} className="min-w-0">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-text-muted">{field.label}</dt>
              <dd className={`mt-1 truncate text-sm text-text ${field.numeric ? "num font-semibold" : ""} ${field.tone ?? ""}`}>
                {field.value}
              </dd>
            </div>
          ))}
        </dl>
      </CardBody>
    </Card>
  );
}
