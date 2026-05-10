// src/server.ts
import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import pinoHttp from "pino-http";
import { env } from "./config/env";
import router from "./routes/index";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./utils/logger";

const app = express();

app.use(helmet());
app.use(compression());
app.use(pinoHttp({ logger }));

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(
  express.json({
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.get("/", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "REX API", version: "2.0" });
});

// All API routes
app.use("/api", router);

// Global error handler — must be last
app.use(errorHandler);

app.listen(env.port, "0.0.0.0", () =>
  logger.info(`🚀 REX API live on port ${env.port}`)
);
