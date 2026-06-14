// src/routes/notification.routes.ts
import { Router } from "express";
import * as notificationController from "../controllers/notification.controller";
import { requireAuth } from "../middleware/auth";
import { catchAsync } from "../utils/catchAsync";

const router = Router();

router.use(requireAuth);

router.get("/", catchAsync(notificationController.getNotifications));
router.post("/read", catchAsync(notificationController.markRead));
router.post("/read-all", catchAsync(notificationController.markAllRead));

export default router;
