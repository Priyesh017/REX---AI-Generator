"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/server.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const index_1 = __importDefault(require("./routes/index"));
const errorHandler_1 = require("./middleware/errorHandler");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get("/", (_req, res) => {
    res.json({ status: "ok", service: "REX API", version: "2.0" });
});
// All API routes
app.use("/api", index_1.default);
// Global error handler — must be last
app.use(errorHandler_1.errorHandler);
app.listen(env_1.env.port, "0.0.0.0", () => console.log(`🚀 REX API live on port ${env_1.env.port}`));
