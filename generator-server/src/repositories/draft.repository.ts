// src/repositories/draft.repository.ts
// Owns ALL database access for draft assets (the "images" table today).
// These are PRIVATE studio assets — separate from published posts.
//
// Terminology shift: "history" → "drafts/studio assets"
// The table is still "images" in DB — this repository hides that.
// Future: rename table to "draft_assets" or "generated_images" in a migration.

import { supabase } from "../config/supabase";

export interface DraftAsset {
  id: string;
  user_id: string; // clerk_id — current schema; future: profile UUID FK
  title: string | null;
  prompt: string;
  image_url: string;
  created_at: string;
}

export interface CreateDraftPayload {
  clerkId: string;
  title: string | null;
  prompt: string;
  imageUrl: string;
}

export interface DraftListResult {
  assets: DraftAsset[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
  };
}

/**
 * List draft assets for a user with OFFSET pagination.
 * TODO (migration): Replace with keyset cursor pagination when moving to social feed.
 */
export async function listByClerkId(
  clerkId: string,
  page: number,
  limit: number
): Promise<DraftListResult> {
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from("images")
    .select("id, user_id, title, prompt, image_url, created_at", {
      count: "exact",
    })
    .eq("user_id", clerkId)
    .range(offset, offset + limit - 1)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`DB error in listByClerkId: ${error.message}`);
  }

  const total = count ?? 0;

  return {
    assets: (data ?? []) as DraftAsset[],
    pagination: {
      page,
      limit,
      total,
      hasNext: offset + (data?.length ?? 0) < total,
    },
  };
}

/**
 * Find a single draft asset by ID.
 * Returns null if not found.
 */
export async function findById(id: string): Promise<DraftAsset | null> {
  const { data, error } = await supabase
    .from("images")
    .select("id, user_id, title, prompt, image_url, created_at")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`DB error in findById: ${error.message}`);
  }

  return data as DraftAsset;
}

/**
 * Create a new draft asset record.
 */
export async function create(payload: CreateDraftPayload): Promise<DraftAsset> {
  const { data, error } = await supabase
    .from("images")
    .insert([
      {
        user_id: payload.clerkId,
        title: payload.title,
        prompt: payload.prompt,
        image_url: payload.imageUrl,
      },
    ])
    .select("id, user_id, title, prompt, image_url, created_at")
    .single();

  if (error) {
    throw new Error(`DB error in create: ${error.message}`);
  }

  return data as DraftAsset;
}

/**
 * Delete a draft asset — only if it belongs to the specified user.
 * Returns true if deleted, false if not found / not owned.
 */
export async function deleteOwned(
  id: string,
  clerkId: string
): Promise<boolean> {
  const { error, count } = await supabase
    .from("images")
    .delete()
    .match({ id, user_id: clerkId });

  if (error) {
    throw new Error(`DB error in deleteOwned: ${error.message}`);
  }

  return (count ?? 0) > 0;
}
