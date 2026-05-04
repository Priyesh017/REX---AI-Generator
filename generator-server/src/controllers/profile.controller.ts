// src/controllers/profile.controller.ts
// Thin HTTP layer for the profile domain.
// Parse request → call service → send standard response.
// No business logic or DB access here.

import { Request, Response, NextFunction } from "express";
import * as profileService from "../services/profile.service";
import { sendSuccess } from "../lib/response";

/**
 * GET /api/profile/me
 * Returns the current authenticated user's profile.
 * Creates the profile lazily if it doesn't exist yet.
 */
export async function getMyProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const profile = await profileService.getCurrentProfile(req.userId!);
    sendSuccess(res, profile);
  } catch (err) {
    next(err);
  }
}
