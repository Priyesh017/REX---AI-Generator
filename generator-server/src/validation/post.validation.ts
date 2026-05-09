// src/validation/post.validation.ts
import { z } from "zod";

export const createPostSchema = z.object({
  draft_id: z.string().uuid("Invalid draft ID"),
  title: z.string().max(100, "Title too long").optional(),
  caption: z.string().max(500, "Caption too long").optional(),
});

export const listPostsQuerySchema = z.object({
  username: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export const postIdParamSchema = z.object({
  id: z.string().uuid("Invalid post ID"),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type ListPostsQuery = z.infer<typeof listPostsQuerySchema>;
