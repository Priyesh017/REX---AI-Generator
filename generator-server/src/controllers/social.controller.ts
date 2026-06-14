// src/controllers/social.controller.ts
import { Request, Response, NextFunction } from "express";
import * as socialService from "../services/social.service";
import { sendSuccess } from "../lib/response";

// --- LIKES ---

export const toggleLike = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { postId } = req.params as { postId: string };
    const result = await socialService.toggleLike(req.userId!, postId);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

export const getPostSocialMeta = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { postId } = req.params as { postId: string };
    const clerkId = req.userId; 
    const result = await socialService.getPostSocialMeta(postId, clerkId);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

// --- FOLLOWS ---

export const toggleFollow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { targetUsername } = req.params as { targetUsername: string };
    const result = await socialService.toggleFollow(req.userId!, targetUsername);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

export const getProfileSocialMeta = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username } = req.params as { username: string };
    const clerkId = req.userId;
    const result = await socialService.getProfileSocialMeta(username, clerkId);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

// --- COMMENTS ---

export const addComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { postId } = req.params as { postId: string };
    const { body, parentCommentId } = req.body;
    const result = await socialService.addComment(req.userId!, postId, body, parentCommentId);
    sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
};

export const listComments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { postId } = req.params as { postId: string };
    const cursor = req.query.cursor as string | undefined;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const result = await socialService.getComments(postId, limit, cursor);
    sendSuccess(res, result.comments, 200, { pagination: result.pagination });
  } catch (err) {
    next(err);
  }
};

export const deleteComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { commentId } = req.params as { commentId: string };
    await socialService.deleteComment(req.userId!, commentId);
    sendSuccess(res, { success: true });
  } catch (err) {
    next(err);
  }
};
