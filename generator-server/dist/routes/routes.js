"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/routes.ts
const express_1 = require("express");
const generateController_1 = require("../controllers/generateController");
const historyController_1 = require("../controllers/historyController");
// import { createOrder } from "../controllers/paymentController";
const auth_1 = require("../middleware/auth");
const catchAsync_1 = require("../utils/catchAsync");
const router = (0, express_1.Router)();
router.post("/generate", auth_1.requireAuth, (0, catchAsync_1.catchAsync)(generateController_1.generateImage));
// router.post("/payment", requireAuth, createOrder);
router.get("/history", auth_1.requireAuth, (0, catchAsync_1.catchAsync)(historyController_1.getImageHistory));
router.delete("/history/:id", auth_1.requireAuth, (0, catchAsync_1.catchAsync)(historyController_1.deleteImageHistory));
exports.default = router;
