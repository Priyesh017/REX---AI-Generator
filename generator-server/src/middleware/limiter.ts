import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";

// General limiter for all API routes
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per window (increased for admin polling)
  message: {
    error: "Too many requests from this IP, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for image generation (protects Hugging Face credits)
export const generationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each user to 10 generations per hour (spec requirement)
  keyGenerator: (req) => req.userId || req.ip || "",
  message: {
    error: "Generation limit reached. Please try again in an hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Soft throttling for image generation to deter programmatic spam
export const generationSpeedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 5, // Allow 5 requests per 15 minutes, then...
  delayMs: (hits) => (hits - 5) * 1000, // Add 1s delay per request over 5
  keyGenerator: (req) => req.userId || req.ip || "",
});

// Soft throttling for comments to deter spam bots
export const commentSpeedLimiter = slowDown({
  windowMs: 5 * 60 * 1000, // 5 minutes
  delayAfter: 3, // Allow 3 requests per 5 minutes, then...
  delayMs: (hits) => (hits - 3) * 500, // Add 500ms delay per request over 3
  keyGenerator: (req) => req.userId || req.ip || "",
});
