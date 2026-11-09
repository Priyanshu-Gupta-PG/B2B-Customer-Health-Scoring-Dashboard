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
        <div className="rounded-xl border border-white/[0.08] bg-surface-raised/40 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-text">Weight Allocation Gauge</span>
            <span className={cn("num font-bold", totalInvalid ? "text-rose-400" : "text-emerald-400")}>
              {total}% / 100%
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-white/[0.06] flex">
            {rules.map((rule, index) => {
              const row = watched[index];
              const weight = row?.is_active ? Number(row.weight_percentage) || 0 : 0;
              const colors = [
                "bg-blue-500",
                "bg-amber-400",
                "bg-emerald-500",
                "bg-purple-500",
              ];
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
            totalInvalid ? "border-rose-500/30" : "border-white/[0.08]",
          )}
        >
          <ul className="divide-y divide-white/[0.06]">
            {rules.map((rule, index) => {
              const row = watched[index];
              const inactive = row ? !row.is_active : !rule.is_active;
              const currentWeight = row ? Number(row.weight_percentage) || 0 : rule.weight_percentage;

              return (
                <li
                  key={rule.id}
                  className={cn(
                    "flex flex-col gap-3 p-4 transition-all duration-200",
                    inactive ? "opacity-40 bg-black/20" : "bg-white/[0.01]",
                  )}
                >
                  <input type="hidden" {...register(`rules.${index}.id`)} />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-text text-sm font-semibold">{metricLabel(rule.metric_name)}</p>
                      <p className="text-text-muted text-[11px] mt-0.5">
                        {rule.impact_direction === "positive"
                          ? "Positive: Higher values increase score"
                          : "Negative: Higher values decrease score"}
                      </p>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <span className="text-xs text-text-muted">Enabled</span>
                      <input
                        type="checkbox"
                        className="accent-blue-500 size-4 rounded cursor-pointer"
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
                      className="flex-1 accent-blue-500 cursor-pointer disabled:cursor-not-allowed"
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
                        className={cn("num text-right font-semibold", totalInvalid && "border-rose-500/40")}
                        {...register(`rules.${index}.weight_percentage`, { valueAsNumber: true })}
                      />
                    </div>
                    <span className="text-xs font-medium text-text-muted">%</span>
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
              ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {totalInvalid ? (
                <AlertCircle className="size-4 text-rose-400 shrink-0" />
              ) : (
                <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
              )}
              <p className="text-xs font-semibold">
                {totalInvalid ? "Invalid Total Weight" : "Formula Constraint Satisfied"}
              </p>
            </div>
            <p className="num text-sm font-bold">{total}%</p>
          </div>
          {totalInvalid && (
            <p className="mt-1 text-xs text-rose-300/90 pl-6">
              {totalError ?? TOTAL_WEIGHT_ERROR}
            </p>
          )}
        </div>
      </form>
    </Modal>
  );
}
