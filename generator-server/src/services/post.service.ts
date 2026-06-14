// src/services/post.service.ts
import * as postRepo from "../repositories/post.repository";
import * as draftRepo from "../repositories/draft.repository";
import * as profileRepo from "../repositories/profile.repository";
import { AppError, NotFoundError, ForbiddenError } from "../lib/errors";
import { containsRestrictedContent } from "../utils/moderation";

export async function createPostFromDraft(
  clerkId: string,
  draftId: string,
  title?: string,
  caption?: string
) {
  // 1. Resolve profile
  const profile = await profileRepo.findByClerkId(clerkId);
  if (!profile) throw new ForbiddenError("Profile not found");

  // 2. Verify draft exists and is owned by the user
  const draft = await draftRepo.findById(draftId);
  if (!draft) {
    throw new NotFoundError("Draft not found");
  }

  if (draft.owner_profile_id !== profile.id) {
    throw new ForbiddenError("You do not have permission to publish this draft");
  }

  // 3. Simple Moderation Check
  const finalTitle = title || draft.title || "";
  const contentToCheck = `${finalTitle} ${caption || ""} ${draft.prompt || ""}`;
  
  if (containsRestrictedContent(contentToCheck)) {
    throw new AppError("Content flagged by moderation filters. Publishing denied.", 400, "BAD_REQUEST");
  }

  // 4. Update the draft's title if a new one was provided
  if (title && title !== draft.title) {
    await draftRepo.updateTitle(draftId, title);
  }

  // 5. Create the post
  const post = await postRepo.create({
    authorProfileId: profile.id,
    generatedAssetId: draftId,
    caption,
    visibility: "public",
  });

  return post;
}

export async function getPost(id: string) {
  const post = await postRepo.findById(id);
  if (!post) {
    throw new NotFoundError("Post not found");
  }
  return post;
}

export async function listPosts(limit: number, cursor?: string, username?: string) {
  return postRepo.listPublic(limit, cursor, username);
}

export async function deletePost(clerkId: string, id: string) {
  const profile = await profileRepo.findByClerkId(clerkId);
  if (!profile) throw new ForbiddenError("Profile not found");

  const post = await postRepo.findById(id);
  if (!post) {
    throw new NotFoundError("Post not found");
  }

  if (post.author_profile_id !== profile.id) {
    throw new ForbiddenError("You do not have permission to delete this post");
  }

  await postRepo.deleteOwned(id, profile.id);
  return { success: true };
}
