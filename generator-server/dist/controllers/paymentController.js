"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentSuccess = exports.createOrder = void 0;
const razorpay_1 = require("../config/razorpay");
const supabase_1 = require("../config/supabase");
// Create a new Razorpay order and store it in Supabase
const createOrder = async (req, res) => {
    const { planId, clerkId } = req.body;
    console.log("Received request with:", { planId, clerkId });
    if (!planId || !clerkId) {
        console.error("Missing data");
        return res.status(400).json({ success: false, error: "Missing data" });
    }
    const { data: plan, error: planError } = await supabase_1.supabase
        .from("plans")
        .select("*")
        .eq("id", planId)
        .single();
    if (planError || !plan) {
        console.error("Plan fetch error:", planError);
        return res.status(404).json({ success: false, error: "Plan not found" });
    }
    try {
        const order = await razorpay_1.razorpay.orders.create({
            amount: plan.price * 100,
            currency: "INR",
            receipt: `rcpt_${Date.now()}`,
        });
        console.log("Created Razorpay order:", order);
        await supabase_1.supabase.from("orders").insert([
            {
                order_id: order.id,
                clerk_id: clerkId,
                plan_id: plan.id,
                status: "created",
            },
        ]);
        return res.json({ success: true, order });
    }
    catch (err) {
        console.error("Order creation error:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
};
exports.createOrder = createOrder;
// Handle successful payment: update order and credit user
const paymentSuccess = async (req, res) => {
    const { orderId, clerkId } = req.body;
    if (!orderId || !clerkId) {
        return res
            .status(400)
            .json({ success: false, error: "Missing orderId or clerkId" });
    }
    // ✅ Retrieve order + plan details
    const { data: orderData, error: orderError } = await supabase_1.supabase
        .from("orders")
        .select("*, plan:plan_id(*)") // get order and joined plan
        .eq("order_id", orderId)
        .eq("clerk_id", clerkId)
        .single();
    if (orderError || !orderData) {
        return res.status(404).json({ success: false, error: "Order not found" });
    }
    // ✅ Update order status to "paid"
    const { error: updateOrderError } = await supabase_1.supabase
        .from("orders")
        .update({ status: "paid" })
        .eq("order_id", orderId);
    if (updateOrderError) {
        return res
            .status(500)
            .json({ success: false, error: updateOrderError.message });
    }
    // ✅ Add credits via Supabase RPC function
    const planCredits = orderData.plan?.credits;
    if (!planCredits || typeof planCredits !== "number") {
        return res
            .status(400)
            .json({ success: false, error: "Invalid plan credits" });
    }
    const { error: creditError } = await supabase_1.supabase.rpc("increment_credits", {
        user_clerk_id: clerkId,
        credits_to_add: planCredits,
    });
    if (creditError) {
        return res.status(500).json({ success: false, error: creditError.message });
    }
    return res.json({ success: true, message: "Credits updated successfully" });
};
exports.paymentSuccess = paymentSuccess;
