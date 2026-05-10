// src/validation/social.validation.ts
import { z } from "zod";

// Shared common validators
const uuidParam = z.object({
  postId: z.string().uuid("Invalid post ID format").optional(),
  commentId: z.string().uuid("Invalid comment ID format").optional(),
});

const usernameParam = z.object({
  targetUsername: z.string().min(1, "Username is required").optional(),
  username: z.string().min(1, "Username is required").optional(),
});

export const postIdParamSchema = uuidParam;
export const commentIdParamSchema = uuidParam;
export const targetUsernameParamSchema = usernameParam;

export const createCommentSchema = z.object({
  body: z.string().min(1, "Comment cannot be empty").max(1000, "Comment is too long"),
  parentCommentId: z.string().uuid("Invalid parent comment ID").optional()
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});
