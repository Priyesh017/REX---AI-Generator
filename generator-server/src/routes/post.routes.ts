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

export default router;
