"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubscriptionPlans = void 0;
const supabase_1 = require("../config/supabase");
const getSubscriptionPlans = async (req, res) => {
    try {
        const { data: plans, error } = await supabase_1.supabase.from("plans").select("*");
        if (error) {
            console.error("Error fetching plans:", error.message);
            return res.status(500).json({
                success: false,
                error: "Failed to fetch subscription plans.",
            });
        }
        res.status(200).json({
            success: true,
            plans,
        });
    }
    catch (err) {
        console.error("Unexpected error:", err.message);
        res.status(500).json({
            success: false,
            error: "Something went wrong while fetching plans.",
        });
    }
};
exports.getSubscriptionPlans = getSubscriptionPlans;
