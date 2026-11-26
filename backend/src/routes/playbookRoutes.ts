import { Router } from "express";
import { z } from "zod";
import { requireAdmin } from "../middleware/auth.js";
import { HttpError } from "../middleware/errorHandler.js";
import { completePlaybookTask, listPlaybookTasks } from "../services/PlaybookService.js";

export const playbookRouter = Router();

playbookRouter.get("/", async (req, res, next) => {
  try {
    const query = z
      .object({
        status: z.enum(["open", "done"]).optional(),
        limit: z.coerce.number().int().min(1).max(200).default(50),
        offset: z.coerce.number().int().min(0).default(0),
      })
      .parse(req.query);
    const result = await listPlaybookTasks(query);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

playbookRouter.post("/:id/complete", requireAdmin, async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const updated = await completePlaybookTask(id);
    if (!updated) throw new HttpError(404, "Not Found", "Playbook task not found.");
    res.json({
      id: updated.id,
      status: updated.status,
      completed_at: updated.completedAt?.toISOString() ?? null,
    });
  } catch (err) {
    next(err);
  }
});
