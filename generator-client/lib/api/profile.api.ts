// lib/api/profile.api.ts
// API functions for the profile domain.

import { createApiClient } from "./client";

export interface ProfileData {
  id: string;
  clerkId: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  plan: string;
  subscriptionStatus: string | null;
  creditsLeft: number;
  joinedAt: string;
}

export function profileApi(getToken: () => Promise<string | null>) {
  const client = createApiClient(getToken);

  return {
    /** GET /profile/me — current user's profile */
    getMyProfile: () =>
      client.get<{ data: ProfileData }>("/profile/me").then((r) => r.data),
  };
}
