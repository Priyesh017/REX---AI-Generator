// src/repositories/profile.repository.ts
// Owns ALL database access for the profiles / users domain.
// Services call these functions — nothing else touches the DB for profile data.
//
// NOTE: The current DB table is named "users" with clerk_id as the identifier.
// This repository abstracts that detail. Future migration will rename to "profiles"
// and add an internal UUID, but all callers will be unaffected.

import { supabase } from "../config/supabase";
import { clerkClient } from "../config/clerk";

export interface UserRecord {
  clerk_id: string;
  name: string | null;
  email: string | null;
  phone_number: string | null;
  user_image_url: string | null;
  credits: number;
  current_plan: string;
  subscription_status: string | null;
  created_at: string;
}

export interface CreateUserPayload {
  clerkId: string;
  name: string;
  email: string;
  phoneNumber?: string;
  imageUrl?: string;
}

export interface UpdateUserPayload {
  credits?: number;
  current_plan?: string;
}

/**
 * Find a user by their Clerk ID.
 * Returns null if not found (does not throw).
 */
export async function findByClerkId(
  clerkId: string
): Promise<UserRecord | null> {
  const { data, error } = await supabase
    .from("users")
    .select(
      "clerk_id, name, email, phone_number, user_image_url, credits, current_plan, subscription_status, created_at"
    )
    .eq("clerk_id", clerkId)
    .single();

  if (error) {
    // PGRST116 = row not found — not an error for our purposes
    if (error.code === "PGRST116") return null;
    throw new Error(`DB error in findByClerkId: ${error.message}`);
  }

  return data as UserRecord;
}

/**
 * Create a new user record with default free-tier values.
 * Idempotent: if user already exists, returns the existing record.
 */
export async function findOrCreate(
  payload: CreateUserPayload
): Promise<UserRecord> {
  // Try to find first
  const existing = await findByClerkId(payload.clerkId);
  if (existing) return existing;

  const { data, error } = await supabase
    .from("users")
    .insert([
      {
        clerk_id: payload.clerkId,
        name: payload.name,
        email: payload.email,
        phone_number: payload.phoneNumber ?? "Not provided",
        user_image_url: payload.imageUrl ?? null,
        credits: 5,
        current_plan: "free",
      },
    ])
    .select(
      "clerk_id, name, email, phone_number, user_image_url, credits, current_plan, subscription_status, created_at"
    )
    .single();

  if (error) {
    throw new Error(`DB error in findOrCreate: ${error.message}`);
  }

  return data as UserRecord;
}

/**
 * Update credits and/or plan for a user.
 */
export async function updateByClerkId(
  clerkId: string,
  payload: UpdateUserPayload
): Promise<void> {
  const { error } = await supabase
    .from("users")
    .update(payload)
    .eq("clerk_id", clerkId);

  if (error) {
    throw new Error(`DB error in updateByClerkId: ${error.message}`);
  }
}

/**
 * Safely decrement credits by 1 only if credits > 0.
 * Returns the new credit value, or null if deduction was not possible.
 * Uses a conditional update to prevent race conditions.
 */
export async function decrementCredit(
  clerkId: string,
  currentCredits: number
): Promise<boolean> {
  const { error, count } = await supabase
    .from("users")
    .update({ credits: currentCredits - 1 })
    .eq("clerk_id", clerkId)
    .gt("credits", 0);

  if (error) {
    throw new Error(`DB error in decrementCredit: ${error.message}`);
  }

  return (count ?? 0) > 0;
}

/**
 * Resolve Clerk user details and ensure a local user record exists.
 * Used by requireAuth middleware after token verification.
 */
export async function resolveOrProvisionUser(
  clerkId: string
): Promise<UserRecord> {
  const existing = await findByClerkId(clerkId);
  if (existing) return existing;

  // First time: fetch Clerk details and create local record
  const clerkUser = await clerkClient.users.getUser(clerkId);
  const fullName =
    `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() ||
    "Unknown";
  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const phone =
    clerkUser.phoneNumbers[0]?.phoneNumber ?? "Not provided";
  const imageUrl = clerkUser.imageUrl ?? "";

  return findOrCreate({
    clerkId,
    name: fullName,
    email,
    phoneNumber: phone,
    imageUrl,
  });
}
