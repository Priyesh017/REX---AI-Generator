"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const backend_1 = require("@clerk/backend");
const env_1 = require("../config/env");
const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.warn("⚠️ No Bearer token in Authorization header");
        res.status(401).json({ error: "Unauthorized: Missing token" });
        return;
    }
    const token = authHeader.split(" ")[1];
    try {
        const payload = await (0, backend_1.verifyToken)(token, {
            secretKey: env_1.env.clerkSecretKey,
        });
        console.log("🔐 Token payload:", payload);
        if (!payload?.sub) {
            console.warn("⚠️ Verified token, but missing 'sub' (user ID)");
            res.status(401).json({ error: "Unauthorized: Invalid token payload" });
            return;
        }
        req.userId = payload.sub; // Set userId on the request
        next();
    }
    catch (error) {
        console.error("❌ JWT verification failed:", error?.message || error);
        res.status(401).json({ error: "Invalid or expired token" });
    }
};
exports.requireAuth = requireAuth;
