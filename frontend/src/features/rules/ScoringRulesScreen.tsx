"use client";

import { useState } from "react";
import { Calculator, Info, SlidersHorizontal } from "lucide-react";
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
    <div className="space-y-6">
      <PageHeader
        title="Scoring Algorithm & Weights"
        description="Deterministic 0–100 composite health score calculation. Active weights must sum to exactly 100%."
        actions={
          isAdmin ? (
            <Button
              className="w-full gap-2 sm:w-auto"
              onClick={() => setEditOpen(true)}
              disabled={isLoading || rules.length === 0}
            >
              <SlidersHorizontal className="size-3.5" />
              <span>Calibrate Weights</span>
            </Button>
          ) : undefined
        }
      />

      {/* Formula Explainer Card */}
      <div className="border-border bg-surface-raised/40 flex flex-col justify-between gap-4 rounded-xl border p-4 sm:p-5 md:flex-row md:items-center">
        <div className="flex items-start gap-3.5">
          <div className="bg-primary-subtle border-primary/25 text-primary flex size-9 shrink-0 items-center justify-center rounded-xl border">
            <Calculator className="size-4" />
          </div>
          <div>
            <p className="text-text text-xs font-semibold">Deterministic Scoring Engine (SC-01)</p>
            <p className="text-text-muted mt-0.5 text-xs">
              Each raw telemetry signal is normalized [0, 1] against benchmark denominators,
              multiplied by configured weight percentage, and summed.
            </p>
          </div>
        </div>

        <div className="border-border text-text-muted flex items-center gap-2 self-start rounded-lg border bg-black/30 px-3 py-2 font-mono text-xs md:self-auto">
          <span className="text-primary">Score</span> ={" "}
          <span className="text-text">Σ(Normalized × Weight)</span>
        </div>
      </div>

      {!isAdmin && (
        <p className="text-text-muted flex items-center gap-1.5 pl-1 text-xs">
          <Info className="text-text-subtle size-3.5" />
          You have read-only access. Administrator privileges are required to calibrate metric
          weights.
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
            title="Configured Telemetry Signals"
            description={
              isLoading
                ? "Fetching current weights from engine…"
                : `${activeCount} active signals · ${total}% allocated`
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
