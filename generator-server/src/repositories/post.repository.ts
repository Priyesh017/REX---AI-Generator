// src/repositories/post.repository.ts
// Handles DB operations for published posts using the normalized social schema.

import { supabase } from "../config/supabase";

export interface PostRecord {
  id: string;
  author_profile_id: string;
  generated_asset_id: string;
  caption: string | null;
  visibility: string;
  created_at: string;
  // Flattened for service/frontend use
  image_url?: string;
  prompt?: string;
  title?: string;
  author?: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

export interface CreatePostPayload {
  authorProfileId: string;
  generatedAssetId: string;
  caption?: string;
  visibility?: "public" | "private" | "unlisted";
}

export interface ListPostsResult {
  posts: PostRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
  };
}

export async function create(payload: CreatePostPayload): Promise<PostRecord> {
  const { data, error } = await supabase
    .from("posts")
    .insert([
      {
        author_profile_id: payload.authorProfileId,
        generated_asset_id: payload.generatedAssetId,
        caption: payload.caption || null,
        visibility: payload.visibility || "public",
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`DB error in post create: ${error.message}`);
  }

  return data as PostRecord;
}

export async function findById(id: string): Promise<PostRecord | null> {
  // 1. Fetch post and asset
  const { data: post, error } = await supabase
    .from("posts")
    .select(`
      *,
      asset:generated_assets!inner(image_url, prompt, title)
    `)
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`DB error in post findById: ${error.message}`);
  }

  // 2. Fetch author profile
  const { data: author } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url")
    .eq("id", post.author_profile_id)
    .single();

  return formatPost({ ...post, author });
}

export async function listPublic(
  page: number,
  limit: number,
  username?: string
): Promise<ListPostsResult> {
  const offset = (page - 1) * limit;

  // 1. Resolve author profile ID if username is provided
  let filterProfileId: string | null = null;
  if (username) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .single();
    
    if (!profile) {
      return {
        posts: [],
        pagination: { page, limit, total: 0, hasNext: false },
      };
    }
    filterProfileId = profile.id;
  }

  // 2. Fetch posts and assets
  let query = supabase
    .from("posts")
    .select(`
      *,
      asset:generated_assets!inner(image_url, prompt, title)
    `, { count: "exact" });

  if (filterProfileId) {
    query = query.eq("author_profile_id", filterProfileId);
  }

  const { data: postsData, error, count } = await query
    .eq("visibility", "public")
    .range(offset, offset + limit - 1)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`DB error in post listPublic: ${error.message}`);
  }

  // 3. Batch fetch author profiles for the returned posts
  const authorIds = [...new Set((postsData ?? []).map((p) => p.author_profile_id))];
  const { data: authorsData } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", authorIds);

  const authorMap = new Map((authorsData ?? []).map((a) => [a.id, a]));

  const total = count ?? 0;
  const posts = (postsData ?? []).map((p) =>
    formatPost({
      ...p,
      author: authorMap.get(p.author_profile_id),
    })
  );

  return {
    posts,
    pagination: {
      page,
      limit,
      total,
      hasNext: offset + (postsData?.length ?? 0) < total,
    },
  };
}

export async function deleteOwned(id: string, profileId: string): Promise<boolean> {
  const { error, count } = await supabase
    .from("posts")
    .delete()
    .match({ id, author_profile_id: profileId });

  if (error) {
    throw new Error(`DB error in post deleteOwned: ${error.message}`);
  }

  return (count ?? 0) > 0;
}

/**
 * Helper to flatten the nested Join result into a clean PostRecord.
 */
function formatPost(raw: any): PostRecord {
  return {
    id: raw.id,
    author_profile_id: raw.author_profile_id,
    generated_asset_id: raw.generated_asset_id,
    caption: raw.caption,
    visibility: raw.visibility,
    created_at: raw.created_at,
    image_url: raw.asset?.image_url,
    prompt: raw.asset?.prompt,
    title: raw.asset?.title,
    author: raw.author ? {
      username: raw.author.username,
      display_name: raw.author.display_name,
      avatar_url: raw.author.avatar_url,
    } : undefined,
  };
}
