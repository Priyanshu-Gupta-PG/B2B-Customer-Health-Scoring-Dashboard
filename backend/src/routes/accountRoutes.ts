import { Router } from "express";
import { z } from "zod";
import { getAccount, getAccountHistory, getDashboard, listAccounts } from "../services/AccountService.js";
import { HttpError } from "../middleware/errorHandler.js";

export const accountRouter = Router();
export const dashboardRouter = Router();

const listQuery = z.object({
  status: z.enum(["Critical", "At-Risk", "Healthy"]).optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

const uuid = z.string().uuid();

accountRouter.get("/", async (req, res, next) => {
  try {
    const query = listQuery.parse(req.query);
    res.json(await listAccounts(query));
  } catch (err) {
    next(err);
  }
});

accountRouter.get("/:id/history", async (req, res, next) => {
  try {
    const id = uuid.parse(req.params.id);
    const days = z.coerce.number().int().min(1).max(90).default(30).parse(req.query.days ?? 30);
    const history = await getAccountHistory(id, days);
    if (!history) throw new HttpError(404, "Not Found", "Account not found.");
    res.json(history);
  } catch (err) {
    next(err);
  }
});

accountRouter.get("/:id", async (req, res, next) => {
  try {
    const id = uuid.parse(req.params.id);
    const account = await getAccount(id);
    if (!account) throw new HttpError(404, "Not Found", "Account not found.");
    res.json(account);
  } catch (err) {
    next(err);
  }
});

dashboardRouter.get("/summary", async (_req, res, next) => {
  try {
    res.json(await getDashboard());
  } catch (err) {
    next(err);
  }
});
