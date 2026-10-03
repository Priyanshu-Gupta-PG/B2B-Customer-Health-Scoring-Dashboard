"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionErrorBoundary } from "@/components/ui/SectionErrorBoundary";
import { useAuth } from "@/features/auth/AuthProvider";
import { errorMessage } from "@/lib/errors";
import { ActiveRulesTable } from "./ActiveRulesTable";
import { EditScoringAlgorithmModal } from "./EditScoringAlgorithmModal";
import { useRules } from "./hooks";
import { activeWeightTotal } from "./schema";

export function ScoringRulesScreen() {
  const { isAdmin } = useAuth();
  const { data: rules = [], isLoading, isError, error, refetch, isFetching } = useRules();
  const [editOpen, setEditOpen] = useState(false);

  const activeCount = rules.filter((rule) => rule.is_active).length;
  const total = activeWeightTotal(rules);

  return (
    <div>
      <PageHeader
        title="Scoring Rules"
        description="Deterministic 0–100 health scores are a weighted sum of these metrics. Active weights must total exactly 100%."
        actions={
          isAdmin ? (
            <Button
              className="w-full sm:w-auto"
              onClick={() => setEditOpen(true)}
              disabled={isLoading || rules.length === 0}
            >
              <SlidersHorizontal className="size-4" />
              Edit Scoring Algorithm
            </Button>
          ) : undefined
        }
      />

      {!isAdmin && (
        <p className="text-text-muted mb-4 text-xs">
          You have read-only access. Ask an administrator to change metric weights.
        </p>
      )}

      {isError ? (
        <Card>
          <ErrorState
            title="Unable to load scoring rules"
            message={errorMessage(error)}
            onRetry={() => void refetch()}
            retrying={isFetching}
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <CardHeader
            title="Active metrics"
            description={
              isLoading ? "Loading current weights…" : `${activeCount} active · ${total}% allocated`
            }
          />
          <SectionErrorBoundary title="Scoring rules table failed to render">
            <ActiveRulesTable rules={rules} loading={isLoading} />
          </SectionErrorBoundary>
        </Card>
      )}

      {isAdmin && editOpen && (
        <EditScoringAlgorithmModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          rules={rules}
        />
      )}
    </div>
  );
}
