// src/services/social.service.ts
import * as socialRepo from "../repositories/social.repository";
import * as profileRepo from "../repositories/profile.repository";
import * as postRepo from "../repositories/post.repository";
import { AppError, NotFoundError, ForbiddenError } from "../lib/errors";
import { containsRestrictedContent } from "../utils/moderation";
import * as notificationService from "./notification.service";

// --- LIKES ---

export async function toggleLike(clerkId: string, postId: string) {
  const profile = await profileRepo.findByClerkId(clerkId);
  if (!profile) throw new ForbiddenError("Profile not found");

  const post = await postRepo.findById(postId);
  if (!post) throw new NotFoundError("Post not found");

  const hasLiked = await socialRepo.hasLikedPost(postId, profile.id);
  
  if (hasLiked) {
    await socialRepo.unlikePost(postId, profile.id);
    return { liked: false };
  } else {
    await socialRepo.likePost(postId, profile.id);
    if (post.author_profile_id !== profile.id) {
      await notificationService.createNotification({
        recipientProfileId: post.author_profile_id,
        senderProfileId: profile.id,
        type: "like",
        postId: postId,
      });
    }
    return { liked: true };
  }
}

export async function getPostSocialMeta(postId: string, clerkId?: string) {
  const likes = await socialRepo.getPostLikesCount(postId);
  let hasLiked = false;

  if (clerkId) {
    const profile = await profileRepo.findByClerkId(clerkId);
    if (profile) {
      hasLiked = await socialRepo.hasLikedPost(postId, profile.id);
    }
  }

  return { likes, hasLiked };
}

// --- FOLLOWS ---

export async function toggleFollow(clerkId: string, targetUsername: string) {
  const followerProfile = await profileRepo.findByClerkId(clerkId);
  if (!followerProfile) throw new ForbiddenError("Profile not found");

  const targetProfile = await profileRepo.findByUsername(targetUsername);

  if (!targetProfile) throw new NotFoundError("User not found");

  if (followerProfile.id === targetProfile.id) {
    throw new AppError("You cannot follow yourself", 400, "BAD_REQUEST");
  }

  const isFollowing = await socialRepo.isFollowing(followerProfile.id, targetProfile.id);

  if (isFollowing) {
    await socialRepo.unfollowUser(followerProfile.id, targetProfile.id);
    return { following: false };
  } else {
    await socialRepo.followUser(followerProfile.id, targetProfile.id);
    await notificationService.createNotification({
      recipientProfileId: targetProfile.id,
      senderProfileId: followerProfile.id,
      type: "follow",
    });
    return { following: true };
  }
}

export async function getProfileSocialMeta(targetUsername: string, clerkId?: string) {
  const targetProfile = await profileRepo.findByUsername(targetUsername);

  if (!targetProfile) throw new NotFoundError("User not found");

  const counts = await socialRepo.getFollowCounts(targetProfile.id);
  let isFollowing = false;

  if (clerkId) {
    const profile = await profileRepo.findByClerkId(clerkId);
    if (profile) {
      isFollowing = await socialRepo.isFollowing(profile.id, targetProfile.id);
    }
  }

  return { ...counts, isFollowing };
}

// --- COMMENTS ---

export async function addComment(clerkId: string, postId: string, body: string, parentCommentId?: string) {
  const profile = await profileRepo.findByClerkId(clerkId);
  if (!profile) throw new ForbiddenError("Profile not found");

  const post = await postRepo.findById(postId);
  if (!post) throw new NotFoundError("Post not found");

  // Basic moderation
  if (containsRestrictedContent(body)) {
    throw new AppError("Content flagged by moderation filters.", 400, "BAD_REQUEST");
  }

  const comment = await socialRepo.createComment({
    postId,
    authorProfileId: profile.id,
    body,
    parentCommentId
  });

  if (post.author_profile_id !== profile.id) {
    await notificationService.createNotification({
      recipientProfileId: post.author_profile_id,
      senderProfileId: profile.id,
      type: "comment",
      postId: postId,
      commentId: comment.id,
    });
  }

  return comment;
}

export async function getComments(postId: string, limit: number, cursor?: string) {
  const post = await postRepo.findById(postId);
  if (!post) throw new NotFoundError("Post not found");

  return socialRepo.listComments(postId, limit, cursor);
}

export async function deleteComment(clerkId: string, commentId: string) {
  const profile = await profileRepo.findByClerkId(clerkId);
  if (!profile) throw new ForbiddenError("Profile not found");

  const success = await socialRepo.deleteComment(commentId, profile.id);
  if (!success) {
    throw new ForbiddenError("You can only delete your own comments or comment does not exist");
  }
}
