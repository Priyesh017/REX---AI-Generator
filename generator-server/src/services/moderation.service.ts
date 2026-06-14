// src/services/moderation.service.ts
import * as moderationRepo from "../repositories/moderation.repository";
import { supabase } from "../config/supabase";
import { ConflictError, NotFoundError, AppError } from "../lib/errors";

export async function reportPost(
  reporterProfileId: string,
  postId: string,
  reason: string
) {
  // Check if post exists
  const { data: post } = await supabase
    .from("posts")
    .select("id")
    .eq("id", postId)
    .maybeSingle();
  if (!post) throw new NotFoundError("Post not found");

  const alreadyReported = await moderationRepo.hasReported(reporterProfileId, { postId });
  if (alreadyReported) {
    throw new ConflictError("You have already reported this post");
  }

  return moderationRepo.createReport({
    reporterProfileId,
    postId,
    reason,
  });
}

export async function reportComment(
  reporterProfileId: string,
  commentId: string,
  reason: string
) {
  // Check if comment exists
  const { data: comment } = await supabase
    .from("comments")
    .select("id")
    .eq("id", commentId)
    .maybeSingle();
  if (!comment) throw new NotFoundError("Comment not found");

  const alreadyReported = await moderationRepo.hasReported(reporterProfileId, { commentId });
  if (alreadyReported) {
    throw new ConflictError("You have already reported this comment");
  }

  return moderationRepo.createReport({
    reporterProfileId,
    commentId,
    reason,
  });
}

export async function moderatePost(
  moderatorProfileId: string,
  postId: string,
  action: "remove_post" | "approve_post",
  moderatorNote?: string
) {
  const { data: post } = await supabase
    .from("posts")
    .select("id, author_profile_id")
    .eq("id", postId)
    .single();

  if (!post) throw new NotFoundError("Post not found");

  const visibility = action === "remove_post" ? "hidden" : "public";

  const { error } = await supabase
    .from("posts")
    .update({ visibility })
    .eq("id", postId);

  if (error) throw new AppError(`DB error: ${error.message}`, 500, "INTERNAL_ERROR");

  // Log moderator action
  await moderationRepo.createAuditLog({
    moderatorProfileId,
    action,
    targetType: "post",
    targetId: postId,
    details: { note: moderatorNote || "Moderated post status" },
  });

  return { success: true, visibility };
}

export async function moderateComment(
  moderatorProfileId: string,
  commentId: string,
  action: "remove_comment" | "approve_comment",
  moderatorNote?: string
) {
  const { data: comment } = await supabase
    .from("comments")
    .select("id")
    .eq("id", commentId)
    .single();

  if (!comment) throw new NotFoundError("Comment not found");

  const status = action === "remove_comment" ? "hidden" : "visible";

  const { error } = await supabase
    .from("comments")
    .update({ status })
    .eq("id", commentId);

  if (error) throw new AppError(`DB error: ${error.message}`, 500, "INTERNAL_ERROR");

  // Log moderator action
  await moderationRepo.createAuditLog({
    moderatorProfileId,
    action: action === "remove_comment" ? "remove_post" : "approve_post", // map to allowed enum action in DB
    targetType: "comment",
    targetId: commentId,
    details: { note: moderatorNote || "Moderated comment status" },
  });

  return { success: true, status };
}

export async function banUser(
  moderatorProfileId: string,
  targetProfileId: string,
  banReason: string
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", targetProfileId)
    .single();

  if (!profile) throw new NotFoundError("Profile not found");

  const { error } = await supabase
    .from("profiles")
    .update({ role: "banned" })
    .eq("id", targetProfileId);

  if (error) throw new AppError(`DB error: ${error.message}`, 500, "INTERNAL_ERROR");

  // Log ban action
  await moderationRepo.createAuditLog({
    moderatorProfileId,
    action: "ban_user",
    targetType: "profile",
    targetId: targetProfileId,
    details: { reason: banReason },
  });

  return { success: true, role: "banned" };
}
