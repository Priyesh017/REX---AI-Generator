// src/repositories/draft.repository.ts
// Owns ALL database access for draft assets (the "generated_assets" table).

import { supabase } from "../config/supabase";

export interface DraftAsset {
  id: string;
  owner_profile_id: string;
  title: string | null;
  prompt: string;
  image_url: string;
  model_name: string | null;
  aspect_ratio: string | null;
  created_at: string;
}

export interface CreateDraftPayload {
  profileId: string; // Internal UUID
  title: string | null;
  prompt: string;
  imageUrl: string;
  modelName?: string;
  aspectRatio?: string;
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
 * List draft assets for a user by their Clerk ID.
 * Resolves the internal profile ID first for maximum reliability.
 */
export async function listByClerkId(
  clerkId: string,
  page: number,
  limit: number
): Promise<DraftListResult> {
  // 1. Resolve internal profile ID first
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_id", clerkId)
    .single();

  if (profileError || !profile) {
    return {
      assets: [],
      pagination: { page, limit, total: 0, hasNext: false },
    };
  }

  const offset = (page - 1) * limit;

  // 2. Query assets by owner_profile_id directly
  const { data, error, count } = await supabase
    .from("generated_assets")
    .select("*", {
      count: "exact",
    })
    .eq("owner_profile_id", profile.id)
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
 */
export async function findById(id: string): Promise<DraftAsset | null> {
  const { data, error } = await supabase
    .from("generated_assets")
    .select("*")
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
export async function create(payload: CreateDraftPayload, isPending: boolean = false): Promise<DraftAsset> {
  const { data, error } = await supabase
    .from("generated_assets")
    .insert([
      {
        owner_profile_id: payload.profileId,
        title: payload.title,
        prompt: payload.prompt,
        image_url: payload.imageUrl,
        model_name: payload.modelName || "stable-diffusion-xl",
        aspect_ratio: payload.aspectRatio || "1:1",
        generation_status: isPending ? "pending" : "completed",
      },
    ])
    .select("*")
    .single();

  if (error) {
    throw new Error(`DB error in create: ${error.message}`);
  }

  return data as DraftAsset;
}

/**
 * Update the result of a pending generation.
 */
export async function updateGenerationResult(id: string, imageUrl: string): Promise<void> {
  const { error } = await supabase
    .from("generated_assets")
    .update({ 
      image_url: imageUrl,
      generation_status: "completed"
    })
    .eq("id", id);

  if (error) {
    throw new Error(`DB error in updateGenerationResult: ${error.message}`);
  }
}

/**
 * Mark a generation as failed.
 */
export async function markFailed(id: string): Promise<void> {
  const { error } = await supabase
    .from("generated_assets")
    .update({ 
      generation_status: "failed"
    })
    .eq("id", id);

  if (error) {
    throw new Error(`DB error in markFailed: ${error.message}`);
  }
}

/**
 * Update the title of a draft asset.
 */
export async function updateTitle(id: string, title: string): Promise<void> {
  const { error } = await supabase
    .from("generated_assets")
    .update({ title })
    .eq("id", id);

  if (error) {
    throw new Error(`DB error in updateTitle: ${error.message}`);
  }
}

/**
 * Delete a draft asset.
 */
export async function deleteOwned(
  id: string,
  clerkId: string
): Promise<boolean> {
  // First verify ownership via join
  const { data: asset, error: fetchError } = await supabase
    .from("generated_assets")
    .select("id, profile:profiles!inner(clerk_id)")
    .eq("id", id)
    .eq("profile.clerk_id", clerkId)
    .single();

  if (fetchError || !asset) return false;

  const { error } = await supabase
    .from("generated_assets")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`DB error in deleteOwned: ${error.message}`);
  }

  return true;
}
