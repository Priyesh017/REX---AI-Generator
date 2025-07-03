import { Request, Response, NextFunction } from "express";
import { verifyToken } from "@clerk/backend";
import { env } from "../config/env";

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

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn("⚠️ No Bearer token in Authorization header");
    res.status(401).json({ error: "Unauthorized: Missing token" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = await verifyToken(token, {
      secretKey: env.clerkSecretKey,
    });

    console.log("🔐 Token payload:", payload);

    if (!payload?.sub) {
      console.warn("⚠️ Verified token, but missing 'sub' (user ID)");
      res.status(401).json({ error: "Unauthorized: Invalid token payload" });
      return;
    }

    req.userId = payload.sub; // Set userId on the request

    next();
  } catch (error: any) {
    console.error("❌ JWT verification failed:", error?.message || error);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};
