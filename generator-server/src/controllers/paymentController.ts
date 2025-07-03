// src/controllers/paymentController.ts
import { Request, Response } from "express";
import { razorpay } from "../config/razorpay";
import { getUserIdFromToken } from "../lib/getUserIdFromToken";
import { supabase } from "../config/supabase";

export const createOrder = async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req.headers.authorization);
    const { amount } = req.body;

    const options = {
      amount: amount * 100, // convert to paisa
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    // Optional: Store order in DB
    await supabase.from("transactions").insert([
      {
        user_id: userId,
        razorpay_order_id: order.id,
        amount: order.amount,
        status: "created",
      },
    ]);

    res.status(200).json({ orderId: order.id });
  } catch (err) {
    console.error("Create Razorpay order error:", err);
    res.status(500).json({ error: "Payment creation failed" });
  }
};
