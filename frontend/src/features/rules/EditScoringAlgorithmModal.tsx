"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
      toast.success("Scores recalculating. Dashboard will refresh.");
      onClose();
    } catch (err) {
      setServerError(errorMessage(err, "Unable to update scoring rules."));
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Scoring Algorithm"
      description="Active metric weights must total exactly 100%. Saving triggers a batch recalculation."
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
          >
            Save weights
          </Button>
        </>
      }
    >
      <form
        id="edit-scoring-algorithm"
        onSubmit={onSubmit}
        noValidate
        className="flex flex-col gap-4"
      >
        {serverError && <AlertBanner>{serverError}</AlertBanner>}

        <div
          className={cn(
            "overflow-hidden rounded-lg border",
            totalInvalid ? "border-danger" : "border-border",
          )}
        >
          <div className="border-border bg-bg/40 text-text-muted hidden grid-cols-[1fr_6.5rem_4.5rem] gap-3 border-b px-4 py-2 text-[11px] tracking-wide uppercase sm:grid">
            <span>Metric</span>
            <span>Weight %</span>
            <span className="text-right">Active</span>
          </div>
          <ul className="divide-border divide-y">
            {rules.map((rule, index) => {
              const row = watched[index];
              const inactive = row ? !row.is_active : !rule.is_active;
              return (
                <li
                  key={rule.id}
                  className={cn(
                    "flex flex-col gap-3 px-4 py-3 sm:grid sm:grid-cols-[1fr_6.5rem_4.5rem] sm:items-center",
                    inactive && "opacity-60",
                  )}
                >
                  <input type="hidden" {...register(`rules.${index}.id`)} />
                  <div className="min-w-0">
                    <p className="text-text text-sm font-medium">{metricLabel(rule.metric_name)}</p>
                    <p className="text-text-muted mt-0.5 text-[11px]">
                      {rule.impact_direction === "positive"
                        ? "Higher value raises the score"
                        : "Higher value lowers the score"}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:contents">
                    <label className="text-text-muted flex min-w-0 flex-1 items-center gap-2 text-xs sm:block sm:flex-none">
                      <span className="sm:hidden">Weight %</span>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={100}
                        step={1}
                        aria-label={`${metricLabel(rule.metric_name)} weight`}
                        error={errors.rules?.[index]?.weight_percentage?.message}
                        className={cn("num flex-1 text-right sm:flex-none", totalInvalid && "border-danger")}
                        {...register(`rules.${index}.weight_percentage`, { valueAsNumber: true })}
                      />
                    </label>
                    <label className="text-text-muted flex items-center justify-end gap-2 text-xs">
                      <span className="sm:sr-only">Active</span>
                      <input
                        type="checkbox"
                        className="accent-primary size-4"
                        {...register(`rules.${index}.is_active`)}
                      />
                    </label>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div
          role="status"
          aria-live="polite"
          className={cn(
            "rounded-lg border px-4 py-3",
            totalInvalid ? "border-danger bg-danger/10" : "border-success/30 bg-success/10",
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <p className={cn("text-sm font-medium", totalInvalid ? "text-danger" : "text-success")}>
              Active total
            </p>
            <p
              className={cn(
                "num text-sm font-semibold",
                totalInvalid ? "text-danger" : "text-success",
              )}
            >
              {total}%
            </p>
          </div>
          {totalInvalid && (
            <p className="text-danger mt-1 text-xs">{totalError ?? TOTAL_WEIGHT_ERROR}</p>
          )}
        </div>
      </form>
    </Modal>
  );
}
