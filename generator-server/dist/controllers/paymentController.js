"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentWebhook = exports.paymentSuccess = exports.createOrder = void 0;
const paymentService = __importStar(require("../services/payment.service"));
const response_1 = require("../lib/response");
const errors_1 = require("../lib/errors");
const createOrder = async (req, res, next) => {
    try {
        const { planId } = req.body;
        const order = await paymentService.createPlanOrder(req.userId, planId);
        (0, response_1.sendSuccess)(res, order, 201);
    }
    catch (err) {
        next(err);
    }
};
exports.createOrder = createOrder;
const paymentSuccess = async (req, res, next) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
        const result = await paymentService.processPaymentSuccess(req.userId, razorpay_payment_id, razorpay_order_id, razorpay_signature);
        (0, response_1.sendSuccess)(res, result);
    }
    catch (err) {
        next(err);
    }
};
exports.paymentSuccess = paymentSuccess;
const paymentWebhook = async (req, res, next) => {
    try {
        const signature = req.headers["x-razorpay-signature"];
        const rawBody = req.rawBody; // Extended property on Request interface
        if (!signature || !rawBody) {
            throw new errors_1.ValidationError("Webhook signature or raw body missing");
        }
        const result = await paymentService.processWebhook(signature, rawBody, req.body);
        (0, response_1.sendSuccess)(res, result);
    }
    catch (err) {
        next(err);
    }
};
exports.paymentWebhook = paymentWebhook;
