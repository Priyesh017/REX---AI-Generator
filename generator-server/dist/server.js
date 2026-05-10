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
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
app.use((0, pino_http_1.default)({ logger: logger_1.logger }));
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
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
app.listen(env_1.env.port, "0.0.0.0", () => logger_1.logger.info(`🚀 REX API live on port ${env_1.env.port}`));
