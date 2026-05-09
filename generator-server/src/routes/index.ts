// src/routes/index.ts
// Root router: mounts all domain routers.
//
// BACKWARD COMPATIBILITY ALIASES:
//   POST /api/generate        → studio router (existing clients still work)
//   GET  /api/history         → studio/drafts (existing clients still work)
//   DELETE /api/history/:id   → studio/drafts/:id
//   GET  /api/user-details    → profile/me
//
// New canonical paths:
//   POST /api/studio/generate
//   GET  /api/studio/drafts
//   DELETE /api/studio/drafts/:id
//   GET  /api/profile/me

import { Router } from "express";
import { apiLimiter } from "../middleware/limiter";

// Domain routers
import profileRouter from "./profile.routes";
import studioRouter from "./studio.routes";
import postRouter from "./post.routes";

// Legacy controllers (preserved — do not break existing flows)
import { getSubscriptionPlans } from "../controllers/getPlans";
import { createOrder, paymentSuccess, paymentWebhook } from "../controllers/paymentController";
import {
  getAdminStats,
  getAdminUsers,
  updateUserDetails,
  getAdminTransactions,
  getAdminImages,
} from "../controllers/adminController";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/adminAuth";
import { catchAsync } from "../utils/catchAsync";
import { generationLimiter } from "../middleware/limiter";
import { validate } from "../middleware/validate";
import { generateSchema, listDraftsQuerySchema, draftIdParamSchema } from "../validation/draft.validation";
import { generate, listDrafts, deleteDraft } from "../controllers/draft.controller";
import { getMyProfile } from "../controllers/profile.controller";

const router = Router();

// Apply general rate limit to all routes
router.use(apiLimiter);

// ── Domain routers (new canonical paths) ─────────────────────────────────────
router.use("/profile", profileRouter);
router.use("/studio", studioRouter);
router.use("/posts", postRouter);

// ── Billing (unchanged) ───────────────────────────────────────────────────────
router.get("/plans", catchAsync(getSubscriptionPlans));
router.post("/create-order", requireAuth, catchAsync(createOrder));
router.post("/payment-success", requireAuth, catchAsync(paymentSuccess));
router.post("/payment-webhook", catchAsync(paymentWebhook));

// ── Admin (unchanged) ─────────────────────────────────────────────────────────
router.get("/admin/stats", requireAuth, requireAdmin, catchAsync(getAdminStats));
router.get("/admin/users", requireAuth, requireAdmin, catchAsync(getAdminUsers));
router.get("/admin/transactions", requireAuth, requireAdmin, catchAsync(getAdminTransactions));
router.get("/admin/images", requireAuth, requireAdmin, catchAsync(getAdminImages));
router.post("/admin/update-user", requireAuth, requireAdmin, catchAsync(updateUserDetails));

// ── Backward compatibility aliases ────────────────────────────────────────────
// These keep existing frontend clients working without changes.
// They delegate to the same new controllers — no logic duplication.

/** @deprecated Use POST /api/studio/generate */
router.post(
  "/generate",
  requireAuth,
  generationLimiter,
  validate(generateSchema, "body"),
  catchAsync(generate)
);

/** @deprecated Use GET /api/studio/drafts */
router.get(
  "/history",
  requireAuth,
  validate(listDraftsQuerySchema, "query"),
  catchAsync(listDrafts)
);

/** @deprecated Use DELETE /api/studio/drafts/:id */
router.delete(
  "/history/:id",
  requireAuth,
  validate(draftIdParamSchema, "params"),
  catchAsync(deleteDraft)
);

/** @deprecated Use GET /api/profile/me */
router.get("/user-details", requireAuth, catchAsync(getMyProfile));

export default router;
