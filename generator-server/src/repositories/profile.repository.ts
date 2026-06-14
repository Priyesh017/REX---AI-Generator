// src/repositories/profile.repository.ts
// Owns ALL database access for the profiles / users domain.
// Services call these functions — nothing else touches the DB for profile data.

import { supabase } from "../config/supabase";
import { clerkClient } from "../config/clerk";
import { logger } from "../utils/logger";

export interface UserRecord {
  id: string; // Internal UUID
  clerk_id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  credits: number;
  current_plan: string;
  subscription_status: string | null;
  role: "user" | "moderator" | "admin" | "banned";
  created_at: string;
}

export interface CreateProfilePayload {
  clerkId: string;
  username: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
}

export interface UpdateProfilePayload {
  credits?: number;
  current_plan?: string;
  username?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
}

/**
 * Find a profile by their Clerk ID.
 * Returns null if not found (does not throw).
 */
export async function findByClerkId(
  clerkId: string
): Promise<UserRecord | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, clerk_id, username, display_name, bio, avatar_url, credits, current_plan, subscription_status, role, created_at"
    )
    .eq("clerk_id", clerkId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`DB error in findByClerkId: ${error.message}`);
  }

  return data as UserRecord;
}

/**
 * Find a profile by their username.
 * Returns null if not found (does not throw).
 */
export async function findByUsername(
  username: string
): Promise<UserRecord | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, clerk_id, username, display_name, bio, avatar_url, credits, current_plan, subscription_status, role, created_at"
    )
    .eq("username", username)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`DB error in findByUsername: ${error.message}`);
  }

  return data as UserRecord;
}

/**
 * Create a new profile record with default values.
 * Note: Caller should ensure profile doesn't exist, or handle unique constraint error.
 */
export async function create(
  payload: CreateProfilePayload
): Promise<UserRecord> {
  const { data, error } = await supabase
    .from("profiles")
    .insert([
      {
        clerk_id: payload.clerkId,
        username: payload.username,
        display_name: payload.displayName,
        avatar_url: payload.avatarUrl ?? null,
        credits: 5,
        current_plan: "free",
        role: "user",
      },
    ])
    .select(
      "id, clerk_id, username, display_name, bio, avatar_url, credits, current_plan, subscription_status, role, created_at"
    )
    .single();

  if (error) {
    throw new Error(`DB error in create profile: ${error.message}`);
  }

  return data as UserRecord;
}

/**
 * Update credits and/or profile data.
 */
export async function updateByClerkId(
  clerkId: string,
  payload: UpdateProfilePayload
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("clerk_id", clerkId);

  if (error) {
    throw new Error(`DB error in updateByClerkId: ${error.message}`);
  }
}

/**
 * Safely reserve a generation credit atomically.
 * Returns true if successful, false if insufficient credits.
 */
export async function reserveCredit(clerkId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("reserve_generation_credit", {
    user_clerk_id: clerkId,
  });

  if (error) {
    throw new Error(`DB error in reserveCredit: ${error.message}`);
  }

  return data === true;
}

/**
 * Refund a credit if generation fails.
 */
export async function refundCredit(clerkId: string): Promise<void> {
  const { error } = await supabase.rpc("refund_generation_credit", {
    user_clerk_id: clerkId,
  });

  if (error) {
    logger.error({ error }, `Failed to refund credit for ${clerkId}:`);
  }
}

/**
 * Resolve Clerk user details and ensure a local profile record exists.
 */
export async function resolveOrProvisionUser(
  clerkId: string
): Promise<UserRecord> {
  const existing = await findByClerkId(clerkId);
  if (existing) return existing;

  const clerkUser = await clerkClient.users.getUser(clerkId);
  
  const username = 
    clerkUser.username || 
    clerkUser.emailAddresses[0]?.emailAddress.split('@')[0] || 
    `user_${Math.random().toString(36).substring(7)}`;
    
  const displayName =
    `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() ||
    username;

  return create({
    clerkId,
    username,
    displayName,
    avatarUrl: clerkUser.imageUrl,
  });
}
