import { createClerkClient } from "@clerk/backend";
import { env } from "./env";

export const clerkClient = createClerkClient({
    secretKey: env.clerkSecretKey,
});
