// src/controllers/post.controller.ts
import { Request, Response, NextFunction } from "express";
import * as postService from "../services/post.service";
import { sendSuccess } from "../lib/response";
import { CreatePostInput, ListPostsQuery } from "../validation/post.validation";

export async function createPost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { draft_id, title, caption } = req.body as CreatePostInput;
    const result = await postService.createPostFromDraft(req.userId!, draft_id, title, caption);
    sendSuccess(res, { post: result }, 201);
  } catch (err) {
    next(err);
  }
}

export async function getPost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id);
    const result = await postService.getPost(id);
    sendSuccess(res, { post: result }, 200);
  } catch (err) {
    next(err);
  }
}

export async function listPosts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { cursor, limit, username } = req.query as unknown as ListPostsQuery;
    const result = await postService.listPosts(limit, cursor, username);
    sendSuccess(res, result.posts, 200, { pagination: result.pagination });
  } catch (err) {
    next(err);
  }
}

export async function deletePost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id);
    await postService.deletePost(req.userId!, id);
    sendSuccess(res, { deleted: true });
  } catch (err) {
    next(err);
  }
}
