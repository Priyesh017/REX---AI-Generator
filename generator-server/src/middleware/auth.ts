import { Request, Response, NextFunction } from "express";
import { verifyToken } from "@clerk/backend";
import { env } from "../config/env";
import { logger } from "../utils/logger";

// Extend Express's Request interface to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  // Check if the Authorization header is missing or invalid
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    logger.warn("⚠️ No Bearer token in Authorization header");
    res.status(401).json({ error: "Unauthorized: Missing token" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verify the token using Clerk's backend verification
    const payload = await verifyToken(token, {
      secretKey: env.clerkSecretKey,
    });

    // Ensure 'sub' (user ID) exists in the token payload
    if (!payload?.sub) {
      logger.warn("⚠️ Verified token, but missing 'sub' (user ID)");
      res.status(401).json({ error: "Unauthorized: Invalid token payload" });
      return;
    }

    // Attach the userId to the request object for downstream use
    req.userId = payload.sub;

    // Proceed to the next middleware or route handler
    next();
  } catch (error: any) {
    logger.error("❌ JWT verification failed:", error?.message || error);

    // Handle different types of errors from Clerk (e.g., expired token)
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
    }
  } catch (error) {
    // Silently fail authentication and proceed anonymously
  }
  next();
};
