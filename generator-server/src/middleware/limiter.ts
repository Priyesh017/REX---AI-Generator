import rateLimit from "express-rate-limit";

// General limiter for all API routes
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: {
    error: "Too many requests from this IP, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for image generation (protects your Hugging Face credits)
export const generationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 generations per hour
  message: {
    error: "Generation limit reached. Please try again in an hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
