import { supabase } from "../config/supabase";
import { encodeCursor, decodeCursor } from "../utils/cursor";

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

export async function listComments(postId: string, limit: number, cursor?: string) {
  let query = supabase
    .from("comments")
    .select(`
      *,
      author:profiles(username, display_name, avatar_url)
    `)
    .eq("post_id", postId)
    .eq("status", "visible");

  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (decoded) {
      // Ascending keyset condition: created_at > cursor.createdAt or (created_at = cursor.createdAt and id > cursor.id)
      query = query.or(`created_at.gt.${decoded.createdAt},and(created_at.eq.${decoded.createdAt},id.gt.${decoded.id})`);
    }
  }

  const { data, error } = await query
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(limit + 1);

  if (error) throw new Error(`DB error in listComments: ${error.message}`);

  const rawComments = data || [];
  const hasMore = rawComments.length > limit;
  const slicedComments = hasMore ? rawComments.slice(0, limit) : rawComments;

  let nextCursor: string | null = null;
  if (hasMore && slicedComments.length > 0) {
    const lastItem = slicedComments[slicedComments.length - 1];
    nextCursor = encodeCursor({
      createdAt: lastItem.created_at,
      id: lastItem.id,
    });
  }

  return {
    comments: slicedComments,
    pagination: {
      nextCursor,
      hasMore,
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
