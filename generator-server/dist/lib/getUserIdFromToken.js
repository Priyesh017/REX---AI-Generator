"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserIdFromToken = void 0;
const backend_1 = require("@clerk/backend");
const env_1 = require("../config/env");
const getUserIdFromToken = async (authHeader) => {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new Error("Missing or malformed Authorization header");
    }
    const token = authHeader.split(" ")[1];
    try {
        const payload = await (0, backend_1.verifyToken)(token, {
            secretKey: env_1.env.clerkSecretKey,
        });
        if (!payload.sub) {
            throw new Error("User ID not found in token payload");
        }
        return payload.sub;
    }
    catch (err) {
        console.error("Token verification failed:", err);
        throw new Error("Invalid or expired token");
    }
};
exports.getUserIdFromToken = getUserIdFromToken;
