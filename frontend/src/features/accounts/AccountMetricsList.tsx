import { CreditCard, HardDrive, HelpCircle, Layers, Radio } from "lucide-react";
import type { AccountMetric, SourceApi } from "@/types/api";
import { formatDateTime, formatNumber } from "@/lib/format";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

const SOURCE_META: Record<SourceApi, { label: string; icon: typeof HardDrive; color: string; badge: string }> = {
  stripe: {
    label: "Stripe Billing",
    icon: CreditCard,
    color: "text-blue-400",
    badge: "border-blue-500/20 bg-blue-500/10 text-blue-300",
  },
  zendesk: {
    label: "Zendesk Support",
    icon: HelpCircle,
    color: "text-amber-400",
    badge: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  },
  product: {
    label: "Product Telemetry",
    icon: HardDrive,
    color: "text-emerald-400",
    badge: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  },
};

export function AccountMetricsList({ metrics }: { metrics: AccountMetric[] }) {
  return (
    <Card className="animate-fade-in-up stagger-2">
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <Radio className="size-4 text-blue-400 animate-pulse" />
            Raw Ingested Telemetry
          </span>
        }
        description="Live data feeds powering deterministic score calculation"
      />
      {metrics.length === 0 ? (
        <EmptyState title="No raw metrics available for this account." className="py-10" />
      ) : (
        <CardBody className="p-0">
          <ul className="divide-y divide-white/[0.04]">
            {metrics.map((metric) => {
              const meta = SOURCE_META[metric.source_api] ?? {
                label: metric.source_api,
                icon: Layers,
                color: "text-text-muted",
                badge: "border-white/10 bg-white/5 text-text-muted",
              };
              const Icon = meta.icon;

              return (
                <li
                  key={metric.id}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between transition-colors hover:bg-white/[0.02]"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-raised border border-white/[0.08]">
                      <Icon className={`size-4 ${meta.color}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-text">{metric.label}</p>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${meta.badge}`}>
                          {meta.label}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-text-muted">
                        Recorded {formatDateTime(metric.recorded_at)} · Type: <span className="font-mono">{metric.metric_type}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2 self-start sm:self-center pl-12 sm:pl-0">
                    <span className="num text-xl font-bold tracking-tight text-text">
                      {formatNumber(metric.metric_value)}
                    </span>
                    <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                      {metric.unit}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardBody>
      )}
    </Card>
  );
}
