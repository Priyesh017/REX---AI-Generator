// src/routes/routes.ts
import { Router } from "express";
import { generateImage } from "../controllers/generateController";
import {
  getImageHistory,
  deleteImageHistory,
} from "../controllers/historyController";
// import { createOrder } from "../controllers/paymentController";
import { requireAuth } from "../middleware/auth";
import { catchAsync } from "../utils/catchAsync";

const router = Router();

router.post("/generate", requireAuth, catchAsync(generateImage));
// router.post("/payment", requireAuth, createOrder);
router.get("/history", requireAuth, catchAsync(getImageHistory));
router.delete("/history/:id", requireAuth, catchAsync(deleteImageHistory));

export default router;
