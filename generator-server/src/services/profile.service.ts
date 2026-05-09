// src/services/profile.service.ts
// Business logic for the profile domain.
// Controllers call these — services call repositories and other services.
// No direct DB access here.

import * as profileRepo from "../repositories/profile.repository";
import { NotFoundError } from "../lib/errors";

export interface ProfileDTO {
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

/**
 * Get current authenticated user's profile.
 * Creates the profile record lazily if first visit.
 */
export async function getCurrentProfile(clerkId: string): Promise<ProfileDTO> {
  const user = await profileRepo.resolveOrProvisionUser(clerkId);

  return toDTO(user);
}

/**
 * Find a profile by Clerk ID — throws if not found.
 * Used for operations that require an existing profile.
 */
export async function getProfileOrThrow(clerkId: string): Promise<ProfileDTO> {
  const user = await profileRepo.findByClerkId(clerkId);
  if (!user) {
    throw new NotFoundError("Profile not found");
  }
  return toDTO(user);
}

// ── Internal ─────────────────────────────────────────────────────────────────

function toDTO(user: profileRepo.UserRecord): ProfileDTO {
  return {
    id: user.id,
    clerkId: user.clerk_id,
    username: user.username ?? "user",
    displayName: user.display_name ?? "Unknown",
    bio: user.bio,
    avatarUrl: user.avatar_url,
    plan: user.current_plan ?? "free",
    subscriptionStatus: user.subscription_status,
    creditsLeft: user.credits ?? 0,
    joinedAt: user.created_at,
  };
}
