// src/controllers/notification.controller.ts
import { Request, Response, NextFunction } from "express";
import * as notificationService from "../services/notification.service";
import { sendSuccess } from "../lib/response";

export const getNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const cursor = req.query.cursor as string | undefined;
    const result = await notificationService.getNotifications(req.profileId!, limit, cursor);
    sendSuccess(res, result.notifications, 200, { pagination: result.pagination });
  } catch (err) {
    next(err);
  }
};

export const markRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { notificationIds } = req.body as { notificationIds: string[] };
    const result = await notificationService.markRead(req.profileId!, notificationIds || []);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

export const markAllRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await notificationService.markAllRead(req.profileId!);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};
