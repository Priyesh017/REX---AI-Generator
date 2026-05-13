// lib/api/profile.api.ts
// API functions for the profile domain.

import { createApiClient } from "./client";
import type { ProfileData } from "@/types/profile";

export type { ProfileData } from "@/types/profile";

export function profileApi(getToken: () => Promise<string | null>) {
  const client = createApiClient(getToken);

  return {
    /** GET /profile/me — current user's profile */
    getMyProfile: () =>
      client.get<{ data: ProfileData }>("/profile/me").then((r) => r.data),
  };
}
