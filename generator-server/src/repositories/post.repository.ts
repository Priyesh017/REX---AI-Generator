// src/repositories/post.repository.ts
// Handles DB operations for published posts using the normalized social schema.

import { supabase } from "../config/supabase";
import { encodeCursor, decodeCursor } from "../utils/cursor";

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
    nextCursor: string | null;
    hasMore: boolean;
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
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      asset:generated_assets!inner(image_url, prompt, title),
      author:profiles(username, display_name, avatar_url)
    `)
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`DB error in post findById: ${error.message}`);
  }

  return formatPost(data);
}

export async function listPublic(
  limit: number,
  cursor?: string,
  username?: string
): Promise<ListPostsResult> {
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
        pagination: { nextCursor: null, hasMore: false },
      };
    }
    filterProfileId = profile.id;
  }

  // 2. Fetch posts and assets
  let query = supabase
    .from("posts")
    .select(`
      *,
      asset:generated_assets!inner(image_url, prompt, title),
      author:profiles(username, display_name, avatar_url)
    `);

  if (filterProfileId) {
    query = query.eq("author_profile_id", filterProfileId);
  }

  query = query.eq("visibility", "public");

  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (decoded) {
      query = query.or(`created_at.lt.${decoded.createdAt},and(created_at.eq.${decoded.createdAt},id.lt.${decoded.id})`);
    }
  }

  const { data: postsData, error } = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (error) {
    throw new Error(`DB error in post listPublic: ${error.message}`);
  }

  const rawPosts = postsData || [];
  const hasMore = rawPosts.length > limit;
  const slicedPosts = hasMore ? rawPosts.slice(0, limit) : rawPosts;
  const posts = slicedPosts.map((p) => formatPost(p));

  let nextCursor: string | null = null;
  if (hasMore && slicedPosts.length > 0) {
    const lastItem = slicedPosts[slicedPosts.length - 1];
    nextCursor = encodeCursor({
      createdAt: lastItem.created_at,
      id: lastItem.id,
    });
  }

  return {
    posts,
    pagination: {
      nextCursor,
      hasMore,
    },
  };
}

export async function deleteOwned(id: string, profileId: string): Promise<boolean> {
  const { error, count } = await supabase
    .from("posts")
    .delete({ count: "exact" })
    .match({ id, author_profile_id: profileId });

  if (error) {
    throw new Error(`DB error in post deleteOwned: ${error.message}`);
  }

  return (count ?? 0) > 0;
}

interface RawPostJoin {
  id: string;
  author_profile_id: string;
  generated_asset_id: string;
  caption: string | null;
  visibility: string;
  created_at: string;
  asset?: {
    image_url: string;
    prompt: string;
    title: string | null;
  } | null;
  author?: {
    username: string;
    display_name: string;
    avatar_url: string;
  } | null;
}

/**
 * Helper to flatten the nested Join result into a clean PostRecord.
 */
function formatPost(raw: RawPostJoin): PostRecord {
  return {
    id: raw.id,
    author_profile_id: raw.author_profile_id,
    generated_asset_id: raw.generated_asset_id,
    caption: raw.caption,
    visibility: raw.visibility,
    created_at: raw.created_at,
    image_url: raw.asset?.image_url,
    prompt: raw.asset?.prompt,
    title: raw.asset?.title ?? undefined,
    author: raw.author ? {
      username: raw.author.username,
      display_name: raw.author.display_name,
      avatar_url: raw.author.avatar_url,
    } : undefined,
  };
}
