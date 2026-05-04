// src/server.ts
import express, { Request, Response } from "express";
import cors from "cors";
import { env } from "./config/env";
import router from "./routes/index";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "REX API", version: "2.0" });
});

// All API routes
app.use("/api", router);

// Global error handler — must be last
app.use(errorHandler);

app.listen(env.port, "0.0.0.0", () =>
  console.log(`🚀 REX API live on port ${env.port}`)
);
