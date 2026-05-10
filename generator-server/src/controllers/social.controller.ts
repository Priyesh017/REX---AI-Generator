// src/controllers/social.controller.ts
import { Request, Response } from "express";
import * as socialService from "../services/social.service";
import { sendSuccess } from "../lib/response";

// --- LIKES ---

export const toggleLike = async (req: Request, res: Response) => {
  const { postId } = req.params as { postId: string };
  const result = await socialService.toggleLike(req.userId!, postId);
  sendSuccess(res, result);
};

export const getPostSocialMeta = async (req: Request, res: Response) => {
  const { postId } = req.params as { postId: string };
  // Optional auth
  const clerkId = req.userId; 
  const result = await socialService.getPostSocialMeta(postId, clerkId);
  sendSuccess(res, result);
};

// --- FOLLOWS ---

export const toggleFollow = async (req: Request, res: Response) => {
  const { targetUsername } = req.params as { targetUsername: string };
  const result = await socialService.toggleFollow(req.userId!, targetUsername);
  sendSuccess(res, result);
};

export const getProfileSocialMeta = async (req: Request, res: Response) => {
  const { username } = req.params as { username: string };
  const clerkId = req.userId;
  const result = await socialService.getProfileSocialMeta(username, clerkId);
  sendSuccess(res, result);
};

// --- COMMENTS ---

export const addComment = async (req: Request, res: Response) => {
  const { postId } = req.params as { postId: string };
  const { body, parentCommentId } = req.body;
  const result = await socialService.addComment(req.userId!, postId, body, parentCommentId);
  sendSuccess(res, result, 201);
};

export const listComments = async (req: Request, res: Response) => {
  const { postId } = req.params as { postId: string };
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  
  const result = await socialService.getComments(postId, page, limit);
  sendSuccess(res, result.comments, 200, result.pagination);
};

export const deleteComment = async (req: Request, res: Response) => {
  const { commentId } = req.params as { commentId: string };
  await socialService.deleteComment(req.userId!, commentId);
  sendSuccess(res, { success: true });
};
