import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.userId;
  const adminId = env.adminId;

  console.log("🔒 Admin Check:", { 
    currentUser: userId, 
    requiredAdmin: adminId,
    matches: userId === adminId 
  });

  if (!userId || userId !== adminId) {
    console.warn(`🚫 Unauthorized admin access attempt by: ${userId}`);
    return res.status(403).json({ 
      success: false, 
      error: "Forbidden: You do not have admin privileges." 
    });
  }

  next();
};
