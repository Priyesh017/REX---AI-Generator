import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { logger } from "../utils/logger";

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.userId;
  const adminId = env.adminId;

  logger.info({ 
    currentUser: userId, 
    requiredAdmin: adminId,
    matches: userId === adminId 
  }, "🔒 Admin Check:");

  if (!userId || userId !== adminId) {
    logger.warn(`🚫 Unauthorized admin access attempt by: ${userId}`);
    return res.status(403).json({ 
      success: false, 
      error: "Forbidden: You do not have admin privileges." 
    });
  }

  next();
};
