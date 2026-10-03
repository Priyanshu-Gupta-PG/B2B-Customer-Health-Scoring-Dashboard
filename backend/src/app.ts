import express from "express";
import cors from "cors";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { config } from "./config/index.js";
import { logger } from "./infrastructure/logger.js";
import { authMiddleware } from "./middleware/auth.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { authRouter } from "./routes/authRoutes.js";
import { accountRouter, dashboardRouter } from "./routes/accountRoutes.js";
import { ruleRouter } from "./routes/ruleRoutes.js";
import { auditRouter } from "./routes/auditRoutes.js";
import { healthRouter, ingestRouter } from "./routes/systemRoutes.js";

export function createApp() {
  const app = express();
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  if (process.env.NODE_ENV !== "test") {
    app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === "/health" } }));
  }
  app.use(
    cors({
      origin: config.frontendOrigin,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));

  app.use("/health", healthRouter);

  const api = express.Router();
  api.use("/auth", authRouter);
  api.use(authMiddleware);
  api.use("/accounts", accountRouter);
  api.use("/dashboard", dashboardRouter);
  api.use("/rules", ruleRouter);
  api.use("/audit-logs", auditRouter);
  api.use("/ingest", ingestRouter);
  app.use("/api/v1", api);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
