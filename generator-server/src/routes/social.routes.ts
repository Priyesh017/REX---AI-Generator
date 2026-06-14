// src/routes/social.routes.ts
import { Router } from "express";
import * as socialController from "../controllers/social.controller";
import { requireAuth, optionalAuth } from "../middleware/auth";
import { commentSpeedLimiter } from "../middleware/limiter";
import { catchAsync } from "../utils/catchAsync";
import { validate } from "../middleware/validate";
import { 
  postIdParamSchema, 
  commentIdParamSchema, 
  targetUsernameParamSchema, 
  usernameParamSchema,
  createCommentSchema, 
  paginationQuerySchema 
} from "../validation/social.validation";
import { reportComment, moderateComment } from "../controllers/moderation.controller";
import { reportContentSchema, moderateContentSchema } from "../validation/moderation.validation";
import { requireAdmin } from "../middleware/adminAuth";

const router = Router();

// --- LIKES ---
// Toggle like (auth required)
router.post(
  "/posts/:postId/like",
  requireAuth,
  validate(postIdParamSchema, "params"),
  catchAsync(socialController.toggleLike)
);

// Get post likes and status (optional auth)
router.get(
  "/posts/:postId/likes",
  optionalAuth,
  validate(postIdParamSchema, "params"),
  catchAsync(socialController.getPostSocialMeta)
);


// --- FOLLOWS ---
// Toggle follow (auth required)
router.post(
  "/users/:targetUsername/follow",
  requireAuth,
  validate(targetUsernameParamSchema, "params"),
  catchAsync(socialController.toggleFollow)
);

// Get user followers and status (optional auth)
router.get(
  "/users/:username/followers",
  optionalAuth,
  validate(usernameParamSchema, "params"),
  catchAsync(socialController.getProfileSocialMeta)
);


// --- COMMENTS ---
// Add comment (auth required)
router.post(
  "/posts/:postId/comments",
  requireAuth,
  commentSpeedLimiter,
  validate(postIdParamSchema, "params"),
  validate(createCommentSchema, "body"),
  catchAsync(socialController.addComment)
);

// List comments (no auth required)
router.get(
  "/posts/:postId/comments",
  validate(postIdParamSchema, "params"),
  validate(paginationQuerySchema, "query"),
  catchAsync(socialController.listComments)
);

// Delete comment (auth required, ownership checked in service)
router.delete(
  "/comments/:commentId",
  requireAuth,
  validate(commentIdParamSchema, "params"),
  catchAsync(socialController.deleteComment)
);

// Report comment (auth required)
router.post(
  "/comments/:commentId/report",
  requireAuth,
  validate(commentIdParamSchema, "params"),
  validate(reportContentSchema, "body"),
  catchAsync(reportComment)
);

// Moderate comment (admin required)
router.post(
  "/comments/:commentId/moderate",
  requireAuth,
  requireAdmin,
  validate(commentIdParamSchema, "params"),
  validate(moderateContentSchema, "body"),
  catchAsync(moderateComment)
);

export default router;
