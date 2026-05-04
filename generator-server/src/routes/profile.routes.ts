// src/routes/profile.routes.ts
// Profile domain routes.

import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { catchAsync } from "../utils/catchAsync";
import { getMyProfile } from "../controllers/profile.controller";

const router = Router();

/**
 * GET /api/profile/me
 * Returns the current authenticated user's profile + credits.
 * Replaces the old /api/user-details endpoint (backward compat alias kept in index.ts).
 */
router.get("/me", requireAuth, catchAsync(getMyProfile));

export default router;
