"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import type { ScoringRule } from "@/types/api";
import { metricLabel } from "@/lib/format";
import { cn } from "@/lib/cn";
import { errorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { AlertBanner } from "@/components/ui/ErrorState";
import { toast } from "@/components/ui/toast";
import { useBulkUpdateRules } from "./hooks";
import {
  TOTAL_WEIGHT_ERROR,
  activeWeightTotal,
  editRulesSchema,
  type EditRulesFormValues,
} from "./schema";

function toFormValues(rules: ScoringRule[]): EditRulesFormValues {
  return {
    rules: rules.map((rule) => ({
      id: rule.id,
      weight_percentage: rule.weight_percentage,
      is_active: rule.is_active,
    })),
  };
}

export function EditScoringAlgorithmModal({
  open,
  onClose,
  rules,
}: {
  open: boolean;
  onClose: () => void;
  rules: ScoringRule[];
}) {
  const mutation = useBulkUpdateRules();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EditRulesFormValues>({
    resolver: zodResolver(editRulesSchema),
    defaultValues: toFormValues(rules),
    mode: "onChange",
  });

  const watched = useWatch({ control, name: "rules" }) ?? [];
  const total = activeWeightTotal(watched);
  const totalInvalid = total !== 100;
  const totalError =
    errors.rules && "message" in errors.rules && typeof errors.rules.message === "string"
      ? errors.rules.message
      : errors.rules?.root?.message;

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await mutation.mutateAsync({
        rules: values.rules.map((rule) => ({
          id: rule.id,
          weight_percentage: rule.weight_percentage,
          is_active: rule.is_active,
        })),
      });
      toast.success("Algorithm updated. Full portfolio scores are recalculating.");
      onClose();
    } catch (err) {
      setServerError(errorMessage(err, "Unable to update scoring rules."));
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Calibrate Scoring Algorithm"
      description="Active metric weights must total exactly 100%. Saving triggers an atomic batch recalculation across all accounts."
      size="lg"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-scoring-algorithm"
            loading={isSubmitting}
            disabled={totalInvalid}
            className="gap-2"
          >
            <Sparkles className="size-4" />
            <span>Save & Recalculate Portfolio</span>
          </Button>
        </>
      }
    >
      <form
        id="edit-scoring-algorithm"
        onSubmit={onSubmit}
        noValidate
        className="flex flex-col gap-5"
      >
        {serverError && <AlertBanner>{serverError}</AlertBanner>}

        {/* Live Visual Allocation Bar */}
        <div className="border-border bg-surface-raised/40 space-y-2 rounded-xl border p-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text font-semibold">Weight Allocation Gauge</span>
            <span className={cn("num font-bold", totalInvalid ? "text-danger" : "text-success")}>
              {total}% / 100%
            </span>
          </div>
          <div className="bg-surface-raised flex h-3 w-full overflow-hidden rounded-full">
            {rules.map((rule, index) => {
              const row = watched[index];
              const weight = row?.is_active ? Number(row.weight_percentage) || 0 : 0;
              const colors = ["bg-blue-500", "bg-warning", "bg-success", "bg-purple-500"];
              return (
                <div
                  key={rule.id}
                  className={`h-full transition-all duration-300 ${colors[index % colors.length]}`}
                  style={{ width: `${Math.min(100, Math.max(0, weight))}%` }}
                  title={`${metricLabel(rule.metric_name)}: ${weight}%`}
                />
              );
            })}
          </div>
        </div>

        {/* Metric Sliders List */}
        <div
          className={cn(
            "overflow-hidden rounded-xl border transition-colors",
            totalInvalid ? "border-danger/30" : "border-border",
          )}
        >
          <ul className="divide-border-subtle divide-y">
            {rules.map((rule, index) => {
              const row = watched[index];
              const inactive = row ? !row.is_active : !rule.is_active;
              const currentWeight = row
                ? Number(row.weight_percentage) || 0
                : rule.weight_percentage;

              return (
                <li
                  key={rule.id}
                  className={cn(
                    "flex flex-col gap-3 p-4 transition-all duration-200",
                    inactive ? "bg-black/20 opacity-40" : "bg-surface-raised",
                  )}
                >
                  <input type="hidden" {...register(`rules.${index}.id`)} />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-text text-sm font-semibold">
                        {metricLabel(rule.metric_name)}
                      </p>
                      <p className="text-text-muted mt-0.5 text-[11px]">
                        {rule.impact_direction === "positive"
                          ? "Positive: Higher values increase score"
                          : "Negative: Higher values decrease score"}
                      </p>
                    </div>

                    <label className="flex cursor-pointer items-center gap-2 select-none">
                      <span className="text-text-muted text-xs">Enabled</span>
                      <input
                        type="checkbox"
                        className="size-4 cursor-pointer rounded accent-blue-500"
                        {...register(`rules.${index}.is_active`)}
                      />
                    </label>
                  </div>

                  {/* Range Slider + Number Input synced */}
                  <div className="flex items-center gap-4 pt-1">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      disabled={inactive}
                      value={currentWeight}
                      onChange={(e) => {
                        setValue(`rules.${index}.weight_percentage`, Number(e.target.value), {
                          shouldValidate: true,
                        });
                      }}
                      className="flex-1 cursor-pointer accent-blue-500 disabled:cursor-not-allowed"
                    />
                    <div className="w-20">
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={100}
                        step={1}
                        disabled={inactive}
                        aria-label={`${metricLabel(rule.metric_name)} weight`}
                        error={errors.rules?.[index]?.weight_percentage?.message}
                        className={cn(
                          "num text-right font-semibold",
                          totalInvalid && "border-danger/40",
                        )}
                        {...register(`rules.${index}.weight_percentage`, { valueAsNumber: true })}
                      />
                    </div>
                    <span className="text-text-muted text-xs font-medium">%</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Total Validation Status Banner */}
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "rounded-xl border p-4 transition-colors",
            totalInvalid
              ? "border-danger/30 bg-danger-subtle text-danger"
              : "border-success/30 bg-success-subtle text-success",
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {totalInvalid ? (
                <AlertCircle className="text-danger size-4 shrink-0" />
              ) : (
                <CheckCircle2 className="text-success size-4 shrink-0" />
              )}
              <p className="text-xs font-semibold">
                {totalInvalid ? "Invalid Total Weight" : "Formula Constraint Satisfied"}
              </p>
            </div>
            <p className="num text-sm font-bold">{total}%</p>
          </div>
          {totalInvalid && (
            <p className="text-danger/90 mt-1 pl-6 text-xs">{totalError ?? TOTAL_WEIGHT_ERROR}</p>
          )}
        </div>
      </form>
    </Modal>
  );
}
