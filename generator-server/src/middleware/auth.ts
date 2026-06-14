import { Request, Response, NextFunction } from "express";
import { verifyToken } from "@clerk/backend";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import * as profileRepo from "../repositories/profile.repository";

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    logger.warn("⚠️ No Bearer token in Authorization header");
    res.status(401).json({ error: "Unauthorized: Missing token" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = await verifyToken(token, {
      secretKey: env.clerkSecretKey,
    });

    if (!payload?.sub) {
      logger.warn("⚠️ Verified token, but missing 'sub' (user ID)");
      res.status(401).json({ error: "Unauthorized: Invalid token payload" });
      return;
    }

    req.userId = payload.sub;

    // Resolve internal profile ID and check role
    const profile = await profileRepo.resolveOrProvisionUser(payload.sub);
    if (profile.role === "banned") {
      logger.warn(`🚫 Banned user attempted to access API: ${profile.id}`);
      res.status(403).json({ error: "Account suspended", code: "BANNED" });
      return;
    }

    req.profileId = profile.id;
    req.userRole = profile.role;

    next();
  } catch (error: any) {
    logger.error("❌ JWT verification failed");

    const errorMessage = error?.message?.includes("jwt expired")
      ? "Unauthorized: Token has expired"
      : "Unauthorized: Invalid or expired token";

    res.status(401).json({ error: errorMessage });
  }
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = await verifyToken(token, {
      secretKey: env.clerkSecretKey,
    });
    if (payload?.sub) {
      req.userId = payload.sub;
      const profile = await profileRepo.findByClerkId(payload.sub);
      if (profile) {
        req.profileId = profile.id;
        req.userRole = profile.role;
      }
    }
  } catch (error) {
    // Silently fail authentication and proceed anonymously
  }
  next();
};
