import { Router } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { loginWithGoogle } from "../services/AuthService.js";
import { HttpError } from "../middleware/errorHandler.js";

export const authRouter = Router();

const limiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

const googleSchema = z.object({
  id_token: z.string().min(1, "Google credential is required."),
});

authRouter.all("/login", (_req, _res, next) => {
  next(new HttpError(404, "Not Found", "Email and password sign-in has been removed. Use Google sign-up."));
});

authRouter.post("/google", limiter, async (req, res, next) => {
  try {
    const body = googleSchema.parse(req.body);
    const result = await loginWithGoogle(body.id_token);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
