"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
// src/lib/env.ts
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
// Load .env file before validation
dotenv_1.default.config();
// Define schema for all required env vars
const envSchema = zod_1.z.object({
    SUPABASE_URL: zod_1.z.string().url(),
    SUPABASE_KEY: zod_1.z.string().min(1),
    HUGGINGFACE_MODEL: zod_1.z.string(),
    HUGGINGFACE_TOKEN: zod_1.z.string().startsWith("hf_"),
    CLERK_SECRET_KEY: zod_1.z.string().startsWith("sk_"),
    PORT: zod_1.z.string().optional(), // optional string, will convert to number below
    // RAZORPAY_KEY_ID: z.string().min(1),
    // RAZORPAY_KEY_SECRET: z.string().min(1),
});
// Parse and validate environment variables
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error("❌ Invalid or missing environment variables:", parsed.error.format());
    throw new Error("Environment validation failed");
}
const raw = parsed.data;
// Export as a normalized config object
exports.env = {
    supabaseUrl: raw.SUPABASE_URL,
    supabaseKey: raw.SUPABASE_KEY,
    huggingfaceModel: raw.HUGGINGFACE_MODEL,
    huggingfaceToken: raw.HUGGINGFACE_TOKEN,
    clerkSecretKey: raw.CLERK_SECRET_KEY,
    port: Number(raw.PORT || 5001),
    // razorpayKeyId: raw.RAZORPAY_KEY_ID,
    // razorpayKeySecret: raw.RAZORPAY_KEY_SECRET,
};
