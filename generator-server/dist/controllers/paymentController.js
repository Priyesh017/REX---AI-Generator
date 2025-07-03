"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrder = void 0;
const razorpay_1 = require("../config/razorpay");
const getUserIdFromToken_1 = require("../lib/getUserIdFromToken");
const supabase_1 = require("../config/supabase");
const createOrder = async (req, res) => {
    try {
        const userId = await (0, getUserIdFromToken_1.getUserIdFromToken)(req.headers.authorization);
        const { amount } = req.body;
        const options = {
            amount: amount * 100, // convert to paisa
            currency: "INR",
            receipt: `receipt_order_${Date.now()}`,
        };
        const order = await razorpay_1.razorpay.orders.create(options);
        // Optional: Store order in DB
        await supabase_1.supabase.from("transactions").insert([
            {
                user_id: userId,
                razorpay_order_id: order.id,
                amount: order.amount,
                status: "created",
            },
        ]);
        res.status(200).json({ orderId: order.id });
    }
    catch (err) {
        console.error("Create Razorpay order error:", err);
        res.status(500).json({ error: "Payment creation failed" });
    }
};
exports.createOrder = createOrder;
