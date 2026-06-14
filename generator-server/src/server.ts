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
import { supabase } from "./config/supabase";

const app = express();

app.use(helmet());
app.use(compression());
app.use(pinoHttp({ logger }));

app.use(
  cors({
    origin: env.clientUrl || "http://localhost:3000",
    credentials: true,
  })
);
app.use(
  express.json({
    verify: (req: Request, res, buf) => {
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

async function reconcilePendingDrafts() {
  logger.info("⚡ Running startup pending drafts reconciliation...");
  
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  
  const { data: stuckAssets, error: selectError } = await supabase
    .from("generated_assets")
    .select("id, owner_profile_id")
    .eq("generation_status", "pending")
    .lt("created_at", fiveMinutesAgo);

  if (selectError) {
    logger.error({ error: selectError }, "Failed to query stuck pending drafts on startup");
    return;
  }

  if (!stuckAssets || stuckAssets.length === 0) {
    logger.info("✅ No stuck pending drafts found.");
    return;
  }

  logger.warn(`⚠️ Found ${stuckAssets.length} stuck pending drafts. Reconciling...`);

  for (const asset of stuckAssets) {
    try {
      await supabase
        .from("generated_assets")
        .update({ generation_status: "failed" })
        .eq("id", asset.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("clerk_id")
        .eq("id", asset.owner_profile_id)
        .single();

      if (profile?.clerk_id) {
        await supabase.rpc("refund_generation_credit", {
          user_clerk_id: profile.clerk_id,
        });
        logger.info(`🔄 Marked asset ${asset.id} as failed and refunded credits for user ${profile.clerk_id}`);
      }
    } catch (err) {
      logger.error({ err, assetId: asset.id }, "Error reconciling stuck pending draft");
    }
  }
  
  logger.info("✅ Startup pending drafts reconciliation finished.");
}

const server = app.listen(env.port, "0.0.0.0", async () => {
  logger.info(`🚀 REX API live on port ${env.port}`);
  try {
    await reconcilePendingDrafts();
  } catch (err) {
    logger.error({ err }, "Failed during startup reconciliation");
  }
});

const shutdown = () => {
  logger.info("👋 Shutting down server gracefully...");
  server.close(() => {
    logger.info("💤 Server closed.");
    process.exit(0);
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
