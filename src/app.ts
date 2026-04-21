import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { env } from "./config/env";
import { errorHandler } from "./middlewares/errorHandler";
import { requestId } from "./middlewares/requestId";
import { logger } from "./utils/logger";
import { apiV1Router } from "./routes/v1";
import { ApiError } from "./utils/errors";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");

  app.use(requestId);
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.requestId!,
    }),
  );

  app.use(
    cors({
      origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(helmet());

  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 600,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
  );

  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/v1", apiV1Router);

  app.use((_req, _res, next) => {
    next(new ApiError({ code: "NOT_FOUND", status: 404, message: "Not found" }));
  });

  app.use(errorHandler);

  return app;
}

