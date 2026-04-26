// src/controllers/paymentController.ts
import { Request, Response } from "express";
import { razorpay } from "../config/razorpay";
import { supabase } from "../config/supabase";
import crypto from "crypto";
import { env } from "../config/env";

// Create a new Razorpay order and store it in Supabase
export const createOrder = async (req: Request, res: Response) => {
  const { planId } = req.body;
  const clerkId = req.userId;

  console.log("Received request with:", { planId, clerkId });

  if (!planId || !clerkId) {
    console.error("Missing data");
    return res.status(400).json({ success: false, error: "Missing data" });
  }

  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select("*")
    .eq("id", planId)
    .single();

  if (planError || !plan) {
    console.error("Plan fetch error:", planError);
    return res.status(404).json({ success: false, error: "Plan not found" });
  }

  try {
    const order = await razorpay.orders.create({
      amount: plan.price * 100,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    });

    console.log("Created Razorpay order:", order);

    await supabase.from("orders").insert([
      {
        order_id: order.id,
        clerk_id: clerkId,
        plan_id: plan.id,
        status: "created",
      },
    ]);

    return res.json({ success: true, order });
  } catch (err: any) {
    console.error("Order creation error:", err);
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

  // ✅ Retrieve order + plan details
  const { data: orderData, error: orderError } = await supabase
    .from("orders")
    .select("*, plan:plan_id(*)") // get order and joined plan
    .eq("order_id", razorpay_order_id)
    .eq("clerk_id", clerkId)
    .single();

  if (orderError || !orderData) {
    return res.status(404).json({ success: false, error: "Order not found" });
  }

  // ✅ Check idempotency
  if (orderData.status === "paid") {
    return res.json({ success: true, message: "Order already processed" });
  }

  // ✅ Add credits via Supabase RPC function FIRST to ensure we don't mark paid if credit fails
  // Actually, standard is to mark paid, then credit, or both in transaction. RPC can do it.
  // We'll update credits first.
  const planCredits = orderData.plan?.credits;

  if (!planCredits || typeof planCredits !== "number") {
    return res
      .status(400)
      .json({ success: false, error: "Invalid plan credits" });
  }

  const { error: creditError } = await supabase.rpc("increment_credits", {
    user_clerk_id: clerkId,
    credits_to_add: planCredits,
  });

  if (creditError) {
    return res.status(500).json({ success: false, error: creditError.message });
  }

  // ✅ Update order status to "paid"
  const { error: updateOrderError } = await supabase
    .from("orders")
    .update({ status: "paid" })
    .eq("order_id", razorpay_order_id);

  if (updateOrderError) {
    console.error("Order status update failed:", updateOrderError);
    // Continue since credits are added, but we should log it
  }

  return res.json({ success: true, message: "Credits updated successfully" });
};
