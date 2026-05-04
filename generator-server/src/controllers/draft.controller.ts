// src/controllers/draft.controller.ts
// Thin HTTP layer for the studio/drafts domain.
// All logic lives in draft.service.ts.

import { Request, Response, NextFunction } from "express";
import * as draftService from "../services/draft.service";
import { sendSuccess } from "../lib/response";
import type { GenerateInput, ListDraftsQuery } from "../validation/draft.validation";

/**
 * POST /api/studio/generate
 * Generate an image from a prompt → save as private draft asset.
 */
export async function generate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { prompt } = req.body as GenerateInput;
    const result = await draftService.generateDraft(req.userId!, prompt);
    sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/studio/drafts
 * List current user's draft assets (studio history).
 */
export async function listDrafts(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { page, limit } = req.query as unknown as ListDraftsQuery;
    const result = await draftService.listDrafts(req.userId!, page, limit);
    sendSuccess(res, result.assets, 200, { pagination: result.pagination });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/studio/drafts/:id
 * Delete a draft asset owned by the current user.
 */
export async function deleteDraft(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = String(req.params.id);
    await draftService.deleteDraft(req.userId!, id);
    sendSuccess(res, { deleted: true });
  } catch (err) {
    next(err);
  }
}
