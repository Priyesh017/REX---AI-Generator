// src/lib/env.ts
import dotenv from "dotenv";
import { z } from "zod";

// Load .env file before validation
dotenv.config();

// Define schema for all required env vars
const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_KEY: z.string().min(1),
  HUGGINGFACE_MODEL: z.string(),
  HUGGINGFACE_TOKEN: z.string().startsWith("hf_"),
  CLERK_SECRET_KEY: z.string().startsWith("sk_"),
  PORT: z.string().optional(), // optional string, will convert to number below
  // RAZORPAY_KEY_ID: z.string().min(1),
  // RAZORPAY_KEY_SECRET: z.string().min(1),
});

// Parse and validate environment variables
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "❌ Invalid or missing environment variables:",
    parsed.error.format()
  );
  throw new Error("Environment validation failed");
}

const raw = parsed.data;

// Export as a normalized config object
export const env = {
  supabaseUrl: raw.SUPABASE_URL,
  supabaseKey: raw.SUPABASE_KEY,
  huggingfaceModel: raw.HUGGINGFACE_MODEL,
  huggingfaceToken: raw.HUGGINGFACE_TOKEN,
  clerkSecretKey: raw.CLERK_SECRET_KEY,
  port: Number(raw.PORT || 5001),
  // razorpayKeyId: raw.RAZORPAY_KEY_ID,
  // razorpayKeySecret: raw.RAZORPAY_KEY_SECRET,
};
