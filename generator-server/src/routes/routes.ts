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
import { createOrder, paymentSuccess } from "../controllers/paymentController";
import { getUserDetails } from "../controllers/getUserDetails";

const router = Router();

router.get("/plans", catchAsync(getSubscriptionPlans));

router.get("/user-details", requireAuth, catchAsync(getUserDetails));

router.post("/generate", requireAuth, catchAsync(generateImage));
router.get("/history", requireAuth, catchAsync(getImageHistory));
router.delete("/history/:id", requireAuth, catchAsync(deleteImageHistory));

router.post("/create-order", requireAuth, catchAsync(createOrder));
router.post("/payment-success", requireAuth, catchAsync(paymentSuccess));

export default router;
