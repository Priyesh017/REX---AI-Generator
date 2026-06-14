// src/validation/draft.validation.ts
// Zod schemas for the draft/generation domain.

import { z } from "zod";

/** POST /api/studio/generate */
export const generateSchema = z.object({
  prompt: z
    .string({ required_error: "Prompt is required" })
    .min(1, "Prompt cannot be empty")
    .max(1000, "Prompt must be 1000 characters or fewer")
    .trim(),
});

/** GET /api/studio/drafts — query params */
export const listDraftsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 12))
    .pipe(z.number().int().min(1).max(50)),
});

/** DELETE /api/studio/drafts/:id — params */
export const draftIdParamSchema = z.object({
  id: z.string().uuid("Invalid draft ID"),
});

export type GenerateInput = z.infer<typeof generateSchema>;
export type ListDraftsQuery = z.infer<typeof listDraftsQuerySchema>;
export type DraftIdParam = z.infer<typeof draftIdParamSchema>;
