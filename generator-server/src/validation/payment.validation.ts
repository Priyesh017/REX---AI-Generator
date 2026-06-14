// src/validation/payment.validation.ts
import { z } from "zod";

export const createOrderSchema = z.object({
  planId: z.string().min(1, "planId is required"),
});

export const paymentSuccessSchema = z.object({
  razorpay_payment_id: z.string().min(1, "razorpay_payment_id is required"),
  razorpay_order_id: z.string().min(1, "razorpay_order_id is required"),
  razorpay_signature: z.string().min(1, "razorpay_signature is required"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type PaymentSuccessInput = z.infer<typeof paymentSuccessSchema>;
