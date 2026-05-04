// lib/api/profile.api.ts
// API functions for the profile domain.

import { createApiClient } from "./client";

export interface ProfileData {
  clerkId: string;
  displayName: string;
  email: string;
  phoneNumber: string;
  avatarUrl: string | null;
  plan: string;
  subscriptionStatus: string | null;
  creditsLeft: number;
  joinedAt: string;
}

export function profileApi(getToken: () => Promise<string | null>) {
  const client = createApiClient(getToken);

  return {
    /** GET /api/profile/me — current user's profile */
    getMyProfile: () =>
      client.get<{ data: ProfileData }>("/api/profile/me").then((r) => r.data),
  };
}
