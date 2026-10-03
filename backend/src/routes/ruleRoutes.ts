import { Router } from "express";
import { z } from "zod";
import { requireAdmin } from "../middleware/auth.js";
import { bulkUpdateRules, listRules, updateRule } from "../services/RuleService.js";

export const ruleRouter = Router();

const patchSchema = z.object({
  weight_percentage: z.number().int().min(0).max(100).optional(),
  impact_direction: z.enum(["positive", "negative"]).optional(),
  threshold: z.number().int().nullable().optional(),
  is_active: z.boolean().optional(),
});

const bulkSchema = z.object({
  rules: z
    .array(
      patchSchema.extend({
        id: z.string().uuid(),
      }),
    )
    .min(1),
});

ruleRouter.get("/", async (_req, res, next) => {
  try {
    res.json(await listRules());
  } catch (err) {
    next(err);
  }
});

ruleRouter.put("/", requireAdmin, async (req, res, next) => {
  try {
    const body = bulkSchema.parse(req.body);
    res.json(await bulkUpdateRules(body.rules, req.user!));
  } catch (err) {
    next(err);
  }
});

ruleRouter.patch("/:id", requireAdmin, async (req, res, next) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    const body = patchSchema.parse(req.body);
    res.json(await updateRule(id, body, req.user!));
  } catch (err) {
    next(err);
  }
});
