// src/controllers/paymentController.ts
import { Request, Response } from "express";
import { razorpay } from "../config/razorpay";
import { supabase } from "../config/supabase";
import crypto from "crypto";
import { env } from "../config/env";
import { logger } from "../utils/logger";

// Create a new Razorpay order and store it in Supabase
export const createOrder = async (req: Request, res: Response) => {
  const { planId } = req.body;
  const clerkId = req.userId;

  logger.info({ planId, clerkId }, "Received request with:");

  if (!planId || !clerkId) {
    logger.error("Missing data");
    return res.status(400).json({ success: false, error: "Missing data" });
  }

  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select("*")
    .eq("id", planId)
    .single();

  if (planError || !plan) {
    logger.error({ planError }, "Plan fetch error:");
    return res.status(404).json({ success: false, error: "Plan not found" });
  }

  try {
    const order = await razorpay.orders.create({
      amount: plan.price * 100,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    });

    logger.info({ orderId: order.id }, "Created Razorpay order:");

    const { error: insertError } = await supabase.from("orders").insert([
      {
        order_id: order.id,
        clerk_id: clerkId,
        plan_id: plan.id,
        status: "created",
      },
    ]);

    if (insertError) {
      logger.error({ insertError }, "❌ Failed to save order to database:");
      return res.status(500).json({ 
        success: false, 
        error: "Database error: Could not save order. Please try again." 
      });
    }

    logger.info({ orderId: order.id }, "✅ Order saved to database:");
    return res.json({ success: true, order });
  } catch (err: any) {
    logger.error({ err }, "Order creation error:");
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Handle successful payment: update order and credit user
export const paymentSuccess = async (req: Request, res: Response) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
  const clerkId = req.userId;

  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !clerkId) {
    return res
      .status(400)
      .json({ success: false, error: "Missing payment data" });
  }

  // ✅ Verify Razorpay signature
  const generated_signature = crypto
    .createHmac("sha256", env.razorpayKeySecret!)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest("hex");

  if (generated_signature !== razorpay_signature) {
    return res.status(400).json({ success: false, error: "Invalid payment signature" });
  }

  logger.info(`🔍 Processing payment success for Order: ${razorpay_order_id}, User: ${clerkId}`);

  // ✅ Retrieve order + plan details
  const { data: orderData, error: orderError } = await supabase
    .from("orders")
    .select("*, plan:plan_id(*)")
    .eq("order_id", razorpay_order_id)
    .eq("clerk_id", clerkId)
    .single();

  if (orderError || !orderData) {
    logger.error({
      searchingFor: razorpay_order_id,
      clerkId: clerkId,
      error: orderError
    }, "❌ Order not found in database:");
    return res.status(404).json({ success: false, error: "Order not found" });
  }

  if (orderData.status === "paid") {
    return res.json({ success: true, message: "Order already processed" });
  }

  const planCredits = orderData.plan?.credits;
  if (!planCredits || typeof planCredits !== "number") {
    return res.status(400).json({ success: false, error: "Invalid plan credits" });
  }

  const { error: creditError } = await supabase.rpc("increment_credits", {
    user_clerk_id: clerkId,
    credits_to_add: planCredits,
  });

  if (creditError) {
    return res.status(500).json({ success: false, error: creditError.message });
  }

  await supabase
    .from("orders")
    .update({ status: "paid" })
    .eq("order_id", razorpay_order_id);

  return res.json({ success: true, message: "Credits updated successfully" });
};

// Handle Razorpay Webhook (Server-to-Server)
export const paymentWebhook = async (req: Request, res: Response) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "your_webhook_secret";
  
  // Razorpay sends the signature in the header
  const signature = req.headers["x-razorpay-signature"];
  
  const rawBody = (req as any).rawBody;
  
  if (!rawBody) {
    return res.status(400).json({ success: false, error: "Raw request body missing" });
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  if (signature !== expectedSignature) {
    return res.status(400).json({ success: false, error: "Invalid webhook signature" });
  }

  const { event, payload } = req.body;

  if (event === "order.paid") {
    const orderId = payload.order.entity.id;
    
    // 1. Get order details from our DB
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select("*, plan:plan_id(*)")
      .eq("order_id", orderId)
      .single();

    if (orderError || !orderData) {
      logger.error({ orderId }, "Webhook: Order not found");
      return res.status(404).json({ success: false });
    }

    // 2. Idempotency check
    if (orderData.status === "paid") {
      return res.json({ success: true, message: "Already processed" });
    }

    // 3. Add credits
    const planCredits = orderData.plan?.credits;
    if (planCredits) {
      await supabase.rpc("increment_credits", {
        user_clerk_id: orderData.clerk_id,
        credits_to_add: planCredits,
      });

      // 4. Update status
      await supabase
        .from("orders")
        .update({ status: "paid" })
        .eq("order_id", orderId);
        
      logger.info(`✅ Webhook: Credited ${planCredits} to user ${orderData.clerk_id}`);
    }
  }

  res.json({ status: "ok" });
};
