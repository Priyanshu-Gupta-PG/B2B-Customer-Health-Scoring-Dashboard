import type { ErrorRequestHandler, Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "../infrastructure/logger.js";

export class HttpError extends Error {
  status: number;
  title: string;

  constructor(status: number, title: string, detail: string) {
    super(detail);
    this.status = status;
    this.title = title;
  }
}

export function problem(res: Response, status: number, title: string, detail: string, instance?: string) {
  return res.status(status).type("application/problem+json").json({
    type: `https://health-dashboard.internal/errors/${title.toLowerCase().replace(/\s+/g, "-")}`,
    title,
    status,
    detail,
    instance,
  });
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof ZodError) {
    const detail = err.issues.map((i) => i.message).join("; ") || "Validation failed.";
    problem(res, 422, "Validation Error", detail, req.originalUrl.split("?")[0]);
    return;
  }
  if (err instanceof HttpError) {
    problem(res, err.status, err.title, err.message, req.originalUrl.split("?")[0]);
    return;
  }
  if (err instanceof SyntaxError && "body" in err) {
    problem(res, 400, "Bad Request", "Request body must be valid JSON.", req.originalUrl.split("?")[0]);
    return;
  }
  logger.error({ err, path: req.originalUrl }, "unhandled error");
  problem(res, 500, "Internal Server Error", "An unexpected error occurred.", req.originalUrl.split("?")[0]);
};

export function notFound(_req: Request, res: Response) {
  problem(res, 404, "Not Found", "The requested resource does not exist.");
}
