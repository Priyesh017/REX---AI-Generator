// src/routes/routes.ts
import { Router } from "express";
import { generateImage } from "../controllers/generateController";
import {
  getImageHistory,
  deleteImageHistory,
} from "../controllers/historyController";
import { requireAuth } from "../middleware/auth";
import { catchAsync } from "../utils/catchAsync";
import { getSubscriptionPlans } from "../controllers/getPlans";
import { createOrder, paymentSuccess, paymentWebhook } from "../controllers/paymentController";
import { getUserDetails } from "../controllers/getUserDetails";
import { apiLimiter, generationLimiter } from "../middleware/limiter";
import { 
  getAdminStats, 
  getAdminUsers, 
  updateUserDetails, 
  getAdminTransactions, 
  getAdminImages 
} from "../controllers/adminController";
import { requireAdmin } from "../middleware/adminAuth";

const router = Router();

// Apply general rate limit to all routes
router.use(apiLimiter);

router.get("/plans", catchAsync(getSubscriptionPlans));

router.get("/user-details", requireAuth, catchAsync(getUserDetails));

router.post("/generate", requireAuth, generationLimiter, catchAsync(generateImage));
router.get("/history", requireAuth, catchAsync(getImageHistory));
router.delete("/history/:id", requireAuth, catchAsync(deleteImageHistory));

router.post("/create-order", requireAuth, catchAsync(createOrder));
router.post("/payment-success", requireAuth, catchAsync(paymentSuccess));
router.post("/payment-webhook", catchAsync(paymentWebhook));

// Admin Routes
router.get("/admin/stats", requireAuth, requireAdmin, catchAsync(getAdminStats));
router.get("/admin/users", requireAuth, requireAdmin, catchAsync(getAdminUsers));
router.get("/admin/transactions", requireAuth, requireAdmin, catchAsync(getAdminTransactions));
router.get("/admin/images", requireAuth, requireAdmin, catchAsync(getAdminImages));
router.post("/admin/update-user", requireAuth, requireAdmin, catchAsync(updateUserDetails));


export default router;
