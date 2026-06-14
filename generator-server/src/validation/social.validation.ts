// src/validation/social.validation.ts
import { z } from "zod";

export const postIdParamSchema = z.object({
  postId: z.string().uuid("Invalid post ID format"),
});

export const commentIdParamSchema = z.object({
  commentId: z.string().uuid("Invalid comment ID format"),
});

export const targetUsernameParamSchema = z.object({
  targetUsername: z.string().min(1, "Username is required"),
});

export const usernameParamSchema = z.object({
  username: z.string().min(1, "Username is required"),
});

export const createCommentSchema = z.object({
  body: z.string().min(1, "Comment cannot be empty").max(1000, "Comment is too long"),
  parentCommentId: z.string().uuid("Invalid parent comment ID").optional()
});

export const paginationQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});
