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
              className="w-full sm:w-auto gap-2"
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
      <div className="rounded-xl border border-white/[0.08] bg-surface-raised/40 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in-up">
        <div className="flex items-start gap-3.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Calculator className="size-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-text">Deterministic Scoring Engine (SC-01)</p>
            <p className="text-xs text-text-muted mt-0.5">
              Each raw telemetry signal is normalized [0, 1] against benchmark denominators, multiplied by configured weight percentage, and summed.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto rounded-lg border border-white/[0.08] bg-black/30 px-3 py-2 text-xs font-mono text-text-muted">
          <span className="text-blue-300">Score</span> = <span className="text-text">Σ(Normalized × Weight)</span>
        </div>
      </div>

      {!isAdmin && (
        <p className="text-text-muted text-xs flex items-center gap-1.5 pl-1">
          <Info className="size-3.5 text-text-subtle" />
          You have read-only access. Administrator privileges are required to calibrate metric weights.
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
        <Card className="overflow-hidden animate-fade-in-up stagger-1">
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
