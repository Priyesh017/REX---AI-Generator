// src/routes/post.routes.ts
import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { catchAsync } from "../utils/catchAsync";
import {
  createPost,
  getPost,
  listPosts,
  deletePost,
} from "../controllers/post.controller";
import {
  createPostSchema,
  listPostsQuerySchema,
  postIdParamSchema,
} from "../validation/post.validation";
import { reportPost, moderatePost } from "../controllers/moderation.controller";
import { reportContentSchema, moderateContentSchema } from "../validation/moderation.validation";
import { requireAdmin } from "../middleware/adminAuth";

const router = Router();

// Public routes (if you want public viewing)
router.get("/", validate(listPostsQuerySchema, "query"), catchAsync(listPosts));
router.get("/:id", validate(postIdParamSchema, "params"), catchAsync(getPost));

// Protected routes
router.post(
  "/",
  requireAuth,
  validate(createPostSchema, "body"),
  catchAsync(createPost)
);

router.delete(
  "/:id",
  requireAuth,
  validate(postIdParamSchema, "params"),
  catchAsync(deletePost)
);

// Report post (auth required)
router.post(
  "/:id/report",
  requireAuth,
  validate(postIdParamSchema, "params"),
  validate(reportContentSchema, "body"),
  catchAsync(reportPost)
);

// Moderate post (admin required)
router.post(
  "/:id/moderate",
  requireAuth,
  requireAdmin,
  validate(postIdParamSchema, "params"),
  validate(moderateContentSchema, "body"),
  catchAsync(moderatePost)
);

export default router;
