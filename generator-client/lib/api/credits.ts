// lib/api/credits.ts
// Lightweight credit refresh utility for the navbar.
// Uses the new /api/profile/me endpoint and correct response shape.

import { createApiClient } from "./client";
import type { ProfileData } from "@/types/profile";

export function creditsApi(getToken: () => Promise<string | null>) {
  const client = createApiClient(getToken);
  return {
    getCredits: () =>
      client
        .get<{ data: ProfileData }>("/profile/me")
        .then((r) => r.data.creditsLeft),
  };
}
