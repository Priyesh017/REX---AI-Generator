// src/services/draft.service.ts
// Business logic for draft assets (studio workflow).

import * as profileRepo from "../repositories/profile.repository";
import * as draftRepo from "../repositories/draft.repository";
import { generateImageFromPrompt } from "../config/huggingface";
import { uploadImageToBucket } from "../lib/upload";
import { generateTitleFromPrompt } from "../lib/titleGenerator";
import {
  PaymentRequiredError,
  NotFoundError,
  ForbiddenError,
} from "../lib/errors";

export interface GenerateResult {
  asset: draftRepo.DraftAsset;
  creditsRemaining: number;
}

/**
 * Generate an image from a prompt and save as a private draft asset.
 */
export async function generateDraft(
  clerkId: string,
  prompt: string
): Promise<GenerateResult> {
  // 1. Parallelize initial setup (User resolution + Title generation)
  // We resolve the user first to ensure they exist and have credits before starting the expensive AI call.
  const [user, title] = await Promise.all([
    profileRepo.resolveOrProvisionUser(clerkId),
    Promise.resolve(generateTitleFromPrompt(prompt)),
  ]);

  if (user.credits < 1) {
    throw new PaymentRequiredError(
      "You have no credits remaining. Purchase more to continue generating."
    );
  }

  // 2. Core Generation (Sequential)
  // Image generation is the primary bottleneck; it must complete before we can upload.
  const imageBuffer = await generateImageFromPrompt(prompt);

  // 3. Storage Upload
  const imageUrl = await uploadImageToBucket(imageBuffer);

  // 4. Parallelize Completion Tasks
  // Persisting the record and deducting credits can happen simultaneously to shave off final ms.
  const [asset] = await Promise.all([
    draftRepo.create({
      profileId: user.id,
      title,
      prompt,
      imageUrl,
    }),
    profileRepo.decrementCredit(clerkId, user.credits),
  ]);

  const creditsRemaining = user.credits - 1;

  return { asset, creditsRemaining };
}

/**
 * List a user's draft assets (studio history).
 */
export async function listDrafts(
  clerkId: string,
  page: number,
  limit: number
) {
  return draftRepo.listByClerkId(clerkId, page, limit);
}

/**
 * Delete a draft asset — verifies ownership.
 */
export async function deleteDraft(
  clerkId: string,
  assetId: string
): Promise<void> {
  const profile = await profileRepo.findByClerkId(clerkId);
  if (!profile) throw new ForbiddenError("Profile not found");

  // Verify it exists and is owned by this user
  const asset = await draftRepo.findById(assetId);
  if (!asset) throw new NotFoundError("Draft asset not found");
  
  if (asset.owner_profile_id !== profile.id) {
    throw new ForbiddenError("You can only delete your own draft assets");
  }

  await draftRepo.deleteOwned(assetId, clerkId);
}
