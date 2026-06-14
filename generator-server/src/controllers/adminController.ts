// src/controllers/adminController.ts
import { Request, Response, NextFunction } from "express";
import * as adminService from "../services/admin.service";
import { sendSuccess } from "../lib/response";
import { AdminUsersQuery, AdminPaginationQuery, AdminUpdateUserInput } from "../validation/admin.validation";

// Get Overall Stats & Revenue Chart Data
export const getAdminStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await adminService.getStats();
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};

// Search & List Users
export const getAdminUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, page, limit } = req.query as unknown as AdminUsersQuery;
    const { users, total } = await adminService.getUsers(search, page, limit);
    sendSuccess(res, users, 200, { pagination: { page, limit, total } });
  } catch (err) {
    next(err);
  }
};

// List All Transactions
export const getAdminTransactions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = req.query as unknown as AdminPaginationQuery;
    const { transactions, total } = await adminService.getTransactions(page, limit);
    sendSuccess(res, transactions, 200, { pagination: { page, limit, total } });
  } catch (err) {
    next(err);
  }
};

// List All Images
export const getAdminImages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = req.query as unknown as AdminPaginationQuery;
    const { images, total } = await adminService.getImages(page, limit);
    sendSuccess(res, images, 200, { pagination: { page, limit, total } });
  } catch (err) {
    next(err);
  }
};

// Manually Update User Credits
export const updateUserDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, credits, plan } = req.body as AdminUpdateUserInput;
    const result = await adminService.updateUser(userId, credits, plan);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};
