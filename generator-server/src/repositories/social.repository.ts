// src/repositories/social.repository.ts
import { supabase } from "../config/supabase";

// --- LIKES ---

export async function likePost(postId: string, profileId: string): Promise<boolean> {
  const { error } = await supabase
    .from("post_likes")
    .insert([{ post_id: postId, profile_id: profileId }]);

  if (error && error.code !== "23505") { // Ignore unique violation (already liked)
    throw new Error(`DB error in likePost: ${error.message}`);
  }
  return true;
}

export async function unlikePost(postId: string, profileId: string): Promise<boolean> {
  const { error, count } = await supabase
    .from("post_likes")
    .delete({ count: "exact" })
    .match({ post_id: postId, profile_id: profileId });

  if (error) {
    throw new Error(`DB error in unlikePost: ${error.message}`);
  }
  return true;
}

export async function getPostLikesCount(postId: string): Promise<number> {
  const { count, error } = await supabase
    .from("post_likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId);

  if (error) throw new Error(`DB error in getPostLikesCount: ${error.message}`);
  return count ?? 0;
}

export async function hasLikedPost(postId: string, profileId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("post_likes")
    .select("post_id")
    .match({ post_id: postId, profile_id: profileId })
    .maybeSingle();

  if (error) throw new Error(`DB error in hasLikedPost: ${error.message}`);
  return !!data;
}

// --- FOLLOWS ---

export async function followUser(followerId: string, followingId: string): Promise<boolean> {
  const { error } = await supabase
    .from("follows")
    .insert([{ follower_profile_id: followerId, following_profile_id: followingId }]);

  if (error && error.code !== "23505") {
    throw new Error(`DB error in followUser: ${error.message}`);
  }
  return true;
}

export async function unfollowUser(followerId: string, followingId: string): Promise<boolean> {
  const { error } = await supabase
    .from("follows")
    .delete()
    .match({ follower_profile_id: followerId, following_profile_id: followingId });

  if (error) {
    throw new Error(`DB error in unfollowUser: ${error.message}`);
  }
  return true;
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("follows")
    .select("follower_profile_id")
    .match({ follower_profile_id: followerId, following_profile_id: followingId })
    .maybeSingle();

  if (error) throw new Error(`DB error in isFollowing: ${error.message}`);
  return !!data;
}

export async function getFollowCounts(profileId: string): Promise<{ followers: number; following: number }> {
  const [followersRes, followingRes] = await Promise.all([
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_profile_id", profileId),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_profile_id", profileId)
  ]);

  if (followersRes.error) throw new Error(`DB error getting followers count: ${followersRes.error.message}`);
  if (followingRes.error) throw new Error(`DB error getting following count: ${followingRes.error.message}`);

  return {
    followers: followersRes.count ?? 0,
    following: followingRes.count ?? 0
  };
}

// --- COMMENTS ---

export interface CreateCommentPayload {
  postId: string;
  authorProfileId: string;
  body: string;
  parentCommentId?: string;
}

export async function createComment(payload: CreateCommentPayload) {
  const { data, error } = await supabase
    .from("comments")
    .insert([{
      post_id: payload.postId,
      author_profile_id: payload.authorProfileId,
      body: payload.body,
      parent_comment_id: payload.parentCommentId || null
    }])
    .select(`
      *,
      author:profiles(username, display_name, avatar_url)
    `)
    .single();

  if (error) throw new Error(`DB error in createComment: ${error.message}`);
  return data;
}

export async function listComments(postId: string, page: number, limit: number) {
  const offset = (page - 1) * limit;
  const { data, error, count } = await supabase
    .from("comments")
    .select(`
      *,
      author:profiles(username, display_name, avatar_url)
    `, { count: "exact" })
    .eq("post_id", postId)
    .eq("status", "visible")
    .order("created_at", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(`DB error in listComments: ${error.message}`);

  return {
    comments: data ?? [],
    pagination: {
      page,
      limit,
      total: count ?? 0,
      hasNext: offset + (data?.length ?? 0) < (count ?? 0)
    }
  };
}

export async function deleteComment(commentId: string, profileId: string) {
  const { error, count } = await supabase
    .from("comments")
    .delete({ count: "exact" })
    .match({ id: commentId, author_profile_id: profileId });

  if (error) throw new Error(`DB error in deleteComment: ${error.message}`);
  return (count ?? 0) > 0;
}
