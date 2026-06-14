"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.requireAuth = void 0;
const backend_1 = require("@clerk/backend");
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
const profileRepo = __importStar(require("../repositories/profile.repository"));
const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        logger_1.logger.warn("⚠️ No Bearer token in Authorization header");
        res.status(401).json({ error: "Unauthorized: Missing token" });
        return;
    }
    const token = authHeader.split(" ")[1];
    try {
        const payload = await (0, backend_1.verifyToken)(token, {
            secretKey: env_1.env.clerkSecretKey,
        });
        if (!payload?.sub) {
            logger_1.logger.warn("⚠️ Verified token, but missing 'sub' (user ID)");
            res.status(401).json({ error: "Unauthorized: Invalid token payload" });
            return;
        }
        req.userId = payload.sub;
        // Resolve internal profile ID and check role
        const profile = await profileRepo.resolveOrProvisionUser(payload.sub);
        if (profile.role === "banned") {
            logger_1.logger.warn(`🚫 Banned user attempted to access API: ${profile.id}`);
            res.status(403).json({ error: "Account suspended", code: "BANNED" });
            return;
        }
        req.profileId = profile.id;
        req.userRole = profile.role;
        next();
    }
    catch (error) {
        logger_1.logger.error("❌ JWT verification failed");
        const errorMessage = error?.message?.includes("jwt expired")
            ? "Unauthorized: Token has expired"
            : "Unauthorized: Invalid or expired token";
        res.status(401).json({ error: errorMessage });
    }
};
exports.requireAuth = requireAuth;
const optionalAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next();
    }
    const token = authHeader.split(" ")[1];
    try {
        const payload = await (0, backend_1.verifyToken)(token, {
            secretKey: env_1.env.clerkSecretKey,
        });
        if (payload?.sub) {
            req.userId = payload.sub;
            const profile = await profileRepo.findByClerkId(payload.sub);
            if (profile) {
                req.profileId = profile.id;
                req.userRole = profile.role;
            }
        }
    }
    catch (error) {
        // Silently fail authentication and proceed anonymously
    }
    next();
};
exports.optionalAuth = optionalAuth;
