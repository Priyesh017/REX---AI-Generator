// src/services/payment.service.ts
import { razorpay } from "../config/razorpay";
import * as paymentRepo from "../repositories/payment.repository";
import * as profileRepo from "../repositories/profile.repository";
import { env } from "../config/env";
import crypto from "crypto";
import { AppError, NotFoundError, ValidationError } from "../lib/errors";
import { logger } from "../utils/logger";

export async function createPlanOrder(clerkId: string, planId: string) {
  const plan = await paymentRepo.getPlanById(planId);
  if (!plan) {
    throw new NotFoundError("Plan not found");
  }

  const profile = await profileRepo.resolveOrProvisionUser(clerkId);

  try {
    const order = await razorpay.orders.create({
      amount: plan.price * 100,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    });

    await paymentRepo.createOrder({
      orderId: order.id,
      clerkId,
      profileId: profile.id,
      planId: plan.id,
      status: "created",
    });

    return order;
  } catch (err: any) {
    logger.error({ err }, "Error in createPlanOrder:");
    throw new AppError(err.message || "Failed to create order", 500, "INTERNAL_ERROR");
  }
}

export async function processPaymentSuccess(
  clerkId: string,
  paymentId: string,
  orderId: string,
  signature: string
) {
  const generated_signature = crypto
    .createHmac("sha256", env.razorpayKeySecret!)
    .update(orderId + "|" + paymentId)
    .digest("hex");

  if (generated_signature !== signature) {
    throw new ValidationError("Invalid payment signature");
  }

  const orderData = await paymentRepo.findOrderByOrderId(orderId);
  if (!orderData) {
    throw new NotFoundError("Order not found");
  }

  if (orderData.clerk_id !== clerkId) {
    throw new AppError("Order does not belong to this user", 403, "FORBIDDEN");
  }

  if (orderData.status === "paid") {
    return { message: "Order already processed" };
  }

  const planCredits = orderData.plan?.credits;
  if (!planCredits || typeof planCredits !== "number") {
    throw new ValidationError("Invalid plan credits configuration");
  }

  const updatedOrder = await paymentRepo.updateOrderStatus(orderId, "paid", paymentId);
  if (!updatedOrder) {
    // Check if it was processed concurrently
    const recheckOrder = await paymentRepo.findOrderByOrderId(orderId);
    if (recheckOrder?.status === "paid") {
      return { message: "Order already processed" };
    }
    throw new AppError("Order not found or already processed", 400, "BAD_REQUEST");
  }

  await paymentRepo.incrementCredits(clerkId, planCredits);
  return { message: "Credits added successfully" };
}

export async function processWebhook(
  signature: string,
  rawBody: Buffer,
  body: any
) {
  const expectedSignature = crypto
    .createHmac("sha256", env.razorpayWebhookSecret!)
    .update(rawBody)
    .digest("hex");

  if (signature !== expectedSignature) {
    throw new ValidationError("Invalid webhook signature");
  }

  const { event, payload } = body;

  if (event === "order.paid") {
    const orderId = payload.order.entity.id;
    const paymentId = payload.payment.entity.id; // Corrected from event.payload.payment (BUG-001)

    const orderData = await paymentRepo.findOrderByOrderId(orderId);
    if (!orderData) {
      logger.error({ orderId }, "Webhook: Order not found");
      throw new NotFoundError("Order not found");
    }

    const planCredits = orderData.plan?.credits;
    if (!planCredits || typeof planCredits !== "number") {
      throw new ValidationError("Invalid plan credits configuration");
    }

    const updatedOrder = await paymentRepo.updateOrderStatus(orderId, "paid", paymentId);
    if (!updatedOrder) {
      logger.info(`ℹ️ Webhook: Order ${orderId} already processed.`);
      return { status: "already_processed" };
    }

    await paymentRepo.incrementCredits(orderData.clerk_id, planCredits);
    logger.info(`✅ Webhook: Added ${planCredits} credits to user ${orderData.clerk_id}`);
    return { status: "processed" };
  }

  return { status: "ignored" };
}
