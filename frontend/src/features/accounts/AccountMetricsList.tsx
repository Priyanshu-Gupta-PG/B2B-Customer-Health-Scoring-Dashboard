import type { AccountMetric, SourceApi } from "@/types/api";
import { formatDateTime, formatNumber } from "@/lib/format";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

const SOURCE_LABEL: Record<SourceApi, string> = {
  stripe: "Stripe",
  zendesk: "Zendesk",
  product: "Product",
};

export function AccountMetricsList({ metrics }: { metrics: AccountMetric[] }) {
  return (
    <Card>
      <CardHeader title="Raw metrics" description="Latest ingested values used by the scoring engine." />
      {metrics.length === 0 ? (
        <EmptyState title="No raw metrics available for this client." className="py-10" />
      ) : (
        <CardBody className="p-0">
          <ul className="divide-y divide-border">
            {metrics.map((metric) => (
              <li key={metric.id} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text">{metric.label}</p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {SOURCE_LABEL[metric.source_api]} · recorded {formatDateTime(metric.recorded_at)}
                  </p>
                </div>
                <p className="num text-sm font-semibold text-text">
                  {formatNumber(metric.metric_value)}{" "}
                  <span className="text-xs font-normal text-text-muted">{metric.unit}</span>
                </p>
              </li>
            ))}
          </ul>
        </CardBody>
      )}
    </Card>
  );
}
