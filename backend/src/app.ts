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
    app.use(
      pinoHttp({
        logger,
        autoLogging: { ignore: (req) => req.url === "/health" },
        customSuccessMessage: (req, res) => `${req.method} ${req.originalUrl} ${res.statusCode}`,
        customErrorMessage: (req, res, err) => `${req.method} ${req.originalUrl} ${res.statusCode} ${err.message}`,
        serializers: {
          req: (req) => ({ method: req.method, url: req.url }),
          res: (res) => ({ statusCode: res.statusCode }),
        },
      }),
    );
  }

  const normalizedFrontend = (config.frontendOrigin ?? "").replace(/\/$/, "");
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          callback(null, true);
          return;
        }
        const allowed = new Set([
          normalizedFrontend,
          "http://localhost:3000",
          "http://localhost:3001",
          "http://127.0.0.1:3000",
          "http://127.0.0.1:3001",
        ]);
        const isRenderApp = /\.onrender\.com$/.test(new URL(origin).hostname);
        const isLocalDev =
          config.nodeEnv !== "production" && /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
        const allowAny = config.frontendOrigin === "*";

        callback(null, allowed.has(origin) || isRenderApp || isLocalDev || allowAny);
      },
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
