"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/server.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const pino_http_1 = __importDefault(require("pino-http"));
const env_1 = require("./config/env");
const index_1 = __importDefault(require("./routes/index"));
const errorHandler_1 = require("./middleware/errorHandler");
const logger_1 = require("./utils/logger");
const supabase_1 = require("./config/supabase");
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
app.use((0, pino_http_1.default)({ logger: logger_1.logger }));
app.use((0, cors_1.default)({
    origin: env_1.env.clientUrl || "http://localhost:3000",
    credentials: true,
}));
app.use(express_1.default.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    },
}));
app.get("/", (_req, res) => {
    res.json({ status: "ok", service: "REX API", version: "2.0" });
});
// All API routes
app.use("/api", index_1.default);
// Global error handler — must be last
app.use(errorHandler_1.errorHandler);
async function reconcilePendingDrafts() {
    logger_1.logger.info("⚡ Running startup pending drafts reconciliation...");
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: stuckAssets, error: selectError } = await supabase_1.supabase
        .from("generated_assets")
        .select("id, owner_profile_id")
        .eq("generation_status", "pending")
        .lt("created_at", fiveMinutesAgo);
    if (selectError) {
        logger_1.logger.error({ error: selectError }, "Failed to query stuck pending drafts on startup");
        return;
    }
    if (!stuckAssets || stuckAssets.length === 0) {
        logger_1.logger.info("✅ No stuck pending drafts found.");
        return;
    }
    logger_1.logger.warn(`⚠️ Found ${stuckAssets.length} stuck pending drafts. Reconciling...`);
    for (const asset of stuckAssets) {
        try {
            await supabase_1.supabase
                .from("generated_assets")
                .update({ generation_status: "failed" })
                .eq("id", asset.id);
            const { data: profile } = await supabase_1.supabase
                .from("profiles")
                .select("clerk_id")
                .eq("id", asset.owner_profile_id)
                .single();
            if (profile?.clerk_id) {
                await supabase_1.supabase.rpc("refund_generation_credit", {
                    user_clerk_id: profile.clerk_id,
                });
                logger_1.logger.info(`🔄 Marked asset ${asset.id} as failed and refunded credits for user ${profile.clerk_id}`);
            }
        }
        catch (err) {
            logger_1.logger.error({ err, assetId: asset.id }, "Error reconciling stuck pending draft");
        }
    }
    logger_1.logger.info("✅ Startup pending drafts reconciliation finished.");
}
const server = app.listen(env_1.env.port, "0.0.0.0", async () => {
    logger_1.logger.info(`🚀 REX API live on port ${env_1.env.port}`);
    try {
        await reconcilePendingDrafts();
    }
    catch (err) {
        logger_1.logger.error({ err }, "Failed during startup reconciliation");
    }
});
const shutdown = () => {
    logger_1.logger.info("👋 Shutting down server gracefully...");
    server.close(() => {
        logger_1.logger.info("💤 Server closed.");
        process.exit(0);
    });
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
