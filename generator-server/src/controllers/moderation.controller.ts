// src/controllers/moderation.controller.ts
import { Request, Response, NextFunction } from "express";
import * as moderationService from "../services/moderation.service";
import { sendSuccess } from "../lib/response";
import { ReportContentInput, ModerateContentInput, BanUserPayloadInput } from "../validation/moderation.validation";

export const reportPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { reason } = req.body as ReportContentInput;
    const result = await moderationService.reportPost(req.profileId!, id, reason);
    sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
};

export const reportComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { reason } = req.body as ReportContentInput;
    const result = await moderationService.reportComment(req.profileId!, id, reason);
    sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
};

export const moderatePost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { action, note } = req.body as ModerateContentInput;
    const logAction = action === "remove" ? "remove_post" : "approve_post";
    const result = await moderationService.moderatePost(req.profileId!, id, logAction, note);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

export const moderateComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { action, note } = req.body as ModerateContentInput;
    const logAction = action === "remove" ? "remove_comment" : "approve_comment";
    const result = await moderationService.moderateComment(req.profileId!, id, logAction, note);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

export const banUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.params.userId as string; // Profile UUID
    const { reason } = req.body as BanUserPayloadInput;
    const result = await moderationService.banUser(req.profileId!, userId, reason);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};
