// src/validation/admin.validation.ts
import { z } from "zod";

export const adminUsersQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const adminPaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const adminUpdateUserSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  credits: z.coerce.number().int().min(0, "credits must be non-negative"),
  plan: z.string().min(1, "plan is required"),
});

export type AdminUsersQuery = z.infer<typeof adminUsersQuerySchema>;
export type AdminPaginationQuery = z.infer<typeof adminPaginationQuerySchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
