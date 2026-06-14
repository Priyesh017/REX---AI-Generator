// src/validation/moderation.validation.ts
import { z } from "zod";

export const reportContentSchema = z.object({
  reason: z.string().min(1, "Reason is required").max(500, "Reason too long"),
});

export const moderateContentSchema = z.object({
  action: z.enum(["remove", "approve"]),
  note: z.string().max(300).optional(),
});

export const banUserPayloadSchema = z.object({
  reason: z.string().min(1, "Ban reason is required"),
});

export type ReportContentInput = z.infer<typeof reportContentSchema>;
export type ModerateContentInput = z.infer<typeof moderateContentSchema>;
export type BanUserPayloadInput = z.infer<typeof banUserPayloadSchema>;
