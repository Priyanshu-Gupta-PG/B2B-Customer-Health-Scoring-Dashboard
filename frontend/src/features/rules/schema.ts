import { z } from "zod";

export const TOTAL_WEIGHT_ERROR = "Total weight must equal exactly 100%";

const ruleRowSchema = z.object({
  id: z.string().min(1),
  weight_percentage: z.coerce
    .number({ invalid_type_error: "Weight is required" })
    .int("Weight must be a whole number")
    .min(0, "Weight cannot be negative")
    .max(100, "Weight cannot exceed 100"),
  is_active: z.boolean(),
});

export const editRulesSchema = z
  .object({
    rules: z.array(ruleRowSchema).min(1, "At least one rule is required"),
  })
  .superRefine((value, ctx) => {
    const total = activeWeightTotal(value.rules);
    if (total !== 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: TOTAL_WEIGHT_ERROR,
        path: ["rules"],
      });
    }
  });

export type EditRulesFormValues = z.infer<typeof editRulesSchema>;

export function activeWeightTotal(
  rules: Array<{ is_active: boolean; weight_percentage: number | string }>,
) {
  return rules
    .filter((rule) => rule.is_active)
    .reduce((sum, rule) => {
      const weight =
        typeof rule.weight_percentage === "number"
          ? rule.weight_percentage
          : Number(rule.weight_percentage);
      return sum + (Number.isFinite(weight) ? weight : 0);
    }, 0);
}
