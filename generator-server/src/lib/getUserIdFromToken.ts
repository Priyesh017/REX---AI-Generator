import { verifyToken } from "@clerk/backend";
import { env } from "../config/env";
import { logger } from "../utils/logger";

export const getUserIdFromToken = async (
  authHeader?: string
): Promise<string> => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing or malformed Authorization header");
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = await verifyToken(token, {
      secretKey: env.clerkSecretKey!,
    });

    if (!payload.sub) {
      throw new Error("User ID not found in token payload");
    }

    return payload.sub;
  } catch (err) {
    logger.error({ err }, "Token verification failed:");
    throw new Error("Invalid or expired token");
  }
};
