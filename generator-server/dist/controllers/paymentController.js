"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentWebhook = exports.paymentSuccess = exports.createOrder = void 0;
const razorpay_1 = require("../config/razorpay");
const supabase_1 = require("../config/supabase");
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../config/env");
// Create a new Razorpay order and store it in Supabase
const createOrder = async (req, res) => {
    const { planId } = req.body;
    const clerkId = req.userId;
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
        console.log("Created Razorpay order:", order.id);
        const { error: insertError } = await supabase_1.supabase.from("orders").insert([
            {
                order_id: order.id,
                clerk_id: clerkId,
                plan_id: plan.id,
                status: "created",
            },
        ]);
        if (insertError) {
            console.error("❌ Failed to save order to database:", insertError);
            return res.status(500).json({
                success: false,
                error: "Database error: Could not save order. Please try again."
            });
        }
        console.log("✅ Order saved to database:", order.id);
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
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    const clerkId = req.userId;
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !clerkId) {
        return res
            .status(400)
            .json({ success: false, error: "Missing payment data" });
    }
    // ✅ Verify Razorpay signature
    const generated_signature = crypto_1.default
        .createHmac("sha256", env_1.env.razorpayKeySecret)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");
    if (generated_signature !== razorpay_signature) {
        return res.status(400).json({ success: false, error: "Invalid payment signature" });
    }
    console.log(`🔍 Processing payment success for Order: ${razorpay_order_id}, User: ${clerkId}`);
    // ✅ Retrieve order + plan details
    const { data: orderData, error: orderError } = await supabase_1.supabase
        .from("orders")
        .select("*, plan:plan_id(*)")
        .eq("order_id", razorpay_order_id)
        .eq("clerk_id", clerkId)
        .single();
    if (orderError || !orderData) {
        console.error("❌ Order not found in database:", {
            searchingFor: razorpay_order_id,
            clerkId: clerkId,
            error: orderError
        });
        return res.status(404).json({ success: false, error: "Order not found" });
    }
    if (orderData.status === "paid") {
        return res.json({ success: true, message: "Order already processed" });
    }
    const planCredits = orderData.plan?.credits;
    if (!planCredits || typeof planCredits !== "number") {
        return res.status(400).json({ success: false, error: "Invalid plan credits" });
    }
    const { error: creditError } = await supabase_1.supabase.rpc("increment_credits", {
        user_clerk_id: clerkId,
        credits_to_add: planCredits,
    });
    if (creditError) {
        return res.status(500).json({ success: false, error: creditError.message });
    }
    await supabase_1.supabase
        .from("orders")
        .update({ status: "paid" })
        .eq("order_id", razorpay_order_id);
    return res.json({ success: true, message: "Credits updated successfully" });
};
exports.paymentSuccess = paymentSuccess;
// Handle Razorpay Webhook (Server-to-Server)
const paymentWebhook = async (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "your_webhook_secret";
    // Razorpay sends the signature in the header
    const signature = req.headers["x-razorpay-signature"];
    const expectedSignature = crypto_1.default
        .createHmac("sha256", secret)
        .update(JSON.stringify(req.body))
        .digest("hex");
    if (signature !== expectedSignature) {
        return res.status(400).json({ success: false, error: "Invalid webhook signature" });
    }
    const { event, payload } = req.body;
    if (event === "order.paid") {
        const orderId = payload.order.entity.id;
        // 1. Get order details from our DB
        const { data: orderData, error: orderError } = await supabase_1.supabase
            .from("orders")
            .select("*, plan:plan_id(*)")
            .eq("order_id", orderId)
            .single();
        if (orderError || !orderData) {
            console.error("Webhook: Order not found", orderId);
            return res.status(404).json({ success: false });
        }
        // 2. Idempotency check
        if (orderData.status === "paid") {
            return res.json({ success: true, message: "Already processed" });
        }
        // 3. Add credits
        const planCredits = orderData.plan?.credits;
        if (planCredits) {
            await supabase_1.supabase.rpc("increment_credits", {
                user_clerk_id: orderData.clerk_id,
                credits_to_add: planCredits,
            });
            // 4. Update status
            await supabase_1.supabase
                .from("orders")
                .update({ status: "paid" })
                .eq("order_id", orderId);
            console.log(`✅ Webhook: Credited ${planCredits} to user ${orderData.clerk_id}`);
        }
    }
    res.json({ status: "ok" });
};
exports.paymentWebhook = paymentWebhook;
