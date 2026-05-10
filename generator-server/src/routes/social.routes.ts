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
  createCommentSchema, 
  paginationQuerySchema 
} from "../validation/social.validation";

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
  validate(targetUsernameParamSchema, "params"),
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

export default router;
