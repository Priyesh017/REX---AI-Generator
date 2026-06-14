import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const userRole = req.userRole;

  logger.info({ 
    currentUser: req.profileId, 
    currentRole: userRole,
    isAdmin: userRole === "admin" 
  }, "🔒 Admin Check:");

  if (!userRole || userRole !== "admin") {
    logger.warn(`🚫 Unauthorized admin access attempt by profile: ${req.profileId} with role: ${userRole}`);
    return res.status(403).json({ 
      success: false, 
      error: "Forbidden: You do not have admin privileges." 
    });
  }

  next();
};
