"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const backend_1 = require("@clerk/backend");
const env_1 = require("../config/env");
const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    // Check if the Authorization header is missing or invalid
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.warn("⚠️ No Bearer token in Authorization header");
        res.status(401).json({ error: "Unauthorized: Missing token" });
        return;
    }
    const token = authHeader.split(" ")[1];
    try {
        // Verify the token using Clerk's backend verification
        const payload = await (0, backend_1.verifyToken)(token, {
            secretKey: env_1.env.clerkSecretKey,
        });
        console.log("🔐 Token payload:", payload);
        // Ensure 'sub' (user ID) exists in the token payload
        if (!payload?.sub) {
            console.warn("⚠️ Verified token, but missing 'sub' (user ID)");
            res.status(401).json({ error: "Unauthorized: Invalid token payload" });
            return;
        }
        // Attach the userId to the request object for downstream use
        req.userId = payload.sub;
        // Proceed to the next middleware or route handler
        next();
    }
    catch (error) {
        console.error("❌ JWT verification failed:", error?.message || error);
        // Handle different types of errors from Clerk (e.g., expired token)
        const errorMessage = error?.message?.includes("jwt expired")
            ? "Unauthorized: Token has expired"
            : "Unauthorized: Invalid or expired token";
        res.status(401).json({ error: errorMessage });
    }
};
exports.requireAuth = requireAuth;
