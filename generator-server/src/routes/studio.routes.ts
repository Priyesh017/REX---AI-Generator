// src/routes/studio.routes.ts
// Studio domain routes: image generation + draft asset management.
// These replace the old /generate and /history endpoints.
// Old paths are aliased in the root index for backward compatibility.

import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { generationLimiter } from "../middleware/limiter";
import { catchAsync } from "../utils/catchAsync";
import { validate } from "../middleware/validate";
import {
  generateSchema,
  listDraftsQuerySchema,
  draftIdParamSchema,
} from "../validation/draft.validation";
import {
  generate,
  listDrafts,
  deleteDraft,
} from "../controllers/draft.controller";

const router = Router();

/**
 * POST /api/studio/generate
 * Generate an image from a prompt → saved as private draft.
 */
router.post(
  "/generate",
  requireAuth,
  generationLimiter,
  validate(generateSchema, "body"),
  catchAsync(generate)
);

/**
 * GET /api/studio/drafts
 * List current user's private draft assets.
 */
router.get(
  "/drafts",
  requireAuth,
  validate(listDraftsQuerySchema, "query"),
  catchAsync(listDrafts)
);

/**
 * DELETE /api/studio/drafts/:id
 * Delete a draft asset (ownership enforced in service).
 */
router.delete(
  "/drafts/:id",
  requireAuth,
  validate(draftIdParamSchema, "params"),
  catchAsync(deleteDraft)
);

export default router;
