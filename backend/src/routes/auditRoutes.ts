import { Router } from "express";
import { z } from "zod";
import { listAudit, listAuditActors } from "../services/AuditService.js";

export const auditRouter = Router();

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(25),
  offset: z.coerce.number().int().min(0).default(0),
  actor: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

auditRouter.get("/", async (req, res, next) => {
  try {
    const query = querySchema.parse(req.query);
    res.json(await listAudit(query));
  } catch (err) {
    next(err);
  }
});

auditRouter.get("/actors", async (_req, res, next) => {
  try {
    res.json({ data: await listAuditActors() });
  } catch (err) {
    next(err);
  }
});
