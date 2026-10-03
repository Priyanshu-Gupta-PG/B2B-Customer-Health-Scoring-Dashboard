import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import { problem } from "./errorHandler.js";

export interface AuthUser {
  id: string;
  email: string;
  role: "admin" | "csm";
  name?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

interface TokenPayload {
  sub: string;
  email: string;
  role: "admin" | "csm";
  name?: string;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    problem(res, 401, "Unauthorized", "A valid bearer token is required.", req.originalUrl.split("?")[0]);
    return;
  }
  try {
    const payload = jwt.verify(token, config.jwt.publicKey, { algorithms: ["RS256"] }) as TokenPayload;
    req.user = { id: payload.sub, email: payload.email, role: payload.role, name: payload.name };
    next();
  } catch {
    problem(res, 401, "Unauthorized", "A valid bearer token is required.", req.originalUrl.split("?")[0]);
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "admin") {
    problem(res, 403, "Forbidden", "Admin privileges required.", req.originalUrl.split("?")[0]);
    return;
  }
  next();
}

export function signToken(user: AuthUser) {
  const expires = new Date(Date.now() + 24 * 3600 * 1000);
  const token = jwt.sign(
    { sub: user.id, email: user.email, role: user.role, name: user.name },
    config.jwt.privateKey,
    { algorithm: "RS256", expiresIn: config.jwt.expiresIn },
  );
  return { token, expires_at: expires.toISOString() };
}
