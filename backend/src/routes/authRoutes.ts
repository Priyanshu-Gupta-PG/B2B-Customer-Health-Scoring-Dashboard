import { Router } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { login, loginWithGoogle } from "../services/AuthService.js";

export const authRouter = Router();

const limiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const googleSchema = z.object({
  id_token: z.string().min(1, "Google credential is required."),
});

authRouter.post("/login", limiter, async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const result = await login(body.email, body.password);
    res.json(result);
  } catch (err) {
    next(err);
  }
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
