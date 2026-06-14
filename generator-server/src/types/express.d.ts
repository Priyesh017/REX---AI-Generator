// src/types/express.d.ts
// Augment Express Request with REX-specific properties.
// All middleware attaches to these typed fields.
// NEVER add clerkUserId as a relational FK downstream — use req.userId (Clerk string) for auth only.

import "express";

declare global {
  namespace Express {
    interface Request {
      /** Clerk user ID — from verified JWT. Use only for auth/profile lookup. */
      userId?: string;
      /** Internal profile UUID relational key. */
      profileId?: string;
      /** Internal profile role — resolved after requireAuth. */
      userRole?: "user" | "moderator" | "admin" | "banned";
      /** Raw request body — buffer used for webhook signature verification. */
      rawBody?: Buffer;
    }
  }
}
