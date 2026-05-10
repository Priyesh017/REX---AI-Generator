"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubscriptionPlans = void 0;
const supabase_1 = require("../config/supabase");
const response_1 = require("../lib/response");
const errors_1 = require("../lib/errors");
const getSubscriptionPlans = async (req, res) => {
    const { data: plans, error } = await supabase_1.supabase.from("plans").select("*");
    if (error) {
        throw new errors_1.AppError("Failed to fetch subscription plans.", 500, "INTERNAL_ERROR");
    }
    (0, response_1.sendSuccess)(res, plans);
};
exports.getSubscriptionPlans = getSubscriptionPlans;
