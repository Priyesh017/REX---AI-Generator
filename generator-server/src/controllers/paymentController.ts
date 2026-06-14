// src/controllers/paymentController.ts
import { Request, Response, NextFunction } from "express";
import * as paymentService from "../services/payment.service";
import { sendSuccess } from "../lib/response";
import { ValidationError } from "../lib/errors";
import { CreateOrderInput, PaymentSuccessInput } from "../validation/payment.validation";

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { planId } = req.body as CreateOrderInput;
    const order = await paymentService.createPlanOrder(req.userId!, planId);
    sendSuccess(res, order, 201);
  } catch (err) {
    next(err);
  }
};

export const paymentSuccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body as PaymentSuccessInput;
    const result = await paymentService.processPaymentSuccess(
      req.userId!,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature
    );
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

export const paymentWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = req.headers["x-razorpay-signature"] as string;
    const rawBody = req.rawBody; // Extended property on Request interface

    if (!signature || !rawBody) {
      throw new ValidationError("Webhook signature or raw body missing");
    }

    const result = await paymentService.processWebhook(signature, rawBody, req.body);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};
